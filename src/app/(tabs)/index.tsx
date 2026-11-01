import { useCallback, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Accordion } from "heroui-native/accordion";
import { Button } from "heroui-native/button";
import { Checkbox } from "heroui-native/checkbox";
import { Input } from "heroui-native/input";
import { Label } from "heroui-native/label";
import { Select } from "heroui-native/select";
import { Switch } from "heroui-native/switch";
import { Tabs } from "heroui-native/tabs";
import { TextField } from "heroui-native/text-field";
import { useToast } from "heroui-native/toast";
import { api, ApiError } from "@/lib/api";
import type { JobRequest, UploadPdfRequest } from "@/lib/types";

/**
 * Idiomas curados del backend (translate_novels core/config.py:
 * TRANSLATE_TARGET_LANGUAGES; SOURCE_LANGUAGES usa el mismo dict).
 */
const TRANSLATE_TARGETS: { code: string; label: string }[] = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "ru", label: "Русский" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "zh", label: "中文" },
];

const VOLUME_SIZES = ["50", "100", "150", "200"] as const;

/** Opciones en el formato SelectOption de heroui ({ value, label }). */
const TRANSLATE_OPTIONS = TRANSLATE_TARGETS.map((language) => ({
  value: language.code,
  label: language.label,
}));

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { toast } = useToast();

  const [source, setSource] = useState<"web" | "pdf">("web");

  // Formulario web
  const [url, setUrl] = useState("");
  const [translate, setTranslate] = useState(false);
  const [targetLang, setTargetLang] = useState("es");
  const [volume, setVolume] = useState("50");
  const [concurrency, setConcurrency] = useState("4");
  const [all, setAll] = useState(false);
  const [pending, setPending] = useState(false);
  const [force, setForce] = useState(false);
  const [playwright, setPlaywright] = useState(false);

  // Formulario PDF
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [pdfSourceLang, setPdfSourceLang] = useState("es");

  const [busy, setBusy] = useState(false);

  const langOption = TRANSLATE_OPTIONS.find((l) => l.value === targetLang) ?? TRANSLATE_OPTIONS[0];
  const pdfSourceOption =
    TRANSLATE_OPTIONS.find((l) => l.value === pdfSourceLang) ?? TRANSLATE_OPTIONS[0];
  const volumeOption = { value: volume, label: volume };

  const showApiError = useCallback((error: unknown) => {
    toast.show({
      variant: "danger",
      label: error instanceof ApiError ? error.message : "Error inesperado",
    });
  }, [toast]);

  const submitWeb = useCallback(async () => {
    setBusy(true);
    try {
      const request: JobRequest = {
        url: url.trim(),
        volume_size: Number(volume) as JobRequest["volume_size"],
        translate,
        target_language: translate ? targetLang : null,
        resume: true,
        force,
        all,
        translate_pending: pending,
        playwright,
        concurrency: Math.max(1, Number(concurrency) || 4),
      };
      const job = await api.createJob(request);
      toast.show({
        variant: "success",
        label: "Job creado (mock)",
        description: job.job_id,
      });
      setUrl("");
    } catch (error) {
      showApiError(error);
    } finally {
      setBusy(false);
    }
  }, [url, volume, translate, targetLang, all, pending, force, playwright, concurrency, showApiError, toast]);

  const pickPdf = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: false,
    });
    if (!result.canceled && result.assets[0]) {
      setPdfFile(result.assets[0].name);
    }
  }, []);

  const submitPdf = useCallback(async () => {
    if (pdfFile === null) {
      toast.show({ variant: "warning", label: "Selecciona un PDF primero" });
      return;
    }
    setBusy(true);
    try {
      const request: UploadPdfRequest = {
        filename: pdfFile,
        source_language: pdfSourceLang,
        translate,
        target_language: translate ? targetLang : null,
        volume_size: Number(volume) as UploadPdfRequest["volume_size"],
      };
      const job = await api.uploadPdf(request);
      toast.show({
        variant: "success",
        label: "Upload enviado (mock)",
        description: job.job_id,
      });
      setPdfFile(null);
    } catch (error) {
      showApiError(error);
    } finally {
      setBusy(false);
    }
  }, [pdfFile, pdfSourceLang, translate, targetLang, volume, showApiError, toast]);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-4 gap-4 pb-12"
      style={{ paddingTop: insets.top }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-0.5 pt-3">
        <Text className="text-2xl font-bold text-foreground">Nueva descarga</Text>
        <Text className="text-sm text-muted">
          Pega la URL de una web novel o sube un PDF. Los jobs son simulados en esta fase.
        </Text>
      </View>

      <Tabs value={source} onValueChange={(value) => setSource(value === "pdf" ? "pdf" : "web")}>
        <Tabs.List className="self-center">
          <Tabs.Trigger value="web">
            <Tabs.Label>Desde web</Tabs.Label>
          </Tabs.Trigger>
          <Tabs.Trigger value="pdf">
            <Tabs.Label>Desde PDF</Tabs.Label>
          </Tabs.Trigger>
        </Tabs.List>

        {/* Panel: Desde web */}
        <Tabs.Content value="web" className="gap-4 pt-4">
          <TextField>
            <Label>URL de la web novel</Label>
            <Input
              value={url}
              onChangeText={setUrl}
              placeholder="https://novelfire.net/..."
              autoCapitalize="none"
              autoCorrect={false}
              inputMode="url"
            />
          </TextField>

          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-foreground">Traducir</Text>
            <Switch isSelected={translate} onSelectedChange={setTranslate} />
          </View>

          {translate && (
            <View className="gap-1.5">
              <Text className="text-sm text-muted">Idioma de traducción</Text>
              <Select value={langOption} onValueChange={(option) => {
                if (!Array.isArray(option) && typeof option === "object" && option.value) setTargetLang(option.value);
              }}>
                <Select.Trigger>
                  <Select.Value placeholder="Idioma" />
                  <Select.TriggerIndicator />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Overlay />
                  <Select.Content presentation="popover" width="trigger">
                    <Select.ListLabel>Idioma de traducción</Select.ListLabel>
                    {TRANSLATE_TARGETS.map((language) => (
                      <Select.Item key={language.code} value={language.code} label={language.label} />
                    ))}
                  </Select.Content>
                </Select.Portal>
              </Select>
            </View>
          )}

          <Accordion selectionMode="single" variant="surface">
            <Accordion.Item value="advanced">
              <Accordion.Trigger className="py-2.5">
                <Text className="flex-1 text-sm font-medium text-foreground">
                  Opciones avanzadas
                </Text>
                <Accordion.Indicator />
              </Accordion.Trigger>
              <Accordion.Content className="gap-4 p-3">
                <View className="flex-row gap-3">
                  <View className="flex-1 gap-1.5">
                    <Text className="text-sm text-muted">Capítulos por tomo</Text>
                    <Select value={volumeOption} onValueChange={(option) => {
                      if (!Array.isArray(option) && typeof option === "object" && option.value) setVolume(option.value);
                    }}>
                      <Select.Trigger>
                        <Select.Value placeholder="Tomo" />
                        <Select.TriggerIndicator />
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Overlay />
                        <Select.Content presentation="popover" width="trigger">
                          {VOLUME_SIZES.map((size) => (
                            <Select.Item key={size} value={size} label={size} />
                          ))}
                        </Select.Content>
                      </Select.Portal>
                    </Select>
                  </View>
                  <View className="flex-1 gap-1.5">
                    <Text className="text-sm text-muted">Concurrencia descarga</Text>
                    <Input value={concurrency} onChangeText={setConcurrency} inputMode="numeric" keyboardType="number-pad" />
                  </View>
                </View>
                <View className="gap-3">
                  <View className="flex-row items-center gap-3">
                    <Checkbox isSelected={all} onSelectedChange={setAll}>
                      <Checkbox.Indicator />
                    </Checkbox>
                    <Text className="flex-1 text-sm text-foreground">Todos los capítulos</Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <Checkbox isSelected={pending} onSelectedChange={setPending}>
                      <Checkbox.Indicator />
                    </Checkbox>
                    <Text className="flex-1 text-sm text-foreground">Traducir pendientes</Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <Checkbox isSelected={force} onSelectedChange={setForce}>
                      <Checkbox.Indicator />
                    </Checkbox>
                    <Text className="flex-1 text-sm text-foreground">Forzar re-descarga</Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <Checkbox isSelected={playwright} onSelectedChange={setPlaywright}>
                      <Checkbox.Indicator />
                    </Checkbox>
                    <Text className="flex-1 text-sm text-foreground">Forzar Playwright</Text>
                  </View>
                </View>
              </Accordion.Content>
            </Accordion.Item>
          </Accordion>

          <Button size="lg" onPress={() => void submitWeb()} isDisabled={busy}>
            <Button.Label>{busy ? "Lanzando..." : "Lanzar descarga"}</Button.Label>
          </Button>
        </Tabs.Content>

        {/* Panel: Desde PDF */}
        <Tabs.Content value="pdf" className="gap-4 pt-4">
          {pdfFile ? (
            <View className="flex-row items-center gap-2 rounded-lg border border-separator bg-surface px-3 py-2">
              <Ionicons name="document-text-outline" size={18} color="#a1a1aa" />
              <Text numberOfLines={1} className="flex-1 text-sm text-foreground">
                {pdfFile}
              </Text>
              <Pressable onPress={() => setPdfFile(null)} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color="#a1a1aa" />
              </Pressable>
            </View>
          ) : (
            <Button variant="secondary" onPress={() => void pickPdf()}>
              <Button.Label>Elegir archivo PDF</Button.Label>
            </Button>
          )}
          <Text className="text-xs text-muted">
            Webnovel o light novel con ilustraciones. El EPUB original conserva el formato.
          </Text>

          <View className="flex-row gap-3">
            <View className="flex-1 gap-1.5">
              <Text className="text-sm text-muted">Idioma del PDF</Text>
              <Select value={pdfSourceOption} onValueChange={(option) => {
                if (!Array.isArray(option) && typeof option === "object" && option.value) setPdfSourceLang(option.value);
              }}>
                <Select.Trigger>
                  <Select.Value placeholder="Idioma" />
                  <Select.TriggerIndicator />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Overlay />
                  <Select.Content presentation="popover" width="trigger">
                    {TRANSLATE_TARGETS.map((language) => (
                      <Select.Item key={language.code} value={language.code} label={language.label} />
                    ))}
                  </Select.Content>
                </Select.Portal>
              </Select>
            </View>
            <View className="flex-1 gap-1.5">
              <Text className="text-sm text-muted">Capítulos por tomo</Text>
              <Select value={volumeOption} onValueChange={(option) => {
                if (!Array.isArray(option) && typeof option === "object" && option.value) setVolume(option.value);
              }}>
                <Select.Trigger>
                  <Select.Value placeholder="Tomo" />
                  <Select.TriggerIndicator />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Overlay />
                  <Select.Content presentation="popover" width="trigger">
                    {VOLUME_SIZES.map((size) => (
                      <Select.Item key={size} value={size} label={size} />
                    ))}
                  </Select.Content>
                </Select.Portal>
              </Select>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-foreground">Traducir</Text>
            <Switch isSelected={translate} onSelectedChange={setTranslate} />
          </View>
          {translate && (
            <View className="gap-1.5">
              <Text className="text-sm text-muted">Idioma de traducción</Text>
              <Select value={langOption} onValueChange={(option) => {
                if (!Array.isArray(option) && typeof option === "object" && option.value) setTargetLang(option.value);
              }}>
                <Select.Trigger>
                  <Select.Value placeholder="Idioma" />
                  <Select.TriggerIndicator />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Overlay />
                  <Select.Content presentation="popover" width="trigger">
                    {TRANSLATE_TARGETS.map((language) => (
                      <Select.Item key={language.code} value={language.code} label={language.label} />
                    ))}
                  </Select.Content>
                </Select.Portal>
              </Select>
            </View>
          )}

          <Button size="lg" onPress={() => void submitPdf()} isDisabled={busy}>
            <Button.Label>{busy ? "Subiendo..." : "Subir y convertir"}</Button.Label>
          </Button>
        </Tabs.Content>
      </Tabs>
    </ScrollView>
  );
}
