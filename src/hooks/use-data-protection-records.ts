import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DataProtectionRecord } from "@/types/extended";

const KEY = "data-protection-records";
const API = "/api/v1/data-protection-records";

export function useDataProtectionRecords() {
  return useQuery<{ data: DataProtectionRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateDataProtectionRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DataProtectionRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateDataProtectionRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DataProtectionRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
