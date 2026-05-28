"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeAllegationsInvestigationsManagementIntelligence() {
  return useQuery({
    queryKey: ["home-allegations-investigations-management-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-allegations-investigations-management-intelligence");
      if (!res.ok) throw new Error("Failed to fetch allegations investigations management intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
