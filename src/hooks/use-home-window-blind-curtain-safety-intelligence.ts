"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeWindowBlindCurtainSafetyIntelligence() {
  return useQuery({
    queryKey: ["home-window-blind-curtain-safety-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-window-blind-curtain-safety-intelligence");
      if (!res.ok) throw new Error("Failed to fetch window blind curtain safety intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
