// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — REFLECTIVE SUPERVISION ENGINE (pure / deterministic)
//
// The reflective-supervision RECORD (more than tick-box) + a per-staff
// supervision-STATUS rollup: who is current / due-soon / overdue / never
// supervised, wellbeing & confidence flags, outstanding actions, and recurring
// training needs across the team.
//
// SUPPORT, not a verdict on a person: wellbeing/confidence are SUPPORT
// indicators surfaced for a manager to act on — never a diagnosis. AI (where
// used) only suggests reflective PROMPTS; it never writes the supervision
// conclusion.
// ══════════════════════════════════════════════════════════════════════════════

export interface SupervisionAction {
  action: string;
  owner?: string | null;
  due?: string | null;
  done?: boolean;
}

export interface ReflectiveSupervisionRecord {
  id: string;
  staff_id: string;
  staff_name?: string | null;
  supervisor_id: string;
  supervisor_name?: string | null;
  date: string;                    // ISO date of the session
  type: string;                    // "1:1" | "safeguarding" | "group" | "informal"
  emotional_wellbeing: string;
  wellbeing_score: number;         // 1–5 (5 = thriving)
  workload: string;
  safeguarding_concerns: string;
  relationships_with_children: string;
  reflective_practice: string;
  pace_examples: string;
  professional_boundaries: string;
  training_needs: string[];
  confidence_level: number;        // 1–5 (5 = highly confident)
  manager_feedback: string;
  actions: SupervisionAction[];
  follow_up_date: string | null;
  created_at: string;
}

export interface StaffLite {
  id: string;
  name: string;
  role?: string | null;
}

export type SupervisionStatus = "current" | "due_soon" | "overdue" | "never";

export interface StaffSupervisionStatus {
  staff_id: string;
  staff_name: string;
  role: string | null;
  last_date: string | null;
  days_since: number | null;
  next_due: string | null;
  status: SupervisionStatus;
  wellbeing_score: number | null;
  confidence_level: number | null;
  wellbeing_flag: boolean;         // <= 2 — surface for support
  confidence_flag: boolean;        // <= 2
  outstanding_actions: number;
}

export interface SupervisionOverview {
  summary: {
    total_staff: number;
    current: number;
    due_soon: number;
    overdue: number;               // includes "never"
    supervision_rate: number;      // current / total %
    wellbeing_concerns: number;
    confidence_concerns: number;
    outstanding_actions: number;
  };
  by_staff: StaffSupervisionStatus[];
  recurring_training_needs: { need: string; count: number }[];
  headline: string;
}

function iso(d: string | null | undefined): string | null {
  if (!d) return null;
  const s = String(d).trim();
  return s ? s.slice(0, 10) : null;
}
function dayDiff(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(ay, (am || 1) - 1, ad || 1) - Date.UTC(by, (bm || 1) - 1, bd || 1)) / 86_400_000);
}
function addDays(d: string, n: number): string {
  const [y, m, dd] = d.split("-").map(Number);
  const t = new Date(Date.UTC(y, (m || 1) - 1, dd || 1));
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}

const STATUS_RANK: Record<SupervisionStatus, number> = { never: 0, overdue: 1, due_soon: 2, current: 3 };

export function computeSupervisionOverview(input: {
  records: ReflectiveSupervisionRecord[];
  staff: StaffLite[];
  today: string;
  interval_days?: number;          // supervision cadence; default 42 (6-weekly)
  due_soon_days?: number;          // default 7
}): SupervisionOverview {
  const today = iso(input.today)!;
  const interval = input.interval_days ?? 42;
  const dueSoon = input.due_soon_days ?? 7;

  // latest record per staff
  const latestByStaff = new Map<string, ReflectiveSupervisionRecord>();
  for (const r of input.records) {
    const d = iso(r.date);
    if (!d) continue;
    const cur = latestByStaff.get(r.staff_id);
    if (!cur || d > iso(cur.date)!) latestByStaff.set(r.staff_id, r);
  }

  const by_staff: StaffSupervisionStatus[] = input.staff.map((s) => {
    const rec = latestByStaff.get(s.id);
    if (!rec) {
      return {
        staff_id: s.id, staff_name: s.name, role: s.role ?? null,
        last_date: null, days_since: null, next_due: null, status: "never",
        wellbeing_score: null, confidence_level: null, wellbeing_flag: false, confidence_flag: false, outstanding_actions: 0,
      };
    }
    const last = iso(rec.date)!;
    const daysSince = dayDiff(today, last);
    const nextDue = addDays(last, interval);
    const toDue = dayDiff(nextDue, today); // <0 overdue, small +ve due soon
    const status: SupervisionStatus = toDue < 0 ? "overdue" : toDue <= dueSoon ? "due_soon" : "current";
    const outstanding = (rec.actions || []).filter((a) => !a.done).length;
    return {
      staff_id: s.id, staff_name: s.name, role: s.role ?? null,
      last_date: last, days_since: daysSince, next_due: nextDue, status,
      wellbeing_score: rec.wellbeing_score ?? null, confidence_level: rec.confidence_level ?? null,
      wellbeing_flag: (rec.wellbeing_score ?? 5) <= 2, confidence_flag: (rec.confidence_level ?? 5) <= 2,
      outstanding_actions: outstanding,
    };
  });

  by_staff.sort((a, b) =>
    STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
    (b.days_since ?? 9999) - (a.days_since ?? 9999) ||
    a.staff_name.localeCompare(b.staff_name));

  const total = by_staff.length;
  const current = by_staff.filter((s) => s.status === "current").length;
  const due_soon = by_staff.filter((s) => s.status === "due_soon").length;
  const overdue = by_staff.filter((s) => s.status === "overdue" || s.status === "never").length;
  const wellbeing_concerns = by_staff.filter((s) => s.wellbeing_flag).length;
  const confidence_concerns = by_staff.filter((s) => s.confidence_flag).length;
  const outstanding_actions = by_staff.reduce((n, s) => n + s.outstanding_actions, 0);

  // recurring training needs across all records
  const needCounts = new Map<string, number>();
  for (const r of input.records) for (const n of r.training_needs || []) {
    const k = n.trim();
    if (k) needCounts.set(k, (needCounts.get(k) ?? 0) + 1);
  }
  const recurring_training_needs = [...needCounts.entries()]
    .map(([need, count]) => ({ need, count }))
    .sort((a, b) => b.count - a.count || a.need.localeCompare(b.need));

  const parts: string[] = [];
  parts.push(`${current}/${total} staff have current supervision`);
  if (overdue > 0) parts.push(`${overdue} overdue`);
  if (wellbeing_concerns > 0) parts.push(`${wellbeing_concerns} wellbeing support indicator${wellbeing_concerns === 1 ? "" : "s"}`);
  if (outstanding_actions > 0) parts.push(`${outstanding_actions} open action${outstanding_actions === 1 ? "" : "s"}`);
  const headline = parts.join(" · ") + ".";

  return {
    summary: {
      total_staff: total, current, due_soon, overdue,
      supervision_rate: total ? Math.round((current / total) * 100) : 0,
      wellbeing_concerns, confidence_concerns, outstanding_actions,
    },
    by_staff,
    recurring_training_needs,
    headline,
  };
}
