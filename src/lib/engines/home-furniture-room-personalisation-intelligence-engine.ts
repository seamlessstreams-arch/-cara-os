import { above, below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME FURNITURE & ROOM PERSONALISATION INTELLIGENCE ENGINE
// Monitors bedroom and room personalisation quality — furniture adequacy,
// child choice in decor, personalisation completion, comfort assessment,
// and dignity of personal space. Ensures every child has a bedroom they
// can call their own, furnished to a standard that respects their identity,
// choices, and comfort needs.
// Measures furniture adequacy, personalisation rate, child choice rate,
// comfort rate, dignity rate, and child satisfaction rate.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 25 (Premises), Reg 5 (Statement of purpose), Reg 7
// (Protection of children from harm). SCCIF experiences and progress.
// Store keys: furnitureAdequacyRecords, roomPersonalisationRecords,
//             childChoiceRecords, comfortAssessmentRecords,
//             dignitySpaceRecords
// HOME-LEVEL engine.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface FurnitureAdequacyInput {
  id: string;
  child_id: string;
  room_id: string;
  assessment_date: string;
  assessor_name: string;
  bed_adequate: boolean;
  wardrobe_adequate: boolean;
  desk_adequate: boolean;
  shelving_adequate: boolean;
  seating_adequate: boolean;
  storage_adequate: boolean;
  lighting_adequate: boolean;
  curtains_blinds_adequate: boolean;
  floor_covering_adequate: boolean;
  furniture_condition: "excellent" | "good" | "fair" | "poor";
  age_appropriate: boolean;
  size_appropriate: boolean;
  replacement_needed: boolean;
  replacement_actioned: boolean;
  child_consulted: boolean;
  last_inspection_date: string | null;
  inspection_overdue: boolean;
  created_at: string;
}

export interface RoomPersonalisationInput {
  id: string;
  child_id: string;
  room_id: string;
  assessment_date: string;
  has_personal_photos: boolean;
  has_chosen_bedding: boolean;
  has_chosen_wall_decor: boolean;
  has_personal_belongings_displayed: boolean;
  has_chosen_colour_scheme: boolean;
  has_name_on_door: boolean;
  has_lockable_storage: boolean;
  has_notice_board: boolean;
  personalisation_items_count: number;
  personalisation_budget_provided: boolean;
  budget_amount_approved: number;
  budget_amount_spent: number;
  room_reflects_identity: boolean;
  child_satisfied_with_room: boolean;
  review_date: string | null;
  review_overdue: boolean;
  created_at: string;
}

export interface ChildChoiceInput {
  id: string;
  child_id: string;
  choice_type: "furniture" | "decor" | "colour" | "bedding" | "layout" | "lighting" | "accessories" | "storage";
  description: string;
  date_requested: string;
  date_fulfilled: string | null;
  fulfilled: boolean;
  child_involved_in_selection: boolean;
  child_satisfied_with_outcome: boolean;
  cost_approved: boolean;
  reason_not_fulfilled: string | null;
  staff_supported: boolean;
  created_at: string;
}

export interface ComfortAssessmentInput {
  id: string;
  child_id: string;
  room_id: string;
  assessment_date: string;
  temperature_comfortable: boolean;
  noise_level_acceptable: boolean;
  privacy_adequate: boolean;
  natural_light_adequate: boolean;
  ventilation_adequate: boolean;
  mattress_comfortable: boolean;
  room_clean: boolean;
  room_tidy: boolean;
  feels_safe_in_room: boolean;
  overall_comfort_rating: number; // 1-5
  child_reported: boolean;
  issues_identified: number;
  issues_resolved: number;
  created_at: string;
}

export interface DignitySpaceInput {
  id: string;
  child_id: string;
  room_id: string;
  assessment_date: string;
  has_working_lock: boolean;
  knock_before_entry_observed: boolean;
  personal_space_respected: boolean;
  belongings_not_searched_without_consent: boolean;
  room_not_used_as_punishment: boolean;
  can_spend_time_alone: boolean;
  has_adequate_privacy: boolean;
  dignity_maintained_during_checks: boolean;
  child_feels_room_is_theirs: boolean;
  staff_awareness_of_dignity: boolean;
  dignity_concern_raised: boolean;
  dignity_concern_resolved: boolean;
  created_at: string;
}

