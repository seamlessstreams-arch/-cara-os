"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeClothingPersonalPossessionsIntelligence() {
  return useQuery({
    queryKey: ["home-clothing-personal-possessions-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-clothing-personal-possessions-intelligence");
      if (!res.ok) throw new Error("Failed to fetch clothing personal possessions intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
