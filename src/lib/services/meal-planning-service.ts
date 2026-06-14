// ==============================================================================
// CARA -- MEAL PLANNING & FOOD CHOICE SERVICE
// Tracks meal planning, dietary needs, cooking participation, nutritional balance,
// cultural/religious dietary requirements, allergy management, and food choice
// for looked-after children. Ensures nutritious meals with genuine choice.
//
// UK Regulatory Framework:
// CHR 2015 Reg 9 (quality of care — nutritious food),
// CHR 2015 Reg 25 (premises — suitable kitchen),
// SCCIF: Experiences — "Children enjoy nutritious meals and have choice."
// Healthy eating guidance, cultural dietary needs, allergy management.
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const RECORD_TYPES = [
  "Menu Planning Input",
  "Meal Preference Survey",
  "Dietary Needs Assessment",
  "Cooking Session",
  "Shopping Trip",
  "Meal Feedback",
  "Special Dietary Requirement",
  "Cultural/Religious Diet",
  "Allergy Management",
  "Nutritional Concern",
  "Weight Management Support",
  "Food Budget Planning",
  "Meal Preparation Skill",
  "Kitchen Safety Training",
  "Food Hygiene Certificate",
] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

export const NUTRITIONAL_BALANCES = [
  "Excellent",
  "Good",
  "Fair",
  "Poor",
  "Not Assessed",
] as const;
export type NutritionalBalance = (typeof NUTRITIONAL_BALANCES)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const CHOICE_TYPES: RecordType[] = [
  "Menu Planning Input",
  "Meal Preference Survey",
  "Meal Feedback",
  "Shopping Trip",
];

export const SKILL_TYPES: RecordType[] = [
  "Cooking Session",
  "Meal Preparation Skill",
  "Kitchen Safety Training",
  "Food Hygiene Certificate",
];

export const HEALTH_TYPES: RecordType[] = [
  "Dietary Needs Assessment",
  "Special Dietary Requirement",
  "Allergy Management",
  "Nutritional Concern",
  "Weight Management Support",
];

export const CULTURAL_TYPES: RecordType[] = [
  "Cultural/Religious Diet",
  "Special Dietary Requirement",
];

export const PLANNING_TYPES: RecordType[] = [
  "Menu Planning Input",
  "Meal Preference Survey",
  "Food Budget Planning",
];

// -- Label maps ---------------------------------------------------------------

export const RECORD_TYPE_LABELS: { type: RecordType; label: string }[] = [
  { type: "Menu Planning Input", label: "Menu Planning Input" },
  { type: "Meal Preference Survey", label: "Meal Preference Survey" },
  { type: "Dietary Needs Assessment", label: "Dietary Needs Assessment" },
  { type: "Cooking Session", label: "Cooking Session" },
  { type: "Shopping Trip", label: "Shopping Trip" },
  { type: "Meal Feedback", label: "Meal Feedback" },
  { type: "Special Dietary Requirement", label: "Special Dietary Requirement" },
  { type: "Cultural/Religious Diet", label: "Cultural / Religious Diet" },
  { type: "Allergy Management", label: "Allergy Management" },
  { type: "Nutritional Concern", label: "Nutritional Concern" },
  { type: "Weight Management Support", label: "Weight Management Support" },
  { type: "Food Budget Planning", label: "Food Budget Planning" },
  { type: "Meal Preparation Skill", label: "Meal Preparation Skill" },
  { type: "Kitchen Safety Training", label: "Kitchen Safety Training" },
  { type: "Food Hygiene Certificate", label: "Food Hygiene Certificate" },
];

export const NUTRITIONAL_BALANCE_LABELS: { balance: NutritionalBalance; label: string }[] = [
  { balance: "Excellent", label: "Excellent" },
  { balance: "Good", label: "Good" },
  { balance: "Fair", label: "Fair" },
  { balance: "Poor", label: "Poor" },
  { balance: "Not Assessed", label: "Not Assessed" },
];

// -- Row type -----------------------------------------------------------------

