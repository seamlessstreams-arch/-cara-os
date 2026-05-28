"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeMedicationSafetyComplianceIntelligence() {
  return useQuery({
    queryKey: ["home-medication-safety-compliance-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-medication-safety-compliance-intelligence");
      if (!res.ok) throw new Error("Failed to fetch medication safety compliance intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
