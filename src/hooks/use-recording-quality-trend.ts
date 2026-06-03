"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RECORDING QUALITY TREND HOOK
// React Query wrapper for /api/v1/recording-quality-trend
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { RecordingQualityTrendResult } from "@/lib/recording-quality-trend/recording-quality-trend-engine";

interface RecordingQualityTrendResponse {
  data: RecordingQualityTrendResult;
}

export function useRecordingQualityTrend() {
  return useQuery({
    queryKey: ["recording-quality-trend"],
    queryFn: () => api.get<RecordingQualityTrendResponse>("/recording-quality-trend"),
    refetchInterval: 60_000, // 60 second refresh
  });
}
