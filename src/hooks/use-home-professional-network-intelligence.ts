"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeProfessionalNetworkIntelligence() {
  return useQuery({
    queryKey: ["home-professional-network-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-professional-network-intelligence");
      if (!res.ok) throw new Error("Failed to fetch professional network intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
