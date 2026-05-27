"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeNutritionCateringResult } from "@/lib/engines/home-nutrition-catering-intelligence-engine";

interface HomeNutritionCateringResponse {
  data: HomeNutritionCateringResult;
}

export function useHomeNutritionCateringIntelligence() {
  return useQuery<HomeNutritionCateringResponse>({
    queryKey: ["home-nutrition-catering-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-nutrition-catering-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home nutrition catering intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
