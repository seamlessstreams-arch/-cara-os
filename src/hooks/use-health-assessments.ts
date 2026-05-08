import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { HealthAssessment } from "@/types/extended";

const KEY = "health-assessments";
const API = "/api/v1/health-assessments";

export function useHealthAssessments(childId?: string) {
  return useQuery<{ data: HealthAssessment[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateHealthAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<HealthAssessment>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateHealthAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<HealthAssessment> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
