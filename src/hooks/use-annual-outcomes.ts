import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AnnualOutcome } from "@/types/extended";

const KEY = "annual-outcomes";
const API = "/api/v1/annual-outcomes";

export function useAnnualOutcomes(childId?: string) {
  return useQuery<{ data: AnnualOutcome[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateAnnualOutcome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AnnualOutcome>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateAnnualOutcome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AnnualOutcome> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
