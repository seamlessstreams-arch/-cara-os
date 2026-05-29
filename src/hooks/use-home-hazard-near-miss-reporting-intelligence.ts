"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeHazardNearMissReportingIntelligence() {
  return useQuery({
    queryKey: ["home-hazard-near-miss-reporting-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-hazard-near-miss-reporting-intelligence");
      if (!res.ok) throw new Error("Failed to fetch hazard near miss reporting intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
