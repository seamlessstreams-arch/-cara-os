import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PlacementBudgetTracker } from "@/types/extended";

const KEY = "placement-budget-trackers";
const API = "/api/v1/placement-budget-trackers";

export function usePlacementBudgetTrackers(childId?: string) {
  return useQuery<{ data: PlacementBudgetTracker[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreatePlacementBudgetTracker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PlacementBudgetTracker>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdatePlacementBudgetTracker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PlacementBudgetTracker> & { id: string }) =>
      fetch(API, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
