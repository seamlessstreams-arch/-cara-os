import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ContinencePlan } from "@/types/extended";

const KEY = "continence-plans";
const API = "/api/v1/continence-plans";

export function useContinencePlans(childId?: string) {
  return useQuery<{ data: ContinencePlan[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateContinencePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ContinencePlan>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateContinencePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ContinencePlan> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
