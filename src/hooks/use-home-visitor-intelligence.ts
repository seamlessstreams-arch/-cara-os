"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeVisitorResult } from "@/lib/engines/home-visitor-intelligence-engine";

interface HomeVisitorResponse {
  data: HomeVisitorResult;
}

export function useHomeVisitorIntelligence() {
  return useQuery<HomeVisitorResponse>({
    queryKey: ["home-visitor-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-visitor-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home visitor intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
