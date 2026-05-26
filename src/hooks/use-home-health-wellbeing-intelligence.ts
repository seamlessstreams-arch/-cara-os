"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeHealthWellbeingResult } from "@/lib/engines/home-health-wellbeing-intelligence-engine";

interface HomeHealthWellbeingResponse {
  data: HomeHealthWellbeingResult;
}

export function useHomeHealthWellbeingIntelligence() {
  return useQuery<HomeHealthWellbeingResponse>({
    queryKey: ["home-health-wellbeing-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-health-wellbeing-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home health wellbeing intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
