import { Text, View } from "react-native";

/** Stub de la spec 02; las estadísticas derivadas del mock son la spec 04. */
export default function StatisticsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <Text className="text-xl font-semibold text-foreground">Estadísticas</Text>
      <Text className="mt-2 text-center text-sm text-muted">
        Contadores de la biblioteca — spec 04
      </Text>
    </View>
  );
}
