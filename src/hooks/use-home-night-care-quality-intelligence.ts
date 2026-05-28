"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeNightCareQualityIntelligence() {
  return useQuery({
    queryKey: ["home-night-care-quality-intelligence"],
    queryFn: () => fetch("/api/v1/home-night-care-quality-intelligence").then(r => r.json()),
    refetchInterval: 60_000,
  });
}
