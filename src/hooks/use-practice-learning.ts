"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Practice Learning hook (OS Layer 5, client)
// GET /api/v1/practice-learning?childId= → retrospective organisational learning.
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { LearningRecord } from "@/lib/practice-learning/types";

interface PracticeLearningResponse {
  data: { learning: LearningRecord };
}

export function usePracticeLearning(childId?: string) {
  return useQuery({
    queryKey: ["practice-learning", childId ?? "home"],
    queryFn: () =>
      api.get<PracticeLearningResponse>(
        `/practice-learning${childId ? `?childId=${encodeURIComponent(childId)}` : ""}`,
      ),
    staleTime: 60 * 1000,
  });
}
