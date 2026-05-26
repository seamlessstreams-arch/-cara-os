"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeFamilyEngagementResult } from "@/lib/engines/home-family-engagement-intelligence-engine";

interface HomeFamilyEngagementResponse {
  data: HomeFamilyEngagementResult;
}

export function useHomeFamilyEngagementIntelligence() {
  return useQuery<HomeFamilyEngagementResponse>({
    queryKey: ["home-family-engagement-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-family-engagement-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home family engagement intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
