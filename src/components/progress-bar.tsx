import { View } from "react-native";

interface ProgressBarProps {
  /** Progreso entre 0 y 1. */
  value: number;
  /** Color de relleno (clase tailwind de tema heroui). */
  colorClass?: string;
  className?: string;
}

/**
 * Barra de progreso mínima: HeroUI Native aún no incluye Progress
 * (equivalente del .bar/.bar-fill del design system web).
 */
export function ProgressBar({
  value,
  colorClass = "bg-accent",
  className,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      className={`h-1.5 w-full overflow-hidden rounded-full bg-surface-tertiary ${className ?? ""}`}
    >
      <View
        className={`h-full rounded-full ${colorClass}`}
        style={{ width: `${pct * 100}%` }}
      />
    </View>
  );
}
