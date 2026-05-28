"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeIndependenceLifeSkillsDevelopmentIntelligence() {
  return useQuery({
    queryKey: ["home-independence-life-skills-development-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-independence-life-skills-development-intelligence");
      if (!res.ok) throw new Error("Failed to fetch independence life skills development intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
