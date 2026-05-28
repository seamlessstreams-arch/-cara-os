"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeFireSafetyEmergencyDrillIntelligence() {
  return useQuery({
    queryKey: ["home-fire-safety-emergency-drill-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-fire-safety-emergency-drill-intelligence");
      if (!res.ok) throw new Error("Failed to fetch fire safety emergency drill intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
