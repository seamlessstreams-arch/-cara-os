"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type {
  AriaDecisionSupportSnapshot,
  AriaDecisionRecommendation,
  AriaFormulation,
} from "@/types/aria-studio";

interface SnapshotResponse {
  data: AriaDecisionSupportSnapshot;
}

export function useDecisionSupport(homeId?: string, childId?: string | null) {
  const search = new URLSearchParams();
  if (homeId) search.set("home_id", homeId);
  if (childId) search.set("child_id", childId);
  const qs = search.toString();
  return useQuery({
    queryKey: ["aria-decision-support", homeId ?? null, childId ?? null],
    queryFn: () =>
      api.get<SnapshotResponse>(
        `/api/v1/aria-studio/decision-support${qs ? `?${qs}` : ""}`,
      ),
    refetchInterval: 60000,
  });
}

export function useRunDecisionSupport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      home_id: string;
      child_id?: string | null;
      lookback_days?: number;
      actor_id?: string;
      actor_role?: string;
    }) =>
      api.post<SnapshotResponse>("/api/v1/aria-studio/decision-support", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-decision-support"] });
    },
  });
}

export function useUpdateRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      status: AriaDecisionRecommendation["status"];
      decision_note?: string | null;
      actor_id?: string;
      actor_role?: string;
    }) =>
      api.patch<{ data: AriaDecisionRecommendation }>(
        "/api/v1/aria-studio/decision-recommendations",
        input,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-decision-support"] });
    },
  });
}

export function useUpdateFormulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      status: AriaFormulation["status"];
      reviewer_note?: string | null;
      actor_id?: string;
      actor_role?: string;
    }) =>
      api.patch<{ data: AriaFormulation }>(
        "/api/v1/aria-studio/formulations",
        input,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-decision-support"] });
    },
  });
}
