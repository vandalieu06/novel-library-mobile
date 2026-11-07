import { Text, TextInput, View } from "react-native";
import { useThemeColor } from "heroui-native/hooks";

interface OutlinedFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helper?: string;
  error?: string;
  autoCapitalize?: "none" | "sentences" | "words";
  inputMode?: "text" | "url";
}

/**
 * Campo de texto outlined de 56 (spec 0.4.0-03): label 12/16, valor 16/24,
 * borde 1 px `outline`, radio 12 y foco neutro. Error inline con borde danger.
 */
export function OutlinedField({
  label,
  value,
  onChange,
  placeholder,
  helper,
  error,
  autoCapitalize = "sentences",
  inputMode = "text",
}: OutlinedFieldProps) {
  const muted = useThemeColor("muted");

  return (
    <View className="gap-1.5">
      <Text className="t-meta text-muted">{label}</Text>
      <View className={error !== undefined ? "" : "gap-1.5"}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={muted}
          accessibilityLabel={label}
          autoCapitalize={autoCapitalize}
          inputMode={inputMode}
          className={`h-14 rounded-xl border px-4 text-[16px] leading-6 text-foreground ${
            error !== undefined ? "border-danger" : "border-border"
          } android:focus:border-foreground ios:focus:outline-foreground`}
        />
        {(helper !== undefined || error !== undefined) && (
          <Text
            className={`t-meta ${error !== undefined ? "text-danger" : "text-muted"}`}
          >
            {error ?? helper}
          </Text>
        )}
      </View>
    </View>
  );
}
