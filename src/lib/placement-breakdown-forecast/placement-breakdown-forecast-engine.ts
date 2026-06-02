// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PLACEMENT BREAKDOWN FORECAST ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
//
// Unlike the current-state placement-stability engines, this engine is
// FORWARD-LOOKING. For each child currently in placement it:
//   1. Scores breakdown risk over the most recent 14 days AND the preceding
//      14 days, using the SAME weighted model.
//   2. Derives a per-week VELOCITY from the difference (the predictive core).
//   3. Projects an indicative number of days until risk crosses the critical
//      threshold, if the trajectory is escalating.
//   4. Explains every point with contributing factors + evidence counts, and
//      proposes regulatory-linked preventive actions.
//
// The projection is an EARLY-WARNING indicator, not a guarantee — it surfaces
// children whose risk is accelerating so managers can intervene before a
// placement breaks down. Every figure is transparent and reproducible.
//
// Regulatory: Children's Homes (England) Regs 2015 — Reg 11 (positive
// relationships / placement stability), Reg 12 (protection of children),
// Reg 8 (education), Reg 13/14 (leadership, care planning). SCCIF: "Overall
// experiences and progress of children" — stability of placements.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ───────────────────────────────────────────────────────────────

export interface ChildInput {
  id: string;
  name: string;
  date_of_birth: string;        // ISO date
  placement_start: string;      // ISO date
  placement_type: string;
  risk_flags: string[];
}

export interface IncidentInput {
  child_id: string;
  date: string;                 // ISO date of occurrence
  severity: "low" | "medium" | "high" | "critical";
}

export interface MissingInput {
  child_id: string;
  date_missing: string;         // ISO date
  risk_level: "low" | "medium" | "high" | "critical";
  return_interview_completed: boolean;
}

export interface RestraintInput {
  child_id: string;
  date: string;                 // ISO date
}

export interface SanctionInput {
  child_id: string;
  date: string;                 // ISO date
  direction: "reward" | "sanction";
  proportionate: boolean;
}

export interface BehaviourInput {
  child_id: string;
  date: string;                 // ISO date
  direction: "positive" | "concern";
  intensity: "low" | "moderate" | "high" | "critical";
}

export interface EducationInput {
  child_id: string;
  date: string;                 // ISO date
  attendance_status:
    | "present"
    | "absent_authorised"
    | "absent_unauthorised"
    | "late"
    | "excluded"
    | "part_day"
    | null;
}

export interface KeyworkingInput {
  child_id: string;
  date: string;                 // ISO date
  mood_before: number;          // 1-5
  mood_after: number;           // 1-5
}

export interface PlacementForecastInput {
  children: ChildInput[];
  incidents: IncidentInput[];
  missingEpisodes: MissingInput[];
  restraints: RestraintInput[];
  sanctions: SanctionInput[];
  behaviour: BehaviourInput[];
  education: EducationInput[];
  keyworking: KeyworkingInput[];
  today?: string; // ISO date — injectable for deterministic tests
}

// ── Output Types ──────────────────────────────────────────────────────────────

export type RiskBand = "stable" | "watch" | "elevated" | "critical";
export type RiskTrend = "escalating" | "stable" | "improving";

export interface ContributingFactor {
  factor: string;
  detail: string;
  points: number;        // capped contribution to the recent-window score
  evidence_count: number;
  rising: boolean;       // recent window contribution > prior window contribution
}

export interface RecommendedAction {
  priority: "urgent" | "high" | "routine";
  action: string;
  regulatory_link: string;
}

export interface ChildPlacementForecast {
  child_id: string;
  child_name: string;
  age: number;
  placement_type: string;
  days_in_placement: number;
  risk_score: number;                       // 0-100 (current / recent window)
  risk_band: RiskBand;
  trend: RiskTrend;
  velocity_per_week: number;                // signed score-points per week
  projected_days_to_critical: number | null;
  projected_date: string | null;            // ISO date or null
  contributing_factors: ContributingFactor[];
  protective_factors: string[];
  recommended_actions: RecommendedAction[];
}

