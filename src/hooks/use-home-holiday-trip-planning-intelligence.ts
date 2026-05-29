"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeHolidayTripPlanningIntelligence() {
  return useQuery({
    queryKey: ["home-holiday-trip-planning-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-holiday-trip-planning-intelligence");
      if (!res.ok) throw new Error("Failed to fetch holiday trip planning intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
