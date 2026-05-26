"use client";

import { useQuery } from "@tanstack/react-query";
import type { ChildKeyworkingResult } from "@/lib/engines/child-keyworking-intelligence-engine";

interface ChildKeyworkingResponse {
  data: ChildKeyworkingResult;
}

export function useChildKeyworkingIntelligence(childId: string) {
  return useQuery<ChildKeyworkingResponse>({
    queryKey: ["child-keyworking-intelligence", childId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/child-keyworking-intelligence?childId=${childId}`);
      if (!res.ok) throw new Error("Failed to fetch child keyworking intelligence");
      return res.json();
    },
    enabled: !!childId,
    refetchInterval: 60_000,
  });
}
