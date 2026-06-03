// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CONFLICT DETECTION INPUT MAPPER
//
// Builds the conflict engine's input from the store: the canonical event stream
// (the spine, "capture once") PLUS the two time intervals the projection
// intentionally summarises away — a missing episode's return time and a leave
// request's span. The rules that test "X happened inside interval Y" need those
// precise bounds, so we read them from the SAME store the spine is built from.
// Pure mapping; no side effects.
// ══════════════════════════════════════════════════════════════════════════════

import { buildEventStream } from "@/lib/event-stream/event-projector";
import { mapStoreToEventInput } from "@/lib/event-stream/store-mapper";
import type { CornerstoneEvent } from "@/types/cornerstone-event";
import type {
  SubjectInterval,
  SubjectRef,
  ConflictSeverity,
} from "./conflict-detection-engine";

function toIso(date: unknown, time?: unknown): string {
  const d = (date == null ? "" : date.toString()).slice(0, 10) || "1970-01-01";
  const t = (time == null ? "00:00" : time.toString()).slice(0, 5);
  const tt = /^\d{2}:\d{2}$/.test(t) ? t : "00:00";
  return `${d}T${tt}:00.000Z`;
}

const MISSING_RISK: Record<string, ConflictSeverity> = {
  low: "low", medium: "medium", high: "high", critical: "critical",
};

const EXCLUDED_LEAVE = /reject|cancel|declin|withdraw/i;

export interface ConflictMapperOutput {
  events: CornerstoneEvent[];
  intervals: SubjectInterval[];
  children: SubjectRef[];
  staff: SubjectRef[];
}

export function mapStoreToConflictInput(store: any): ConflictMapperOutput {
  const events = buildEventStream(mapStoreToEventInput(store)).events;

  const intervals: SubjectInterval[] = [];

  // Missing episodes → child intervals [missing → returned] (open if still active).
  for (const m of (store.missingEpisodes ?? []) as any[]) {
    if (!m?.child_id || !m?.date_missing) continue;
    const risk = MISSING_RISK[m.risk_level] ?? "high";
    intervals.push({
      kind: "missing",
      subject_kind: "child",
      subject_id: m.child_id,
      start: toIso(m.date_missing, m.time_missing),
      end: m.date_returned ? toIso(m.date_returned, m.time_returned) : null,
      label: `${m.risk_level ?? "high"}-risk missing episode${m.reference ? ` ${m.reference}` : ""}`,
      source_event_id: `evt_mis_${m.id}`,
      risk_level: risk,
    });
  }

  // Leave requests → staff intervals [start → end] (open if no end recorded).
  for (const l of (store.leaveRequests ?? []) as any[]) {
    if (!l?.staff_id || !l?.start_date) continue;
    if (EXCLUDED_LEAVE.test((l.status ?? "").toString())) continue;
    intervals.push({
      kind: "leave",
      subject_kind: "staff",
      subject_id: l.staff_id,
      start: toIso(l.start_date, "00:00"),
      end: l.end_date ? toIso(l.end_date, "23:59") : null,
      label: `${(l.leave_type ?? "leave").toString().replace(/_/g, " ")} leave`,
      source_event_id: `evt_abs_${l.id}`,
      risk_level: "low",
    });
  }

  const children: SubjectRef[] = ((store.youngPeople ?? []) as any[]).map((yp: any) => ({
    id: yp.id,
    first_name: yp.first_name ?? "",
    last_name: yp.last_name ?? "",
    preferred_name: yp.preferred_name ?? null,
  }));

  const staff: SubjectRef[] = ((store.staff ?? []) as any[]).map((s: any) => ({
    id: s.id,
    first_name: s.first_name ?? "",
    last_name: s.last_name ?? "",
    preferred_name: s.preferred_name ?? null,
  }));

  return { events, intervals, children, staff };
}
