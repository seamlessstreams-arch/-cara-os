"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeIncidentSafetyResult } from "@/lib/engines/home-incident-safety-intelligence-engine";

interface HomeIncidentSafetyResponse {
  data: HomeIncidentSafetyResult;
}

export function useHomeIncidentSafetyIntelligence() {
  return useQuery<HomeIncidentSafetyResponse>({
    queryKey: ["home-incident-safety-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-incident-safety-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home incident safety intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
