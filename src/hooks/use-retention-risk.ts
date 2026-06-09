"use client";

import { useQuery } from "@tanstack/react-query";
import type { RetentionOverview } from "@/lib/engines/retention-risk-engine";

export function useRetentionRisk() {
  return useQuery<RetentionOverview>({
    queryKey: ["retention-risk"],
    queryFn: async () => {
      const res = await fetch("/api/v1/retention-risk");
      if (!res.ok) throw new Error("Failed to fetch retention indicators");
      return (await res.json()).data;
    },
    refetchInterval: 120_000,
  });
}