export interface ForecastOverview {
  total_children: number;
  critical_count: number;
  elevated_count: number;
  watch_count: number;
  stable_count: number;
  escalating_count: number;
  improving_count: number;
  avg_risk_score: number;
  most_at_risk_child: string | null;
  earliest_projected_days: number | null;
  earliest_projected_child: string | null;
}

export interface ForecastAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  child_id?: string;
}

export interface AriaForecastInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface PlacementBreakdownForecastResult {
  overview: ForecastOverview;
  child_forecasts: ChildPlacementForecast[];
  alerts: ForecastAlert[];
  insights: AriaForecastInsight[];
}

// ── Scoring Constants (named for transparency & testability) ────────────────────

export const RECENT_WINDOW_DAYS = 14;
export const PRIOR_WINDOW_DAYS = 28; // prior window is days [14, 28)
export const CRITICAL_THRESHOLD = 75;
export const MAX_HORIZON_DAYS = 180;

export const INCIDENT_WEIGHT: Record<IncidentInput["severity"], number> = {
  low: 2,
  medium: 4,
  high: 7,
  critical: 10,
};
export const MISSING_WEIGHT: Record<MissingInput["risk_level"], number> = {
  low: 4,
  medium: 7,
  high: 10,
  critical: 14,
};
export const BEHAVIOUR_WEIGHT: Record<BehaviourInput["intensity"], number> = {
  low: 1,
  moderate: 2,
  high: 4,
  critical: 6,
};
export const RESTRAINT_WEIGHT = 6;
export const SANCTION_WEIGHT = 2;
export const SANCTION_DISPROPORTIONATE_EXTRA = 3;
export const MISSING_NO_RHI_EXTRA = 3; // safeguarding gap: no return home interview
export const EDU_UNAUTHORISED_WEIGHT = 3;
export const EDU_EXCLUDED_WEIGHT = 6;
export const KEYWORK_DISENGAGEMENT = 5;  // no key-working session in window
export const KEYWORK_MOOD_DECLINE_MAX = 6;

// Per-factor caps (applied identically to both windows so velocity stays honest)
export const CAP = {
  incidents: 28,
  missing: 28,
  restraints: 20,
  sanctions: 14,
  behaviour: 16,
  education: 14,
  keyworking: 11,
  standing: 15,
} as const;

const RISK_FLAG_PATTERN =
  /exploit|cse|cce|gang|missing|abscond|self.?harm|suicid|substance|drug|alcohol|placement|breakdown|disrupt|trafficking|county.?lines/i;

// ── Helpers ─────────────────────────────────────────────────────────────────

export function daysBetween(a: string, b: string): number {
  const msA = new Date(a).getTime();
  const msB = new Date(b).getTime();
  return Math.round(Math.abs(msB - msA) / 86_400_000);
}

/** Whole days since `date` relative to `today` (positive = in the past). */
export function daysAgo(date: string, today: string): number {
  const ms = new Date(today).getTime() - new Date(date).getTime();
  return Math.floor(ms / 86_400_000);
}

export function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function ageFromDob(dob: string, today: string): number {
  const days = daysBetween(dob, today);
  return Math.floor(days / 365.25);
}

export function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Events whose date falls in [minDaysAgo, maxDaysAgo) relative to today. */
function inWindow<T>(
  rows: T[],
  dateOf: (r: T) => string,
  today: string,
  minDaysAgo: number,
  maxDaysAgo: number,
): T[] {
  return rows.filter((r) => {
    const d = daysAgo(dateOf(r), today);
    return d >= minDaysAgo && d < maxDaysAgo;
  });
}

// ── Per-factor window scoring ───────────────────────────────────────────────

interface FactorScore {
  points: number;
  evidence: number;
}

function incidentScore(rows: IncidentInput[]): FactorScore {
  const points = rows.reduce((s, r) => s + (INCIDENT_WEIGHT[r.severity] ?? 0), 0);
  return { points: Math.min(points, CAP.incidents), evidence: rows.length };
}

function missingScore(rows: MissingInput[]): FactorScore {
  const points = rows.reduce(
    (s, r) =>
      s + (MISSING_WEIGHT[r.risk_level] ?? 0) + (r.return_interview_completed ? 0 : MISSING_NO_RHI_EXTRA),
    0,
  );
  return { points: Math.min(points, CAP.missing), evidence: rows.length };
}

