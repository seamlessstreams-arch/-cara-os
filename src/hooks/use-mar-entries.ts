import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { MarEntry } from "@/types/extended";

const KEY = "mar-entries";
const API = "/api/v1/mar-entries";

export function useMarEntries(childId?: string) {
  return useQuery<{ data: MarEntry[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateMarEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MarEntry>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateMarEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MarEntry> & { id: string }) =>
      fetch(API, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
