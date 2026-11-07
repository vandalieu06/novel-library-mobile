import { Text, View } from "react-native";
import { Switch } from "heroui-native/switch";

interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

/**
 * Fila label + descripción + switch (spec 0.4.0-03): altura 56 y target ≥ 48.
 * El track encendido es el accent del tema; el Switch de HeroUI ya lo pinta.
 */
export function ToggleRow({ label, description, value, onChange }: ToggleRowProps) {
  return (
    <View className="min-h-14 flex-row items-center gap-4">
      <View className="flex-1 gap-0.5">
        <Text className="t-body text-foreground">{label}</Text>
        {description !== undefined && (
          <Text className="t-meta text-muted">{description}</Text>
        )}
      </View>
      <Switch
        isSelected={value}
        onSelectedChange={onChange}
        accessibilityLabel={label}
      />
    </View>
  );
}
