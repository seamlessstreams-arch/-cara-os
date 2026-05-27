"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReturnInterviewQualityResult } from "@/lib/engines/home-return-interview-quality-intelligence-engine";

interface ReturnInterviewResponse { data: ReturnInterviewQualityResult; }

export function useHomeReturnInterviewQualityIntelligence() {
  return useQuery<ReturnInterviewResponse>({
    queryKey: ["home-return-interview-quality-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-return-interview-quality-intelligence");
      if (!res.ok) throw new Error("Failed to fetch return interview quality intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}
