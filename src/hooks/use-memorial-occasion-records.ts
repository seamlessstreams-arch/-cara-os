import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MemorialOccasionRecord } from "@/types/extended";

const KEY = "memorial-occasion-records";
const API = "/api/v1/memorial-occasion-records";

export function useMemorialOccasionRecords(childId?: string) {
  return useQuery<{ data: MemorialOccasionRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateMemorialOccasionRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MemorialOccasionRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateMemorialOccasionRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MemorialOccasionRecord> & { id: string }) =>
      fetch(API, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
