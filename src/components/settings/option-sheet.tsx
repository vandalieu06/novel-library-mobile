import { Text, View } from "react-native";
import { BottomSheet } from "heroui-native/bottom-sheet";
import { ActionButton } from "@/components/action-button";
import { AppSheetContent } from "@/components/app-sheet";
import {
  SegmentedField,
  type SegmentedOption,
} from "@/components/segmented-field";

interface OptionSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  value: string;
  options: SegmentedOption[];
  onChange: (value: string) => void;
  caption?: string;
}

/**
 * Sheet de una decisión corta (spec 0.4.0-05): tema o densidad. El cambio se
 * aplica al instante; “Listo” cierra.
 */
export function OptionSheet({
  isOpen,
  onOpenChange,
  title,
  value,
  options,
  onChange,
  caption,
}: OptionSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <AppSheetContent contentContainerClassName="gap-5 px-5 pb-10 pt-5">
          <View className="gap-1">
            <BottomSheet.Title className="text-[20px] font-medium leading-[26px] text-foreground">
              {title}
            </BottomSheet.Title>
            {caption !== undefined && (
              <Text className="t-meta text-muted">{caption}</Text>
            )}
          </View>
          <SegmentedField value={value} options={options} onChange={onChange} />
          <ActionButton onPress={() => onOpenChange(false)}>Listo</ActionButton>
        </AppSheetContent>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
