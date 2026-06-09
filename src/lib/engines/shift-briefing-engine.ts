// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SHIFT BRIEFING ENGINE (pure / deterministic)
//
// An auto-generated, TIME-BOXED operational snapshot for staff coming on duty:
//   • who is on duty now + who's coming up
//   • tasks due today / overdue
//   • statutory plan reviews due now / soon
//   • active medications to administer
//   • overnight & recent significant events / open incidents
//   • an "attention" rollup of the genuinely must-not-miss items
//
// This is NOT the severity-ranked Priority Briefing (manager attention feed) and
// NOT the written Handover (free-text shift-to-shift notes). It's the data-driven
// "what must happen on THIS shift" board that complements both.
//
// Pure: every date decision is made against an injected `today` ⇒ deterministic
// tests, no wall-clock reads inside the engine.
// ══════════════════════════════════════════════════════════════════════════════

export interface OnDutyInput {
  staff_id: string;
  staff_name: string;
  shift_type: string;          // "day" | "sleep_in" | "waking_night" | "night" | ...
  start_time?: string | null;
  end_time?: string | null;
  status: string;              // "in_progress" | "scheduled" | "completed" | ...
  is_open_shift?: boolean;
  notes?: string | null;
}

export interface TaskInput {
  id: string;
  title: string;
  due_date?: string | null;
  status?: string | null;
  priority?: string | null;
  assigned_name?: string | null;
  child_name?: string | null;
}

export interface ReviewInput {
  id: string;
  plan_type: string;
  child_id: string;
  child_name?: string | null;
  review_date?: string | null;
}

export interface MedInput {
  id: string;
  child_id: string;
  child_name?: string | null;
  name: string;
  dosage?: string | null;
  frequency?: string | null;
  prn?: boolean;
}

export interface EventInput {
  id: string;
  kind: "incident" | "log";
  date: string;
  time?: string | null;
  child_name?: string | null;
  summary: string;
  category?: string | null;     // entry_type / incident type
  severity?: string | null;     // high | medium | low (incidents)
  status?: string | null;       // open | closed (incidents)
  is_significant?: boolean;     // dailyLog significant flag
}

export interface ShiftBriefingInput {
  today: string;
  now_label?: string;           // optional human label for the moment (e.g. "Mon 9 Jun, 13:00")
  on_duty: OnDutyInput[];
  tasks: TaskInput[];
  reviews: ReviewInput[];
  medications: MedInput[];
  events: EventInput[];
  review_horizon_days?: number; // default 7 — "due soon" window for reviews
  recent_days?: number;         // default 3 — incident look-back window
}

export interface OnDutyMember {
  staff_id: string;
  staff_name: string;
  shift_type: string;
  shift_label: string;          // human label e.g. "Day · 08:00–17:00"
  start_time: string | null;
  end_time: string | null;
  is_open_shift: boolean;
  notes: string | null;
}

export interface TaskItem {
  id: string;
  title: string;
  due_date: string | null;
  days_overdue: number;         // >0 when overdue, 0 when due today
  priority: string | null;
  assigned_name: string | null;
  child_name: string | null;
}

export interface ReviewItem {
  id: string;
  plan_type: string;
  child_name: string | null;
  review_date: string;
  days_to_review: number;       // negative = overdue
}

export interface MedItem {
  id: string;
  child_name: string | null;
  name: string;
  dosage: string | null;
  frequency: string | null;
  prn: boolean;
}

export interface EventItem {
  id: string;
  kind: "incident" | "log";
  date: string;
  time: string | null;
  child_name: string | null;
  summary: string;
  category: string | null;
  severity: string | null;
  status: string | null;
  is_significant: boolean;
}

export interface AttentionItem {
  severity: "critical" | "high" | "medium";
  kind: "incident" | "review" | "task";
  label: string;
  detail: string;
  child_name: string | null;
}

export interface ShiftBriefingResult {
  date: string;
  now_label: string | null;
  on_duty: { now: OnDutyMember[]; upcoming: OnDutyMember[]; total: number; gap_warning: string | null };
  tasks: { overdue: TaskItem[]; due_today: TaskItem[]; count: number };
  reviews: { overdue: ReviewItem[]; due_soon: ReviewItem[]; count: number };
  medications: { items: MedItem[]; regular_count: number; prn_count: number; count: number };
  events: { incidents: EventItem[]; significant_log: EventItem[]; recent_log: EventItem[]; open_incident_count: number };
  attention: AttentionItem[];
  summary: { on_duty: number; tasks_due: number; reviews_due: number; open_incidents: number; meds_active: number };
  headline: string;
}

