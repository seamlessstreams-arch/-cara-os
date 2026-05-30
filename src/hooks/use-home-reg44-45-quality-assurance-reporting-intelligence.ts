"use client";

import { useQuery } from "@tanstack/react-query";

export function useHomeReg4445QualityAssuranceReportingIntelligence() {
  return useQuery({
    queryKey: ["home-reg44-45-quality-assurance-reporting-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-reg44-45-quality-assurance-reporting-intelligence");
      if (!res.ok) throw new Error("Failed to fetch Reg 44/45 quality assurance reporting intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
