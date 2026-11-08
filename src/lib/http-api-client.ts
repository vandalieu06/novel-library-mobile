import { File, UploadType } from "expo-file-system";
import { fetch as expoFetch } from "expo/fetch";
import { ApiError, isHttpUrl, type ApiClient } from "./api";
import type {
  JobInfo,
  JobRequest,
  JobState,
  Novel,
  UploadPdfRequest,
  VolumeSizeResult,
} from "./types";

/** Sin respuesta en este tiempo = sin conexión (cubre servidores Tailscale caídos). */
const REQUEST_TIMEOUT_MS = 10_000;
/** Los EPUB y los PDF pueden tardar más que un JSON. */
const TRANSFER_TIMEOUT_MS = 120_000;

export interface HttpApiClientOptions {
  baseUrl: string;
  token?: string;
}

/** `detail` del backend: string (400/404) u objeto `{ message, job_id }` (409). */
function readDetail(detail: unknown): { message: string; jobId: string | null } {
  if (typeof detail === "string") return { message: detail, jobId: null };
  if (detail !== null && typeof detail === "object") {
    const object = detail as { message?: unknown; job_id?: unknown };
    return {
      message: typeof object.message === "string" ? object.message : "",
      jobId: typeof object.job_id === "string" ? object.job_id : null,
    };
  }
  return { message: "", jobId: null };
}

/** `http://host:8000/` → `http://host:8000` (las rutas ya empiezan por `/api`). */
function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/**
 * Cliente real de `novel-cli web`.
 *
 * Todo el contrato vive en `ApiClient`; aquí solo se resuelve transporte,
 * autenticación (`X-Auth-Token` si el servidor tiene `NOVEL_WEB_TOKEN`) y el
 * mapeo HTTP/red → `ApiError` con el `detail` del backend.
 */
export class HttpApiClient implements ApiClient {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor({ baseUrl, token = "" }: HttpApiClientOptions) {
    this.baseUrl = normalizeBaseUrl(baseUrl);
    this.token = token.trim();
  }

  private authHeaders(extra?: Record<string, string>): Record<string, string> {
    return {
      Accept: "application/json",
      ...(this.token !== "" ? { "X-Auth-Token": this.token } : {}),
      ...extra,
    };
  }

  private async toApiError(response: Response): Promise<ApiError> {
    let detail: unknown;
    try {
      const body = (await response.json()) as { detail?: unknown };
      detail = body.detail;
    } catch {
      // Respuesta sin cuerpo JSON (p. ej. proxy o error HTML).
    }

    // 0.3.1: `detail` puede ser un objeto `{ message, job_id }` (lock 409).
    const { message, jobId } = readDetail(detail);
    const text =
      message !== ""
        ? message
        : response.status === 401
          ? "Token inválido o no configurado"
          : `Error HTTP ${response.status}`;
    return new ApiError(text, response.status, { detail, jobId });
  }

