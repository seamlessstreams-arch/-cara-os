import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PlacementEndSummary } from "@/types/extended";

const KEY = "placement-end-summaries";
const API = "/api/v1/placement-end-summaries";

export function usePlacementEndSummaries() {
  return useQuery<{ data: PlacementEndSummary[] }>({
    queryKey: [KEY],
    queryFn: () => fetch(API).then((r) => r.json()),
  });
}

export function useCreatePlacementEndSummary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PlacementEndSummary>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdatePlacementEndSummary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PlacementEndSummary> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
