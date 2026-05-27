"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeMedicationGovernanceResult } from "@/lib/engines/home-medication-governance-intelligence-engine";

interface HomeMedicationGovernanceResponse {
  data: HomeMedicationGovernanceResult;
}

export function useHomeMedicationGovernanceIntelligence() {
  return useQuery<HomeMedicationGovernanceResponse>({
    queryKey: ["home-medication-governance-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-medication-governance-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home medication governance intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
