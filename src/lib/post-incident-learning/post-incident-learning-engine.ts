// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Post-Incident Learning Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls.
// Analyses how effectively a children's home learns from incidents, near
// misses, and challenging situations:
//   - Debrief timeliness & quality (child + staff debriefs, root cause, lessons)
//   - Learning effectiveness (actions completed, evidence, practice changes)
//   - Pattern recognition (triggers, strategies, multi-agency working)
//   - Team learning (sessions, attendance, action completion)
//
// Regulatory framework:
//   CHR 2015 Reg 12 (safeguarding), Reg 40 (notification of incidents)
//   SCCIF — how well children are helped and protected
//   NMS 3 (safeguarding)
//   Working Together 2023 — learning from practice
//   UNCRC Article 19 (protection from violence)
//   CA 1989 s47
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ───────────────────────────────────────────────────────────────────

export type IncidentType =
  | "physical_intervention"
  | "self_harm"
  | "missing_from_care"
  | "property_damage"
  | "verbal_aggression"
  | "substance_misuse"
  | "exploitation_concern"
  | "safeguarding_concern"
  | "medication_error"
  | "near_miss";

export type DebriefStatus =
  | "completed_within_24h"
  | "completed_late"
  | "not_completed"
  | "not_required";

export type LearningOutcome =
  | "practice_change"
  | "policy_update"
  | "training_delivered"
  | "environment_change"
  | "staffing_change"
  | "no_change_needed"
  | "pending_review";

export type ReviewQuality =
  | "thorough"
  | "adequate"
  | "superficial"
  | "not_completed";

export type RecurrencePattern =
  | "first_occurrence"
  | "recurring"
  | "escalating"
  | "de_escalating"
  | "chronic";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Input Interfaces ────────────────────────────────────────────────────────

export interface PostIncidentReview {
  id: string;
  incidentId: string;
  incidentType: IncidentType;
  incidentDate: string;
  reviewDate: string | null;
  reviewedBy: string | null;
  debriefStatus: DebriefStatus;
  childInvolved: boolean;
  childDebrief: boolean | null;
  staffDebrief: boolean;
  rootCauseIdentified: boolean;
  lessonsDocumented: boolean;
  reviewQuality: ReviewQuality;
}

export interface LearningAction {
  id: string;
  reviewId: string;
  learningOutcome: LearningOutcome;
  description: string;
  assignedTo: string;
  dueDate: string;
  completedDate: string | null;
  evidenceRecorded: boolean;
}

export interface PatternAnalysis {
  id: string;
  childId: string | null;
  childName: string | null;
  incidentType: IncidentType;
  recurrencePattern: RecurrencePattern;
  frequency: number;
  triggerIdentified: boolean;
  strategiesUpdated: boolean;
  multiAgencyInvolved: boolean;
}

export interface TeamLearningSession {
  id: string;
  sessionDate: string;
  facilitator: string;
  topic: string;
  incidentRelated: boolean;
  attendeeCount: number;
  totalStaff: number;
  actionPointsGenerated: number;
  actionPointsCompleted: number;
}

// ── Result Interfaces ───────────────────────────────────────────────────────

export interface DebriefQualityResult {
  overallScore: number;
  totalReviews: number;
  within24hRate: number;
  completedRate: number;
  childDebriefRate: number;
  staffDebriefRate: number;
  rootCauseRate: number;
  lessonsDocumentedRate: number;
  qualityDistribution: Record<ReviewQuality, number>;
}

export interface LearningEffectivenessResult {
  overallScore: number;
  totalActions: number;
  completedRate: number;
  evidenceRate: number;
  practiceChangeCount: number;
  policyUpdateCount: number;
  trainingDeliveredCount: number;
  outcomeDistribution: Record<LearningOutcome, number>;
}

export interface PatternRecognitionResult {
  overallScore: number;
  totalPatterns: number;
  triggerIdentifiedRate: number;
  strategiesUpdatedRate: number;
  multiAgencyRate: number;
  escalatingCount: number;
  chronicCount: number;
  recurringRate: number;
}

