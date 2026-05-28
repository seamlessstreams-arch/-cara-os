"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeStaffPerformanceCompositeIntelligence() {
  return useQuery({
    queryKey: ["home-staff-performance-composite-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-staff-performance-composite-intelligence");
      if (!res.ok) throw new Error("Failed to fetch staff performance composite intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
