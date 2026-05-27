"use client";

import { useQuery } from "@tanstack/react-query";
import type { TransportJourneySafetyResult } from "@/lib/engines/home-transport-journey-safety-intelligence-engine";

interface TransportJourneySafetyResponse { data: TransportJourneySafetyResult; }

export function useHomeTransportJourneySafetyIntelligence() {
  return useQuery<TransportJourneySafetyResponse>({
    queryKey: ["home-transport-journey-safety-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-transport-journey-safety-intelligence");
      if (!res.ok) throw new Error("Failed to fetch transport & journey safety intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
