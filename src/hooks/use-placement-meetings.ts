import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PlacementMeeting } from "@/types/extended";

const KEY = "placement-meetings";
const API = "/api/v1/placement-meetings";

export function usePlacementMeetings(childId?: string) {
  return useQuery<{ data: PlacementMeeting[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreatePlacementMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PlacementMeeting>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdatePlacementMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PlacementMeeting> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
