"use client";

import { useQuery } from "@tanstack/react-query";
import type { ParentPartnershipResult } from "@/lib/engines/home-parent-partnership-engagement-intelligence-engine";

interface ParentPartnershipResponse { data: ParentPartnershipResult; }

export function useHomeParentPartnershipEngagementIntelligence() {
  return useQuery<ParentPartnershipResponse>({
    queryKey: ["home-parent-partnership-engagement-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-parent-partnership-engagement-intelligence");
      if (!res.ok) throw new Error("Failed to fetch parent partnership engagement intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
