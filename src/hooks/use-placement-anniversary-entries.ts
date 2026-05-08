import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PlacementAnniversaryEntry } from "@/types/extended";

const KEY = "placement-anniversary-entries";
const API = "/api/v1/placement-anniversary-entries";

export function usePlacementAnniversaryEntries(childId?: string) {
  return useQuery<{ data: PlacementAnniversaryEntry[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreatePlacementAnniversaryEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PlacementAnniversaryEntry>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdatePlacementAnniversaryEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PlacementAnniversaryEntry> & { id: string }) =>
      fetch(API, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
