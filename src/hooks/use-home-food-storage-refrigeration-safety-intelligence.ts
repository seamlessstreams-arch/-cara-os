"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeFoodStorageRefrigerationSafetyIntelligence() {
  return useQuery({
    queryKey: ["home-food-storage-refrigeration-safety-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-food-storage-refrigeration-safety-intelligence");
      if (!res.ok) throw new Error("Failed to fetch food storage refrigeration safety intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
