"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeYoungPersonDailyWellbeingIntelligence() {
  return useQuery({
    queryKey: ["home-young-person-daily-wellbeing-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-young-person-daily-wellbeing-intelligence");
      if (!res.ok) throw new Error("Failed to fetch young person daily wellbeing intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
