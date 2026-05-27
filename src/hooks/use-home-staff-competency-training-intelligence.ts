"use client";

import { useQuery } from "@tanstack/react-query";
import type { StaffCompetencyResult } from "@/lib/engines/home-staff-competency-training-intelligence-engine";

interface StaffCompetencyResponse { data: StaffCompetencyResult; }

export function useHomeStaffCompetencyTrainingIntelligence() {
  return useQuery<StaffCompetencyResponse>({
    queryKey: ["home-staff-competency-training-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-staff-competency-training-intelligence");
      if (!res.ok) throw new Error("Failed to fetch staff competency & training intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
