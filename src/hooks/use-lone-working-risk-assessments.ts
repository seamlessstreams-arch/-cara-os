import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { LoneWorkingRiskAssessment } from "@/types/extended";

const KEY = "lone-working-risk-assessments";

export function useLoneWorkingRiskAssessments() {
  return useQuery<{ data: LoneWorkingRiskAssessment[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/lone-working-risk-assessments").then((r) => r.json()),
  });
}

export function useCreateLoneWorkingRiskAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LoneWorkingRiskAssessment>) =>
      fetch("/api/v1/lone-working-risk-assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateLoneWorkingRiskAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LoneWorkingRiskAssessment> & { id: string }) =>
      fetch("/api/v1/lone-working-risk-assessments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
