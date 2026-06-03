"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF–CHILD CONTINUITY OF CARE HOOK
// React Query wrapper for /api/v1/staff-child-continuity
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { StaffChildContinuityResult } from "@/lib/staff-child-continuity/staff-child-continuity-engine";

interface StaffChildContinuityResponse {
  data: StaffChildContinuityResult;
}

export function useStaffChildContinuity() {
  return useQuery({
    queryKey: ["staff-child-continuity"],
    queryFn: () => api.get<StaffChildContinuityResponse>("/staff-child-continuity"),
    refetchInterval: 60_000, // 60 second refresh
  });
}
