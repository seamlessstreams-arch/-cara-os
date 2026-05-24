"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — OUTCOMES PROGRESS INTELLIGENCE HOOK
// React Query wrapper for /api/v1/outcomes-progress
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { OutcomesProgressResult } from "@/lib/engines/outcomes-progress-engine";

interface OutcomesProgressResponse {
  data: OutcomesProgressResult;
}

export function useOutcomesProgress() {
  return useQuery({
    queryKey: ["outcomes-progress"],
    queryFn: () => api.get<OutcomesProgressResponse>("/outcomes-progress"),
    refetchInterval: 60_000, // 60 second refresh
  });
}
