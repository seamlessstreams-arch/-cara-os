"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeRegulatoryComplianceResult } from "@/lib/engines/home-regulatory-compliance-intelligence-engine";

interface HomeRegulatoryComplianceResponse {
  data: HomeRegulatoryComplianceResult;
}

export function useHomeRegulatoryComplianceIntelligence() {
  return useQuery<HomeRegulatoryComplianceResponse>({
    queryKey: ["home-regulatory-compliance-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-regulatory-compliance-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home regulatory compliance intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
