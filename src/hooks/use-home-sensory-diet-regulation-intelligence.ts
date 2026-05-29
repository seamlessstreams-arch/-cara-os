"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeSensoryDietRegulationIntelligence() {
  return useQuery({
    queryKey: ["home-sensory-diet-regulation-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-sensory-diet-regulation-intelligence");
      if (!res.ok) throw new Error("Failed to fetch sensory diet regulation intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
