"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { EmotionalSafetyAnalysis } from "@/lib/emotional-safety/emotional-safety-engine";

/**
 * Fetch a child's Emotional Safety Analysis — triggers, what helps them
 * regulate, escalation patterns and recovery signals, projected from existing
 * records.
 */
export function useEmotionalSafety(childId: string | undefined) {
  return useQuery({
    queryKey: ["emotional-safety", childId],
    enabled: !!childId,
    queryFn: async () =>
      (
        await api.get<{ data: EmotionalSafetyAnalysis }>(
          `/emotional-safety?child_id=${encodeURIComponent(childId!)}`,
        )
      ).data,
  });
}
