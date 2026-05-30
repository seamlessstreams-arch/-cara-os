"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeGardenOutdoorSpaceMaintenanceIntelligence() {
  return useQuery({
    queryKey: ["home-garden-outdoor-space-maintenance-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-garden-outdoor-space-maintenance-intelligence");
      if (!res.ok) throw new Error("Failed to fetch garden outdoor space maintenance intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
