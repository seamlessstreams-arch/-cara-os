"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — FINANCE INTELLIGENCE HOOK
// React Query wrapper for /api/v1/finance-intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { FinanceIntelligenceResult } from "@/lib/engines/finance-intelligence-engine";

interface FinanceIntelligenceResponse {
  data: FinanceIntelligenceResult;
}

export function useFinanceIntelligence() {
  return useQuery({
    queryKey: ["finance-intelligence"],
    queryFn: () => api.get<FinanceIntelligenceResponse>("/finance-intelligence"),
    refetchInterval: 60_000,
  });
}
