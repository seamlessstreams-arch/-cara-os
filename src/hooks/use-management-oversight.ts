"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { ManagerOversightQueue, AriaCommittedRecord } from "@/types/aria-studio";

interface QueueResponse {
  data: ManagerOversightQueue;
}

interface AckResponse {
  data: AriaCommittedRecord;
}

export function useManagementOversight(homeId: string) {
  return useQuery({
    queryKey: ["aria-management-oversight", homeId],
    queryFn: () =>
      api.get<QueueResponse>(
        `/api/v1/aria-studio/management-oversight?home_id=${encodeURIComponent(homeId)}`,
      ),
    refetchInterval: 30000,
  });
}

export function useAcknowledgeAmendment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      record_id: string;
      actor_id?: string;
      actor_role?: string;
    }) =>
      api.post<AckResponse>("/api/v1/aria-studio/management-oversight", {
        ...input,
        action: "acknowledge",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-management-oversight"] });
      qc.invalidateQueries({ queryKey: ["aria-committed-records"] });
      qc.invalidateQueries({ queryKey: ["aria-committed-versions"] });
      qc.invalidateQueries({ queryKey: ["aria-audit-trail"] });
    },
  });
}
