import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MedicationNearMiss } from "@/types/extended";

const KEY = "medication-near-misses";
const API = "/api/v1/medication-near-misses";

export function useMedicationNearMisses(childId?: string) {
  return useQuery<{ data: MedicationNearMiss[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateMedicationNearMiss() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MedicationNearMiss>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateMedicationNearMiss() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MedicationNearMiss> & { id: string }) =>
      fetch(API, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
