// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF–CHILD CONTINUITY OF CARE INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
//
// Children in care need consistent, trusted adults. This engine measures the
// RELATIONAL continuity of each child's care — distinct from the routine,
// handover and placement continuity engines. Per child it asks:
//   • Is an active key worker assigned?
//   • Is that key worker actually delivering the key-working sessions, or is
//     the child being seen by a rotating cast of staff?
//   • How many different staff, how recent, how regular?
//
// A low continuity index means the child's primary relationship is fragmented —
// a known risk to stability and wellbeing, and an Ofsted focus ("do children
// have consistent adults who know them well?").
//
// Regulatory: CHR 2015 Reg 11 (positive relationships), Reg 12 (protection),
// Reg 6 (quality & purpose of care). SCCIF: relationships and the consistency
// of trusted adults.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ───────────────────────────────────────────────────────────────

export interface ContinuityChildInput {
  id: string;
  name: string;
  key_worker_id: string | null;
  secondary_worker_id: string | null;
}

export interface ContinuityStaffInput {
  id: string;
  name: string;
  active: boolean;
}

export interface ContinuitySessionInput {
  child_id: string;
  staff_id: string;
  date: string;            // ISO date
}

export interface StaffChildContinuityInput {
  children: ContinuityChildInput[];
  staff: ContinuityStaffInput[];
  sessions: ContinuitySessionInput[];
  today?: string;          // ISO date — injectable for deterministic tests
}

// ── Output Types ──────────────────────────────────────────────────────────────

export type ContinuityBand = "strong" | "adequate" | "fragmented" | "critical";

export interface RecommendedAction {
  priority: "urgent" | "high" | "routine";
  action: string;
  regulatory_link: string;
}

export interface ChildContinuity {
  child_id: string;
  child_name: string;
  key_worker_id: string | null;
  key_worker_name: string | null;
  key_worker_active: boolean;
  sessions_90d: number;
  distinct_staff: number;
  key_worker_sessions: number;
  key_worker_share: number;            // % of sessions delivered by the assigned key worker
  days_since_last_session: number | null;
  days_since_last_keyworker_session: number | null;
  continuity_index: number;            // 0-100
  band: ContinuityBand;
  flags: string[];
  recommended_actions: RecommendedAction[];
}

export interface ContinuityOverview {
  children_analysed: number;
  avg_continuity_index: number;
  strong_count: number;
  adequate_count: number;
  fragmented_count: number;            // fragmented + critical
  no_key_worker_count: number;
  inactive_key_worker_count: number;
  weakest_child: string | null;
  weakest_index: number;
}

export interface ContinuityAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  child_id?: string;
}

