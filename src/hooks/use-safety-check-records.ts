import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SafetyCheckRecord } from "@/types/extended";

const KEY = "safety-check-records";
const API = "/api/v1/safety-check-records";

export function useSafetyCheckRecords() {
  return useQuery<{ data: SafetyCheckRecord[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateSafetyCheckRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SafetyCheckRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateSafetyCheckRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SafetyCheckRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
