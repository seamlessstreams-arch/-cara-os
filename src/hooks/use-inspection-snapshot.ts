"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { InspectionSnapshot, PersistedSnapshotRow } from "@/lib/care-events/inspection-snapshot";
import type { PersistedInspectionSnapshot } from "@/lib/db/store";

interface SnapResponse { data: InspectionSnapshot }
interface ListResponse { data: PersistedSnapshotRow[] }
interface DetailResponse { data: PersistedInspectionSnapshot }

export function usePersistedSnapshots(homeId: string) {
  return useQuery({
    queryKey: ["inspection-snapshots", homeId],
    queryFn: () =>
      api.get<ListResponse>(
        `/api/v1/care-events/inspection-snapshot?home_id=${encodeURIComponent(homeId)}`,
      ),
    refetchInterval: 60000,
  });
}

export function useGenerateAndPersistSnapshot(homeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<SnapResponse>(`/api/v1/care-events/inspection-snapshot`, { home_id: homeId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspection-snapshots", homeId] });
    },
  });
}

export function useFetchPersistedSnapshot() {
  return useMutation({
    mutationFn: (id: string) =>
      api.get<DetailResponse>(
        `/api/v1/care-events/inspection-snapshot/${encodeURIComponent(id)}`,
      ),
  });
}
