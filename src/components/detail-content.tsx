import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Alert } from "heroui-native/alert";
import type { CoverSource } from "@/lib/covers";
import { preferredVolumeList, volumeListOptions } from "@/lib/languages";
import { WIDE_CONTENT } from "@/lib/layout";
import type {
  ActionJob,
  ActionKind,
  BulkDownload,
  VolumeList,
  VolumeState,
} from "@/lib/novel-detail";
import type { Novel } from "@/lib/types";
import { ActionButton } from "@/components/action-button";
import { CoverImage } from "@/components/cover-image";
import { JobRow } from "@/components/job-row";
import { ListCard } from "@/components/list-card";
import { ProgressBar, type ProgressTone } from "@/components/progress-bar";
import { SegmentedField } from "@/components/segmented-field";
import { VolumeEmpty, VolumeRow } from "@/components/volume-row";

export type {
  ActionJob,
  ActionKind,
  BulkDownload,
  VolumeList,
} from "@/lib/novel-detail";

const ACTION_LABELS: Record<ActionKind, string> = {
  sync: "Sincronizar",
  retranslate: "Retraducir",
  volume: "Tamaño de tomo",
};

/**
 * Etiqueta corta de un tomo: el rango final del nombre
 * ("Inner Voice ... 1-100.epub" → "1–100"). Si no hay rango, quita el título
 * de la novela y la extensión como antes.
 */
export function epubLabel(novel: Novel, filename: string): string {
  // Los traducidos añaden el idioma al final: "... 1-100 (ES).epub".
  const base = filename
    .replace(/\.epub$/i, "")
    .replace(/\s*\([^)]*\)\s*$/, "");
  const range = /(\d+)\s*[-–—]\s*(\d+)\s*$/.exec(base);
  if (range !== null) return `${range[1]}–${range[2]}`;

  const prefix = novel.title.length > 0 ? `${novel.title} ` : "";
  const label = base.startsWith(prefix) ? base.slice(prefix.length) : base;
  return label.length > 0 ? label : filename;
}

interface ProgressRowProps {
  label: string;
  current: number;
  total: number;
  tone: ProgressTone;
}

/** Fila de 56 con etiqueta, cifra tabular y barra de 4 px (spec 0.4.0-04). */
function ProgressRow({ label, current, total, tone }: ProgressRowProps) {
  const value = total > 0 ? current / total : 0;
  return (
    <View className="min-h-14 justify-center gap-2 px-4 py-2.5">
      <View className="flex-row items-baseline justify-between gap-2">
        <Text className="t-meta text-muted">{label}</Text>
        <Text className="t-label text-foreground [font-variant-numeric:tabular-nums]">
          {current} / {total}
        </Text>
      </View>
      <ProgressBar value={value} tone={tone} />
    </View>
  );
}

interface DetailContentProps {
  novel: Novel;
  cover: CoverSource;
  /** Idioma preferido global (`original` o código, spec 0.4.0-08). */
  preferredLanguage: string;
  /** Panel de tablet (0.4.0-06): medidas reducidas y solo tres tomos. */
  compact?: boolean;
  rowStates: Record<string, VolumeState>;
  bulk: BulkDownload | null;
  actionJob: ActionJob | null;
  actionLoading?: boolean;
  onSync: () => void;
  onDownload: (filename: string) => void;
  onDownloadAll: (files: string[], list: VolumeList) => void;
  onCancelJob: () => void;
  onDismissJob: () => void;
}

/**
 * Cuerpo del detalle de novela (spec 0.4.0-04), compartido entre la pantalla
 * de teléfono y el panel de tablet. El header nativo, los sheets y la carga de
 * datos viven en `novel/[slug].tsx`.
 */
