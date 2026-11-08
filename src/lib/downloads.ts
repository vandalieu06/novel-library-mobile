import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

const EPUB_MIME = "application/epub+zip";
const EPUB_UTI = "org.idpf.epub-container";

/** Evita que un nombre del servidor escape del directorio de la novela. */
export function sanitizeFilename(filename: string): string {
  const clean = filename
    .replace(/[/\\]/g, "_")
    .replace(/\.\./g, "_")
    .trim();
  return clean.length > 0 ? clean : "tomo.epub";
}

function epubsDirectory(slug: string): Directory {
  const directory = new Directory(Paths.document, "epubs", sanitizeFilename(slug));
  directory.create({ intermediates: true, idempotent: true });
  return directory;
}

/**
 * Borra la caché local de una novela (solo su carpeta) tras reparar/regenerar:
 * los EPUB antiguos ya no corresponden a los tomos del servidor. Es destructivo
 * y la UI avisa antes de re-descargar.
 */
export function clearEpubs(slug: string): void {
  const directory = new Directory(Paths.document, "epubs", sanitizeFilename(slug));
  if (directory.exists) directory.delete();
}

/** Escribe el tomo en Documentos y devuelve su URI local. */
export async function saveEpub(
  slug: string,
  filename: string,
  bytes: Uint8Array,
): Promise<string> {
  const file = new File(epubsDirectory(slug), sanitizeFilename(filename));
  await file.write(bytes);
  return file.uri;
}

/**
 * Abre el EPUB con el lector del sistema vía share sheet. Sin share sheet
 * disponible, cae al visor nativo (`File.preview`).
 */
export async function openEpub(uri: string, title: string): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: EPUB_MIME,
      UTI: EPUB_UTI,
      dialogTitle: title,
    });
    return;
  }
  const file = new File(uri);
  if (await File.canPreview(file)) {
    await File.preview(file, { title });
  }
}
