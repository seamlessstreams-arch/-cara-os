"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeOutdoorNatureEngagementIntelligence() {
  return useQuery({
    queryKey: ["home-outdoor-nature-engagement-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-outdoor-nature-engagement-intelligence");
      if (!res.ok) throw new Error("Failed to fetch outdoor nature engagement intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
