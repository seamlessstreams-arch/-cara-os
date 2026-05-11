// ══════════════════════════════════════════════════════════════════════════════
// Returned Records Queue  (Milestone 23)
//
// CLAUDE.md spec — when a record is returned: mark returned, record manager
// comments, notify staff, keep draft evidence visible but unverified.
// This module is the live queue surface for those returned records, ordered
// most-overdue first, so staff and managers can see exactly what needs fixing
// and resubmitting.
//
// Returned care events are current-version rows with status === "returned".
// Each row carries `return_reason`, `manager_notes`, `returned_by`,
// `returned_at`, plus the original `staff_id` so we know who must fix it.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import type { CareEvent } from "@/types/care-events";

export type ReturnedAgeBand = "today" | "1_3_days" | "4_7_days" | "over_7_days";

export interface ReturnedRecordRow {
  care_event_id: string;
  home_id: string;
  child_id: string | null;
  title: string;
  category: CareEvent["category"];
  event_date: string;
  staff_id: string | null;
  return_reason: string | null;
  manager_notes: string | null;
  returned_by: string | null;
  returned_at: string | null;
  age_days: number;
  age_band: ReturnedAgeBand;
  is_safeguarding_sensitive: boolean;
}

export interface ReturnedRecordsSummary {
  home_id: string;
  generated_at: string;
  total: number;
  by_band: Record<ReturnedAgeBand, number>;
  by_staff: Record<string, number>;
  safeguarding_sensitive_count: number;
  rows: ReturnedRecordRow[];
}

function ageDays(returnedAt: string | null, nowISO: string): number {
  if (!returnedAt) return 0;
  const a = new Date(returnedAt).getTime();
  const b = new Date(nowISO).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, Math.floor((b - a) / 86400000));
}

function bandFor(days: number): ReturnedAgeBand {
  if (days <= 0) return "today";
  if (days <= 3) return "1_3_days";
  if (days <= 7) return "4_7_days";
  return "over_7_days";
}

function isSensitive(e: CareEvent): boolean {
  return Boolean(
    e.is_safeguarding ||
      e.requires_reg40_triage ||
      e.contributes_to_reg45 ||
      e.contributes_to_annex_a,
  );
}

export function loadReturnedRecordsQueue(homeId: string): ReturnedRecordsSummary {
  const nowISO = new Date().toISOString();
  const events = db.careEvents
    .findCurrent()
    .filter((e) => e.home_id === homeId && e.status === "returned");

  const rows: ReturnedRecordRow[] = events.map((e) => {
    const days = ageDays(e.returned_at, nowISO);
    return {
      care_event_id: e.id,
      home_id: e.home_id,
      child_id: e.child_id,
      title: e.title,
      category: e.category,
      event_date: e.event_date,
      staff_id: e.staff_id,
      return_reason: e.return_reason,
      manager_notes: e.manager_notes,
      returned_by: e.returned_by,
      returned_at: e.returned_at,
      age_days: days,
      age_band: bandFor(days),
      is_safeguarding_sensitive: isSensitive(e),
    };
  });

  // Most overdue first; sensitive records float up within an age band.
  rows.sort((a, b) => {
    if (b.age_days !== a.age_days) return b.age_days - a.age_days;
    if (a.is_safeguarding_sensitive !== b.is_safeguarding_sensitive) {
      return a.is_safeguarding_sensitive ? -1 : 1;
    }
    return 0;
  });

  const by_band: Record<ReturnedAgeBand, number> = {
    today: 0, "1_3_days": 0, "4_7_days": 0, over_7_days: 0,
  };
  const by_staff: Record<string, number> = {};
  let safeguardingSensitiveCount = 0;

  for (const r of rows) {
    by_band[r.age_band] += 1;
    const key = r.staff_id ?? "(unknown)";
    by_staff[key] = (by_staff[key] ?? 0) + 1;
    if (r.is_safeguarding_sensitive) safeguardingSensitiveCount += 1;
  }

  return {
    home_id: homeId,
    generated_at: nowISO,
    total: rows.length,
    by_band,
    by_staff,
    safeguarding_sensitive_count: safeguardingSensitiveCount,
    rows,
  };
}

export function returnedRecordsCount(homeId: string): number {
  return loadReturnedRecordsQueue(homeId).total;
}
