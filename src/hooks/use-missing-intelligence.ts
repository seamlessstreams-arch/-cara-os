"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MISSING FROM CARE INTELLIGENCE HOOK
// React Query wrapper for /api/v1/missing-intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { MissingIntelligenceResult } from "@/lib/engines/missing-from-care-engine";

interface MissingIntelligenceResponse {
  data: MissingIntelligenceResult;
}

export function useMissingIntelligence() {
  return useQuery({
    queryKey: ["missing-intelligence"],
    queryFn: () => api.get<MissingIntelligenceResponse>("/missing-intelligence"),
    refetchInterval: 30_000,
  });
}
