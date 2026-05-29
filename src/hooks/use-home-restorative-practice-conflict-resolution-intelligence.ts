"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeRestorativePracticeConflictResolutionIntelligence() {
  return useQuery({
    queryKey: ["home-restorative-practice-conflict-resolution-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-restorative-practice-conflict-resolution-intelligence");
      if (!res.ok) throw new Error("Failed to fetch restorative practice conflict resolution intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