function restraintScore(rows: RestraintInput[]): FactorScore {
  return { points: Math.min(rows.length * RESTRAINT_WEIGHT, CAP.restraints), evidence: rows.length };
}

function sanctionScore(rows: SanctionInput[]): FactorScore {
  const sanctions = rows.filter((r) => r.direction === "sanction");
  const points = sanctions.reduce(
    (s, r) => s + SANCTION_WEIGHT + (r.proportionate ? 0 : SANCTION_DISPROPORTIONATE_EXTRA),
    0,
  );
  return { points: Math.min(points, CAP.sanctions), evidence: sanctions.length };
}

function behaviourScore(rows: BehaviourInput[]): FactorScore {
  const concerns = rows.filter((r) => r.direction === "concern");
  const points = concerns.reduce((s, r) => s + (BEHAVIOUR_WEIGHT[r.intensity] ?? 0), 0);
  return { points: Math.min(points, CAP.behaviour), evidence: concerns.length };
}

function educationScore(rows: EducationInput[]): FactorScore {
  let points = 0;
  let evidence = 0;
  for (const r of rows) {
    if (r.attendance_status === "absent_unauthorised") {
      points += EDU_UNAUTHORISED_WEIGHT;
      evidence++;
    } else if (r.attendance_status === "excluded") {
      points += EDU_EXCLUDED_WEIGHT;
      evidence++;
    }
  }
  return { points: Math.min(points, CAP.education), evidence };
}

function keyworkingScore(rows: KeyworkingInput[], windowDays: number): FactorScore {
  // Disengagement: no session in the window is a relational-risk signal.
  // (Only count it as a signal once the child is expected to have sessions;
  // an empty window of zero days never happens here as windowDays >= 1.)
  let points = 0;
  if (rows.length === 0) {
    points += KEYWORK_DISENGAGEMENT;
  }
  // Mood decline within the window's sessions.
  const moodDelta = rows.reduce((s, r) => s + (r.mood_after - r.mood_before), 0);
  if (moodDelta < 0) {
    points += Math.min(Math.abs(moodDelta), KEYWORK_MOOD_DECLINE_MAX);
  }
  void windowDays;
  return { points: Math.min(points, CAP.keyworking), evidence: rows.length };
}

interface ChildData {
  incidents: IncidentInput[];
  missing: MissingInput[];
  restraints: RestraintInput[];
  sanctions: SanctionInput[];
  behaviour: BehaviourInput[];
  education: EducationInput[];
  keyworking: KeyworkingInput[];
}

interface WindowBreakdown {
  incidents: FactorScore;
  missing: FactorScore;
  restraints: FactorScore;
  sanctions: FactorScore;
  behaviour: FactorScore;
  education: FactorScore;
  keyworking: FactorScore;
  dynamicTotal: number;
}

function scoreWindow(
  data: ChildData,
  today: string,
  minDaysAgo: number,
  maxDaysAgo: number,
): WindowBreakdown {
  const windowDays = maxDaysAgo - minDaysAgo;
  const incidents = incidentScore(inWindow(data.incidents, (r) => r.date, today, minDaysAgo, maxDaysAgo));
  const missing = missingScore(inWindow(data.missing, (r) => r.date_missing, today, minDaysAgo, maxDaysAgo));
  const restraints = restraintScore(inWindow(data.restraints, (r) => r.date, today, minDaysAgo, maxDaysAgo));
  const sanctions = sanctionScore(inWindow(data.sanctions, (r) => r.date, today, minDaysAgo, maxDaysAgo));
  const behaviour = behaviourScore(inWindow(data.behaviour, (r) => r.date, today, minDaysAgo, maxDaysAgo));
  const education = educationScore(inWindow(data.education, (r) => r.date, today, minDaysAgo, maxDaysAgo));
  const keyworking = keyworkingScore(
    inWindow(data.keyworking, (r) => r.date, today, minDaysAgo, maxDaysAgo),
    windowDays,
  );
  const dynamicTotal =
    incidents.points +
    missing.points +
    restraints.points +
    sanctions.points +
    behaviour.points +
    education.points +
    keyworking.points;
  return { incidents, missing, restraints, sanctions, behaviour, education, keyworking, dynamicTotal };
}

