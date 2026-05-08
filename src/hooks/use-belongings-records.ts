import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BelongingsRecord } from "@/types/extended";

const KEY = "belongings-records";
const API = "/api/v1/belongings-records";

export function useBelongingsRecords(childId?: string) {
  return useQuery<{ data: BelongingsRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateBelongingsRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BelongingsRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateBelongingsRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BelongingsRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
