import type { ReactNode } from "react";
import { Button } from "heroui-native/button";
import { Spinner } from "heroui-native/spinner";
import { useThemeColor } from "heroui-native/hooks";

export type ActionTone = "primary" | "secondary" | "ghost" | "danger";

interface ActionButtonProps {
  children: ReactNode;
  tone?: ActionTone;
  onPress?: () => void;
  /** Muestra spinner y bloquea pulsaciones SIN aplicar la opacidad de disabled. */
  loading?: boolean;
  /** Deshabilitado real: solo cuando además se explica el motivo en pantalla. */
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  accessibilityLabel?: string;
}

const VARIANT: Record<
  ActionTone,
  "primary" | "secondary" | "ghost" | "danger"
> = {
  primary: "primary",
  secondary: "secondary",
  ghost: "ghost",
  danger: "danger",
};

const ROOT: Record<ActionTone, string> = {
  primary: "bg-foreground",
  secondary: "bg-surface-secondary",
  ghost: "bg-transparent",
  danger: "bg-danger",
};

const LABEL: Record<ActionTone, string> = {
  primary: "text-background",
  secondary: "text-foreground",
  ghost: "text-foreground",
  danger: "text-white",
};

/**
 * Botón único de la app (spec 0.3.0-01).
 *
 * - `primary` = tinta inversa (nunca el accent): 16.9:1 en claro y oscuro.
 * - `loading` conserva el contraste (HeroUI aplica 0.5 de opacidad con
 *   `isDisabled`, que dejaba el texto ilegible).
 * - Altura mínima 44 y radio 8, alineados con el resto de controles.
 */
export function ActionButton({
  children,
  tone = "primary",
  onPress,
  loading = false,
  disabled = false,
  size = "md",
  className,
  accessibilityLabel,
}: ActionButtonProps) {
  const foreground = useThemeColor("foreground");
  const background = useThemeColor("background");
  const blocked = loading || disabled;

  // Los portales de HeroUI (BottomSheet/Dialog/Menu) no heredan contextos de
  // la app en Android; por eso el color se lee del tema de HeroUI con
  // useThemeColor, que sí resuelve dentro del portal.
  const spinnerColor =
    tone === "primary"
      ? background
      : tone === "danger"
        ? "#ffffff"
        : foreground;

  return (
    <Button
      variant={VARIANT[tone]}
      size={size}
      background={tone === "secondary" ? null : undefined}
      onPress={blocked ? undefined : onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, busy: loading }}
      className={`${
        size === "sm" ? "h-11" : size === "md" ? "h-12" : "h-14"
      } rounded-lg ${ROOT[tone]} ${
        disabled ? "bg-surface-secondary" : ""
      } ${className ?? ""}`}
    >
      {loading && <Spinner size="sm" color={spinnerColor} />}
      <Button.Label
        className={`text-sm font-medium ${
          disabled ? "text-muted" : LABEL[tone]
        }`}
      >
        {children}
      </Button.Label>
    </Button>
  );
}
