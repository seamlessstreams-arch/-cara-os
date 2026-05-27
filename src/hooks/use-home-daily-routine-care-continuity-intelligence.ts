"use client";

import { useQuery } from "@tanstack/react-query";
import type { DailyRoutineResult } from "@/lib/engines/home-daily-routine-care-continuity-intelligence-engine";

interface DailyRoutineResponse { data: DailyRoutineResult; }

export function useHomeDailyRoutineCareContinuityIntelligence() {
  return useQuery<DailyRoutineResponse>({
    queryKey: ["home-daily-routine-care-continuity-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-daily-routine-care-continuity-intelligence");
      if (!res.ok) throw new Error("Failed to fetch daily routine & care continuity intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
