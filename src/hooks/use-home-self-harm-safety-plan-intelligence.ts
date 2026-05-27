"use client";

import { useQuery } from "@tanstack/react-query";
import type { SelfHarmSafetyPlanResult } from "@/lib/engines/home-self-harm-safety-plan-intelligence-engine";

export function useHomeSelfHarmSafetyPlanIntelligence() {
  return useQuery<SelfHarmSafetyPlanResult>({
    queryKey: ["home-self-harm-safety-plan-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-self-harm-safety-plan-intelligence");
      if (!res.ok) throw new Error("Failed to fetch self-harm safety plan intelligence");
      const json = await res.json();
      return json.data;
    },
    refetchInterval: 60_000,
  });
}
