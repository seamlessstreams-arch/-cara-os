"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — COMPLAINTS INTELLIGENCE HOOK
// React Query wrapper for /api/v1/complaints-intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { ComplaintsIntelligenceResult } from "@/lib/engines/complaints-intelligence-engine";

interface ComplaintsIntelligenceResponse {
  data: ComplaintsIntelligenceResult;
}

export function useComplaintsIntelligence() {
  return useQuery({
    queryKey: ["complaints-intelligence"],
    queryFn: () => api.get<ComplaintsIntelligenceResponse>("/complaints-intelligence"),
    refetchInterval: 60_000,
  });
}
