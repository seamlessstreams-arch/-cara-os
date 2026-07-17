// ─────────────────────────────────────────────────────────────────────────────
// Escalation Quality Engine (Practice Intelligence OS 2.2.11 / doctrine 1.10)
//
// The escalation workflow records what was suggested, what a human decided and
// when. This engine reads that record back and asks the questions the doctrine
// says a service must be able to answer about ITSELF:
//
//   • are decisions being made within the timescales the level demands?
//   • are concerns aging at low levels while nobody decides? (under-escalation)
//   • is everything being marked urgent until nothing is? (alert fatigue)
//
// This is Cara auditing Cara's home — the institutional-betrayal self-check in
// miniature: the organisation's own response pattern is a safeguarding variable.
//
// Fairness rules, straight from the covenant:
//   • a manager amending BELOW Cara's suggestion is NEVER read as misconduct.
//     Repeated amend-downs get BOTH readings stated: the engine may be
//     over-suggesting, or risk may be being minimised — it is a calibration
//     conversation for supervision, not a verdict about a person;
//   • an urgent-heavy mix may reflect a genuinely acute period; the detection
//     says so and asks, rather than concludes;
//   • small numbers are read as small numbers: pattern detections need enough
//     records to mean anything, and say when they don't.
//
// Pure and deterministic: caller supplies `now`; no store, no AI.
// ─────────────────────────────────────────────────────────────────────────────

import type { EscalationDecision, EscalationLevel } from "./types";

// Decision windows in hours, per doctrine 1.10's timescales (low → within 24h,
// emerging → same day, high → within 2h, immediate → immediate). Visible
// constants, changed here with a reason — the level definitions' `timeframe`
// strings remain the display truth; these are the measurable half.
export const DECISION_WINDOW_HOURS: Record<EscalationLevel, number> = {
  low_concern: 24,
  emerging_concern: 8,
  high_concern: 2,
  immediate_safeguarding: 0.5,
};

export type DecisionDirection = "confirmed" | "amended_up" | "amended_down" | "rejected" | "awaiting";

export interface DecisionRead {
  id: string;
  childName: string;
  concernSummary: string;
  suggestedLevel: EscalationLevel;
  confirmedLevel: EscalationLevel | null;
  direction: DecisionDirection;
  /** Hours from suggestion to decision (or to `now` while awaiting). */
  hours: number;
  windowHours: number;
  withinWindow: boolean;
  status: EscalationDecision["status"];
}

export type EscalationQualityKey =
  | "decision_overdue"
  | "slow_decision_pattern"
  | "amend_down_pattern"
  | "alert_fatigue_risk"
  | "calibration_healthy";

export interface EscalationQualityFinding {
  key: EscalationQualityKey;
  tone: "prompt" | "positive";
  headline: string;
  whyShown: string;
  evidenceIds: string[];
  suggestedQuestions: string[];
}

export interface EscalationQualityResult {
  reads: DecisionRead[];
  findings: EscalationQualityFinding[];
  counts: {
    total: number;
    awaiting: number;
    withinWindow: number;
    exceededWindow: number;
    amendedDown: number;
    urgentShare: number; // 0..1 of decided records at high/immediate
  };
  /** Median hours to decision per level, where any were decided. Honest nulls. */
  medianHoursByLevel: Partial<Record<EscalationLevel, number>>;
}

const RANK: Record<EscalationLevel, number> = {
  low_concern: 1,
  emerging_concern: 2,
  high_concern: 3,
  immediate_safeguarding: 4,
};

const HOUR = 3_600_000;

function hoursBetween(a: string, b: string): number {
  const t1 = Date.parse(a);
  const t2 = Date.parse(b);
  if (Number.isNaN(t1) || Number.isNaN(t2)) return 0;
  return Math.max(0, (t2 - t1) / HOUR);
}

