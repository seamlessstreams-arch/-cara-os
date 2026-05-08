import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { EpilepsySeizurePlan } from "@/types/extended";

const KEY = "epilepsy-seizure-plans";
const API = "/api/v1/epilepsy-seizure-plans";

export function useEpilepsySeizurePlans(childId?: string) {
  return useQuery<{ data: EpilepsySeizurePlan[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateEpilepsySeizurePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EpilepsySeizurePlan>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateEpilepsySeizurePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EpilepsySeizurePlan> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
