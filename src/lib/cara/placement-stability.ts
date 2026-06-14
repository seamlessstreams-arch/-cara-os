// ══════════════════════════════════════════════════════════════════════════════
// Cara — PLACEMENT STABILITY PREDICTOR
//
// Analyses a child's current placement indicators to flag early warning
// signs of placement breakdown. Combines multiple data sources into a
// single stability score with specific risk factors and protective factors.
//
// Evidence-based indicators drawn from:
//   - Sinclair & Wilson (2003) — "Matches and Mismatches"
//   - DfE (2015) — "Stability Index for Looked After Children"
//   - Berridge et al. (2012) — "Factors Associated with Placement Stability"
//
// Risk factors:
//   - Incident frequency/severity increasing
//   - School exclusions or non-attendance
//   - Missing from care episodes
//   - Escalating restraint use
//   - Placement history (multiple moves)
//   - Family contact disruption
//   - Staff relationship breakdown
//   - Self-harm patterns
//
// Protective factors:
//   - Strong key worker relationship
//   - Positive peer relationships
//   - Engagement in activities/education
//   - Stable family contact
//   - Progress towards outcomes
//   - Young person's own views (voice)
//
// Pure function — no side effects, no API calls.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────────────────

export interface PlacementInput {
  childId: string;
  childName: string;
  placementStartDate: string;     // current placement
  previousPlacements: number;     // total number of prior placements
  ageAtAdmission?: number;

  // Current period indicators (last 28 days)
  incidentCount: number;
  incidentTrend: "increasing" | "stable" | "decreasing";
  restraintCount: number;
  missingEpisodes: number;
  schoolAttendancePercent: number;
  schoolExclusions: number;

  // Relationships
  hasKeyWorkerRelationship: boolean;
  keyWorkerConsistency: "stable" | "recent_change" | "multiple_changes";
  peerRelationships: "positive" | "mixed" | "conflictual" | "isolated";
  familyContactRegular: boolean;
  familyContactQuality: "positive" | "mixed" | "negative" | "none";

  // Engagement
  engagedInEducation: boolean;
  engagedInActivities: boolean;
  outcomesProgress: "on_track" | "mixed" | "off_track";
  youngPersonViews: "wants_to_stay" | "ambivalent" | "wants_to_leave" | "unknown";

  // Wellbeing
  averageMood: number;            // 1-5
  moodTrend: "improving" | "stable" | "declining";
  selfHarmPresent: boolean;
  sleepDisturbance: boolean;
}

export interface StabilityAssessment {
  childId: string;
  childName: string;
  assessedAt: string;
  stabilityScore: number;         // 0-100 (higher = more stable)
  riskLevel: "low" | "moderate" | "elevated" | "high" | "critical";
  riskFactors: RiskFactor[];
  protectiveFactors: ProtectiveFactor[];
  earlyWarnings: string[];
  recommendations: string[];
  placementDuration: number;      // days
  summary: string;
}

export interface RiskFactor {
  id: string;
  category: string;
  description: string;
  severity: number;               // 1-5
  weight: number;
}

export interface ProtectiveFactor {
  id: string;
  category: string;
  description: string;
  strength: number;               // 1-5
}

// ── Constants ────────────────────────────────────────────────────────────────

const WEIGHTS = {
  incidentFrequency: 12,
  incidentTrend: 10,
  restraints: 10,
  missing: 12,
  schoolAttendance: 8,
  schoolExclusion: 8,
  keyWorker: 8,
  keyWorkerConsistency: 6,
  peerRelationships: 6,
  familyContact: 6,
  education: 5,
  activities: 4,
  outcomes: 6,
  youngPersonViews: 10,
  mood: 6,
  moodTrend: 5,
  selfHarm: 10,
  sleep: 4,
  placementHistory: 8,
};

// ── Predictor ───────────────────────────────────────────────────────────────

