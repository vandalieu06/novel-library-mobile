import type { ComponentProps, ReactNode } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useThemeColor } from "heroui-native/hooks";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

interface AppBarProps {
  title: string;
  /** Si se pasa, pinta la flecha de volver a la izquierda del título. */
  onBack?: () => void;
  /** Acciones de 40×40 a la derecha (`AppBarAction`). */
  actions?: ReactNode;
  className?: string;
}

/**
 * Top app bar Material 3 (spec 0.4.0-01): 56 de alto, título 22/28 500 y
 * acciones de 40×40. Sin sombra; el fondo es `background` para que el borde de
 * las cards y tabs haga la separación.
 */
export function AppBar({ title, onBack, actions, className }: AppBarProps) {
  return (
    <View
      className={`h-14 flex-row items-center gap-0.5 bg-background pl-4 pr-1 ${className ?? ""}`}
    >
      {onBack !== undefined && (
        <AppBarAction icon="arrow-back" label="Volver" onPress={onBack} className="-ml-2" />
      )}
      <Text numberOfLines={1} className="t-page flex-1 text-foreground">
        {title}
      </Text>
      {actions}
    </View>
  );
}

interface AppBarActionProps {
  icon: MaterialIconName;
  /** Etiqueta accesible (el icono no lleva texto). */
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  /**
   * Contador simple: cuando es > 0 dibuja un punto accent de 8 px arriba a la
   * derecha (p. ej. idiomas activos en Biblioteca, spec 0.4.0-02).
   */
  badge?: number;
  className?: string;
}

/** Acción de app bar: 40×40, radio 20, icono Material de 24. */
export function AppBarAction({
  icon,
  label,
  onPress,
  disabled = false,
  badge = 0,
  className,
}: AppBarActionProps) {
  const foreground = useThemeColor("foreground");

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      className={`h-10 w-10 items-center justify-center rounded-full active:bg-surface-secondary ${
        disabled ? "opacity-50" : ""
      } ${className ?? ""}`}
    >
      <MaterialIcons name={icon} size={24} color={foreground} />
      {badge > 0 && (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="absolute -right-0.5 -top-0.5 h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1"
        >
          <Text className="text-[10px] font-semibold leading-[14px] text-accent-foreground">
            {badge}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
