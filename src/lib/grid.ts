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
  fontScale = 1,
): number {
  // Con fuente grande, una densidad manual 4/8 deja los títulos ilegibles en
  // móvil. Se capa a 2 columnas en teléfono y 3 en tablet; sin panel se sigue
  // respetando el resto de la selección.
  const maxByFont =
    fontScale >= 1.5 ? (contentWidth >= TABLET_CONTENT_DP ? 3 : 2) : Infinity;

  if (setting !== "auto") {
    const columns = Math.min(Number(setting), maxByFont);
    return hasPanel ? Math.min(columns, 4) : columns;
  }
  return contentWidth >= TABLET_CONTENT_DP ? 3 : 2;
}
