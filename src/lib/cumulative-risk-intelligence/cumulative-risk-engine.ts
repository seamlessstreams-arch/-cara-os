// ══════════════════════════════════════════════════════════════════════════════
// CARA — CUMULATIVE RISK INTELLIGENCE ENGINE
//
// Tracks whether multiple risk signals are CONVERGING for each child.
// A single incident is manageable; four escalating signals simultaneously
// is a cumulative harm pattern requiring urgent management attention.
//
// Five risk signals tracked per child:
//   1. Incident frequency trend  (last 30d vs prior 30d)
//   2. Incident severity pattern  (high/critical incidents last 30d)
//   3. Missing episode frequency  (last 30d vs prior 30d)
//   4. Relational isolation       (no key work sessions last 30d)
//   5. Safeguarding-type incidents (police, exploitation, allegation, missing)
//
// Cumulative signal:
//   escalating   — 3+ signals trending worse
//   concerning   — 1–2 signals worse
//   stable       — no escalating signals
//   improving    — prior signals now reducing
//
// Pure + deterministic. No LLM calls, no I/O — the store is passed IN, so this
// builder is fully unit-testable and the route is a thin wrapper around it.
// ══════════════════════════════════════════════════════════════════════════════

import type { getStore } from "@/lib/db/store";

export type CumulativeSignal = "escalating" | "concerning" | "stable" | "improving";
export type SignalDirection = "worsening" | "stable" | "improving";

export interface RiskSignal {
  id: string;
  label: string;
  direction: SignalDirection;
  recent: number;
  prior: number;
  note: string;
}

export interface ChildCumulativeProfile {
  childId: string;
  childName: string;
  signal: CumulativeSignal;
  worseningSignals: number;
  improvingSignals: number;
  signals: RiskSignal[];
  supervisionPriority: "urgent" | "this_week" | "monitor" | "none";
  supervisionPrompt: string;
  // High-level counts
  incidentsLast30d: number;
  incidentsLast90d: number;
  missingsLast30d: number;
  highSeverityLast30d: number;
  safeguardingTypeLast30d: number;
}

export interface SignalSummary {
  escalatingCount: number;
  concerningCount: number;
  stableCount: number;
  improvingCount: number;
  urgentSupervisionCount: number;
  mostCommonWorseningSignal: string;
}

