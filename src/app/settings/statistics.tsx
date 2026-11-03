import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Skeleton } from "heroui-native/skeleton";
import { TagGroup } from "heroui-native/tag-group";
import { ApiError } from "@/lib/api";
import { useApi } from "@/lib/api-provider";
import { libraryStats } from "@/lib/stats";
import type { Novel } from "@/lib/types";
import { ActionButton } from "@/components/action-button";
import { PAGE_CONTENT } from "@/lib/layout";
import { EmptyState } from "@/components/empty-state";
import { ProgressBar } from "@/components/progress-bar";

const formatNumber = (value: number): string =>
  value.toLocaleString("es-ES");

function Legend({ colorClass, label }: { colorClass: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className={`h-2 w-2 rounded-full ${colorClass}`} />
      <Text className="t-meta text-muted">{label}</Text>
    </View>
  );
}

export default function StatisticsScreen() {
  const { api } = useApi();
  const router = useRouter();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setNovels(await api.getNovels());
      setError(null);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Error inesperado");
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    // Carga inicial de datos (patrón fetch-on-mount estándar en RN).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const stats = useMemo(() => libraryStats(novels), [novels]);
  const chaptersTotal = useMemo(
    () => novels.reduce((acc, novel) => acc + novel.chapters_total, 0),
    [novels],
  );
  const downloadedPct =
    chaptersTotal > 0
      ? Math.round((stats.chapters_downloaded / chaptersTotal) * 100)
      : 0;
  const translatedPct =
    chaptersTotal > 0
      ? Math.round((stats.chapters_translated / chaptersTotal) * 100)
      : 0;

  const languages = useMemo(() => {
    const counts = new Map<string, number>();
    novels.forEach((novel) => {
      if (novel.translated_language !== null) {
        counts.set(
          novel.translated_language,
          (counts.get(novel.translated_language) ?? 0) + 1,
        );
      }
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [novels]);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName={`${PAGE_CONTENT} gap-6 px-4 pb-12 pt-4`}
    >
      <Stack.Screen options={{ title: "Estadísticas" }} />

      {isLoading ? (
        <View className="gap-3">
          <Skeleton className="h-52 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </View>
      ) : error !== null ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="No se pudieron cargar las estadísticas"
          description={error}
          action={
            <ActionButton size="sm" tone="secondary" onPress={() => void load()}>
              Reintentar
            </ActionButton>
          }
        />
      ) : (
        <>
          {/* Bloque principal: una superficie dividida por hairlines */}
          <View className="overflow-hidden rounded-xl bg-surface">
            <View className="flex-row">
              <View className="flex-1 gap-1 border-b border-r border-separator p-4">
                <Text className="t-meta text-muted">Capítulos descargados</Text>
                <Text className="t-figure text-foreground [font-variant-numeric:tabular-nums]">
                  {formatNumber(stats.chapters_downloaded)}
                </Text>
                <Text className="t-meta text-muted">
                  de {formatNumber(chaptersTotal)} · {downloadedPct} %
                </Text>
              </View>
              <View className="flex-1 gap-1 border-b border-separator p-4">
                <Text className="t-meta text-muted">Traducidos</Text>
                <Text className="t-figure text-foreground [font-variant-numeric:tabular-nums]">
                  {formatNumber(stats.chapters_translated)}
                </Text>
                <View className="gap-1">
                  <Text className="t-meta text-muted">
                    {translatedPct} % de la biblioteca
                  </Text>
                  <ProgressBar
                    value={translatedPct / 100}
                    colorClass="bg-success"
                    className="h-1"
                  />
                </View>
              </View>
            </View>

            <View className="flex-row">
              <View className="flex-1 gap-1 border-r border-separator p-4">
                <Text className="t-meta text-muted">Novelas</Text>
                <Text className="t-card text-foreground [font-variant-numeric:tabular-nums]">
                  {stats.novels}
                </Text>
                <Text className="t-meta text-muted">
                  {stats.novels_web} web · {stats.novels_pdf} PDF
                </Text>
              </View>
              <View className="flex-1 gap-1 p-4">
                <Text className="t-meta text-muted">EPUBs</Text>
                <Text className="t-card text-foreground [font-variant-numeric:tabular-nums]">
                  {formatNumber(stats.epubs_total)}
                </Text>
                <Text className="t-meta text-muted">
                  {stats.epubs_original} originales ·{" "}
                  {stats.epubs_translated} traducidos
                </Text>
              </View>
            </View>
          </View>

          {/* Por origen: una barra de dos segmentos, no dos chips */}
          <View className="gap-2">
            <Text className="t-section text-foreground">Por origen</Text>
            {stats.novels === 0 ? (
              <Text className="t-meta text-muted">Sin novelas todavía.</Text>
            ) : (
              <>
                <View className="h-2 flex-row overflow-hidden rounded-full bg-surface-secondary">
                  <View
                    className="bg-foreground"
                    style={{ flex: stats.novels_web }}
                  />
                  <View className="bg-accent" style={{ flex: stats.novels_pdf }} />
                </View>
                <View className="flex-row gap-4">
                  <Legend
                    colorClass="bg-foreground"
                    label={`Web ${stats.novels_web}`}
                  />
                  <Legend
                    colorClass="bg-accent"
                    label={`PDF ${stats.novels_pdf}`}
                  />
                </View>
              </>
            )}
          </View>

          {/* Idiomas con conteo, sin "(ES)" hardcodeado */}
          <View className="gap-2">
            <Text className="t-section text-foreground">Idiomas</Text>
            {languages.length === 0 ? (
              <Text className="t-meta text-muted">
                Sin traducciones todavía.
              </Text>
            ) : (
              <TagGroup>
                <TagGroup.List className="flex-row flex-wrap gap-2">
                  {languages.map(([code, count]) => (
                    <TagGroup.Item key={code} id={code}>
                      <TagGroup.ItemLabel>
                        {code.toUpperCase()} · {count}
                      </TagGroup.ItemLabel>
                    </TagGroup.Item>
                  ))}
                </TagGroup.List>
              </TagGroup>
            )}
          </View>

          <ActionButton
            tone="secondary"
            onPress={() => router.push("/books")}
          >
            Abrir biblioteca
          </ActionButton>

          <Text className="t-meta text-muted">
            Calculado sobre la biblioteca del servidor configurado en Ajustes (o
            el mock si no hay URL).
          </Text>
        </>
      )}
    </ScrollView>
  );
}