export interface AriaContinuityInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface StaffChildContinuityResult {
  overview: ContinuityOverview;
  children: ChildContinuity[];
  alerts: ContinuityAlert[];
  insights: AriaContinuityInsight[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const WINDOW_DAYS = 90;

// ── Helpers ─────────────────────────────────────────────────────────────────

export function daysAgo(date: string, today: string): number {
  return Math.floor((new Date(today).getTime() - new Date(date).getTime()) / 86_400_000);
}
function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
export function recencyScore(days: number | null): number {
  if (days == null) return 0;
  if (days <= 14) return 100;
  if (days <= 28) return 70;
  if (days <= 42) return 40;
  return 10;
}
export function concentrationScore(distinct: number): number {
  if (distinct <= 0) return 0;
  if (distinct === 1) return 100;
  if (distinct === 2) return 80;
  if (distinct === 3) return 55;
  if (distinct === 4) return 30;
  return 10;
}
export function frequencyScore(count: number): number {
  if (count >= 6) return 100;
  if (count >= 4) return 80;
  if (count >= 2) return 55;
  if (count === 1) return 30;
  return 0;
}
export function bandOf(index: number): ContinuityBand {
  if (index >= 75) return "strong";
  if (index >= 55) return "adequate";
  if (index >= 35) return "fragmented";
  return "critical";
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeStaffChildContinuity(input: StaffChildContinuityInput): StaffChildContinuityResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const staffById = new Map(input.staff.map((s) => [s.id, s]));

  const children: ChildContinuity[] = input.children.map((child) => {
    const sessions = input.sessions
      .filter((s) => s.child_id === child.id)
      .filter((s) => {
        const d = daysAgo(s.date, today);
        return d >= 0 && d < WINDOW_DAYS;
      });

    const sessions_90d = sessions.length;
    const distinctSet = new Set(sessions.map((s) => s.staff_id));
    const distinct_staff = distinctSet.size;

    const kwId = child.key_worker_id;
    const kwStaff = kwId ? staffById.get(kwId) ?? null : null;
    const key_worker_active = !!kwStaff?.active;
    const kwSessions = kwId ? sessions.filter((s) => s.staff_id === kwId) : [];
    const key_worker_sessions = kwSessions.length;
    const key_worker_share = sessions_90d > 0 ? Math.round((key_worker_sessions / sessions_90d) * 100) : 0;

    const lastSession = sessions
      .map((s) => daysAgo(s.date, today))
      .sort((a, b) => a - b)[0];
    const days_since_last_session = sessions_90d > 0 ? lastSession : null;
    const lastKw = kwSessions
      .map((s) => daysAgo(s.date, today))
      .sort((a, b) => a - b)[0];
    const days_since_last_keyworker_session = key_worker_sessions > 0 ? lastKw : null;

    // Continuity index — weighted blend of key-worker share, recency of the
    // key-worker relationship, concentration of staff, and session frequency.
    let continuity_index = Math.round(
      0.40 * key_worker_share +
      0.25 * recencyScore(days_since_last_keyworker_session) +
      0.20 * concentrationScore(distinct_staff) +
      0.15 * frequencyScore(sessions_90d),
    );

    const flags: string[] = [];
    if (!kwId) {
      flags.push("No key worker assigned");
      continuity_index = Math.min(continuity_index, 35);
    } else if (!key_worker_active) {
      flags.push("Assigned key worker is no longer active (left or inactive)");
      continuity_index = Math.min(continuity_index, 40);
    } else if (sessions_90d > 0 && key_worker_share < 40) {
      flags.push("Assigned key worker is delivering few or none of this child's sessions");
    }
    if (sessions_90d === 0) {
      flags.push("No key-working sessions recorded in 90 days");
    } else if (days_since_last_session != null && days_since_last_session > 28) {
      flags.push(`No key-working session in ${days_since_last_session} days`);
    }
    if (distinct_staff >= 4) {
      flags.push(`Care spread across ${distinct_staff} different staff (fragmented)`);
    }

    continuity_index = clamp(continuity_index, 0, 100);
    const band = bandOf(continuity_index);

    return {
      child_id: child.id,
      child_name: child.name,
      key_worker_id: kwId,
      key_worker_name: kwStaff?.name ?? null,
      key_worker_active,
      sessions_90d,
      distinct_staff,
      key_worker_sessions,
      key_worker_share,
      days_since_last_session,
      days_since_last_keyworker_session,
      continuity_index,
      band,
      flags,
      recommended_actions: buildActions(band, flags, kwId, key_worker_active),
    };
  });

  children.sort((a, b) => a.continuity_index - b.continuity_index); // weakest first

  const overview = buildOverview(children);
  const alerts = buildAlerts(children);
  const insights = buildInsights(children, overview);

  return { overview, children, alerts, insights };
}

// ── Action builder ────────────────────────────────────────────────────────

function buildActions(
  band: ContinuityBand,
  flags: string[],
  kwId: string | null,
  kwActive: boolean,
): RecommendedAction[] {
  const actions: RecommendedAction[] = [];

  if (!kwId) {
    actions.push({
      priority: "urgent",
      action: "Assign a named key worker — every child must have an identified key worker who builds a consistent relationship",
      regulatory_link: "Reg 11 — positive relationships; Reg 6 — quality of care",
    });
  } else if (!kwActive) {
    actions.push({
      priority: "urgent",
      action: "The assigned key worker has left or is inactive — reassign a key worker and plan a careful relational handover with the child",
      regulatory_link: "Reg 11 — positive relationships",
    });
  } else if (flags.some((f) => /delivering few or none/.test(f))) {
    actions.push({
      priority: "high",
      action: "Protect key-working time so the assigned key worker delivers the child's sessions, not ad-hoc staff",
      regulatory_link: "Reg 11 — positive relationships",
    });
  }

  if (flags.some((f) => /No key-working sessions recorded|No key-working session in/.test(f))) {
    actions.push({
      priority: band === "critical" ? "high" : "routine",
      action: "Schedule and protect regular key-working sessions; review why sessions are not happening",
      regulatory_link: "Reg 11 / Reg 6 — consistent care and relationships",
    });
  }
  if (flags.some((f) => /fragmented/.test(f))) {
    actions.push({
      priority: "routine",
      action: "Reduce the number of different staff working 1:1 with this child to strengthen a primary relationship",
      regulatory_link: "Reg 11 — positive relationships",
    });
  }

  if (actions.length === 0) {
    actions.push({
      priority: "routine",
      action: "Continuity of care is strong — maintain the consistent key-working relationship",
      regulatory_link: "Reg 11 — positive relationships",
    });
  }
  return actions;
}

// ── Overview builder ────────────────────────────────────────────────────────

function buildOverview(children: ChildContinuity[]): ContinuityOverview {
  const weakest = children[0] ?? null; // sorted weakest-first
  return {
    children_analysed: children.length,
    avg_continuity_index: children.length > 0
      ? Math.round(children.reduce((s, c) => s + c.continuity_index, 0) / children.length)
      : 0,
    strong_count: children.filter((c) => c.band === "strong").length,
    adequate_count: children.filter((c) => c.band === "adequate").length,
    fragmented_count: children.filter((c) => c.band === "fragmented" || c.band === "critical").length,
    no_key_worker_count: children.filter((c) => !c.key_worker_id).length,
    inactive_key_worker_count: children.filter((c) => c.key_worker_id && !c.key_worker_active).length,
    weakest_child: weakest && weakest.band !== "strong" ? weakest.child_name : null,
    weakest_index: weakest?.continuity_index ?? 0,
  };
}

// ── Alerts builder ────────────────────────────────────────────────────────

function buildAlerts(children: ChildContinuity[]): ContinuityAlert[] {
  const alerts: ContinuityAlert[] = [];
  for (const c of children) {
    if (!c.key_worker_id) {
      alerts.push({ severity: "critical", child_id: c.child_id, message: `${c.child_name} has no key worker assigned — assign one now` });
    } else if (!c.key_worker_active) {
      alerts.push({ severity: "critical", child_id: c.child_id, message: `${c.child_name}'s key worker (${c.key_worker_name}) has left or is inactive — reassign and plan a relational handover` });
    } else if (c.band === "critical") {
      alerts.push({ severity: "high", child_id: c.child_id, message: `${c.child_name}'s continuity of care is critical (${c.continuity_index}/100) — ${c.flags[0] ?? "fragmented relationships"}` });
    }
  }
  for (const c of children) {
    if (c.band === "fragmented" && c.key_worker_active) {
      alerts.push({ severity: "medium", child_id: c.child_id, message: `${c.child_name}'s key-working continuity is fragmented (${c.continuity_index}/100, ${c.key_worker_share}% by their key worker)` });
    }
  }
  return alerts;
}

// ── ARIA insights builder ───────────────────────────────────────────────────

function buildInsights(children: ChildContinuity[], overview: ContinuityOverview): AriaContinuityInsight[] {
  const insights: AriaContinuityInsight[] = [];

  const noKw = children.filter((c) => !c.key_worker_id);
  const inactiveKw = children.filter((c) => c.key_worker_id && !c.key_worker_active);
  if (noKw.length > 0 || inactiveKw.length > 0) {
    insights.push({
      severity: "critical",
      text: `${noKw.length + inactiveKw.length} child${noKw.length + inactiveKw.length === 1 ? "" : "ren"} ${noKw.length + inactiveKw.length === 1 ? "lacks" : "lack"} a consistent, active key worker. A trusted adult who knows the child well is the foundation of good care and stability — assign or reassign now and handle the handover relationally.`,
    });
  }

  const notDelivering = children.filter(
    (c) => c.key_worker_active && c.sessions_90d > 0 && c.key_worker_share < 40,
  );
  if (notDelivering.length > 0) {
    const names = notDelivering.slice(0, 3).map((c) => c.child_name).join(", ");
    insights.push({
      severity: "warning",
      text: `For ${notDelivering.length} child${notDelivering.length === 1 ? "" : "ren"} (${names}), the assigned key worker is delivering few of the sessions — the relationship exists on paper but not in practice. Protect key-working time so the named worker is the one building the relationship.`,
    });
  }

  if (children.length > 0 && overview.fragmented_count === 0 && noKw.length === 0 && inactiveKw.length === 0) {
    insights.push({
      severity: "positive",
      text: `Every child has an active key worker and consistent key-working (average continuity ${overview.avg_continuity_index}/100). Consistent, trusted relationships are a core strength Ofsted looks for — keep protecting key-working time.`,
    });
  }

  return insights;
}
