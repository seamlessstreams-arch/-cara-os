"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeEmotionalLiteracyFeelingsExpressionIntelligence() {
  return useQuery({
    queryKey: ["home-emotional-literacy-feelings-expression-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-emotional-literacy-feelings-expression-intelligence");
      if (!res.ok) throw new Error("Failed to fetch emotional literacy feelings expression intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
