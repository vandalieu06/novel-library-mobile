import "../../global.css";

import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { HeroUINativeProvider } from "heroui-native/provider";
import { useColorScheme } from "react-native";
import { ApiProvider } from "@/lib/api-provider";

export default function RootLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  // Tema del appbar nativo (las barras de navegador no heredan CSS vars).
  const headerTheme = {
    headerStyle: { backgroundColor: isDark ? "#121215" : "#ffffff" },
    headerTintColor: isDark ? "#fafafa" : "#18181b",
    headerShadowVisible: false,
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <ApiProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="novel/[slug]"
              options={{ headerShown: true, ...headerTheme }}
            />
            <Stack.Screen
              name="settings/statistics"
              options={{ headerShown: true, title: "Estadísticas", ...headerTheme }}
            />
            <Stack.Screen
              name="settings/about"
              options={{ headerShown: true, title: "Acerca de", ...headerTheme }}
            />
          </Stack>
        </ApiProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
