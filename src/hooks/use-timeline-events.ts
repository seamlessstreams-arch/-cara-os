"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TimelineEvent } from "@/types/extended";

const KEY = "timeline-events";

export function useTimelineEvents(childId?: string, homeId?: string) {
  const qs = childId ? `?child_id=${childId}` : homeId ? `?home_id=${homeId}` : "";
  return useQuery<{ data: TimelineEvent[] }>({
    queryKey: [KEY, childId, homeId],
    queryFn: () => fetch(`/api/v1/timeline-events${qs}`).then((r) => r.json()),
  });
}

export function useCreateTimelineEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TimelineEvent>) =>
      fetch("/api/v1/timeline-events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
