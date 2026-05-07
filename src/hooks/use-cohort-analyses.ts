import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CohortAnalysis } from "@/types/extended";

const KEY = "cohort-analyses";
const API = "/api/v1/cohort-analyses";

export function useCohortAnalyses() {
  return useQuery<{ data: CohortAnalysis[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateCohortAnalysis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CohortAnalysis>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateCohortAnalysis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CohortAnalysis> & { id: string }) =>
      fetch(API, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
