"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomePhysicalActivityRecreationIntelligence() {
  return useQuery({
    queryKey: ["home-physical-activity-recreation-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-physical-activity-recreation-intelligence");
      if (!res.ok) throw new Error("Failed to fetch physical activity recreation intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
