import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Alert } from "heroui-native/alert";
import { BottomSheet } from "heroui-native/bottom-sheet";
import { Button } from "heroui-native/button";
import { Chip } from "heroui-native/chip";
import { Dialog } from "heroui-native/dialog";
import { ListGroup } from "heroui-native/list-group";
import { Menu } from "heroui-native/menu";
import { Select } from "heroui-native/select";
import { Separator } from "heroui-native/separator";
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
import { ActionButton } from "@/components/action-button";
import { CoverImage } from "@/components/cover-image";
import { EmptyState } from "@/components/empty-state";
import { JOB_LABELS, isActiveState } from "@/components/job-row";
import { ProgressBar } from "@/components/progress-bar";
import { VolumeEmpty, VolumeRow, type VolumeState } from "@/components/volume-row";

type ActionKind = "sync" | "retranslate" | "volume";
type VolumeList = "original" | "translated";

interface ProgressStatProps {
  label: string;
  current: number;
  total: number;
  colorClass?: string;
}

/** Cifra + barra con etiqueta y valor tabular alineado a la derecha. */
function ProgressStat({
  label,
  current,
  total,
  colorClass,
}: ProgressStatProps) {
  const value = total > 0 ? current / total : 0;
  return (
    <View className="gap-1">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="t-meta text-muted">{label}</Text>
        <Text className="t-meta text-foreground [font-variant-numeric:tabular-nums]">
          {current} / {total}
        </Text>
      </View>
      <ProgressBar value={value} colorClass={colorClass} className="h-1" />
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
  const [rowStates, setRowStates] = useState<Record<string, VolumeState>>({});
  const [bulk, setBulk] = useState<{
    list: VolumeList;
    done: number;
    total: number;
  } | null>(null);

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

  /**
   * Descarga un tomo. `open` abre el share sheet (una descarga suelta) y
   * `silent` evita el toast por archivo (descarga masiva).
   */
  const download = useCallback(
    async (
      filename: string,
      options: { open?: boolean; silent?: boolean } = {},
    ): Promise<boolean> => {
      if (novel === null) return false;
      const { open = true, silent = false } = options;
      setRowStates((current) => ({ ...current, [filename]: "downloading" }));
      try {
        const { bytes } = await api.downloadEpub(novel.slug, filename);
        if (bytes === null) {
          setRowStates((current) => ({ ...current, [filename]: "ok" }));
          if (!silent) {
            toast.show({
              variant: "success",
              label: "Descarga simulada (mock)",
              description: filename,
            });
          }
          return true;
        }
        const uri = await saveEpub(novel.slug, filename, bytes);
        if (open) {
          await openEpub(uri, filename);
        }
        setRowStates((current) => ({ ...current, [filename]: "ok" }));
        if (!silent) {
          toast.show({
            variant: "success",
            label: "EPUB descargado",
            description: filename,
          });
        }
        return true;
      } catch (caught) {
        setRowStates((current) => ({ ...current, [filename]: "error" }));
        toast.show({
          variant: "danger",
          label: caught instanceof ApiError ? caught.message : "Descarga fallida",
        });
        return false;
      }
    },
    [novel, toast, api],
  );

  const downloadAll = useCallback(
    async (files: string[], list: VolumeList) => {
      if (bulk !== null || files.length === 0) return;
      setBulk({ list, done: 0, total: files.length });
      let done = 0;
      for (const file of files) {
        const ok = await download(file, { open: false, silent: true });
        if (!ok) {
          setBulk(null);
          return;
        }
        done += 1;
        setBulk({ list, done, total: files.length });
      }
      setBulk(null);
      toast.show({
        variant: "success",
        label: "Tomos descargados",
        description: `${files.length} archivos`,
      });
    },
    [bulk, download, toast],
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

  const cancelActionJob = useCallback(async () => {
    if (actionJob === null || !isActiveState(actionJob.state)) return;
    try {
      await api.cancelJob(actionJob.id);
      actionAbort.current?.abort();
      setActionJob({ ...actionJob, state: "cancelled" });
      toast.show({
        variant: "warning",
        label: "Acción cancelada",
        description: actionJob.id,
      });
    } catch (caught) {
      showActionError(caught);
    }
  }, [actionJob, api, toast, showActionError]);

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
              <ActionButton
                size="sm"
                tone="secondary"
                onPress={() => void load()}
              >
                Reintentar
              </ActionButton>
              <ActionButton size="sm" tone="ghost" onPress={() => router.back()}>
                Volver
              </ActionButton>
            </View>
          }
        />
      </View>
    );
  }

  const cover = resolveCover(novel, settings);
  const languageChoices = TRANSLATE_OPTIONS.filter(
    (option) => option.value !== novel.translated_language,
  );
  const selectedLanguageOption =
    languageChoices.find((option) => option.value === selectedLanguage) ??
    languageChoices[0];

  const renderEpubSection = (
    title: string,
    files: string[],
    list: VolumeList,
    translated: boolean,
  ) => (
    <View className="gap-2">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="t-label text-muted">
          {title} · {files.length}
        </Text>
        {files.length > 0 && (
          <ActionButton
            tone="ghost"
            size="sm"
            onPress={() => void downloadAll(files, list)}
            loading={bulk?.list === list}
          >
            {bulk?.list === list
              ? `${bulk.done}/${bulk.total}`
              : "Descargar todo"}
          </ActionButton>
        )}
      </View>
      <ListGroup>
        {files.length === 0 ? (
          <VolumeEmpty label="Aún no hay tomos generados." />
        ) : (
          files.map((filename, index) => (
            <View key={filename}>
              {index > 0 && <Separator className="mx-4" />}
              <VolumeRow
                label={epubLabel(novel, filename)}
                filename={filename}
                translated={translated}
                state={rowStates[filename] ?? "idle"}
                onPress={() => void download(filename)}
              />
            </View>
          ))
        )}
      </ListGroup>
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="pb-12">
      <Stack.Screen options={{ title: novel.title }} />

      {/* Hero */}
      <View className="flex-row gap-4 px-4 py-3">
        <CoverImage
          source={cover}
          className="h-[168px] w-[120px] rounded-lg bg-surface-tertiary"
        />
        <View className="flex-1 gap-2">
          <Text className="t-body text-muted">
            {novel.author ?? "Autor desconocido"}
          </Text>
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
                <Chip.Label>
                  {novel.translated_language.toUpperCase()}
                </Chip.Label>
              </Chip>
            )}
          </View>
          <View className="mt-1 gap-2">
            <ProgressStat
              label="Descargados"
              current={novel.chapters_downloaded}
              total={novel.chapters_total}
            />
            <ProgressStat
              label="Traducidos"
              current={novel.chapters_translated}
              total={novel.chapters_total}
              colorClass="bg-success"
            />
          </View>
        </View>
      </View>

      {/* Acciones: una principal + menú */}
      <View className="mt-1 flex-row gap-2 px-4">
        <ActionButton
          className="flex-1"
          onPress={() => setSyncOpen(true)}
          loading={actionBusy === "sync"}
        >
          Sincronizar
        </ActionButton>
        <Menu>
          <Menu.Trigger asChild>
            <Button
              variant="secondary"
              size="md"
              background={null}
              className="h-12 rounded-lg bg-surface-secondary px-4"
            >
              <Button.Label className="text-sm font-medium text-foreground">
                Más
              </Button.Label>
            </Button>
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Overlay />
            <Menu.Content presentation="popover" align="end" className="p-1">
              <Menu.Item className="items-start" onPress={openRetranslate}>
                <View className="flex-1 gap-0.5">
                  <Menu.ItemTitle>Retraducir…</Menu.ItemTitle>
                  <Menu.ItemDescription>
                    Regenera los EPUB en otro idioma
                  </Menu.ItemDescription>
                </View>
              </Menu.Item>
              <Menu.Item
                className="items-start"
                onPress={() => setVolumeOpen(true)}
              >
                <View className="flex-1 gap-0.5">
                  <Menu.ItemTitle>Tamaño de tomo…</Menu.ItemTitle>
                  <Menu.ItemDescription>
                    Divide los EPUB en bloques
                  </Menu.ItemDescription>
                </View>
              </Menu.Item>
            </Menu.Content>
          </Menu.Portal>
        </Menu>
      </View>

      {actionJob !== null && (
        <View className="mt-3 gap-2 px-4">
          <Alert
            status={
              actionJob.state === "error"
                ? "danger"
                : actionJob.state === "done"
                  ? "success"
                  : isActiveState(actionJob.state)
                    ? "accent"
                    : "default"
            }
          >
            {isActiveState(actionJob.state) ? (
              <Spinner size="sm" />
            ) : (
              <Alert.Indicator />
            )}
            <Alert.Content>
              <Alert.Title>{JOB_LABELS[actionJob.state]}</Alert.Title>
              <Alert.Description>
                job {actionJob.id}
                {actionJob.error !== null ? ` · ${actionJob.error}` : ""}
              </Alert.Description>
            </Alert.Content>
          </Alert>
          <View className="flex-row justify-end gap-2">
            {isActiveState(actionJob.state) && (
              <ActionButton
                size="sm"
                tone="ghost"
                onPress={() => void cancelActionJob()}
              >
                Cancelar
              </ActionButton>
            )}
            <ActionButton
              size="sm"
              tone="ghost"
              onPress={() => setActionJob(null)}
            >
              Ocultar
            </ActionButton>
          </View>
        </View>
      )}

      {novel.chapters_empty > 0 && (
        <View className="mt-3 px-4">
          <Alert status="warning">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>
                {novel.chapters_empty}{" "}
                {novel.chapters_empty === 1 ? "capítulo vacío" : "capítulos vacíos"}
              </Alert.Title>
              <Alert.Description>
                nº {novel.chapters_empty_nums.join(", ")}
              </Alert.Description>
            </Alert.Content>
          </Alert>
        </View>
      )}

      {/* EPUBs generados */}
      <View className="gap-4 px-4 pt-6">
        <View className="gap-0.5">
          <Text className="t-section text-foreground">EPUBs generados</Text>
          <Text className="t-meta text-muted">
            Toca un tomo para descargarlo.
          </Text>
        </View>

        {renderEpubSection(
          "Original",
          novel.epub_original,
          "original",
          false,
        )}
        {renderEpubSection(
          "Traducidos",
          novel.epub_translated,
          "translated",
          true,
        )}
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
              <ActionButton
                tone="ghost"
                size="sm"
                onPress={() => setSyncOpen(false)}
              >
                Cancelar
              </ActionButton>
              <ActionButton size="sm" onPress={() => void runSync()}>
                Sincronizar
              </ActionButton>
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
              <BottomSheet.Title className="t-section text-foreground">
                Retraducir
              </BottomSheet.Title>
              <Text className="t-meta text-muted">
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

            <ActionButton
              onPress={() => void runRetranslate()}
              loading={actionBusy === "retranslate"}
            >
              Retraducir
            </ActionButton>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      {/* Tamaño de tomo: síncrono, sin job */}
      <BottomSheet isOpen={volumeOpen} onOpenChange={setVolumeOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content contentContainerClassName="gap-5 px-5 pb-10 pt-5">
            <View className="gap-1">
              <BottomSheet.Title className="t-section text-foreground">
                Tamaño de tomo
              </BottomSheet.Title>
              <Text className="t-meta text-muted">
                Regenera todos los EPUB con el tamaño elegido.
              </Text>
            </View>

            <View className="gap-2">
              {volumeSizeOptions(true).map((option) => (
                <ActionButton
                  key={option.value}
                  size="sm"
                  tone={
                    novel.volume_size === option.size ? "primary" : "secondary"
                  }
                  onPress={() => void runVolumeSize(option.size)}
                  loading={actionBusy === "volume"}
                >
                  {option.label}
                </ActionButton>
              ))}
            </View>

            <Text className="t-meta text-muted">
              Cambiar el tamaño regenera los tomos en el servidor; puede tardar.
            </Text>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </ScrollView>
  );
}