export interface TeamLearningResult {
  overallScore: number;
  totalSessions: number;
  incidentRelatedRate: number;
  averageAttendance: number;
  actionCompletionRate: number;
  averageActionPoints: number;
}

export interface IncidentLearningProfile {
  incidentType: IncidentType;
  reviewCount: number;
  debriefRate: number;
  lessonsRate: number;
  recurrencePattern: RecurrencePattern | null;
  overallScore: number;
}

export interface PostIncidentLearningIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  debriefQuality: DebriefQualityResult;
  learningEffectiveness: LearningEffectivenessResult;
  patternRecognition: PatternRecognitionResult;
  teamLearning: TeamLearningResult;
  incidentProfiles: IncidentLearningProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Label Functions ─────────────────────────────────────────────────────────

export function getIncidentTypeLabel(t: IncidentType): string {
  const labels: Record<IncidentType, string> = {
    physical_intervention: "Physical Intervention",
    self_harm: "Self-Harm",
    missing_from_care: "Missing from Care",
    property_damage: "Property Damage",
    verbal_aggression: "Verbal Aggression",
    substance_misuse: "Substance Misuse",
    exploitation_concern: "Exploitation Concern",
    safeguarding_concern: "Safeguarding Concern",
    medication_error: "Medication Error",
    near_miss: "Near Miss",
  };
  return labels[t] || t;
}

export function getDebriefStatusLabel(s: DebriefStatus): string {
  const labels: Record<DebriefStatus, string> = {
    completed_within_24h: "Completed Within 24h",
    completed_late: "Completed Late",
    not_completed: "Not Completed",
    not_required: "Not Required",
  };
  return labels[s] || s;
}

export function getLearningOutcomeLabel(o: LearningOutcome): string {
  const labels: Record<LearningOutcome, string> = {
    practice_change: "Practice Change",
    policy_update: "Policy Update",
    training_delivered: "Training Delivered",
    environment_change: "Environment Change",
    staffing_change: "Staffing Change",
    no_change_needed: "No Change Needed",
    pending_review: "Pending Review",
  };
  return labels[o] || o;
}

export function getReviewQualityLabel(q: ReviewQuality): string {
  const labels: Record<ReviewQuality, string> = {
    thorough: "Thorough",
    adequate: "Adequate",
    superficial: "Superficial",
    not_completed: "Not Completed",
  };
  return labels[q] || q;
}

export function getRecurrencePatternLabel(p: RecurrencePattern): string {
  const labels: Record<RecurrencePattern, string> = {
    first_occurrence: "First Occurrence",
    recurring: "Recurring",
    escalating: "Escalating",
    de_escalating: "De-escalating",
    chronic: "Chronic",
  };
  return labels[p] || p;
}

export function getRatingLabel(r: Rating): string {
  const labels: Record<Rating, string> = {
    outstanding: "Outstanding",
    good: "Good",
    requires_improvement: "Requires Improvement",
    inadequate: "Inadequate",
  };
  return labels[r] || r;
}

// ── Core Evaluation Functions ───────────────────────────────────────────────

/**
 * Evaluate debrief quality and timeliness.
 * After incidents, debriefs with children and staff must happen promptly.
 * Root cause analysis and lesson documentation are key quality markers.
 * Score: 0-25
 *
 * Breakdown:
 *   within 24h rate  → 0-7
 *   child debrief    → 0-5
 *   root cause       → 0-5
 *   lessons documented → 0-4
 *   staff debrief    → 0-4
 *
 * Empty data = 25 (no incidents to review = positive)
 */
