"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { PracticeFollowUp } from "@/lib/practice-intelligence/workflow-suggestion-engine";

export interface PracticeFollowUpsResult {
  generated_at: string;
  total: number;
  follow_ups: PracticeFollowUp[];
}

/**
 * Cara's suggested follow-ups from recent records (incidents, missing episodes,
 * restraints, safeguarding, complaints) — each actionable in Cara Studio.
 */
export function usePracticeFollowUps() {
  return useQuery({
    queryKey: ["practice-follow-ups"],
    queryFn: async () =>
      (await api.get<{ data: PracticeFollowUpsResult }>(`/practice-follow-ups`)).data,
  });
}
