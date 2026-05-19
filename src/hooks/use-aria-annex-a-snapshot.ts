"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { AriaAnnexASnapshot } from "@/types/aria-studio";

interface ListResponse {
  data: AriaAnnexASnapshot[];
}
interface OneResponse {
  data: AriaAnnexASnapshot;
}

export function useAnnexASnapshots(homeId?: string) {
  const qs = homeId ? `?home_id=${encodeURIComponent(homeId)}` : "";
  return useQuery({
    queryKey: ["aria-annex-a-snapshot", homeId ?? null],
    queryFn: () => api.get<ListResponse>(`/api/v1/aria-studio/annex-a-snapshot${qs}`),
    refetchInterval: 60000,
  });
}

export function useRunAnnexASnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      home_id: string;
      period_start?: string;
      period_end?: string;
      actor_id?: string;
      actor_role?: string;
    }) => api.post<OneResponse>("/api/v1/aria-studio/annex-a-snapshot", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-annex-a-snapshot"] });
    },
  });
}

export function useLockAnnexASnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      lock_note?: string | null;
      actor_id?: string;
      actor_role?: string;
    }) => api.patch<OneResponse>("/api/v1/aria-studio/annex-a-snapshot-lock", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aria-annex-a-snapshot"] });
    },
  });
}
