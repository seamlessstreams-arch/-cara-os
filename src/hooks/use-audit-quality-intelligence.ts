"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — AUDIT QUALITY ASSURANCE INTELLIGENCE HOOK
// React Query wrapper for /api/v1/audit-quality-intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { AuditQualityIntelligenceResult } from "@/lib/engines/audit-quality-intelligence-engine";

interface AuditQualityIntelligenceResponse {
  data: AuditQualityIntelligenceResult;
}

export function useAuditQualityIntelligence() {
  return useQuery({
    queryKey: ["audit-quality-intelligence"],
    queryFn: () => api.get<AuditQualityIntelligenceResponse>("/audit-quality-intelligence"),
    refetchInterval: 60_000,
  });
}
