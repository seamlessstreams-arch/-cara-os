"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeCompetencyLandscapeResult } from "@/lib/engines/home-competency-landscape-intelligence-engine";

interface HomeCompetencyLandscapeResponse {
  data: HomeCompetencyLandscapeResult;
}

export function useHomeCompetencyLandscapeIntelligence() {
  return useQuery<HomeCompetencyLandscapeResponse>({
    queryKey: ["home-competency-landscape-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-competency-landscape-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home competency landscape intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
