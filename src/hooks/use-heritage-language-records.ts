import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { HeritageLanguageRecord } from "@/types/extended";

const KEY = "heritage-language-records";
const API = "/api/v1/heritage-language-records";

export function useHeritageLanguageRecords(childId?: string) {
  return useQuery<{ data: HeritageLanguageRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateHeritageLanguageRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<HeritageLanguageRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateHeritageLanguageRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<HeritageLanguageRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
