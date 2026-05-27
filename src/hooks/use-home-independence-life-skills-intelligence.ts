"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeIndependenceLifeSkillsResult } from "@/lib/engines/home-independence-life-skills-intelligence-engine";

interface HomeIndependenceLifeSkillsResponse {
  data: HomeIndependenceLifeSkillsResult;
}

export function useHomeIndependenceLifeSkillsIntelligence() {
  return useQuery<HomeIndependenceLifeSkillsResponse>({
    queryKey: ["home-independence-life-skills-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-independence-life-skills-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home independence life skills intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
