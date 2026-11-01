import { useCallback, useEffect, useRef, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Accordion } from "heroui-native/accordion";
import { Button } from "heroui-native/button";
import { Checkbox } from "heroui-native/checkbox";
import { FieldError } from "heroui-native/field-error";
import { Input } from "heroui-native/input";
import { Label } from "heroui-native/label";
import { Select } from "heroui-native/select";
import { Spinner } from "heroui-native/spinner";
import { Switch } from "heroui-native/switch";
import { Tabs } from "heroui-native/tabs";
import { TextField } from "heroui-native/text-field";
import { useToast } from "heroui-native/toast";
import { ApiError, isHttpUrl } from "@/lib/api";
import { useApi } from "@/lib/api-provider";
import { pollJob } from "@/lib/jobs";
import {
  TRANSLATE_OPTIONS,
  TRANSLATE_TARGETS,
  VOLUME_SIZES,
} from "@/lib/languages";
import type { LastJobOptions } from "@/lib/settings";
import { loadSettings, updateSettings } from "@/lib/settings";
import type {
  JobRequest,
  JobState,
  UploadPdfRequest,
} from "@/lib/types";

const VOLUME_OPTIONS = VOLUME_SIZES.map((size) => ({
  value: String(size),
  label: String(size),
}));

interface ActiveJob {
  id: string;
  source: "web" | "pdf";
  state: JobState;
  error: string | null;
}

const JOB_LABELS: Record<JobState, string> = {
  pending: "En cola",
  running: "Trabajando…",
  done: "Listo",
  error: "Error",
  cancelled: "Cancelado",
};

