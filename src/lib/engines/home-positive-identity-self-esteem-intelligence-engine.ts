// ==============================================================================
// CARA -- HOME POSITIVE IDENTITY & SELF-ESTEEM INTELLIGENCE ENGINE
// Tracks identity and self-esteem development -- identity exploration work,
// life story engagement, self-esteem programme participation, achievement
// celebration, and positive self-image development.
// Pure deterministic engine -- no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Quality of care), Reg 7 (Children's views), Reg 11
// (Positive relationships), SCCIF "Experiences and progress of children".
// Store keys: identityWorkRecords, lifeStoryRecords,
//             selfEsteemProgrammeRecords, achievementRecords,
//             positiveImageRecords
// ==============================================================================

import { meets, below } from "@/lib/metrics/rate";

// -- Input Types --------------------------------------------------------------

export interface IdentityWorkRecordInput {
  id: string;
  child_id: string;
  work_type:
    | "identity_exploration"
    | "cultural_heritage"
    | "family_history"
    | "personal_narrative"
    | "values_exploration"
    | "gender_identity"
    | "ethnic_identity"
    | "sense_of_belonging"
    | "other";
  date: string;
  completed: boolean;
  staff_facilitated: boolean;
  child_engaged: boolean;
  child_led: boolean;
  therapeutic_support: boolean;
  outcomes_documented: boolean;
  child_satisfaction: number; // 1-5
  follow_up_planned: boolean;
  notes: string;
  created_at: string;
}

export interface LifeStoryRecordInput {
  id: string;
  child_id: string;
  has_life_story_book: boolean;
  life_story_work_active: boolean;
  last_session_date: string | null;
  sessions_planned: number;
  sessions_completed: number;
  child_engaged: boolean;
  child_led: boolean;
  staff_trained: boolean;
  therapeutic_input: boolean;
  age_appropriate: boolean;
  materials_provided: boolean;
  child_satisfaction: number; // 1-5
  social_worker_involved: boolean;
  review_date: string | null;
  created_at: string;
}

export interface SelfEsteemProgrammeRecordInput {
  id: string;
  child_id: string;
  programme_name: string;
  programme_type:
    | "structured_programme"
    | "one_to_one"
    | "group_work"
    | "therapeutic"
    | "mentoring"
    | "peer_support"
    | "activity_based"
    | "other";
  date: string;
  sessions_planned: number;
  sessions_attended: number;
  child_engaged: boolean;
  progress_documented: boolean;
  measurable_outcomes: boolean;
  child_satisfaction: number; // 1-5
  staff_trained: boolean;
  evidence_based: boolean;
  review_date: string | null;
  created_at: string;
}

export interface AchievementRecordInput {
  id: string;
  child_id: string;
  achievement_type:
    | "academic"
    | "sporting"
    | "creative"
    | "social"
    | "personal_growth"
    | "independence"
    | "community"
    | "vocational"
    | "other";
  date: string;
  achievement_description: string;
  celebrated: boolean;
  celebration_method: string;
  displayed: boolean;
  shared_with_family: boolean;
  shared_with_social_worker: boolean;
  child_proud: boolean;
  peers_acknowledged: boolean;
  recorded_in_care_plan: boolean;
  staff_initiated: boolean;
  created_at: string;
}

export interface PositiveImageRecordInput {
  id: string;
  child_id: string;
  activity_type:
    | "positive_affirmation"
    | "confidence_building"
    | "body_image"
    | "resilience_work"
    | "strengths_assessment"
    | "goal_setting"
    | "role_modelling"
    | "positive_feedback"
    | "self_advocacy"
    | "other";
  date: string;
  completed: boolean;
  child_engaged: boolean;
  child_led: boolean;
  measurable_improvement: boolean;
  child_satisfaction: number; // 1-5
  staff_facilitated: boolean;
  follow_up_planned: boolean;
  outcomes_documented: boolean;
  created_at: string;
}

export interface PositiveIdentityInput {
  today: string;
  total_children: number;
  identity_work_records: IdentityWorkRecordInput[];
  life_story_records: LifeStoryRecordInput[];
  self_esteem_programme_records: SelfEsteemProgrammeRecordInput[];
  achievement_records: AchievementRecordInput[];
  positive_image_records: PositiveImageRecordInput[];
}

// -- Output Types -------------------------------------------------------------

export type PositiveIdentityRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface PositiveIdentityInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface PositiveIdentityRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface PositiveIdentityResult {
  identity_rating: PositiveIdentityRating;
  identity_score: number;
  headline: string;
  identity_work_rate: number;
  // fab-0: null when no records for the domain.
  life_story_engagement_rate: number | null;
  self_esteem_programme_rate: number | null;
  achievement_celebration_rate: number;
  positive_image_rate: number | null;
  child_confidence_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: PositiveIdentityRecommendation[];
  insights: PositiveIdentityInsight[];
}

// -- Helpers ------------------------------------------------------------------

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): PositiveIdentityRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// -- Empty Result Factory -----------------------------------------------------

