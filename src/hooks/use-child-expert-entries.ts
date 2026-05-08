import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ChildExpertEntry } from "@/types/extended";

const KEY = "child-expert-entries";
const API = "/api/v1/child-expert-entries";

export function useChildExpertEntries(childId?: string) {
  return useQuery<{ data: ChildExpertEntry[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateChildExpertEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ChildExpertEntry>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateChildExpertEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ChildExpertEntry> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