export function evaluateDebriefQuality(
  reviews: PostIncidentReview[],
): DebriefQualityResult {
  if (reviews.length === 0) {
    return {
      overallScore: 25,
      totalReviews: 0,
      within24hRate: 0,
      completedRate: 0,
      childDebriefRate: 0,
      staffDebriefRate: 0,
      rootCauseRate: 0,
      lessonsDocumentedRate: 0,
      qualityDistribution: { thorough: 0, adequate: 0, superficial: 0, not_completed: 0 },
    };
  }

  const total = reviews.length;

  // Within 24h
  const within24h = reviews.filter((r) => r.debriefStatus === "completed_within_24h").length;
  const within24hRate = pct(within24h, total);

  // Completed (within 24h + late)
  const completed = reviews.filter(
    (r) => r.debriefStatus === "completed_within_24h" || r.debriefStatus === "completed_late",
  ).length;
  const completedRate = pct(completed, total);

  // Child debrief rate — only for reviews where child was involved
  const childApplicable = reviews.filter((r) => r.childInvolved);
  const childDebriefed = childApplicable.filter((r) => r.childDebrief === true).length;
  const childDebriefRate = pct(childDebriefed, childApplicable.length);

  // Staff debrief rate
  const staffDebriefed = reviews.filter((r) => r.staffDebrief).length;
  const staffDebriefRate = pct(staffDebriefed, total);

  // Root cause identification rate
  const rootCauseCount = reviews.filter((r) => r.rootCauseIdentified).length;
  const rootCauseRate = pct(rootCauseCount, total);

  // Lessons documented rate
  const lessonsCount = reviews.filter((r) => r.lessonsDocumented).length;
  const lessonsDocumentedRate = pct(lessonsCount, total);

  // Quality distribution
  const qualityDistribution: Record<ReviewQuality, number> = {
    thorough: 0,
    adequate: 0,
    superficial: 0,
    not_completed: 0,
  };
  for (const r of reviews) {
    qualityDistribution[r.reviewQuality]++;
  }

  // Scoring
  let score = 0;
  score += (within24hRate / 100) * 7;       // 0-7
  score += (childDebriefRate / 100) * 5;     // 0-5
  score += (rootCauseRate / 100) * 5;        // 0-5
  score += (lessonsDocumentedRate / 100) * 4; // 0-4
  score += (staffDebriefRate / 100) * 4;     // 0-4

  return {
    overallScore: Math.round(clamp(score, 0, 25) * 10) / 10,
    totalReviews: total,
    within24hRate,
    completedRate,
    childDebriefRate,
    staffDebriefRate,
    rootCauseRate,
    lessonsDocumentedRate,
    qualityDistribution,
  };
}

/**
 * Evaluate learning effectiveness — how well lessons translate into action.
 * Score: 0-25
 *
 * Breakdown:
 *   completed rate    → 0-8
 *   evidence recorded → 0-6
 *   practice changes  → 0-5 (count-based: 1pt per change, max 5)
 *   policy updates    → 0-3 (count-based: 1pt per update, max 3)
 *   training delivered → 0-3 (count-based: 1pt per training, max 3)
 *
 * Empty data = 0 if reviews exist but no actions, 25 if no reviews at all
 */
export function evaluateLearningEffectiveness(
  actions: LearningAction[],
  hasReviews: boolean,
): LearningEffectivenessResult {
  const emptyDistribution: Record<LearningOutcome, number> = {
    practice_change: 0,
    policy_update: 0,
    training_delivered: 0,
    environment_change: 0,
    staffing_change: 0,
    no_change_needed: 0,
    pending_review: 0,
  };

  if (actions.length === 0) {
    return {
      overallScore: hasReviews ? 0 : 25,
      totalActions: 0,
      completedRate: 0,
      evidenceRate: 0,
      practiceChangeCount: 0,
      policyUpdateCount: 0,
      trainingDeliveredCount: 0,
      outcomeDistribution: { ...emptyDistribution },
    };
  }

  const total = actions.length;

  // Completed rate
  const completedCount = actions.filter((a) => a.completedDate !== null).length;
  const completedRate = pct(completedCount, total);

  // Evidence rate
  const evidenceCount = actions.filter((a) => a.evidenceRecorded).length;
  const evidenceRate = pct(evidenceCount, total);

  // Outcome counts
  const outcomeDistribution: Record<LearningOutcome, number> = { ...emptyDistribution };
  for (const a of actions) {
    outcomeDistribution[a.learningOutcome]++;
  }

  const practiceChangeCount = outcomeDistribution.practice_change;
  const policyUpdateCount = outcomeDistribution.policy_update;
  const trainingDeliveredCount = outcomeDistribution.training_delivered;

  // Scoring
  let score = 0;
  score += (completedRate / 100) * 8;             // 0-8
  score += (evidenceRate / 100) * 6;              // 0-6
  score += Math.min(practiceChangeCount, 5);      // 0-5
  score += Math.min(policyUpdateCount, 3);        // 0-3
  score += Math.min(trainingDeliveredCount, 3);   // 0-3

  return {
    overallScore: Math.round(clamp(score, 0, 25) * 10) / 10,
    totalActions: total,
    completedRate,
    evidenceRate,
    practiceChangeCount,
    policyUpdateCount,
    trainingDeliveredCount,
    outcomeDistribution,
  };
}

