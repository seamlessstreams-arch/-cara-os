// ─────────────────────────────────────────────────────────────────────────────
// Outcome Intelligence Engine
//
// Philosophy: "Intelligence is the improvement engine."
//
// The sector records activity. CARA measures whether a child's life is
// MEASURABLY GETTING BETTER. This engine is a PURE PROJECTION over records the
// child already has — it never duplicates or stores anything. For each outcome
// domain Ofsted's SCCIF cares about (safety, education, emotional wellbeing,
// relationships & belonging, voice & participation) it compares a RECENT window
// against the PRIOR window of equal length and derives an honest direction
// (improving / stable / declining) and status — so a team can see, at a glance,
// where a child is progressing and where to focus.
//
// Determinism: `now` is injected, no LLM, no wall-clock → works in production
// with no AI key and is fully unit-testable.
//
// Critical-friend discipline: a domain is only marked "needs focus" on POSITIVE
// EVIDENCE OF A CONCERN (a recent rupture, a low recent mood, a clear decline) —
// never merely because a source is empty. Sparse data reads as "progressing",
// not alarming red. Intelligence informs practice; people make the decisions.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  KeyWorkingSession,
  FamilyTimeSession,
  MissingEpisode,
  PositiveAchievement,
  ReturnInterview,
  EducationRecord,
  LACReview,
} from "@/types/extended";
import type { Incident } from "@/types";

// ── Vocabulary ───────────────────────────────────────────────────────────────

export type OutcomeDirection = "improving" | "stable" | "declining";
/** RAG status. needs_focus is reserved for evidenced concern, never empty data. */
export type OutcomeStatus = "on_track" | "progressing" | "needs_focus";
export type OutcomeDomainKey =
  | "safety"
  | "education"
  | "wellbeing"
  | "relationships"
  | "voice";

export interface OutcomeMetric {
  label: string;
  value: string | number;
}

export interface OutcomeDomain {
  key: OutcomeDomainKey;
  label: string;
  status: OutcomeStatus;
  direction: OutcomeDirection;
  headline: string;
  metrics: OutcomeMetric[];
  /** Primary measure in the recent window (meaning is domain-specific). */
  recentCount: number;
  /** Same measure in the prior window — the comparison baseline. */
  priorCount: number;
  /** True when the domain has any evidence at all in either window. */
  hasEvidence: boolean;
}

export interface OutcomeInsight {
  key: string;
  tone: "positive" | "watch" | "gap";
  text: string;
}

export interface OutcomeIntelligence {
  childId: string;
  childName: string;
  generatedAt: string;
  windowDays: number;
  overallTrajectory: OutcomeDirection;
  overallStatus: OutcomeStatus;
  headline: string;
  domainsImproving: number;
  domainsDeclining: number;
  domainsOnTrack: number;
  domainsNeedingFocus: number;
  domains: OutcomeDomain[];
  insights: OutcomeInsight[];
}

export interface OutcomeIntelligenceInput {
  childId: string;
  childName: string;
  now: string; // injected ISO timestamp → deterministic
  /** Length of the recent (and prior) comparison window, in days. Default 90. */
  windowDays?: number;
  keyWorkingSessions: KeyWorkingSession[];
  incidents: Incident[];
  missingEpisodes: MissingEpisode[];
  educationRecords: EducationRecord[];
  positiveAchievements: PositiveAchievement[];
  familyTimeSessions: FamilyTimeSession[];
  returnInterviews: ReturnInterview[];
  lacReviews: LACReview[];
  /** PACE-identified trusted adults (display names) — a relationships signal. */
  trustedAdults: string[];
}

// ── Windowing ────────────────────────────────────────────────────────────────

type Window = "recent" | "prior" | "older" | "invalid";

/** Classify a record's date relative to `now`: recent = last `windowDays`,
 *  prior = the equal window before that. Future dates count as recent. */
function windowOf(dateIso: string | undefined, now: string, windowDays: number): Window {
  if (!dateIso) return "invalid";
  const t = Date.parse(dateIso);
  const n = Date.parse(now);
  if (Number.isNaN(t) || Number.isNaN(n)) return "invalid";
  const daysBefore = (n - t) / 86_400_000;
  if (daysBefore <= windowDays) return "recent"; // includes slight future-dating
  if (daysBefore <= windowDays * 2) return "prior";
  return "older";
}

