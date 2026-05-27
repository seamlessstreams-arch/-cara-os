"use client";

import { useQuery } from "@tanstack/react-query";
import type { StaffDebriefResult } from "@/lib/engines/home-staff-debrief-emotional-support-intelligence-engine";

interface StaffDebriefResponse { data: StaffDebriefResult; }

export function useHomeStaffDebriefEmotionalSupportIntelligence() {
  return useQuery<StaffDebriefResponse>({
    queryKey: ["home-staff-debrief-emotional-support-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-staff-debrief-emotional-support-intelligence");
      if (!res.ok) throw new Error("Failed to fetch staff debrief & emotional support intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
