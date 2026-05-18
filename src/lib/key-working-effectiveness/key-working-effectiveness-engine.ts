// ==============================================================================
// Cornerstone Key Working Effectiveness Intelligence Engine
//
// Deterministic engine for evaluating key working effectiveness across
// session quality, relationship strength, care plan integration, and
// professional development in children's residential care.
//
// Aligned to:
//   - CHR 2015 Reg 5  -- Engaging with the individual child
//   - CHR 2015 Reg 14 -- Care planning standard
//   - SCCIF           -- Quality of care judgement area
//   - UNCRC Article 12 -- Right to be heard
//   - NMS 2           -- A positive and individual approach for each child
//   - NMS 19          -- Staffing (sufficient, competent key workers)
//   - Working Together 2023 -- Multi-agency working and child voice
//
// No AI. No external calls. Pure input -> output.
// ==============================================================================

// -- Types -------------------------------------------------------------------

export type SessionType =
  | "one_to_one"
  | "informal_check_in"
  | "care_plan_review"
  | "activity_based"
  | "crisis_support"
  | "life_story_work"
  | "independence_planning"
  | "advocacy";

export type SessionQuality = "excellent" | "good" | "adequate" | "poor";

export type RelationshipQuality =
  | "strong_and_trusting"
  | "developing"
  | "inconsistent"
  | "difficult"
  | "not_established";

export type ChildEngagement =
  | "fully_engaged"
  | "mostly_engaged"
  | "partially_engaged"
  | "reluctant"
  | "refused";

export type CarePlanInput = "comprehensive" | "partial" | "minimal" | "none";

export type ChildVoiceEvidence =
  | "wishes_captured_and_acted"
  | "wishes_captured"
  | "token_consultation"
  | "not_sought";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Input Interfaces --------------------------------------------------------

export interface KeyWorkSession {
  id: string;
  childId: string;
  childName: string;
  keyWorkerId: string;
  keyWorkerName: string;
  date: string;
  durationMinutes: number;
  sessionType: SessionType;
  sessionQuality: SessionQuality;
  childEngagement: ChildEngagement;
  topicsCovered: string[];
  actionsAgreed: string[];
  actionsCompleted: number;
  childVoiceEvidence: ChildVoiceEvidence;
  recordedWithin24Hours: boolean;
  supervisorReviewed: boolean;
}

export interface KeyWorkerRelationship {
  id: string;
  childId: string;
  childName: string;
  keyWorkerId: string;
  keyWorkerName: string;
  relationshipQuality: RelationshipQuality;
  assignmentDate: string;
  keyWorkerChanges: number;
  childFeelsListenedTo: boolean;
  childTrustsKeyWorker: boolean;
  culturalCompetence: boolean;
  consistencyRating: number; // 1-10
}

export interface CarePlanContribution {
  id: string;
  childId: string;
  childName: string;
  keyWorkerId: string;
  keyWorkerName: string;
  carePlanInput: CarePlanInput;
  reviewsAttended: number;
  reviewsMissed: number;
  reportsTimely: boolean;
  childViewsRepresented: boolean;
  outcomesFocused: boolean;
}

export interface KeyWorkerDevelopment {
  id: string;
  keyWorkerId: string;
  keyWorkerName: string;
  trainingCompleted: string[];
  supervisionRegular: boolean;
  reflectivePractice: boolean;
  caseloadCount: number;
  peerSupportAccessed: boolean;
}

// -- Result Interfaces -------------------------------------------------------

export interface SessionEffectivenessResult {
  overallScore: number; // 0-25
  totalSessions: number;
  excellentGoodRate: number; // %
  childEngagementRate: number; // %
  childVoiceRate: number; // %
  recordingComplianceRate: number; // %
  averageDurationMinutes: number;
  actionsCompletionRate: number; // %
}

export interface RelationshipQualityResult {
  overallScore: number; // 0-25
  totalRelationships: number;
  strongDevelopingRate: number; // %
  childFeelsListenedRate: number; // %
  childTrustsRate: number; // %
  averageConsistencyRating: number;
  highTurnoverCount: number; // children with 3+ key worker changes
}

