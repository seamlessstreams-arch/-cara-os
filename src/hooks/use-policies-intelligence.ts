"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — POLICIES INTELLIGENCE HOOK
// React Query wrapper for /api/v1/policies-intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { PoliciesIntelligenceResult } from "@/lib/engines/policies-intelligence-engine";

interface PoliciesIntelligenceResponse {
  data: PoliciesIntelligenceResult;
}

export function usePoliciesIntelligence() {
  return useQuery({
    queryKey: ["policies-intelligence"],
    queryFn: () => api.get<PoliciesIntelligenceResponse>("/policies-intelligence"),
    refetchInterval: 60_000,
  });
}