function median(nums: number[]): number | null {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function direction(d: EscalationDecision): DecisionDirection {
  if (d.status !== "decided") return "awaiting";
  if (d.agreement === "rejected") return "rejected";
  if (d.agreement === "confirmed" || !d.confirmedLevel) return "confirmed";
  return RANK[d.confirmedLevel] > RANK[d.suggestedLevel] ? "amended_up"
    : RANK[d.confirmedLevel] < RANK[d.suggestedLevel] ? "amended_down"
    : "confirmed";
}

/** The window a record is judged against: the CONFIRMED level where decided
 *  (the human's judgement governs), else the suggested level while waiting. */
function windowFor(d: EscalationDecision): number {
  const level = d.status === "decided" && d.confirmedLevel ? d.confirmedLevel : d.suggestedLevel;
  return DECISION_WINDOW_HOURS[level];
}

export function assessEscalationQuality(
  decisions: EscalationDecision[],
  now: Date,
): EscalationQualityResult {
  const nowIso = now.toISOString();

  const reads: DecisionRead[] = decisions.map((d) => {
    const hours = d.status === "decided" && d.decidedAt
      ? hoursBetween(d.suggestedAt, d.decidedAt)
      : hoursBetween(d.suggestedAt, nowIso);
    const windowHours = windowFor(d);
    return {
      id: d.id,
      childName: d.childName ?? "—",
      concernSummary: d.concernSummary,
      suggestedLevel: d.suggestedLevel,
      confirmedLevel: d.confirmedLevel ?? null,
      direction: direction(d),
      hours,
      windowHours,
      withinWindow: hours <= windowHours,
      status: d.status,
    };
  });

  const findings: EscalationQualityFinding[] = [];
  const awaiting = reads.filter((r) => r.status === "awaiting_decision");
  const decided = reads.filter((r) => r.status === "decided");

  // 1. A concern is WAITING past its window — the doctrine's "concerns aging
  //    at low levels while risk factors accumulate", caught live.
  for (const r of awaiting.filter((x) => !x.withinWindow)) {
    findings.push({
      key: "decision_overdue",
      tone: "prompt",
      headline: `Awaiting a decision for ${Math.round(r.hours)}h — the ${r.suggestedLevel.replace(/_/g, " ")} window is ${r.windowHours}h`,
      whyShown:
        `"${r.concernSummary}" was suggested at ${r.suggestedLevel.replace(/_/g, " ")} and nobody has decided. ` +
        "When in doubt the doctrine escalates — a concern waiting past its window is risk aging quietly.",
      evidenceIds: [r.id],
      suggestedQuestions: [
        "Who owns this decision today?",
        "Has anything changed for the child while it waited?",
      ],
    });
  }

  // 2. Decided, but repeatedly outside the window — systemic lateness, not a
  //    one-off. Needs ≥2 to be a pattern.
  const slow = decided.filter((r) => !r.withinWindow);
  if (slow.length >= 2) {
    findings.push({
      key: "slow_decision_pattern",
      tone: "prompt",
      headline: `${slow.length} decisions took longer than their level's window`,
      whyShown:
        slow.map((r) => `"${r.concernSummary.slice(0, 40)}…" ${Math.round(r.hours)}h vs ${r.windowHours}h`).join("; ") +
        ". Late decisions are a workload and process signal for supervision — not a fault line under any one person.",
      evidenceIds: slow.map((r) => r.id),
      suggestedQuestions: [
        "Where does the delay sit — noticing, escalating, or deciding?",
        "Do decision-makers have cover for the 2-hour high-concern window?",
      ],
    });
  }

  // 3. Repeated amend-downs — BOTH readings stated, always.
  const amendedDown = decided.filter((r) => r.direction === "amended_down");
  if (amendedDown.length >= 2) {
    findings.push({
      key: "amend_down_pattern",
      tone: "prompt",
      headline: `${amendedDown.length} suggestions were amended to a lower level`,
      whyShown:
        "Two honest readings, and this detection cannot tell them apart: Cara's suggestion rules may be " +
        "over-weighting these concerns (a calibration fix for the engine), or risk may be being minimised " +
        "(a practice conversation). Each amend-down carries the manager's recorded reason — read those first.",
      evidenceIds: amendedDown.map((r) => r.id),
      suggestedQuestions: [
        "Do the recorded reasons share a theme the suggestion rules should learn from?",
        "Would the amended-down concerns look different if the child's history sat beside them?",
      ],
    });
  }

  // 4. Alert fatigue — urgent-heavy mix. Needs volume to mean anything.
  const urgent = decided.filter((r) => (r.confirmedLevel ?? r.suggestedLevel) === "high_concern" || (r.confirmedLevel ?? r.suggestedLevel) === "immediate_safeguarding");
  const urgentShare = decided.length ? urgent.length / decided.length : 0;
  if (decided.length >= 5 && urgentShare > 0.6) {
    findings.push({
      key: "alert_fatigue_risk",
      tone: "prompt",
      headline: `${Math.round(urgentShare * 100)}% of decided escalations sit at high or immediate`,
      whyShown:
        "When most things are urgent, urgency stops carrying information — staff tune out exactly when it matters. " +
        "This may also reflect a genuinely acute period for the home; the mix is the prompt, the reason is yours to find.",
      evidenceIds: urgent.map((r) => r.id),
      suggestedQuestions: [
        "Is this a hard period, or are lower levels being skipped?",
        "Do low and emerging levels feel actionable enough to use?",
      ],
    });
  }

  // 5. The positive — decisions timely and the mix balanced.
  if (decided.length >= 2 && slow.length === 0 && awaiting.filter((r) => !r.withinWindow).length === 0) {
    findings.push({
      key: "calibration_healthy",
      tone: "positive",
      headline: "Escalation decisions are being made inside their windows",
      whyShown: `${decided.length} decided, all within timescale; nothing waiting past its window. Worth naming — timeliness under pressure is practice, not luck.`,
      evidenceIds: decided.map((r) => r.id),
      suggestedQuestions: [],
    });
  }

  const medianHoursByLevel: Partial<Record<EscalationLevel, number>> = {};
  for (const level of Object.keys(DECISION_WINDOW_HOURS) as EscalationLevel[]) {
    const m = median(decided.filter((r) => (r.confirmedLevel ?? r.suggestedLevel) === level).map((r) => r.hours));
    if (m !== null) medianHoursByLevel[level] = Math.round(m * 10) / 10;
  }

  return {
    reads,
    findings,
    counts: {
      total: reads.length,
      awaiting: awaiting.length,
      withinWindow: reads.filter((r) => r.withinWindow).length,
      exceededWindow: reads.filter((r) => !r.withinWindow).length,
      amendedDown: amendedDown.length,
      urgentShare: Math.round(urgentShare * 100) / 100,
    },
    medianHoursByLevel,
  };
}