export function DetailContent({
  novel,
  cover,
  preferredLanguage,
  compact = false,
  rowStates,
  bulk,
  actionJob,
  actionLoading = false,
  onSync,
  onDownload,
  onDownloadAll,
  onCancelJob,
  onDismissJob,
}: DetailContentProps) {
  const [selectedList, setSelectedList] = useState<VolumeList>(() =>
    preferredVolumeList(novel, preferredLanguage),
  );

  const meta = [
    novel.source_pdf ? "PDF" : "Web",
    novel.volume_size !== null ? `${novel.volume_size} por tomo` : null,
    novel.translated_language !== null
      ? novel.translated_language.toUpperCase()
      : null,
  ]
    .filter((part): part is string => part !== null)
    .join(" · ");

  const maxVolumes = compact ? 3 : undefined;
  const listOptions = volumeListOptions(novel);
  const selectedAvailable =
    selectedList === "original"
      ? novel.epub_original.length > 0
      : novel.epub_translated.length > 0;
  const effectiveList = selectedAvailable
    ? selectedList
    : preferredVolumeList(novel, preferredLanguage);
  const visibleFiles =
    effectiveList === "original"
      ? novel.epub_original
      : novel.epub_translated;

  const renderVolumeSection = (
    title: string,
    files: string[],
    list: VolumeList,
  ) => {
    const visible =
      maxVolumes === undefined ? files : files.slice(0, maxVolumes);
    const busy = bulk?.list === list;

    return (
      <View className="gap-2">
        <View className="flex-row items-center justify-between gap-3">
          <Text numberOfLines={1} className="t-section flex-1 text-foreground">
            {title} · {files.length}
          </Text>
          {files.length > 0 && (
            <ActionButton
              tone="ghost"
              size="sm"
              onPress={() => onDownloadAll(files, list)}
              loading={busy}
            >
              {bulk !== null && bulk.list === list
                ? `${bulk.done}/${bulk.total}`
                : "Descargar todo"}
            </ActionButton>
          )}
        </View>
        <ListCard>
          {visible.length === 0 ? (
            <VolumeEmpty label="Aún no hay tomos generados." />
          ) : (
            visible.map((filename) => (
              <VolumeRow
                key={filename}
                label={epubLabel(novel, filename)}
                filename={filename}
                translated={list === "translated"}
                state={rowStates[filename] ?? "idle"}
                onPress={() => onDownload(filename)}
              />
            ))
          )}
        </ListCard>
      </View>
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName={`${compact ? "w-full" : WIDE_CONTENT} pb-12`}
    >
      <View className="px-4 pt-2">
        {/* Hero */}
        <View
          className={
            compact
              ? "flex-col gap-3 pb-5"
              : "flex-row gap-4 pb-5"
          }
        >
          <CoverImage
            source={cover}
            className={`${
              compact ? "h-[156px] w-[104px]" : "h-[192px] w-[128px]"
            } flex-none rounded-lg bg-surface-tertiary`}
          />
          <View className="min-w-0 flex-1">
            <Text
              numberOfLines={compact ? 3 : 4}
              className={
                compact
                  ? "text-[18px] font-medium leading-[23px] text-foreground"
                  : "t-page text-foreground"
              }
            >
              {novel.title}
            </Text>
            <Text className="text-[14px] leading-5 text-muted">
              {novel.author ?? "Autor desconocido"}
            </Text>
            <Text className="mt-2 t-meta text-muted">{meta}</Text>
          </View>
        </View>

        {/* Progreso */}
        <ListCard>
          <ProgressRow
            label="Descargados"
            current={novel.chapters_downloaded}
            total={novel.chapters_total}
            tone="accent"
          />
          <ProgressRow
            label="Traducidos"
            current={novel.chapters_translated}
            total={novel.chapters_total}
            tone="success"
          />
        </ListCard>

        {/* Acción principal */}
        <View className="mt-4">
          <ActionButton
            className="w-full"
            size={compact ? "sm" : "md"}
            onPress={onSync}
            loading={actionLoading}
          >
            Sincronizar
          </ActionButton>
        </View>

        {/* Job de la acción: inline, sin Alert */}
        {actionJob !== null && (
          <View className="mt-3">
            <ListCard>
              <JobRow
                job={{
                  id: actionJob.id,
                  state: actionJob.state,
                  error: actionJob.error,
                }}
                title={ACTION_LABELS[actionJob.kind]}
                onCancel={onCancelJob}
                onDismiss={onDismissJob}
              />
            </ListCard>
          </View>
        )}

        {novel.chapters_empty > 0 && (
          <View className="mt-3">
            <Alert status="warning">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>
                  {novel.chapters_empty}{" "}
                  {novel.chapters_empty === 1
                    ? "capítulo vacío"
                    : "capítulos vacíos"}
                </Alert.Title>
                <Alert.Description>
                  nº {novel.chapters_empty_nums.join(", ")}
                </Alert.Description>
              </Alert.Content>
            </Alert>
          </View>
        )}

        {/* Tomos: una versión cada vez (spec 0.4.0-08) */}
        <View className="mt-6 gap-4">
          {listOptions !== null && (
            <SegmentedField
              value={effectiveList}
              options={listOptions}
              onChange={(value) => setSelectedList(value as VolumeList)}
            />
          )}
          {renderVolumeSection("Tomos", visibleFiles, effectiveList)}
        </View>
      </View>
    </ScrollView>
  );
}
