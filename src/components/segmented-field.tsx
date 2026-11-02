import { Text, View } from "react-native";
import { Tabs } from "heroui-native/tabs";

export interface SegmentedOption {
  value: string;
  label: string;
}

interface SegmentedFieldProps {
  value: string;
  options: SegmentedOption[];
  onChange: (value: string) => void;
  label?: string;
  caption?: string;
  className?: string;
}

/**
 * Segmented a ancho completo y alineado a la izquierda (antes iban centrados y
 * con anchos distintos). Usa `Tabs` de HeroUI como hoy.
 */
export function SegmentedField({
  value,
  options,
  onChange,
  label,
  caption,
  className,
}: SegmentedFieldProps) {
  return (
    <View className={`gap-2 ${className ?? ""}`}>
      {label !== undefined && (
        <Text className="t-label text-muted">{label}</Text>
      )}
      <Tabs value={value} onValueChange={(next) => onChange(String(next))}>
        <Tabs.List className="h-11 w-full">
          <Tabs.Indicator />
          {options.map((option) => (
            <Tabs.Trigger
              key={option.value}
              value={option.value}
              className="h-full flex-1"
            >
              <Tabs.Label>{option.label}</Tabs.Label>
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs>
      {caption !== undefined && (
        <Text className="t-meta text-muted">{caption}</Text>
      )}
    </View>
  );
}
