import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { EmergencyPlan } from "@/types/extended";

const KEY = "emergency-plans";
const API = "/api/v1/emergency-plans";

export function useEmergencyPlans() {
  return useQuery<{ data: EmergencyPlan[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateEmergencyPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EmergencyPlan>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateEmergencyPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EmergencyPlan> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
