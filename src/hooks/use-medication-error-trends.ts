"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MEDICATION ERROR TRENDS HOOK
// React Query wrapper for /api/v1/medication-error-trends
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { MedicationErrorTrendResult } from "@/lib/medication-error-trends/medication-error-trends-engine";

interface MedicationErrorTrendsResponse {
  data: MedicationErrorTrendResult;
}

export function useMedicationErrorTrends() {
  return useQuery({
    queryKey: ["medication-error-trends"],
    queryFn: () => api.get<MedicationErrorTrendsResponse>("/medication-error-trends"),
    refetchInterval: 60_000, // 60 second refresh
  });
}
