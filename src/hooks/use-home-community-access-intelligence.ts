"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeCommunityAccessResult } from "@/lib/engines/home-community-access-intelligence-engine";

interface HomeCommunityAccessResponse {
  data: HomeCommunityAccessResult;
}

export function useHomeCommunityAccessIntelligence() {
  return useQuery<HomeCommunityAccessResponse>({
    queryKey: ["home-community-access-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-community-access-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home community access intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
