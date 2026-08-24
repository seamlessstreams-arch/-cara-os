// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME WELFARE CHECK COMPLIANCE INTELLIGENCE ENGINE
// Pure deterministic engine: overnight welfare check rounds, child completion
// rates, building security, distress response, fire exit compliance,
// environmental safety, and documentation quality.
//
// No DB calls, no side effects, no LLM calls.
// Injectable `today` parameter for deterministic testing.
//
// Regulatory: CHR 2015 Reg 12 (duty of care), Reg 6 (quality of care),
// Reg 25 (premises). SCCIF: "Helped and protected",
// "Experiences and progress of children". NMS 7.9, 10.1.
// ══════════════════════════════════════════════════════════════════════════════

import { above, below, formatRate, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface WelfareCheckRecordInput {
  id: string;
  round_date: string;            // ISO date YYYY-MM-DD
  round_time: string;            // "22:00"
  shift_type: string;            // "sleep_in" | "waking_night"
  checks_completed: number;      // how many children checked this round
  expected_checks: number;       // how many children should have been checked
  all_children_checked: boolean;
  building_secure: boolean;
  fire_exits_clear: boolean;
  external_doors_locked: boolean;
  alarm_set: boolean;
  distressed_count: number;      // how many children were distressed/upset
  all_distressed_actioned: boolean; // notes provided for all distressed
  has_notes: boolean;            // at least some notes in the round
  windows_secure_count: number;
  windows_total: number;
  temperature_issues_count: number; // too_warm or too_cold
}

export interface WelfareCheckComplianceInput {
  today: string;
  total_children: number;
  rounds: WelfareCheckRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type WelfareCheckComplianceRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface WelfareRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  domain: string;
  regulatory_ref: string;
}

export interface WelfareInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface WelfareCheckComplianceResult {
  welfare_rating: WelfareCheckComplianceRating;
  welfare_score: number;
  headline: string;
  total_rounds: number;
  rounds_last_90_days: number;
  /** null when the population is empty — nothing measured, not 0%. */
  check_completion_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  building_security_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  fire_exit_compliance_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  distress_response_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  window_security_rate: number | null;
  temperature_issue_count: number;
  /** null when the population is empty — nothing measured, not 0%. */
  documentation_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: WelfareRecommendation[];
  insights: WelfareInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeWelfareCheckCompliance(
  input: WelfareCheckComplianceInput,
): WelfareCheckComplianceResult {
  const { today, total_children, rounds } = input;

  // ── Special case: no children ──────────────────────────────────────────
  if (total_children === 0) {
    return {
      welfare_rating: "insufficient_data",
      welfare_score: 0,
      headline: "No children registered — welfare check analysis unavailable.",
      total_rounds: rounds.length,
      rounds_last_90_days: 0,
      check_completion_rate: null,
      building_security_rate: null,
      fire_exit_compliance_rate: null,
      distress_response_rate: null,
      window_security_rate: null,
      temperature_issue_count: 0,
      documentation_rate: null,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Filter to last 90 days ─────────────────────────────────────────────
  const recent = rounds.filter((r) => {
    const d = daysBetween(r.round_date, today);
    return d >= 0 && d <= 90;
  });

  const totalRounds = rounds.length;
  const roundsLast90 = recent.length;

  // ── Special case: 0 rounds with children present ───────────────────────
  if (roundsLast90 === 0) {
    return {
      welfare_rating: "inadequate",
      welfare_score: 30,
      headline: "No welfare check rounds recorded — serious compliance gap.",
      total_rounds: totalRounds,
      rounds_last_90_days: 0,
      check_completion_rate: null,
      building_security_rate: null,
      fire_exit_compliance_rate: null,
      distress_response_rate: null,
      window_security_rate: null,
      temperature_issue_count: 0,
      documentation_rate: null,
      strengths: [],
      concerns: ["No welfare check rounds recorded in the analysis period."],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement nightly welfare check rounds immediately. Every child must be physically checked during overnight hours with observations documented.",
          urgency: "immediate",
          domain: "compliance",
          regulatory_ref: "CHR 2015 Reg 12",
        },
      ],
      insights: [
        {
          severity: "critical",
          text: "Zero welfare check rounds recorded. This is a fundamental safeguarding failure — Ofsted will expect documented evidence that children are checked and safe overnight. Immediate action required under Reg 12 and NMS 7.9.",
        },
      ],
    };
  }

  // ── Compute rates ──────────────────────────────────────────────────────
  const allCheckedCount = recent.filter((r) => r.all_children_checked).length;
  const checkCompletionRate = rate(allCheckedCount, roundsLast90);

  const secureCount = recent.filter(
    (r) => r.building_secure && r.external_doors_locked && r.alarm_set,
  ).length;
  const buildingSecurityRate = rate(secureCount, roundsLast90);

  const fireExitCount = recent.filter((r) => r.fire_exits_clear).length;
  const fireExitComplianceRate = rate(fireExitCount, roundsLast90);

  // Distress response: only rounds where distressed_count > 0
  const roundsWithDistress = recent.filter((r) => r.distressed_count > 0);
  const distressActionedCount = roundsWithDistress.filter(
    (r) => r.all_distressed_actioned,
  ).length;
  const distressResponseRate = rate(
    distressActionedCount,
    roundsWithDistress.length,
  );

  // Window security across all rounds
  const totalWindowsSecure = recent.reduce(
    (sum, r) => sum + r.windows_secure_count,
    0,
  );
  const totalWindows = recent.reduce((sum, r) => sum + r.windows_total, 0);
  const windowSecurityRate = rate(totalWindowsSecure, totalWindows);

  // Temperature issues total
  const temperatureIssueCount = recent.reduce(
    (sum, r) => sum + r.temperature_issues_count,
    0,
  );

  // Documentation rate
  const notesCount = recent.filter((r) => r.has_notes).length;
  const documentationRate = rate(notesCount, roundsLast90);

  // ── Frequency: rounds per night for last 30 days ───────────────────────
  const nightsLast30 = new Set<string>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    nightsLast30.add(d.toISOString().slice(0, 10));
  }
  const roundsInLast30 = recent.filter((r) => nightsLast30.has(r.round_date));
  const nightsWithRounds = new Set(roundsInLast30.map((r) => r.round_date));
  const frequencySufficient = nightsWithRounds.size >= 20; // ~2/3 of nights
  const frequencyOk = nightsWithRounds.size >= 10;         // ~1/3 of nights

  // ── Scoring: base 52 + 6 modifiers ─────────────────────────────────────
  const BASE = 52;
  let score = BASE;

  // Modifier 1: Check completion rate (all_children_checked compliance)
  if (meets(checkCompletionRate, 98)) score += 6;
  else if (meets(checkCompletionRate, 90)) score += 3;
  else if (below(checkCompletionRate, 50)) score -= 8; // -5 + -3 stacked
  else if (below(checkCompletionRate, 70)) score -= 5;

  // Modifier 2: Building security compliance
  if (meets(buildingSecurityRate, 98)) score += 5;
  else if (meets(buildingSecurityRate, 90)) score += 2;
  else if (below(buildingSecurityRate, 70)) score -= 5;

  // Modifier 3: Distress response
  if (roundsWithDistress.length === 0) {
    score += 2; // no distressed children — bonus
  } else if (meets(distressResponseRate, 95)) {
    score += 5;
  } else if (meets(distressResponseRate, 80)) {
    score += 2;
  } else if (below(distressResponseRate, 60)) {
    score -= 4;
  }

  // Modifier 4: Fire exit compliance
  if (meets(fireExitComplianceRate, 98)) score += 5;
  else if (meets(fireExitComplianceRate, 90)) score += 2;
  else if (below(fireExitComplianceRate, 80)) score -= 4;

  // Modifier 5: Environmental safety
  if (meets(windowSecurityRate, 95) && temperatureIssueCount === 0) {
    score += 4;
  } else if (meets(windowSecurityRate, 90)) {
    score += 2;
  } else if (below(windowSecurityRate, 70)) {
    score -= 4;
  }

  // Modifier 6: Frequency & documentation
  if (frequencySufficient && meets(documentationRate, 80)) {
    score += 5;
  } else if (frequencyOk) {
    score += 2;
  } else {
    score -= 3;
  }

  score = clamp(score, 0, 100);

  // ── Rating ─────────────────────────────────────────────────────────────
  const welfare_rating: WelfareCheckComplianceRating =
    score >= 80
      ? "outstanding"
      : score >= 65
        ? "good"
        : score >= 45
          ? "adequate"
          : "inadequate";

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (meets(checkCompletionRate, 95)) {
    strengths.push(
      `${formatRate(checkCompletionRate)} of welfare rounds confirmed all children checked — excellent safeguarding compliance (Reg 12).`,
    );
  }

  if (meets(buildingSecurityRate, 95)) {
    strengths.push(
      `Building security confirmed in ${formatRate(buildingSecurityRate)} of rounds — doors locked, alarms set, premises secure (Reg 25).`,
    );
  }

  if (meets(fireExitComplianceRate, 95)) {
    strengths.push(
      `Fire exits confirmed clear in ${formatRate(fireExitComplianceRate)} of rounds — consistent fire safety compliance.`,
    );
  }

  if (roundsWithDistress.length > 0 && meets(distressResponseRate, 95)) {
    strengths.push(
      `Distress response documented in ${formatRate(distressResponseRate)} of rounds where children were upset — proactive and responsive care.`,
    );
  }

  if (roundsWithDistress.length === 0 && roundsLast90 >= 10) {
    strengths.push(
      "No children recorded as distressed across all welfare rounds — children appear settled and safe overnight.",
    );
  }

  if (meets(windowSecurityRate, 95) && temperatureIssueCount === 0 && roundsLast90 >= 5) {
    strengths.push(
      "Excellent environmental safety: all windows secure and no temperature concerns recorded.",
    );
  }

  if (frequencySufficient && meets(documentationRate, 80)) {
    strengths.push(
      `Strong round frequency (${nightsWithRounds.size} of 30 nights) with ${formatRate(documentationRate)} documentation rate — evidence of consistent overnight monitoring.`,
    );
  }

  if (welfare_rating === "outstanding") {
    strengths.push(
      `Welfare check compliance rated outstanding (${score}%). Overnight monitoring demonstrates exemplary safeguarding practice.`,
    );
  }

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (below(checkCompletionRate, 70)) {
    concerns.push(
      `Only ${formatRate(checkCompletionRate)} of rounds confirmed all children checked. Every child must be physically checked during welfare rounds — gaps create safeguarding risk (Reg 12).`,
    );
  }

  if (below(buildingSecurityRate, 70)) {
    concerns.push(
      `Building security confirmed in only ${formatRate(buildingSecurityRate)} of rounds. External doors, alarms, and building integrity must be verified every round (Reg 25).`,
    );
  }

  if (below(fireExitComplianceRate, 80)) {
    concerns.push(
      `Fire exits clear in only ${formatRate(fireExitComplianceRate)} of rounds. Obstructed fire exits are a serious safety hazard — immediate review required (Reg 25).`,
    );
  }

  if (roundsWithDistress.length > 0 && below(distressResponseRate, 60)) {
    concerns.push(
      `Distress response documented in only ${formatRate(distressResponseRate)} of rounds with upset children. All instances of distress must be noted and actioned (NMS 7.9).`,
    );
  }

  if (below(windowSecurityRate, 70)) {
    concerns.push(
      `Window security rate is ${formatRate(windowSecurityRate)} — unsecured windows overnight present a significant safety risk.`,
    );
  }

  if (temperatureIssueCount > 5) {
    concerns.push(
      `${temperatureIssueCount} temperature issues recorded across welfare rounds. Children's bedrooms must be maintained at a comfortable temperature (NMS 10.1).`,
    );
  }

  if (!frequencyOk) {
    concerns.push(
      `Welfare rounds recorded on only ${nightsWithRounds.size} of 30 nights. Nightly welfare checks are expected as standard practice for overnight care.`,
    );
  }

  if (below(documentationRate, 50) && roundsLast90 >= 5) {
    concerns.push(
      `Only ${formatRate(documentationRate)} of rounds include notes. Welfare check documentation should capture meaningful observations about each child.`,
    );
  }

  // ── Recommendations ────────────────────────────────────────────────────
  const recommendations: WelfareRecommendation[] = [];
  let rank = 0;

  if (below(checkCompletionRate, 70)) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every welfare check round includes a physical check on every child. Use the checklist to confirm all children are accounted for before completing the round.",
      urgency: "immediate",
      domain: "child_safety",
      regulatory_ref: "CHR 2015 Reg 12",
    });
  }

  if (below(buildingSecurityRate, 70)) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Include building security verification in every welfare round. Check external doors, set alarms, and confirm the building is secure as part of the standard check process.",
      urgency: "immediate",
      domain: "premises_security",
      regulatory_ref: "CHR 2015 Reg 25",
    });
  }

  if (below(fireExitComplianceRate, 80)) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Verify all fire exits are clear and unobstructed during every welfare round. Remove any stored items blocking exit routes immediately.",
      urgency: "immediate",
      domain: "fire_safety",
      regulatory_ref: "CHR 2015 Reg 25",
    });
  }

  if (roundsWithDistress.length > 0 && below(distressResponseRate, 80)) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Document the response to every instance of child distress during welfare rounds. Record what was observed, what action was taken, and the outcome.",
      urgency: "soon",
      domain: "distress_response",
      regulatory_ref: "CHR 2015 Reg 6",
    });
  }

  if (below(windowSecurityRate, 80)) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Check all bedroom windows are secure during welfare rounds. Window restrictors must be in place and functioning correctly overnight.",
      urgency: "soon",
      domain: "environmental_safety",
      regulatory_ref: "CHR 2015 Reg 25",
    });
  }

  if (temperatureIssueCount > 3) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address recurring temperature issues in children's bedrooms. Review heating controls, ventilation, and consider individual preferences.",
      urgency: "planned",
      domain: "environmental_comfort",
      regulatory_ref: "NMS 10.1",
    });
  }

  if (!frequencyOk) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish consistent nightly welfare check rounds. Both sleep-in and waking night staff should complete documented rounds throughout the night.",
      urgency: "immediate",
      domain: "frequency",
      regulatory_ref: "CHR 2015 Reg 12",
    });
  }

  if (below(documentationRate, 50) && roundsLast90 >= 5) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve documentation in welfare rounds. Staff should record brief observations for each child — not just tick boxes — to build a picture of overnight wellbeing.",
      urgency: "soon",
      domain: "documentation",
      regulatory_ref: "CHR 2015 Reg 6",
    });
  }

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: WelfareInsight[] = [];

  if (welfare_rating === "outstanding") {
    insights.push({
      severity: "positive",
      text: `Welfare check compliance rated outstanding (${score}%). Consistent overnight monitoring, excellent building security, and thorough documentation demonstrate that children are safe and well-cared-for during the night. Strong evidence for Reg 12, Reg 25, and NMS 7.9.`,
    });
  }

  if (welfare_rating === "good") {
    insights.push({
      severity: "positive",
      text: `Welfare check compliance rated good (${score}%). Overnight checks are largely consistent with some areas for improvement. The home demonstrates a solid commitment to night-time safeguarding.`,
    });
  }

  if (welfare_rating === "inadequate") {
    insights.push({
      severity: "critical",
      text: `Welfare check compliance rated inadequate (${score}%). Significant gaps in overnight monitoring, building security, or child welfare checks. Ofsted will expect documented evidence that children are physically checked and safe overnight — immediate improvement is required.`,
    });
  }

  if (meets(checkCompletionRate, 98) && meets(buildingSecurityRate, 98) && meets(fireExitComplianceRate, 98)) {
    insights.push({
      severity: "positive",
      text: "Near-perfect compliance across all safety domains: child checks, building security, and fire exits. This is exemplary practice that exceeds minimum regulatory requirements.",
    });
  }

  if (below(checkCompletionRate, 50)) {
    insights.push({
      severity: "critical",
      text: `Fewer than half of welfare rounds confirmed all children checked (${formatRate(checkCompletionRate)}). This is a serious safeguarding gap — every child must be accounted for during overnight hours.`,
    });
  }

  if (roundsWithDistress.length > 0 && meets(distressResponseRate, 95)) {
    insights.push({
      severity: "positive",
      text: `Excellent distress response: ${formatRate(distressResponseRate)} of rounds with upset children had documented interventions. Staff are responding proactively to children's overnight emotional needs.`,
    });
  }

  if (temperatureIssueCount > 5) {
    insights.push({
      severity: "warning",
      text: `${temperatureIssueCount} temperature issues recorded. Persistent environmental discomfort overnight can affect children's sleep quality and wellbeing. Review heating and ventilation arrangements.`,
    });
  }

  if (!frequencyOk && roundsLast90 > 0) {
    insights.push({
      severity: "warning",
      text: `Welfare rounds recorded on only ${nightsWithRounds.size} of 30 nights. Inconsistent overnight monitoring creates gaps in the safeguarding record and may indicate staffing or practice issues.`,
    });
  }

  // ── Headline ───────────────────────────────────────────────────────────
  const parts: string[] = [];
  parts.push(`Welfare check compliance: ${welfare_rating}`);
  parts.push(`${roundsLast90} rounds (90d)`);
  if (above(checkCompletionRate, 0)) parts.push(`${formatRate(checkCompletionRate)} all-checked`);
  if (above(buildingSecurityRate, 0)) parts.push(`${formatRate(buildingSecurityRate)} building secure`);
  if (concerns.length > 0) parts.push(`${concerns.length} concern${concerns.length !== 1 ? "s" : ""}`);
  const headline = parts.join(". ") + ".";

  return {
    welfare_rating,
    welfare_score: score,
    headline,
    total_rounds: totalRounds,
    rounds_last_90_days: roundsLast90,
    check_completion_rate: checkCompletionRate,
    building_security_rate: buildingSecurityRate,
    fire_exit_compliance_rate: fireExitComplianceRate,
    distress_response_rate: distressResponseRate,
    window_security_rate: windowSecurityRate,
    temperature_issue_count: temperatureIssueCount,
    documentation_rate: documentationRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
