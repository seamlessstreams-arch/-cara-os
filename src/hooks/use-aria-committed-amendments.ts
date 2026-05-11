"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { AriaCommittedRecord } from "@/types/aria-studio";

interface ListResponse<T> {
  data: T[];
}

interface AmendResponse {
  data: {
    previous: AriaCommittedRecord;
    current: AriaCommittedRecord;
    diff: {
      title_changed: boolean;
      body_changed: boolean;
      field_keys_changed: string[];
    };
  };
}

export function useCommittedVersionHistory(recordId: string | null) {
  return useQuery({
    enabled: !!recordId,
    queryKey: ["aria-committed-versions", recordId],
    queryFn: () =>
      api.get<ListResponse<AriaCommittedRecord>>(
        `/api/v1/aria-studio/committed-amendments?record_id=${encodeURIComponent(
          recordId ?? "",
        )}`,
      ),
    refetchInterval: 60000,
  });
}

export function useAmendCommittedRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      record_id: string;
      amendment_reason: string;
      new_title?: string;
      new_body?: string;
      new_fields?: Record<string, string | number | boolean | null>;
      actor_id?: string;
      actor_role?: string;
    }) =>
      api.post<AmendResponse>(
        "/api/v1/aria-studio/committed-amendments",
        input,
      ),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["aria-committed-records"] });
      qc.invalidateQueries({ queryKey: ["aria-committed-versions", vars.record_id] });
      qc.invalidateQueries({ queryKey: ["aria-suggested-records"] });
      qc.invalidateQueries({ queryKey: ["aria-audit-trail"] });
    },
  });
}
