import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ImpactAssessment } from "@/types/extended";

const KEY = "impact-assessments";

export function useImpactAssessments() {
  return useQuery<{ data: ImpactAssessment[] }>({
    queryKey: [KEY],
    queryFn: async () => {
      const res = await fetch("/api/v1/impact-assessments");
      return res.json();
    },
  });
}

export function useCreateImpactAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ImpactAssessment>) => {
      const res = await fetch("/api/v1/impact-assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
