// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence Engine — Key Working Sessions
//
// Pure deterministic analysis of keyworker relationship quality for LAC.
// Tracks:
//   - Session frequency vs expected schedule
//   - Session content quality (topics covered, child-led)
//   - Relationship indicators (trust, rapport, consistency)
//   - Wishes & feelings captured
//   - Link to care plan actions
//   - Staff changes / turnover impact
//
// Regulatory alignment:
//   - CHR 2015 Reg 5(a) — Quality of care: relationships
//   - CHR 2015 Reg 10 — Health and wellbeing
//   - SCCIF — Quality of relationships with staff
//   - Reg 44 Visits — independent oversight
//
// No AI calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ───────────────────────────────────────────────────────────────────

export type SessionTopic =
  | "wellbeing"
  | "education"
  | "health"
  | "contact"
  | "behaviour"
  | "goals"
  | "independence"
  | "wishes_feelings"
  | "placement"
  | "activities"
  | "safety"
  | "identity"
  | "other";

export interface KeyworkSession {
  id: string;
  date: string;
  keyworkerName: string;
  plannedDuration: number; // minutes
  actualDuration: number;
  occurred: boolean;
  cancelledBy?: "child" | "staff" | "other";
  topicsCovered: SessionTopic[];
  childLed: boolean; // child chose topics or led discussion
  wishesAndFeelingsRecorded: boolean;
  actionsAgreed: number;
  actionsCompleted: number;
  childEngagement: "high" | "moderate" | "low" | "refused";
  childFeedback?: "positive" | "neutral" | "negative";
  privateTime: boolean; // Was there 1:1 private time?
  location: "in_home" | "out_of_home" | "activity_based" | "other";
}

export interface KeyworkingInput {
  childId: string;
  childName: string;
  age: number;
  sessions: KeyworkSession[];
  expectedFrequency: "weekly" | "fortnightly" | "monthly";
  expectedFrequencyPerMonth: number;
  currentKeyworkerName: string;
  keyworkerChangesLast12Months: number;
  keyworkerRelationshipMonths: number; // how long current KW assigned
  childCanChooseTopics: boolean;
  childKnowsKeyworker: boolean;
  keyworkPolicyInPlace: boolean;
  reg44VisitorMeetsChild: boolean;
  reg44VisitsCurrent: boolean;
}

export interface KeyworkingAssessment {
  childName: string;
  overallScore: number;
  overallRating: "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate";
  frequencyScore: number;
  qualityScore: number;
  relationshipScore: number;
  voiceScore: number;
  totalSessions: number;
  occurredSessions: number;
  missedSessions: number;
  complianceRate: number; // vs expected frequency
  avgDuration: number;
  childLedRate: number;
  wishesRate: number;
  actionCompletionRate: number;
  topicCoverage: TopicCoverage[];
  concerns: KeyworkConcern[];
  strengths: KeyworkStrength[];
  regulatoryFlags: RegulatoryFlag[];
  recommendations: string[];
  summary: string;
}

export interface TopicCoverage {
  topic: SessionTopic;
  count: number;
  percentage: number;
}

export interface KeyworkConcern {
  severity: "critical" | "significant" | "moderate" | "low";
  category: string;
  description: string;
}

