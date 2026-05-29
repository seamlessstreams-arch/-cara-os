"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeSavingsBankingSkillsIntelligence() {
  return useQuery({
    queryKey: ["home-savings-banking-skills-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-savings-banking-skills-intelligence");
      if (!res.ok) throw new Error("Failed to fetch savings and banking skills intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
