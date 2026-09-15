// ==============================================================================
// CARA -- OUTDOOR ADVENTURE & PHYSICAL ACTIVITY SERVICE
// Tracks outdoor adventure and physical activities for looked-after children
// including walking/hiking, cycling, swimming, climbing/bouldering, kayaking/
// canoeing, sailing, surfing, horse riding, camping, Duke of Edinburgh, Scouts/
// Guides/Cadets, team sports, gym/fitness, yoga/mindfulness, orienteering,
// bushcraft, fishing, gardening, parkrun/running, and other outdoor activities.
//
// Covers: Risk assessment completion, parental consent verification, AALA licence
// checking for licensable activities, instructor qualification verification,
// first aider presence, staff-to-child ratio adequacy, weather appropriateness,
// equipment safety checks, young person choice and agency, engagement level
// monitoring, physical/emotional/social/confidence benefit tracking, achievement
// recognition (badges, awards, PBs), injury occurrence and reporting, and care
// plan linkage for developmental outcomes.
//
// UK Regulatory Framework:
// CHR 2015 Reg 9 (quality of care — promoting development through activities),
// AALA licensing (Adventure Activities Licensing Authority),
// OEAP guidance (Outdoor Education Advisers' Panel),
// DofE Award,
// SCCIF: Experiences & progress — "The home provides physical and outdoor
// activities."
// ==============================================================================

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { SB } from "@/lib/supabase/loose-client";

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const ACTIVITY_TYPES = [
  "Walking/Hiking",
  "Cycling",
  "Swimming",
  "Climbing/Bouldering",
  "Kayaking/Canoeing",
  "Sailing",
  "Surfing",
  "Horse Riding",
  "Camping",
  "Duke of Edinburgh",
  "Scouts/Guides/Cadets",
  "Team Sports",
  "Gym/Fitness",
  "Yoga/Mindfulness",
  "Orienteering",
  "Bushcraft",
  "Fishing",
  "Gardening",
  "Parkrun/Running",
  "Other Outdoor",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ENGAGEMENT_LEVELS = [
  "Refused",
  "Reluctant",
  "Participated",
  "Engaged",
  "Enthusiastic",
] as const;
export type EngagementLevel = (typeof ENGAGEMENT_LEVELS)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const AALA_LICENSABLE_TYPES: ActivityType[] = [
  "Climbing/Bouldering",
  "Kayaking/Canoeing",
  "Sailing",
  "Surfing",
  "Horse Riding",
];

export const WATER_ACTIVITY_TYPES: ActivityType[] = [
  "Swimming",
  "Kayaking/Canoeing",
  "Sailing",
  "Surfing",
  "Fishing",
];

export const HIGH_RISK_TYPES: ActivityType[] = [
  "Climbing/Bouldering",
  "Kayaking/Canoeing",
  "Sailing",
  "Surfing",
  "Horse Riding",
  "Camping",
  "Bushcraft",
];

export const STRUCTURED_PROGRAMME_TYPES: ActivityType[] = [
  "Duke of Edinburgh",
  "Scouts/Guides/Cadets",
  "Parkrun/Running",
];

export const TEAM_SOCIAL_TYPES: ActivityType[] = [
  "Team Sports",
  "Scouts/Guides/Cadets",
  "Parkrun/Running",
];

// Engagement level numeric mapping for analysis
const ENGAGEMENT_NUMERIC: Record<string, number> = {
  "Refused": 1,
  "Reluctant": 2,
  "Participated": 3,
  "Engaged": 4,
  "Enthusiastic": 5,
};

// -- Label maps ---------------------------------------------------------------

export const ACTIVITY_TYPE_LABELS: { type: ActivityType; label: string }[] = [
  { type: "Walking/Hiking", label: "Walking / Hiking" },
  { type: "Cycling", label: "Cycling" },
  { type: "Swimming", label: "Swimming" },
  { type: "Climbing/Bouldering", label: "Climbing / Bouldering" },
  { type: "Kayaking/Canoeing", label: "Kayaking / Canoeing" },
  { type: "Sailing", label: "Sailing" },
  { type: "Surfing", label: "Surfing" },
  { type: "Horse Riding", label: "Horse Riding" },
  { type: "Camping", label: "Camping" },
  { type: "Duke of Edinburgh", label: "Duke of Edinburgh" },
  { type: "Scouts/Guides/Cadets", label: "Scouts / Guides / Cadets" },
  { type: "Team Sports", label: "Team Sports" },
  { type: "Gym/Fitness", label: "Gym / Fitness" },
  { type: "Yoga/Mindfulness", label: "Yoga / Mindfulness" },
  { type: "Orienteering", label: "Orienteering" },
  { type: "Bushcraft", label: "Bushcraft" },
  { type: "Fishing", label: "Fishing" },
  { type: "Gardening", label: "Gardening" },
  { type: "Parkrun/Running", label: "Parkrun / Running" },
  { type: "Other Outdoor", label: "Other Outdoor" },
];

export const ENGAGEMENT_LEVEL_LABELS: { level: EngagementLevel; label: string }[] = [
  { level: "Refused", label: "Refused" },
  { level: "Reluctant", label: "Reluctant" },
  { level: "Participated", label: "Participated" },
  { level: "Engaged", label: "Engaged" },
  { level: "Enthusiastic", label: "Enthusiastic" },
];

// -- Row type -----------------------------------------------------------------

export interface OutdoorAdventureActivityRow {
  id: string;
  home_id: string;
  child_name: string;
  activity_date: string;
  lead_staff: string;
  activity_type: ActivityType;
  risk_assessment_completed: boolean | null; // null = not recorded; judgements are tri-state — credit needs === true, breach needs === false
  parental_consent: boolean | null;
  aala_licence_checked: boolean | null;
  instructor_qualified: boolean | null;
  first_aider_present: boolean | null;
  ratio_adequate: boolean | null;
  weather_appropriate: boolean | null;
  equipment_checked: boolean | null;
  young_person_choice: boolean | null;
  engagement_level: EngagementLevel;
  physical_benefit: boolean | null;
  emotional_benefit: boolean;
  social_benefit: boolean;
  confidence_building: boolean;
  achievement_noted: string | null;
  injury_occurred: boolean | null;
  injury_details: string | null;
  linked_to_care_plan: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateOutdoorAdventureActivity(input: {
  childName?: string;
  activityDate?: string;
  leadStaff?: string;
  activityType?: string;
  riskAssessmentCompleted?: boolean;
  parentalConsent?: boolean;
  aalaLicenceChecked?: boolean | null;
  instructorQualified?: boolean;
  firstAiderPresent?: boolean;
  ratioAdequate?: boolean;
  weatherAppropriate?: boolean;
  equipmentChecked?: boolean;
  engagementLevel?: string;
  injuryOccurred?: boolean;
  injuryDetails?: string | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.childName || input.childName.trim().length === 0) {
    errors.push("Child name is required");
  }

  if (!input.activityDate) {
    errors.push("Activity date is required");
  } else {
    const dateObj = new Date(input.activityDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Activity date must be a valid date");
    } else if (dateObj > new Date()) {
      errors.push("Activity date cannot be in the future");
    }
  }

  if (!input.leadStaff || input.leadStaff.trim().length === 0) {
    errors.push("Lead staff member is required");
  }

  if (!input.activityType || !(ACTIVITY_TYPES as readonly string[]).includes(input.activityType)) {
    errors.push(`Activity type must be one of: ${ACTIVITY_TYPES.join(", ")}`);
  }

  if (
    input.engagementLevel &&
    !(ENGAGEMENT_LEVELS as readonly string[]).includes(input.engagementLevel)
  ) {
    errors.push(`Engagement level must be one of: ${ENGAGEMENT_LEVELS.join(", ")}`);
  }

  // Business rule: Risk assessment is mandatory
  if (input.riskAssessmentCompleted === false) {
    errors.push("Risk assessment must be completed before any outdoor activity — OEAP guidance requires documented risk assessments for all off-site and adventurous activities");
  }

  // Business rule: Parental consent is mandatory
  if (input.parentalConsent === false) {
    errors.push("Parental or LA consent must be obtained before outdoor activities — check placement plan and delegated authority for consent arrangements");
  }

  // Business rule: AALA licence must be checked for licensable activities
  if (
    input.activityType &&
    (AALA_LICENSABLE_TYPES as string[]).includes(input.activityType) &&
    (input.aalaLicenceChecked === null || input.aalaLicenceChecked === undefined)
  ) {
    errors.push(`${input.activityType} is an AALA-licensable activity — AALA licence status must be recorded (checked or not applicable if provider is exempt)`);
  }

  if (
    input.activityType &&
    (AALA_LICENSABLE_TYPES as string[]).includes(input.activityType) &&
    input.aalaLicenceChecked === false
  ) {
    errors.push(`${input.activityType} requires an AALA-licensed provider — the Adventure Activities Licensing Authority licence must be verified before the activity proceeds`);
  }

  // Business rule: Qualified instructor for high-risk activities
  if (
    input.activityType &&
    (HIGH_RISK_TYPES as string[]).includes(input.activityType) &&
    input.instructorQualified === false
  ) {
    errors.push(`${input.activityType} is a high-risk activity and requires a qualified instructor — OEAP guidance mandates appropriate NGB qualifications for adventurous activities`);
  }

  // Business rule: First aider must be present
  if (input.firstAiderPresent === false) {
    errors.push("A first aider must be present for outdoor activities — Health and Safety at Work Act and OEAP guidance require first aid provision for off-site activities");
  }

  // Business rule: Staff ratio must be adequate
  if (input.ratioAdequate === false) {
    errors.push("Staff-to-child ratio is inadequate — review OEAP guidance for recommended ratios based on activity type, environment, and group needs");
  }

  // Business rule: Equipment must be checked
  if (input.equipmentChecked === false && input.activityType) {
    if ((HIGH_RISK_TYPES as string[]).includes(input.activityType)) {
      errors.push(`Equipment must be checked before ${input.activityType} — safety equipment failure in high-risk activities can result in serious injury`);
    }
  }

  // Business rule: Injury details required if injury occurred
  if (input.injuryOccurred && (!input.injuryDetails || input.injuryDetails.trim().length === 0)) {
    errors.push("Injury details must be recorded when an injury occurs — include type, severity, treatment, and whether RIDDOR reporting is required");
  }

  // Business rule: Weather should be appropriate
  if (input.weatherAppropriate === false) {
    // Advisory — activity may still proceed with modified plans
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: OutdoorAdventureActivityRow[],
): {
  total_activities: number;
  unique_children: number;
  by_activity_type: Record<string, number>;
  by_engagement_level: Record<string, number>;
  risk_assessment_rate: number | null;
  consent_rate: number | null;
  qualified_instructor_rate: number | null;
  first_aid_rate: number | null;
  child_choice_rate: number | null;
  injury_rate: number | null;
  achievement_count: number;
  physical_benefit_rate: number | null;
  emotional_benefit_rate: number | null;
  social_benefit_rate: number | null;
  confidence_rate: number | null;
  dofe_count: number;
  care_plan_link_rate: number | null;
  average_engagement: number;
  high_risk_activity_count: number;
  water_activity_count: number;
} {
  const total = rows.length;

  // Unique children
  const uniqueChildren = new Set(rows.map((r) => r.child_name.toLowerCase().trim()));

  // Activity type breakdown
  const byActivityType: Record<string, number> = {};
  for (const at of ACTIVITY_TYPES) byActivityType[at] = 0;
  for (const r of rows) byActivityType[r.activity_type] = (byActivityType[r.activity_type] || 0) + 1;

  // Engagement level breakdown
  const byEngagement: Record<string, number> = {};
  for (const el of ENGAGEMENT_LEVELS) byEngagement[el] = 0;
  for (const r of rows) byEngagement[r.engagement_level] = (byEngagement[r.engagement_level] || 0) + 1;

  // Boolean rates
  // Rates divide by the recorded subset — an unrecorded judgement (null) must
  // not read as a quiet "no", which would dilute rates in exactly the way the
  // old `?? true` creates padded them in the other direction.
  const recordedRate = (field: keyof OutdoorAdventureActivityRow): number | null => {
    const recorded = rows.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0 ? Math.round((count / recorded.length) * 1000) / 10 : null;
  };
  const riskAssessmentRate = recordedRate("risk_assessment_completed");

  const consentRate = recordedRate("parental_consent");

  const qualifiedInstructorRate = recordedRate("instructor_qualified");

  const firstAidRate = recordedRate("first_aider_present");

  const childChoiceRate = recordedRate("young_person_choice");

  const injuryRate = recordedRate("injury_occurred");

  const physicalBenefitRate = recordedRate("physical_benefit");

  const emotionalBenefitRate = total > 0
    ? Math.round((rows.filter((r) => r.emotional_benefit).length / total) * 1000) / 10
    : null;

  const socialBenefitRate = total > 0
    ? Math.round((rows.filter((r) => r.social_benefit).length / total) * 1000) / 10
    : null;

  const confidenceRate = total > 0
    ? Math.round((rows.filter((r) => r.confidence_building).length / total) * 1000) / 10
    : null;

  const carePlanLinkRate = total > 0
    ? Math.round((rows.filter((r) => r.linked_to_care_plan).length / total) * 1000) / 10
    : null;

  // Achievement count
  const achievementCount = rows.filter(
    (r) => r.achievement_noted && r.achievement_noted.trim().length > 0,
  ).length;

  // DofE count
  const dofeCount = rows.filter(
    (r) => r.activity_type === "Duke of Edinburgh",
  ).length;

  // Average engagement (numeric)
  const avgEngagement = total > 0
    ? Math.round(
        (rows.reduce((sum, r) => sum + (ENGAGEMENT_NUMERIC[r.engagement_level] ?? 3), 0) / total) * 10,
      ) / 10
    : 0;

  // Category counts
  const highRiskActivityCount = rows.filter(
    (r) => (HIGH_RISK_TYPES as string[]).includes(r.activity_type),
  ).length;

  const waterActivityCount = rows.filter(
    (r) => (WATER_ACTIVITY_TYPES as string[]).includes(r.activity_type),
  ).length;

  return {
    total_activities: total,
    unique_children: uniqueChildren.size,
    by_activity_type: byActivityType,
    by_engagement_level: byEngagement,
    risk_assessment_rate: riskAssessmentRate,
    consent_rate: consentRate,
    qualified_instructor_rate: qualifiedInstructorRate,
    first_aid_rate: firstAidRate,
    child_choice_rate: childChoiceRate,
    injury_rate: injuryRate,
    achievement_count: achievementCount,
    physical_benefit_rate: physicalBenefitRate,
    emotional_benefit_rate: emotionalBenefitRate,
    social_benefit_rate: socialBenefitRate,
    confidence_rate: confidenceRate,
    dofe_count: dofeCount,
    care_plan_link_rate: carePlanLinkRate,
    average_engagement: avgEngagement,
    high_risk_activity_count: highRiskActivityCount,
    water_activity_count: waterActivityCount,
  };
}

export function computeAlerts(
  rows: OutdoorAdventureActivityRow[],
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

  // Critical: Risk assessment not completed
  for (const r of rows) {
    if (r.risk_assessment_completed !== true) {
      alerts.push({
        type: "no_risk_assessment",
        severity: "critical",
        message: r.risk_assessment_completed === false
          ? `Risk assessment was not completed for ${r.activity_type} with ${r.child_name} on ${r.activity_date} — OEAP guidance and CHR 2015 Reg 9 require documented risk assessments for all outdoor and adventurous activities. This is a serious safety and compliance failure`
          : `No risk assessment is recorded for ${r.activity_type} with ${r.child_name} on ${r.activity_date} — OEAP guidance and CHR 2015 Reg 9 require documented risk assessments for all outdoor and adventurous activities; record the assessment or complete one now`,
        record_id: r.id,
      });
    }
  }

  // Critical: AALA licence not checked for licensable activity
  for (const r of rows) {
    if (
      (AALA_LICENSABLE_TYPES as string[]).includes(r.activity_type) &&
      r.aala_licence_checked !== true
    ) {
      alerts.push({
        type: "aala_licence_not_checked",
        severity: "critical",
        message: r.aala_licence_checked === false
          ? `AALA licence was not verified for ${r.activity_type} with ${r.child_name} on ${r.activity_date} — the Adventure Activities Licensing Authority requires providers of climbing, water sports, trekking, and caving to hold a valid licence. Operating without verification is a legal compliance failure`
          : `AALA licence verification is not recorded for ${r.activity_type} with ${r.child_name} on ${r.activity_date} — verify the provider holds a valid Adventure Activities Licensing Authority licence and record the check`,
        record_id: r.id,
      });
    }
  }

  // Critical: Injury occurred during activity
  for (const r of rows) {
    if (r.injury_occurred) {
      alerts.push({
        type: "injury_occurred",
        severity: "critical",
        message: `Injury occurred during ${r.activity_type} for ${r.child_name} on ${r.activity_date}${r.injury_details ? ` — ${r.injury_details}` : ""}. Ensure incident has been reported via Reg 40 notification if serious, and review risk assessment. Consider whether RIDDOR reporting is required`,
        record_id: r.id,
      });
    }
  }

  // Critical: No parental consent
  for (const r of rows) {
    if (r.parental_consent !== true) {
      alerts.push({
        type: "no_parental_consent",
        severity: "critical",
        message: r.parental_consent === false
          ? `Parental/LA consent was not obtained for ${r.activity_type} with ${r.child_name} on ${r.activity_date} — check placement plan and delegated authority. Outdoor activities, particularly adventurous ones, require explicit consent from the person with parental responsibility`
          : `No parental/LA consent is recorded for ${r.activity_type} with ${r.child_name} on ${r.activity_date} — check placement plan and delegated authority, and record the consent position now`,
        record_id: r.id,
      });
    }
  }

  // Critical: Unqualified instructor for high-risk activity
  for (const r of rows) {
    if (
      (HIGH_RISK_TYPES as string[]).includes(r.activity_type) &&
      r.instructor_qualified !== true
    ) {
      alerts.push({
        type: "unqualified_instructor_high_risk",
        severity: "critical",
        message: r.instructor_qualified === false
          ? `${r.activity_type} for ${r.child_name} on ${r.activity_date} was led by an unqualified instructor — OEAP guidance mandates that adventurous activities are led by instructors holding appropriate NGB (National Governing Body) qualifications`
          : `Instructor qualification is not recorded for ${r.activity_type} with ${r.child_name} on ${r.activity_date} — confirm and record the instructor's NGB (National Governing Body) qualification`,
        record_id: r.id,
      });
    }
  }

  // High: No first aider present
  for (const r of rows) {
    if (r.first_aider_present !== true) {
      alerts.push({
        type: "no_first_aider",
        severity: "high",
        message: r.first_aider_present === false
          ? `No first aider was present during ${r.activity_type} for ${r.child_name} on ${r.activity_date} — OEAP guidance requires first aid provision for all off-site and outdoor activities`
          : `First aid cover is not recorded for ${r.activity_type} with ${r.child_name} on ${r.activity_date} — confirm and record whether a first aider was present`,
        record_id: r.id,
      });
    }
  }

  // High: Inadequate staff ratio
  for (const r of rows) {
    if (r.ratio_adequate !== true) {
      alerts.push({
        type: "inadequate_ratio",
        severity: "high",
        message: r.ratio_adequate === false
          ? `Staff-to-child ratio was inadequate for ${r.activity_type} with ${r.child_name} on ${r.activity_date} — review OEAP recommended ratios and ensure sufficient supervision for the activity type and environment`
          : `Staffing ratio adequacy is not recorded for ${r.activity_type} with ${r.child_name} on ${r.activity_date} — review and record whether supervision met OEAP recommended ratios`,
        record_id: r.id,
      });
    }
  }

  // High: Equipment not checked for high-risk activity
  for (const r of rows) {
    if (
      (HIGH_RISK_TYPES as string[]).includes(r.activity_type) &&
      r.equipment_checked !== true
    ) {
      alerts.push({
        type: "equipment_not_checked_high_risk",
        severity: "high",
        message: r.equipment_checked === false
          ? `Equipment was not checked before ${r.activity_type} for ${r.child_name} on ${r.activity_date} — safety equipment must be inspected before all high-risk activities to prevent injury`
          : `No equipment check is recorded for ${r.activity_type} with ${r.child_name} on ${r.activity_date} — confirm and record the pre-activity safety equipment inspection`,
        record_id: r.id,
      });
    }
  }

  // High: Repeated refusal by same child
  const childRefusalMap = new Map<string, OutdoorAdventureActivityRow[]>();
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
        message: `${childRows[0].child_name} has refused ${childRows.length} outdoor activities — persistent refusal may indicate anxiety, previous negative experiences, or unmet needs. Review under CHR 2015 Reg 9 and consider alternative approaches to encourage participation`,
      });
    }
  }

  // High: Weather not appropriate but activity proceeded
  for (const r of rows) {
    if (r.weather_appropriate !== true) {
      alerts.push({
        type: "weather_inappropriate",
        severity: "high",
        message: r.weather_appropriate === false
          ? `Weather was not appropriate for ${r.activity_type} with ${r.child_name} on ${r.activity_date} — OEAP guidance requires dynamic risk assessment of weather conditions, and activities should be modified or cancelled when conditions are unsafe`
          : `Weather suitability is not recorded for ${r.activity_type} with ${r.child_name} on ${r.activity_date} — record the dynamic weather risk assessment for the activity`,
        record_id: r.id,
      });
    }
  }

  // High: Multiple injuries across activities
  const injuryCount = rows.filter((r) => r.injury_occurred).length;
  if (injuryCount >= 3) {
    alerts.push({
      type: "multiple_injuries",
      severity: "high",
      message: `${injuryCount} injuries have occurred across outdoor activities — review risk assessment processes, instructor qualifications, equipment checks, and supervision arrangements. Consider whether a systemic review of the outdoor activities programme is needed`,
    });
  }

  // Medium: Low child choice rate
  const childChoiceRecorded = rows.filter((r) => r.young_person_choice !== null);
  const childChoiceCount = childChoiceRecorded.filter((r) => r.young_person_choice === true).length;
  if (childChoiceRecorded.length >= 5 && childChoiceCount / childChoiceRecorded.length < 0.4) {
    alerts.push({
      type: "low_child_choice",
      severity: "medium",
      message: `Only ${Math.round((childChoiceCount / childChoiceRecorded.length) * 100)}% of outdoor activities were chosen by the young person — CHR 2015 Reg 9 requires that children have choice in activities. Young people should be involved in planning their outdoor and physical activity programme`,
    });
  }

  // Medium: Low care plan linkage
  const carePlanLinked = rows.filter((r) => r.linked_to_care_plan).length;
  if (rows.length >= 5 && carePlanLinked / rows.length < 0.3) {
    alerts.push({
      type: "low_care_plan_linkage",
      severity: "medium",
      message: `Only ${Math.round((carePlanLinked / rows.length) * 100)}% of outdoor activities are linked to care plans — outdoor activities can support physical health, emotional wellbeing, social skills, and confidence targets in the care plan. Linkage demonstrates purposeful activity provision at SCCIF inspection`,
    });
  }

  // Medium: No DofE participation
  const dofeCount = rows.filter((r) => r.activity_type === "Duke of Edinburgh").length;
  const structuredCount = rows.filter(
    (r) => (STRUCTURED_PROGRAMME_TYPES as string[]).includes(r.activity_type),
  ).length;
  if (rows.length >= 10 && dofeCount === 0 && structuredCount === 0) {
    alerts.push({
      type: "no_structured_programmes",
      severity: "medium",
      message: "No participation in structured outdoor programmes (DofE, Scouts/Guides/Cadets, Parkrun) has been recorded — these programmes provide accreditation, progression, and peer interaction that support independence skills per CHR 2015 Reg 5",
    });
  }

  // Medium: No variety — single activity type dominates
  const activeTypes = Object.entries(
    rows.reduce((acc, r) => { acc[r.activity_type] = (acc[r.activity_type] || 0) + 1; return acc; }, {} as Record<string, number>),
  ).filter(([, count]) => count > 0);
  if (rows.length >= 8 && activeTypes.length === 1) {
    alerts.push({
      type: "no_activity_variety",
      severity: "medium",
      message: `All ${rows.length} outdoor activities are the same type (${activeTypes[0][0]}) — SCCIF inspectors expect a varied programme of physical and outdoor activities that caters to different interests and develops different skills`,
    });
  }

  // Medium: Low emotional/social benefit rates
  const emotionalBenefitCount = rows.filter((r) => r.emotional_benefit).length;
  const socialBenefitCount = rows.filter((r) => r.social_benefit).length;
  if (rows.length >= 5 && emotionalBenefitCount / rows.length < 0.2 && socialBenefitCount / rows.length < 0.2) {
    alerts.push({
      type: "low_holistic_benefit",
      severity: "medium",
      message: `Emotional benefit recorded in only ${Math.round((emotionalBenefitCount / rows.length) * 100)}% and social benefit in ${Math.round((socialBenefitCount / rows.length) * 100)}% of activities — outdoor activities should promote holistic development, not just physical fitness. Consider how activities can be structured to build emotional resilience and social connections`,
    });
  }

  return alerts;
}