/** Split rows into recent/prior counts by a date accessor. */
function split<T>(
  rows: T[],
  dateOf: (r: T) => string | undefined,
  now: string,
  windowDays: number,
  keep: (r: T) => boolean = () => true,
): { recent: T[]; prior: T[] } {
  const recent: T[] = [];
  const prior: T[] = [];
  for (const r of rows) {
    if (!keep(r)) continue;
    const w = windowOf(dateOf(r), now, windowDays);
    if (w === "recent") recent.push(r);
    else if (w === "prior") prior.push(r);
  }
  return { recent, prior };
}

// ── Direction helpers ────────────────────────────────────────────────────────

/** Trend where a HIGHER number is better (connection, mood, voice, wins). */
function directionUp(recent: number, prior: number): OutcomeDirection {
  if (recent > prior) return "improving";
  if (recent < prior) return "declining";
  return "stable";
}

/** Trend where a LOWER number is better (incidents, missing, exclusions). */
function directionDown(recent: number, prior: number): OutcomeDirection {
  // No prior baseline: a single recent event is not a downward trend — avoids a
  // false "declining" for new placements or sparse data (the critical-friend rule:
  // thin data is never a red flag). A genuine spike (≥2) still shows.
  if (prior === 0) return recent >= 2 ? "declining" : "stable";
  if (recent < prior) return "improving";
  if (recent > prior) return "declining";
  return "stable";
}

const HIGH_SEVERITY = new Set(["serious", "high", "major", "critical"]);

// ── Domain builders ──────────────────────────────────────────────────────────

function buildSafety(input: OutcomeIntelligenceInput, windowDays: number): OutcomeDomain {
  const inc = split(input.incidents, (i) => i.date, input.now, windowDays);
  const miss = split(input.missingEpisodes, (m) => m.date_missing, input.now, windowDays);

  const recentRuptures = inc.recent.length + miss.recent.length;
  const priorRuptures = inc.prior.length + miss.prior.length;
  const recentHigh = inc.recent.filter((i) => HIGH_SEVERITY.has(String(i.severity))).length;
  const direction = directionDown(recentRuptures, priorRuptures);
  const hasEvidence = recentRuptures + priorRuptures > 0;

  let status: OutcomeStatus;
  let headline: string;
  if (recentRuptures === 0) {
    status = "on_track";
    headline = hasEvidence
      ? "No incidents or missing episodes in the recent window — safety is holding."
      : "No safety concerns recorded — a settled period.";
  } else if (recentHigh > 0 || (recentRuptures >= 3 && direction !== "improving")) {
    status = "needs_focus";
    headline = `${recentRuptures} safety event${recentRuptures === 1 ? "" : "s"} recently${recentHigh > 0 ? `, ${recentHigh} high-severity` : ""} — prioritise a safety review.`;
  } else {
    status = "progressing";
    headline =
      direction === "improving"
        ? `Safety events easing (${recentRuptures} vs ${priorRuptures} before).`
        : `${recentRuptures} safety event${recentRuptures === 1 ? "" : "s"} recently — keep close oversight.`;
  }

  return {
    key: "safety",
    label: "Safety",
    status,
    direction,
    headline,
    metrics: [
      { label: "Incidents (recent)", value: inc.recent.length },
      { label: "Missing (recent)", value: miss.recent.length },
      { label: "High severity", value: recentHigh },
      { label: "Prior window", value: priorRuptures },
    ],
    recentCount: recentRuptures,
    priorCount: priorRuptures,
    hasEvidence,
  };
}

const EDU_WIN = new Set(["achievement", "attainment", "progress"]);
const EDU_SETBACK = new Set(["exclusion", "concern", "suspension"]);

