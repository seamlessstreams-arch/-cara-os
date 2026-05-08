import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { LessonLearned } from "@/types/extended";

const KEY = "lessons-learned";

export function useLessonsLearned() {
  return useQuery<{ data: LessonLearned[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/lessons-learned").then((r) => r.json()),
  });
}

export function useCreateLessonLearned() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LessonLearned>) =>
      fetch("/api/v1/lessons-learned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateLessonLearned() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LessonLearned> & { id: string }) =>
      fetch("/api/v1/lessons-learned", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
