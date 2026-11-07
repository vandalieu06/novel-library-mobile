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
  primary: "bg-accent",
  secondary: "bg-accent-soft",
  ghost: "bg-transparent",
  danger: "bg-danger",
};

const LABEL: Record<ActionTone, string> = {
  primary: "text-accent-foreground",
  secondary: "text-accent-ink",
  ghost: "text-foreground",
  danger: "text-danger-foreground",
};

/**
 * Botón único de la app (spec 0.4.0-01).
 *
 * - `primary` = accent terracota con texto blanco (Material 3 filled).
 * - `secondary` = tonal `accent-soft` + `accent-ink`.
 * - Altura 48 por defecto, radio 24 y label 15/20 500.
 * - `loading` conserva el contraste (HeroUI aplica 0.5 de opacidad con
 *   `isDisabled`, que dejaba el texto ilegible).
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
  const accentForeground = useThemeColor("accent-foreground");
  const dangerForeground = useThemeColor("danger-foreground");
  const blocked = loading || disabled;

  // Los portales de HeroUI (BottomSheet/Dialog/Menu) no heredan contextos de
  // la app en Android; por eso el color se lee del tema de HeroUI con
  // useThemeColor, que sí resuelve dentro del portal.
  const spinnerColor =
    tone === "primary"
      ? accentForeground
      : tone === "danger"
        ? dangerForeground
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
      } rounded-3xl ${ROOT[tone]} ${
        disabled ? "bg-surface-secondary" : ""
      } ${className ?? ""}`}
    >
      {loading && <Spinner size="sm" color={spinnerColor} />}
      <Button.Label
        className={`text-[15px] font-medium leading-5 ${
          disabled ? "text-muted" : LABEL[tone]
        }`}
      >
        {children}
      </Button.Label>
    </Button>
  );
}
