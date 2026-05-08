import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TrackedDocument } from "@/types/extended";

const KEY = "tracked-documents";
const API = "/api/v1/tracked-documents";

export function useTrackedDocuments() {
  return useQuery<{ data: TrackedDocument[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreateTrackedDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TrackedDocument>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateTrackedDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TrackedDocument> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
