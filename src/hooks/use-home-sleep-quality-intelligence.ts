"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeSleepQualityResult } from "@/lib/engines/home-sleep-quality-intelligence-engine";

interface HomeSleepQualityResponse {
  data: HomeSleepQualityResult;
}

export function useHomeSleepQualityIntelligence() {
  return useQuery<HomeSleepQualityResponse>({
    queryKey: ["home-sleep-quality-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-sleep-quality-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home sleep quality intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
