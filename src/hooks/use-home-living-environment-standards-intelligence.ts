"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeLivingEnvironmentStandardsIntelligence() {
  return useQuery({
    queryKey: ["home-living-environment-standards-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-living-environment-standards-intelligence");
      if (!res.ok) throw new Error("Failed to fetch living environment standards intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
