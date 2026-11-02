import type { GridDensitySetting } from "./settings";

/**
 * Densidad del grid de Biblioteca: auto por breakpoint.
 *
 * 0.3.0 (spec 03): en móvil portrait son 2 columnas, no 3. Con 3 columnas a
 * 393 dp cada card mide ~118 dp y el título (2 líneas) se truncaba. Con 2, la
 * cover se lee y el título cabe. Los overrides manuales 2/4/8 no cambian.
 */
const PHONE_LANDSCAPE_DP = 600;
const TABLET_DP = 768;
const TABLET_XL_DP = 1200;

export const GRID_BREAKPOINTS = {
  phoneLandscape: PHONE_LANDSCAPE_DP,
  tablet: TABLET_DP,
  tabletXl: TABLET_XL_DP,
} as const;

export function resolveGridColumns(width: number, setting: GridDensitySetting): number {
  if (setting !== "auto") return Number(setting);
  if (width >= TABLET_XL_DP) return 8;
  if (width >= TABLET_DP) return 4;
  if (width >= PHONE_LANDSCAPE_DP) return 3;
  return 2;
}
