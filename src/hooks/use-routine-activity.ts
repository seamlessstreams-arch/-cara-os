"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";
import type { RoutineActivityView } from "@/lib/theory-lens/routine-activity-engine";

/** When and where the home is thinnest, and whether anything clusters there. */
export function useRoutineActivity(days?: number) {
  const qs = days ? `?days=${days}` : "";
  return useQuery({
    queryKey: ["routine-activity", days ?? 90],
    queryFn: async () => (await api.get<{ data: RoutineActivityView }>(`/routine-activity${qs}`)).data,
  });
}
