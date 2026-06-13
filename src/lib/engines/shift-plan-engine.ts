// ══════════════════════════════════════════════════════════════════════════════
// CARA — Shift Plan engine (pure, deterministic)
//
// A forward-looking, generatable plan for an upcoming shift (day or night):
// who's on, the running order of what's scheduled in the shift window, what
// must get done, the medication picture, and per-child watch-points drawn from
// recent incidents and active missing episodes. Complements (does not replace)
// the live Shift Briefing snapshot. Deterministic — date/period/now injected.
// ══════════════════════════════════════════════════════════════════════════════

export type ShiftPeriod = "day" | "night";

export interface ShiftPlanStaffInput {
  staff_name: string;
  role?: string | null;
  shift_type?: string | null;
}
export interface ShiftPlanStaffingInput {
  on_shift_count: number;
  minimum_required: number;
  shortfall: number;
  is_understaffed: boolean;
  has_waking_night: boolean;
  no_night_cover: boolean;
  severity: "ok" | "high" | "critical";
  alerts: { type: string; severity: string; message: string }[];
}
export interface ShiftPlanEventInput {
  id: string;
  start: string; // ISO datetime
  title: string;
  child_name?: string | null;
  kind: string; // calendar source: appointment | family_time | lac_review | calendar | ...
}
export interface ShiftPlanTaskInput {
  id: string;
  title: string;
  priority: string;
  due_date: string | null;
  status: string;
  child_name?: string | null;
}
export interface ShiftPlanMedInput {
  child_name: string | null;
  name: string;
  frequency: string | null;
  prn: boolean;
}
export interface ShiftPlanChildWatchInput {
  child_name: string;
  flags: string[]; // e.g. "Recent incident: physical intervention", "Currently missing"
}

export interface ShiftPlanInput {
  date: string; // YYYY-MM-DD
  period: ShiftPeriod;
  now: string;
  manager_name?: string;
  onShift: ShiftPlanStaffInput[];
  staffing: ShiftPlanStaffingInput;
  events: ShiftPlanEventInput[];
  tasks: ShiftPlanTaskInput[];
  medications: ShiftPlanMedInput[];
  watch: ShiftPlanChildWatchInput[];
}

export interface ShiftPlanRunItem {
  id: string;
  time: string; // HH:MM
  title: string;
  child_name: string | null;
  kind: string;
}
export interface ShiftPlanMustDo {
  id: string;
  severity: "critical" | "high" | "medium";
  title: string;
  detail: string;
}
export interface ShiftPlanResult {
  generated_for: string;
  date: string;
  period: ShiftPeriod;
  period_label: string;
  window_label: string;
  headline: string;
  staffing: { line: string; severity: "ok" | "high" | "critical"; alerts: string[] };
  on_shift: ShiftPlanStaffInput[];
  running_order: ShiftPlanRunItem[];
  must_do: ShiftPlanMustDo[];
  young_people: ShiftPlanChildWatchInput[];
  settled_count: number;
  medications: { regular_count: number; prn_count: number; summary: string };
  positives: string[];
  counts: { on_shift: number; scheduled: number; must_do: number; watch: number };
  ai_narrative?: string | null;
}

function nextDay(date: string): string {
  const t = Date.parse(`${date}T00:00:00Z`) + 864e5;
  return new Date(t).toISOString().slice(0, 10);
}

export function shiftWindow(date: string, period: ShiftPeriod): { startIso: string; endIso: string; label: string } {
  if (period === "night") {
    return { startIso: `${date}T20:00:00`, endIso: `${nextDay(date)}T08:00:00`, label: "20:00–08:00" };
  }
  return { startIso: `${date}T08:00:00`, endIso: `${date}T20:00:00`, label: "08:00–20:00" };
}

function timeOf(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "--:--";
}

const TASK_SEV: Record<string, "critical" | "high" | "medium"> = { urgent: "critical", high: "high" };
const SEV_RANK = { critical: 0, high: 1, medium: 2 } as const;

export function computeShiftPlan(input: ShiftPlanInput): ShiftPlanResult {
  const win = shiftWindow(input.date, input.period);

  // ── Running order: events that fall inside the shift window ──
  const running_order: ShiftPlanRunItem[] = input.events
    .filter((e) => e.start >= win.startIso && e.start < win.endIso)
    .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0))
    .map((e) => ({ id: e.id, time: timeOf(e.start), title: e.title, child_name: e.child_name ?? null, kind: e.kind }));

  // ── Must-do: overdue + due-today tasks, ranked ──
  const open = input.tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");
  const must_do: ShiftPlanMustDo[] = open
    .filter((t) => t.due_date && t.due_date <= input.date)
    .map((t) => {
      const overdue = (t.due_date as string) < input.date;
      const base = TASK_SEV[t.priority] ?? "medium";
      const severity = overdue && base === "medium" ? "high" : base;
      return {
        id: `task_${t.id}`,
        severity,
        title: `${overdue ? "Overdue" : "Due"}: ${t.title}`,
        detail: `${t.child_name ? `${t.child_name}. ` : ""}${overdue ? `Was due ${t.due_date}.` : "Due today."}`,
      };
    })
    .sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity]);

  // ── Medications picture ──
  const regular = input.medications.filter((m) => !m.prn);
  const prn = input.medications.filter((m) => m.prn);
  const medsSummary =
    input.medications.length === 0
      ? "No active medications recorded."
      : `${regular.length} regular medication${regular.length === 1 ? "" : "s"} to administer and chart this shift${prn.length ? `, ${prn.length} PRN available` : ""}.`;

  // ── Watch: children with flags first ──
  const young_people = input.watch.filter((w) => w.flags.length > 0);
  const settled_count = input.watch.length - young_people.length;

  // ── Staffing line ──
  const staffingAlerts = input.staffing.alerts.map((a) => a.message);
  const staffingLine = input.staffing.is_understaffed
    ? `${input.staffing.on_shift_count} on shift vs ${input.staffing.minimum_required} required — short by ${input.staffing.shortfall}.`
    : `${input.staffing.on_shift_count} on shift (minimum ${input.staffing.minimum_required}).${input.period === "night" ? (input.staffing.has_waking_night ? " Waking night cover in place." : " Check waking-night cover.") : ""}`;

  // ── Headline ──
  const headParts = [
    `${input.onShift.length} on shift`,
    `${running_order.length} scheduled`,
    `${must_do.length} to complete`,
  ];
  if (young_people.length) headParts.push(`${young_people.length} to watch`);
  const headline = headParts.join(" · ");

  // ── Positives ──
  const positives: string[] = [];
  if (!input.staffing.is_understaffed) positives.push("Staffing meets the minimum for this shift");
  if (must_do.length === 0) positives.push("No tasks outstanding for this shift");
  if (young_people.length === 0) positives.push("No active concerns flagged across the young people");
  if (input.period === "night" && input.staffing.has_waking_night) positives.push("Waking-night cover confirmed");

  return {
    generated_for: input.manager_name ?? "Team",
    date: input.date,
    period: input.period,
    period_label: input.period === "night" ? "Night shift" : "Day shift",
    window_label: win.label,
    headline,
    staffing: { line: staffingLine, severity: input.staffing.severity, alerts: staffingAlerts },
    on_shift: input.onShift,
    running_order,
    must_do,
    young_people,
    settled_count,
    medications: { regular_count: regular.length, prn_count: prn.length, summary: medsSummary },
    positives,
    counts: { on_shift: input.onShift.length, scheduled: running_order.length, must_do: must_do.length, watch: young_people.length },
  };
}
