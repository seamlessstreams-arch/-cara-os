import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PhysioOtPlan } from "@/types/extended";

const KEY = "physio-ot-plans";
const API = "/api/v1/physio-ot-plans";

export function usePhysioOtPlans(childId?: string) {
  return useQuery<{ data: PhysioOtPlan[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreatePhysioOtPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PhysioOtPlan>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdatePhysioOtPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PhysioOtPlan> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