function buildEducation(input: OutcomeIntelligenceInput, windowDays: number): OutcomeDomain {
  const edu = split(input.educationRecords, (e) => e.date, input.now, windowDays);
  const wins = (rows: EducationRecord[]) => rows.filter((e) => EDU_WIN.has(String(e.record_type))).length;
  const setbacks = (rows: EducationRecord[]) => rows.filter((e) => EDU_SETBACK.has(String(e.record_type))).length;

  const recentWins = wins(edu.recent);
  const recentSetbacks = setbacks(edu.recent);
  const priorWins = wins(edu.prior);
  const priorSetbacks = setbacks(edu.prior);
  const netRecent = recentWins - recentSetbacks;
  const netPrior = priorWins - priorSetbacks;
  const direction = directionUp(netRecent, netPrior);
  const hasEvidence = edu.recent.length + edu.prior.length > 0;

  let status: OutcomeStatus;
  let headline: string;
  if (recentSetbacks > 0 && recentWins === 0) {
    status = "needs_focus";
    headline = `${recentSetbacks} education setback${recentSetbacks === 1 ? "" : "s"} and no recorded success recently — engage the school.`;
  } else if (recentWins > 0 && recentSetbacks === 0) {
    status = "on_track";
    headline = `${recentWins} education success${recentWins === 1 ? "" : "es"} recently — progress is visible.`;
  } else {
    status = "progressing";
    headline = hasEvidence
      ? `Education is mixed (${recentWins} success, ${recentSetbacks} setback) — keep building momentum.`
      : "No education records in this period — capture progress and attendance.";
  }

  return {
    key: "education",
    label: "Education & learning",
    status,
    direction,
    headline,
    metrics: [
      { label: "Successes (recent)", value: recentWins },
      { label: "Setbacks (recent)", value: recentSetbacks },
      { label: "Net (recent)", value: netRecent },
      { label: "Net (prior)", value: netPrior },
    ],
    recentCount: netRecent,
    priorCount: netPrior,
    hasEvidence,
  };
}

function buildWellbeing(input: OutcomeIntelligenceInput, windowDays: number): OutcomeDomain {
  const hasMood = (s: KeyWorkingSession) => typeof s.mood_after === "number" && s.mood_after > 0;
  const kw = split(input.keyWorkingSessions, (s) => s.date, input.now, windowDays, hasMood);
  const ach = split(input.positiveAchievements, (a) => a.date, input.now, windowDays);

  const avg = (rows: KeyWorkingSession[]) =>
    rows.length ? rows.reduce((sum, s) => sum + (s.mood_after ?? 0), 0) / rows.length : 0;
  const recentAvg = avg(kw.recent);
  const priorAvg = avg(kw.prior);
  const recentAch = ach.recent.length;
  const priorAch = ach.prior.length;
  const hasEvidence = kw.recent.length + kw.prior.length + recentAch + priorAch > 0;

  // Direction blends measured mood (primary) with celebrated achievements.
  const direction =
    kw.recent.length && kw.prior.length
      ? directionUp(Math.round(recentAvg * 10), Math.round(priorAvg * 10))
      : directionUp(recentAch, priorAch);

  let status: OutcomeStatus;
  let headline: string;
  if (kw.recent.length > 0 && recentAvg <= 2.5) {
    status = "needs_focus";
    headline = `Mood is low in recent key-work (avg ${recentAvg.toFixed(1)}/5) — check in on emotional wellbeing.`;
  } else if ((kw.recent.length > 0 && recentAvg >= 4) || recentAch >= 2) {
    status = "on_track";
    headline =
      kw.recent.length > 0 && recentAvg >= 4
        ? `Mood is positive in recent key-work (avg ${recentAvg.toFixed(1)}/5)${recentAch ? ` with ${recentAch} achievements celebrated` : ""}.`
        : `${recentAch} achievements celebrated recently — wellbeing is being nurtured.`;
  } else {
    status = "progressing";
    headline = hasEvidence
      ? `Wellbeing is steady${kw.recent.length ? ` (mood avg ${recentAvg.toFixed(1)}/5)` : ""} — keep noticing what helps.`
      : "No mood or achievement records in this period — capture how the child is doing.";
  }

  return {
    key: "wellbeing",
    label: "Emotional wellbeing",
    status,
    direction,
    headline,
    metrics: [
      { label: "Mood avg (recent)", value: kw.recent.length ? `${recentAvg.toFixed(1)}/5` : "—" },
      { label: "Mood avg (prior)", value: kw.prior.length ? `${priorAvg.toFixed(1)}/5` : "—" },
      { label: "Achievements (recent)", value: recentAch },
      { label: "Sessions w/ mood", value: kw.recent.length },
    ],
    recentCount: recentAch,
    priorCount: priorAch,
    hasEvidence,
  };
}

