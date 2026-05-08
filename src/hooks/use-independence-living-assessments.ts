import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { IndependenceLivingAssessment } from "@/types/extended";

const KEY = "independence-living-assessments";

export function useIndependenceLivingAssessments(childId?: string) {
  return useQuery<{ data: IndependenceLivingAssessment[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () =>
      fetch(childId ? `/api/v1/independence-living-assessments?child_id=${childId}` : "/api/v1/independence-living-assessments").then((r) => r.json()),
  });
}

export function useCreateIndependenceLivingAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<IndependenceLivingAssessment>) =>
      fetch("/api/v1/independence-living-assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
