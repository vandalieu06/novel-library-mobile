import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

/** Tokens del tema (DESIGN.md web): accent del tab activo, muted del inactivo. */
const ACTIVE = "#e0575f";
const INACTIVE = "#a1a1aa";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
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
              color={focused ? ACTIVE : INACTIVE}
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
              color={focused ? ACTIVE : INACTIVE}
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
              color={focused ? ACTIVE : INACTIVE}
            />
          ),
        }}
      />
    </Tabs>
  );
}
