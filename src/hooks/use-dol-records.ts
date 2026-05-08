import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DoLRecord } from "@/types/extended";

const KEY = "dol-records";
const API = "/api/v1/dol-records";

export function useDoLRecords(childId?: string) {
  return useQuery<{ data: DoLRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateDoLRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DoLRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateDoLRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DoLRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
