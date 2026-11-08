/**
 * Tipos espejo del contrato de `novel-cli web` (translate_novels/src/novel_cli/web/routes.py,
 * payload `_novel_payload`). Cambiar ahí = cambiar aquí.
 */

export interface Novel {
  slug: string;
  title: string;
  author: string | null;
  source_url: string;
  source_pdf: string | null;
  chapters_total: number;
  chapters_downloaded: number;
  chapters_translated: number;
  chapters_empty: number;
  chapters_empty_nums: number[];
  translated: boolean;
  translated_language: string | null;
  volume_size: number | null;
  /** En fase real: URL (`/api/novels/{slug}/cover`). En mock: null y se resuelve con `mockCovers`. */
  cover: string | null;
  epub_original: string[];
  epub_translated: string[];
  created_at: string | null;
  updated_at: string | null;
}

/** POST /api/jobs */
export interface JobRequest {
  url: string;
  volume_size?: number | null;
  translate?: boolean;
  target_language?: string | null;
  resume?: boolean;
  force?: boolean;
  all?: boolean;
  translate_pending?: boolean;
  translate_concurrency?: number | null;
  playwright?: boolean;
  concurrency?: number;
  refresh_toc?: boolean;
}

/** POST /api/upload (multipart) */
export interface UploadPdfRequest {
  filename: string;
  /** URI local del PDF elegido (multipart real). */
  uri: string;
  source_language: string;
  translate?: boolean;
  target_language?: string | null;
  volume_size?: number | null;
  /** Metadatos editables en la app; mandan sobre el nombre y el PDF. */
  title?: string | null;
  author?: string | null;
  /** Cómo interpretar el PDF en el backend. */
  kind?: "auto" | "book" | "webnovel";
}

/**
 * Estados de un job del backend (`JOB_*` en web/jobs.py, contrato 0.3.1).
 * `cancelling` no es terminal: el polling sigue hasta `cancelled`.
 */
export type JobState =
  | "pending"
  | "running"
  | "cancelling"
  | "done"
  | "error"
  | "cancelled";

/** GET /api/jobs/{id} */
export interface JobInfo {
  id: string;
  url: string;
  state: JobState;
  error: string | null;
  slug: string | null;
  result: Record<string, unknown> | null;
}

/** POST /api/novels/{slug}/volume-size (síncrono, sin job) */
export interface VolumeSizeResult {
  ok: boolean;
  volume_size: number | null;
  epub_original: string[];
  epub_translated: string[];
}

/** Estadísticas derivadas de la biblioteca (spec 04). */
export interface LibraryStats {
  novels: number;
  epubs_original: number;
  epubs_translated: number;
  epubs_total: number;
  novels_pdf: number;
  novels_web: number;
  chapters_downloaded: number;
  chapters_translated: number;
}

/** Un EPUB de la lista de tomos (spec 03: agrupado por rango de capítulos). */
export interface EpubVolume {
  filename: string;
  /** true = versión (ES) */
  translated: boolean;
}
