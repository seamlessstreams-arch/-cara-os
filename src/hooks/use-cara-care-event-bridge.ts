"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { CaraSuggestedRecord } from "@/types/cara-studio";

export interface BridgeResult {
  careEventId: string;
  proposed: CaraSuggestedRecord[];
  reused: CaraSuggestedRecord[];
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
      api.post<BridgeResponse>("/cara-studio/care-event-bridge", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-suggested-records"] });
      qc.invalidateQueries({ queryKey: ["cara-audit-trail"] });
    },
  });
}
