"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeStatementPurposeChildrenGuideIntelligence() {
  return useQuery({
    queryKey: ["home-statement-purpose-children-guide-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-statement-purpose-children-guide-intelligence");
      if (!res.ok) throw new Error("Failed to fetch statement of purpose children guide intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
