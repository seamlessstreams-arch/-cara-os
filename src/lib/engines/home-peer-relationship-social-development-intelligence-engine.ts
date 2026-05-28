// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME PEER RELATIONSHIP & SOCIAL DEVELOPMENT INTELLIGENCE ENGINE
// Evaluates quality of peer relationships and social development support:
// peer relationship assessments, social skills development programmes,
// bullying incident management, friendship support plans, and social
// activity participation.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Engaging with the wider community),
// Reg 7 (Children's plans), Reg 9 (Promoting positive behaviour).
// SCCIF: "Social and emotional development", "Positive relationships".
// Store keys: peerAssessmentRecords, socialSkillsProgrammes,
//             bullyingIncidentRecords, friendshipSupportPlans,
//             socialActivityRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface PeerAssessmentInput {
  id: string;
  child_id: string;
  assessment_date: string;
  assessor_role: "keyworker" | "therapist" | "teacher" | "social_worker" | "other";
  relationship_quality_score: number; // 1-5
  social_confidence_score: number; // 1-5
  conflict_resolution_score: number; // 1-5
  empathy_score: number; // 1-5
  cooperation_score: number; // 1-5
  peer_acceptance_score: number; // 1-5
  areas_of_strength: string[];
  areas_of_concern: string[];
  recommended_interventions: string[];
  child_voice_captured: boolean;
  follow_up_date: string | null;
  follow_up_completed: boolean;
  created_at: string;
}

export interface SocialSkillsProgrammeInput {
  id: string;
  child_id: string;
  programme_name: string;
  programme_type: "group" | "individual" | "peer_mentoring" | "therapeutic";
  start_date: string;
  end_date: string | null;
  active: boolean;
  sessions_planned: number;
  sessions_attended: number;
  progress_rating: number; // 1-5
  skills_targeted: string[];
  measurable_improvement: boolean;
  child_engaged: boolean;
  facilitator_name: string;
  review_date: string | null;
  review_completed: boolean;
  created_at: string;
}

export interface BullyingIncidentInput {
  id: string;
  child_id: string;
  incident_date: string;
  reported_date: string;
  incident_type: "physical" | "verbal" | "emotional" | "cyber" | "social_exclusion" | "other";
  severity: "low" | "medium" | "high" | "critical";
  child_role: "victim" | "perpetrator" | "bystander" | "both";
  reported_by: string;
  investigated: boolean;
  investigation_date: string | null;
  resolution_type: "mediation" | "restorative" | "sanctions" | "referral" | "informal" | "pending";
  resolved: boolean;
  resolution_date: string | null;
  resolution_description: string | null;
  safety_plan_created: boolean;
  follow_up_completed: boolean;
  follow_up_date: string | null;
  child_satisfied_with_outcome: boolean;
  days_to_investigate: number | null;
  days_to_resolve: number | null;
  parent_carer_informed: boolean;
  social_worker_informed: boolean;
  lessons_learned: string | null;
  created_at: string;
}

export interface FriendshipSupportPlanInput {
  id: string;
  child_id: string;
  plan_date: string;
  plan_type: "formal" | "informal" | "therapeutic";
  identified_needs: string[];
  goals_set: number;
  goals_achieved: number;
  activities_planned: number;
  activities_completed: number;
  external_friendships_supported: boolean;
  family_contact_supported: boolean;
  peer_matching_attempted: boolean;
  peer_matching_successful: boolean;
  child_voice_in_plan: boolean;
  review_date: string | null;
  review_completed: boolean;
  active: boolean;
  progress_notes: string;
  created_at: string;
}

export interface SocialActivityRecordInput {
  id: string;
  child_id: string;
  activity_date: string;
  activity_type: "sport" | "creative" | "community" | "educational" | "social_outing" | "club" | "volunteering" | "other";
  activity_name: string;
  group_activity: boolean;
  external_activity: boolean;
  peer_interaction_quality: number; // 1-5
  child_enjoyed: boolean;
  child_initiated: boolean;
  new_connections_made: boolean;
  staff_supported: boolean;
  duration_hours: number;
  attendance_status: "attended" | "refused" | "cancelled" | "missed";
  barriers_identified: string[];
  created_at: string;
}

