import { Ionicons } from "@expo/vector-icons";
import { ListGroup } from "heroui-native/list-group";
import { Spinner } from "heroui-native/spinner";
import { Text, View } from "react-native";

export type VolumeState = "idle" | "downloading" | "ok" | "error";

interface VolumeRowProps {
  label: string;
  filename: string;
  translated: boolean;
  state: VolumeState;
  onPress: () => void;
}

/**
 * Fila de tomo dentro de un `ListGroup` (spec 0.3.0-03): la palabra
 * "Descargar" deja de repetirse; el estado vive en el icono del sufijo.
 */
export function VolumeRow({
  label,
  filename,
  translated,
  state,
  onPress,
}: VolumeRowProps) {
  return (
    <ListGroup.Item
      onPress={onPress}
      disabled={state === "downloading"}
      accessibilityLabel={`Descargar ${filename}`}
    >
      <ListGroup.ItemPrefix>
        <Ionicons
          name={translated ? "language-outline" : "book-outline"}
          size={18}
          color="#8b8b93"
        />
      </ListGroup.ItemPrefix>
      <ListGroup.ItemContent>
        <ListGroup.ItemTitle className="t-body">{label}</ListGroup.ItemTitle>
        {state === "error" && (
          <ListGroup.ItemDescription className="t-meta text-danger">
            Error al descargar
          </ListGroup.ItemDescription>
        )}
      </ListGroup.ItemContent>
      <ListGroup.ItemSuffix>
        <View className="h-11 w-11 items-center justify-center">
          {state === "downloading" ? (
            <Spinner size="sm" />
          ) : state === "ok" ? (
            <Ionicons name="checkmark-circle" size={20} color="#15803d" />
          ) : state === "error" ? (
            <Ionicons name="alert-circle" size={20} color="#dc2626" />
          ) : (
            <Ionicons name="download-outline" size={20} color="#8b8b93" />
          )}
        </View>
      </ListGroup.ItemSuffix>
    </ListGroup.Item>
  );
}

/** Estado vacío con el mismo marco que las filas. */
export function VolumeEmpty({ label }: { label: string }) {
  return (
    <Text className="t-meta px-4 py-4 text-muted">{label}</Text>
  );
}
