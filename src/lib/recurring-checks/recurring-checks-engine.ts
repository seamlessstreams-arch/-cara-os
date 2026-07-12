// ══════════════════════════════════════════════════════════════════════════════
// CARA — RECURRING-CHECK TEMPLATE ENGINE (Phase 2 · Operational Control · M2)
//
// The audit's second named Operational-Control gap: homes run on recurring
// checks (fire alarm test, medication audit, window-restrictor check, water
// temperature, first-aid kit…) but Cara had no template engine — checks lived
// as ad-hoc tasks someone had to remember to create.
//
// Extend-don't-rebuild: templates are code-defined defaults (the automation
// engine's default-rules pattern), COMPLETIONS ARE TASKS (the existing task
// system — no new collection, no migration), and the periodic materialisation
// runs on the Phase-1 cron endpoint behind the Phase-1 flag registry.
//
// Deterministic core: every template + a date resolves to a stable PERIOD KEY
// (daily → 2026-07-12, weekly → 2026-W28, monthly → 2026-07). A check is DUE
// for a period iff no task carrying its template/period marker exists; the
// cron job creates exactly the missing tasks (idempotent — re-runs create
// nothing new). Completion/overdue state is read straight off the tasks.
// ══════════════════════════════════════════════════════════════════════════════

export type CheckCadence = "daily" | "weekly" | "monthly";

export interface CheckTemplate {
  id: string;
  name: string;
  description: string;
  cadence: CheckCadence;
  /** Task category the materialised task carries. */
  category: string;
  /** Role the task is assigned to. */
  assigned_role: string;
  /** Regulatory anchor shown on the task. */
  regulatory_ref?: string;
  active: boolean;
}

/** Default templates — the standard residential-home compliance rhythm.
 *  Code-defined (like automation default-rules); a later module can add
 *  store-backed custom templates on top. */
export const DEFAULT_CHECK_TEMPLATES: CheckTemplate[] = [
  { id: "chk_fire_alarm", name: "Fire alarm test", description: "Test the fire alarm call points and log the result.", cadence: "weekly", category: "compliance", assigned_role: "team_leader", regulatory_ref: "Reg 25 / RRO 2005", active: true },
  { id: "chk_fire_drill", name: "Fire evacuation drill", description: "Run a full evacuation drill including night-staff awareness.", cadence: "monthly", category: "compliance", assigned_role: "registered_manager", regulatory_ref: "Reg 25", active: true },
  { id: "chk_med_audit", name: "Medication stock audit", description: "Count controlled and standard stock against the MAR; investigate variances.", cadence: "weekly", category: "medication", assigned_role: "registered_manager", regulatory_ref: "Reg 23", active: true },
  { id: "chk_water_temp", name: "Hot water temperature check", description: "Check outlet temperatures in bathrooms and record readings.", cadence: "weekly", category: "compliance", assigned_role: "team_leader", regulatory_ref: "HSG274", active: true },
  { id: "chk_window_restrictors", name: "Window restrictor check", description: "Physically check every window restrictor holds.", cadence: "monthly", category: "compliance", assigned_role: "team_leader", regulatory_ref: "Reg 25", active: true },
  { id: "chk_first_aid", name: "First-aid kit check", description: "Check contents against the list; replace used or expired items.", cadence: "monthly", category: "compliance", assigned_role: "team_leader", active: true },
  { id: "chk_vehicle", name: "Vehicle safety check", description: "Tyres, lights, fluids, seatbelts and cleanliness on the home vehicle.", cadence: "weekly", category: "compliance", assigned_role: "team_leader", active: true },
  { id: "chk_petty_cash", name: "Petty cash reconciliation", description: "Reconcile petty cash and pocket-money floats against receipts.", cadence: "weekly", category: "finance", assigned_role: "registered_manager", active: true },
];

// ── Period keys (deterministic bucketing) ─────────────────────────────────────

function isoWeek(d: Date): { year: number; week: number } {
  // ISO-8601 week number (UTC): Thursday determines the week's year.
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: date.getUTCFullYear(), week };
}

/** The stable period key for a cadence at a moment in time. */
export function periodKey(cadence: CheckCadence, nowIso: string): string {
  const d = new Date(nowIso);
  if (cadence === "daily") return nowIso.slice(0, 10);
  if (cadence === "monthly") return nowIso.slice(0, 7);
  const { year, week } = isoWeek(d);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/** The marker a materialised task carries (in its description) so re-runs are
 *  idempotent and status reads are exact. */
export function checkMarker(templateId: string, period: string): string {
  return `[recurring-check:${templateId}:${period}]`;
}

/** Due date for a period: end of day / ISO week (Sunday) / month. */
export function periodDueDate(cadence: CheckCadence, nowIso: string): string {
  const d = new Date(nowIso);
  if (cadence === "daily") return nowIso.slice(0, 10);
  if (cadence === "weekly") {
    const day = d.getUTCDay() || 7;
    const sunday = new Date(d);
    sunday.setUTCDate(d.getUTCDate() + (7 - day));
    return sunday.toISOString().slice(0, 10);
  }
  const endOfMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
  return endOfMonth.toISOString().slice(0, 10);
}

// ── Materialisation + status (pure over the task list) ───────────────────────

export interface TaskLike {
  id: string;
  title?: string;
  description?: string;
  status?: string;
  due_date?: string | null;
}

export interface DueCheck {
  template: CheckTemplate;
  period: string;
  marker: string;
  due_date: string;
}

/** Which active templates have NO task for the current period — i.e. what the
 *  cron job needs to create right now. Pure + idempotent by construction. */
export function computeMissingChecks(
  templates: readonly CheckTemplate[],
  tasks: readonly TaskLike[],
  nowIso: string,
): DueCheck[] {
  const out: DueCheck[] = [];
  for (const t of templates) {
    if (!t.active) continue;
    const period = periodKey(t.cadence, nowIso);
    const marker = checkMarker(t.id, period);
    const exists = tasks.some((task) => (task.description ?? "").includes(marker));
    if (!exists) {
      out.push({ template: t, period, marker, due_date: periodDueDate(t.cadence, nowIso) });
    }
  }
  return out;
}

export interface CheckStatus {
  template_id: string;
  name: string;
  cadence: CheckCadence;
  period: string;
  status: "done" | "pending" | "not_created";
  task_id?: string;
  due_date: string;
  regulatory_ref?: string;
}

/** The current period's status per active template — the read surface. */
export function computeCheckStatuses(
  templates: readonly CheckTemplate[],
  tasks: readonly TaskLike[],
  nowIso: string,
): CheckStatus[] {
  return templates
    .filter((t) => t.active)
    .map((t) => {
      const period = periodKey(t.cadence, nowIso);
      const marker = checkMarker(t.id, period);
      const task = tasks.find((x) => (x.description ?? "").includes(marker));
      return {
        template_id: t.id,
        name: t.name,
        cadence: t.cadence,
        period,
        status: !task ? "not_created" : task.status === "completed" ? "done" : "pending",
        task_id: task?.id,
        due_date: periodDueDate(t.cadence, nowIso),
        regulatory_ref: t.regulatory_ref,
      };
    });
}
