"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeDailyRoutineStructureIntelligence() {
  return useQuery({
    queryKey: ["home-daily-routine-structure-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-daily-routine-structure-intelligence");
      if (!res.ok) throw new Error("Failed to fetch daily routine structure intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
