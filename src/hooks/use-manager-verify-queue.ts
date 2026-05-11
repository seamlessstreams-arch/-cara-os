"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { ManagerVerifyQueue } from "@/lib/care-events/manager-verify-queue";
import type { BulkActionResult } from "@/lib/care-events/manager-bulk-actions";

interface QueueResponse { data: ManagerVerifyQueue }
interface ActionResponse { data: BulkActionResult }

export function useManagerVerifyQueue(homeId: string) {
  return useQuery({
    queryKey: ["manager-verify-queue", homeId],
    queryFn: () =>
      api.get<QueueResponse>(
        `/api/v1/care-events/manager-verify-queue?home_id=${encodeURIComponent(homeId)}`,
      ),
    refetchInterval: 30000,
  });
}

export interface BulkVerifyInput {
  home_id: string;
  care_event_ids: string[];
  manager_signature: true;
  manager_notes?: string | null;
}

export interface BulkReturnInput {
  home_id: string;
  care_event_ids: string[];
  return_reason: string;
  manager_notes?: string | null;
}

export function useManagerBulkVerify(homeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BulkVerifyInput) =>
      api.post<ActionResponse>(
        "/api/v1/care-events/manager-verify-queue",
        { action: "verify", ...input },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manager-verify-queue", homeId] });
    },
  });
}

export function useManagerBulkReturn(homeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BulkReturnInput) =>
      api.post<ActionResponse>(
        "/api/v1/care-events/manager-verify-queue",
        { action: "return", ...input },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manager-verify-queue", homeId] });
    },
  });
}
