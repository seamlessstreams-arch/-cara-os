"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Ask CARA governance hook (§24)
// GET /api/v1/ask-cara/governance → the cockpit summary (management only)
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import type { GovernanceSummary } from "@/lib/ask-cara/governance-summary";

export function useAskCaraGovernance(role?: string) {
  return useQuery<{ data: GovernanceSummary }>({
    queryKey: ["ask-cara-governance", role],
    queryFn: () => fetch("/api/v1/ask-cara/governance", { headers: { "x-user-role": String(role ?? "") } }).then((r) => r.json()),
    staleTime: 60 * 1000,
  });
}
