// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence Engine — Emotional Wellbeing
//
// Pure deterministic analysis of emotional/mental health for LAC.
// Tracks:
//   - SDQ scores and trajectory
//   - Therapeutic input (type, frequency, attendance)
//   - Self-harm incidents and risk level
//   - Mood tracking and patterns
//   - Mental health referrals and wait times
//   - Protective factors
//
// Regulatory alignment:
//   - CHR 2015 Reg 6(2)(b)(i) — Emotional and mental health
//   - CHR 2015 Reg 10 — Positive relationships and wellbeing
//   - SCCIF — Health and wellbeing outcomes
//   - Promoting Health of LAC (DfE/DH 2015)
//   - NICE CG28 — Depression in children
//
// No AI calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ───────────────────────────────────────────────────────────────────

export type SDQBand = "normal" | "borderline" | "abnormal";
export type MoodLevel = 1 | 2 | 3 | 4 | 5; // 1=very low, 5=very good

export interface SDQScore {
  date: string;
  totalDifficulties: number; // 0-40
  band: SDQBand;
  emotionalSymptoms: number;
  conductProblems: number;
  hyperactivity: number;
  peerProblems: number;
  prosocial: number;
}

export interface TherapeuticInput {
  type: "camhs" | "counselling" | "play_therapy" | "art_therapy" | "cbt" | "emdr" | "other";
  provider: string;
  frequency: "weekly" | "fortnightly" | "monthly" | "ad_hoc";
  sessionsAttended: number;
  sessionsMissed: number;
  startDate: string;
  active: boolean;
  childEngaged: boolean;
}

export interface SelfHarmIncident {
  date: string;
  severity: "ideation" | "minor" | "moderate" | "serious";
  supportProvided: boolean;
  safetyPlanUpdated: boolean;
}

export interface MoodRecord {
  date: string;
  level: MoodLevel;
}

export interface EmotionalWellbeingInput {
  childId: string;
  childName: string;
  age: number;
  sdqScores: SDQScore[];
  therapeuticInputs: TherapeuticInput[];
  selfHarmIncidents: SelfHarmIncident[];
  moodRecords: MoodRecord[];
  mentalHealthReferralMade: boolean;
  mentalHealthReferralDate?: string;
  waitingForService: boolean;
  waitDays?: number;
  hasSafetyPlan: boolean;
  safetyPlanReviewed: boolean;
  regulatorySDQCompleted: boolean; // annual SDQ as per statutory health assessment
  emotionalHealthDiscussedInKeywork: boolean;
  staffTrainedInMentalHealth: boolean;
  childKnowsHowToGetHelp: boolean;
  positiveRelationshipsPresent: boolean;
  protectiveFactors: string[];
  riskFactors: string[];
}

export interface EmotionalWellbeingAssessment {
  childName: string;
  overallScore: number;
  overallRating: "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate";
  sdqScore: number;
  therapeuticScore: number;
  safetyScore: number;
  supportScore: number;
  latestSDQ?: SDQScore;
  sdqTrend: "improving" | "stable" | "worsening" | "insufficient_data";
  averageMood: number;
  moodTrend: "improving" | "stable" | "worsening" | "insufficient_data";
  selfHarmRiskLevel: "none" | "low" | "medium" | "high";
  selfHarmIncidentCount: number;
  activeTherapy: boolean;
  therapyAttendanceRate: number;
  concerns: WellbeingConcern[];
  strengths: WellbeingStrength[];
  regulatoryFlags: RegulatoryFlag[];
  recommendations: string[];
  summary: string;
}

export interface WellbeingConcern {
  severity: "critical" | "significant" | "moderate" | "low";
  category: string;
  description: string;
}

export interface WellbeingStrength {
  category: string;
  description: string;
}

export interface RegulatoryFlag {
  regulation: string;
  area: string;
  status: "met" | "partially_met" | "not_met";
  detail: string;
}

// ── Main Engine ─────────────────────────────────────────────────────────────

