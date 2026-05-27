"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeLivingEnvironmentResult } from "@/lib/engines/home-living-environment-intelligence-engine";

interface HomeLivingEnvironmentResponse {
  data: HomeLivingEnvironmentResult;
}

export function useHomeLivingEnvironmentIntelligence() {
  return useQuery<HomeLivingEnvironmentResponse>({
    queryKey: ["home-living-environment-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-living-environment-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home living environment intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
