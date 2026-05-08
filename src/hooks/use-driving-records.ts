import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DrivingRecord } from "@/types/extended";

const KEY = "driving-records";
const API = "/api/v1/driving-records";

export function useDrivingRecords(childId?: string) {
  return useQuery<{ data: DrivingRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateDrivingRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DrivingRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateDrivingRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DrivingRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