/**
 * Evaluate pattern recognition — identifying recurring issues and responding.
 * Score: 0-25
 *
 * Breakdown:
 *   trigger identified   → 0-7
 *   strategies updated   → 0-6
 *   multi-agency         → 0-5
 *   penalty: -4 per escalating pattern
 *   penalty: -2 per chronic pattern
 *
 * Empty data = 25 (no patterns = good)
 */
export function evaluatePatternRecognition(
  patterns: PatternAnalysis[],
): PatternRecognitionResult {
  if (patterns.length === 0) {
    return {
      overallScore: 25,
      totalPatterns: 0,
      triggerIdentifiedRate: 0,
      strategiesUpdatedRate: 0,
      multiAgencyRate: 0,
      escalatingCount: 0,
      chronicCount: 0,
      recurringRate: 0,
    };
  }

  const total = patterns.length;

  // Trigger identification rate
  const triggerCount = patterns.filter((p) => p.triggerIdentified).length;
  const triggerIdentifiedRate = pct(triggerCount, total);

  // Strategies updated rate
  const strategiesCount = patterns.filter((p) => p.strategiesUpdated).length;
  const strategiesUpdatedRate = pct(strategiesCount, total);

  // Multi-agency involvement rate
  const multiAgencyCount = patterns.filter((p) => p.multiAgencyInvolved).length;
  const multiAgencyRate = pct(multiAgencyCount, total);

  // Escalating and chronic counts
  const escalatingCount = patterns.filter((p) => p.recurrencePattern === "escalating").length;
  const chronicCount = patterns.filter((p) => p.recurrencePattern === "chronic").length;

  // Recurring rate (recurring + escalating + chronic)
  const recurringPatterns = patterns.filter(
    (p) =>
      p.recurrencePattern === "recurring" ||
      p.recurrencePattern === "escalating" ||
      p.recurrencePattern === "chronic",
  ).length;
  const recurringRate = pct(recurringPatterns, total);

  // Scoring
  let score = 0;
  score += (triggerIdentifiedRate / 100) * 7;      // 0-7
  score += (strategiesUpdatedRate / 100) * 6;      // 0-6
  score += (multiAgencyRate / 100) * 5;            // 0-5
  score -= escalatingCount * 4;                     // penalty
  score -= chronicCount * 2;                        // penalty

  return {
    overallScore: Math.round(clamp(score, 0, 25) * 10) / 10,
    totalPatterns: total,
    triggerIdentifiedRate,
    strategiesUpdatedRate,
    multiAgencyRate,
    escalatingCount,
    chronicCount,
    recurringRate,
  };
}

/**
 * Evaluate team learning — how the team collectively learns from incidents.
 * Score: 0-25
 *
 * Breakdown:
 *   average attendance      → 0-7
 *   action completion rate  → 0-6
 *   incident-related rate   → 0-5
 *   frequency bonus         → 0-4 (based on session count)
 *   average action points   → 0-3
 *
 * Empty data = 0
 */
