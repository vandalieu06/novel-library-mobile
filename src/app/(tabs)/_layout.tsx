import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";

/** Tokens del tema (DESIGN.md web). El restful lo pinta el bar de material
 * con colores planos: los fijamos por theme (los vars de tema no llegan al bar). */
const ACTIVE = "#e0575f";
const ACCENT_DARK = "#f2777e";
const INACTIVE = "#a1a1aa";

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const active = colorScheme === "dark" ? ACCENT_DARK : ACTIVE;
  const inactive = INACTIVE;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: active,
        tabBarInactiveTintColor: inactive,
        tabBarStyle: {
          backgroundColor: colorScheme === "dark" ? "#121215" : "#ffffff",
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
          title: "Books",
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
