"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD DAILY SUMMARIES & AUDIT TRAIL HOOKS
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { ChildDailySummary, CareEventAuditLog, AuditAction } from "@/types/care-events";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChildDailySummaryEnriched extends ChildDailySummary {
  child: {
    id: string;
    name: string;
    date_of_birth: string;
  } | null;
  care_events: Array<{
    id: string;
    title: string;
    category: string;
    status: string;
    mood_score: number | null;
    is_significant: boolean;
    event_time: string | null;
  }>;
}

export interface DailySummariesMeta {
  total: number;
  children_count: number;
  dates_count: number;
  significant_events: number;
  total_events: number;
  require_followup: number;
}

export interface AuditLogEntryEnriched extends CareEventAuditLog {
  care_event: {
    id: string;
    title: string;
    category: string;
    status: string;
    child_id: string | null;
  } | null;
  actor_staff_name: string | null;
}

export interface AuditLogMeta {
  total: number;
  returned: number;
  action_counts: Record<string, number>;
  unique_events: number;
  unique_actors: number;
}

// ── Child Daily Summaries Hooks ───────────────────────────────────────────────

interface DailySummaryParams {
  child_id?: string;
  date?: string;
  from_date?: string;
  to_date?: string;
}

export function useChildDailySummaries(params?: DailySummaryParams) {
  const qs = new URLSearchParams();
  if (params?.child_id) qs.set("child_id", params.child_id);
  if (params?.date) qs.set("date", params.date);
  if (params?.from_date) qs.set("from_date", params.from_date);
  if (params?.to_date) qs.set("to_date", params.to_date);
  const query = qs.toString() ? `?${qs.toString()}` : "";

  return useQuery<{ summaries: ChildDailySummaryEnriched[]; meta: DailySummariesMeta }>({
    queryKey: ["child-daily-summaries", params],
    queryFn: () => api.get(`/api/v1/child-daily-summaries${query}`),
  });
}

// ── Audit Log Hooks ───────────────────────────────────────────────────────────

interface AuditLogParams {
  care_event_id?: string;
  action?: AuditAction;
  actor_staff_id?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
}

export function useCareEventAuditLog(params?: AuditLogParams) {
  const qs = new URLSearchParams();
  if (params?.care_event_id) qs.set("care_event_id", params.care_event_id);
  if (params?.action) qs.set("action", params.action);
  if (params?.actor_staff_id) qs.set("actor_staff_id", params.actor_staff_id);
  if (params?.from_date) qs.set("from_date", params.from_date);
  if (params?.to_date) qs.set("to_date", params.to_date);
  if (params?.limit) qs.set("limit", String(params.limit));
  const query = qs.toString() ? `?${qs.toString()}` : "";

  return useQuery<{ entries: AuditLogEntryEnriched[]; meta: AuditLogMeta }>({
    queryKey: ["care-event-audit", params],
    queryFn: () => api.get(`/api/v1/care-event-audit${query}`),
  });
}
