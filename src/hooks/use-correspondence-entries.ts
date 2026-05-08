import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CorrespondenceEntry } from "@/types/extended";

const KEY = "correspondence-entries";
const API = "/api/v1/correspondence-entries";

export function useCorrespondenceEntries(childId?: string) {
  return useQuery<{ data: CorrespondenceEntry[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateCorrespondenceEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CorrespondenceEntry>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateCorrespondenceEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CorrespondenceEntry> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
