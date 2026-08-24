// ==============================================================================
// CARA -- HOME BIRTHDAY & SPECIAL OCCASION CELEBRATION INTELLIGENCE ENGINE
// Monitors birthday planning personalisation, celebration execution quality,
// gift provision adequacy, memory-making activities, and child satisfaction
// with celebrations. Ensures every child feels valued and celebrated.
// Pure deterministic engine -- no imports, no LLM, no external deps.
// CHR 2015 Reg 5 (Engaging, activities, community), Reg 7 (Child's views),
// SCCIF "Experiences and progress of children".
// Store keys: birthdayPlanRecords, celebrationExecutionRecords,
//             giftProvisionRecords, memoryMakingRecords,
//             childSatisfactionRecords
// ==============================================================================

// -- Input Types --------------------------------------------------------------

import { below, meets, rate } from "@/lib/metrics/rate";

export interface BirthdayPlanRecordInput {
  id: string;
  child_id: string;
  child_name: string;
  birthday_date: string;
  plan_created: boolean;
  plan_created_date: string | null;
  days_advance_planned: number;
  child_consulted: boolean;
  child_wishes_documented: boolean;
  child_chose_theme: boolean;
  child_chose_guests: boolean;
  child_chose_food: boolean;
  child_chose_activity: boolean;
  budget_allocated: boolean;
  budget_amount: number;
  cultural_considerations_documented: boolean;
  dietary_needs_considered: boolean;
  family_contact_arranged: boolean;
  social_worker_notified: boolean;
  plan_reviewed_by_manager: boolean;
  special_requests_noted: string[];
  special_requests_fulfilled: string[];
  notes: string;
  created_at: string;
}

export interface CelebrationExecutionRecordInput {
  id: string;
  child_id: string;
  celebration_type: "birthday" | "christmas" | "easter" | "eid" | "diwali" | "hanukkah" | "cultural" | "achievement" | "transition" | "religious" | "seasonal" | "other";
  date: string;
  celebration_held: boolean;
  held_on_actual_date: boolean;
  venue: "in_home" | "external_venue" | "family_home" | "community" | "school" | "other";
  guests_invited: number;
  guests_attended: number;
  staff_participated: boolean;
  staff_enthusiasm_rating: number; // 1-5
  peers_participated: boolean;
  peers_count: number;
  family_attended: boolean;
  family_members_count: number;
  decorations_provided: boolean;
  cake_or_treat_provided: boolean;
  personalised_to_child: boolean;
  child_led_planning: boolean;
  celebration_duration_minutes: number;
  atmosphere_rating: number; // 1-5
  cultural_appropriateness: boolean;
  inclusive_of_all_children: boolean;
  safeguarding_considered: boolean;
  risk_assessment_completed: boolean;
  notes: string;
  created_at: string;
}

export interface GiftProvisionRecordInput {
  id: string;
  child_id: string;
  occasion: "birthday" | "christmas" | "easter" | "achievement" | "leaving" | "cultural" | "other";
  date: string;
  gift_provided: boolean;
  gift_personalised: boolean;
  child_preferences_considered: boolean;
  age_appropriate: boolean;
  budget_adequate: boolean;
  budget_amount: number;
  gift_wrapped: boolean;
  presented_thoughtfully: boolean;
  child_reaction_positive: boolean;
  equitable_with_peers: boolean;
  family_contribution_enabled: boolean;
  social_worker_contribution_enabled: boolean;
  receipt_documented: boolean;
  savings_contribution_made: boolean;
  notes: string;
  created_at: string;
}

export interface MemoryMakingRecordInput {
  id: string;
  child_id: string;
  celebration_id: string;
  activity_type: "photo" | "video" | "memory_book" | "scrapbook" | "card_making" | "life_story_addition" | "certificate" | "trophy" | "keepsake" | "other";
  date: string;
  activity_completed: boolean;
  child_participated: boolean;
  child_consented: boolean;
  memory_stored_securely: boolean;
  added_to_life_story: boolean;
  shared_with_family: boolean;
  child_has_copy: boolean;
  quality_rating: number; // 1-5
  staff_facilitated: boolean;
  peers_involved: boolean;
  notes: string;
  created_at: string;
}

export interface ChildSatisfactionRecordInput {
  id: string;
  child_id: string;
  celebration_id: string;
  celebration_type: "birthday" | "christmas" | "easter" | "eid" | "diwali" | "hanukkah" | "cultural" | "achievement" | "transition" | "religious" | "seasonal" | "other";
  date: string;
  overall_satisfaction: number; // 1-5
  felt_special: boolean;
  felt_listened_to: boolean;
  would_change_anything: boolean;
  change_suggestions: string[];
  favourite_moment: string;
  felt_included: boolean;
  felt_equal_to_peers: boolean;
  celebration_matched_wishes: boolean;
  child_voice_captured: boolean;
  feedback_acted_upon: boolean;
  follow_up_completed: boolean;
  notes: string;
  created_at: string;
}

export interface BirthdayCelebrationInput {
  today: string;
  total_children: number;
  birthday_plan_records: BirthdayPlanRecordInput[];
  celebration_execution_records: CelebrationExecutionRecordInput[];
  gift_provision_records: GiftProvisionRecordInput[];
  memory_making_records: MemoryMakingRecordInput[];
  child_satisfaction_records: ChildSatisfactionRecordInput[];
}

// -- Output Types -------------------------------------------------------------

export type BirthdayCelebrationRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface BirthdayCelebrationInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface BirthdayCelebrationRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface BirthdayCelebrationResult {
  celebration_rating: BirthdayCelebrationRating;
  celebration_score: number | null;
  headline: string;
  birthday_planning_rate: number | null;
  celebration_execution_rate: number | null;
  gift_provision_rate: number | null;
  memory_making_rate: number | null;
  child_satisfaction_rate: number | null;
  child_choice_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: BirthdayCelebrationRecommendation[];
  insights: BirthdayCelebrationInsight[];
}

// -- Helpers ------------------------------------------------------------------

// Was `d === 0 ? 0 : …`: nothing recorded read as 0%, not as unmeasured.
function pct(n: number, d: number): number | null {
  return rate(n, d);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): BirthdayCelebrationRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// -- Empty Result Factory -----------------------------------------------------

