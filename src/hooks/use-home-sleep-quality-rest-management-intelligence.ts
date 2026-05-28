"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeSleepQualityRestManagementIntelligence() {
  return useQuery({
    queryKey: ["home-sleep-quality-rest-management-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-sleep-quality-rest-management-intelligence");
      if (!res.ok) throw new Error("Failed to fetch sleep quality rest management intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
