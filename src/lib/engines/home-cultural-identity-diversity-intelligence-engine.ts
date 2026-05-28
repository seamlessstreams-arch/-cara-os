// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME CULTURAL IDENTITY & DIVERSITY INTELLIGENCE ENGINE
// Monitors whether each child's cultural, religious, ethnic, and identity needs
// are being actively supported. Tracks cultural identity plans, religious/cultural
// mentoring, cultural visits, diversity calendar participation, and identity
// documentation.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Positive identity), Reg 7 (Individual child's plan).
// SCCIF: Identity outcomes, "Experiences and progress of children".
// Store keys: culturalIdentityPlans, culturalReligiousMentors, culturalVisits,
//             diversityCalendarEvents, personalPassports
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface CulturalIdentityPlanInput {
  id: string;
  child_id: string;
  plan_date: string;
  ethnicity_documented: boolean;
  religion_documented: boolean;
  language_needs_documented: boolean;
  identity_goals_set: boolean;
  child_voice_captured: boolean;
  reviewed: boolean;
  review_date: string;
  next_review_date: string;
  active: boolean;
  life_story_work_active: boolean;
  created_at: string;
}

export interface CulturalReligiousMentorInput {
  id: string;
  child_id: string;
  mentor_name: string;
  mentor_type: "cultural" | "religious" | "community" | "elder";
  start_date: string;
  active: boolean;
  meetings_held: number;
  last_meeting_date: string;
  created_at: string;
}

export interface CulturalVisitInput {
  id: string;
  child_id: string;
  visit_date: string;
  visit_type:
    | "cultural_site"
    | "religious_service"
    | "community_event"
    | "heritage_activity"
    | "food_culture";
  description: string;
  child_feedback_positive: boolean;
  staff_accompanied: boolean;
  created_at: string;
}

export interface DiversityCalendarEventInput {
  id: string;
  event_name: string;
  event_date: string;
  event_type:
    | "cultural_celebration"
    | "awareness_day"
    | "heritage_month"
    | "religious_festival";
  children_participated: string[];
  staff_participated: string[];
  activities_held: boolean;
  learning_documented: boolean;
  created_at: string;
}

export interface PersonalPassportInput {
  id: string;
  child_id: string;
  last_updated: string;
  photo_current: boolean;
  identity_info_complete: boolean;
  cultural_needs_documented: boolean;
  preferences_documented: boolean;
  created_at: string;
}

