// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — UNIFIED ACTIONS REGISTER ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
//
// An RM's most constant question is "what did we agree to do, and is it done?".
// Agreed actions are scattered across LAC reviews, supervisions, team & house
// meetings, incident oversight / lessons-learned, complaint outcomes, medication-
// error investigations and RI governance reports. This engine threads them into
// ONE register with owner, due-date, source and an overdue flag — so nothing
// agreed quietly slips. Ofsted explicitly tests whether actions from reviews and
// Reg 44 visits are followed through (SCCIF — leadership & management).
//
// The route normalises each source into ActionInput; this engine ranks, rolls up
// and summarises. It never invents completion — `done` comes from the source.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input ─────────────────────────────────────────────────────────────────────

export interface ActionInput {
  id: string;
  text: string;
  source: string;            // human label, e.g. "Supervision", "LAC review"
  source_key: string;        // stable key for grouping, e.g. "supervision"
  source_href?: string;      // deep link to the source page
  owner?: string;            // resolved staff name (or "Unassigned")
  child_id?: string;
  child_name?: string;
  due_date?: string;         // ISO YYYY-MM-DD
  status_raw?: string;       // raw status string from the source (for display)
  done: boolean;             // normalised completion — from the source, never inferred
}

export interface ActionsRegisterInput {
  actions: ActionInput[];
  due_soon_days?: number;    // window for "due soon" (default 7)
  today?: string;            // ISO — injectable for deterministic tests
}

// ── Output ────────────────────────────────────────────────────────────────────

export type ActionUrgency = "overdue" | "due_soon" | "scheduled" | "no_date" | "done";

export interface RegisteredAction extends ActionInput {
  urgency: ActionUrgency;
  days_to_due: number | null;   // negative = overdue; null = no due date / done
}

export interface OwnerRollup { owner: string; open: number; overdue: number }
export interface SourceRollup { source: string; source_key: string; open: number; overdue: number }

export interface ActionsRegisterSummary {
  total: number;
  open: number;
  done: number;
  overdue: number;
  due_soon: number;
  no_date: number;
  completion_rate: number;     // done / total, 0 when empty
}

export interface ActionsRegisterResult {
  summary: ActionsRegisterSummary;
  by_owner: OwnerRollup[];     // ranked by overdue desc, then open desc
  by_source: SourceRollup[];   // ranked by overdue desc, then open desc
  actions: RegisteredAction[]; // OPEN actions only, ranked overdue→due_soon→scheduled→no_date
  headline: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysBetween(fromISO: string, toISO: string): number {
  return Math.round((new Date(toISO).getTime() - new Date(fromISO).getTime()) / 86_400_000);
}

const URGENCY_ORDER: Record<ActionUrgency, number> = {
  overdue: 0, due_soon: 1, scheduled: 2, no_date: 3, done: 4,
};

// ── Main computation ──────────────────────────────────────────────────────────

export function computeActionsRegister(input: ActionsRegisterInput): ActionsRegisterResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const dueSoon = input.due_soon_days ?? 7;

  const classified: RegisteredAction[] = input.actions.map((a) => {
    if (a.done) return { ...a, urgency: "done", days_to_due: null };
    if (!a.due_date) return { ...a, urgency: "no_date", days_to_due: null };
    const d = daysBetween(today, a.due_date); // negative if past
    let urgency: ActionUrgency;
    if (d < 0) urgency = "overdue";
    else if (d <= dueSoon) urgency = "due_soon";
    else urgency = "scheduled";
    return { ...a, urgency, days_to_due: d };
  });

  const open = classified.filter((a) => !a.done);
  const overdue = open.filter((a) => a.urgency === "overdue");
  const dueSoonList = open.filter((a) => a.urgency === "due_soon");
  const noDate = open.filter((a) => a.urgency === "no_date");
  const doneCount = classified.length - open.length;

  // Rank the open list: overdue (most overdue first) → due_soon → scheduled (soonest) → no_date.
  const ranked = [...open].sort((a, b) => {
    const u = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
    if (u !== 0) return u;
    // within the same urgency, sort by due date ascending (soonest / most overdue first)
    const ad = a.days_to_due ?? Number.POSITIVE_INFINITY;
    const bd = b.days_to_due ?? Number.POSITIVE_INFINITY;
    return ad - bd;
  });

  // Owner rollup (open actions).
  const ownerMap = new Map<string, OwnerRollup>();
  for (const a of open) {
    const owner = a.owner && a.owner.trim() ? a.owner : "Unassigned";
    const r = ownerMap.get(owner) ?? { owner, open: 0, overdue: 0 };
    r.open += 1;
    if (a.urgency === "overdue") r.overdue += 1;
    ownerMap.set(owner, r);
  }
  const by_owner = [...ownerMap.values()].sort((a, b) => b.overdue - a.overdue || b.open - a.open || a.owner.localeCompare(b.owner));

  // Source rollup (open actions).
  const sourceMap = new Map<string, SourceRollup>();
  for (const a of open) {
    const r = sourceMap.get(a.source_key) ?? { source: a.source, source_key: a.source_key, open: 0, overdue: 0 };
    r.open += 1;
    if (a.urgency === "overdue") r.overdue += 1;
    sourceMap.set(a.source_key, r);
  }
  const by_source = [...sourceMap.values()].sort((a, b) => b.overdue - a.overdue || b.open - a.open || a.source.localeCompare(b.source));

  const summary: ActionsRegisterSummary = {
    total: classified.length,
    open: open.length,
    done: doneCount,
    overdue: overdue.length,
    due_soon: dueSoonList.length,
    no_date: noDate.length,
    completion_rate: classified.length === 0 ? 0 : Math.round((doneCount / classified.length) * 100),
  };

  return { summary, by_owner, by_source, actions: ranked, headline: buildHeadline(summary) };
}

function buildHeadline(s: ActionsRegisterSummary): string {
  if (s.total === 0) return "No agreed actions recorded yet across reviews, supervisions, meetings and oversight.";
  if (s.open === 0) return `All ${s.total} agreed actions are complete — nothing outstanding across the home.`;
  const parts: string[] = [`${s.open} open action${s.open === 1 ? "" : "s"}`];
  if (s.overdue > 0) parts.push(`${s.overdue} overdue`);
  if (s.due_soon > 0) parts.push(`${s.due_soon} due this week`);
  return `${parts.join(" — ")}. ${s.completion_rate}% of all agreed actions completed.`;
}
