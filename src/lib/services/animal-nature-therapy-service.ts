// ==============================================================================
// CARA -- ANIMAL-ASSISTED & NATURE-BASED THERAPY SERVICE
// Tracks equine-assisted therapy, canine-assisted therapy, farm therapy, forest
// school, horticultural therapy, nature walks, pet responsibility programmes,
// therapeutic gardening, and other animal/nature-based therapeutic and recreational
// sessions for looked-after children.
//
// Covers: Therapy type and classification (registered therapy vs structured activity
// vs recreational vs educational), animal involvement, qualified therapist
// verification, risk assessment completion, allergy checks, animal welfare
// compliance, parental consent, child choice, engagement level, emotional response,
// therapeutic goal tracking, progress notes, care plan linkage, and injury
// monitoring.
//
// UK Regulatory Framework:
// CHR 2015 Reg 9 (quality of care), Reg 10 (wellbeing),
// NICE CG26 (PTSD — complementary therapies),
// SCCIF: Experiences & progress — "The home provides therapeutic interventions."
// Animal Welfare Act 2006, HSE guidance on animals in care settings.
// ==============================================================================

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const THERAPY_TYPES = [
  "Equine-Assisted Therapy",
  "Canine-Assisted Therapy",
  "Farm Therapy",
  "Animal Care Routine",
  "Wildlife/Nature Walk",
  "Forest School",
  "Horticultural Therapy",
  "Fishing Therapy",
  "Bird Watching",
  "Pet Responsibility Programme",
  "Therapeutic Gardening",
  "Nature Art/Craft",
  "Beach Therapy",
  "Woodland Crafts",
] as const;
export type TherapyType = (typeof THERAPY_TYPES)[number];

export const THERAPY_OR_ACTIVITY_TYPES = [
  "Registered Therapy",
  "Structured Activity",
  "Recreational",
  "Educational",
] as const;
export type TherapyOrActivity = (typeof THERAPY_OR_ACTIVITY_TYPES)[number];

export const ENGAGEMENT_LEVELS = [
  "Refused",
  "Reluctant",
  "Participated",
  "Engaged",
  "Enthusiastic",
] as const;
export type EngagementLevel = (typeof ENGAGEMENT_LEVELS)[number];

export const EMOTIONAL_RESPONSES = [
  "Very Positive",
  "Positive",
  "Neutral",
  "Mixed",
  "Negative",
] as const;
export type EmotionalResponse = (typeof EMOTIONAL_RESPONSES)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const ANIMAL_BASED_TYPES: TherapyType[] = [
  "Equine-Assisted Therapy",
  "Canine-Assisted Therapy",
  "Farm Therapy",
  "Animal Care Routine",
  "Pet Responsibility Programme",
];

export const NATURE_BASED_TYPES: TherapyType[] = [
  "Wildlife/Nature Walk",
  "Forest School",
  "Horticultural Therapy",
  "Fishing Therapy",
  "Bird Watching",
  "Therapeutic Gardening",
  "Nature Art/Craft",
  "Beach Therapy",
  "Woodland Crafts",
];

export const FORMAL_THERAPY_TYPES: TherapyType[] = [
  "Equine-Assisted Therapy",
  "Canine-Assisted Therapy",
  "Horticultural Therapy",
  "Fishing Therapy",
];

export const OUTDOOR_TYPES: TherapyType[] = [
  "Wildlife/Nature Walk",
  "Forest School",
  "Fishing Therapy",
  "Bird Watching",
  "Beach Therapy",
  "Woodland Crafts",
];

export const POSITIVE_ENGAGEMENT_LEVELS: EngagementLevel[] = [
  "Participated",
  "Engaged",
  "Enthusiastic",
];

export const POSITIVE_EMOTIONAL_RESPONSES: EmotionalResponse[] = [
  "Very Positive",
  "Positive",
];

// -- Label maps ---------------------------------------------------------------

export const THERAPY_TYPE_LABELS: { type: TherapyType; label: string }[] = [
  { type: "Equine-Assisted Therapy", label: "Equine-Assisted Therapy" },
  { type: "Canine-Assisted Therapy", label: "Canine-Assisted Therapy" },
  { type: "Farm Therapy", label: "Farm Therapy" },
  { type: "Animal Care Routine", label: "Animal Care Routine" },
  { type: "Wildlife/Nature Walk", label: "Wildlife/Nature Walk" },
  { type: "Forest School", label: "Forest School" },
  { type: "Horticultural Therapy", label: "Horticultural Therapy" },
  { type: "Fishing Therapy", label: "Fishing Therapy" },
  { type: "Bird Watching", label: "Bird Watching" },
  { type: "Pet Responsibility Programme", label: "Pet Responsibility Programme" },
  { type: "Therapeutic Gardening", label: "Therapeutic Gardening" },
  { type: "Nature Art/Craft", label: "Nature Art/Craft" },
  { type: "Beach Therapy", label: "Beach Therapy" },
  { type: "Woodland Crafts", label: "Woodland Crafts" },
];

