"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeCaraContentQualityIntelligence() {
  return useQuery({
    queryKey: ["home-cara-content-quality-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-cara-content-quality-intelligence");
      if (!res.ok) throw new Error("Failed to fetch Cara content quality intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
