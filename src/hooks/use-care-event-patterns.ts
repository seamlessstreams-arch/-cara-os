"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { CareEventPatternSummary } from "@/lib/care-events/pattern-detection";

interface Response {
  data: CareEventPatternSummary;
}

export interface UseCareEventPatternsOptions {
  lookbackDays?: number;
  minCluster?: number;
  timeBandHours?: number;
}

export function useCareEventPatterns(
  homeId: string,
  options: UseCareEventPatternsOptions = {},
) {
  const search = new URLSearchParams({ home_id: homeId });
  if (options.lookbackDays) search.set("lookback_days", String(options.lookbackDays));
  if (options.minCluster) search.set("min_cluster", String(options.minCluster));
  if (options.timeBandHours) search.set("time_band_hours", String(options.timeBandHours));
  return useQuery({
    queryKey: [
      "care-event-patterns",
      homeId,
      options.lookbackDays ?? null,
      options.minCluster ?? null,
      options.timeBandHours ?? null,
    ],
    queryFn: () =>
      api.get<Response>(`/api/v1/care-events/patterns?${search.toString()}`),
    refetchInterval: 60000,
  });
}
