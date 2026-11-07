import { Text } from "react-native";
import { JobRow, isActiveState, type JobLike } from "@/components/job-row";
import { ListCard, ListRow } from "@/components/list-card";

interface JobsCardProps {
  jobs: JobLike[];
  onCancel: (id: string) => void;
  onDismiss: (id: string) => void;
}

/**
 * Trabajos de la sesión bajo el formulario (spec 0.4.0-03): una `ListCard`
 * con una fila por job; con la sesión vacía, una fila informativa.
 */
export function JobsCard({ jobs, onCancel, onDismiss }: JobsCardProps) {
  return (
    <ListCard>
      {jobs.length === 0 ? (
        <ListRow>
          <Text className="t-meta text-muted">
            Los trabajos que lanzas aparecen aquí; se borran al cerrar la app.
          </Text>
        </ListRow>
      ) : (
        jobs.map((job) => (
          <JobRow
            key={job.id}
            job={job}
            onCancel={
              isActiveState(job.state)
                ? () => onCancel(job.id)
                : undefined
            }
            onDismiss={() => onDismiss(job.id)}
          />
        ))
      )}
    </ListCard>
  );
}
