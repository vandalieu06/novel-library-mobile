import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { Stack } from "expo-router";
import { Chip } from "heroui-native/chip";
import { mockNovels, mockLibraryStats } from "@/lib/mock/data";

interface StatCard {
  label: string;
  value: string;
}

export default function StatisticsScreen() {
  const stats = useMemo(() => mockLibraryStats(), []);
  const idiomas = useMemo(
    () => [
      ...new Set(
        mockNovels
          .filter((novel) => novel.translated_language !== null)
          .map((novel) => novel.translated_language as string),
      ),
    ],
    [],
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
          {idiomas.map((code) => (
            <Chip key={code} size="sm" variant="soft" color="accent">
              <Chip.Label>{code.toUpperCase()}</Chip.Label>
            </Chip>
          ))}
        </View>
      </View>

      <Text className="text-xs text-muted">
        Datos derivados del mock (espejo de los manifests reales). Con la API
        real (fase 2) se calcularán sobre la biblioteca del servidor.
      </Text>
    </ScrollView>
  );
}
