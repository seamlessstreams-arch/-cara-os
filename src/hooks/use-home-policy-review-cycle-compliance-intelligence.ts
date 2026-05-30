"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomePolicyReviewCycleComplianceIntelligence() {
  return useQuery({
    queryKey: ["home-policy-review-cycle-compliance-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-policy-review-cycle-compliance-intelligence");
      if (!res.ok) throw new Error("Failed to fetch policy review cycle compliance intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
