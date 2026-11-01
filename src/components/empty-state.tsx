import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
}

/** Empty state (equivalente del .empty/.empty-icon/.empty-actions web). */
export function EmptyState({
  icon = "folder-open-outline",
  title,
  description,
}: EmptyStateProps) {
  return (
    <View className="items-center justify-center gap-2 py-10">
      <Ionicons name={icon} size={32} color="#a1a1aa" />
      <Text className="text-center text-base font-medium text-foreground">
        {title}
      </Text>
      {description !== undefined && (
        <Text className="text-center text-sm text-muted">{description}</Text>
      )}
    </View>
  );
}
