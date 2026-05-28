"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeAutomationROIIntelligence() {
  return useQuery({
    queryKey: ["home-automation-roi-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-automation-roi-intelligence");
      if (!res.ok) throw new Error("Failed to fetch automation ROI intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
