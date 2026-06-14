"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { CaraCareGraphSnapshot } from "@/types/cara-studio";

interface CareGraphResponse {
  data: CaraCareGraphSnapshot;
}

export function useCareGraph(homeId?: string, childId?: string | null) {
  const search = new URLSearchParams();
  if (homeId) search.set("home_id", homeId);
  if (childId) search.set("child_id", childId);
  const qs = search.toString();
  return useQuery({
    queryKey: ["cara-care-graph", homeId ?? null, childId ?? null],
    queryFn: () =>
      api.get<CareGraphResponse>(
        `/cara-studio/care-graph${qs ? `?${qs}` : ""}`,
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
      api.post<CareGraphResponse>("/cara-studio/care-graph", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-care-graph"] });
    },
  });
}
