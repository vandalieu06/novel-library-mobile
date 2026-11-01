import { useRouter } from "expo-router";
import { PressableFeedback } from "heroui-native/pressable-feedback";
import { Chip } from "heroui-native/chip";
import { Image, Text, View } from "react-native";
import { coverSource } from "@/lib/mock/data";
import type { Novel } from "@/lib/types";
import { ProgressBar } from "./progress-bar";

/** Card de novela para el grid de Biblioteca. */
export function NovelCard({ novel }: { novel: Novel }) {
  const router = useRouter();
  const cover = coverSource(novel.slug);
  const downloadedPct =
    novel.chapters_total > 0 ? novel.chapters_downloaded / novel.chapters_total : 0;
  const translatedPct =
    novel.chapters_total > 0 ? novel.chapters_translated / novel.chapters_total : 0;
  const meta = [
    novel.author,
    novel.volume_size !== null ? `${novel.volume_size}/tomo` : null,
  ].filter(Boolean) as string[];

  return (
    <PressableFeedback
      onPress={() => router.push(`/novel/${novel.slug}`)}
      className="rounded-xl"
    >
      <PressableFeedback.Scale className="gap-2">
        <Image
          source={cover ?? undefined}
          resizeMode="cover"
          className="h-44 w-full rounded-lg bg-surface-tertiary"
        />
        <Text numberOfLines={2} className="text-sm font-semibold text-foreground">
          {novel.title}
        </Text>
        <Text numberOfLines={1} className="text-xs text-muted">
          {meta.join(" · ") || "—"}
        </Text>
        <View className="flex-row gap-1.5">
          {novel.translated_language !== null && (
            <Chip size="sm" variant="soft" color="accent">
              <Chip.Label>{novel.translated_language.toUpperCase()}</Chip.Label>
            </Chip>
          )}
          <Chip size="sm" variant="soft" color="default">
            <Chip.Label>{novel.source_pdf ? "PDF" : "Web"}</Chip.Label>
          </Chip>
        </View>
        <ProgressBar value={downloadedPct} />
        <Text className="text-xs text-muted [font-variant-numeric:tabular-nums]">
          caps. {novel.chapters_downloaded}/{novel.chapters_total}
        </Text>
        {novel.translated && (
          <ProgressBar value={translatedPct} colorClass="bg-success" />
        )}
      </PressableFeedback.Scale>
      <PressableFeedback.Highlight className="rounded-xl" />
    </PressableFeedback>
  );
}
