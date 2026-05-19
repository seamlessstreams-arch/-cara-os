"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type {
  AriaReg45EvidenceItem,
  AriaReg45Snapshot,
} from "@/types/aria-studio";

interface SnapshotResponse {
  data: AriaReg45Snapshot;
}

export function useReg45Evidence(homeId?: string, periodStart?: string, periodEnd?: string) {
  const search = new URLSearchParams();
  if (homeId) search.set("home_id", homeId);
  if (periodStart) search.set("period_start", periodStart);
  if (periodEnd) search.set("period_end", periodEnd);
  const qs = search.toString();
  return useQuery({
    queryKey: ["aria-reg45-evidence", homeId ?? null, periodStart ?? null, periodEnd ?? null],
    queryFn: () =>
      api.get<SnapshotResponse>(
        `/api/v1/aria-studio/reg45-evidence${qs ? `?${qs}` : ""}`,
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
    }) => api.post<SnapshotResponse>("/api/v1/aria-studio/reg45-evidence", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-reg45-evidence"] });
    },
  });
}

export function useUpdateReg45EvidenceItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      status: AriaReg45EvidenceItem["status"];
      decision_note?: string | null;
      actor_id?: string;
      actor_role?: string;
    }) =>
      api.patch<{ data: AriaReg45EvidenceItem }>(
        "/api/v1/aria-studio/reg45-evidence-items",
        input,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-reg45-evidence"] });
    },
  });
}
