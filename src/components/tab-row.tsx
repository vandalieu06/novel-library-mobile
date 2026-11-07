import { Pressable, ScrollView, Text, View } from "react-native";

export interface TabRowOption {
  value: string;
  label: string;
}

interface TabRowProps {
  value: string;
  options: TabRowOption[];
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Tabs de categoría Material 3 (spec 0.4.0-01): 48 de alto, label 14/20 500,
 * subrayado activo de 3 px en `accent-ink` y borde inferior `outline`.
 * Scroll horizontal para que quepan todas en móvil.
 */
export function TabRow({ value, options, onChange, className }: TabRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0, flexShrink: 0 }}
      className={`border-b border-border ${className ?? ""}`}
      contentContainerStyle={{ paddingHorizontal: 8 }}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            className="h-12 justify-center px-3"
          >
            <Text
              className={`t-label ${active ? "text-accent-ink" : "text-muted"}`}
            >
              {option.label}
            </Text>
            {active && (
              <View className="absolute bottom-0 left-3 right-3 h-[3px] rounded-t-[3px] bg-accent-ink" />
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
