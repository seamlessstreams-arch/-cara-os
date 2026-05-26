"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeActivityEnrichmentResult } from "@/lib/engines/home-activity-enrichment-intelligence-engine";

interface HomeActivityEnrichmentResponse {
  data: HomeActivityEnrichmentResult;
}

export function useHomeActivityEnrichmentIntelligence() {
  return useQuery<HomeActivityEnrichmentResponse>({
    queryKey: ["home-activity-enrichment-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-activity-enrichment-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home activity enrichment intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
