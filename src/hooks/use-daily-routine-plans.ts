import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DailyRoutinePlan } from "@/types/extended";

const KEY = "daily-routine-plans";

export function useDailyRoutinePlans() {
  return useQuery<{ data: DailyRoutinePlan[] }>({
    queryKey: [KEY],
    queryFn: () => fetch("/api/v1/daily-routine-plans").then((r) => r.json()),
  });
}

export function useCreateDailyRoutinePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DailyRoutinePlan>) =>
      fetch("/api/v1/daily-routine-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
