"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF DEVELOPMENT INTELLIGENCE HOOK
// React Query wrapper for /api/v1/staff-development-intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { StaffDevelopmentIntelligenceResult } from "@/lib/engines/staff-development-intelligence-engine";

interface StaffDevelopmentIntelligenceResponse {
  data: StaffDevelopmentIntelligenceResult;
}

export function useStaffDevelopmentIntelligence() {
  return useQuery({
    queryKey: ["staff-development-intelligence"],
    queryFn: () => api.get<StaffDevelopmentIntelligenceResponse>("/staff-development-intelligence"),
    refetchInterval: 60_000,
  });
}
