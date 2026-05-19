"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { SavedTimeDashboard } from "@/lib/care-events/saved-time-dashboard";

interface Response { data: SavedTimeDashboard }

export function useSavedTimeDashboard(homeId: string) {
  return useQuery({
    queryKey: ["saved-time-dashboard", homeId],
    queryFn: () =>
      api.get<Response>(
        `/api/v1/care-events/saved-time-dashboard?home_id=${encodeURIComponent(homeId)}`,
      ),
    refetchInterval: 30000,
  });
}
