import { useRouter } from "expo-router";
import { PressableFeedback } from "heroui-native/pressable-feedback";
import { Text, View } from "react-native";
import { CoverImage } from "@/components/cover-image";
import { useApi } from "@/lib/api-provider";
import { resolveCover } from "@/lib/covers";
import type { Novel } from "@/lib/types";

/**
 * Card de novela para el grid de Biblioteca (spec 0.4.0-02): cover 2:3 con
 * badge de idioma/PDF sobre la cubierta, título 14/20 a 2 líneas y autor a 1.
 * Toda la card es pressable con highlight (sin escala en listas).
 */
interface NovelCardProps {
  novel: Novel;
  /** Override del tap (panel de tablet); sin él navega al detalle. */
  onPress?: () => void;
  selected?: boolean;
}

export function NovelCard({ novel, onPress, selected = false }: NovelCardProps) {
  const router = useRouter();
  const { settings } = useApi();
  const cover = resolveCover(novel, settings);

  // Si hay idioma y PDF, gana el idioma; el detalle muestra ambos.
  const badge =
    novel.translated_language !== null
      ? { label: novel.translated_language.toUpperCase(), accent: true }
      : novel.source_pdf !== null
        ? { label: "PDF", accent: false }
        : null;

  return (
    <PressableFeedback
      onPress={onPress ?? (() => router.push(`/novel/${novel.slug}`))}
      accessibilityState={{ selected }}
      className={`rounded-lg ${selected ? "border border-accent-ink" : ""}`}
    >
      <PressableFeedback.Scale className="gap-1.5">
        <View className="relative">
          <CoverImage
            source={cover}
            className="w-full rounded-lg"
            aspect={2 / 3}
          />
          {badge !== null && (
            <View
              className={`absolute left-2 top-2 rounded-md px-1.5 py-0.5 ${
                badge.accent ? "bg-accent" : "bg-surface"
              }`}
            >
              <Text
                className={`text-[10px] font-semibold leading-[14px] ${
                  badge.accent ? "text-accent-foreground" : "text-foreground"
                }`}
              >
                {badge.label}
              </Text>
            </View>
          )}
        </View>
        <Text numberOfLines={2} className="t-card text-foreground">
          {novel.title}
        </Text>
        <Text numberOfLines={1} className="t-meta text-muted">
          {novel.author ?? "Autor desconocido"}
        </Text>
      </PressableFeedback.Scale>
      <PressableFeedback.Highlight className="rounded-lg" />
    </PressableFeedback>
  );
}
