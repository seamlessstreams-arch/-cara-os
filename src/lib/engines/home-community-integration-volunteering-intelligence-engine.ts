// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME COMMUNITY INTEGRATION & VOLUNTEERING INTELLIGENCE ENGINE
// Home-level engine measuring community integration quality — community
// activity participation, volunteering opportunities, social inclusion
// programmes, neighbourhood relations, and local service engagement.
// Surfaces whether the home is actively integrating children into community
// life, supporting volunteering, promoting social inclusion, maintaining
// positive neighbourhood relationships, and engaging with local services.
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Injectable `today` parameter for deterministic testing.
//
// Regulatory: Ofsted CHR 2015 Reg 5 (Engaging parents and others), Reg 11
// (Positive relationships). SCCIF experiences and progress.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface CommunityActivityRecordInput {
  id: string;
  child_id: string;
  date: string;
  activity_name: string;
  activity_type:
    | "sports_club"
    | "youth_group"
    | "arts_culture"
    | "music"
    | "drama"
    | "religious_group"
    | "scouts_guides"
    | "community_event"
    | "library_programme"
    | "after_school_club"
    | "holiday_programme"
    | "other";
  venue: string;
  duration_minutes: number;
  attended: boolean;
  child_enjoyed: boolean;
  child_feedback: string;
  builds_friendships: boolean;
  ongoing_regular: boolean;
  staff_supported: boolean;
  risk_assessment_completed: boolean;
  consent_obtained: boolean;
  outcomes_documented: boolean;
  created_at: string;
}

export interface VolunteeringRecordInput {
  id: string;
  child_id: string;
  date: string;
  organisation: string;
  role_description: string;
  volunteering_type:
    | "charity_shop"
    | "animal_welfare"
    | "environmental"
    | "community_garden"
    | "food_bank"
    | "elderly_support"
    | "youth_mentoring"
    | "sports_coaching"
    | "fundraising"
    | "other";
  hours: number;
  child_initiated: boolean;
  child_enjoyed: boolean;
  child_feedback: string;
  skills_developed: string[];
  ongoing_commitment: boolean;
  safeguarding_check_completed: boolean;
  risk_assessment_completed: boolean;
  staff_supported: boolean;
  recognition_received: boolean;
  created_at: string;
}

export interface SocialInclusionRecordInput {
  id: string;
  child_id: string;
  date: string;
  programme_name: string;
  programme_type:
    | "peer_mentoring"
    | "buddy_scheme"
    | "inclusion_group"
    | "anti_discrimination"
    | "cultural_exchange"
    | "disability_inclusion"
    | "lgbtq_support"
    | "refugee_integration"
    | "digital_inclusion"
    | "other";
  provider: string;
  child_engaged: boolean;
  child_feedback: string;
  outcomes_achieved: string[];
  barriers_identified: string[];
  barriers_addressed: boolean;
  review_date: string;
  reviewed: boolean;
  professional_involved: boolean;
  created_at: string;
}

export interface NeighbourhoodRecordInput {
  id: string;
  date: string;
  interaction_type:
    | "neighbour_visit"
    | "community_meeting"
    | "neighbourhood_event"
    | "complaint_received"
    | "complaint_resolved"
    | "positive_feedback"
    | "joint_activity"
    | "introduction_meeting"
    | "boundary_discussion"
    | "other";
  description: string;
  positive_outcome: boolean;
  complaint: boolean;
  complaint_resolved: boolean;
  follow_up_needed: boolean;
  follow_up_completed: boolean;
  children_involved: string[];
  community_perception_improved: boolean;
  staff_member: string;
  created_at: string;
}

export interface LocalServiceRecordInput {
  id: string;
  date: string;
  service_name: string;
  service_type:
    | "gp_surgery"
    | "dentist"
    | "optician"
    | "library"
    | "leisure_centre"
    | "youth_service"
    | "camhs"
    | "social_services"
    | "police_liaison"
    | "fire_service"
    | "school"
    | "college"
    | "job_centre"
    | "housing"
    | "citizens_advice"
    | "faith_organisation"
    | "other";
  children_accessing: string[];
  engagement_quality: "excellent" | "good" | "adequate" | "poor";
  service_responsive: boolean;
  relationship_established: boolean;
  regular_contact: boolean;
  referral_made: boolean;
  referral_outcome: string;
  child_satisfaction: boolean;
  notes: string;
  created_at: string;
}

