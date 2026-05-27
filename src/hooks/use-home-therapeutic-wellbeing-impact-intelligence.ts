"use client";

import { useQuery } from "@tanstack/react-query";
import type { TherapeuticWellbeingResult } from "@/lib/engines/home-therapeutic-wellbeing-impact-intelligence-engine";

interface TherapeuticWellbeingResponse { data: TherapeuticWellbeingResult; }

export function useHomeTherapeuticWellbeingImpactIntelligence() {
  return useQuery<TherapeuticWellbeingResponse>({
    queryKey: ["home-therapeutic-wellbeing-impact-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-therapeutic-wellbeing-impact-intelligence");
      if (!res.ok) throw new Error("Failed to fetch therapeutic wellbeing & impact intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