function buildRelationships(input: OutcomeIntelligenceInput, windowDays: number): OutcomeDomain {
  const kw = split(input.keyWorkingSessions, (s) => s.date, input.now, windowDays);
  const positiveFamily = (f: FamilyTimeSession) =>
    f.was_it_safe !== false && (f.concerns_raised ?? []).length === 0;
  const ft = split(input.familyTimeSessions, (f) => f.date, input.now, windowDays, positiveFamily);

  const recentConnections = kw.recent.length + ft.recent.length;
  const priorConnections = kw.prior.length + ft.prior.length;
  const hasTrusted = input.trustedAdults.length > 0;
  const direction = directionUp(recentConnections, priorConnections);
  const hasEvidence = recentConnections + priorConnections > 0 || hasTrusted;

  let status: OutcomeStatus;
  let headline: string;
  if (hasTrusted && recentConnections >= 2) {
    status = "on_track";
    headline = `${input.trustedAdults.length} trusted adult${input.trustedAdults.length === 1 ? "" : "s"} and ${recentConnections} connection moments recently — belonging is strong.`;
  } else if (!hasTrusted && recentConnections === 0 && priorConnections > 0) {
    // Evidenced decline only: connections existed in the prior window, none now,
    // and no trusted anchor. Absence with NO prior baseline (a new or sparsely
    // recorded placement) is NOT red — it falls through to "progressing" per the
    // engine's no-false-red rule (mirrors buildVoice, which requires priorVoice>0).
    status = "needs_focus";
    headline = `Connection moments have dropped to none (from ${priorConnections} in the prior window) and no trusted adult is identified — make relationship-building a priority.`;
  } else {
    status = "progressing";
    headline = hasTrusted
      ? `Trusted relationships in place; ${recentConnections} connection moment${recentConnections === 1 ? "" : "s"} recently — keep them consistent.`
      : `${recentConnections} connection moment${recentConnections === 1 ? "" : "s"} recently, but no clear trusted adult yet — build a relational anchor.`;
  }

  return {
    key: "relationships",
    label: "Relationships & belonging",
    status,
    direction,
    headline,
    metrics: [
      { label: "Trusted adults", value: input.trustedAdults.length },
      { label: "Connections (recent)", value: recentConnections },
      { label: "Connections (prior)", value: priorConnections },
      { label: "Positive family time", value: ft.recent.length },
    ],
    recentCount: recentConnections,
    priorCount: priorConnections,
    hasEvidence,
  };
}

function buildVoice(input: OutcomeIntelligenceInput, windowDays: number): OutcomeDomain {
  const lac = split(input.lacReviews, (l) => l.date, input.now, windowDays, (l) => !!l.child_views?.trim());
  const rhi = split(input.returnInterviews, (r) => r.interview_date || r.return_date, input.now, windowDays);
  const kwVoice = split(
    input.keyWorkingSessions,
    (s) => s.date,
    input.now,
    windowDays,
    (s) => !!s.child_voice?.trim(),
  );

  const recentVoice = lac.recent.length + rhi.recent.length + kwVoice.recent.length;
  const priorVoice = lac.prior.length + rhi.prior.length + kwVoice.prior.length;
  const direction = directionUp(recentVoice, priorVoice);
  const hasEvidence = recentVoice + priorVoice > 0;

  let status: OutcomeStatus;
  let headline: string;
  if (recentVoice >= 2) {
    status = "on_track";
    headline = `The child's voice was captured ${recentVoice} times recently — participation is real.`;
  } else if (recentVoice === 0 && priorVoice > 0) {
    status = "needs_focus";
    headline = "The child's voice was captured before but not in the recent window — actively seek their views.";
  } else if (recentVoice === 1) {
    status = "progressing";
    headline = "The child's voice was captured once recently — build in regular opportunities to be heard.";
  } else {
    status = "progressing";
    headline = "No recorded child voice in this period — capture wishes and feelings in key-work and reviews.";
  }

  return {
    key: "voice",
    label: "Voice & participation",
    status,
    direction,
    headline,
    metrics: [
      { label: "Voice captured (recent)", value: recentVoice },
      { label: "Voice captured (prior)", value: priorVoice },
      { label: "In LAC reviews", value: lac.recent.length },
      { label: "In key-work", value: kwVoice.recent.length },
    ],
    recentCount: recentVoice,
    priorCount: priorVoice,
    hasEvidence,
  };
}