function isActiveState(state: JobState): boolean {
  return state === "pending" || state === "running";
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const { api } = useApi();

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
  const [pdfFile, setPdfFile] = useState<{
    uri: string;
    name: string;
    size: number | null;
  } | null>(null);
  const [pdfSourceLang, setPdfSourceLang] = useState("es");

  const [busy, setBusy] = useState(false);
  const [activeJob, setActiveJob] = useState<ActiveJob | null>(null);
  const pollAbort = useRef<AbortController | null>(null);

  // Al desmontar, corta el polling en curso.
  useEffect(() => () => pollAbort.current?.abort(), []);

  // Rehidrata las opciones del último job (spec 07)
  useEffect(() => {
    let active = true;
    void loadSettings().then((loaded) => {
      if (!active) return;
      const last = loaded.lastJobOptions;
      setTranslate(last.translate);
      setTargetLang(last.targetLanguage);
      setVolume(last.volumeSize);
      setConcurrency(last.concurrency);
      setAll(last.all);
      setPending(last.pending);
      setForce(last.force);
      setPlaywright(last.playwright);
      setPdfSourceLang(last.pdfSourceLang);
    });
    return () => {
      active = false;
    };
  }, []);

  const currentJobOptions = useCallback(
    (): LastJobOptions => ({
      translate,
      targetLanguage: targetLang,
      volumeSize: volume,
      concurrency,
      all,
      pending,
      force,
      playwright,
      pdfSourceLang,
    }),
    [translate, targetLang, volume, concurrency, all, pending, force, playwright, pdfSourceLang],
  );

  const urlValid = isHttpUrl(url.trim());
  const showUrlError = url.trim().length > 0 && !urlValid;
  const advancedCount = [
    volume !== "50",
    concurrency !== "4",
    all,
    pending,
    force,
    playwright,
  ].filter(Boolean).length;

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

  /** Sigue el job creado y refleja su estado en la tarjeta inline. */
  const trackJob = useCallback(
    async (jobId: string, source: "web" | "pdf") => {
      pollAbort.current?.abort();
      const controller = new AbortController();
      pollAbort.current = controller;
      setActiveJob({ id: jobId, source, state: "pending", error: null });
      try {
        const job = await pollJob(api, jobId, {
          signal: controller.signal,
          onUpdate: (update) =>
            setActiveJob({
              id: jobId,
              source,
              state: update.state,
              error: update.error,
            }),
        });
        if (job.state === "done") {
          toast.show({
            variant: "success",
            label: "Job completado",
            description: job.slug ?? job.id,
          });
        } else if (job.state === "error") {
          toast.show({
            variant: "danger",
            label: "El job falló",
            description: job.error ?? undefined,
          });
        }
      } catch (caught) {
        if (controller.signal.aborted) return;
        const message =
          caught instanceof ApiError ? caught.message : "Error inesperado";
        setActiveJob({ id: jobId, source, state: "error", error: message });
        toast.show({
          variant: "danger",
          label: "Seguimiento del job fallido",
          description: message,
        });
      } finally {
        if (pollAbort.current === controller) pollAbort.current = null;
      }
    },
    [api, toast],
  );

  const cancelActiveJob = useCallback(async () => {
    if (activeJob === null || !isActiveState(activeJob.state)) return;
    try {
      await api.cancelJob(activeJob.id);
      pollAbort.current?.abort();
      setActiveJob({ ...activeJob, state: "cancelled" });
      toast.show({
        variant: "warning",
        label: "Job cancelado",
        description: activeJob.id,
      });
    } catch (caught) {
      showApiError(caught);
    }
  }, [activeJob, api, toast, showApiError]);

  const submitWeb = useCallback(async () => {
    if (activeJob !== null && isActiveState(activeJob.state)) {
      toast.show({
        variant: "warning",
        label: "Espera al job en curso",
        description: "Cancélalo o espera a que termine.",
      });
      return;
    }
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
        label: "Job creado",
        description: job.job_id,
      });
      void updateSettings({ lastJobOptions: currentJobOptions() });
      setUrl("");
      void trackJob(job.job_id, "web");
    } catch (error) {
      showApiError(error);
    } finally {
      setBusy(false);
    }
  }, [url, volume, translate, targetLang, all, pending, force, playwright, concurrency, currentJobOptions, showApiError, toast, api, activeJob, trackJob]);

  const pickPdf = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      // Necesario para leer el archivo con expo-file-system y subirlo.
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPdfFile({
        uri: asset.uri,
        name: asset.name,
        size: asset.size ?? null,
      });
    }
  }, []);

  const submitPdf = useCallback(async () => {
    if (pdfFile === null) {
      toast.show({ variant: "warning", label: "Selecciona un PDF primero" });
      return;
    }
    if (activeJob !== null && isActiveState(activeJob.state)) {
      toast.show({
        variant: "warning",
        label: "Espera al job en curso",
        description: "Cancélalo o espera a que termine.",
      });
      return;
    }
    setBusy(true);
    try {
      const request: UploadPdfRequest = {
        filename: pdfFile.name,
        uri: pdfFile.uri,
        source_language: pdfSourceLang,
        translate,
        target_language: translate ? targetLang : null,
        volume_size: Number(volume) as UploadPdfRequest["volume_size"],
      };
      const job = await api.uploadPdf(request);
      toast.show({
        variant: "success",
        label: "PDF enviado",
        description: job.job_id,
      });
      void updateSettings({ lastJobOptions: currentJobOptions() });
      setPdfFile(null);
      void trackJob(job.job_id, "pdf");
    } catch (error) {
      showApiError(error);
    } finally {
      setBusy(false);
    }
  }, [pdfFile, pdfSourceLang, translate, targetLang, volume, currentJobOptions, showApiError, toast, api, activeJob, trackJob]);

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
          Pega la URL de una web novel o sube un PDF. El estado del job se sigue
          aquí mismo.
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
          <TextField isInvalid={showUrlError}>
            <Label>URL de la web novel</Label>
            <Input
              value={url}
              onChangeText={setUrl}
              placeholder="https://novelfire.net/..."
              autoCapitalize="none"
              autoCorrect={false}
              inputMode="url"
            />
            {showUrlError && (
              <FieldError>Debe empezar por http:// o https://</FieldError>
            )}
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
                  Opciones avanzadas{advancedCount > 0 ? ` · ${advancedCount}` : ""}
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
                          {VOLUME_OPTIONS.map((option) => (
                            <Select.Item
                              key={option.value}
                              value={option.value}
                              label={option.label}
                            />
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

          <Button size="lg" onPress={() => void submitWeb()} isDisabled={busy || !urlValid}>
            <Button.Label>{busy ? "Lanzando..." : "Lanzar descarga"}</Button.Label>
          </Button>
        </Tabs.Content>

        {/* Panel: Desde PDF */}
        <Tabs.Content value="pdf" className="gap-4 pt-4">
          {pdfFile ? (
            <View className="flex-row items-center gap-2 rounded-lg border border-separator bg-surface px-3 py-2">
              <Ionicons name="document-text-outline" size={18} color="#a1a1aa" />
              <View className="flex-1">
                <Text numberOfLines={1} className="text-sm text-foreground">
                  {pdfFile.name}
                </Text>
                {pdfFile.size !== null && (
                  <Text className="text-xs text-muted">
                    {(pdfFile.size / (1024 * 1024)).toFixed(1)} MB
                  </Text>
                )}
              </View>
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
                    {VOLUME_OPTIONS.map((option) => (
                      <Select.Item
                        key={option.value}
                        value={option.value}
                        label={option.label}
                      />
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

      {activeJob !== null && (
        <View className="gap-1.5 rounded-xl border border-separator bg-surface p-3">
          <View className="flex-row items-center gap-2">
            {isActiveState(activeJob.state) ? (
              <Spinner size="sm" />
            ) : (
              <Ionicons
                name={
                  activeJob.state === "done"
                    ? "checkmark-circle"
                    : activeJob.state === "error"
                      ? "alert-circle"
                      : "close-circle"
                }
                size={18}
                color={
                  activeJob.state === "done"
                    ? "#16a34a"
                    : activeJob.state === "error"
                      ? "#dc2626"
                      : "#a1a1aa"
                }
              />
            )}
            <Text className="flex-1 text-sm font-semibold text-foreground">
              {JOB_LABELS[activeJob.state]} ·{" "}
              {activeJob.source === "web" ? "descarga" : "PDF"}
            </Text>
            {isActiveState(activeJob.state) && (
              <Button
                size="sm"
                variant="ghost"
                onPress={() => void cancelActiveJob()}
              >
                <Button.Label>Cancelar</Button.Label>
              </Button>
            )}
            <Pressable onPress={() => setActiveJob(null)} hitSlop={8}>
              <Ionicons name="close" size={18} color="#a1a1aa" />
            </Pressable>
          </View>
          <Text className="text-xs text-muted">job {activeJob.id}</Text>
          {activeJob.error !== null && (
            <Text className="text-xs text-danger">{activeJob.error}</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}
