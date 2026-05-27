"use client";

import { useQuery } from "@tanstack/react-query";
import type { AnnualHealthAssessmentResult } from "@/lib/engines/home-annual-health-assessment-intelligence-engine";

interface AnnualHealthAssessmentResponse { data: AnnualHealthAssessmentResult; }

export function useHomeAnnualHealthAssessmentIntelligence() {
  return useQuery<AnnualHealthAssessmentResponse>({
    queryKey: ["home-annual-health-assessment-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-annual-health-assessment-intelligence");
      if (!res.ok) throw new Error("Failed to fetch annual health assessment intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
