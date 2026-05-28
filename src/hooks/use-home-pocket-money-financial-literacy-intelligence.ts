"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomePocketMoneyFinancialLiteracyIntelligence() {
  return useQuery({
    queryKey: ["home-pocket-money-financial-literacy-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-pocket-money-financial-literacy-intelligence");
      if (!res.ok) throw new Error("Failed to fetch pocket money financial literacy intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
