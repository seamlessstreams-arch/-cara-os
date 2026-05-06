import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CharityGrantRecord } from "@/types/extended";

const KEY = "charity-grant-records";
const API = "/api/v1/charity-grant-records";

export function useCharityGrantRecords(childId?: string) {
  return useQuery<{ data: CharityGrantRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateCharityGrantRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CharityGrantRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateCharityGrantRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CharityGrantRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
