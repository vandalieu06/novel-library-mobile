import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Stack } from "expo-router";
import { Button } from "heroui-native/button";
import { Chip } from "heroui-native/chip";
import { Skeleton } from "heroui-native/skeleton";
import { ApiError } from "@/lib/api";
import { useApi } from "@/lib/api-provider";
import { libraryStats } from "@/lib/stats";
import type { Novel } from "@/lib/types";
import { EmptyState } from "@/components/empty-state";

interface StatCard {
  label: string;
  value: string;
}

export default function StatisticsScreen() {
  const { api } = useApi();
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
  const idiomas = useMemo(
    () => [
      ...new Set(
        novels
          .filter((novel) => novel.translated_language !== null)
          .map((novel) => novel.translated_language as string),
      ),
    ],
    [novels],
  );

  const cards: StatCard[] = [
    { label: "Novelas", value: String(stats.novels) },
    { label: "EPUBs originales", value: String(stats.epubs_original) },
    { label: "EPUBs traducidos (ES)", value: String(stats.epubs_translated) },
    { label: "EPUBs totales", value: String(stats.epubs_total) },
    { label: "Capítulos descargados", value: String(stats.chapters_downloaded) },
    { label: "Capítulos traducidos", value: String(stats.chapters_translated) },
  ];

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-4 gap-4 pb-12"
    >
      <Stack.Screen options={{ title: "Estadísticas" }} />

      {isLoading ? (
        <View className="flex-row flex-wrap gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-20 flex-1 min-w-[48%] rounded-xl" />
          ))}
        </View>
      ) : error !== null ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="No se pudieron cargar las estadísticas"
          description={error}
          action={
            <Button size="sm" variant="secondary" onPress={() => void load()}>
              <Button.Label>Reintentar</Button.Label>
            </Button>
          }
        />
      ) : (
        <>
          <View className="flex-row flex-wrap gap-3">
            {cards.map((card) => (
              <View
                key={card.label}
                className="min-w-[48%] flex-1 gap-1 rounded-xl border border-separator bg-surface p-3"
              >
                <Text className="text-xl font-semibold text-foreground [font-variant-numeric:tabular-nums]">
                  {card.value}
                </Text>
                <Text className="text-xs text-muted">{card.label}</Text>
              </View>
            ))}
          </View>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Por origen</Text>
            <View className="flex-row flex-wrap gap-2">
              <Chip size="sm" variant="soft" color="default">
                <Chip.Label>Web: {stats.novels_web}</Chip.Label>
              </Chip>
              <Chip size="sm" variant="soft" color="accent">
                <Chip.Label>PDF: {stats.novels_pdf}</Chip.Label>
              </Chip>
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">
              Idiomas de traducción
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {idiomas.length === 0 ? (
                <Text className="text-xs text-muted">Sin traducciones todavía.</Text>
              ) : (
                idiomas.map((code) => (
                  <Chip key={code} size="sm" variant="soft" color="accent">
                    <Chip.Label>{code.toUpperCase()}</Chip.Label>
                  </Chip>
                ))
              )}
            </View>
          </View>

          <Text className="text-xs text-muted">
            Calculado sobre la biblioteca del servidor configurado en Ajustes
            (o el mock si no hay URL).
          </Text>
        </>
      )}
    </ScrollView>
  );
}
