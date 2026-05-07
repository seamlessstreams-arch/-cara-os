import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MenstrualHealthPlan } from "@/types/extended";

const KEY = "menstrual-health-plans";
const API = "/api/v1/menstrual-health-plans";

export function useMenstrualHealthPlans(childId?: string) {
  return useQuery<{ data: MenstrualHealthPlan[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateMenstrualHealthPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MenstrualHealthPlan>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateMenstrualHealthPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MenstrualHealthPlan> & { id: string }) =>
      fetch(API, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
