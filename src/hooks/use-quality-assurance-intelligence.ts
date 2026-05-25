"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — QUALITY ASSURANCE INTELLIGENCE HOOK
// React Query wrapper for /api/v1/quality-assurance-intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { QualityAssuranceIntelligenceResult } from "@/lib/engines/quality-assurance-intelligence-engine";

interface QualityAssuranceIntelligenceResponse {
  data: QualityAssuranceIntelligenceResult;
}

export function useQualityAssuranceIntelligence() {
  return useQuery({
    queryKey: ["quality-assurance-intelligence"],
    queryFn: () =>
      api.get<QualityAssuranceIntelligenceResponse>(
        "/quality-assurance-intelligence"
      ),
    refetchInterval: 60_000,
  });
}
