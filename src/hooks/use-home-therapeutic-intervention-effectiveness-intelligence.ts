"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeTherapeuticInterventionEffectivenessIntelligence() {
  return useQuery({
    queryKey: ["home-therapeutic-intervention-effectiveness-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-therapeutic-intervention-effectiveness-intelligence");
      if (!res.ok) throw new Error("Failed to fetch therapeutic intervention effectiveness intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
