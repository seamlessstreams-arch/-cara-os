"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ADMISSION & REFERRAL INTELLIGENCE HOOK
// React Query wrapper for /api/v1/admission-referral-intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { AdmissionReferralIntelligenceResult } from "@/lib/engines/admission-referral-intelligence-engine";

interface AdmissionReferralIntelligenceResponse {
  data: AdmissionReferralIntelligenceResult;
}

export function useAdmissionReferralIntelligence() {
  return useQuery({
    queryKey: ["admission-referral-intelligence"],
    queryFn: () => api.get<AdmissionReferralIntelligenceResponse>("/admission-referral-intelligence"),
    refetchInterval: 60_000, // 60 second refresh
  });
}
