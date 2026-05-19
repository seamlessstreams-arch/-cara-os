"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type {
  AriaCommittedRecord,
  AriaSuggestedRecord,
  AriaSuggestedRecordStatus,
  AriaSuggestedRecordType,
  AriaSuggestedSourceRef,
} from "@/types/aria-studio";

interface ListResponse<T> { data: T[] }
interface OneResponse<T> { data: T }

export function useSuggestedRecords(
  homeId: string,
  status?: AriaSuggestedRecordStatus,
) {
  const qs = new URLSearchParams({ home_id: homeId });
  if (status) qs.set("status", status);
  return useQuery({
    queryKey: ["aria-suggested-records", homeId, status ?? "all"],
    queryFn: () =>
      api.get<ListResponse<AriaSuggestedRecord>>(
        `/api/v1/aria-studio/suggested-records?${qs.toString()}`,
      ),
    refetchInterval: 60000,
  });
}

export function useCommittedRecords(homeId: string) {
  return useQuery({
    queryKey: ["aria-committed-records", homeId],
    queryFn: () =>
      api.get<ListResponse<AriaCommittedRecord>>(
        `/api/v1/aria-studio/suggested-records?home_id=${encodeURIComponent(
          homeId,
        )}&committed=1`,
      ),
    refetchInterval: 60000,
  });
}

export function useProposeSuggestedRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      home_id: string;
      child_id?: string | null;
      record_type: AriaSuggestedRecordType;
      target_label?: string;
      suggested_title: string;
      suggested_body: string;
      suggested_fields?: Record<string, string | number | boolean | null>;
      source_evidence?: AriaSuggestedSourceRef[];
      actor_id?: string;
      actor_role?: string;
    }) =>
      api.post<OneResponse<AriaSuggestedRecord>>(
        "/api/v1/aria-studio/suggested-records",
        input,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-suggested-records"] });
    },
  });
}

export function useEditSuggestedRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      suggested_title?: string;
      suggested_body?: string;
      suggested_fields?: Record<string, string | number | boolean | null>;
      actor_id?: string;
      actor_role?: string;
    }) =>
      api.patch<OneResponse<AriaSuggestedRecord>>(
        "/api/v1/aria-studio/suggested-records",
        { ...input, action: "edit" },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-suggested-records"] });
    },
  });
}

export function useRejectSuggestedRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; note?: string; actor_id?: string; actor_role?: string }) =>
      api.patch<OneResponse<AriaSuggestedRecord>>(
        "/api/v1/aria-studio/suggested-records",
        { ...input, action: "reject" },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-suggested-records"] });
    },
  });
}

export function useCommitSuggestedRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; note?: string; actor_id?: string; actor_role?: string }) =>
      api.patch<
        OneResponse<{ suggestion: AriaSuggestedRecord; committed: AriaCommittedRecord }>
      >("/api/v1/aria-studio/suggested-records", { ...input, action: "commit" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-suggested-records"] });
      qc.invalidateQueries({ queryKey: ["aria-committed-records"] });
    },
  });
}
