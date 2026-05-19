"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { TrajectoryRiEscalation } from "@/lib/care-events/inspection-trajectory";
import type { TrajectoryRiEscalationAck } from "@/lib/db/store";

interface ListResponse {
  data: {
    escalations: TrajectoryRiEscalation[];
    acks_recent: TrajectoryRiEscalationAck[];
  };
}
interface AckResponse { data: TrajectoryRiEscalationAck }

export function useTrajectoryRiEscalations(homeId: string | null | undefined) {
  return useQuery({
    queryKey: ["trajectory-ri-escalations", homeId ?? ""],
    enabled: !!homeId,
    refetchInterval: 60_000,
    queryFn: () =>
      api.get<ListResponse>(
        `/api/v1/care-events/inspection-bundle/ri-escalations?home_id=${encodeURIComponent(homeId!)}`,
      ),
  });
}

export function useAckTrajectoryRiEscalation(homeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { escalation_id: string; note: string }) =>
      api.post<AckResponse>(
        `/api/v1/care-events/inspection-bundle/ri-escalations/ack`,
        { home_id: homeId, ...input },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trajectory-ri-escalations", homeId] });
      qc.invalidateQueries({ queryKey: ["trajectory-alerts", homeId] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
