import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { useThemeColor } from "heroui-native/hooks";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  /** Acción opcional bajo el mensaje (p. ej. "Reintentar"). */
  action?: ReactNode;
}

/** Empty state (equivalente del .empty/.empty-icon/.empty-actions web). */
export function EmptyState({
  icon = "folder-open-outline",
  title,
  description,
  action,
}: EmptyStateProps) {
  const muted = useThemeColor("muted");

  return (
    <View className="items-center justify-center gap-2 py-10">
      <Ionicons name={icon} size={32} color={muted} />
      <Text className="text-center text-[16px] font-medium leading-6 text-foreground">
        {title}
      </Text>
      {description !== undefined && (
        <Text className="text-center text-[14px] leading-5 text-muted">
          {description}
        </Text>
      )}
      {action !== undefined && <View className="mt-2">{action}</View>}
    </View>
  );
}
