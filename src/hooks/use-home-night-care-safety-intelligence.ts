"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeNightCareSafetyResult } from "@/lib/engines/home-night-care-safety-intelligence-engine";

interface HomeNightCareSafetyResponse {
  data: HomeNightCareSafetyResult;
}

export function useHomeNightCareSafetyIntelligence() {
  return useQuery<HomeNightCareSafetyResponse>({
    queryKey: ["home-night-care-safety-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-night-care-safety-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home night care safety intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
