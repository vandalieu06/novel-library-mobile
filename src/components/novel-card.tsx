import { useRouter } from "expo-router";
import { PressableFeedback } from "heroui-native/pressable-feedback";
import { Chip } from "heroui-native/chip";
import { Image, Text, View } from "react-native";
import { coverSource } from "@/lib/mock/data";
import type { Novel } from "@/lib/types";

/** Card de novela para el grid de Biblioteca (cover + título + autor + chips). */
export function NovelCard({ novel }: { novel: Novel }) {
  const router = useRouter();
  const cover = coverSource(novel.slug);
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
          className="aspect-[2/3] w-full rounded-lg bg-surface-tertiary"
        />
        <Text
          numberOfLines={2}
          className="text-base font-semibold leading-tight text-foreground"
        >
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
      </PressableFeedback.Scale>
      <PressableFeedback.Highlight className="rounded-xl" />
    </PressableFeedback>
  );
}
