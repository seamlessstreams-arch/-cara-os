import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { EqualityTrainingRecord } from "@/types/extended";

const KEY = "equality-training";

export function useEqualityTraining() {
  return useQuery<{ data: EqualityTrainingRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/equality-training").then((r) => r.json()),
  });
}

export function useCreateEqualityTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EqualityTrainingRecord>) =>
      fetch("/api/v1/equality-training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
