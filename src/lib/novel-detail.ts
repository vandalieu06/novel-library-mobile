import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "heroui-native/toast";
import { ApiError } from "@/lib/api";
import { useApi } from "@/lib/api-provider";
import { resolveCover, type CoverSource } from "@/lib/covers";
import { clearEpubs, openEpub, saveEpub } from "@/lib/downloads";
import {
  CONFLICT_MESSAGE,
  isActiveState,
  isCancellableState,
  pollJob,
  RESUME_MESSAGE,
} from "@/lib/jobs";
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

/** Firma de tomos: detecta reparaciones/regeneraciones con el mismo slug. */
function epubSignature(novel: Novel): string {
  return JSON.stringify({
    original: novel.epub_original,
    translated: novel.epub_translated,
    volume: novel.volume_size,
  });
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

  // `followJob` necesita la novela vigente sin recrearse en cada render.
  const novelRef = useRef<Novel | null>(novel);
  useEffect(() => {
    novelRef.current = novel;
  }, [novel]);

  useEffect(() => () => actionAbort.current?.abort(), []);

  const load = useCallback(
    async (showSkeleton = true): Promise<Novel | null> => {
      if (slug === "") return null;
      if (showSkeleton) setIsLoading(true);
      try {
        const next = await api.getNovel(slug);
        setNovel(next);
        novelRef.current = next;
        setError(null);
        return next;
      } catch (caught) {
        if (caught instanceof ApiError && caught.status === 401) {
          setError("Token inválido. Revisa el token en Ajustes.");
        } else {
          setError(
            caught instanceof ApiError ? caught.message : "Error inesperado",
          );
        }
        return null;
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

  /**
   * Sigue el job de una acción. Al terminar en `done` refresca la ficha y, si
   * cambió la firma de tomos, limpia la caché local del slug (0.4.0-09).
   */
  const followJob = useCallback(
    async (jobId: string, kind: ActionKind) => {
      actionAbort.current?.abort();
      const controller = new AbortController();
      actionAbort.current = controller;
      setActionJob({ id: jobId, kind, state: "pending", error: null });
      const before =
        novelRef.current !== null ? epubSignature(novelRef.current) : null;
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
          const updated = await load(false);
          const changed =
            updated !== null &&
            before !== null &&
            epubSignature(updated) !== before;
          if (changed && updated !== null) {
            clearEpubs(slug);
            setRowStates({});
            const volumes =
              updated.epub_original.length + updated.epub_translated.length;
            toast.show({
              variant: "success",
              label: "Novela reparada",
              description: `${updated.chapters_total} capítulos y ${volumes} tomos disponibles. Vuelve a descargar los EPUBs.`,
            });
          } else {
            toast.show({
              variant: "success",
              label: "Acción completada",
              description: job.slug ?? job.id,
            });
          }
        } else if (job.state === "error") {
          toast.show({
            variant: "danger",
            label: "La acción falló",
            description: job.error ?? undefined,
          });
        } else if (job.state === "cancelled") {
          toast.show({
            variant: "warning",
            label: "Acción cancelada",
            description: RESUME_MESSAGE,
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
    [api, load, slug, toast],
  );

  /** 409 con `job_id` → adjuntarse al job existente; nunca reintentar. */
  const followConflict = useCallback(
    (caught: ApiError, kind: ActionKind): boolean => {
      if (caught.status !== 409) return false;
      if (typeof caught.jobId === "string" && caught.jobId !== "") {
        toast.show({
          variant: "warning",
          label: "Ya hay una descarga en curso",
          description: CONFLICT_MESSAGE,
        });
        void followJob(caught.jobId, kind);
      } else {
        toast.show({
          variant: "warning",
          label: "Hay un job en curso",
          description: caught.message,
        });
      }
      return true;
    },
    [followJob, toast],
  );

  const actionsBlocked =
    actionJob !== null && isActiveState(actionJob.state);

  const runSync = useCallback(async () => {
    if (novel === null || actionsBlocked) return;
    setActionBusy("sync");
    try {
      const { job_id } = await api.syncNovel(novel.slug);
      void followJob(job_id, "sync");
    } catch (caught) {
      if (caught instanceof ApiError && followConflict(caught, "sync")) return;
      showActionError(caught);
    } finally {
      setActionBusy(null);
    }
  }, [novel, api, followJob, followConflict, showActionError, actionsBlocked]);

  const openRetranslate = useCallback(() => {
    if (novel === null) return;
    if (actionsBlocked) {
      toast.show({
        variant: "warning",
        label: "Hay una acción en curso",
        description: "Espera a que termine o cancélala.",
      });
      return;
    }
    setSelectedLanguage(novel.translated_language === "es" ? "en" : "es");
    setRetranslateOpen(true);
  }, [novel, actionsBlocked, toast]);

  const runRetranslate = useCallback(async () => {
    if (novel === null || actionsBlocked) return;
    setRetranslateOpen(false);
    setActionBusy("retranslate");
    try {
      const { job_id } = await api.retranslateNovel(
        novel.slug,
        selectedLanguage,
      );
      void followJob(job_id, "retranslate");
    } catch (caught) {
      if (
        caught instanceof ApiError &&
        followConflict(caught, "retranslate")
      ) {
        return;
      }
      showActionError(caught);
    } finally {
      setActionBusy(null);
    }
  }, [
    novel,
    selectedLanguage,
    api,
    followJob,
    followConflict,
    showActionError,
    actionsBlocked,
  ]);

  const runVolumeSize = useCallback(
    async (size: number | null) => {
      if (novel === null || actionsBlocked) return;
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
        // Los nombres/rangos de tomo cambian: los EPUB locales ya no valen.
        clearEpubs(slug);
        setRowStates({});
        setActionJob({ id: null, kind: "volume", state: "done", error: null });
        toast.show({
          variant: "success",
          label: "Tomos regenerados",
          description: `${
            result.volume_size === null
              ? "Sin división por tomos"
              : `${result.volume_size} capítulos por tomo`
          }. Vuelve a descargar los EPUBs.`,
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
    [novel, api, toast, slug, actionsBlocked],
  );

  const cancelActionJob = useCallback(async () => {
    if (
      actionJob === null ||
      actionJob.id === null ||
      !isCancellableState(actionJob.state)
    ) {
      return;
    }
    const jobId = actionJob.id;
    try {
      const result = await api.cancelJob(jobId);
      if (result.state === "cancelling") {
        // No terminal: se mantiene el polling hasta `cancelled`.
        setActionJob({ ...actionJob, state: "cancelling" });
        toast.show({
          variant: "warning",
          label: "Cancelando…",
          description: "El job se detendrá en cuanto termine el paso actual.",
        });
        return;
      }
      // Backend antiguo sin `state`: se asume cancelado.
      actionAbort.current?.abort();
      setActionJob({ ...actionJob, state: "cancelled" });
      toast.show({
        variant: "warning",
        label: "Acción cancelada",
        description: RESUME_MESSAGE,
      });
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 404) {
        // Job ya terminado o desaparecido: refrescar, sin inventar estado.
        try {
          const job = await api.getJob(jobId);
          setActionJob({
            id: jobId,
            kind: actionJob.kind,
            state: job.state,
            error: job.error,
          });
        } catch {
          setActionJob(null);
          toast.show({
            variant: "warning",
            label: "El job ya no existe",
            description: "Se ha quitado de la lista.",
          });
        }
        return;
      }
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
    actionsBlocked,
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
