"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { AriaCareGraphSnapshot } from "@/types/aria-studio";

interface CareGraphResponse {
  data: AriaCareGraphSnapshot;
}

export function useCareGraph(homeId?: string, childId?: string | null) {
  const search = new URLSearchParams();
  if (homeId) search.set("home_id", homeId);
  if (childId) search.set("child_id", childId);
  const qs = search.toString();
  return useQuery({
    queryKey: ["aria-care-graph", homeId ?? null, childId ?? null],
    queryFn: () =>
      api.get<CareGraphResponse>(
        `/api/v1/aria-studio/care-graph${qs ? `?${qs}` : ""}`,
      ),
    refetchInterval: 60000,
  });
}

export function useRebuildCareGraph() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      home_id: string;
      child_id?: string | null;
      lookback_days?: number;
      actor_id?: string;
      actor_role?: string;
    }) =>
      api.post<CareGraphResponse>("/api/v1/aria-studio/care-graph", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-care-graph"] });
    },
  });
}
