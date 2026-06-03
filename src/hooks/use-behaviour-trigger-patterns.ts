"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — BEHAVIOUR TRIGGER & ESCALATION PATTERNS HOOK
// React Query wrapper for /api/v1/behaviour-trigger-patterns
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { BehaviourTriggerPatternsResult } from "@/lib/behaviour-trigger-patterns/behaviour-trigger-patterns-engine";

interface BehaviourTriggerPatternsResponse {
  data: BehaviourTriggerPatternsResult;
}

export function useBehaviourTriggerPatterns() {
  return useQuery({
    queryKey: ["behaviour-trigger-patterns"],
    queryFn: () => api.get<BehaviourTriggerPatternsResponse>("/behaviour-trigger-patterns"),
    refetchInterval: 60_000, // 60 second refresh
  });
}
