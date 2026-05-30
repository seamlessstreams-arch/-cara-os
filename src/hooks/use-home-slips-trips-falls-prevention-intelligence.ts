"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeSlipsTripsFallsPreventionIntelligence() {
  return useQuery({
    queryKey: ["home-slips-trips-falls-prevention-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-slips-trips-falls-prevention-intelligence");
      if (!res.ok) throw new Error("Failed to fetch slips trips falls prevention intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
