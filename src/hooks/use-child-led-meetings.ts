import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ChildLedMeetingRecord } from "@/types/extended";

const KEY = "child-led-meetings";
const API = "/api/v1/child-led-meetings";

export function useChildLedMeetings(childId?: string) {
  return useQuery<{ data: ChildLedMeetingRecord[] }>({
    queryKey: childId ? [KEY, childId] : [KEY],
    queryFn: () => fetch(childId ? `${API}?child_id=${childId}` : API).then((r) => r.json()),
  });
}

export function useCreateChildLedMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ChildLedMeetingRecord>) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateChildLedMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ChildLedMeetingRecord> & { id: string }) =>
      fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
