"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeSharpsDisposalHazardousWasteIntelligence() {
  return useQuery({
    queryKey: ["home-sharps-disposal-hazardous-waste-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-sharps-disposal-hazardous-waste-intelligence");
      if (!res.ok) throw new Error("Failed to fetch sharps disposal hazardous waste intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
