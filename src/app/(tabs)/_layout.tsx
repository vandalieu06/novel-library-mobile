import { StyleSheet, useWindowDimensions } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/lib/theme";

/**
 * Tabs inferiores. Los colores se calculan con el tema resuelto de la app
 * (spec 0.3.0-01): antes `useColorScheme()` ignoraba el tema forzado en
 * Ajustes y dejaba la barra con el esquema del sistema.
 */
export default function TabsLayout() {
  const { isDark } = useAppTheme();
  const { width, height } = useWindowDimensions();
  // Tablet = rail lateral; móvil = barra inferior (spec 0.3.0-06).
  const isTablet = width >= 768;
  const railWidth = 96;
  // Altura real de un ítem del rail (medida en tablet) + separación entre
  // ítems. Sirve para centrar el grupo verticalmente en vez de dejarlo arriba.
  const railItemHeight = 58;
  const railItemGap = 12;
  const railItems = 3;
  const railGroupHeight =
    railItemHeight * railItems + railItemGap * (railItems - 1);
  const railPaddingTop = Math.max(
    0,
    (height - railGroupHeight) / 2 - railItemGap / 2,
  );

  const active = isDark ? "#f2777e" : "#bd4048";
  const inactive = isDark ? "#a1a1aa" : "#6b6b73";
  const background = isDark ? "#09090b" : "#f7f7f8";
  const border = isDark ? "#1f1f23" : "#e7e7ea";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarPosition: isTablet ? "left" : "bottom",
        tabBarVariant: isTablet ? "material" : "uikit",
        tabBarLabelPosition: "below-icon",
        tabBarActiveTintColor: active,
        tabBarInactiveTintColor: inactive,
        tabBarStyle: isTablet
          ? {
              backgroundColor: background,
              borderColor: border,
              borderTopWidth: 0,
              paddingTop: railPaddingTop,
              width: railWidth,
              minWidth: railWidth,
              maxWidth: railWidth,
            }
          : {
              backgroundColor: background,
              borderTopColor: border,
              borderTopWidth: StyleSheet.hairlineWidth,
            },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ focused, size }: { focused: boolean; size: number }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={focused ? active : inactive}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="books"
        options={{
          title: "Biblioteca",
          tabBarIcon: ({ focused, size }: { focused: boolean; size: number }) => (
            <Ionicons
              name={focused ? "library" : "library-outline"}
              size={size}
              color={focused ? active : inactive}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ajustes",
          tabBarIcon: ({ focused, size }: { focused: boolean; size: number }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={size}
              color={focused ? active : inactive}
            />
          ),
        }}
      />
    </Tabs>
  );
}
