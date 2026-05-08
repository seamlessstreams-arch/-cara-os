import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ConsentRecord } from "@/types/extended";

const KEY = "consent-records";
const API = "/api/v1/consent-records";

export function useConsentRecords(childId?: string) {
  return useQuery<{ data: ConsentRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateConsentRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ConsentRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateConsentRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ConsentRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
