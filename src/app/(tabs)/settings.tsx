import { useCallback, useState } from "react";
import Constants from "expo-constants";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { ScrollView, Text, View, useWindowDimensions } from "react-native";
import { BottomSheet } from "heroui-native/bottom-sheet";
import { useThemeColor } from "heroui-native/hooks";
import { useApi } from "@/lib/api-provider";
import { PAGE_CONTENT, PANEL_WIDTH, SPLIT_DP } from "@/lib/layout";
import { preferredLanguageLabel } from "@/lib/languages";
import { serverStatus } from "@/lib/server-status";
import type {
  AppSettings,
  GridDensitySetting,
  ThemeSetting,
} from "@/lib/settings";
import { updateSettings } from "@/lib/settings";
import { AppBar } from "@/components/app-bar";
import { ListRow, StatusDot } from "@/components/list-card";
import { Screen } from "@/components/screen";
import { SettingsGroup } from "@/components/settings-group";
import { LanguageSheet } from "@/components/settings/language-sheet";
import { OptionSheet } from "@/components/settings/option-sheet";
import { ServerForm } from "@/components/settings/server-form";
import type { SegmentedOption } from "@/components/segmented-field";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

const THEME_OPTIONS: (SegmentedOption & { value: ThemeSetting })[] = [
  { value: "auto", label: "Auto" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
];

const DENSITY_OPTIONS: (SegmentedOption & { value: GridDensitySetting })[] = [
  { value: "auto", label: "Auto" },
  { value: "2", label: "2" },
  { value: "4", label: "4" },
  { value: "8", label: "8" },
];

const THEME_LABELS: Record<ThemeSetting, string> = {
  auto: "Auto",
  light: "Claro",
  dark: "Oscuro",
};

function densityLabel(value: GridDensitySetting): string {
  return value === "auto" ? "Automática" : `${value} columnas`;
}

type LibraryState =
  | { kind: "loading" }
  | { kind: "ready"; novels: number; epubs: number }
  | { kind: "error" };

export default function SettingsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { api, settings } = useApi();
  const muted = useThemeColor("muted");
  const hasPanel = width >= SPLIT_DP;

  const [serverOpen, setServerOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [densityOpen, setDensityOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [library, setLibrary] = useState<LibraryState>({ kind: "loading" });

  const loadLibrary = useCallback(async () => {
    setLibrary({ kind: "loading" });
    try {
      const novels = await api.getNovels();
      const epubs = novels.reduce(
        (total, novel) =>
          total + novel.epub_original.length + novel.epub_translated.length,
        0,
      );
      setLibrary({ kind: "ready", novels: novels.length, epubs });
    } catch {
      // El hub no bloquea: si falla, la fila lo dice.
      setLibrary({ kind: "error" });
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      void loadLibrary();
    }, [loadLibrary]),
  );

  const update = useCallback(async (partial: Partial<AppSettings>) => {
    await updateSettings(partial);
  }, []);

  const applyTheme = useCallback(
    (value: string) => {
      const theme: ThemeSetting =
        value === "light" || value === "dark" ? value : "auto";
      void update({ theme });
    },
    [update],
  );

  const applyDensity = useCallback(
    (value: string) => {
      const density: GridDensitySetting =
        value === "2" || value === "4" || value === "8" ? value : "auto";
      void update({ gridDensity: density });
    },
    [update],
  );

  const status = serverStatus(settings);
  const statusClass =
    status.tone === "success"
      ? "text-success"
      : status.tone === "danger"
        ? "text-danger"
        : "text-muted";
  const libraryText =
    library.kind === "loading"
      ? "Cargando…"
      : library.kind === "error"
        ? "No se pudo cargar"
        : `${library.novels} novelas · ${library.epubs} tomos`;

  return (
    <Screen>
      <View className="flex-1 flex-row">
        <View className="flex-1">
          <AppBar title="Ajustes" />
          <ScrollView
            className="flex-1"
            contentContainerClassName={`${PAGE_CONTENT} gap-6 px-4 pb-12 pt-3`}
          >
            <SettingsGroup title="Estado">
              <ListRow
                title="Servidor"
                description={status.description}
                onPress={hasPanel ? undefined : () => setServerOpen(true)}
                accessibilityLabel="Configurar servidor"
                className={hasPanel ? "bg-accent-soft" : undefined}
                accessory={
                  <View className="flex-row items-center gap-1.5">
                    <StatusDot tone={status.tone} />
                    <Text className={`t-label ${statusClass}`}>
                      {status.label}
                    </Text>
                    {!hasPanel && (
                      <MaterialIcons
                        name="chevron-right"
                        size={20}
                        color={muted}
                      />
                    )}
                  </View>
                }
              />
              <ListRow title="Biblioteca" description={libraryText} />
            </SettingsGroup>

        <SettingsGroup title="Preferencias">
          <ListRow
            title="Tema"
            value={THEME_LABELS[settings.theme]}
            onPress={() => setThemeOpen(true)}
            showChevron
          />
          <ListRow
            title="Densidad de la rejilla"
            value={densityLabel(settings.gridDensity)}
            onPress={() => setDensityOpen(true)}
            showChevron
          />
          <ListRow
            title="Idioma preferido"
            value={preferredLanguageLabel(settings.preferredLanguage)}
            onPress={() => setLanguageOpen(true)}
            showChevron
          />
        </SettingsGroup>

        <SettingsGroup title="Biblioteca">
          <ListRow
            title="Estadísticas"
            description="La biblioteca de un vistazo"
            onPress={() => router.push("/settings/statistics")}
            showChevron
          />
        </SettingsGroup>

        <SettingsGroup title="App">
          <ListRow
            title="Acerca de / Ayuda"
            onPress={() => router.push("/settings/about")}
            showChevron
          />
          <ListRow title="Versión" value={APP_VERSION} />
        </SettingsGroup>

        <Text className="t-meta text-center text-muted">
          novel-library-mobile · uso privado
        </Text>
          </ScrollView>
        </View>

        {hasPanel && (
          <View
            className="border-l border-border bg-background"
            style={{ width: PANEL_WIDTH }}
          >
            <ScrollView
              className="flex-1"
              contentContainerClassName="px-5 pb-10 pt-5"
              keyboardShouldPersistTaps="handled"
            >
              <ServerForm
                key={`${settings.apiUrl}|${settings.webToken}`}
                settings={settings}
                onSaved={() => undefined}
              />
            </ScrollView>
          </View>
        )}
      </View>

      <BottomSheet isOpen={serverOpen} onOpenChange={setServerOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content
            className="rounded-t-3xl"
            contentContainerClassName="px-5 pb-10 pt-5"
          >
            <ServerForm
              key={`${settings.apiUrl}|${settings.webToken}`}
              settings={settings}
              onSaved={() => setServerOpen(false)}
            />
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      <OptionSheet
        isOpen={themeOpen}
        onOpenChange={setThemeOpen}
        title="Tema"
        value={settings.theme}
        options={THEME_OPTIONS}
        onChange={applyTheme}
        caption="Auto sigue al sistema (claro/oscuro)."
      />

      <OptionSheet
        isOpen={densityOpen}
        onOpenChange={setDensityOpen}
        title="Densidad de la rejilla"
        value={settings.gridDensity}
        options={DENSITY_OPTIONS}
        onChange={applyDensity}
        caption="Auto usa 2 columnas en móvil y 3 en tablet."
      />

      <LanguageSheet
        isOpen={languageOpen}
        onOpenChange={setLanguageOpen}
        value={settings.preferredLanguage}
        onChange={(value) => void update({ preferredLanguage: value })}
      />
    </Screen>
  );
}
