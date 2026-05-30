"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeItEquipmentConnectivityIntelligence() {
  return useQuery({
    queryKey: ["home-it-equipment-connectivity-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-it-equipment-connectivity-intelligence");
      if (!res.ok) throw new Error("Failed to fetch IT equipment connectivity intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
