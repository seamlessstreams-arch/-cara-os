"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { AbacDivergenceSummary } from "@/lib/permissions/abac-divergence";

export type { AbacDivergenceSummary };

/** Where the advisory access engine disagrees with the enforced check (read-only). */
export function useAbacDivergence() {
  return useQuery({
    queryKey: ["abac-divergence"],
    queryFn: () => api.get<{ data: AbacDivergenceSummary }>("/abac-divergence"),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
