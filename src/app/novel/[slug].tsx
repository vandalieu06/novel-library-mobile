import { useCallback, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "heroui-native/button";
import { Chip } from "heroui-native/chip";
import { Skeleton } from "heroui-native/skeleton";
import { useToast } from "heroui-native/toast";
import { api, ApiError } from "@/lib/api";
import { coverSource } from "@/lib/mock/data";
import type { Novel } from "@/lib/types";
import { BackBar } from "@/components/back-bar";
import { ProgressBar } from "@/components/progress-bar";

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
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyFilename, setBusyFilename] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (typeof slug !== "string" || slug === "") return;
    try {
      setNovel(await api.getNovel(slug));
    } catch (error) {
      toast.show({
        variant: "danger",
        label: error instanceof ApiError ? error.message : "Error inesperado",
      });
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [slug, router, toast]);

  useEffect(() => {
    // Carga inicial de datos (patrón fetch-on-mount estándar en RN; la regla
    // react-hooks/set-state-in-effect lo marca por conservadurismo).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const download = useCallback(
    async (filename: string) => {
      if (novel === null) return;
      setBusyFilename(filename);
      try {
        await api.downloadEpub(novel.slug, filename);
        toast.show({
          variant: "success",
          label: "Descarga lanzada (mock)",
          description: filename,
        });
      } catch (error) {
        toast.show({
          variant: "danger",
          label: error instanceof ApiError ? error.message : "Descarga fallida",
        });
      } finally {
        setBusyFilename(null);
      }
    },
    [novel, toast],
  );

  if (isLoading || novel === null) {
    return (
      <View className="flex-1 gap-4 bg-background" style={{ paddingTop: insets.top }}>
        <BackBar onBack={() => router.back()} />
        <Skeleton className="h-56 w-full rounded-lg" />
        <Skeleton className="h-4 w-48 rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
      </View>
    );
  }

  const cover = coverSource(novel.slug);
  const downloadedPct =
    novel.chapters_total > 0 ? novel.chapters_downloaded / novel.chapters_total : 0;
  const translatedPct =
    novel.chapters_total > 0 ? novel.chapters_translated / novel.chapters_total : 0;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="pb-12"
      style={{ paddingTop: insets.top }}
    >
      <BackBar onBack={() => router.back()} />

      {/* Hero */}
      <View className="flex-row gap-4 px-4 py-3">
        <Image
          source={cover ?? undefined}
          resizeMode="cover"
          className="h-56 w-40 rounded-lg bg-surface-tertiary"
        />
        <View className="flex-1 gap-1.5">
          <Text className="text-xl font-bold leading-tight text-foreground">
            {novel.title}
          </Text>
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
            <View
              key={filename}
              className="flex-row items-center gap-3 rounded-lg border border-separator bg-surface px-3 py-2"
            >
              <Ionicons name="book-outline" size={18} color="#a1a1aa" />
              <Text numberOfLines={1} className="flex-1 text-sm text-foreground">
                {epubLabel(novel, filename)}
              </Text>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => void download(filename)}
                isDisabled={busyFilename !== null}
              >
                <Button.Label>Descargar</Button.Label>
              </Button>
            </View>
          ))}
        </View>

        <View className="mt-3 gap-1.5">
          <Text className="text-sm font-semibold text-muted">Traducidos (ES)</Text>
          {novel.epub_translated.map((filename) => (
            <View
              key={filename}
              className="flex-row items-center gap-3 rounded-lg border border-separator bg-surface px-3 py-2"
            >
              <Ionicons name="language-outline" size={18} color="#a1a1aa" />
              <Text numberOfLines={1} className="flex-1 text-sm text-foreground">
                {epubLabel(novel, filename)}
              </Text>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => void download(filename)}
                isDisabled={busyFilename !== null}
              >
                <Button.Label>Descargar</Button.Label>
              </Button>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
