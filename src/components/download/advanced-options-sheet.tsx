import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { BottomSheet } from "heroui-native/bottom-sheet";
import { Select } from "heroui-native/select";
import { Separator } from "heroui-native/separator";
import { useThemeColor } from "heroui-native/hooks";
import { VOLUME_SIZES } from "@/lib/languages";
import { ActionButton } from "@/components/action-button";
import { AppSheetContent } from "@/components/app-sheet";
import { ToggleRow } from "@/components/toggle-row";

const VOLUME_OPTIONS = VOLUME_SIZES.map((size) => ({
  value: String(size),
  label: String(size),
}));

interface AdvancedOptionsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  volume: string;
  onVolumeChange: (value: string) => void;
  concurrency: string;
  onConcurrencyStep: (delta: number) => void;
  concurrencyMin: number;
  concurrencyMax: number;
  all: boolean;
  onAllChange: (value: boolean) => void;
  pending: boolean;
  onPendingChange: (value: boolean) => void;
  force: boolean;
  onForceChange: (value: boolean) => void;
  playwright: boolean;
  onPlaywrightChange: (value: boolean) => void;
  onReset: () => void;
}

/**
 * Sheet de opciones avanzadas (spec 0.4.0-03): tomo, concurrencia y flags de
 * descarga. Conserva el comportamiento (volumen 50, concurrencia 4, flags).
 */
export function AdvancedOptionsSheet({
  isOpen,
  onOpenChange,
  volume,
  onVolumeChange,
  concurrency,
  onConcurrencyStep,
  concurrencyMin,
  concurrencyMax,
  all,
  onAllChange,
  pending,
  onPendingChange,
  force,
  onForceChange,
  playwright,
  onPlaywrightChange,
  onReset,
}: AdvancedOptionsSheetProps) {
  const muted = useThemeColor("muted");
  const disabledMinus = Number(concurrency) <= concurrencyMin;
  const disabledPlus = Number(concurrency) >= concurrencyMax;

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <AppSheetContent contentContainerClassName="gap-4 px-5 pb-10 pt-5">
          <View className="gap-1">
            <BottomSheet.Title className="text-[20px] font-medium leading-[26px] text-foreground">
              Opciones avanzadas
            </BottomSheet.Title>
            <Text className="t-meta text-muted">
              Se aplican al próximo trabajo que lances.
            </Text>
          </View>

          <Select
            value={
              VOLUME_OPTIONS.find((option) => option.value === volume) ??
              VOLUME_OPTIONS[0]
            }
            onValueChange={(option) => {
              if (
                !Array.isArray(option) &&
                typeof option === "object" &&
                option.value
              ) {
                onVolumeChange(String(option.value));
              }
            }}
          >
            <Select.Trigger
              variant="unstyled"
              accessibilityLabel="Capítulos por tomo"
              className="min-h-14 flex-row items-center gap-3 px-4 py-2.5 bg-transparent active:bg-surface-secondary"
            >
              <View className="min-w-0 flex-1">
                <Text className="t-body text-foreground">Capítulos por tomo</Text>
              </View>
              <Text numberOfLines={1} className="t-label text-muted">
                {volume}
              </Text>
              <MaterialIcons name="chevron-right" size={20} color={muted} />
            </Select.Trigger>
            <Select.Portal>
              <Select.Overlay />
              <Select.Content presentation="popover" width="trigger">
                <Select.ListLabel>Capítulos por tomo</Select.ListLabel>
                {VOLUME_OPTIONS.map((option) => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    label={option.label}
                  />
                ))}
              </Select.Content>
            </Select.Portal>
          </Select>

          <View className="flex-row items-center justify-between gap-4">
            <View className="flex-1 gap-0.5">
              <Text className="t-body text-foreground">
                Descargas simultáneas
              </Text>
              <Text className="t-meta text-muted">
                Cuántos capítulos se descargan a la vez
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Pressable
                onPress={() => onConcurrencyStep(-1)}
                disabled={disabledMinus}
                hitSlop={8}
                accessibilityLabel="Menos descargas simultáneas"
                className="h-11 w-11 items-center justify-center rounded-lg bg-surface-secondary"
              >
                <MaterialIcons
                  name="remove"
                  size={18}
                  color={muted}
                />
              </Pressable>
              <Text className="t-body w-8 text-center text-foreground [font-variant-numeric:tabular-nums]">
                {concurrency}
              </Text>
              <Pressable
                onPress={() => onConcurrencyStep(1)}
                disabled={disabledPlus}
                hitSlop={8}
                accessibilityLabel="Más descargas simultáneas"
                className="h-11 w-11 items-center justify-center rounded-lg bg-surface-secondary"
              >
                <MaterialIcons name="add" size={18} color={muted} />
              </Pressable>
            </View>
          </View>

          <Separator />

          <View className="gap-4">
            <ToggleRow
              label="Todos los capítulos"
              description="Descarga la novela completa, no solo lo nuevo"
              value={all}
              onChange={onAllChange}
            />
            <ToggleRow
              label="Traducir solo lo pendiente"
              description="No vuelve a traducir capítulos ya traducidos"
              value={pending}
              onChange={onPendingChange}
            />
            <ToggleRow
              label="Volver a descargar lo existente"
              description="Ignora los capítulos que ya están en disco"
              value={force}
              onChange={onForceChange}
            />
            <ToggleRow
              label="Modo navegador (Playwright)"
              description="Úsalo si la web bloquea la descarga normal"
              value={playwright}
              onChange={onPlaywrightChange}
            />
          </View>

          <View className="flex-row gap-2">
            <ActionButton
              tone="secondary"
              className="flex-1"
              onPress={onReset}
            >
              Restablecer
            </ActionButton>
            <ActionButton
              className="flex-1"
              onPress={() => onOpenChange(false)}
            >
              Listo
            </ActionButton>
          </View>
        </AppSheetContent>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