/** Standing (static) vulnerability points — identical across windows, so they
 *  raise baseline risk but cancel out of the velocity calculation. */
function standingScore(child: ChildInput, daysInPlacement: number): { points: number; flags: number; early: boolean } {
  const matched = child.risk_flags.filter((f) => RISK_FLAG_PATTERN.test(f));
  let points = Math.min(matched.length * 2, 10);
  const early = daysInPlacement < 30;
  if (early) points += 5;
  else if (daysInPlacement < 90) points += 2;
  return { points: Math.min(points, CAP.standing), flags: matched.length, early };
}

function bandOf(score: number): RiskBand {
  if (score >= CRITICAL_THRESHOLD) return "critical";
  if (score >= 55) return "elevated";
  if (score >= 35) return "watch";
  return "stable";
}

function trendOf(velocityPerWeek: number): RiskTrend {
  if (velocityPerWeek >= 2) return "escalating";
  if (velocityPerWeek <= -2) return "improving";
  return "stable";
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computePlacementBreakdownForecast(
  input: PlacementForecastInput,
): PlacementBreakdownForecastResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);

  const child_forecasts: ChildPlacementForecast[] = input.children.map((child) => {
    const data: ChildData = {
      incidents: input.incidents.filter((r) => r.child_id === child.id),
      missing: input.missingEpisodes.filter((r) => r.child_id === child.id),
      restraints: input.restraints.filter((r) => r.child_id === child.id),
      sanctions: input.sanctions.filter((r) => r.child_id === child.id),
      behaviour: input.behaviour.filter((r) => r.child_id === child.id),
      education: input.education.filter((r) => r.child_id === child.id),
      keyworking: input.keyworking.filter((r) => r.child_id === child.id),
    };

    const daysInPlacement = daysBetween(child.placement_start, today);
    const standing = standingScore(child, daysInPlacement);

    const recent = scoreWindow(data, today, 0, RECENT_WINDOW_DAYS);
    const prior = scoreWindow(data, today, RECENT_WINDOW_DAYS, PRIOR_WINDOW_DAYS);

    const rawNow = standing.points + recent.dynamicTotal;
    const rawPrior = standing.points + prior.dynamicTotal;
    const risk_score = Math.round(clamp(rawNow, 0, 100));

    // Velocity: change in raw index over the ~2 weeks between window midpoints.
    const velocity_per_week = round1((rawNow - rawPrior) / 2);
    const trend = trendOf(velocity_per_week);
    const risk_band = bandOf(risk_score);

    // Forward projection to the critical threshold (only when escalating).
    let projected_days_to_critical: number | null = null;
    let projected_date: string | null = null;
    if (trend === "escalating") {
      if (risk_score >= CRITICAL_THRESHOLD) {
        projected_days_to_critical = 0;
        projected_date = today;
      } else {
        const days = Math.ceil(((CRITICAL_THRESHOLD - risk_score) / velocity_per_week) * 7);
        if (days <= MAX_HORIZON_DAYS) {
          projected_days_to_critical = Math.max(1, days);
          projected_date = addDays(today, projected_days_to_critical);
        }
      }
    }

    // ── Contributing factors (recent window) ──────────────────────────────
    const factorDefs: Array<{
      key: keyof Omit<WindowBreakdown, "dynamicTotal">;
      factor: string;
      detail: (fs: FactorScore) => string;
    }> = [
      { key: "incidents", factor: "Incident pressure", detail: (fs) => `${fs.evidence} incident${fs.evidence === 1 ? "" : "s"} in the last 14 days` },
      { key: "missing", factor: "Missing-from-care episodes", detail: (fs) => `${fs.evidence} missing episode${fs.evidence === 1 ? "" : "s"} in the last 14 days` },
      { key: "restraints", factor: "Physical interventions", detail: (fs) => `${fs.evidence} restraint${fs.evidence === 1 ? "" : "s"} in the last 14 days` },
      { key: "behaviour", factor: "Escalating behaviour", detail: (fs) => `${fs.evidence} behaviour concern${fs.evidence === 1 ? "" : "s"} logged in the last 14 days` },
      { key: "sanctions", factor: "Sanctions trajectory", detail: (fs) => `${fs.evidence} sanction${fs.evidence === 1 ? "" : "s"} in the last 14 days` },
      { key: "education", factor: "Education disengagement", detail: (fs) => `${fs.evidence} unauthorised absence/exclusion record${fs.evidence === 1 ? "" : "s"}` },
      { key: "keyworking", factor: "Relationship & engagement", detail: () => `Reduced key-working engagement or declining mood` },
    ];

    const contributing_factors: ContributingFactor[] = factorDefs
      .map(({ key, factor, detail }) => {
        const fs = recent[key];
        const priorFs = prior[key];
        return {
          factor,
          detail: detail(fs),
          points: Math.round(fs.points),
          evidence_count: fs.evidence,
          rising: fs.points > priorFs.points,
        };
      })
      .filter((f) => f.points > 0)
      .sort((a, b) => b.points - a.points);

    if (standing.points > 0) {
      contributing_factors.push({
        factor: "Standing vulnerabilities",
        detail:
          standing.early
            ? `${standing.flags} risk flag${standing.flags === 1 ? "" : "s"} + early placement (under 30 days)`
            : `${standing.flags} active risk flag${standing.flags === 1 ? "" : "s"}`,
        points: Math.round(standing.points),
        evidence_count: standing.flags,
        rising: false,
      });
    }

    // ── Protective factors ─────────────────────────────────────────────────
    const protective_factors: string[] = [];
    const recentIncidents = inWindow(data.incidents, (r) => r.date, today, 0, RECENT_WINDOW_DAYS);
    if (recentIncidents.length === 0) protective_factors.push("No recorded incidents in the last 14 days");

    const recentPositiveBehaviour = inWindow(data.behaviour, (r) => r.date, today, 0, RECENT_WINDOW_DAYS).filter(
      (b) => b.direction === "positive",
    );
    if (recentPositiveBehaviour.length > 0)
      protective_factors.push(`${recentPositiveBehaviour.length} positive behaviour entr${recentPositiveBehaviour.length === 1 ? "y" : "ies"} recently`);

    const recentMissing = inWindow(data.missing, (r) => r.date_missing, today, 0, PRIOR_WINDOW_DAYS);
    if (recentMissing.length > 0 && recentMissing.every((m) => m.return_interview_completed))
      protective_factors.push("Return home interviews completed for all recent missing episodes");

    const kw30 = inWindow(data.keyworking, (r) => r.date, today, 0, 30);
    if (kw30.length >= 2) protective_factors.push("Regular key-working engagement maintained");
    const moodDelta30 = kw30.reduce((s, r) => s + (r.mood_after - r.mood_before), 0);
    if (kw30.length > 0 && moodDelta30 > 0) protective_factors.push("Improving mood through key-working sessions");

    if (daysInPlacement > 365) protective_factors.push("Settled placement (over 12 months)");

    const recentRewards = inWindow(data.sanctions, (r) => r.date, today, 0, RECENT_WINDOW_DAYS).filter(
      (s) => s.direction === "reward",
    ).length;
    const recentSanctions = inWindow(data.sanctions, (r) => r.date, today, 0, RECENT_WINDOW_DAYS).filter(
      (s) => s.direction === "sanction",
    ).length;
    if (recentRewards > 0 && recentRewards >= recentSanctions)
      protective_factors.push("Rewards outweigh sanctions (positive reinforcement)");

    // ── Recommended actions ────────────────────────────────────────────────
    const recommended_actions = buildActions(risk_band, trend, recent, prior, standing);

    return {
      child_id: child.id,
      child_name: child.name,
      age: ageFromDob(child.date_of_birth, today),
      placement_type: child.placement_type,
      days_in_placement: daysInPlacement,
      risk_score,
      risk_band,
      trend,
      velocity_per_week,
      projected_days_to_critical,
      projected_date,
      contributing_factors,
      protective_factors,
      recommended_actions,
    };
  });

  // Order most-urgent first: critical-soonest, then highest score.
  child_forecasts.sort((a, b) => {
    const ah = a.projected_days_to_critical ?? Number.POSITIVE_INFINITY;
    const bh = b.projected_days_to_critical ?? Number.POSITIVE_INFINITY;
    if (ah !== bh) return ah - bh;
    return b.risk_score - a.risk_score;
  });

  const overview = buildOverview(child_forecasts);
  const alerts = buildAlerts(child_forecasts);
  const insights = buildInsights(child_forecasts, overview);

  return { overview, child_forecasts, alerts, insights };
}

