"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeHandoverCommunicationQualityIntelligence() {
  return useQuery({
    queryKey: ["home-handover-communication-quality-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-handover-communication-quality-intelligence");
      if (!res.ok) throw new Error("Failed to fetch handover communication quality intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
