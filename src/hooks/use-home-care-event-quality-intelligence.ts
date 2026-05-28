"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeCareEventQualityIntelligence() {
  return useQuery({
    queryKey: ["home-care-event-quality-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-care-event-quality-intelligence");
      if (!res.ok) throw new Error("Failed to fetch care event quality intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
