"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeStaffWellbeingRetentionIntelligence() {
  return useQuery({
    queryKey: ["home-staff-wellbeing-retention-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-staff-wellbeing-retention-intelligence");
      if (!res.ok) throw new Error("Failed to fetch staff wellbeing retention intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
