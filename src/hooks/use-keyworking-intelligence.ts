"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — KEYWORKING INTELLIGENCE HOOK
// React Query wrapper for /api/v1/keyworking-intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { KeyworkingIntelligenceResult } from "@/lib/engines/keyworking-intelligence-engine";

interface KeyworkingIntelligenceResponse {
  data: KeyworkingIntelligenceResult;
}

export function useKeyworkingIntelligence() {
  return useQuery({
    queryKey: ["keyworking-intelligence"],
    queryFn: () => api.get<KeyworkingIntelligenceResponse>("/keyworking-intelligence"),
    refetchInterval: 60_000, // 60 second refresh
  });
}
