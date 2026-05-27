// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME FIRE DRILL & EMERGENCY PREPAREDNESS INTELLIGENCE ENGINE
// Pure deterministic engine: drill frequency, evacuation times, drill variety,
// pass rates, issue resolution, and participation coverage.
// CHR 2015 Reg 25: "Premises." SCCIF: Safety.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface FireDrillRecordInput {
  id: string;
  drill_type: string; // "fire_drill"|"evacuation"|"lockdown"|"bomb_threat"|"flood"|"equipment_check"
  result: string; // "satisfactory"|"issues_identified"|"failed"|"not_completed"
  all_present: boolean;
  children_present_count: number;
  staff_present_count: number;
  evacuation_time_seconds: number | null;
  has_issues: boolean;
  has_actions: boolean;
}

export interface FireDrillPreparednessInput {
  today: string;
  total_children: number;
  drills: FireDrillRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type FireDrillRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface FireDrillPreparednessResult {
  drill_rating: FireDrillRating;
  drill_score: number;
  headline: string;
  total_drills: number;
  satisfactory_rate: number;
  all_present_rate: number;
  average_evacuation_time: number;
  drill_type_variety: number;
  issues_addressed_rate: number;
  failed_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: {
    rank: number;
    recommendation: string;
    urgency: "immediate" | "soon" | "planned";
    regulatory_ref: string;
  }[];
  insights: { text: string; severity: "critical" | "warning" | "positive" }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): FireDrillRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeFireDrillPreparedness(
  input: FireDrillPreparednessInput,
): FireDrillPreparednessResult {
  const { drills, total_children } = input;

  // Insufficient data guard
  if (total_children === 0) {
    return {
      drill_rating: "insufficient_data",
      drill_score: 0,
      headline: "No data available for fire drill analysis",
      total_drills: 0,
      satisfactory_rate: 0,
      all_present_rate: 0,
      average_evacuation_time: 0,
      drill_type_variety: 0,
      issues_addressed_rate: 0,
      failed_rate: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const total = drills.length;

  const satisfactory = drills.filter(d => d.result === "satisfactory").length;
  const satisfactoryRate = pct(satisfactory, total);

  const allPresent = drills.filter(d => d.all_present).length;
  const allPresentRate = pct(allPresent, total);

  const withEvacTime = drills.filter(d => d.evacuation_time_seconds !== null && d.evacuation_time_seconds > 0);
  const avgEvacTime = withEvacTime.length > 0
    ? Math.round(withEvacTime.reduce((s, d) => s + (d.evacuation_time_seconds ?? 0), 0) / withEvacTime.length)
    : 0;

  const uniqueTypes = new Set(drills.map(d => d.drill_type)).size;

  const withIssues = drills.filter(d => d.has_issues);
  const withActions = withIssues.filter(d => d.has_actions).length;
  const issuesAddressedRate = pct(withActions, withIssues.length);

  const failed = drills.filter(d => d.result === "failed" || d.result === "not_completed").length;
  const failedRate = pct(failed, total);

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Drill frequency
  if (total >= 6) score += 5;
  else if (total >= 3) score += 2;
  else if (total === 0) score -= 5;

  // Modifier 2: Satisfactory/pass rate
  if (total === 0) {
    // already penalised
  } else {
    if (satisfactoryRate >= 90) score += 6;
    else if (satisfactoryRate >= 70) score += 2;
    else if (satisfactoryRate < 50) score -= 5;
  }

  // Modifier 3: All present rate (participation)
  if (total === 0) {
    // no adjustment
  } else {
    if (allPresentRate >= 90) score += 5;
    else if (allPresentRate >= 70) score += 2;
    else if (allPresentRate < 50) score -= 4;
  }

  // Modifier 4: Evacuation time (under 3 min = 180s is good, under 2 min = 120s is outstanding)
  if (total === 0) {
    score -= 1;
  } else if (avgEvacTime === 0) {
    score -= 1; // no times recorded
  } else {
    if (avgEvacTime <= 120) score += 5;
    else if (avgEvacTime <= 180) score += 2;
    else if (avgEvacTime > 300) score -= 4;
  }

  // Modifier 5: Issues addressed rate
  if (total === 0) {
    score -= 1;
  } else if (withIssues.length === 0 && total > 0) {
    score += 2; // no issues is positive
  } else {
    if (issuesAddressedRate >= 90) score += 4;
    else if (issuesAddressedRate >= 60) score += 1;
    else if (issuesAddressedRate < 40) score -= 4;
  }

  // Modifier 6: Drill type variety
  if (total === 0) {
    score -= 2;
  } else {
    if (uniqueTypes >= 4) score += 5;
    else if (uniqueTypes >= 2) score += 2;
    else if (uniqueTypes <= 1) score -= 3;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Headline ───────────────────────────────────────────────────────────
  let headline: string;
  switch (rating) {
    case "outstanding":
      headline = "Emergency preparedness is exemplary — drills are frequent, effective and well-documented";
      break;
    case "good":
      headline = "Good emergency preparedness with regular drills and effective issue resolution";
      break;
    case "adequate":
      headline = "Emergency drills occur but frequency, variety and documentation need improvement";
      break;
    case "inadequate":
      headline = "Emergency preparedness is inadequate — children and staff are not properly prepared";
      break;
    default:
      headline = "No data available for fire drill analysis";
  }

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (total >= 6) strengths.push("Regular drill frequency demonstrates ongoing commitment to emergency preparedness");
  if (satisfactoryRate >= 90 && total > 0) strengths.push("Virtually all drills are satisfactory — the home is well-prepared for emergencies");
  if (allPresentRate >= 90 && total > 0) strengths.push("Full participation in drills ensures everyone knows what to do in an emergency");
  if (avgEvacTime > 0 && avgEvacTime <= 120 && total > 0) strengths.push("Evacuation times are under 2 minutes — swift and efficient emergency response");
  if (uniqueTypes >= 4 && total > 0) strengths.push("Variety of drill types shows comprehensive emergency scenario planning");
  if (withIssues.length === 0 && total > 0) strengths.push("No issues identified in any drill — excellent operational readiness");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (total === 0) concerns.push("No fire drills or emergency exercises recorded — the home is not testing its emergency procedures");
  if (satisfactoryRate < 50 && total > 0) concerns.push("Most drills are not satisfactory — emergency response capability is unreliable");
  if (failedRate >= 30 && total > 0) concerns.push(`${failedRate}% of drills failed or were not completed — serious safety concern`);
  if (allPresentRate < 50 && total > 0) concerns.push("Participation in drills is poor — not everyone will know what to do in an emergency");
  if (avgEvacTime > 300 && total > 0) concerns.push("Average evacuation time exceeds 5 minutes — dangerously slow emergency response");
  if (uniqueTypes <= 1 && total > 0) concerns.push("Only one type of drill is practised — the home is unprepared for varied emergency scenarios");

  // ── Recommendations ────────────────────────────────────────────────────
  const recs: FireDrillPreparednessResult["recommendations"] = [];

  if (total === 0) {
    recs.push({ rank: 1, recommendation: "Implement regular fire drills and emergency exercises immediately", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 25" });
  }
  if (total > 0 && total < 3) {
    recs.push({ rank: recs.length + 1, recommendation: "Increase drill frequency to at least quarterly for all emergency scenarios", urgency: "soon", regulatory_ref: "SCCIF Safety" });
  }
  if (satisfactoryRate < 70 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Address root causes of unsatisfactory drill outcomes through targeted training", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 25" });
  }
  if (allPresentRate < 70 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Ensure all children and staff participate in every scheduled drill", urgency: "soon", regulatory_ref: "SCCIF Safety" });
  }
  if (uniqueTypes < 2 && total > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Diversify emergency exercises to include lockdown, evacuation and flood scenarios", urgency: "planned", regulatory_ref: "CHR 2015 Reg 25" });
  }
  if (issuesAddressedRate < 60 && withIssues.length > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Follow up on all issues identified during drills with documented corrective actions", urgency: "soon", regulatory_ref: "SCCIF Safety" });
  }

  const cappedRecs = recs.slice(0, 5).map((r, i) => ({ ...r, rank: i + 1 }));

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: FireDrillPreparednessResult["insights"] = [];

  if (satisfactoryRate >= 90 && allPresentRate >= 90 && total >= 6) {
    insights.push({ text: "Emergency preparedness is exemplary — the home can demonstrate effective crisis response to Ofsted", severity: "positive" });
  }
  if (total === 0) {
    insights.push({ text: "No drill records means the home cannot evidence fire safety compliance — an immediate regulatory concern", severity: "critical" });
  }
  if (failedRate >= 30 && total > 0) {
    insights.push({ text: "High drill failure rate means the home may not be safe in a real emergency — urgent action needed", severity: "critical" });
  }
  if (avgEvacTime > 0 && avgEvacTime <= 120 && total > 0) {
    insights.push({ text: "Sub-2-minute evacuation times show the home is operationally ready for fire emergencies", severity: "positive" });
  }
  if (uniqueTypes >= 4 && total > 0) {
    insights.push({ text: "Diverse drill types mean the home is prepared for multiple emergency scenarios — not just fire", severity: "positive" });
  }

  const cappedInsights = insights.slice(0, 3);

  return {
    drill_rating: rating,
    drill_score: score,
    headline,
    total_drills: total,
    satisfactory_rate: satisfactoryRate,
    all_present_rate: allPresentRate,
    average_evacuation_time: avgEvacTime,
    drill_type_variety: uniqueTypes,
    issues_addressed_rate: issuesAddressedRate,
    failed_rate: failedRate,
    strengths,
    concerns,
    recommendations: cappedRecs,
    insights: cappedInsights,
  };
}
