"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type {
  ExportHistorySummary,
} from "@/lib/care-events/export-history";
import type { ExportHistoryEntry } from "@/lib/db/store";
import type { InspectionSnapshot } from "@/lib/care-events/inspection-snapshot";
import type { Reg44Pack } from "@/lib/care-events/reg44-pack";
import type { FilingCabinetIndex } from "@/lib/care-events/filing-cabinet-index";
import type { FilingCategory } from "@/types/care-events";
import type { InspectionBundle } from "@/lib/care-events/inspection-bundle";

interface SummaryResponse { data: ExportHistorySummary }

export function useExportHistory(homeId: string) {
  return useQuery({
    queryKey: ["export-history", homeId],
    queryFn: () =>
      api.get<SummaryResponse>(
        `/api/v1/care-events/exports?home_id=${encodeURIComponent(homeId)}`,
      ),
    refetchInterval: 60000,
  });
}

interface ArtifactHistoryResponse { data: ExportHistoryEntry[] }

export function useArtifactExportHistory(homeId: string, artifactId: string | null | undefined) {
  return useQuery({
    queryKey: ["export-history", "by-artifact", homeId, artifactId ?? ""],
    enabled: !!artifactId,
    queryFn: () =>
      api.get<ArtifactHistoryResponse>(
        `/api/v1/care-events/exports/by-artifact?home_id=${encodeURIComponent(homeId)}&artifact_id=${encodeURIComponent(artifactId!)}`,
      ),
    refetchInterval: 30000,
  });
}

interface SnapshotExportResponse {
  data: { export: ExportHistoryEntry; payload: InspectionSnapshot };
}
interface Reg44ExportResponse {
  data: { export: ExportHistoryEntry; payload: Reg44Pack };
}

export function useExportInspectionSnapshot() {
  return useMutation({
    mutationFn: (input: { id: string; reason?: string }) =>
      api.post<SnapshotExportResponse>(
        `/api/v1/care-events/inspection-snapshot/${encodeURIComponent(input.id)}/export`,
        { reason: input.reason ?? null },
      ),
  });
}

export function useExportReg44Pack() {
  return useMutation({
    mutationFn: (input: { id: string; reason?: string }) =>
      api.post<Reg44ExportResponse>(
        `/api/v1/care-events/reg44-pack/${encodeURIComponent(input.id)}/export`,
        { reason: input.reason ?? null },
      ),
  });
}

interface FilingExportResponse {
  data: {
    export: ExportHistoryEntry;
    payload: FilingCabinetIndex & { filtered_to_category?: FilingCategory };
  };
}

export function useExportFilingCabinet() {
  return useMutation({
    mutationFn: (input: { homeId: string; category?: FilingCategory; reason?: string }) =>
      api.post<FilingExportResponse>(
        `/api/v1/care-events/filing-cabinet/export`,
        {
          home_id: input.homeId,
          category: input.category ?? null,
          reason: input.reason ?? null,
        },
      ),
  });
}

interface InspectionBundleExportResponse {
  data: { export: ExportHistoryEntry; bundle: InspectionBundle };
}

export function useExportInspectionBundle() {
  return useMutation({
    mutationFn: (input: { homeId: string; reason?: string }) =>
      api.post<InspectionBundleExportResponse>(
        `/api/v1/care-events/inspection-bundle/export`,
        { home_id: input.homeId, reason: input.reason ?? null },
      ),
  });
}
