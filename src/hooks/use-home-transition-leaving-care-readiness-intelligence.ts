"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeTransitionLeavingCareReadinessIntelligence() {
  return useQuery({
    queryKey: ["home-transition-leaving-care-readiness-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-transition-leaving-care-readiness-intelligence");
      if (!res.ok) throw new Error("Failed to fetch transition leaving care readiness intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
