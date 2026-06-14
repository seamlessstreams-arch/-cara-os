"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type {
  CaraReg45EvidenceItem,
  CaraReg45Snapshot,
} from "@/types/cara-studio";

interface SnapshotResponse {
  data: CaraReg45Snapshot;
}

export function useReg45Evidence(homeId?: string, periodStart?: string, periodEnd?: string) {
  const search = new URLSearchParams();
  if (homeId) search.set("home_id", homeId);
  if (periodStart) search.set("period_start", periodStart);
  if (periodEnd) search.set("period_end", periodEnd);
  const qs = search.toString();
  return useQuery({
    queryKey: ["cara-reg45-evidence", homeId ?? null, periodStart ?? null, periodEnd ?? null],
    queryFn: () =>
      api.get<SnapshotResponse>(
        `/cara-studio/reg45-evidence${qs ? `?${qs}` : ""}`,
      ),
    refetchInterval: 60000,
  });
}

export function useRunReg45EvidenceBuild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      home_id: string;
      period_start?: string;
      period_end?: string;
      actor_id?: string;
      actor_role?: string;
    }) => api.post<SnapshotResponse>("/cara-studio/reg45-evidence", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-reg45-evidence"] });
    },
  });
}

export function useUpdateReg45EvidenceItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      status: CaraReg45EvidenceItem["status"];
      decision_note?: string | null;
      actor_id?: string;
      actor_role?: string;
    }) =>
      api.patch<{ data: CaraReg45EvidenceItem }>(
        "/cara-studio/reg45-evidence-items",
        input,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cara-reg45-evidence"] });
    },
  });
}