export function evaluateTeamLearning(
  sessions: TeamLearningSession[],
): TeamLearningResult {
  if (sessions.length === 0) {
    return {
      overallScore: 0,
      totalSessions: 0,
      incidentRelatedRate: 0,
      averageAttendance: 0,
      actionCompletionRate: 0,
      averageActionPoints: 0,
    };
  }

  const total = sessions.length;

  // Incident-related rate
  const incidentRelated = sessions.filter((s) => s.incidentRelated).length;
  const incidentRelatedRate = pct(incidentRelated, total);

  // Average attendance (as percentage)
  const attendanceRates = sessions.map((s) =>
    s.totalStaff > 0 ? (s.attendeeCount / s.totalStaff) * 100 : 0,
  );
  const averageAttendance = Math.round(
    attendanceRates.reduce((sum, r) => sum + r, 0) / total,
  );

  // Action completion rate
  const totalGenerated = sessions.reduce((sum, s) => sum + s.actionPointsGenerated, 0);
  const totalCompleted = sessions.reduce((sum, s) => sum + s.actionPointsCompleted, 0);
  const actionCompletionRate = pct(totalCompleted, totalGenerated);

  // Average action points per session
  const averageActionPoints = Math.round((totalGenerated / total) * 10) / 10;

  // Scoring
  let score = 0;
  score += (averageAttendance / 100) * 7;          // 0-7
  score += (actionCompletionRate / 100) * 6;       // 0-6
  score += (incidentRelatedRate / 100) * 5;        // 0-5

  // Frequency bonus: 1pt per session, max 4
  score += Math.min(total, 4);                      // 0-4

  // Average action points bonus: 1pt per avg action point, max 3
  score += Math.min(Math.floor(averageActionPoints), 3); // 0-3

  return {
    overallScore: Math.round(clamp(score, 0, 25) * 10) / 10,
    totalSessions: total,
    incidentRelatedRate,
    averageAttendance,
    actionCompletionRate,
    averageActionPoints,
  };
}

// ── Incident Profile Builder ────────────────────────────────────────────────

function buildIncidentProfiles(
  reviews: PostIncidentReview[],
  patterns: PatternAnalysis[],
): IncidentLearningProfile[] {
  const typeMap = new Map<
    IncidentType,
    { reviews: PostIncidentReview[]; pattern: PatternAnalysis | null }
  >();

  for (const r of reviews) {
    if (!typeMap.has(r.incidentType)) {
      typeMap.set(r.incidentType, { reviews: [], pattern: null });
    }
    typeMap.get(r.incidentType)!.reviews.push(r);
  }

  for (const p of patterns) {
    if (!typeMap.has(p.incidentType)) {
      typeMap.set(p.incidentType, { reviews: [], pattern: null });
    }
    typeMap.get(p.incidentType)!.pattern = p;
  }

  const profiles: IncidentLearningProfile[] = [];
  for (const [incidentType, data] of typeMap) {
    const revs = data.reviews;
    const reviewCount = revs.length;

    const debriefedCount = revs.filter(
      (r) =>
        r.debriefStatus === "completed_within_24h" ||
        r.debriefStatus === "completed_late",
    ).length;
    const debriefRate = pct(debriefedCount, reviewCount);

    const lessonsCount = revs.filter((r) => r.lessonsDocumented).length;
    const lessonsRate = pct(lessonsCount, reviewCount);

    const recurrencePattern = data.pattern?.recurrencePattern ?? null;

    // Score 0-10: debrief (0-4) + lessons (0-3) + pattern penalty
    let profileScore = 0;
    profileScore += (debriefRate / 100) * 4;
    profileScore += (lessonsRate / 100) * 3;

    // Bonus for no recurring pattern or first occurrence
    if (recurrencePattern === null || recurrencePattern === "first_occurrence") {
      profileScore += 2;
    } else if (recurrencePattern === "de_escalating") {
      profileScore += 1;
    } else if (recurrencePattern === "escalating") {
      profileScore -= 1;
    } else if (recurrencePattern === "chronic") {
      profileScore -= 0.5;
    }

    // If no reviews but pattern exists, base score on pattern quality
    if (reviewCount === 0 && data.pattern) {
      profileScore = data.pattern.triggerIdentified ? 3 : 1;
      if (recurrencePattern === "escalating") profileScore -= 1;
      if (recurrencePattern === "chronic") profileScore -= 0.5;
    }

    profiles.push({
      incidentType,
      reviewCount,
      debriefRate,
      lessonsRate,
      recurrencePattern,
      overallScore: Math.round(clamp(profileScore, 0, 10) * 10) / 10,
    });
  }

  return profiles.sort((a, b) => a.overallScore - b.overallScore);
}

