"use client";

import { useQuery } from "@tanstack/react-query";
import type { FoodHygieneSafetyResult } from "@/lib/engines/home-food-nutrition-hygiene-safety-intelligence-engine";

interface FoodHygieneSafetyResponse { data: FoodHygieneSafetyResult; }

export function useHomeFoodNutritionHygieneSafetyIntelligence() {
  return useQuery<FoodHygieneSafetyResponse>({
    queryKey: ["home-food-nutrition-hygiene-safety-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-food-nutrition-hygiene-safety-intelligence");
      if (!res.ok) throw new Error("Failed to fetch food, nutrition & hygiene safety intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