export interface CommunityIntegrationInput {
  today: string;
  total_children: number;
  community_activity_records: CommunityActivityRecordInput[];
  volunteering_records: VolunteeringRecordInput[];
  social_inclusion_records: SocialInclusionRecordInput[];
  neighbourhood_records: NeighbourhoodRecordInput[];
  local_service_records: LocalServiceRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type CommunityIntegrationRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface CommunityIntegrationInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface CommunityIntegrationRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface CommunityIntegrationResult {
  community_rating: CommunityIntegrationRating;
  community_score: number;
  headline: string;
  total_community_activities: number;
  total_volunteering_records: number;
  total_social_inclusion_records: number;
  total_neighbourhood_records: number;
  total_local_service_records: number;
  community_participation_rate: number;
  volunteering_rate: number;
  social_inclusion_rate: number;
  neighbourhood_relation_rate: number;
  local_service_rate: number;
  child_satisfaction_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: CommunityIntegrationRecommendation[];
  insights: CommunityIntegrationInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): CommunityIntegrationRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: CommunityIntegrationRating,
  score: number,
  headline: string,
): CommunityIntegrationResult {
  return {
    community_rating: rating,
    community_score: score,
    headline,
    total_community_activities: 0,
    total_volunteering_records: 0,
    total_social_inclusion_records: 0,
    total_neighbourhood_records: 0,
    total_local_service_records: 0,
    community_participation_rate: 0,
    volunteering_rate: 0,
    social_inclusion_rate: 0,
    neighbourhood_relation_rate: 0,
    local_service_rate: 0,
    child_satisfaction_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeCommunityIntegrationVolunteering(
  input: CommunityIntegrationInput,
): CommunityIntegrationResult {
  const {
    today,
    total_children,
    community_activity_records,
    volunteering_records,
    social_inclusion_records,
    neighbourhood_records,
    local_service_records,
  } = input;

  // ── Special case: all empty + 0 children -> insufficient_data ──────────
  const allEmpty =
    community_activity_records.length === 0 &&
    volunteering_records.length === 0 &&
    social_inclusion_records.length === 0 &&
    neighbourhood_records.length === 0 &&
    local_service_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess community integration and volunteering.",
    );
  }

  // ── Special case: all empty + children > 0 -> inadequate/15 ────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No community integration or volunteering data recorded despite children on placement — community engagement requires urgent attention.",
      ),
      concerns: [
        "No community activity records, volunteering records, social inclusion programmes, neighbourhood relations, or local service engagement records exist despite children being on placement — the home cannot evidence that children are being integrated into their community.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of community activities, volunteering opportunities, social inclusion programmes, neighbourhood relations, and local service engagement to evidence the home's community integration approach.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
        },
        {
          rank: 2,
          recommendation:
            "Ensure every child has access to community activities, volunteering opportunities, and social inclusion programmes that support their development and integration into the local community.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Engaging parents and others",
        },
      ],
      insights: [
        {
          text: "The complete absence of community integration and volunteering records means Ofsted cannot verify that children are being supported to engage with their communities, develop social skills, or build positive relationships beyond the home. This represents a fundamental gap in Reg 5 and Reg 11 compliance.",
          severity: "critical",
        },
      ],
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ANALYSIS — 90-day window for activity-based metrics
  // ═══════════════════════════════════════════════════════════════════════

  // ── Community Activity Metrics ─────────────────────────────────────────

  const ca90d = community_activity_records.filter((r) => {
    const d = daysBetween(r.date, today);
    return d >= 0 && d <= 90;
  });

  const totalCommunityActivities = community_activity_records.length;
  const caAttended = ca90d.filter((r) => r.attended).length;
  const caAttendanceRate = pct(caAttended, ca90d.length);

  const caChildIds = new Set(ca90d.filter((r) => r.attended).map((r) => r.child_id));
  const communityParticipationRate = pct(caChildIds.size, total_children);

  const caEnjoyed = ca90d.filter((r) => r.attended && r.child_enjoyed).length;
  const caEnjoymentRate = pct(caEnjoyed, caAttended);

  const caFriendships = ca90d.filter((r) => r.attended && r.builds_friendships).length;
  const caFriendshipRate = pct(caFriendships, caAttended);

  const caOngoing = ca90d.filter((r) => r.attended && r.ongoing_regular).length;
  const caOngoingRate = pct(caOngoing, caAttended);

  const caRiskAssessed = ca90d.filter((r) => r.risk_assessment_completed).length;
  const caRiskAssessmentRate = pct(caRiskAssessed, ca90d.length);

  const caConsent = ca90d.filter((r) => r.consent_obtained).length;
  const caConsentRate = pct(caConsent, ca90d.length);

  const caOutcomes = ca90d.filter((r) => r.attended && r.outcomes_documented).length;
  const caOutcomesRate = pct(caOutcomes, caAttended);

  const caUniqueTypes = new Set(ca90d.filter((r) => r.attended).map((r) => r.activity_type));
  const caTypeVariety = caUniqueTypes.size;

  const caFeedback = ca90d.filter((r) => r.attended && r.child_feedback && r.child_feedback.trim().length > 0).length;
  const caFeedbackRate = pct(caFeedback, caAttended);

  // ── Volunteering Metrics ───────────────────────────────────────────────

  const vol90d = volunteering_records.filter((r) => {
    const d = daysBetween(r.date, today);
    return d >= 0 && d <= 90;
  });

  const totalVolunteeringRecords = volunteering_records.length;
  const volChildIds = new Set(vol90d.map((r) => r.child_id));
  const volunteeringRate = pct(volChildIds.size, total_children);

  const volEnjoyed = vol90d.filter((r) => r.child_enjoyed).length;
  const volEnjoymentRate = pct(volEnjoyed, vol90d.length);

  const volChildInitiated = vol90d.filter((r) => r.child_initiated).length;
  const volChildInitiatedRate = pct(volChildInitiated, vol90d.length);

  const volOngoing = vol90d.filter((r) => r.ongoing_commitment).length;
  const volOngoingRate = pct(volOngoing, vol90d.length);

  const volSafeguarding = vol90d.filter((r) => r.safeguarding_check_completed).length;
  const volSafeguardingRate = pct(volSafeguarding, vol90d.length);

  const volRiskAssessed = vol90d.filter((r) => r.risk_assessment_completed).length;
  const volRiskAssessmentRate = pct(volRiskAssessed, vol90d.length);

  const volRecognition = vol90d.filter((r) => r.recognition_received).length;
  const volRecognitionRate = pct(volRecognition, vol90d.length);

  const volSkills = vol90d.filter((r) => r.skills_developed && r.skills_developed.length > 0).length;
  const volSkillsRate = pct(volSkills, vol90d.length);

  const volFeedback = vol90d.filter((r) => r.child_feedback && r.child_feedback.trim().length > 0).length;
  const volFeedbackRate = pct(volFeedback, vol90d.length);

  const volTotalHours = vol90d.reduce((s, r) => s + r.hours, 0);
  const volAvgHours = vol90d.length > 0 ? Math.round((volTotalHours / vol90d.length) * 10) / 10 : 0;

  const volUniqueTypes = new Set(vol90d.map((r) => r.volunteering_type));

  // ── Social Inclusion Metrics ───────────────────────────────────────────

  const si90d = social_inclusion_records.filter((r) => {
    const d = daysBetween(r.date, today);
    return d >= 0 && d <= 90;
  });

  const totalSocialInclusionRecords = social_inclusion_records.length;
  const siChildIds = new Set(si90d.map((r) => r.child_id));
  const socialInclusionRate = pct(siChildIds.size, total_children);

  const siEngaged = si90d.filter((r) => r.child_engaged).length;
  const siEngagementRate = pct(siEngaged, si90d.length);

  const siOutcomes = si90d.filter((r) => r.outcomes_achieved && r.outcomes_achieved.length > 0).length;
  const siOutcomesRate = pct(siOutcomes, si90d.length);

  const siBarriersIdentified = si90d.filter((r) => r.barriers_identified && r.barriers_identified.length > 0).length;
  const siBarriersAddressed = si90d.filter(
    (r) => r.barriers_identified && r.barriers_identified.length > 0 && r.barriers_addressed,
  ).length;
  const siBarrierAddressedRate = pct(siBarriersAddressed, siBarriersIdentified);

  const siReviewDue = social_inclusion_records.filter(
    (r) => r.review_date && daysBetween(r.review_date, today) > 0 && !r.reviewed,
  ).length;

  const siReviewed = social_inclusion_records.filter((r) => r.reviewed).length;
  const siReviewRate = pct(siReviewed, social_inclusion_records.length);

  const siProfessional = si90d.filter((r) => r.professional_involved).length;
  const siProfessionalRate = pct(siProfessional, si90d.length);

  const siFeedback = si90d.filter((r) => r.child_feedback && r.child_feedback.trim().length > 0).length;
  const siFeedbackRate = pct(siFeedback, si90d.length);

  const siUniqueTypes = new Set(si90d.map((r) => r.programme_type));

  // ── Neighbourhood Relations Metrics ────────────────────────────────────

  const nr90d = neighbourhood_records.filter((r) => {
    const d = daysBetween(r.date, today);
    return d >= 0 && d <= 90;
  });

  const totalNeighbourhoodRecords = neighbourhood_records.length;

  const nrPositive = nr90d.filter((r) => r.positive_outcome).length;
  const neighbourhoodRelationRate = pct(nrPositive, nr90d.length);

  const nrComplaints = nr90d.filter((r) => r.complaint).length;
  const nrComplaintsResolved = nr90d.filter((r) => r.complaint && r.complaint_resolved).length;
  const nrComplaintResolutionRate = pct(nrComplaintsResolved, nrComplaints);

  const nrFollowUpNeeded = nr90d.filter((r) => r.follow_up_needed).length;
  const nrFollowUpCompleted = nr90d.filter((r) => r.follow_up_needed && r.follow_up_completed).length;
  const nrFollowUpRate = pct(nrFollowUpCompleted, nrFollowUpNeeded);

  const nrPerceptionImproved = nr90d.filter((r) => r.community_perception_improved).length;
  const nrPerceptionRate = pct(nrPerceptionImproved, nr90d.length);

  const nrPositiveFeedback = nr90d.filter((r) => r.interaction_type === "positive_feedback").length;
  const nrJointActivities = nr90d.filter((r) => r.interaction_type === "joint_activity").length;

  const nrComplaintCount = nr90d.filter(
    (r) => r.interaction_type === "complaint_received",
  ).length;

  // ── Local Service Engagement Metrics ───────────────────────────────────

  const ls90d = local_service_records.filter((r) => {
    const d = daysBetween(r.date, today);
    return d >= 0 && d <= 90;
  });

  const totalLocalServiceRecords = local_service_records.length;

  const lsChildIds = new Set(ls90d.flatMap((r) => r.children_accessing));
  const localServiceRate = pct(lsChildIds.size, total_children);

  const lsExcellentGood = ls90d.filter(
    (r) => r.engagement_quality === "excellent" || r.engagement_quality === "good",
  ).length;
  const lsQualityRate = pct(lsExcellentGood, ls90d.length);

  const lsResponsive = ls90d.filter((r) => r.service_responsive).length;
  const lsResponsivenessRate = pct(lsResponsive, ls90d.length);

  const lsRelationship = ls90d.filter((r) => r.relationship_established).length;
  const lsRelationshipRate = pct(lsRelationship, ls90d.length);

  const lsRegular = ls90d.filter((r) => r.regular_contact).length;
  const lsRegularRate = pct(lsRegular, ls90d.length);

  const lsChildSatisfied = ls90d.filter((r) => r.child_satisfaction).length;
  const lsChildSatisfactionRate = pct(lsChildSatisfied, ls90d.length);

  const lsUniqueTypes = new Set(ls90d.map((r) => r.service_type));

  const lsReferrals = ls90d.filter((r) => r.referral_made).length;

  // ── Composite Child Satisfaction ───────────────────────────────────────
  // Average of satisfaction signals across all domains

  const satisfactionSources: number[] = [];
  if (caAttended > 0) satisfactionSources.push(caEnjoymentRate);
  if (vol90d.length > 0) satisfactionSources.push(volEnjoymentRate);
  if (si90d.length > 0) satisfactionSources.push(siEngagementRate);
  if (ls90d.length > 0) satisfactionSources.push(lsChildSatisfactionRate);

  const childSatisfactionRate =
    satisfactionSources.length > 0
      ? Math.round(satisfactionSources.reduce((s, v) => s + v, 0) / satisfactionSources.length)
      : 0;

  // ═══════════════════════════════════════════════════════════════════════
  // SCORING — base 52 + bonuses (max +28) + 4 penalties
  // ═══════════════════════════════════════════════════════════════════════

  let score = 52;

  // --- Bonus 1: communityParticipationRate (>=80: +4, >=60: +2) ---
  if (communityParticipationRate >= 80) score += 4;
  else if (communityParticipationRate >= 60) score += 2;

  // --- Bonus 2: volunteeringRate (>=60: +4, >=30: +2) ---
  if (volunteeringRate >= 60) score += 4;
  else if (volunteeringRate >= 30) score += 2;

  // --- Bonus 3: socialInclusionRate (>=70: +4, >=40: +2) ---
  if (socialInclusionRate >= 70) score += 4;
  else if (socialInclusionRate >= 40) score += 2;

  // --- Bonus 4: neighbourhoodRelationRate (>=80: +3, >=60: +1) ---
  if (neighbourhoodRelationRate >= 80) score += 3;
  else if (neighbourhoodRelationRate >= 60) score += 1;

  // --- Bonus 5: localServiceRate (>=80: +3, >=50: +1) ---
  if (localServiceRate >= 80) score += 3;
  else if (localServiceRate >= 50) score += 1;

  // --- Bonus 6: childSatisfactionRate (>=90: +3, >=70: +1) ---
  if (childSatisfactionRate >= 90) score += 3;
  else if (childSatisfactionRate >= 70) score += 1;

  // --- Bonus 7: caFriendshipRate (>=70: +3, >=50: +1) ---
  if (caAttended > 0 && caFriendshipRate >= 70) score += 3;
  else if (caAttended > 0 && caFriendshipRate >= 50) score += 1;

  // --- Bonus 8: volOngoingRate (>=60: +2, >=30: +1) ---
  if (vol90d.length > 0 && volOngoingRate >= 60) score += 2;
  else if (vol90d.length > 0 && volOngoingRate >= 30) score += 1;

  // --- Bonus 9: siBarrierAddressedRate (>=80: +2, >=50: +1) ---
  if (siBarriersIdentified > 0 && siBarrierAddressedRate >= 80) score += 2;
  else if (siBarriersIdentified > 0 && siBarrierAddressedRate >= 50) score += 1;

  // ── Penalties (guarded by array.length > 0) ──────────────────────────

  // Penalty 1: communityParticipationRate < 30 -> -5
  if (communityParticipationRate < 30 && ca90d.length > 0) score -= 5;

  // Penalty 2: volunteeringRate < 10 with children -> -4
  if (volunteeringRate < 10 && vol90d.length > 0) score -= 4;

  // Penalty 3: neighbourhoodRelationRate < 40 -> -5
  if (neighbourhoodRelationRate < 40 && nr90d.length > 0) score -= 5;

  // Penalty 4: childSatisfactionRate < 40 -> -4
  if (childSatisfactionRate < 40 && satisfactionSources.length > 0) score -= 4;

  score = clamp(score, 0, 100);

  const community_rating = toRating(score);

  // ═══════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ═══════════════════════════════════════════════════════════════════════

  const strengths: string[] = [];

  // Community activities strengths
  if (communityParticipationRate >= 80 && ca90d.length > 0) {
    strengths.push(
      `${communityParticipationRate}% community participation rate — the vast majority of children are actively engaged in community activities, demonstrating excellent integration into local life.`,
    );
  } else if (communityParticipationRate >= 60 && ca90d.length > 0) {
    strengths.push(
      `${communityParticipationRate}% community participation — most children are regularly accessing community activities and building connections beyond the home.`,
    );
  }

  if (caAttended > 0 && caEnjoymentRate >= 90) {
    strengths.push(
      `${caEnjoymentRate}% of children report enjoying community activities — children feel positive about their community engagement, reflecting well-matched activities that meet their interests.`,
    );
  } else if (caAttended > 0 && caEnjoymentRate >= 70) {
    strengths.push(
      `${caEnjoymentRate}% child enjoyment rate in community activities — most children have positive experiences when participating in community life.`,
    );
  }

  if (caAttended > 0 && caFriendshipRate >= 70) {
    strengths.push(
      `${caFriendshipRate}% of community activities build friendships — children are developing meaningful social connections through their community engagement.`,
    );
  }

  if (caTypeVariety >= 5) {
    strengths.push(
      `${caTypeVariety} different types of community activities accessed — children have diverse opportunities spanning sports, arts, culture, and social groups.`,
    );
  }

  if (caAttended > 0 && caOngoingRate >= 70) {
    strengths.push(
      `${caOngoingRate}% of community activities are ongoing regular commitments — children have stable, sustained engagement rather than isolated one-off experiences.`,
    );
  }

  // Volunteering strengths
  if (volunteeringRate >= 60 && vol90d.length > 0) {
    strengths.push(
      `${volunteeringRate}% of children engaged in volunteering — the home actively supports children to give back to their communities and develop new skills.`,
    );
  } else if (volunteeringRate >= 30 && vol90d.length > 0) {
    strengths.push(
      `${volunteeringRate}% volunteering engagement — a good proportion of children are accessing volunteering opportunities.`,
    );
  }

  if (vol90d.length > 0 && volChildInitiatedRate >= 60) {
    strengths.push(
      `${volChildInitiatedRate}% of volunteering is child-initiated — children are self-motivated to contribute to their communities, reflecting genuine ownership and agency.`,
    );
  }

  if (vol90d.length > 0 && volSkillsRate >= 80) {
    strengths.push(
      `${volSkillsRate}% of volunteering activities develop new skills — volunteering is delivering tangible personal development benefits for children.`,
    );
  }

  if (vol90d.length > 0 && volRecognitionRate >= 70) {
    strengths.push(
      `${volRecognitionRate}% of volunteering recognised — children's voluntary contributions are celebrated, boosting self-esteem and reinforcing positive behaviour.`,
    );
  }

  if (vol90d.length > 0 && volOngoingRate >= 60) {
    strengths.push(
      `${volOngoingRate}% of volunteering involves ongoing commitment — children sustain their voluntary roles, building reliability and a sense of purpose.`,
    );
  }

  // Social inclusion strengths
  if (socialInclusionRate >= 70 && si90d.length > 0) {
    strengths.push(
      `${socialInclusionRate}% social inclusion programme coverage — the home ensures the majority of children access targeted inclusion programmes that address barriers to participation.`,
    );
  } else if (socialInclusionRate >= 40 && si90d.length > 0) {
    strengths.push(
      `${socialInclusionRate}% of children participate in social inclusion programmes — the home is working to address social barriers for a significant number of children.`,
    );
  }

  if (si90d.length > 0 && siEngagementRate >= 90) {
    strengths.push(
      `${siEngagementRate}% child engagement in inclusion programmes — children are actively participating in and benefiting from social inclusion initiatives.`,
    );
  }

  if (siBarriersIdentified > 0 && siBarrierAddressedRate >= 80) {
    strengths.push(
      `${siBarrierAddressedRate}% of identified inclusion barriers addressed — the home actively removes obstacles to children's social participation.`,
    );
  }

  if (si90d.length > 0 && siOutcomesRate >= 80) {
    strengths.push(
      `${siOutcomesRate}% of inclusion programmes achieve documented outcomes — social inclusion work is producing measurable positive results for children.`,
    );
  }

  // Neighbourhood strengths
  if (nr90d.length > 0 && neighbourhoodRelationRate >= 80) {
    strengths.push(
      `${neighbourhoodRelationRate}% positive neighbourhood interactions — the home maintains excellent relations with the local community, supporting children's sense of belonging.`,
    );
  } else if (nr90d.length > 0 && neighbourhoodRelationRate >= 60) {
    strengths.push(
      `${neighbourhoodRelationRate}% positive neighbourhood outcomes — the home generally maintains good community relations.`,
    );
  }

  if (nrComplaints > 0 && nrComplaintResolutionRate >= 90) {
    strengths.push(
      `${nrComplaintResolutionRate}% neighbourhood complaint resolution — the home responds effectively to community concerns, maintaining positive relationships.`,
    );
  }

  if (nrPositiveFeedback >= 3) {
    strengths.push(
      `${nrPositiveFeedback} instances of positive feedback from neighbours in 90 days — the home is viewed positively by the local community.`,
    );
  }

  if (nrJointActivities >= 2) {
    strengths.push(
      `${nrJointActivities} joint activities with neighbours in 90 days — the home actively builds community connections through shared activities.`,
    );
  }

  // Local service strengths
  if (localServiceRate >= 80 && ls90d.length > 0) {
    strengths.push(
      `${localServiceRate}% of children accessing local services — children are well connected to the services and support available in their community.`,
    );
  } else if (localServiceRate >= 50 && ls90d.length > 0) {
    strengths.push(
      `${localServiceRate}% local service engagement — a good proportion of children are connected to relevant local services.`,
    );
  }

  if (ls90d.length > 0 && lsQualityRate >= 80) {
    strengths.push(
      `${lsQualityRate}% of local service engagements rated good or excellent — the home has strong, productive relationships with local services.`,
    );
  }

  if (ls90d.length > 0 && lsRelationshipRate >= 80) {
    strengths.push(
      `${lsRelationshipRate}% established relationships with local services — the home has built a strong network of local support for children.`,
    );
  }

  if (lsUniqueTypes.size >= 5) {
    strengths.push(
      `Engaged with ${lsUniqueTypes.size} different types of local services — children benefit from a comprehensive network of community support.`,
    );
  }

  // Cross-domain strengths
  if (childSatisfactionRate >= 90 && satisfactionSources.length >= 3) {
    strengths.push(
      `${childSatisfactionRate}% overall child satisfaction across community engagement domains — children consistently report positive experiences in their community interactions.`,
    );
  } else if (childSatisfactionRate >= 70 && satisfactionSources.length >= 2) {
    strengths.push(
      `${childSatisfactionRate}% overall child satisfaction — most children report positive community experiences across multiple domains.`,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ═══════════════════════════════════════════════════════════════════════

  const concerns: string[] = [];

  // Community activity concerns
  if (communityParticipationRate < 30 && ca90d.length > 0) {
    concerns.push(
      `Only ${communityParticipationRate}% community participation rate — the majority of children are not accessing community activities, risking social isolation and limited experiences beyond the home.`,
    );
  } else if (communityParticipationRate < 60 && communityParticipationRate >= 30 && ca90d.length > 0) {
    concerns.push(
      `Community participation at ${communityParticipationRate}% — a significant number of children are not regularly engaged in community activities.`,
    );
  }

  if (ca90d.length === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No community activity records in the past 90 days despite children being on placement — children may not be accessing community activities and social opportunities.",
    );
  }

  if (caAttended > 0 && caEnjoymentRate < 50) {
    concerns.push(
      `Only ${caEnjoymentRate}% of children report enjoying community activities — activities may not be well matched to children's interests and preferences.`,
    );
  }

  if (caAttended > 0 && caFriendshipRate < 30) {
    concerns.push(
      `Only ${caFriendshipRate}% of activities build friendships — community engagement is not translating into meaningful social connections for children.`,
    );
  }

  if (ca90d.length > 0 && caRiskAssessmentRate < 50) {
    concerns.push(
      `Only ${caRiskAssessmentRate}% of community activities have risk assessments completed — children may be attending activities without proper safeguarding measures.`,
    );
  }

  if (ca90d.length > 0 && caConsentRate < 50) {
    concerns.push(
      `Only ${caConsentRate}% of community activities have consent obtained — consent processes are not being followed consistently for community participation.`,
    );
  }

  // Volunteering concerns
  if (vol90d.length === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No volunteering records in the past 90 days — children are not being offered opportunities to volunteer and contribute to their community.",
    );
  }

  if (volunteeringRate < 10 && vol90d.length > 0) {
    concerns.push(
      `Only ${volunteeringRate}% volunteering participation — very few children have access to volunteering opportunities that develop skills and community connection.`,
    );
  }

  if (vol90d.length > 0 && volSafeguardingRate < 50) {
    concerns.push(
      `Only ${volSafeguardingRate}% of volunteering placements have safeguarding checks completed — children may be placed in voluntary roles without adequate safeguarding verification.`,
    );
  }

  if (vol90d.length > 0 && volRiskAssessmentRate < 50) {
    concerns.push(
      `Only ${volRiskAssessmentRate}% of volunteering placements have risk assessments — volunteering risks are not being formally assessed.`,
    );
  }

  // Social inclusion concerns
  if (si90d.length === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No social inclusion programme records in the past 90 days — the home is not evidencing targeted work to address social barriers and promote inclusion for children.",
    );
  }

  if (socialInclusionRate < 20 && si90d.length > 0) {
    concerns.push(
      `Only ${socialInclusionRate}% social inclusion coverage — very few children are accessing targeted inclusion programmes that could address barriers to community participation.`,
    );
  }

  if (si90d.length > 0 && siEngagementRate < 50) {
    concerns.push(
      `Only ${siEngagementRate}% child engagement in inclusion programmes — children are not actively participating in social inclusion initiatives.`,
    );
  }

  if (siBarriersIdentified > 0 && siBarrierAddressedRate < 40) {
    concerns.push(
      `Only ${siBarrierAddressedRate}% of identified inclusion barriers addressed — known obstacles to children's social participation are not being resolved.`,
    );
  }

  if (siReviewDue > 0) {
    concerns.push(
      `${siReviewDue} social inclusion programme${siReviewDue !== 1 ? "s" : ""} overdue for review — programme effectiveness cannot be evidenced without timely review.`,
    );
  }

  // Neighbourhood concerns
  if (nr90d.length === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No neighbourhood relation records in the past 90 days — the home is not evidencing active management of community relationships.",
    );
  }

  if (nr90d.length > 0 && neighbourhoodRelationRate < 40) {
    concerns.push(
      `Only ${neighbourhoodRelationRate}% positive neighbourhood interactions — the home has poor relations with the local community, which may affect children's sense of belonging and safety.`,
    );
  }

  if (nrComplaints > 0 && nrComplaintResolutionRate < 50) {
    concerns.push(
      `Only ${nrComplaintResolutionRate}% of neighbourhood complaints resolved — unresolved complaints may escalate and damage the home's community standing.`,
    );
  }

  if (nrFollowUpNeeded > 0 && nrFollowUpRate < 50) {
    concerns.push(
      `Only ${nrFollowUpRate}% of neighbourhood follow-up actions completed — identified actions to maintain community relations are not being followed through.`,
    );
  }

  if (nrComplaintCount >= 3) {
    concerns.push(
      `${nrComplaintCount} neighbourhood complaints received in 90 days — a pattern of complaints suggests systemic issues with community relations that require management attention.`,
    );
  }

  // Local service concerns
  if (ls90d.length === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No local service engagement records in the past 90 days — children may not be connected to the community services they need.",
    );
  }

  if (localServiceRate < 30 && ls90d.length > 0) {
    concerns.push(
      `Only ${localServiceRate}% of children accessing local services — the majority of children are not connected to relevant community services.`,
    );
  }

  if (ls90d.length > 0 && lsQualityRate < 40) {
    concerns.push(
      `Only ${lsQualityRate}% of local service engagements rated good or excellent — the quality of service relationships requires improvement.`,
    );
  }

  if (ls90d.length > 0 && lsResponsivenessRate < 50) {
    concerns.push(
      `Only ${lsResponsivenessRate}% of local services rated as responsive — services are not meeting children's needs in a timely manner.`,
    );
  }

  // Child satisfaction concerns
  if (childSatisfactionRate < 40 && satisfactionSources.length > 0) {
    concerns.push(
      `Overall child satisfaction with community engagement at only ${childSatisfactionRate}% — children do not feel positive about their community experiences, suggesting activities are not meeting their needs.`,
    );
  } else if (childSatisfactionRate < 60 && childSatisfactionRate >= 40 && satisfactionSources.length > 0) {
    concerns.push(
      `Child satisfaction at ${childSatisfactionRate}% — a significant proportion of children are not reporting positive community experiences.`,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════════════════

  const recommendations: CommunityIntegrationRecommendation[] = [];
  let rank = 0;

  if (communityParticipationRate < 30 && ca90d.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently expand community activity access for all children — assess each child's interests and preferences, then create an individualised community participation plan with regular activities that match their needs.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  if (ca90d.length === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately establish a programme of community activities for children — identify local clubs, groups, and activities appropriate to children's ages, interests, and needs, and begin recording attendance and outcomes.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  if (ca90d.length > 0 && caRiskAssessmentRate < 50) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all community activities have completed risk assessments before children attend — this is a safeguarding requirement that must be consistently applied.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  if (vol90d.length === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop volunteering opportunities for children — research local organisations that offer age-appropriate voluntary roles and create a volunteering menu that children can choose from.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging parents and others",
    });
  }

  if (vol90d.length > 0 && volSafeguardingRate < 50) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all volunteering placements have safeguarding checks completed — verify that organisations have appropriate safeguarding policies and that children are supervised appropriately.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  if (si90d.length === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Identify and address social inclusion needs for all children — assess barriers to community participation and implement targeted inclusion programmes such as peer mentoring, buddy schemes, or specialist support groups.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  if (siBarriersIdentified > 0 && siBarrierAddressedRate < 40) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address identified inclusion barriers — known obstacles preventing children from participating in community life must be actively resolved to promote social integration.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  if (nr90d.length > 0 && neighbourhoodRelationRate < 40) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop a neighbourhood engagement strategy — proactively build positive relationships with neighbours through regular communication, joint activities, and prompt resolution of any concerns.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging parents and others",
    });
  }

  if (nrComplaints > 0 && nrComplaintResolutionRate < 50) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a formal neighbourhood complaint resolution process — all complaints must be acknowledged, investigated, and resolved promptly to maintain community standing.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging parents and others",
    });
  }

  if (ls90d.length === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Map and engage with local services relevant to children's needs — establish relationships with GPs, dentists, libraries, leisure centres, youth services, and other community resources.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging parents and others",
    });
  }

  if (localServiceRate < 30 && ls90d.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase children's access to local services — review each child's needs and ensure they are connected to relevant community services that support their health, education, and social development.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  if (childSatisfactionRate < 40 && satisfactionSources.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Consult children individually about their community experiences and preferences — low satisfaction indicates engagement is not meeting children's needs and must be redesigned with their input.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (caAttended > 0 && caFriendshipRate < 30) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Focus community activity selection on opportunities that build lasting friendships — prioritise regular group activities where children can form bonds with peers from outside the home.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  if (communityParticipationRate >= 30 && communityParticipationRate < 60 && ca90d.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Expand community participation to reach at least 60% of children — identify barriers preventing non-participating children from accessing activities and create individual solutions.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  if (vol90d.length > 0 && volunteeringRate < 30 && volunteeringRate >= 10) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Broaden volunteering access — explore additional organisations and roles that match children's interests to increase participation beyond the current cohort.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging parents and others",
    });
  }

  if (si90d.length > 0 && socialInclusionRate < 40 && socialInclusionRate >= 20) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend social inclusion programme coverage — assess all children for inclusion needs and ensure targeted support is available for those facing social barriers.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  if (ls90d.length > 0 && lsQualityRate < 40) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve the quality of local service engagement — review relationships with services rated as adequate or poor and develop action plans to strengthen partnerships.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging parents and others",
    });
  }

  if (nr90d.length === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin recording neighbourhood interactions — document community meetings, neighbour visits, feedback received, and joint activities to evidence positive community relations.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging parents and others",
    });
  }

  if (siReviewDue > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Review ${siReviewDue} overdue social inclusion programme${siReviewDue !== 1 ? "s" : ""} — assess effectiveness and update approaches based on children's current needs and progress.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 11 — Positive relationships",
    });
  }

  if (caAttended > 0 && caOutcomesRate < 50) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve outcome documentation for community activities — record what children gain from each activity to evidence the impact of community participation on their development.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ═══════════════════════════════════════════════════════════════════════

  const insights: CommunityIntegrationInsight[] = [];

  // -- Critical insights --

  if (communityParticipationRate < 30 && ca90d.length > 0) {
    insights.push({
      text: `Only ${communityParticipationRate}% community participation. Ofsted expects children in residential care to have meaningful, regular access to community activities that promote socialisation, skill development, and a sense of belonging. Low participation suggests children may be socially isolated.`,
      severity: "critical",
    });
  }

  if (ca90d.length === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No community activity records exist in the past 90 days despite children being on placement. Without community activities, children cannot develop the social skills, friendships, and community connections essential for their development and eventual independence.",
      severity: "critical",
    });
  }

  if (neighbourhoodRelationRate < 40 && nr90d.length > 0) {
    insights.push({
      text: `Only ${neighbourhoodRelationRate}% positive neighbourhood interactions. Poor community relations can lead to stigmatisation of looked-after children, complaints to Ofsted, and an environment where children feel unwelcome in their own neighbourhood. This undermines Reg 11 compliance.`,
      severity: "critical",
    });
  }

  if (childSatisfactionRate < 40 && satisfactionSources.length > 0) {
    insights.push({
      text: `Overall child satisfaction with community engagement at only ${childSatisfactionRate}%. When children do not enjoy or value their community experiences, this signals that engagement is tokenistic rather than genuinely meaningful. Children's views must shape community integration planning.`,
      severity: "critical",
    });
  }

  if (vol90d.length > 0 && volSafeguardingRate < 30) {
    insights.push({
      text: `Only ${volSafeguardingRate}% of volunteering placements have safeguarding checks. Children in care are placed in voluntary roles with organisations that may not have been vetted. This is a significant safeguarding risk that requires immediate attention.`,
      severity: "critical",
    });
  }

  if (vol90d.length === 0 && si90d.length === 0 && ca90d.length === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No community activities, volunteering, or social inclusion records exist. The home cannot evidence any community integration activity for children. Ofsted will view this as a failure to promote positive relationships and social development under Reg 5 and Reg 11.",
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (communityParticipationRate >= 30 && communityParticipationRate < 60 && ca90d.length > 0) {
    insights.push({
      text: `Community participation at ${communityParticipationRate}% — improving but still below the level expected for good practice. Some children remain disengaged from community life. Review individual barriers and create targeted participation plans.`,
      severity: "warning",
    });
  }

  if (volunteeringRate < 30 && volunteeringRate >= 10 && vol90d.length > 0) {
    insights.push({
      text: `Volunteering engagement at ${volunteeringRate}% — while some children are accessing volunteering, the majority are not. Volunteering builds self-esteem, skills, and community connections that are particularly valuable for looked-after children.`,
      severity: "warning",
    });
  }

  if (socialInclusionRate < 40 && socialInclusionRate >= 20 && si90d.length > 0) {
    insights.push({
      text: `Social inclusion coverage at ${socialInclusionRate}% — targeted inclusion work is reaching only a minority of children. Many looked-after children face social barriers that require proactive support to overcome.`,
      severity: "warning",
    });
  }

  if (nr90d.length > 0 && neighbourhoodRelationRate >= 40 && neighbourhoodRelationRate < 60) {
    insights.push({
      text: `Neighbourhood relation quality at ${neighbourhoodRelationRate}% — some interactions are negative. Community perception of the home affects children's daily experiences and sense of acceptance in their local area.`,
      severity: "warning",
    });
  }

  if (ls90d.length > 0 && lsQualityRate >= 40 && lsQualityRate < 60) {
    insights.push({
      text: `Local service engagement quality at ${lsQualityRate}% — relationships with some services are only adequate or poor. Strong service partnerships are essential for meeting children's complex needs.`,
      severity: "warning",
    });
  }

  if (childSatisfactionRate >= 40 && childSatisfactionRate < 60 && satisfactionSources.length > 0) {
    insights.push({
      text: `Child satisfaction at ${childSatisfactionRate}% — a notable proportion of children do not feel positive about their community experiences. Community engagement should be enjoyable and meaningful, not obligatory.`,
      severity: "warning",
    });
  }

  if (caAttended > 0 && caFriendshipRate >= 30 && caFriendshipRate < 50) {
    insights.push({
      text: `Only ${caFriendshipRate}% of activities build friendships — while children are attending community activities, many are not translating into lasting social bonds. Consider whether activities offer enough regular contact for relationships to develop.`,
      severity: "warning",
    });
  }

  if (si90d.length > 0 && siBarriersIdentified > 0 && siBarrierAddressedRate >= 40 && siBarrierAddressedRate < 60) {
    insights.push({
      text: `Barrier resolution rate at ${siBarrierAddressedRate}% — some identified obstacles to children's social participation remain unresolved. Persistent barriers can entrench exclusion and limit children's progress.`,
      severity: "warning",
    });
  }

  if (vol90d.length > 0 && volEnjoymentRate >= 50 && volEnjoymentRate < 70) {
    insights.push({
      text: `Volunteering enjoyment at ${volEnjoymentRate}% — some children are not finding their voluntary roles enjoyable. Ensuring children are matched to roles that align with their interests is essential for sustained engagement.`,
      severity: "warning",
    });
  }

  if (ls90d.length > 0 && lsResponsivenessRate >= 50 && lsResponsivenessRate < 70) {
    insights.push({
      text: `Service responsiveness at ${lsResponsivenessRate}% — some local services are slow to respond to children's needs. The home should advocate more strongly for timely service delivery.`,
      severity: "warning",
    });
  }

  if (nrComplaintCount >= 2 && nrComplaintCount < 3) {
    insights.push({
      text: `${nrComplaintCount} neighbourhood complaints received in 90 days — while not yet a pattern, multiple complaints warrant proactive engagement with neighbours to prevent escalation.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (community_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding community integration and volunteering practice — children are actively engaged in diverse community activities, volunteering opportunities exist, social inclusion is promoted, neighbourhood relations are positive, and local services are well utilised. This is strong evidence of Reg 5 and Reg 11 compliance.",
      severity: "positive",
    });
  }

  if (communityParticipationRate >= 80 && caEnjoymentRate >= 90 && caAttended > 0) {
    insights.push({
      text: `${communityParticipationRate}% community participation with ${caEnjoymentRate}% enjoyment — the overwhelming majority of children are actively and happily engaged in community life. This demonstrates that the home is genuinely promoting social integration.`,
      severity: "positive",
    });
  }

  if (volunteeringRate >= 60 && volOngoingRate >= 60 && vol90d.length > 0) {
    insights.push({
      text: `${volunteeringRate}% volunteering participation with ${volOngoingRate}% sustaining ongoing commitments — children are developing a sense of civic responsibility and building skills through sustained voluntary contributions.`,
      severity: "positive",
    });
  }

  if (vol90d.length > 0 && volChildInitiatedRate >= 60 && volSkillsRate >= 80) {
    insights.push({
      text: `${volChildInitiatedRate}% child-initiated volunteering with ${volSkillsRate}% skill development — children are self-motivated to give back and are gaining tangible personal development benefits, demonstrating excellent promotion of independence and agency.`,
      severity: "positive",
    });
  }

  if (socialInclusionRate >= 70 && siEngagementRate >= 90 && si90d.length > 0) {
    insights.push({
      text: `${socialInclusionRate}% social inclusion coverage with ${siEngagementRate}% child engagement — the home effectively identifies and addresses barriers to social participation, ensuring children can fully integrate into community life.`,
      severity: "positive",
    });
  }

  if (siBarriersIdentified > 0 && siBarrierAddressedRate >= 80 && siOutcomesRate >= 80) {
    insights.push({
      text: `${siBarrierAddressedRate}% barrier resolution with ${siOutcomesRate}% documented outcomes — the home proactively removes obstacles to children's social participation and can evidence the positive impact of inclusion work.`,
      severity: "positive",
    });
  }

  if (neighbourhoodRelationRate >= 80 && nr90d.length > 0) {
    insights.push({
      text: `${neighbourhoodRelationRate}% positive neighbourhood interactions — the home maintains excellent community relations. Positive neighbourhood perceptions help children feel welcome, safe, and accepted in their local area.`,
      severity: "positive",
    });
  }

  if (nrPositiveFeedback >= 3 && nrJointActivities >= 2) {
    insights.push({
      text: `${nrPositiveFeedback} positive feedback instances and ${nrJointActivities} joint activities with neighbours — the home is viewed as a positive presence in the community. This proactive relationship-building creates a supportive environment for children.`,
      severity: "positive",
    });
  }

  if (localServiceRate >= 80 && lsQualityRate >= 80 && ls90d.length > 0) {
    insights.push({
      text: `${localServiceRate}% local service access with ${lsQualityRate}% quality engagement — children are well connected to a strong network of community services. This comprehensive support promotes their health, education, and social development.`,
      severity: "positive",
    });
  }

  if (ls90d.length > 0 && lsRelationshipRate >= 80 && lsRegularRate >= 70) {
    insights.push({
      text: `${lsRelationshipRate}% established service relationships with ${lsRegularRate}% regular contact — the home has built durable partnerships with local services that provide consistent, reliable support for children.`,
      severity: "positive",
    });
  }

  if (childSatisfactionRate >= 90 && satisfactionSources.length >= 3) {
    insights.push({
      text: `${childSatisfactionRate}% child satisfaction across ${satisfactionSources.length} community engagement domains — children consistently report positive, meaningful experiences in their community interactions. Their voices demonstrate genuine, child-centred community integration.`,
      severity: "positive",
    });
  }

  if (caTypeVariety >= 5 && volUniqueTypes.size >= 3 && lsUniqueTypes.size >= 4) {
    insights.push({
      text: `Exceptional breadth of community engagement — ${caTypeVariety} activity types, ${volUniqueTypes.size} volunteering types, and ${lsUniqueTypes.size} local service types. Children benefit from rich, diverse community connections that prepare them for independent adult life.`,
      severity: "positive",
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // HEADLINE
  // ═══════════════════════════════════════════════════════════════════════

  let headline: string;

  if (community_rating === "outstanding") {
    headline =
      "Outstanding community integration and volunteering — children are well connected to their communities through diverse activities, volunteering, inclusion programmes, positive neighbourhood relations, and strong local service engagement.";
  } else if (community_rating === "good") {
    headline = `Good community integration and volunteering — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (community_rating === "adequate") {
    headline = `Adequate community integration — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children are meaningfully integrated into their communities.`;
  } else {
    headline = `Community integration and volunteering is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children are supported to engage with their communities.`;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════════════════

  return {
    community_rating,
    community_score: score,
    headline,
    total_community_activities: totalCommunityActivities,
    total_volunteering_records: totalVolunteeringRecords,
    total_social_inclusion_records: totalSocialInclusionRecords,
    total_neighbourhood_records: totalNeighbourhoodRecords,
    total_local_service_records: totalLocalServiceRecords,
    community_participation_rate: communityParticipationRate,
    volunteering_rate: volunteeringRate,
    social_inclusion_rate: socialInclusionRate,
    neighbourhood_relation_rate: neighbourhoodRelationRate,
    local_service_rate: localServiceRate,
    child_satisfaction_rate: childSatisfactionRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
