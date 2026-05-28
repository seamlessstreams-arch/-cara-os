"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeStaffSupervisionReflectivePracticeIntelligence() {
  return useQuery({
    queryKey: ["home-staff-supervision-reflective-practice-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-staff-supervision-reflective-practice-intelligence");
      if (!res.ok) throw new Error("Failed to fetch staff supervision reflective practice intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
