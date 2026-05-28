"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeAdmissionsMatchingAssessmentIntelligence() {
  return useQuery({
    queryKey: ["home-admissions-matching-assessment-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-admissions-matching-assessment-intelligence");
      if (!res.ok) throw new Error("Failed to fetch admissions matching assessment intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
