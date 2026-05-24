"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RESTRAINT INTELLIGENCE HOOK
// React Query wrapper for /api/v1/restraint-intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { RestraintIntelligenceResult } from "@/lib/engines/restraint-intelligence-engine";

interface RestraintIntelligenceResponse {
  data: RestraintIntelligenceResult;
}

export function useRestraintIntelligence() {
  return useQuery({
    queryKey: ["restraint-intelligence"],
    queryFn: () => api.get<RestraintIntelligenceResponse>("/restraint-intelligence"),
    refetchInterval: 60_000, // 60 second refresh
  });
}
