import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MedicationAuditRecord } from "@/types/extended";

const KEY = "medication-audits";
const API = "/api/v1/medication-audits";

export function useMedicationAudits(childId?: string) {
  return useQuery<{ data: MedicationAuditRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateMedicationAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MedicationAuditRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateMedicationAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MedicationAuditRecord> & { id: string }) =>
      fetch(API, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