export interface CarePlanIntegrationResult {
  overallScore: number; // 0-25
  totalContributions: number;
  comprehensivePartialRate: number; // %
  reviewAttendanceRate: number; // %
  reportsTimelyRate: number; // %
  childViewsRepresentedRate: number; // %
  outcomesFocusedRate: number; // %
}

export interface ProfessionalDevelopmentResult {
  overallScore: number; // 0-25
  totalKeyWorkers: number;
  trainingComplianceRate: number; // %
  supervisionRegularRate: number; // %
  reflectivePracticeRate: number; // %
  managableCaseloadRate: number; // % with caseload <= 4
  peerSupportRate: number; // %
}

export interface ChildKeyWorkProfile {
  childId: string;
  childName: string;
  keyWorkerName: string;
  sessionCount: number;
  relationshipQuality: RelationshipQuality | "not_assessed";
  engagementRate: number; // %
  carePlanInput: CarePlanInput | "none";
  overallScore: number; // 0-10
}

export interface KeyWorkingEffectivenessIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number; // 0-100
  rating: Rating;
  sessionEffectiveness: SessionEffectivenessResult;
  relationshipQuality: RelationshipQualityResult;
  carePlanIntegration: CarePlanIntegrationResult;
  professionalDevelopment: ProfessionalDevelopmentResult;
  childProfiles: ChildKeyWorkProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers -----------------------------------------------------------------

export function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// -- Label Functions ---------------------------------------------------------

export function getSessionTypeLabel(t: SessionType): string {
  const labels: Record<SessionType, string> = {
    one_to_one: "One-to-One",
    informal_check_in: "Informal Check-In",
    care_plan_review: "Care Plan Review",
    activity_based: "Activity Based",
    crisis_support: "Crisis Support",
    life_story_work: "Life Story Work",
    independence_planning: "Independence Planning",
    advocacy: "Advocacy",
  };
  return labels[t] ?? t;
}

export function getSessionQualityLabel(q: SessionQuality): string {
  const labels: Record<SessionQuality, string> = {
    excellent: "Excellent",
    good: "Good",
    adequate: "Adequate",
    poor: "Poor",
  };
  return labels[q] ?? q;
}

export function getRelationshipQualityLabel(q: RelationshipQuality): string {
  const labels: Record<RelationshipQuality, string> = {
    strong_and_trusting: "Strong & Trusting",
    developing: "Developing",
    inconsistent: "Inconsistent",
    difficult: "Difficult",
    not_established: "Not Established",
  };
  return labels[q] ?? q;
}

export function getChildEngagementLabel(e: ChildEngagement): string {
  const labels: Record<ChildEngagement, string> = {
    fully_engaged: "Fully Engaged",
    mostly_engaged: "Mostly Engaged",
    partially_engaged: "Partially Engaged",
    reluctant: "Reluctant",
    refused: "Refused",
  };
  return labels[e] ?? e;
}

export function getCarePlanInputLabel(c: CarePlanInput): string {
  const labels: Record<CarePlanInput, string> = {
    comprehensive: "Comprehensive",
    partial: "Partial",
    minimal: "Minimal",
    none: "None",
  };
  return labels[c] ?? c;
}

export function getChildVoiceEvidenceLabel(v: ChildVoiceEvidence): string {
  const labels: Record<ChildVoiceEvidence, string> = {
    wishes_captured_and_acted: "Wishes Captured & Acted Upon",
    wishes_captured: "Wishes Captured",
    token_consultation: "Token Consultation",
    not_sought: "Not Sought",
  };
  return labels[v] ?? v;
}

export function getRatingLabel(r: Rating): string {
  const labels: Record<Rating, string> = {
    outstanding: "Outstanding",
    good: "Good",
    requires_improvement: "Requires Improvement",
    inadequate: "Inadequate",
  };
  return labels[r] ?? r;
}

// -- Evaluator 1: Session Effectiveness (0-25) -------------------------------

