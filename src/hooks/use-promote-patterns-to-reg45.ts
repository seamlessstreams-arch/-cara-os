"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { PromotionResult } from "@/lib/care-events/pattern-reg45-bridge";

interface Response {
  data: PromotionResult;
}

export function usePromotePatternsToReg45() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      home_id: string;
      lookback_days?: number;
      min_cluster?: number;
      time_band_hours?: number;
      period_start?: string;
      period_end?: string;
      actor_id?: string;
      actor_role?: string;
    }) =>
      api.post<Response>("/api/v1/care-events/patterns/promote", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-reg45-evidence"] });
      qc.invalidateQueries({ queryKey: ["aria-audit-trail"] });
    },
  });
}
