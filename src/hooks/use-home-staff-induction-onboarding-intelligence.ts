"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeStaffInductionOnboardingIntelligence() {
  return useQuery({
    queryKey: ["home-staff-induction-onboarding-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-staff-induction-onboarding-intelligence");
      if (!res.ok) throw new Error("Failed to fetch staff induction onboarding intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