// ── Synthesis ────────────────────────────────────────────────────────────────

function buildInsights(domains: OutcomeDomain[]): OutcomeInsight[] {
  const out: OutcomeInsight[] = [];

  for (const d of domains) {
    if (d.status === "needs_focus") {
      out.push({ key: `focus-${d.key}`, tone: "gap", text: `${d.label}: ${d.headline}` });
    }
  }
  for (const d of domains) {
    if (d.status !== "needs_focus" && d.direction === "declining" && d.hasEvidence) {
      out.push({
        key: `decline-${d.key}`,
        tone: "watch",
        text: `${d.label} is trending down compared with the previous period — worth a closer look.`,
      });
    }
  }
  for (const d of domains) {
    if (d.status === "on_track" && d.direction === "improving") {
      out.push({
        key: `win-${d.key}`,
        tone: "positive",
        text: `${d.label} is on track and improving — protect what's working.`,
      });
    }
  }
  return out;
}

// ── Public entry point — pure ────────────────────────────────────────────────

export function buildOutcomeIntelligence(input: OutcomeIntelligenceInput): OutcomeIntelligence {
  const windowDays = input.windowDays && input.windowDays > 0 ? input.windowDays : 90;

  // Only this child's records flow into each domain.
  const forChild = <T extends { child_id: string }>(rows: T[]): T[] =>
    (rows ?? []).filter((r) => r.child_id === input.childId);

  const scoped: OutcomeIntelligenceInput = {
    ...input,
    windowDays,
    keyWorkingSessions: forChild(input.keyWorkingSessions),
    incidents: forChild(input.incidents),
    missingEpisodes: forChild(input.missingEpisodes),
    educationRecords: forChild(input.educationRecords),
    positiveAchievements: forChild(input.positiveAchievements),
    familyTimeSessions: forChild(input.familyTimeSessions),
    returnInterviews: forChild(input.returnInterviews),
    lacReviews: forChild(input.lacReviews),
  };

  const domains: OutcomeDomain[] = [
    buildSafety(scoped, windowDays),
    buildEducation(scoped, windowDays),
    buildWellbeing(scoped, windowDays),
    buildRelationships(scoped, windowDays),
    buildVoice(scoped, windowDays),
  ];

  const domainsImproving = domains.filter((d) => d.direction === "improving").length;
  const domainsDeclining = domains.filter((d) => d.direction === "declining").length;
  const domainsOnTrack = domains.filter((d) => d.status === "on_track").length;
  const domainsNeedingFocus = domains.filter((d) => d.status === "needs_focus").length;

  const overallTrajectory: OutcomeDirection =
    domainsImproving > domainsDeclining
      ? "improving"
      : domainsDeclining > domainsImproving
        ? "declining"
        : "stable";

  const overallStatus: OutcomeStatus =
    domainsNeedingFocus > 0 ? "needs_focus" : domainsOnTrack >= 3 ? "on_track" : "progressing";

  const focusLabels = domains.filter((d) => d.status === "needs_focus").map((d) => d.label);
  const headline =
    domainsNeedingFocus > 0
      ? `${domainsOnTrack} of ${domains.length} outcome areas on track; focus needed on ${focusLabels.join(" and ")}.`
      : overallTrajectory === "improving"
        ? `${domainsImproving} of ${domains.length} outcome areas improving — this child's outcomes are moving in the right direction.`
        : domainsOnTrack >= 3
          ? `${domainsOnTrack} of ${domains.length} outcome areas on track — outcomes are stable and positive.`
          : "Outcomes are steady — keep building evidence across every area.";

  return {
    childId: input.childId,
    childName: input.childName,
    generatedAt: input.now,
    windowDays,
    overallTrajectory,
    overallStatus,
    headline,
    domainsImproving,
    domainsDeclining,
    domainsOnTrack,
    domainsNeedingFocus,
    domains,
    insights: buildInsights(domains),
  };
}
