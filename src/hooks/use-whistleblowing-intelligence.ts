"use client";

// ==============================================================================
// CORNERSTONE -- WHISTLEBLOWING INTELLIGENCE HOOK
// React Query wrapper for /api/v1/whistleblowing-intelligence
// ==============================================================================

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { WhistleblowingIntelligenceResult } from "@/lib/engines/whistleblowing-intelligence-engine";

interface WhistleblowingIntelligenceResponse {
  data: WhistleblowingIntelligenceResult;
}

export function useWhistleblowingIntelligence() {
  return useQuery({
    queryKey: ["whistleblowing-intelligence"],
    queryFn: () => api.get<WhistleblowingIntelligenceResponse>("/whistleblowing-intelligence"),
    refetchInterval: 60_000,
  });
}
