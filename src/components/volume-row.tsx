import { MaterialIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { Spinner } from "heroui-native/spinner";
import { useThemeColor } from "heroui-native/hooks";
import { ListRow } from "@/components/list-card";

export type VolumeState = "idle" | "downloading" | "ok" | "error";

interface VolumeRowProps {
  label: string;
  filename: string;
  translated: boolean;
  state: VolumeState;
  onPress: () => void;
}

/**
 * Fila de tomo dentro de `ListCard` (spec 0.4.0-04): rango 16/24, "EPUB" en
 * 12/16 `muted` y el estado en el icono del sufijo (download accent-ink,
 * spinner, check o alert).
 */
export function VolumeRow({
  label,
  filename,
  translated,
  state,
  onPress,
}: VolumeRowProps) {
  // `accent-soft-foreground` es el token que global.css mapea a `accent-ink`.
  const accentInk = useThemeColor("accent-soft-foreground");
  const success = useThemeColor("success");
  const danger = useThemeColor("danger");

  const accessory =
    state === "downloading" ? (
      <View className="h-5 w-5 items-center justify-center">
        <Spinner size="sm" />
      </View>
    ) : state === "ok" ? (
      <MaterialIcons name="check" size={20} color={success} />
    ) : state === "error" ? (
      <MaterialIcons name="error-outline" size={20} color={danger} />
    ) : (
      <MaterialIcons name="file-download" size={20} color={accentInk} />
    );

  return (
    <ListRow
      onPress={state === "downloading" ? undefined : onPress}
      disabled={state === "downloading"}
      accessibilityLabel={`Descargar ${
        translated ? "tomo traducido" : "tomo"
      } ${filename}`}
      accessory={accessory}
    >
      <View className="min-w-0 flex-1">
        <Text
          numberOfLines={1}
          className="t-body text-foreground [font-variant-numeric:tabular-nums]"
        >
          {label}
        </Text>
        <Text className="t-meta text-muted">EPUB</Text>
        {state === "error" && (
          <Text className="t-meta text-danger">Error al descargar</Text>
        )}
      </View>
    </ListRow>
  );
}

/** Estado vacío con el mismo marco que las filas. */
export function VolumeEmpty({ label }: { label: string }) {
  return (
    <View className="min-h-14 justify-center px-4">
      <Text className="t-meta text-muted">{label}</Text>
    </View>
  );
}
