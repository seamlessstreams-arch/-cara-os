import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { EvacuationPlan } from "@/types/extended";

const KEY = "evacuation-plans";
const API = "/api/v1/evacuation-plans";

export function useEvacuationPlans() {
  return useQuery<{ data: EvacuationPlan[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateEvacuationPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EvacuationPlan>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateEvacuationPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EvacuationPlan> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
