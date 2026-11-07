import {
  Children,
  Fragment,
  type ReactNode,
} from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useThemeColor } from "heroui-native/hooks";

interface ListCardProps {
  children: ReactNode;
  className?: string;
}

/**
 * Contenedor de lista Material 3 (spec 0.4.0-01): superficie `surface`, borde
 * de 1 px `outline`, radio 16 y separadores inset 16 entre filas.
 *
 * Los separadores se insertan entre hijos directos; las filas condicionales
 * (`null`/`false`) no dejan huecos.
 */
export function ListCard({ children, className }: ListCardProps) {
  const rows = Children.toArray(children);

  return (
    <View
      className={`overflow-hidden rounded-2xl border border-border bg-surface ${className ?? ""}`}
    >
      {rows.map((row, index) => (
        <Fragment key={index}>
          {index > 0 && <View className="ml-4 h-px bg-border" />}
          {row}
        </Fragment>
      ))}
    </View>
  );
}

export type StatusTone = "success" | "danger" | "muted" | "accent";

const DOT: Record<StatusTone, string> = {
  success: "bg-success",
  danger: "bg-danger",
  muted: "bg-muted-2",
  accent: "bg-accent-ink",
};

/** Punto de estado de 8 px. */
export function StatusDot({ tone = "muted" }: { tone?: StatusTone }) {
  return <View className={`h-2 w-2 rounded-full ${DOT[tone]}`} />;
}

interface ListRowProps {
  title?: string;
  description?: string;
  /** Valor alineado a la derecha (p. ej. "Conectado"). */
  value?: string;
  /** Icono o avatar a la izquierda del título. */
  leading?: ReactNode;
  /** Control a la derecha; sustituye al chevron. */
  accessory?: ReactNode;
  /** Contenido libre en lugar de título/descripción. */
  children?: ReactNode;
  onPress?: () => void;
  /** Chevron de navegación cuando la fila no es un control. */
  showChevron?: boolean;
  disabled?: boolean;
  className?: string;
  accessibilityLabel?: string;
}

/**
 * Fila de `ListCard`: 56 de alto, padding 16, gap 12. Título 16/24, descripción
 * 12/16 `muted`; las filas pulsables usan highlight (sin escala), como
 * corresponde a una lista.
 */
export function ListRow({
  title,
  description,
  value,
  leading,
  accessory,
  children,
  onPress,
  showChevron = false,
  disabled = false,
  className,
  accessibilityLabel,
}: ListRowProps) {
  const muted = useThemeColor("muted");

  const body =
    children !== undefined ? (
      children
    ) : (
      <View className="min-w-0 flex-1">
        {title !== undefined && (
          <Text numberOfLines={1} className="t-body text-foreground">
            {title}
          </Text>
        )}
        {description !== undefined && (
          <Text numberOfLines={2} className="t-meta text-muted">
            {description}
          </Text>
        )}
      </View>
    );

  const content = (
    <>
      {leading}
      {body}
      {value !== undefined && (
        <Text numberOfLines={1} className="t-label text-muted">
          {value}
        </Text>
      )}
      {accessory ??
        (showChevron ? (
          <MaterialIcons name="chevron-right" size={20} color={muted} />
        ) : null)}
    </>
  );

  const base = `min-h-14 flex-row items-center gap-3 px-4 py-2.5 ${
    disabled ? "opacity-50" : ""
  } ${className ?? ""}`;

  if (onPress === undefined) {
    return <View className={base}>{content}</View>;
  }

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled }}
      className={`${base} active:bg-surface-secondary`}
    >
      {content}
    </Pressable>
  );
}