// ── Action builder ────────────────────────────────────────────────────────

function buildActions(
  band: RiskBand,
  trend: RiskTrend,
  recent: WindowBreakdown,
  prior: WindowBreakdown,
  standing: { points: number },
): RecommendedAction[] {
  const actions: RecommendedAction[] = [];

  if (band === "critical") {
    actions.push({
      priority: "urgent",
      action: "Convene a placement-stability (disruption prevention) meeting within 48 hours with the social worker and IRO",
      regulatory_link: "Reg 11 — positive relationships; SCCIF — stability of placements",
    });
  } else if (band === "elevated" || trend === "escalating") {
    actions.push({
      priority: "high",
      action: "Add to the next placement planning review and agree a stabilisation plan with named owners",
      regulatory_link: "Reg 14 — care planning",
    });
  }

  if (recent.missing.points > 0) {
    actions.push({
      priority: recent.missing.points >= prior.missing.points ? "high" : "routine",
      action: "Review the missing-from-care risk assessment and ensure every return home interview is completed within 72 hours",
      regulatory_link: "Statutory guidance: children who run away or go missing; Reg 12",
    });
  }
  if (recent.restraints.points > 0) {
    actions.push({
      priority: recent.restraints.points >= prior.restraints.points ? "high" : "routine",
      action: "Review the behaviour support plan and de-escalation strategies; consider therapeutic / CAMHS input",
      regulatory_link: "Reg 11 / Reg 35 — behaviour management & restraint",
    });
  }
  if (recent.education.points > 0) {
    actions.push({
      priority: "high",
      action: "Engage the Virtual School and review the PEP; address unauthorised absence and any exclusion risk",
      regulatory_link: "Reg 8 — promoting educational achievement",
    });
  }
  if (recent.keyworking.points > 0) {
    actions.push({
      priority: "high",
      action: "Increase key-working frequency and review the key-worker match to strengthen the child's primary relationship",
      regulatory_link: "Reg 11 — positive relationships",
    });
  }
  if (recent.sanctions.points > prior.sanctions.points && recent.sanctions.points > 0) {
    actions.push({
      priority: "routine",
      action: "Review sanctions for proportionality and ensure no blanket measures are in use",
      regulatory_link: "Reg 19 — no deprivation of contact / blanket sanctions",
    });
  }

  if (actions.length === 0) {
    if (standing.points > 0) {
      actions.push({
        priority: "routine",
        action: "Maintain current support and monitor standing risk factors at the next key-working session",
        regulatory_link: "Reg 13 — leadership and management oversight",
      });
    } else {
      actions.push({
        priority: "routine",
        action: "Continue current care plan; placement is stable",
        regulatory_link: "Reg 14 — care planning",
      });
    }
  }

  return actions;
}

