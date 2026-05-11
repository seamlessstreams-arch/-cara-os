"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { AnnexAEvidenceItem } from "@/types/care-events";

interface Response {
  data: {
    scanned: number;
    created: number;
    refreshed: number;
    skipped_locked: number;
    items: AnnexAEvidenceItem[];
  };
}

export function usePromoteCareEventsToAnnexA() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { home_id?: string } = {}) =>
      api.post<Response>("/api/v1/care-events/annex-a/promote", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["annex-a-evidence"] });
      qc.invalidateQueries({ queryKey: ["aria-annex-a-snapshot"] });
      qc.invalidateQueries({ queryKey: ["aria-audit-trail"] });
    },
  });
}
