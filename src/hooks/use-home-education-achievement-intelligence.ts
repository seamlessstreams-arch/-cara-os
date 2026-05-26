"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeEducationResult } from "@/lib/engines/home-education-achievement-intelligence-engine";

interface HomeEducationResponse {
  data: HomeEducationResult;
}

export function useHomeEducationAchievementIntelligence() {
  return useQuery<HomeEducationResponse>({
    queryKey: ["home-education-achievement-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-education-achievement-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home education achievement intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
