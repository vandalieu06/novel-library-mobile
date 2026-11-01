import type { LibraryStats, Novel } from "./types";

/** Estadísticas derivadas de la biblioteca (mock o servidor real). */
export function libraryStats(novels: Novel[]): LibraryStats {
  return {
    novels: novels.length,
    epubs_original: novels.reduce((acc, n) => acc + n.epub_original.length, 0),
    epubs_translated: novels.reduce((acc, n) => acc + n.epub_translated.length, 0),
    epubs_total: novels.reduce(
      (acc, n) => acc + n.epub_original.length + n.epub_translated.length,
      0,
    ),
    novels_pdf: novels.filter((n) => n.source_pdf).length,
    novels_web: novels.filter((n) => !n.source_pdf).length,
    chapters_downloaded: novels.reduce((acc, n) => acc + n.chapters_downloaded, 0),
    chapters_translated: novels.reduce((acc, n) => acc + n.chapters_translated, 0),
  };
}