export function evaluateSessionEffectiveness(
  sessions: KeyWorkSession[],
): SessionEffectivenessResult {
  const total = sessions.length;

  if (total === 0) {
    return {
      overallScore: 0,
      totalSessions: 0,
      excellentGoodRate: 0,
      childEngagementRate: 0,
      childVoiceRate: 0,
      recordingComplianceRate: 0,
      averageDurationMinutes: 0,
      actionsCompletionRate: 0,
    };
  }

  const excellentGoodCount = sessions.filter(
    (s) => s.sessionQuality === "excellent" || s.sessionQuality === "good",
  ).length;
  const excellentGoodRate = pct(excellentGoodCount, total);

  const engagedCount = sessions.filter(
    (s) =>
      s.childEngagement === "fully_engaged" ||
      s.childEngagement === "mostly_engaged",
  ).length;
  const childEngagementRate = pct(engagedCount, total);

  const voiceCount = sessions.filter(
    (s) =>
      s.childVoiceEvidence === "wishes_captured_and_acted" ||
      s.childVoiceEvidence === "wishes_captured",
  ).length;
  const childVoiceRate = pct(voiceCount, total);

  const recordedCount = sessions.filter(
    (s) => s.recordedWithin24Hours,
  ).length;
  const recordingComplianceRate = pct(recordedCount, total);

  const totalDuration = sessions.reduce(
    (sum, s) => sum + s.durationMinutes,
    0,
  );
  const averageDurationMinutes = Math.round(totalDuration / total);

  const totalActionsAgreed = sessions.reduce(
    (sum, s) => sum + s.actionsAgreed.length,
    0,
  );
  const totalActionsCompleted = sessions.reduce(
    (sum, s) => sum + s.actionsCompleted,
    0,
  );
  const actionsCompletionRate = pct(totalActionsCompleted, totalActionsAgreed);

  // Score: weight each factor for 25 max
  // excellent/good rate: 8pts, engagement: 6pts, voice: 6pts, recording: 5pts
  const rawScore =
    (excellentGoodRate / 100) * 8 +
    (childEngagementRate / 100) * 6 +
    (childVoiceRate / 100) * 6 +
    (recordingComplianceRate / 100) * 5;

  const overallScore = clamp(Math.round(rawScore), 0, 25);

  return {
    overallScore,
    totalSessions: total,
    excellentGoodRate,
    childEngagementRate,
    childVoiceRate,
    recordingComplianceRate,
    averageDurationMinutes,
    actionsCompletionRate,
  };
}

// -- Evaluator 2: Relationship Quality (0-25) --------------------------------

export function evaluateRelationshipQuality(
  relationships: KeyWorkerRelationship[],
): RelationshipQualityResult {
  const total = relationships.length;

  if (total === 0) {
    return {
      overallScore: 0,
      totalRelationships: 0,
      strongDevelopingRate: 0,
      childFeelsListenedRate: 0,
      childTrustsRate: 0,
      averageConsistencyRating: 0,
      highTurnoverCount: 0,
    };
  }

  const strongDevelopingCount = relationships.filter(
    (r) =>
      r.relationshipQuality === "strong_and_trusting" ||
      r.relationshipQuality === "developing",
  ).length;
  const strongDevelopingRate = pct(strongDevelopingCount, total);

  const listenedCount = relationships.filter(
    (r) => r.childFeelsListenedTo,
  ).length;
  const childFeelsListenedRate = pct(listenedCount, total);

  const trustsCount = relationships.filter(
    (r) => r.childTrustsKeyWorker,
  ).length;
  const childTrustsRate = pct(trustsCount, total);

  const totalConsistency = relationships.reduce(
    (sum, r) => sum + r.consistencyRating,
    0,
  );
  const averageConsistencyRating = parseFloat(
    (totalConsistency / total).toFixed(1),
  );

  const highTurnoverCount = relationships.filter(
    (r) => r.keyWorkerChanges >= 3,
  ).length;

  // Score: strong+developing: 7pts, listened: 6pts, trusts: 6pts, consistency: 6pts
  // Penalty: -2 per high turnover child
  const rawScore =
    (strongDevelopingRate / 100) * 7 +
    (childFeelsListenedRate / 100) * 6 +
    (childTrustsRate / 100) * 6 +
    (averageConsistencyRating / 10) * 6 -
    highTurnoverCount * 2;

  const overallScore = clamp(Math.round(rawScore), 0, 25);

  return {
    overallScore,
    totalRelationships: total,
    strongDevelopingRate,
    childFeelsListenedRate,
    childTrustsRate,
    averageConsistencyRating,
    highTurnoverCount,
  };
}

