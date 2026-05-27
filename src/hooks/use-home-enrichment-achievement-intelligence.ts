"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeEnrichmentAchievementResult } from "@/lib/engines/home-enrichment-achievement-intelligence-engine";

interface HomeEnrichmentAchievementResponse {
  data: HomeEnrichmentAchievementResult;
}

export function useHomeEnrichmentAchievementIntelligence() {
  return useQuery<HomeEnrichmentAchievementResponse>({
    queryKey: ["home-enrichment-achievement-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-enrichment-achievement-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home enrichment achievement intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
