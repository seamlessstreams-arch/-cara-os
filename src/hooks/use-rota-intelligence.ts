"use client";

// ═══════════════��═══════════════════════���════════════════════════════════════��═
// CORNERSTONE — ROTA INTELLIGENCE HOOK
// React Query wrapper for /api/v1/rota-intelligence
// ═════════════��═════════════���═══════════════════════════════════════��══════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { RotaIntelligenceResult } from "@/lib/engines/rota-intelligence-engine";

interface RotaIntelligenceResponse {
  data: RotaIntelligenceResult;
}

export function useRotaIntelligence() {
  return useQuery({
    queryKey: ["rota-intelligence"],
    queryFn: () => api.get<RotaIntelligenceResponse>("/rota-intelligence"),
    refetchInterval: 60_000,
  });
}
