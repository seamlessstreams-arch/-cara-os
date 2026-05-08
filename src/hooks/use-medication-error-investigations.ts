import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MedicationErrorInvestigation } from "@/types/extended";

const KEY = "medication-error-investigations";
const API = "/api/v1/medication-error-investigations";

export function useMedicationErrorInvestigations(childId?: string) {
  return useQuery<{ data: MedicationErrorInvestigation[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateMedicationErrorInvestigation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MedicationErrorInvestigation>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateMedicationErrorInvestigation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MedicationErrorInvestigation> & { id: string }) =>
      fetch(API, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
