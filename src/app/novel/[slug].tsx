import { useCallback, useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { BottomSheet } from "heroui-native/bottom-sheet";
import { Button } from "heroui-native/button";
import { Chip } from "heroui-native/chip";
import { Dialog } from "heroui-native/dialog";
import { Select } from "heroui-native/select";
import { Skeleton } from "heroui-native/skeleton";
import { Spinner } from "heroui-native/spinner";
import { useToast } from "heroui-native/toast";
import { ApiError } from "@/lib/api";
import { useApi } from "@/lib/api-provider";
import { resolveCover } from "@/lib/covers";
import { openEpub, saveEpub } from "@/lib/downloads";
import { pollJob } from "@/lib/jobs";
import { TRANSLATE_OPTIONS, volumeSizeOptions } from "@/lib/languages";
import type { JobState, Novel } from "@/lib/types";
import { CoverImage } from "@/components/cover-image";
import { EmptyState } from "@/components/empty-state";
import { ProgressBar } from "@/components/progress-bar";

type RowState = "idle" | "downloading" | "ok" | "error";
type ActionKind = "sync" | "retranslate" | "volume";

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

interface VolumeRowProps {
  filename: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  state: RowState;
  onDownload: () => void;
}

/** Fila de tomo con estado propio de descarga (una descarga no bloquea el resto). */
function VolumeRow({ filename, label, icon, state, onDownload }: VolumeRowProps) {
  return (
    <View className="flex-row items-center gap-3 rounded-lg border border-separator bg-surface px-3 py-2">
      <Ionicons name={icon} size={18} color="#a1a1aa" />
      <View className="flex-1">
        <Text numberOfLines={1} className="text-sm text-foreground">
          {label}
        </Text>
        {state === "error" && (
          <Text numberOfLines={2} className="text-xs text-danger">
            Descarga fallida · {filename}
          </Text>
        )}
      </View>
      <Button
        variant="ghost"
        size="sm"
        onPress={onDownload}
        isDisabled={state === "downloading"}
      >
        {state === "downloading" ? (
          <Spinner size="sm" />
        ) : state === "ok" ? (
          <Ionicons name="checkmark" size={18} color="#16a34a" />
        ) : (
          <Button.Label>Descargar</Button.Label>
        )}
      </Button>
    </View>
  );
}

/**
 * Quita el título de novela y la extensión de un nombre de EPUB:
 * "Inner Voice ... 1-100.epub" → "1-100".
 */
function epubLabel(novel: Novel, filename: string): string {
  const prefix = novel.title.length > 0 ? `${novel.title} ` : "";
  let label = filename.startsWith(prefix) ? filename.slice(prefix.length) : filename;
  label = label.replace(/\.epub$/i, "");
  return label.length > 0 ? label : filename;
}

export default function NovelScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { api, settings } = useApi();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});

  // Acciones del detalle (spec 0.2.0-04)
  const [syncOpen, setSyncOpen] = useState(false);
  const [retranslateOpen, setRetranslateOpen] = useState(false);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("es");
  const [actionBusy, setActionBusy] = useState<ActionKind | null>(null);
  const [actionJob, setActionJob] = useState<{
    id: string;
    state: JobState;
    error: string | null;
  } | null>(null);
  const actionAbort = useRef<AbortController | null>(null);

  useEffect(() => () => actionAbort.current?.abort(), []);

  const load = useCallback(
    async (showSkeleton = true) => {
      if (typeof slug !== "string" || slug === "") return;
      if (showSkeleton) setIsLoading(true);
      try {
        setNovel(await api.getNovel(slug));
        setError(null);
      } catch (caught) {
        if (caught instanceof ApiError && caught.status === 401) {
          setError("Token inválido. Revisa el token en Ajustes.");
        } else {
          setError(caught instanceof ApiError ? caught.message : "Error inesperado");
        }
      } finally {
        if (showSkeleton) setIsLoading(false);
      }
    },
    [slug, api],
  );

  useEffect(() => {
    // Carga inicial de datos (patrón fetch-on-mount estándar en RN; la regla
    // react-hooks/set-state-in-effect lo marca por conservadurismo).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const download = useCallback(
    async (filename: string) => {
      if (novel === null) return;
      setRowStates((current) => ({ ...current, [filename]: "downloading" }));
      try {
        const { bytes } = await api.downloadEpub(novel.slug, filename);
        if (bytes === null) {
          setRowStates((current) => ({ ...current, [filename]: "ok" }));
          toast.show({
            variant: "success",
            label: "Descarga simulada (mock)",
            description: filename,
          });
          return;
        }
        const uri = await saveEpub(novel.slug, filename, bytes);
        await openEpub(uri, filename);
        setRowStates((current) => ({ ...current, [filename]: "ok" }));
        toast.show({
          variant: "success",
          label: "EPUB descargado",
          description: filename,
        });
      } catch (caught) {
        setRowStates((current) => ({ ...current, [filename]: "error" }));
        toast.show({
          variant: "danger",
          label: caught instanceof ApiError ? caught.message : "Descarga fallida",
        });
      }
    },
    [novel, toast, api],
  );

  const showActionError = useCallback(
    (caught: unknown) => {
      toast.show({
        variant: "danger",
        label: caught instanceof ApiError ? caught.message : "Error inesperado",
      });
    },
    [toast],
  );

  /** Sigue el job de una acción y refresca la novela al terminar. */
  const followJob = useCallback(
    async (jobId: string) => {
      actionAbort.current?.abort();
      const controller = new AbortController();
      actionAbort.current = controller;
      setActionJob({ id: jobId, state: "pending", error: null });
      try {
        const job = await pollJob(api, jobId, {
          signal: controller.signal,
          onUpdate: (update) =>
            setActionJob({
              id: jobId,
              state: update.state,
              error: update.error,
            }),
        });
        if (job.state === "done") {
          await load(false);
          toast.show({
            variant: "success",
            label: "Acción completada",
            description: job.slug ?? job.id,
          });
        } else if (job.state === "error") {
          toast.show({
            variant: "danger",
            label: "La acción falló",
            description: job.error ?? undefined,
          });
        }
      } catch (caught) {
        if (controller.signal.aborted) return;
        const message =
          caught instanceof ApiError ? caught.message : "Error inesperado";
        setActionJob({ id: jobId, state: "error", error: message });
        toast.show({
          variant: "danger",
          label: "Seguimiento del job fallido",
          description: message,
        });
      } finally {
        if (actionAbort.current === controller) actionAbort.current = null;
      }
    },
    [api, load, toast],
  );

  const runSync = useCallback(async () => {
    if (novel === null) return;
    setSyncOpen(false);
    setActionBusy("sync");
    try {
      const { job_id } = await api.syncNovel(novel.slug);
      void followJob(job_id);
    } catch (caught) {
      showActionError(caught);
    } finally {
      setActionBusy(null);
    }
  }, [novel, api, followJob, showActionError]);

  const openRetranslate = useCallback(() => {
    if (novel === null) return;
    setSelectedLanguage(novel.translated_language === "es" ? "en" : "es");
    setRetranslateOpen(true);
  }, [novel]);

  const runRetranslate = useCallback(async () => {
    if (novel === null) return;
    setRetranslateOpen(false);
    setActionBusy("retranslate");
    try {
      const { job_id } = await api.retranslateNovel(novel.slug, selectedLanguage);
      void followJob(job_id);
    } catch (caught) {
      showActionError(caught);
    } finally {
      setActionBusy(null);
    }
  }, [novel, selectedLanguage, api, followJob, showActionError]);

  const runVolumeSize = useCallback(
    async (size: number | null) => {
      if (novel === null) return;
      setVolumeOpen(false);
      setActionBusy("volume");
      try {
        const result = await api.changeVolumeSize(novel.slug, size);
        setNovel((current) =>
          current === null
            ? current
            : {
                ...current,
                volume_size: result.volume_size,
                epub_original: result.epub_original,
                epub_translated: result.epub_translated,
              },
        );
        toast.show({
          variant: "success",
          label: "Tomos regenerados",
          description:
            result.volume_size === null
              ? "Sin división por tomos"
              : `${result.volume_size} capítulos por tomo`,
        });
      } catch (caught) {
        showActionError(caught);
      } finally {
        setActionBusy(null);
      }
    },
    [novel, api, toast, showActionError],
  );

  if (isLoading) {
    return (
      <View className="flex-1 gap-4 bg-background px-4">
        <Stack.Screen options={{ title: "…" }} />
        <Skeleton className="h-56 w-full rounded-lg" />
        <Skeleton className="h-4 w-48 rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
      </View>
    );
  }

  if (error !== null || novel === null) {
    return (
      <View className="flex-1 bg-background px-4">
        <Stack.Screen options={{ title: "Error" }} />
        <EmptyState
          icon="cloud-offline-outline"
          title="No se pudo cargar la novela"
          description={error ?? "Novela no encontrada"}
          action={
            <View className="flex-row gap-2">
              <Button size="sm" variant="secondary" onPress={() => void load()}>
                <Button.Label>Reintentar</Button.Label>
              </Button>
              <Button size="sm" variant="ghost" onPress={() => router.back()}>
                <Button.Label>Volver</Button.Label>
              </Button>
            </View>
          }
        />
      </View>
    );
  }

  const cover = resolveCover(novel, settings);
  const downloadedPct =
    novel.chapters_total > 0 ? novel.chapters_downloaded / novel.chapters_total : 0;
  const translatedPct =
    novel.chapters_total > 0 ? novel.chapters_translated / novel.chapters_total : 0;
  const languageChoices = TRANSLATE_OPTIONS.filter(
    (option) => option.value !== novel.translated_language,
  );
  const selectedLanguageOption =
    languageChoices.find((option) => option.value === selectedLanguage) ??
    languageChoices[0];

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="pb-12"
    >
      <Stack.Screen options={{ title: novel.title }} />

      {/* Hero (el título lo lleva el appbar nativo) */}
      <View className="flex-row gap-4 px-4 py-2">
        <CoverImage
          source={cover}
          className="h-56 w-40 rounded-lg bg-surface-tertiary"
        />
        <View className="flex-1 gap-1.5">
          <Text className="text-sm text-muted">{novel.author ?? "Autor desconocido"}</Text>
          <View className="flex-row flex-wrap gap-1.5">
            <Chip size="sm" variant="soft" color="default">
              <Chip.Label>{novel.source_pdf ? "PDF" : "Web"}</Chip.Label>
            </Chip>
            {novel.volume_size !== null && (
              <Chip size="sm" variant="soft" color="default">
                <Chip.Label>{novel.volume_size}/tomo</Chip.Label>
              </Chip>
            )}
            {novel.translated_language !== null && (
              <Chip size="sm" variant="soft" color="accent">
                <Chip.Label>{novel.translated_language.toUpperCase()}</Chip.Label>
              </Chip>
            )}
          </View>
          <View className="mt-1 gap-0.5">
            <Text className="text-xs text-muted [font-variant-numeric:tabular-nums]">
              Descargados {novel.chapters_downloaded}/{novel.chapters_total}
            </Text>
            <ProgressBar value={downloadedPct} />
            <Text className="text-xs text-muted [font-variant-numeric:tabular-nums]">
              Traducidos {novel.chapters_translated}/{novel.chapters_total}
            </Text>
            <ProgressBar value={translatedPct} colorClass="bg-success" />
          </View>
        </View>
      </View>

      {/* Acciones reales del detalle (spec 0.2.0-04) */}
      <View className="mt-2 flex-row flex-wrap gap-2 px-4">
        <Button
          size="sm"
          variant="secondary"
          onPress={() => setSyncOpen(true)}
          isDisabled={actionBusy !== null}
        >
          {actionBusy === "sync" ? (
            <Spinner size="sm" />
          ) : (
            <Button.Label>Sincronizar</Button.Label>
          )}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onPress={openRetranslate}
          isDisabled={actionBusy !== null}
        >
          <Button.Label>Retraducir</Button.Label>
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onPress={() => setVolumeOpen(true)}
          isDisabled={actionBusy !== null}
        >
          {actionBusy === "volume" ? (
            <Spinner size="sm" />
          ) : (
            <Button.Label>Tomos</Button.Label>
          )}
        </Button>
      </View>

      {actionJob !== null && (
        <View className="mx-4 mt-3 gap-1 rounded-xl border border-separator bg-surface p-3">
          <View className="flex-row items-center gap-2">
            {isActiveState(actionJob.state) ? (
              <Spinner size="sm" />
            ) : (
              <Ionicons
                name={
                  actionJob.state === "done"
                    ? "checkmark-circle"
                    : actionJob.state === "error"
                      ? "alert-circle"
                      : "close-circle"
                }
                size={18}
                color={
                  actionJob.state === "done"
                    ? "#16a34a"
                    : actionJob.state === "error"
                      ? "#dc2626"
                      : "#a1a1aa"
                }
              />
            )}
            <Text className="flex-1 text-sm font-semibold text-foreground">
              {JOB_LABELS[actionJob.state]}
            </Text>
            <Pressable onPress={() => setActionJob(null)} hitSlop={8}>
              <Ionicons name="close" size={18} color="#a1a1aa" />
            </Pressable>
          </View>
          <Text className="text-xs text-muted">job {actionJob.id}</Text>
          {actionJob.error !== null && (
            <Text className="text-xs text-danger">{actionJob.error}</Text>
          )}
        </View>
      )}

      {novel.chapters_empty > 0 && (
        <View className="mx-4 my-2 rounded-lg border border-warning px-3 py-2">
          <Text className="text-sm text-warning">
            {novel.chapters_empty} capítulos vacíos (nº {novel.chapters_empty_nums.join(", ")})
          </Text>
        </View>
      )}

      {/* Tomos */}
      <View className="gap-2 px-4 pt-2">
        <Text className="text-lg font-semibold text-foreground">EPUBs generados</Text>
        <Text className="text-sm text-muted">
          Descarga los tomos; la versión traducida aparece etiquetada (ES).
        </Text>

        <View className="mt-2 gap-1.5">
          <Text className="text-sm font-semibold text-muted">Original</Text>
          {novel.epub_original.map((filename) => (
            <VolumeRow
              key={filename}
              filename={filename}
              label={epubLabel(novel, filename)}
              icon="book-outline"
              state={rowStates[filename] ?? "idle"}
              onDownload={() => void download(filename)}
            />
          ))}
        </View>

        <View className="mt-3 gap-1.5">
          <Text className="text-sm font-semibold text-muted">Traducidos (ES)</Text>
          {novel.epub_translated.map((filename) => (
            <VolumeRow
              key={filename}
              filename={filename}
              label={epubLabel(novel, filename)}
              icon="language-outline"
              state={rowStates[filename] ?? "idle"}
              onDownload={() => void download(filename)}
            />
          ))}
        </View>
      </View>

      {/* Sync: confirmación (operación larga) */}
      <Dialog isOpen={syncOpen} onOpenChange={setSyncOpen}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Close />
            <View className="mb-5 gap-1.5">
              <Dialog.Title>Sincronizar novela</Dialog.Title>
              <Dialog.Description>
                Se descargarán los capítulos nuevos y se actualizarán los EPUB.
                Puede tardar; el progreso aparecerá en esta pantalla.
              </Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setSyncOpen(false)}
              >
                <Button.Label>Cancelar</Button.Label>
              </Button>
              <Button size="sm" onPress={() => void runSync()}>
                <Button.Label>Sincronizar</Button.Label>
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      {/* Retraducir: idioma de destino */}
      <BottomSheet isOpen={retranslateOpen} onOpenChange={setRetranslateOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content contentContainerClassName="gap-5 px-5 pb-10 pt-5">
            <View className="gap-1">
              <BottomSheet.Title className="text-lg font-semibold text-foreground">
                Retraducir
              </BottomSheet.Title>
              <Text className="text-xs text-muted">
                Elige el idioma de destino; se regeneran los EPUB traducidos.
              </Text>
            </View>

            <Select
              value={selectedLanguageOption}
              onValueChange={(option) => {
                if (
                  !Array.isArray(option) &&
                  typeof option === "object" &&
                  option.value
                ) {
                  setSelectedLanguage(option.value);
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
                  <Select.ListLabel>Idioma de traducción</Select.ListLabel>
                  {languageChoices.map((option) => (
                    <Select.Item
                      key={option.value}
                      value={option.value}
                      label={option.label}
                    />
                  ))}
                </Select.Content>
              </Select.Portal>
            </Select>

            <Button
              size="lg"
              onPress={() => void runRetranslate()}
              isDisabled={actionBusy !== null}
            >
              <Button.Label>
                {actionBusy === "retranslate" ? "Lanzando..." : "Retraducir"}
              </Button.Label>
            </Button>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      {/* Tamaño de tomo: síncrono, sin job */}
      <BottomSheet isOpen={volumeOpen} onOpenChange={setVolumeOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content contentContainerClassName="gap-5 px-5 pb-10 pt-5">
            <View className="gap-1">
              <BottomSheet.Title className="text-lg font-semibold text-foreground">
                Tamaño de tomo
              </BottomSheet.Title>
              <Text className="text-xs text-muted">
                Regenera todos los EPUB con el tamaño elegido.
              </Text>
            </View>

            <View className="gap-2">
              {volumeSizeOptions(true).map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  variant={
                    novel.volume_size === option.size ? "primary" : "secondary"
                  }
                  onPress={() => void runVolumeSize(option.size)}
                  isDisabled={actionBusy !== null}
                >
                  <Button.Label>{option.label}</Button.Label>
                </Button>
              ))}
            </View>

            <Text className="text-xs text-muted">
              Cambiar el tamaño regenera los tomos en el servidor; puede tardar.
            </Text>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </ScrollView>
  );
}
