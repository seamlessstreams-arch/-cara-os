"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type {
  CaraCommittedRecord,
  CaraSuggestedRecord,
  CaraSuggestedRecordStatus,
  CaraSuggestedRecordType,
  CaraSuggestedSourceRef,
} from "@/types/cara-studio";

interface ListResponse<T> { data: T[] }
interface OneResponse<T> { data: T }

export function useSuggestedRecords(
  homeId: string,
  status?: CaraSuggestedRecordStatus,
) {
  const qs = new URLSearchParams({ home_id: homeId });
  if (status) qs.set("status", status);
  return useQuery({
    queryKey: ["cara-suggested-records", homeId, status ?? "all"],
    queryFn: () =>
      api.get<ListResponse<CaraSuggestedRecord>>(
        `/api/v1/cara-studio/suggested-records?${qs.toString()}`,
      ),
    refetchInterval: 60000,
  });
}

export function useCommittedRecords(homeId: string) {
  return useQuery({
    queryKey: ["cara-committed-records", homeId],
    queryFn: () =>
      api.get<ListResponse<CaraCommittedRecord>>(
        `/api/v1/cara-studio/suggested-records?home_id=${encodeURIComponent(
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
      record_type: CaraSuggestedRecordType;
      target_label?: string;
      suggested_title: string;
      suggested_body: string;
      suggested_fields?: Record<string, string | number | boolean | null>;
      source_evidence?: CaraSuggestedSourceRef[];
      actor_id?: string;
      actor_role?: string;
    }) =>
      api.post<OneResponse<CaraSuggestedRecord>>(
        "/api/v1/cara-studio/suggested-records",
        input,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-suggested-records"] });
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
      api.patch<OneResponse<CaraSuggestedRecord>>(
        "/api/v1/cara-studio/suggested-records",
        { ...input, action: "edit" },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-suggested-records"] });
    },
  });
}

export function useRejectSuggestedRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; note?: string; actor_id?: string; actor_role?: string }) =>
      api.patch<OneResponse<CaraSuggestedRecord>>(
        "/api/v1/cara-studio/suggested-records",
        { ...input, action: "reject" },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-suggested-records"] });
    },
  });
}

export function useCommitSuggestedRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; note?: string; actor_id?: string; actor_role?: string }) =>
      api.patch<
        OneResponse<{ suggestion: CaraSuggestedRecord; committed: CaraCommittedRecord }>
      >("/api/v1/cara-studio/suggested-records", { ...input, action: "commit" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-suggested-records"] });
      qc.invalidateQueries({ queryKey: ["cara-committed-records"] });
    },
  });
}
