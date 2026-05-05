import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BodyMapEntry } from "@/types/extended";

const KEY = "body-map";
const API = "/api/v1/body-map";

export function useBodyMap(childId?: string) {
  return useQuery<{ data: BodyMapEntry[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateBodyMapEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BodyMapEntry>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateBodyMapEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BodyMapEntry> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
