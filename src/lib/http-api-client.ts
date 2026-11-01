import { ApiError, isHttpUrl, type ApiClient } from "./api";
import type { JobRequest, Novel, UploadPdfRequest } from "./types";

/** Sin respuesta en este tiempo = sin conexión (cubre servidores Tailscale caídos). */
const REQUEST_TIMEOUT_MS = 10_000;

export interface HttpApiClientOptions {
  baseUrl: string;
  token?: string;
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
    let detail = "";
    try {
      const body = (await response.json()) as { detail?: unknown };
      if (typeof body.detail === "string") detail = body.detail;
    } catch {
      // Respuesta sin cuerpo JSON (p. ej. proxy o error HTML).
    }
    if (detail === "" && response.status === 401) {
      detail = "Token inválido o no configurado";
    }
    return new ApiError(
      detail !== "" ? detail : `Error HTTP ${response.status}`,
      response.status,
    );
  }

  /** Petición binaria (EPUB/cover) con token y timeout. */
  private async fetchRaw(path: string, init: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
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

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await this.fetchRaw(path, init);
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
    if (request.uri === undefined || request.uri === "") {
      throw new ApiError("No se pudo leer el archivo seleccionado", 400);
    }
    const form = new FormData();
    // Forma aceptada por RN/Expo para adjuntar un archivo local a multipart.
    form.append("file", {
      uri: request.uri,
      name: request.filename,
      type: "application/pdf",
    } as unknown as Blob);
    form.append("source_language", request.source_language);
    form.append("translate", String(request.translate === true));
    if (request.target_language !== null && request.target_language !== undefined) {
      form.append("target_language", request.target_language);
    }
    if (request.volume_size !== null && request.volume_size !== undefined) {
      form.append("volume_size", String(request.volume_size));
    }
    return this.request<{ job_id: string }>("/api/upload", {
      method: "POST",
      body: form,
    });
  }

  async downloadEpub(slug: string, filename: string): Promise<{ ok: true }> {
    await this.fetchRaw(
      `/api/novels/${encodeURIComponent(slug)}/epub/${encodeURIComponent(filename)}`,
    );
    return { ok: true };
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
