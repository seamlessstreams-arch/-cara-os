"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { ChildDailySummary } from "@/types/care-events";

interface RebuildPayload {
  home_id?: string;
  child_id?: string;
  summary_date?: string;
}

interface RebuildResponse {
  data: {
    rebuilt: number;
    skipped_no_events: number;
    summaries: ChildDailySummary[];
  };
}

export function useRebuildChildDailySummary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RebuildPayload) =>
      api.post<RebuildResponse>(
        "/care-events/child-daily-summaries/rebuild",
        payload,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["child-daily-summaries"] });
      qc.invalidateQueries({ queryKey: ["cara-audit-trail"] });
    },
  });
}
