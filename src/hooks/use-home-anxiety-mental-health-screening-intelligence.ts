"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeAnxietyMentalHealthScreeningIntelligence() {
  return useQuery({
    queryKey: ["home-anxiety-mental-health-screening-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-anxiety-mental-health-screening-intelligence");
      if (!res.ok) throw new Error("Failed to fetch anxiety mental health screening intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
