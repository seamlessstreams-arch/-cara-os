// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME ACCIDENT & INJURY SURVEILLANCE INTELLIGENCE ENGINE
// Monitors accident patterns, injury frequency, debrief quality, safety checks,
// and identifies systemic environmental or care risks.
// Pure deterministic engine. CHR 2015 Reg 12/13/40.
// ══════════════════════════════════════════════════════════════════════════════

import { below, meets, rate } from "@/lib/metrics/rate";

export interface AccidentRecordInput {
  id: string;
  child_id: string | null;
  staff_id: string | null;
  date: string;
  severity: string;          // "minor" | "moderate" | "serious" | "critical"
  location: string;
  type: string;              // "fall" | "collision" | "burn" | "cut" | etc
  investigated: boolean;
  debrief_completed: boolean;
  hospital_visit: boolean;
  riddor_reportable: boolean;
}

export interface InjuryRecordInput {
  id: string;
  child_id: string;
  date: string;
  origin: string;            // "accidental" | "unexplained" | "self_harm" | "peer" | "restraint"
  body_map_completed: boolean;
  photographed: boolean;
  reported_to_social_worker: boolean;
}

export interface SafetyCheckInput {
  id: string;
  date: string;
  area: string;
  passed: boolean;
  issues_found: number;
  issues_resolved: number;
}

export interface AccidentInjuryInput {
  today: string;
  total_children: number;
  total_staff: number;
  accidents: AccidentRecordInput[];
  injuries: InjuryRecordInput[];
  safety_checks: SafetyCheckInput[];
  debrief_records_total: number;
  debrief_records_completed: number;
}

export type AccidentInjuryRating = "outstanding" | "good" | "adequate" | "inadequate" | "insufficient_data";

export interface AccidentInjuryResult {
  surveillance_rating: AccidentInjuryRating;
  surveillance_score: number;
  headline: string;
  accidents_total: number;
  accidents_serious: number;
  injuries_total: number;
  injuries_unexplained: number;
  hospital_visits: number;
  riddor_count: number;
  /** null when the population is empty — nothing measured, not 0%. */
  debrief_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  safety_check_pass_rate: number | null;
  children_with_repeat_injuries: number;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

// Was `d === 0 ? 0 : …`: nothing recorded read as 0%, not as unmeasured.
function pct(n: number, d: number): number | null { return rate(n, d); }
function daysBetween(a: string, b: string): number { return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000); }

