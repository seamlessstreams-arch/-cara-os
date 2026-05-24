"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — INCIDENT ANALYTICS HOOK
// React Query wrapper for /api/v1/incident-analytics
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { IncidentAnalyticsResult } from "@/lib/engines/incident-analytics-engine";

interface IncidentAnalyticsResponse {
  data: IncidentAnalyticsResult;
}

export function useIncidentAnalytics() {
  return useQuery({
    queryKey: ["incident-analytics"],
    queryFn: () => api.get<IncidentAnalyticsResponse>("/incident-analytics"),
    refetchInterval: 30_000, // 30 second refresh (incidents are critical)
  });
}
