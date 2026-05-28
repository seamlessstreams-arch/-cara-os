"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeHealthWellbeingOversightIntelligence() {
  return useQuery({
    queryKey: ["home-health-wellbeing-oversight-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-health-wellbeing-oversight-intelligence");
      if (!res.ok) throw new Error("Failed to fetch health wellbeing oversight intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
