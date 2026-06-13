// ══════════════════════════════════════════════════════════════════════════════
// CARA — Manager "Plan My Day" engine (pure, deterministic)
//
// Pulls a manager's day together from what's already captured: today's fixed
// calendar commitments, plus ranked flexible actions drawn from concerns
// (incidents awaiting oversight), overdue/today tasks, overdue supervisions,
// training expiry, and children overdue a key-working session. Deterministic —
// `today`/`now` are injected — so it's unit-testable and works with no AI key.
// A route may attach an optional AI narrative on top; the plan stands alone.
// ══════════════════════════════════════════════════════════════════════════════

import { buildDaySchedule, type ScheduleBlock } from "./day-schedule";

export type PlanSeverity = "critical" | "high" | "medium" | "low";
export type PlanCategory = "safeguarding" | "staff" | "records" | "tasks" | "keywork" | "health";

export interface PlanDayCalendarInput {
  id: string;
  title: string;
  start: string;
  all_day: boolean;
  source: string;
  child_name?: string | null;
  location?: string | null;
  href: string;
}
export interface PlanDayTaskInput {
  id: string;
  title: string;
  due_date: string | null;
  status: string;
  priority: string;
  child_name?: string | null;
}
export interface PlanDayIncidentInput {
  id: string;
  child_name?: string | null;
  type: string;
  severity: string;
  date: string;
  requires_oversight: boolean;
  oversight_at: string | null;
  status: string;
}
export interface PlanDaySupervisionInput {
  staff_name?: string | null;
  scheduled_date: string;
  status: string;
}
export interface PlanDayTrainingInput {
  staff_name?: string | null;
  course_name: string;
  expiry_date: string | null;
  status: string;
}
export interface PlanDayKeyworkGapInput {
  child_name: string;
  last_session_date: string | null;
  days_since: number | null;
}

export interface PlanMyDayInput {
  today: string; // YYYY-MM-DD
  now: string; // ISO datetime
  manager_name?: string;
  calendar: PlanDayCalendarInput[];
  tasks: PlanDayTaskInput[];
  incidents: PlanDayIncidentInput[];
  supervisions: PlanDaySupervisionInput[];
  training: PlanDayTrainingInput[];
  keyworkGaps: PlanDayKeyworkGapInput[];
  /** Days without a key-working session before it counts as overdue. */
  keyworkOverdueDays?: number;
  /** Working-day window for the timed schedule (defaults 09:00–17:00). */
  dayStart?: string;
  dayEnd?: string;
  /** Floor the schedule at this HH:MM (e.g. "now" when planning mid-day). */
  scheduleFrom?: string | null;
}

export interface PlanFixedItem {
  id: string;
  time: string | null; // HH:MM, null for all-day
  all_day: boolean;
  title: string;
  subtitle: string | null;
  href: string;
}
export interface PlanActionItem {
  id: string;
  severity: PlanSeverity;
  category: PlanCategory;
  title: string;
  detail: string;
  href: string;
  due: string | null;
  /** Estimated time to action, used by the day scheduler. */
  duration_min: number;
}
export interface ManagerPlanDayResult {
  generated_for: string;
  date: string;
  headline: string;
  fixed: PlanFixedItem[];
  priorities: PlanActionItem[];
  watch: PlanActionItem[];
  /** The timed running order for the day (anchors + lunch + filled priorities). */
  schedule: ScheduleBlock[];
  /** Priorities that did not fit into the working day. */
  carry_over: PlanActionItem[];
  day_window: { start: string; end: string };
  counts: {
    fixed: number;
    priorities: number;
    concerns: number;
    overdue_tasks: number;
    by_category: { category: PlanCategory; count: number }[];
  };
  positives: string[];
  ai_narrative?: string | null;
}

const SEVERITY_RANK: Record<PlanSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function timeOf(iso: string): string | null {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : null;
}

function taskSeverity(priority: string): PlanSeverity {
  if (priority === "urgent") return "critical";
  if (priority === "high") return "high";
  if (priority === "low") return "low";
  return "medium";
}

function incidentSeverity(sev: string, type: string): PlanSeverity {
  const safeguarding = /safeguard|abuse|exploitation|self_harm|missing/i.test(type);
  if (sev === "critical" || (safeguarding && sev === "high")) return "critical";
  if (sev === "high" || safeguarding) return "high";
  return "medium";
}

