"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { PracticeTrendsResult } from "@/lib/practice-history/types";

/** Recording-quality trend (PACE + child-readable recording) over 8 weeks. */
export function usePracticeTrends() {
  return useQuery({
    queryKey: ["practice-trends"],
    queryFn: () => api.get<{ data: PracticeTrendsResult }>("/practice-trends"),
    staleTime: 5 * 60_000,
  });
}
