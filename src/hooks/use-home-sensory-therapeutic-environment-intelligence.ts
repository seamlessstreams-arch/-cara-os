"use client";

import { useQuery } from "@tanstack/react-query";
import type { SensoryTherapeuticResult } from "@/lib/engines/home-sensory-therapeutic-environment-intelligence-engine";

interface SensoryTherapeuticResponse { data: SensoryTherapeuticResult; }

export function useHomeSensoryTherapeuticEnvironmentIntelligence() {
  return useQuery<SensoryTherapeuticResponse>({
    queryKey: ["home-sensory-therapeutic-environment-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-sensory-therapeutic-environment-intelligence");
      if (!res.ok) throw new Error("Failed to fetch sensory & therapeutic environment intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
