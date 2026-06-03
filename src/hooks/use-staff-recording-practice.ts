"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF RECORDING PRACTICE HOOK
// React Query wrapper for /api/v1/staff-recording-practice
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { StaffRecordingPracticeResult } from "@/lib/staff-recording-practice/staff-recording-practice-engine";

interface StaffRecordingPracticeResponse {
  data: StaffRecordingPracticeResult;
}

export function useStaffRecordingPractice() {
  return useQuery({
    queryKey: ["staff-recording-practice"],
    queryFn: () => api.get<StaffRecordingPracticeResponse>("/staff-recording-practice"),
    refetchInterval: 60_000, // 60 second refresh
  });
}
