import { todayStr } from "@/lib/utils";
// ══════════════════════════════════════════════════════════════════════════════
// CARA — COMPLAINTS CLOCK ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
//
// Children's homes must acknowledge and respond to complaints within statutory
// timescales (CHR 2015 Reg 39 / the home's complaints policy). A missed deadline
// is a compliance failure Ofsted will find. The existing complaints engine only
// reports an AGGREGATE rate; this gives an operational, per-complaint COUNTDOWN to
// each statutory deadline with breach / at-risk flags — so a clock is never missed.
//
// The route passes pre-computed `acknowledgement_due` / `response_due` dates
// (already working-day-adjusted), so this engine compares against `today` directly.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input ─────────────────────────────────────────────────────────────────────

export interface ComplaintInput {
  id: string;
  reference: string;
  child_id?: string | null;
  child_name?: string;
  complainant: string;
  category?: string;
  summary: string;
  stage?: string;            // e.g. "stage_1" | "stage_2"
  status_raw: string;        // raw source status
  assigned_to?: string;      // resolved staff name
  date_received: string;     // ISO
  acknowledgement_due: string; // ISO (received + ~3 working days)
  response_due: string;        // ISO (received + ~10 working days)
  acknowledged_at?: string | null;
  response_sent_at?: string | null;
  is_closed: boolean;        // derived in the route from status
}

export interface ComplaintsClockInput {
  complaints: ComplaintInput[];
  due_soon_days?: number;    // window for "at risk" (default 3)
  today?: string;
}

// ── Output ────────────────────────────────────────────────────────────────────

export type StageStatus = "met" | "met_late" | "overdue" | "due_soon" | "pending";
export type ClockUrgency = "breached" | "due_soon" | "on_track" | "resolved";

export interface StageClock {
  done: boolean;
  met: boolean | null;       // null while still pending
  due_in_days: number;       // negative = past due
  status: StageStatus;
}

export interface ComplaintClock extends ComplaintInput {
  acknowledgement: StageClock;
  response: StageClock;
  active_stage: "acknowledgement" | "response" | "none";
  urgency: ClockUrgency;
  next_due_in_days: number | null;  // days to the active deadline (negative = overdue)
}

export interface ComplaintsClockSummary {
  total: number;
  open: number;
  closed: number;
  breached: number;          // open complaints currently past a deadline
  due_soon: number;          // open complaints whose next deadline is within the window
  on_track: number;
  ack_compliance_rate: number;     // % acknowledged on time, of those acknowledged
  response_compliance_rate: number; // % responded on time, of those responded
}

export interface ComplaintsClockResult {
  summary: ComplaintsClockSummary;
  complaints: ComplaintClock[];  // OPEN first (breached→due_soon→on_track), then closed
  headline: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysBetween(fromISO: string, toISO: string): number {
  return Math.round((new Date(toISO).getTime() - new Date(fromISO).getTime()) / 86_400_000);
}

function stageClock(
  doneAt: string | null | undefined,
  dueISO: string,
  today: string,
  dueSoon: number,
): StageClock {
  const due_in_days = daysBetween(today, dueISO);
  if (doneAt) {
    return { done: true, met: daysBetween(doneAt, dueISO) >= 0, due_in_days, status: daysBetween(doneAt, dueISO) >= 0 ? "met" : "met_late" };
  }
  let status: StageStatus;
  if (due_in_days < 0) status = "overdue";
  else if (due_in_days <= dueSoon) status = "due_soon";
  else status = "pending";
  return { done: false, met: null, due_in_days, status };
}

const URGENCY_ORDER: Record<ClockUrgency, number> = { breached: 0, due_soon: 1, on_track: 2, resolved: 3 };

// ── Main computation ──────────────────────────────────────────────────────────

export function computeComplaintsClock(input: ComplaintsClockInput): ComplaintsClockResult {
  const today = input.today ?? todayStr();
  const dueSoon = input.due_soon_days ?? 3;

  const clocks: ComplaintClock[] = input.complaints.map((c) => {
    const acknowledgement = stageClock(c.acknowledged_at, c.acknowledgement_due, today, dueSoon);
    const response = stageClock(c.response_sent_at, c.response_due, today, dueSoon);

    // Active stage = the next still-pending deadline (ack first, then response).
    let active_stage: ComplaintClock["active_stage"] = "none";
    let next_due_in_days: number | null = null;
    if (!c.is_closed) {
      if (!acknowledgement.done) { active_stage = "acknowledgement"; next_due_in_days = acknowledgement.due_in_days; }
      else if (!response.done) { active_stage = "response"; next_due_in_days = response.due_in_days; }
    }

    let urgency: ClockUrgency;
    if (c.is_closed) urgency = "resolved";
    else if ((!acknowledgement.done && acknowledgement.status === "overdue") || (!response.done && response.status === "overdue")) urgency = "breached";
    else if (next_due_in_days != null && next_due_in_days <= dueSoon) urgency = "due_soon";
    else urgency = "on_track";

    return { ...c, acknowledgement, response, active_stage, urgency, next_due_in_days };
  });

  // Rank: open first by urgency (breached→due_soon→on_track), most-overdue first; then resolved.
  const ranked = [...clocks].sort((a, b) => {
    const u = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
    if (u !== 0) return u;
    const ad = a.next_due_in_days ?? Number.POSITIVE_INFINITY;
    const bd = b.next_due_in_days ?? Number.POSITIVE_INFINITY;
    return ad - bd;
  });

  const open = clocks.filter((c) => !c.is_closed);
  const acknowledged = clocks.filter((c) => c.acknowledgement.done);
  const responded = clocks.filter((c) => c.response.done);

  const summary: ComplaintsClockSummary = {
    total: clocks.length,
    open: open.length,
    closed: clocks.length - open.length,
    breached: clocks.filter((c) => c.urgency === "breached").length,
    due_soon: clocks.filter((c) => c.urgency === "due_soon").length,
    on_track: clocks.filter((c) => c.urgency === "on_track").length,
    ack_compliance_rate: acknowledged.length === 0 ? 0 : Math.round((acknowledged.filter((c) => c.acknowledgement.met).length / acknowledged.length) * 100),
    response_compliance_rate: responded.length === 0 ? 0 : Math.round((responded.filter((c) => c.response.met).length / responded.length) * 100),
  };

  return { summary, complaints: ranked, headline: buildHeadline(summary) };
}

function buildHeadline(s: ComplaintsClockSummary): string {
  if (s.total === 0) return "No complaints recorded — nothing on the clock.";
  if (s.open === 0) return `All ${s.total} complaints resolved. ${s.response_compliance_rate}% were responded to within timescale.`;
  const parts: string[] = [`${s.open} open complaint${s.open === 1 ? "" : "s"}`];
  if (s.breached > 0) parts.push(`${s.breached} past deadline`);
  if (s.due_soon > 0) parts.push(`${s.due_soon} due within 3 days`);
  return `${parts.join(" — ")}. ${s.response_compliance_rate}% of closed complaints met the response timescale.`;
}
