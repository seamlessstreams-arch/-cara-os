"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { ManagerOversightQueue, CaraCommittedRecord } from "@/types/cara-studio";

interface QueueResponse {
  data: ManagerOversightQueue;
}

interface AckResponse {
  data: CaraCommittedRecord;
}

export function useManagementOversight(homeId: string) {
  return useQuery({
    queryKey: ["cara-management-oversight", homeId],
    queryFn: () =>
      api.get<QueueResponse>(
        `/cara-studio/management-oversight?home_id=${encodeURIComponent(homeId)}`,
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
      api.post<AckResponse>("/cara-studio/management-oversight", {
        ...input,
        action: "acknowledge",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-management-oversight"] });
      qc.invalidateQueries({ queryKey: ["cara-committed-records"] });
      qc.invalidateQueries({ queryKey: ["cara-committed-versions"] });
      qc.invalidateQueries({ queryKey: ["cara-audit-trail"] });
    },
  });
}
