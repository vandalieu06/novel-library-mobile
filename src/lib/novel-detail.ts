import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "heroui-native/toast";
import { ApiError } from "@/lib/api";
import { useApi } from "@/lib/api-provider";
import { resolveCover, type CoverSource } from "@/lib/covers";
import { openEpub, saveEpub } from "@/lib/downloads";
import { pollJob } from "@/lib/jobs";
import {
  TRANSLATE_OPTIONS,
  type VolumeList,
} from "@/lib/languages";
import type { JobState, Novel } from "@/lib/types";

export type ActionKind = "sync" | "retranslate" | "volume";
export type VolumeState = "idle" | "downloading" | "ok" | "error";
export type { VolumeList } from "@/lib/languages";

export interface ActionJob {
  /** `null` cuando la acción es local y no genera un job del backend. */
  id: string | null;
  kind: ActionKind;
  state: JobState;
  error: string | null;
}

export interface BulkDownload {
  list: VolumeList;
  done: number;
  total: number;
}

interface UseNovelDetailOptions {
  slug: string;
  /** Datos ya cargados (panel de tablet); evita un fetch inicial. */
  initialNovel?: Novel;
}

/**
 * Estado y acciones del detalle de novela (spec 0.4.0-04), compartidos por la
 * pantalla de teléfono y el panel compacto de tablet (06). No pinta UI: los
 * sheets y el header viven en cada consumidor.
 */
export function useNovelDetail({
  slug,
  initialNovel,
}: UseNovelDetailOptions) {
  const { toast } = useToast();
  const { api, settings } = useApi();

  const [novel, setNovel] = useState<Novel | null>(initialNovel ?? null);
  const [isLoading, setIsLoading] = useState(initialNovel === undefined);
  const [error, setError] = useState<string | null>(null);
  const [rowStates, setRowStates] = useState<Record<string, VolumeState>>({});
  const [bulk, setBulk] = useState<BulkDownload | null>(null);

  const [retranslateOpen, setRetranslateOpen] = useState(false);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("es");
  const [actionBusy, setActionBusy] = useState<ActionKind | null>(null);
  const [actionJob, setActionJob] = useState<ActionJob | null>(null);
  const actionAbort = useRef<AbortController | null>(null);

  useEffect(() => () => actionAbort.current?.abort(), []);

  const load = useCallback(
    async (showSkeleton = true) => {
      if (slug === "") return;
      if (showSkeleton) setIsLoading(true);
      try {
        setNovel(await api.getNovel(slug));
        setError(null);
      } catch (caught) {
        if (caught instanceof ApiError && caught.status === 401) {
          setError("Token inválido. Revisa el token en Ajustes.");
        } else {
          setError(
            caught instanceof ApiError ? caught.message : "Error inesperado",
          );
        }
      } finally {
        if (showSkeleton) setIsLoading(false);
      }
    },
    [slug, api],
  );

  useEffect(() => {
    if (initialNovel !== undefined) return;
    // Carga inicial de datos (patrón fetch-on-mount estándar en RN; la regla
    // react-hooks/set-state-in-effect lo marca por conservadurismo).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [initialNovel, load]);

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
    async (jobId: string, kind: ActionKind) => {
      actionAbort.current?.abort();
      const controller = new AbortController();
      actionAbort.current = controller;
      setActionJob({ id: jobId, kind, state: "pending", error: null });
      try {
        const job = await pollJob(api, jobId, {
          signal: controller.signal,
          onUpdate: (update) =>
            setActionJob({
              id: jobId,
              kind,
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
        setActionJob({ id: jobId, kind, state: "error", error: message });
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
    setActionBusy("sync");
    try {
      const { job_id } = await api.syncNovel(novel.slug);
      void followJob(job_id, "sync");
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
      const { job_id } = await api.retranslateNovel(
        novel.slug,
        selectedLanguage,
      );
      void followJob(job_id, "retranslate");
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
      setActionJob({ id: null, kind: "volume", state: "running", error: null });
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
        setActionJob({ id: null, kind: "volume", state: "done", error: null });
        toast.show({
          variant: "success",
          label: "Tomos regenerados",
          description:
            result.volume_size === null
              ? "Sin división por tomos"
              : `${result.volume_size} capítulos por tomo`,
        });
      } catch (caught) {
        setActionJob({
          id: null,
          kind: "volume",
          state: "error",
          error: caught instanceof ApiError ? caught.message : "Error inesperado",
        });
      } finally {
        setActionBusy(null);
      }
    },
    [novel, api, toast],
  );

  const cancelActionJob = useCallback(async () => {
    if (
      actionJob === null ||
      actionJob.id === null ||
      !(actionJob.state === "pending" || actionJob.state === "running")
    ) {
      return;
    }
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

  const dismissActionJob = useCallback(() => setActionJob(null), []);

  const cover: CoverSource = novel === null ? null : resolveCover(novel, settings);
  const languageChoices = TRANSLATE_OPTIONS.filter(
    (option) => option.value !== novel?.translated_language,
  );
  const selectedLanguageOption =
    languageChoices.find((option) => option.value === selectedLanguage) ??
    languageChoices[0];

  return {
    novel,
    cover,
    preferredLanguage: settings.preferredLanguage,
    isLoading,
    error,
    rowStates,
    bulk,
    retranslateOpen,
    setRetranslateOpen,
    volumeOpen,
    setVolumeOpen,
    selectedLanguage,
    setSelectedLanguage,
    languageChoices,
    selectedLanguageOption,
    actionBusy,
    actionJob,
    load,
    download,
    downloadAll,
    runSync,
    openRetranslate,
    runRetranslate,
    runVolumeSize,
    cancelActionJob,
    dismissActionJob,
  };
}
