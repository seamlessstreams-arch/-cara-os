"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SAFER RECRUITMENT INTELLIGENCE HOOK
// React Query wrapper for /api/v1/safer-recruitment-intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { SaferRecruitmentIntelligenceResult } from "@/lib/engines/safer-recruitment-intelligence-engine";

interface SaferRecruitmentIntelligenceResponse {
  data: SaferRecruitmentIntelligenceResult;
}

export function useSaferRecruitmentIntelligence() {
  return useQuery({
    queryKey: ["safer-recruitment-intelligence"],
    queryFn: () => api.get<SaferRecruitmentIntelligenceResponse>("/safer-recruitment-intelligence"),
    refetchInterval: 60_000,
  });
}
