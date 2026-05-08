import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AutismPlan } from "@/types/extended";

const KEY = "autism-plans";
const API = "/api/v1/autism-plans";

export function useAutismPlans(childId?: string) {
  return useQuery<{ data: AutismPlan[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateAutismPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AutismPlan>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateAutismPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AutismPlan> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
