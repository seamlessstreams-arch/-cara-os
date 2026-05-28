"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeInfectionPreventionControlIntelligence() {
  return useQuery({
    queryKey: ["home-infection-prevention-control-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-infection-prevention-control-intelligence");
      if (!res.ok) throw new Error("Failed to fetch infection prevention control intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
