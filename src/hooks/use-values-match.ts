"use client";

import { useQuery } from "@tanstack/react-query";
import type { ValuesMatchResult } from "@/lib/engines/values-match-engine";

export interface ValuesMatchResponse {
  employer: { home_name: string; core_values: string[]; relational_practice_priority: string } | null;
  matches: (ValuesMatchResult & { current_stage: string | null })[];
  disclaimer: string;
}

export function useValuesMatch() {
  return useQuery<ValuesMatchResponse>({
    queryKey: ["values-match"],
    queryFn: async () => {
      const res = await fetch("/api/v1/values-match");
      if (!res.ok) throw new Error("Failed to fetch values match");
      return (await res.json()).data;
    },
    refetchInterval: 120_000,
  });
}
