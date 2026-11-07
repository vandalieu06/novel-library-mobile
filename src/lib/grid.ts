import type { GridDensitySetting } from "./settings";

/**
 * Densidad del grid de Biblioteca (spec 0.4.0-02).
 *
 * `auto` = 2 columnas en móvil y 3 en tablet (≥768). Los overrides manuales
 * 2/4/8 del ajuste se respetan tal cual.
 */
const TABLET_DP = 768;

export function resolveGridColumns(width: number, setting: GridDensitySetting): number {
  if (setting !== "auto") return Number(setting);
  return width >= TABLET_DP ? 3 : 2;
}
