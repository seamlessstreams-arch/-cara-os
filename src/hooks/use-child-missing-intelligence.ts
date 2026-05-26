"use client";

import { useQuery } from "@tanstack/react-query";
import type { ChildMissingResult } from "@/lib/engines/child-missing-intelligence-engine";

interface ChildMissingResponse {
  data: ChildMissingResult;
}

export function useChildMissingIntelligence(childId: string) {
  return useQuery<ChildMissingResponse>({
    queryKey: ["child-missing-intelligence", childId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/child-missing-intelligence?childId=${childId}`);
      if (!res.ok) throw new Error("Failed to fetch child missing intelligence");
      return res.json();
    },
    enabled: !!childId,
    refetchInterval: 60_000,
  });
}