export interface CulturalIdentityDiversityInput {
  today: string;
  total_children: number;
  cultural_identity_plans: CulturalIdentityPlanInput[];
  cultural_religious_mentors: CulturalReligiousMentorInput[];
  cultural_visits: CulturalVisitInput[];
  diversity_calendar_events: DiversityCalendarEventInput[];
  personal_passports: PersonalPassportInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type CulturalIdentityRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface CulturalIdentityInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface CulturalIdentityRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface CulturalIdentityDiversityResult {
  identity_rating: CulturalIdentityRating;
  identity_score: number;
  headline: string;
  total_cultural_plans: number;
  cultural_plan_coverage_rate: number;
  mentor_assignment_rate: number;
  cultural_visits_per_child: number;
  diversity_participation_rate: number;
  life_story_work_rate: number;
  religious_observance_rate: number;
  identity_review_timeliness_rate: number;
  personal_passport_currency_rate: number;
  child_voice_in_plans_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: CulturalIdentityRecommendation[];
  insights: CulturalIdentityInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): CulturalIdentityRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: CulturalIdentityRating,
  score: number,
  headline: string,
): CulturalIdentityDiversityResult {
  return {
    identity_rating: rating,
    identity_score: score,
    headline,
    total_cultural_plans: 0,
    cultural_plan_coverage_rate: 0,
    mentor_assignment_rate: 0,
    cultural_visits_per_child: 0,
    diversity_participation_rate: 0,
    life_story_work_rate: 0,
    religious_observance_rate: 0,
    identity_review_timeliness_rate: 0,
    personal_passport_currency_rate: 0,
    child_voice_in_plans_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeCulturalIdentityDiversity(
  input: CulturalIdentityDiversityInput,
): CulturalIdentityDiversityResult {
  const {
    today,
    total_children,
    cultural_identity_plans,
    cultural_religious_mentors,
    cultural_visits,
    diversity_calendar_events,
    personal_passports,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    cultural_identity_plans.length === 0 &&
    cultural_religious_mentors.length === 0 &&
    cultural_visits.length === 0 &&
    diversity_calendar_events.length === 0 &&
    personal_passports.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess cultural identity and diversity support.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate (score 15) ────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No cultural identity or diversity data recorded despite children on placement — cultural support practices require urgent attention.",
      ),
      concerns: [
        "No cultural identity plans, mentor assignments, cultural visits, diversity events, or personal passports exist despite children being on placement — cultural identity support cannot be evidenced.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Urgently develop cultural identity plans for every child to document ethnicity, religion, language needs, and identity goals — this is a fundamental requirement under Reg 5 and Reg 7.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Positive identity",
        },
        {
          rank: 2,
          recommendation:
            "Establish a diversity calendar and begin planning cultural celebrations, awareness days, and heritage activities to promote inclusion and belonging.",
          urgency: "soon",
          regulatory_ref: "CHR 2015 Reg 7 — Individual child's plan",
        },
      ],
      insights: [
        {
          text: "The complete absence of cultural identity records means Ofsted cannot verify that children's cultural, religious, and ethnic identity needs are being met. This represents a fundamental gap in evidencing Reg 5 (positive identity) compliance.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Cultural identity plan coverage ---
  const activePlans = cultural_identity_plans.filter((p) => p.active);
  const childrenWithPlans = new Set(activePlans.map((p) => p.child_id)).size;
  const totalCulturalPlans = activePlans.length;
  const culturalPlanCoverageRate = pct(childrenWithPlans, total_children);

  // --- Mentor assignment rate ---
  const activeMentors = cultural_religious_mentors.filter((m) => m.active);
  const childrenWithMentors = new Set(activeMentors.map((m) => m.child_id)).size;
  const mentorAssignmentRate = pct(childrenWithMentors, total_children);

  // --- Cultural visit frequency (visits per child) ---
  const totalVisits = cultural_visits.length;
  const culturalVisitsPerChild =
    total_children > 0
      ? Math.round((totalVisits / total_children) * 100) / 100
      : 0;

  // --- Diversity event participation ---
  // Collect unique child IDs who participated in any diversity event
  const childrenParticipated = new Set<string>();
  for (const event of diversity_calendar_events) {
    for (const childId of event.children_participated) {
      childrenParticipated.add(childId);
    }
  }
  const diversityParticipationRate = pct(childrenParticipated.size, total_children);

  // --- Life story work rate ---
  const childrenWithLifeStory = new Set(
    activePlans.filter((p) => p.life_story_work_active).map((p) => p.child_id),
  ).size;
  const lifeStoryWorkRate = pct(childrenWithLifeStory, total_children);

  // --- Religious observance support rate ---
  // Children with religion documented and active plan = religious needs met
  const childrenWithReligionDocumented = new Set(
    activePlans.filter((p) => p.religion_documented).map((p) => p.child_id),
  ).size;
  const religiousObservanceRate = pct(childrenWithReligionDocumented, total_children);

  // --- Identity review timeliness ---
  // Of active plans, how many have been reviewed on time (review_date <= next_review_date or reviewed is true)
  const plansRequiringReview = activePlans.length;
  const plansReviewedOnTime = activePlans.filter((p) => {
    if (!p.reviewed) return false;
    // If next_review_date is in the past relative to today, it's overdue
    if (p.next_review_date && p.next_review_date < today && p.review_date < p.next_review_date) {
      return false;
    }
    return true;
  }).length;
  const identityReviewTimelinessRate = pct(plansReviewedOnTime, plansRequiringReview);

  // --- Personal passport currency ---
  // Passports are "current" if identity_info_complete, cultural_needs_documented, and photo_current
  const currentPassports = personal_passports.filter(
    (p) => p.identity_info_complete && p.cultural_needs_documented && p.photo_current,
  ).length;
  const childrenWithPassports = new Set(
    personal_passports
      .filter((p) => p.identity_info_complete && p.cultural_needs_documented && p.photo_current)
      .map((p) => p.child_id),
  ).size;
  const personalPassportCurrencyRate = pct(childrenWithPassports, total_children);

  // --- Child voice in identity plans ---
  const plansWithChildVoice = activePlans.filter((p) => p.child_voice_captured).length;
  const childVoiceInPlansRate = pct(plansWithChildVoice, activePlans.length);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus: culturalIdentityPlanCoverage (>=100: +4, >=80: +2) ---
  if (culturalPlanCoverageRate >= 100) score += 4;
  else if (culturalPlanCoverageRate >= 80) score += 2;

  // --- Bonus: mentorAssignmentRate (>=100: +3, >=80: +1) ---
  if (mentorAssignmentRate >= 100) score += 3;
  else if (mentorAssignmentRate >= 80) score += 1;

  // --- Bonus: culturalVisitFrequency (>=4 per child: +3, >=2: +1) ---
  if (culturalVisitsPerChild >= 4) score += 3;
  else if (culturalVisitsPerChild >= 2) score += 1;

  // --- Bonus: diversityEventParticipation (>=90: +3, >=70: +1) ---
  if (diversityParticipationRate >= 90) score += 3;
  else if (diversityParticipationRate >= 70) score += 1;

  // --- Bonus: lifeStoryWorkRate (>=100: +3, >=80: +1) ---
  if (lifeStoryWorkRate >= 100) score += 3;
  else if (lifeStoryWorkRate >= 80) score += 1;

  // --- Bonus: religiousObservanceSupport (>=100: +3, >=80: +1) ---
  if (religiousObservanceRate >= 100) score += 3;
  else if (religiousObservanceRate >= 80) score += 1;

  // --- Bonus: identityReviewTimeliness (>=90: +3, >=70: +1) ---
  if (identityReviewTimelinessRate >= 90) score += 3;
  else if (identityReviewTimelinessRate >= 70) score += 1;

  // --- Bonus: personalPassportCurrency (>=100: +3, >=80: +1) ---
  if (personalPassportCurrencyRate >= 100) score += 3;
  else if (personalPassportCurrencyRate >= 80) score += 1;

  // --- Bonus: childVoiceInIdentityPlans (>=90: +3, >=70: +1) ---
  if (childVoiceInPlansRate >= 90) score += 3;
  else if (childVoiceInPlansRate >= 70) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // culturalIdentityPlanCoverage < 50 → -5
  if (culturalPlanCoverageRate < 50) score -= 5;

  // mentorAssignmentRate < 30 → -5
  if (mentorAssignmentRate < 30) score -= 5;

  // diversityEventParticipation < 30 → -5
  if (diversityParticipationRate < 30) score -= 5;

  // religiousObservanceSupport < 50 → -3
  if (religiousObservanceRate < 50) score -= 3;

  score = clamp(score, 0, 100);

  const identity_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (culturalPlanCoverageRate >= 100) {
    strengths.push(
      "Every child has an active cultural identity plan — cultural, ethnic, and religious identity needs are systematically documented and supported.",
    );
  } else if (culturalPlanCoverageRate >= 80) {
    strengths.push(
      `${culturalPlanCoverageRate}% of children have active cultural identity plans — strong commitment to documenting and supporting identity needs.`,
    );
  }

  if (mentorAssignmentRate >= 100) {
    strengths.push(
      "Every child has an assigned cultural or religious mentor — children are connected to role models who reflect and affirm their identity.",
    );
  } else if (mentorAssignmentRate >= 80) {
    strengths.push(
      `${mentorAssignmentRate}% of children have cultural or religious mentors — most children benefit from identity-affirming mentoring relationships.`,
    );
  }

  if (culturalVisitsPerChild >= 4) {
    strengths.push(
      `${culturalVisitsPerChild} cultural visits per child — rich programme of cultural experiences enabling children to explore and celebrate their heritage.`,
    );
  } else if (culturalVisitsPerChild >= 2) {
    strengths.push(
      `${culturalVisitsPerChild} cultural visits per child — children are regularly accessing cultural activities and experiences.`,
    );
  }

  if (diversityParticipationRate >= 90) {
    strengths.push(
      `${diversityParticipationRate}% of children participate in diversity calendar events — the home actively promotes inclusion and celebration of diverse cultures.`,
    );
  } else if (diversityParticipationRate >= 70) {
    strengths.push(
      `${diversityParticipationRate}% of children engage with diversity events — good participation in cultural celebrations and awareness activities.`,
    );
  }

  if (lifeStoryWorkRate >= 100) {
    strengths.push(
      "Active life story work for every child — children are supported to understand their history and build a coherent sense of identity.",
    );
  } else if (lifeStoryWorkRate >= 80) {
    strengths.push(
      `Life story work active for ${lifeStoryWorkRate}% of children — strong commitment to helping children understand and own their narrative.`,
    );
  }

  if (religiousObservanceRate >= 100) {
    strengths.push(
      "Religious needs documented for every child — the home demonstrates full respect for and support of children's religious identities.",
    );
  } else if (religiousObservanceRate >= 80) {
    strengths.push(
      `Religious needs documented for ${religiousObservanceRate}% of children — strong support for children's spiritual and religious identities.`,
    );
  }

  if (identityReviewTimelinessRate >= 90 && activePlans.length > 0) {
    strengths.push(
      `${identityReviewTimelinessRate}% of identity plans reviewed on time — cultural identity support is actively monitored and kept current.`,
    );
  }

  if (personalPassportCurrencyRate >= 100) {
    strengths.push(
      "Every child has an up-to-date personal passport — identity documentation is comprehensive and current.",
    );
  } else if (personalPassportCurrencyRate >= 80) {
    strengths.push(
      `${personalPassportCurrencyRate}% of children have current personal passports — identity documentation is well-maintained.`,
    );
  }

  if (childVoiceInPlansRate >= 90 && activePlans.length > 0) {
    strengths.push(
      `Child voice captured in ${childVoiceInPlansRate}% of identity plans — children are active participants in shaping how their cultural identity is supported.`,
    );
  } else if (childVoiceInPlansRate >= 70 && activePlans.length > 0) {
    strengths.push(
      `Child voice present in ${childVoiceInPlansRate}% of identity plans — most children contribute to their own cultural identity planning.`,
    );
  }

  // Positive feedback from cultural visits
  const positiveFeedbackVisits = cultural_visits.filter((v) => v.child_feedback_positive).length;
  const positiveFeedbackRate = pct(positiveFeedbackVisits, totalVisits);
  if (positiveFeedbackRate >= 80 && totalVisits > 0) {
    strengths.push(
      `${positiveFeedbackRate}% positive child feedback from cultural visits — children are enjoying and valuing their cultural experiences.`,
    );
  }

  // Diversity events with documented learning
  const eventsWithLearning = diversity_calendar_events.filter((e) => e.learning_documented).length;
  const learningDocRate = pct(eventsWithLearning, diversity_calendar_events.length);
  if (learningDocRate >= 80 && diversity_calendar_events.length > 0) {
    strengths.push(
      `Learning documented in ${learningDocRate}% of diversity events — cultural education is embedded in the home's approach to diversity.`,
    );
  }

  // Variety of mentor types
  const mentorTypes = new Set(activeMentors.map((m) => m.mentor_type)).size;
  if (mentorTypes >= 3 && activeMentors.length > 0) {
    strengths.push(
      `Mentoring spans ${mentorTypes} different types (cultural, religious, community, elder) — children access diverse identity-affirming relationships.`,
    );
  }

  // Variety of visit types
  const visitTypes = new Set(cultural_visits.map((v) => v.visit_type)).size;
  if (visitTypes >= 4 && totalVisits > 0) {
    strengths.push(
      `Cultural visits span ${visitTypes} categories — a rich and varied programme of cultural experiences is available to children.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (culturalPlanCoverageRate < 50 && total_children > 0) {
    concerns.push(
      `Only ${culturalPlanCoverageRate}% of children have active cultural identity plans — the majority of children's cultural, ethnic, and religious needs are not formally documented or supported.`,
    );
  } else if (culturalPlanCoverageRate >= 50 && culturalPlanCoverageRate < 80 && total_children > 0) {
    concerns.push(
      `Cultural identity plan coverage at ${culturalPlanCoverageRate}% — not all children have documented plans for their cultural identity support.`,
    );
  }

  if (mentorAssignmentRate < 30 && total_children > 0) {
    concerns.push(
      `Only ${mentorAssignmentRate}% of children have a cultural or religious mentor — most children lack access to identity-affirming mentoring relationships.`,
    );
  } else if (mentorAssignmentRate >= 30 && mentorAssignmentRate < 80 && total_children > 0) {
    concerns.push(
      `Mentor assignment rate at ${mentorAssignmentRate}% — some children do not have access to cultural or religious mentoring support.`,
    );
  }

  if (culturalVisitsPerChild < 1 && total_children > 0) {
    concerns.push(
      `Only ${culturalVisitsPerChild} cultural visits per child — children are not accessing sufficient cultural activities and experiences to support their identity development.`,
    );
  } else if (culturalVisitsPerChild >= 1 && culturalVisitsPerChild < 2 && total_children > 0) {
    concerns.push(
      `Cultural visits averaging ${culturalVisitsPerChild} per child — more frequent cultural experiences are needed to sustain identity development.`,
    );
  }

  if (diversityParticipationRate < 30 && total_children > 0) {
    concerns.push(
      `Only ${diversityParticipationRate}% of children participate in diversity events — the majority of children are not engaging with cultural celebrations and awareness activities.`,
    );
  } else if (diversityParticipationRate >= 30 && diversityParticipationRate < 70 && total_children > 0) {
    concerns.push(
      `Diversity event participation at ${diversityParticipationRate}% — not all children are included in cultural celebrations.`,
    );
  }

  if (lifeStoryWorkRate < 50 && total_children > 0) {
    concerns.push(
      `Life story work active for only ${lifeStoryWorkRate}% of children — most children are not being supported to understand their personal history and identity narrative.`,
    );
  } else if (lifeStoryWorkRate >= 50 && lifeStoryWorkRate < 80 && total_children > 0) {
    concerns.push(
      `Life story work rate at ${lifeStoryWorkRate}% — not all children are supported with active life story work.`,
    );
  }

  if (religiousObservanceRate < 50 && total_children > 0) {
    concerns.push(
      `Religious needs documented for only ${religiousObservanceRate}% of children — many children's spiritual and religious identities are not being formally supported.`,
    );
  } else if (religiousObservanceRate >= 50 && religiousObservanceRate < 80 && total_children > 0) {
    concerns.push(
      `Religious observance support at ${religiousObservanceRate}% — some children's religious needs are not yet documented in their identity plans.`,
    );
  }

  if (identityReviewTimelinessRate < 50 && activePlans.length > 0) {
    concerns.push(
      `Only ${identityReviewTimelinessRate}% of identity plans reviewed on time — cultural identity support is not being regularly monitored and updated.`,
    );
  } else if (identityReviewTimelinessRate >= 50 && identityReviewTimelinessRate < 70 && activePlans.length > 0) {
    concerns.push(
      `Identity plan review timeliness at ${identityReviewTimelinessRate}% — some plans are overdue for review, risking outdated cultural support.`,
    );
  }

  if (personalPassportCurrencyRate < 50 && total_children > 0) {
    concerns.push(
      `Only ${personalPassportCurrencyRate}% of children have current personal passports — identity documentation is incomplete for most children.`,
    );
  } else if (personalPassportCurrencyRate >= 50 && personalPassportCurrencyRate < 80 && total_children > 0) {
    concerns.push(
      `Personal passport currency at ${personalPassportCurrencyRate}% — some children's identity documentation needs updating.`,
    );
  }

  if (childVoiceInPlansRate < 50 && activePlans.length > 0) {
    concerns.push(
      `Child voice captured in only ${childVoiceInPlansRate}% of identity plans — most children are not contributing to decisions about their cultural identity support.`,
    );
  } else if (childVoiceInPlansRate >= 50 && childVoiceInPlansRate < 70 && activePlans.length > 0) {
    concerns.push(
      `Child voice present in ${childVoiceInPlansRate}% of identity plans — not all children have a say in how their cultural identity is supported.`,
    );
  }

  if (diversity_calendar_events.length === 0 && total_children > 0) {
    concerns.push(
      "No diversity calendar events recorded — the home is not evidencing any cultural celebrations, awareness days, or heritage activities.",
    );
  }

  if (personal_passports.length === 0 && total_children > 0) {
    concerns.push(
      "No personal passports recorded — children's identity information, cultural needs, and preferences are not formally documented.",
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: CulturalIdentityRecommendation[] = [];
  let rank = 0;

  if (culturalPlanCoverageRate < 50 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently develop cultural identity plans for all children — every child must have documented cultural, ethnic, religious, and language needs with clear identity goals.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Positive identity",
    });
  }

  if (mentorAssignmentRate < 30 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish cultural and religious mentoring relationships for all children — connect children with mentors who reflect and affirm their cultural background and identity.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Positive identity",
    });
  }

  if (diversityParticipationRate < 30 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase children's participation in diversity events — develop an inclusive diversity calendar ensuring all children engage with cultural celebrations and awareness activities.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Individual child's plan",
    });
  }

  if (religiousObservanceRate < 50 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Document and actively support all children's religious and spiritual needs — ensure faith-based requirements are recorded in identity plans and acted upon.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Positive identity",
    });
  }

  if (lifeStoryWorkRate < 50 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Initiate life story work for all children — every child needs support to understand their personal history, family connections, and identity narrative.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Individual child's plan, SCCIF identity outcomes",
    });
  }

  if (childVoiceInPlansRate < 50 && activePlans.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every child's voice is captured in their cultural identity plan — children must be active participants in shaping how their identity is supported.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Individual child's plan",
    });
  }

  if (personal_passports.length === 0 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Create personal passports for all children — document each child's identity, cultural needs, preferences, and current photograph.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Positive identity, SCCIF identity outcomes",
    });
  }

  if (personalPassportCurrencyRate < 50 && personal_passports.length > 0 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Update personal passports for all children — ensure photos are current, identity information is complete, and cultural needs are documented.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Positive identity",
    });
  }

  if (culturalVisitsPerChild < 2 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase the frequency of cultural visits and activities — aim for at least 2 cultural experiences per child to support meaningful identity exploration.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Positive identity",
    });
  }

  if (identityReviewTimelinessRate < 70 && activePlans.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve timeliness of identity plan reviews — plans must be reviewed regularly to ensure cultural support remains relevant and responsive to children's evolving needs.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 — Individual child's plan",
    });
  }

  if (culturalPlanCoverageRate >= 50 && culturalPlanCoverageRate < 80 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend cultural identity plan coverage to at least 80% — work towards ensuring every child has a documented plan for their cultural identity needs.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 — Positive identity",
    });
  }

  if (mentorAssignmentRate >= 30 && mentorAssignmentRate < 80 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase mentor coverage — connect more children with cultural, religious, or community mentors to strengthen identity-affirming relationships.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 — Positive identity",
    });
  }

  if (diversityParticipationRate >= 30 && diversityParticipationRate < 70 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve diversity event participation — review barriers to engagement and ensure all children have opportunities to participate in cultural celebrations.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Individual child's plan",
    });
  }

  if (childVoiceInPlansRate >= 50 && childVoiceInPlansRate < 70 && activePlans.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen child voice in identity plans — aim for at least 90% of plans to include the child's own perspective on their cultural identity and what support they want.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Individual child's plan",
    });
  }

  if (lifeStoryWorkRate >= 50 && lifeStoryWorkRate < 80 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend life story work to all children — aim for 100% coverage so every child is supported to understand their identity and history.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 7 — Individual child's plan, SCCIF identity outcomes",
    });
  }

  if (learningDocRate < 50 && diversity_calendar_events.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve documentation of learning from diversity events — record what children and staff learn from cultural celebrations to embed cultural education.",
      urgency: "planned",
      regulatory_ref: "SCCIF identity outcomes",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: CulturalIdentityInsight[] = [];

  // -- Critical insights --

  if (culturalPlanCoverageRate < 50 && total_children > 0) {
    insights.push({
      text: `Only ${culturalPlanCoverageRate}% of children have cultural identity plans. Ofsted will view this as a failure to meet Reg 5 (positive identity) — children's cultural, ethnic, and religious needs must be formally documented and actively supported.`,
      severity: "critical",
    });
  }

  if (mentorAssignmentRate < 30 && total_children > 0) {
    insights.push({
      text: `Only ${mentorAssignmentRate}% of children have cultural or religious mentors. Children in care often lack connections to their cultural heritage — without mentors who reflect their identity, children may experience cultural isolation and identity confusion.`,
      severity: "critical",
    });
  }

  if (diversityParticipationRate < 30 && total_children > 0) {
    insights.push({
      text: `Only ${diversityParticipationRate}% of children participate in diversity events. The home is not creating an inclusive environment where cultural diversity is celebrated and children can learn about different traditions and backgrounds.`,
      severity: "critical",
    });
  }

  if (religiousObservanceRate < 50 && total_children > 0) {
    insights.push({
      text: `Religious needs documented for only ${religiousObservanceRate}% of children. Under Reg 5, children's spiritual and religious identities must be understood and supported. Failure to document these needs means they cannot be met.`,
      severity: "critical",
    });
  }

  if (lifeStoryWorkRate < 30 && total_children > 0) {
    insights.push({
      text: `Life story work active for only ${lifeStoryWorkRate}% of children. Without life story work, children may struggle to develop a coherent sense of identity and understand their personal history, which SCCIF identifies as essential for positive outcomes.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (culturalPlanCoverageRate >= 50 && culturalPlanCoverageRate < 80 && total_children > 0) {
    insights.push({
      text: `Cultural identity plan coverage at ${culturalPlanCoverageRate}% — improving but some children still lack documented cultural support. Each child without a plan represents an unmet regulatory obligation under Reg 5.`,
      severity: "warning",
    });
  }

  if (mentorAssignmentRate >= 30 && mentorAssignmentRate < 80 && total_children > 0) {
    insights.push({
      text: `Mentor assignment at ${mentorAssignmentRate}% — some children lack identity-affirming mentoring relationships. Culturally matched mentors play a vital role in helping children maintain a positive sense of identity.`,
      severity: "warning",
    });
  }

  if (culturalVisitsPerChild >= 1 && culturalVisitsPerChild < 2 && total_children > 0) {
    insights.push({
      text: `Cultural visits averaging ${culturalVisitsPerChild} per child — children benefit from more frequent, varied cultural experiences to deepen their connection to their heritage.`,
      severity: "warning",
    });
  }

  if (diversityParticipationRate >= 30 && diversityParticipationRate < 70 && total_children > 0) {
    insights.push({
      text: `Diversity event participation at ${diversityParticipationRate}% — some children may not feel included in the home's cultural programme. Consider reviewing individual barriers to participation.`,
      severity: "warning",
    });
  }

  if (lifeStoryWorkRate >= 30 && lifeStoryWorkRate < 80 && total_children > 0) {
    insights.push({
      text: `Life story work active for ${lifeStoryWorkRate}% of children — children without life story work may struggle to make sense of their history and develop a secure sense of identity.`,
      severity: "warning",
    });
  }

  if (identityReviewTimelinessRate >= 50 && identityReviewTimelinessRate < 70 && activePlans.length > 0) {
    insights.push({
      text: `Identity plan review timeliness at ${identityReviewTimelinessRate}% — overdue reviews mean cultural support may not reflect children's evolving identity needs.`,
      severity: "warning",
    });
  }

  if (identityReviewTimelinessRate < 50 && activePlans.length > 0) {
    insights.push({
      text: `Only ${identityReviewTimelinessRate}% of identity plans reviewed on time — widespread overdue reviews suggest cultural identity support is not being actively monitored.`,
      severity: "warning",
    });
  }

  if (personalPassportCurrencyRate >= 50 && personalPassportCurrencyRate < 80 && total_children > 0) {
    insights.push({
      text: `Personal passport currency at ${personalPassportCurrencyRate}% — some children's identity documents are incomplete or outdated, which may affect placement transitions and identity continuity.`,
      severity: "warning",
    });
  }

  if (childVoiceInPlansRate >= 50 && childVoiceInPlansRate < 70 && activePlans.length > 0) {
    insights.push({
      text: `Child voice present in ${childVoiceInPlansRate}% of identity plans — some children are not being asked about their own cultural identity and what support matters to them.`,
      severity: "warning",
    });
  }

  if (childVoiceInPlansRate < 50 && activePlans.length > 0) {
    insights.push({
      text: `Child voice captured in only ${childVoiceInPlansRate}% of identity plans. Children must be active participants in defining how their cultural identity is supported — plans written without the child's input risk being tokenistic rather than meaningful.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (identity_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding cultural identity and diversity practice — children's cultural, religious, and ethnic identities are actively celebrated, documented, and supported through mentoring, life story work, and a rich programme of cultural experiences. This is strong evidence for Reg 5 and SCCIF identity outcomes.",
      severity: "positive",
    });
  }

  if (culturalPlanCoverageRate >= 100 && total_children > 0) {
    insights.push({
      text: "Every child has an active cultural identity plan — the home systematically identifies and supports each child's unique cultural, religious, ethnic, and linguistic identity needs under Reg 5.",
      severity: "positive",
    });
  }

  if (mentorAssignmentRate >= 100 && total_children > 0) {
    insights.push({
      text: "Every child has an identity-affirming mentor — this exceptional practice ensures children maintain meaningful connections to their cultural heritage and community.",
      severity: "positive",
    });
  }

  if (lifeStoryWorkRate >= 100 && total_children > 0) {
    insights.push({
      text: "Life story work active for every child — the home demonstrates exemplary practice in helping children understand their history, family connections, and identity narrative as required by SCCIF.",
      severity: "positive",
    });
  }

  if (childVoiceInPlansRate >= 90 && activePlans.length > 0) {
    insights.push({
      text: `Child voice captured in ${childVoiceInPlansRate}% of identity plans — children are genuine partners in shaping how their cultural identity is understood and supported, reflecting outstanding Reg 7 practice.`,
      severity: "positive",
    });
  }

  if (diversityParticipationRate >= 90 && total_children > 0) {
    insights.push({
      text: `${diversityParticipationRate}% of children participate in diversity events — the home creates an inclusive environment where cultural diversity is actively celebrated and every child feels their background is valued.`,
      severity: "positive",
    });
  }

  if (personalPassportCurrencyRate >= 100 && total_children > 0) {
    insights.push({
      text: "Every child has a current personal passport with complete identity information, documented cultural needs, and current photograph — exemplary identity documentation practice.",
      severity: "positive",
    });
  }

  if (culturalVisitsPerChild >= 4 && total_children > 0) {
    insights.push({
      text: `${culturalVisitsPerChild} cultural visits per child demonstrates an exceptionally rich programme of cultural experiences — children are immersed in activities that connect them to their heritage and broaden their cultural understanding.`,
      severity: "positive",
    });
  }

  if (religiousObservanceRate >= 100 && total_children > 0) {
    insights.push({
      text: "Religious needs documented for every child — the home demonstrates comprehensive respect for children's spiritual identities, supporting faith-based observance and understanding under Reg 5.",
      severity: "positive",
    });
  }

  if (
    identityReviewTimelinessRate >= 90 &&
    personalPassportCurrencyRate >= 90 &&
    activePlans.length > 0
  ) {
    insights.push({
      text: "Identity plans reviewed on time and personal passports kept current — the home maintains living documents that evolve with children's developing sense of identity.",
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (identity_rating === "outstanding") {
    headline =
      "Outstanding cultural identity and diversity practice — children's cultural, religious, and ethnic identities are actively celebrated, documented, and supported.";
  } else if (identity_rating === "good") {
    headline = `Good cultural identity and diversity practice — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (identity_rating === "adequate") {
    headline = `Adequate cultural identity and diversity practice — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to fully support children's identity needs.`;
  } else {
    headline = `Cultural identity and diversity support is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's cultural needs are met.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    identity_rating,
    identity_score: score,
    headline,
    total_cultural_plans: totalCulturalPlans,
    cultural_plan_coverage_rate: culturalPlanCoverageRate,
    mentor_assignment_rate: mentorAssignmentRate,
    cultural_visits_per_child: culturalVisitsPerChild,
    diversity_participation_rate: diversityParticipationRate,
    life_story_work_rate: lifeStoryWorkRate,
    religious_observance_rate: religiousObservanceRate,
    identity_review_timeliness_rate: identityReviewTimelinessRate,
    personal_passport_currency_rate: personalPassportCurrencyRate,
    child_voice_in_plans_rate: childVoiceInPlansRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
