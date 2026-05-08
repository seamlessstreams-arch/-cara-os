import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PlacementObjective } from "@/types/extended";

const KEY = "placement-objectives";
const API = "/api/v1/placement-objectives";

export function usePlacementObjectives(childId?: string) {
  return useQuery<{ data: PlacementObjective[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreatePlacementObjective() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PlacementObjective>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdatePlacementObjective() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PlacementObjective> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
