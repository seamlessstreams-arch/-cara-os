"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeFirstAidKitMedicalSuppliesIntelligence() {
  return useQuery({
    queryKey: ["home-first-aid-kit-medical-supplies-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-first-aid-kit-medical-supplies-intelligence");
      if (!res.ok) throw new Error("Failed to fetch first aid kit medical supplies intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
