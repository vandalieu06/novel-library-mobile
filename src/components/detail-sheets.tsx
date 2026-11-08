import { Text, View } from "react-native";
import { BottomSheet } from "heroui-native/bottom-sheet";
import { Select } from "heroui-native/select";
import { volumeSizeOptions } from "@/lib/languages";
import type { ActionKind } from "@/lib/novel-detail";
import { ActionButton } from "@/components/action-button";

interface DetailSheetsProps {
  retranslateOpen: boolean;
  onRetranslateOpenChange: (open: boolean) => void;
  volumeOpen: boolean;
  onVolumeOpenChange: (open: boolean) => void;
  selectedLanguageOption?: { value: string; label: string };
  languageChoices: { value: string; label: string }[];
  onLanguageChange: (value: string) => void;
  actionBusy: ActionKind | null;
  /** Bloquea Retraducir/Tamaño mientras hay un job vivo (0.4.0-09). */
  actionsBlocked?: boolean;
  volumeSize: number | null;
  onRetranslate: () => void;
  onVolumeSize: (size: number | null) => void;
}

/**
 * Sheets de acciones del detalle (specs 0.4.0-04 y 0.4.0-06): retraducir y
 * tamaño de tomo. Compartidos por la pantalla de teléfono y el panel de tablet.
 */
export function DetailSheets({
  retranslateOpen,
  onRetranslateOpenChange,
  volumeOpen,
  onVolumeOpenChange,
  selectedLanguageOption,
  languageChoices,
  onLanguageChange,
  actionBusy,
  actionsBlocked = false,
  volumeSize,
  onRetranslate,
  onVolumeSize,
}: DetailSheetsProps) {
  return (
    <>
      {/* Retraducir: idioma de destino */}
      <BottomSheet
        isOpen={retranslateOpen}
        onOpenChange={onRetranslateOpenChange}
      >
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content contentContainerClassName="gap-5 px-5 pb-10 pt-5">
            <View className="gap-1">
              <BottomSheet.Title className="t-section text-foreground">
                Retraducir
              </BottomSheet.Title>
              <Text className="t-meta text-muted">
                Elige el idioma de destino; se regeneran los EPUB traducidos.
              </Text>
            </View>

            <Select
              value={selectedLanguageOption}
              onValueChange={(option) => {
                if (
                  !Array.isArray(option) &&
                  typeof option === "object" &&
                  option.value
                ) {
                  onLanguageChange(option.value);
                }
              }}
            >
              <Select.Trigger>
                <Select.Value placeholder="Idioma" />
                <Select.TriggerIndicator />
              </Select.Trigger>
              <Select.Portal>
                <Select.Overlay />
                <Select.Content presentation="popover" width="trigger">
                  <Select.ListLabel>Idioma de traducción</Select.ListLabel>
                  {languageChoices.map((option) => (
                    <Select.Item
                      key={option.value}
                      value={option.value}
                      label={option.label}
                    />
                  ))}
                </Select.Content>
              </Select.Portal>
            </Select>

            <ActionButton
              onPress={onRetranslate}
              loading={actionBusy === "retranslate"}
              disabled={actionsBlocked}
            >
              Retraducir
            </ActionButton>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      {/* Tamaño de tomo: síncrono, sin job */}
      <BottomSheet isOpen={volumeOpen} onOpenChange={onVolumeOpenChange}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content contentContainerClassName="gap-5 px-5 pb-10 pt-5">
            <View className="gap-1">
              <BottomSheet.Title className="t-section text-foreground">
                Tamaño de tomo
              </BottomSheet.Title>
              <Text className="t-meta text-muted">
                Regenera todos los EPUB con el tamaño elegido.
              </Text>
            </View>

            <View className="gap-2">
              {volumeSizeOptions(true).map((option) => (
                <ActionButton
                  key={option.value}
                  size="sm"
                  tone={volumeSize === option.size ? "primary" : "secondary"}
                  onPress={() => onVolumeSize(option.size)}
                  loading={actionBusy === "volume"}
                  disabled={actionsBlocked}
                >
                  {option.label}
                </ActionButton>
              ))}
            </View>

            <Text className="t-meta text-muted">
              Cambiar el tamaño regenera los tomos en el servidor; puede tardar.
            </Text>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </>
  );
}
