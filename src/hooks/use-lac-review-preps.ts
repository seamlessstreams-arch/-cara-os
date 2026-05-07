import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { LacReviewPrep } from "@/types/extended";

const KEY = "lac-review-preps";

export function useLacReviewPreps(childId?: string) {
  return useQuery<{ data: LacReviewPrep[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () =>
      fetch(
        childId
          ? `/api/v1/lac-review-preps?child_id=${childId}`
          : "/api/v1/lac-review-preps"
      ).then((r) => r.json()),
  });
}

export function useCreateLacReviewPrep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LacReviewPrep>) =>
      fetch("/api/v1/lac-review-preps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateLacReviewPrep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LacReviewPrep> & { id: string }) =>
      fetch("/api/v1/lac-review-preps", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
