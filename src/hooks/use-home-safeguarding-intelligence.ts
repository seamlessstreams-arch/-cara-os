"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeSafeguardingResult } from "@/lib/engines/home-safeguarding-intelligence-engine";

interface HomeSafeguardingResponse {
  data: HomeSafeguardingResult;
}

export function useHomeSafeguardingIntelligence() {
  return useQuery<HomeSafeguardingResponse>({
    queryKey: ["home-safeguarding-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-safeguarding-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home safeguarding intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
