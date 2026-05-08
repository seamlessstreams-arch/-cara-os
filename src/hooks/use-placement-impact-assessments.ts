import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PlacementImpactAssessment } from "@/types/extended";

const KEY = "placement-impact-assessments";
const API = "/api/v1/placement-impact-assessments";

export function usePlacementImpactAssessments() {
  return useQuery<{ data: PlacementImpactAssessment[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreatePlacementImpactAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PlacementImpactAssessment>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdatePlacementImpactAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PlacementImpactAssessment> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
