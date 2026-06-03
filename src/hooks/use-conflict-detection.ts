"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CONFLICT DETECTION HOOK
// React Query wrapper for /api/v1/conflict-detection
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { ConflictDetectionResult } from "@/lib/conflict-detection/conflict-detection-engine";

interface ConflictDetectionResponse {
  data: ConflictDetectionResult;
}

export function useConflictDetection() {
  return useQuery({
    queryKey: ["conflict-detection"],
    queryFn: () => api.get<ConflictDetectionResponse>("/conflict-detection"),
    refetchInterval: 60_000, // 60 second refresh
  });
}
