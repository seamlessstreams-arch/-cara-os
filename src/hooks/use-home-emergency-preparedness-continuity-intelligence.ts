"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeEmergencyPreparednessContinuityIntelligence() {
  return useQuery({
    queryKey: ["home-emergency-preparedness-continuity-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-emergency-preparedness-continuity-intelligence");
      if (!res.ok) throw new Error("Failed to fetch emergency preparedness continuity intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
