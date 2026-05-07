import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DisruptionPreventionPlan } from "@/types/extended";

const KEY = "disruption-prevention-plans";
const API = "/api/v1/disruption-prevention-plans";

export function useDisruptionPreventionPlans(childId?: string) {
  return useQuery<{ data: DisruptionPreventionPlan[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateDisruptionPreventionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DisruptionPreventionPlan>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateDisruptionPreventionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DisruptionPreventionPlan> & { id: string }) =>
      fetch(API, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
