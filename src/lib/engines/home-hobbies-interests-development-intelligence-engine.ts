// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME HOBBIES & INTERESTS DEVELOPMENT INTELLIGENCE ENGINE
// Monitors hobby and interest development quality — hobby participation rates,
// interest exploration breadth, talent development programmes, creative
// expression opportunities, and child-led activity engagement.
// Measures hobby participation rate, interest exploration rate, talent
// development rate, creative expression rate, child-led rate, and child
// satisfaction rate across all children on placement.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Engaging parents), Reg 6 (Quality and purpose of care),
// Reg 7 (Children's views). SCCIF: Experiences and progress.
// Store keys: hobbyParticipationRecords, interestExplorationRecords,
//             talentDevelopmentRecords, creativeExpressionRecords,
//             childLedActivityRecords
// ══════════════════════════════════════════════════════════════════════════════

import { above, below, meets } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface HobbyParticipationInput {
  id: string;
  child_id: string;
  hobby_name: string;
  hobby_category: "sport" | "music" | "art" | "drama" | "technology" | "cooking" | "nature" | "reading" | "gaming" | "craft" | "dance" | "martial_arts" | "other";
  start_date: string;
  end_date: string | null;
  active: boolean;
  sessions_planned: number;
  sessions_attended: number;
  child_enjoyment_rating: number; // 1-5
  skill_progression_rating: number; // 1-5
  staff_supported: boolean;
  external_club: boolean;
  peer_participation: boolean;
  child_chose_hobby: boolean;
  cost_approved: boolean;
  review_date: string | null;
  review_overdue: boolean;
  notes_recorded: boolean;
  created_at: string;
}

export interface InterestExplorationInput {
  id: string;
  child_id: string;
  interest_area: string;
  exploration_type: "taster_session" | "workshop" | "visit" | "online_course" | "mentoring" | "community_group" | "school_club" | "home_activity" | "other";
  date: string;
  duration_minutes: number;
  child_initiated: boolean;
  child_engagement_rating: number; // 1-5
  led_to_ongoing_hobby: boolean;
  new_experience: boolean;
  cultural_exposure: boolean;
  staff_facilitated: boolean;
  documented: boolean;
  child_feedback_positive: boolean;
  created_at: string;
}

export interface TalentDevelopmentInput {
  id: string;
  child_id: string;
  talent_area: string;
  programme_type: "coaching" | "lessons" | "mentoring" | "competition" | "grading" | "performance" | "exhibition" | "masterclass" | "other";
  start_date: string;
  end_date: string | null;
  active: boolean;
  sessions_planned: number;
  sessions_completed: number;
  achievement_level: "beginner" | "developing" | "competent" | "advanced" | "elite";
  external_recognition: boolean;
  professional_instructor: boolean;
  progress_documented: boolean;
  child_motivation_rating: number; // 1-5
  cost_funded: boolean;
  review_date: string | null;
  review_overdue: boolean;
  created_at: string;
}

export interface CreativeExpressionInput {
  id: string;
  child_id: string;
  expression_type: "visual_art" | "music" | "creative_writing" | "drama" | "photography" | "film" | "digital_art" | "textiles" | "pottery" | "dance" | "spoken_word" | "other";
  activity_date: string;
  duration_minutes: number;
  facilitated: boolean;
  child_initiated: boolean;
  materials_provided: boolean;
  output_produced: boolean;
  output_displayed: boolean;
  child_satisfaction_rating: number; // 1-5
  therapeutic_value: boolean;
  shared_with_others: boolean;
  documented: boolean;
  created_at: string;
}

export interface ChildLedActivityInput {
  id: string;
  child_id: string;
  activity_name: string;
  activity_type: "planned_by_child" | "child_requested" | "child_organised" | "peer_led" | "child_designed" | "other";
  activity_date: string;
  duration_minutes: number;
  staff_supported: boolean;
  other_children_involved: number;
  child_satisfaction_rating: number; // 1-5
  resources_provided: boolean;
  outcome_positive: boolean;
  documented: boolean;
  autonomy_respected: boolean;
  created_at: string;
}