export interface MealPlanningRow {
  id: string;
  home_id: string;
  child_name: string;
  record_date: string;
  recorded_by: string;
  record_type: RecordType;
  dietary_requirement: string | null;
  child_choice_offered: boolean;
  child_participated_cooking: boolean;
  age_appropriate_involvement: boolean;
  nutritional_balance: NutritionalBalance;
  cultural_needs_met: boolean;
  allergy_information_current: boolean;
  portion_appropriate: boolean;
  mealtimes_social: boolean;
  snacks_available: boolean;
  hydration_monitored: boolean | null;
  eating_concern_identified: boolean;
  concern_details: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateMealPlanning(input: {
  childName?: string;
  recordDate?: string;
  recordedBy?: string;
  recordType?: string;
  nutritionalBalance?: string;
  childChoiceOffered?: boolean;
  childParticipatedCooking?: boolean;
  ageAppropriateInvolvement?: boolean;
  culturalNeedsMet?: boolean;
  allergyInformationCurrent?: boolean;
  portionAppropriate?: boolean;
  mealtimesSocial?: boolean;
  snacksAvailable?: boolean;
  eatingConcernIdentified?: boolean;
  concernDetails?: string | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.childName || input.childName.trim().length === 0) {
    errors.push("Child name is required");
  }

  if (!input.recordDate) {
    errors.push("Record date is required");
  } else {
    const dateObj = new Date(input.recordDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Record date must be a valid date");
    }
  }

  if (!input.recordedBy || input.recordedBy.trim().length === 0) {
    errors.push("Recorded by (staff name) is required");
  }

  if (
    !input.recordType ||
    !(RECORD_TYPES as readonly string[]).includes(input.recordType)
  ) {
    errors.push(`Record type must be one of: ${RECORD_TYPES.join(", ")}`);
  }

  if (
    input.nutritionalBalance &&
    !(NUTRITIONAL_BALANCES as readonly string[]).includes(input.nutritionalBalance)
  ) {
    errors.push(`Nutritional balance must be one of: ${NUTRITIONAL_BALANCES.join(", ")}`);
  }

  // Business rule: Child choice must be offered at mealtimes
  if (input.childChoiceOffered === false) {
    errors.push(
      "Child choice not offered — CHR 2015 Reg 9 requires child-centred care and SCCIF specifically looks for evidence that children have choice at mealtimes. Mealtimes should not be institutional — children should be able to choose between options, request alternatives, and have their preferences respected. A home where children eat what they are given without choice is failing to provide a family-style environment. Menu planning must include children's input",
    );
  }

  // Business rule: Poor nutritional balance
  if (input.nutritionalBalance === "Poor") {
    errors.push(
      "Nutritional balance flagged as poor — CHR 2015 Reg 9 requires that children receive nutritious food. A poor nutritional balance indicates meals that do not provide adequate vitamins, minerals, protein, and fibre. For growing children, nutrition directly impacts physical health, concentration, behaviour, and emotional regulation. The home should review its meal planning, consult healthy eating guidance, and consider whether a dietitian referral is needed for specific children",
    );
  }

  // Business rule: Allergy information not current
  if (input.allergyInformationCurrent === false) {
    errors.push(
      "Allergy information not current — this is a critical safety issue. Out-of-date allergy information can result in a child being given food that triggers an allergic reaction, which can be life-threatening (anaphylaxis). CHR 2015 Reg 25 requires safe premises and Reg 9 requires safe care. Allergy information must be reviewed at every placement review, when a child reports new symptoms, and at least annually. All staff who prepare or serve food must know each child's current allergies",
    );
  }

  // Business rule: Snacks not available
  if (input.snacksAvailable === false) {
    errors.push(
      "Snacks not available — SCCIF inspectors specifically check whether children can access snacks and drinks freely. A home where food is locked away or only available at set mealtimes is institutional. Children should have access to fruit, healthy snacks, and drinks throughout the day, just as they would in a family home. Restricting food access can be especially harmful for children who have experienced food insecurity or neglect",
    );
  }

  // Business rule: Mealtimes not social
  if (input.mealtimesSocial === false) {
    errors.push(
      "Mealtimes not social — mealtimes should be positive social experiences where children eat together with staff. CHR 2015 Reg 9 requires that the home provides a family-style environment. Eating together teaches social skills, builds relationships, provides a sense of belonging, and creates positive associations with food. If children are eating alone, at different times, or in their rooms regularly, the home is not creating a family atmosphere",
    );
  }

  // Business rule: Eating concern identified but no details
  if (input.eatingConcernIdentified === true && (!input.concernDetails || input.concernDetails.trim().length === 0)) {
    errors.push(
      "Eating concern identified but no details recorded — eating difficulties in looked-after children are common (linked to early neglect, food insecurity, emotional regulation, control). Without details, appropriate support cannot be arranged. Record the specific concern (restrictive eating, binge eating, food hoarding, refusal, purging, excessive dieting) and ensure the child's GP and social worker are informed. A referral to CAMHS or an eating disorder service may be needed",
    );
  }

  // Business rule: Cultural needs not met
  if (input.culturalNeedsMet === false && input.recordType === "Cultural/Religious Diet") {
    errors.push(
      "Cultural/religious dietary needs not met — CHR 2015 Reg 5 requires that individual needs are met, including cultural identity. For children with halal, kosher, vegetarian (religious), or other culturally-specific dietary requirements, these are not preferences but fundamental needs linked to identity and faith. Failing to provide appropriate food can make a child feel their culture is not valued or respected. The home must source and prepare culturally appropriate food",
    );
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: MealPlanningRow[],
): {
  total_records: number;
  unique_children: number;
  by_record_type: Record<string, number>;
  by_nutritional_balance: Record<string, number>;
  choice_type_count: number;
  skill_type_count: number;
  health_type_count: number;
  cultural_type_count: number;
  planning_type_count: number;
  child_choice_offered_rate: number;
  child_participated_cooking_rate: number;
  age_appropriate_involvement_rate: number;
  cultural_needs_met_rate: number;
  allergy_information_current_rate: number;
  portion_appropriate_rate: number;
  mealtimes_social_rate: number;
  snacks_available_rate: number;
  hydration_monitored_rate: number;
  eating_concern_rate: number;
  excellent_nutrition_rate: number;
  poor_nutrition_rate: number;
  average_records_per_child: number;
  children_with_dietary_requirements: number;
} {
  const total = rows.length;
  const uniqueChildren = new Set(rows.map((r) => r.child_name.toLowerCase().trim()));

  // Record type breakdown
  const byRecordType: Record<string, number> = {};
  for (const rt of RECORD_TYPES) byRecordType[rt] = 0;
  for (const r of rows) byRecordType[r.record_type] = (byRecordType[r.record_type] || 0) + 1;

  // Nutritional balance breakdown
  const byNutrition: Record<string, number> = {};
  for (const nb of NUTRITIONAL_BALANCES) byNutrition[nb] = 0;
  for (const r of rows) byNutrition[r.nutritional_balance] = (byNutrition[r.nutritional_balance] || 0) + 1;

  // Category counts
  const choiceCount = rows.filter((r) => (CHOICE_TYPES as string[]).includes(r.record_type)).length;
  const skillCount = rows.filter((r) => (SKILL_TYPES as string[]).includes(r.record_type)).length;
  const healthCount = rows.filter((r) => (HEALTH_TYPES as string[]).includes(r.record_type)).length;
  const culturalCount = rows.filter((r) => (CULTURAL_TYPES as string[]).includes(r.record_type)).length;
  const planningCount = rows.filter((r) => (PLANNING_TYPES as string[]).includes(r.record_type)).length;

  // Boolean rates
  const pct = (filter: (r: MealPlanningRow) => boolean) =>
    total > 0 ? Math.round((rows.filter(filter).length / total) * 1000) / 10 : 0;

  const choiceOfferedRate = pct((r) => r.child_choice_offered);
  const participatedCookingRate = pct((r) => r.child_participated_cooking);
  const ageAppropriateRate = pct((r) => r.age_appropriate_involvement);
  const culturalNeedsRate = pct((r) => r.cultural_needs_met);
  const allergyCurrentRate = pct((r) => r.allergy_information_current);
  const portionRate = pct((r) => r.portion_appropriate);
  const socialRate = pct((r) => r.mealtimes_social);
  const snacksRate = pct((r) => r.snacks_available);
  const eatingConcernRate = pct((r) => r.eating_concern_identified);

  // Hydration (nullable)
  const hydrationRows = rows.filter((r) => r.hydration_monitored !== null);
  const hydrationRate = hydrationRows.length > 0
    ? Math.round((hydrationRows.filter((r) => r.hydration_monitored === true).length / hydrationRows.length) * 1000) / 10
    : 0;

  // Nutrition rates
  const excellentRate = total > 0
    ? Math.round((rows.filter((r) => r.nutritional_balance === "Excellent").length / total) * 1000) / 10
    : 0;
  const poorRate = total > 0
    ? Math.round((rows.filter((r) => r.nutritional_balance === "Poor").length / total) * 1000) / 10
    : 0;

  // Children with dietary requirements
  const childrenWithDietary = new Set(
    rows.filter((r) => r.dietary_requirement !== null && r.dietary_requirement.trim().length > 0)
      .map((r) => r.child_name.toLowerCase().trim())
  ).size;

  const avgRecordsPerChild = uniqueChildren.size > 0
    ? Math.round((total / uniqueChildren.size) * 10) / 10
    : 0;

  return {
    total_records: total,
    unique_children: uniqueChildren.size,
    by_record_type: byRecordType,
    by_nutritional_balance: byNutrition,
    choice_type_count: choiceCount,
    skill_type_count: skillCount,
    health_type_count: healthCount,
    cultural_type_count: culturalCount,
    planning_type_count: planningCount,
    child_choice_offered_rate: choiceOfferedRate,
    child_participated_cooking_rate: participatedCookingRate,
    age_appropriate_involvement_rate: ageAppropriateRate,
    cultural_needs_met_rate: culturalNeedsRate,
    allergy_information_current_rate: allergyCurrentRate,
    portion_appropriate_rate: portionRate,
    mealtimes_social_rate: socialRate,
    snacks_available_rate: snacksRate,
    hydration_monitored_rate: hydrationRate,
    eating_concern_rate: eatingConcernRate,
    excellent_nutrition_rate: excellentRate,
    poor_nutrition_rate: poorRate,
    average_records_per_child: avgRecordsPerChild,
    children_with_dietary_requirements: childrenWithDietary,
  };
}

export function computeAlerts(
  rows: MealPlanningRow[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  record_id?: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    record_id?: string;
  }[] = [];

  // Critical: Allergy information not current
  for (const r of rows) {
    if (!r.allergy_information_current) {
      alerts.push({
        type: "allergy_not_current",
        severity: "critical",
        message: `${r.child_name}'s allergy information flagged as not current (${r.record_date}). This is a life-safety issue. Anaphylaxis from unknown or unrecorded allergies can be fatal. All staff who handle food must have current, accurate allergy information for every child. Allergy records must be updated immediately — contact the child's GP, review care plan documentation, and confirm with the child/parent what their current allergies are. Update kitchen allergy boards and individual allergy cards`,
        record_id: r.id,
      });
    }
  }

  // Critical: Eating concern identified
  for (const r of rows) {
    if (r.eating_concern_identified) {
      alerts.push({
        type: "eating_concern",
        severity: "critical",
        message: `Eating concern identified for ${r.child_name} (${r.record_date}): ${r.concern_details || "No details recorded"}. Eating difficulties in looked-after children are common and can indicate emotional distress, control issues, or disordered eating. This must be discussed with the child's social worker and GP. Consider CAMHS referral if the concern is persistent. Monitor without creating pressure or surveillance around food. Staff must be trained in trauma-informed approaches to eating difficulties`,
        record_id: r.id,
      });
    }
  }

  // Critical: Poor nutritional balance
  for (const r of rows) {
    if (r.nutritional_balance === "Poor") {
      alerts.push({
        type: "poor_nutrition",
        severity: "critical",
        message: `${r.child_name}'s nutritional balance assessed as poor (${r.record_type}, ${r.record_date}). CHR 2015 Reg 9 requires nutritious food. Poor nutrition impacts growth, concentration, behaviour, immune function, and emotional regulation. Review meal planning for this child — are they eating what is offered? Are there sensory issues, eating difficulties, or preferences that mean they are not getting adequate nutrition? Consider GP involvement for dietary assessment`,
        record_id: r.id,
      });
    }
  }

  // High: Snacks not available
  for (const r of rows) {
    if (!r.snacks_available) {
      alerts.push({
        type: "snacks_unavailable",
        severity: "high",
        message: `Snacks flagged as not available for ${r.child_name} (${r.record_date}). SCCIF inspectors specifically check this. Children should have free access to fruit, healthy snacks, and drinks — just as in a family home. Restricting food access is institutional and potentially harmful, especially for children who experienced food insecurity. If there are clinical reasons for limiting food access (medical weight management), this must be documented with professional input`,
        record_id: r.id,
      });
    }
  }

  // High: Child choice not offered
  const childChoiceMap = new Map<string, MealPlanningRow[]>();
  for (const r of rows) {
    const key = r.child_name.toLowerCase().trim();
    if (!childChoiceMap.has(key)) childChoiceMap.set(key, []);
    childChoiceMap.get(key)!.push(r);
  }
  for (const [, childRows] of childChoiceMap) {
    const choiceCount = childRows.filter((r) => r.child_choice_offered).length;
    if (childRows.length >= 3 && choiceCount / childRows.length < 0.4) {
      alerts.push({
        type: "low_child_choice",
        severity: "high",
        message: `${childRows[0].child_name} offered food choice in only ${Math.round((choiceCount / childRows.length) * 100)}% of records. SCCIF inspectors look for evidence that children have genuine choice at mealtimes. A home where children eat what they are told to eat is not providing family-style care. Children should choose from options, have alternatives available, and be involved in menu planning. This is a key indicator of child-centred care`,
      });
    }
  }

  // High: Mealtimes consistently not social
  const nonSocialCount = rows.filter((r) => !r.mealtimes_social).length;
  if (rows.length >= 5 && nonSocialCount / rows.length > 0.4) {
    alerts.push({
      type: "mealtimes_not_social",
      severity: "high",
      message: `Mealtimes flagged as not social in ${Math.round((nonSocialCount / rows.length) * 100)}% of records. Eating together is fundamental to family life and one of the key ways residential homes should differ from institutional settings. SCCIF inspectors observe mealtimes and expect to see children and staff eating together, conversation, and a relaxed atmosphere. If children are routinely eating alone or in their rooms, this indicates a breakdown in the communal life of the home`,
    });
  }

  // High: Cultural dietary needs not met
  const culturalRows = rows.filter((r) => r.record_type === "Cultural/Religious Diet");
  const culturalUnmet = culturalRows.filter((r) => !r.cultural_needs_met);
  if (culturalUnmet.length > 0) {
    for (const r of culturalUnmet) {
      alerts.push({
        type: "cultural_needs_unmet",
        severity: "high",
        message: `${r.child_name}'s cultural/religious dietary needs not met (${r.record_date}). CHR 2015 Reg 5 requires individual needs including cultural identity. For children whose faith or culture requires specific food preparation (halal, kosher), specific dietary restrictions, or specific meal practices, these are non-negotiable needs, not preferences. The home must source, store, and prepare culturally appropriate food. Failure to do so sends a clear message that the child's culture is not valued`,
        record_id: r.id,
      });
    }
  }

  // Medium: No cooking participation
  for (const [, childRows] of childChoiceMap) {
    const cookingCount = childRows.filter((r) => r.child_participated_cooking).length;
    if (childRows.length >= 5 && cookingCount === 0) {
      alerts.push({
        type: "no_cooking_participation",
        severity: "medium",
        message: `${childRows[0].child_name} has ${childRows.length} food records but has never participated in cooking. Learning to cook is a fundamental independence skill and a requirement of CHR 2015 Reg 5 (preparation for independence). Children should be involved in meal preparation according to their age and ability — from helping younger children to independent cooking for older young people. Cooking together is also a positive relational activity`,
      });
    }
  }

  // Medium: No menu planning involvement
  const planningInputCount = rows.filter((r) => r.record_type === "Menu Planning Input" || r.record_type === "Meal Preference Survey").length;
  if (rows.length >= 8 && planningInputCount === 0) {
    alerts.push({
      type: "no_menu_input",
      severity: "medium",
      message: `No menu planning input or preference surveys recorded across ${rows.length} food records. Children should be actively involved in deciding what the home eats — through regular menu planning meetings, preference surveys, suggestion boxes, or rotating choice. SCCIF inspectors look for evidence that children influence menus. A menu decided entirely by staff without children's input is institutional`,
    });
  }

  // Medium: Low cooking skills development
  const skillRecords = rows.filter((r) => (SKILL_TYPES as string[]).includes(r.record_type));
  if (rows.length >= 10 && skillRecords.length / rows.length < 0.1) {
    alerts.push({
      type: "low_skills_development",
      severity: "medium",
      message: `Only ${skillRecords.length} cooking/food skills records out of ${rows.length} total. CHR 2015 Reg 5 requires independence preparation. For young people approaching leaving care, being unable to cook is a significant disadvantage — linked to poor nutrition, reliance on takeaways, and food poverty. The home should have a systematic approach to teaching cooking skills, progressing from simple tasks to independent meal preparation`,
    });
  }

  return alerts;
}

export function generateCaraInsights(
  rows: MealPlanningRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const typeBreakdown = Object.entries(metrics.by_record_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  const nutritionBreakdown = Object.entries(metrics.by_nutritional_balance)
    .filter(([, count]) => count > 0)
    .map(([balance, count]) => `${balance}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_records} meal/food ${metrics.total_records === 1 ? "record" : "records"} ` +
      `for ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `Types: ${typeBreakdown || "none recorded"}. ` +
      `Nutrition: ${nutritionBreakdown || "none assessed"}. ` +
      `Child choice offered rate: ${metrics.child_choice_offered_rate}%. ` +
      `Cooking participation rate: ${metrics.child_participated_cooking_rate}%. ` +
      `Cultural needs met rate: ${metrics.cultural_needs_met_rate}%. ` +
      `Mealtimes social rate: ${metrics.mealtimes_social_rate}%. ` +
      `Snacks available rate: ${metrics.snacks_available_rate}%. ` +
      `Children with dietary requirements: ${metrics.children_with_dietary_requirements}. ` +
      `Average records per child: ${metrics.average_records_per_child}.`,
  );

  // Insight 2: Quality indicators and alerts
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts. ` +
        `Allergy info current rate: ${metrics.allergy_information_current_rate}%. ` +
        `Eating concern rate: ${metrics.eating_concern_rate}%. ` +
        `Poor nutrition rate: ${metrics.poor_nutrition_rate}%. ` +
        `Excellent nutrition rate: ${metrics.excellent_nutrition_rate}%. ` +
        `Portion appropriate rate: ${metrics.portion_appropriate_rate}%. ` +
        `Hydration monitored rate: ${metrics.hydration_monitored_rate}%. ` +
        `Skills development records: ${metrics.skill_type_count}.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority food/meal alerts. ` +
        `Allergy info current rate: ${metrics.allergy_information_current_rate}%. ` +
        `Excellent nutrition rate: ${metrics.excellent_nutrition_rate}%. ` +
        `Eating concern rate: ${metrics.eating_concern_rate}%. ` +
        `Continue ensuring nutritious meals with choice per CHR 2015 Reg 9.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.child_choice_offered_rate < 50 && metrics.total_records > 5) {
    insights.push(
      `[reflect] Child choice offered in only ${metrics.child_choice_offered_rate}% of food records. ` +
        `SCCIF inspectors specifically assess whether children have choice ` +
        `at mealtimes. In a family home, children negotiate, request favourites, ` +
        `refuse foods they dislike, and try new things at their own pace. ` +
        `In an institutional setting, children eat what is served without ` +
        `input. Where does this home fall on that spectrum? Are children ` +
        `involved in menu planning? Can they choose between options at each ` +
        `meal? Can they make themselves something different if they do not ` +
        `like what is offered? Do staff eat the same food alongside them?`,
    );
  } else if (metrics.mealtimes_social_rate < 60 && metrics.total_records > 5) {
    insights.push(
      `[reflect] Mealtimes recorded as social in only ${metrics.mealtimes_social_rate}% of records. ` +
        `Shared mealtimes are one of the most powerful tools a residential ` +
        `home has for building relationships and creating a sense of family. ` +
        `When children eat together with staff, it normalises conversation, ` +
        `builds table skills, and creates daily moments of connection. Many ` +
        `looked-after children have never experienced relaxed family mealtimes. ` +
        `If children are routinely eating alone or in their rooms, what ` +
        `barriers exist? Shift patterns? Children's choice? Dysregulation? ` +
        `Each barrier requires a different solution.`,
    );
  } else if (metrics.child_participated_cooking_rate < 30 && metrics.total_records > 5) {
    insights.push(
      `[reflect] Cooking participation rate is only ${metrics.child_participated_cooking_rate}%. ` +
        `Cooking is both a life skill and a relational activity. CHR 2015 ` +
        `Reg 5 requires independence preparation, and being able to cook ` +
        `is fundamental for care leavers. But cooking together is also a ` +
        `positive, nurturing activity — it teaches patience, following ` +
        `instructions, measuring, creativity, and pride in achievement. ` +
        `Are children being invited to cook? Is the kitchen accessible ` +
        `to them (with appropriate supervision for age)? Do risk ` +
        `assessments restrict kitchen access disproportionately?`,
    );
  } else {
    insights.push(
      `[reflect] How does the home create a positive food culture? Food is ` +
        `deeply connected to comfort, identity, and belonging. For children ` +
        `who have experienced neglect, food may carry complex associations. ` +
        `Some children hoard food; others refuse to eat; others find comfort ` +
        `in excessive eating. A trauma-informed approach to food means ` +
        `understanding these behaviours without punishing them, maintaining ` +
        `a relaxed atmosphere around food, never using food as reward or ` +
        `punishment, and ensuring food is always available and abundant. ` +
        `Does the home feel like a place where food is enjoyed together?`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    recordType?: RecordType;
    nutritionalBalance?: NutritionalBalance;
    limit?: number;
  },
): Promise<ServiceResult<MealPlanningRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_meal_planning") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.recordType) q = q.eq("record_type", filters.recordType);
  if (filters?.nutritionalBalance) q = q.eq("nutritional_balance", filters.nutritionalBalance);

  q = q.order("record_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<MealPlanningRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_meal_planning") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createRecord(input: {
  homeId: string;
  childName: string;
  recordDate: string;
  recordedBy: string;
  recordType: RecordType;
  dietaryRequirement?: string | null;
  childChoiceOffered?: boolean;
  childParticipatedCooking?: boolean;
  ageAppropriateInvolvement?: boolean;
  nutritionalBalance?: NutritionalBalance;
  culturalNeedsMet?: boolean;
  allergyInformationCurrent?: boolean;
  portionAppropriate?: boolean;
  mealtimesSocial?: boolean;
  snacksAvailable?: boolean;
  hydrationMonitored?: boolean | null;
  eatingConcernIdentified?: boolean;
  concernDetails?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<MealPlanningRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateMealPlanning({
    childName: input.childName,
    recordDate: input.recordDate,
    recordedBy: input.recordedBy,
    recordType: input.recordType,
    nutritionalBalance: input.nutritionalBalance,
    childChoiceOffered: input.childChoiceOffered,
    childParticipatedCooking: input.childParticipatedCooking,
    ageAppropriateInvolvement: input.ageAppropriateInvolvement,
    culturalNeedsMet: input.culturalNeedsMet,
    allergyInformationCurrent: input.allergyInformationCurrent,
    portionAppropriate: input.portionAppropriate,
    mealtimesSocial: input.mealtimesSocial,
    snacksAvailable: input.snacksAvailable,
    eatingConcernIdentified: input.eatingConcernIdentified,
    concernDetails: input.concernDetails,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_meal_planning") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      record_date: input.recordDate,
      recorded_by: input.recordedBy,
      record_type: input.recordType,
      dietary_requirement: input.dietaryRequirement ?? null,
      child_choice_offered: input.childChoiceOffered ?? false,
      child_participated_cooking: input.childParticipatedCooking ?? false,
      age_appropriate_involvement: input.ageAppropriateInvolvement ?? true,
      nutritional_balance: input.nutritionalBalance ?? "Not Assessed",
      cultural_needs_met: input.culturalNeedsMet ?? false,
      allergy_information_current: input.allergyInformationCurrent ?? true,
      portion_appropriate: input.portionAppropriate ?? true,
      mealtimes_social: input.mealtimesSocial ?? true,
      snacks_available: input.snacksAvailable ?? true,
      hydration_monitored: input.hydrationMonitored ?? null,
      eating_concern_identified: input.eatingConcernIdentified ?? false,
      concern_details: input.concernDetails ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    childName: string;
    recordDate: string;
    recordedBy: string;
    recordType: RecordType;
    dietaryRequirement: string | null;
    childChoiceOffered: boolean;
    childParticipatedCooking: boolean;
    ageAppropriateInvolvement: boolean;
    nutritionalBalance: NutritionalBalance;
    culturalNeedsMet: boolean;
    allergyInformationCurrent: boolean;
    portionAppropriate: boolean;
    mealtimesSocial: boolean;
    snacksAvailable: boolean;
    hydrationMonitored: boolean | null;
    eatingConcernIdentified: boolean;
    concernDetails: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<MealPlanningRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.recordDate !== undefined) mapped.record_date = updates.recordDate;
  if (updates.recordedBy !== undefined) mapped.recorded_by = updates.recordedBy;
  if (updates.recordType !== undefined) mapped.record_type = updates.recordType;
  if (updates.dietaryRequirement !== undefined) mapped.dietary_requirement = updates.dietaryRequirement;
  if (updates.childChoiceOffered !== undefined) mapped.child_choice_offered = updates.childChoiceOffered;
  if (updates.childParticipatedCooking !== undefined) mapped.child_participated_cooking = updates.childParticipatedCooking;
  if (updates.ageAppropriateInvolvement !== undefined) mapped.age_appropriate_involvement = updates.ageAppropriateInvolvement;
  if (updates.nutritionalBalance !== undefined) mapped.nutritional_balance = updates.nutritionalBalance;
  if (updates.culturalNeedsMet !== undefined) mapped.cultural_needs_met = updates.culturalNeedsMet;
  if (updates.allergyInformationCurrent !== undefined) mapped.allergy_information_current = updates.allergyInformationCurrent;
  if (updates.portionAppropriate !== undefined) mapped.portion_appropriate = updates.portionAppropriate;
  if (updates.mealtimesSocial !== undefined) mapped.mealtimes_social = updates.mealtimesSocial;
  if (updates.snacksAvailable !== undefined) mapped.snacks_available = updates.snacksAvailable;
  if (updates.hydrationMonitored !== undefined) mapped.hydration_monitored = updates.hydrationMonitored;
  if (updates.eatingConcernIdentified !== undefined) mapped.eating_concern_identified = updates.eatingConcernIdentified;
  if (updates.concernDetails !== undefined) mapped.concern_details = updates.concernDetails;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_meal_planning") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteRecord(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { error } = await (client.from("cs_meal_planning") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
