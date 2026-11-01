import { useCallback, useEffect, useState } from "react";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "heroui-native/button";
import { Input } from "heroui-native/input";
import { Label } from "heroui-native/label";
import { ListGroup } from "heroui-native/list-group";
import { Separator } from "heroui-native/separator";
import { Tabs } from "heroui-native/tabs";
import { TextField } from "heroui-native/text-field";
import { useToast } from "heroui-native/toast";
import { Uniwind } from "uniwind";
import { api, ApiError } from "@/lib/api";
import type { AppSettings, GridDensitySetting, ThemeSetting } from "@/lib/settings";
import { DEFAULT_SETTINGS, loadSettings, updateSettings } from "@/lib/settings";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

const THEME_TABS: { value: ThemeSetting; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
];

const DENSITY_TABS: { value: GridDensitySetting; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "2", label: "2" },
  { value: "4", label: "4" },
  { value: "8", label: "8" },
];

type ConnStatus = "idle" | "ok" | "error";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { toast } = useToast();

  const [settings, setSettings] = useState<AppSettings>({ ...DEFAULT_SETTINGS });
  const [urlDraft, setUrlDraft] = useState("");
  const [connStatus, setConnStatus] = useState<ConnStatus>("idle");
  const [connMsg, setConnMsg] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    let active = true;
    void loadSettings().then((loaded) => {
      if (!active) return;
      setSettings(loaded);
      setUrlDraft(loaded.apiUrl);
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

  const applyTheme = useCallback(
    (value: string) => {
      const theme: ThemeSetting =
        value === "light" || value === "dark" ? value : "auto";
      Uniwind.setTheme(theme === "auto" ? "system" : theme);
      void update({ theme });
    },
    [update],
  );

  const handleTest = useCallback(async () => {
    setTesting(true);
    const url = urlDraft.trim();
    try {
      await update({ apiUrl: url });
      await api.testConnection(url);
      setConnStatus("ok");
      setConnMsg("Conexión correcta (mock)");
      toast.show({
        variant: "success",
        label: "Conexión correcta (mock)",
        description: url === "" ? "URL vacía guardada" : url,
      });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Error inesperado";
      setConnStatus("error");
      setConnMsg(message);
    } finally {
      setTesting(false);
    }
  }, [urlDraft, update, toast]);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-4 gap-4 pb-12"
      style={{ paddingTop: insets.top }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-0.5 pt-3">
        <Text className="text-2xl font-bold text-foreground">Ajustes</Text>
        <Text className="text-sm text-muted">
          Servidor, apariencia y biblioteca. Todo persiste entre sesiones.
        </Text>
      </View>

      {/* Servidor */}
      <View className="gap-2">
        <Text className="text-sm font-semibold text-foreground">Servidor</Text>
        <View className="gap-1.5 rounded-xl border border-separator bg-surface p-3">
          <TextField>
            <Label>URL del backend (Tailscale DNS o IP)</Label>
            <Input
              value={urlDraft}
              onChangeText={setUrlDraft}
              placeholder="http://<tailscale-dns-o-ip>:8000"
              autoCapitalize="none"
              autoCorrect={false}
              inputMode="url"
            />
          </TextField>
          <View className="flex-row items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onPress={() => void handleTest()}
              isDisabled={testing}
            >
              <Button.Label>{testing ? "Probando..." : "Probar conexión"}</Button.Label>
            </Button>
            {connStatus === "ok" && (
              <Text className="flex-1 text-xs text-success">{connMsg}</Text>
            )}
            {connStatus === "error" && (
              <Text numberOfLines={2} className="flex-1 text-xs text-danger">
                {connMsg}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Apariencia */}
      <View className="gap-2">
        <Text className="text-sm font-semibold text-foreground">Apariencia</Text>
        <View className="rounded-xl border border-separator bg-surface p-3">
          <Text className="text-xs text-muted">Tema</Text>
          <Tabs
            value={settings.theme}
            onValueChange={(value) => applyTheme(String(value))}
            className="mt-2"
          >
            <Tabs.List className="self-center">
              {THEME_TABS.map((tab) => (
                <Tabs.Trigger key={tab.value} value={tab.value}>
                  <Tabs.Label>{tab.label}</Tabs.Label>
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </Tabs>
        </View>
      </View>

      {/* Biblioteca */}
      <View className="gap-2">
        <Text className="text-sm font-semibold text-foreground">Biblioteca</Text>
        <View className="rounded-xl border border-separator bg-surface p-3">
          <Text className="text-xs text-muted">Densidad del grid</Text>
          <Tabs
            value={settings.gridDensity}
            onValueChange={(value) =>
              void update({ gridDensity: value as GridDensitySetting })
            }
            className="mt-2"
          >
            <Tabs.List className="self-center">
              {DENSITY_TABS.map((tab) => (
                <Tabs.Trigger key={tab.value} value={tab.value}>
                  <Tabs.Label>{tab.label}</Tabs.Label>
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </Tabs>
        </View>
      </View>

      {/* App */}
      <View className="gap-2">
        <Text className="text-sm font-semibold text-foreground">Info de la app</Text>
        <View className="rounded-xl border border-separator bg-surface">
          <ListGroup className="bg-transparent">
            <ListGroup.Item>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Versión</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  Expo 58 · HeroUI Native + Uniwind
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <Text className="text-xs text-muted">{APP_VERSION}</Text>
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
            <Separator className="mx-4" />
            <ListGroup.Item onPress={() => router.push("/settings/statistics")}>
              <ListGroup.ItemPrefix>
                <Ionicons name="stats-chart-outline" size={20} color="#a1a1aa" />
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Estadísticas</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  La biblioteca de un vistazo
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <Ionicons name="chevron-forward" size={18} color="#a1a1aa" />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
            <Separator className="mx-4" />
            <ListGroup.Item onPress={() => router.push("/settings/about")}>
              <ListGroup.ItemPrefix>
                <Ionicons name="information-circle-outline" size={20} color="#a1a1aa" />
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Acerca de / Ayuda</ListGroup.ItemTitle>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <Ionicons name="chevron-forward" size={18} color="#a1a1aa" />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
          </ListGroup>
        </View>
      </View>
    </ScrollView>
  );
}
