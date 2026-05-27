"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeTransitionPlanningResult } from "@/lib/engines/home-transition-planning-intelligence-engine";

interface HomeTransitionPlanningResponse {
  data: HomeTransitionPlanningResult;
}

export function useHomeTransitionPlanningIntelligence() {
  return useQuery<HomeTransitionPlanningResponse>({
    queryKey: ["home-transition-planning-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-transition-planning-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home transition planning intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