// ── Builders for each source ───────────────────────────────────────────────────

function buildFixed(items: PlanDayCalendarInput[]): PlanFixedItem[] {
  return [...items]
    .sort((a, b) => {
      if (a.all_day !== b.all_day) return a.all_day ? 1 : -1; // timed first, all-day last
      return a.start < b.start ? -1 : a.start > b.start ? 1 : 0;
    })
    .map((c) => ({
      id: c.id,
      time: c.all_day ? null : timeOf(c.start),
      all_day: c.all_day,
      title: c.title,
      subtitle: [c.child_name, c.location].filter(Boolean).join(" · ") || null,
      href: c.href,
    }));
}

function buildIncidentActions(incidents: PlanDayIncidentInput[]): PlanActionItem[] {
  return incidents
    .filter((i) => i.requires_oversight && !i.oversight_at && i.status !== "closed")
    .map((i) => ({
      id: `inc_${i.id}`,
      severity: incidentSeverity(i.severity, i.type),
      category: "safeguarding" as const,
      title: `Oversight needed: ${i.type.replace(/_/g, " ")}${i.child_name ? ` — ${i.child_name}` : ""}`,
      detail: "Incident is awaiting your management oversight and sign-off.",
      href: "/incidents",
      due: i.date,
      duration_min: 30,
    }));
}

function buildTaskActions(tasks: PlanDayTaskInput[], today: string): { priorities: PlanActionItem[]; watch: PlanActionItem[]; overdueCount: number } {
  const open = tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");
  const overdue = open.filter((t) => t.due_date && t.due_date < today);
  const dueToday = open.filter((t) => t.due_date === today);

  const priorities: PlanActionItem[] = overdue.map((t) => ({
    id: `task_${t.id}`,
    severity: taskSeverity(t.priority) === "low" ? "medium" : taskSeverity(t.priority), // overdue lifts low→medium
    category: "tasks" as const,
    title: `Overdue: ${t.title}`,
    detail: `${t.child_name ? `${t.child_name}. ` : ""}Due ${t.due_date}.`,
    href: "/tasks",
    due: t.due_date,
    duration_min: 30,
  }));

  const watch: PlanActionItem[] = dueToday.map((t) => ({
    id: `taskd_${t.id}`,
    severity: taskSeverity(t.priority),
    category: "tasks" as const,
    title: `Due today: ${t.title}`,
    detail: t.child_name ? `${t.child_name}.` : "Due by end of day.",
    href: "/tasks",
    due: t.due_date,
    duration_min: 30,
  }));

  return { priorities, watch, overdueCount: overdue.length };
}

function buildSupervisionActions(sups: PlanDaySupervisionInput[], today: string): PlanActionItem[] {
  return sups
    .filter((s) => (s.status === "scheduled" || s.status === "rescheduled") && s.scheduled_date < today)
    .map((s, i) => ({
      id: `sup_${i}_${s.scheduled_date}`,
      severity: "high" as const,
      category: "staff" as const,
      title: `Supervision overdue${s.staff_name ? ` — ${s.staff_name}` : ""}`,
      detail: `Scheduled ${s.scheduled_date} and not yet completed.`,
      href: "/supervisions",
      due: s.scheduled_date,
      duration_min: 45,
    }));
}

function buildTrainingActions(training: PlanDayTrainingInput[], today: string): { priorities: PlanActionItem[]; watch: PlanActionItem[] } {
  const within = (days: number, expiry: string) => {
    const e = Date.parse(`${expiry}T00:00:00`);
    const t = Date.parse(`${today}T00:00:00`);
    return e - t <= days * 864e5;
  };
  const priorities: PlanActionItem[] = [];
  const watch: PlanActionItem[] = [];
  for (const tr of training) {
    if (!tr.expiry_date) continue;
    const expired = tr.expiry_date < today;
    const soon = !expired && within(7, tr.expiry_date);
    const month = !expired && !soon && within(30, tr.expiry_date);
    if (expired || soon) {
      priorities.push({
        id: `trn_${tr.course_name}_${tr.staff_name ?? ""}`,
        severity: expired ? "high" : "medium",
        category: "staff",
        title: `${expired ? "Training expired" : "Training expiring"}: ${tr.course_name}${tr.staff_name ? ` (${tr.staff_name})` : ""}`,
        detail: expired ? `Expired ${tr.expiry_date} — arrange renewal.` : `Expires ${tr.expiry_date}.`,
        href: "/training",
        due: tr.expiry_date,
        duration_min: 15,
      });
    } else if (month) {
      watch.push({
        id: `trnm_${tr.course_name}_${tr.staff_name ?? ""}`,
        severity: "low",
        category: "staff",
        title: `Training expiring this month: ${tr.course_name}${tr.staff_name ? ` (${tr.staff_name})` : ""}`,
        detail: `Expires ${tr.expiry_date}.`,
        href: "/training",
        due: tr.expiry_date,
        duration_min: 15,
      });
    }
  }
  return { priorities, watch };
}

