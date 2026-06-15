"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Practice Reasoning hook (OS Layer 3, client)
// GET /api/v1/practice-reasoning?childId= → deterministic reasoning for a child,
// plus a lightweight child list for the picker.
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { PracticeReasoning, ReasoningSignalsInput } from "@/lib/cara-reasoning/types";

export interface PracticeReasoningPayload {
  child: { id: string; name: string };
  children: Array<{ id: string; name: string }>;
  signals: ReasoningSignalsInput;
  reasoning: PracticeReasoning;
}
interface PracticeReasoningResponse {
  data: PracticeReasoningPayload;
}

export function usePracticeReasoning(childId?: string) {
  return useQuery({
    queryKey: ["practice-reasoning", childId ?? "default"],
    queryFn: () =>
      api.get<PracticeReasoningResponse>(
        `/practice-reasoning${childId ? `?childId=${encodeURIComponent(childId)}` : ""}`,
      ),
    staleTime: 60 * 1000,
  });
}
