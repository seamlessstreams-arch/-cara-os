import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PositiveHandlingPlan } from "@/types/extended";

const KEY = "positive-handling";
const API = "/api/v1/positive-handling";

export function usePositiveHandling(childId?: string) {
  return useQuery<{ data: PositiveHandlingPlan[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreatePositiveHandlingPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PositiveHandlingPlan>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdatePositiveHandlingPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PositiveHandlingPlan> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
