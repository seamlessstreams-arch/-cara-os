"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomePlacementStabilityPermanenceIntelligence() {
  return useQuery({
    queryKey: ["home-placement-stability-permanence-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-placement-stability-permanence-intelligence");
      if (!res.ok) throw new Error("Failed to fetch placement stability permanence intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
