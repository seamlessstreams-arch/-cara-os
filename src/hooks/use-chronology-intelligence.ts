"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHRONOLOGY INTELLIGENCE HOOK
// React Query wrapper for /api/v1/chronology-intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { ChronologyIntelligenceResult } from "@/lib/engines/chronology-intelligence-engine";

interface ChronologyIntelligenceResponse {
  data: ChronologyIntelligenceResult;
}

export function useChronologyIntelligence() {
  return useQuery({
    queryKey: ["chronology-intelligence"],
    queryFn: () => api.get<ChronologyIntelligenceResponse>("/chronology-intelligence"),
    refetchInterval: 60_000,
  });
}
