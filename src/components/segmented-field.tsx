import { Pressable, Text, View } from "react-native";

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
 * Segmented de ancho completo Material 3 (spec 0.4.0-01): 44 de alto, borde de
 * 1 px `outline`, radio 22. La opción activa usa `accent-soft` + `accent-ink`;
 * el resto queda sobre la superficie neutra. 44 dp cumple el target mínimo
 * (antislop R-03).
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
      <View
        accessible={false}
        className="h-11 flex-row overflow-hidden rounded-[22px] border border-border bg-surface"
      >
        {options.map((option, index) => {
          const active = option.value === value;

          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={option.label}
              className={`h-full flex-1 items-center justify-center ${
                index > 0 ? "border-l border-border" : ""
              } ${active ? "bg-accent-soft" : ""}`}
            >
              <Text
                className={`text-[13px] font-medium leading-[18px] ${
                  active ? "text-accent-ink" : "text-foreground"
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {caption !== undefined && (
        <Text className="t-meta text-muted">{caption}</Text>
      )}
    </View>
  );
}
