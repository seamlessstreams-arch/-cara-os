"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF DISCIPLINARY INTELLIGENCE HOOK
// React Query wrapper for /api/v1/staff-disciplinary-intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { StaffDisciplinaryIntelligenceResult } from "@/lib/engines/staff-disciplinary-intelligence-engine";

interface StaffDisciplinaryIntelligenceResponse {
  data: StaffDisciplinaryIntelligenceResult;
}

export function useStaffDisciplinaryIntelligence() {
  return useQuery({
    queryKey: ["staff-disciplinary-intelligence"],
    queryFn: () => api.get<StaffDisciplinaryIntelligenceResponse>("/staff-disciplinary-intelligence"),
    refetchInterval: 60_000,
  });
}