/** Exact shape returned under `data` by GET /api/v1/cumulative-risk-intelligence. */
export interface CumulativeRiskData {
  childProfiles: ChildCumulativeProfile[];
  summary: SignalSummary;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysBetween(dateStr: string, now: Date): number {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 9999;
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  // Future-dated records (data-entry errors) are NOT recent — never let them
  // clamp to "today" and inflate risk to urgent.
  return days < 0 ? 9999 : days;
}

// ── Signal labels ─────────────────────────────────────────────────────────────

const SAFEGUARDING_TYPES = new Set([
  "safeguarding_concern",
  "missing_from_care",
  "police_involvement",
  "exploitation_concern",
  "allegation",
  "contextual_safeguarding",
  "self_harm",
]);

const HIGH_SEVERITY = new Set(["high", "critical"]);

// ── Supervision priority derivation ──────────────────────────────────────────

function derivePriority(signal: CumulativeSignal, safeguardingCount: number): "urgent" | "this_week" | "monitor" | "none" {
  if (signal === "escalating" || safeguardingCount >= 2) return "urgent";
  if (signal === "concerning") return "this_week";
  if (signal === "improving") return "monitor";
  return "none";
}

function supervisionPromptFor(
  childName: string,
  signal: CumulativeSignal,
  worseningLabels: string[],
): string {
  if (signal === "escalating") {
    return `${childName} has ${worseningLabels.length} escalating risk signals simultaneously (${worseningLabels.join(", ")}). This pattern may indicate cumulative harm. Prioritise in supervision this week: what is the underlying need driving this? What additional support does the team need?`;
  }
  if (signal === "concerning") {
    return `${childName} has emerging risk signals in: ${worseningLabels.join(", ")}. Monitor closely. Explore in supervision: is this a temporary spike or a pattern, and what early intervention might help?`;
  }
  if (signal === "improving") {
    return `${childName}'s risk picture is improving. Use supervision to reinforce what's working — which approaches, which relationships, which environmental changes have made a difference?`;
  }
  return `${childName}'s risk signals appear stable. Review in scheduled supervision.`;
}

// ── Public entry point — pure ────────────────────────────────────────────────

export function buildCumulativeRiskIntelligence(store: ReturnType<typeof getStore>): CumulativeRiskData {
  const now = new Date();

  const youngPeople = (store.youngPeople ?? []) as Array<{
    id: string; first_name: string; last_name: string; status: string;
  }>;

  const incidents = (store.incidents ?? []) as Array<{
    child_id: string; date: string; severity: string; type: string;
  }>;

  const missingEpisodes = (store.missingEpisodes ?? []) as Array<{
    child_id: string; date_missing: string;
  }>;

  const keyWorkSessions = (store.keyWorkingSessions ?? []) as Array<{
    child_id: string; date: string;
  }>;

  const currentChildren = youngPeople.filter((yp) => yp.status === "current");

  // ── Index by child ────────────────────────────────────────────────────────

  type WindowCounts = { recent: number; prior: number; recent90: number };

  const incidentsByChild   = new Map<string, WindowCounts & { highSev30d: number; safeguarding30d: number }>();
  const missingsByChild    = new Map<string, WindowCounts>();
  const keyWorkByChild     = new Map<string, { recent30d: number }>();

  for (const i of incidents) {
    const age = daysBetween(i.date, now);
    let e = incidentsByChild.get(i.child_id);
    if (!e) { e = { recent: 0, prior: 0, recent90: 0, highSev30d: 0, safeguarding30d: 0 }; incidentsByChild.set(i.child_id, e); }
    if (age <= 30)  { e.recent++; if (HIGH_SEVERITY.has(i.severity)) e.highSev30d++; if (SAFEGUARDING_TYPES.has(i.type)) e.safeguarding30d++; }
    if (age > 30 && age <= 60) e.prior++;
    if (age <= 90) e.recent90++;
  }

  for (const m of missingEpisodes) {
    const age = daysBetween(m.date_missing, now);
    let e = missingsByChild.get(m.child_id);
    if (!e) { e = { recent: 0, prior: 0, recent90: 0 }; missingsByChild.set(m.child_id, e); }
    if (age <= 30) e.recent++;
    if (age > 30 && age <= 60) e.prior++;
    if (age <= 90) e.recent90++;
  }

  for (const s of keyWorkSessions) {
    const age = daysBetween(s.date, now);
    let e = keyWorkByChild.get(s.child_id);
    if (!e) { e = { recent30d: 0 }; keyWorkByChild.set(s.child_id, e); }
    if (age <= 30) e.recent30d++;
  }

  // ── Build per-child profiles ──────────────────────────────────────────────

  const childProfiles: ChildCumulativeProfile[] = currentChildren.map((yp) => {
    const childName = `${yp.first_name} ${yp.last_name}`;
    const inc    = incidentsByChild.get(yp.id)  ?? { recent: 0, prior: 0, recent90: 0, highSev30d: 0, safeguarding30d: 0 };
    const miss   = missingsByChild.get(yp.id)   ?? { recent: 0, prior: 0, recent90: 0 };
    const kw     = keyWorkByChild.get(yp.id)    ?? { recent30d: 0 };

    // ── Signal 1: Incident frequency trend ─────────────────────────────────
    let incidentTrendDir: SignalDirection;
    if (inc.prior === 0 && inc.recent === 0) incidentTrendDir = "stable";
    else if (inc.recent > inc.prior * 1.5 && inc.recent >= 2) incidentTrendDir = "worsening";
    else if (inc.recent < inc.prior && inc.prior >= 2) incidentTrendDir = "improving";
    else incidentTrendDir = "stable";

    const signal1: RiskSignal = {
      id: "incident_frequency",
      label: "Incident frequency",
      direction: incidentTrendDir,
      recent: inc.recent,
      prior: inc.prior,
      note: incidentTrendDir === "worsening"
        ? `${inc.recent} incidents last 30d vs ${inc.prior} in prior 30d — frequency increasing`
        : incidentTrendDir === "improving"
        ? `${inc.recent} incidents last 30d vs ${inc.prior} prior — frequency reducing`
        : `${inc.recent} incidents last 30d — no significant trend`,
    };

    // ── Signal 2: Incident severity ─────────────────────────────────────────
    const highSevDir: SignalDirection = inc.highSev30d >= 2 ? "worsening" : "stable";
    const signal2: RiskSignal = {
      id: "incident_severity",
      label: "High-severity incidents",
      direction: highSevDir,
      recent: inc.highSev30d,
      prior: 0,
      note: inc.highSev30d >= 2
        ? `${inc.highSev30d} high/critical incidents in last 30d`
        : `${inc.highSev30d} high/critical incidents — within expected range`,
    };

    // ── Signal 3: Missing episode trend ────────────────────────────────────
    let missingDir: SignalDirection;
    if (miss.prior === 0 && miss.recent === 0) missingDir = "stable";
    else if (miss.recent > miss.prior && miss.recent >= 2) missingDir = "worsening";
    else if (miss.recent < miss.prior && miss.prior >= 2) missingDir = "improving";
    else missingDir = "stable";

    const signal3: RiskSignal = {
      id: "missing_episodes",
      label: "Missing episodes",
      direction: missingDir,
      recent: miss.recent,
      prior: miss.prior,
      note: missingDir === "worsening"
        ? `${miss.recent} missing episodes last 30d vs ${miss.prior} prior — frequency increasing`
        : missingDir === "improving"
        ? `${miss.recent} missing episodes last 30d vs ${miss.prior} prior — reducing`
        : `${miss.recent} missing episodes last 30d`,
    };

    // ── Signal 4: Relational isolation ──────────────────────────────────────
    const isolationDir: SignalDirection = kw.recent30d === 0 ? "worsening" : kw.recent30d >= 2 ? "improving" : "stable";
    const signal4: RiskSignal = {
      id: "relational_isolation",
      label: "Relational isolation",
      direction: isolationDir,
      recent: kw.recent30d,
      prior: 0,
      note: kw.recent30d === 0
        ? "No key work sessions recorded in the last 30 days — relationship gap"
        : `${kw.recent30d} key work session${kw.recent30d > 1 ? "s" : ""} in last 30d`,
    };

    // ── Signal 5: Safeguarding-type incidents ───────────────────────────────
    const safeguardingDir: SignalDirection = inc.safeguarding30d >= 2 ? "worsening" : "stable";
    const signal5: RiskSignal = {
      id: "safeguarding_type",
      label: "Safeguarding-type incidents",
      direction: safeguardingDir,
      recent: inc.safeguarding30d,
      prior: 0,
      note: inc.safeguarding30d >= 1
        ? `${inc.safeguarding30d} safeguarding-type incident${inc.safeguarding30d > 1 ? "s" : ""} (missing, police, exploitation, self-harm, allegation) in last 30d`
        : "No safeguarding-type incidents in last 30d",
    };

    const allSignals = [signal1, signal2, signal3, signal4, signal5];
    const worseningSignals = allSignals.filter((s) => s.direction === "worsening");
    const improvingSignals = allSignals.filter((s) => s.direction === "improving");
    // A lone "relational isolation" signal (no key-work logged in 30d) is too weak
    // on its own to mark a child concerning — absence of a logged session is not
    // evidence of a safeguarding pattern (new admissions / logging gaps). It only
    // contributes to "concerning" when corroborated by another worsening signal.
    const corroboratedWorsening = worseningSignals.filter((s) => s.id !== "relational_isolation");

    let signal: CumulativeSignal;
    if (worseningSignals.length >= 3) signal = "escalating";
    else if (corroboratedWorsening.length >= 1) signal = "concerning";
    else if (improvingSignals.length >= 2 && worseningSignals.length === 0) signal = "improving";
    else signal = "stable";

    const priority = derivePriority(signal, inc.safeguarding30d);
    const worseningLabels = worseningSignals.map((s) => s.label.toLowerCase());

    return {
      childId: yp.id,
      childName,
      signal,
      worseningSignals: worseningSignals.length,
      improvingSignals: improvingSignals.length,
      signals: allSignals,
      supervisionPriority: priority,
      supervisionPrompt: supervisionPromptFor(childName, signal, worseningLabels),
      incidentsLast30d: inc.recent,
      incidentsLast90d: inc.recent90,
      missingsLast30d: miss.recent,
      highSeverityLast30d: inc.highSev30d,
      safeguardingTypeLast30d: inc.safeguarding30d,
    };
  });

  // Sort: escalating → concerning → stable → improving
  const ORDER: Record<CumulativeSignal, number> = { escalating: 0, concerning: 1, stable: 2, improving: 3 };
  childProfiles.sort((a, b) => ORDER[a.signal] - ORDER[b.signal]);

  // ── Summary ───────────────────────────────────────────────────────────────
  const escalating  = childProfiles.filter((c) => c.signal === "escalating").length;
  const concerning  = childProfiles.filter((c) => c.signal === "concerning").length;
  const stable      = childProfiles.filter((c) => c.signal === "stable").length;
  const improving   = childProfiles.filter((c) => c.signal === "improving").length;

  // Most common worsening signal across all children
  const signalCount: Record<string, number> = {};
  for (const profile of childProfiles) {
    for (const s of profile.signals) {
      if (s.direction === "worsening") {
        signalCount[s.label] = (signalCount[s.label] ?? 0) + 1;
      }
    }
  }
  const mostCommon = Object.entries(signalCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None";

  const summary: SignalSummary = {
    escalatingCount: escalating,
    concerningCount: concerning,
    stableCount: stable,
    improvingCount: improving,
    urgentSupervisionCount: childProfiles.filter((c) => c.supervisionPriority === "urgent").length,
    mostCommonWorseningSignal: mostCommon,
  };

  return { childProfiles, summary };
}
