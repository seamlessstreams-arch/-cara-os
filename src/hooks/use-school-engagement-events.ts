import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SchoolEngagementEvent } from "@/types/extended";

const KEY = "school-engagement-events";
const API = "/api/v1/school-engagement-events";

export function useSchoolEngagementEvents(childId?: string) {
  return useQuery<{ data: SchoolEngagementEvent[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateSchoolEngagementEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SchoolEngagementEvent>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateSchoolEngagementEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SchoolEngagementEvent> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
