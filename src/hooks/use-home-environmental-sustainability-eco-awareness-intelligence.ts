"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeEnvironmentalSustainabilityEcoAwarenessIntelligence() {
  return useQuery({
    queryKey: ["home-environmental-sustainability-eco-awareness-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-environmental-sustainability-eco-awareness-intelligence");
      if (!res.ok) throw new Error("Failed to fetch environmental sustainability eco-awareness intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
