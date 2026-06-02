"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./use-api";

export interface RecordAuditEntry {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  actor_id: string;
  summary: string;
  risk_level: string;
  created_at: string;
  source: string;
  detail?: Record<string, unknown>;
}

interface RecordAuditResponse {
  data: RecordAuditEntry[];
  meta: { total: number; returned: number; sources: { universal: number; incident: number } };
}

/**
 * Reads the record orchestrator audit log (universal + incident orchestrators)
 * from GET /api/v1/audit. This is the live stream of every record created via
 * the universal "Enter Once" entry across all three domains.
 */
export function useRecordAudit(params?: { entityType?: string; actorId?: string; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.entityType) query.set("entity_type", params.entityType);
  if (params?.actorId) query.set("actor_id", params.actorId);
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();

  return useQuery({
    queryKey: ["record-audit", params],
    queryFn: () => api.get<RecordAuditResponse>(`/audit${qs ? `?${qs}` : ""}`),
    refetchInterval: 30_000,
  });
}
