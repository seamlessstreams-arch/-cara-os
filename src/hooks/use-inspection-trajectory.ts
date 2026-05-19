"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { TrajectorySummary } from "@/lib/care-events/inspection-trajectory";

interface TrajectoryResponse { data: TrajectorySummary }

export function useInspectionTrajectory(homeId: string | null | undefined) {
  return useQuery({
    queryKey: ["inspection-trajectory", homeId ?? ""],
    enabled: !!homeId,
    refetchInterval: 60_000,
    queryFn: () =>
      api.get<TrajectoryResponse>(
        `/api/v1/care-events/inspection-bundle/trajectory?home_id=${encodeURIComponent(homeId!)}`,
      ),
  });
}
