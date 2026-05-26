"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeSupervisionResult } from "@/lib/engines/home-supervision-intelligence-engine";

interface HomeSupervisionResponse {
  data: HomeSupervisionResult;
}

export function useHomeSupervisionIntelligence() {
  return useQuery<HomeSupervisionResponse>({
    queryKey: ["home-supervision-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-supervision-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home supervision intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
