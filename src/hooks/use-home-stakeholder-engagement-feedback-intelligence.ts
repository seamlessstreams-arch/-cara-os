"use client";

import { useQuery } from "@tanstack/react-query";
import type { StakeholderEngagementResult } from "@/lib/engines/home-stakeholder-engagement-feedback-intelligence-engine";

interface StakeholderEngagementResponse { data: StakeholderEngagementResult; }

export function useHomeStakeholderEngagementFeedbackIntelligence() {
  return useQuery<StakeholderEngagementResponse>({
    queryKey: ["home-stakeholder-engagement-feedback-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-stakeholder-engagement-feedback-intelligence");
      if (!res.ok) throw new Error("Failed to fetch stakeholder engagement & feedback intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