// ── Overview builder ────────────────────────────────────────────────────────

function buildOverview(forecasts: ChildPlacementForecast[]): ForecastOverview {
  const critical = forecasts.filter((f) => f.risk_band === "critical");
  const elevated = forecasts.filter((f) => f.risk_band === "elevated");
  const watch = forecasts.filter((f) => f.risk_band === "watch");
  const stable = forecasts.filter((f) => f.risk_band === "stable");
  const escalating = forecasts.filter((f) => f.trend === "escalating");
  const improving = forecasts.filter((f) => f.trend === "improving");

  const withHorizon = forecasts
    .filter((f) => f.projected_days_to_critical != null)
    .sort((a, b) => (a.projected_days_to_critical! - b.projected_days_to_critical!));

  const mostAtRisk = [...forecasts].sort((a, b) => b.risk_score - a.risk_score)[0];

  return {
    total_children: forecasts.length,
    critical_count: critical.length,
    elevated_count: elevated.length,
    watch_count: watch.length,
    stable_count: stable.length,
    escalating_count: escalating.length,
    improving_count: improving.length,
    avg_risk_score: Math.round(average(forecasts.map((f) => f.risk_score))),
    most_at_risk_child: mostAtRisk && mostAtRisk.risk_score > 0 ? mostAtRisk.child_name : null,
    earliest_projected_days: withHorizon[0]?.projected_days_to_critical ?? null,
    earliest_projected_child: withHorizon[0]?.child_name ?? null,
  };
}

