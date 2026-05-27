"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeOrganizationalLearningResult } from "@/lib/engines/home-organizational-learning-intelligence-engine";

interface HomeOrganizationalLearningResponse {
  data: HomeOrganizationalLearningResult;
}

export function useHomeOrganizationalLearningIntelligence() {
  return useQuery<HomeOrganizationalLearningResponse>({
    queryKey: ["home-organizational-learning-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-organizational-learning-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home organizational learning intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
