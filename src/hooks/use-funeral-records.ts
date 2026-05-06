import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FuneralRecord } from "@/types/extended";

const KEY = "funeral-records";
const API = "/api/v1/funeral-records";

export function useFuneralRecords(childId?: string) {
  return useQuery<{ data: FuneralRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateFuneralRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FuneralRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateFuneralRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FuneralRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