// ── date helpers (pure) ─────────────────────────────────────────────────────────
function iso(d: string | null | undefined): string | null {
  if (!d) return null;
  const s = String(d).trim();
  return s ? s.slice(0, 10) : null;
}
function dayDiff(a: string, b: string): number {
  // whole days a − b
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const ams = Date.UTC(ay, (am || 1) - 1, ad || 1);
  const bms = Date.UTC(by, (bm || 1) - 1, bd || 1);
  return Math.round((ams - bms) / 86_400_000);
}

const CLOSED_TASK = new Set(["completed", "cancelled", "closed", "done"]);

function titleCase(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function shiftLabel(shift_type: string, start?: string | null, end?: string | null): string {
  const t = titleCase(shift_type || "Shift");
  if (start && end) return `${t} · ${start}–${end}`;
  return t;
}

export function computeShiftBriefing(input: ShiftBriefingInput): ShiftBriefingResult {
  const today = iso(input.today)!;
  const horizon = input.review_horizon_days ?? 7;
  const recentDays = input.recent_days ?? 3;

  // ── On duty ──────────────────────────────────────────────────────────────────
  const toMember = (s: OnDutyInput): OnDutyMember => ({
    staff_id: s.staff_id,
    staff_name: s.staff_name,
    shift_type: s.shift_type,
    shift_label: shiftLabel(s.shift_type, s.start_time, s.end_time),
    start_time: s.start_time ?? null,
    end_time: s.end_time ?? null,
    is_open_shift: !!s.is_open_shift,
    notes: s.notes ?? null,
  });
  const active = input.on_duty.filter((s) => String(s.status).toLowerCase() !== "completed");
  const now = active.filter((s) => String(s.status).toLowerCase() === "in_progress").map(toMember);
  const upcoming = active.filter((s) => String(s.status).toLowerCase() !== "in_progress").map(toMember);
  const onDutyTotal = now.length + upcoming.length;
  const gap_warning = now.length === 0
    ? (upcoming.length > 0 ? "No staff clocked on yet — next shift is scheduled but not started." : "No staff on duty recorded for today.")
    : null;

  // ── Tasks ────────────────────────────────────────────────────────────────────
  const overdueTasks: TaskItem[] = [];
  const dueTodayTasks: TaskItem[] = [];
  for (const t of input.tasks) {
    if (CLOSED_TASK.has(String(t.status ?? "").toLowerCase())) continue;
    const due = iso(t.due_date);
    if (!due) continue;
    const diff = dayDiff(due, today); // <0 overdue, 0 today, >0 future
    if (diff > 0) continue;           // future tasks are not "this shift"
    const item: TaskItem = {
      id: t.id,
      title: t.title,
      due_date: due,
      days_overdue: diff < 0 ? -diff : 0,
      priority: t.priority ?? null,
      assigned_name: t.assigned_name ?? null,
      child_name: t.child_name ?? null,
    };
    if (diff < 0) overdueTasks.push(item);
    else dueTodayTasks.push(item);
  }
  overdueTasks.sort((a, b) => b.days_overdue - a.days_overdue || a.title.localeCompare(b.title));
  dueTodayTasks.sort((a, b) => a.title.localeCompare(b.title));

  // ── Reviews ──────────────────────────────────────────────────────────────────
  const overdueReviews: ReviewItem[] = [];
  const dueSoonReviews: ReviewItem[] = [];
  for (const r of input.reviews) {
    const rd = iso(r.review_date);
    if (!rd) continue;
    const diff = dayDiff(rd, today); // <0 overdue
    if (diff > horizon) continue;
    const item: ReviewItem = {
      id: r.id,
      plan_type: r.plan_type,
      child_name: r.child_name ?? null,
      review_date: rd,
      days_to_review: diff,
    };
    if (diff < 0) overdueReviews.push(item);
    else dueSoonReviews.push(item);
  }
  overdueReviews.sort((a, b) => a.days_to_review - b.days_to_review || a.plan_type.localeCompare(b.plan_type));
  dueSoonReviews.sort((a, b) => a.days_to_review - b.days_to_review || a.plan_type.localeCompare(b.plan_type));

  // ── Medications ──────────────────────────────────────────────────────────────
  const meds: MedItem[] = input.medications.map((m) => ({
    id: m.id,
    child_name: m.child_name ?? null,
    name: m.name,
    dosage: m.dosage ?? null,
    frequency: m.frequency ?? null,
    prn: !!m.prn,
  }));
  meds.sort((a, b) => Number(a.prn) - Number(b.prn) || (a.child_name ?? "").localeCompare(b.child_name ?? "") || a.name.localeCompare(b.name));
  const regular_count = meds.filter((m) => !m.prn).length;
  const prn_count = meds.filter((m) => m.prn).length;

  // ── Events (overnight / recent) ──────────────────────────────────────────────
  const toEvent = (e: EventInput): EventItem => ({
    id: e.id,
    kind: e.kind,
    date: iso(e.date)!,
    time: e.time ?? null,
    child_name: e.child_name ?? null,
    summary: e.summary,
    category: e.category ?? null,
    severity: e.severity ?? null,
    status: e.status ?? null,
    is_significant: !!e.is_significant,
  });
  const sevRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const incidents = input.events
    .filter((e) => e.kind === "incident")
    .map(toEvent)
    .filter((e) => {
      const age = dayDiff(today, e.date); // days ago
      return (e.status && e.status.toLowerCase() === "open") || (age >= 0 && age <= recentDays);
    })
    .sort((a, b) => {
      // open before closed, then by severity, then most-recent first
      const ao = a.status?.toLowerCase() === "open" ? 0 : 1;
      const bo = b.status?.toLowerCase() === "open" ? 0 : 1;
      if (ao !== bo) return ao - bo;
      const as = sevRank[String(a.severity).toLowerCase()] ?? 3;
      const bs = sevRank[String(b.severity).toLowerCase()] ?? 3;
      if (as !== bs) return as - bs;
      return b.date.localeCompare(a.date);
    });
  const open_incident_count = incidents.filter((e) => e.status?.toLowerCase() === "open").length;

  const recentLogAll = input.events
    .filter((e) => e.kind === "log")
    .map(toEvent)
    .filter((e) => {
      const age = dayDiff(today, e.date);
      return age >= 0 && age <= 1; // today + overnight
    })
    .sort((a, b) => b.date.localeCompare(a.date) || (b.time ?? "").localeCompare(a.time ?? ""));
  const significant_log = recentLogAll.filter((e) => e.is_significant);
  const recent_log = recentLogAll.slice(0, 8);

  // ── Attention rollup (must-not-miss) ─────────────────────────────────────────
  const attention: AttentionItem[] = [];
  for (const e of incidents) {
    if (e.status?.toLowerCase() === "open") {
      const sev = String(e.severity).toLowerCase() === "high" ? "critical" : "high";
      attention.push({
        severity: sev as AttentionItem["severity"],
        kind: "incident",
        label: `Open incident: ${titleCase(e.category ?? "incident")}`,
        detail: e.summary,
        child_name: e.child_name,
      });
    }
  }
  for (const r of overdueReviews) {
    attention.push({
      severity: "high",
      kind: "review",
      label: `${r.plan_type} review overdue`,
      detail: `${Math.abs(r.days_to_review)} day${Math.abs(r.days_to_review) === 1 ? "" : "s"} overdue`,
      child_name: r.child_name,
    });
  }
  for (const t of overdueTasks) {
    attention.push({
      severity: t.days_overdue >= 7 ? "high" : "medium",
      kind: "task",
      label: `Task overdue: ${t.title}`,
      detail: `${t.days_overdue} day${t.days_overdue === 1 ? "" : "s"} overdue`,
      child_name: t.child_name,
    });
  }
  const sevOrder: Record<AttentionItem["severity"], number> = { critical: 0, high: 1, medium: 2 };
  attention.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);

  // ── Summary + headline ───────────────────────────────────────────────────────
  const tasksDue = overdueTasks.length + dueTodayTasks.length;
  const reviewsDue = overdueReviews.length + dueSoonReviews.length;
  const summary = {
    on_duty: now.length,
    tasks_due: tasksDue,
    reviews_due: reviewsDue,
    open_incidents: open_incident_count,
    meds_active: meds.length,
  };

  const parts: string[] = [];
  parts.push(now.length > 0 ? `${now.length} on duty now` : "No staff clocked on");
  if (tasksDue > 0) parts.push(`${tasksDue} task${tasksDue === 1 ? "" : "s"} due${overdueTasks.length ? ` (${overdueTasks.length} overdue)` : ""}`);
  if (reviewsDue > 0) parts.push(`${reviewsDue} plan review${reviewsDue === 1 ? "" : "s"} due${overdueReviews.length ? ` (${overdueReviews.length} overdue)` : ""}`);
  if (open_incident_count > 0) parts.push(`${open_incident_count} open incident${open_incident_count === 1 ? "" : "s"} to be aware of`);
  if (parts.length === 1) parts.push("nothing outstanding for this shift");
  const headline = parts.join(" · ") + ".";

  return {
    date: today,
    now_label: input.now_label ?? null,
    on_duty: { now, upcoming, total: onDutyTotal, gap_warning },
    tasks: { overdue: overdueTasks, due_today: dueTodayTasks, count: tasksDue },
    reviews: { overdue: overdueReviews, due_soon: dueSoonReviews, count: reviewsDue },
    medications: { items: meds, regular_count, prn_count, count: meds.length },
    events: { incidents, significant_log, recent_log, open_incident_count },
    attention,
    summary,
    headline,
  };
}
