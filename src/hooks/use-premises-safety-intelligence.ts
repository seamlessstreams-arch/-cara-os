"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PREMISES & SAFETY INTELLIGENCE HOOK
// React Query wrapper for /api/v1/premises-safety-intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { PremisesSafetyIntelligenceResult } from "@/lib/engines/premises-safety-intelligence-engine";

interface PremisesSafetyIntelligenceResponse {
  data: PremisesSafetyIntelligenceResult;
}

export function usePremisesSafetyIntelligence() {
  return useQuery({
    queryKey: ["premises-safety-intelligence"],
    queryFn: () => api.get<PremisesSafetyIntelligenceResponse>("/premises-safety-intelligence"),
    refetchInterval: 60_000,
  });
}
