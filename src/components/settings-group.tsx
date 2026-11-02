import type { ReactNode } from "react";
import { Text, View } from "react-native";

interface SettingsGroupProps {
  title: string;
  /** Contenido a la derecha del título (p. ej. el sello "Guardado"). */
  accessory?: ReactNode;
  children: ReactNode;
}

/** Grupo de Ajustes: label fuera y una sola superficie dividida por dentro. */
export function SettingsGroup({
  title,
  accessory,
  children,
}: SettingsGroupProps) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between px-1">
        <Text className="t-label text-muted">{title}</Text>
        {accessory}
      </View>
      <View className="overflow-hidden rounded-xl bg-surface">{children}</View>
    </View>
  );
}
