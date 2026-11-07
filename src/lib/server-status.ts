import type { AppSettings } from "@/lib/settings";

export type ServerTone = "muted" | "success" | "danger";

export interface ServerStatus {
  label: string;
  tone: ServerTone;
  description: string;
}

/**
 * Estado visible del servidor en el hub de Ajustes (spec 0.4.0-05):
 * demo (sin URL), configurado (sin prueba), conectado o sin conexión.
 * No inventa estados: se basa en `apiUrl` y en la última prueba real.
 */
export function serverStatus(settings: AppSettings): ServerStatus {
  const url = settings.apiUrl.trim();
  if (url === "") {
    return {
      label: "Modo demo",
      tone: "muted",
      description: "Sin servidor configurado",
    };
  }
  const last = settings.lastConnection;
  if (last === null || (last.url !== undefined && last.url !== url)) {
    return { label: "Configurado", tone: "muted", description: url };
  }
  return last.ok
    ? { label: "Conectado", tone: "success", description: url }
    : { label: "Sin conexión", tone: "danger", description: url };
}
