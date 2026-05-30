"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeClothingLabellingStorageIntelligence() {
  return useQuery({
    queryKey: ["home-clothing-labelling-storage-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-clothing-labelling-storage-intelligence");
      if (!res.ok) throw new Error("Failed to fetch clothing labelling storage intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
