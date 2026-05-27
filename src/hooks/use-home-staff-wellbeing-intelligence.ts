"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeStaffWellbeingResult } from "@/lib/engines/home-staff-wellbeing-intelligence-engine";

interface HomeStaffWellbeingResponse {
  data: HomeStaffWellbeingResult;
}

export function useHomeStaffWellbeingIntelligence() {
  return useQuery<HomeStaffWellbeingResponse>({
    queryKey: ["home-staff-wellbeing-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-staff-wellbeing-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home staff wellbeing intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