// -- Evaluator 3: Care Plan Integration (0-25) --------------------------------

export function evaluateCarePlanIntegration(
  contributions: CarePlanContribution[],
): CarePlanIntegrationResult {
  const total = contributions.length;

  if (total === 0) {
    return {
      overallScore: 0,
      totalContributions: 0,
      comprehensivePartialRate: 0,
      reviewAttendanceRate: 0,
      reportsTimelyRate: 0,
      childViewsRepresentedRate: 0,
      outcomesFocusedRate: 0,
    };
  }

  const compPartialCount = contributions.filter(
    (c) => c.carePlanInput === "comprehensive" || c.carePlanInput === "partial",
  ).length;
  const comprehensivePartialRate = pct(compPartialCount, total);

  const totalReviewsAttended = contributions.reduce(
    (sum, c) => sum + c.reviewsAttended,
    0,
  );
  const totalReviews = contributions.reduce(
    (sum, c) => sum + c.reviewsAttended + c.reviewsMissed,
    0,
  );
  const reviewAttendanceRate = pct(totalReviewsAttended, totalReviews);

  const timelyCount = contributions.filter((c) => c.reportsTimely).length;
  const reportsTimelyRate = pct(timelyCount, total);

  const childViewsCount = contributions.filter(
    (c) => c.childViewsRepresented,
  ).length;
  const childViewsRepresentedRate = pct(childViewsCount, total);

  const outcomesCount = contributions.filter(
    (c) => c.outcomesFocused,
  ).length;
  const outcomesFocusedRate = pct(outcomesCount, total);

  // Score: input quality: 6pts, reviews: 5pts, timeliness: 5pts, child views: 5pts, outcomes: 4pts
  const rawScore =
    (comprehensivePartialRate / 100) * 6 +
    (reviewAttendanceRate / 100) * 5 +
    (reportsTimelyRate / 100) * 5 +
    (childViewsRepresentedRate / 100) * 5 +
    (outcomesFocusedRate / 100) * 4;

  const overallScore = clamp(Math.round(rawScore), 0, 25);

  return {
    overallScore,
    totalContributions: total,
    comprehensivePartialRate,
    reviewAttendanceRate,
    reportsTimelyRate,
    childViewsRepresentedRate,
    outcomesFocusedRate,
  };
}

// -- Evaluator 4: Professional Development (0-25) ----------------------------

export function evaluateProfessionalDevelopment(
  development: KeyWorkerDevelopment[],
): ProfessionalDevelopmentResult {
  const total = development.length;

  if (total === 0) {
    return {
      overallScore: 0,
      totalKeyWorkers: 0,
      trainingComplianceRate: 0,
      supervisionRegularRate: 0,
      reflectivePracticeRate: 0,
      managableCaseloadRate: 0,
      peerSupportRate: 0,
    };
  }

  const trainedCount = development.filter(
    (d) => d.trainingCompleted.length > 0,
  ).length;
  const trainingComplianceRate = pct(trainedCount, total);

  const supervisionCount = development.filter(
    (d) => d.supervisionRegular,
  ).length;
  const supervisionRegularRate = pct(supervisionCount, total);

  const reflectiveCount = development.filter(
    (d) => d.reflectivePractice,
  ).length;
  const reflectivePracticeRate = pct(reflectiveCount, total);

  const managableCount = development.filter(
    (d) => d.caseloadCount <= 4,
  ).length;
  const managableCaseloadRate = pct(managableCount, total);

  const peerSupportCount = development.filter(
    (d) => d.peerSupportAccessed,
  ).length;
  const peerSupportRate = pct(peerSupportCount, total);

  // Score: training: 6pts, supervision: 6pts, reflective: 5pts, caseload: 4pts, peer: 4pts
  const rawScore =
    (trainingComplianceRate / 100) * 6 +
    (supervisionRegularRate / 100) * 6 +
    (reflectivePracticeRate / 100) * 5 +
    (managableCaseloadRate / 100) * 4 +
    (peerSupportRate / 100) * 4;

  const overallScore = clamp(Math.round(rawScore), 0, 25);

  return {
    overallScore,
    totalKeyWorkers: total,
    trainingComplianceRate,
    supervisionRegularRate,
    reflectivePracticeRate,
    managableCaseloadRate,
    peerSupportRate,
  };
}

