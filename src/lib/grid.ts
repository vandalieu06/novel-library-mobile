import type { GridDensitySetting } from "./settings";
import { RAIL_DP, RAIL_WIDTH } from "./layout";

/**
 * Densidad del grid de Biblioteca (specs 0.4.0-02 y 0.4.0-06).
 *
 * Recibe el ancho útil (ventana menos rail/panel). `auto` = 2 columnas en
 * móvil y 3 en tablet; el umbral es el ancho de contenido de un tablet
 * (768 - 88), no el ancho de ventana. Los overrides 2/4/8 se respetan, pero
 * con panel de detalle se capan a 4 para no dejar cards ilegibles.
 */
const TABLET_CONTENT_DP = RAIL_DP - RAIL_WIDTH;

export function resolveGridColumns(
  contentWidth: number,
  setting: GridDensitySetting,
  hasPanel = false,
): number {
  if (setting !== "auto") {
    const columns = Number(setting);
    return hasPanel ? Math.min(columns, 4) : columns;
  }
  return contentWidth >= TABLET_CONTENT_DP ? 3 : 2;
}
