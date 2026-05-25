"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SCCIF SELF-EVALUATION INTELLIGENCE HOOK
// React Query wrapper for /api/v1/sccif-intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { SCCIFIntelligenceResult } from "@/lib/engines/sccif-intelligence-engine";

interface SCCIFIntelligenceResponse {
  data: SCCIFIntelligenceResult;
}

export function useSCCIFIntelligence() {
  return useQuery({
    queryKey: ["sccif-intelligence"],
    queryFn: () => api.get<SCCIFIntelligenceResponse>("/sccif-intelligence"),
    refetchInterval: 60_000, // 60 second refresh
  });
}
