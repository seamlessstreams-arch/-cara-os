import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ImprovementObjective } from "@/types/extended";

const KEY = "improvement-objectives";
const API = "/api/v1/improvement-objectives";

export function useImprovementObjectives() {
  return useQuery<{ data: ImprovementObjective[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateImprovementObjective() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ImprovementObjective>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateImprovementObjective() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ImprovementObjective> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
