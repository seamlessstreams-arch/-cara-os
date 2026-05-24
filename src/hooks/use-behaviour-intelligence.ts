"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — BEHAVIOUR INTELLIGENCE HOOK
// React Query wrapper for /api/v1/behaviour-intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { BehaviourIntelligenceResult } from "@/lib/engines/behaviour-intelligence-engine";

interface BehaviourIntelligenceResponse {
  data: BehaviourIntelligenceResult;
}

export function useBehaviourIntelligence() {
  return useQuery({
    queryKey: ["behaviour-intelligence"],
    queryFn: () => api.get<BehaviourIntelligenceResponse>("/behaviour-intelligence"),
    refetchInterval: 30_000,
  });
}