export function generateCaraInsights(
  rows: OutdoorAdventureActivityRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const typeBreakdown = Object.entries(metrics.by_activity_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  const engagementBreakdown = Object.entries(metrics.by_engagement_level)
    .filter(([, count]) => count > 0)
    .map(([level, count]) => `${level}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_activities} outdoor/physical ${metrics.total_activities === 1 ? "activity" : "activities"} ` +
      `for ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `Activities: ${typeBreakdown || "none recorded"}. ` +
      `Engagement: ${engagementBreakdown || "none"}. ` +
      `Average engagement score: ${metrics.average_engagement}/5. ` +
      `DofE sessions: ${metrics.dofe_count}. ` +
      `High-risk activities: ${metrics.high_risk_activity_count}. ` +
      `Water activities: ${metrics.water_activity_count}. ` +
      `Achievements: ${metrics.achievement_count}. ` +
      `Injury rate: ${metrics.injury_rate}%.`,
  );

  // Insight 2: Quality indicators and alerts
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts. ` +
        `Risk assessment rate: ${metrics.risk_assessment_rate}%. ` +
        `Consent rate: ${metrics.consent_rate}%. ` +
        `Qualified instructor rate: ${metrics.qualified_instructor_rate}%. ` +
        `First aid rate: ${metrics.first_aid_rate}%. ` +
        `Child choice: ${metrics.child_choice_rate}%. ` +
        `Physical benefit: ${metrics.physical_benefit_rate}%. ` +
        `Emotional benefit: ${metrics.emotional_benefit_rate}%. ` +
        `Social benefit: ${metrics.social_benefit_rate}%. ` +
        `Confidence building: ${metrics.confidence_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority outdoor activity alerts. ` +
        `Risk assessment rate: ${metrics.risk_assessment_rate}%. ` +
        `Consent rate: ${metrics.consent_rate}%. ` +
        `Qualified instructor rate: ${metrics.qualified_instructor_rate}%. ` +
        `First aid rate: ${metrics.first_aid_rate}%. ` +
        `Child choice: ${metrics.child_choice_rate}%. ` +
        `Physical benefit: ${metrics.physical_benefit_rate}%. ` +
        `Emotional benefit: ${metrics.emotional_benefit_rate}%. ` +
        `Social benefit: ${metrics.social_benefit_rate}%. ` +
        `Confidence building: ${metrics.confidence_rate}%. ` +
        `Continue providing varied outdoor activities per CHR 2015 Reg 9.`,
    );
  }

  // Insight 3: Reflective question
  if ((metrics.injury_rate ?? 0) > 10 && metrics.total_activities > 5) {
    insights.push(
      `[reflect] Injury rate of ${metrics.injury_rate}% is concerning. Is the home's risk ` +
        `assessment process robust enough? OEAP guidance requires that risk assessments are ` +
        `not just paperwork exercises but genuinely inform safety decisions. Are risk ` +
        `assessments being reviewed after incidents? Are instructors appropriately qualified ` +
        `for the activities being delivered? Is equipment being properly maintained and ` +
        `checked before use? For looked-after children, who may have heightened impulsivity ` +
        `or risk-taking behaviour linked to their experiences, dynamic risk assessment ` +
        `during activities is especially important.`,
    );
  } else if ((metrics.risk_assessment_rate ?? 0) < 100 && metrics.total_activities > 0) {
    insights.push(
      `[reflect] Risk assessment completion rate is ${metrics.risk_assessment_rate}%, which is ` +
        `below the required 100%. Every outdoor activity must have a documented risk assessment ` +
        `under OEAP guidance and CHR 2015 Reg 9. For AALA-licensable activities (climbing, ` +
        `water sports, trekking), the consequences of inadequate risk assessment can be ` +
        `severe — both for children's safety and for regulatory compliance. Is the home's ` +
        `risk assessment process embedded in activity planning, or is it being treated ` +
        `as an afterthought?`,
    );
  } else if ((metrics.confidence_rate ?? 0) < 30 && metrics.total_activities > 5) {
    insights.push(
      `[reflect] Confidence building is noted in only ${metrics.confidence_rate}% of outdoor ` +
        `activities. Outdoor adventure and physical activity can be transformative for ` +
        `looked-after children's self-belief and resilience. CHR 2015 Reg 9 requires the ` +
        `home to promote development through activities. Are activities being pitched at ` +
        `the right level of challenge — stretching but achievable? Are successes and ` +
        `personal bests being celebrated? Programmes like DofE are specifically designed ` +
        `to build confidence through progressive challenge. Is the home maximising ` +
        `these opportunities?`,
    );
  } else {
    insights.push(
      `[reflect] How does the home ensure that its outdoor and physical activity programme ` +
        `is genuinely inclusive and accessible to every young person, including those with ` +
        `physical limitations, anxiety about new experiences, or negative associations ` +
        `with physical activity? SCCIF inspectors look for evidence that the home provides ` +
        `physical and outdoor activities as part of a rich programme of experiences. ` +
        `Are activities varied enough to cater to different interests? Is the home ` +
        `using outdoor experiences to build life skills, teamwork, and resilience? ` +
        `For children in care, who may have had limited access to outdoor adventure, ` +
        `these experiences can be genuinely life-changing.`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    activityType?: ActivityType;
    engagementLevel?: EngagementLevel;
    limit?: number;
  },
): Promise<ServiceResult<OutdoorAdventureActivityRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_outdoor_adventure_activities") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.activityType) q = q.eq("activity_type", filters.activityType);
  if (filters?.engagementLevel) q = q.eq("engagement_level", filters.engagementLevel);

  q = q.order("activity_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<OutdoorAdventureActivityRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_outdoor_adventure_activities") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createRecord(input: {
  homeId: string;
  childName: string;
  activityDate: string;
  leadStaff: string;
  activityType: ActivityType;
  riskAssessmentCompleted?: boolean;
  parentalConsent?: boolean;
  aalaLicenceChecked?: boolean | null;
  instructorQualified?: boolean;
  firstAiderPresent?: boolean;
  ratioAdequate?: boolean;
  weatherAppropriate?: boolean;
  equipmentChecked?: boolean;
  youngPersonChoice?: boolean;
  engagementLevel?: EngagementLevel;
  physicalBenefit?: boolean;
  emotionalBenefit?: boolean;
  socialBenefit?: boolean;
  confidenceBuilding?: boolean;
  achievementNoted?: string | null;
  injuryOccurred?: boolean;
  injuryDetails?: string | null;
  linkedToCarePlan?: boolean;
  notes?: string | null;
}): Promise<ServiceResult<OutdoorAdventureActivityRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateOutdoorAdventureActivity({
    childName: input.childName,
    activityDate: input.activityDate,
    leadStaff: input.leadStaff,
    activityType: input.activityType,
    riskAssessmentCompleted: input.riskAssessmentCompleted,
    parentalConsent: input.parentalConsent,
    aalaLicenceChecked: input.aalaLicenceChecked,
    instructorQualified: input.instructorQualified,
    firstAiderPresent: input.firstAiderPresent,
    ratioAdequate: input.ratioAdequate,
    weatherAppropriate: input.weatherAppropriate,
    equipmentChecked: input.equipmentChecked,
    engagementLevel: input.engagementLevel,
    injuryOccurred: input.injuryOccurred,
    injuryDetails: input.injuryDetails,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_outdoor_adventure_activities") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      activity_date: input.activityDate,
      lead_staff: input.leadStaff,
      activity_type: input.activityType,
      risk_assessment_completed: input.riskAssessmentCompleted ?? null,
      parental_consent: input.parentalConsent ?? null,
      aala_licence_checked: input.aalaLicenceChecked ?? null,
      instructor_qualified: input.instructorQualified ?? null,
      first_aider_present: input.firstAiderPresent ?? null,
      ratio_adequate: input.ratioAdequate ?? null,
      weather_appropriate: input.weatherAppropriate ?? null,
      equipment_checked: input.equipmentChecked ?? null,
      young_person_choice: input.youngPersonChoice ?? null,
      engagement_level: input.engagementLevel ?? "Participated",
      physical_benefit: input.physicalBenefit ?? null,
      emotional_benefit: input.emotionalBenefit ?? false,
      social_benefit: input.socialBenefit ?? false,
      confidence_building: input.confidenceBuilding ?? false,
      achievement_noted: input.achievementNoted ?? null,
      injury_occurred: input.injuryOccurred ?? null,
      injury_details: input.injuryDetails ?? null,
      linked_to_care_plan: input.linkedToCarePlan ?? false,
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
    activityDate: string;
    leadStaff: string;
    activityType: ActivityType;
    riskAssessmentCompleted: boolean;
    parentalConsent: boolean;
    aalaLicenceChecked: boolean | null;
    instructorQualified: boolean;
    firstAiderPresent: boolean;
    ratioAdequate: boolean;
    weatherAppropriate: boolean;
    equipmentChecked: boolean;
    youngPersonChoice: boolean;
    engagementLevel: EngagementLevel;
    physicalBenefit: boolean;
    emotionalBenefit: boolean;
    socialBenefit: boolean;
    confidenceBuilding: boolean;
    achievementNoted: string | null;
    injuryOccurred: boolean;
    injuryDetails: string | null;
    linkedToCarePlan: boolean;
    notes: string | null;
  }>,
): Promise<ServiceResult<OutdoorAdventureActivityRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.activityDate !== undefined) mapped.activity_date = updates.activityDate;
  if (updates.leadStaff !== undefined) mapped.lead_staff = updates.leadStaff;
  if (updates.activityType !== undefined) mapped.activity_type = updates.activityType;
  if (updates.riskAssessmentCompleted !== undefined) mapped.risk_assessment_completed = updates.riskAssessmentCompleted;
  if (updates.parentalConsent !== undefined) mapped.parental_consent = updates.parentalConsent;
  if (updates.aalaLicenceChecked !== undefined) mapped.aala_licence_checked = updates.aalaLicenceChecked;
  if (updates.instructorQualified !== undefined) mapped.instructor_qualified = updates.instructorQualified;
  if (updates.firstAiderPresent !== undefined) mapped.first_aider_present = updates.firstAiderPresent;
  if (updates.ratioAdequate !== undefined) mapped.ratio_adequate = updates.ratioAdequate;
  if (updates.weatherAppropriate !== undefined) mapped.weather_appropriate = updates.weatherAppropriate;
  if (updates.equipmentChecked !== undefined) mapped.equipment_checked = updates.equipmentChecked;
  if (updates.youngPersonChoice !== undefined) mapped.young_person_choice = updates.youngPersonChoice;
  if (updates.engagementLevel !== undefined) mapped.engagement_level = updates.engagementLevel;
  if (updates.physicalBenefit !== undefined) mapped.physical_benefit = updates.physicalBenefit;
  if (updates.emotionalBenefit !== undefined) mapped.emotional_benefit = updates.emotionalBenefit;
  if (updates.socialBenefit !== undefined) mapped.social_benefit = updates.socialBenefit;
  if (updates.confidenceBuilding !== undefined) mapped.confidence_building = updates.confidenceBuilding;
  if (updates.achievementNoted !== undefined) mapped.achievement_noted = updates.achievementNoted;
  if (updates.injuryOccurred !== undefined) mapped.injury_occurred = updates.injuryOccurred;
  if (updates.injuryDetails !== undefined) mapped.injury_details = updates.injuryDetails;
  if (updates.linkedToCarePlan !== undefined) mapped.linked_to_care_plan = updates.linkedToCarePlan;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_outdoor_adventure_activities") as SB)
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

  const { error } = await (client.from("cs_outdoor_adventure_activities") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
