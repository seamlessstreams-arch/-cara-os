import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TrainingMatrixRow } from "@/types/extended";

const KEY = "training-matrix-rows";

export function useTrainingMatrixRows() {
  return useQuery<{ data: TrainingMatrixRow[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/training-matrix-rows").then((r) => r.json()),
  });
}

export function useCreateTrainingMatrixRow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TrainingMatrixRow>) =>
      fetch("/api/v1/training-matrix-rows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateTrainingMatrixRow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TrainingMatrixRow> & { id: string }) =>
      fetch("/api/v1/training-matrix-rows", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
