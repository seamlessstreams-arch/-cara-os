"use client";

import { useQuery } from "@tanstack/react-query";
import type { OutcomeStarResult } from "@/lib/engines/home-outcome-star-needs-intelligence-engine";

interface OutcomeStarResponse { data: OutcomeStarResult; }

export function useHomeOutcomeStarNeedsIntelligence() {
  return useQuery<OutcomeStarResponse>({
    queryKey: ["home-outcome-star-needs-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-outcome-star-needs-intelligence");
      if (!res.ok) throw new Error("Failed to fetch outcome star & needs intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