// -- Child Profiles -----------------------------------------------------------

export function buildChildKeyWorkProfiles(
  sessions: KeyWorkSession[],
  relationships: KeyWorkerRelationship[],
  contributions: CarePlanContribution[],
): ChildKeyWorkProfile[] {
  // Collect unique children from all sources
  const childMap = new Map<
    string,
    { childId: string; childName: string; keyWorkerName: string }
  >();

  for (const s of sessions) {
    if (!childMap.has(s.childId)) {
      childMap.set(s.childId, {
        childId: s.childId,
        childName: s.childName,
        keyWorkerName: s.keyWorkerName,
      });
    }
  }
  for (const r of relationships) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, {
        childId: r.childId,
        childName: r.childName,
        keyWorkerName: r.keyWorkerName,
      });
    }
  }
  for (const c of contributions) {
    if (!childMap.has(c.childId)) {
      childMap.set(c.childId, {
        childId: c.childId,
        childName: c.childName,
        keyWorkerName: c.keyWorkerName,
      });
    }
  }

  const profiles: ChildKeyWorkProfile[] = [];

  for (const [childId, info] of childMap) {
    const childSessions = sessions.filter((s) => s.childId === childId);
    const childRelationship = relationships.find(
      (r) => r.childId === childId,
    );
    const childContribution = contributions.find(
      (c) => c.childId === childId,
    );

    const sessionCount = childSessions.length;

    const engagedSessions = childSessions.filter(
      (s) =>
        s.childEngagement === "fully_engaged" ||
        s.childEngagement === "mostly_engaged",
    ).length;
    const engagementRate = pct(engagedSessions, sessionCount);

    const relationshipQuality: RelationshipQuality | "not_assessed" =
      childRelationship?.relationshipQuality ?? "not_assessed";

    const carePlanInput: CarePlanInput | "none" =
      childContribution?.carePlanInput ?? "none";

    // Calculate overall score out of 10
    let score = 0;

    // Session frequency: up to 3 points
    if (sessionCount >= 8) score += 3;
    else if (sessionCount >= 4) score += 2;
    else if (sessionCount >= 1) score += 1;

    // Engagement: up to 2 points
    if (engagementRate >= 80) score += 2;
    else if (engagementRate >= 50) score += 1;

    // Relationship: up to 2 points
    if (relationshipQuality === "strong_and_trusting") score += 2;
    else if (relationshipQuality === "developing") score += 1;

    // Care plan: up to 2 points
    if (carePlanInput === "comprehensive") score += 2;
    else if (carePlanInput === "partial") score += 1;

    // Voice evidence: up to 1 point
    const voiceSessions = childSessions.filter(
      (s) =>
        s.childVoiceEvidence === "wishes_captured_and_acted" ||
        s.childVoiceEvidence === "wishes_captured",
    ).length;
    if (sessionCount > 0 && pct(voiceSessions, sessionCount) >= 75) score += 1;

    profiles.push({
      childId,
      childName: info.childName,
      keyWorkerName: info.keyWorkerName,
      sessionCount,
      relationshipQuality,
      engagementRate,
      carePlanInput,
      overallScore: clamp(score, 0, 10),
    });
  }

  return profiles.sort((a, b) => a.overallScore - b.overallScore);
}

// -- Strengths, Areas for Improvement, Actions --------------------------------

