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
