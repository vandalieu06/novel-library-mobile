import { coverSource } from "./mock/data";
import type { AppSettings } from "./settings";
import type { Novel } from "./types";

/** Asset local (mock) o URI remota con headers (API real). */
export type CoverSource =
  | number
  | { uri: string; headers?: Record<string, string> }
  | null;

/**
 * Cover de una novela según el modo activo:
 * - URL vacía → assets del mock (`coverSource`).
 * - API real → `apiUrl + novel.cover`, con `X-Auth-Token` si está configurado
 *   (`expo-image` envía los headers de la fuente).
 */
export function resolveCover(novel: Novel, settings: AppSettings): CoverSource {
  const baseUrl = settings.apiUrl.trim().replace(/\/+$/, "");
  if (baseUrl === "") return coverSource(novel.slug);
  if (novel.cover === null || novel.cover === "") return null;
  const token = settings.webToken.trim();
  return {
    uri: `${baseUrl}${novel.cover}`,
    headers: token !== "" ? { "X-Auth-Token": token } : undefined,
  };
}