function generateStrengths(
  se: SessionEffectivenessResult,
  rq: RelationshipQualityResult,
  cpi: CarePlanIntegrationResult,
  pd: ProfessionalDevelopmentResult,
): string[] {
  const strengths: string[] = [];

  if (se.excellentGoodRate >= 80)
    strengths.push(
      `${se.excellentGoodRate}% of key work sessions rated excellent or good, demonstrating high-quality direct work.`,
    );
  if (se.childVoiceRate >= 80)
    strengths.push(
      `Child voice evidenced in ${se.childVoiceRate}% of sessions — strong commitment to capturing wishes and feelings.`,
    );
  if (se.childEngagementRate >= 80)
    strengths.push(
      `${se.childEngagementRate}% child engagement rate indicates positive, trusting key work relationships.`,
    );
  if (se.recordingComplianceRate >= 90)
    strengths.push(
      `${se.recordingComplianceRate}% recording compliance within 24 hours — excellent administrative practice.`,
    );
  if (rq.strongDevelopingRate >= 80)
    strengths.push(
      `${rq.strongDevelopingRate}% of key worker relationships rated strong or developing.`,
    );
  if (rq.childTrustsRate >= 80)
    strengths.push(
      `${rq.childTrustsRate}% of children trust their key worker — reflects genuine relationship-based practice.`,
    );
  if (rq.highTurnoverCount === 0)
    strengths.push(
      "No children have experienced excessive key worker changes — good continuity of care.",
    );
  if (cpi.comprehensivePartialRate >= 80)
    strengths.push(
      `${cpi.comprehensivePartialRate}% of care plan contributions are comprehensive or partial — key workers actively shaping plans.`,
    );
  if (cpi.reviewAttendanceRate >= 90)
    strengths.push(
      `${cpi.reviewAttendanceRate}% review attendance rate — key workers consistently present at statutory reviews.`,
    );
  if (cpi.childViewsRepresentedRate >= 80)
    strengths.push(
      `Child views represented in ${cpi.childViewsRepresentedRate}% of care plan contributions — UNCRC Article 12 embedded.`,
    );
  if (pd.supervisionRegularRate >= 90)
    strengths.push(
      `${pd.supervisionRegularRate}% of key workers receiving regular supervision.`,
    );
  if (pd.reflectivePracticeRate >= 80)
    strengths.push(
      `${pd.reflectivePracticeRate}% of key workers engaged in reflective practice — strong professional culture.`,
    );
  if (pd.managableCaseloadRate >= 80)
    strengths.push(
      `${pd.managableCaseloadRate}% of key workers have manageable caseloads (4 or fewer children).`,
    );

  return strengths;
}

function generateAreasForImprovement(
  se: SessionEffectivenessResult,
  rq: RelationshipQualityResult,
  cpi: CarePlanIntegrationResult,
  pd: ProfessionalDevelopmentResult,
): string[] {
  const areas: string[] = [];

  if (se.totalSessions === 0)
    areas.push(
      "No key work sessions recorded in the period — children are not receiving structured key work time.",
    );
  if (se.excellentGoodRate < 60 && se.totalSessions > 0)
    areas.push(
      `Only ${se.excellentGoodRate}% of sessions rated excellent/good — session quality needs attention.`,
    );
  if (se.childVoiceRate < 60 && se.totalSessions > 0)
    areas.push(
      `Child voice evidenced in only ${se.childVoiceRate}% of sessions — UNCRC Article 12 compliance at risk.`,
    );
  if (se.childEngagementRate < 60 && se.totalSessions > 0)
    areas.push(
      `Child engagement rate at ${se.childEngagementRate}% — review approaches to engaging reluctant children.`,
    );
  if (se.recordingComplianceRate < 80 && se.totalSessions > 0)
    areas.push(
      `Recording compliance at ${se.recordingComplianceRate}% — sessions not consistently documented within 24 hours.`,
    );
  if (rq.totalRelationships === 0)
    areas.push(
      "No key worker relationships assessed — relationship quality monitoring absent.",
    );
  if (rq.strongDevelopingRate < 60 && rq.totalRelationships > 0)
    areas.push(
      `Only ${rq.strongDevelopingRate}% of relationships strong or developing — significant relationship work needed.`,
    );
  if (rq.childFeelsListenedRate < 60 && rq.totalRelationships > 0)
    areas.push(
      `Only ${rq.childFeelsListenedRate}% of children feel listened to — listening skills development required.`,
    );
  if (rq.highTurnoverCount > 0)
    areas.push(
      `${rq.highTurnoverCount} child(ren) have had 3+ key worker changes — instability undermining relationships.`,
    );
  if (cpi.totalContributions === 0)
    areas.push(
      "No care plan contributions recorded — key workers not contributing to statutory care planning.",
    );
  if (cpi.reviewAttendanceRate < 80 && cpi.totalContributions > 0)
    areas.push(
      `Review attendance at ${cpi.reviewAttendanceRate}% — key workers missing statutory reviews.`,
    );
  if (cpi.reportsTimelyRate < 80 && cpi.totalContributions > 0)
    areas.push(
      `Only ${cpi.reportsTimelyRate}% of reports submitted on time — timeliness needs improvement.`,
    );
  if (pd.totalKeyWorkers === 0)
    areas.push(
      "No key worker development data available — professional development monitoring absent.",
    );
  if (pd.trainingComplianceRate < 80 && pd.totalKeyWorkers > 0)
    areas.push(
      `Training compliance at ${pd.trainingComplianceRate}% — key workers need targeted training.`,
    );
  if (pd.supervisionRegularRate < 80 && pd.totalKeyWorkers > 0)
    areas.push(
      `Only ${pd.supervisionRegularRate}% of key workers receiving regular supervision — Reg 33 concern.`,
    );
  if (pd.managableCaseloadRate < 60 && pd.totalKeyWorkers > 0)
    areas.push(
      `Only ${pd.managableCaseloadRate}% of key workers have manageable caseloads — risk of burnout and reduced quality.`,
    );

  return areas;
}

