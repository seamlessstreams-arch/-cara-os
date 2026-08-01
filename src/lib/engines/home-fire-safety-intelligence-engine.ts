// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME FIRE SAFETY INTELLIGENCE ENGINE
// Pure deterministic engine: fire drills, evacuations, equipment checks,
// response times, child participation, and regulatory compliance.
// CHR 2015 Reg 25: "The premises standard — fire safety."
// SCCIF: "The home is safe. Fire precautions are adequate."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface FireDrillInput {
  id: string;
  date: string;           // YYYY-MM-DD
  time: string;           // HH:MM
  drill_type: string;     // fire_drill | evacuation | lockdown | bomb_threat | flood | equipment_check
  evacuation_time_seconds: number | null;
  result: string;         // satisfactory | issues_identified | failed | not_completed
  all_present: boolean;
  children_present: string[];
  staff_present: string[];
  issues: string;
  actions_taken: string;
  next_drill_due: string; // YYYY-MM-DD
  conducted_by: string;
  notes: string;
}

export interface HomeFireSafetyInput {
  today: string;          // YYYY-MM-DD
  fire_drills: FireDrillInput[];
  total_children: number;
  total_staff: number;
}

// ── Output Types ────────────────────────────────────────────────────────────

export type FireSafetyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface DrillFrequencyProfile {
  total_drills: number;
  fire_drills: number;
  evacuations: number;
  equipment_checks: number;
  other_drills: number;
  drills_last_30_days: number;
  drills_last_90_days: number;
  next_drill_overdue: boolean;
}

export interface ResultProfile {
  satisfactory: number;
  issues_identified: number;
  failed: number;
  not_completed: number;
  satisfactory_rate: number | null;
  issues_actioned: number; // issues with actions_taken populated
  issue_response_rate: number | null;
}

export interface EvacuationProfile {
  total_evacuations: number;
  avg_evacuation_time: number | null; // seconds
  fastest_evacuation: number | null;
  slowest_evacuation: number | null;
  within_target: number;       // <= 120 seconds (2 minutes)
  target_compliance_rate: number | null;
}

export interface ParticipationProfile {
  drills_all_present: number;
  all_present_rate: number | null;
  avg_children_per_drill: number | null;
  avg_staff_per_drill: number | null;
  night_drills: number;       // time >= 20:00 or < 06:00
  daytime_drills: number;
}

export interface Insight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface Recommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string | null;
}

