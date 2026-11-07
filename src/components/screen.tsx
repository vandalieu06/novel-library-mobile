import type { ReactNode } from "react";
import { View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColor } from "heroui-native/hooks";

interface ScreenProps {
  children: ReactNode;
}

/**
 * Contenedor de pantalla para las pestañas.
 *
 * - `SafeAreaView` desplaza el contenido por debajo de la barra de estado.
 * - El scrim absoluto la pinta con el color del fondo: en Android con
 *   edge-to-edge el contenido desplazado se sigue dibujando bajo la barra
 *   (spec 0.3.0-01), así que el scrim lo tapa y la hora nunca se cruza con el
 *   texto. Los tokens son los de Material 3 desde la 0.4.0-01.
 */
export function Screen({ children }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const background = useThemeColor("background");

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        {children}
      </SafeAreaView>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: insets.top,
          backgroundColor: background,
          zIndex: 50,
        }}
      />
    </View>
  );
}
