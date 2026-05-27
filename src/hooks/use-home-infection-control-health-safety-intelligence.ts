"use client";

import { useQuery } from "@tanstack/react-query";
import type { InfectionControlResult } from "@/lib/engines/home-infection-control-health-safety-intelligence-engine";

interface InfectionControlResponse { data: InfectionControlResult; }

export function useHomeInfectionControlHealthSafetyIntelligence() {
  return useQuery<InfectionControlResponse>({
    queryKey: ["home-infection-control-health-safety-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-infection-control-health-safety-intelligence");
      if (!res.ok) throw new Error("Failed to fetch infection control & health safety intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
