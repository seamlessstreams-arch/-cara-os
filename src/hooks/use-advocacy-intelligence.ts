"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ADVOCACY INTELLIGENCE HOOK
// React Query wrapper for /api/v1/advocacy-intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { AdvocacyIntelligenceResult } from "@/lib/engines/advocacy-intelligence-engine";

interface AdvocacyIntelligenceResponse {
  data: AdvocacyIntelligenceResult;
}

export function useAdvocacyIntelligence() {
  return useQuery({
    queryKey: ["advocacy-intelligence"],
    queryFn: () => api.get<AdvocacyIntelligenceResponse>("/advocacy-intelligence"),
    refetchInterval: 60_000,
  });
}
