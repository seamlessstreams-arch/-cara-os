"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { Reg44Pack, PersistedReg44PackRow } from "@/lib/care-events/reg44-pack";

interface PackResponse { data: Reg44Pack }
interface ListResponse { data: PersistedReg44PackRow[] }
interface DetailResponse { data: Reg44Pack }

export function usePersistedReg44Packs(homeId: string) {
  return useQuery({
    queryKey: ["reg44-packs", homeId],
    queryFn: () =>
      api.get<ListResponse>(
        `/api/v1/care-events/reg44-pack?home_id=${encodeURIComponent(homeId)}`,
      ),
    refetchInterval: 60000,
  });
}

export function useGenerateAndPersistReg44Pack(homeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (days: number) =>
      api.post<PackResponse>(`/api/v1/care-events/reg44-pack`, {
        home_id: homeId,
        days,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reg44-packs", homeId] });
    },
  });
}

export function useFetchPersistedReg44Pack() {
  return useMutation({
    mutationFn: (id: string) =>
      api.get<DetailResponse>(
        `/api/v1/care-events/reg44-pack/${encodeURIComponent(id)}`,
      ),
  });
}

// Back-compat shim: original M33 callsite is replaced in M35; keep no exports
// other than the persistence-aware ones above.
