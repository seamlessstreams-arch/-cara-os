// ==============================================================================
// CORNERSTONE -- HOME RELIGIOUS & SPIRITUAL WELLBEING INTELLIGENCE ENGINE
// Monitors how well the home supports children's faith observance, spiritual
// development, religious dietary requirements, access to worship, and
// participation in cultural-religious celebrations.
// Pure deterministic engine -- no imports, no LLM, no external deps.
// CHR 2015 Reg 6 (Quality of care standard -- cultural, linguistic, religious),
// Reg 7 (Child's plan), SCCIF "Experiences and progress of children".
// Store keys: faithObservanceRecords, spiritualDevelopmentRecords,
//             religiousDietaryRecords, worshipAccessRecords,
//             celebrationParticipationRecords
// ==============================================================================

// -- Input Types --------------------------------------------------------------

export interface FaithObservanceRecordInput {
  id: string;
  child_id: string;
  faith_tradition: string;
  observance_type: "daily_prayer" | "weekly_service" | "fasting" | "scripture_study" | "meditation" | "ritual" | "other";
  date: string;
  supported: boolean;
  staff_facilitated: boolean;
  child_initiated: boolean;
  child_satisfaction: number; // 1-5
  barriers_encountered: string[];
  notes: string;
  created_at: string;
}

export interface SpiritualDevelopmentRecordInput {
  id: string;
  child_id: string;
  plan_in_place: boolean;
  plan_reviewed: boolean;
  last_review_date: string | null;
  goals_set: number;
  goals_progressed: number;
  mentor_assigned: boolean;
  mentor_type: "faith_leader" | "staff" | "volunteer" | "peer" | "none";
  sessions_planned: number;
  sessions_attended: number;
  child_voice_captured: boolean;
  outcomes_documented: boolean;
  created_at: string;
}

export interface ReligiousDietaryRecordInput {
  id: string;
  child_id: string;
  dietary_requirement: string; // e.g. halal, kosher, vegetarian-hindu, etc.
  requirement_documented: boolean;
  accommodation_provided: boolean;
  kitchen_staff_trained: boolean;
  meals_compliant: number;
  meals_total: number;
  child_satisfied: boolean;
  last_audit_date: string | null;
  issues_reported: number;
  issues_resolved: number;
  created_at: string;
}

export interface WorshipAccessRecordInput {
  id: string;
  child_id: string;
  worship_type: "mosque" | "church" | "temple" | "synagogue" | "gurdwara" | "meeting_house" | "home_worship" | "online" | "other";
  date: string;
  access_facilitated: boolean;
  transport_provided: boolean;
  staff_accompanied: boolean;
  child_chose_not_to_attend: boolean;
  barriers_encountered: string[];
  frequency_met: boolean;
  child_satisfaction: number; // 1-5
  created_at: string;
}

export interface CelebrationParticipationRecordInput {
  id: string;
  child_id: string;
  celebration_name: string;
  faith_tradition: string;
  date: string;
  participated: boolean;
  home_acknowledged: boolean;
  resources_provided: boolean;
  peers_involved: boolean;
  child_led: boolean;
  child_satisfaction: number; // 1-5
  educational_component: boolean;
  created_at: string;
}

export interface ReligiousSpiritualWellbeingInput {
  today: string;
  total_children: number;
  faith_observance_records: FaithObservanceRecordInput[];
  spiritual_development_records: SpiritualDevelopmentRecordInput[];
  religious_dietary_records: ReligiousDietaryRecordInput[];
  worship_access_records: WorshipAccessRecordInput[];
  celebration_participation_records: CelebrationParticipationRecordInput[];
}

// -- Output Types -------------------------------------------------------------

export type SpiritualWellbeingRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface SpiritualWellbeingInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface SpiritualWellbeingRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface ReligiousSpiritualWellbeingResult {
  spiritual_rating: SpiritualWellbeingRating;
  spiritual_score: number;
  headline: string;
  faith_support_coverage_rate: number;
  spiritual_development_rate: number;
  dietary_accommodation_rate: number;
  worship_access_rate: number;
  celebration_participation_rate: number;
  child_voice_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: SpiritualWellbeingRecommendation[];
  insights: SpiritualWellbeingInsight[];
}

// -- Helpers ------------------------------------------------------------------

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): SpiritualWellbeingRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// -- Empty Result Factory -----------------------------------------------------

