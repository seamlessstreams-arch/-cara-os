"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — DOCUMENT COMPLIANCE INTELLIGENCE HOOK
// React Query wrapper for /api/v1/document-compliance-intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { DocumentComplianceIntelligenceResult } from "@/lib/engines/document-compliance-intelligence-engine";

interface DocumentComplianceIntelligenceResponse {
  data: DocumentComplianceIntelligenceResult;
}

export function useDocumentComplianceIntelligence() {
  return useQuery({
    queryKey: ["document-compliance-intelligence"],
    queryFn: () => api.get<DocumentComplianceIntelligenceResponse>("/document-compliance-intelligence"),
    refetchInterval: 60_000,
  });
}
