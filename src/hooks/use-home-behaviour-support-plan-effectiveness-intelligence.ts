"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeBehaviourSupportPlanEffectivenessIntelligence() {
  return useQuery({
    queryKey: ["home-behaviour-support-plan-effectiveness-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-behaviour-support-plan-effectiveness-intelligence");
      if (!res.ok) throw new Error("Failed to fetch behaviour support plan effectiveness intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
