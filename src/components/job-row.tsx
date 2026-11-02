import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { Spinner } from "heroui-native/spinner";
import type { JobState } from "@/lib/types";

export const JOB_LABELS: Record<JobState, string> = {
  pending: "En cola",
  running: "Trabajando…",
  done: "Listo",
  error: "Error",
  cancelled: "Cancelado",
};

export function isActiveState(state: JobState): boolean {
  return state === "pending" || state === "running";
}

export interface JobLike {
  id: string;
  source: "web" | "pdf";
  state: JobState;
  error: string | null;
}

interface JobRowProps {
  job: JobLike;
  onCancel?: () => void;
  onDismiss: () => void;
}

/** Fila de trabajo (Inicio): estado, origen, id y acciones. */
export function JobRow({ job, onCancel, onDismiss }: JobRowProps) {
  const active = isActiveState(job.state);
  const icon =
    job.state === "done"
      ? "checkmark-circle"
      : job.state === "error"
        ? "alert-circle"
        : job.state === "cancelled"
          ? "close-circle"
          : null;
  const iconColor =
    job.state === "done"
      ? "#15803d"
      : job.state === "error"
        ? "#dc2626"
        : "#8b8b93";

  return (
    <View className="flex-row items-start gap-3 border-b border-separator px-4 py-3 last:border-b-0">
      <View className="mt-0.5 h-5 w-5 items-center justify-center">
        {active ? (
          <Spinner size="sm" />
        ) : (
          <Ionicons name={icon ?? "ellipse-outline"} size={18} color={iconColor} />
        )}
      </View>

      <View className="flex-1 gap-0.5">
        <Text className="t-body text-foreground">
          {job.source === "web" ? "Descarga web" : "PDF"} ·{" "}
          {JOB_LABELS[job.state]}
        </Text>
        <Text className="t-meta text-muted">job {job.id}</Text>
        {job.error !== null && (
          <Text className="t-meta text-danger">{job.error}</Text>
        )}
      </View>

      {active && onCancel !== undefined && (
        <Pressable onPress={onCancel} hitSlop={8} className="min-h-11 justify-center">
          <Text className="t-label text-foreground">Cancelar</Text>
        </Pressable>
      )}

      <Pressable
        onPress={onDismiss}
        hitSlop={8}
        accessibilityLabel="Quitar de la lista"
        className={`min-h-11 justify-center ${active ? "opacity-0" : ""}`}
        pointerEvents={active ? "none" : "auto"}
      >
        <Ionicons name="close" size={18} color="#8b8b93" />
      </Pressable>
    </View>
  );
}
