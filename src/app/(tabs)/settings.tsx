import { Text, View } from "react-native";

/** Stub de la spec 02; servidor, tema, densidad e info de la app son la spec 04. */
export default function SettingsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <Text className="text-xl font-semibold text-foreground">Ajustes</Text>
      <Text className="mt-2 text-center text-sm text-muted">
        Servidor, tema y densidad del grid — spec 04
      </Text>
    </View>
  );
}
