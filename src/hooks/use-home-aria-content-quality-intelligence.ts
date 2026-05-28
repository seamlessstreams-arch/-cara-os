"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeAriaContentQualityIntelligence() {
  return useQuery({
    queryKey: ["home-aria-content-quality-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-aria-content-quality-intelligence");
      if (!res.ok) throw new Error("Failed to fetch ARIA content quality intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
