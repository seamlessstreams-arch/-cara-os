import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SpldSupportPlan } from "@/types/extended";

const KEY = "spld-support-plans";
const API = "/api/v1/spld-support-plans";

export function useSpldSupportPlans(childId?: string) {
  return useQuery<{ data: SpldSupportPlan[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateSpldSupportPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SpldSupportPlan>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateSpldSupportPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SpldSupportPlan> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
