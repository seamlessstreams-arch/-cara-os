"use client";

import { useQuery } from "@tanstack/react-query";
import type { StaffTrainingCpdComplianceResult } from "@/lib/engines/home-staff-training-cpd-compliance-intelligence-engine";

interface StaffTrainingCpdComplianceResponse {
  data: StaffTrainingCpdComplianceResult;
}

export function useHomeStaffTrainingCpdComplianceIntelligence() {
  return useQuery<StaffTrainingCpdComplianceResponse>({
    queryKey: ["home-staff-training-cpd-compliance-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-staff-training-cpd-compliance-intelligence");
      if (!res.ok) throw new Error("Failed to fetch staff training & CPD compliance intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
