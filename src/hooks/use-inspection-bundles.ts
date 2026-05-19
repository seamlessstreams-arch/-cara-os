"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type {
  PersistedInspectionBundleRow,
} from "@/lib/care-events/inspection-bundle";
import type { PersistedInspectionBundle } from "@/lib/db/store";
import type { InspectionBundleDiff } from "@/lib/care-events/inspection-bundle-diff";

interface ListResponse { data: PersistedInspectionBundleRow[] }
interface DetailResponse { data: PersistedInspectionBundle }
interface DiffResponse { data: InspectionBundleDiff }

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

export function useInspectionBundleDiff(
  currentId: string | null | undefined,
  previousId: string | null | undefined,
) {
  return useQuery({
    queryKey: ["inspection-bundle-diff", currentId ?? "", previousId ?? ""],
    enabled: !!currentId,
    queryFn: () => {
      const qs = new URLSearchParams();
      qs.set("current_id", currentId!);
      if (previousId) qs.set("previous_id", previousId);
      return api.get<DiffResponse>(`/api/v1/care-events/inspection-bundle/diff?${qs.toString()}`);
    },
  });
}
