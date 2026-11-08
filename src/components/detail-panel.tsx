import { Text, View } from "react-native";
import { Skeleton } from "heroui-native/skeleton";
import { PANEL_WIDTH } from "@/lib/layout";
import { useNovelDetail } from "@/lib/novel-detail";
import type { Novel } from "@/lib/types";
import { ActionButton } from "@/components/action-button";
import { DetailActionsMenu } from "@/components/detail-actions-menu";
import { DetailContent } from "@/components/detail-content";
import { DetailSheets } from "@/components/detail-sheets";
import { EmptyState } from "@/components/empty-state";

interface DetailPanelProps {
  slug: string;
  /** Datos de la biblioteca para evitar el primer fetch. */
  initialNovel?: Novel;
}

/**
 * Panel de detalle de tablet (spec 0.4.0-06): 340 de ancho, `DetailContent`
 * compacto y las mismas acciones que la pantalla completa. La selección vive
 * en Biblioteca; este componente se remonta al cambiar de novela.
 */
export function DetailPanel({ slug, initialNovel }: DetailPanelProps) {
  const detail = useNovelDetail({ slug, initialNovel });
  const {
    novel,
    cover,
    preferredLanguage,
    isLoading,
    error,
    rowStates,
    bulk,
    actionJob,
    actionBusy,
    actionsBlocked,
    retranslateOpen,
    setRetranslateOpen,
    volumeOpen,
    setVolumeOpen,
    selectedLanguageOption,
    setSelectedLanguage,
    languageChoices,
    load,
    download,
    downloadAll,
    runSync,
    openRetranslate,
    runRetranslate,
    runVolumeSize,
    cancelActionJob,
    dismissActionJob,
  } = detail;

  return (
    <View
      className="border-l border-border bg-background"
      style={{ width: PANEL_WIDTH }}
    >
      <View className="h-12 flex-row items-center gap-2 px-2">
        <Text className="t-label flex-1 pl-2 text-muted">Detalle</Text>
        <DetailActionsMenu
          onRetranslate={openRetranslate}
          onVolumeSize={() => setVolumeOpen(true)}
        />
      </View>

      {isLoading ? (
        <View className="gap-4 px-4 pt-2">
          <View className="flex-row gap-4 pb-3">
            <Skeleton className="h-[156px] w-[104px] rounded-lg" />
            <View className="flex-1 gap-2 pt-1">
              <Skeleton className="h-6 w-full rounded-md" />
              <Skeleton className="h-6 w-2/3 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md" />
            </View>
          </View>
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-11 w-full rounded-3xl" />
        </View>
      ) : error !== null || novel === null || cover === null ? (
        <View className="flex-1 justify-center px-4">
          <EmptyState
            icon="cloud-offline-outline"
            title="No se pudo cargar la novela"
            description={error ?? "Novela no encontrada"}
            action={
              <ActionButton size="sm" tone="secondary" onPress={() => void load()}>
                Reintentar
              </ActionButton>
            }
          />
        </View>
      ) : (
        <DetailContent
          compact
          novel={novel}
          cover={cover}
          preferredLanguage={preferredLanguage}
          rowStates={rowStates}
          bulk={bulk}
          actionJob={actionJob}
          actionLoading={actionBusy === "sync"}
          actionsBlocked={actionsBlocked}
          onSync={() => void runSync()}
          onDownload={(filename) => void download(filename)}
          onDownloadAll={(files, list) => void downloadAll(files, list)}
          onCancelJob={() => void cancelActionJob()}
          onDismissJob={dismissActionJob}
        />
      )}

      <DetailSheets
        retranslateOpen={retranslateOpen}
        onRetranslateOpenChange={setRetranslateOpen}
        volumeOpen={volumeOpen}
        onVolumeOpenChange={setVolumeOpen}
        selectedLanguageOption={selectedLanguageOption}
        languageChoices={languageChoices}
        onLanguageChange={setSelectedLanguage}
        actionBusy={actionBusy}
        actionsBlocked={actionsBlocked}
        volumeSize={novel?.volume_size ?? null}
        onRetranslate={() => void runRetranslate()}
        onVolumeSize={(size) => void runVolumeSize(size)}
      />
    </View>
  );
}
