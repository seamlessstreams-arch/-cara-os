"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RECORDING QUALITY INTELLIGENCE HOOK
// React Query wrapper for /api/v1/recording-quality-intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { RecordingQualityIntelligenceResult } from "@/lib/engines/recording-quality-intelligence-engine";

interface RecordingQualityIntelligenceResponse {
  data: RecordingQualityIntelligenceResult;
}

export function useRecordingQualityIntelligence() {
  return useQuery({
    queryKey: ["recording-quality-intelligence"],
    queryFn: () =>
      api.get<RecordingQualityIntelligenceResponse>(
        "/recording-quality-intelligence",
      ),
    refetchInterval: 60_000,
  });
}
