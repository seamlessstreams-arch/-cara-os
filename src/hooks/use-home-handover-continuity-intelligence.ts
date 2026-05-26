"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeHandoverResult } from "@/lib/engines/home-handover-continuity-intelligence-engine";

interface HomeHandoverResponse {
  data: HomeHandoverResult;
}

export function useHomeHandoverContinuityIntelligence() {
  return useQuery<HomeHandoverResponse>({
    queryKey: ["home-handover-continuity-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-handover-continuity-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home handover continuity intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
