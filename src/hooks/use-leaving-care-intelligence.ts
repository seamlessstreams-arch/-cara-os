"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — LEAVING CARE INTELLIGENCE HOOK
// React Query wrapper for /api/v1/leaving-care-intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { LeavingCareIntelligenceResult } from "@/lib/engines/leaving-care-intelligence-engine";

interface LeavingCareIntelligenceResponse {
  data: LeavingCareIntelligenceResult;
}

export function useLeavingCareIntelligence() {
  return useQuery({
    queryKey: ["leaving-care-intelligence"],
    queryFn: () => api.get<LeavingCareIntelligenceResponse>("/leaving-care-intelligence"),
    refetchInterval: 60_000, // 60 second refresh
  });
}