export const ENGAGEMENT_LEVEL_LABELS: { level: EngagementLevel; label: string }[] = [
  { level: "Refused", label: "Refused" },
  { level: "Reluctant", label: "Reluctant" },
  { level: "Participated", label: "Participated" },
  { level: "Engaged", label: "Engaged" },
  { level: "Enthusiastic", label: "Enthusiastic" },
];

export const EMOTIONAL_RESPONSE_LABELS: { response: EmotionalResponse; label: string }[] = [
  { response: "Very Positive", label: "Very Positive" },
  { response: "Positive", label: "Positive" },
  { response: "Neutral", label: "Neutral" },
  { response: "Mixed", label: "Mixed" },
  { response: "Negative", label: "Negative" },
];

// -- Row type -----------------------------------------------------------------

export interface AnimalNatureTherapyRow {
  id: string;
  home_id: string;
  child_name: string;
  session_date: string;
  facilitator_name: string;
  therapy_type: TherapyType;
  animal_involved: string | null;
  qualified_therapist: boolean;
  therapy_or_activity: TherapyOrActivity;
  risk_assessment_completed: boolean;
  allergy_check: boolean;
  animal_welfare_compliant: boolean;
  parental_consent: boolean;
  child_choice: boolean;
  engagement_level: EngagementLevel;
  emotional_response: EmotionalResponse;
  therapeutic_goal: string | null;
  progress_noted: string | null;
  linked_to_care_plan: boolean;
  injury_occurred: boolean;
  injury_details: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateAnimalNatureTherapy(input: {
  childName?: string;
  sessionDate?: string;
  facilitatorName?: string;
  therapyType?: string;
  therapyOrActivity?: string;
  engagementLevel?: string;
  emotionalResponse?: string;
  qualifiedTherapist?: boolean;
  riskAssessmentCompleted?: boolean;
  allergyCheck?: boolean;
  animalWelfareCompliant?: boolean;
  parentalConsent?: boolean;
  injuryOccurred?: boolean;
  injuryDetails?: string | null;
  animalInvolved?: string | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.childName || input.childName.trim().length === 0) {
    errors.push("Child name is required");
  }

  if (!input.sessionDate) {
    errors.push("Session date is required");
  } else {
    const dateObj = new Date(input.sessionDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Session date must be a valid date");
    } else if (dateObj > new Date()) {
      errors.push("Session date cannot be in the future");
    }
  }

  if (!input.facilitatorName || input.facilitatorName.trim().length === 0) {
    errors.push("Facilitator name is required");
  }

  if (!input.therapyType || !(THERAPY_TYPES as readonly string[]).includes(input.therapyType)) {
    errors.push(`Therapy type must be one of: ${THERAPY_TYPES.join(", ")}`);
  }

  if (
    input.therapyOrActivity &&
    !(THERAPY_OR_ACTIVITY_TYPES as readonly string[]).includes(input.therapyOrActivity)
  ) {
    errors.push(`Therapy/activity classification must be one of: ${THERAPY_OR_ACTIVITY_TYPES.join(", ")}`);
  }

  if (
    input.engagementLevel &&
    !(ENGAGEMENT_LEVELS as readonly string[]).includes(input.engagementLevel)
  ) {
    errors.push(`Engagement level must be one of: ${ENGAGEMENT_LEVELS.join(", ")}`);
  }

  if (
    input.emotionalResponse &&
    !(EMOTIONAL_RESPONSES as readonly string[]).includes(input.emotionalResponse)
  ) {
    errors.push(`Emotional response must be one of: ${EMOTIONAL_RESPONSES.join(", ")}`);
  }

  // Business rule: Registered Therapy must have a qualified therapist
  if (input.therapyOrActivity === "Registered Therapy" && input.qualifiedTherapist === false) {
    errors.push(
      "Registered Therapy sessions must be delivered by a qualified therapist — animal-assisted and nature-based therapies that are classed as registered therapy require a practitioner with recognised qualifications (e.g., EAGALA, ISAAT accredited). CHR 2015 Reg 9 requires the home to ensure care is provided by appropriately qualified staff",
    );
  }

  // Business rule: Risk assessment is mandatory for animal-based sessions
  if (
    input.therapyType &&
    (ANIMAL_BASED_TYPES as string[]).includes(input.therapyType) &&
    input.riskAssessmentCompleted === false
  ) {
    errors.push(
      `Risk assessment not completed for ${input.therapyType} — HSE guidance on animals in care settings requires a documented risk assessment before any session involving animal contact. This must cover animal behaviour, allergies, infection control, and individual child risks. The Animal Welfare Act 2006 also requires that animal wellbeing is considered`,
    );
  }

  // Business rule: Allergy check required for animal contact
  if (
    input.therapyType &&
    (ANIMAL_BASED_TYPES as string[]).includes(input.therapyType) &&
    input.allergyCheck === false
  ) {
    errors.push(
      `Allergy check not completed for ${input.therapyType} — all children must have an allergy check documented before animal contact sessions. This is a basic health and safety requirement and should be cross-referenced with the child's health records`,
    );
  }

  // Business rule: Animal welfare compliance required for animal sessions
  if (
    input.therapyType &&
    (ANIMAL_BASED_TYPES as string[]).includes(input.therapyType) &&
    input.animalWelfareCompliant === false
  ) {
    errors.push(
      `Animal welfare compliance not confirmed for ${input.therapyType} — the Animal Welfare Act 2006 requires that the welfare needs of animals used in therapeutic or activity settings are met. This includes appropriate environment, diet, ability to exhibit normal behaviour, housing with or apart from other animals, and protection from pain, suffering, injury, and disease`,
    );
  }

  // Business rule: Injury occurred must have details
  if (input.injuryOccurred === true && (!input.injuryDetails || input.injuryDetails.trim().length === 0)) {
    errors.push(
      "Injury occurred but no details provided — all injuries during animal/nature sessions must be fully documented including nature of injury, how it occurred, first aid given, and whether medical attention was sought. This forms part of the home's accident reporting obligations",
    );
  }

  // Business rule: Parental consent is expected
  if (input.parentalConsent === false) {
    // Advisory: parental consent should be obtained where possible
    // Not a hard error as some children may be under full care order
    // where consent arrangements vary
  }

  // Business rule: Animal-based types should have animal recorded
  if (
    input.therapyType &&
    (ANIMAL_BASED_TYPES as string[]).includes(input.therapyType) &&
    (!input.animalInvolved || input.animalInvolved.trim().length === 0)
  ) {
    // Advisory: recording which animal was involved aids tracking and
    // risk management but is not blocking
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: AnimalNatureTherapyRow[],
): {
  total_sessions: number;
  unique_children: number;
  by_therapy_type: Record<string, number>;
  by_engagement_level: Record<string, number>;
  by_emotional_response: Record<string, number>;
  therapy_vs_activity_ratio: { therapy: number; activity: number; recreational: number; educational: number };
  qualified_therapist_rate: number;
  risk_assessment_rate: number;
  allergy_check_rate: number;
  animal_welfare_rate: number;
  child_choice_rate: number;
  engagement_rate: number;
  positive_response_rate: number;
  injury_rate: number;
  care_plan_link_rate: number;
  parental_consent_rate: number;
  animal_based_count: number;
  nature_based_count: number;
  formal_therapy_count: number;
  outdoor_count: number;
  average_sessions_per_child: number;
} {
  const total = rows.length;

  // Unique children
  const uniqueChildren = new Set(rows.map((r) => r.child_name.toLowerCase().trim()));

  // Therapy type breakdown
  const byTherapyType: Record<string, number> = {};
  for (const tt of THERAPY_TYPES) byTherapyType[tt] = 0;
  for (const r of rows) byTherapyType[r.therapy_type] = (byTherapyType[r.therapy_type] || 0) + 1;

  // Engagement level breakdown
  const byEngagement: Record<string, number> = {};
  for (const el of ENGAGEMENT_LEVELS) byEngagement[el] = 0;
  for (const r of rows) byEngagement[r.engagement_level] = (byEngagement[r.engagement_level] || 0) + 1;

  // Emotional response breakdown
  const byResponse: Record<string, number> = {};
  for (const er of EMOTIONAL_RESPONSES) byResponse[er] = 0;
  for (const r of rows) byResponse[r.emotional_response] = (byResponse[r.emotional_response] || 0) + 1;

  // Therapy vs activity ratio
  const therapyCount = rows.filter((r) => r.therapy_or_activity === "Registered Therapy").length;
  const activityCount = rows.filter((r) => r.therapy_or_activity === "Structured Activity").length;
  const recreationalCount = rows.filter((r) => r.therapy_or_activity === "Recreational").length;
  const educationalCount = rows.filter((r) => r.therapy_or_activity === "Educational").length;

  // Boolean rates
  const qualifiedTherapistRate = total > 0
    ? Math.round((rows.filter((r) => r.qualified_therapist).length / total) * 1000) / 10
    : 0;

  const riskAssessmentRate = total > 0
    ? Math.round((rows.filter((r) => r.risk_assessment_completed).length / total) * 1000) / 10
    : 0;

  const allergyCheckRate = total > 0
    ? Math.round((rows.filter((r) => r.allergy_check).length / total) * 1000) / 10
    : 0;

  const animalWelfareRate = total > 0
    ? Math.round((rows.filter((r) => r.animal_welfare_compliant).length / total) * 1000) / 10
    : 0;

  const childChoiceRate = total > 0
    ? Math.round((rows.filter((r) => r.child_choice).length / total) * 1000) / 10
    : 0;

  const engagementRate = total > 0
    ? Math.round(
        (rows.filter((r) => (POSITIVE_ENGAGEMENT_LEVELS as string[]).includes(r.engagement_level)).length /
          total) *
          1000,
      ) / 10
    : 0;

  const positiveResponseRate = total > 0
    ? Math.round(
        (rows.filter((r) => (POSITIVE_EMOTIONAL_RESPONSES as string[]).includes(r.emotional_response)).length /
          total) *
          1000,
      ) / 10
    : 0;

  const injuryRate = total > 0
    ? Math.round((rows.filter((r) => r.injury_occurred).length / total) * 1000) / 10
    : 0;

  const carePlanLinkRate = total > 0
    ? Math.round((rows.filter((r) => r.linked_to_care_plan).length / total) * 1000) / 10
    : 0;

  const parentalConsentRate = total > 0
    ? Math.round((rows.filter((r) => r.parental_consent).length / total) * 1000) / 10
    : 0;

  // Category counts
  const animalBasedCount = rows.filter(
    (r) => (ANIMAL_BASED_TYPES as string[]).includes(r.therapy_type),
  ).length;

  const natureBasedCount = rows.filter(
    (r) => (NATURE_BASED_TYPES as string[]).includes(r.therapy_type),
  ).length;

  const formalTherapyCount = rows.filter(
    (r) => (FORMAL_THERAPY_TYPES as string[]).includes(r.therapy_type),
  ).length;

  const outdoorCount = rows.filter(
    (r) => (OUTDOOR_TYPES as string[]).includes(r.therapy_type),
  ).length;

  // Average sessions per child
  const avgPerChild = uniqueChildren.size > 0
    ? Math.round((total / uniqueChildren.size) * 10) / 10
    : 0;

  return {
    total_sessions: total,
    unique_children: uniqueChildren.size,
    by_therapy_type: byTherapyType,
    by_engagement_level: byEngagement,
    by_emotional_response: byResponse,
    therapy_vs_activity_ratio: {
      therapy: therapyCount,
      activity: activityCount,
      recreational: recreationalCount,
      educational: educationalCount,
    },
    qualified_therapist_rate: qualifiedTherapistRate,
    risk_assessment_rate: riskAssessmentRate,
    allergy_check_rate: allergyCheckRate,
    animal_welfare_rate: animalWelfareRate,
    child_choice_rate: childChoiceRate,
    engagement_rate: engagementRate,
    positive_response_rate: positiveResponseRate,
    injury_rate: injuryRate,
    care_plan_link_rate: carePlanLinkRate,
    parental_consent_rate: parentalConsentRate,
    animal_based_count: animalBasedCount,
    nature_based_count: natureBasedCount,
    formal_therapy_count: formalTherapyCount,
    outdoor_count: outdoorCount,
    average_sessions_per_child: avgPerChild,
  };
}

export function computeAlerts(
  rows: AnimalNatureTherapyRow[],
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

  // Critical: Injury occurred during session
  for (const r of rows) {
    if (r.injury_occurred) {
      alerts.push({
        type: "injury_occurred",
        severity: "critical",
        message: `Injury occurred during ${r.therapy_type} session for ${r.child_name} on ${r.session_date}${r.injury_details ? ` — ${r.injury_details}` : ""}. All injuries during animal/nature sessions must be thoroughly investigated. Was the risk assessment adequate? Was the session appropriately supervised? Does the incident require notification to Ofsted (Reg 40) or the placing authority? Review the risk assessment and consider whether additional safety measures or session modifications are needed before the next session`,
        record_id: r.id,
      });
    }
  }

  // Critical: Registered Therapy without qualified therapist
  for (const r of rows) {
    if (r.therapy_or_activity === "Registered Therapy" && !r.qualified_therapist) {
      alerts.push({
        type: "therapy_no_qualified_therapist",
        severity: "critical",
        message: `${r.therapy_type} session for ${r.child_name} on ${r.session_date} is classified as Registered Therapy but was not delivered by a qualified therapist — this is a serious quality concern. Animal-assisted and nature-based therapies that claim therapeutic status must be delivered by practitioners with recognised qualifications (e.g., EAGALA, ISAAT, or equivalent UK-recognised body). CHR 2015 Reg 9 requires that care is effective and based on the child's assessed needs, delivered by appropriately qualified staff`,
        record_id: r.id,
      });
    }
  }

  // Critical: Animal session without risk assessment
  for (const r of rows) {
    if (
      (ANIMAL_BASED_TYPES as string[]).includes(r.therapy_type) &&
      !r.risk_assessment_completed
    ) {
      alerts.push({
        type: "animal_no_risk_assessment",
        severity: "critical",
        message: `${r.therapy_type} session for ${r.child_name} on ${r.session_date} was conducted without a completed risk assessment — HSE guidance on animals in care settings is clear: a documented risk assessment must be in place before any animal contact session. This must cover animal behaviour risks, zoonotic infection control, allergy management, and individual child-specific risks. This represents a significant health and safety gap`,
        record_id: r.id,
      });
    }
  }

  // Critical: Animal welfare not compliant
  for (const r of rows) {
    if (
      (ANIMAL_BASED_TYPES as string[]).includes(r.therapy_type) &&
      !r.animal_welfare_compliant
    ) {
      alerts.push({
        type: "animal_welfare_non_compliant",
        severity: "critical",
        message: `${r.therapy_type} session for ${r.child_name} on ${r.session_date} was not Animal Welfare Act 2006 compliant — the home has a legal duty to ensure that animals used in therapeutic or activity settings have their five welfare needs met: appropriate environment, diet, ability to exhibit normal behaviour, housing needs, and protection from pain and suffering. Non-compliance is a criminal offence and must be addressed immediately`,
        record_id: r.id,
      });
    }
  }

  // High: Repeated negative emotional responses for same child
  const childNegativeMap = new Map<string, AnimalNatureTherapyRow[]>();
  for (const r of rows) {
    if (r.emotional_response === "Negative" || r.emotional_response === "Mixed") {
      const key = r.child_name.toLowerCase().trim();
      if (!childNegativeMap.has(key)) childNegativeMap.set(key, []);
      childNegativeMap.get(key)!.push(r);
    }
  }
  for (const [, childRows] of childNegativeMap) {
    if (childRows.length >= 3) {
      alerts.push({
        type: "repeated_negative_response",
        severity: "high",
        message: `${childRows[0].child_name} has had negative or mixed emotional responses across ${childRows.length} animal/nature sessions — persistent negative responses may indicate that the therapy type is not suitable for this child, triggers trauma responses, or that the approach needs significant modification. NICE CG26 recommends that complementary therapies should be monitored for effectiveness and discontinued if not beneficial. Review with the child whether they wish to continue and consider alternative therapeutic approaches`,
      });
    }
  }

  // High: Repeated refusal by same child
  const childRefusalMap = new Map<string, AnimalNatureTherapyRow[]>();
  for (const r of rows) {
    if (r.engagement_level === "Refused") {
      const key = r.child_name.toLowerCase().trim();
      if (!childRefusalMap.has(key)) childRefusalMap.set(key, []);
      childRefusalMap.get(key)!.push(r);
    }
  }
  for (const [, childRows] of childRefusalMap) {
    if (childRows.length >= 3) {
      alerts.push({
        type: "repeated_refusal",
        severity: "high",
        message: `${childRows[0].child_name} has refused ${childRows.length} animal/nature therapy sessions — while child choice should always be respected (CHR 2015 Reg 9 requires care that is child-centred), repeated refusal may indicate the child has concerns about the activity that need exploring. Are there fears about animals? Past traumatic experiences related to animals or outdoor environments? Or does the child simply not enjoy this type of activity? The child's views must be sought and respected`,
      });
    }
  }

  // High: Low allergy check rate for animal sessions
  const animalRows = rows.filter((r) => (ANIMAL_BASED_TYPES as string[]).includes(r.therapy_type));
  const allergyChecked = animalRows.filter((r) => r.allergy_check).length;
  if (animalRows.length >= 3 && allergyChecked / animalRows.length < 0.5) {
    alerts.push({
      type: "low_allergy_check_rate",
      severity: "high",
      message: `Allergy checks completed for only ${Math.round((allergyChecked / animalRows.length) * 100)}% of animal-based sessions — this is a significant health and safety gap. All children must have documented allergy checks before animal contact. Allergic reactions to animals can range from mild skin irritation to severe anaphylaxis. The home must maintain up-to-date allergy records and cross-reference them before every animal session`,
    });
  }

  // High: Low care plan linkage for therapy sessions
  const therapyRows = rows.filter((r) => r.therapy_or_activity === "Registered Therapy");
  const therapyLinked = therapyRows.filter((r) => r.linked_to_care_plan).length;
  if (therapyRows.length >= 3 && therapyLinked / therapyRows.length < 0.5) {
    alerts.push({
      type: "low_care_plan_linkage_therapy",
      severity: "high",
      message: `Only ${Math.round((therapyLinked / therapyRows.length) * 100)}% of registered therapy sessions are linked to care plans — therapeutic interventions should be a planned part of the child's care, not ad hoc. SCCIF inspectors expect to see that therapeutic provision is purposeful and aligned with assessed needs. The care plan should specify therapeutic goals and the therapy should demonstrably contribute to those goals`,
    });
  }

  // High: Multiple injuries across sessions
  const injuryCount = rows.filter((r) => r.injury_occurred).length;
  if (injuryCount >= 3) {
    alerts.push({
      type: "multiple_injuries",
      severity: "high",
      message: `${injuryCount} injuries have occurred across animal/nature therapy sessions — this pattern requires immediate review. Are risk assessments adequate and being followed? Are sessions appropriately supervised? Are the animals used suitable for therapeutic work with children? Are outdoor environments being properly assessed for hazards? The home should conduct a full review of its animal/nature therapy programme safety and consider whether additional training, equipment, or supervision is needed`,
    });
  }

  // Medium: Low child choice rate
  const childChoiceCount = rows.filter((r) => r.child_choice).length;
  if (rows.length >= 5 && childChoiceCount / rows.length < 0.5) {
    alerts.push({
      type: "low_child_choice_rate",
      severity: "medium",
      message: `Child choice recorded in only ${Math.round((childChoiceCount / rows.length) * 100)}% of sessions — CHR 2015 Reg 9 requires child-centred care, and UNCRC Article 12 enshrines the child's right to have their views taken into account. Animal and nature-based activities should be offered as choices, not imposed. Children who choose to participate are more likely to engage meaningfully and benefit therapeutically. Is the home genuinely offering choice, or are sessions being scheduled without consulting the child?`,
    });
  }

  // Medium: Low qualified therapist rate for formal therapy types
  const formalRows = rows.filter((r) => (FORMAL_THERAPY_TYPES as string[]).includes(r.therapy_type));
  const qualifiedCount = formalRows.filter((r) => r.qualified_therapist).length;
  if (formalRows.length >= 3 && qualifiedCount / formalRows.length < 0.5) {
    alerts.push({
      type: "low_qualified_therapist_formal",
      severity: "medium",
      message: `Qualified therapists involved in only ${Math.round((qualifiedCount / formalRows.length) * 100)}% of formal therapy sessions (${FORMAL_THERAPY_TYPES.join(", ")}) — while not all of these sessions may be classified as Registered Therapy, the evidence base for animal-assisted and nature-based therapies relies on qualified delivery. Consider whether sessions would benefit from professional therapeutic input or whether they should be reclassified as structured activities`,
    });
  }

  // Medium: No variety in therapy types
  const activeTypes = Object.entries(
    rows.reduce((acc, r) => { acc[r.therapy_type] = (acc[r.therapy_type] || 0) + 1; return acc; }, {} as Record<string, number>),
  ).filter(([, count]) => count > 0);
  if (rows.length >= 8 && activeTypes.length <= 2) {
    alerts.push({
      type: "low_therapy_variety",
      severity: "medium",
      message: `Only ${activeTypes.length} different therapy type${activeTypes.length === 1 ? " is" : "s are"} being offered — the evidence base for animal-assisted and nature-based therapies suggests that different modalities benefit different children. Some children respond well to large animals (equine therapy), others to companion animals (canine therapy), and others to nature-based activities. Is the home offering a sufficient range to match individual children's needs and preferences?`,
    });
  }

  // Medium: Low parental consent rate
  const consentCount = rows.filter((r) => r.parental_consent).length;
  if (rows.length >= 5 && consentCount / rows.length < 0.5) {
    alerts.push({
      type: "low_parental_consent",
      severity: "medium",
      message: `Parental consent recorded in only ${Math.round((consentCount / rows.length) * 100)}% of sessions — while consent arrangements vary depending on the child's legal status (full care order, section 20, etc.), best practice is to seek parental consent where possible and appropriate. For therapeutic interventions in particular, involving parents/carers in the decision supports the child's wider network of care`,
    });
  }

  // Medium: Low positive emotional response rate
  const positiveCount = rows.filter(
    (r) => (POSITIVE_EMOTIONAL_RESPONSES as string[]).includes(r.emotional_response),
  ).length;
  if (rows.length >= 5 && positiveCount / rows.length < 0.4) {
    alerts.push({
      type: "low_positive_response_rate",
      severity: "medium",
      message: `Positive emotional response recorded in only ${Math.round((positiveCount / rows.length) * 100)}% of sessions — animal and nature-based therapies are valued precisely because they typically elicit positive emotional responses in children who struggle with traditional therapeutic approaches. If a significant proportion of sessions are not producing positive responses, the programme may need review. Are the therapy types well-matched to individual children? Are session durations appropriate? Are children being adequately prepared?`,
    });
  }

  return alerts;
}

export function generateCaraInsights(
  rows: AnimalNatureTherapyRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const typeBreakdown = Object.entries(metrics.by_therapy_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  const engagementBreakdown = Object.entries(metrics.by_engagement_level)
    .filter(([, count]) => count > 0)
    .map(([level, count]) => `${level}: ${count}`)
    .join(", ");

  const responseBreakdown = Object.entries(metrics.by_emotional_response)
    .filter(([, count]) => count > 0)
    .map(([response, count]) => `${response}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_sessions} animal/nature therapy ${metrics.total_sessions === 1 ? "session" : "sessions"} ` +
      `for ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `Therapy types: ${typeBreakdown || "none recorded"}. ` +
      `Engagement: ${engagementBreakdown || "none"}. ` +
      `Emotional responses: ${responseBreakdown || "none"}. ` +
      `Animal-based: ${metrics.animal_based_count}. Nature-based: ${metrics.nature_based_count}. ` +
      `Average sessions per child: ${metrics.average_sessions_per_child}. ` +
      `Classification — therapy: ${metrics.therapy_vs_activity_ratio.therapy}, ` +
      `activity: ${metrics.therapy_vs_activity_ratio.activity}, ` +
      `recreational: ${metrics.therapy_vs_activity_ratio.recreational}, ` +
      `educational: ${metrics.therapy_vs_activity_ratio.educational}. ` +
      `Engagement rate: ${metrics.engagement_rate}%. ` +
      `Positive response rate: ${metrics.positive_response_rate}%.`,
  );

  // Insight 2: Quality indicators and alerts
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts. ` +
        `Qualified therapist rate: ${metrics.qualified_therapist_rate}%. ` +
        `Risk assessment rate: ${metrics.risk_assessment_rate}%. ` +
        `Allergy check rate: ${metrics.allergy_check_rate}%. ` +
        `Animal welfare rate: ${metrics.animal_welfare_rate}%. ` +
        `Child choice rate: ${metrics.child_choice_rate}%. ` +
        `Injury rate: ${metrics.injury_rate}%. ` +
        `Care plan linked: ${metrics.care_plan_link_rate}%. ` +
        `Parental consent: ${metrics.parental_consent_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority therapy alerts. ` +
        `Qualified therapist rate: ${metrics.qualified_therapist_rate}%. ` +
        `Risk assessment rate: ${metrics.risk_assessment_rate}%. ` +
        `Allergy check rate: ${metrics.allergy_check_rate}%. ` +
        `Animal welfare rate: ${metrics.animal_welfare_rate}%. ` +
        `Child choice rate: ${metrics.child_choice_rate}%. ` +
        `Injury rate: ${metrics.injury_rate}%. ` +
        `Care plan linked: ${metrics.care_plan_link_rate}%. ` +
        `Parental consent: ${metrics.parental_consent_rate}%. ` +
        `Continue providing therapeutic interventions per CHR 2015 Reg 9.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.injury_rate > 5 && metrics.total_sessions > 5) {
    insights.push(
      `[reflect] Injury rate is ${metrics.injury_rate}% across animal/nature sessions. ` +
        `While some minor incidents are inevitable in outdoor and animal-contact ` +
        `settings, this rate warrants careful review. HSE guidance is clear that ` +
        `risk assessments must be proportionate and regularly reviewed. Are the ` +
        `same types of injuries recurring? Are they associated with particular ` +
        `activities, animals, or environments? Is the home maintaining adequate ` +
        `supervision ratios? For looked-after children, injuries during ` +
        `therapeutic sessions can be particularly damaging to trust and ` +
        `willingness to engage. CHR 2015 Reg 10 requires the home to protect ` +
        `and promote the health of each child — this includes physical safety ` +
        `during all activities.`,
    );
  } else if (metrics.child_choice_rate < 40 && metrics.total_sessions > 5) {
    insights.push(
      `[reflect] Child choice is recorded in only ${metrics.child_choice_rate}% of sessions. ` +
        `Animal-assisted and nature-based therapies are most effective when the ` +
        `child feels a sense of agency and control — many looked-after children ` +
        `have experienced a profound lack of control over their lives, and ` +
        `therapeutic activities should actively restore this. CHR 2015 Reg 9 ` +
        `requires child-centred care, and UNCRC Article 12 requires that ` +
        `children's views are sought. Is the home genuinely offering animal ` +
        `and nature activities as choices? Are children being consulted about ` +
        `which therapy types interest them? For children with histories of ` +
        `trauma, the ability to say no — and have that respected — is itself ` +
        `therapeutic.`,
    );
  } else if (metrics.care_plan_link_rate < 30 && metrics.total_sessions > 5) {
    insights.push(
      `[reflect] Only ${metrics.care_plan_link_rate}% of sessions are linked to care plans. ` +
        `SCCIF: Experiences & progress expects therapeutic provision to be ` +
        `purposeful and connected to assessed need. Animal-assisted and ` +
        `nature-based therapies have a growing evidence base (NICE CG26 ` +
        `acknowledges complementary therapies for PTSD), but they must be ` +
        `embedded within each child's holistic care plan to demonstrate ` +
        `that they are meeting specific therapeutic goals. Without care ` +
        `plan linkage, these sessions risk being seen as pleasant diversions ` +
        `rather than meaningful therapeutic interventions. Is each child's ` +
        `care plan reflecting the contribution that animal and nature-based ` +
        `work makes to their therapeutic journey?`,
    );
  } else {
    insights.push(
      `[reflect] How does the home evaluate the therapeutic effectiveness of ` +
        `its animal-assisted and nature-based programme? NICE CG26 recommends ` +
        `that complementary therapies are monitored for effectiveness. ` +
        `Engagement levels and emotional responses are useful proxies, but ` +
        `the real question is whether the programme is contributing to ` +
        `measurable improvements in the children's wellbeing, emotional ` +
        `regulation, and capacity for relationships. Are therapeutic goals ` +
        `being set and reviewed? Is progress being tracked over time? Are ` +
        `the insights from animal/nature sessions being shared with the ` +
        `wider team and informing care planning? CHR 2015 Reg 9 requires ` +
        `that the quality of care is such that it consistently meets each ` +
        `child's needs — this includes evaluating whether therapeutic ` +
        `interventions are actually working.`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    therapyType?: TherapyType;
    engagementLevel?: EngagementLevel;
    limit?: number;
  },
): Promise<ServiceResult<AnimalNatureTherapyRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_animal_nature_therapy") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.therapyType) q = q.eq("therapy_type", filters.therapyType);
  if (filters?.engagementLevel) q = q.eq("engagement_level", filters.engagementLevel);

  q = q.order("session_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<AnimalNatureTherapyRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_animal_nature_therapy") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createRecord(input: {
  homeId: string;
  childName: string;
  sessionDate: string;
  facilitatorName: string;
  therapyType: TherapyType;
  animalInvolved?: string | null;
  qualifiedTherapist?: boolean;
  therapyOrActivity?: TherapyOrActivity;
  riskAssessmentCompleted?: boolean;
  allergyCheck?: boolean;
  animalWelfareCompliant?: boolean;
  parentalConsent?: boolean;
  childChoice?: boolean;
  engagementLevel?: EngagementLevel;
  emotionalResponse?: EmotionalResponse;
  therapeuticGoal?: string | null;
  progressNoted?: string | null;
  linkedToCarePlan?: boolean;
  injuryOccurred?: boolean;
  injuryDetails?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<AnimalNatureTherapyRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateAnimalNatureTherapy({
    childName: input.childName,
    sessionDate: input.sessionDate,
    facilitatorName: input.facilitatorName,
    therapyType: input.therapyType,
    therapyOrActivity: input.therapyOrActivity,
    engagementLevel: input.engagementLevel,
    emotionalResponse: input.emotionalResponse,
    qualifiedTherapist: input.qualifiedTherapist,
    riskAssessmentCompleted: input.riskAssessmentCompleted,
    allergyCheck: input.allergyCheck,
    animalWelfareCompliant: input.animalWelfareCompliant,
    parentalConsent: input.parentalConsent,
    injuryOccurred: input.injuryOccurred,
    injuryDetails: input.injuryDetails,
    animalInvolved: input.animalInvolved,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_animal_nature_therapy") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      session_date: input.sessionDate,
      facilitator_name: input.facilitatorName,
      therapy_type: input.therapyType,
      animal_involved: input.animalInvolved ?? null,
      qualified_therapist: input.qualifiedTherapist ?? false,
      therapy_or_activity: input.therapyOrActivity ?? "Structured Activity",
      risk_assessment_completed: input.riskAssessmentCompleted ?? false,
      allergy_check: input.allergyCheck ?? false,
      animal_welfare_compliant: input.animalWelfareCompliant ?? false,
      parental_consent: input.parentalConsent ?? false,
      child_choice: input.childChoice ?? false,
      engagement_level: input.engagementLevel ?? "Participated",
      emotional_response: input.emotionalResponse ?? "Neutral",
      therapeutic_goal: input.therapeuticGoal ?? null,
      progress_noted: input.progressNoted ?? null,
      linked_to_care_plan: input.linkedToCarePlan ?? false,
      injury_occurred: input.injuryOccurred ?? false,
      injury_details: input.injuryDetails ?? null,
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
    sessionDate: string;
    facilitatorName: string;
    therapyType: TherapyType;
    animalInvolved: string | null;
    qualifiedTherapist: boolean;
    therapyOrActivity: TherapyOrActivity;
    riskAssessmentCompleted: boolean;
    allergyCheck: boolean;
    animalWelfareCompliant: boolean;
    parentalConsent: boolean;
    childChoice: boolean;
    engagementLevel: EngagementLevel;
    emotionalResponse: EmotionalResponse;
    therapeuticGoal: string | null;
    progressNoted: string | null;
    linkedToCarePlan: boolean;
    injuryOccurred: boolean;
    injuryDetails: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<AnimalNatureTherapyRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.facilitatorName !== undefined) mapped.facilitator_name = updates.facilitatorName;
  if (updates.therapyType !== undefined) mapped.therapy_type = updates.therapyType;
  if (updates.animalInvolved !== undefined) mapped.animal_involved = updates.animalInvolved;
  if (updates.qualifiedTherapist !== undefined) mapped.qualified_therapist = updates.qualifiedTherapist;
  if (updates.therapyOrActivity !== undefined) mapped.therapy_or_activity = updates.therapyOrActivity;
  if (updates.riskAssessmentCompleted !== undefined) mapped.risk_assessment_completed = updates.riskAssessmentCompleted;
  if (updates.allergyCheck !== undefined) mapped.allergy_check = updates.allergyCheck;
  if (updates.animalWelfareCompliant !== undefined) mapped.animal_welfare_compliant = updates.animalWelfareCompliant;
  if (updates.parentalConsent !== undefined) mapped.parental_consent = updates.parentalConsent;
  if (updates.childChoice !== undefined) mapped.child_choice = updates.childChoice;
  if (updates.engagementLevel !== undefined) mapped.engagement_level = updates.engagementLevel;
  if (updates.emotionalResponse !== undefined) mapped.emotional_response = updates.emotionalResponse;
  if (updates.therapeuticGoal !== undefined) mapped.therapeutic_goal = updates.therapeuticGoal;
  if (updates.progressNoted !== undefined) mapped.progress_noted = updates.progressNoted;
  if (updates.linkedToCarePlan !== undefined) mapped.linked_to_care_plan = updates.linkedToCarePlan;
  if (updates.injuryOccurred !== undefined) mapped.injury_occurred = updates.injuryOccurred;
  if (updates.injuryDetails !== undefined) mapped.injury_details = updates.injuryDetails;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_animal_nature_therapy") as SB)
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

  const { error } = await (client.from("cs_animal_nature_therapy") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
