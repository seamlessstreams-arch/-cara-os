"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeMissingEpisodesResult } from "@/lib/engines/home-missing-episodes-intelligence-engine";

interface HomeMissingEpisodesResponse {
  data: HomeMissingEpisodesResult;
}

export function useHomeMissingEpisodesIntelligence() {
  return useQuery<HomeMissingEpisodesResponse>({
    queryKey: ["home-missing-episodes-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-missing-episodes-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home missing episodes intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
