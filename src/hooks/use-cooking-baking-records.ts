import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CookingBakingRecord } from "@/types/extended";

const KEY = "cooking-baking-records";
const API = "/api/v1/cooking-baking-records";

export function useCookingBakingRecords(childId?: string) {
  return useQuery<{ data: CookingBakingRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateCookingBakingRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CookingBakingRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateCookingBakingRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CookingBakingRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
