import { useCallback, useEffect, useRef, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { useToast } from "heroui-native/toast";
import { ApiError, isHttpUrl } from "@/lib/api";
import { useApi } from "@/lib/api-provider";
import { PAGE_CONTENT } from "@/lib/layout";
import { pollJob } from "@/lib/jobs";
import type { LastJobOptions } from "@/lib/settings";
import { loadSettings, updateSettings } from "@/lib/settings";
import type { JobRequest, JobState, UploadPdfRequest } from "@/lib/types";
import { AdvancedOptionsSheet } from "@/components/download/advanced-options-sheet";
import { JobsCard } from "@/components/download/jobs-card";
import { PdfForm, type PdfFileInfo } from "@/components/download/pdf-form";
import { WebForm } from "@/components/download/web-form";
import { AppBar } from "@/components/app-bar";
import { SegmentedField } from "@/components/segmented-field";
import type { JobLike } from "@/components/job-row";
import { isActiveState } from "@/components/job-row";
import { Screen } from "@/components/screen";

const CONCURRENCY_MIN = 1;
const CONCURRENCY_MAX = 8;

type PdfKind = "auto" | "book" | "webnovel";
type JobItem = JobLike;

const UUID_FILENAME_RE =
  /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;

/** Título propuesto a partir del nombre real; vacío si es un UUID de caché. */
function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.pdf$/i, "").trim();
  return UUID_FILENAME_RE.test(base) ? "" : base;
}

/**
 * Pantalla Descargar (spec 0.4.0-03): contenedor y dueño del estado; el
 * formulario web/PDF, opciones y trabajos viven en `components/download/`.
 */
export default function DownloadScreen() {
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
  const [pdfFile, setPdfFile] = useState<PdfFileInfo | null>(null);
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

  // Rehidrata las opciones del último job.
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
      // Solo error inline (el toast duplicaba el mensaje y tapaba el título).
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

  const removePdf = useCallback(() => {
    setPdfFile(null);
    setPdfTitle("");
    setPdfAuthor("");
    setPdfKind("auto");
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
      removePdf();
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
    removePdf,
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
        <AppBar title="Descargar" />
        <ScrollView
          className="flex-1"
          contentContainerClassName={`${PAGE_CONTENT} gap-6 px-4 pb-12`}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Text className="text-[14px] leading-5 text-muted">
            Pega la URL de la novela o sube un PDF.
          </Text>

          <SegmentedField
            value={source}
            onChange={(value: string) => setSource(value === "pdf" ? "pdf" : "web")}
            options={[
              { value: "web", label: "Web" },
              { value: "pdf", label: "PDF" },
            ]}
          />

          {source === "web" ? (
            <WebForm
              url={url}
              onUrlChange={(value) => {
                setUrl(value);
                if (urlError && isHttpUrl(value.trim())) setUrlError(false);
              }}
              urlError={urlError}
              submitting={busy}
              onSubmit={() => void submitWeb()}
              translate={translate}
              onTranslateChange={setTranslate}
              targetLang={targetLang}
              onTargetLangChange={setTargetLang}
              advancedCount={advancedCount}
              onOpenAdvanced={() => setOptionsOpen(true)}
            />
          ) : (
            <PdfForm
              file={pdfFile}
              onPickFile={() => void pickPdf()}
              onRemoveFile={removePdf}
              submitting={busy}
              onSubmit={() => void submitPdf()}
              title={pdfTitle}
              onTitleChange={setPdfTitle}
              author={pdfAuthor}
              onAuthorChange={setPdfAuthor}
              kind={pdfKind}
              onKindChange={setPdfKind}
              sourceLang={pdfSourceLang}
              onSourceLangChange={setPdfSourceLang}
              volume={volume}
              onVolumeChange={setVolume}
              translate={translate}
              onTranslateChange={setTranslate}
              targetLang={targetLang}
              onTargetLangChange={setTargetLang}
            />
          )}

          <View className="gap-2">
            <View className="flex-row items-center justify-between px-1">
              <Text className="t-section text-foreground">
                Trabajos de esta sesión
              </Text>
              {jobs.length > 0 && (
                <Text className="t-meta text-muted [font-variant-numeric:tabular-nums]">
                  {jobs.length}/10
                </Text>
              )}
            </View>
            <JobsCard jobs={jobs} onCancel={cancelJob} onDismiss={dismissJob} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AdvancedOptionsSheet
        isOpen={optionsOpen}
        onOpenChange={setOptionsOpen}
        volume={volume}
        onVolumeChange={setVolume}
        concurrency={concurrency}
        onConcurrencyStep={stepConcurrency}
        concurrencyMin={CONCURRENCY_MIN}
        concurrencyMax={CONCURRENCY_MAX}
        all={all}
        onAllChange={setAll}
        pending={pending}
        onPendingChange={setPending}
        force={force}
        onForceChange={setForce}
        playwright={playwright}
        onPlaywrightChange={setPlaywright}
        onReset={resetOptions}
      />
    </Screen>
  );
}