// ── Alerts builder ────────────────────────────────────────────────────────

function buildAlerts(forecasts: ChildPlacementForecast[]): ForecastAlert[] {
  const alerts: ForecastAlert[] = [];

  for (const f of forecasts) {
    if (f.risk_band === "critical") {
      alerts.push({
        severity: "critical",
        child_id: f.child_id,
        message: `${f.child_name}'s placement breakdown risk is critical (${f.risk_score}/100${
          f.trend === "escalating" ? ", still rising" : ""
        }) — initiate disruption-prevention planning now`,
      });
    } else if (f.trend === "escalating" && f.projected_days_to_critical != null && f.projected_days_to_critical <= 14) {
      alerts.push({
        severity: "critical",
        child_id: f.child_id,
        message: `${f.child_name}'s risk is accelerating — projected to reach critical in ~${f.projected_days_to_critical} day${
          f.projected_days_to_critical === 1 ? "" : "s"
        }`,
      });
    }
  }

  for (const f of forecasts) {
    if (f.risk_band === "elevated" && f.trend === "escalating" && (f.projected_days_to_critical ?? 99) > 14) {
      alerts.push({
        severity: "high",
        child_id: f.child_id,
        message: `${f.child_name}'s risk is elevated and rising (${f.risk_score}/100, +${f.velocity_per_week}/week) — agree a stabilisation plan`,
      });
    }
  }

  for (const f of forecasts) {
    if (f.risk_band === "watch" && f.trend === "escalating") {
      alerts.push({
        severity: "medium",
        child_id: f.child_id,
        message: `${f.child_name}'s risk is on a watch footing and rising — monitor closely and review at the next planning meeting`,
      });
    }
  }

  return alerts;
}

// ── ARIA insights builder ───────────────────────────────────────────────────

function buildInsights(
  forecasts: ChildPlacementForecast[],
  overview: ForecastOverview,
): AriaForecastInsight[] {
  const insights: AriaForecastInsight[] = [];

  if (overview.critical_count > 0 || (overview.earliest_projected_days != null && overview.earliest_projected_days <= 14)) {
    const soonest =
      overview.earliest_projected_child && overview.earliest_projected_days != null
        ? ` ${overview.earliest_projected_child}'s trajectory projects to critical in ~${overview.earliest_projected_days} days.`
        : "";
    insights.push({
      severity: "critical",
      text: `${overview.critical_count} placement${overview.critical_count === 1 ? "" : "s"} at critical breakdown risk.${soonest} Placement stability is a core measure under the SCCIF and a disrupted placement is deeply harmful to a child — convene disruption-prevention planning and notify the placing authority.`,
    });
  }

  if (overview.escalating_count > 0) {
    const names = forecasts
      .filter((f) => f.trend === "escalating")
      .slice(0, 4)
      .map((f) => f.child_name)
      .join(", ");
    insights.push({
      severity: "warning",
      text: `${overview.escalating_count} child${overview.escalating_count === 1 ? "" : "ren"} showing an accelerating breakdown trajectory (${names}). Early, relationship-focused intervention now is far more effective — and less traumatic — than crisis response after a placement fails.`,
    });
  }

  if (forecasts.length > 0 && overview.critical_count === 0 && overview.elevated_count === 0 && overview.escalating_count === 0) {
    insights.push({
      severity: "positive",
      text: `All ${forecasts.length} current placements are stable or improving with no accelerating risk. Consistent relationships and proactive support are protecting placement stability — a key indicator of good outcomes under the SCCIF.`,
    });
  }

  if (overview.improving_count > 0) {
    insights.push({
      severity: "positive",
      text: `${overview.improving_count} child${overview.improving_count === 1 ? "'s placement is" : "ren's placements are"} showing a de-escalating risk trajectory — evidence that current interventions are working. Record what is helping so it can be sustained and replicated.`,
    });
  }

  return insights;
}
