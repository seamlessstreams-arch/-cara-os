"use client";

import { useQuery } from "@tanstack/react-query";
import type { PepEducationResult } from "@/lib/engines/home-pep-education-quality-intelligence-engine";

interface PepEducationResponse { data: PepEducationResult; }

export function useHomePepEducationQualityIntelligence() {
  return useQuery<PepEducationResponse>({
    queryKey: ["home-pep-education-quality-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-pep-education-quality-intelligence");
      if (!res.ok) throw new Error("Failed to fetch PEP education quality intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
