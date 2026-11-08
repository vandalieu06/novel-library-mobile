import { MaterialIcons } from "@expo/vector-icons";
import { ScrollView, Text, View } from "react-native";
import { BottomSheet } from "heroui-native/bottom-sheet";
import { useThemeColor } from "heroui-native/hooks";
import { preferredLanguageOptions } from "@/lib/languages";
import { AppSheetContent } from "@/components/app-sheet";
import { ListCard, ListRow } from "@/components/list-card";

interface LanguageSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
}

/**
 * Sheet de “Idioma preferido” (spec 0.4.0-08): Original + idiomas curados.
 * Tocar una fila guarda el ajuste y cierra.
 */
export function LanguageSheet({
  isOpen,
  onOpenChange,
  value,
  onChange,
}: LanguageSheetProps) {
  const accentInk = useThemeColor("accent-soft-foreground");
  const options = preferredLanguageOptions();

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <AppSheetContent contentContainerClassName="gap-5 px-5 pb-10 pt-5">
          <View className="gap-1">
            <BottomSheet.Title className="text-[20px] font-medium leading-[26px] text-foreground">
              Idioma preferido
            </BottomSheet.Title>
            <Text className="t-meta text-muted">
              El detalle abre en esta versión; las pastillas permiten cambiarla
              sin tocar el ajuste global.
            </Text>
          </View>

          <ScrollView
            className="max-h-[420px]"
            showsVerticalScrollIndicator={false}
          >
            <ListCard>
              {options.map((option) => (
                <ListRow
                  key={option.value}
                  title={option.label}
                  accessibilityLabel={`Idioma ${option.label}`}
                  onPress={() => {
                    onChange(option.value);
                    onOpenChange(false);
                  }}
                  accessory={
                    option.value === value ? (
                      <MaterialIcons
                        name="check"
                        size={20}
                        color={accentInk}
                      />
                    ) : undefined
                  }
                />
              ))}
            </ListCard>
          </ScrollView>
        </AppSheetContent>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
