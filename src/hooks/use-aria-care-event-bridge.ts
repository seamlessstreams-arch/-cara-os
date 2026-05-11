"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { AriaSuggestedRecord } from "@/types/aria-studio";

export interface BridgeResult {
  careEventId: string;
  proposed: AriaSuggestedRecord[];
  reused: AriaSuggestedRecord[];
  skipped: boolean;
  reason?: string;
}

interface BridgeResponse {
  data: {
    totals: { proposed: number; reused: number; skipped: number };
    results: BridgeResult[];
  };
}

export function useBridgeCareEvents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      home_id: string;
      care_event_id?: string;
      limit?: number;
      actor_id?: string;
      actor_role?: string;
    }) =>
      api.post<BridgeResponse>("/api/v1/aria-studio/care-event-bridge", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-suggested-records"] });
      qc.invalidateQueries({ queryKey: ["aria-audit-trail"] });
    },
  });
}