export interface KeyworkStrength {
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

export function analyseKeyworking(input: KeyworkingInput): KeyworkingAssessment {
  const { childName, sessions } = input;

  // ── Basic counts ────────────────────────────────────────────────────
  const totalSessions = sessions.length;
  const occurredSessions = sessions.filter(s => s.occurred).length;
  const missedSessions = totalSessions - occurredSessions;
  const occurred = sessions.filter(s => s.occurred);

  // ── Compliance ──────────────────────────────────────────────────────
  // Assume 3-month window
  const expectedTotal = input.expectedFrequencyPerMonth * 3;
  const complianceRate = expectedTotal > 0
    ? Math.min(1, Math.round((occurredSessions / expectedTotal) * 100) / 100)
    : totalSessions > 0 ? 1 : 0;

  // ── Quality metrics ─────────────────────────────────────────────────
  const avgDuration = occurred.length > 0
    ? Math.round(occurred.reduce((sum, s) => sum + s.actualDuration, 0) / occurred.length)
    : 0;

  const childLedRate = occurred.length > 0
    ? Math.round((occurred.filter(s => s.childLed).length / occurred.length) * 100) / 100
    : 0;

  const wishesRate = occurred.length > 0
    ? Math.round((occurred.filter(s => s.wishesAndFeelingsRecorded).length / occurred.length) * 100) / 100
    : 0;

  const totalActions = occurred.reduce((sum, s) => sum + s.actionsAgreed, 0);
  const completedActions = occurred.reduce((sum, s) => sum + s.actionsCompleted, 0);
  const actionCompletionRate = totalActions > 0
    ? Math.round((completedActions / totalActions) * 100) / 100
    : 1;

  // ── Topic coverage ──────────────────────────────────────────────────
  const topicCoverage = analyseTopics(occurred);

  // ── Scores ────────────────────────────────────────────────────────
  const frequencyScore = scoreFrequency(complianceRate, missedSessions, totalSessions);
  const qualityScore = scoreQuality(occurred, avgDuration, actionCompletionRate);
  const relationshipScore = scoreRelationship(input);
  const voiceScore = scoreVoice(childLedRate, wishesRate, input);

  // ── Overall ───────────────────────────────────────────────────────
  const overallScore = Math.round(
    frequencyScore * 0.25 +
    qualityScore * 0.30 +
    relationshipScore * 0.25 +
    voiceScore * 0.20
  );
  const overallRating = scoreToRating(overallScore);

  // ── Concerns ──────────────────────────────────────────────────────
  const concerns = identifyConcerns(input, complianceRate, childLedRate, occurred);

  // ── Strengths ─────────────────────────────────────────────────────
  const strengths = identifyStrengths(input, complianceRate, childLedRate, wishesRate, occurred);

  // ── Regulatory flags ──────────────────────────────────────────────
  const regulatoryFlags = assessRegulatory(input, complianceRate, wishesRate);

  // ── Recommendations ───────────────────────────────────────────────
  const recommendations = buildRecommendations(input, complianceRate, childLedRate, topicCoverage, occurred);

  // ── Summary ───────────────────────────────────────────────────────
  const summary = buildSummary(childName, overallRating, complianceRate, childLedRate);

  return {
    childName,
    overallScore,
    overallRating,
    frequencyScore,
    qualityScore,
    relationshipScore,
    voiceScore,
    totalSessions,
    occurredSessions,
    missedSessions,
    complianceRate,
    avgDuration,
    childLedRate,
    wishesRate,
    actionCompletionRate,
    topicCoverage,
    concerns,
    strengths,
    regulatoryFlags,
    recommendations,
    summary,
  };
}

// ── Topic Analysis ──────────────────────────────────────────────────────────

function analyseTopics(occurred: KeyworkSession[]): TopicCoverage[] {
  const counts: Record<string, number> = {};
  occurred.forEach(s => {
    s.topicsCovered.forEach(t => {
      counts[t] = (counts[t] ?? 0) + 1;
    });
  });

  const total = occurred.length || 1;
  return Object.entries(counts)
    .map(([topic, count]) => ({
      topic: topic as SessionTopic,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

// ── Scoring ─────────────────────────────────────────────────────────────────

function scoreFrequency(compliance: number, missed: number, total: number): number {
  if (total === 0) return 20; // No sessions is bad
  return Math.round(compliance * 100);
}

function scoreQuality(occurred: KeyworkSession[], avgDuration: number, actionRate: number): number {
  if (occurred.length === 0) return 20;

  let score = 0;

  // Duration (30 points) — expect at least 30 mins
  if (avgDuration >= 45) score += 30;
  else if (avgDuration >= 30) score += 25;
  else if (avgDuration >= 20) score += 15;
  else score += 5;

  // Engagement (30 points)
  const highEngagement = occurred.filter(s => s.childEngagement === "high").length;
  const modEngagement = occurred.filter(s => s.childEngagement === "moderate").length;
  const engagementScore = (highEngagement * 2 + modEngagement) / (occurred.length * 2);
  score += Math.round(engagementScore * 30);

  // Private time (20 points)
  const privateRate = occurred.filter(s => s.privateTime).length / occurred.length;
  score += Math.round(privateRate * 20);

  // Action completion (20 points)
  score += Math.round(actionRate * 20);

  return Math.min(100, score);
}

function scoreRelationship(input: KeyworkingInput): number {
  let score = 0;

  // Relationship length (30 points)
  if (input.keyworkerRelationshipMonths >= 12) score += 30;
  else if (input.keyworkerRelationshipMonths >= 6) score += 25;
  else if (input.keyworkerRelationshipMonths >= 3) score += 15;
  else score += 5;

  // Low turnover (30 points)
  if (input.keyworkerChangesLast12Months === 0) score += 30;
  else if (input.keyworkerChangesLast12Months === 1) score += 20;
  else if (input.keyworkerChangesLast12Months === 2) score += 10;
  else score += 0;

  // Child knows keyworker (20 points)
  if (input.childKnowsKeyworker) score += 20;

  // Policy in place (20 points)
  if (input.keyworkPolicyInPlace) score += 20;

  return Math.min(100, score);
}

function scoreVoice(childLedRate: number, wishesRate: number, input: KeyworkingInput): number {
  let score = 0;

  // Child-led sessions (35 points)
  score += Math.round(childLedRate * 35);

  // Wishes & feelings recorded (35 points)
  score += Math.round(wishesRate * 35);

  // Can choose topics (15 points)
  if (input.childCanChooseTopics) score += 15;

  // Positive feedback (15 points)
  const occurred = input.sessions.filter(s => s.occurred);
  const withFeedback = occurred.filter(s => s.childFeedback);
  if (withFeedback.length > 0) {
    const positiveRate = withFeedback.filter(s => s.childFeedback === "positive").length / withFeedback.length;
    score += Math.round(positiveRate * 15);
  }

  return Math.min(100, score);
}

// ── Concerns ────────────────────────────────────────────────────────────────

function identifyConcerns(
  input: KeyworkingInput,
  compliance: number,
  childLedRate: number,
  occurred: KeyworkSession[],
): KeyworkConcern[] {
  const concerns: KeyworkConcern[] = [];

  // Very low frequency
  if (compliance < 0.3) {
    concerns.push({
      severity: "critical",
      category: "frequency",
      description: "Key working sessions significantly below expected frequency",
    });
  } else if (compliance < 0.6) {
    concerns.push({
      severity: "significant",
      category: "frequency",
      description: "Key working sessions below expected frequency",
    });
  }

  // High turnover
  if (input.keyworkerChangesLast12Months >= 3) {
    concerns.push({
      severity: "critical",
      category: "stability",
      description: "Multiple keyworker changes undermining relationship stability",
    });
  } else if (input.keyworkerChangesLast12Months >= 2) {
    concerns.push({
      severity: "significant",
      category: "stability",
      description: "Keyworker changes impacting continuity of relationship",
    });
  }

  // Child refusing/low engagement
  const refused = occurred.filter(s => s.childEngagement === "refused");
  const low = occurred.filter(s => s.childEngagement === "low");
  if (refused.length >= 3) {
    concerns.push({
      severity: "significant",
      category: "engagement",
      description: "Child repeatedly refusing keywork — explore reasons and adapt approach",
    });
  } else if (low.length >= 3 && occurred.length > 0 && low.length / occurred.length > 0.5) {
    concerns.push({
      severity: "moderate",
      category: "engagement",
      description: "Low child engagement in keywork sessions — consider format changes",
    });
  }

  // Not child-led
  if (occurred.length >= 3 && childLedRate < 0.2) {
    concerns.push({
      severity: "moderate",
      category: "voice",
      description: "Sessions rarely child-led — child may not feel ownership of sessions",
    });
  }

  // No wishes and feelings
  if (occurred.length >= 3) {
    const wishesRate = occurred.filter(s => s.wishesAndFeelingsRecorded).length / occurred.length;
    if (wishesRate < 0.3) {
      concerns.push({
        severity: "significant",
        category: "wishes_feelings",
        description: "Wishes and feelings rarely captured in keywork sessions",
      });
    }
  }

  // Staff cancelling
  const staffCancelled = input.sessions.filter(s => !s.occurred && s.cancelledBy === "staff");
  if (staffCancelled.length >= 3) {
    concerns.push({
      severity: "significant",
      category: "commitment",
      description: "Multiple sessions cancelled by staff — child may feel deprioritised",
    });
  }

  // Reg 44 not current
  if (!input.reg44VisitsCurrent) {
    concerns.push({
      severity: "significant",
      category: "oversight",
      description: "Regulation 44 visits not current — independent oversight lacking",
    });
  }

  return concerns;
}

// ── Strengths ───────────────────────────────────────────────────────────────

function identifyStrengths(
  input: KeyworkingInput,
  compliance: number,
  childLedRate: number,
  wishesRate: number,
  occurred: KeyworkSession[],
): KeyworkStrength[] {
  const strengths: KeyworkStrength[] = [];

  if (compliance >= 0.9 && occurred.length >= 3) {
    strengths.push({
      category: "frequency",
      description: "Keywork sessions consistently delivered as planned",
    });
  }

  if (input.keyworkerRelationshipMonths >= 6 && input.keyworkerChangesLast12Months === 0) {
    strengths.push({
      category: "stability",
      description: "Stable keyworker relationship providing continuity",
    });
  }

  if (childLedRate >= 0.6 && occurred.length >= 3) {
    strengths.push({
      category: "voice",
      description: "Majority of sessions child-led — child has ownership",
    });
  }

  if (wishesRate >= 0.8 && occurred.length >= 3) {
    strengths.push({
      category: "wishes_feelings",
      description: "Wishes and feelings consistently recorded",
    });
  }

  const highEngagement = occurred.filter(s => s.childEngagement === "high");
  if (highEngagement.length > occurred.length * 0.6 && occurred.length >= 3) {
    strengths.push({
      category: "engagement",
      description: "Child highly engaged in sessions — positive therapeutic relationship",
    });
  }

  if (input.reg44VisitsCurrent && input.reg44VisitorMeetsChild) {
    strengths.push({
      category: "oversight",
      description: "Regulation 44 visitor meets with child — independent voice",
    });
  }

  return strengths;
}

// ── Regulatory Flags ────────────────────────────────────────────────────────

function assessRegulatory(
  input: KeyworkingInput,
  compliance: number,
  wishesRate: number,
): RegulatoryFlag[] {
  const flags: RegulatoryFlag[] = [];

  // CHR 2015 Reg 5(a) — Quality of relationships
  const relGood = input.keyworkerRelationshipMonths >= 3 &&
    input.childKnowsKeyworker &&
    compliance >= 0.6;
  flags.push({
    regulation: "CHR 2015 Reg 5(a)",
    area: "Staff Relationships",
    status: relGood ? "met" : compliance >= 0.4 ? "partially_met" : "not_met",
    detail: relGood
      ? "Positive keyworker relationship with regular sessions"
      : "Key working relationship or frequency needs improvement",
  });

  // SCCIF — Child's voice
  const voiceGood = wishesRate >= 0.6 && input.childCanChooseTopics;
  flags.push({
    regulation: "SCCIF",
    area: "Child's Voice",
    status: voiceGood ? "met" : wishesRate > 0 ? "partially_met" : "not_met",
    detail: voiceGood
      ? "Child's wishes and feelings actively sought and recorded"
      : "Insufficient recording of child's wishes and feelings",
  });

  // Reg 44 — Independent oversight
  flags.push({
    regulation: "Reg 44",
    area: "Independent Visits",
    status: input.reg44VisitsCurrent ? "met" : "not_met",
    detail: input.reg44VisitsCurrent
      ? "Regulation 44 visits current"
      : "Regulation 44 visits not current — independent oversight required",
  });

  // CHR 2015 Reg 10 — Wellbeing
  const occurred = input.sessions.filter(s => s.occurred);
  const wellbeingCovered = occurred.some(s => s.topicsCovered.includes("wellbeing"));
  const healthCovered = occurred.some(s => s.topicsCovered.includes("health"));
  flags.push({
    regulation: "CHR 2015 Reg 10",
    area: "Wellbeing",
    status: (wellbeingCovered || healthCovered) ? "met" : occurred.length > 0 ? "partially_met" : "not_met",
    detail: (wellbeingCovered || healthCovered)
      ? "Wellbeing and health discussed in keywork sessions"
      : "Wellbeing/health not evidenced in keywork records",
  });

  return flags;
}

// ── Recommendations ─────────────────────────────────────────────────────────

function buildRecommendations(
  input: KeyworkingInput,
  compliance: number,
  childLedRate: number,
  topics: TopicCoverage[],
  occurred: KeyworkSession[],
): string[] {
  const recs: string[] = [];

  if (compliance < 0.7) {
    recs.push("Increase keywork session frequency to meet agreed schedule");
  }

  if (childLedRate < 0.4 && occurred.length >= 2) {
    recs.push("Enable child to lead sessions more — offer topic choice cards or activity-based formats");
  }

  if (occurred.length >= 2) {
    const wishesRate = occurred.filter(s => s.wishesAndFeelingsRecorded).length / occurred.length;
    if (wishesRate < 0.5) {
      recs.push("Record wishes and feelings in every keywork session");
    }
  }

  if (input.keyworkerChangesLast12Months >= 2) {
    recs.push("Prioritise keyworker stability — frequent changes disrupt trust-building");
  }

  // Missing topic areas
  const coveredTopics = new Set(topics.map(t => t.topic));
  const essentialTopics: SessionTopic[] = ["wellbeing", "education", "health", "wishes_feelings"];
  const missing = essentialTopics.filter(t => !coveredTopics.has(t));
  if (missing.length > 0 && occurred.length >= 3) {
    recs.push(`Cover ${missing.map(t => t.replace(/_/g, " ")).join(", ")} in upcoming sessions`);
  }

  if (!input.reg44VisitsCurrent) {
    recs.push("Ensure Regulation 44 visits are current and visitor meets child");
  }

  // Low engagement
  const lowOrRefused = occurred.filter(s => s.childEngagement === "low" || s.childEngagement === "refused");
  if (lowOrRefused.length >= 2 && occurred.length > 0 && lowOrRefused.length / occurred.length > 0.4) {
    recs.push("Adapt keywork format — try activity-based or out-of-home sessions to improve engagement");
  }

  // Private time
  const privateRate = occurred.length > 0
    ? occurred.filter(s => s.privateTime).length / occurred.length
    : 0;
  if (privateRate < 0.5 && occurred.length >= 2) {
    recs.push("Ensure private 1:1 time in every keywork session");
  }

  return recs;
}

// ── Summary ─────────────────────────────────────────────────────────────────

function buildSummary(
  childName: string,
  rating: string,
  compliance: number,
  childLedRate: number,
): string {
  const compDesc = compliance >= 0.9 ? "consistently delivered" :
    compliance >= 0.6 ? "mostly regular" :
    compliance > 0 ? "below expected frequency" : "not occurring";
  const ledDesc = childLedRate >= 0.6 ? "child-led" :
    childLedRate >= 0.3 ? "partly child-led" : "staff-directed";
  return `${childName}: Keywork rated ${rating.replace(/_/g, " ")}. Sessions ${compDesc}, ${ledDesc}.`;
}

// ── Utility ─────────────────────────────────────────────────────────────────

function scoreToRating(score: number): "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate" {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 55) return "adequate";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}