export interface HomeFireSafetyResult {
  fire_safety_rating: FireSafetyRating;
  fire_safety_score: number | null;
  headline: string;
  frequency: DrillFrequencyProfile;
  results: ResultProfile;
  evacuation: EvacuationProfile;
  participation: ParticipationProfile;
  strengths: string[];
  concerns: string[];
  recommendations: Recommendation[];
  insights: Insight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

function ratingFromScore(score: number): FireSafetyRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function isNightTime(time: string): boolean {
  const hour = parseInt(time.split(":")[0], 10);
  return hour >= 20 || hour < 6;
}

const EVACUATION_TARGET_SECONDS = 120;

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeFireSafety(
  input: HomeFireSafetyInput,
): HomeFireSafetyResult {
  const { today, fire_drills, total_children, total_staff } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  if ((total_children === 0 && total_staff === 0) || fire_drills.length === 0) {
    return {
      fire_safety_rating: "insufficient_data",
      fire_safety_score: 0,
      headline: total_children === 0 && total_staff === 0
        ? "No staff or children registered."
        : "No fire drills or safety checks recorded.",
      frequency: {
        total_drills: 0, fire_drills: 0, evacuations: 0, equipment_checks: 0,
        other_drills: 0, drills_last_30_days: 0, drills_last_90_days: 0,
        next_drill_overdue: false,
      },
      results: {
        satisfactory: 0, issues_identified: 0, failed: 0, not_completed: 0,
        satisfactory_rate: 0, issues_actioned: 0, issue_response_rate: 0,
      },
      evacuation: {
        total_evacuations: 0, avg_evacuation_time: 0, fastest_evacuation: 0,
        slowest_evacuation: 0, within_target: 0, target_compliance_rate: 0,
      },
      participation: {
        drills_all_present: 0, all_present_rate: 0, avg_children_per_drill: 0,
        avg_staff_per_drill: 0, night_drills: 0, daytime_drills: 0,
      },
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  const todayDate = today.slice(0, 10);

  // ── Drill Frequency Profile ───────────────────────────────────────────
  const fireDrillsOnly = fire_drills.filter((d) => d.drill_type === "fire_drill");
  const evacuations = fire_drills.filter((d) => d.drill_type === "evacuation");
  const equipmentChecks = fire_drills.filter((d) => d.drill_type === "equipment_check");
  const otherDrills = fire_drills.filter(
    (d) => !["fire_drill", "evacuation", "equipment_check"].includes(d.drill_type),
  );

  const last30 = fire_drills.filter(
    (d) => daysBetween(d.date, todayDate) >= 0 && daysBetween(d.date, todayDate) <= 30,
  );
  const last90 = fire_drills.filter(
    (d) => daysBetween(d.date, todayDate) >= 0 && daysBetween(d.date, todayDate) <= 90,
  );

  // Check if next drill is overdue (any fire_drill/evacuation with next_drill_due past today)
  const drillsWithNext = fire_drills.filter(
    (d) =>
      (d.drill_type === "fire_drill" || d.drill_type === "evacuation") &&
      d.next_drill_due &&
      d.next_drill_due.length >= 10,
  );
  const latestDrillDue = drillsWithNext.length > 0
    ? drillsWithNext.sort((a, b) => b.date.localeCompare(a.date))[0]
    : null;
  const nextDrillOverdue = latestDrillDue
    ? daysBetween(latestDrillDue.next_drill_due, todayDate) > 0
    : false;

  const frequency: DrillFrequencyProfile = {
    total_drills: fire_drills.length,
    fire_drills: fireDrillsOnly.length,
    evacuations: evacuations.length,
    equipment_checks: equipmentChecks.length,
    other_drills: otherDrills.length,
    drills_last_30_days: last30.length,
    drills_last_90_days: last90.length,
    next_drill_overdue: nextDrillOverdue,
  };

  // ── Result Profile ────────────────────────────────────────────────────
  const resultCounts = { satisfactory: 0, issues_identified: 0, failed: 0, not_completed: 0 };
  for (const d of fire_drills) {
    const r = d.result as keyof typeof resultCounts;
    if (r in resultCounts) resultCounts[r]++;
  }

  const withIssues = fire_drills.filter(
    (d) => d.result === "issues_identified" || d.result === "failed",
  );
  const issuesActioned = withIssues.filter(
    (d) => d.actions_taken && d.actions_taken.trim().length > 0,
  );

  const results: ResultProfile = {
    ...resultCounts,
    satisfactory_rate: pct(resultCounts.satisfactory, fire_drills.length),
    issues_actioned: issuesActioned.length,
    issue_response_rate: pct(issuesActioned.length, withIssues.length),
  };

  // ── Evacuation Profile ────────────────────────────────────────────────
  const evacuationTimes = fire_drills
    .filter((d) => d.evacuation_time_seconds !== null && d.evacuation_time_seconds > 0)
    .map((d) => d.evacuation_time_seconds as number);

  const withinTarget = evacuationTimes.filter((t) => t <= EVACUATION_TARGET_SECONDS);

  const evacuation: EvacuationProfile = {
    total_evacuations: evacuationTimes.length,
    avg_evacuation_time:
      evacuationTimes.length > 0
        ? Math.round(evacuationTimes.reduce((s, n) => s + n, 0) / evacuationTimes.length)
        : null,
    fastest_evacuation: evacuationTimes.length > 0 ? Math.min(...evacuationTimes) : null,
    slowest_evacuation: evacuationTimes.length > 0 ? Math.max(...evacuationTimes) : null,
    within_target: withinTarget.length,
    target_compliance_rate: pct(withinTarget.length, evacuationTimes.length),
  };

  // ── Participation Profile ─────────────────────────────────────────────
  // Only count drills (not equipment checks) for participation
  const participationDrills = fire_drills.filter(
    (d) => d.drill_type !== "equipment_check",
  );
  const allPresent = participationDrills.filter((d) => d.all_present);
  const childCounts = participationDrills.map((d) => d.children_present.length);
  const staffCounts = participationDrills.map((d) => d.staff_present.length);

  const nightDrills = participationDrills.filter((d) => isNightTime(d.time));
  const daytimeDrills = participationDrills.filter((d) => !isNightTime(d.time));

  const participation: ParticipationProfile = {
    drills_all_present: allPresent.length,
    all_present_rate: pct(allPresent.length, participationDrills.length),
    avg_children_per_drill:
      childCounts.length > 0
        ? Math.round((childCounts.reduce((s, n) => s + n, 0) / childCounts.length) * 10) / 10
        : null,
    avg_staff_per_drill:
      staffCounts.length > 0
        ? Math.round((staffCounts.reduce((s, n) => s + n, 0) / staffCounts.length) * 10) / 10
        : null,
    night_drills: nightDrills.length,
    daytime_drills: daytimeDrills.length,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  const BASE_SCORE = 52;
  let score = BASE_SCORE;

  // mod1: Drill frequency (±4)
  const mod1 =
    frequency.drills_last_30_days >= 2 ? 4 :
    frequency.drills_last_30_days >= 1 ? 2 :
    frequency.drills_last_90_days >= 2 ? 0 : -4;
  score += mod1;

  // mod2: Results quality (±4)
  const mod2 =
    resultCounts.failed > 0 ? -4 :
    (results.satisfactory_rate ?? 0) >= 80 ? 4 :
    (results.satisfactory_rate ?? 0) >= 60 ? 2 :
    (results.satisfactory_rate ?? 0) >= 40 ? 0 : -2;
  score += mod2;

  // mod3: Issue response (±3)
  const mod3 =
    withIssues.length === 0 ? 2 :
    (results.issue_response_rate ?? 0) >= 100 ? 3 :
    (results.issue_response_rate ?? 0) >= 75 ? 1 : -3;
  score += mod3;

  // mod4: Evacuation time compliance (±4)
  const mod4 =
    evacuationTimes.length === 0 ? 0 :
    (evacuation.target_compliance_rate ?? 0) >= 90 ? 4 :
    (evacuation.target_compliance_rate ?? 0) >= 70 ? 2 :
    (evacuation.target_compliance_rate ?? 0) >= 50 ? 0 : -4;
  score += mod4;

  // mod5: Participation — all present (±3)
  const mod5 =
    participationDrills.length === 0 ? 0 :
    (participation.all_present_rate ?? 0) >= 80 ? 3 :
    (participation.all_present_rate ?? 0) >= 50 ? 1 :
    (participation.all_present_rate ?? 0) >= 25 ? 0 : -3;
  score += mod5;

  // mod6: Night drill coverage (±3)
  const mod6 =
    participation.night_drills >= 2 ? 3 :
    participation.night_drills >= 1 ? 1 : -2;
  score += mod6;

  // mod7: Equipment checks (±3)
  const mod7 =
    equipmentChecks.length >= 2 ? 3 :
    equipmentChecks.length >= 1 ? 1 : -2;
  score += mod7;

  // mod8: Overdue drill (±4)
  const mod8 = nextDrillOverdue ? -4 : 4;
  score += mod8;

  // Clamp
  score = Math.max(0, Math.min(100, score));

  const fire_safety_rating = ratingFromScore(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (frequency.drills_last_30_days >= 2)
    strengths.push(`${frequency.drills_last_30_days} drills/checks in last 30 days — excellent frequency.`);
  if ((results.satisfactory_rate ?? 0) >= 80 && fire_drills.length > 1)
    strengths.push(`${results.satisfactory_rate}% of drills achieved satisfactory result.`);
  if ((results.issue_response_rate ?? 0) >= 100 && withIssues.length > 0)
    strengths.push("All identified issues have documented actions — proactive safety management.");
  if ((evacuation.target_compliance_rate ?? 0) >= 90 && evacuationTimes.length > 0)
    strengths.push(`${evacuation.target_compliance_rate}% of evacuations within ${EVACUATION_TARGET_SECONDS}s target — excellent response times.`);
  if (participation.night_drills >= 1)
    strengths.push(`${participation.night_drills} night drill(s) conducted — testing realistic scenarios.`);
  if (equipmentChecks.length >= 2)
    strengths.push(`${equipmentChecks.length} equipment checks completed — regular maintenance.`);
  if (!nextDrillOverdue)
    strengths.push("Next fire drill is scheduled and not overdue.");

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (resultCounts.failed > 0)
    concerns.push(`${resultCounts.failed} drill(s) failed — immediate remedial action required.`);
  if (nextDrillOverdue)
    concerns.push("The next fire drill is overdue — schedule immediately.");
  if (frequency.drills_last_90_days < 2)
    concerns.push("Fewer than 2 drills in the last 90 days — Reg 25 requires regular fire drills.");
  if (participation.night_drills === 0 && participationDrills.length > 0)
    concerns.push("No night drills conducted — SCCIF expects drills at varied times including night.");
  if (evacuationTimes.length > 0 && (evacuation.target_compliance_rate ?? 0) < 70)
    concerns.push(`Only ${evacuation.target_compliance_rate}% of evacuations met the ${EVACUATION_TARGET_SECONDS}s target.`);
  if (withIssues.length > 0 && (results.issue_response_rate ?? 0) < 100)
    concerns.push(`${withIssues.length - issuesActioned.length} issue(s) identified but not actioned.`);
  if (equipmentChecks.length === 0)
    concerns.push("No fire equipment checks recorded — extinguishers, alarms, and lighting must be checked regularly.");

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: Recommendation[] = [];
  let rank = 1;

  if (nextDrillOverdue)
    recommendations.push({
      rank: rank++,
      recommendation: "Conduct the overdue fire drill immediately and update the schedule.",
      urgency: "immediate",
      regulatory_ref: "Reg 25",
    });

  if (resultCounts.failed > 0)
    recommendations.push({
      rank: rank++,
      recommendation: `Investigate and remediate the ${resultCounts.failed} failed drill(s). Document corrective actions.`,
      urgency: "immediate",
      regulatory_ref: "Reg 25",
    });

  if (participation.night_drills === 0 && participationDrills.length > 0)
    recommendations.push({
      rank: rank++,
      recommendation: "Schedule a night fire drill to test evacuation during sleeping hours.",
      urgency: "soon",
      regulatory_ref: "SCCIF",
    });

  if (equipmentChecks.length === 0)
    recommendations.push({
      rank: rank++,
      recommendation: "Conduct a fire equipment check — extinguishers, smoke detectors, emergency lighting.",
      urgency: "soon",
      regulatory_ref: "Reg 25",
    });

  if (withIssues.length > issuesActioned.length)
    recommendations.push({
      rank: rank++,
      recommendation: `Document actions for ${withIssues.length - issuesActioned.length} unresolved issue(s) from previous drills.`,
      urgency: "soon",
      regulatory_ref: null,
    });

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: Insight[] = [];

  if (resultCounts.failed > 0)
    insights.push({
      text: `${resultCounts.failed} fire drill(s) resulted in failure. Ofsted and the fire authority will expect immediate corrective action and evidence of learning.`,
      severity: "critical",
    });

  if (nextDrillOverdue)
    insights.push({
      text: "The next fire drill is overdue. Reg 25 requires regular fire precautions — an overdue drill is a compliance gap Ofsted will note.",
      severity: "critical",
    });

  if (participation.night_drills >= 1 && (results.issue_response_rate ?? 0) >= 100)
    insights.push({
      text: `Night drills conducted and all issues actioned — this demonstrates thorough fire safety management that goes beyond minimum compliance.`,
      severity: "positive",
    });

  if (evacuation.avg_evacuation_time > 0 && evacuation.avg_evacuation_time <= EVACUATION_TARGET_SECONDS)
    insights.push({
      text: `Average evacuation time is ${evacuation.avg_evacuation_time} seconds (target: ${EVACUATION_TARGET_SECONDS}s). Children and staff respond effectively to fire alarms.`,
      severity: "positive",
    });

  if (evacuation.slowest_evacuation > EVACUATION_TARGET_SECONDS && evacuation.total_evacuations > 0)
    insights.push({
      text: `Slowest evacuation was ${evacuation.slowest_evacuation} seconds — above the ${EVACUATION_TARGET_SECONDS}s target. Review PEEPs and consider whether additional support is needed.`,
      severity: "warning",
    });

  // ── Headline ──────────────────────────────────────────────────────────
  const headline =
    fire_safety_rating === "outstanding"
      ? `Excellent fire safety: ${frequency.total_drills} drills/checks, ${results.satisfactory_rate}% satisfactory, avg evacuation ${evacuation.avg_evacuation_time}s.`
      : fire_safety_rating === "good"
        ? `Good fire safety framework with ${frequency.drills_last_90_days} drills in 90 days.`
        : fire_safety_rating === "adequate"
          ? `Fire safety in place but ${concerns.length > 0 ? concerns.length + " concern(s) noted" : "needs strengthening"}.`
          : `Fire safety requires urgent attention — ${resultCounts.failed} failed drill(s), ${nextDrillOverdue ? "next drill overdue" : "low frequency"}.`;

  return {
    fire_safety_rating,
    fire_safety_score: score,
    headline,
    frequency,
    results,
    evacuation,
    participation,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
