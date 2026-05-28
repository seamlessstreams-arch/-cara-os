"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeNutritionDietaryManagementIntelligence() {
  return useQuery({
    queryKey: ["home-nutrition-dietary-management-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-nutrition-dietary-management-intelligence");
      if (!res.ok) throw new Error("Failed to fetch nutrition dietary management intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
