"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RISK ASSESSMENT INTELLIGENCE HOOK
// React Query wrapper for /api/v1/risk-assessment-intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { RiskAssessmentIntelligenceResult } from "@/lib/engines/risk-assessment-intelligence-engine";

interface RiskAssessmentIntelligenceResponse {
  data: RiskAssessmentIntelligenceResult;
}

export function useRiskAssessmentIntelligence() {
  return useQuery({
    queryKey: ["risk-assessment-intelligence"],
    queryFn: () => api.get<RiskAssessmentIntelligenceResponse>("/risk-assessment-intelligence"),
    refetchInterval: 60_000, // 60 second refresh
  });
}
