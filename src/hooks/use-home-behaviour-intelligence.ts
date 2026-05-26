"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeBehaviourResult } from "@/lib/engines/home-behaviour-intelligence-engine";

interface HomeBehaviourResponse {
  data: HomeBehaviourResult;
}

export function useHomeBehaviourIntelligence() {
  return useQuery<HomeBehaviourResponse>({
    queryKey: ["home-behaviour-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-behaviour-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home behaviour intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
