import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Ajustes persistentes de la app (AsyncStorage).
 * La URL del servidor llega por Tailscale DNS o IP privada (motivo de ser de la app).
 */
export type ThemeSetting = "auto" | "light" | "dark";
export type GridDensitySetting = "auto" | "2" | "4" | "8";

/** Opciones del último job lanzado (se rehidratan en Inicio, spec 07). */
export interface LastJobOptions {
  translate: boolean;
  targetLanguage: string;
  volumeSize: string;
  concurrency: string;
  all: boolean;
  pending: boolean;
  force: boolean;
  playwright: boolean;
  pdfSourceLang: string;
}

export const DEFAULT_JOB_OPTIONS: LastJobOptions = {
  translate: false,
  targetLanguage: "es",
  volumeSize: "50",
  concurrency: "4",
  all: false,
  pending: false,
  force: false,
  playwright: false,
  pdfSourceLang: "es",
};

/** Último resultado de “Probar conexión” (spec 0.4.0-05). */
export interface LastConnection {
  ok: boolean;
  /** ISO-8601 del momento de la prueba. */
  at: string;
  /** URL probada; evita mostrar un estado de otra URL guardada. */
  url?: string;
}

export interface AppSettings {
  /** URL del backend novel-cli web; vacío = sin configurar (modo mock). */
  apiUrl: string;
  /** `NOVEL_WEB_TOKEN` del servidor; vacío = servidor sin auth. */
  webToken: string;
  theme: ThemeSetting;
  gridDensity: GridDensitySetting;
  lastConnection: LastConnection | null;
  /** `"original"` o un código de TRANSLATE_TARGETS (spec 0.4.0-08). */
  preferredLanguage: string;
  lastJobOptions: LastJobOptions;
}

export const DEFAULT_SETTINGS: AppSettings = {
  apiUrl: "",
  webToken: "",
  theme: "auto",
  gridDensity: "auto",
  lastConnection: null,
  preferredLanguage: "es",
  lastJobOptions: { ...DEFAULT_JOB_OPTIONS },
};

const STORAGE_KEY = "novel-library-mobile/settings";

export type SettingsListener = (settings: AppSettings) => void;

const listeners = new Set<SettingsListener>();

function emit(settings: AppSettings): void {
  listeners.forEach((listener) => listener(settings));
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(next: AppSettings): Promise<AppSettings> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emit(next);
  return next;
}

/** Actualización parcial (los Ajustes tocan un campo a la vez). */
export async function updateSettings(
  partial: Partial<AppSettings>,
): Promise<AppSettings> {
  const current = await loadSettings();
  return saveSettings({ ...current, ...partial });
}

export function onSettingsChange(listener: SettingsListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
