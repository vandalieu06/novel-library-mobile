import { useCallback } from "react";
import { View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Skeleton } from "heroui-native/skeleton";
import { WIDE_CONTENT } from "@/lib/layout";
import { useNovelDetail } from "@/lib/novel-detail";
import { ActionButton } from "@/components/action-button";
import { DetailActionsMenu } from "@/components/detail-actions-menu";
import { DetailContent } from "@/components/detail-content";
import { DetailSheets } from "@/components/detail-sheets";
import { EmptyState } from "@/components/empty-state";

export default function NovelScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const detail = useNovelDetail({
    slug: typeof slug === "string" ? slug : "",
  });
  const {
    novel,
    cover,
    isLoading,
    error,
    preferredLanguage,
    rowStates,
    bulk,
    actionJob,
    actionBusy,
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

  /** Overflow del header nativo: acciones secundarias del detalle. */
  const headerRight = useCallback(
    () => (
      <DetailActionsMenu
        onRetranslate={openRetranslate}
        onVolumeSize={() => setVolumeOpen(true)}
      />
    ),
    [openRetranslate, setVolumeOpen],
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <Stack.Screen options={{ title: "Detalle" }} />
        <View className={`${WIDE_CONTENT} px-4 pt-2`}>
          <View className="flex-row gap-4 pb-5">
            <Skeleton className="h-48 w-32 rounded-lg" />
            <View className="flex-1 gap-2 pt-1">
              <Skeleton className="h-7 w-full rounded-md" />
              <Skeleton className="h-7 w-3/5 rounded-md" />
              <Skeleton className="h-4 w-28 rounded-md" />
            </View>
          </View>
          <View className="gap-2">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </View>
        </View>
      </View>
    );
  }

  if (error !== null || novel === null || cover === null) {
    return (
      <View className="flex-1 justify-center bg-background px-4">
        <Stack.Screen options={{ title: "Detalle" }} />
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
              <ActionButton
                size="sm"
                tone="ghost"
                onPress={() =>
                  router.canGoBack() ? router.back() : router.replace("/")
                }
              >
                Volver
              </ActionButton>
            </View>
          }
        />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Detalle", headerRight }} />

      <DetailContent
        novel={novel}
        cover={cover}
        preferredLanguage={preferredLanguage}
        rowStates={rowStates}
        bulk={bulk}
        actionJob={actionJob}
        actionLoading={actionBusy === "sync"}
        onSync={() => void runSync()}
        onDownload={(filename) => void download(filename)}
        onDownloadAll={(files, list) => void downloadAll(files, list)}
        onCancelJob={() => void cancelActionJob()}
        onDismissJob={dismissActionJob}
      />

      <DetailSheets
        retranslateOpen={retranslateOpen}
        onRetranslateOpenChange={setRetranslateOpen}
        volumeOpen={volumeOpen}
        onVolumeOpenChange={setVolumeOpen}
        selectedLanguageOption={selectedLanguageOption}
        languageChoices={languageChoices}
        onLanguageChange={setSelectedLanguage}
        actionBusy={actionBusy}
        volumeSize={novel.volume_size}
        onRetranslate={() => void runRetranslate()}
        onVolumeSize={(size) => void runVolumeSize(size)}
      />
    </>
  );
}
