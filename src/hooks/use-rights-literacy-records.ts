import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { RightsLiteracyRecord } from "@/types/extended";

const KEY = "rights-literacy-records";
const API = "/api/v1/rights-literacy-records";

export function useRightsLiteracyRecords(childId?: string) {
  return useQuery<{ data: RightsLiteracyRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateRightsLiteracyRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<RightsLiteracyRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateRightsLiteracyRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<RightsLiteracyRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
