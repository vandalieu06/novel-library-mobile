import { useCallback, useEffect, useState } from "react";
import Constants from "expo-constants";
import { ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Input } from "heroui-native/input";
import { Separator } from "heroui-native/separator";
import { TextField } from "heroui-native/text-field";
import { useToast } from "heroui-native/toast";
import { ApiError } from "@/lib/api";
import { resolveGridColumns } from "@/lib/grid";
import { HttpApiClient } from "@/lib/http-api-client";
import type {
  AppSettings,
  GridDensitySetting,
  ThemeSetting,
} from "@/lib/settings";
import { DEFAULT_SETTINGS, loadSettings, updateSettings } from "@/lib/settings";
import { ActionButton } from "@/components/action-button";
import { PAGE_CONTENT } from "@/lib/layout";
import { Screen } from "@/components/screen";
import { SegmentedField } from "@/components/segmented-field";
import { SettingsGroup } from "@/components/settings-group";
import { SettingsRow } from "@/components/settings-row";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

const THEME_OPTIONS: { value: ThemeSetting; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
];

const DENSITY_OPTIONS: { value: GridDensitySetting; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "2", label: "2" },
  { value: "4", label: "4" },
  { value: "8", label: "8" },
];

type ConnStatus = "idle" | "ok" | "error";

