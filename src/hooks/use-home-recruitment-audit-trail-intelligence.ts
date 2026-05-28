"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeRecruitmentAuditTrailIntelligence() {
  return useQuery({
    queryKey: ["home-recruitment-audit-trail-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-recruitment-audit-trail-intelligence");
      if (!res.ok) throw new Error("Failed to fetch recruitment audit trail intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
