import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MedicationStorageAudit } from "@/types/extended";

const KEY = "medication-storage-audits";
const API = "/api/v1/medication-storage-audits";

export function useMedicationStorageAudits() {
  return useQuery<{ data: MedicationStorageAudit[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateMedicationStorageAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MedicationStorageAudit>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateMedicationStorageAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MedicationStorageAudit> & { id: string }) =>
      fetch(API, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
