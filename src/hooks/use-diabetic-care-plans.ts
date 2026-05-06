import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DiabeticCarePlan } from "@/types/extended";

const KEY = "diabetic-care-plans";
const API = "/api/v1/diabetic-care-plans";

export function useDiabeticCarePlans(childId?: string) {
  return useQuery<{ data: DiabeticCarePlan[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateDiabeticCarePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DiabeticCarePlan>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateDiabeticCarePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DiabeticCarePlan> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
