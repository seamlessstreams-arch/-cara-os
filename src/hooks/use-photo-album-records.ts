import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PhotoAlbumRecord } from "@/types/extended";

const KEY = "photo-album-records";
const API = "/api/v1/photo-album-records";

export function usePhotoAlbumRecords(childId?: string) {
  return useQuery<{ data: PhotoAlbumRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreatePhotoAlbumRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PhotoAlbumRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdatePhotoAlbumRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PhotoAlbumRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
