import { useCallback, useEffect, useRef, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { BottomSheet } from "heroui-native/bottom-sheet";
import { FieldError } from "heroui-native/field-error";
import { Input } from "heroui-native/input";
import { Select } from "heroui-native/select";
import { Separator } from "heroui-native/separator";
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
import type { JobRequest, JobState, UploadPdfRequest } from "@/lib/types";
import { ActionButton } from "@/components/action-button";
import { PAGE_CONTENT } from "@/lib/layout";
import { JobRow, isActiveState, type JobLike } from "@/components/job-row";
import { Screen } from "@/components/screen";

const VOLUME_OPTIONS = VOLUME_SIZES.map((size) => ({
  value: String(size),
  label: String(size),
}));

const CONCURRENCY_MIN = 1;
const CONCURRENCY_MAX = 8;

type JobItem = JobLike;
type PdfKind = "auto" | "book" | "webnovel";

const PDF_KIND_OPTIONS: { value: PdfKind; label: string }[] = [
  { value: "auto", label: "Automático" },
  { value: "book", label: "Libro" },
  { value: "webnovel", label: "Webnovel" },
];

const UUID_FILENAME_RE =
  /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

/** Título propuesto a partir del nombre real; vacío si es un UUID de caché. */
function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.pdf$/i, "").trim();
  return UUID_FILENAME_RE.test(base) ? "" : base;
}

interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

/** Fila label + descripción + switch, con target de 44. */
function ToggleRow({ label, description, value, onChange }: ToggleRowProps) {
  return (
    <View className="min-h-11 flex-row items-center gap-4">
      <View className="flex-1 gap-0.5">
        <Text className="t-body text-foreground">{label}</Text>
        {description !== undefined && (
          <Text className="t-meta text-muted">{description}</Text>
        )}
      </View>
      <Switch isSelected={value} onSelectedChange={onChange} />
    </View>
  );
}

