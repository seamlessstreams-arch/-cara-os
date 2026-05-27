"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeShiftPatternResult } from "@/lib/engines/home-shift-pattern-intelligence-engine";

interface HomeShiftPatternResponse {
  data: HomeShiftPatternResult;
}

export function useHomeShiftPatternIntelligence() {
  return useQuery<HomeShiftPatternResponse>({
    queryKey: ["home-shift-pattern-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-shift-pattern-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home shift pattern intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
