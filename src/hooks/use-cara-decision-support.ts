"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type {
  CaraDecisionSupportSnapshot,
  CaraDecisionRecommendation,
  CaraFormulation,
} from "@/types/cara-studio";

interface SnapshotResponse {
  data: CaraDecisionSupportSnapshot;
}

export function useDecisionSupport(homeId?: string, childId?: string | null) {
  const search = new URLSearchParams();
  if (homeId) search.set("home_id", homeId);
  if (childId) search.set("child_id", childId);
  const qs = search.toString();
  return useQuery({
    queryKey: ["cara-decision-support", homeId ?? null, childId ?? null],
    queryFn: () =>
      api.get<SnapshotResponse>(
        `/cara-studio/decision-support${qs ? `?${qs}` : ""}`,
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
      api.post<SnapshotResponse>("/cara-studio/decision-support", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-decision-support"] });
    },
  });
}

export function useUpdateRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      status: CaraDecisionRecommendation["status"];
      decision_note?: string | null;
      actor_id?: string;
      actor_role?: string;
    }) =>
      api.patch<{ data: CaraDecisionRecommendation }>(
        "/cara-studio/decision-recommendations",
        input,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-decision-support"] });
    },
  });
}

export function useUpdateFormulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      status: CaraFormulation["status"];
      reviewer_note?: string | null;
      actor_id?: string;
      actor_role?: string;
    }) =>
      api.patch<{ data: CaraFormulation }>(
        "/cara-studio/formulations",
        input,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-decision-support"] });
    },
  });
}
