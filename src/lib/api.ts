import { mockNovels } from "./mock/data";
import type {
  JobInfo,
  JobRequest,
  JobState,
  Novel,
  UploadPdfRequest,
  VolumeSizeResult,
} from "./types";

/**
 * Errores del API con código HTTP (simulado en mock, real en fase 2).
 */
export class ApiError extends Error {
  status: number;
  /** Cuerpo `detail` del backend, tal cual (string u objeto, contrato 0.3.1). */
  detail?: unknown;
  /** Job existente cuando el backend responde 409 por lock de novela. */
  jobId?: string | null;

  constructor(
    message: string,
    status = 400,
    options: { detail?: unknown; jobId?: string | null } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = options.detail;
    this.jobId = options.jobId ?? null;
  }
}

/**
 * Contrato único de datos para toda la app.
 *
 * Fase 1 (esta): `MockApiClient` — 100% offline, latencia simulada.
 * Fase 2 (futuro): `HttpApiClient` — mismo contrato, fetch contra `settings.apiUrl`
 * (Tailscale DNS o IP privada). Las pantallas no cambian, solo `api`.
 */
export interface ApiClient {
  getNovels(): Promise<Novel[]>;
  getNovel(slug: string): Promise<Novel>;
  createJob(request: JobRequest): Promise<{ job_id: string }>;
  uploadPdf(request: UploadPdfRequest): Promise<{ job_id: string }>;
  /** Descarga de un tomo real; `bytes` null en mock (no se escribe en disco). */
  downloadEpub(slug: string, filename: string): Promise<{ ok: true; bytes: Uint8Array | null }>;
  /** Estado de un job (polling de Inicio y acciones del detalle). */
  getJob(jobId: string): Promise<JobInfo>;
  /**
   * Pide la cancelación. El backend 0.3.1 puede responder `cancelling` (no
   * terminal); sin `state` (backend antiguo) se asume cancelado.
   */
  cancelJob(
    jobId: string,
  ): Promise<{ cancelled: boolean; state?: JobState }>;
  /** POST /api/novels/{slug}/sync → job. */
  syncNovel(slug: string): Promise<{ job_id: string }>;
  /** POST /api/novels/{slug}/retranslate → job. */
  retranslateNovel(slug: string, targetLanguage: string): Promise<{ job_id: string }>;
  /** POST /api/novels/{slug}/volume-size (síncrono). */
  changeVolumeSize(slug: string, volumeSize: number | null): Promise<VolumeSizeResult>;
  /** Mock puro en fase 1 (decisión del usuario): valida la URL, sin red. */
  testConnection(url: string): Promise<{ ok: true }>;
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Latencia simulada 200–400 ms (para ver skeletons de forma realista). */
const simulatedLatency = () => delay(200 + Math.random() * 200);

/** Descarga simulada más larga (tomos reales pesan). */
const simulatedDownload = () => delay(800 + Math.random() * 400);

function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export { isHttpUrl };

/** Requisito de la API real: volumen solo acepta 50, 100, 150 o 200. */
function isVolumeSize(value: number | null | undefined): boolean {
  return value === null || value === undefined || [50, 100, 150, 200].includes(value);
}

function mockJobId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Contrato 0.3.1 en modo demo:
 *
 * - Todo job pasa por `pending → running → done` para que la barra se vea.
 * - URL con `slow` (o `lento`) crea un job largo para probar `cancelling` y
 *   la reanudación; el resto termina en `done`.
 * - URL/slug con `409` fuerza el conflicto de lock (se registra el job
 *   existente y se devuelve `detail: { message, job_id }`).
 */
const MOCK_JOB_POLLS = 3;
const MOCK_SLOW_JOB_POLLS = 150;
const MOCK_CONFLICT_MESSAGE = "Ya hay un job en curso para esta novela";

function isSlowJob(value: string): boolean {
  return /slow|lento/i.test(value);
}

function forcesConflict(value: string): boolean {
  return /409/.test(value);
}

interface MockJobRecord {
  polls: number;
  totalPolls: number;
  state: JobState;
  slug: string | null;
}

export class MockApiClient implements ApiClient {
  /** Jobs simulados vivos (en memoria) para poder cancelar y sondear. */
  private readonly jobs = new Map<string, MockJobRecord>();

  private registerJob(source: string): string {
    const id = mockJobId();
    const slug = source.split("/").filter(Boolean).pop() ?? null;
    this.jobs.set(id, {
      polls: 0,
      totalPolls: isSlowJob(source) ? MOCK_SLOW_JOB_POLLS : MOCK_JOB_POLLS,
      state: "pending",
      slug,
    });
    return id;
  }