  /** Petición binaria (EPUB/cover) con token y timeout. */
  private async fetchRaw(
    path: string,
    init: RequestInit = {},
    timeoutMs = REQUEST_TIMEOUT_MS,
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: this.authHeaders(init.headers as Record<string, string> | undefined),
        signal: controller.signal,
      });
      if (!response.ok) throw await this.toApiError(response);
      return response;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("Sin conexión con el servidor", 0);
    } finally {
      clearTimeout(timer);
    }
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
    timeoutMs = REQUEST_TIMEOUT_MS,
  ): Promise<T> {
    const response = await this.fetchRaw(path, init, timeoutMs);
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  private post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async getNovels(): Promise<Novel[]> {
    return this.request<Novel[]>("/api/novels");
  }

  async getNovel(slug: string): Promise<Novel> {
    return this.request<Novel>(`/api/novels/${encodeURIComponent(slug)}`);
  }

  async createJob(request: JobRequest): Promise<{ job_id: string }> {
    return this.post<{ job_id: string }>("/api/jobs", request);
  }

  async uploadPdf(request: UploadPdfRequest): Promise<{ job_id: string }> {
    const file = new File(request.uri);
    if (!file.exists) {
      throw new ApiError("El archivo ya no está disponible; vuelve a elegirlo", 400);
    }

    const form = new FormData();
    // `File` de expo-file-system implementa Blob: expo/fetch serializa el
    // multipart con nombre y MIME del archivo (API vigente de SDK 58).
    form.append("file", file);
    form.append("source_language", request.source_language);
    form.append("translate", String(request.translate === true));
    if (request.target_language !== null && request.target_language !== undefined) {
      form.append("target_language", request.target_language);
    }
    if (request.volume_size !== null && request.volume_size !== undefined) {
      form.append("volume_size", String(request.volume_size));
    }
    // El nombre real del archivo viaja aparte: la URI de caché es un UUID y el
    // backend lo usa como fallback de título/slug (spec 0.3.0-05).
    form.append("original_filename", request.filename);
    if (request.title !== null && request.title !== undefined && request.title !== "") {
      form.append("title", request.title);
    }
    if (request.author !== null && request.author !== undefined && request.author !== "") {
      form.append("author", request.author);
    }
    form.append("kind", request.kind ?? "auto");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TRANSFER_TIMEOUT_MS);
    try {
      const response = await expoFetch(`${this.baseUrl}/api/upload`, {
        method: "POST",
        headers: this.authHeaders(),
        body: form,
        signal: controller.signal,
      });
      // 422/5xx suelen ser fallos de parseo/carga del multipart: se reintenta
      // una vez con el upload nativo (ver `uploadWithTask`).
      if (response.status === 422 || response.status >= 500) {
        return await this.uploadWithTask(request);
      }
      if (!response.ok) throw await this.toApiError(response);
      return (await response.json()) as { job_id: string };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiError("Sin conexión con el servidor", 0);
      }
      // TypeError de multipart en RN: fallback nativo documentado.
      return this.uploadWithTask(request);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Fallback de subida con la tarea nativa de expo-file-system. Se usa solo si
   * `FormData` + `expo/fetch` falla; envía el mismo campo `file` y parámetros.
   */
  private async uploadWithTask(
    request: UploadPdfRequest,
  ): Promise<{ job_id: string }> {
    const parameters: Record<string, string> = {
      source_language: request.source_language,
      translate: String(request.translate === true),
    };
    if (request.target_language !== null && request.target_language !== undefined) {
      parameters.target_language = request.target_language;
    }
    if (request.volume_size !== null && request.volume_size !== undefined) {
      parameters.volume_size = String(request.volume_size);
    }
    parameters.original_filename = request.filename;
    if (request.title !== null && request.title !== undefined && request.title !== "") {
      parameters.title = request.title;
    }
    if (request.author !== null && request.author !== undefined && request.author !== "") {
      parameters.author = request.author;
    }
    parameters.kind = request.kind ?? "auto";
    const task = new File(request.uri).createUploadTask(
      `${this.baseUrl}/api/upload`,
      {
        uploadType: UploadType.MULTIPART,
        fieldName: "file",
        mimeType: "application/pdf",
        headers: this.authHeaders(),
        parameters,
      },
    );
    const result = await task.uploadAsync();
    if (result.status < 200 || result.status >= 300) {
      let detail: unknown;
      try {
        const body = JSON.parse(result.body) as { detail?: unknown };
        detail = body.detail;
      } catch {
        // Sin cuerpo JSON.
      }
      const parsed = readDetail(detail);
      throw new ApiError(
        parsed.message !== "" ? parsed.message : `Error HTTP ${result.status}`,
        result.status,
        { detail, jobId: parsed.jobId },
      );
    }
    return JSON.parse(result.body) as { job_id: string };
  }

  async downloadEpub(
    slug: string,
    filename: string,
  ): Promise<{ ok: true; bytes: Uint8Array | null }> {
    const response = await this.fetchRaw(
      `/api/novels/${encodeURIComponent(slug)}/epub/${encodeURIComponent(filename)}`,
      {},
      TRANSFER_TIMEOUT_MS,
    );
    return { ok: true, bytes: new Uint8Array(await response.arrayBuffer()) };
  }

  async getJob(jobId: string): Promise<JobInfo> {
    return this.request<JobInfo>(`/api/jobs/${encodeURIComponent(jobId)}`);
  }

  async cancelJob(
    jobId: string,
  ): Promise<{ cancelled: boolean; state?: JobState }> {
    return this.post<{ cancelled: boolean; state?: JobState }>(
      `/api/jobs/${encodeURIComponent(jobId)}/cancel`,
      {},
    );
  }

  async syncNovel(slug: string): Promise<{ job_id: string }> {
    return this.post<{ job_id: string }>(
      `/api/novels/${encodeURIComponent(slug)}/sync`,
      {},
    );
  }

  async retranslateNovel(
    slug: string,
    targetLanguage: string,
  ): Promise<{ job_id: string }> {
    return this.post<{ job_id: string }>(
      `/api/novels/${encodeURIComponent(slug)}/retranslate`,
      { target_language: targetLanguage },
    );
  }

  async changeVolumeSize(
    slug: string,
    volumeSize: number | null,
  ): Promise<VolumeSizeResult> {
    return this.post<VolumeSizeResult>(
      `/api/novels/${encodeURIComponent(slug)}/volume-size`,
      { volume_size: volumeSize },
    );
  }

  async testConnection(url: string): Promise<{ ok: true }> {
    if (!isHttpUrl(url)) throw new ApiError("URL inválida: debe ser http(s)", 400);
    const client = new HttpApiClient({ baseUrl: url, token: this.token });
    try {
      await client.getNovels();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw new ApiError("Token inválido o no configurado", 401);
      }
      throw error;
    }
    return { ok: true };
  }
}
