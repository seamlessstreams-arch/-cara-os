"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { InspectionReadinessReport } from "@/lib/care-events/inspection-readiness";

interface Response {
  data: InspectionReadinessReport;
}

export function useInspectionReadiness(homeId: string) {
  return useQuery({
    queryKey: ["inspection-readiness", homeId],
    queryFn: () =>
      api.get<Response>(
        `/api/v1/care-events/inspection-readiness?home_id=${encodeURIComponent(homeId)}`,
      ),
    refetchInterval: 30000,
  });
}