  private conflict(jobId: string): never {
    throw new ApiError(MOCK_CONFLICT_MESSAGE, 409, {
      detail: { message: MOCK_CONFLICT_MESSAGE, job_id: jobId },
      jobId,
    });
  }

  async getNovels(): Promise<Novel[]> {
    await simulatedLatency();
    return [...mockNovels];
  }

  async getNovel(slug: string): Promise<Novel> {
    await simulatedLatency();
    const novel = mockNovels.find((novela) => novela.slug === slug);
    if (!novel) throw new ApiError("Novela no encontrada", 404);
    return novel;
  }

  async createJob(request: JobRequest): Promise<{ job_id: string }> {
    if (!isHttpUrl(request.url)) throw new ApiError("URL inválida: debe ser http(s)");
    if (!isVolumeSize(request.volume_size)) {
      throw new ApiError("volume_size solo acepta 50, 100, 150 o 200");
    }
    await simulatedLatency();
    const jobId = this.registerJob(request.url);
    if (forcesConflict(request.url)) this.conflict(jobId);
    return { job_id: jobId };
  }

  async uploadPdf(request: UploadPdfRequest): Promise<{ job_id: string }> {
    if (!request.filename.toLowerCase().endsWith(".pdf")) {
      throw new ApiError("El archivo debe tener extensión .pdf");
    }
    if (!isVolumeSize(request.volume_size)) {
      throw new ApiError("volume_size solo acepta 50, 100, 150 o 200");
    }
    await simulatedLatency();
    const jobId = this.registerJob(request.filename);
    if (forcesConflict(request.filename)) this.conflict(jobId);
    return { job_id: jobId };
  }

  async downloadEpub(_slug: string, _filename: string): Promise<{ ok: true; bytes: Uint8Array | null }> {
    await simulatedDownload();
    return { ok: true, bytes: null };
  }

  async getJob(jobId: string): Promise<JobInfo> {
    await simulatedLatency();
    const record = this.jobs.get(jobId);
    if (!record) throw new ApiError("Job no encontrado", 404);

    // `cancelling` no es terminal: la siguiente consulta ya lo da por cancelado.
    if (record.state === "cancelling") record.state = "cancelled";
    else if (record.state === "pending" || record.state === "running") {
      record.polls += 1;
      record.state =
        record.polls >= record.totalPolls
          ? "done"
          : record.polls === 1
            ? "pending"
            : "running";
    }

    return {
      id: jobId,
      url: "",
      state: record.state,
      error: null,
      slug: record.slug,
      result: record.state === "done" ? { mock: true } : null,
    };
  }

  async cancelJob(jobId: string): Promise<{ cancelled: boolean; state?: JobState }> {
    await simulatedLatency();
    const record = this.jobs.get(jobId);
    if (
      !record ||
      record.state === "done" ||
      record.state === "error" ||
      record.state === "cancelled"
    ) {
      // Como el backend real: cancelar un job ya terminado responde 404.
      throw new ApiError("Job no encontrado", 404);
    }
    record.state = "cancelling";
    return { cancelled: true, state: "cancelling" };
  }

  async syncNovel(slug: string): Promise<{ job_id: string }> {
    await simulatedLatency();
    const jobId = this.registerJob(slug);
    if (forcesConflict(slug)) this.conflict(jobId);
    return { job_id: jobId };
  }

  async retranslateNovel(
    slug: string,
    targetLanguage: string,
  ): Promise<{ job_id: string }> {
    if (targetLanguage.trim() === "") {
      throw new ApiError("target_language no soportado", 400);
    }
    await simulatedLatency();
    const jobId = this.registerJob(slug);
    if (forcesConflict(slug)) this.conflict(jobId);
    return { job_id: jobId };
  }

  async changeVolumeSize(
    slug: string,
    volumeSize: number | null,
  ): Promise<VolumeSizeResult> {
    await simulatedLatency();
    if (volumeSize !== null && (!Number.isInteger(volumeSize) || volumeSize < 1)) {
      throw new ApiError("volume_size debe ser >= 1", 400);
    }
    const novel = mockNovels.find((item) => item.slug === slug);
    if (!novel) throw new ApiError("novela no encontrada", 404);
    return {
      ok: true,
      volume_size: volumeSize,
      epub_original: novel.epub_original,
      epub_translated: novel.epub_translated,
    };
  }

  async testConnection(url: string): Promise<{ ok: true }> {
    await simulatedLatency();
    if (!isHttpUrl(url)) throw new ApiError("URL inválida: debe ser http(s)");
    return { ok: true };
  }
}

