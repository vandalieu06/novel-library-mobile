import { StyleSheet, useWindowDimensions } from "react-native";
import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useCSSVariable } from "uniwind";
import type { ComponentProps } from "react";
import { RAIL_DP, RAIL_WIDTH } from "@/lib/layout";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

/**
 * Tabs Biblioteca · Descargar · Ajustes (spec 0.4.0-02).
 *
 * - El orden manda: la app abre en Biblioteca; Descargar es la segunda tab.
 * - Android usa la tab bar Material de Expo Router; iOS la UIKit.
 * - Los colores se leen de los tokens resueltos (spec 0.4.0-01):
 *   active `accent-ink`, inactive `muted`, fondo `surface`, borde `outline`.
 */
export default function TabsLayout() {
  const active = useCSSVariable("--accent-ink") as string;
  const inactive = useCSSVariable("--muted") as string;
  const surface = useCSSVariable("--surface") as string;
  const border = useCSSVariable("--border") as string;
  const accentSoft = useCSSVariable("--accent-soft") as string;

  const { width, height } = useWindowDimensions();
  const isTablet = width >= RAIL_DP;

  const railWidth = RAIL_WIDTH;
  const railItemHeight = 60;
  const railItemGap = 12;
  const railItems = 3;
  const railGroupHeight =
    railItemHeight * railItems + railItemGap * (railItems - 1);
  const railPaddingTop = Math.max(
    0,
    (height - railGroupHeight) / 2 - railItemGap / 2,
  );

  const iconFor = (name: MaterialIconName) =>
    function TabIcon({ focused, size }: { focused: boolean; size: number }) {
      return (
        <MaterialIcons
          name={name}
          size={size}
          color={focused ? active : inactive}
        />
      );
    };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarPosition: isTablet ? "left" : "bottom",
        // El copied de bottom-tabs prohíbe 'material' en la franja inferior
        // (solo rail left/right); en móvil Android se usa el bar uikit con
        // iconos Material y colores de token. Anotado en 02.
        tabBarVariant: isTablet ? "material" : "uikit",
        tabBarLabelPosition: "below-icon",
        tabBarLabelStyle: {
          fontSize: 11,
          lineHeight: 14,
          fontWeight: "500",
          textAlign: "center",
        },
        // Con font scale 1.3/2.0 "Biblioteca" se truncaba en 80 dp; el
        // contenido sí respeta el tamaño de fuente del sistema.
        tabBarAllowFontScaling: false,
        tabBarActiveTintColor: active,
        tabBarInactiveTintColor: inactive,
        // En el rail, el activo es una píldora Material de toda la fila
        // (icono + label), accent-soft y radio 16. Con el padding del rail
        // anulado y 6 dp de margen ya no choca con el borde.
        tabBarActiveBackgroundColor: isTablet ? accentSoft : "transparent",
        tabBarInactiveBackgroundColor: "transparent",
        tabBarItemStyle: isTablet
          ? {
              height: railItemHeight,
              width: railWidth - 12,
              marginHorizontal: 6,
              paddingHorizontal: 0,
            }
          : undefined,
        tabBarStyle: isTablet
          ? {
              backgroundColor: surface,
              borderColor: border,
              borderTopWidth: 0,
              borderRightWidth: StyleSheet.hairlineWidth,
              // El rail de Expo Router añade paddingStart/End 12 por defecto;
              // con 88 de ancho dejaba 64 útiles y el item de 76 chocaba con el
              // borde derecho. Lo anulamos para que quepan 76 + 6 de margen.
              paddingStart: 0,
              paddingEnd: 0,
              paddingTop: railPaddingTop,
              width: railWidth,
              minWidth: railWidth,
              maxWidth: railWidth,
            }
          : {
              backgroundColor: surface,
              borderTopColor: border,
              borderTopWidth: StyleSheet.hairlineWidth,
            },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Biblioteca",
          tabBarIcon: iconFor("local-library"),
        }}
      />
      <Tabs.Screen
        name="download"
        options={{
          title: "Descargar",
          tabBarIcon: iconFor("add"),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ajustes",
          tabBarIcon: iconFor("settings"),
        }}
      />
    </Tabs>
  );
}
