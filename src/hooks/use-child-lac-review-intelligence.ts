"use client";

import { useQuery } from "@tanstack/react-query";
import type { ChildLACReviewResult } from "@/lib/engines/child-lac-review-intelligence-engine";

interface ChildLACReviewResponse {
  data: ChildLACReviewResult;
}

export function useChildLACReviewIntelligence(childId: string) {
  return useQuery<ChildLACReviewResponse>({
    queryKey: ["child-lac-review-intelligence", childId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/child-lac-review-intelligence?childId=${childId}`);
      if (!res.ok) throw new Error("Failed to fetch child LAC review intelligence");
      return res.json();
    },
    enabled: !!childId,
    refetchInterval: 60_000,
  });
}
