import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { ListCard } from "@/components/list-card";

interface SettingsGroupProps {
  title: string;
  /** Contenido a la derecha del título (p. ej. estado o contador). */
  accessory?: ReactNode;
  children: ReactNode;
}

/**
 * Sección de Ajustes (spec 0.4.0-05): label 14/20 fuera y una `ListCard` de 01
 * dentro. Las filas son `ListRow`; los separadores los pone la propia card.
 */
export function SettingsGroup({
  title,
  accessory,
  children,
}: SettingsGroupProps) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between gap-3 px-1">
        <Text className="t-label text-muted">{title}</Text>
        {accessory}
      </View>
      <ListCard>{children}</ListCard>
    </View>
  );
}
