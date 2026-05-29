"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeMinorRepairsMaintenanceIntelligence() {
  return useQuery({
    queryKey: ["home-minor-repairs-maintenance-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-minor-repairs-maintenance-intelligence");
      if (!res.ok) throw new Error("Failed to fetch minor repairs maintenance intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
