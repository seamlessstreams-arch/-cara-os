"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeLocalitySafeguardingIntelligence() {
  return useQuery({
    queryKey: ["home-locality-safeguarding-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-locality-safeguarding-intelligence");
      if (!res.ok) throw new Error("Failed to fetch locality safeguarding intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
