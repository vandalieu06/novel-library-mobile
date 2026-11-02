import type { ReactNode } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

interface SettingsRowProps {
  title: string;
  description?: string;
  /** Control a la derecha. Si no se pasa y hay `onPress`, se pinta un chevron. */
  children?: ReactNode;
  onPress?: () => void;
  className?: string;
}

/**
 * Fila de Ajustes: título (y descripción opcional) a la izquierda, control o
 * navegación a la derecha. Alto mínimo 44 (spec 0.3.0-01).
 */
export function SettingsRow({
  title,
  description,
  children,
  onPress,
  className,
}: SettingsRowProps) {
  const content = (
    <>
      <View className="flex-1 gap-0.5">
        <Text className="t-body text-foreground">{title}</Text>
        {description !== undefined && (
          <Text className="t-meta text-muted">{description}</Text>
        )}
      </View>
      {children ??
        (onPress !== undefined ? (
          <Ionicons name="chevron-forward" size={18} color="#8b8b93" />
        ) : null)}
    </>
  );

  const base = `min-h-11 flex-row items-center gap-3 px-4 py-3 ${className ?? ""}`;

  if (onPress === undefined) {
    return <View className={base}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={`${base} active:bg-surface-secondary`}
    >
      {content}
    </Pressable>
  );
}