export function analyseEmotionalWellbeing(input: EmotionalWellbeingInput): EmotionalWellbeingAssessment {
  const { childName } = input;

  // ── SDQ analysis ────────────────────────────────────────────────────
  const latestSDQ = input.sdqScores.length > 0
    ? input.sdqScores[input.sdqScores.length - 1]
    : undefined;
  const sdqTrend = calculateSDQTrend(input.sdqScores);

  // ── Mood analysis ───────────────────────────────────────────────────
  const averageMood = input.moodRecords.length > 0
    ? Math.round((input.moodRecords.reduce((sum, m) => sum + m.level, 0) / input.moodRecords.length) * 10) / 10
    : 0;
  const moodTrend = calculateMoodTrend(input.moodRecords);

  // ── Self-harm ───────────────────────────────────────────────────────
  const selfHarmIncidentCount = input.selfHarmIncidents.length;
  const selfHarmRiskLevel = assessSelfHarmRisk(input.selfHarmIncidents);

  // ── Therapy ─────────────────────────────────────────────────────────
  const activeTherapy = input.therapeuticInputs.some(t => t.active);
  const therapyAttendanceRate = calculateTherapyAttendance(input.therapeuticInputs);

  // ── Scores ────────────────────────────────────────────────────────
  const sdqScoreVal = scoreSDQ(latestSDQ, sdqTrend);
  const therapeuticScore = scoreTherapeutic(input, activeTherapy, therapyAttendanceRate);
  const safetyScore = scoreSafety(input, selfHarmRiskLevel);
  const supportScore = scoreSupport(input);

  // ── Overall ───────────────────────────────────────────────────────
  const overallScore = Math.round(
    sdqScoreVal * 0.25 +
    therapeuticScore * 0.25 +
    safetyScore * 0.25 +
    supportScore * 0.25
  );
  const overallRating = scoreToRating(overallScore);

  // ── Concerns ──────────────────────────────────────────────────────
  const concerns = identifyConcerns(input, latestSDQ, sdqTrend, moodTrend, selfHarmRiskLevel, averageMood);

  // ── Strengths ─────────────────────────────────────────────────────
  const strengths = identifyStrengths(input, latestSDQ, sdqTrend, moodTrend, activeTherapy, averageMood);

  // ── Regulatory flags ──────────────────────────────────────────────
  const regulatoryFlags = assessRegulatory(input, selfHarmRiskLevel, activeTherapy);

  // ── Recommendations ───────────────────────────────────────────────
  const recommendations = buildRecommendations(input, latestSDQ, sdqTrend, selfHarmRiskLevel, averageMood);

  // ── Summary ───────────────────────────────────────────────────────
  const summary = buildSummary(childName, overallRating, latestSDQ, averageMood, selfHarmRiskLevel);

  return {
    childName,
    overallScore,
    overallRating,
    sdqScore: sdqScoreVal,
    therapeuticScore,
    safetyScore,
    supportScore,
    latestSDQ,
    sdqTrend,
    averageMood,
    moodTrend,
    selfHarmRiskLevel,
    selfHarmIncidentCount,
    activeTherapy,
    therapyAttendanceRate,
    concerns,
    strengths,
    regulatoryFlags,
    recommendations,
    summary,
  };
}

// ── Trend Analysis ──────────────────────────────────────────────────────────

function calculateSDQTrend(scores: SDQScore[]): "improving" | "stable" | "worsening" | "insufficient_data" {
  if (scores.length < 2) return "insufficient_data";
  const first = scores[0].totalDifficulties;
  const last = scores[scores.length - 1].totalDifficulties;
  const diff = last - first;
  if (diff <= -3) return "improving"; // lower = better
  if (diff >= 3) return "worsening";
  return "stable";
}