function emptyResult(
  rating: SpiritualWellbeingRating,
  score: number,
  headline: string,
): ReligiousSpiritualWellbeingResult {
  return {
    spiritual_rating: rating,
    spiritual_score: score,
    headline,
    faith_support_coverage_rate: 0,
    spiritual_development_rate: 0,
    dietary_accommodation_rate: 0,
    worship_access_rate: 0,
    celebration_participation_rate: 0,
    child_voice_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// -- Main Compute -------------------------------------------------------------

export function computeReligiousSpiritualWellbeing(
  input: ReligiousSpiritualWellbeingInput,
): ReligiousSpiritualWellbeingResult {
  const {
    total_children,
    faith_observance_records,
    spiritual_development_records,
    religious_dietary_records,
    worship_access_records,
    celebration_participation_records,
  } = input;

  // -- Special case: all empty + 0 children -> insufficient_data ------------
  const allEmpty =
    faith_observance_records.length === 0 &&
    spiritual_development_records.length === 0 &&
    religious_dietary_records.length === 0 &&
    worship_access_records.length === 0 &&
    celebration_participation_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement -- insufficient data to assess religious and spiritual wellbeing.",
    );
  }

  // -- Special case: all empty + children > 0 -> inadequate -----------------
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No religious or spiritual wellbeing data recorded despite children on placement -- faith observance support, spiritual development, and cultural-religious provision require urgent attention.",
      ),
      concerns: [
        "No faith observance, spiritual development, dietary accommodation, worship access, or celebration participation records exist despite children being on placement -- the home cannot evidence support for children's religious and spiritual identities.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of faith observance support, spiritual development plans, religious dietary accommodation, worship access, and cultural-religious celebration participation to evidence the home's commitment to children's spiritual wellbeing.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 6 -- Quality of care (cultural, linguistic, religious)",
        },
        {
          rank: 2,
          recommendation:
            "Assess every child's religious and spiritual needs and ensure these are reflected in their care plan with documented support arrangements and regular reviews.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 7 -- Child's plan",
        },
      ],
      insights: [
        {
          text: "The complete absence of religious and spiritual wellbeing records means Ofsted cannot verify that children's faith identities are understood, respected, or supported. This represents a fundamental gap in Reg 6 compliance and the home's duty to nurture the whole child.",
          severity: "critical",
        },
      ],
    };
  }

  // -- Compute core metrics -------------------------------------------------

  // --- Faith observance support coverage ---
  const totalFaithRecords = faith_observance_records.length;
  const supportedFaithRecords = faith_observance_records.filter((r) => r.supported).length;
  const faithSupportCoverageRate = pct(supportedFaithRecords, totalFaithRecords);

  const uniqueChildrenWithFaith = new Set(
    faith_observance_records.map((r) => r.child_id),
  ).size;

  const staffFacilitated = faith_observance_records.filter((r) => r.staff_facilitated).length;
  const staffFacilitationRate = pct(staffFacilitated, totalFaithRecords);

  const faithSatisfactionSum = faith_observance_records.reduce(
    (sum, r) => sum + r.child_satisfaction, 0,
  );
  const faithSatisfactionAvg =
    totalFaithRecords > 0
      ? Math.round((faithSatisfactionSum / totalFaithRecords) * 100) / 100
      : 0;

  const faithBarriersTotal = faith_observance_records.filter(
    (r) => r.barriers_encountered.length > 0,
  ).length;
  const faithBarrierRate = pct(faithBarriersTotal, totalFaithRecords);

  // --- Spiritual development planning ---
  const totalSpiritualRecords = spiritual_development_records.length;
  const withPlan = spiritual_development_records.filter((r) => r.plan_in_place).length;
  const planRate = pct(withPlan, totalSpiritualRecords);

  const totalGoalsSet = spiritual_development_records.reduce(
    (sum, r) => sum + r.goals_set, 0,
  );
  const totalGoalsProgressed = spiritual_development_records.reduce(
    (sum, r) => sum + r.goals_progressed, 0,
  );
  const goalProgressRate = pct(totalGoalsProgressed, totalGoalsSet);

  const totalSessionsPlanned = spiritual_development_records.reduce(
    (sum, r) => sum + r.sessions_planned, 0,
  );
  const totalSessionsAttended = spiritual_development_records.reduce(
    (sum, r) => sum + r.sessions_attended, 0,
  );
  const sessionAttendanceRate = pct(totalSessionsAttended, totalSessionsPlanned);

  const spiritualDevelopmentRate =
    totalSpiritualRecords > 0
      ? Math.round((planRate + goalProgressRate + sessionAttendanceRate) / 3)
      : 0;

  const mentorAssigned = spiritual_development_records.filter((r) => r.mentor_assigned).length;
  const mentorRate = pct(mentorAssigned, totalSpiritualRecords);

  const spiritualVoiceCaptured = spiritual_development_records.filter(
    (r) => r.child_voice_captured,
  ).length;

  // --- Religious dietary accommodation ---
  const totalDietaryRecords = religious_dietary_records.length;
  const accommodated = religious_dietary_records.filter(
    (r) => r.accommodation_provided,
  ).length;
  const dietaryAccommodationRate = pct(accommodated, totalDietaryRecords);

  const totalMealsCompliant = religious_dietary_records.reduce(
    (sum, r) => sum + r.meals_compliant, 0,
  );
  const totalMeals = religious_dietary_records.reduce(
    (sum, r) => sum + r.meals_total, 0,
  );
  const mealComplianceRate = pct(totalMealsCompliant, totalMeals);

  const dietarySatisfied = religious_dietary_records.filter(
    (r) => r.child_satisfied,
  ).length;
  const dietarySatisfactionRate = pct(dietarySatisfied, totalDietaryRecords);

  const kitchenTrained = religious_dietary_records.filter(
    (r) => r.kitchen_staff_trained,
  ).length;
  const kitchenTrainingRate = pct(kitchenTrained, totalDietaryRecords);

  const totalDietaryIssues = religious_dietary_records.reduce(
    (sum, r) => sum + r.issues_reported, 0,
  );
  const totalDietaryIssuesResolved = religious_dietary_records.reduce(
    (sum, r) => sum + r.issues_resolved, 0,
  );
  const dietaryIssueResolutionRate = pct(totalDietaryIssuesResolved, totalDietaryIssues);

  // --- Worship access facilitation ---
  const totalWorshipRecords = worship_access_records.length;
  const facilitated = worship_access_records.filter(
    (r) => r.access_facilitated || r.child_chose_not_to_attend,
  ).length;
  const worshipAccessRate = pct(facilitated, totalWorshipRecords);

  const worshipFrequencyMet = worship_access_records.filter(
    (r) => r.frequency_met,
  ).length;
  const worshipFrequencyRate = pct(worshipFrequencyMet, totalWorshipRecords);

  const worshipSatisfactionSum = worship_access_records.reduce(
    (sum, r) => sum + r.child_satisfaction, 0,
  );
  const worshipSatisfactionAvg =
    totalWorshipRecords > 0
      ? Math.round((worshipSatisfactionSum / totalWorshipRecords) * 100) / 100
      : 0;

  const worshipBarriersTotal = worship_access_records.filter(
    (r) => r.barriers_encountered.length > 0,
  ).length;
  const worshipBarrierRate = pct(worshipBarriersTotal, totalWorshipRecords);

  const transportProvided = worship_access_records.filter(
    (r) => r.transport_provided,
  ).length;
  const transportRate = pct(transportProvided, totalWorshipRecords);

  // --- Celebration participation ---
  const totalCelebrationRecords = celebration_participation_records.length;
  const participated = celebration_participation_records.filter(
    (r) => r.participated,
  ).length;
  const celebrationParticipationRate = pct(participated, totalCelebrationRecords);

  const homeAcknowledged = celebration_participation_records.filter(
    (r) => r.home_acknowledged,
  ).length;
  const homeAcknowledgementRate = pct(homeAcknowledged, totalCelebrationRecords);

  const resourcesProvided = celebration_participation_records.filter(
    (r) => r.resources_provided,
  ).length;
  const resourceRate = pct(resourcesProvided, totalCelebrationRecords);

  const childLed = celebration_participation_records.filter(
    (r) => r.child_led,
  ).length;
  const childLedRate = pct(childLed, totalCelebrationRecords);

  const celebrationSatisfactionSum = celebration_participation_records.reduce(
    (sum, r) => sum + r.child_satisfaction, 0,
  );
  const celebrationSatisfactionAvg =
    totalCelebrationRecords > 0
      ? Math.round((celebrationSatisfactionSum / totalCelebrationRecords) * 100) / 100
      : 0;

  const educationalCelebrations = celebration_participation_records.filter(
    (r) => r.educational_component,
  ).length;
  const educationalRate = pct(educationalCelebrations, totalCelebrationRecords);

  const peersInvolved = celebration_participation_records.filter(
    (r) => r.peers_involved,
  ).length;
  const peerInclusionRate = pct(peersInvolved, totalCelebrationRecords);

  // --- Child voice composite ---
  const childInitiatedFaith = faith_observance_records.filter(
    (r) => r.child_initiated,
  ).length;
  const voiceDenominator =
    totalFaithRecords + totalSpiritualRecords;
  const voiceNumerator =
    childInitiatedFaith + spiritualVoiceCaptured;
  const childVoiceRate = pct(voiceNumerator, voiceDenominator);

  // -- Scoring: base 52 ----------------------------------------------------

  let score = 52;

  // --- Bonus 1: faithSupportCoverageRate (>=90: +4, >=70: +2) ---
  if (faithSupportCoverageRate >= 90) score += 4;
  else if (faithSupportCoverageRate >= 70) score += 2;

  // --- Bonus 2: spiritualDevelopmentRate (>=80: +3, >=60: +1) ---
  if (spiritualDevelopmentRate >= 80) score += 3;
  else if (spiritualDevelopmentRate >= 60) score += 1;

  // --- Bonus 3: dietaryAccommodationRate (>=100: +4, >=80: +2) ---
  if (dietaryAccommodationRate >= 100) score += 4;
  else if (dietaryAccommodationRate >= 80) score += 2;

  // --- Bonus 4: worshipAccessRate (>=90: +3, >=70: +1) ---
  if (worshipAccessRate >= 90) score += 3;
  else if (worshipAccessRate >= 70) score += 1;

  // --- Bonus 5: celebrationParticipationRate (>=90: +3, >=70: +1) ---
  if (celebrationParticipationRate >= 90) score += 3;
  else if (celebrationParticipationRate >= 70) score += 1;

  // --- Bonus 6: childVoiceRate (>=80: +3, >=60: +1) ---
  if (childVoiceRate >= 80) score += 3;
  else if (childVoiceRate >= 60) score += 1;

  // --- Bonus 7: mealComplianceRate (>=95: +3, >=80: +1) ---
  if (mealComplianceRate >= 95) score += 3;
  else if (mealComplianceRate >= 80) score += 1;

  // --- Bonus 8: homeAcknowledgementRate (>=90: +3, >=70: +1) ---
  if (homeAcknowledgementRate >= 90) score += 3;
  else if (homeAcknowledgementRate >= 70) score += 1;

  // --- Bonus 9: mentorRate (>=80: +2, >=50: +1) ---
  if (mentorRate >= 80) score += 2;
  else if (mentorRate >= 50) score += 1;

  // -- Penalties (4 with guards) -------------------------------------------

  // faithSupportCoverageRate < 50 -> -5
  if (faithSupportCoverageRate < 50 && totalFaithRecords > 0) score -= 5;

  // dietaryAccommodationRate < 50 -> -5
  if (dietaryAccommodationRate < 50 && totalDietaryRecords > 0) score -= 5;

  // worshipAccessRate < 50 -> -4
  if (worshipAccessRate < 50 && totalWorshipRecords > 0) score -= 4;

  // celebrationParticipationRate < 30 -> -4
  if (celebrationParticipationRate < 30 && totalCelebrationRecords > 0) score -= 4;

  score = clamp(score, 0, 100);

  const spiritual_rating = toRating(score);

  // -- Strengths ------------------------------------------------------------

  const strengths: string[] = [];

  if (faithSupportCoverageRate >= 90 && totalFaithRecords > 0) {
    strengths.push(
      `${faithSupportCoverageRate}% of faith observance requests supported -- the home demonstrates consistent commitment to facilitating children's religious practices.`,
    );
  } else if (faithSupportCoverageRate >= 70 && totalFaithRecords > 0) {
    strengths.push(
      `${faithSupportCoverageRate}% faith observance support rate -- most children's faith practices are being actively facilitated.`,
    );
  }

  if (staffFacilitationRate >= 80 && totalFaithRecords > 0) {
    strengths.push(
      `Staff actively facilitate ${staffFacilitationRate}% of faith observance activities -- staff engagement with children's spiritual needs is strong.`,
    );
  }

  if (faithSatisfactionAvg >= 4.0 && totalFaithRecords > 0) {
    strengths.push(
      `Children's satisfaction with faith support averages ${faithSatisfactionAvg}/5 -- children feel their spiritual needs are well understood and met.`,
    );
  }

  if (spiritualDevelopmentRate >= 80 && totalSpiritualRecords > 0) {
    strengths.push(
      `Spiritual development rate at ${spiritualDevelopmentRate}% -- plans are in place, goals are progressing, and sessions are well attended.`,
    );
  } else if (spiritualDevelopmentRate >= 60 && totalSpiritualRecords > 0) {
    strengths.push(
      `Spiritual development rate at ${spiritualDevelopmentRate}% -- good progress in spiritual development planning and delivery.`,
    );
  }

  if (goalProgressRate >= 80 && totalGoalsSet > 0) {
    strengths.push(
      `${goalProgressRate}% of spiritual development goals progressed -- children are making meaningful progress in their spiritual growth.`,
    );
  }

  if (mentorRate >= 80 && totalSpiritualRecords > 0) {
    strengths.push(
      `${mentorRate}% of children have an assigned spiritual mentor -- strong mentoring provision supporting children's spiritual journeys.`,
    );
  }

  if (dietaryAccommodationRate >= 100 && totalDietaryRecords > 0) {
    strengths.push(
      "Every child's religious dietary requirement is accommodated -- the home demonstrates full commitment to meeting children's faith-based nutritional needs.",
    );
  } else if (dietaryAccommodationRate >= 80 && totalDietaryRecords > 0) {
    strengths.push(
      `${dietaryAccommodationRate}% dietary accommodation rate -- the vast majority of religious dietary needs are being met.`,
    );
  }

  if (mealComplianceRate >= 95 && totalMeals > 0) {
    strengths.push(
      `${mealComplianceRate}% of meals are compliant with religious dietary requirements -- excellent kitchen compliance.`,
    );
  } else if (mealComplianceRate >= 80 && totalMeals > 0) {
    strengths.push(
      `${mealComplianceRate}% meal compliance rate -- good adherence to religious dietary standards.`,
    );
  }

  if (kitchenTrainingRate >= 90 && totalDietaryRecords > 0) {
    strengths.push(
      `Kitchen staff trained in ${kitchenTrainingRate}% of religious dietary cases -- staff are equipped to meet children's faith-based nutritional needs.`,
    );
  }

  if (worshipAccessRate >= 90 && totalWorshipRecords > 0) {
    strengths.push(
      `${worshipAccessRate}% worship access facilitation rate -- children can attend their place of worship or choose not to attend, with both choices respected.`,
    );
  } else if (worshipAccessRate >= 70 && totalWorshipRecords > 0) {
    strengths.push(
      `${worshipAccessRate}% worship access rate -- most children's worship needs are facilitated.`,
    );
  }

  if (worshipFrequencyRate >= 90 && totalWorshipRecords > 0) {
    strengths.push(
      `Worship frequency expectations met in ${worshipFrequencyRate}% of cases -- children can worship as often as their faith requires.`,
    );
  }

  if (worshipSatisfactionAvg >= 4.0 && totalWorshipRecords > 0) {
    strengths.push(
      `Children's satisfaction with worship access averages ${worshipSatisfactionAvg}/5 -- children feel well supported in attending their place of worship.`,
    );
  }

  if (celebrationParticipationRate >= 90 && totalCelebrationRecords > 0) {
    strengths.push(
      `${celebrationParticipationRate}% celebration participation rate -- children are actively involved in cultural-religious celebrations.`,
    );
  } else if (celebrationParticipationRate >= 70 && totalCelebrationRecords > 0) {
    strengths.push(
      `${celebrationParticipationRate}% celebration participation rate -- good levels of engagement with cultural-religious celebrations.`,
    );
  }

  if (homeAcknowledgementRate >= 90 && totalCelebrationRecords > 0) {
    strengths.push(
      `The home acknowledges ${homeAcknowledgementRate}% of cultural-religious celebrations -- children's faith traditions are visibly respected and honoured.`,
    );
  }

  if (childLedRate >= 50 && totalCelebrationRecords > 0) {
    strengths.push(
      `${childLedRate}% of celebrations are child-led -- children are empowered to share and lead their own faith traditions.`,
    );
  }

  if (peerInclusionRate >= 70 && totalCelebrationRecords > 0) {
    strengths.push(
      `Peers involved in ${peerInclusionRate}% of celebrations -- the home fosters mutual respect and understanding between children of different faith backgrounds.`,
    );
  }

  if (educationalRate >= 60 && totalCelebrationRecords > 0) {
    strengths.push(
      `${educationalRate}% of celebrations include an educational component -- the home uses celebrations as opportunities for learning and cultural awareness.`,
    );
  }

  if (childVoiceRate >= 80 && voiceDenominator > 0) {
    strengths.push(
      `Child voice captured in ${childVoiceRate}% of spiritual and faith contexts -- children's views genuinely shape their religious and spiritual care.`,
    );
  } else if (childVoiceRate >= 60 && voiceDenominator > 0) {
    strengths.push(
      `Child voice captured in ${childVoiceRate}% of spiritual and faith contexts -- good practice in consulting children about their spiritual needs.`,
    );
  }

  if (dietaryIssueResolutionRate >= 90 && totalDietaryIssues > 0) {
    strengths.push(
      `${dietaryIssueResolutionRate}% of dietary issues resolved -- the home responds effectively when religious dietary needs are not met.`,
    );
  }

  // -- Concerns -------------------------------------------------------------

  const concerns: string[] = [];

  if (faithSupportCoverageRate < 50 && totalFaithRecords > 0) {
    concerns.push(
      `Only ${faithSupportCoverageRate}% of faith observance requests supported -- the majority of children's religious practices are not being facilitated, denying them a fundamental aspect of their identity.`,
    );
  } else if (faithSupportCoverageRate < 70 && faithSupportCoverageRate >= 50 && totalFaithRecords > 0) {
    concerns.push(
      `Faith observance support at ${faithSupportCoverageRate}% -- some children's religious practices are not being adequately facilitated.`,
    );
  }

  if (faithBarrierRate >= 30 && totalFaithRecords > 0) {
    concerns.push(
      `Barriers encountered in ${faithBarrierRate}% of faith observance activities -- persistent obstacles are preventing children from practising their faith freely.`,
    );
  }

  if (faithSatisfactionAvg < 3.0 && totalFaithRecords > 0) {
    concerns.push(
      `Children's satisfaction with faith support averages only ${faithSatisfactionAvg}/5 -- children do not feel their spiritual needs are being met.`,
    );
  }

  if (spiritualDevelopmentRate < 50 && totalSpiritualRecords > 0) {
    concerns.push(
      `Spiritual development rate at only ${spiritualDevelopmentRate}% -- plans, goals, and sessions are not adequately supporting children's spiritual growth.`,
    );
  } else if (spiritualDevelopmentRate < 60 && spiritualDevelopmentRate >= 50 && totalSpiritualRecords > 0) {
    concerns.push(
      `Spiritual development rate at ${spiritualDevelopmentRate}% -- spiritual growth planning and delivery need strengthening.`,
    );
  }

  if (goalProgressRate < 50 && totalGoalsSet > 0) {
    concerns.push(
      `Only ${goalProgressRate}% of spiritual development goals progressed -- children are not making sufficient progress in their spiritual growth.`,
    );
  }

  if (planRate < 50 && totalSpiritualRecords > 0) {
    concerns.push(
      `Only ${planRate}% of children have a spiritual development plan in place -- spiritual needs are not being formally assessed and planned for.`,
    );
  }

  if (dietaryAccommodationRate < 50 && totalDietaryRecords > 0) {
    concerns.push(
      `Only ${dietaryAccommodationRate}% of religious dietary requirements accommodated -- the majority of children's faith-based nutritional needs are not being met, which is a fundamental failure of care.`,
    );
  } else if (dietaryAccommodationRate < 80 && dietaryAccommodationRate >= 50 && totalDietaryRecords > 0) {
    concerns.push(
      `Dietary accommodation rate at ${dietaryAccommodationRate}% -- some children's religious dietary needs are not being met.`,
    );
  }

  if (mealComplianceRate < 80 && totalMeals > 0) {
    concerns.push(
      `Only ${mealComplianceRate}% of meals compliant with religious dietary requirements -- children are being served food that does not meet their faith-based needs.`,
    );
  }

  if (kitchenTrainingRate < 70 && totalDietaryRecords > 0) {
    concerns.push(
      `Kitchen staff trained in only ${kitchenTrainingRate}% of religious dietary cases -- insufficient training increases the risk of dietary non-compliance.`,
    );
  }

  if (dietarySatisfactionRate < 50 && totalDietaryRecords > 0) {
    concerns.push(
      `Only ${dietarySatisfactionRate}% of children satisfied with dietary accommodation -- children feel their religious dietary needs are not adequately met.`,
    );
  }

  if (worshipAccessRate < 50 && totalWorshipRecords > 0) {
    concerns.push(
      `Only ${worshipAccessRate}% worship access facilitation rate -- the majority of children are being denied access to their place of worship.`,
    );
  } else if (worshipAccessRate < 70 && worshipAccessRate >= 50 && totalWorshipRecords > 0) {
    concerns.push(
      `Worship access at ${worshipAccessRate}% -- not all children can attend their place of worship as their faith requires.`,
    );
  }

  if (worshipBarrierRate >= 30 && totalWorshipRecords > 0) {
    concerns.push(
      `Barriers encountered in ${worshipBarrierRate}% of worship access attempts -- transport, staffing, or other obstacles are preventing children from worshipping.`,
    );
  }

  if (worshipSatisfactionAvg < 3.0 && totalWorshipRecords > 0) {
    concerns.push(
      `Children's satisfaction with worship access averages only ${worshipSatisfactionAvg}/5 -- children are not satisfied with how their worship needs are facilitated.`,
    );
  }

  if (celebrationParticipationRate < 30 && totalCelebrationRecords > 0) {
    concerns.push(
      `Only ${celebrationParticipationRate}% celebration participation -- children are largely excluded from cultural-religious celebrations, denying them connection to their heritage.`,
    );
  } else if (celebrationParticipationRate < 70 && celebrationParticipationRate >= 30 && totalCelebrationRecords > 0) {
    concerns.push(
      `Celebration participation at ${celebrationParticipationRate}% -- not all children are engaging in cultural-religious celebrations relevant to their identity.`,
    );
  }

  if (homeAcknowledgementRate < 50 && totalCelebrationRecords > 0) {
    concerns.push(
      `The home acknowledges only ${homeAcknowledgementRate}% of cultural-religious celebrations -- children's faith traditions are not being visibly respected.`,
    );
  }

  if (resourceRate < 50 && totalCelebrationRecords > 0) {
    concerns.push(
      `Resources provided for only ${resourceRate}% of celebrations -- the home is not investing in enabling children to celebrate their faith traditions properly.`,
    );
  }

  if (childVoiceRate < 50 && voiceDenominator > 0) {
    concerns.push(
      `Child voice captured in only ${childVoiceRate}% of spiritual and faith contexts -- children's views are not sufficiently shaping their religious and spiritual care.`,
    );
  } else if (childVoiceRate < 60 && childVoiceRate >= 50 && voiceDenominator > 0) {
    concerns.push(
      `Child voice rate at ${childVoiceRate}% -- children's spiritual views need to be more consistently captured and acted upon.`,
    );
  }

  if (totalFaithRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No faith observance records despite children being on placement -- the home may not be assessing or recording children's religious needs and how they are being met.",
    );
  }

  if (totalDietaryRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No religious dietary records -- the home has not documented whether any children have faith-based dietary requirements or how these are being accommodated.",
    );
  }

  // -- Recommendations ------------------------------------------------------

  const recommendations: SpiritualWellbeingRecommendation[] = [];
  let rank = 0;

  if (faithSupportCoverageRate < 50 && totalFaithRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review and address all unsupported faith observance requests -- every child has a right to practise their faith and the home must actively facilitate this. Identify and remove barriers to religious observance.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 6 -- Quality of care (cultural, linguistic, religious)",
    });
  }

  if (dietaryAccommodationRate < 50 && totalDietaryRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately ensure all children's religious dietary requirements are accommodated -- failing to provide appropriate food is a basic care failure. Train kitchen staff and audit meal provision against documented requirements.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 6 -- Quality of care",
    });
  }

  if (worshipAccessRate < 50 && totalWorshipRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every child can access their place of worship -- arrange transport, staffing, and scheduling to remove barriers. Document where children choose not to attend to distinguish choice from denial of access.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 6 -- Quality of care (cultural, linguistic, religious)",
    });
  }

  if (celebrationParticipationRate < 30 && totalCelebrationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review why children are not participating in cultural-religious celebrations and develop a calendar of celebrations relevant to each child's faith tradition. Provide resources and encourage child-led celebration planning.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 6 -- Quality of care",
    });
  }

  if (childVoiceRate < 50 && voiceDenominator > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Embed child voice in all spiritual and faith decisions -- use regular consultations, satisfaction surveys, and keywork sessions to understand each child's spiritual wishes and preferences.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (planRate < 50 && totalSpiritualRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop spiritual development plans for all children that reflect their individual faith backgrounds, goals, and preferences. Review plans at least termly.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 -- Child's plan",
    });
  }

  if (mealComplianceRate < 80 && totalMeals > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Audit meal provision against documented religious dietary requirements and implement corrective action -- every meal should comply with children's faith-based dietary needs.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 -- Quality of care",
    });
  }

  if (kitchenTrainingRate < 70 && totalDietaryRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Provide training for kitchen staff on all religious dietary requirements present in the home -- training should cover halal, kosher, and other faith-based food preparation standards.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 -- Quality of care",
    });
  }

  if (mentorRate < 50 && totalSpiritualRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Assign spiritual mentors for all children who would benefit -- connect with local faith leaders, chaplaincy services, or trained staff to provide regular spiritual guidance.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 -- Child's plan",
    });
  }

  if (worshipBarrierRate >= 30 && totalWorshipRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct a barriers-to-worship analysis and develop an action plan to resolve transport, staffing, and scheduling issues that prevent children from accessing worship.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 -- Quality of care (cultural, linguistic, religious)",
    });
  }

  if (faithSupportCoverageRate >= 50 && faithSupportCoverageRate < 70 && totalFaithRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve faith observance support coverage to at least 70% -- review unsupported requests and address gaps in staff awareness and resource availability.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 -- Quality of care (cultural, linguistic, religious)",
    });
  }

  if (homeAcknowledgementRate < 50 && totalCelebrationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Create a cultural-religious celebration calendar displayed in the home and ensure all children's significant dates are acknowledged, resourced, and celebrated.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 -- Quality of care",
    });
  }

  if (dietaryAccommodationRate >= 50 && dietaryAccommodationRate < 80 && totalDietaryRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase dietary accommodation to at least 80% -- review unaccommodated requirements and ensure supply chains support all faith-based dietary needs.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 6 -- Quality of care",
    });
  }

  if (worshipAccessRate >= 50 && worshipAccessRate < 70 && totalWorshipRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve worship access facilitation to at least 70% -- ensure staffing rotas and transport arrangements prioritise children's worship needs.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 6 -- Quality of care (cultural, linguistic, religious)",
    });
  }

  if (celebrationParticipationRate >= 30 && celebrationParticipationRate < 70 && totalCelebrationRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop creative, child-led approaches to celebration participation -- involve children in planning celebrations and consider peer involvement to build mutual understanding.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 6 -- Quality of care",
    });
  }

  if (totalFaithRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement faith observance assessments for every child and begin recording how each child's religious practices are being supported or why support is not required.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 -- Quality of care (cultural, linguistic, religious)",
    });
  }

  if (totalDietaryRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Assess and document every child's religious dietary requirements -- even where a child has no faith-based dietary needs, this should be recorded as evidence of assessment.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 6 -- Quality of care",
    });
  }

  // -- Insights -------------------------------------------------------------

  const insights: SpiritualWellbeingInsight[] = [];

  // --- Critical insights ---

  if (faithSupportCoverageRate < 50 && totalFaithRecords > 0) {
    insights.push({
      text: `Only ${faithSupportCoverageRate}% of faith observance requests supported. Ofsted will view the failure to facilitate children's religious practices as evidence that the home does not respect or nurture children's identities -- a direct failure under Reg 6.`,
      severity: "critical",
    });
  }

  if (dietaryAccommodationRate < 50 && totalDietaryRecords > 0) {
    insights.push({
      text: `Only ${dietaryAccommodationRate}% of religious dietary requirements accommodated. Failing to provide food that meets children's faith-based needs is a fundamental care failure that Ofsted will view as both a Reg 6 breach and a safeguarding concern.`,
      severity: "critical",
    });
  }

  if (worshipAccessRate < 50 && totalWorshipRecords > 0) {
    insights.push({
      text: `Only ${worshipAccessRate}% worship access facilitation rate. Denying children access to their place of worship undermines their religious identity and contravenes the home's duty under Reg 6 to support children's cultural, linguistic, and religious needs.`,
      severity: "critical",
    });
  }

  if (celebrationParticipationRate < 30 && totalCelebrationRecords > 0) {
    insights.push({
      text: `Celebration participation at only ${celebrationParticipationRate}%. Children are largely excluded from cultural-religious celebrations, which denies them connection to their heritage and identity. Ofsted expects homes to actively celebrate and respect diverse faith traditions.`,
      severity: "critical",
    });
  }

  if (totalFaithRecords === 0 && totalDietaryRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No faith observance or dietary records despite children being on placement. Ofsted may interpret the absence of records as evidence that children's religious identities have not been assessed, understood, or supported -- this is a significant omission under Reg 6.",
      severity: "critical",
    });
  }

  // --- Warning insights ---

  if (faithSupportCoverageRate >= 50 && faithSupportCoverageRate < 70 && totalFaithRecords > 0) {
    insights.push({
      text: `Faith observance support at ${faithSupportCoverageRate}% -- improving but some children's religious practices are not being facilitated. Each unsupported request represents a missed opportunity to nurture a child's identity.`,
      severity: "warning",
    });
  }

  if (spiritualDevelopmentRate >= 50 && spiritualDevelopmentRate < 80 && totalSpiritualRecords > 0) {
    insights.push({
      text: `Spiritual development rate at ${spiritualDevelopmentRate}% -- plans and goals are partially in place but not yet consistently driving spiritual growth for all children.`,
      severity: "warning",
    });
  }

  if (dietaryAccommodationRate >= 50 && dietaryAccommodationRate < 80 && totalDietaryRecords > 0) {
    insights.push({
      text: `Dietary accommodation at ${dietaryAccommodationRate}% -- while improving, some children's faith-based nutritional needs are not being met. Every unaccommodated requirement risks harm to a child's wellbeing and identity.`,
      severity: "warning",
    });
  }

  if (worshipAccessRate >= 50 && worshipAccessRate < 70 && totalWorshipRecords > 0) {
    insights.push({
      text: `Worship access at ${worshipAccessRate}% -- some children cannot attend their place of worship as often as their faith requires. The home should review transport and staffing to remove barriers.`,
      severity: "warning",
    });
  }

  if (celebrationParticipationRate >= 30 && celebrationParticipationRate < 70 && totalCelebrationRecords > 0) {
    insights.push({
      text: `Celebration participation at ${celebrationParticipationRate}% -- some children are missing out on cultural-religious celebrations. Consider whether the home's approach to celebrations is sufficiently inclusive and child-centred.`,
      severity: "warning",
    });
  }

  if (childVoiceRate >= 50 && childVoiceRate < 80 && voiceDenominator > 0) {
    insights.push({
      text: `Child voice captured in ${childVoiceRate}% of spiritual and faith contexts -- while some consultation is happening, children's views need to be more consistently shaping their religious and spiritual care.`,
      severity: "warning",
    });
  }

  if (mealComplianceRate >= 80 && mealComplianceRate < 95 && totalMeals > 0) {
    insights.push({
      text: `Meal compliance at ${mealComplianceRate}% -- generally good but some meals do not meet religious dietary requirements. Even occasional non-compliance can undermine a child's trust and sense of being respected.`,
      severity: "warning",
    });
  }

  if (worshipBarrierRate >= 30 && totalWorshipRecords > 0) {
    insights.push({
      text: `Barriers encountered in ${worshipBarrierRate}% of worship access attempts -- persistent barriers suggest systemic issues with transport, staffing, or scheduling that need targeted resolution.`,
      severity: "warning",
    });
  }

  if (faithBarrierRate >= 30 && totalFaithRecords > 0) {
    insights.push({
      text: `Barriers encountered in ${faithBarrierRate}% of faith observance activities -- recurring obstacles to religious practice need to be identified and systematically addressed.`,
      severity: "warning",
    });
  }

  // --- Diversity insight ---
  const faithTraditions = new Set(
    faith_observance_records.map((r) => r.faith_tradition).filter((t) => t),
  );
  const celebrationTraditions = new Set(
    celebration_participation_records.map((r) => r.faith_tradition).filter((t) => t),
  );
  const allTraditions = new Set([...faithTraditions, ...celebrationTraditions]);
  if (allTraditions.size >= 3) {
    insights.push({
      text: `The home supports children from ${allTraditions.size} distinct faith traditions -- this diversity requires ongoing staff training, resource investment, and cultural sensitivity to ensure every child's spiritual identity is equally valued and supported.`,
      severity: "warning",
    });
  }

  // --- Positive insights ---

  if (spiritual_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding religious and spiritual wellbeing support -- children's faith identities are understood, respected, and actively nurtured across all domains. This is strong evidence for Reg 6 compliance and holistic, child-centred care.",
      severity: "positive",
    });
  }

  if (faithSupportCoverageRate >= 90 && dietaryAccommodationRate >= 90 && totalFaithRecords > 0 && totalDietaryRecords > 0) {
    insights.push({
      text: `Faith observance support at ${faithSupportCoverageRate}% and dietary accommodation at ${dietaryAccommodationRate}% -- the home provides comprehensive support for children's religious practices and faith-based dietary needs. Ofsted will recognise this as evidence of genuinely personalised care.`,
      severity: "positive",
    });
  }

  if (worshipAccessRate >= 90 && worshipSatisfactionAvg >= 4.0 && totalWorshipRecords > 0) {
    insights.push({
      text: `${worshipAccessRate}% worship access with child satisfaction averaging ${worshipSatisfactionAvg}/5 -- children can worship freely and feel well supported in doing so. This demonstrates the home's commitment to religious freedom and Reg 6 compliance.`,
      severity: "positive",
    });
  }

  if (celebrationParticipationRate >= 90 && homeAcknowledgementRate >= 90 && totalCelebrationRecords > 0) {
    insights.push({
      text: `${celebrationParticipationRate}% celebration participation with ${homeAcknowledgementRate}% home acknowledgement -- cultural-religious celebrations are embraced as a valued part of home life. This fosters belonging, identity, and mutual respect.`,
      severity: "positive",
    });
  }

  if (childVoiceRate >= 80 && voiceDenominator > 0) {
    insights.push({
      text: `Child voice captured in ${childVoiceRate}% of spiritual and faith contexts -- children's religious and spiritual care is genuinely shaped by their own wishes and preferences. This is exemplary practice in respecting children's autonomy.`,
      severity: "positive",
    });
  }

  if (goalProgressRate >= 80 && mentorRate >= 80 && totalSpiritualRecords > 0 && totalGoalsSet > 0) {
    insights.push({
      text: `${goalProgressRate}% spiritual goal progress with ${mentorRate}% mentor coverage -- the home invests in structured spiritual development with dedicated mentoring. Children are making meaningful progress in their spiritual journeys.`,
      severity: "positive",
    });
  }

  if (dietaryIssueResolutionRate >= 90 && totalDietaryIssues > 0) {
    insights.push({
      text: `${dietaryIssueResolutionRate}% of religious dietary issues resolved -- the home responds promptly and effectively when dietary accommodation falls short. This demonstrates accountability and continuous improvement.`,
      severity: "positive",
    });
  }

  if (educationalRate >= 60 && peerInclusionRate >= 70 && totalCelebrationRecords > 0) {
    insights.push({
      text: `${educationalRate}% of celebrations include educational components with ${peerInclusionRate}% peer involvement -- celebrations are used as opportunities for learning, cultural exchange, and building mutual understanding between children of different faith backgrounds.`,
      severity: "positive",
    });
  }

  // -- Headline -------------------------------------------------------------

  let headline: string;

  if (spiritual_rating === "outstanding") {
    headline =
      "Outstanding religious and spiritual wellbeing support -- children's faith identities are understood, respected, and actively nurtured across all domains.";
  } else if (spiritual_rating === "good") {
    headline = `Good religious and spiritual wellbeing support -- ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (spiritual_rating === "adequate") {
    headline = `Adequate religious and spiritual wellbeing support -- ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's faith and spiritual needs are fully met.`;
  } else {
    headline = `Religious and spiritual wellbeing support is inadequate -- ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's faith identities are respected and nurtured.`;
  }

  // -- Return ---------------------------------------------------------------

  return {
    spiritual_rating,
    spiritual_score: score,
    headline,
    faith_support_coverage_rate: faithSupportCoverageRate,
    spiritual_development_rate: spiritualDevelopmentRate,
    dietary_accommodation_rate: dietaryAccommodationRate,
    worship_access_rate: worshipAccessRate,
    celebration_participation_rate: celebrationParticipationRate,
    child_voice_rate: childVoiceRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
