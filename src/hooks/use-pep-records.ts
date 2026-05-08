import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PepRecord } from "@/types/extended";

const KEY = "pep-records";
const API = "/api/v1/pep-records";

export function usePepRecords(childId?: string) {
  return useQuery<{ data: PepRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreatePepRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PepRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdatePepRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PepRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
