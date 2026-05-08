import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DentalRecord } from "@/types/extended";

const KEY = "dental-records";
const API = "/api/v1/dental-records";

export function useDentalRecords(childId?: string) {
  return useQuery<{ data: DentalRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateDentalRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DentalRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateDentalRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DentalRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