// ── Main Intelligence Function ──────────────────────────────────────────────

export function generatePostIncidentLearningIntelligence(
  reviews: PostIncidentReview[],
  actions: LearningAction[],
  patterns: PatternAnalysis[],
  sessions: TeamLearningSession[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): PostIncidentLearningIntelligence {
  const debrief = evaluateDebriefQuality(reviews);
  const learning = evaluateLearningEffectiveness(actions, reviews.length > 0);
  const pattern = evaluatePatternRecognition(patterns);
  const team = evaluateTeamLearning(sessions);

  const overallScore = Math.round(
    (debrief.overallScore + learning.overallScore + pattern.overallScore + team.overallScore) * 10,
  ) / 10;
  const rating = getRating(overallScore);

  const incidentProfiles = buildIncidentProfiles(reviews, patterns);

  // ── Strengths ──
  const strengths: string[] = [];
  if (debrief.within24hRate >= 80 && debrief.totalReviews > 0) {
    strengths.push("Excellent debrief timeliness — reviews consistently completed within 24 hours");
  }
  if (debrief.childDebriefRate >= 80 && debrief.totalReviews > 0) {
    strengths.push("Children are meaningfully included in post-incident debriefs, respecting their right to be heard");
  }
  if (debrief.rootCauseRate >= 80 && debrief.totalReviews > 0) {
    strengths.push("Root cause analysis is consistently conducted, enabling deeper understanding of incidents");
  }
  if (debrief.lessonsDocumentedRate >= 80 && debrief.totalReviews > 0) {
    strengths.push("Lessons are well-documented following incidents, supporting organisational learning");
  }
  if (learning.completedRate >= 80 && learning.totalActions > 0) {
    strengths.push("Strong follow-through on learning actions — identified improvements are being implemented");
  }
  if (learning.evidenceRate >= 80 && learning.totalActions > 0) {
    strengths.push("Evidence of learning is consistently recorded, demonstrating accountability");
  }
  if (pattern.triggerIdentifiedRate >= 80 && pattern.totalPatterns > 0) {
    strengths.push("Triggers for recurring incidents are well-identified, supporting preventative approaches");
  }
  if (pattern.strategiesUpdatedRate >= 80 && pattern.totalPatterns > 0) {
    strengths.push("Strategies are regularly updated in response to incident patterns");
  }
  if (pattern.escalatingCount === 0 && pattern.chronicCount === 0 && pattern.totalPatterns > 0) {
    strengths.push("No escalating or chronic patterns — incident management is effective");
  }
  if (team.averageAttendance >= 80 && team.totalSessions > 0) {
    strengths.push("Strong staff attendance at team learning sessions, building collective knowledge");
  }
  if (team.actionCompletionRate >= 80 && team.totalSessions > 0) {
    strengths.push("Team learning action points are consistently completed, embedding improvements");
  }
  if (debrief.totalReviews === 0) {
    strengths.push("No incidents requiring review in the period — a positive indicator of home stability");
  }

  // ── Areas for Improvement ──
  const areasForImprovement: string[] = [];
  if (debrief.within24hRate < 60 && debrief.totalReviews > 0) {
    areasForImprovement.push("Post-incident reviews need to be completed more promptly — within 24 hours where possible");
  }
  if (debrief.childDebriefRate < 60 && debrief.totalReviews > 0) {
    areasForImprovement.push("Children should be more routinely included in post-incident debriefs where appropriate");
  }
  if (debrief.staffDebriefRate < 70 && debrief.totalReviews > 0) {
    areasForImprovement.push("Staff debriefs are not consistently conducted after incidents");
  }
  if (debrief.rootCauseRate < 60 && debrief.totalReviews > 0) {
    areasForImprovement.push("Root cause analysis needs to be more consistently applied to understand incident drivers");
  }
  if (debrief.lessonsDocumentedRate < 60 && debrief.totalReviews > 0) {
    areasForImprovement.push("Lessons from incidents are not being consistently documented");
  }
  if (learning.completedRate < 60 && learning.totalActions > 0) {
    areasForImprovement.push("Learning actions are identified but not consistently completed");
  }
  if (learning.evidenceRate < 60 && learning.totalActions > 0) {
    areasForImprovement.push("Evidence of learning implementation needs to be more consistently recorded");
  }
  if (pattern.escalatingCount > 0) {
    areasForImprovement.push(`${pattern.escalatingCount} escalating incident pattern(s) identified — urgent review of strategies needed`);
  }
  if (pattern.chronicCount > 0) {
    areasForImprovement.push(`${pattern.chronicCount} chronic incident pattern(s) identified — sustained intervention required`);
  }
  if (pattern.triggerIdentifiedRate < 60 && pattern.totalPatterns > 0) {
    areasForImprovement.push("Triggers for recurring incidents need to be more consistently identified");
  }
  if (team.totalSessions === 0) {
    areasForImprovement.push("No team learning sessions recorded — regular reflective practice is essential");
  }
  if (team.averageAttendance < 60 && team.totalSessions > 0) {
    areasForImprovement.push("Staff attendance at team learning sessions needs to improve");
  }
  if (team.actionCompletionRate < 60 && team.totalSessions > 0) {
    areasForImprovement.push("Action points from team learning sessions are not being consistently completed");
  }

  // ── Actions ──
  const actions_list: string[] = [];
  const notCompletedReviews = reviews.filter((r) => r.debriefStatus === "not_completed").length;
  if (notCompletedReviews > 0) {
    actions_list.push(`URGENT: Complete ${notCompletedReviews} outstanding post-incident review(s)`);
  }
  if (pattern.escalatingCount > 0) {
    actions_list.push("URGENT: Conduct multi-agency strategy meeting for escalating incident patterns");
  }
  if (learning.totalActions > 0 && learning.completedRate < 50) {
    actions_list.push("HIGH: Review and prioritise outstanding learning actions for completion");
  }
  if (debrief.childDebriefRate < 50 && debrief.totalReviews > 0) {
    actions_list.push("HIGH: Review debrief processes to ensure children are supported to participate");
  }
  if (debrief.rootCauseRate < 50 && debrief.totalReviews > 0) {
    actions_list.push("HIGH: Provide staff training on root cause analysis techniques");
  }
  if (team.totalSessions === 0) {
    actions_list.push("HIGH: Establish regular team learning sessions with incident-focused agenda items");
  }
  if (pattern.triggerIdentifiedRate < 50 && pattern.totalPatterns > 0) {
    actions_list.push("MEDIUM: Invest in trigger analysis for recurring incident patterns");
  }
  if (team.averageAttendance < 60 && team.totalSessions > 0) {
    actions_list.push("MEDIUM: Review scheduling of team learning sessions to maximise attendance");
  }
  if (debrief.lessonsDocumentedRate < 60 && debrief.totalReviews > 0) {
    actions_list.push("MEDIUM: Introduce a structured lessons-learned template for post-incident reviews");
  }
  if (learning.evidenceRate < 50 && learning.totalActions > 0) {
    actions_list.push("LOW: Develop an evidence recording framework for learning action completion");
  }

  // ── Regulatory Links ──
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 12 — the protection of children, including safeguarding policies and procedures",
    "CHR 2015 Reg 40 — notification of serious events and incidents to Ofsted and relevant bodies",
    "SCCIF — how well children and young people are helped and protected, including learning from incidents",
    "NMS 3 — safeguarding children, including post-incident learning and review processes",
    "Working Together to Safeguard Children 2023 — learning from practice, local and national reviews",
    "UNCRC Article 19 — protection of children from all forms of violence, abuse, and neglect",
    "Children Act 1989 s47 — local authority duty to investigate where there is reasonable cause for concern",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    debriefQuality: debrief,
    learningEffectiveness: learning,
    patternRecognition: pattern,
    teamLearning: team,
    incidentProfiles,
    strengths,
    areasForImprovement,
    actions: actions_list,
    regulatoryLinks,
  };
}
