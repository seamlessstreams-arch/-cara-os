"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type {
  ExportHistorySummary,
} from "@/lib/care-events/export-history";
import type { ExportHistoryEntry } from "@/lib/db/store";
import type { InspectionSnapshot } from "@/lib/care-events/inspection-snapshot";
import type { Reg44Pack } from "@/lib/care-events/reg44-pack";

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
