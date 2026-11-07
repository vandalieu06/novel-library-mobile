import { StyleSheet, useWindowDimensions } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCSSVariable } from "uniwind";

/**
 * Tabs inferiores. Los colores se leen de los tokens resueltos (spec 0.4.0-01)
 * para que la barra siga el tema de la app y el accent-ink de texto.
 */
export default function TabsLayout() {
  const active = useCSSVariable("--accent-ink") as string;
  const inactive = useCSSVariable("--muted") as string;
  const background = useCSSVariable("--background") as string;
  const border = useCSSVariable("--border") as string;
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
