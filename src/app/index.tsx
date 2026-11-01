import { Text, View } from "react-native";
import { Button } from "heroui-native/button";

/**
 * Smoke test temporal de la spec 01 (HeroUI Native + tema).
 * Se sustituye por la pantalla real de Inicio en la spec 03.
 */
export default function Index() {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background px-6">
      <Text className="text-center text-2xl font-bold text-foreground">
        novel-library
      </Text>
      <Text className="text-center text-sm text-muted">
        HeroUI Native + Uniwind operativo (spec 01)
      </Text>
      <Button onPress={() => console.log("Pressed!")}>Probar botón</Button>
    </View>
  );
}
