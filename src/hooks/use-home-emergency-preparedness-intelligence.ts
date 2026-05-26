"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeEmergencyResult } from "@/lib/engines/home-emergency-preparedness-intelligence-engine";

interface HomeEmergencyResponse {
  data: HomeEmergencyResult;
}

export function useHomeEmergencyPreparednessIntelligence() {
  return useQuery<HomeEmergencyResponse>({
    queryKey: ["home-emergency-preparedness-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-emergency-preparedness-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home emergency preparedness intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
