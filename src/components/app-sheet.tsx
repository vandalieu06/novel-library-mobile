import type { ComponentProps } from "react";
import { useWindowDimensions } from "react-native";
import { BottomSheet } from "heroui-native/bottom-sheet";

type BottomSheetContentProps = ComponentProps<typeof BottomSheet.Content>;

const TABLET_DP = 768;
const SHEET_MAX_WIDTH = 640;

/**
 * Contenido de bottom sheet con ancho adaptado (spec 0.4.0-11).
 *
 * - Móvil: ancho completo y solo las esquinas superiores redondeadas.
 * - Tablet: 640 dp máximo y centrado, anclado al borde inferior, con las
 *   esquinas superiores redondeadas. El padding interior no cambia.
 */
export function AppSheetContent({
  className,
  contentContainerClassName,
  containerStyle,
  style,
  children,
  ...props
}: BottomSheetContentProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_DP;
  const tabletSheetWidth = Math.min(SHEET_MAX_WIDTH, width - 32);
  const tabletSideMargin = Math.max(0, (width - tabletSheetWidth) / 2);

  return (
    <BottomSheet.Content
      {...props}
      containerStyle={containerStyle}
      style={
        isTablet
          ? {
              width: tabletSheetWidth,
              marginHorizontal: tabletSideMargin,
            }
          : style
      }
      className={`rounded-t-3xl ${className ?? ""}`}
      contentContainerClassName={contentContainerClassName}
    >
      {children}
    </BottomSheet.Content>
  );
}