function buildKeyworkActions(gaps: PlanDayKeyworkGapInput[], overdueDays: number): PlanActionItem[] {
  return gaps
    .filter((g) => g.days_since == null || g.days_since >= overdueDays)
    .map((g) => ({
      id: `kw_${g.child_name}`,
      severity: "medium" as const,
      category: "keywork" as const,
      title: `Key-working due — ${g.child_name}`,
      detail: g.last_session_date ? `Last session ${g.last_session_date} (${g.days_since}d ago).` : "No key-working session recorded yet.",
      href: "/child-keyworker-1to1-sessions",
      due: null,
      duration_min: 20,
    }));
}

// ── Main ─────────────────────────────────────────────────────────────────────

export function computeManagerPlanDay(input: PlanMyDayInput): ManagerPlanDayResult {
  const overdueDays = input.keyworkOverdueDays ?? 14;

  const fixed = buildFixed(input.calendar);
  const incidentActions = buildIncidentActions(input.incidents);
  const { priorities: taskPri, watch: taskWatch, overdueCount } = buildTaskActions(input.tasks, input.today);
  const supActions = buildSupervisionActions(input.supervisions, input.today);
  const { priorities: trnPri, watch: trnWatch } = buildTrainingActions(input.training, input.today);
  const kwActions = buildKeyworkActions(input.keyworkGaps, overdueDays);

  let priorities = [...incidentActions, ...taskPri, ...supActions, ...trnPri, ...kwActions];
  priorities.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
  priorities = priorities.slice(0, 25);

  const watch = [...taskWatch, ...trnWatch].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);

  const concerns = incidentActions.length;
  const catMap = new Map<PlanCategory, number>();
  for (const p of priorities) catMap.set(p.category, (catMap.get(p.category) ?? 0) + 1);

  // ── Headline ──
  const parts: string[] = [];
  parts.push(`${fixed.length} fixed commitment${fixed.length === 1 ? "" : "s"}`);
  parts.push(`${priorities.length} priorit${priorities.length === 1 ? "y" : "ies"}`);
  if (concerns > 0) parts.push(`${concerns} concern${concerns === 1 ? "" : "s"} to review`);
  const headline = parts.join(" · ");

  // ── Positives ──
  const positives: string[] = [];
  if (concerns === 0) positives.push("No incidents awaiting your oversight");
  if (overdueCount === 0) positives.push("No overdue tasks");
  if (supActions.length === 0) positives.push("All supervisions up to date");
  if (trnPri.length === 0) positives.push("No training expired or expiring this week");
  if (kwActions.length === 0) positives.push("Key-working is up to date across the home");

  // ── Timed running order ──
  const schedule = buildDaySchedule<PlanActionItem>({
    dayStart: input.dayStart,
    dayEnd: input.dayEnd,
    startFrom: input.scheduleFrom ?? null,
    anchors: fixed
      .filter((f) => !f.all_day && f.time)
      .map((f) => ({ time: f.time as string, duration_min: 60, title: f.title, subtitle: f.subtitle, href: f.href })),
    actions: priorities,
  });

  return {
    generated_for: input.manager_name ?? "Manager",
    date: input.today,
    headline,
    fixed,
    priorities,
    watch,
    schedule: schedule.blocks,
    carry_over: schedule.carry_over,
    day_window: schedule.window,
    counts: {
      fixed: fixed.length,
      priorities: priorities.length,
      concerns,
      overdue_tasks: overdueCount,
      by_category: [...catMap.entries()].map(([category, count]) => ({ category, count })),
    },
    positives,
  };
}
