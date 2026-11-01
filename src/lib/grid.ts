import type { GridDensitySetting } from "./settings";

/**
 * Densidad del grid de Biblioteca: auto por breakpoint (2 móvil portrait,
 * 4 tablet ≥768dp, 8 tablet XL ≥1200dp) o override manual del usuario (2/4/8).
 */
const TABLET_DP = 768;
const TABLET_XL_DP = 1200;

export const GRID_BREAKPOINTS = { tablet: TABLET_DP, tabletXl: TABLET_XL_DP } as const;

export function resolveGridColumns(
  width: number,
  setting: GridDensitySetting,
): 2 | 4 | 8 {
  if (setting !== "auto") return Number(setting) as 2 | 4 | 8;
  if (width >= TABLET_XL_DP) return 8;
  if (width >= TABLET_DP) return 4;
  return 2;
}