function generateActions(
  se: SessionEffectivenessResult,
  rq: RelationshipQualityResult,
  cpi: CarePlanIntegrationResult,
  pd: ProfessionalDevelopmentResult,
  overallScore: number,
): string[] {
  const actions: string[] = [];

  // Critical (URGENT prefix)
  if (se.totalSessions === 0)
    actions.push(
      "URGENT: Implement weekly key work sessions for every child — no key work is occurring.",
    );
  if (rq.totalRelationships === 0)
    actions.push(
      "URGENT: Assess all key worker-child relationships and document baseline quality.",
    );
  if (rq.highTurnoverCount > 0)
    actions.push(
      `URGENT: Review key worker allocation for ${rq.highTurnoverCount} child(ren) with 3+ changes — stability plan required.`,
    );
  if (overallScore < 40)
    actions.push(
      "URGENT: Key working effectiveness is inadequate — immediate management review and improvement plan required.",
    );

  // Session quality
  if (se.excellentGoodRate < 60 && se.totalSessions > 0)
    actions.push(
      "Deliver session quality training focused on therapeutic engagement and purposeful planning.",
    );
  if (se.childVoiceRate < 60 && se.totalSessions > 0)
    actions.push(
      "Provide training on capturing child voice and incorporating wishes into session planning.",
    );
  if (se.recordingComplianceRate < 80 && se.totalSessions > 0)
    actions.push(
      "Set clear expectation for same-day recording and audit compliance weekly.",
    );

  // Relationship
  if (rq.strongDevelopingRate < 60 && rq.totalRelationships > 0)
    actions.push(
      "Provide relationship-building training and reflective supervision on attachment-informed practice.",
    );
  if (rq.childFeelsListenedRate < 60 && rq.totalRelationships > 0)
    actions.push(
      "Run active listening workshops and gather child feedback on feeling heard.",
    );

  // Care plan
  if (cpi.reviewAttendanceRate < 80 && cpi.totalContributions > 0)
    actions.push(
      "Ensure key workers are prioritised for statutory review attendance with adequate cover arranged.",
    );
  if (cpi.reportsTimelyRate < 80 && cpi.totalContributions > 0)
    actions.push(
      "Implement report deadline reminders and template support for timely care plan contributions.",
    );
  if (cpi.childViewsRepresentedRate < 80 && cpi.totalContributions > 0)
    actions.push(
      "Strengthen processes for capturing and embedding child views in care plan contributions.",
    );

  // Development
  if (pd.trainingComplianceRate < 80 && pd.totalKeyWorkers > 0)
    actions.push(
      "Create individual training plans for key workers with gaps in key working competencies.",
    );
  if (pd.supervisionRegularRate < 80 && pd.totalKeyWorkers > 0)
    actions.push(
      "Schedule and protect fortnightly supervision sessions for all key workers.",
    );
  if (pd.managableCaseloadRate < 60 && pd.totalKeyWorkers > 0)
    actions.push(
      "Review caseload allocation to ensure no key worker has more than 4 children.",
    );
  if (pd.peerSupportRate < 50 && pd.totalKeyWorkers > 0)
    actions.push(
      "Establish peer support groups or buddy systems for key workers.",
    );

  return actions;
}

