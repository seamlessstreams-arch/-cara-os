import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ChildKeyDocument } from "@/types/extended";

const KEY = "child-key-documents";
const API = "/api/v1/child-key-documents";

export function useChildKeyDocuments(childId?: string) {
  return useQuery<{ data: ChildKeyDocument[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateChildKeyDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ChildKeyDocument>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateChildKeyDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ChildKeyDocument> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
