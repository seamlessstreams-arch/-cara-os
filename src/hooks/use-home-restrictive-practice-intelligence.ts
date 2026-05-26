"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeRestrictivePracticeResult } from "@/lib/engines/home-restrictive-practice-intelligence-engine";

interface HomeRestrictivePracticeResponse {
  data: HomeRestrictivePracticeResult;
}

export function useHomeRestrictivePracticeIntelligence() {
  return useQuery<HomeRestrictivePracticeResponse>({
    queryKey: ["home-restrictive-practice-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-restrictive-practice-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home restrictive practice intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
