"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EMERGENCY PREPAREDNESS INTELLIGENCE HOOK
// React Query wrapper for /api/v1/emergency-intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { EmergencyIntelligenceResult } from "@/lib/engines/emergency-intelligence-engine";

interface EmergencyIntelligenceResponse {
  data: EmergencyIntelligenceResult;
}

export function useEmergencyIntelligence() {
  return useQuery({
    queryKey: ["emergency-intelligence"],
    queryFn: () => api.get<EmergencyIntelligenceResponse>("/emergency-intelligence"),
    refetchInterval: 60_000,
  });
}
