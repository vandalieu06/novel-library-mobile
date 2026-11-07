import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { Uniwind } from "uniwind";
import { useThemeColor } from "heroui-native/hooks";
import { useApi } from "@/lib/api-provider";

export type AppScheme = "light" | "dark";

interface ThemeContextValue {
  /** Esquema realmente aplicado (ajuste del usuario resuelto contra el sistema). */
  scheme: AppScheme;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isDarkColor(color: string): boolean {
  const match = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (match === null) return false;
  const value = Number.parseInt(match[1], 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return 0.299 * red + 0.587 * green + 0.114 * blue < 128;
}

/**
 * Resuelve el tema de la app y lo aplica a Uniwind (specs 0.3.0-01 y
 * 0.4.0-01).
 *
 * - `auto` delega en Uniwind (`setTheme("system")`), que sigue al sistema
 *   aunque el hook `useColorScheme` de RN no emita el cambio.
 * - El esquema real se lee del color de fondo ya resuelto (`useThemeColor`),
 *   así tab bar, headers y `StatusBar` siempre coinciden con lo que se pinta.
 *
 * Va dentro de `ApiProvider` porque necesita `settings`.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings } = useApi();
  const background = useThemeColor("background");

  useEffect(() => {
    Uniwind.setTheme(
      settings.theme === "auto" ? "system" : settings.theme,
    );
  }, [settings.theme]);

  const scheme: AppScheme = isDarkColor(background) ? "dark" : "light";

  const value = useMemo<ThemeContextValue>(
    () => ({ scheme, isDark: scheme === "dark" }),
    [scheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error("useAppTheme debe usarse dentro de <ThemeProvider>");
  }
  return context;
}
