"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeWeeklyPlannerActivityScheduleIntelligence() {
  return useQuery({
    queryKey: ["home-weekly-planner-activity-schedule-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-weekly-planner-activity-schedule-intelligence");
      if (!res.ok) throw new Error("Failed to fetch weekly planner activity schedule intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
