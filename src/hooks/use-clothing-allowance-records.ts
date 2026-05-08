import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ClothingAllowanceRecord } from "@/types/extended";

const KEY = "clothing-allowance-records";
const API = "/api/v1/clothing-allowance-records";

export function useClothingAllowanceRecords(childId?: string) {
  return useQuery<{ data: ClothingAllowanceRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateClothingAllowanceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ClothingAllowanceRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateClothingAllowanceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ClothingAllowanceRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
