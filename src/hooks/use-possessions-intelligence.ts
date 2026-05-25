"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — POSSESSIONS INTELLIGENCE HOOK
// React Query wrapper for /api/v1/possessions-intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { PossessionsIntelligenceResult } from "@/lib/engines/possessions-intelligence-engine";

interface PossessionsIntelligenceResponse {
  data: PossessionsIntelligenceResult;
}

export function usePossessionsIntelligence() {
  return useQuery({
    queryKey: ["possessions-intelligence"],
    queryFn: () => api.get<PossessionsIntelligenceResponse>("/possessions-intelligence"),
    refetchInterval: 60_000,
  });
}
