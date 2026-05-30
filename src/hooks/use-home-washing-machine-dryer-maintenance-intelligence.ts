"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeWashingMachineDryerMaintenanceIntelligence() {
  return useQuery({
    queryKey: ["home-washing-machine-dryer-maintenance-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-washing-machine-dryer-maintenance-intelligence");
      if (!res.ok) throw new Error("Failed to fetch washing machine & dryer maintenance intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
