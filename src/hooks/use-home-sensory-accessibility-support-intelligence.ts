"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeSensoryAccessibilitySupportIntelligence() {
  return useQuery({
    queryKey: ["home-sensory-accessibility-support-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-sensory-accessibility-support-intelligence");
      if (!res.ok) throw new Error("Failed to fetch sensory accessibility support intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
