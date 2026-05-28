"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeFilingEvidenceGovernanceIntelligence() {
  return useQuery({
    queryKey: ["home-filing-evidence-governance-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-filing-evidence-governance-intelligence");
      if (!res.ok) throw new Error("Failed to fetch filing evidence governance intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