export default function HomeScreen() {
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
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfAuthor, setPdfAuthor] = useState("");
  const [pdfKind, setPdfKind] = useState<PdfKind>("auto");

  const [busy, setBusy] = useState(false);
  const [urlError, setUrlError] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const pollAbort = useRef<AbortController | null>(null);

  const activeJob = jobs.find((job) => isActiveState(job.state)) ?? null;

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
    [
      translate,
      targetLang,
      volume,
      concurrency,
      all,
      pending,
      force,
      playwright,
      pdfSourceLang,
    ],
  );

  const urlValid = isHttpUrl(url.trim());
  const advancedCount = [
    volume !== "50",
    concurrency !== "4",
    all,
    pending,
    force,
    playwright,
  ].filter(Boolean).length;

  const langOption =
    TRANSLATE_OPTIONS.find((language) => language.value === targetLang) ??
    TRANSLATE_OPTIONS[0];
  const pdfSourceOption =
    TRANSLATE_OPTIONS.find((language) => language.value === pdfSourceLang) ??
    TRANSLATE_OPTIONS[0];
  const volumeOption = { value: volume, label: volume };
  const pdfKindOption =
    PDF_KIND_OPTIONS.find((option) => option.value === pdfKind) ??
    PDF_KIND_OPTIONS[0];

  const showApiError = useCallback(
    (error: unknown) => {
      toast.show({
        variant: "danger",
        label: error instanceof ApiError ? error.message : "Error inesperado",
      });
    },
    [toast],
  );

  /** Sigue el job creado y refleja su estado en la lista de trabajos. */
  const trackJob = useCallback(
    async (jobId: string, jobSource: "web" | "pdf") => {
      pollAbort.current?.abort();
      const controller = new AbortController();
      pollAbort.current = controller;
      setJobs((current) =>
        [
          {
            id: jobId,
            source: jobSource,
            state: "pending" as JobState,
            error: null,
          },
          ...current,
        ].slice(0, 10),
      );
      try {
        const job = await pollJob(api, jobId, {
          signal: controller.signal,
          onUpdate: (update) =>
            setJobs((current) =>
              current.map((item) =>
                item.id === jobId
                  ? { ...item, state: update.state, error: update.error }
                  : item,
              ),
            ),
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
        setJobs((current) =>
          current.map((item) =>
            item.id === jobId ? { ...item, state: "error", error: message } : item,
          ),
        );
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

  const cancelJob = useCallback(
    async (id: string) => {
      try {
        await api.cancelJob(id);
        pollAbort.current?.abort();
        setJobs((current) =>
          current.map((item) =>
            item.id === id ? { ...item, state: "cancelled" } : item,
          ),
        );
        toast.show({
          variant: "warning",
          label: "Job cancelado",
          description: id,
        });
      } catch (caught) {
        showApiError(caught);
      }
    },
    [api, toast, showApiError],
  );

  const dismissJob = useCallback((id: string) => {
    setJobs((current) => current.filter((job) => job.id !== id));
  }, []);

  const submitWeb = useCallback(async () => {
    if (!urlValid) {
      // Solo error inline (el toast duplicaba el mensaje y tapaba el título
      // cuando el teclado está abierto).
      setUrlError(true);
      return;
    }
    setUrlError(false);
    if (activeJob !== null) {
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
  }, [
    url,
    urlValid,
    volume,
    translate,
    targetLang,
    all,
    pending,
    force,
    playwright,
    concurrency,
    currentJobOptions,
    showApiError,
    toast,
    api,
    activeJob,
    trackJob,
  ]);

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
      setPdfTitle(titleFromFilename(asset.name));
      setPdfAuthor("");
      setPdfKind("auto");
    }
  }, []);

  const submitPdf = useCallback(async () => {
    if (pdfFile === null) {
      toast.show({ variant: "warning", label: "Selecciona un PDF primero" });
      void pickPdf();
      return;
    }
    if (activeJob !== null) {
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
        title: pdfTitle.trim() !== "" ? pdfTitle.trim() : null,
        author: pdfAuthor.trim() !== "" ? pdfAuthor.trim() : null,
        kind: pdfKind,
      };
      const job = await api.uploadPdf(request);
      toast.show({
        variant: "success",
        label: "PDF enviado",
        description: job.job_id,
      });
      void updateSettings({ lastJobOptions: currentJobOptions() });
      setPdfFile(null);
      setPdfTitle("");
      setPdfAuthor("");
      setPdfKind("auto");
      void trackJob(job.job_id, "pdf");
    } catch (error) {
      showApiError(error);
    } finally {
      setBusy(false);
    }
  }, [
    pdfFile,
    pdfSourceLang,
    pdfTitle,
    pdfAuthor,
    pdfKind,
    translate,
    targetLang,
    volume,
    currentJobOptions,
    showApiError,
    toast,
    api,
    activeJob,
    trackJob,
    pickPdf,
  ]);

  const resetOptions = useCallback(() => {
    setVolume("50");
    setConcurrency("4");
    setAll(false);
    setPending(false);
    setForce(false);
    setPlaywright(false);
  }, []);

  const stepConcurrency = useCallback((delta: number) => {
    setConcurrency((current) => {
      const next = Math.min(
        CONCURRENCY_MAX,
        Math.max(CONCURRENCY_MIN, (Number(current) || 4) + delta),
      );
      return String(next);
    });
  }, []);

  return (
    <Screen>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName={`${PAGE_CONTENT} gap-6 px-4 pb-12 pt-3`}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View className="gap-1">
            <Text className="t-page text-foreground">Nueva descarga</Text>
            <Text className="t-body text-muted">
              Pega una URL o sube un PDF.
            </Text>
          </View>

          <Tabs
            value={source}
            onValueChange={(value) =>
              setSource(value === "pdf" ? "pdf" : "web")
            }
          >
            <Tabs.List className="h-11 w-full">
              <Tabs.Indicator />
              <Tabs.Trigger value="web" className="h-full flex-1">
                <Tabs.Label>Desde web</Tabs.Label>
              </Tabs.Trigger>
              <Tabs.Trigger value="pdf" className="h-full flex-1">
                <Tabs.Label>Desde PDF</Tabs.Label>
              </Tabs.Trigger>
            </Tabs.List>

            {/* Panel: Desde web */}
            <Tabs.Content value="web" className="pt-4">
              <View className="gap-4 rounded-xl bg-surface p-4">
                <TextField isInvalid={urlError}>
                  <Text className="t-label text-muted">URL de la novela</Text>
                  <Input
                    value={url}
                    onChangeText={(value) => {
                      setUrl(value);
                      if (urlError && isHttpUrl(value.trim())) {
                        setUrlError(false);
                      }
                    }}
                    placeholder="https://novelfire.net/..."
                    autoCapitalize="none"
                    autoCorrect={false}
                    inputMode="url"
                    className="android:focus:border-foreground ios:focus:outline-foreground"
                  />
                  {urlError && (
                    <FieldError>
                      Debe empezar por http:// o https://
                    </FieldError>
                  )}
                </TextField>

                <ActionButton
                  onPress={() => void submitWeb()}
                  loading={busy}
                >
                  Lanzar descarga
                </ActionButton>

                <Separator />

                <ToggleRow
                  label="Traducir"
                  description="Traduce la novela al terminar la descarga"
                  value={translate}
                  onChange={setTranslate}
                />

                {translate && (
                  <View className="gap-1.5">
                    <Text className="t-label text-muted">
                      Idioma de traducción
                    </Text>
                    <Select
                      value={langOption}
                      onValueChange={(option) => {
                        if (
                          !Array.isArray(option) &&
                          typeof option === "object" &&
                          option.value
                        ) {
                          setTargetLang(option.value);
                        }
                      }}
                    >
                      <Select.Trigger>
                        <Select.Value placeholder="Idioma" />
                        <Select.TriggerIndicator />
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Overlay />
                        <Select.Content presentation="popover" width="trigger">
                          <Select.ListLabel>
                            Idioma de traducción
                          </Select.ListLabel>
                          {TRANSLATE_TARGETS.map((language) => (
                            <Select.Item
                              key={language.code}
                              value={language.code}
                              label={language.label}
                            />
                          ))}
                        </Select.Content>
                      </Select.Portal>
                    </Select>
                  </View>
                )}

                <Separator />

                <Pressable
                  onPress={() => setOptionsOpen(true)}
                  accessibilityRole="button"
                  className="min-h-11 flex-row items-center gap-3"
                >
                  <View className="flex-1">
                    <Text className="t-body text-foreground">
                      Opciones avanzadas
                    </Text>
                    <Text className="t-meta text-muted">
                      {advancedCount > 0
                        ? `${advancedCount} ${
                            advancedCount === 1 ? "activa" : "activas"
                          }`
                        : "Todas por defecto"}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="#8b8b93"
                  />
                </Pressable>
              </View>
            </Tabs.Content>

            {/* Panel: Desde PDF */}
            <Tabs.Content value="pdf" className="pt-4">
              <View className="gap-4 rounded-xl bg-surface p-4">
                {pdfFile ? (
                  <View className="flex-row items-center gap-3 rounded-lg bg-surface-secondary px-3 py-2">
                    <Ionicons
                      name="document-text-outline"
                      size={20}
                      color="#8b8b93"
                    />
                    <View className="flex-1">
                      <Text numberOfLines={1} className="t-body text-foreground">
                        {pdfFile.name}
                      </Text>
                      {pdfFile.size !== null && (
                        <Text className="t-meta text-muted">
                          {(pdfFile.size / (1024 * 1024)).toFixed(1)} MB
                        </Text>
                      )}
                    </View>
                    <Pressable
                      onPress={() => {
                        setPdfFile(null);
                        setPdfTitle("");
                        setPdfAuthor("");
                        setPdfKind("auto");
                      }}
                      hitSlop={8}
                      accessibilityLabel="Quitar archivo"
                      className="min-h-11 min-w-11 items-center justify-center"
                    >
                      <Ionicons name="close-circle" size={20} color="#8b8b93" />
                    </Pressable>
                  </View>
                ) : (
                  <ActionButton tone="secondary" onPress={() => void pickPdf()}>
                    Elegir archivo PDF
                  </ActionButton>
                )}

                <Text className="t-meta text-muted">
                  Webnovel o light novel con ilustraciones. El EPUB conserva el
                  formato original.
                </Text>

                <View className="gap-1.5">
                  <Text className="t-label text-muted">Título (opcional)</Text>
                  <Input
                    value={pdfTitle}
                    onChangeText={setPdfTitle}
                    placeholder="Kunon the Sorcerer Can See v01"
                    autoCapitalize="words"
                  />
                  <Text className="t-meta text-muted">
                    Si lo dejas vacío se usa el nombre del archivo o los
                    metadatos del PDF.
                  </Text>
                </View>

                <View className="gap-1.5">
                  <Text className="t-label text-muted">Autor (opcional)</Text>
                  <Input
                    value={pdfAuthor}
                    onChangeText={setPdfAuthor}
                    placeholder="Autor del PDF"
                    autoCapitalize="words"
                  />
                </View>

                <View className="gap-1.5">
                  <Text className="t-label text-muted">Tipo de PDF</Text>
                  <Select
                    value={pdfKindOption}
                    onValueChange={(option) => {
                      if (
                        !Array.isArray(option) &&
                        typeof option === "object" &&
                        (option.value === "auto" ||
                          option.value === "book" ||
                          option.value === "webnovel")
                      ) {
                        setPdfKind(option.value);
                      }
                    }}
                  >
                    <Select.Trigger>
                      <Select.Value placeholder="Tipo" />
                      <Select.TriggerIndicator />
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Overlay />
                      <Select.Content presentation="popover" width="trigger">
                        {PDF_KIND_OPTIONS.map((option) => (
                          <Select.Item
                            key={option.value}
                            value={option.value}
                            label={option.label}
                          />
                        ))}
                      </Select.Content>
                    </Select.Portal>
                  </Select>
                  <Text className="t-meta text-muted">
                    Automático detecta si es un libro o una webnovel.
                  </Text>
                </View>

                <View className="flex-row gap-3">
                  <View className="flex-1 gap-1.5">
                    <Text className="t-label text-muted">Idioma del PDF</Text>
                    <Select
                      value={pdfSourceOption}
                      onValueChange={(option) => {
                        if (
                          !Array.isArray(option) &&
                          typeof option === "object" &&
                          option.value
                        ) {
                          setPdfSourceLang(option.value);
                        }
                      }}
                    >
                      <Select.Trigger>
                        <Select.Value placeholder="Idioma" />
                        <Select.TriggerIndicator />
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Overlay />
                        <Select.Content presentation="popover" width="trigger">
                          {TRANSLATE_TARGETS.map((language) => (
                            <Select.Item
                              key={language.code}
                              value={language.code}
                              label={language.label}
                            />
                          ))}
                        </Select.Content>
                      </Select.Portal>
                    </Select>
                  </View>
                  <View className="flex-1 gap-1.5">
                    <Text className="t-label text-muted">Capítulos por tomo</Text>
                    <Select
                      value={volumeOption}
                      onValueChange={(option) => {
                        if (
                          !Array.isArray(option) &&
                          typeof option === "object" &&
                          option.value
                        ) {
                          setVolume(option.value);
                        }
                      }}
                    >
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

                <Separator />

                <ToggleRow
                  label="Traducir"
                  description="Traduce el PDF al terminar la conversión"
                  value={translate}
                  onChange={setTranslate}
                />

                {translate && (
                  <View className="gap-1.5">
                    <Text className="t-label text-muted">
                      Idioma de traducción
                    </Text>
                    <Select
                      value={langOption}
                      onValueChange={(option) => {
                        if (
                          !Array.isArray(option) &&
                          typeof option === "object" &&
                          option.value
                        ) {
                          setTargetLang(option.value);
                        }
                      }}
                    >
                      <Select.Trigger>
                        <Select.Value placeholder="Idioma" />
                        <Select.TriggerIndicator />
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Overlay />
                        <Select.Content presentation="popover" width="trigger">
                          <Select.ListLabel>
                            Idioma de traducción
                          </Select.ListLabel>
                          {TRANSLATE_TARGETS.map((language) => (
                            <Select.Item
                              key={language.code}
                              value={language.code}
                              label={language.label}
                            />
                          ))}
                        </Select.Content>
                      </Select.Portal>
                    </Select>
                  </View>
                )}

                <ActionButton onPress={() => void submitPdf()} loading={busy}>
                  Subir y convertir
                </ActionButton>
              </View>
            </Tabs.Content>
          </Tabs>

          {/* Trabajos de esta sesión: llena el vacío con contenido real */}
          <View className="gap-2">
            <View className="flex-row items-center justify-between px-1">
              <Text className="t-section text-foreground">
                Trabajos de esta sesión
              </Text>
              {jobs.length > 0 && (
                <Text className="t-meta text-muted [font-variant-numeric:tabular-nums]">
                  {jobs.length}
                </Text>
              )}
            </View>
            <View className="overflow-hidden rounded-xl bg-surface">
              {jobs.length === 0 ? (
                <Text className="t-meta px-4 py-4 text-muted">
                  Los trabajos que lances aparecen aquí; se borran al cerrar la
                  app.
                </Text>
              ) : (
                jobs.map((job) => (
                  <JobRow
                    key={job.id}
                    job={job}
                    onCancel={
                      isActiveState(job.state)
                        ? () => void cancelJob(job.id)
                        : undefined
                    }
                    onDismiss={() => dismissJob(job.id)}
                  />
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Opciones avanzadas */}
      <BottomSheet isOpen={optionsOpen} onOpenChange={setOptionsOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content contentContainerClassName="gap-5 px-5 pb-10 pt-5">
            <View className="gap-1">
              <BottomSheet.Title className="t-section text-foreground">
                Opciones avanzadas
              </BottomSheet.Title>
              <Text className="t-meta text-muted">
                Se aplican al próximo trabajo que lances.
              </Text>
            </View>

            <View className="gap-1.5">
              <Text className="t-label text-muted">Capítulos por tomo</Text>
              <Select
                value={volumeOption}
                onValueChange={(option) => {
                  if (
                    !Array.isArray(option) &&
                    typeof option === "object" &&
                    option.value
                  ) {
                    setVolume(option.value);
                  }
                }}
              >
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

            <View className="flex-row items-center justify-between gap-4">
              <View className="flex-1 gap-0.5">
                <Text className="t-body text-foreground">
                  Descargas simultáneas
                </Text>
                <Text className="t-meta text-muted">
                  Cuántos capítulos se descargan a la vez
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Pressable
                  onPress={() => stepConcurrency(-1)}
                  disabled={Number(concurrency) <= CONCURRENCY_MIN}
                  hitSlop={8}
                  accessibilityLabel="Menos descargas simultáneas"
                  className="h-11 w-11 items-center justify-center rounded-lg bg-surface-secondary"
                >
                  <Ionicons name="remove" size={18} color="#8b8b93" />
                </Pressable>
                <Text className="t-body w-8 text-center text-foreground [font-variant-numeric:tabular-nums]">
                  {concurrency}
                </Text>
                <Pressable
                  onPress={() => stepConcurrency(1)}
                  disabled={Number(concurrency) >= CONCURRENCY_MAX}
                  hitSlop={8}
                  accessibilityLabel="Más descargas simultáneas"
                  className="h-11 w-11 items-center justify-center rounded-lg bg-surface-secondary"
                >
                  <Ionicons name="add" size={18} color="#8b8b93" />
                </Pressable>
              </View>
            </View>

            <Separator />

            <View className="gap-4">
              <ToggleRow
                label="Todos los capítulos"
                description="Descarga la novela completa, no solo lo nuevo"
                value={all}
                onChange={setAll}
              />
              <ToggleRow
                label="Traducir solo lo pendiente"
                description="No vuelve a traducir capítulos ya traducidos"
                value={pending}
                onChange={setPending}
              />
              <ToggleRow
                label="Volver a descargar lo existente"
                description="Ignora los capítulos que ya están en disco"
                value={force}
                onChange={setForce}
              />
              <ToggleRow
                label="Modo navegador (Playwright)"
                description="Úsalo si la web bloquea la descarga normal"
                value={playwright}
                onChange={setPlaywright}
              />
            </View>

            <View className="flex-row gap-2">
              <ActionButton tone="ghost" className="flex-1" onPress={resetOptions}>
                Restablecer
              </ActionButton>
              <ActionButton className="flex-1" onPress={() => setOptionsOpen(false)}>
                Listo
              </ActionButton>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </Screen>
  );
}