export function computeAccidentInjurySurveillance(input: AccidentInjuryInput): AccidentInjuryResult {
  const { today, total_children, accidents, injuries, safety_checks } = input;

  if (total_children === 0 && accidents.length === 0 && injuries.length === 0) {
    return {
      surveillance_rating: "insufficient_data", surveillance_score: 0,
      headline: "No accident or injury data available for surveillance analysis.",
      accidents_total: 0, accidents_serious: 0, injuries_total: 0,
      injuries_unexplained: 0, hospital_visits: 0, riddor_count: 0,
      debrief_rate: 0, safety_check_pass_rate: 0, children_with_repeat_injuries: 0,
      strengths: [], concerns: [], recommendations: [], insights: [],
    };
  }

  // ── Recent window: last 90 days ─────────────────────────────────────────
  const recent = accidents.filter(a => daysBetween(a.date, today) <= 90 && daysBetween(a.date, today) >= 0);
  const recentInjuries = injuries.filter(i => daysBetween(i.date, today) <= 90 && daysBetween(i.date, today) >= 0);

  // Metrics
  const seriousAccidents = recent.filter(a => a.severity === "serious" || a.severity === "critical");
  const hospitalVisits = recent.filter(a => a.hospital_visit).length;
  const riddorCount = recent.filter(a => a.riddor_reportable).length;
  const investigated = recent.filter(a => a.investigated).length;
  const unexplainedInjuries = recentInjuries.filter(i => i.origin === "unexplained");
  const selfHarmInjuries = recentInjuries.filter(i => i.origin === "self_harm");
  const bodyMapDone = recentInjuries.filter(i => i.body_map_completed).length;
  const reportedToSW = recentInjuries.filter(i => i.reported_to_social_worker).length;

  // Repeat patterns
  const childInjuryCounts: Record<string, number> = {};
  recentInjuries.forEach(i => { childInjuryCounts[i.child_id] = (childInjuryCounts[i.child_id] ?? 0) + 1; });
  const repeatChildren = Object.values(childInjuryCounts).filter(c => c >= 3).length;

  // Safety checks
  const recentChecks = safety_checks.filter(c => daysBetween(c.date, today) <= 90 && daysBetween(c.date, today) >= 0);
  const checksPass = recentChecks.filter(c => c.passed).length;
  const checkPassRate = pct(checksPass, recentChecks.length);
  const issuesFound = recentChecks.reduce((s, c) => s + c.issues_found, 0);
  const issuesResolved = recentChecks.reduce((s, c) => s + c.issues_resolved, 0);
  const issueResRate = pct(issuesResolved, issuesFound);

  // Global debrief rate
  const debriefRate = pct(input.debrief_records_completed, input.debrief_records_total);

  // ── Scoring ─────────────────────────────────────────────────────────────
  let score = 52; // base

  // Mod 1: Accident frequency (±8)
  const accRate = total_children > 0 ? recent.length / total_children : 0;
  if (accRate === 0) score += 8;
  else if (accRate <= 0.5) score += 5;
  else if (accRate <= 1) score += 2;
  else if (accRate <= 2) score -= 3;
  else score -= 8;

  // Mod 2: Severity profile (±6)
  if (seriousAccidents.length === 0) score += 6;
  else if (seriousAccidents.length <= 1) score += 2;
  else if (seriousAccidents.length <= 3) score -= 3;
  else score -= 6;

  // Mod 3: Investigation & debrief (±5)
  const investRate = pct(investigated, recent.length);
  if (recent.length === 0 || meets(investRate, 95)) score += 5;
  else if (meets(investRate, 80)) score += 3;
  else if (meets(investRate, 60)) score += 0;
  else score -= 5;

  // Mod 4: Injury response (±5)
  const bodyMapRate = pct(bodyMapDone, recentInjuries.length);
  const swReportRate = pct(reportedToSW, recentInjuries.length);
  if (recentInjuries.length === 0) score += 5;
  else if (meets(bodyMapRate, 95) && meets(swReportRate, 90)) score += 5;
  else if (meets(bodyMapRate, 80) && meets(swReportRate, 70)) score += 2;
  else if (meets(bodyMapRate, 60)) score += 0;
  else score -= 5;

  // Mod 5: Safety checks (±5)
  if (recentChecks.length === 0) score += 0; // neutral
  else if (meets(checkPassRate, 95) && meets(issueResRate, 90)) score += 5;
  else if (meets(checkPassRate, 80)) score += 3;
  else if (meets(checkPassRate, 60)) score += 0;
  else score -= 5;

  // Mod 6: Unexplained injuries (±5)
  if (unexplainedInjuries.length === 0) score += 5;
  else if (unexplainedInjuries.length <= 1) score += 1;
  else if (unexplainedInjuries.length <= 3) score -= 3;
  else score -= 5;

  // Mod 7: Repeat patterns (-5 to +2)
  if (repeatChildren === 0) score += 2;
  else if (repeatChildren <= 1) score -= 2;
  else score -= 5;

  // Mod 8: RIDDOR & hospital (-4 to +2)
  if (riddorCount === 0 && hospitalVisits === 0) score += 2;
  else if (riddorCount <= 1) score -= 1;
  else score -= 4;

  score = Math.max(0, Math.min(score, 100));

  const surveillance_rating: AccidentInjuryRating =
    score >= 80 ? "outstanding" : score >= 65 ? "good" : score >= 45 ? "adequate" : "inadequate";

  // ── Strengths ───────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (recent.length === 0 && recentInjuries.length === 0) strengths.push("Zero accidents and injuries in the last 90 days — exemplary safety culture.");
  else if (seriousAccidents.length === 0) strengths.push("No serious accidents in the last 90 days — effective hazard management.");
  if (unexplainedInjuries.length === 0 && recentInjuries.length > 0) strengths.push("All injuries have documented origin — thorough recording practice.");
  if (recent.length > 0 && meets(investRate, 95)) strengths.push("Over 95% of accidents fully investigated — strong governance response.");
  if (recentChecks.length > 0 && meets(checkPassRate, 95)) strengths.push("Safety check pass rate exceeds 95% — proactive environmental management.");
  if (repeatChildren === 0 && recentInjuries.length > 0) strengths.push("No repeat injury patterns — individual risk management is effective.");

  // ── Concerns ────────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (seriousAccidents.length >= 3) concerns.push(`${seriousAccidents.length} serious/critical accidents in 90 days — significant safety failure pattern.`);
  else if (seriousAccidents.length >= 1) concerns.push(`${seriousAccidents.length} serious accident(s) in 90 days — each requires thorough root cause analysis.`);
  if (unexplainedInjuries.length >= 2) concerns.push(`${unexplainedInjuries.length} unexplained injuries — potential safeguarding concern requiring immediate investigation.`);
  if (repeatChildren >= 2) concerns.push(`${repeatChildren} children with repeat injuries (3+) — pattern suggests ongoing risk factor.`);
  if (riddorCount >= 2) concerns.push(`${riddorCount} RIDDOR reportable incidents — regulatory scrutiny likely.`);
  if (recentInjuries.length > 0 && below(bodyMapRate, 70)) concerns.push(`Body map completion at ${bodyMapRate}% — forensic evidence gaps in injury documentation.`);
  if (recentChecks.length > 0 && below(checkPassRate, 70)) concerns.push(`Safety check pass rate at ${checkPassRate}% — environmental hazards not being addressed.`);

  // ── Recommendations ─────────────────────────────────────────────────────
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  let rank = 0;
  if (unexplainedInjuries.length >= 2) recommendations.push({ rank: ++rank, recommendation: `Immediate safeguarding review for ${unexplainedInjuries.length} unexplained injuries — strategy discussion with local authority required.`, urgency: "immediate", regulatory_ref: "Reg 34" });
  if (seriousAccidents.length >= 2) recommendations.push({ rank: ++rank, recommendation: "Commission independent environmental risk review following multiple serious accidents.", urgency: "immediate", regulatory_ref: "Reg 13" });
  if (repeatChildren >= 1) recommendations.push({ rank: ++rank, recommendation: `Review individual risk assessments for ${repeatChildren} child(ren) with repeat injuries.`, urgency: "soon", regulatory_ref: "Reg 12" });
  if (recent.length > 0 && below(investRate, 80)) recommendations.push({ rank: ++rank, recommendation: `Improve accident investigation rate from ${investRate}% — all incidents must be investigated.`, urgency: "soon", regulatory_ref: "Reg 40" });
  if (recentInjuries.length > 0 && below(bodyMapRate, 80)) recommendations.push({ rank: ++rank, recommendation: `Ensure body maps completed for all injuries — current rate ${bodyMapRate}%.`, urgency: "soon", regulatory_ref: "Reg 12" });
  if (score < 65) recommendations.push({ rank: ++rank, recommendation: "Develop comprehensive accident prevention and environmental safety plan.", urgency: "planned", regulatory_ref: "Reg 13" });

  // ── Insights ────────────────────────────────────────────────────────────
  const insights: { text: string; severity: string }[] = [];
  if (surveillance_rating === "outstanding") insights.push({ text: "Accident and injury surveillance is outstanding — children live in a safe, well-monitored environment.", severity: "positive" });
  if (surveillance_rating === "inadequate") insights.push({ text: "Accident and injury surveillance is inadequate — children may be at risk from environmental hazards or unrecognised patterns.", severity: "critical" });
  if (unexplainedInjuries.length >= 1 && selfHarmInjuries.length >= 1) insights.push({ text: "Both unexplained and self-harm injuries recorded — consider whether one may be masking the other.", severity: "warning" });
  if (seriousAccidents.length >= 2 && below(checkPassRate, 80)) insights.push({ text: "Serious accidents correlate with low safety check pass rate — environmental management needs urgent attention.", severity: "critical" });
  // Location analysis
  const locationCounts: Record<string, number> = {};
  recent.forEach(a => { locationCounts[a.location] = (locationCounts[a.location] ?? 0) + 1; });
  const hotspot = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0];
  if (hotspot && hotspot[1] >= 3) insights.push({ text: `Accident hotspot identified: ${hotspot[0]} (${hotspot[1]} incidents) — targeted environmental assessment recommended.`, severity: "warning" });

  // ── Headline ────────────────────────────────────────────────────────────
  let headline = "";
  if (surveillance_rating === "outstanding") headline = `Outstanding safety record — ${recent.length === 0 ? "zero accidents" : `${recent.length} minor incidents only`}, robust surveillance.`;
  else if (surveillance_rating === "good") headline = `Good safety oversight — ${recent.length} accident(s) in 90 days, ${seriousAccidents.length === 0 ? "none serious" : `${seriousAccidents.length} serious`}.`;
  else if (surveillance_rating === "adequate") headline = `Adequate safety surveillance — ${concerns.length} area(s) of concern, improvement plan needed.`;
  else headline = `Safety surveillance inadequate — ${seriousAccidents.length} serious accident(s), ${unexplainedInjuries.length} unexplained injuries, urgent action required.`;

  return {
    surveillance_rating, surveillance_score: score, headline,
    accidents_total: recent.length, accidents_serious: seriousAccidents.length,
    injuries_total: recentInjuries.length, injuries_unexplained: unexplainedInjuries.length,
    hospital_visits: hospitalVisits, riddor_count: riddorCount,
    debrief_rate: debriefRate, safety_check_pass_rate: checkPassRate,
    children_with_repeat_injuries: repeatChildren,
    strengths, concerns, recommendations, insights,
  };
}
