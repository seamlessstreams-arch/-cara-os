import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { GenogramEntry } from "@/types/extended";

const KEY = "genogram-entries";
const API = "/api/v1/genogram-entries";

export function useGenogramEntries(childId?: string) {
  return useQuery<{ data: GenogramEntry[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateGenogramEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<GenogramEntry>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateGenogramEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<GenogramEntry> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
