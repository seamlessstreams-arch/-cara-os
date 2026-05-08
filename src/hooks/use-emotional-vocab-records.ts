import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { EmotionalVocabRecord } from "@/types/extended";

const KEY = "emotional-vocab-records";
const API = "/api/v1/emotional-vocab-records";

export function useEmotionalVocabRecords(childId?: string) {
  return useQuery<{ data: EmotionalVocabRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateEmotionalVocabRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EmotionalVocabRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateEmotionalVocabRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EmotionalVocabRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
