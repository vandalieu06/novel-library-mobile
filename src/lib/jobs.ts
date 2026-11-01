import { ApiError, type ApiClient } from "./api";
import type { JobInfo, JobState } from "./types";

const TERMINAL_STATES: JobState[] = ["done", "error", "cancelled"];

export interface PollJobOptions {
  /** Intervalo entre consultas (por defecto 2 s). */
  intervalMs?: number;
  /** Tiempo máximo de seguimiento (por defecto 10 min). */
  timeoutMs?: number;
  /** Aborta al desmontar la pantalla o al cancelar el job. */
  signal?: AbortSignal;
  /** Se llama en cada respuesta del backend. */
  onUpdate?: (job: JobInfo) => void;
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new ApiError("Sondeo cancelado", 0));
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(new ApiError("Sondeo cancelado", 0));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Sigue un job con polling hasta que termina (`done`/`error`/`cancelled`).
 * Sin WebSocket: el backend ya expone `GET /api/jobs/{id}`.
 */
export async function pollJob(
  api: ApiClient,
  jobId: string,
  options: PollJobOptions = {},
): Promise<JobInfo> {
  const {
    intervalMs = 2000,
    timeoutMs = 10 * 60 * 1000,
    signal,
    onUpdate,
  } = options;
  const startedAt = Date.now();

  for (;;) {
    if (signal?.aborted) throw new ApiError("Sondeo cancelado", 0);
    const job = await api.getJob(jobId);
    onUpdate?.(job);
    if (TERMINAL_STATES.includes(job.state)) return job;
    if (Date.now() - startedAt > timeoutMs) {
      throw new ApiError("El job tardó demasiado", 0);
    }
    await delay(intervalMs, signal);
  }
}
