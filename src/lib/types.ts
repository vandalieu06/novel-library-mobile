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
  source_language: string;
  translate?: boolean;
  target_language?: string | null;
  volume_size?: number | null;
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
