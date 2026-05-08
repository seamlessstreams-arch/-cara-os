import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CyclingBikeRecord } from "@/types/extended";

const KEY = "cycling-bike-records";
const API = "/api/v1/cycling-bike-records";

export function useCyclingBikeRecords(childId?: string) {
  return useQuery<{ data: CyclingBikeRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateCyclingBikeRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CyclingBikeRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateCyclingBikeRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CyclingBikeRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
