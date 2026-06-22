"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { HomeOutcomeOverview } from "@/lib/outcome-intelligence/home-outcome-overview";

/**
 * Fetch the whole-home Outcome Intelligence overview — every current child
 * ranked by who needs focus, plus a home-wide domain heatmap. The manager /
 * inspector view of whether the home's children are making progress.
 */
export function useHomeOutcomeOverview() {
  return useQuery({
    queryKey: ["home-outcome-overview"],
    queryFn: async () =>
      (await api.get<{ data: HomeOutcomeOverview }>(`/outcome-intelligence/home`)).data,
  });
}
