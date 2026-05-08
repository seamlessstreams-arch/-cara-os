import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { EatingSupportPlan } from "@/types/extended";

const KEY = "eating-support-plans";
const API = "/api/v1/eating-support-plans";

export function useEatingSupportPlans(childId?: string) {
  return useQuery<{ data: EatingSupportPlan[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateEatingSupportPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EatingSupportPlan>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateEatingSupportPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EatingSupportPlan> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
