"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type { DocVersionRecord } from "@/lib/doc-versioning/doc-versioning-engine";

export type { DocVersionRecord };

type HistoryResponse = {
  data: { doc_type: string; doc_id: string; current: DocVersionRecord | null; history: DocVersionRecord[] };
};

/** Version history for one policy (read-only; spine reads are always on). */
export function usePolicyVersionHistory(policyId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["policy-versions", policyId],
    queryFn: () => api.get<HistoryResponse>(`/document-versions?doc_type=home_policy&doc_id=${policyId}`),
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export interface RecordPolicyVersionInput {
  policyId: string;
  change_summary: string;
  version_label?: string | null;
  next_review_date?: string | null;
}

type RecordResponse = {
  data:
    | { enabled: false; recorded: false; reason: string }
    | { enabled: true; recorded: true; version: DocVersionRecord };
};

/** Record a versioned policy update (flag-gated server-side; no-op when off). */
export function useRecordPolicyVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ policyId, ...body }: RecordPolicyVersionInput) =>
      api.post<RecordResponse>(`/policies/${policyId}/version`, body),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["policy-versions", vars.policyId] });
      qc.invalidateQueries({ queryKey: ["home-policies"] });
      qc.invalidateQueries({ queryKey: ["document-governance"] });
    },
  });
}
