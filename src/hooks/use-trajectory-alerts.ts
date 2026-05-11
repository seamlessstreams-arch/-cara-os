"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type {
  TrajectoryAlert,
} from "@/lib/care-events/inspection-trajectory";
import type { TrajectoryAlertAck } from "@/lib/db/store";

interface ListResponse {
  data: { alerts: TrajectoryAlert[]; acks_recent: TrajectoryAlertAck[] };
}
interface AckResponse { data: TrajectoryAlertAck }

export function useTrajectoryAlerts(homeId: string | null | undefined) {
  return useQuery({
    queryKey: ["trajectory-alerts", homeId ?? ""],
    enabled: !!homeId,
    refetchInterval: 60_000,
    queryFn: () =>
      api.get<ListResponse>(
        `/api/v1/care-events/inspection-bundle/trajectory-alerts?home_id=${encodeURIComponent(homeId!)}`,
      ),
  });
}

export function useAckTrajectoryAlert(homeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { alert_id: string; note: string }) =>
      api.post<AckResponse>(
        `/api/v1/care-events/inspection-bundle/trajectory-alerts/ack`,
        { home_id: homeId, ...input },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trajectory-alerts", homeId] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
