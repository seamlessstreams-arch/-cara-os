import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DailyRiskBriefing } from "@/types/extended";

const KEY = "daily-risk-briefings";

export function useDailyRiskBriefings() {
  return useQuery<{ data: DailyRiskBriefing[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/daily-risk-briefings").then((r) => r.json()),
  });
}

export function useCreateDailyRiskBriefing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DailyRiskBriefing>) =>
      fetch("/api/v1/daily-risk-briefings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
