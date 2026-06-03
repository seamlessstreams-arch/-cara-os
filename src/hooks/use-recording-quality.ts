"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RECORDING QUALITY HOOK
// React Query wrapper for /api/v1/recording-quality
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { RecordingQualityResult } from "@/lib/recording-quality/recording-quality-engine";

interface RecordingQualityResponse {
  data: RecordingQualityResult;
}

export function useRecordingQuality() {
  return useQuery({
    queryKey: ["recording-quality"],
    queryFn: () => api.get<RecordingQualityResponse>("/recording-quality"),
    refetchInterval: 60_000, // 60 second refresh
  });
}
