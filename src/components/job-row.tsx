import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { Spinner } from "heroui-native/spinner";
import { useThemeColor } from "heroui-native/hooks";
import { isActiveState, isCancellableState } from "@/lib/jobs";
import type { JobState } from "@/lib/types";

export { isActiveState, isCancellableState } from "@/lib/jobs";

export const JOB_LABELS: Record<JobState, string> = {
  pending: "En cola",
  running: "Trabajando…",
  cancelling: "Cancelando…",
  done: "Listo",
  error: "Error",
  cancelled: "Cancelado",
};

export interface JobLike {
  id: string;
  source: "web" | "pdf";
  state: JobState;
  error: string | null;
}

/** Datos mínimos que pinta la fila; `id` puede faltar en acciones locales. */
export interface JobRowData {
  id: string | null;
  source?: "web" | "pdf";
  state: JobState;
  error: string | null;
}

interface JobRowProps {
  job: JobRowData;
  /** Sustituye el título derivado de `source` (acciones del detalle). */
  title?: string;
  onCancel?: () => void;
  onDismiss: () => void;
}

/**
 * Fila de trabajo de la sesión (spec 0.4.0-03): icono de estado de 28, título
 * con origen y estado, id en 12/16, error en `danger`; `Cancelar` en
 * accent-ink para jobs activos y `Quitar` cierra la fila.
 */
export function JobRow({ job, title, onCancel, onDismiss }: JobRowProps) {
  const active = isActiveState(job.state);
  const cancellable = isCancellableState(job.state);
  const label =
    title ?? (job.source === "pdf" ? "PDF" : "Descarga web");
  const success = useThemeColor("success");
  const danger = useThemeColor("danger");
  const muted = useThemeColor("muted");

  const icon =
    job.state === "done"
      ? "check"
      : job.state === "error"
        ? "error"
        : job.state === "cancelled"
          ? "cancel"
          : null;
  const iconColor =
    job.state === "done" ? success : job.state === "error" ? danger : muted;

  return (
    <View className="min-h-14 flex-row items-center gap-3 px-4 py-2.5">
      <View className="h-7 w-7 items-center justify-center">
        {active ? (
          <Spinner size="sm" />
        ) : (
          <MaterialIcons
            name={icon ?? "help"}
            size={24}
            color={iconColor}
          />
        )}
      </View>
      <View className="min-w-0 flex-1">
        <View className="flex-row items-baseline gap-2">
          <Text
            numberOfLines={1}
            className="t-body text-foreground"
          >
            {label}
          </Text>
          <Text
            numberOfLines={1}
            className="t-meta shrink-0 text-muted"
          >
            {JOB_LABELS[job.state]}
          </Text>
        </View>
        {job.id !== null && (
          <Text numberOfLines={1} className="t-meta text-muted">
            {job.id}
          </Text>
        )}
        {job.error !== null && (
          <Text numberOfLines={2} className="t-meta text-danger">
            {job.error}
          </Text>
        )}
      </View>

      {active && onCancel !== undefined ? (
        cancellable ? (
          <Pressable
            onPress={onCancel}
            hitSlop={8}
            className="min-h-11 justify-center"
            accessibilityRole="button"
            accessibilityLabel="Cancelar job"
          >
            <Text className="t-label text-accent-ink">Cancelar</Text>
          </Pressable>
        ) : (
          // `cancelling`: cancelación pedida, se espera a `cancelled`.
          <View
            className="min-h-11 justify-center"
            accessibilityState={{ disabled: true, busy: true }}
          >
            <Text className="t-label text-muted">Cancelando…</Text>
          </View>
        )
      ) : (
        <Pressable
          onPress={onDismiss}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Quitar de la lista"
          className="h-11 w-11 items-center justify-center"
        >
          <MaterialIcons name="close" size={20} color={muted} />
        </Pressable>
      )}
    </View>
  );
}
