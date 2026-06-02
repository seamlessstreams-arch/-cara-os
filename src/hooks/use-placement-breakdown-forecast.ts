"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PLACEMENT BREAKDOWN FORECAST HOOK
// React Query wrapper for /api/v1/placement-breakdown-forecast
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { PlacementBreakdownForecastResult } from "@/lib/placement-breakdown-forecast/placement-breakdown-forecast-engine";

interface PlacementBreakdownForecastResponse {
  data: PlacementBreakdownForecastResult;
}

export function usePlacementBreakdownForecast() {
  return useQuery({
    queryKey: ["placement-breakdown-forecast"],
    queryFn: () =>
      api.get<PlacementBreakdownForecastResponse>("/placement-breakdown-forecast"),
    refetchInterval: 60_000, // 60 second refresh
  });
}
