import { mockNovels } from "./mock/data";
import type { JobRequest, Novel, UploadPdfRequest } from "./types";

/**
 * Errores del API con código HTTP (simulado en mock, real en fase 2).
 */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
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
  /** Descarga de un tomo (fase real: GET /api/novels/{slug}/epub/{filename}). */
  downloadEpub(slug: string, filename: string): Promise<{ ok: true }>;
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

export class MockApiClient implements ApiClient {
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
    return { job_id: mockJobId() };
  }

  async uploadPdf(request: UploadPdfRequest): Promise<{ job_id: string }> {
    if (!request.filename.toLowerCase().endsWith(".pdf")) {
      throw new ApiError("El archivo debe tener extensión .pdf");
    }
    if (!isVolumeSize(request.volume_size)) {
      throw new ApiError("volume_size solo acepta 50, 100, 150 o 200");
    }
    await simulatedLatency();
    return { job_id: mockJobId() };
  }

  async downloadEpub(_slug: string, _filename: string): Promise<{ ok: true }> {
    await simulatedDownload();
    return { ok: true };
  }

  async testConnection(url: string): Promise<{ ok: true }> {
    await simulatedLatency();
    if (!isHttpUrl(url)) throw new ApiError("URL inválida: debe ser http(s)");
    return { ok: true };
  }
}

/** Instancia única de la app. Fase 2: `api = new HttpApiClient(settings.apiUrl)`. */
export const api: ApiClient = new MockApiClient();
