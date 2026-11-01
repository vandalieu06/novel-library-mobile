import { Text, View } from "react-native";

/** Stub de la spec 02; el formulario real (web/PDF) es la spec 03. */
export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <Text className="text-xl font-semibold text-foreground">Inicio</Text>
      <Text className="mt-2 text-center text-sm text-muted">
        Formulario de descarga (web / PDF) — spec 03
      </Text>
    </View>
  );
}
