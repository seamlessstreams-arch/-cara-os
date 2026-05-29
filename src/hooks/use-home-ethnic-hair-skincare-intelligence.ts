"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeEthnicHairSkincareIntelligence() {
  return useQuery({
    queryKey: ["home-ethnic-hair-skincare-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-ethnic-hair-skincare-intelligence");
      if (!res.ok) throw new Error("Failed to fetch ethnic hair & skincare intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
