import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AnnualHealthAssessment } from "@/types/extended";

const KEY = "annual-health-assessments";
const API = "/api/v1/annual-health-assessments";

export function useAnnualHealthAssessments(childId?: string) {
  return useQuery<{ data: AnnualHealthAssessment[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateAnnualHealthAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AnnualHealthAssessment>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateAnnualHealthAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AnnualHealthAssessment> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