function emptyResult(
  rating: BirthdayCelebrationRating,
  score: number,
  headline: string,
): BirthdayCelebrationResult {
  return {
    celebration_rating: rating,
    celebration_score: score,
    headline,
    birthday_planning_rate: 0,
    celebration_execution_rate: 0,
    gift_provision_rate: 0,
    memory_making_rate: 0,
    child_satisfaction_rate: 0,
    child_choice_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// -- Main Compute -------------------------------------------------------------

export function computeBirthdaySpecialOccasionCelebration(
  input: BirthdayCelebrationInput,
): BirthdayCelebrationResult {
  const {
    total_children,
    birthday_plan_records,
    celebration_execution_records,
    gift_provision_records,
    memory_making_records,
    child_satisfaction_records,
  } = input;

  // -- Special case: all empty + 0 children -> insufficient_data ------------
  const allEmpty =
    birthday_plan_records.length === 0 &&
    celebration_execution_records.length === 0 &&
    gift_provision_records.length === 0 &&
    memory_making_records.length === 0 &&
    child_satisfaction_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement -- insufficient data to assess birthday and celebration quality.",
    );
  }

  // -- Special case: all empty + children > 0 -> inadequate -----------------
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No birthday or celebration data recorded despite children on placement -- birthday planning, celebration execution, gift provision, and memory-making require urgent attention.",
      ),
      concerns: [
        "No birthday plans, celebration records, gift provision, memory-making activities, or child satisfaction feedback exist despite children being on placement -- the home cannot evidence that children's birthdays and special occasions are being celebrated.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of birthday planning, celebration execution, gift provision, memory-making activities, and child satisfaction to evidence the home's commitment to celebrating children's milestones and special occasions.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 -- Engaging activities, community",
        },
        {
          rank: 2,
          recommendation:
            "Ensure every child has a personalised birthday plan that reflects their wishes, cultural background, and preferences, with adequate budget allocation and advance planning.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 7 -- Children's views",
        },
      ],
      insights: [
        {
          text: "The complete absence of birthday and celebration records means Ofsted cannot verify that children feel valued, special, and celebrated on their important days. This represents a fundamental gap in the home's duty to provide nurturing, personalised care under Reg 5.",
          severity: "critical",
        },
      ],
    };
  }

  // -- Compute core metrics -------------------------------------------------

  // --- Birthday planning personalisation ---
  const totalBirthdayPlans = birthday_plan_records.length;
  const plansCreated = birthday_plan_records.filter((r) => r.plan_created).length;
  const birthdayPlanningRate = pct(plansCreated, totalBirthdayPlans);

  const childConsulted = birthday_plan_records.filter((r) => r.child_consulted).length;
  const childConsultationRate = pct(childConsulted, totalBirthdayPlans);

  const childChoseTheme = birthday_plan_records.filter((r) => r.child_chose_theme).length;
  const childChoseGuests = birthday_plan_records.filter((r) => r.child_chose_guests).length;
  const childChoseFood = birthday_plan_records.filter((r) => r.child_chose_food).length;
  const childChoseActivity = birthday_plan_records.filter((r) => r.child_chose_activity).length;
  const totalChoiceOpportunities = totalBirthdayPlans * 4;
  const totalChoicesMade = childChoseTheme + childChoseGuests + childChoseFood + childChoseActivity;
  const childChoiceRate = pct(totalChoicesMade, totalChoiceOpportunities);

  const culturalConsiderations = birthday_plan_records.filter((r) => r.cultural_considerations_documented).length;
  const culturalConsiderationRate = pct(culturalConsiderations, totalBirthdayPlans);

  const advancePlanned = birthday_plan_records.filter((r) => r.days_advance_planned >= 14).length;
  const advancePlanningRate = pct(advancePlanned, totalBirthdayPlans);

  const familyContactArranged = birthday_plan_records.filter((r) => r.family_contact_arranged).length;
  const familyContactRate = pct(familyContactArranged, totalBirthdayPlans);

  const totalSpecialRequests = birthday_plan_records.reduce(
    (sum, r) => sum + r.special_requests_noted.length, 0,
  );
  const totalSpecialRequestsFulfilled = birthday_plan_records.reduce(
    (sum, r) => sum + r.special_requests_fulfilled.length, 0,
  );
  const specialRequestFulfilmentRate = pct(totalSpecialRequestsFulfilled, totalSpecialRequests);

  // --- Celebration execution quality ---
  const totalCelebrations = celebration_execution_records.length;
  const celebrationsHeld = celebration_execution_records.filter((r) => r.celebration_held).length;
  const celebrationExecutionRate = pct(celebrationsHeld, totalCelebrations);

  const heldOnDate = celebration_execution_records.filter((r) => r.held_on_actual_date).length;
  const onDateRate = pct(heldOnDate, totalCelebrations);

  const personalised = celebration_execution_records.filter((r) => r.personalised_to_child).length;
  const personalisationRate = pct(personalised, totalCelebrations);

  const staffEnthusiasmSum = celebration_execution_records.reduce(
    (sum, r) => sum + r.staff_enthusiasm_rating, 0,
  );
  const staffEnthusiasmAvg =
    totalCelebrations > 0
      ? Math.round((staffEnthusiasmSum / totalCelebrations) * 100) / 100
      : null;

  const peersParticipated = celebration_execution_records.filter((r) => r.peers_participated).length;
  const peerParticipationRate = pct(peersParticipated, totalCelebrations);

  const familyAttended = celebration_execution_records.filter((r) => r.family_attended).length;
  const familyAttendanceRate = pct(familyAttended, totalCelebrations);

  const decorationsProvided = celebration_execution_records.filter((r) => r.decorations_provided).length;
  const decorationsRate = pct(decorationsProvided, totalCelebrations);

  const cakeProvided = celebration_execution_records.filter((r) => r.cake_or_treat_provided).length;
  const cakeRate = pct(cakeProvided, totalCelebrations);

  const atmosphereSum = celebration_execution_records.reduce(
    (sum, r) => sum + r.atmosphere_rating, 0,
  );
  const atmosphereAvg =
    totalCelebrations > 0
      ? Math.round((atmosphereSum / totalCelebrations) * 100) / 100
      : null;

  const safeguardingConsidered = celebration_execution_records.filter((r) => r.safeguarding_considered).length;
  const safeguardingRate = pct(safeguardingConsidered, totalCelebrations);

  // --- Gift provision adequacy ---
  const totalGiftRecords = gift_provision_records.length;
  const giftsProvided = gift_provision_records.filter((r) => r.gift_provided).length;
  const giftProvisionRate = pct(giftsProvided, totalGiftRecords);

  const giftsPersonalised = gift_provision_records.filter((r) => r.gift_personalised).length;
  const giftPersonalisationRate = pct(giftsPersonalised, totalGiftRecords);

  const budgetAdequate = gift_provision_records.filter((r) => r.budget_adequate).length;
  const budgetAdequacyRate = pct(budgetAdequate, totalGiftRecords);

  const presentedThoughtfully = gift_provision_records.filter((r) => r.presented_thoughtfully).length;
  const thoughtfulPresentationRate = pct(presentedThoughtfully, totalGiftRecords);

  const positiveReaction = gift_provision_records.filter((r) => r.child_reaction_positive).length;
  const positiveReactionRate = pct(positiveReaction, totalGiftRecords);

  const equitableGifts = gift_provision_records.filter((r) => r.equitable_with_peers).length;
  const equityRate = pct(equitableGifts, totalGiftRecords);

  // --- Memory-making activity quality ---
  const totalMemoryRecords = memory_making_records.length;
  const memoriesCompleted = memory_making_records.filter((r) => r.activity_completed).length;
  const memoryMakingRate = pct(memoriesCompleted, totalMemoryRecords);

  const childConsentedMemory = memory_making_records.filter((r) => r.child_consented).length;
  const childConsentRate = pct(childConsentedMemory, totalMemoryRecords);

  const storedSecurely = memory_making_records.filter((r) => r.memory_stored_securely).length;
  const secureStorageRate = pct(storedSecurely, totalMemoryRecords);

  const addedToLifeStory = memory_making_records.filter((r) => r.added_to_life_story).length;
  const lifeStoryRate = pct(addedToLifeStory, totalMemoryRecords);

  const childHasCopy = memory_making_records.filter((r) => r.child_has_copy).length;
  const childCopyRate = pct(childHasCopy, totalMemoryRecords);

  const qualitySum = memory_making_records.reduce(
    (sum, r) => sum + r.quality_rating, 0,
  );
  const memoryQualityAvg =
    totalMemoryRecords > 0
      ? Math.round((qualitySum / totalMemoryRecords) * 100) / 100
      : null;

  // --- Child satisfaction with celebrations ---
  const totalSatisfactionRecords = child_satisfaction_records.length;
  const childSatisfactionRate =
    totalSatisfactionRecords > 0
      ? pct(
          child_satisfaction_records.filter((r) => r.overall_satisfaction >= 4).length,
          totalSatisfactionRecords,
        )
      : 0;

  const feltSpecial = child_satisfaction_records.filter((r) => r.felt_special).length;
  const feltSpecialRate = pct(feltSpecial, totalSatisfactionRecords);

  const feltListenedTo = child_satisfaction_records.filter((r) => r.felt_listened_to).length;
  const feltListenedToRate = pct(feltListenedTo, totalSatisfactionRecords);

  const feltEqualToPeers = child_satisfaction_records.filter((r) => r.felt_equal_to_peers).length;
  const feltEqualRate = pct(feltEqualToPeers, totalSatisfactionRecords);

  const celebrationMatchedWishes = child_satisfaction_records.filter((r) => r.celebration_matched_wishes).length;
  const wishMatchRate = pct(celebrationMatchedWishes, totalSatisfactionRecords);

  const feedbackActedUpon = child_satisfaction_records.filter((r) => r.feedback_acted_upon).length;
  const feedbackActionRate = pct(feedbackActedUpon, totalSatisfactionRecords);

  const followUpCompleted = child_satisfaction_records.filter((r) => r.follow_up_completed).length;
  const followUpRate = pct(followUpCompleted, totalSatisfactionRecords);

  const wouldChangeAnything = child_satisfaction_records.filter((r) => r.would_change_anything).length;
  const wouldChangeRate = pct(wouldChangeAnything, totalSatisfactionRecords);

  // -- Scoring: base 52 ----------------------------------------------------

  let score = 52;

  // --- Bonus 1: birthdayPlanningRate (>=90: +4, >=70: +2) ---
  if (meets(birthdayPlanningRate, 90)) score += 4;
  else if (meets(birthdayPlanningRate, 70)) score += 2;

  // --- Bonus 2: celebrationExecutionRate (>=90: +4, >=70: +2) ---
  if (meets(celebrationExecutionRate, 90)) score += 4;
  else if (meets(celebrationExecutionRate, 70)) score += 2;

  // --- Bonus 3: giftProvisionRate (>=90: +3, >=70: +1) ---
  if (meets(giftProvisionRate, 90)) score += 3;
  else if (meets(giftProvisionRate, 70)) score += 1;

  // --- Bonus 4: memoryMakingRate (>=90: +3, >=70: +1) ---
  if (meets(memoryMakingRate, 90)) score += 3;
  else if (meets(memoryMakingRate, 70)) score += 1;

  // --- Bonus 5: childSatisfactionRate (>=90: +4, >=70: +2) ---
  if (meets(childSatisfactionRate, 90)) score += 4;
  else if (meets(childSatisfactionRate, 70)) score += 2;

  // --- Bonus 6: childChoiceRate (>=80: +3, >=60: +1) ---
  if (meets(childChoiceRate, 80)) score += 3;
  else if (meets(childChoiceRate, 60)) score += 1;

  // --- Bonus 7: personalisationRate (>=90: +3, >=70: +1) ---
  if (meets(personalisationRate, 90)) score += 3;
  else if (meets(personalisationRate, 70)) score += 1;

  // --- Bonus 8: feltSpecialRate (>=90: +2, >=70: +1) ---
  if (meets(feltSpecialRate, 90)) score += 2;
  else if (meets(feltSpecialRate, 70)) score += 1;

  // --- Bonus 9: lifeStoryRate (>=80: +2, >=50: +1) ---
  if (meets(lifeStoryRate, 80)) score += 2;
  else if (meets(lifeStoryRate, 50)) score += 1;

  // -- Penalties (4 with guards) -------------------------------------------

  // birthdayPlanningRate < 50 -> -5
  if (below(birthdayPlanningRate, 50) && totalBirthdayPlans > 0) score -= 5;

  // celebrationExecutionRate < 50 -> -5
  if (below(celebrationExecutionRate, 50) && totalCelebrations > 0) score -= 5;

  // giftProvisionRate < 50 -> -4
  if (below(giftProvisionRate, 50) && totalGiftRecords > 0) score -= 4;

  // childSatisfactionRate < 30 -> -4
  if (below(childSatisfactionRate, 30) && totalSatisfactionRecords > 0) score -= 4;

  score = clamp(score, 0, 100);

  const celebration_rating = toRating(score);

  // -- Strengths ------------------------------------------------------------

  const strengths: string[] = [];

  if (meets(birthdayPlanningRate, 90) && totalBirthdayPlans > 0) {
    strengths.push(
      `${birthdayPlanningRate}% of birthdays have personalised plans created -- the home demonstrates consistent commitment to planning every child's birthday celebration.`,
    );
  } else if (meets(birthdayPlanningRate, 70) && totalBirthdayPlans > 0) {
    strengths.push(
      `${birthdayPlanningRate}% birthday planning rate -- most children have a personalised birthday plan in place.`,
    );
  }

  if (meets(childConsultationRate, 90) && totalBirthdayPlans > 0) {
    strengths.push(
      `${childConsultationRate}% of children consulted about their birthday celebrations -- children's voices genuinely shape how their birthdays are celebrated.`,
    );
  } else if (meets(childConsultationRate, 70) && totalBirthdayPlans > 0) {
    strengths.push(
      `${childConsultationRate}% child consultation rate for birthday planning -- good practice in involving children in their own celebrations.`,
    );
  }

  if (meets(childChoiceRate, 80) && totalChoiceOpportunities > 0) {
    strengths.push(
      `${childChoiceRate}% of celebration choices made by children (theme, guests, food, activity) -- children are empowered to shape their own celebrations.`,
    );
  } else if (meets(childChoiceRate, 60) && totalChoiceOpportunities > 0) {
    strengths.push(
      `${childChoiceRate}% child choice rate across celebration decisions -- children have meaningful input into their celebration plans.`,
    );
  }

  if (meets(advancePlanningRate, 80) && totalBirthdayPlans > 0) {
    strengths.push(
      `${advancePlanningRate}% of birthday celebrations planned at least 14 days in advance -- the home demonstrates forethought and commitment to creating special days for children.`,
    );
  }

  if (meets(celebrationExecutionRate, 90) && totalCelebrations > 0) {
    strengths.push(
      `${celebrationExecutionRate}% celebration execution rate -- the home consistently follows through on planned celebrations.`,
    );
  } else if (meets(celebrationExecutionRate, 70) && totalCelebrations > 0) {
    strengths.push(
      `${celebrationExecutionRate}% of planned celebrations executed -- most celebrations are delivered as planned.`,
    );
  }

  if (meets(onDateRate, 90) && totalCelebrations > 0) {
    strengths.push(
      `${onDateRate}% of celebrations held on the actual date -- children feel valued when their special day is honoured on time.`,
    );
  }

  if (meets(personalisationRate, 90) && totalCelebrations > 0) {
    strengths.push(
      `${personalisationRate}% of celebrations personalised to the individual child -- each celebration reflects the child's personality, interests, and wishes.`,
    );
  } else if (meets(personalisationRate, 70) && totalCelebrations > 0) {
    strengths.push(
      `${personalisationRate}% personalisation rate -- most celebrations are tailored to the individual child.`,
    );
  }

  if ((staffEnthusiasmAvg ?? 0) >= 4.0 && totalCelebrations > 0) {
    strengths.push(
      `Staff enthusiasm for celebrations averages ${staffEnthusiasmAvg}/5 -- staff demonstrate genuine warmth and engagement in celebrating children's milestones.`,
    );
  }

  if (meets(peerParticipationRate, 80) && totalCelebrations > 0) {
    strengths.push(
      `Peers participate in ${peerParticipationRate}% of celebrations -- celebrations are social, inclusive occasions that strengthen relationships between children.`,
    );
  }

  if (meets(familyAttendanceRate, 50) && totalCelebrations > 0) {
    strengths.push(
      `Family members attend ${familyAttendanceRate}% of celebrations -- the home actively enables family involvement in children's special occasions.`,
    );
  }

  if (meets(decorationsRate, 90) && meets(cakeRate, 90) && totalCelebrations > 0) {
    strengths.push(
      "Decorations and cake or treats provided for the vast majority of celebrations -- the home invests in creating a festive atmosphere that helps children feel special.",
    );
  }

  if ((atmosphereAvg ?? 0) >= 4.0 && totalCelebrations > 0) {
    strengths.push(
      `Celebration atmosphere averages ${atmosphereAvg}/5 -- celebrations are joyful occasions that create positive memories for children.`,
    );
  }

  if (meets(giftProvisionRate, 90) && totalGiftRecords > 0) {
    strengths.push(
      `${giftProvisionRate}% gift provision rate -- every child receives gifts for their celebrations.`,
    );
  } else if (meets(giftProvisionRate, 70) && totalGiftRecords > 0) {
    strengths.push(
      `${giftProvisionRate}% gift provision rate -- most children receive gifts for their celebrations.`,
    );
  }

  if (meets(giftPersonalisationRate, 90) && totalGiftRecords > 0) {
    strengths.push(
      `${giftPersonalisationRate}% of gifts personalised to children's preferences -- gifts reflect genuine knowledge of each child's interests and wishes.`,
    );
  } else if (meets(giftPersonalisationRate, 70) && totalGiftRecords > 0) {
    strengths.push(
      `${giftPersonalisationRate}% gift personalisation rate -- most gifts are tailored to children's individual preferences.`,
    );
  }

  if (meets(equityRate, 90) && totalGiftRecords > 0) {
    strengths.push(
      `${equityRate}% of gifts equitable with peers -- children are treated fairly and do not feel disadvantaged compared to their housemates.`,
    );
  }

  if (meets(thoughtfulPresentationRate, 90) && totalGiftRecords > 0) {
    strengths.push(
      `${thoughtfulPresentationRate}% of gifts presented thoughtfully -- the home ensures the moment of giving is as special as the gift itself.`,
    );
  }

  if (meets(positiveReactionRate, 90) && totalGiftRecords > 0) {
    strengths.push(
      `${positiveReactionRate}% positive child reactions to gifts -- children genuinely enjoy and value their presents.`,
    );
  }

  if (meets(memoryMakingRate, 90) && totalMemoryRecords > 0) {
    strengths.push(
      `${memoryMakingRate}% of memory-making activities completed -- the home consistently creates lasting memories of celebrations.`,
    );
  } else if (meets(memoryMakingRate, 70) && totalMemoryRecords > 0) {
    strengths.push(
      `${memoryMakingRate}% memory-making completion rate -- most celebrations include activities that create lasting memories.`,
    );
  }

  if (meets(lifeStoryRate, 80) && totalMemoryRecords > 0) {
    strengths.push(
      `${lifeStoryRate}% of celebration memories added to children's life stories -- celebrations contribute to each child's sense of identity and personal history.`,
    );
  }

  if (meets(childCopyRate, 80) && totalMemoryRecords > 0) {
    strengths.push(
      `${childCopyRate}% of celebration memories available to children as personal copies -- children own their own celebration memories.`,
    );
  }

  if ((memoryQualityAvg ?? 0) >= 4.0 && totalMemoryRecords > 0) {
    strengths.push(
      `Memory-making quality averages ${memoryQualityAvg}/5 -- celebration memories are high quality and meaningful.`,
    );
  }

  if (meets(childSatisfactionRate, 90) && totalSatisfactionRecords > 0) {
    strengths.push(
      `${childSatisfactionRate}% of children rate their celebration experience 4 or 5 out of 5 -- children feel genuinely celebrated and valued.`,
    );
  } else if (meets(childSatisfactionRate, 70) && totalSatisfactionRecords > 0) {
    strengths.push(
      `${childSatisfactionRate}% child satisfaction rate with celebrations -- most children are happy with how their special occasions are celebrated.`,
    );
  }

  if (meets(feltSpecialRate, 90) && totalSatisfactionRecords > 0) {
    strengths.push(
      `${feltSpecialRate}% of children felt special during their celebrations -- the home creates an atmosphere where every child feels uniquely valued.`,
    );
  } else if (meets(feltSpecialRate, 70) && totalSatisfactionRecords > 0) {
    strengths.push(
      `${feltSpecialRate}% of children felt special during celebrations -- most children feel their day is about them.`,
    );
  }

  if (meets(feltListenedToRate, 90) && totalSatisfactionRecords > 0) {
    strengths.push(
      `${feltListenedToRate}% of children felt listened to about their celebration preferences -- children's voices are heard and acted upon.`,
    );
  }

  if (meets(wishMatchRate, 90) && totalSatisfactionRecords > 0) {
    strengths.push(
      `${wishMatchRate}% of celebrations matched children's wishes -- the home delivers on what children ask for.`,
    );
  }

  if (meets(feltEqualRate, 90) && totalSatisfactionRecords > 0) {
    strengths.push(
      `${feltEqualRate}% of children feel treated equally to peers in celebrations -- equity in celebration provision supports children's sense of belonging and fairness.`,
    );
  }

  if (meets(feedbackActionRate, 80) && totalSatisfactionRecords > 0) {
    strengths.push(
      `Feedback acted upon for ${feedbackActionRate}% of celebrations -- the home demonstrates a learning culture by responding to children's celebration feedback.`,
    );
  }

  if (meets(specialRequestFulfilmentRate, 90) && totalSpecialRequests > 0) {
    strengths.push(
      `${specialRequestFulfilmentRate}% of special birthday requests fulfilled -- the home goes the extra mile to honour children's specific wishes.`,
    );
  }

  if (meets(culturalConsiderationRate, 90) && totalBirthdayPlans > 0) {
    strengths.push(
      `Cultural considerations documented for ${culturalConsiderationRate}% of birthday plans -- the home respects and reflects each child's cultural background in celebrations.`,
    );
  }

  if (meets(familyContactRate, 80) && totalBirthdayPlans > 0) {
    strengths.push(
      `Family contact arranged for ${familyContactRate}% of birthday celebrations -- children can share their special day with family even when not living together.`,
    );
  }

  if (meets(safeguardingRate, 90) && totalCelebrations > 0) {
    strengths.push(
      `Safeguarding considered for ${safeguardingRate}% of celebrations -- the home ensures celebrations are safe and well-planned.`,
    );
  }

  if (meets(secureStorageRate, 90) && totalMemoryRecords > 0) {
    strengths.push(
      `${secureStorageRate}% of celebration memories stored securely -- children's private celebration records are properly safeguarded.`,
    );
  }

  // -- Concerns -------------------------------------------------------------

  const concerns: string[] = [];

  if (below(birthdayPlanningRate, 50) && totalBirthdayPlans > 0) {
    concerns.push(
      `Only ${birthdayPlanningRate}% of birthdays have plans created -- the majority of children do not have a personalised birthday plan, denying them the anticipation and personalisation that makes birthdays special.`,
    );
  } else if (below(birthdayPlanningRate, 70) && meets(birthdayPlanningRate, 50) && totalBirthdayPlans > 0) {
    concerns.push(
      `Birthday planning rate at ${birthdayPlanningRate}% -- some children's birthdays are not being formally planned and personalised.`,
    );
  }

  if (below(childConsultationRate, 50) && totalBirthdayPlans > 0) {
    concerns.push(
      `Only ${childConsultationRate}% of children consulted about their birthday celebrations -- children are not being given a voice in how their most personal day is celebrated.`,
    );
  } else if (below(childConsultationRate, 70) && meets(childConsultationRate, 50) && totalBirthdayPlans > 0) {
    concerns.push(
      `Child consultation rate at ${childConsultationRate}% -- not all children are being asked about their birthday preferences.`,
    );
  }

  if (below(childChoiceRate, 50) && totalChoiceOpportunities > 0) {
    concerns.push(
      `Only ${childChoiceRate}% of celebration choices made by children -- children are not being empowered to shape their own celebrations, which undermines their sense of agency and control.`,
    );
  }

  if (below(celebrationExecutionRate, 50) && totalCelebrations > 0) {
    concerns.push(
      `Only ${celebrationExecutionRate}% of planned celebrations executed -- the majority of celebrations are not being delivered, meaning children are being let down on their special occasions.`,
    );
  } else if (below(celebrationExecutionRate, 70) && meets(celebrationExecutionRate, 50) && totalCelebrations > 0) {
    concerns.push(
      `Celebration execution rate at ${celebrationExecutionRate}% -- some planned celebrations are not being delivered, which risks disappointing children.`,
    );
  }

  if (below(onDateRate, 50) && totalCelebrations > 0) {
    concerns.push(
      `Only ${onDateRate}% of celebrations held on the actual date -- most children's special days are not being celebrated when they should be.`,
    );
  }

  if (below(personalisationRate, 50) && totalCelebrations > 0) {
    concerns.push(
      `Only ${personalisationRate}% of celebrations personalised to the individual child -- generic celebrations fail to make children feel individually valued and known.`,
    );
  } else if (below(personalisationRate, 70) && meets(personalisationRate, 50) && totalCelebrations > 0) {
    concerns.push(
      `Personalisation rate at ${personalisationRate}% -- some celebrations are not tailored to children's individual interests and preferences.`,
    );
  }

  if ((staffEnthusiasmAvg ?? 0) < 3.0 && totalCelebrations > 0) {
    concerns.push(
      `Staff enthusiasm for celebrations averages only ${staffEnthusiasmAvg}/5 -- children will notice when staff are not genuinely engaged in their special occasions, undermining the sense that celebrations matter.`,
    );
  }

  if ((atmosphereAvg ?? 0) < 3.0 && totalCelebrations > 0) {
    concerns.push(
      `Celebration atmosphere averages only ${atmosphereAvg}/5 -- celebrations are not creating the joyful, warm experiences that children deserve.`,
    );
  }

  if (below(giftProvisionRate, 50) && totalGiftRecords > 0) {
    concerns.push(
      `Only ${giftProvisionRate}% gift provision rate -- the majority of children are not receiving gifts for their celebrations, which is a fundamental failure to make children feel valued and cared for.`,
    );
  } else if (below(giftProvisionRate, 70) && meets(giftProvisionRate, 50) && totalGiftRecords > 0) {
    concerns.push(
      `Gift provision at ${giftProvisionRate}% -- some children are not receiving gifts for their special occasions.`,
    );
  }

  if (below(giftPersonalisationRate, 50) && totalGiftRecords > 0) {
    concerns.push(
      `Only ${giftPersonalisationRate}% of gifts personalised -- generic gifts signal that staff do not know or value children's individual interests and preferences.`,
    );
  }

  if (below(equityRate, 70) && totalGiftRecords > 0) {
    concerns.push(
      `Only ${equityRate}% of gifts equitable with peers -- inequitable gift provision creates feelings of unfairness and being less valued among children.`,
    );
  }

  if (below(budgetAdequacyRate, 50) && totalGiftRecords > 0) {
    concerns.push(
      `Only ${budgetAdequacyRate}% of gift budgets considered adequate -- insufficient investment in gifts communicates to children that their celebrations are not a priority.`,
    );
  }

  if (below(memoryMakingRate, 50) && totalMemoryRecords > 0) {
    concerns.push(
      `Only ${memoryMakingRate}% of memory-making activities completed -- children are missing out on lasting records of their celebrations that contribute to their sense of identity and personal history.`,
    );
  } else if (below(memoryMakingRate, 70) && meets(memoryMakingRate, 50) && totalMemoryRecords > 0) {
    concerns.push(
      `Memory-making at ${memoryMakingRate}% -- some celebrations lack activities that create lasting memories for children.`,
    );
  }

  if (below(lifeStoryRate, 50) && totalMemoryRecords > 0) {
    concerns.push(
      `Only ${lifeStoryRate}% of celebration memories added to life stories -- children are losing important identity-building moments from their personal narrative.`,
    );
  }

  if (below(childConsentRate, 70) && totalMemoryRecords > 0) {
    concerns.push(
      `Child consent for memory-making activities at only ${childConsentRate}% -- children's privacy and autonomy regarding photographs and recordings must be consistently respected.`,
    );
  }

  if (below(childSatisfactionRate, 30) && totalSatisfactionRecords > 0) {
    concerns.push(
      `Only ${childSatisfactionRate}% of children rate celebrations 4+ out of 5 -- the majority of children are not satisfied with how their special occasions are celebrated.`,
    );
  } else if (below(childSatisfactionRate, 70) && meets(childSatisfactionRate, 30) && totalSatisfactionRecords > 0) {
    concerns.push(
      `Child satisfaction at ${childSatisfactionRate}% -- not all children are happy with their celebrations.`,
    );
  }

  if (below(feltSpecialRate, 50) && totalSatisfactionRecords > 0) {
    concerns.push(
      `Only ${feltSpecialRate}% of children felt special during their celebrations -- the home is failing to create the sense of being uniquely valued that every child deserves on their special day.`,
    );
  } else if (below(feltSpecialRate, 70) && meets(feltSpecialRate, 50) && totalSatisfactionRecords > 0) {
    concerns.push(
      `Only ${feltSpecialRate}% of children felt special -- some children do not feel their celebrations are truly about them.`,
    );
  }

  if (below(feltListenedToRate, 50) && totalSatisfactionRecords > 0) {
    concerns.push(
      `Only ${feltListenedToRate}% of children felt listened to about celebration preferences -- children's wishes are not being adequately sought or honoured.`,
    );
  }

  if (below(feltEqualRate, 50) && totalSatisfactionRecords > 0) {
    concerns.push(
      `Only ${feltEqualRate}% of children feel treated equally to peers in celebrations -- perceived inequality in celebration provision undermines children's sense of belonging and fairness.`,
    );
  }

  if (below(wishMatchRate, 50) && totalSatisfactionRecords > 0) {
    concerns.push(
      `Only ${wishMatchRate}% of celebrations matched children's wishes -- there is a significant gap between what children want and what they receive.`,
    );
  }

  if (below(feedbackActionRate, 50) && totalSatisfactionRecords > 0) {
    concerns.push(
      `Feedback acted upon for only ${feedbackActionRate}% of celebrations -- children's views about improving celebrations are not being implemented.`,
    );
  }

  if (totalBirthdayPlans === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No birthday plan records despite children being on placement -- the home may not be planning or personalising children's birthday celebrations.",
    );
  }

  if (totalGiftRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No gift provision records -- the home has not documented whether children receive gifts for birthdays and special occasions.",
    );
  }

  if (totalMemoryRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No memory-making records -- the home has not evidenced any activities to create lasting celebration memories for children.",
    );
  }

  if (totalSatisfactionRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No child satisfaction records for celebrations -- children's views about their celebration experiences are not being captured.",
    );
  }

  // -- Recommendations ------------------------------------------------------

  const recommendations: BirthdayCelebrationRecommendation[] = [];
  let rank = 0;

  if (below(birthdayPlanningRate, 50) && totalBirthdayPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently implement personalised birthday plans for every child -- each plan should be created at least 14 days in advance, with the child consulted on theme, guests, food, and activities. Allocate adequate budget and document cultural considerations.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging activities, community",
    });
  }

  if (below(celebrationExecutionRate, 50) && totalCelebrations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately address the failure to deliver planned celebrations -- every planned celebration must be executed. Identify barriers to delivery (staffing, resources, scheduling) and remove them. Children must not be let down on their special occasions.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging activities, community",
    });
  }

  if (below(giftProvisionRate, 50) && totalGiftRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every child receives personalised, age-appropriate gifts for birthdays and key celebrations -- gifts should reflect children's known interests and be equitable with what peers receive. Review budget allocation and gift purchasing processes.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging activities, community",
    });
  }

  if (below(childSatisfactionRate, 30) && totalSatisfactionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review celebration quality with children -- satisfaction is critically low. Conduct individual conversations with every child about what would make their celebrations feel special and implement changes immediately.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 -- Children's views",
    });
  }

  if (below(childChoiceRate, 50) && totalChoiceOpportunities > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Give children genuine choice over their celebration decisions -- theme, guest list, food, and activities should all be led by the child's wishes. Staff should present options and support children's choices rather than making decisions for them.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 -- Children's views",
    });
  }

  if (below(feltSpecialRate, 50) && totalSatisfactionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review why children do not feel special during celebrations and implement targeted improvements -- consider personalised touches, individual attention from staff, and ensuring the child is the centre of attention on their day.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (below(personalisationRate, 50) && totalCelebrations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Move away from generic, one-size-fits-all celebrations -- each celebration should reflect the individual child's personality, interests, cultural background, and expressed wishes. Use the child's plan and keywork sessions to inform personalisation.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging activities, community",
    });
  }

  if (below(memoryMakingRate, 50) && totalMemoryRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement memory-making as a standard part of every celebration -- photographs, memory books, certificates, and keepsakes should be created with children's consent and added to their life stories.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (below(lifeStoryRate, 50) && totalMemoryRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure celebration memories are systematically added to children's life story work -- celebrations are identity-building milestones that should be preserved as part of each child's personal narrative.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging activities, community",
    });
  }

  if (below(equityRate, 70) && totalGiftRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review gift equity across children -- establish clear budgets and guidelines to ensure all children are treated fairly. Monitor that no child feels they receive less than their peers.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging activities, community",
    });
  }

  if (below(feedbackActionRate, 50) && totalSatisfactionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a feedback-to-action loop for celebrations -- collect children's views after every celebration and implement improvements for subsequent occasions. Demonstrate to children that their feedback makes a difference.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 -- Children's views",
    });
  }

  if (below(familyContactRate, 50) && totalBirthdayPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Arrange family contact (calls, video calls, or visits) for every child's birthday where safe and appropriate -- birthdays are key moments for family connection and should be facilitated even when physical visits are not possible.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 -- Children's views",
    });
  }

  if (meets(birthdayPlanningRate, 50) && below(birthdayPlanningRate, 70) && totalBirthdayPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve birthday planning rate to at least 70% -- ensure every child has a documented plan that reflects their wishes well in advance of their birthday.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging activities, community",
    });
  }

  if (meets(celebrationExecutionRate, 50) && below(celebrationExecutionRate, 70) && totalCelebrations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase celebration execution to at least 70% -- review why some planned celebrations are not being delivered and address resourcing or scheduling barriers.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging activities, community",
    });
  }

  if (meets(giftProvisionRate, 50) && below(giftProvisionRate, 70) && totalGiftRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve gift provision rate to at least 70% -- review processes for purchasing, wrapping, and presenting gifts to ensure no child is missed.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging activities, community",
    });
  }

  if (meets(childSatisfactionRate, 30) && below(childSatisfactionRate, 70) && totalSatisfactionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve celebration satisfaction through targeted personalisation -- review individual children's feedback to identify what would raise their celebration experience from adequate to outstanding.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (totalBirthdayPlans === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement birthday planning for every child on placement -- create a birthday calendar and begin personalised plans at least 14 days before each child's birthday.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging activities, community",
    });
  }

  if (totalGiftRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Begin recording gift provision for birthdays and special occasions -- document what is given, how it is personalised, and whether children are satisfied.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Engaging activities, community",
    });
  }

  if (totalMemoryRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Introduce memory-making activities for all celebrations -- ensure photographs, keepsakes, or life story additions are created with children's consent for every celebration.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (totalSatisfactionRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement post-celebration satisfaction surveys with every child -- capture whether children felt special, listened to, and satisfied, and use their feedback to improve future celebrations.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 7 -- Children's views",
    });
  }

  // -- Insights -------------------------------------------------------------

  const insights: BirthdayCelebrationInsight[] = [];

  // --- Critical insights ---

  if (below(birthdayPlanningRate, 50) && totalBirthdayPlans > 0) {
    insights.push({
      text: `Only ${birthdayPlanningRate}% of birthdays have personalised plans. Ofsted will view the absence of birthday planning as evidence that the home does not prioritise making children feel individually valued -- a core expectation of nurturing, personalised care under Reg 5.`,
      severity: "critical",
    });
  }

  if (below(celebrationExecutionRate, 50) && totalCelebrations > 0) {
    insights.push({
      text: `Only ${celebrationExecutionRate}% of planned celebrations delivered. Failing to follow through on celebrations is deeply damaging to looked-after children who may already have experiences of being let down. Ofsted expects consistent, reliable celebration of milestones under Reg 5.`,
      severity: "critical",
    });
  }

  if (below(giftProvisionRate, 50) && totalGiftRecords > 0) {
    insights.push({
      text: `Only ${giftProvisionRate}% gift provision rate. For looked-after children, receiving gifts on birthdays and special occasions is not a luxury -- it is fundamental to feeling cared for and valued. The absence of gifts sends a powerful message that the child does not matter.`,
      severity: "critical",
    });
  }

  if (below(childSatisfactionRate, 30) && totalSatisfactionRecords > 0) {
    insights.push({
      text: `Only ${childSatisfactionRate}% of children rate celebrations positively. When the majority of children are dissatisfied with their celebrations, it signals a systemic failure to create meaningful, personalised experiences. Ofsted inspectors will explore this with children directly.`,
      severity: "critical",
    });
  }

  if (below(feltSpecialRate, 50) && totalSatisfactionRecords > 0) {
    insights.push({
      text: `Only ${feltSpecialRate}% of children felt special during celebrations. For children in care, feeling special on their birthday or celebration is a critical emotional need. When children do not feel special, it reinforces feelings of not being valued or important.`,
      severity: "critical",
    });
  }

  if (totalBirthdayPlans === 0 && totalGiftRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No birthday planning or gift provision records exist despite children being on placement. Ofsted may interpret the absence of records as evidence that children's birthdays are not being celebrated at all -- this is a significant omission under Reg 5.",
      severity: "critical",
    });
  }

  // --- Warning insights ---

  if (meets(birthdayPlanningRate, 50) && below(birthdayPlanningRate, 70) && totalBirthdayPlans > 0) {
    insights.push({
      text: `Birthday planning at ${birthdayPlanningRate}% -- improving but some children still lack personalised birthday plans. Every child deserves anticipation and personalisation for their birthday.`,
      severity: "warning",
    });
  }

  if (meets(celebrationExecutionRate, 50) && below(celebrationExecutionRate, 70) && totalCelebrations > 0) {
    insights.push({
      text: `Celebration execution at ${celebrationExecutionRate}% -- some celebrations are not being delivered as planned. Even one missed celebration can be deeply disappointing for a child in care.`,
      severity: "warning",
    });
  }

  if (meets(personalisationRate, 50) && below(personalisationRate, 70) && totalCelebrations > 0) {
    insights.push({
      text: `Personalisation at ${personalisationRate}% -- not all celebrations reflect the individual child. Generic celebrations can feel institutional rather than homely and nurturing.`,
      severity: "warning",
    });
  }

  if (meets(childChoiceRate, 50) && below(childChoiceRate, 80) && totalChoiceOpportunities > 0) {
    insights.push({
      text: `Child choice rate at ${childChoiceRate}% -- children are not consistently empowered to make decisions about their own celebrations. Increasing choice strengthens children's agency and sense of control.`,
      severity: "warning",
    });
  }

  if (meets(giftProvisionRate, 50) && below(giftProvisionRate, 70) && totalGiftRecords > 0) {
    insights.push({
      text: `Gift provision at ${giftProvisionRate}% -- while improving, some children are still not receiving gifts. Every missed gift is a missed opportunity to show a child they are valued.`,
      severity: "warning",
    });
  }

  if (meets(memoryMakingRate, 50) && below(memoryMakingRate, 70) && totalMemoryRecords > 0) {
    insights.push({
      text: `Memory-making at ${memoryMakingRate}% -- some celebrations lack lasting memory-making activities. Celebration memories are important for identity development and life story work.`,
      severity: "warning",
    });
  }

  if (meets(childSatisfactionRate, 30) && below(childSatisfactionRate, 70) && totalSatisfactionRecords > 0) {
    insights.push({
      text: `Child satisfaction at ${childSatisfactionRate}% -- some children are not happy with their celebrations. Listening to dissatisfied children and acting on their feedback is essential.`,
      severity: "warning",
    });
  }

  if (meets(feltSpecialRate, 50) && below(feltSpecialRate, 70) && totalSatisfactionRecords > 0) {
    insights.push({
      text: `Only ${feltSpecialRate}% of children felt special -- some children do not feel their celebrations are truly about them. Small, personalised touches can make a significant difference.`,
      severity: "warning",
    });
  }

  if (meets(equityRate, 50) && below(equityRate, 70) && totalGiftRecords > 0) {
    insights.push({
      text: `Gift equity at ${equityRate}% -- some children perceive inequality in how gifts are provided. Looked-after children are particularly sensitive to fairness, as inequity reinforces feelings of being less valued.`,
      severity: "warning",
    });
  }

  if (meets(wouldChangeRate, 40) && totalSatisfactionRecords > 0) {
    insights.push({
      text: `${wouldChangeRate}% of children would change something about their celebration -- this level of dissatisfaction suggests systematic improvement is needed to meet children's expectations.`,
      severity: "warning",
    });
  }

  if ((staffEnthusiasmAvg ?? 0) >= 3.0 && (staffEnthusiasmAvg ?? 0) < 4.0 && totalCelebrations > 0) {
    insights.push({
      text: `Staff enthusiasm at ${staffEnthusiasmAvg}/5 -- adequate but not outstanding. Children thrive when staff are genuinely excited and engaged in their celebrations. Consider staff training on creating celebratory atmospheres.`,
      severity: "warning",
    });
  }

  if (meets(familyContactRate, 30) && below(familyContactRate, 50) && totalBirthdayPlans > 0) {
    insights.push({
      text: `Family contact arranged for only ${familyContactRate}% of birthdays -- many children are unable to share their birthday with family. Where safe, family connection should be facilitated on children's special days.`,
      severity: "warning",
    });
  }

  // --- Celebration type diversity insight ---
  const celebrationTypes = new Set(
    celebration_execution_records.map((r) => r.celebration_type),
  );
  if (celebrationTypes.size >= 4) {
    insights.push({
      text: `The home celebrates ${celebrationTypes.size} different types of occasions -- this diversity shows commitment to marking a wide range of milestones and cultural events that are meaningful to children.`,
      severity: "positive",
    });
  }

  // --- Positive insights ---

  if (celebration_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding birthday and celebration provision -- every child feels valued, special, and celebrated on their important days. This is strong evidence of nurturing, personalised care under Reg 5 and meaningful Reg 7 child participation.",
      severity: "positive",
    });
  }

  if (meets(birthdayPlanningRate, 90) && meets(childConsultationRate, 90) && totalBirthdayPlans > 0) {
    insights.push({
      text: `${birthdayPlanningRate}% birthday planning with ${childConsultationRate}% child consultation -- the home plans every birthday with the child at the centre. Ofsted will recognise this as exemplary personalised care.`,
      severity: "positive",
    });
  }

  if (meets(celebrationExecutionRate, 90) && meets(personalisationRate, 90) && totalCelebrations > 0) {
    insights.push({
      text: `${celebrationExecutionRate}% execution with ${personalisationRate}% personalisation -- celebrations are reliably delivered and uniquely tailored to each child. This consistency and attention to individuality creates a home where children feel genuinely known and cherished.`,
      severity: "positive",
    });
  }

  if (meets(giftProvisionRate, 90) && meets(giftPersonalisationRate, 90) && totalGiftRecords > 0) {
    insights.push({
      text: `${giftProvisionRate}% gift provision with ${giftPersonalisationRate}% personalisation -- every child receives thoughtful, personalised gifts. This demonstrates that staff genuinely know each child's interests and invest effort in selecting meaningful presents.`,
      severity: "positive",
    });
  }

  if (meets(childSatisfactionRate, 90) && meets(feltSpecialRate, 90) && totalSatisfactionRecords > 0) {
    insights.push({
      text: `${childSatisfactionRate}% satisfaction with ${feltSpecialRate}% feeling special -- children overwhelmingly feel valued and celebrated. This is the strongest evidence of nurturing care and will be highlighted positively by Ofsted.`,
      severity: "positive",
    });
  }

  if (meets(memoryMakingRate, 90) && meets(lifeStoryRate, 80) && totalMemoryRecords > 0) {
    insights.push({
      text: `${memoryMakingRate}% memory-making with ${lifeStoryRate}% added to life stories -- celebrations are not just experienced but preserved as lasting memories that contribute to each child's identity and personal narrative.`,
      severity: "positive",
    });
  }

  if (meets(childChoiceRate, 80) && meets(wishMatchRate, 90) && totalChoiceOpportunities > 0 && totalSatisfactionRecords > 0) {
    insights.push({
      text: `${childChoiceRate}% child choice with ${wishMatchRate}% wish fulfilment -- children are empowered to shape their celebrations and the home delivers on their wishes. This exemplifies genuine child-centred practice.`,
      severity: "positive",
    });
  }

  if (meets(feedbackActionRate, 80) && meets(followUpRate, 80) && totalSatisfactionRecords > 0) {
    insights.push({
      text: `${feedbackActionRate}% feedback acted upon with ${followUpRate}% follow-up completed -- the home demonstrates a genuine learning culture by consistently responding to children's celebration feedback. This drives continuous improvement in celebration quality.`,
      severity: "positive",
    });
  }

  if (meets(specialRequestFulfilmentRate, 90) && totalSpecialRequests > 0) {
    insights.push({
      text: `${specialRequestFulfilmentRate}% of special birthday requests fulfilled -- the home goes above and beyond to honour children's specific wishes. This level of responsiveness makes children feel truly listened to and valued.`,
      severity: "positive",
    });
  }

  if (meets(familyContactRate, 80) && meets(familyAttendanceRate, 50) && totalBirthdayPlans > 0) {
    insights.push({
      text: `Family contact arranged for ${familyContactRate}% of birthdays with ${familyAttendanceRate}% family attendance at celebrations -- the home actively enables children to share their special days with family, maintaining vital connections.`,
      severity: "positive",
    });
  }

  // -- Headline -------------------------------------------------------------

  let headline: string;

  if (celebration_rating === "outstanding") {
    headline =
      "Outstanding birthday and celebration provision -- every child feels valued, special, and celebrated with personalised, memorable experiences.";
  } else if (celebration_rating === "good") {
    headline = `Good birthday and celebration provision -- ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (celebration_rating === "adequate") {
    headline = `Adequate birthday and celebration provision -- ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure every child feels valued and celebrated.`;
  } else {
    headline = `Birthday and celebration provision is inadequate -- ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children feel valued and celebrated on their special occasions.`;
  }

  // -- Return ---------------------------------------------------------------

  return {
    celebration_rating,
    celebration_score: score,
    headline,
    birthday_planning_rate: birthdayPlanningRate,
    celebration_execution_rate: celebrationExecutionRate,
    gift_provision_rate: giftProvisionRate,
    memory_making_rate: memoryMakingRate,
    child_satisfaction_rate: childSatisfactionRate,
    child_choice_rate: childChoiceRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