export interface HobbiesInterestsInput {
  today: string;
  total_children: number;
  hobby_participation_records: HobbyParticipationInput[];
  interest_exploration_records: InterestExplorationInput[];
  talent_development_records: TalentDevelopmentInput[];
  creative_expression_records: CreativeExpressionInput[];
  child_led_activity_records: ChildLedActivityInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type HobbiesInterestsRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface HobbiesInterestsInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface HobbiesInterestsRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HobbiesInterestsResult {
  hobbies_rating: HobbiesInterestsRating;
  hobbies_score: number;
  headline: string;
  total_hobbies: number;
  // Rates use total_children as denominator (unrelated to fab-0). Only the
  // avgs below are gated on record-count denominators — widened to null.
  hobby_participation_rate: number;
  interest_exploration_rate: number;
  talent_development_rate: number;
  creative_expression_rate: number;
  child_led_rate: number;
  child_satisfaction_rate: number;
  // Null on empty: no records ⇒ no signal. "0.0 enjoyment" or "0.0 skill
  // progression" would read as "children hate their hobbies", not "unmeasured".
  // Fab-0 doctrine.
  hobby_enjoyment_avg: number | null;
  skill_progression_avg: number | null;
  exploration_breadth_avg: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: HobbiesInterestsRecommendation[];
  insights: HobbiesInterestsInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): HobbiesInterestsRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: HobbiesInterestsRating,
  score: number,
  headline: string,
): HobbiesInterestsResult {
  return {
    hobbies_rating: rating,
    hobbies_score: score,
    headline,
    total_hobbies: 0,
    hobby_participation_rate: 0,
    interest_exploration_rate: 0,
    talent_development_rate: 0,
    creative_expression_rate: 0,
    child_led_rate: 0,
    child_satisfaction_rate: 0,
    hobby_enjoyment_avg: null,
    skill_progression_avg: null,
    exploration_breadth_avg: null,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHobbiesInterestsDevelopment(
  input: HobbiesInterestsInput,
): HobbiesInterestsResult {
  const {
    total_children,
    hobby_participation_records,
    interest_exploration_records,
    talent_development_records,
    creative_expression_records,
    child_led_activity_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    hobby_participation_records.length === 0 &&
    interest_exploration_records.length === 0 &&
    talent_development_records.length === 0 &&
    creative_expression_records.length === 0 &&
    child_led_activity_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess hobbies and interests development.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No hobbies or interests data recorded despite children on placement — hobby participation, interest exploration, and creative expression require urgent attention.",
      ),
      concerns: [
        "No hobby participation, interest exploration, talent development, creative expression, or child-led activity records exist despite children being on placement — the home cannot evidence that children have opportunities to develop hobbies and pursue interests.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement a structured hobby participation programme for all children to ensure each child has access to regular, meaningful hobby activities that reflect their interests and choices.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
        },
        {
          rank: 2,
          recommendation:
            "Establish interest exploration opportunities including taster sessions, workshops, and community activities to help children discover new interests and broaden their experiences.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes and feelings",
        },
      ],
      insights: [
        {
          text: "The complete absence of hobbies and interests records means the home cannot demonstrate that children are provided with opportunities to explore, develop, and pursue their interests. Ofsted expects children in residential care to have rich, varied experiences that support their personal development — the absence of any hobby or interest activity records represents a fundamental gap in the quality of care provision.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Hobby participation ---
  const totalHobbies = hobby_participation_records.length;
  const activeHobbies = hobby_participation_records.filter((h) => h.active).length;
  const uniqueChildrenWithHobbies = new Set(
    hobby_participation_records.map((h) => h.child_id),
  ).size;
  const hobbyParticipationRate =
    total_children > 0 ? pct(uniqueChildrenWithHobbies, total_children) : 0;

  const hobbyAttendanceTotal = hobby_participation_records.reduce(
    (sum, h) => sum + h.sessions_attended,
    0,
  );
  const hobbyPlannedTotal = hobby_participation_records.reduce(
    (sum, h) => sum + h.sessions_planned,
    0,
  );
  const hobbyAttendanceRate = pct(hobbyAttendanceTotal, hobbyPlannedTotal);

  const hobbyEnjoymentSum = hobby_participation_records.reduce(
    (sum, h) => sum + h.child_enjoyment_rating,
    0,
  );
  const hobbyEnjoymentAvg: number | null =
    totalHobbies > 0
      ? Math.round((hobbyEnjoymentSum / totalHobbies) * 100) / 100
      : null;

  const skillProgressionSum = hobby_participation_records.reduce(
    (sum, h) => sum + h.skill_progression_rating,
    0,
  );
  const skillProgressionAvg: number | null =
    totalHobbies > 0
      ? Math.round((skillProgressionSum / totalHobbies) * 100) / 100
      : null;

  const childChosenHobbies = hobby_participation_records.filter(
    (h) => h.child_chose_hobby,
  ).length;
  const childChoiceRate = pct(childChosenHobbies, totalHobbies);

  const externalClubHobbies = hobby_participation_records.filter(
    (h) => h.external_club,
  ).length;
  const externalClubRate = pct(externalClubHobbies, totalHobbies);

  const peerParticipationHobbies = hobby_participation_records.filter(
    (h) => h.peer_participation,
  ).length;
  const peerParticipationRate = pct(peerParticipationHobbies, totalHobbies);

  const hobbyNotesRecorded = hobby_participation_records.filter(
    (h) => h.notes_recorded,
  ).length;
  const hobbyDocumentationRate = pct(hobbyNotesRecorded, totalHobbies);

  const overdueHobbyReviews = hobby_participation_records.filter(
    (h) => h.review_overdue && h.active,
  ).length;

  // --- Hobby category diversity ---
  const hobbyCategoryCounts: Record<string, number> = {};
  for (const h of hobby_participation_records) {
    hobbyCategoryCounts[h.hobby_category] = (hobbyCategoryCounts[h.hobby_category] ?? 0) + 1;
  }
  const uniqueHobbyCategories = Object.keys(hobbyCategoryCounts).length;

  // --- Interest exploration ---
  const totalExplorations = interest_exploration_records.length;
  const uniqueChildrenExploring = new Set(
    interest_exploration_records.map((e) => e.child_id),
  ).size;
  const interestExplorationRate =
    total_children > 0 ? pct(uniqueChildrenExploring, total_children) : 0;

  const childInitiatedExplorations = interest_exploration_records.filter(
    (e) => e.child_initiated,
  ).length;
  const childInitiatedExplorationRate = pct(childInitiatedExplorations, totalExplorations);

  const newExperiences = interest_exploration_records.filter(
    (e) => e.new_experience,
  ).length;
  const newExperienceRate = pct(newExperiences, totalExplorations);

  const culturalExposures = interest_exploration_records.filter(
    (e) => e.cultural_exposure,
  ).length;
  const culturalExposureRate = pct(culturalExposures, totalExplorations);

  const explorationFeedbackPositive = interest_exploration_records.filter(
    (e) => e.child_feedback_positive,
  ).length;
  const explorationFeedbackRate = pct(explorationFeedbackPositive, totalExplorations);

  const ledToOngoingHobby = interest_exploration_records.filter(
    (e) => e.led_to_ongoing_hobby,
  ).length;
  const conversionRate = pct(ledToOngoingHobby, totalExplorations);

  const explorationDocumented = interest_exploration_records.filter(
    (e) => e.documented,
  ).length;
  const explorationDocumentationRate = pct(explorationDocumented, totalExplorations);

  // --- Exploration breadth per child ---
  const explorationsByChild: Record<string, Set<string>> = {};
  for (const e of interest_exploration_records) {
    if (!explorationsByChild[e.child_id]) {
      explorationsByChild[e.child_id] = new Set();
    }
    explorationsByChild[e.child_id].add(e.exploration_type);
  }
  const explorationBreadthValues = Object.values(explorationsByChild).map((s) => s.size);
  const explorationBreadthAvg: number | null =
    explorationBreadthValues.length > 0
      ? Math.round(
          (explorationBreadthValues.reduce((sum, v) => sum + v, 0) /
            explorationBreadthValues.length) *
            100,
        ) / 100
      : null;

  const explorationEngagementSum = interest_exploration_records.reduce(
    (sum, e) => sum + e.child_engagement_rating,
    0,
  );
  const explorationEngagementAvg: number | null =
    totalExplorations > 0
      ? Math.round((explorationEngagementSum / totalExplorations) * 100) / 100
      : null;

  // --- Talent development ---
  const totalTalentProgrammes = talent_development_records.length;
  const activeTalentProgrammes = talent_development_records.filter(
    (t) => t.active,
  ).length;
  const uniqueChildrenInTalent = new Set(
    talent_development_records.map((t) => t.child_id),
  ).size;
  const talentDevelopmentRate =
    total_children > 0 ? pct(uniqueChildrenInTalent, total_children) : 0;

  const talentSessionsCompleted = talent_development_records.reduce(
    (sum, t) => sum + t.sessions_completed,
    0,
  );
  const talentSessionsPlanned = talent_development_records.reduce(
    (sum, t) => sum + t.sessions_planned,
    0,
  );
  const talentSessionCompletionRate = pct(talentSessionsCompleted, talentSessionsPlanned);

  const talentWithExternalRecognition = talent_development_records.filter(
    (t) => t.external_recognition,
  ).length;
  const externalRecognitionRate = pct(talentWithExternalRecognition, totalTalentProgrammes);

  const talentWithProfessionalInstructor = talent_development_records.filter(
    (t) => t.professional_instructor,
  ).length;
  const professionalInstructorRate = pct(talentWithProfessionalInstructor, totalTalentProgrammes);

  const talentProgressDocumented = talent_development_records.filter(
    (t) => t.progress_documented,
  ).length;
  const talentDocumentationRate = pct(talentProgressDocumented, totalTalentProgrammes);

  const talentMotivationSum = talent_development_records.reduce(
    (sum, t) => sum + t.child_motivation_rating,
    0,
  );
  const talentMotivationAvg: number | null =
    totalTalentProgrammes > 0
      ? Math.round((talentMotivationSum / totalTalentProgrammes) * 100) / 100
      : null;

  const overdueTalentReviews = talent_development_records.filter(
    (t) => t.review_overdue && t.active,
  ).length;

  // --- Talent achievement distribution ---
  const achievementCounts: Record<string, number> = {};
  for (const t of talent_development_records) {
    achievementCounts[t.achievement_level] = (achievementCounts[t.achievement_level] ?? 0) + 1;
  }
  const advancedOrElite = (achievementCounts["advanced"] ?? 0) + (achievementCounts["elite"] ?? 0);
  const advancedRate = pct(advancedOrElite, totalTalentProgrammes);

  // --- Creative expression ---
  const totalCreativeActivities = creative_expression_records.length;
  const uniqueChildrenCreative = new Set(
    creative_expression_records.map((c) => c.child_id),
  ).size;
  const creativeExpressionRate =
    total_children > 0 ? pct(uniqueChildrenCreative, total_children) : 0;

  const childInitiatedCreative = creative_expression_records.filter(
    (c) => c.child_initiated,
  ).length;
  const childInitiatedCreativeRate = pct(childInitiatedCreative, totalCreativeActivities);

  const outputProduced = creative_expression_records.filter(
    (c) => c.output_produced,
  ).length;
  const outputProductionRate = pct(outputProduced, totalCreativeActivities);

  const outputDisplayed = creative_expression_records.filter(
    (c) => c.output_displayed,
  ).length;
  const outputDisplayRate = pct(outputDisplayed, totalCreativeActivities);

  const creativeSatisfactionSum = creative_expression_records.reduce(
    (sum, c) => sum + c.child_satisfaction_rating,
    0,
  );
  const creativeSatisfactionAvg: number | null =
    totalCreativeActivities > 0
      ? Math.round((creativeSatisfactionSum / totalCreativeActivities) * 100) / 100
      : null;

  const therapeuticCreativeActivities = creative_expression_records.filter(
    (c) => c.therapeutic_value,
  ).length;
  const therapeuticRate = pct(therapeuticCreativeActivities, totalCreativeActivities);

  const sharedWithOthers = creative_expression_records.filter(
    (c) => c.shared_with_others,
  ).length;
  const sharingRate = pct(sharedWithOthers, totalCreativeActivities);

  const creativeDocumented = creative_expression_records.filter(
    (c) => c.documented,
  ).length;
  const creativeDocumentationRate = pct(creativeDocumented, totalCreativeActivities);

  // --- Creative expression type diversity ---
  const creativeTypeCounts: Record<string, number> = {};
  for (const c of creative_expression_records) {
    creativeTypeCounts[c.expression_type] = (creativeTypeCounts[c.expression_type] ?? 0) + 1;
  }
  const uniqueCreativeTypes = Object.keys(creativeTypeCounts).length;

  // --- Child-led activities ---
  const totalChildLedActivities = child_led_activity_records.length;
  const uniqueChildrenLeading = new Set(
    child_led_activity_records.map((a) => a.child_id),
  ).size;
  const childLedRate =
    total_children > 0 ? pct(uniqueChildrenLeading, total_children) : 0;

  const childLedSatisfactionSum = child_led_activity_records.reduce(
    (sum, a) => sum + a.child_satisfaction_rating,
    0,
  );
  const childLedSatisfactionAvg: number | null =
    totalChildLedActivities > 0
      ? Math.round((childLedSatisfactionSum / totalChildLedActivities) * 100) / 100
      : null;

  const childLedPositiveOutcomes = child_led_activity_records.filter(
    (a) => a.outcome_positive,
  ).length;
  const childLedOutcomeRate = pct(childLedPositiveOutcomes, totalChildLedActivities);

  const childLedAutonomyRespected = child_led_activity_records.filter(
    (a) => a.autonomy_respected,
  ).length;
  const autonomyRespectedRate = pct(childLedAutonomyRespected, totalChildLedActivities);

  const childLedResourcesProvided = child_led_activity_records.filter(
    (a) => a.resources_provided,
  ).length;
  const resourcesProvidedRate = pct(childLedResourcesProvided, totalChildLedActivities);

  const childLedDocumented = child_led_activity_records.filter(
    (a) => a.documented,
  ).length;
  const childLedDocumentationRate = pct(childLedDocumented, totalChildLedActivities);

  const childLedWithPeers = child_led_activity_records.filter(
    (a) => a.other_children_involved > 0,
  ).length;
  const childLedPeerRate = pct(childLedWithPeers, totalChildLedActivities);

  // --- Child satisfaction rate (composite across all domains) ---
  const satisfactionOpportunities =
    totalHobbies + totalExplorations + totalCreativeActivities + totalChildLedActivities;
  const satisfactionPositive =
    hobby_participation_records.filter((h) => h.child_enjoyment_rating >= 4).length +
    interest_exploration_records.filter((e) => e.child_feedback_positive).length +
    creative_expression_records.filter((c) => c.child_satisfaction_rating >= 4).length +
    child_led_activity_records.filter((a) => a.child_satisfaction_rating >= 4).length;
  const childSatisfactionRate = pct(satisfactionPositive, satisfactionOpportunities);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: hobbyParticipationRate (>=100: +5, >=80: +3) ---
  if (hobbyParticipationRate >= 100) score += 5;
  else if (hobbyParticipationRate >= 80) score += 3;

  // --- Bonus 2: interestExplorationRate (>=80: +4, >=60: +2) ---
  if (interestExplorationRate >= 80) score += 4;
  else if (interestExplorationRate >= 60) score += 2;

  // --- Bonus 3: talentDevelopmentRate (>=60: +4, >=40: +2) ---
  if (talentDevelopmentRate >= 60) score += 4;
  else if (talentDevelopmentRate >= 40) score += 2;

  // --- Bonus 4: creativeExpressionRate (>=80: +4, >=60: +2) ---
  if (creativeExpressionRate >= 80) score += 4;
  else if (creativeExpressionRate >= 60) score += 2;

  // --- Bonus 5: childLedRate (>=70: +4, >=50: +2) ---
  if (childLedRate >= 70) score += 4;
  else if (childLedRate >= 50) score += 2;

  // --- Bonus 6: childSatisfactionRate (>=90: +3, >=70: +1) ---
  if (childSatisfactionRate >= 90) score += 3;
  else if (childSatisfactionRate >= 70) score += 1;

  // --- Bonus 7: hobbyEnjoymentAvg (>=4.0: +2, >=3.0: +1) ---
  if (meets(hobbyEnjoymentAvg, 4.0)) score += 2;
  else if (meets(hobbyEnjoymentAvg, 3.0)) score += 1;

  // --- Bonus 8: childChoiceRate (>=80: +2, >=60: +1) ---
  if (childChoiceRate >= 80) score += 2;
  else if (childChoiceRate >= 60) score += 1;

  // ── Penalties (guarded by array.length > 0) ───────────────────────────

  // hobbyParticipationRate < 40 → -6
  if (hobbyParticipationRate < 40 && hobby_participation_records.length > 0) score -= 6;

  // interestExplorationRate < 40 → -5
  if (interestExplorationRate < 40 && interest_exploration_records.length > 0) score -= 5;

  // creativeExpressionRate < 40 → -5
  if (creativeExpressionRate < 40 && creative_expression_records.length > 0) score -= 5;

  // childSatisfactionRate < 40 → -4
  if (childSatisfactionRate < 40 && satisfactionOpportunities > 0) score -= 4;

  score = clamp(score, 0, 100);

  const hobbies_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (hobbyParticipationRate >= 100 && total_children > 0) {
    strengths.push(
      "Every child is participating in at least one hobby — the home demonstrates comprehensive commitment to ensuring all children have regular, meaningful hobby activities.",
    );
  } else if (hobbyParticipationRate >= 80 && total_children > 0) {
    strengths.push(
      `${hobbyParticipationRate}% of children participate in hobbies — strong coverage ensuring the vast majority of children have access to hobby activities.`,
    );
  }

  if (interestExplorationRate >= 80 && total_children > 0) {
    strengths.push(
      `${interestExplorationRate}% of children have explored new interests — the home actively facilitates broad interest exploration, helping children discover what they enjoy.`,
    );
  } else if (interestExplorationRate >= 60 && total_children > 0) {
    strengths.push(
      `${interestExplorationRate}% interest exploration rate — good levels of access to taster sessions, workshops, and new experiences for children.`,
    );
  }

  if (talentDevelopmentRate >= 60 && total_children > 0) {
    strengths.push(
      `${talentDevelopmentRate}% of children are in talent development programmes — the home invests in nurturing identified talents through structured coaching, lessons, or mentoring.`,
    );
  } else if (talentDevelopmentRate >= 40 && total_children > 0) {
    strengths.push(
      `${talentDevelopmentRate}% of children are supported in talent development — a meaningful proportion of children receive structured support to develop their skills.`,
    );
  }

  if (creativeExpressionRate >= 80 && total_children > 0) {
    strengths.push(
      `${creativeExpressionRate}% of children engage in creative expression — the home provides rich, varied creative opportunities that support children's emotional and personal development.`,
    );
  } else if (creativeExpressionRate >= 60 && total_children > 0) {
    strengths.push(
      `${creativeExpressionRate}% creative expression rate — good availability of creative activities for the majority of children.`,
    );
  }

  if (childLedRate >= 70 && total_children > 0) {
    strengths.push(
      `${childLedRate}% of children lead their own activities — the home empowers children to plan, organise, and direct their own leisure time, building autonomy and confidence.`,
    );
  } else if (childLedRate >= 50 && total_children > 0) {
    strengths.push(
      `${childLedRate}% child-led activity rate — over half of children are initiating and leading their own activities, demonstrating growing independence.`,
    );
  }

  if (childSatisfactionRate >= 90 && satisfactionOpportunities > 0) {
    strengths.push(
      `${childSatisfactionRate}% child satisfaction across all activities — children overwhelmingly report enjoyment and positive experience from their hobby and interest activities.`,
    );
  } else if (childSatisfactionRate >= 70 && satisfactionOpportunities > 0) {
    strengths.push(
      `${childSatisfactionRate}% child satisfaction rate — the majority of children report positive experiences with their hobbies and activities.`,
    );
  }

  if (meets(hobbyEnjoymentAvg, 4.0) && totalHobbies > 0) {
    strengths.push(
      `Hobby enjoyment averages ${hobbyEnjoymentAvg}/5 — children genuinely enjoy their hobby activities, indicating hobbies are well-matched to their interests and preferences.`,
    );
  } else if (meets(hobbyEnjoymentAvg, 3.0) && totalHobbies > 0) {
    strengths.push(
      `Hobby enjoyment averages ${hobbyEnjoymentAvg}/5 — children generally find their hobby activities enjoyable and worthwhile.`,
    );
  }

  if (childChoiceRate >= 80 && totalHobbies > 0) {
    strengths.push(
      `${childChoiceRate}% of hobbies are child-chosen — the home prioritises children's own preferences and autonomy when selecting hobby activities.`,
    );
  } else if (childChoiceRate >= 60 && totalHobbies > 0) {
    strengths.push(
      `${childChoiceRate}% child choice in hobby selection — the home generally respects children's wishes when choosing hobby activities.`,
    );
  }

  if (externalClubRate >= 50 && totalHobbies > 0) {
    strengths.push(
      `${externalClubRate}% of hobbies involve external clubs — children are accessing community-based activities, supporting social integration and peer relationships beyond the home.`,
    );
  }

  if (peerParticipationRate >= 60 && totalHobbies > 0) {
    strengths.push(
      `${peerParticipationRate}% of hobbies involve peer participation — children are developing social skills and friendships through shared hobby activities.`,
    );
  }

  if (hobbyAttendanceRate >= 90 && hobbyPlannedTotal > 0) {
    strengths.push(
      `${hobbyAttendanceRate}% hobby session attendance — excellent commitment to attending planned hobby sessions, demonstrating consistency and dedication.`,
    );
  } else if (hobbyAttendanceRate >= 75 && hobbyPlannedTotal > 0) {
    strengths.push(
      `${hobbyAttendanceRate}% hobby attendance rate — children are attending the majority of their planned hobby sessions.`,
    );
  }

  if (meets(skillProgressionAvg, 4.0) && totalHobbies > 0) {
    strengths.push(
      `Skill progression averages ${skillProgressionAvg}/5 — children are making strong progress in developing skills through their hobby activities.`,
    );
  }

  if (newExperienceRate >= 70 && totalExplorations > 0) {
    strengths.push(
      `${newExperienceRate}% of explorations are new experiences — the home consistently introduces children to activities they have not tried before, broadening their horizons.`,
    );
  }

  if (culturalExposureRate >= 50 && totalExplorations > 0) {
    strengths.push(
      `${culturalExposureRate}% of explorations include cultural exposure — the home integrates cultural experiences into interest exploration, enriching children's understanding of diversity.`,
    );
  }

  if (conversionRate >= 30 && totalExplorations > 0) {
    strengths.push(
      `${conversionRate}% of taster explorations led to ongoing hobbies — the home successfully converts interest exploration into sustained engagement.`,
    );
  }

  if (externalRecognitionRate >= 30 && totalTalentProgrammes > 0) {
    strengths.push(
      `${externalRecognitionRate}% of talent programmes have led to external recognition — children's achievements are being celebrated beyond the home through competitions, gradings, or performances.`,
    );
  }

  if (professionalInstructorRate >= 70 && totalTalentProgrammes > 0) {
    strengths.push(
      `${professionalInstructorRate}% of talent programmes use professional instructors — the home invests in high-quality coaching and tuition to develop children's talents.`,
    );
  }

  if (outputDisplayRate >= 50 && totalCreativeActivities > 0) {
    strengths.push(
      `${outputDisplayRate}% of creative outputs are displayed — children's creative work is valued and celebrated within the home, building pride and self-esteem.`,
    );
  }

  if (therapeuticRate >= 40 && totalCreativeActivities > 0) {
    strengths.push(
      `${therapeuticRate}% of creative activities have therapeutic value — the home recognises and uses creative expression as a means of emotional processing and healing.`,
    );
  }

  if (autonomyRespectedRate >= 90 && totalChildLedActivities > 0) {
    strengths.push(
      "Children's autonomy is respected in virtually all child-led activities — the home supports children to make genuine choices about their leisure time without undue restriction.",
    );
  } else if (autonomyRespectedRate >= 70 && totalChildLedActivities > 0) {
    strengths.push(
      `${autonomyRespectedRate}% autonomy respected in child-led activities — the home generally supports children's independence in planning their own activities.`,
    );
  }

  if (childLedPeerRate >= 50 && totalChildLedActivities > 0) {
    strengths.push(
      `${childLedPeerRate}% of child-led activities involve other children — child-initiated activities are building positive peer relationships and social cohesion within the home.`,
    );
  }

  if (uniqueHobbyCategories >= 5 && totalHobbies > 0) {
    strengths.push(
      `Hobbies span ${uniqueHobbyCategories} different categories — the home supports a diverse range of hobby types, reflecting the varied interests of children.`,
    );
  }

  if (uniqueCreativeTypes >= 4 && totalCreativeActivities > 0) {
    strengths.push(
      `Creative activities cover ${uniqueCreativeTypes} different forms of expression — children have access to a rich variety of creative outlets.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (hobbyParticipationRate < 40 && total_children > 0) {
    concerns.push(
      `Only ${hobbyParticipationRate}% of children participate in hobbies — the majority of children do not have a regular hobby activity, limiting their opportunities for skill development, enjoyment, and social engagement.`,
    );
  } else if (hobbyParticipationRate < 80 && hobbyParticipationRate >= 40 && total_children > 0) {
    concerns.push(
      `Hobby participation at ${hobbyParticipationRate}% — some children are not accessing regular hobby activities, which may limit their personal development and enjoyment opportunities.`,
    );
  }

  if (interestExplorationRate < 40 && total_children > 0 && totalExplorations > 0) {
    concerns.push(
      `Only ${interestExplorationRate}% of children have explored new interests — the majority of children are not being offered sufficient opportunities to discover new activities and broaden their experiences.`,
    );
  } else if (interestExplorationRate < 60 && interestExplorationRate >= 40 && total_children > 0 && totalExplorations > 0) {
    concerns.push(
      `Interest exploration at ${interestExplorationRate}% — some children have limited access to taster sessions and new experiences, reducing the breadth of their personal development.`,
    );
  }

  if (talentDevelopmentRate < 20 && total_children > 0 && totalTalentProgrammes > 0) {
    concerns.push(
      `Only ${talentDevelopmentRate}% of children are in talent development programmes — very few children receive structured support to develop identified talents, which may indicate the home is not recognising or nurturing children's potential.`,
    );
  }

  if (creativeExpressionRate < 40 && total_children > 0 && totalCreativeActivities > 0) {
    concerns.push(
      `Only ${creativeExpressionRate}% of children engage in creative expression — the majority of children do not have access to regular creative activities, limiting an important avenue for emotional expression and personal development.`,
    );
  } else if (creativeExpressionRate < 60 && creativeExpressionRate >= 40 && total_children > 0 && totalCreativeActivities > 0) {
    concerns.push(
      `Creative expression rate at ${creativeExpressionRate}% — some children are missing out on creative activities that support emotional wellbeing and self-expression.`,
    );
  }

  if (childLedRate < 30 && total_children > 0 && totalChildLedActivities > 0) {
    concerns.push(
      `Only ${childLedRate}% of children lead their own activities — very few children are exercising genuine autonomy over their leisure time, raising questions about whether the home truly empowers children to make choices.`,
    );
  } else if (childLedRate < 50 && childLedRate >= 30 && total_children > 0 && totalChildLedActivities > 0) {
    concerns.push(
      `Child-led activity rate at ${childLedRate}% — fewer than half of children are initiating and leading their own activities, suggesting the home could do more to promote child autonomy.`,
    );
  }

  if (childSatisfactionRate < 40 && satisfactionOpportunities > 0) {
    concerns.push(
      `Only ${childSatisfactionRate}% child satisfaction across activities — most children do not report positive experiences, suggesting activities may not be well-matched to their interests or delivered in an engaging way.`,
    );
  } else if (childSatisfactionRate < 70 && childSatisfactionRate >= 40 && satisfactionOpportunities > 0) {
    concerns.push(
      `Child satisfaction at ${childSatisfactionRate}% — a significant proportion of children are not reporting positive experiences, indicating scope to better tailor activities to individual preferences.`,
    );
  }

  if (hobbyAttendanceRate < 50 && hobbyPlannedTotal > 0) {
    concerns.push(
      `Hobby session attendance at only ${hobbyAttendanceRate}% — poor attendance may indicate barriers to participation, lack of motivation, or hobbies that do not genuinely interest the child.`,
    );
  } else if (hobbyAttendanceRate < 75 && hobbyAttendanceRate >= 50 && hobbyPlannedTotal > 0) {
    concerns.push(
      `Hobby attendance rate at ${hobbyAttendanceRate}% — inconsistent attendance may reduce the benefit children gain from their hobby activities.`,
    );
  }

  if (childChoiceRate < 40 && totalHobbies > 0) {
    concerns.push(
      `Only ${childChoiceRate}% of hobbies are child-chosen — most hobbies appear to be selected for children rather than by them, raising concerns about whether the child's voice is genuinely heard in activity planning.`,
    );
  }

  if (overdueHobbyReviews > 0 && activeHobbies > 0) {
    concerns.push(
      `${overdueHobbyReviews} hobby review${overdueHobbyReviews !== 1 ? "s are" : " is"} overdue — without timely reviews, the home cannot ensure hobbies remain appropriate, enjoyable, and aligned with each child's evolving interests.`,
    );
  }

  if (overdueTalentReviews > 0 && activeTalentProgrammes > 0) {
    concerns.push(
      `${overdueTalentReviews} talent programme review${overdueTalentReviews !== 1 ? "s are" : " is"} overdue — delayed reviews may mean children continue in programmes that are no longer meeting their needs or aspirations.`,
    );
  }

  if (hobbyDocumentationRate < 60 && totalHobbies > 0) {
    concerns.push(
      `Hobby documentation at only ${hobbyDocumentationRate}% — poor recording makes it difficult to evidence children's hobby participation, progress, and enjoyment for reviews and inspections.`,
    );
  }

  if (explorationDocumentationRate < 60 && totalExplorations > 0) {
    concerns.push(
      `Interest exploration documentation at only ${explorationDocumentationRate}% — insufficient recording means the home cannot fully evidence the breadth of experiences offered to children.`,
    );
  }

  if (talentDocumentationRate < 60 && totalTalentProgrammes > 0) {
    concerns.push(
      `Talent development documentation at only ${talentDocumentationRate}% — incomplete progress records make it difficult to track children's development and demonstrate outcomes.`,
    );
  }

  if (creativeDocumentationRate < 60 && totalCreativeActivities > 0) {
    concerns.push(
      `Creative expression documentation at only ${creativeDocumentationRate}% — insufficient records mean the home cannot fully evidence the creative opportunities provided to children.`,
    );
  }

  if (autonomyRespectedRate < 60 && totalChildLedActivities > 0) {
    concerns.push(
      `Children's autonomy respected in only ${autonomyRespectedRate}% of child-led activities — this undermines the purpose of child-led activity and suggests staff may be over-directing children's choices.`,
    );
  }

  if (talentSessionCompletionRate < 60 && talentSessionsPlanned > 0) {
    concerns.push(
      `Talent programme session completion at only ${talentSessionCompletionRate}% — children are missing significant proportions of their planned talent development sessions, reducing the effectiveness of investment in their skills.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: HobbiesInterestsRecommendation[] = [];
  let rank = 0;

  if (hobbyParticipationRate < 40 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently ensure every child has access to at least one regular hobby activity — the home must evidence that all children have opportunities to pursue interests and develop skills as part of quality care provision.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
    });
  }

  if (interestExplorationRate < 40 && total_children > 0 && totalExplorations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently expand interest exploration opportunities for all children — offer regular taster sessions, community visits, and workshops to help every child discover what they enjoy.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (creativeExpressionRate < 40 && total_children > 0 && totalCreativeActivities > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently increase creative expression opportunities for all children — creative activities are essential for emotional processing, self-expression, and personal development.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
    });
  }

  if (childSatisfactionRate < 40 && satisfactionOpportunities > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review activity provision with children to understand why satisfaction is low — activities should be redesigned based on children's direct feedback about what they want and enjoy.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes and feelings",
    });
  }

  if (childChoiceRate < 40 && totalHobbies > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure children have genuine choice in selecting their hobbies — the child's voice must be central to activity planning. Implement a process where children identify their own interests and preferences.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes and feelings",
    });
  }

  if (autonomyRespectedRate < 60 && totalChildLedActivities > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review staff practice around child-led activities to ensure children's autonomy is genuinely respected — child-led means the child plans, chooses, and directs; staff should support rather than control.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes and feelings",
    });
  }

  if (hobbyAttendanceRate < 50 && hobbyPlannedTotal > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate and address barriers to hobby attendance — low attendance may indicate transport difficulties, scheduling conflicts, or hobbies that do not genuinely interest the child. Resolve with each child individually.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
    });
  }

  if (
    hobbyParticipationRate >= 40 &&
    hobbyParticipationRate < 80 &&
    total_children > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend hobby participation to all children — aim for 100% coverage to ensure every child benefits from regular, meaningful hobby activities that support their development.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
    });
  }

  if (
    interestExplorationRate >= 40 &&
    interestExplorationRate < 60 &&
    total_children > 0 &&
    totalExplorations > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase interest exploration opportunities for all children — broaden the range of taster sessions, community activities, and workshops to help children discover new passions.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (
    creativeExpressionRate >= 40 &&
    creativeExpressionRate < 60 &&
    total_children > 0 &&
    totalCreativeActivities > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase access to creative expression activities — ensure all children have regular opportunities for creative engagement across a range of art forms.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
    });
  }

  if (
    childLedRate < 50 &&
    total_children > 0 &&
    totalChildLedActivities > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Encourage more children to plan and lead their own activities — provide resources, support, and encouragement for children to take the initiative in organising their leisure time.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes and feelings",
    });
  }

  if (overdueHobbyReviews > 0 && activeHobbies > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all overdue hobby reviews — regular reviews ensure hobbies remain aligned with children's evolving interests and that participation continues to be beneficial.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
    });
  }

  if (overdueTalentReviews > 0 && activeTalentProgrammes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all overdue talent programme reviews — reviews ensure programmes remain appropriate, children are progressing, and investment in talent development is achieving outcomes.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
    });
  }

  if (talentSessionCompletionRate < 60 && talentSessionsPlanned > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve talent programme session completion — investigate why children are missing planned sessions and address barriers including transport, scheduling, and motivation.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
    });
  }

  if (
    childSatisfactionRate >= 40 &&
    childSatisfactionRate < 70 &&
    satisfactionOpportunities > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review activities with children to improve satisfaction — regularly seek feedback and adapt the activity programme to reflect what children genuinely want to do.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Children's views, wishes and feelings",
    });
  }

  if (
    hobbyAttendanceRate >= 50 &&
    hobbyAttendanceRate < 75 &&
    hobbyPlannedTotal > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Support improved hobby attendance — work with individual children to identify and resolve barriers to consistent participation in their chosen hobbies.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
    });
  }

  if (externalClubRate < 30 && totalHobbies > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase access to external clubs and community-based activities — children benefit from activities beyond the home that support social integration and normalised experiences.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (hobbyDocumentationRate < 60 && totalHobbies > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve hobby documentation — ensure hobby participation, attendance, and children's experiences are consistently recorded to evidence quality of care and support review processes.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
    });
  }

  if (explorationDocumentationRate < 60 && totalExplorations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve documentation of interest exploration activities — recording taster sessions and new experiences helps evidence the breadth of opportunities offered to children.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
    });
  }

  if (talentDocumentationRate < 60 && totalTalentProgrammes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve talent development progress documentation — tracking achievements, session attendance, and skill development provides evidence of investment in children's talents.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
    });
  }

  if (professionalInstructorRate < 50 && totalTalentProgrammes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase use of professional instructors in talent programmes — specialist coaching and tuition significantly enhances the quality of talent development and children's progression.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 6 — Quality and purpose of care",
    });
  }

  if (outputDisplayRate < 30 && totalCreativeActivities > 0 && outputProduced > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Display more of children's creative work within the home — showcasing creative output builds pride, self-esteem, and a sense of belonging.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Engaging parents and others",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: HobbiesInterestsInsight[] = [];

  // -- Critical insights --

  if (hobbyParticipationRate < 40 && total_children > 0) {
    insights.push({
      text: `Only ${hobbyParticipationRate}% of children participate in hobbies. Without access to regular hobby activities, children miss out on opportunities for skill development, enjoyment, social engagement, and the sense of achievement that comes from pursuing an interest. Ofsted expects evidence that children in residential care have rich, varied experiences that support their development under Reg 6.`,
      severity: "critical",
    });
  }

  if (interestExplorationRate < 40 && total_children > 0 && totalExplorations > 0) {
    insights.push({
      text: `Only ${interestExplorationRate}% of children have explored new interests. Limited exploration restricts children's ability to discover what they enjoy and develop a sense of identity through personal interests. The SCCIF expects children to have access to a range of enriching experiences that broaden their horizons.`,
      severity: "critical",
    });
  }

  if (creativeExpressionRate < 40 && total_children > 0 && totalCreativeActivities > 0) {
    insights.push({
      text: `Only ${creativeExpressionRate}% of children engage in creative expression. Creative activities serve as vital outlets for emotional processing, self-expression, and personal development — particularly important for children who may have experienced trauma. The lack of creative opportunities represents a significant gap in holistic care provision.`,
      severity: "critical",
    });
  }

  if (childSatisfactionRate < 40 && satisfactionOpportunities > 0) {
    insights.push({
      text: `Only ${childSatisfactionRate}% child satisfaction across hobby and interest activities. When children do not enjoy their activities, this suggests provision may be adult-directed rather than child-centred. Activities should reflect what children genuinely want to do — their voice must be central to planning under Reg 7.`,
      severity: "critical",
    });
  }

  if (childChoiceRate < 40 && totalHobbies > 0 && hobbyParticipationRate < 60) {
    insights.push({
      text: `Only ${childChoiceRate}% of hobbies are child-chosen alongside low participation of ${hobbyParticipationRate}%. The combination of limited choice and low participation suggests the home is not effectively engaging children in activity planning. When children choose their own hobbies, participation and enjoyment significantly increase.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    hobbyParticipationRate >= 40 &&
    hobbyParticipationRate < 80 &&
    total_children > 0
  ) {
    insights.push({
      text: `Hobby participation at ${hobbyParticipationRate}% — improving but some children still lack access to regular hobby activities. Each child without a hobby misses valuable opportunities for skill development, social connection, and personal enjoyment.`,
      severity: "warning",
    });
  }

  if (
    interestExplorationRate >= 40 &&
    interestExplorationRate < 60 &&
    total_children > 0 &&
    totalExplorations > 0
  ) {
    insights.push({
      text: `Interest exploration at ${interestExplorationRate}% — some children have limited access to taster sessions and new experiences. Broadening the range of exploration opportunities helps children discover hidden interests and develop a richer sense of identity.`,
      severity: "warning",
    });
  }

  if (
    creativeExpressionRate >= 40 &&
    creativeExpressionRate < 60 &&
    total_children > 0 &&
    totalCreativeActivities > 0
  ) {
    insights.push({
      text: `Creative expression at ${creativeExpressionRate}% — some children are not accessing creative activities. Creative expression supports emotional regulation and provides therapeutic benefits particularly valuable for looked-after children.`,
      severity: "warning",
    });
  }

  if (
    childSatisfactionRate >= 40 &&
    childSatisfactionRate < 70 &&
    satisfactionOpportunities > 0
  ) {
    insights.push({
      text: `Child satisfaction at ${childSatisfactionRate}% — a notable proportion of children do not report positive experiences. Regular feedback mechanisms and genuinely child-centred activity planning can significantly improve satisfaction.`,
      severity: "warning",
    });
  }

  if (
    childLedRate < 50 &&
    childLedRate >= 30 &&
    total_children > 0 &&
    totalChildLedActivities > 0
  ) {
    insights.push({
      text: `Child-led activity rate at ${childLedRate}% — fewer than half of children are initiating their own activities. Empowering children to plan and lead activities builds confidence, autonomy, and life skills.`,
      severity: "warning",
    });
  }

  if (overdueHobbyReviews > 0 && activeHobbies > 0) {
    insights.push({
      text: `${overdueHobbyReviews} hobby review${overdueHobbyReviews !== 1 ? "s" : ""} overdue. Children's interests change, and without timely reviews, hobbies may no longer reflect what the child wants to do, leading to disengagement.`,
      severity: "warning",
    });
  }

  if (overdueTalentReviews > 0 && activeTalentProgrammes > 0) {
    insights.push({
      text: `${overdueTalentReviews} talent programme review${overdueTalentReviews !== 1 ? "s" : ""} overdue. Without regular review, the home cannot confirm that talent programmes remain aligned with the child's aspirations and are delivering meaningful progression.`,
      severity: "warning",
    });
  }

  if (
    hobbyAttendanceRate >= 50 &&
    hobbyAttendanceRate < 75 &&
    hobbyPlannedTotal > 0
  ) {
    insights.push({
      text: `Hobby attendance at ${hobbyAttendanceRate}% — some children are missing planned sessions. Inconsistent attendance reduces the cumulative benefit of hobby activities and may indicate unresolved barriers.`,
      severity: "warning",
    });
  }

  if (talentSessionCompletionRate < 60 && talentSessionCompletionRate >= 30 && talentSessionsPlanned > 0) {
    insights.push({
      text: `Talent programme session completion at ${talentSessionCompletionRate}% — children are missing significant proportions of their planned sessions. This reduces the value of investment in talent development and may slow progression.`,
      severity: "warning",
    });
  }

  if (
    childChoiceRate >= 40 &&
    childChoiceRate < 60 &&
    totalHobbies > 0
  ) {
    insights.push({
      text: `Child choice in hobby selection at ${childChoiceRate}% — not all children are choosing their own hobbies. When hobbies are adult-selected, children may be less motivated and less likely to sustain engagement.`,
      severity: "warning",
    });
  }

  // Analysis of hobby categories
  const topHobbyCategories = Object.entries(hobbyCategoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  if (topHobbyCategories.length > 0 && totalHobbies >= 3) {
    const catStr = topHobbyCategories
      .map(([t, c]) => `${t.replace(/_/g, " ")} (${c})`)
      .join(", ");
    insights.push({
      text: `Hobby category profile: ${catStr}. Consider whether the range of hobbies reflects each child's individual interests and whether there are gaps in provision such as creative, physical, or technology-based activities.`,
      severity: "warning",
    });
  }

  // Analysis of creative expression types
  const topCreativeTypes = Object.entries(creativeTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topCreativeTypes.length > 0 && totalCreativeActivities >= 3) {
    const crStr = topCreativeTypes
      .map(([t, c]) => `${t.replace(/_/g, " ")} (${c})`)
      .join(", ");
    insights.push({
      text: `Creative activity types: ${crStr}. A diverse creative programme ensures all children can find forms of expression that resonate with them, including visual, performing, and literary arts.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (hobbies_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding hobbies and interests development — children have access to a rich programme of hobby activities, interest exploration, talent development, creative expression, and child-led activities. This is strong evidence of high-quality care that promotes children's personal development and enjoyment under Reg 6.",
      severity: "positive",
    });
  }

  if (
    hobbyParticipationRate >= 100 &&
    childChoiceRate >= 80 &&
    total_children > 0 &&
    totalHobbies > 0
  ) {
    insights.push({
      text: "Every child participates in hobby activities with the overwhelming majority choosing their own hobbies — the home excels at providing genuinely child-centred hobby provision where children's voices and preferences are at the heart of activity planning.",
      severity: "positive",
    });
  }

  if (
    interestExplorationRate >= 80 &&
    newExperienceRate >= 70 &&
    total_children > 0 &&
    totalExplorations > 0
  ) {
    insights.push({
      text: `${interestExplorationRate}% of children exploring new interests with ${newExperienceRate}% of explorations being genuinely new experiences — the home consistently broadens children's horizons and helps them discover interests they may never have encountered.`,
      severity: "positive",
    });
  }

  if (
    creativeExpressionRate >= 80 &&
    meets(creativeSatisfactionAvg, 4.0) &&
    total_children > 0 &&
    totalCreativeActivities > 0
  ) {
    insights.push({
      text: `${creativeExpressionRate}% creative expression participation with satisfaction averaging ${creativeSatisfactionAvg}/5 — children have rich access to creative activities that they genuinely enjoy, supporting emotional wellbeing and self-expression.`,
      severity: "positive",
    });
  }

  if (
    childLedRate >= 70 &&
    autonomyRespectedRate >= 90 &&
    total_children > 0 &&
    totalChildLedActivities > 0
  ) {
    insights.push({
      text: `${childLedRate}% of children lead their own activities with ${autonomyRespectedRate}% autonomy respected — the home empowers children to take genuine ownership of their leisure time, building confidence, independence, and life skills.`,
      severity: "positive",
    });
  }

  if (
    talentDevelopmentRate >= 60 &&
    externalRecognitionRate >= 30 &&
    total_children > 0 &&
    totalTalentProgrammes > 0
  ) {
    insights.push({
      text: `${talentDevelopmentRate}% of children in talent programmes with ${externalRecognitionRate}% achieving external recognition — the home invests meaningfully in nurturing children's talents and celebrates their achievements beyond the home setting.`,
      severity: "positive",
    });
  }

  if (
    childSatisfactionRate >= 90 &&
    satisfactionOpportunities > 0
  ) {
    insights.push({
      text: `${childSatisfactionRate}% child satisfaction across all hobby and interest activities — children overwhelmingly report positive experiences, providing strong evidence that the home delivers genuinely enjoyable and engaging activities that reflect children's wishes.`,
      severity: "positive",
    });
  }

  if (
    hobbyAttendanceRate >= 90 &&
    meets(hobbyEnjoymentAvg, 4.0) &&
    hobbyPlannedTotal > 0 &&
    totalHobbies > 0
  ) {
    insights.push({
      text: `${hobbyAttendanceRate}% hobby attendance with enjoyment averaging ${hobbyEnjoymentAvg}/5 — high attendance combined with strong enjoyment ratings demonstrates that children are genuinely committed to and benefit from their hobby activities.`,
      severity: "positive",
    });
  }

  if (
    externalClubRate >= 50 &&
    peerParticipationRate >= 60 &&
    totalHobbies > 0
  ) {
    insights.push({
      text: `${externalClubRate}% of hobbies involve external clubs and ${peerParticipationRate}% include peer participation — children's hobbies support community integration and positive social relationships, contributing to normalised life experiences.`,
      severity: "positive",
    });
  }

  if (
    therapeuticRate >= 40 &&
    meets(creativeSatisfactionAvg, 4.0) &&
    totalCreativeActivities > 0
  ) {
    insights.push({
      text: `${therapeuticRate}% of creative activities have therapeutic value with satisfaction averaging ${creativeSatisfactionAvg}/5 — the home effectively uses creative expression as both an enjoyable activity and a therapeutic tool for emotional processing.`,
      severity: "positive",
    });
  }

  if (
    uniqueHobbyCategories >= 5 &&
    uniqueCreativeTypes >= 4 &&
    totalHobbies > 0 &&
    totalCreativeActivities > 0
  ) {
    insights.push({
      text: `Hobbies span ${uniqueHobbyCategories} categories and creative activities cover ${uniqueCreativeTypes} forms of expression — the home provides a remarkably diverse activity programme that caters to a wide range of individual interests and creative talents.`,
      severity: "positive",
    });
  }

  if (
    meets(skillProgressionAvg, 4.0) &&
    meets(talentMotivationAvg, 4.0) &&
    totalHobbies > 0 &&
    totalTalentProgrammes > 0
  ) {
    insights.push({
      text: `Skill progression averages ${skillProgressionAvg}/5 with talent motivation at ${talentMotivationAvg}/5 — children are making strong progress in their hobbies and remain highly motivated in their talent development, indicating a well-supported and engaging programme.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (hobbies_rating === "outstanding") {
    headline =
      "Outstanding hobbies and interests development — children have rich access to hobby activities, interest exploration, talent development, creative expression, and child-led activities with high satisfaction.";
  } else if (hobbies_rating === "good") {
    headline = `Good hobbies and interests development — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (hobbies_rating === "adequate") {
    headline = `Adequate hobbies and interests development — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure all children have meaningful hobby and interest opportunities.`;
  } else {
    headline = `Hobbies and interests development is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children have access to enriching hobby and interest activities.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    hobbies_rating,
    hobbies_score: score,
    headline,
    total_hobbies: totalHobbies,
    hobby_participation_rate: hobbyParticipationRate,
    interest_exploration_rate: interestExplorationRate,
    talent_development_rate: talentDevelopmentRate,
    creative_expression_rate: creativeExpressionRate,
    child_led_rate: childLedRate,
    child_satisfaction_rate: childSatisfactionRate,
    hobby_enjoyment_avg: hobbyEnjoymentAvg,
    skill_progression_avg: skillProgressionAvg,
    exploration_breadth_avg: explorationBreadthAvg,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