export function assessPlacementStability(input: PlacementInput): StabilityAssessment {
  const riskFactors: RiskFactor[] = [];
  const protectiveFactors: ProtectiveFactor[] = [];
  const earlyWarnings: string[] = [];
  let stabilityPoints = 100; // Start at max, deduct for risks

  const today = new Date().toISOString().slice(0, 10);
  const placementDuration = Math.round(
    (new Date(today).getTime() - new Date(input.placementStartDate).getTime()) / 86400000
  );

  // ─── Incident frequency ───────────────────────────────────────────────────
  if (input.incidentCount >= 8) {
    stabilityPoints -= 15;
    riskFactors.push({ id: "incidents_high", category: "Behaviour", description: `${input.incidentCount} incidents in 28 days — significantly above threshold`, severity: 5, weight: WEIGHTS.incidentFrequency });
    earlyWarnings.push("Very high incident rate — review placement plan urgently");
  } else if (input.incidentCount >= 5) {
    stabilityPoints -= 10;
    riskFactors.push({ id: "incidents_elevated", category: "Behaviour", description: `${input.incidentCount} incidents in 28 days — elevated`, severity: 3, weight: WEIGHTS.incidentFrequency });
  } else if (input.incidentCount <= 1) {
    stabilityPoints += 5;
    protectiveFactors.push({ id: "incidents_low", category: "Behaviour", description: "Very few incidents — placement is calm", strength: 4 });
  }

  // ─── Incident trend ───────────────────────────────────────────────────────
  if (input.incidentTrend === "increasing") {
    stabilityPoints -= 12;
    riskFactors.push({ id: "incidents_increasing", category: "Behaviour", description: "Incident frequency is escalating", severity: 4, weight: WEIGHTS.incidentTrend });
    earlyWarnings.push("Incidents are increasing — early intervention needed");
  } else if (input.incidentTrend === "decreasing") {
    stabilityPoints += 5;
    protectiveFactors.push({ id: "incidents_decreasing", category: "Behaviour", description: "Incidents reducing — strategies working", strength: 4 });
  }

  // ─── Restraints ───────────────────────────────────────────────────────────
  if (input.restraintCount >= 3) {
    stabilityPoints -= 12;
    riskFactors.push({ id: "restraints_high", category: "Behaviour", description: `${input.restraintCount} restraints in 28 days`, severity: 4, weight: WEIGHTS.restraints });
    earlyWarnings.push("Repeated restraint use — review BSP and consider placement suitability");
  } else if (input.restraintCount >= 1) {
    stabilityPoints -= 5;
    riskFactors.push({ id: "restraints_present", category: "Behaviour", description: `${input.restraintCount} restraint(s) used`, severity: 2, weight: WEIGHTS.restraints });
  }

  // ─── Missing from care ────────────────────────────────────────────────────
  if (input.missingEpisodes >= 3) {
    stabilityPoints -= 15;
    riskFactors.push({ id: "missing_frequent", category: "Safety", description: `${input.missingEpisodes} missing episodes in 28 days`, severity: 5, weight: WEIGHTS.missing });
    earlyWarnings.push("Frequent missing episodes — placement may not meet needs");
  } else if (input.missingEpisodes >= 1) {
    stabilityPoints -= 8;
    riskFactors.push({ id: "missing_present", category: "Safety", description: `${input.missingEpisodes} missing episode(s)`, severity: 3, weight: WEIGHTS.missing });
  }

  // ─── School attendance ────────────────────────────────────────────────────
  if (input.schoolAttendancePercent < 60) {
    stabilityPoints -= 10;
    riskFactors.push({ id: "school_poor", category: "Education", description: `School attendance at ${input.schoolAttendancePercent}%`, severity: 4, weight: WEIGHTS.schoolAttendance });
  } else if (input.schoolAttendancePercent >= 90) {
    stabilityPoints += 5;
    protectiveFactors.push({ id: "school_good", category: "Education", description: `Strong school attendance (${input.schoolAttendancePercent}%)`, strength: 4 });
  }

  // ─── School exclusions ────────────────────────────────────────────────────
  if (input.schoolExclusions >= 2) {
    stabilityPoints -= 12;
    riskFactors.push({ id: "exclusions_multiple", category: "Education", description: `${input.schoolExclusions} school exclusions`, severity: 4, weight: WEIGHTS.schoolExclusion });
    earlyWarnings.push("Multiple school exclusions — risk of permanent exclusion and placement instability");
  } else if (input.schoolExclusions === 1) {
    stabilityPoints -= 5;
    riskFactors.push({ id: "exclusion", category: "Education", description: "School exclusion this period", severity: 2, weight: WEIGHTS.schoolExclusion });
  }

  // ─── Key worker relationship ──────────────────────────────────────────────
  if (input.hasKeyWorkerRelationship) {
    protectiveFactors.push({ id: "key_worker", category: "Relationships", description: "Active key worker relationship in place", strength: 4 });
    stabilityPoints += 5;
  } else {
    stabilityPoints -= 8;
    riskFactors.push({ id: "no_key_worker", category: "Relationships", description: "No established key worker relationship", severity: 3, weight: WEIGHTS.keyWorker });
  }

  if (input.keyWorkerConsistency === "multiple_changes") {
    stabilityPoints -= 8;
    riskFactors.push({ id: "kw_changes", category: "Relationships", description: "Multiple key worker changes — attachment disruption risk", severity: 3, weight: WEIGHTS.keyWorkerConsistency });
  }

  // ─── Peer relationships ───────────────────────────────────────────────────
  if (input.peerRelationships === "positive") {
    stabilityPoints += 5;
    protectiveFactors.push({ id: "peers_positive", category: "Relationships", description: "Positive peer relationships in the home", strength: 4 });
  } else if (input.peerRelationships === "conflictual") {
    stabilityPoints -= 8;
    riskFactors.push({ id: "peers_conflict", category: "Relationships", description: "Significant peer conflict", severity: 3, weight: WEIGHTS.peerRelationships });
  } else if (input.peerRelationships === "isolated") {
    stabilityPoints -= 5;
    riskFactors.push({ id: "peers_isolated", category: "Relationships", description: "Socially isolated from peers", severity: 2, weight: WEIGHTS.peerRelationships });
  }

  // ─── Family contact ───────────────────────────────────────────────────────
  if (input.familyContactRegular && input.familyContactQuality === "positive") {
    stabilityPoints += 5;
    protectiveFactors.push({ id: "family_positive", category: "Family", description: "Regular positive family contact", strength: 4 });
  } else if (input.familyContactQuality === "negative") {
    stabilityPoints -= 6;
    riskFactors.push({ id: "family_negative", category: "Family", description: "Family contact causing distress", severity: 3, weight: WEIGHTS.familyContact });
  } else if (input.familyContactQuality === "none") {
    stabilityPoints -= 3;
  }

  // ─── Engagement ───────────────────────────────────────────────────────────
  if (input.engagedInEducation) {
    protectiveFactors.push({ id: "education_engaged", category: "Engagement", description: "Engaged in education provision", strength: 3 });
    stabilityPoints += 3;
  }
  if (input.engagedInActivities) {
    protectiveFactors.push({ id: "activities_engaged", category: "Engagement", description: "Participating in activities", strength: 3 });
    stabilityPoints += 3;
  }

  // ─── Outcomes progress ────────────────────────────────────────────────────
  if (input.outcomesProgress === "on_track") {
    stabilityPoints += 5;
    protectiveFactors.push({ id: "outcomes_good", category: "Progress", description: "Care plan outcomes progressing well", strength: 4 });
  } else if (input.outcomesProgress === "off_track") {
    stabilityPoints -= 6;
    riskFactors.push({ id: "outcomes_off", category: "Progress", description: "Care plan outcomes off track", severity: 2, weight: WEIGHTS.outcomes });
  }

  // ─── Young person's views ─────────────────────────────────────────────────
  if (input.youngPersonViews === "wants_to_leave") {
    stabilityPoints -= 15;
    riskFactors.push({ id: "yp_wants_leave", category: "Voice", description: "Young person has expressed wanting to leave placement", severity: 5, weight: WEIGHTS.youngPersonViews });
    earlyWarnings.push("Young person wants to leave — urgent discussion with social worker needed");
  } else if (input.youngPersonViews === "wants_to_stay") {
    stabilityPoints += 8;
    protectiveFactors.push({ id: "yp_wants_stay", category: "Voice", description: "Young person expresses wanting to remain", strength: 5 });
  } else if (input.youngPersonViews === "ambivalent") {
    stabilityPoints -= 5;
    riskFactors.push({ id: "yp_ambivalent", category: "Voice", description: "Young person is ambivalent about placement", severity: 2, weight: WEIGHTS.youngPersonViews });
  }

  // ─── Mood and wellbeing ───────────────────────────────────────────────────
  if (input.averageMood <= 2) {
    stabilityPoints -= 8;
    riskFactors.push({ id: "mood_low", category: "Wellbeing", description: "Persistently low mood", severity: 3, weight: WEIGHTS.mood });
  } else if (input.averageMood >= 4) {
    stabilityPoints += 4;
    protectiveFactors.push({ id: "mood_good", category: "Wellbeing", description: "Generally positive mood", strength: 3 });
  }

  if (input.moodTrend === "declining") {
    stabilityPoints -= 6;
    riskFactors.push({ id: "mood_declining", category: "Wellbeing", description: "Mood trend is declining", severity: 3, weight: WEIGHTS.moodTrend });
    earlyWarnings.push("Mood declining — consider therapeutic input or key work focus");
  }

  // ─── Self-harm ────────────────────────────────────────────────────────────
  if (input.selfHarmPresent) {
    stabilityPoints -= 12;
    riskFactors.push({ id: "self_harm", category: "Safety", description: "Self-harm present in this period", severity: 5, weight: WEIGHTS.selfHarm });
    earlyWarnings.push("Self-harm identified — review risk assessment and therapeutic support");
  }

  // ─── Sleep ────────────────────────────────────────────────────────────────
  if (input.sleepDisturbance) {
    stabilityPoints -= 4;
    riskFactors.push({ id: "sleep", category: "Wellbeing", description: "Ongoing sleep disruption", severity: 2, weight: WEIGHTS.sleep });
  }

  // ─── Placement history ────────────────────────────────────────────────────
  if (input.previousPlacements >= 5) {
    stabilityPoints -= 10;
    riskFactors.push({ id: "history_high", category: "History", description: `${input.previousPlacements} previous placements — high instability history`, severity: 4, weight: WEIGHTS.placementHistory });
  } else if (input.previousPlacements >= 3) {
    stabilityPoints -= 5;
    riskFactors.push({ id: "history_moderate", category: "History", description: `${input.previousPlacements} previous placements`, severity: 2, weight: WEIGHTS.placementHistory });
  }

  // ─── New placement adjustment ─────────────────────────────────────────────
  if (placementDuration < 28) {
    earlyWarnings.push("Early placement period (< 4 weeks) — heightened monitoring recommended");
  } else if (placementDuration > 365) {
    protectiveFactors.push({ id: "long_placement", category: "Stability", description: `Placement has been stable for ${Math.round(placementDuration / 30)} months`, strength: 4 });
    stabilityPoints += 5;
  }

  // ─── Calculate final score ────────────────────────────────────────────────
  const stabilityScore = Math.max(0, Math.min(100, stabilityPoints));

  let riskLevel: StabilityAssessment["riskLevel"];
  if (stabilityScore >= 80) riskLevel = "low";
  else if (stabilityScore >= 65) riskLevel = "moderate";
  else if (stabilityScore >= 50) riskLevel = "elevated";
  else if (stabilityScore >= 35) riskLevel = "high";
  else riskLevel = "critical";

  // ─── Generate recommendations ────────────────────────────────────────────
  const recommendations: string[] = [];
  if (riskLevel === "critical" || riskLevel === "high") {
    recommendations.push("Convene urgent professionals meeting with social worker and placing authority");
    recommendations.push("Review placement plan and consider whether needs can be met");
  }
  if (riskFactors.some((r) => r.category === "Behaviour" && r.severity >= 4)) {
    recommendations.push("Review and update behaviour support plan with fresh strategies");
  }
  if (riskFactors.some((r) => r.id === "yp_wants_leave")) {
    recommendations.push("Hold direct conversation with young person about what would help them feel settled");
  }
  if (riskFactors.some((r) => r.category === "Relationships")) {
    recommendations.push("Prioritise relational work — consistency of key worker and positive interactions");
  }
  if (riskFactors.some((r) => r.category === "Education")) {
    recommendations.push("Engage with school/provision to address attendance or exclusion concerns");
  }
  if (protectiveFactors.length > 3 && riskLevel !== "critical") {
    recommendations.push("Build on identified strengths — document what is working and continue those approaches");
  }

  // ─── Generate summary ─────────────────────────────────────────────────────
  const summary = generateSummary(stabilityScore, riskLevel, riskFactors, protectiveFactors, input);

  return {
    childId: input.childId,
    childName: input.childName,
    assessedAt: new Date().toISOString(),
    stabilityScore,
    riskLevel,
    riskFactors: riskFactors.sort((a, b) => b.severity - a.severity),
    protectiveFactors: protectiveFactors.sort((a, b) => b.strength - a.strength),
    earlyWarnings: earlyWarnings.slice(0, 5),
    recommendations: recommendations.slice(0, 4),
    placementDuration,
    summary,
  };
}

// ── Summary Generator ───────────────────────────────────────────────────────

function generateSummary(
  score: number,
  level: string,
  risks: RiskFactor[],
  protective: ProtectiveFactor[],
  input: PlacementInput,
): string {
  const parts: string[] = [];

  parts.push(`Placement stability for ${input.childName}: ${score}% (${level} risk).`);

  if (risks.length > 0) {
    const topRisk = risks[0];
    parts.push(`Primary concern: ${topRisk.description.toLowerCase()}.`);
  }

  if (protective.length > 0) {
    const topProtective = protective[0];
    parts.push(`Key strength: ${topProtective.description.toLowerCase()}.`);
  }

  if (level === "critical" || level === "high") {
    parts.push("Professional intervention recommended.");
  }

  return parts.join(" ");
}