export interface PeerRelationshipSocialDevelopmentInput {
  today: string;
  total_children: number;
  peer_assessments: PeerAssessmentInput[];
  social_skills_programmes: SocialSkillsProgrammeInput[];
  bullying_incidents: BullyingIncidentInput[];
  friendship_support_plans: FriendshipSupportPlanInput[];
  social_activity_records: SocialActivityRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type PeerRelationshipRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface PeerRelationshipInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface PeerRelationshipRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface PeerRelationshipSocialDevelopmentResult {
  peer_rating: PeerRelationshipRating;
  peer_score: number;
  headline: string;
  total_assessments: number;
  total_programmes: number;
  total_bullying_incidents: number;
  total_friendship_plans: number;
  total_social_activities: number;
  peer_assessment_coverage_rate: number;
  social_skills_engagement_rate: number;
  bullying_resolution_rate: number;
  friendship_plan_coverage_rate: number;
  social_activity_participation_rate: number;
  child_voice_in_plans_rate: number;
  average_relationship_quality: number;
  average_social_confidence: number;
  programme_attendance_rate: number;
  bullying_investigation_rate: number;
  friendship_goal_achievement_rate: number;
  activity_enjoyment_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: PeerRelationshipRecommendation[];
  insights: PeerRelationshipInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): PeerRelationshipRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: PeerRelationshipRating,
  score: number,
  headline: string,
): PeerRelationshipSocialDevelopmentResult {
  return {
    peer_rating: rating,
    peer_score: score,
    headline,
    total_assessments: 0,
    total_programmes: 0,
    total_bullying_incidents: 0,
    total_friendship_plans: 0,
    total_social_activities: 0,
    peer_assessment_coverage_rate: 0,
    social_skills_engagement_rate: 0,
    bullying_resolution_rate: 0,
    friendship_plan_coverage_rate: 0,
    social_activity_participation_rate: 0,
    child_voice_in_plans_rate: 0,
    average_relationship_quality: 0,
    average_social_confidence: 0,
    programme_attendance_rate: 0,
    bullying_investigation_rate: 0,
    friendship_goal_achievement_rate: 0,
    activity_enjoyment_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computePeerRelationshipSocialDevelopment(
  input: PeerRelationshipSocialDevelopmentInput,
): PeerRelationshipSocialDevelopmentResult {
  const {
    total_children,
    peer_assessments,
    social_skills_programmes,
    bullying_incidents,
    friendship_support_plans,
    social_activity_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    peer_assessments.length === 0 &&
    social_skills_programmes.length === 0 &&
    bullying_incidents.length === 0 &&
    friendship_support_plans.length === 0 &&
    social_activity_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess peer relationship and social development support.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No peer relationship or social development data recorded despite children on placement — peer support and social development require urgent attention.",
      ),
      concerns: [
        "No peer assessments, social skills programmes, bullying records, friendship support plans, or social activity records exist despite children being on placement — the home cannot evidence support for peer relationships or social development.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured peer relationship assessments for all children to identify social development needs, friendship difficulties, and peer relationship concerns. Assessments should capture the child's voice and inform targeted support plans.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 7 — Children's plans",
        },
        {
          rank: 2,
          recommendation:
            "Establish social skills development programmes and friendship support plans for children who need targeted social development support. Record all social activities and peer interactions to evidence the home's promotion of positive relationships.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider community",
        },
      ],
      insights: [
        {
          text: "The complete absence of peer relationship and social development records means Ofsted cannot verify that children's social needs are assessed, friendships are supported, or bullying is managed. This represents a fundamental gap in Reg 7 (children's plans) and Reg 5 (community engagement) compliance.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Peer assessment metrics ---
  const totalAssessments = peer_assessments.length;

  const uniqueChildrenAssessed = new Set(
    peer_assessments.map((a) => a.child_id),
  ).size;
  const peerAssessmentCoverageRate =
    total_children > 0 ? pct(uniqueChildrenAssessed, total_children) : 0;

  const relationshipQualitySum = peer_assessments.reduce(
    (sum, a) => sum + a.relationship_quality_score,
    0,
  );
  const averageRelationshipQuality =
    totalAssessments > 0
      ? Math.round((relationshipQualitySum / totalAssessments) * 100) / 100
      : 0;

  const socialConfidenceSum = peer_assessments.reduce(
    (sum, a) => sum + a.social_confidence_score,
    0,
  );
  const averageSocialConfidence =
    totalAssessments > 0
      ? Math.round((socialConfidenceSum / totalAssessments) * 100) / 100
      : 0;

  const conflictResolutionSum = peer_assessments.reduce(
    (sum, a) => sum + a.conflict_resolution_score,
    0,
  );
  const averageConflictResolution =
    totalAssessments > 0
      ? Math.round((conflictResolutionSum / totalAssessments) * 100) / 100
      : 0;

  const empathySum = peer_assessments.reduce(
    (sum, a) => sum + a.empathy_score,
    0,
  );
  const averageEmpathy =
    totalAssessments > 0
      ? Math.round((empathySum / totalAssessments) * 100) / 100
      : 0;

  const cooperationSum = peer_assessments.reduce(
    (sum, a) => sum + a.cooperation_score,
    0,
  );
  const averageCooperation =
    totalAssessments > 0
      ? Math.round((cooperationSum / totalAssessments) * 100) / 100
      : 0;

  const peerAcceptanceSum = peer_assessments.reduce(
    (sum, a) => sum + a.peer_acceptance_score,
    0,
  );
  const averagePeerAcceptance =
    totalAssessments > 0
      ? Math.round((peerAcceptanceSum / totalAssessments) * 100) / 100
      : 0;

  const assessmentChildVoice = peer_assessments.filter(
    (a) => a.child_voice_captured,
  ).length;
  const assessmentChildVoiceRate = pct(assessmentChildVoice, totalAssessments);

  const assessmentsWithFollowUp = peer_assessments.filter(
    (a) => a.follow_up_date !== null,
  ).length;
  const followUpCompleted = peer_assessments.filter(
    (a) => a.follow_up_completed,
  ).length;
  const assessmentFollowUpRate = pct(followUpCompleted, assessmentsWithFollowUp);

  // --- Social skills programme metrics ---
  const totalProgrammes = social_skills_programmes.length;

  const uniqueChildrenInProgrammes = new Set(
    social_skills_programmes.filter((p) => p.active).map((p) => p.child_id),
  ).size;
  const socialSkillsEngagementRate =
    total_children > 0 ? pct(uniqueChildrenInProgrammes, total_children) : 0;

  const totalSessionsPlanned = social_skills_programmes.reduce(
    (sum, p) => sum + p.sessions_planned,
    0,
  );
  const totalSessionsAttended = social_skills_programmes.reduce(
    (sum, p) => sum + p.sessions_attended,
    0,
  );
  const programmeAttendanceRate = pct(totalSessionsAttended, totalSessionsPlanned);

  const progressRatingSum = social_skills_programmes.reduce(
    (sum, p) => sum + p.progress_rating,
    0,
  );
  const averageProgressRating =
    totalProgrammes > 0
      ? Math.round((progressRatingSum / totalProgrammes) * 100) / 100
      : 0;

  const programmesWithImprovement = social_skills_programmes.filter(
    (p) => p.measurable_improvement,
  ).length;
  const measureableImprovementRate = pct(programmesWithImprovement, totalProgrammes);

  const programmesChildEngaged = social_skills_programmes.filter(
    (p) => p.child_engaged,
  ).length;
  const childEngagementRate = pct(programmesChildEngaged, totalProgrammes);

  const programmesReviewDue = social_skills_programmes.filter(
    (p) => p.review_date !== null,
  ).length;
  const programmesReviewCompleted = social_skills_programmes.filter(
    (p) => p.review_completed,
  ).length;
  const programmeReviewRate = pct(programmesReviewCompleted, programmesReviewDue);

  // --- Bullying incident metrics ---
  const totalBullyingIncidents = bullying_incidents.length;

  const resolvedBullyingIncidents = bullying_incidents.filter(
    (b) => b.resolved,
  ).length;
  const bullyingResolutionRate = pct(resolvedBullyingIncidents, totalBullyingIncidents);

  const investigatedIncidents = bullying_incidents.filter(
    (b) => b.investigated,
  ).length;
  const bullyingInvestigationRate = pct(investigatedIncidents, totalBullyingIncidents);

  const safetyPlansCreated = bullying_incidents.filter(
    (b) => b.safety_plan_created,
  ).length;
  const safetyPlanRate = pct(safetyPlansCreated, totalBullyingIncidents);

  const bullyingFollowUps = bullying_incidents.filter(
    (b) => b.follow_up_completed,
  ).length;
  const bullyingFollowUpRate = pct(bullyingFollowUps, totalBullyingIncidents);

  const childSatisfiedBullying = bullying_incidents.filter(
    (b) => b.child_satisfied_with_outcome,
  ).length;
  const bullyingSatisfactionRate = pct(childSatisfiedBullying, totalBullyingIncidents);

  const parentCarerInformed = bullying_incidents.filter(
    (b) => b.parent_carer_informed,
  ).length;
  const parentCarerInformedRate = pct(parentCarerInformed, totalBullyingIncidents);

  const socialWorkerInformed = bullying_incidents.filter(
    (b) => b.social_worker_informed,
  ).length;
  const socialWorkerInformedRate = pct(socialWorkerInformed, totalBullyingIncidents);

  const highSeverityIncidents = bullying_incidents.filter(
    (b) => b.severity === "high" || b.severity === "critical",
  ).length;
  const highSeverityUnresolved = bullying_incidents.filter(
    (b) => (b.severity === "high" || b.severity === "critical") && !b.resolved,
  ).length;

  const restorativeResolutions = bullying_incidents.filter(
    (b) => b.resolution_type === "restorative" || b.resolution_type === "mediation",
  ).length;
  const restorativeRate = pct(restorativeResolutions, resolvedBullyingIncidents);

  const avgDaysToInvestigate =
    investigatedIncidents > 0
      ? Math.round(
          bullying_incidents
            .filter((b) => b.days_to_investigate !== null)
            .reduce((sum, b) => sum + (b.days_to_investigate ?? 0), 0) /
            bullying_incidents.filter((b) => b.days_to_investigate !== null).length,
        )
      : 0;

  const avgDaysToResolve =
    resolvedBullyingIncidents > 0
      ? Math.round(
          bullying_incidents
            .filter((b) => b.days_to_resolve !== null)
            .reduce((sum, b) => sum + (b.days_to_resolve ?? 0), 0) /
            bullying_incidents.filter((b) => b.days_to_resolve !== null).length,
        )
      : 0;

  // --- Friendship support plan metrics ---
  const totalFriendshipPlans = friendship_support_plans.length;

  const uniqueChildrenWithPlans = new Set(
    friendship_support_plans.filter((p) => p.active).map((p) => p.child_id),
  ).size;
  const friendshipPlanCoverageRate =
    total_children > 0 ? pct(uniqueChildrenWithPlans, total_children) : 0;

  const totalGoalsSet = friendship_support_plans.reduce(
    (sum, p) => sum + p.goals_set,
    0,
  );
  const totalGoalsAchieved = friendship_support_plans.reduce(
    (sum, p) => sum + p.goals_achieved,
    0,
  );
  const friendshipGoalAchievementRate = pct(totalGoalsAchieved, totalGoalsSet);

  const totalActivitiesPlanned = friendship_support_plans.reduce(
    (sum, p) => sum + p.activities_planned,
    0,
  );
  const totalActivitiesCompleted = friendship_support_plans.reduce(
    (sum, p) => sum + p.activities_completed,
    0,
  );
  const friendshipActivityCompletionRate = pct(
    totalActivitiesCompleted,
    totalActivitiesPlanned,
  );

  const externalFriendshipsSupported = friendship_support_plans.filter(
    (p) => p.external_friendships_supported,
  ).length;
  const externalFriendshipRate = pct(externalFriendshipsSupported, totalFriendshipPlans);

  const familyContactSupported = friendship_support_plans.filter(
    (p) => p.family_contact_supported,
  ).length;
  const familyContactRate = pct(familyContactSupported, totalFriendshipPlans);

  const peerMatchingAttempted = friendship_support_plans.filter(
    (p) => p.peer_matching_attempted,
  ).length;
  const peerMatchingSuccessful = friendship_support_plans.filter(
    (p) => p.peer_matching_successful,
  ).length;
  const peerMatchingSuccessRate = pct(peerMatchingSuccessful, peerMatchingAttempted);

  const childVoiceInPlans = friendship_support_plans.filter(
    (p) => p.child_voice_in_plan,
  ).length;
  const childVoiceInPlansRate = pct(childVoiceInPlans, totalFriendshipPlans);

  const friendshipPlansReviewDue = friendship_support_plans.filter(
    (p) => p.review_date !== null,
  ).length;
  const friendshipPlansReviewCompleted = friendship_support_plans.filter(
    (p) => p.review_completed,
  ).length;
  const friendshipPlanReviewRate = pct(
    friendshipPlansReviewCompleted,
    friendshipPlansReviewDue,
  );

  // --- Social activity metrics ---
  const totalSocialActivities = social_activity_records.length;

  const attendedActivities = social_activity_records.filter(
    (a) => a.attendance_status === "attended",
  ).length;
  const socialActivityParticipationRate = pct(attendedActivities, totalSocialActivities);

  const uniqueChildrenParticipating = new Set(
    social_activity_records
      .filter((a) => a.attendance_status === "attended")
      .map((a) => a.child_id),
  ).size;
  const childParticipationCoverage =
    total_children > 0 ? pct(uniqueChildrenParticipating, total_children) : 0;

  const enjoyedActivities = social_activity_records.filter(
    (a) => a.child_enjoyed && a.attendance_status === "attended",
  ).length;
  const activityEnjoymentRate = pct(enjoyedActivities, attendedActivities);

  const childInitiatedActivities = social_activity_records.filter(
    (a) => a.child_initiated,
  ).length;
  const childInitiatedRate = pct(childInitiatedActivities, totalSocialActivities);

  const groupActivities = social_activity_records.filter(
    (a) => a.group_activity && a.attendance_status === "attended",
  ).length;
  const groupActivityRate = pct(groupActivities, attendedActivities);

  const externalActivities = social_activity_records.filter(
    (a) => a.external_activity && a.attendance_status === "attended",
  ).length;
  const externalActivityRate = pct(externalActivities, attendedActivities);

  const newConnectionsMade = social_activity_records.filter(
    (a) => a.new_connections_made && a.attendance_status === "attended",
  ).length;
  const newConnectionsRate = pct(newConnectionsMade, attendedActivities);

  const peerInteractionQualitySum = social_activity_records
    .filter((a) => a.attendance_status === "attended")
    .reduce((sum, a) => sum + a.peer_interaction_quality, 0);
  const averagePeerInteractionQuality =
    attendedActivities > 0
      ? Math.round((peerInteractionQualitySum / attendedActivities) * 100) / 100
      : 0;

  const refusedActivities = social_activity_records.filter(
    (a) => a.attendance_status === "refused",
  ).length;
  const refusalRate = pct(refusedActivities, totalSocialActivities);

  // --- Combined child voice metric ---
  // Across friendship plans + peer assessments
  const totalVoiceOpportunities = totalFriendshipPlans + totalAssessments;
  const totalVoiceCaptured = childVoiceInPlans + assessmentChildVoice;
  const combinedChildVoiceRate = pct(totalVoiceCaptured, totalVoiceOpportunities);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: peerAssessmentCoverageRate (>=90: +4, >=70: +2) ---
  // Max bonus: 4
  if (peerAssessmentCoverageRate >= 90) score += 4;
  else if (peerAssessmentCoverageRate >= 70) score += 2;

  // --- Bonus 2: socialSkillsEngagementRate (>=80: +3, >=60: +1) ---
  // Max bonus: 3
  if (socialSkillsEngagementRate >= 80) score += 3;
  else if (socialSkillsEngagementRate >= 60) score += 1;

  // --- Bonus 3: bullyingResolutionRate (>=100: +3, >=80: +1) ---
  // Max bonus: 3
  if (bullyingResolutionRate >= 100) score += 3;
  else if (bullyingResolutionRate >= 80) score += 1;

  // --- Bonus 4: friendshipPlanCoverageRate (>=80: +3, >=60: +1) ---
  // Max bonus: 3
  if (friendshipPlanCoverageRate >= 80) score += 3;
  else if (friendshipPlanCoverageRate >= 60) score += 1;

  // --- Bonus 5: socialActivityParticipationRate (>=90: +3, >=70: +1) ---
  // Max bonus: 3
  if (socialActivityParticipationRate >= 90) score += 3;
  else if (socialActivityParticipationRate >= 70) score += 1;

  // --- Bonus 6: combinedChildVoiceRate (>=90: +3, >=70: +1) ---
  // Max bonus: 3
  if (combinedChildVoiceRate >= 90) score += 3;
  else if (combinedChildVoiceRate >= 70) score += 1;

  // --- Bonus 7: averageRelationshipQuality (>=4.0: +3, >=3.0: +1) ---
  // Max bonus: 3
  if (averageRelationshipQuality >= 4.0) score += 3;
  else if (averageRelationshipQuality >= 3.0) score += 1;

  // --- Bonus 8: programmeAttendanceRate (>=90: +3, >=70: +1) ---
  // Max bonus: 3
  if (programmeAttendanceRate >= 90) score += 3;
  else if (programmeAttendanceRate >= 70) score += 1;

  // --- Bonus 9: friendshipGoalAchievementRate (>=80: +3, >=60: +1) ---
  // Max bonus: 3
  if (friendshipGoalAchievementRate >= 80) score += 3;
  else if (friendshipGoalAchievementRate >= 60) score += 1;

  // Total max bonus: 4+3+3+3+3+3+3+3+3 = 28 → max score = 52+28 = 80

  // ── Penalties ─────────────────────────────────────────────────────────

  // Penalty 1: bullyingResolutionRate < 50 → -5
  if (bullyingResolutionRate < 50 && totalBullyingIncidents > 0) score -= 5;

  // Penalty 2: peerAssessmentCoverageRate < 30 → -4
  if (peerAssessmentCoverageRate < 30 && total_children > 0) score -= 4;

  // Penalty 3: socialActivityParticipationRate < 40 → -5
  if (socialActivityParticipationRate < 40 && totalSocialActivities > 0) score -= 5;

  // Penalty 4: highSeverityUnresolved > 0 → -4
  if (highSeverityUnresolved > 0 && totalBullyingIncidents > 0) score -= 4;

  score = clamp(score, 0, 100);

  const peer_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  // Peer assessment coverage strengths
  if (peerAssessmentCoverageRate >= 100 && total_children > 0) {
    strengths.push(
      "Every child has received a peer relationship assessment — the home maintains comprehensive visibility of children's social development needs.",
    );
  } else if (peerAssessmentCoverageRate >= 80 && total_children > 0) {
    strengths.push(
      `${peerAssessmentCoverageRate}% peer assessment coverage — the majority of children have had their peer relationships formally assessed.`,
    );
  }

  // Relationship quality strengths
  if (averageRelationshipQuality >= 4.0 && totalAssessments > 0) {
    strengths.push(
      `Peer relationship quality averages ${averageRelationshipQuality}/5 — children are forming and maintaining high-quality peer relationships within the home.`,
    );
  } else if (averageRelationshipQuality >= 3.0 && totalAssessments > 0) {
    strengths.push(
      `Peer relationship quality averages ${averageRelationshipQuality}/5 — children generally have positive peer relationships.`,
    );
  }

  // Social confidence strengths
  if (averageSocialConfidence >= 4.0 && totalAssessments > 0) {
    strengths.push(
      `Social confidence averages ${averageSocialConfidence}/5 — children demonstrate strong social confidence and self-assurance in peer interactions.`,
    );
  }

  // Social skills programme strengths
  if (socialSkillsEngagementRate >= 80 && total_children > 0) {
    strengths.push(
      `${socialSkillsEngagementRate}% of children engaged in social skills programmes — comprehensive social development support across the home.`,
    );
  } else if (socialSkillsEngagementRate >= 60 && total_children > 0) {
    strengths.push(
      `${socialSkillsEngagementRate}% of children engaged in social skills programmes — good levels of structured social development support.`,
    );
  }

  // Programme attendance strengths
  if (programmeAttendanceRate >= 90 && totalSessionsPlanned > 0) {
    strengths.push(
      `${programmeAttendanceRate}% programme session attendance — children consistently attend their social skills development sessions.`,
    );
  } else if (programmeAttendanceRate >= 70 && totalSessionsPlanned > 0) {
    strengths.push(
      `${programmeAttendanceRate}% programme session attendance — good engagement with social skills development sessions.`,
    );
  }

  // Measurable improvement strengths
  if (measureableImprovementRate >= 80 && totalProgrammes > 0) {
    strengths.push(
      `${measureableImprovementRate}% of social skills programmes show measurable improvement — the programmes are delivering tangible social development outcomes.`,
    );
  } else if (measureableImprovementRate >= 60 && totalProgrammes > 0) {
    strengths.push(
      `${measureableImprovementRate}% of social skills programmes show measurable improvement — evidence of positive social development progress.`,
    );
  }

  // Bullying resolution strengths
  if (bullyingResolutionRate >= 100 && totalBullyingIncidents > 0) {
    strengths.push(
      "Every bullying incident has been resolved — the home demonstrates zero tolerance for bullying with comprehensive follow-through.",
    );
  } else if (bullyingResolutionRate >= 80 && totalBullyingIncidents > 0) {
    strengths.push(
      `${bullyingResolutionRate}% bullying resolution rate — the majority of bullying incidents are resolved effectively.`,
    );
  }

  // Bullying investigation strengths
  if (bullyingInvestigationRate >= 100 && totalBullyingIncidents > 0) {
    strengths.push(
      "Every bullying incident has been investigated — the home takes all reports seriously and follows a thorough investigation process.",
    );
  } else if (bullyingInvestigationRate >= 80 && totalBullyingIncidents > 0) {
    strengths.push(
      `${bullyingInvestigationRate}% of bullying incidents investigated — strong investigation practice for reported incidents.`,
    );
  }

  // Safety plan strengths
  if (safetyPlanRate >= 90 && totalBullyingIncidents > 0) {
    strengths.push(
      `Safety plans created for ${safetyPlanRate}% of bullying incidents — proactive safeguarding ensures children feel protected.`,
    );
  }

  // Restorative approach strengths
  if (restorativeRate >= 50 && resolvedBullyingIncidents > 0) {
    strengths.push(
      `${restorativeRate}% of resolved bullying incidents used restorative or mediation approaches — the home prioritises relationship repair and learning over punitive measures.`,
    );
  }

  // Friendship plan coverage strengths
  if (friendshipPlanCoverageRate >= 80 && total_children > 0) {
    strengths.push(
      `${friendshipPlanCoverageRate}% of children have active friendship support plans — comprehensive friendship development support.`,
    );
  } else if (friendshipPlanCoverageRate >= 60 && total_children > 0) {
    strengths.push(
      `${friendshipPlanCoverageRate}% of children have active friendship support plans — good coverage of friendship support needs.`,
    );
  }

  // Friendship goal achievement strengths
  if (friendshipGoalAchievementRate >= 80 && totalGoalsSet > 0) {
    strengths.push(
      `${friendshipGoalAchievementRate}% of friendship plan goals achieved — children are making excellent progress towards their social development objectives.`,
    );
  } else if (friendshipGoalAchievementRate >= 60 && totalGoalsSet > 0) {
    strengths.push(
      `${friendshipGoalAchievementRate}% of friendship plan goals achieved — good progress towards social development objectives.`,
    );
  }

  // External friendship support strengths
  if (externalFriendshipRate >= 80 && totalFriendshipPlans > 0) {
    strengths.push(
      `${externalFriendshipRate}% of friendship plans support external friendships — the home actively facilitates children maintaining relationships beyond the home.`,
    );
  }

  // Social activity participation strengths
  if (socialActivityParticipationRate >= 90 && totalSocialActivities > 0) {
    strengths.push(
      `${socialActivityParticipationRate}% social activity participation rate — children consistently engage in planned social activities.`,
    );
  } else if (socialActivityParticipationRate >= 70 && totalSocialActivities > 0) {
    strengths.push(
      `${socialActivityParticipationRate}% social activity participation rate — good levels of engagement in social activities.`,
    );
  }

  // Activity enjoyment strengths
  if (activityEnjoymentRate >= 90 && attendedActivities > 0) {
    strengths.push(
      `${activityEnjoymentRate}% activity enjoyment rate — children are enjoying their social activities, which promotes continued engagement.`,
    );
  } else if (activityEnjoymentRate >= 70 && attendedActivities > 0) {
    strengths.push(
      `${activityEnjoymentRate}% of activities enjoyed by children — social activities are generally well-received.`,
    );
  }

  // Child-initiated activities strengths
  if (childInitiatedRate >= 30 && totalSocialActivities > 0) {
    strengths.push(
      `${childInitiatedRate}% of social activities are child-initiated — children feel empowered to suggest and shape their own social opportunities.`,
    );
  }

  // External activity strengths
  if (externalActivityRate >= 50 && attendedActivities > 0) {
    strengths.push(
      `${externalActivityRate}% of attended activities are external — children engage with the wider community and develop social networks beyond the home.`,
    );
  }

  // New connections strengths
  if (newConnectionsRate >= 40 && attendedActivities > 0) {
    strengths.push(
      `New peer connections made in ${newConnectionsRate}% of attended activities — social activities are expanding children's friendship networks.`,
    );
  }

  // Group activity strengths
  if (groupActivityRate >= 60 && attendedActivities > 0) {
    strengths.push(
      `${groupActivityRate}% of activities are group-based — children regularly practise social skills in group settings.`,
    );
  }

  // Child voice strengths
  if (combinedChildVoiceRate >= 90 && totalVoiceOpportunities > 0) {
    strengths.push(
      "Child voice captured in the vast majority of assessments and support plans — the home ensures children's perspectives shape their own social development support.",
    );
  } else if (combinedChildVoiceRate >= 70 && totalVoiceOpportunities > 0) {
    strengths.push(
      `Child voice captured in ${combinedChildVoiceRate}% of assessments and plans — good practice in seeking children's views on their social development.`,
    );
  }

  // Peer interaction quality strengths
  if (averagePeerInteractionQuality >= 4.0 && attendedActivities > 0) {
    strengths.push(
      `Peer interaction quality during activities averages ${averagePeerInteractionQuality}/5 — children demonstrate strong social skills in activity settings.`,
    );
  }

  // Peer matching strengths
  if (peerMatchingSuccessRate >= 70 && peerMatchingAttempted > 0) {
    strengths.push(
      `${peerMatchingSuccessRate}% peer matching success rate — the home effectively pairs children with compatible peers for friendship development.`,
    );
  }

  // Empathy and cooperation strengths
  if (averageEmpathy >= 4.0 && averageCooperation >= 4.0 && totalAssessments > 0) {
    strengths.push(
      `Empathy (${averageEmpathy}/5) and cooperation (${averageCooperation}/5) scores are both strong — children demonstrate well-developed prosocial skills.`,
    );
  }

  // Conflict resolution strengths
  if (averageConflictResolution >= 4.0 && totalAssessments > 0) {
    strengths.push(
      `Conflict resolution skills average ${averageConflictResolution}/5 — children can manage disagreements constructively with their peers.`,
    );
  }

  // No bullying incidents strength
  if (totalBullyingIncidents === 0 && total_children > 0 && !allEmpty) {
    strengths.push(
      "No bullying incidents recorded — the home maintains a positive peer environment where bullying is not a feature of children's lived experience.",
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  // Peer assessment coverage concerns
  if (peerAssessmentCoverageRate < 30 && total_children > 0) {
    concerns.push(
      `Only ${peerAssessmentCoverageRate}% of children have received peer relationship assessments — the home lacks visibility of the majority of children's social development needs and peer relationship quality.`,
    );
  } else if (peerAssessmentCoverageRate < 70 && peerAssessmentCoverageRate >= 30 && total_children > 0) {
    concerns.push(
      `Peer assessment coverage at ${peerAssessmentCoverageRate}% — not all children have had their peer relationships and social development formally assessed.`,
    );
  }

  // Relationship quality concerns
  if (averageRelationshipQuality < 2.5 && totalAssessments > 0) {
    concerns.push(
      `Peer relationship quality averages only ${averageRelationshipQuality}/5 — children are experiencing poor-quality peer relationships, which may affect their emotional wellbeing and placement stability.`,
    );
  } else if (averageRelationshipQuality < 3.0 && averageRelationshipQuality >= 2.5 && totalAssessments > 0) {
    concerns.push(
      `Peer relationship quality at ${averageRelationshipQuality}/5 — below the expected standard, indicating some children may be struggling with peer relationships.`,
    );
  }

  // Social confidence concerns
  if (averageSocialConfidence < 2.5 && totalAssessments > 0) {
    concerns.push(
      `Social confidence averages only ${averageSocialConfidence}/5 — children lack confidence in social situations, which may limit their ability to form friendships and integrate into the wider community.`,
    );
  } else if (averageSocialConfidence < 3.0 && averageSocialConfidence >= 2.5 && totalAssessments > 0) {
    concerns.push(
      `Social confidence at ${averageSocialConfidence}/5 — some children may benefit from additional support to build confidence in peer interactions.`,
    );
  }

  // Social skills engagement concerns
  if (socialSkillsEngagementRate < 30 && total_children > 0 && totalProgrammes > 0) {
    concerns.push(
      `Only ${socialSkillsEngagementRate}% of children engaged in social skills programmes — the majority of children lack structured social development support.`,
    );
  } else if (socialSkillsEngagementRate < 60 && socialSkillsEngagementRate >= 30 && total_children > 0) {
    concerns.push(
      `Social skills programme engagement at ${socialSkillsEngagementRate}% — not all children who may benefit are receiving structured social development support.`,
    );
  }

  // Programme attendance concerns
  if (programmeAttendanceRate < 50 && totalSessionsPlanned > 0) {
    concerns.push(
      `Only ${programmeAttendanceRate}% programme session attendance — children are not consistently attending their social skills development sessions, reducing the effectiveness of the programmes.`,
    );
  } else if (programmeAttendanceRate < 70 && programmeAttendanceRate >= 50 && totalSessionsPlanned > 0) {
    concerns.push(
      `Programme attendance at ${programmeAttendanceRate}% — some children are missing social skills sessions, which may slow their social development progress.`,
    );
  }

  // Measurable improvement concerns
  if (measureableImprovementRate < 40 && totalProgrammes > 0) {
    concerns.push(
      `Only ${measureableImprovementRate}% of social skills programmes show measurable improvement — the effectiveness of current programmes should be reviewed and adapted.`,
    );
  }

  // Bullying resolution concerns
  if (bullyingResolutionRate < 50 && totalBullyingIncidents > 0) {
    concerns.push(
      `Only ${bullyingResolutionRate}% of bullying incidents resolved — the majority of bullying situations remain unresolved, leaving children in potentially unsafe peer environments.`,
    );
  } else if (bullyingResolutionRate < 80 && bullyingResolutionRate >= 50 && totalBullyingIncidents > 0) {
    concerns.push(
      `Bullying resolution rate at ${bullyingResolutionRate}% — some bullying incidents are not being resolved, which may undermine children's sense of safety.`,
    );
  }

  // Bullying investigation concerns
  if (bullyingInvestigationRate < 80 && totalBullyingIncidents > 0) {
    concerns.push(
      `Only ${bullyingInvestigationRate}% of bullying incidents investigated — all reported incidents must be thoroughly investigated regardless of perceived severity.`,
    );
  }

  // High severity unresolved concerns
  if (highSeverityUnresolved > 0) {
    concerns.push(
      `${highSeverityUnresolved} high/critical severity bullying incident${highSeverityUnresolved !== 1 ? "s" : ""} remain${highSeverityUnresolved === 1 ? "s" : ""} unresolved — these pose significant safeguarding risks and require immediate action.`,
    );
  }

  // Safety plan concerns
  if (safetyPlanRate < 50 && totalBullyingIncidents > 0) {
    concerns.push(
      `Safety plans created for only ${safetyPlanRate}% of bullying incidents — children involved in bullying may lack adequate protection and support without documented safety measures.`,
    );
  }

  // Bullying follow-up concerns
  if (bullyingFollowUpRate < 70 && totalBullyingIncidents > 0) {
    concerns.push(
      `Bullying follow-up completed in only ${bullyingFollowUpRate}% of cases — without consistent follow-up, the home cannot verify that bullying has stopped and children feel safe.`,
    );
  }

  // Parent/carer notification concerns
  if (parentCarerInformedRate < 80 && totalBullyingIncidents > 0) {
    concerns.push(
      `Parents/carers informed in only ${parentCarerInformedRate}% of bullying incidents — relevant adults must be notified of bullying to ensure coordinated safeguarding.`,
    );
  }

  // Social worker notification concerns
  if (socialWorkerInformedRate < 80 && totalBullyingIncidents > 0) {
    concerns.push(
      `Social workers informed in only ${socialWorkerInformedRate}% of bullying incidents — social workers must be notified to fulfil regulatory reporting requirements.`,
    );
  }

  // Friendship plan coverage concerns
  if (friendshipPlanCoverageRate < 30 && total_children > 0 && totalFriendshipPlans > 0) {
    concerns.push(
      `Only ${friendshipPlanCoverageRate}% of children have active friendship support plans — the majority of children lack structured support for developing and maintaining friendships.`,
    );
  } else if (friendshipPlanCoverageRate < 60 && friendshipPlanCoverageRate >= 30 && total_children > 0) {
    concerns.push(
      `Friendship plan coverage at ${friendshipPlanCoverageRate}% — not all children receive targeted friendship development support.`,
    );
  }

  // Goal achievement concerns
  if (friendshipGoalAchievementRate < 40 && totalGoalsSet > 0) {
    concerns.push(
      `Only ${friendshipGoalAchievementRate}% of friendship plan goals achieved — children are not making expected progress towards their social development objectives.`,
    );
  } else if (friendshipGoalAchievementRate < 60 && friendshipGoalAchievementRate >= 40 && totalGoalsSet > 0) {
    concerns.push(
      `Friendship goal achievement at ${friendshipGoalAchievementRate}% — some children are falling short of their social development targets.`,
    );
  }

  // Social activity participation concerns
  if (socialActivityParticipationRate < 40 && totalSocialActivities > 0) {
    concerns.push(
      `Only ${socialActivityParticipationRate}% social activity participation — children are not regularly engaging in social activities, limiting opportunities for social development and peer interaction.`,
    );
  } else if (socialActivityParticipationRate < 70 && socialActivityParticipationRate >= 40 && totalSocialActivities > 0) {
    concerns.push(
      `Social activity participation at ${socialActivityParticipationRate}% — some children are not engaging in social activities, reducing their opportunities for peer interaction.`,
    );
  }

  // Activity enjoyment concerns
  if (activityEnjoymentRate < 50 && attendedActivities > 0) {
    concerns.push(
      `Only ${activityEnjoymentRate}% of attended activities enjoyed — the social activities offered may not match children's interests or preferences.`,
    );
  }

  // High refusal rate concerns
  if (refusalRate >= 30 && totalSocialActivities > 0) {
    concerns.push(
      `${refusalRate}% activity refusal rate — children are frequently declining social activities, which may indicate anxiety, disinterest, or barriers to participation that need exploration.`,
    );
  }

  // Child voice concerns
  if (combinedChildVoiceRate < 50 && totalVoiceOpportunities > 0) {
    concerns.push(
      `Child voice captured in only ${combinedChildVoiceRate}% of assessments and plans — children's perspectives are not adequately informing their own social development support.`,
    );
  } else if (combinedChildVoiceRate < 70 && combinedChildVoiceRate >= 50 && totalVoiceOpportunities > 0) {
    concerns.push(
      `Child voice captured in ${combinedChildVoiceRate}% of assessments and plans — the home should seek children's views more consistently to ensure support is child-centred.`,
    );
  }

  // Peer interaction quality concerns
  if (averagePeerInteractionQuality < 2.5 && attendedActivities > 0) {
    concerns.push(
      `Peer interaction quality during activities averages only ${averagePeerInteractionQuality}/5 — children may be struggling with social skills in activity settings.`,
    );
  }

  // Conflict resolution concerns
  if (averageConflictResolution < 2.5 && totalAssessments > 0) {
    concerns.push(
      `Conflict resolution skills average only ${averageConflictResolution}/5 — children lack the skills to manage peer disagreements constructively, increasing the risk of escalation.`,
    );
  }

  // Empathy concerns
  if (averageEmpathy < 2.5 && totalAssessments > 0) {
    concerns.push(
      `Empathy scores average only ${averageEmpathy}/5 — children may need targeted support to develop empathy and understanding of others' perspectives.`,
    );
  }

  // Peer acceptance concerns
  if (averagePeerAcceptance < 2.5 && totalAssessments > 0) {
    concerns.push(
      `Peer acceptance scores average only ${averagePeerAcceptance}/5 — some children may be experiencing social rejection or isolation within the home.`,
    );
  }

  // No social activities concern
  if (totalSocialActivities === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No social activities recorded despite children being on placement — children require structured social opportunities to develop peer relationships and community connections.",
    );
  }

  // No friendship plans concern
  if (totalFriendshipPlans === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No friendship support plans exist — children may lack targeted support for developing and maintaining meaningful friendships.",
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: PeerRelationshipRecommendation[] = [];
  let rank = 0;

  // Immediate recommendations

  if (highSeverityUnresolved > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently resolve all high/critical severity bullying incidents — unresolved serious bullying poses significant safeguarding risks and must be addressed as the highest priority with documented safety plans and intervention strategies.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 9 — Promoting positive behaviour, Reg 12 — Safeguarding",
    });
  }

  if (bullyingResolutionRate < 50 && totalBullyingIncidents > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a structured bullying incident management process with clear investigation timescales, resolution pathways, and follow-up procedures. Every child must see that reporting bullying leads to effective action.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 9 — Promoting positive behaviour",
    });
  }

  if (peerAssessmentCoverageRate < 30 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct peer relationship assessments for all children to establish a baseline understanding of social development needs, peer relationship quality, and areas requiring intervention. Assessments must capture the child's own views.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Children's plans",
    });
  }

  if (socialActivityParticipationRate < 40 && totalSocialActivities > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review social activity provision and barriers to participation — explore why children are not engaging, adapt activities to match children's interests, and address any anxieties or practical barriers preventing attendance.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider community",
    });
  }

  if (combinedChildVoiceRate < 50 && totalVoiceOpportunities > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure children's voices are captured in all peer assessments and friendship support plans — social development support must be informed by children's own perspectives on their friendships, challenges, and goals.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (bullyingInvestigationRate < 80 && totalBullyingIncidents > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate all reported bullying incidents thoroughly — every report must be taken seriously regardless of perceived severity, with documented investigation steps, timescales, and outcomes.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 9 — Promoting positive behaviour",
    });
  }

  if (safetyPlanRate < 50 && totalBullyingIncidents > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Create safety plans for all bullying incidents — children involved in bullying need documented protective measures to ensure their immediate safety while investigations and resolutions proceed.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 12 — Safeguarding",
    });
  }

  if (totalSocialActivities === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a programme of structured social activities including group activities, community engagement, and social outings to provide children with regular opportunities for peer interaction and social skill development.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider community",
    });
  }

  // Soon recommendations

  if (
    peerAssessmentCoverageRate >= 30 &&
    peerAssessmentCoverageRate < 70 &&
    total_children > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend peer relationship assessments to all children — aim for at least 90% coverage to ensure the home has comprehensive visibility of social development needs and can intervene early where children are struggling.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Children's plans",
    });
  }

  if (programmeAttendanceRate < 70 && totalSessionsPlanned > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review programme scheduling and format to improve session attendance — explore children's preferences, address barriers, and consider flexible delivery to maximise engagement with social skills development.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Children's plans",
    });
  }

  if (
    bullyingResolutionRate >= 50 &&
    bullyingResolutionRate < 80 &&
    totalBullyingIncidents > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve bullying resolution rate to at least 80% — ensure all incidents progress through investigation to documented resolution, with child satisfaction measured as part of the closure process.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 9 — Promoting positive behaviour",
    });
  }

  if (
    friendshipPlanCoverageRate < 60 &&
    total_children > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop friendship support plans for children who lack structured friendship development support — plans should include specific goals, planned activities, and regular reviews to track progress.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Children's plans",
    });
  }

  if (
    friendshipGoalAchievementRate < 60 &&
    totalGoalsSet > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review friendship plan goals and support strategies — low goal achievement suggests targets may need adjusting or additional support is required to help children progress towards their social development objectives.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Children's plans",
    });
  }

  if (measureableImprovementRate < 40 && totalProgrammes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Evaluate the effectiveness of current social skills programmes — consider evidence-based alternatives, adjust delivery methods, or provide additional training for facilitators to improve measurable outcomes.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Children's plans",
    });
  }

  if (activityEnjoymentRate < 50 && attendedActivities > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review social activity planning with children's input — low enjoyment suggests activities may not reflect children's interests and preferences. Involve children in activity planning and choice.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (refusalRate >= 30 && totalSocialActivities > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Explore the reasons behind high activity refusal rates — work with individual children to understand barriers (anxiety, lack of interest, peer dynamics) and adapt provision accordingly.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider community",
    });
  }

  if (bullyingFollowUpRate < 70 && totalBullyingIncidents > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure follow-up is completed for all bullying incidents — without consistent follow-up the home cannot verify that bullying has ceased and that affected children feel safe.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 9 — Promoting positive behaviour",
    });
  }

  if (parentCarerInformedRate < 80 && totalBullyingIncidents > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Notify parents/carers of all bullying incidents promptly — multi-agency coordination requires relevant adults to be informed so they can provide additional support and monitor for ongoing concerns.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 9 — Promoting positive behaviour",
    });
  }

  // Planned recommendations

  if (
    socialSkillsEngagementRate >= 30 &&
    socialSkillsEngagementRate < 60 &&
    total_children > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Expand social skills programme provision to reach more children — consider group programmes that can support multiple children simultaneously and peer mentoring to build social skills through positive role modelling.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Children's plans",
    });
  }

  if (
    socialActivityParticipationRate >= 40 &&
    socialActivityParticipationRate < 70 &&
    totalSocialActivities > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop creative approaches to increase social activity participation — consider children's preferences, offer variety in activity types, and ensure activities are inclusive and accessible to all children.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider community",
    });
  }

  if (externalActivityRate < 30 && attendedActivities > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase external activity opportunities to support children's integration with the wider community — community-based activities help children develop social networks beyond the home and practise social skills in diverse settings.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging with the wider community",
    });
  }

  if (
    combinedChildVoiceRate >= 50 &&
    combinedChildVoiceRate < 70 &&
    totalVoiceOpportunities > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase the consistency of capturing children's voices in assessments and plans — aim for at least 90% to ensure social development support is genuinely child-centred and reflects children's own goals.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (
    averageRelationshipQuality < 3.0 &&
    averageRelationshipQuality >= 2.0 &&
    totalAssessments > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement targeted interventions to improve peer relationship quality — consider therapeutic approaches, structured social opportunities, and staff training on facilitating positive peer interactions.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 9 — Promoting positive behaviour",
    });
  }

  if (childInitiatedRate < 15 && totalSocialActivities > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Encourage children to initiate their own social activities — empower children to suggest, plan, and lead activities that interest them, building autonomy and social leadership skills.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (totalFriendshipPlans === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop friendship support plans for children who need targeted support in building and maintaining friendships — plans should identify needs, set goals, and include activities that promote friendship development.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Children's plans",
    });
  }

  if (averageConflictResolution < 3.0 && totalAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Deliver targeted conflict resolution skills training — low conflict resolution scores indicate children need structured support to learn constructive ways of managing disagreements with peers.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 9 — Promoting positive behaviour",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: PeerRelationshipInsight[] = [];

  // -- Critical insights --

  if (highSeverityUnresolved > 0) {
    insights.push({
      text: `${highSeverityUnresolved} high or critical severity bullying incident${highSeverityUnresolved !== 1 ? "s" : ""} remain${highSeverityUnresolved === 1 ? "s" : ""} unresolved. Ofsted will view unresolved serious bullying as a significant safeguarding failure, indicating the home cannot guarantee children's safety from peer-on-peer harm. This requires immediate intervention.`,
      severity: "critical",
    });
  }

  if (bullyingResolutionRate < 50 && totalBullyingIncidents > 0) {
    insights.push({
      text: `Only ${bullyingResolutionRate}% of bullying incidents resolved. Children who experience unresolved bullying lose trust in the home's ability to keep them safe. Ofsted will view this as evidence that the home's anti-bullying practice is ineffective, directly undermining Reg 9 compliance.`,
      severity: "critical",
    });
  }

  if (peerAssessmentCoverageRate < 30 && total_children > 0) {
    insights.push({
      text: `Only ${peerAssessmentCoverageRate}% peer assessment coverage. Without formal assessment of children's peer relationships, the home cannot identify social development needs, intervene early when relationships are struggling, or evidence that children's social wellbeing is monitored. This is a gap in Reg 7 compliance.`,
      severity: "critical",
    });
  }

  if (socialActivityParticipationRate < 40 && totalSocialActivities > 0) {
    insights.push({
      text: `Only ${socialActivityParticipationRate}% social activity participation. Children in residential care depend on the home to provide social opportunities — low participation means children are missing crucial opportunities for social development, peer interaction, and community engagement. This undermines Reg 5 compliance.`,
      severity: "critical",
    });
  }

  if (combinedChildVoiceRate < 50 && totalVoiceOpportunities > 0) {
    insights.push({
      text: `Child voice captured in only ${combinedChildVoiceRate}% of assessments and plans. Social development support that does not reflect children's own views, friendships, and goals is unlikely to be effective. Ofsted expects children's voices to drive their care planning.`,
      severity: "critical",
    });
  }

  if (averagePeerAcceptance < 2.0 && totalAssessments > 0) {
    insights.push({
      text: `Peer acceptance averaging only ${averagePeerAcceptance}/5. Low peer acceptance indicates children may be experiencing social rejection or isolation within the home. This poses risks to emotional wellbeing and requires immediate therapeutic intervention.`,
      severity: "critical",
    });
  }

  if (totalSocialActivities === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No social activities recorded despite children being on placement. Without structured social opportunities, children cannot develop peer relationships, practise social skills, or engage with the wider community. This represents a fundamental gap in Reg 5 compliance.",
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    peerAssessmentCoverageRate >= 30 &&
    peerAssessmentCoverageRate < 70 &&
    total_children > 0
  ) {
    insights.push({
      text: `Peer assessment coverage at ${peerAssessmentCoverageRate}% — while some children have been assessed, gaps in coverage mean the home may miss emerging social development concerns for unassessed children.`,
      severity: "warning",
    });
  }

  if (
    averageRelationshipQuality >= 2.5 &&
    averageRelationshipQuality < 3.0 &&
    totalAssessments > 0
  ) {
    insights.push({
      text: `Peer relationship quality at ${averageRelationshipQuality}/5 — relationships are below the expected standard. Children may need additional support and structured opportunities to develop positive peer relationships.`,
      severity: "warning",
    });
  }

  if (
    socialSkillsEngagementRate >= 30 &&
    socialSkillsEngagementRate < 60 &&
    total_children > 0
  ) {
    insights.push({
      text: `Social skills programme engagement at ${socialSkillsEngagementRate}% — not all children who could benefit are receiving structured support. Consider screening all children for social development needs and expanding programme provision.`,
      severity: "warning",
    });
  }

  if (
    programmeAttendanceRate >= 50 &&
    programmeAttendanceRate < 70 &&
    totalSessionsPlanned > 0
  ) {
    insights.push({
      text: `Programme attendance at ${programmeAttendanceRate}% — inconsistent attendance reduces programme effectiveness. Explore whether session timing, format, or content needs adapting to improve engagement.`,
      severity: "warning",
    });
  }

  if (measureableImprovementRate < 40 && totalProgrammes > 0) {
    insights.push({
      text: `Only ${measureableImprovementRate}% of programmes show measurable improvement — the current programme approaches may not be sufficiently evidence-based or well-matched to children's needs. Consider reviewing and adapting programme content.`,
      severity: "warning",
    });
  }

  if (
    bullyingResolutionRate >= 50 &&
    bullyingResolutionRate < 80 &&
    totalBullyingIncidents > 0
  ) {
    insights.push({
      text: `Bullying resolution at ${bullyingResolutionRate}% — improving but some incidents remain open. Each unresolved incident represents a child who may still feel unsafe among their peers.`,
      severity: "warning",
    });
  }

  if (
    friendshipPlanCoverageRate >= 30 &&
    friendshipPlanCoverageRate < 60 &&
    total_children > 0
  ) {
    insights.push({
      text: `Friendship plan coverage at ${friendshipPlanCoverageRate}% — not all children have structured friendship support. Children in care often need intentional support to develop and maintain friendships, both within and outside the home.`,
      severity: "warning",
    });
  }

  if (
    friendshipGoalAchievementRate >= 40 &&
    friendshipGoalAchievementRate < 60 &&
    totalGoalsSet > 0
  ) {
    insights.push({
      text: `Friendship goal achievement at ${friendshipGoalAchievementRate}% — some children are progressing but others are not meeting their social development targets. Review whether goals are realistic and whether sufficient support is provided.`,
      severity: "warning",
    });
  }

  if (
    socialActivityParticipationRate >= 40 &&
    socialActivityParticipationRate < 70 &&
    totalSocialActivities > 0
  ) {
    insights.push({
      text: `Social activity participation at ${socialActivityParticipationRate}% — while some children are engaging, many are not participating regularly. Consider whether activities reflect children's interests and whether barriers are being addressed.`,
      severity: "warning",
    });
  }

  if (
    activityEnjoymentRate >= 50 &&
    activityEnjoymentRate < 70 &&
    attendedActivities > 0
  ) {
    insights.push({
      text: `Activity enjoyment at ${activityEnjoymentRate}% — a significant proportion of attended activities are not enjoyed. Involving children more in activity planning may improve engagement and social development outcomes.`,
      severity: "warning",
    });
  }

  if (refusalRate >= 30 && totalSocialActivities > 0) {
    insights.push({
      text: `Activity refusal rate at ${refusalRate}% — children frequently decline social activities. This may indicate social anxiety, negative peer dynamics, or a mismatch between activities offered and children's interests.`,
      severity: "warning",
    });
  }

  if (
    combinedChildVoiceRate >= 50 &&
    combinedChildVoiceRate < 70 &&
    totalVoiceOpportunities > 0
  ) {
    insights.push({
      text: `Child voice captured in ${combinedChildVoiceRate}% of assessments and plans — while improving, inconsistent voice capture means some social development support may not reflect children's own priorities and perspectives.`,
      severity: "warning",
    });
  }

  if (
    averageConflictResolution >= 2.5 &&
    averageConflictResolution < 3.0 &&
    totalAssessments > 0
  ) {
    insights.push({
      text: `Conflict resolution skills at ${averageConflictResolution}/5 — some children may benefit from structured support in learning to manage disagreements constructively before they escalate.`,
      severity: "warning",
    });
  }

  if (avgDaysToResolve > 14 && resolvedBullyingIncidents > 0) {
    insights.push({
      text: `Average bullying resolution time is ${avgDaysToResolve} days — extended resolution periods leave children in uncertain and potentially unsafe situations for too long. Aim for resolution within 7 working days.`,
      severity: "warning",
    });
  }

  // Bullying type patterns
  const bullyingTypeCounts: Record<string, number> = {};
  for (const b of bullying_incidents) {
    bullyingTypeCounts[b.incident_type] =
      (bullyingTypeCounts[b.incident_type] ?? 0) + 1;
  }
  const topBullyingTypes = Object.entries(bullyingTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topBullyingTypes.length > 0 && totalBullyingIncidents >= 3) {
    const typeLabels: Record<string, string> = {
      physical: "physical",
      verbal: "verbal",
      emotional: "emotional",
      cyber: "cyber",
      social_exclusion: "social exclusion",
      other: "other",
    };
    insights.push({
      text: `Bullying incident patterns: ${topBullyingTypes.map(([t, c]) => `${typeLabels[t] ?? t} (${c} incident${c !== 1 ? "s" : ""})`).join(", ")}. Understanding the predominant types of bullying helps target prevention strategies and staff training to address specific dynamics.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (peer_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding peer relationship and social development support — children's social needs are assessed, friendships are actively supported, bullying is managed effectively, and social activities are well-attended and enjoyed. This is strong evidence for Reg 5, Reg 7, and Reg 9 compliance.",
      severity: "positive",
    });
  }

  if (
    peerAssessmentCoverageRate >= 90 &&
    total_children > 0
  ) {
    insights.push({
      text: `${peerAssessmentCoverageRate}% peer assessment coverage — the home maintains comprehensive visibility of children's peer relationships and social development, enabling early identification of concerns and targeted intervention.`,
      severity: "positive",
    });
  }

  if (
    averageRelationshipQuality >= 4.0 &&
    averageSocialConfidence >= 4.0 &&
    totalAssessments > 0
  ) {
    insights.push({
      text: `Relationship quality (${averageRelationshipQuality}/5) and social confidence (${averageSocialConfidence}/5) are both strong — children are forming positive peer relationships and feel confident in social situations. This is evidence of effective social development support.`,
      severity: "positive",
    });
  }

  if (
    bullyingResolutionRate >= 100 &&
    bullyingInvestigationRate >= 100 &&
    totalBullyingIncidents > 0
  ) {
    insights.push({
      text: "Every bullying incident has been investigated and resolved — the home operates a thorough and effective anti-bullying process. This demonstrates zero tolerance for bullying with genuine follow-through that keeps children safe.",
      severity: "positive",
    });
  }

  if (
    bullyingResolutionRate >= 90 &&
    safetyPlanRate >= 90 &&
    bullyingFollowUpRate >= 90 &&
    totalBullyingIncidents > 0
  ) {
    insights.push({
      text: "Bullying management is comprehensive — high resolution, safety planning, and follow-up rates demonstrate the home takes a thorough approach to managing bullying that prioritises children's safety and wellbeing.",
      severity: "positive",
    });
  }

  if (
    friendshipPlanCoverageRate >= 80 &&
    friendshipGoalAchievementRate >= 80 &&
    total_children > 0 &&
    totalGoalsSet > 0
  ) {
    insights.push({
      text: `${friendshipPlanCoverageRate}% friendship plan coverage with ${friendshipGoalAchievementRate}% goal achievement — the home provides comprehensive, effective friendship development support that helps children build and maintain meaningful relationships.`,
      severity: "positive",
    });
  }

  if (
    socialActivityParticipationRate >= 90 &&
    activityEnjoymentRate >= 80 &&
    totalSocialActivities > 0
  ) {
    insights.push({
      text: `${socialActivityParticipationRate}% participation with ${activityEnjoymentRate}% enjoyment — social activities are well-attended and genuinely enjoyed by children, providing consistent opportunities for social development and peer interaction.`,
      severity: "positive",
    });
  }

  if (
    externalActivityRate >= 50 &&
    newConnectionsRate >= 30 &&
    attendedActivities > 0
  ) {
    insights.push({
      text: `${externalActivityRate}% external activities with new connections in ${newConnectionsRate}% — children are developing social networks beyond the home and engaging meaningfully with the wider community, supporting Reg 5 compliance.`,
      severity: "positive",
    });
  }

  if (
    childInitiatedRate >= 30 &&
    totalSocialActivities > 0
  ) {
    insights.push({
      text: `${childInitiatedRate}% of activities are child-initiated — children feel empowered to shape their own social opportunities, demonstrating autonomy and social confidence. This reflects genuine child-centred practice.`,
      severity: "positive",
    });
  }

  if (
    combinedChildVoiceRate >= 90 &&
    totalVoiceOpportunities > 0
  ) {
    insights.push({
      text: "Child voice consistently captured across assessments and support plans — children's perspectives genuinely inform their social development support. Ofsted will view this as strong evidence of child-centred practice.",
      severity: "positive",
    });
  }

  if (
    restorativeRate >= 50 &&
    resolvedBullyingIncidents > 0
  ) {
    insights.push({
      text: `${restorativeRate}% of resolved bullying incidents used restorative approaches — the home prioritises relationship repair and learning over punitive measures, which supports children's social development and maintains positive peer dynamics.`,
      severity: "positive",
    });
  }

  if (
    programmeAttendanceRate >= 90 &&
    measureableImprovementRate >= 70 &&
    totalProgrammes > 0
  ) {
    insights.push({
      text: `${programmeAttendanceRate}% programme attendance with ${measureableImprovementRate}% showing measurable improvement — social skills programmes are well-attended and delivering tangible outcomes for children's social development.`,
      severity: "positive",
    });
  }

  if (
    averageEmpathy >= 4.0 &&
    averageCooperation >= 4.0 &&
    averageConflictResolution >= 4.0 &&
    totalAssessments > 0
  ) {
    insights.push({
      text: `Empathy (${averageEmpathy}/5), cooperation (${averageCooperation}/5), and conflict resolution (${averageConflictResolution}/5) are all strong — children demonstrate well-developed prosocial skills that support positive peer relationships and reduce conflict.`,
      severity: "positive",
    });
  }

  if (totalBullyingIncidents === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No bullying incidents recorded — the home maintains a positive peer environment. While this is positive, the home should ensure children feel empowered to report any concerns and that the absence of reports genuinely reflects an absence of bullying.",
      severity: "positive",
    });
  }

  if (
    externalFriendshipRate >= 80 &&
    totalFriendshipPlans > 0
  ) {
    insights.push({
      text: `${externalFriendshipRate}% of friendship plans support external friendships — the home actively facilitates children maintaining relationships outside the home, which is vital for normalising their social experiences and supporting community integration.`,
      severity: "positive",
    });
  }

  if (
    peerMatchingSuccessRate >= 70 &&
    peerMatchingAttempted > 0
  ) {
    insights.push({
      text: `${peerMatchingSuccessRate}% peer matching success — the home effectively pairs children with compatible peers, demonstrating thoughtful and skilled matching that supports friendship development.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (peer_rating === "outstanding") {
    headline =
      "Outstanding peer relationship and social development support — children's social needs are assessed, friendships are actively supported, bullying is managed effectively, and social activities are thriving.";
  } else if (peer_rating === "good") {
    headline = `Good peer relationship and social development support — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (peer_rating === "adequate") {
    headline = `Adequate peer relationship and social development support — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's social development is effectively supported.`;
  } else {
    headline = `Peer relationship and social development support is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's social needs are met and peer relationships are supported.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    peer_rating,
    peer_score: score,
    headline,
    total_assessments: totalAssessments,
    total_programmes: totalProgrammes,
    total_bullying_incidents: totalBullyingIncidents,
    total_friendship_plans: totalFriendshipPlans,
    total_social_activities: totalSocialActivities,
    peer_assessment_coverage_rate: peerAssessmentCoverageRate,
    social_skills_engagement_rate: socialSkillsEngagementRate,
    bullying_resolution_rate: bullyingResolutionRate,
    friendship_plan_coverage_rate: friendshipPlanCoverageRate,
    social_activity_participation_rate: socialActivityParticipationRate,
    child_voice_in_plans_rate: combinedChildVoiceRate,
    average_relationship_quality: averageRelationshipQuality,
    average_social_confidence: averageSocialConfidence,
    programme_attendance_rate: programmeAttendanceRate,
    bullying_investigation_rate: bullyingInvestigationRate,
    friendship_goal_achievement_rate: friendshipGoalAchievementRate,
    activity_enjoyment_rate: activityEnjoymentRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
