"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — VISITORS INTELLIGENCE HOOK
// React Query wrapper for /api/v1/visitors-intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { VisitorsIntelligenceResult } from "@/lib/engines/visitors-intelligence-engine";

interface VisitorsIntelligenceResponse {
  data: VisitorsIntelligenceResult;
}

export function useVisitorsIntelligence() {
  return useQuery({
    queryKey: ["visitors-intelligence"],
    queryFn: () => api.get<VisitorsIntelligenceResponse>("/visitors-intelligence"),
    refetchInterval: 60_000,
  });
}