function calculateMoodTrend(records: MoodRecord[]): "improving" | "stable" | "worsening" | "insufficient_data" {
  if (records.length < 5) return "insufficient_data";
  const half = Math.floor(records.length / 2);
  const firstHalf = records.slice(0, half);
  const secondHalf = records.slice(half);

  const firstAvg = firstHalf.reduce((s, m) => s + m.level, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((s, m) => s + m.level, 0) / secondHalf.length;

  const diff = secondAvg - firstAvg;
  if (diff >= 0.5) return "improving";
  if (diff <= -0.5) return "worsening";
  return "stable";
}

// ── Self-harm Risk ──────────────────────────────────────────────────────────

function assessSelfHarmRisk(incidents: SelfHarmIncident[]): "none" | "low" | "medium" | "high" {
  if (incidents.length === 0) return "none";

  // Recent incidents (last 30 days approximation — most recent)
  const recent = incidents.slice(-3); // last 3 incidents
  const hasSeriousRecent = recent.some(i => i.severity === "serious" || i.severity === "moderate");

  if (incidents.length >= 3 && hasSeriousRecent) return "high";
  if (incidents.length >= 2 || hasSeriousRecent) return "medium";
  return "low";
}

// ── Therapy Attendance ──────────────────────────────────────────────────────

function calculateTherapyAttendance(inputs: TherapeuticInput[]): number {
  const active = inputs.filter(t => t.active);
  if (active.length === 0) return 1; // no therapy, N/A

  const totalAttended = active.reduce((s, t) => s + t.sessionsAttended, 0);
  const totalPlanned = active.reduce((s, t) => s + t.sessionsAttended + t.sessionsMissed, 0);

  return totalPlanned > 0 ? Math.round((totalAttended / totalPlanned) * 100) / 100 : 1;
}

// ── Scoring ─────────────────────────────────────────────────────────────────

function scoreSDQ(latest: SDQScore | undefined, trend: string): number {
  if (!latest) return 50; // no data

  let score = 0;
  // Band scoring
  if (latest.band === "normal") score += 60;
  else if (latest.band === "borderline") score += 35;
  else score += 10;

  // Trend
  if (trend === "improving") score += 30;
  else if (trend === "stable" && latest.band === "normal") score += 30;
  else if (trend === "stable") score += 15;
  else if (trend === "worsening") score += 0;
  else score += 10; // insufficient_data

  return Math.min(100, score);
}

function scoreTherapeutic(input: EmotionalWellbeingInput, active: boolean, attendance: number): number {
  // If no therapy needed (no referral, no SDQ concerns), score well
  const needsTherapy = input.mentalHealthReferralMade ||
    (input.sdqScores.length > 0 && input.sdqScores[input.sdqScores.length - 1].band === "abnormal") ||
    input.selfHarmIncidents.length > 0;

  if (!needsTherapy) return 90; // no need, all good

  let score = 0;

  if (active) {
    score += 40;
    // Good attendance
    score += Math.round(attendance * 30);
    // Child engaged
    const engaged = input.therapeuticInputs.filter(t => t.active && t.childEngaged);
    if (engaged.length > 0) score += 20;
  } else if (input.waitingForService) {
    score += 30; // referral made, waiting
    if (input.waitDays && input.waitDays > 90) score -= 10; // long wait
  } else {
    score += 10; // needs therapy but not receiving/referred
  }

  return Math.max(0, Math.min(100, score));
}

function scoreSafety(input: EmotionalWellbeingInput, riskLevel: string): number {
  if (riskLevel === "none") return 100;

  let score = 40; // baseline when risk exists

  if (input.hasSafetyPlan) score += 20;
  if (input.safetyPlanReviewed) score += 15;
  if (input.childKnowsHowToGetHelp) score += 15;
  if (input.staffTrainedInMentalHealth) score += 10;

  // Reduce for high risk
  if (riskLevel === "high") score -= 20;
  else if (riskLevel === "medium") score -= 10;

  return Math.max(0, Math.min(100, score));
}

function scoreSupport(input: EmotionalWellbeingInput): number {
  let score = 0;

  if (input.positiveRelationshipsPresent) score += 20;
  if (input.emotionalHealthDiscussedInKeywork) score += 20;
  if (input.staffTrainedInMentalHealth) score += 15;
  if (input.childKnowsHowToGetHelp) score += 15;
  if (input.protectiveFactors.length >= 3) score += 15;
  else if (input.protectiveFactors.length >= 1) score += 10;
  if (input.regulatorySDQCompleted) score += 15;

  return Math.min(100, score);
}

// ── Concerns ────────────────────────────────────────────────────────────────

function identifyConcerns(
  input: EmotionalWellbeingInput,
  latestSDQ: SDQScore | undefined,
  sdqTrend: string,
  moodTrend: string,
  selfHarmRisk: string,
  avgMood: number,
): WellbeingConcern[] {
  const concerns: WellbeingConcern[] = [];

  // Self-harm
  if (selfHarmRisk === "high") {
    concerns.push({
      severity: "critical",
      category: "self_harm",
      description: "High self-harm risk — safety plan, supervision, and specialist input essential",
    });
  } else if (selfHarmRisk === "medium") {
    concerns.push({
      severity: "significant",
      category: "self_harm",
      description: "Self-harm risk present — monitor closely and review safety plan",
    });
  }

  // SDQ abnormal and worsening
  if (latestSDQ?.band === "abnormal" && sdqTrend === "worsening") {
    concerns.push({
      severity: "critical",
      category: "sdq",
      description: "SDQ in abnormal range and worsening — urgent mental health input needed",
    });
  } else if (latestSDQ?.band === "abnormal") {
    concerns.push({
      severity: "significant",
      category: "sdq",
      description: "SDQ in abnormal range — therapeutic intervention needed",
    });
  } else if (sdqTrend === "worsening") {
    concerns.push({
      severity: "moderate",
      category: "sdq",
      description: "SDQ scores worsening — monitor closely",
    });
  }

  // Low mood
  if (avgMood > 0 && avgMood <= 2) {
    concerns.push({
      severity: "significant",
      category: "mood",
      description: "Persistently low mood — emotional wellbeing support needed",
    });
  } else if (moodTrend === "worsening") {
    concerns.push({
      severity: "moderate",
      category: "mood",
      description: "Mood trend declining — early intervention recommended",
    });
  }

  // Waiting for service
  if (input.waitingForService && input.waitDays && input.waitDays > 90) {
    concerns.push({
      severity: "significant",
      category: "access",
      description: `Waiting ${input.waitDays} days for mental health service — escalate`,
    });
  } else if (input.waitingForService) {
    concerns.push({
      severity: "moderate",
      category: "access",
      description: "On waiting list for mental health service",
    });
  }

  // No safety plan when self-harm present
  if (selfHarmRisk !== "none" && !input.hasSafetyPlan) {
    concerns.push({
      severity: "critical",
      category: "safety",
      description: "Self-harm risk without safety plan — immediate action needed",
    });
  }

  // No SDQ completed
  if (!input.regulatorySDQCompleted) {
    concerns.push({
      severity: "moderate",
      category: "assessment",
      description: "Annual SDQ not completed — statutory requirement",
    });
  }

  // Therapy missed
  const activeTherapy = input.therapeuticInputs.filter(t => t.active);
  const poorAttendance = activeTherapy.some(t => t.sessionsMissed > t.sessionsAttended);
  if (poorAttendance) {
    concerns.push({
      severity: "moderate",
      category: "engagement",
      description: "Poor therapy attendance — explore barriers",
    });
  }

  return concerns;
}

// ── Strengths ───────────────────────────────────────────────────────────────

function identifyStrengths(
  input: EmotionalWellbeingInput,
  latestSDQ: SDQScore | undefined,
  sdqTrend: string,
  moodTrend: string,
  activeTherapy: boolean,
  avgMood: number,
): WellbeingStrength[] {
  const strengths: WellbeingStrength[] = [];

  if (latestSDQ?.band === "normal") {
    strengths.push({
      category: "sdq",
      description: "SDQ in normal range — emotional wellbeing within expected parameters",
    });
  }

  if (sdqTrend === "improving") {
    strengths.push({
      category: "progress",
      description: "SDQ scores improving — therapeutic progress evident",
    });
  }

  if (avgMood >= 4) {
    strengths.push({
      category: "mood",
      description: "Consistently positive mood reported",
    });
  }

  if (moodTrend === "improving") {
    strengths.push({
      category: "mood_trend",
      description: "Mood trajectory improving",
    });
  }

  if (activeTherapy && input.therapeuticInputs.some(t => t.active && t.childEngaged)) {
    strengths.push({
      category: "therapy",
      description: "Engaged in therapeutic work",
    });
  }

  if (input.protectiveFactors.length >= 3) {
    strengths.push({
      category: "protective",
      description: `Strong protective factors in place (${input.protectiveFactors.length} identified)`,
    });
  }

  if (input.positiveRelationshipsPresent && input.childKnowsHowToGetHelp) {
    strengths.push({
      category: "support",
      description: "Positive relationships and knows how to access help",
    });
  }

  return strengths;
}

// ── Regulatory Flags ────────────────────────────────────────────────────────

function assessRegulatory(
  input: EmotionalWellbeingInput,
  selfHarmRisk: string,
  activeTherapy: boolean,
): RegulatoryFlag[] {
  const flags: RegulatoryFlag[] = [];

  // CHR 2015 Reg 6(2)(b)(i) — Emotional and mental health
  const mentalHealthMet = input.regulatorySDQCompleted &&
    input.emotionalHealthDiscussedInKeywork &&
    (selfHarmRisk === "none" || input.hasSafetyPlan);
  flags.push({
    regulation: "CHR 2015 Reg 6(2)(b)(i)",
    area: "Emotional Health",
    status: mentalHealthMet ? "met" : input.regulatorySDQCompleted ? "partially_met" : "not_met",
    detail: mentalHealthMet
      ? "Emotional and mental health actively monitored and supported"
      : "Emotional health monitoring or support insufficient",
  });

  // Promoting Health of LAC — SDQ
  flags.push({
    regulation: "Promoting Health of LAC",
    area: "SDQ Assessment",
    status: input.regulatorySDQCompleted ? "met" : "not_met",
    detail: input.regulatorySDQCompleted
      ? "Annual SDQ completed as per statutory guidance"
      : "Annual SDQ not completed — statutory requirement",
  });

  // SCCIF — Health outcomes
  const healthOutcomes = input.positiveRelationshipsPresent &&
    (selfHarmRisk === "none" || selfHarmRisk === "low") &&
    input.childKnowsHowToGetHelp;
  flags.push({
    regulation: "SCCIF",
    area: "Health Outcomes",
    status: healthOutcomes ? "met" : (selfHarmRisk === "high" ? "not_met" : "partially_met"),
    detail: healthOutcomes
      ? "Emotional health outcomes positive"
      : "Emotional health outcomes require improvement",
  });

  // CHR 2015 Reg 10 — Wellbeing
  flags.push({
    regulation: "CHR 2015 Reg 10",
    area: "Wellbeing Support",
    status: input.staffTrainedInMentalHealth && input.emotionalHealthDiscussedInKeywork ? "met" : "partially_met",
    detail: input.staffTrainedInMentalHealth
      ? "Staff trained and wellbeing actively supported"
      : "Staff mental health training or keywork coverage needs attention",
  });

  return flags;
}

// ── Recommendations ─────────────────────────────────────────────────────────

function buildRecommendations(
  input: EmotionalWellbeingInput,
  latestSDQ: SDQScore | undefined,
  sdqTrend: string,
  selfHarmRisk: string,
  avgMood: number,
): string[] {
  const recs: string[] = [];

  if (selfHarmRisk === "high" && !input.hasSafetyPlan) {
    recs.push("URGENT: Create safety plan — self-harm risk is high");
  } else if (selfHarmRisk !== "none" && !input.safetyPlanReviewed) {
    recs.push("Review and update safety plan");
  }

  if (latestSDQ?.band === "abnormal" && !input.therapeuticInputs.some(t => t.active)) {
    recs.push("PRIORITY: Arrange therapeutic input — SDQ indicates significant difficulties");
  }

  if (!input.regulatorySDQCompleted) {
    recs.push("Complete annual SDQ — statutory requirement for health assessment");
  }

  if (input.waitingForService && input.waitDays && input.waitDays > 90) {
    recs.push("Escalate mental health referral — wait exceeds 90 days");
  }

  if (avgMood > 0 && avgMood <= 2 && !input.therapeuticInputs.some(t => t.active)) {
    recs.push("Consider mental health referral — persistently low mood");
  }

  if (sdqTrend === "worsening") {
    recs.push("Review current support — SDQ trend worsening, may need enhanced intervention");
  }

  if (!input.emotionalHealthDiscussedInKeywork) {
    recs.push("Include emotional wellbeing as standing item in keywork sessions");
  }

  if (!input.staffTrainedInMentalHealth) {
    recs.push("Ensure staff have mental health awareness training");
  }

  if (!input.childKnowsHowToGetHelp) {
    recs.push("Ensure child knows how to access emotional support (helplines, trusted adults)");
  }

  if (input.protectiveFactors.length < 2) {
    recs.push("Identify and strengthen protective factors for emotional resilience");
  }

  return recs;
}

// ── Summary ─────────────────────────────────────────────────────────────────

function buildSummary(
  childName: string,
  rating: string,
  latestSDQ: SDQScore | undefined,
  avgMood: number,
  selfHarmRisk: string,
): string {
  const sdqDesc = latestSDQ ? `SDQ ${latestSDQ.band} (${latestSDQ.totalDifficulties})` : "SDQ not assessed";
  const moodDesc = avgMood > 0 ? `, mood ${avgMood >= 4 ? "good" : avgMood >= 3 ? "fair" : "low"}` : "";
  const riskDesc = selfHarmRisk !== "none" ? `, self-harm risk ${selfHarmRisk}` : "";
  return `${childName}: Wellbeing rated ${rating.replace(/_/g, " ")}. ${sdqDesc}${moodDesc}${riskDesc}.`;
}

// ── Utility ─────────────────────────────────────────────────────────────────

function scoreToRating(score: number): "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate" {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 55) return "adequate";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}
