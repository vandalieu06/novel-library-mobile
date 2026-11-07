import { MaterialIcons } from "@expo/vector-icons";
import { Menu } from "heroui-native/menu";
import { View } from "react-native";
import { useThemeColor } from "heroui-native/hooks";

interface DetailActionsMenuProps {
  onRetranslate: () => void;
  onVolumeSize: () => void;
}

/**
 * Overflow de acciones secundarias del detalle (spec 0.4.0-04): retraducir y
 * tamaño de tomo. Se usa en el header del teléfono y en el panel de tablet.
 */
export function DetailActionsMenu({
  onRetranslate,
  onVolumeSize,
}: DetailActionsMenuProps) {
  const foreground = useThemeColor("foreground");

  return (
    <Menu>
      <Menu.Trigger
        accessibilityLabel="Más opciones"
        hitSlop={4}
        className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-secondary"
      >
        <MaterialIcons name="more-vert" size={24} color={foreground} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Overlay />
        <Menu.Content
          presentation="popover"
          placement="bottom"
          align="end"
          width={240}
          className="p-1"
        >
          <Menu.Item className="items-start" onPress={onRetranslate}>
            <View className="flex-1 gap-0.5">
              <Menu.ItemTitle>Retraducir…</Menu.ItemTitle>
              <Menu.ItemDescription>
                Regenera los EPUB en otro idioma
              </Menu.ItemDescription>
            </View>
          </Menu.Item>
          <Menu.Item className="items-start" onPress={onVolumeSize}>
            <View className="flex-1 gap-0.5">
              <Menu.ItemTitle>Tamaño de tomo…</Menu.ItemTitle>
              <Menu.ItemDescription>
                Divide los EPUB en bloques
              </Menu.ItemDescription>
            </View>
          </Menu.Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu>
  );
}
