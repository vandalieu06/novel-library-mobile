import { useRouter } from "expo-router";
import { PressableFeedback } from "heroui-native/pressable-feedback";
import { Chip } from "heroui-native/chip";
import { Text, View } from "react-native";
import { CoverImage } from "@/components/cover-image";
import { useApi } from "@/lib/api-provider";
import { resolveCover } from "@/lib/covers";
import type { Novel } from "@/lib/types";

/**
 * Card de novela para el grid de Biblioteca: cover + título + autor + chips.
 *
 * 0.3.0 (spec 03): fuera `"/tomo"` del meta (se repetía en todas las cards y
 * truncaba el autor). Los chips solo aparecen cuando aportan: idioma si hay
 * traducción, PDF si el origen es archivo.
 */
export function NovelCard({ novel }: { novel: Novel }) {
  const router = useRouter();
  const { settings } = useApi();
  const cover = resolveCover(novel, settings);
  const hasChips =
    novel.translated_language !== null || novel.source_pdf !== null;

  return (
    <PressableFeedback
      onPress={() => router.push(`/novel/${novel.slug}`)}
      className="rounded-xl"
    >
      <PressableFeedback.Scale className="gap-1.5">
        <CoverImage
          source={cover}
          className="w-full rounded-lg"
          aspect={2 / 3}
        />
        <Text
          numberOfLines={2}
          className="t-card min-h-11 leading-tight text-foreground"
        >
          {novel.title}
        </Text>
        <Text numberOfLines={1} className="t-meta text-muted">
          {novel.author ?? "Autor desconocido"}
        </Text>
        {hasChips && (
          <View className="flex-row gap-1.5">
            {novel.translated_language !== null && (
              <Chip size="sm" variant="soft" color="accent">
                <Chip.Label>
                  {novel.translated_language.toUpperCase()}
                </Chip.Label>
              </Chip>
            )}
            {novel.source_pdf !== null && (
              <Chip size="sm" variant="soft" color="default">
                <Chip.Label>PDF</Chip.Label>
              </Chip>
            )}
          </View>
        )}
      </PressableFeedback.Scale>
      <PressableFeedback.Highlight className="rounded-xl" />
    </PressableFeedback>
  );
}
