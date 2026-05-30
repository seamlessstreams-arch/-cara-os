"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeTeethBrushingOralRoutineIntelligence() {
  return useQuery({
    queryKey: ["home-teeth-brushing-oral-routine-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-teeth-brushing-oral-routine-intelligence");
      if (!res.ok) throw new Error("Failed to fetch teeth brushing oral routine intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
