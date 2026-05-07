import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ResolutionMeeting } from "@/types/extended";

const KEY = "resolution-meetings";

export function useResolutionMeetings() {
  return useQuery<{ data: ResolutionMeeting[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/resolution-meetings").then((r) => r.json()),
  });
}

export function useCreateResolutionMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ResolutionMeeting>) =>
      fetch("/api/v1/resolution-meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
