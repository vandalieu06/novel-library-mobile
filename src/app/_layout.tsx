import "../../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { HeroUINativeProvider } from "heroui-native/provider";
import { useThemeColor } from "heroui-native/hooks";
import { ApiProvider } from "@/lib/api-provider";
import { ThemeProvider, useAppTheme } from "@/lib/theme";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <ApiProvider>
          <ThemeProvider>
            <RootNavigator />
          </ThemeProvider>
        </ApiProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Stack raíz. Vive dentro de `ThemeProvider` para que header y barra de estado
 * sigan el tema resuelto (ajuste del usuario o sistema), no solo el del
 * sistema (spec 0.3.0-01).
 */
function RootNavigator() {
  const { isDark } = useAppTheme();
  const background = useThemeColor("background");
  const foreground = useThemeColor("foreground");

  const headerTheme = {
    headerStyle: { backgroundColor: background },
    headerTintColor: foreground,
    headerShadowVisible: false,
  };

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
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
    </>
  );
}
