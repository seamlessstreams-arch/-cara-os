"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HANDOVER CONTINUITY INTELLIGENCE HOOK
// React Query wrapper for /api/v1/handover-continuity-intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { HandoverContinuityIntelligenceResult } from "@/lib/engines/handover-continuity-intelligence-engine";

interface HandoverContinuityIntelligenceResponse {
  data: HandoverContinuityIntelligenceResult;
}

export function useHandoverContinuityIntelligence() {
  return useQuery({
    queryKey: ["handover-continuity-intelligence"],
    queryFn: () => api.get<HandoverContinuityIntelligenceResponse>("/handover-continuity-intelligence"),
    refetchInterval: 60_000,
  });
}
