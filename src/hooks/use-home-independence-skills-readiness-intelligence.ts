"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeIndependenceSkillsReadinessIntelligence() {
  return useQuery({
    queryKey: ["home-independence-skills-readiness-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-independence-skills-readiness-intelligence");
      if (!res.ok) throw new Error("Failed to fetch independence skills readiness intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
