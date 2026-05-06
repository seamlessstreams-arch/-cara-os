import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { NeedsAssessment } from "@/types/extended";

const KEY = "needs-assessments";
const API = "/api/v1/needs-assessments";

export function useNeedsAssessments(childId?: string) {
  return useQuery<{ data: NeedsAssessment[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateNeedsAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<NeedsAssessment>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateNeedsAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<NeedsAssessment> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
