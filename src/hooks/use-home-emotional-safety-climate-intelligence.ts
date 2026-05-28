"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeEmotionalSafetyClimateIntelligence() {
  return useQuery({
    queryKey: ["home-emotional-safety-climate-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-emotional-safety-climate-intelligence");
      if (!res.ok) throw new Error("Failed to fetch emotional safety climate intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
