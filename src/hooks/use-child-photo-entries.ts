import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ChildPhotoEntry } from "@/types/extended";

const KEY = "child-photo-entries";
const API = "/api/v1/child-photo-entries";

export function useChildPhotoEntries(childId?: string) {
  return useQuery<{ data: ChildPhotoEntry[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateChildPhotoEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ChildPhotoEntry>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateChildPhotoEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ChildPhotoEntry> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
