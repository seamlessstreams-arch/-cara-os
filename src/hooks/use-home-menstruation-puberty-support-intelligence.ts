"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeMenstruationPubertySupportIntelligence() {
  return useQuery({
    queryKey: ["home-menstruation-puberty-support-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-menstruation-puberty-support-intelligence");
      if (!res.ok) throw new Error("Failed to fetch menstruation puberty support intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
