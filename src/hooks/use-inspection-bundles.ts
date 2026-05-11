"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type {
  PersistedInspectionBundleRow,
} from "@/lib/care-events/inspection-bundle";
import type { PersistedInspectionBundle } from "@/lib/db/store";

interface ListResponse { data: PersistedInspectionBundleRow[] }
interface DetailResponse { data: PersistedInspectionBundle }

export function useInspectionBundles(homeId: string) {
  return useQuery({
    queryKey: ["inspection-bundles", homeId],
    queryFn: () =>
      api.get<ListResponse>(
        `/api/v1/care-events/inspection-bundle?home_id=${encodeURIComponent(homeId)}`,
      ),
    refetchInterval: 60000,
  });
}

export function useInspectionBundle(id: string | null | undefined) {
  return useQuery({
    queryKey: ["inspection-bundle", id ?? ""],
    enabled: !!id,
    queryFn: () =>
      api.get<DetailResponse>(
        `/api/v1/care-events/inspection-bundle/${encodeURIComponent(id!)}`,
      ),
  });
}