export interface FurnitureRoomInput {
  today: string;
  total_children: number;
  furniture_adequacy_records: FurnitureAdequacyInput[];
  room_personalisation_records: RoomPersonalisationInput[];
  child_choice_records: ChildChoiceInput[];
  comfort_assessment_records: ComfortAssessmentInput[];
  dignity_space_records: DignitySpaceInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type FurnitureRoomRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface FurnitureRoomInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface FurnitureRoomRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface FurnitureRoomResult {
  room_rating: FurnitureRoomRating;
  room_score: number | null;
  headline: string;
  total_furniture_assessments: number;
  total_personalisation_assessments: number;
  total_choice_records: number;
  total_comfort_assessments: number;
  total_dignity_assessments: number;
  furniture_adequacy_rate: number | null;
  personalisation_rate: number | null;
  child_choice_rate: number | null;
  comfort_rate: number | null;
  dignity_rate: number | null;
  child_satisfaction_rate: number | null;
  furniture_condition_avg: number | null;
  comfort_rating_avg: number | null;
  personalisation_budget_utilisation_rate: number | null;
  choice_fulfilment_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: FurnitureRoomRecommendation[];
  insights: FurnitureRoomInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): FurnitureRoomRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: FurnitureRoomRating,
  score: number,
  headline: string,
): FurnitureRoomResult {
  return {
    room_rating: rating,
    room_score: score,
    headline,
    total_furniture_assessments: 0,
    total_personalisation_assessments: 0,
    total_choice_records: 0,
    total_comfort_assessments: 0,
    total_dignity_assessments: 0,
    furniture_adequacy_rate: null,
    personalisation_rate: null,
    child_choice_rate: null,
    comfort_rate: null,
    dignity_rate: null,
    child_satisfaction_rate: null,
    furniture_condition_avg: 0,
    comfort_rating_avg: 0,
    personalisation_budget_utilisation_rate: null,
    choice_fulfilment_rate: null,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeFurnitureRoomPersonalisation(
  input: FurnitureRoomInput,
): FurnitureRoomResult {
  const {
    total_children,
    furniture_adequacy_records,
    room_personalisation_records,
    child_choice_records,
    comfort_assessment_records,
    dignity_space_records,
  } = input;

  // ── Special case: all empty + 0 children -> insufficient_data ──────────
  const allEmpty =
    furniture_adequacy_records.length === 0 &&
    room_personalisation_records.length === 0 &&
    child_choice_records.length === 0 &&
    comfort_assessment_records.length === 0 &&
    dignity_space_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess furniture and room personalisation quality.",
    );
  }

  // ── Special case: all empty + children > 0 -> inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No furniture adequacy, room personalisation, child choice, comfort, or dignity data recorded despite children on placement — bedroom quality and personalisation require urgent attention.",
      ),
      concerns: [
        "No furniture adequacy assessments, room personalisation records, child choice logs, comfort assessments, or dignity assessments exist despite children being on placement — the home cannot evidence that children's bedrooms meet basic standards or reflect their individuality.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured furniture adequacy assessments for every child's bedroom to evidence that furnishings meet the standard required under Reg 25 and are appropriate for each child's age and needs.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 — Premises",
        },
        {
          rank: 2,
          recommendation:
            "Establish a room personalisation programme giving every child choice and agency over how their bedroom looks, feels, and reflects their identity — this is fundamental to children experiencing dignity, belonging, and a sense of home.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 — Statement of purpose; SCCIF experiences and progress",
        },
      ],
      insights: [
        {
          text: "The complete absence of furniture and room personalisation records means the home cannot demonstrate that children's bedrooms are adequate, comfortable, personalised, or dignified. Ofsted expects bedrooms to be more than functional — they should reflect children's choices, identity, and sense of belonging. The absence of any records in these areas represents a fundamental gap in evidencing quality of care.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Furniture adequacy ---
  const totalFurnitureAssessments = furniture_adequacy_records.length;

  // Count items adequate across all assessments
  const furnitureItemChecks = furniture_adequacy_records.map((f) => {
    const items = [
      f.bed_adequate,
      f.wardrobe_adequate,
      f.desk_adequate,
      f.shelving_adequate,
      f.seating_adequate,
      f.storage_adequate,
      f.lighting_adequate,
      f.curtains_blinds_adequate,
      f.floor_covering_adequate,
    ];
    const adequate = items.filter(Boolean).length;
    return { adequate, total: items.length };
  });
  const totalFurnitureItems = furnitureItemChecks.reduce((s, c) => s + c.total, 0);
  const totalFurnitureAdequate = furnitureItemChecks.reduce((s, c) => s + c.adequate, 0);
  const furnitureAdequacyRate = rate(totalFurnitureAdequate, totalFurnitureItems);

  const conditionScoreMap: Record<string, number> = {
    excellent: 4,
    good: 3,
    fair: 2,
    poor: 1,
  };
  const furnitureConditionSum = furniture_adequacy_records.reduce(
    (sum, f) => sum + (conditionScoreMap[f.furniture_condition] ?? 2),
    0,
  );
  const furnitureConditionAvg =
    totalFurnitureAssessments > 0
      ? Math.round((furnitureConditionSum / totalFurnitureAssessments) * 100) / 100
      : null;

  const replacementNeeded = furniture_adequacy_records.filter(
    (f) => f.replacement_needed,
  ).length;
  const replacementActioned = furniture_adequacy_records.filter(
    (f) => f.replacement_needed && f.replacement_actioned,
  ).length;
  const replacementActionRate = rate(replacementActioned, replacementNeeded);

  const furnitureChildConsulted = furniture_adequacy_records.filter(
    (f) => f.child_consulted,
  ).length;
  const furnitureConsultationRate = rate(furnitureChildConsulted, totalFurnitureAssessments);

  const inspectionOverdue = furniture_adequacy_records.filter(
    (f) => f.inspection_overdue,
  ).length;

  const poorConditionRooms = furniture_adequacy_records.filter(
    (f) => f.furniture_condition === "poor",
  ).length;

  // --- Room personalisation ---
  const totalPersonalisationAssessments = room_personalisation_records.length;

  const personalisationItemChecks = room_personalisation_records.map((r) => {
    const items = [
      r.has_personal_photos,
      r.has_chosen_bedding,
      r.has_chosen_wall_decor,
      r.has_personal_belongings_displayed,
      r.has_chosen_colour_scheme,
      r.has_name_on_door,
      r.has_lockable_storage,
      r.has_notice_board,
    ];
    const done = items.filter(Boolean).length;
    return { done, total: items.length };
  });
  const totalPersonalisationItems = personalisationItemChecks.reduce(
    (s, c) => s + c.total,
    0,
  );
  const totalPersonalisationDone = personalisationItemChecks.reduce(
    (s, c) => s + c.done,
    0,
  );
  const personalisationRate = rate(totalPersonalisationDone, totalPersonalisationItems);

  const roomReflectsIdentityCount = room_personalisation_records.filter(
    (r) => r.room_reflects_identity,
  ).length;
  const identityReflectionRate = rate(roomReflectsIdentityCount, totalPersonalisationAssessments);

  const childSatisfiedWithRoomCount = room_personalisation_records.filter(
    (r) => r.child_satisfied_with_room,
  ).length;

  const budgetProvidedCount = room_personalisation_records.filter(
    (r) => r.personalisation_budget_provided,
  ).length;
  const budgetProvisionRate = rate(budgetProvidedCount, totalPersonalisationAssessments);

  const totalBudgetApproved = room_personalisation_records.reduce(
    (s, r) => s + (r.budget_amount_approved ?? 0),
    0,
  );
  const totalBudgetSpent = room_personalisation_records.reduce(
    (s, r) => s + (r.budget_amount_spent ?? 0),
    0,
  );
  const budgetUtilisationRate = rate(totalBudgetSpent, totalBudgetApproved);

  const lockableStorageCount = room_personalisation_records.filter(
    (r) => r.has_lockable_storage,
  ).length;
  const lockableStorageRate = rate(lockableStorageCount, totalPersonalisationAssessments);

  const personalisationReviewOverdue = room_personalisation_records.filter(
    (r) => r.review_overdue,
  ).length;

  // --- Child choice ---
  const totalChoiceRecords = child_choice_records.length;

  const fulfilledChoices = child_choice_records.filter((c) => c.fulfilled).length;
  const choiceFulfilmentRate = rate(fulfilledChoices, totalChoiceRecords);

  const childSatisfiedWithChoice = child_choice_records.filter(
    (c) => c.fulfilled && c.child_satisfied_with_outcome,
  ).length;
  const choiceSatisfactionRate = rate(childSatisfiedWithChoice, fulfilledChoices);

  // Child choice rate = children who have made at least one fulfilled choice
  const childrenWithFulfilledChoice = new Set(
    child_choice_records.filter((c) => c.fulfilled).map((c) => c.child_id),
  ).size;
  const childChoiceRate =
    total_children > 0 ? rate(childrenWithFulfilledChoice, total_children) : 0;

  // Choice type distribution
  const choiceTypeCounts: Record<string, number> = {};
  for (const c of child_choice_records) {
    choiceTypeCounts[c.choice_type] = (choiceTypeCounts[c.choice_type] ?? 0) + 1;
  }

  // --- Comfort assessment ---
  const totalComfortAssessments = comfort_assessment_records.length;

  const comfortItemChecks = comfort_assessment_records.map((c) => {
    const items = [
      c.temperature_comfortable,
      c.noise_level_acceptable,
      c.privacy_adequate,
      c.natural_light_adequate,
      c.ventilation_adequate,
      c.mattress_comfortable,
      c.room_clean,
      c.room_tidy,
      c.feels_safe_in_room,
    ];
    const ok = items.filter(Boolean).length;
    return { ok, total: items.length };
  });
  const totalComfortItems = comfortItemChecks.reduce((s, c) => s + c.total, 0);
  const totalComfortOk = comfortItemChecks.reduce((s, c) => s + c.ok, 0);
  const comfortRate = rate(totalComfortOk, totalComfortItems);

  const comfortRatingSum = comfort_assessment_records.reduce(
    (sum, c) => sum + c.overall_comfort_rating,
    0,
  );
  const comfortRatingAvg =
    totalComfortAssessments > 0
      ? Math.round((comfortRatingSum / totalComfortAssessments) * 100) / 100
      : null;

  const childReportedComfort = comfort_assessment_records.filter(
    (c) => c.child_reported,
  ).length;

  const feelsSafeCount = comfort_assessment_records.filter(
    (c) => c.feels_safe_in_room,
  ).length;
  const feelsSafeRate = rate(feelsSafeCount, totalComfortAssessments);

  const totalComfortIssues = comfort_assessment_records.reduce(
    (s, c) => s + c.issues_identified,
    0,
  );
  const totalComfortIssuesResolved = comfort_assessment_records.reduce(
    (s, c) => s + c.issues_resolved,
    0,
  );
  const comfortIssueResolutionRate = rate(totalComfortIssuesResolved, totalComfortIssues);

  const mattressComfortableCount = comfort_assessment_records.filter(
    (c) => c.mattress_comfortable,
  ).length;
  const mattressRate = rate(mattressComfortableCount, totalComfortAssessments);

  // --- Dignity of personal space ---
  const totalDignityAssessments = dignity_space_records.length;

  const dignityItemChecks = dignity_space_records.map((d) => {
    const items = [
      d.has_working_lock,
      d.knock_before_entry_observed,
      d.personal_space_respected,
      d.belongings_not_searched_without_consent,
      d.room_not_used_as_punishment,
      d.can_spend_time_alone,
      d.has_adequate_privacy,
      d.dignity_maintained_during_checks,
      d.child_feels_room_is_theirs,
      d.staff_awareness_of_dignity,
    ];
    const met = items.filter(Boolean).length;
    return { met, total: items.length };
  });
  const totalDignityItems = dignityItemChecks.reduce((s, c) => s + c.total, 0);
  const totalDignityMet = dignityItemChecks.reduce((s, c) => s + c.met, 0);
  const dignityRate = rate(totalDignityMet, totalDignityItems);

  const workingLockCount = dignity_space_records.filter(
    (d) => d.has_working_lock,
  ).length;
  const workingLockRate = rate(workingLockCount, totalDignityAssessments);

  const knockBeforeEntryCount = dignity_space_records.filter(
    (d) => d.knock_before_entry_observed,
  ).length;
  const knockBeforeEntryRate = rate(knockBeforeEntryCount, totalDignityAssessments);

  const childFeelsRoomIsTheirsCount = dignity_space_records.filter(
    (d) => d.child_feels_room_is_theirs,
  ).length;
  const ownershipFeelingRate = rate(childFeelsRoomIsTheirsCount, totalDignityAssessments);

  const roomNotPunishmentCount = dignity_space_records.filter(
    (d) => d.room_not_used_as_punishment,
  ).length;
  const notUsedAsPunishmentRate = rate(roomNotPunishmentCount, totalDignityAssessments);

  const spaceRespectedCount = dignity_space_records.filter(
    (d) => d.personal_space_respected,
  ).length;
  const spaceRespectedRate = rate(spaceRespectedCount, totalDignityAssessments);

  // --- Child satisfaction rate (composite across personalisation, choice, comfort) ---
  const satisfactionOpportunities =
    totalPersonalisationAssessments + fulfilledChoices + totalComfortAssessments;
  const satisfactionPositive =
    childSatisfiedWithRoomCount + childSatisfiedWithChoice + childReportedComfort;
  const childSatisfactionRate = rate(satisfactionPositive, satisfactionOpportunities);

  // ── Scoring: base 52, max bonuses +28, 4 penalties ────────────────────

  let score = 52;

  // --- Bonus 1: furnitureAdequacyRate (>=95: +5, >=80: +3) ---
  if (meets(furnitureAdequacyRate, 95)) score += 5;
  else if (meets(furnitureAdequacyRate, 80)) score += 3;

  // --- Bonus 2: personalisationRate (>=90: +5, >=70: +3) ---
  if (meets(personalisationRate, 90)) score += 5;
  else if (meets(personalisationRate, 70)) score += 3;

  // --- Bonus 3: childChoiceRate (>=90: +4, >=70: +2) ---
  if (meets(childChoiceRate, 90)) score += 4;
  else if (meets(childChoiceRate, 70)) score += 2;

  // --- Bonus 4: comfortRate (>=95: +4, >=80: +2) ---
  if (meets(comfortRate, 95)) score += 4;
  else if (meets(comfortRate, 80)) score += 2;

  // --- Bonus 5: dignityRate (>=95: +5, >=80: +3) ---
  if (meets(dignityRate, 95)) score += 5;
  else if (meets(dignityRate, 80)) score += 3;

  // --- Bonus 6: childSatisfactionRate (>=90: +3, >=70: +1) ---
  if (meets(childSatisfactionRate, 90)) score += 3;
  else if (meets(childSatisfactionRate, 70)) score += 1;

  // --- Bonus 7: furnitureConditionAvg (>=3.5: +2, >=2.5: +1) ---
  if ((furnitureConditionAvg ?? 0) >= 3.5) score += 2;
  else if ((furnitureConditionAvg ?? 0) >= 2.5) score += 1;

  // ── Penalties (guarded by array.length > 0) ───────────────────────────

  // Penalty 1: furnitureAdequacyRate < 50
  if (below(furnitureAdequacyRate, 50) && furniture_adequacy_records.length > 0) score -= 6;

  // Penalty 2: personalisationRate < 40
  if (below(personalisationRate, 40) && room_personalisation_records.length > 0) score -= 5;

  // Penalty 3: dignityRate < 50
  if (below(dignityRate, 50) && dignity_space_records.length > 0) score -= 6;

  // Penalty 4: comfortRate < 50
  if (below(comfortRate, 50) && comfort_assessment_records.length > 0) score -= 5;

  score = clamp(score, 0, 100);

  const room_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (meets(furnitureAdequacyRate, 95) && totalFurnitureAssessments > 0) {
    strengths.push(
      `${furnitureAdequacyRate}% of furniture items meet adequacy standards — children's bedrooms are comprehensively furnished to a high standard, ensuring comfort and functionality.`,
    );
  } else if (meets(furnitureAdequacyRate, 80) && totalFurnitureAssessments > 0) {
    strengths.push(
      `${furnitureAdequacyRate}% furniture adequacy — the majority of bedroom furnishings meet the required standard across all assessed items.`,
    );
  }

  if (meets(personalisationRate, 90) && totalPersonalisationAssessments > 0) {
    strengths.push(
      `${personalisationRate}% room personalisation completion — children's bedrooms strongly reflect their individual identity, preferences, and sense of belonging.`,
    );
  } else if (meets(personalisationRate, 70) && totalPersonalisationAssessments > 0) {
    strengths.push(
      `${personalisationRate}% personalisation completion — good levels of personal touches, chosen decor, and identity expression in children's bedrooms.`,
    );
  }

  if (meets(childChoiceRate, 90) && total_children > 0) {
    strengths.push(
      `${childChoiceRate}% of children have exercised meaningful choice over their room — the home actively empowers children to shape their personal space.`,
    );
  } else if (meets(childChoiceRate, 70) && total_children > 0) {
    strengths.push(
      `${childChoiceRate}% of children have had room choices fulfilled — the home generally supports children's agency over their bedroom environment.`,
    );
  }

  if (meets(comfortRate, 95) && totalComfortAssessments > 0) {
    strengths.push(
      `${comfortRate}% comfort assessment compliance — bedrooms consistently meet comfort standards including temperature, noise, privacy, lighting, and cleanliness.`,
    );
  } else if (meets(comfortRate, 80) && totalComfortAssessments > 0) {
    strengths.push(
      `${comfortRate}% comfort compliance — the majority of comfort factors in children's bedrooms meet the expected standard.`,
    );
  }

  if (meets(dignityRate, 95) && totalDignityAssessments > 0) {
    strengths.push(
      `${dignityRate}% dignity standards met — children's personal space, privacy, and dignity are consistently respected to an exemplary standard.`,
    );
  } else if (meets(dignityRate, 80) && totalDignityAssessments > 0) {
    strengths.push(
      `${dignityRate}% dignity compliance — the home demonstrates strong practice in respecting children's personal space and privacy.`,
    );
  }

  if (meets(childSatisfactionRate, 90) && satisfactionOpportunities > 0) {
    strengths.push(
      `${childSatisfactionRate}% child satisfaction with their rooms — children overwhelmingly report being happy with their bedrooms, indicating personalisation efforts genuinely resonate with them.`,
    );
  } else if (meets(childSatisfactionRate, 70) && satisfactionOpportunities > 0) {
    strengths.push(
      `${childSatisfactionRate}% child satisfaction — the majority of children report positive feelings about their rooms and personalisation choices.`,
    );
  }

  if ((furnitureConditionAvg ?? 0) >= 3.5 && totalFurnitureAssessments > 0) {
    strengths.push(
      `Average furniture condition rating of ${furnitureConditionAvg}/4 — furnishings are maintained in good to excellent condition throughout the home.`,
    );
  } else if ((furnitureConditionAvg ?? 0) >= 2.5 && totalFurnitureAssessments > 0) {
    strengths.push(
      `Average furniture condition rating of ${furnitureConditionAvg}/4 — furnishings are generally maintained to a reasonable standard.`,
    );
  }

  if (meets(choiceFulfilmentRate, 90) && totalChoiceRecords > 0) {
    strengths.push(
      `${choiceFulfilmentRate}% of children's room choices have been fulfilled — the home demonstrates excellent responsiveness to children's preferences and requests.`,
    );
  } else if (meets(choiceFulfilmentRate, 70) && totalChoiceRecords > 0) {
    strengths.push(
      `${choiceFulfilmentRate}% choice fulfilment rate — the home generally delivers on children's personalisation requests.`,
    );
  }

  if (meets(knockBeforeEntryRate, 95) && totalDignityAssessments > 0) {
    strengths.push(
      "Staff consistently knock before entering children's rooms — a fundamental dignity practice embedded in the home's culture.",
    );
  }

  if (meets(workingLockRate, 100) && totalDignityAssessments > 0) {
    strengths.push(
      "Every child's room has a working lock — children can secure their personal space, reinforcing ownership and security.",
    );
  }

  if (meets(feelsSafeRate, 95) && totalComfortAssessments > 0) {
    strengths.push(
      `${feelsSafeRate}% of children feel safe in their room — bedrooms function as genuine safe spaces.`,
    );
  }

  if (meets(ownershipFeelingRate, 90) && totalDignityAssessments > 0) {
    strengths.push(
      `${ownershipFeelingRate}% of children feel their room is truly theirs — the home succeeds in creating personal spaces where children belong.`,
    );
  }

  if (meets(replacementActionRate, 100) && replacementNeeded > 0) {
    strengths.push(
      "All identified furniture replacements have been actioned — the home responds promptly when furnishings fall below standard.",
    );
  }

  if (meets(identityReflectionRate, 90) && totalPersonalisationAssessments > 0) {
    strengths.push(
      `${identityReflectionRate}% of rooms assessed as reflecting the child's identity — bedrooms serve as meaningful expressions of who each child is.`,
    );
  }

  if (meets(notUsedAsPunishmentRate, 100) && totalDignityAssessments > 0) {
    strengths.push(
      "No evidence of rooms being used as punishment — the home maintains a clear boundary between personal space and behavioural management.",
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (below(furnitureAdequacyRate, 50) && totalFurnitureAssessments > 0) {
    concerns.push(
      `Only ${furnitureAdequacyRate}% of furniture items meet adequacy standards — the majority of children's bedroom furnishings do not meet the basic standard required, undermining children's comfort and the home's compliance with Reg 25.`,
    );
  } else if (below(furnitureAdequacyRate, 80) && meets(furnitureAdequacyRate, 50) && totalFurnitureAssessments > 0) {
    concerns.push(
      `Furniture adequacy at ${furnitureAdequacyRate}% — some bedroom furnishings do not meet the required standard, meaning some children's rooms may lack essential items or have items in poor condition.`,
    );
  }

  if (below(personalisationRate, 40) && totalPersonalisationAssessments > 0) {
    concerns.push(
      `Only ${personalisationRate}% personalisation completion — the majority of children's rooms lack personal touches, chosen decor, and expressions of identity, suggesting children have not been enabled to make their room their own.`,
    );
  } else if (below(personalisationRate, 70) && meets(personalisationRate, 40) && totalPersonalisationAssessments > 0) {
    concerns.push(
      `Personalisation at ${personalisationRate}% — many children's rooms still lack key personalisation elements such as chosen bedding, wall decor, or personal photos.`,
    );
  }

  if (below(childChoiceRate, 50) && total_children > 0 && totalChoiceRecords > 0) {
    concerns.push(
      `Only ${childChoiceRate}% of children have had room choices fulfilled — the majority of children have not been given meaningful agency over their bedroom environment.`,
    );
  } else if (below(childChoiceRate, 70) && meets(childChoiceRate, 50) && total_children > 0 && totalChoiceRecords > 0) {
    concerns.push(
      `Child choice rate at ${childChoiceRate}% — not all children have had the opportunity to make and see fulfilled choices about their room.`,
    );
  }

  if (below(comfortRate, 50) && totalComfortAssessments > 0) {
    concerns.push(
      `Only ${comfortRate}% comfort compliance — the majority of comfort factors in children's bedrooms do not meet the expected standard, indicating systemic issues with bedroom environment quality.`,
    );
  } else if (below(comfortRate, 80) && meets(comfortRate, 50) && totalComfortAssessments > 0) {
    concerns.push(
      `Comfort rate at ${comfortRate}% — some comfort factors such as temperature, noise, privacy, or cleanliness are not consistently meeting standard across all children's bedrooms.`,
    );
  }

  if (below(dignityRate, 50) && totalDignityAssessments > 0) {
    concerns.push(
      `Only ${dignityRate}% dignity standards met — the majority of dignity indicators are not being met, raising serious concerns about whether children's personal space, privacy, and autonomy are being respected.`,
    );
  } else if (below(dignityRate, 80) && meets(dignityRate, 50) && totalDignityAssessments > 0) {
    concerns.push(
      `Dignity rate at ${dignityRate}% — some dignity standards are not consistently met, which may affect children's sense of ownership, privacy, and respect in their personal space.`,
    );
  }

  if (below(childSatisfactionRate, 50) && satisfactionOpportunities > 0) {
    concerns.push(
      `Only ${childSatisfactionRate}% child satisfaction with rooms — most children are not satisfied with their bedroom environment, raising questions about whether the home is meeting children's needs and wishes regarding personal space.`,
    );
  } else if (below(childSatisfactionRate, 70) && meets(childSatisfactionRate, 50) && satisfactionOpportunities > 0) {
    concerns.push(
      `Child satisfaction at ${childSatisfactionRate}% — a significant proportion of children are not satisfied with their room, indicating personalisation or comfort efforts may not align with children's actual preferences.`,
    );
  }

  if (poorConditionRooms > 0 && totalFurnitureAssessments > 0) {
    concerns.push(
      `${poorConditionRooms} bedroom${poorConditionRooms !== 1 ? "s have" : " has"} furniture in poor condition — children should not be living with substandard furnishings that undermine their comfort and dignity.`,
    );
  }

  if (inspectionOverdue > 0 && totalFurnitureAssessments > 0) {
    concerns.push(
      `${inspectionOverdue} furniture inspection${inspectionOverdue !== 1 ? "s are" : " is"} overdue — regular inspections are needed to identify and address deterioration.`,
    );
  }

  if (personalisationReviewOverdue > 0 && totalPersonalisationAssessments > 0) {
    concerns.push(
      `${personalisationReviewOverdue} personalisation review${personalisationReviewOverdue !== 1 ? "s are" : " is"} overdue — personalisation should be reviewed as children's identities evolve.`,
    );
  }

  if (below(choiceFulfilmentRate, 50) && totalChoiceRecords > 0) {
    concerns.push(
      `Only ${choiceFulfilmentRate}% of children's room choices fulfilled — the majority of expressed preferences have not been actioned, undermining agency and belonging.`,
    );
  }

  if (below(workingLockRate, 80) && totalDignityAssessments > 0) {
    concerns.push(
      `Only ${workingLockRate}% of rooms have a working lock — children without functioning locks cannot secure their personal space.`,
    );
  }

  if (below(knockBeforeEntryRate, 80) && totalDignityAssessments > 0) {
    concerns.push(
      `Knock-before-entry observed in only ${knockBeforeEntryRate}% of assessments — inconsistent practice undermines children's trust and sense of personal space.`,
    );
  }

  if (below(feelsSafeRate, 80) && totalComfortAssessments > 0) {
    concerns.push(
      `Only ${feelsSafeRate}% of children feel safe in their room — low safety feelings indicate a significant issue requiring immediate exploration.`,
    );
  }

  if (replacementNeeded > 0 && below(replacementActionRate, 50)) {
    concerns.push(
      `Only ${replacementActionRate}% of needed furniture replacements actioned — children are waiting for furnishings already identified as below standard.`,
    );
  }

  if (below(notUsedAsPunishmentRate, 100) && totalDignityAssessments > 0) {
    concerns.push(
      `Evidence suggests rooms may be used as punishment in ${100 - notUsedAsPunishmentRate!}% of assessments — a child's bedroom must never be used punitively.`,
    );
  }

  if (below(mattressRate, 80) && totalComfortAssessments > 0) {
    concerns.push(
      `Only ${mattressRate}% of mattresses assessed as comfortable — inadequate mattresses directly impact children's health and wellbeing.`,
    );
  }

  if (below(lockableStorageRate, 70) && totalPersonalisationAssessments > 0) {
    concerns.push(
      `Only ${lockableStorageRate}% of children have lockable storage — without secure storage, children cannot protect personal belongings.`,
    );
  }

  if (below(comfortIssueResolutionRate, 50) && totalComfortIssues > 0) {
    concerns.push(
      `Only ${comfortIssueResolutionRate}% of identified comfort issues resolved — the home is not acting on known bedroom environment problems.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: FurnitureRoomRecommendation[] = [];
  let rank = 0;

  if (below(furnitureAdequacyRate, 50) && totalFurnitureAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address furniture inadequacies across children's bedrooms — every child must have a bed, wardrobe, desk, adequate storage, proper lighting, and appropriate floor covering as a minimum standard. Conduct a full audit and create a replacement programme.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (below(dignityRate, 50) && totalDignityAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently improve dignity standards in children's personal spaces — ensure all rooms have working locks, staff consistently knock before entry, personal space is respected, and rooms are never used as punishment. Implement dignity-focused staff training.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Protection from harm; SCCIF dignity and respect",
    });
  }

  if (below(comfortRate, 50) && totalComfortAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently improve bedroom comfort standards — address temperature control, noise levels, mattress quality, cleanliness, and privacy across all children's rooms. Children's sleep and wellbeing depend on a comfortable environment.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (below(personalisationRate, 40) && totalPersonalisationAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently implement a room personalisation programme — provide every child with a budget, supported shopping trips, and staff encouragement to personalise their room with photos, chosen bedding, wall art, and personal items that reflect their identity.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 — Statement of purpose; SCCIF experiences and progress",
    });
  }

  if (below(feelsSafeRate, 80) && totalComfortAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate why some children do not feel safe in their rooms and take immediate action — a child who does not feel safe in their bedroom requires individual exploration of their concerns, which may include fear of intrusion, peer dynamics, or environmental factors.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Protection from harm",
    });
  }

  if (below(notUsedAsPunishmentRate, 100) && totalDignityAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately cease any practice of using bedrooms as a form of punishment or sanction — a child's bedroom must be a place of safety and comfort, never associated with negative consequences. Review behaviour management practices to ensure bedrooms are protected spaces.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7 — Protection from harm",
    });
  }

  if (poorConditionRooms > 0 && totalFurnitureAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Replace furniture in poor condition as a matter of urgency — children living with visibly deteriorated furnishings receive a message that their comfort and environment are not valued.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (below(workingLockRate, 80) && totalDignityAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all children's bedroom doors have working locks — the ability to secure their own space is fundamental to children's sense of privacy, safety, and ownership. Locks should only be absent where a documented risk assessment justifies it.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises; SCCIF privacy and dignity",
    });
  }

  if (below(knockBeforeEntryRate, 80) && totalDignityAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Reinforce the expectation that staff always knock and wait before entering a child's room — implement practice observation, supervision discussion, and visual reminders to embed this fundamental dignity standard.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Privacy and dignity",
    });
  }

  if (
    meets(furnitureAdequacyRate, 50) &&
    below(furnitureAdequacyRate, 80) &&
    totalFurnitureAssessments > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve furniture adequacy to at least 80% across all bedrooms — identify and address specific gaps in desk provision, storage, lighting, or floor coverings to ensure every bedroom is fully and appropriately furnished.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    meets(personalisationRate, 40) &&
    below(personalisationRate, 70) &&
    totalPersonalisationAssessments > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase room personalisation completion — support each child to add personal photos, choose their bedding and wall decor, display personal belongings, and express their identity through their room. Review whether budgets, time, and staff support are adequate.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Experiences and progress; sense of belonging",
    });
  }

  if (
    meets(childChoiceRate, 50) &&
    below(childChoiceRate, 70) &&
    total_children > 0 &&
    totalChoiceRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend meaningful choice opportunities to all children — ensure every child has the chance to select furniture, decor, colour schemes, and layout preferences for their room, with staff actively facilitating and following through on choices.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (below(choiceFulfilmentRate, 70) && meets(choiceFulfilmentRate, 50) && totalChoiceRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve the rate at which children's room choices are fulfilled — when children express preferences and they are not actioned, it undermines their trust and sense of being heard. Review procurement processes and barriers to fulfilment.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (below(mattressRate, 80) && totalComfortAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Replace uncomfortable mattresses — quality sleep is essential for children's health, emotional regulation, and educational engagement. Invest in mattresses that are comfortable and appropriate for each child.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (below(lockableStorageRate, 70) && totalPersonalisationAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Provide lockable storage for every child — secure storage for personal belongings is a fundamental requirement for privacy and dignity. Children need to know their belongings are safe.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises; SCCIF privacy and dignity",
    });
  }

  if (inspectionOverdue > 0 && totalFurnitureAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete overdue furniture inspections to ensure bedroom furnishings remain safe, adequate, and in good condition — establish a regular inspection schedule with documented outcomes.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (personalisationReviewOverdue > 0 && totalPersonalisationAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete overdue personalisation reviews — children's tastes, interests, and identities change over time. Regular reviews ensure rooms continue to reflect who each child is and what matters to them.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Experiences and progress",
    });
  }

  if (below(comfortIssueResolutionRate, 50) && totalComfortIssues > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address and resolve outstanding comfort issues in children's bedrooms — when problems are identified but not fixed, it sends a message that children's comfort is not a priority.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    meets(dignityRate, 50) &&
    below(dignityRate, 80) &&
    totalDignityAssessments > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen dignity practices around children's personal spaces — review and improve practice on locks, knock-before-entry, respect for belongings, privacy during checks, and children's ownership feelings through targeted training and supervision.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Privacy and dignity",
    });
  }

  if (
    meets(comfortRate, 50) &&
    below(comfortRate, 80) &&
    totalComfortAssessments > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve bedroom comfort standards to at least 80% — conduct a systematic review of temperature, noise, lighting, ventilation, cleanliness, and privacy across all bedrooms and create an improvement plan.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    meets(childSatisfactionRate, 50) &&
    below(childSatisfactionRate, 70) &&
    satisfactionOpportunities > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Explore what would improve children's satisfaction with their rooms through direct conversation — use children's feedback to guide future personalisation, furniture choices, and comfort improvements.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (below(budgetProvisionRate, 80) && totalPersonalisationAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every child receives a personalisation budget — a dedicated budget demonstrates commitment to enabling children to shape their environment.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Experiences and progress; sense of belonging",
    });
  }

  if (below(furnitureConsultationRate, 70) && totalFurnitureAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase child consultation in furniture decisions — children should be involved in choosing bedroom furniture, strengthening agency and belonging.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: FurnitureRoomInsight[] = [];

  // -- Critical insights --

  if (below(furnitureAdequacyRate, 50) && totalFurnitureAssessments > 0) {
    insights.push({
      text: `Only ${furnitureAdequacyRate}% of bedroom furniture meets adequacy standards. Ofsted inspectors assess the physical environment of bedrooms as a direct indicator of care quality — inadequate furniture signals children's comfort and dignity are not prioritised.`,
      severity: "critical",
    });
  }

  if (below(personalisationRate, 40) && totalPersonalisationAssessments > 0) {
    insights.push({
      text: `Only ${personalisationRate}% personalisation completion. Rooms lacking personal touches and chosen decor feel institutional rather than homely. Ofsted expects bedrooms to reflect children's individual identity and choices.`,
      severity: "critical",
    });
  }

  if (below(dignityRate, 50) && totalDignityAssessments > 0) {
    insights.push({
      text: `Only ${dignityRate}% of dignity standards met. When privacy and dignity are not consistently respected, children experience their bedroom as a controlled environment rather than a safe personal space, contradicting SCCIF expectations.`,
      severity: "critical",
    });
  }

  if (below(comfortRate, 50) && totalComfortAssessments > 0) {
    insights.push({
      text: `Only ${comfortRate}% comfort compliance. Uncomfortable bedrooms affect children's sleep quality, emotional regulation, and overall wellbeing. The physical environment is a foundational element of quality care.`,
      severity: "critical",
    });
  }

  if (below(notUsedAsPunishmentRate, 100) && totalDignityAssessments > 0) {
    insights.push({
      text: "Evidence that bedrooms may be used as punishment in some cases. Using a child's personal space punitively transforms it from a place of safety into one associated with control. This must cease immediately.",
      severity: "critical",
    });
  }

  if (below(feelsSafeRate, 70) && totalComfortAssessments > 0) {
    insights.push({
      text: `Only ${feelsSafeRate}% of children feel safe in their bedroom. This may indicate concerns about peer dynamics, staff intrusion, or environmental factors requiring individual exploration.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    meets(furnitureAdequacyRate, 50) &&
    below(furnitureAdequacyRate, 80) &&
    totalFurnitureAssessments > 0
  ) {
    insights.push({
      text: `Furniture adequacy at ${furnitureAdequacyRate}% — improving but some bedrooms still have gaps in essential furnishings. Each missing or inadequate item affects a child's ability to study, store belongings, or feel comfortable in their own space.`,
      severity: "warning",
    });
  }

  if (
    meets(personalisationRate, 40) &&
    below(personalisationRate, 70) &&
    totalPersonalisationAssessments > 0
  ) {
    insights.push({
      text: `Personalisation at ${personalisationRate}% — some children's rooms are beginning to reflect their identity, but many still lack key personal touches. Consider whether barriers exist (budget, staff time, child engagement) and address them to enable fuller personalisation.`,
      severity: "warning",
    });
  }

  if (
    meets(dignityRate, 50) &&
    below(dignityRate, 80) &&
    totalDignityAssessments > 0
  ) {
    insights.push({
      text: `Dignity rate at ${dignityRate}% — while some dignity standards are met, inconsistencies in areas like knocking before entry, lock provision, or respect for personal space undermine the overall quality of children's experience of their personal environment.`,
      severity: "warning",
    });
  }

  if (
    meets(comfortRate, 50) &&
    below(comfortRate, 80) &&
    totalComfortAssessments > 0
  ) {
    insights.push({
      text: `Comfort rate at ${comfortRate}% — some bedrooms have areas of concern around temperature, noise, privacy, or cleanliness. Even one persistent comfort issue can significantly affect a child's quality of life and sleep.`,
      severity: "warning",
    });
  }

  if (
    meets(childSatisfactionRate, 50) &&
    below(childSatisfactionRate, 70) &&
    satisfactionOpportunities > 0
  ) {
    insights.push({
      text: `Child satisfaction at ${childSatisfactionRate}% — a notable proportion of children are not fully satisfied with their room. Since children's subjective experience is the most important indicator, it is worth exploring what specific changes would make their rooms feel more like their own.`,
      severity: "warning",
    });
  }

  if (
    (furnitureConditionAvg ?? 0) > 0 &&
    (furnitureConditionAvg ?? 0) < 2.5 &&
    totalFurnitureAssessments > 0
  ) {
    insights.push({
      text: `Average furniture condition rating of ${furnitureConditionAvg}/4 — furniture quality is below acceptable levels. Children living with deteriorating furniture receive a message about their worth.`,
      severity: "warning",
    });
  }

  // Choice type analysis
  const topChoiceTypes = Object.entries(choiceTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topChoiceTypes.length > 0 && totalChoiceRecords >= 5) {
    const typeStr = topChoiceTypes.map(([t, c]) => `${t} (${c})`).join(", ");
    insights.push({
      text: `Most common room choice types: ${typeStr}. Consider whether children are offered the full range of choice opportunities across furniture, decor, colour, bedding, layout, and accessories.`,
      severity: "warning",
    });
  }

  if (above(budgetUtilisationRate, 0) && below(budgetUtilisationRate, 50) && totalBudgetApproved > 0) {
    insights.push({
      text: `Personalisation budget utilisation at only ${budgetUtilisationRate}% — budgets approved but not fully used. Children may need more support or encouragement to spend their personalisation budget.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (room_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding bedroom and room personalisation quality — furniture is adequate and well-maintained, rooms are personalised to reflect each child's identity, children exercise genuine choice, bedrooms are comfortable, and dignity is consistently respected. This is strong evidence of a home environment where children feel they truly belong.",
      severity: "positive",
    });
  }

  if (meets(furnitureAdequacyRate, 95) && (furnitureConditionAvg ?? 0) >= 3.5 && totalFurnitureAssessments > 0) {
    insights.push({
      text: `${furnitureAdequacyRate}% furniture adequacy with condition ${furnitureConditionAvg}/4 — bedrooms are comprehensively and well-furnished to a high standard.`,
      severity: "positive",
    });
  }

  if (meets(personalisationRate, 90) && meets(identityReflectionRate, 90) && totalPersonalisationAssessments > 0) {
    insights.push({
      text: `${personalisationRate}% personalisation with ${identityReflectionRate}% identity reflection — bedrooms genuinely express who each child is, a powerful indicator of belonging.`,
      severity: "positive",
    });
  }

  if (meets(childChoiceRate, 90) && meets(choiceSatisfactionRate, 90) && total_children > 0 && fulfilledChoices > 0) {
    insights.push({
      text: `${childChoiceRate}% choice rate with ${choiceSatisfactionRate}% satisfaction — children are not just offered choice but satisfied with how preferences are implemented.`,
      severity: "positive",
    });
  }

  if (meets(comfortRate, 95) && (comfortRatingAvg ?? 0) >= 4.0 && totalComfortAssessments > 0) {
    insights.push({
      text: `${comfortRate}% comfort compliance with rating ${comfortRatingAvg}/5 — bedrooms consistently provide a comfortable environment for sleep and relaxation.`,
      severity: "positive",
    });
  }

  if (meets(dignityRate, 95) && meets(ownershipFeelingRate, 90) && totalDignityAssessments > 0) {
    insights.push({
      text: `${dignityRate}% dignity with ${ownershipFeelingRate}% ownership feeling — the home exemplifies respect for children's personal space, privacy, and autonomy.`,
      severity: "positive",
    });
  }

  if (meets(childSatisfactionRate, 90) && satisfactionOpportunities > 0) {
    insights.push({
      text: `${childSatisfactionRate}% child satisfaction — children feel positive about their bedroom environment, the strongest indicator the home's approach genuinely meets their needs.`,
      severity: "positive",
    });
  }

  if (meets(knockBeforeEntryRate, 95) && meets(workingLockRate, 100) && meets(spaceRespectedRate, 95) && totalDignityAssessments > 0) {
    insights.push({
      text: "Exemplary privacy practice — staff consistently knock before entry, every room has a working lock, and personal space is respected.",
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (room_rating === "outstanding") {
    headline =
      "Outstanding furniture and room personalisation — children's bedrooms are well-furnished, personalised to reflect their identity, comfortable, and dignified.";
  } else if (room_rating === "good") {
    headline = `Good furniture and room personalisation — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (room_rating === "adequate") {
    headline = `Adequate furniture and room personalisation — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's bedrooms meet the expected standard.`;
  } else {
    headline = `Furniture and room personalisation is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's bedrooms are adequate, personalised, comfortable, and dignified.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    room_rating,
    room_score: score,
    headline,
    total_furniture_assessments: totalFurnitureAssessments,
    total_personalisation_assessments: totalPersonalisationAssessments,
    total_choice_records: totalChoiceRecords,
    total_comfort_assessments: totalComfortAssessments,
    total_dignity_assessments: totalDignityAssessments,
    furniture_adequacy_rate: furnitureAdequacyRate,
    personalisation_rate: personalisationRate,
    child_choice_rate: childChoiceRate,
    comfort_rate: comfortRate,
    dignity_rate: dignityRate,
    child_satisfaction_rate: childSatisfactionRate,
    furniture_condition_avg: furnitureConditionAvg,
    comfort_rating_avg: comfortRatingAvg,
    personalisation_budget_utilisation_rate: budgetUtilisationRate,
    choice_fulfilment_rate: choiceFulfilmentRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
