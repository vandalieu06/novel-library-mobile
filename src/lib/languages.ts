import type { Novel } from "./types";

/**
 * Idiomas curados del backend (translate_novels core/config.py:
 * TRANSLATE_TARGET_LANGUAGES; SOURCE_LANGUAGES usa el mismo dict).
 * Compartido por Inicio y las acciones del detalle (spec 0.2.0-04).
 */
export const TRANSLATE_TARGETS: { code: string; label: string }[] = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "ru", label: "Русский" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "zh", label: "中文" },
];

/** Opciones en el formato `SelectOption` de heroui ({ value, label }). */
export const TRANSLATE_OPTIONS = TRANSLATE_TARGETS.map((language) => ({
  value: language.code,
  label: language.label,
}));

/** Valor de `preferredLanguage` que significa “listar el original”. */
export const ORIGINAL_LANGUAGE = "original";

/** Versiones de tomos que puede listar el detalle (spec 0.4.0-08). */
export type VolumeList = "original" | "translated";

/** Etiqueta legible del ajuste “Idioma preferido”. */
export function preferredLanguageLabel(value: string): string {
  if (value === ORIGINAL_LANGUAGE) return "Original";
  return (
    TRANSLATE_TARGETS.find((language) => language.code === value)?.label ??
    value.toUpperCase()
  );
}

/** Opciones del sheet de idioma preferido: Original + idiomas curados. */
export function preferredLanguageOptions(): { value: string; label: string }[] {
  return [
    { value: ORIGINAL_LANGUAGE, label: "Original" },
    ...TRANSLATE_TARGETS.map((language) => ({
      value: language.code,
      label: language.label,
    })),
  ];
}

/**
 * Versión de tomos que debe abrir el detalle según el ajuste global. Si el
 * idioma preferido no está disponible, cae al original y, si no hay, a la
 * traducción.
 */
export function preferredVolumeList(
  novel: Novel,
  preferredLanguage: string,
): VolumeList {
  const hasOriginal = novel.epub_original.length > 0;
  const hasTranslated = novel.epub_translated.length > 0;

  if (
    preferredLanguage !== ORIGINAL_LANGUAGE &&
    preferredLanguage === novel.translated_language &&
    hasTranslated
  ) {
    return "translated";
  }
  if (hasOriginal) return "original";
  if (hasTranslated) return "translated";
  return "original";
}

/**
 * Opciones de la fila de pastillas. Devuelve `null` si solo hay una versión
 * (o ninguna): en ese caso el selector se oculta.
 */
export function volumeListOptions(
  novel: Novel,
): { value: VolumeList; label: string }[] | null {
  if (novel.epub_original.length === 0 || novel.epub_translated.length === 0) {
    return null;
  }
  return [
    { value: "original", label: "Original" },
    {
      value: "translated",
      label: novel.translated_language?.toUpperCase() ?? "Traducido",
    },
  ];
}

/** Tamaños de tomo aceptados por la API (POST jobs/upload/volume-size). */
export const VOLUME_SIZES = [50, 100, 150, 200] as const;

export interface VolumeSizeOption {
  value: string;
  label: string;
  /** `null` = sin división ("Todos"). */
  size: number | null;
}

/** Opciones del selector de tomos (Inicio) y del sheet del detalle. */
export function volumeSizeOptions(includeAll = false): VolumeSizeOption[] {
  const options: VolumeSizeOption[] = VOLUME_SIZES.map((size) => ({
    value: String(size),
    label: String(size),
    size,
  }));
  if (includeAll) {
    options.push({ value: "all", label: "Todos (sin dividir)", size: null });
  }
  return options;
}