function emptyResult(
  rating: PositiveIdentityRating,
  score: number,
  headline: string,
): PositiveIdentityResult {
  return {
    identity_rating: rating,
    identity_score: score,
    headline,
    identity_work_rate: 0,
    life_story_engagement_rate: null,
    self_esteem_programme_rate: null,
    achievement_celebration_rate: 0,
    positive_image_rate: null,
    child_confidence_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// -- Main Compute -------------------------------------------------------------

export function computePositiveIdentitySelfEsteem(
  input: PositiveIdentityInput,
): PositiveIdentityResult {
  const {
    total_children,
    identity_work_records,
    life_story_records,
    self_esteem_programme_records,
    achievement_records,
    positive_image_records,
  } = input;

  // -- Special case: all empty + 0 children -> insufficient_data ------------
  const allEmpty =
    identity_work_records.length === 0 &&
    life_story_records.length === 0 &&
    self_esteem_programme_records.length === 0 &&
    achievement_records.length === 0 &&
    positive_image_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement -- insufficient data to assess positive identity and self-esteem.",
    );
  }

  // -- Special case: all empty + children > 0 -> inadequate -----------------
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No positive identity or self-esteem data recorded despite children on placement -- identity work, life story engagement, self-esteem programmes, achievement celebration, and positive self-image development require urgent attention.",
      ),
      concerns: [
        "No identity work, life story, self-esteem programme, achievement, or positive image records exist despite children being on placement -- the home cannot evidence support for children's identity development and self-esteem.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of identity exploration work, life story engagement, self-esteem programme participation, achievement celebration, and positive self-image activities to evidence the home's commitment to nurturing children's identity and self-esteem.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
        },
        {
          rank: 2,
          recommendation:
            "Assess every child's identity development and self-esteem needs and ensure these are reflected in their care plan with documented support arrangements and regular reviews.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 7 -- Children's views",
        },
      ],
      insights: [
        {
          text: "The complete absence of positive identity and self-esteem records means Ofsted cannot verify that children's identity development is understood, supported, or celebrated. This represents a fundamental gap in Reg 5 compliance and the home's duty to help every child develop a positive sense of self.",
          severity: "critical",
        },
      ],
    };
  }

  // -- Compute core metrics -------------------------------------------------

  // --- Identity work rate ---
  const totalIdentityRecords = identity_work_records.length;
  const completedIdentityWork = identity_work_records.filter((r) => r.completed).length;
  const identityWorkRate = pct(completedIdentityWork, totalIdentityRecords);

  const identityChildEngaged = identity_work_records.filter((r) => r.child_engaged).length;
  const identityEngagementRate = pct(identityChildEngaged, totalIdentityRecords);

  const identityChildLed = identity_work_records.filter((r) => r.child_led).length;
  const identityChildLedRate = pct(identityChildLed, totalIdentityRecords);

  const identityTherapeutic = identity_work_records.filter((r) => r.therapeutic_support).length;
  const identityTherapeuticRate = pct(identityTherapeutic, totalIdentityRecords);

  const identityOutcomesDocumented = identity_work_records.filter((r) => r.outcomes_documented).length;
  const identityOutcomesRate = pct(identityOutcomesDocumented, totalIdentityRecords);

  const identitySatisfactionSum = identity_work_records.reduce(
    (sum, r) => sum + r.child_satisfaction, 0,
  );
  // fab-0: null when no records.
  const identitySatisfactionAvg: number | null =
    totalIdentityRecords > 0
      ? Math.round((identitySatisfactionSum / totalIdentityRecords) * 100) / 100
      : null;

  // --- Life story engagement rate ---
  const totalLifeStoryRecords = life_story_records.length;
  const withLifeStoryBook = life_story_records.filter((r) => r.has_life_story_book).length;
  const lifeStoryBookRate = pct(withLifeStoryBook, totalLifeStoryRecords);

  const lifeStoryActive = life_story_records.filter((r) => r.life_story_work_active).length;
  const lifeStoryActiveRate = pct(lifeStoryActive, totalLifeStoryRecords);

  const totalLifeStorySessions = life_story_records.reduce(
    (sum, r) => sum + r.sessions_planned, 0,
  );
  const completedLifeStorySessions = life_story_records.reduce(
    (sum, r) => sum + r.sessions_completed, 0,
  );
  const lifeStorySessionRate = pct(completedLifeStorySessions, totalLifeStorySessions);

  const lifeStoryChildEngaged = life_story_records.filter((r) => r.child_engaged).length;
  const lifeStoryEngagementRateRaw = pct(lifeStoryChildEngaged, totalLifeStoryRecords);

  const lifeStoryStaffTrained = life_story_records.filter((r) => r.staff_trained).length;
  const lifeStoryStaffTrainingRate = pct(lifeStoryStaffTrained, totalLifeStoryRecords);

  const lifeStorySatisfactionSum = life_story_records.reduce(
    (sum, r) => sum + r.child_satisfaction, 0,
  );
  // fab-0: null when no records.
  const lifeStorySatisfactionAvg: number | null =
    totalLifeStoryRecords > 0
      ? Math.round((lifeStorySatisfactionSum / totalLifeStoryRecords) * 100) / 100
      : null;

  // Composite life story engagement rate
  // fab-0: null when no records.
  const lifeStoryEngagementRate: number | null =
    totalLifeStoryRecords > 0
      ? Math.round((lifeStoryBookRate + lifeStoryActiveRate + lifeStorySessionRate + lifeStoryEngagementRateRaw) / 4)
      : null;

  // --- Self-esteem programme rate ---
  const totalSelfEsteemRecords = self_esteem_programme_records.length;
  const totalSelfEsteemSessions = self_esteem_programme_records.reduce(
    (sum, r) => sum + r.sessions_planned, 0,
  );
  const attendedSelfEsteemSessions = self_esteem_programme_records.reduce(
    (sum, r) => sum + r.sessions_attended, 0,
  );
  const selfEsteemAttendanceRate = pct(attendedSelfEsteemSessions, totalSelfEsteemSessions);

  const selfEsteemEngaged = self_esteem_programme_records.filter((r) => r.child_engaged).length;
  const selfEsteemEngagementRate = pct(selfEsteemEngaged, totalSelfEsteemRecords);

  const selfEsteemProgressDocumented = self_esteem_programme_records.filter((r) => r.progress_documented).length;
  const selfEsteemProgressRate = pct(selfEsteemProgressDocumented, totalSelfEsteemRecords);

  const selfEsteemMeasurable = self_esteem_programme_records.filter((r) => r.measurable_outcomes).length;
  const selfEsteemMeasurableRate = pct(selfEsteemMeasurable, totalSelfEsteemRecords);

  const selfEsteemEvidenceBased = self_esteem_programme_records.filter((r) => r.evidence_based).length;
  const selfEsteemEvidenceBasedRate = pct(selfEsteemEvidenceBased, totalSelfEsteemRecords);

  const selfEsteemSatisfactionSum = self_esteem_programme_records.reduce(
    (sum, r) => sum + r.child_satisfaction, 0,
  );
  // fab-0: null when no records.
  const selfEsteemSatisfactionAvg: number | null =
    totalSelfEsteemRecords > 0
      ? Math.round((selfEsteemSatisfactionSum / totalSelfEsteemRecords) * 100) / 100
      : null;

  // Composite self-esteem programme rate
  // fab-0: null when no records.
  const selfEsteemProgrammeRate: number | null =
    totalSelfEsteemRecords > 0
      ? Math.round((selfEsteemAttendanceRate + selfEsteemEngagementRate + selfEsteemProgressRate) / 3)
      : null;

  // --- Achievement celebration rate ---
  const totalAchievementRecords = achievement_records.length;
  const celebratedAchievements = achievement_records.filter((r) => r.celebrated).length;
  const achievementCelebrationRate = pct(celebratedAchievements, totalAchievementRecords);

  const displayedAchievements = achievement_records.filter((r) => r.displayed).length;
  const achievementDisplayRate = pct(displayedAchievements, totalAchievementRecords);

  const sharedWithFamily = achievement_records.filter((r) => r.shared_with_family).length;
  const achievementFamilyShareRate = pct(sharedWithFamily, totalAchievementRecords);

  const childProud = achievement_records.filter((r) => r.child_proud).length;
  const childPrideRate = pct(childProud, totalAchievementRecords);

  const peersAcknowledged = achievement_records.filter((r) => r.peers_acknowledged).length;
  const peerAcknowledgementRate = pct(peersAcknowledged, totalAchievementRecords);

  const recordedInCarePlan = achievement_records.filter((r) => r.recorded_in_care_plan).length;
  const achievementCarePlanRate = pct(recordedInCarePlan, totalAchievementRecords);

  const uniqueAchievementTypes = new Set(
    achievement_records.map((r) => r.achievement_type),
  ).size;

  // --- Positive image rate ---
  const totalPositiveImageRecords = positive_image_records.length;
  const completedPositiveImage = positive_image_records.filter((r) => r.completed).length;
  const positiveImageCompletionRate = pct(completedPositiveImage, totalPositiveImageRecords);

  const positiveImageEngaged = positive_image_records.filter((r) => r.child_engaged).length;
  const positiveImageEngagementRate = pct(positiveImageEngaged, totalPositiveImageRecords);

  const positiveImageChildLed = positive_image_records.filter((r) => r.child_led).length;
  const positiveImageChildLedRate = pct(positiveImageChildLed, totalPositiveImageRecords);

  const positiveImageImprovement = positive_image_records.filter((r) => r.measurable_improvement).length;
  const positiveImageImprovementRate = pct(positiveImageImprovement, totalPositiveImageRecords);

  // Composite positive image rate
  // fab-0: null when no records.
  const positiveImageRate: number | null =
    totalPositiveImageRecords > 0
      ? Math.round((positiveImageCompletionRate + positiveImageEngagementRate + positiveImageImprovementRate) / 3)
      : null;

  // --- Child confidence composite rate ---
  // Measures overall child confidence/engagement across all domains
  const confidenceNumerator =
    identityChildEngaged +
    lifeStoryChildEngaged +
    selfEsteemEngaged +
    childProud +
    positiveImageEngaged;
  const confidenceDenominator =
    totalIdentityRecords +
    totalLifeStoryRecords +
    totalSelfEsteemRecords +
    totalAchievementRecords +
    totalPositiveImageRecords;
  const childConfidenceRate = pct(confidenceNumerator, confidenceDenominator);

  // -- Scoring: base 52 ----------------------------------------------------

  let score = 52;

  // --- Bonus 1: identityWorkRate (>=90: +4, >=70: +2) ---
  if (identityWorkRate >= 90) score += 4;
  else if (identityWorkRate >= 70) score += 2;

  // --- Bonus 2: lifeStoryEngagementRate (>=80: +3, >=60: +1) ---
  if (meets(lifeStoryEngagementRate, 80)) score += 3;
  else if (meets(lifeStoryEngagementRate, 60)) score += 1;

  // --- Bonus 3: selfEsteemProgrammeRate (>=80: +4, >=60: +2) ---
  if (meets(selfEsteemProgrammeRate, 80)) score += 4;
  else if (meets(selfEsteemProgrammeRate, 60)) score += 2;

  // --- Bonus 4: achievementCelebrationRate (>=90: +3, >=70: +1) ---
  if (achievementCelebrationRate >= 90) score += 3;
  else if (achievementCelebrationRate >= 70) score += 1;

  // --- Bonus 5: positiveImageRate (>=80: +3, >=60: +1) ---
  if (meets(positiveImageRate, 80)) score += 3;
  else if (meets(positiveImageRate, 60)) score += 1;

  // --- Bonus 6: childConfidenceRate (>=80: +3, >=60: +1) ---
  if (childConfidenceRate >= 80) score += 3;
  else if (childConfidenceRate >= 60) score += 1;

  // --- Bonus 7: achievementDisplayRate (>=90: +3, >=70: +1) ---
  if (achievementDisplayRate >= 90) score += 3;
  else if (achievementDisplayRate >= 70) score += 1;

  // --- Bonus 8: lifeStoryBookRate (>=90: +3, >=70: +1) ---
  if (lifeStoryBookRate >= 90) score += 3;
  else if (lifeStoryBookRate >= 70) score += 1;

  // --- Bonus 9: selfEsteemEvidenceBasedRate (>=80: +2, >=50: +1) ---
  if (selfEsteemEvidenceBasedRate >= 80) score += 2;
  else if (selfEsteemEvidenceBasedRate >= 50) score += 1;

  // -- Penalties (4 with guards) -------------------------------------------

  // identityWorkRate < 50 -> -5
  if (identityWorkRate < 50 && totalIdentityRecords > 0) score -= 5;

  // lifeStoryEngagementRate < 40 -> -5
  if (below(lifeStoryEngagementRate, 40) && totalLifeStoryRecords > 0) score -= 5;

  // achievementCelebrationRate < 50 -> -4
  if (achievementCelebrationRate < 50 && totalAchievementRecords > 0) score -= 4;

  // selfEsteemProgrammeRate < 40 -> -4
  if (below(selfEsteemProgrammeRate, 40) && totalSelfEsteemRecords > 0) score -= 4;

  score = clamp(score, 0, 100);

  const identity_rating = toRating(score);

  // -- Strengths ------------------------------------------------------------

  const strengths: string[] = [];

  if (identityWorkRate >= 90 && totalIdentityRecords > 0) {
    strengths.push(
      `${identityWorkRate}% of identity exploration work completed -- the home demonstrates exceptional commitment to helping children understand and develop their personal identity.`,
    );
  } else if (identityWorkRate >= 70 && totalIdentityRecords > 0) {
    strengths.push(
      `${identityWorkRate}% identity work completion rate -- children are actively supported in exploring their identity and sense of self.`,
    );
  }

  if (identityEngagementRate >= 80 && totalIdentityRecords > 0) {
    strengths.push(
      `Children engaged in ${identityEngagementRate}% of identity work sessions -- high levels of child participation demonstrate that identity exploration is meaningful and relevant to the children.`,
    );
  }

  if (identityChildLedRate >= 50 && totalIdentityRecords > 0) {
    strengths.push(
      `${identityChildLedRate}% of identity work is child-led -- children are empowered to direct their own identity exploration, reflecting outstanding child-centred practice.`,
    );
  }

  if (totalIdentityRecords > 0 && identitySatisfactionAvg !== null && identitySatisfactionAvg >= 4.0) {
    strengths.push(
      `Children's satisfaction with identity work averages ${identitySatisfactionAvg}/5 -- children feel the identity exploration is valuable and personally meaningful.`,
    );
  }

  if (identityTherapeuticRate >= 50 && totalIdentityRecords > 0) {
    strengths.push(
      `Therapeutic support integrated into ${identityTherapeuticRate}% of identity work -- the home recognises that identity exploration for looked-after children often requires specialist support.`,
    );
  }

  if (lifeStoryBookRate >= 90 && totalLifeStoryRecords > 0) {
    strengths.push(
      `${lifeStoryBookRate}% of children have a life story book -- the home ensures every child has a tangible record of their personal history and narrative.`,
    );
  } else if (lifeStoryBookRate >= 70 && totalLifeStoryRecords > 0) {
    strengths.push(
      `${lifeStoryBookRate}% of children have a life story book -- good provision of life story materials to support children's understanding of their history.`,
    );
  }

  if (totalLifeStoryRecords > 0 && meets(lifeStoryEngagementRate, 80)) {
    strengths.push(
      `Life story engagement rate at ${lifeStoryEngagementRate}% -- life story work is active, well-attended, and children are meaningfully engaged in exploring their personal narratives.`,
    );
  } else if (totalLifeStoryRecords > 0 && meets(lifeStoryEngagementRate, 60)) {
    strengths.push(
      `Life story engagement rate at ${lifeStoryEngagementRate}% -- good levels of participation in life story work supporting children's identity development.`,
    );
  }

  if (lifeStorySessionRate >= 80 && totalLifeStorySessions > 0) {
    strengths.push(
      `${lifeStorySessionRate}% of planned life story sessions completed -- consistent delivery ensures children make meaningful progress in understanding their personal history.`,
    );
  }

  if (lifeStoryStaffTrainingRate >= 80 && totalLifeStoryRecords > 0) {
    strengths.push(
      `Staff trained in life story work for ${lifeStoryStaffTrainingRate}% of cases -- the home invests in staff competency to deliver sensitive identity-related work.`,
    );
  }

  if (totalLifeStoryRecords > 0 && lifeStorySatisfactionAvg !== null && lifeStorySatisfactionAvg >= 4.0) {
    strengths.push(
      `Children's satisfaction with life story work averages ${lifeStorySatisfactionAvg}/5 -- children find the work meaningful, age-appropriate, and supportive.`,
    );
  }

  if (totalSelfEsteemRecords > 0 && meets(selfEsteemProgrammeRate, 80)) {
    strengths.push(
      `Self-esteem programme rate at ${selfEsteemProgrammeRate}% -- programmes are well attended, children are engaged, and progress is documented. The home delivers effective, structured self-esteem support.`,
    );
  } else if (totalSelfEsteemRecords > 0 && meets(selfEsteemProgrammeRate, 60)) {
    strengths.push(
      `Self-esteem programme rate at ${selfEsteemProgrammeRate}% -- good levels of engagement and attendance across self-esteem programmes.`,
    );
  }

  if (selfEsteemEvidenceBasedRate >= 80 && totalSelfEsteemRecords > 0) {
    strengths.push(
      `${selfEsteemEvidenceBasedRate}% of self-esteem programmes are evidence-based -- the home uses proven approaches to build children's confidence and resilience.`,
    );
  }

  if (selfEsteemMeasurableRate >= 70 && totalSelfEsteemRecords > 0) {
    strengths.push(
      `Measurable outcomes recorded for ${selfEsteemMeasurableRate}% of self-esteem programmes -- the home can evidence tangible improvements in children's self-esteem.`,
    );
  }

  if (totalSelfEsteemRecords > 0 && selfEsteemSatisfactionAvg !== null && selfEsteemSatisfactionAvg >= 4.0) {
    strengths.push(
      `Children's satisfaction with self-esteem programmes averages ${selfEsteemSatisfactionAvg}/5 -- children value and benefit from the self-esteem support provided.`,
    );
  }

  if (achievementCelebrationRate >= 90 && totalAchievementRecords > 0) {
    strengths.push(
      `${achievementCelebrationRate}% of achievements celebrated -- the home has an outstanding culture of recognising and celebrating children's successes, reinforcing positive self-image.`,
    );
  } else if (achievementCelebrationRate >= 70 && totalAchievementRecords > 0) {
    strengths.push(
      `${achievementCelebrationRate}% achievement celebration rate -- the home actively celebrates children's successes across multiple domains.`,
    );
  }

  if (achievementDisplayRate >= 80 && totalAchievementRecords > 0) {
    strengths.push(
      `${achievementDisplayRate}% of achievements displayed within the home -- visible celebration of success creates a positive, affirming environment for all children.`,
    );
  }

  if (achievementFamilyShareRate >= 70 && totalAchievementRecords > 0) {
    strengths.push(
      `Achievements shared with families in ${achievementFamilyShareRate}% of cases -- the home ensures families are involved in celebrating children's progress, strengthening family connections.`,
    );
  }

  if (childPrideRate >= 80 && totalAchievementRecords > 0) {
    strengths.push(
      `${childPrideRate}% of children express pride in their achievements -- children feel genuinely proud of their accomplishments, indicating healthy self-esteem development.`,
    );
  }

  if (peerAcknowledgementRate >= 70 && totalAchievementRecords > 0) {
    strengths.push(
      `Peers acknowledge achievements in ${peerAcknowledgementRate}% of cases -- a supportive peer culture that celebrates each other's successes builds collective self-esteem.`,
    );
  }

  if (uniqueAchievementTypes >= 5 && totalAchievementRecords > 0) {
    strengths.push(
      `Achievements recorded across ${uniqueAchievementTypes} different domains -- the home recognises and values children's successes in academic, sporting, creative, social, and personal growth areas.`,
    );
  }

  if (totalPositiveImageRecords > 0 && meets(positiveImageRate, 80)) {
    strengths.push(
      `Positive self-image rate at ${positiveImageRate}% -- the home delivers effective activities that build children's confidence, resilience, and positive self-perception.`,
    );
  } else if (totalPositiveImageRecords > 0 && meets(positiveImageRate, 60)) {
    strengths.push(
      `Positive self-image rate at ${positiveImageRate}% -- good levels of engagement in positive image building activities.`,
    );
  }

  if (positiveImageImprovementRate >= 70 && totalPositiveImageRecords > 0) {
    strengths.push(
      `Measurable improvement recorded in ${positiveImageImprovementRate}% of positive image activities -- the home can evidence tangible progress in children's self-perception and confidence.`,
    );
  }

  if (positiveImageChildLedRate >= 50 && totalPositiveImageRecords > 0) {
    strengths.push(
      `${positiveImageChildLedRate}% of positive image activities are child-led -- children take ownership of their own confidence-building journey.`,
    );
  }

  if (childConfidenceRate >= 80 && confidenceDenominator > 0) {
    strengths.push(
      `Child confidence rate at ${childConfidenceRate}% across all identity and self-esteem domains -- children are consistently engaged, proud, and growing in confidence. This is strong evidence for SCCIF experiences and progress.`,
    );
  } else if (childConfidenceRate >= 60 && confidenceDenominator > 0) {
    strengths.push(
      `Child confidence rate at ${childConfidenceRate}% -- good overall levels of child engagement and confidence across identity and self-esteem activities.`,
    );
  }

  if (achievementCarePlanRate >= 80 && totalAchievementRecords > 0) {
    strengths.push(
      `${achievementCarePlanRate}% of achievements recorded in care plans -- the home ensures children's successes are documented as evidence of progress and positive outcomes.`,
    );
  }

  // -- Concerns -------------------------------------------------------------

  const concerns: string[] = [];

  if (identityWorkRate < 50 && totalIdentityRecords > 0) {
    concerns.push(
      `Only ${identityWorkRate}% of identity exploration work completed -- the majority of planned identity work is not being delivered, leaving children without structured support to understand and develop their sense of self.`,
    );
  } else if (identityWorkRate < 70 && identityWorkRate >= 50 && totalIdentityRecords > 0) {
    concerns.push(
      `Identity work completion at ${identityWorkRate}% -- some children's identity exploration is not being completed, potentially leaving gaps in their understanding of who they are.`,
    );
  }

  if (identityEngagementRate < 50 && totalIdentityRecords > 0) {
    concerns.push(
      `Children engaged in only ${identityEngagementRate}% of identity work sessions -- low engagement suggests the identity exploration may not be meaningful, age-appropriate, or well-facilitated.`,
    );
  }

  if (totalIdentityRecords > 0 && identitySatisfactionAvg !== null && identitySatisfactionAvg < 3.0) {
    concerns.push(
      `Children's satisfaction with identity work averages only ${identitySatisfactionAvg}/5 -- children do not find the identity exploration valuable or supportive.`,
    );
  }

  if (identityOutcomesRate < 50 && totalIdentityRecords > 0) {
    concerns.push(
      `Outcomes documented for only ${identityOutcomesRate}% of identity work -- the home cannot evidence the impact of identity exploration on children's development.`,
    );
  }

  if (lifeStoryBookRate < 50 && totalLifeStoryRecords > 0) {
    concerns.push(
      `Only ${lifeStoryBookRate}% of children have a life story book -- the majority of children do not have a tangible record of their personal history, which is fundamental to identity development for looked-after children.`,
    );
  } else if (lifeStoryBookRate < 70 && lifeStoryBookRate >= 50 && totalLifeStoryRecords > 0) {
    concerns.push(
      `Life story book provision at ${lifeStoryBookRate}% -- not all children have a life story book to support their understanding of their personal history.`,
    );
  }

  if (totalLifeStoryRecords > 0 && below(lifeStoryEngagementRate, 40)) {
    concerns.push(
      `Life story engagement rate at only ${lifeStoryEngagementRate}% -- life story work is insufficiently active, attended, or engaging. Children need consistent, meaningful opportunities to explore their personal narrative.`,
    );
  } else if (totalLifeStoryRecords > 0 && lifeStoryEngagementRate !== null && lifeStoryEngagementRate < 60 && lifeStoryEngagementRate >= 40) {
    concerns.push(
      `Life story engagement rate at ${lifeStoryEngagementRate}% -- life story work needs strengthening to ensure all children benefit from exploring their personal history.`,
    );
  }

  if (lifeStorySessionRate < 50 && totalLifeStorySessions > 0) {
    concerns.push(
      `Only ${lifeStorySessionRate}% of planned life story sessions completed -- sessions are not being delivered as planned, disrupting the continuity and effectiveness of life story work.`,
    );
  }

  if (lifeStoryStaffTrainingRate < 50 && totalLifeStoryRecords > 0) {
    concerns.push(
      `Staff trained in life story work for only ${lifeStoryStaffTrainingRate}% of cases -- insufficient training means staff may lack the skills to deliver sensitive identity work effectively.`,
    );
  }

  if (totalLifeStoryRecords > 0 && lifeStorySatisfactionAvg !== null && lifeStorySatisfactionAvg < 3.0) {
    concerns.push(
      `Children's satisfaction with life story work averages only ${lifeStorySatisfactionAvg}/5 -- children do not find the life story work helpful or engaging.`,
    );
  }

  if (totalSelfEsteemRecords > 0 && below(selfEsteemProgrammeRate, 40)) {
    concerns.push(
      `Self-esteem programme rate at only ${selfEsteemProgrammeRate}% -- programmes are poorly attended, children are disengaged, or progress is not being documented. The home is failing to provide effective self-esteem support.`,
    );
  } else if (totalSelfEsteemRecords > 0 && selfEsteemProgrammeRate !== null && selfEsteemProgrammeRate < 60 && selfEsteemProgrammeRate >= 40) {
    concerns.push(
      `Self-esteem programme rate at ${selfEsteemProgrammeRate}% -- self-esteem programme delivery needs improvement to ensure all children receive effective support.`,
    );
  }

  if (selfEsteemAttendanceRate < 50 && totalSelfEsteemSessions > 0) {
    concerns.push(
      `Only ${selfEsteemAttendanceRate}% of planned self-esteem sessions attended -- children are not attending scheduled sessions, which undermines programme effectiveness.`,
    );
  }

  if (selfEsteemMeasurableRate < 40 && totalSelfEsteemRecords > 0) {
    concerns.push(
      `Measurable outcomes recorded for only ${selfEsteemMeasurableRate}% of self-esteem programmes -- the home cannot evidence whether programmes are making a tangible difference to children's self-esteem.`,
    );
  }

  if (selfEsteemEvidenceBasedRate < 30 && totalSelfEsteemRecords > 0) {
    concerns.push(
      `Only ${selfEsteemEvidenceBasedRate}% of self-esteem programmes are evidence-based -- the home may be using unproven approaches that do not effectively build children's confidence.`,
    );
  }

  if (totalSelfEsteemRecords > 0 && selfEsteemSatisfactionAvg !== null && selfEsteemSatisfactionAvg < 3.0) {
    concerns.push(
      `Children's satisfaction with self-esteem programmes averages only ${selfEsteemSatisfactionAvg}/5 -- children do not feel the programmes are helpful or relevant.`,
    );
  }

  if (achievementCelebrationRate < 50 && totalAchievementRecords > 0) {
    concerns.push(
      `Only ${achievementCelebrationRate}% of achievements celebrated -- the majority of children's successes go unrecognised, which damages self-esteem and sends a message that their accomplishments do not matter.`,
    );
  } else if (achievementCelebrationRate < 70 && achievementCelebrationRate >= 50 && totalAchievementRecords > 0) {
    concerns.push(
      `Achievement celebration at ${achievementCelebrationRate}% -- not all children's successes are being recognised and celebrated.`,
    );
  }

  if (achievementDisplayRate < 50 && totalAchievementRecords > 0) {
    concerns.push(
      `Only ${achievementDisplayRate}% of achievements displayed -- children's successes are not visibly celebrated within the home, missing an opportunity to build pride and belonging.`,
    );
  }

  if (childPrideRate < 50 && totalAchievementRecords > 0) {
    concerns.push(
      `Only ${childPrideRate}% of children express pride in their achievements -- low self-esteem may be preventing children from recognising their own successes.`,
    );
  }

  if (achievementCarePlanRate < 50 && totalAchievementRecords > 0) {
    concerns.push(
      `Only ${achievementCarePlanRate}% of achievements recorded in care plans -- children's successes are not being formally documented as evidence of progress and development.`,
    );
  }

  if (totalPositiveImageRecords > 0 && below(positiveImageRate, 40)) {
    concerns.push(
      `Positive self-image rate at only ${positiveImageRate}% -- positive image building activities are not being effectively delivered, leaving children without adequate support for self-confidence.`,
    );
  } else if (totalPositiveImageRecords > 0 && positiveImageRate !== null && positiveImageRate < 60 && positiveImageRate >= 40) {
    concerns.push(
      `Positive self-image rate at ${positiveImageRate}% -- positive image activities need improvement to ensure all children are supported in developing a healthy self-perception.`,
    );
  }

  if (positiveImageImprovementRate < 40 && totalPositiveImageRecords > 0) {
    concerns.push(
      `Measurable improvement in only ${positiveImageImprovementRate}% of positive image activities -- the home cannot evidence that self-image work is making a tangible difference.`,
    );
  }

  if (childConfidenceRate < 50 && confidenceDenominator > 0) {
    concerns.push(
      `Child confidence rate at only ${childConfidenceRate}% across all domains -- children are not consistently engaged or demonstrating growing confidence, suggesting systemic issues with identity and self-esteem support.`,
    );
  } else if (childConfidenceRate < 60 && childConfidenceRate >= 50 && confidenceDenominator > 0) {
    concerns.push(
      `Child confidence rate at ${childConfidenceRate}% -- children's overall engagement and confidence need strengthening across identity and self-esteem activities.`,
    );
  }

  if (totalIdentityRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No identity exploration work records despite children being on placement -- the home may not be assessing or recording children's identity development needs.",
    );
  }

  if (totalLifeStoryRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No life story records despite children being on placement -- life story work is a critical component of identity development for looked-after children and its absence represents a significant gap in care provision.",
    );
  }

  if (totalAchievementRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No achievement records despite children being on placement -- the home is not recording or celebrating children's successes, which is essential for building positive self-esteem.",
    );
  }

  // -- Recommendations ------------------------------------------------------

  const recommendations: PositiveIdentityRecommendation[] = [];
  let rank = 0;

  if (identityWorkRate < 50 && totalIdentityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review and complete all planned identity exploration work -- every child needs structured support to understand their personal identity, heritage, and sense of belonging. Address barriers to completion and ensure staff are trained in identity-sensitive practice.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  if (totalLifeStoryRecords > 0 && below(lifeStoryEngagementRate, 40)) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen life story work engagement urgently -- ensure every child has active life story work that is age-appropriate, therapeutically supported where needed, and delivered by trained staff. Life story work is fundamental to identity development for looked-after children.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  if (achievementCelebrationRate < 50 && totalAchievementRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a culture of achievement celebration -- every child's success, however small, should be recognised, celebrated, displayed, and shared with family and professionals. Create systems for routine celebration such as achievement boards, certificates, and family communications.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 11 -- Positive relationships",
    });
  }

  if (totalSelfEsteemRecords > 0 && below(selfEsteemProgrammeRate, 40)) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and redesign self-esteem programme provision -- current programmes are not achieving sufficient attendance, engagement, or documented progress. Consider evidence-based approaches, individual needs assessment, and child voice in programme design.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (childConfidenceRate < 50 && confidenceDenominator > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address the low child confidence rate across all identity and self-esteem domains -- conduct individual assessments of each child's self-esteem and confidence needs, and develop targeted action plans to build positive self-perception.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 -- Children's views",
    });
  }

  if (lifeStoryBookRate < 50 && totalLifeStoryRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every child has a life story book that is regularly updated and maintained with their involvement -- the life story book should be a living document that grows with the child and helps them make sense of their journey.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  if (totalPositiveImageRecords > 0 && below(positiveImageRate, 40)) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen positive self-image activities -- ensure activities are completed, children are engaged, and measurable improvements are recorded. Consider individual confidence-building plans for each child.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (identityEngagementRate < 50 && totalIdentityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review why children are not engaging with identity work and adapt approaches to make sessions more meaningful, age-appropriate, and child-centred. Consider creative methods such as art, drama, or digital media.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 -- Children's views",
    });
  }

  if (selfEsteemMeasurableRate < 40 && totalSelfEsteemRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Introduce measurable outcome tracking for all self-esteem programmes -- use validated tools such as the Rosenberg Self-Esteem Scale or Strengths and Difficulties Questionnaire to evidence impact and guide programme improvement.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (achievementDisplayRate < 50 && totalAchievementRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Create visible achievement displays throughout the home -- achievement boards, trophy cabinets, and photo walls celebrating children's successes build a positive, affirming environment and reinforce self-worth.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 11 -- Positive relationships",
    });
  }

  if (lifeStoryStaffTrainingRate < 50 && totalLifeStoryRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Provide life story work training for all key workers -- staff need skills in sensitive identity work, trauma-aware practice, and age-appropriate narrative techniques to deliver effective life story sessions.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  if (selfEsteemEvidenceBasedRate < 30 && totalSelfEsteemRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Adopt evidence-based self-esteem programmes -- consider proven approaches such as cognitive behavioural techniques, mindfulness-based programmes, or structured resilience curricula to ensure interventions are effective.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (achievementFamilyShareRate < 50 && totalAchievementRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Share children's achievements with their families more consistently -- involving families in celebrating successes strengthens family relationships and reinforces children's sense of being valued.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 11 -- Positive relationships",
    });
  }

  if (identityWorkRate >= 50 && identityWorkRate < 70 && totalIdentityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve identity work completion to at least 70% -- review and address any barriers preventing children from completing identity exploration sessions.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  if (achievementCelebrationRate >= 50 && achievementCelebrationRate < 70 && totalAchievementRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase achievement celebration to at least 70% -- develop routine celebration practices so that no child's success goes unacknowledged.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 11 -- Positive relationships",
    });
  }

  if (totalIdentityRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement identity exploration work for every child -- assess each child's identity development needs and create structured, personalised identity work plans.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  if (totalLifeStoryRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin life story work for every child -- life story work is a critical component of identity development for looked-after children. Each child should have a life story book and regular life story sessions.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Quality of care",
    });
  }

  if (totalAchievementRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish achievement recording and celebration processes -- create systems to identify, record, celebrate, and display every child's achievements across academic, sporting, creative, social, and personal growth domains.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 11 -- Positive relationships",
    });
  }

  // -- Insights -------------------------------------------------------------

  const insights: PositiveIdentityInsight[] = [];

  // --- Critical insights ---

  if (identityWorkRate < 50 && totalIdentityRecords > 0) {
    insights.push({
      text: `Only ${identityWorkRate}% of identity exploration work completed. Ofsted will view the failure to support children's identity development as evidence that the home does not understand or nurture children's sense of self -- a direct concern under Reg 5 quality of care.`,
      severity: "critical",
    });
  }

  if (totalLifeStoryRecords > 0 && below(lifeStoryEngagementRate, 40)) {
    insights.push({
      text: `Life story engagement at only ${lifeStoryEngagementRate}%. For looked-after children, understanding their personal history is fundamental to developing a secure identity. Low engagement with life story work risks children carrying unresolved questions about their past into adulthood.`,
      severity: "critical",
    });
  }

  if (achievementCelebrationRate < 50 && totalAchievementRecords > 0) {
    insights.push({
      text: `Only ${achievementCelebrationRate}% of achievements celebrated. Children whose successes go unrecognised internalise the message that they do not matter. This directly undermines self-esteem and contradicts the home's duty under Reg 11 to build positive relationships.`,
      severity: "critical",
    });
  }

  if (totalSelfEsteemRecords > 0 && below(selfEsteemProgrammeRate, 40)) {
    insights.push({
      text: `Self-esteem programme rate at only ${selfEsteemProgrammeRate}%. Ineffective self-esteem support means children are not receiving the structured help they need to develop confidence and resilience. Ofsted will expect to see evidence of effective, measurable self-esteem interventions under SCCIF experiences and progress.`,
      severity: "critical",
    });
  }

  if (totalIdentityRecords === 0 && totalLifeStoryRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No identity work or life story records despite children being on placement. Ofsted may interpret the absence of records as evidence that children's identity development has not been assessed, understood, or supported -- this is a significant omission under Reg 5.",
      severity: "critical",
    });
  }

  if (childConfidenceRate < 40 && confidenceDenominator > 0) {
    insights.push({
      text: `Child confidence rate at only ${childConfidenceRate}% across all domains. Low engagement and confidence suggest systemic issues with how the home supports children's identity and self-esteem. Ofsted will expect to see children who are confident, proud of their achievements, and actively developing a positive sense of self.`,
      severity: "critical",
    });
  }

  // --- Warning insights ---

  if (identityWorkRate >= 50 && identityWorkRate < 70 && totalIdentityRecords > 0) {
    insights.push({
      text: `Identity work completion at ${identityWorkRate}% -- improving but some children's identity exploration is not being completed. Each incomplete session represents a missed opportunity to help a child understand who they are.`,
      severity: "warning",
    });
  }

  if (totalLifeStoryRecords > 0 && lifeStoryEngagementRate !== null && lifeStoryEngagementRate >= 40 && lifeStoryEngagementRate < 60) {
    insights.push({
      text: `Life story engagement at ${lifeStoryEngagementRate}% -- life story work is partially in place but not yet consistently supporting all children's understanding of their personal history.`,
      severity: "warning",
    });
  }

  if (totalSelfEsteemRecords > 0 && selfEsteemProgrammeRate !== null && selfEsteemProgrammeRate >= 40 && selfEsteemProgrammeRate < 60) {
    insights.push({
      text: `Self-esteem programme rate at ${selfEsteemProgrammeRate}% -- while some programmes are running, attendance, engagement, or progress documentation need improvement to ensure all children benefit.`,
      severity: "warning",
    });
  }

  if (achievementCelebrationRate >= 50 && achievementCelebrationRate < 70 && totalAchievementRecords > 0) {
    insights.push({
      text: `Achievement celebration at ${achievementCelebrationRate}% -- some children's successes are not being recognised. Consistent celebration of all achievements, however small, is essential for building self-esteem.`,
      severity: "warning",
    });
  }

  if (totalPositiveImageRecords > 0 && positiveImageRate !== null && positiveImageRate >= 40 && positiveImageRate < 60) {
    insights.push({
      text: `Positive self-image rate at ${positiveImageRate}% -- self-image building activities are partially effective but need strengthening to ensure all children develop healthy self-perception and confidence.`,
      severity: "warning",
    });
  }

  if (childConfidenceRate >= 50 && childConfidenceRate < 60 && confidenceDenominator > 0) {
    insights.push({
      text: `Child confidence rate at ${childConfidenceRate}% -- children's engagement and confidence levels are adequate but need improvement across all identity and self-esteem activities to reach good practice standards.`,
      severity: "warning",
    });
  }

  if (lifeStoryBookRate >= 50 && lifeStoryBookRate < 70 && totalLifeStoryRecords > 0) {
    insights.push({
      text: `Life story book provision at ${lifeStoryBookRate}% -- not all children have a life story book. Every looked-after child should have a life story book as a tangible resource supporting their identity development.`,
      severity: "warning",
    });
  }

  if (selfEsteemEvidenceBasedRate >= 30 && selfEsteemEvidenceBasedRate < 80 && totalSelfEsteemRecords > 0) {
    insights.push({
      text: `${selfEsteemEvidenceBasedRate}% of self-esteem programmes are evidence-based -- consider increasing the use of proven, validated approaches to ensure programmes deliver measurable improvements in children's self-esteem.`,
      severity: "warning",
    });
  }

  if (achievementCarePlanRate >= 50 && achievementCarePlanRate < 80 && totalAchievementRecords > 0) {
    insights.push({
      text: `${achievementCarePlanRate}% of achievements recorded in care plans -- more consistent documentation would strengthen evidence of children's progress and positive outcomes for Ofsted.`,
      severity: "warning",
    });
  }

  // --- Diversity insight ---
  const identityWorkTypes = new Set(
    identity_work_records.map((r) => r.work_type).filter((t) => t !== "other"),
  );
  if (identityWorkTypes.size >= 4) {
    insights.push({
      text: `The home delivers identity work across ${identityWorkTypes.size} different domains -- this breadth ensures children can explore multiple aspects of their identity including cultural heritage, family history, personal narrative, and sense of belonging.`,
      severity: "positive",
    });
  }

  // --- Positive insights ---

  if (identity_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding support for children's positive identity and self-esteem development -- identity exploration, life story work, self-esteem programmes, achievement celebration, and positive self-image building are all embedded in everyday practice. This is strong evidence for Reg 5 compliance and the SCCIF experiences and progress judgement.",
      severity: "positive",
    });
  }

  if (totalIdentityRecords > 0 && totalLifeStoryRecords > 0 && meets(lifeStoryEngagementRate, 80) && identityWorkRate >= 90) {
    insights.push({
      text: `Identity work at ${identityWorkRate}% and life story engagement at ${lifeStoryEngagementRate}% -- the home provides comprehensive identity development support that helps children understand their past, navigate their present, and build hope for their future. Ofsted will recognise this as evidence of genuinely personalised care.`,
      severity: "positive",
    });
  }

  if (achievementCelebrationRate >= 90 && childPrideRate >= 80 && totalAchievementRecords > 0) {
    insights.push({
      text: `${achievementCelebrationRate}% of achievements celebrated with ${childPrideRate}% of children expressing pride -- the home has created an outstanding culture of celebration that genuinely builds children's self-esteem and sense of accomplishment.`,
      severity: "positive",
    });
  }

  if (totalSelfEsteemRecords > 0 && meets(selfEsteemProgrammeRate, 80) && selfEsteemMeasurableRate >= 70) {
    insights.push({
      text: `Self-esteem programme rate at ${selfEsteemProgrammeRate}% with ${selfEsteemMeasurableRate}% measurable outcomes -- the home delivers effective, evidence-based self-esteem support with documented improvements in children's confidence and resilience.`,
      severity: "positive",
    });
  }

  if (childConfidenceRate >= 80 && confidenceDenominator > 0) {
    insights.push({
      text: `Child confidence rate at ${childConfidenceRate}% across all domains -- children are consistently engaged, proud of their achievements, and growing in confidence. This demonstrates that the home's identity and self-esteem support is genuinely making a positive difference to children's lives.`,
      severity: "positive",
    });
  }

  if (totalPositiveImageRecords > 0 && meets(positiveImageRate, 80) && positiveImageImprovementRate >= 70) {
    insights.push({
      text: `Positive self-image rate at ${positiveImageRate}% with ${positiveImageImprovementRate}% showing measurable improvement -- the home's self-image building activities are demonstrably effective in helping children develop healthy self-perception and confidence.`,
      severity: "positive",
    });
  }

  if (achievementDisplayRate >= 80 && peerAcknowledgementRate >= 70 && totalAchievementRecords > 0) {
    insights.push({
      text: `${achievementDisplayRate}% of achievements displayed with ${peerAcknowledgementRate}% peer acknowledgement -- the home creates a visible culture of success where children's accomplishments are celebrated by staff and peers alike, building collective self-esteem and mutual respect.`,
      severity: "positive",
    });
  }

  if (totalLifeStoryRecords > 0 && lifeStorySatisfactionAvg !== null && lifeStoryBookRate >= 90 && lifeStorySatisfactionAvg >= 4.0) {
    insights.push({
      text: `${lifeStoryBookRate}% life story book provision with child satisfaction averaging ${lifeStorySatisfactionAvg}/5 -- every child has access to their personal history in a meaningful, age-appropriate format that they value. This is exemplary practice in supporting identity development.`,
      severity: "positive",
    });
  }

  // -- Headline -------------------------------------------------------------

  let headline: string;

  if (identity_rating === "outstanding") {
    headline =
      "Outstanding positive identity and self-esteem support -- children's identity development is understood, nurtured, and celebrated across all domains.";
  } else if (identity_rating === "good") {
    headline = `Good positive identity and self-esteem support -- ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (identity_rating === "adequate") {
    headline = `Adequate positive identity and self-esteem support -- ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's identity and self-esteem needs are fully met.`;
  } else {
    headline = `Positive identity and self-esteem support is inadequate -- ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children develop a positive sense of self.`;
  }

  // -- Return ---------------------------------------------------------------

  return {
    identity_rating,
    identity_score: score,
    headline,
    identity_work_rate: identityWorkRate,
    life_story_engagement_rate: lifeStoryEngagementRate,
    self_esteem_programme_rate: selfEsteemProgrammeRate,
    achievement_celebration_rate: achievementCelebrationRate,
    positive_image_rate: positiveImageRate,
    child_confidence_rate: childConfidenceRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
