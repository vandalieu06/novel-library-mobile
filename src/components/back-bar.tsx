import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { PressableFeedback } from "heroui-native/pressable-feedback";

interface BackBarProps {
  onBack: () => void;
  /** Texto destino; por defecto "Biblioteca". */
  label?: string;
}

/** Appbar de retroceso (estilo back-link de la web: ← Biblioteca). */
export function BackBar({ onBack, label = "Biblioteca" }: BackBarProps) {
  return (
    <View className="flex-row px-3 py-1.5">
      <PressableFeedback
        animation={{ scale: false }}
        onPress={onBack}
        className="rounded-lg"
      >
        <View className="flex-row items-center gap-0.5 px-2 py-1.5">
          <Ionicons name="chevron-back" size={20} color="#a1a1aa" />
          <Text className="text-sm text-muted">{label}</Text>
        </View>
      </PressableFeedback>
    </View>
  );
}