function generateRegulatoryLinks(
  se: SessionEffectivenessResult,
  rq: RelationshipQualityResult,
  cpi: CarePlanIntegrationResult,
  pd: ProfessionalDevelopmentResult,
): string[] {
  const links: string[] = [];

  // Always include core references
  links.push(
    "CHR 2015 Reg 5 — Engaging with the individual child: key workers must build meaningful relationships.",
  );
  links.push(
    "CHR 2015 Reg 14 — Care planning: key workers contribute to and implement the child's care plan.",
  );

  if (
    se.childVoiceRate < 80 ||
    rq.childFeelsListenedRate < 80 ||
    cpi.childViewsRepresentedRate < 80
  ) {
    links.push(
      "UNCRC Article 12 — Right to be heard: every child has the right to express views and have them given due weight.",
    );
  }

  links.push(
    "SCCIF — Quality of care: Ofsted evaluates whether key working leads to measurable improvements for children.",
  );

  links.push(
    "NMS 2 — A positive and individual approach: each child should have a named key worker who knows them well.",
  );

  if (pd.supervisionRegularRate < 100 || pd.trainingComplianceRate < 100) {
    links.push(
      "NMS 19 — Staffing: sufficient, competent key workers with regular supervision and training.",
    );
  }

  if (cpi.childViewsRepresentedRate < 80 || se.childVoiceRate < 80) {
    links.push(
      "Working Together 2023 — Multi-agency working: key workers ensure child voice is central to care planning.",
    );
  }

  return links;
}

// -- Main Function -----------------------------------------------------------

export function generateKeyWorkingEffectivenessIntelligence(
  sessions: KeyWorkSession[],
  relationships: KeyWorkerRelationship[],
  contributions: CarePlanContribution[],
  development: KeyWorkerDevelopment[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): KeyWorkingEffectivenessIntelligence {
  const sessionEffectiveness = evaluateSessionEffectiveness(sessions);
  const relationshipQualityResult = evaluateRelationshipQuality(relationships);
  const carePlanIntegration = evaluateCarePlanIntegration(contributions);
  const professionalDevelopment = evaluateProfessionalDevelopment(development);

  const overallScore = clamp(
    sessionEffectiveness.overallScore +
      relationshipQualityResult.overallScore +
      carePlanIntegration.overallScore +
      professionalDevelopment.overallScore,
    0,
    100,
  );

  const rating = getRating(overallScore);

  const childProfiles = buildChildKeyWorkProfiles(
    sessions,
    relationships,
    contributions,
  );

  const strengths = generateStrengths(
    sessionEffectiveness,
    relationshipQualityResult,
    carePlanIntegration,
    professionalDevelopment,
  );

  const areasForImprovement = generateAreasForImprovement(
    sessionEffectiveness,
    relationshipQualityResult,
    carePlanIntegration,
    professionalDevelopment,
  );

  const actions = generateActions(
    sessionEffectiveness,
    relationshipQualityResult,
    carePlanIntegration,
    professionalDevelopment,
    overallScore,
  );

  const regulatoryLinks = generateRegulatoryLinks(
    sessionEffectiveness,
    relationshipQualityResult,
    carePlanIntegration,
    professionalDevelopment,
  );

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    sessionEffectiveness,
    relationshipQuality: relationshipQualityResult,
    carePlanIntegration,
    professionalDevelopment,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
