import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

/** Stub de la spec 02; la pantalla real (info + tomos + descarga) es la spec 03. */
export default function NovelScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <Text className="text-center text-lg font-semibold text-foreground">
        {slug ?? "…"}
      </Text>
      <Text className="mt-2 text-center text-sm text-muted">
        Info, capítulos y tomos — spec 03
      </Text>
    </View>
  );
}