export default function SettingsScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const { width } = useWindowDimensions();

  const [settings, setSettings] = useState<AppSettings>({ ...DEFAULT_SETTINGS });
  const [urlDraft, setUrlDraft] = useState("");
  const [tokenDraft, setTokenDraft] = useState("");
  const [connStatus, setConnStatus] = useState<ConnStatus>("idle");
  const [connMsg, setConnMsg] = useState("");
  const [testing, setTesting] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    let active = true;
    void loadSettings().then((loaded) => {
      if (!active) return;
      setSettings(loaded);
      setUrlDraft(loaded.apiUrl);
      setTokenDraft(loaded.webToken);
    });
    return () => {
      active = false;
    };
  }, []);

  const update = useCallback(async (partial: Partial<AppSettings>) => {
    const next = await updateSettings(partial);
    setSettings(next);
    return next;
  }, []);

  // Guardado automático de URL y token mientras se escribe (spec 08 + 0.2.0-01)
  useEffect(() => {
    const url = urlDraft.trim();
    const token = tokenDraft.trim();
    if (url === settings.apiUrl && token === settings.webToken) return;
    const timer = setTimeout(() => {
      void update({ apiUrl: url, webToken: token }).then(() => {
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1500);
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [urlDraft, tokenDraft, settings.apiUrl, settings.webToken, update]);

  const applyTheme = useCallback(
    (value: string) => {
      const theme: ThemeSetting =
        value === "light" || value === "dark" ? value : "auto";
      void update({ theme });
    },
    [update],
  );

  const handleTest = useCallback(async () => {
    setTesting(true);
    const url = urlDraft.trim();
    const token = tokenDraft.trim();
    try {
      await update({ apiUrl: url, webToken: token });
      if (url === "") {
        throw new ApiError("Configura la URL del servidor", 0);
      }
      const client = new HttpApiClient({ baseUrl: url, token });
      await client.testConnection(url);
      setConnStatus("ok");
      setConnMsg("Conexión correcta");
      toast.show({
        variant: "success",
        label: "Conexión correcta",
        description: url,
      });
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Error inesperado";
      setConnStatus("error");
      setConnMsg(message);
    } finally {
      setTesting(false);
    }
  }, [urlDraft, tokenDraft, update, toast]);

  const columns = resolveGridColumns(width, settings.gridDensity);

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerClassName={`${PAGE_CONTENT} gap-6 px-4 pb-12 pt-3`}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View className="gap-1">
          <Text className="t-page text-foreground">Ajustes</Text>
          <Text className="t-body text-muted">
            Servidor, apariencia y biblioteca.
          </Text>
        </View>

        {/* Servidor */}
        <SettingsGroup
          title="Servidor"
          accessory={
            savedFlash ? (
              <Text className="t-meta text-success">Guardado</Text>
            ) : undefined
          }
        >
          <View className="gap-4 p-4">
            <TextField>
              <Text className="t-label text-muted">URL del backend</Text>
              <Input
                value={urlDraft}
                onChangeText={(value) => {
                  setUrlDraft(value);
                  if (connStatus !== "idle") {
                    setConnStatus("idle");
                    setConnMsg("");
                  }
                }}
                onEndEditing={() => {
                  void update({ apiUrl: urlDraft.trim() });
                }}
                placeholder="http://<tailscale-dns-o-ip>:8000"
                autoCapitalize="none"
                autoCorrect={false}
                inputMode="url"
                className="android:focus:border-foreground ios:focus:outline-foreground"
              />
              <Text className="t-meta text-muted">
                Vacía = modo demo. Con la URL de Tailscale se carga la
                biblioteca real.
              </Text>
            </TextField>

            <TextField>
              <Text className="t-label text-muted">Token (opcional)</Text>
              <Input
                value={tokenDraft}
                onChangeText={(value) => {
                  setTokenDraft(value);
                  if (connStatus !== "idle") {
                    setConnStatus("idle");
                    setConnMsg("");
                  }
                }}
                onEndEditing={() => {
                  void update({ webToken: tokenDraft.trim() });
                }}
                placeholder="NOVEL_WEB_TOKEN del servidor"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                className="android:focus:border-foreground ios:focus:outline-foreground"
              />
              <Text className="t-meta text-muted">
                Solo si el servidor lo pide (X-Auth-Token).
              </Text>
            </TextField>

            <View className="gap-2">
              <ActionButton
                size="sm"
                tone="secondary"
                onPress={() => void handleTest()}
                loading={testing}
                className="self-start"
              >
                Probar conexión
              </ActionButton>
              {connStatus !== "idle" && (
                <View className="flex-row items-center gap-1.5">
                  <View
                    className={`h-1.5 w-1.5 rounded-full ${
                      connStatus === "ok" ? "bg-success" : "bg-danger"
                    }`}
                  />
                  <Text
                    numberOfLines={2}
                    className={`t-meta flex-1 ${
                      connStatus === "ok" ? "text-success" : "text-danger"
                    }`}
                  >
                    {connMsg}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </SettingsGroup>

        {/* Apariencia */}
        <SettingsGroup title="Apariencia">
          <View className="p-4">
            <SegmentedField
              label="Tema"
              value={settings.theme}
              options={THEME_OPTIONS}
              onChange={applyTheme}
              caption="Auto sigue al sistema (claro/oscuro)."
            />
          </View>
        </SettingsGroup>

        {/* Biblioteca */}
        <SettingsGroup title="Biblioteca">
          <View className="gap-3 p-4">
            <SegmentedField
              label="Densidad del grid"
              value={settings.gridDensity}
              options={DENSITY_OPTIONS}
              onChange={(value) =>
                void update({ gridDensity: value as GridDensitySetting })
              }
            />
            <View className="flex-row items-center justify-between gap-3">
              <Text className="t-meta flex-1 text-muted">
                Ahora: {columns} columnas en este dispositivo.
              </Text>
              <View className="h-6 w-14 flex-row gap-0.5 rounded-md bg-surface-secondary p-1">
                {Array.from({ length: columns }).map((_, index) => (
                  <View
                    key={index}
                    className="flex-1 rounded-[1px] bg-muted/40"
                  />
                ))}
              </View>
            </View>
          </View>
          <Separator className="mx-4" />
          <SettingsRow
            title="Estadísticas"
            description="La biblioteca de un vistazo"
            onPress={() => router.push("/settings/statistics")}
          />
        </SettingsGroup>

        {/* App */}
        <SettingsGroup title="App">
          <SettingsRow
            title="Acerca de / Ayuda"
            onPress={() => router.push("/settings/about")}
          />
          <Separator className="mx-4" />
          <SettingsRow title="Versión">
            <Text className="t-meta text-muted">{APP_VERSION}</Text>
          </SettingsRow>
        </SettingsGroup>
      </ScrollView>
    </Screen>
  );
}
