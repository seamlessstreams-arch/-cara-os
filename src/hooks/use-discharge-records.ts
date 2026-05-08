import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DischargeRecord } from "@/types/extended";

const KEY = "discharge-records";
const API = "/api/v1/discharge-records";

export function useDischargeRecords(childId?: string) {
  return useQuery<{ data: DischargeRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateDischargeRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DischargeRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateDischargeRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DischargeRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
