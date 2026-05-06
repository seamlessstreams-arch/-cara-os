import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PhotoIdRecord } from "@/types/extended";

const KEY = "photo-id-records";
const API = "/api/v1/photo-id-records";

export function usePhotoIdRecords(childId?: string) {
  return useQuery<{ data: PhotoIdRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreatePhotoIdRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PhotoIdRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdatePhotoIdRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PhotoIdRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
