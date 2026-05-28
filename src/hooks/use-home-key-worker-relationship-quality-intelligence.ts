"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeKeyWorkerRelationshipQualityIntelligence() {
  return useQuery({
    queryKey: ["home-key-worker-relationship-quality-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-key-worker-relationship-quality-intelligence");
      if (!res.ok) throw new Error("Failed to fetch key worker relationship quality intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
