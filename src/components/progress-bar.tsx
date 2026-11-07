import { View } from "react-native";

export type ProgressTone = "accent" | "success";

interface ProgressBarProps {
  /** Progreso entre 0 y 1. */
  value: number;
  /** `accent` = descargas (accent-ink); `success` = traducciones. */
  tone?: ProgressTone;
  /** Override del relleno para casos concretos (p. ej. estadísticas). */
  colorClass?: string;
  className?: string;
}

/**
 * Barra de progreso Material 3 (spec 0.4.0-01): 4 px, track
 * `surface-tertiary`, relleno `accent-ink` o `success`.
 */
export function ProgressBar({
  value,
  tone = "accent",
  colorClass,
  className,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, value));
  const fill =
    colorClass ?? (tone === "success" ? "bg-success" : "bg-accent-ink");

  return (
    <View
      className={`h-1 w-full overflow-hidden rounded-full bg-surface-tertiary ${className ?? ""}`}
    >
      <View
        className={`h-full rounded-full ${fill}`}
        style={{ width: `${pct * 100}%` }}
      />
    </View>
  );
}
