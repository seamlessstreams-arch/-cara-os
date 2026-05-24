"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HEALTH & WELLBEING HOOK
// React Query wrapper for /api/v1/health-wellbeing
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { HealthWellbeingResult } from "@/lib/engines/health-wellbeing-engine";

interface HealthWellbeingResponse {
  data: HealthWellbeingResult;
}

export function useHealthWellbeing() {
  return useQuery({
    queryKey: ["health-wellbeing"],
    queryFn: () => api.get<HealthWellbeingResponse>("/health-wellbeing"),
    refetchInterval: 45_000, // 45 second refresh
  });
}
