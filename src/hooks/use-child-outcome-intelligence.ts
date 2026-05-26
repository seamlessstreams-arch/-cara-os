"use client";

import { useQuery } from "@tanstack/react-query";
import type { ChildOutcomeResult } from "@/lib/engines/child-outcome-intelligence-engine";

interface ChildOutcomeResponse {
  data: ChildOutcomeResult;
}

export function useChildOutcomeIntelligence(childId: string) {
  return useQuery<ChildOutcomeResponse>({
    queryKey: ["child-outcome-intelligence", childId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/child-outcome-intelligence?childId=${childId}`);
      if (!res.ok) throw new Error("Failed to fetch child outcome intelligence");
      return res.json();
    },
    enabled: !!childId,
    refetchInterval: 60_000,
  });
}
