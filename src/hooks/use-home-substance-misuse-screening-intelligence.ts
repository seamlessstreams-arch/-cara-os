"use client";

import { useQuery } from "@tanstack/react-query";
import type { SubstanceMisuseResult } from "@/lib/engines/home-substance-misuse-screening-intelligence-engine";

interface SubstanceMisuseResponse { data: SubstanceMisuseResult; }

export function useHomeSubstanceMisuseScreeningIntelligence() {
  return useQuery<SubstanceMisuseResponse>({
    queryKey: ["home-substance-misuse-screening-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-substance-misuse-screening-intelligence");
      if (!res.ok) throw new Error("Failed to fetch substance misuse screening intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
