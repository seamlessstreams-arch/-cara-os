import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MedicationError } from "@/types/extended";

const KEY = "medication-errors";
const API = "/api/v1/medication-errors";

export function useMedicationErrors(childId?: string) {
  return useQuery<{ data: MedicationError[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateMedicationError() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MedicationError>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateMedicationError() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MedicationError> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
