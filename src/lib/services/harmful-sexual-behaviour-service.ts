// ==============================================================================
// CARA -- HARMFUL SEXUAL BEHAVIOUR (HSB) MANAGEMENT SERVICE
// Tracks HSB incidents, Hackett continuum classification, AIM3 assessments,
// Brook Traffic Light tool usage, specialist referrals, safety planning,
// multi-agency coordination, and outcome recording for children in
// residential care.
//
// Covers: Hackett continuum behaviour categorisation (Normal/Expected →
// Violent), AIM3 assessment framework completion, Brook Traffic Light tool
// usage, victim identification and support, specialist service referrals,
// safety planning, environmental risk assessment, sleeping arrangement
// reviews, supervision level adjustments, multi-agency meetings, police
// notifications, therapeutic support, and review scheduling.
//
// UK Regulatory Framework:
// CHR 2015 Reg 12 (protection of children from harm),
// CHR 2015 Reg 34 (positive behaviour support),
// NICE NG55 (harmful sexual behaviour in children and young people),
// Hackett continuum (normal → inappropriate → problematic → abusive → violent),
// AIM3 assessment framework,
// Brook Traffic Light Tool,
// KCSIE 2023 (peer-on-peer abuse),
// Working Together to Safeguard Children 2023.
//
// SCCIF: Safety — "The home manages HSB risks effectively. Staff understand
// the Hackett continuum and use evidence-based assessment tools to identify,
// assess, and respond to harmful sexual behaviour. Specialist referrals are
// made promptly and safety plans are robust and regularly reviewed."
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const REFERRAL_SOURCES = [
  "Staff Observation",
  "Peer Report",
  "Self-Disclosure",
  "External Agency",
  "School",
  "Police",
  "Social Worker",
  "Other",
] as const;
export type ReferralSource = (typeof REFERRAL_SOURCES)[number];

export const BEHAVIOUR_CATEGORIES = [
  "Normal/Expected",
  "Inappropriate",
  "Problematic",
  "Abusive",
  "Violent",
] as const;
export type BehaviourCategory = (typeof BEHAVIOUR_CATEGORIES)[number];

export const RISK_LEVELS = [
  "Low",
  "Medium",
  "High",
  "Critical",
] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const OUTCOMES = [
  "Monitoring",
  "Therapeutic Intervention",
  "Safety Plan Active",
  "Referred to Specialist",
  "Placement Change Considered",
  "Closed",
] as const;
export type Outcome = (typeof OUTCOMES)[number];

export const STATUSES = [
  "Active",
  "Under Review",
  "Archived",
] as const;
export type Status = (typeof STATUSES)[number];

// -- Label maps ---------------------------------------------------------------

export const REFERRAL_SOURCE_LABELS: { source: ReferralSource; label: string }[] = [
  { source: "Staff Observation", label: "Staff Observation" },
  { source: "Peer Report", label: "Peer Report" },
  { source: "Self-Disclosure", label: "Self-Disclosure" },
  { source: "External Agency", label: "External Agency" },
  { source: "School", label: "School" },
  { source: "Police", label: "Police" },
  { source: "Social Worker", label: "Social Worker" },
  { source: "Other", label: "Other" },
];

export const BEHAVIOUR_CATEGORY_LABELS: { category: BehaviourCategory; label: string }[] = [
  { category: "Normal/Expected", label: "Normal / Expected (Hackett — Green)" },
  { category: "Inappropriate", label: "Inappropriate (Hackett — Amber)" },
  { category: "Problematic", label: "Problematic (Hackett — Orange)" },
  { category: "Abusive", label: "Abusive (Hackett — Red)" },
  { category: "Violent", label: "Violent (Hackett — Dark Red)" },
];

export const RISK_LEVEL_LABELS: { level: RiskLevel; label: string }[] = [
  { level: "Low", label: "Low Risk" },
  { level: "Medium", label: "Medium Risk" },
  { level: "High", label: "High Risk" },
  { level: "Critical", label: "Critical Risk" },
];

export const OUTCOME_LABELS: { outcome: Outcome; label: string }[] = [
  { outcome: "Monitoring", label: "Monitoring" },
  { outcome: "Therapeutic Intervention", label: "Therapeutic Intervention" },
  { outcome: "Safety Plan Active", label: "Safety Plan Active" },
  { outcome: "Referred to Specialist", label: "Referred to Specialist" },
  { outcome: "Placement Change Considered", label: "Placement Change Considered" },
  { outcome: "Closed", label: "Closed" },
];

export const STATUS_LABELS: { status: Status; label: string }[] = [
  { status: "Active", label: "Active" },
  { status: "Under Review", label: "Under Review" },
  { status: "Archived", label: "Archived" },
];

// -- Row type -----------------------------------------------------------------

export interface HarmfulSexualBehaviourRow {
  id: string;
  home_id: string;
  child_name: string;
  incident_date: string;
  assessor_name: string;
  referral_source: ReferralSource;
  behaviour_category: BehaviourCategory;
  behaviour_description: string;
  victim_involved: boolean;
  victim_support_provided: boolean;
  aim_assessment_completed: boolean;
  brook_traffic_light_used: boolean;
  specialist_referral_made: boolean;
  specialist_service: string | null;
  safety_plan_in_place: boolean;
  environmental_risk_assessment: boolean;
  sleeping_arrangements_reviewed: boolean;
  supervision_level_adjusted: boolean;
  police_notified: boolean;
  social_worker_informed: boolean;
  parents_carers_informed: boolean;
  multi_agency_meeting_held: boolean;
  child_views_obtained: boolean;
  therapeutic_support: boolean;
  risk_level: RiskLevel;
  review_date: string | null;
  outcome: Outcome;
  status: Status;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateHarmfulSexualBehaviour(input: {
  childName?: string;
  incidentDate?: string;
  assessorName?: string;
  referralSource?: string;
  behaviourCategory?: string;
  behaviourDescription?: string;
  riskLevel?: string;
  outcome?: string;
  status?: string;
  victimInvolved?: boolean;
  victimSupportProvided?: boolean;
  specialistReferralMade?: boolean;
  specialistService?: string | null;
  reviewDate?: string | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.childName || input.childName.trim().length === 0) {
    errors.push("Child name is required");
  }
  if (!input.incidentDate) {
    errors.push("Incident date is required");
  } else {
    const dateObj = new Date(input.incidentDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Incident date must be a valid date");
    } else if (dateObj > new Date()) {
      errors.push("Incident date cannot be in the future");
    }
  }
  if (!input.assessorName || input.assessorName.trim().length === 0) {
    errors.push("Assessor name is required");
  }
  if (!input.referralSource || !(REFERRAL_SOURCES as readonly string[]).includes(input.referralSource)) {
    errors.push(`Referral source must be one of: ${REFERRAL_SOURCES.join(", ")}`);
  }
  if (!input.behaviourCategory || !(BEHAVIOUR_CATEGORIES as readonly string[]).includes(input.behaviourCategory)) {
    errors.push(`Behaviour category must be one of: ${BEHAVIOUR_CATEGORIES.join(", ")}`);
  }
  if (!input.behaviourDescription || input.behaviourDescription.trim().length < 10) {
    errors.push("Behaviour description is required and must be at least 10 characters");
  }
  if (!input.riskLevel || !(RISK_LEVELS as readonly string[]).includes(input.riskLevel)) {
    errors.push(`Risk level must be one of: ${RISK_LEVELS.join(", ")}`);
  }
  if (!input.outcome || !(OUTCOMES as readonly string[]).includes(input.outcome)) {
    errors.push(`Outcome must be one of: ${OUTCOMES.join(", ")}`);
  }
  if (input.status && !(STATUSES as readonly string[]).includes(input.status)) {
    errors.push(`Status must be one of: ${STATUSES.join(", ")}`);
  }

  // Business rule: if victim involved, victim support should be provided
  if (input.victimInvolved && !input.victimSupportProvided) {
    errors.push("Victim support must be provided when a victim is identified — KCSIE 2023 requires immediate support for victims of peer-on-peer abuse");
  }

  // Business rule: if specialist referral made, specialist service should be named
  if (input.specialistReferralMade && (!input.specialistService || input.specialistService.trim().length === 0)) {
    errors.push("Specialist service name is required when a specialist referral has been made");
  }

  // Business rule: Abusive/Violent categories must have high or critical risk
  if (
    (input.behaviourCategory === "Abusive" || input.behaviourCategory === "Violent") &&
    input.riskLevel &&
    (input.riskLevel === "Low" || input.riskLevel === "Medium")
  ) {
    errors.push("Abusive or Violent behaviour on the Hackett continuum requires a risk level of High or Critical");
  }

  // Business rule: review date must not be in the past
  if (input.reviewDate) {
    const reviewDate = new Date(input.reviewDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(reviewDate.getTime())) {
      errors.push("Review date must be a valid date");
    } else if (reviewDate < today) {
      errors.push("Review date should not be in the past");
    }
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: HarmfulSexualBehaviourRow[],
): {
  total_records: number;
  by_behaviour_category: Record<string, number>;
  by_risk_level: Record<string, number>;
  by_referral_source: Record<string, number>;
  by_outcome: Record<string, number>;
  victim_rate: number;
  aim_assessment_rate: number;
  brook_traffic_light_rate: number;
  specialist_referral_rate: number;
  safety_plan_rate: number;
  police_notification_rate: number;
  supervision_adjustment_rate: number;
  therapeutic_support_rate: number;
  active_cases: number;
  environmental_risk_assessment_rate: number;
  sleeping_arrangements_review_rate: number;
  multi_agency_meeting_rate: number;
  child_views_obtained_rate: number;
  social_worker_informed_rate: number;
  parents_carers_informed_rate: number;
  unique_children: number;
  overdue_reviews: number;
} {
  const total = rows.length;

  const boolRate = (field: keyof HarmfulSexualBehaviourRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
  };

  // Behaviour category breakdown (Hackett continuum)
  const byBehaviourCategory: Record<string, number> = {};
  for (const cat of BEHAVIOUR_CATEGORIES) byBehaviourCategory[cat] = 0;
  for (const r of rows) byBehaviourCategory[r.behaviour_category] = (byBehaviourCategory[r.behaviour_category] || 0) + 1;

  // Risk level breakdown
  const byRiskLevel: Record<string, number> = {};
  for (const rl of RISK_LEVELS) byRiskLevel[rl] = 0;
  for (const r of rows) byRiskLevel[r.risk_level] = (byRiskLevel[r.risk_level] || 0) + 1;

  // Referral source breakdown
  const byReferralSource: Record<string, number> = {};
  for (const rs of REFERRAL_SOURCES) byReferralSource[rs] = 0;
  for (const r of rows) byReferralSource[r.referral_source] = (byReferralSource[r.referral_source] || 0) + 1;

  // Outcome breakdown
  const byOutcome: Record<string, number> = {};
  for (const o of OUTCOMES) byOutcome[o] = 0;
  for (const r of rows) byOutcome[r.outcome] = (byOutcome[r.outcome] || 0) + 1;

  // Active cases
  const activeCases = rows.filter((r) => r.status === "Active").length;

  // Unique children affected
  const uniqueChildren = new Set(rows.map((r) => r.child_name)).size;

  // Overdue reviews
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueReviews = rows.filter((r) => {
    if (!r.review_date) return false;
    const reviewDate = new Date(r.review_date);
    return reviewDate < today && r.status === "Active";
  }).length;

  return {
    total_records: total,
    by_behaviour_category: byBehaviourCategory,
    by_risk_level: byRiskLevel,
    by_referral_source: byReferralSource,
    by_outcome: byOutcome,
    victim_rate: boolRate("victim_involved"),
    aim_assessment_rate: boolRate("aim_assessment_completed"),
    brook_traffic_light_rate: boolRate("brook_traffic_light_used"),
    specialist_referral_rate: boolRate("specialist_referral_made"),
    safety_plan_rate: boolRate("safety_plan_in_place"),
    police_notification_rate: boolRate("police_notified"),
    supervision_adjustment_rate: boolRate("supervision_level_adjusted"),
    therapeutic_support_rate: boolRate("therapeutic_support"),
    active_cases: activeCases,
    environmental_risk_assessment_rate: boolRate("environmental_risk_assessment"),
    sleeping_arrangements_review_rate: boolRate("sleeping_arrangements_reviewed"),
    multi_agency_meeting_rate: boolRate("multi_agency_meeting_held"),
    child_views_obtained_rate: boolRate("child_views_obtained"),
    social_worker_informed_rate: boolRate("social_worker_informed"),
    parents_carers_informed_rate: boolRate("parents_carers_informed"),
    unique_children: uniqueChildren,
    overdue_reviews: overdueReviews,
  };
}

export function computeAlerts(
  rows: HarmfulSexualBehaviourRow[],
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

  // Critical: Violent behaviour without police notification
  for (const r of rows) {
    if (r.behaviour_category === "Violent" && !r.police_notified && r.status === "Active") {
      alerts.push({
        type: "violent_no_police",
        severity: "critical",
        message: `${r.child_name} has Violent HSB classification on the Hackett continuum with no police notification — immediate police notification required per KCSIE 2023 and Reg 12`,
        record_id: r.id,
      });
    }
  }

  // Critical: Abusive/Violent behaviour with victim but no victim support
  for (const r of rows) {
    if (
      (r.behaviour_category === "Abusive" || r.behaviour_category === "Violent") &&
      r.victim_involved &&
      !r.victim_support_provided &&
      r.status === "Active"
    ) {
      alerts.push({
        type: "victim_no_support",
        severity: "critical",
        message: `${r.child_name}: Victim identified in ${r.behaviour_category} HSB incident but no victim support provided — KCSIE 2023 requires immediate support for all victims of peer-on-peer abuse`,
        record_id: r.id,
      });
    }
  }

  // Critical: Critical risk with no safety plan
  for (const r of rows) {
    if (r.risk_level === "Critical" && !r.safety_plan_in_place && r.status === "Active") {
      alerts.push({
        type: "critical_no_safety_plan",
        severity: "critical",
        message: `${r.child_name} has Critical HSB risk with no safety plan in place — NICE NG55 requires robust safety planning for all high-risk HSB cases`,
        record_id: r.id,
      });
    }
  }

  // High: Abusive/Violent behaviour without AIM3 assessment
  for (const r of rows) {
    if (
      (r.behaviour_category === "Abusive" || r.behaviour_category === "Violent") &&
      !r.aim_assessment_completed &&
      r.status === "Active"
    ) {
      alerts.push({
        type: "serious_no_aim",
        severity: "high",
        message: `${r.child_name} has ${r.behaviour_category} HSB classification but AIM3 assessment not completed — evidence-based assessment required per NICE NG55`,
        record_id: r.id,
      });
    }
  }

  // High: High/Critical risk without specialist referral
  for (const r of rows) {
    if (
      (r.risk_level === "High" || r.risk_level === "Critical") &&
      !r.specialist_referral_made &&
      r.status === "Active"
    ) {
      alerts.push({
        type: "high_risk_no_specialist",
        severity: "high",
        message: `${r.child_name} has ${r.risk_level} HSB risk with no specialist referral — refer to HSB specialist service per NICE NG55 recommendations`,
        record_id: r.id,
      });
    }
  }

  // High: Social worker not informed for active Abusive/Violent cases
  for (const r of rows) {
    if (
      (r.behaviour_category === "Abusive" || r.behaviour_category === "Violent") &&
      !r.social_worker_informed &&
      r.status === "Active"
    ) {
      alerts.push({
        type: "serious_sw_not_informed",
        severity: "high",
        message: `${r.child_name} has ${r.behaviour_category} HSB but social worker not informed — notification required under Working Together 2023`,
        record_id: r.id,
      });
    }
  }

  // High: No environmental risk assessment for Problematic+ cases
  for (const r of rows) {
    if (
      (r.behaviour_category === "Problematic" || r.behaviour_category === "Abusive" || r.behaviour_category === "Violent") &&
      !r.environmental_risk_assessment &&
      r.status === "Active"
    ) {
      alerts.push({
        type: "no_environmental_assessment",
        severity: "high",
        message: `${r.child_name} has ${r.behaviour_category} HSB with no environmental risk assessment — review premises safety, shared spaces, and supervision arrangements per Reg 25`,
        record_id: r.id,
      });
    }
  }

  // Medium: No sleeping arrangements review for Problematic+ cases
  for (const r of rows) {
    if (
      (r.behaviour_category === "Problematic" || r.behaviour_category === "Abusive" || r.behaviour_category === "Violent") &&
      !r.sleeping_arrangements_reviewed &&
      r.status === "Active"
    ) {
      alerts.push({
        type: "sleeping_not_reviewed",
        severity: "medium",
        message: `${r.child_name} has ${r.behaviour_category} HSB but sleeping arrangements not reviewed — review bedroom proximity, night supervision, and door monitoring per Reg 25`,
        record_id: r.id,
      });
    }
  }

  // Medium: Child views not obtained
  for (const r of rows) {
    if (!r.child_views_obtained && r.status === "Active") {
      alerts.push({
        type: "no_child_views",
        severity: "medium",
        message: `Child views not obtained for ${r.child_name}'s HSB case — ensure the child's voice is central to assessment and planning per Children Act 1989 s1`,
        record_id: r.id,
      });
    }
  }

  // Medium: Overdue review date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const r of rows) {
    if (r.review_date && r.status === "Active") {
      const reviewDate = new Date(r.review_date);
      if (reviewDate < today) {
        alerts.push({
          type: "overdue_review",
          severity: "medium",
          message: `HSB review for ${r.child_name} was due on ${r.review_date} and is now overdue — schedule review promptly to ensure safety plan remains current`,
          record_id: r.id,
        });
      }
    }
  }

  // Medium: No multi-agency meeting for High/Critical cases
  for (const r of rows) {
    if (
      (r.risk_level === "High" || r.risk_level === "Critical") &&
      !r.multi_agency_meeting_held &&
      r.status === "Active"
    ) {
      alerts.push({
        type: "high_risk_no_mam",
        severity: "medium",
        message: `${r.child_name} has ${r.risk_level} HSB risk but no multi-agency meeting held — consider convening strategy discussion per Working Together 2023`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateCaraInsights(
  rows: HarmfulSexualBehaviourRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const hackettBreakdown = Object.entries(metrics.by_behaviour_category)
    .filter(([, count]) => count > 0)
    .map(([cat, count]) => `${cat}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_records} HSB ${metrics.total_records === 1 ? "record" : "records"} ` +
      `across ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `Hackett continuum: ${hackettBreakdown || "none recorded"}. ` +
      `Active cases: ${metrics.active_cases}. ` +
      `AIM3 completion: ${metrics.aim_assessment_rate}%. ` +
      `Brook Traffic Light usage: ${metrics.brook_traffic_light_rate}%. ` +
      `Safety plan rate: ${metrics.safety_plan_rate}%. ` +
      `Specialist referral rate: ${metrics.specialist_referral_rate}%.`,
  );

  // Insight 2: Priority safeguarding concerns
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    const seriousCases = rows.filter(
      (r) => r.behaviour_category === "Abusive" || r.behaviour_category === "Violent",
    ).length;

    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority HSB alerts active. ` +
        `${seriousCases} cases at Abusive/Violent on the Hackett continuum. ` +
        `Victim involvement rate: ${metrics.victim_rate}%. ` +
        `Police notification rate: ${metrics.police_notification_rate}%. ` +
        `Therapeutic support rate: ${metrics.therapeutic_support_rate}%. ` +
        `Environmental risk assessment rate: ${metrics.environmental_risk_assessment_rate}%. ` +
        `${metrics.overdue_reviews} overdue ${metrics.overdue_reviews === 1 ? "review" : "reviews"}.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority HSB alerts currently active. ` +
        `Supervision adjustment rate: ${metrics.supervision_adjustment_rate}%. ` +
        `Multi-agency meeting rate: ${metrics.multi_agency_meeting_rate}%. ` +
        `Child views obtained: ${metrics.child_views_obtained_rate}%. ` +
        `Continue proactive monitoring and staff training on Hackett continuum per NICE NG55.`,
    );
  }

  // Insight 3: Reflective safeguarding question
  const abusiveViolent = (metrics.by_behaviour_category["Abusive"] || 0) +
    (metrics.by_behaviour_category["Violent"] || 0);

  if (abusiveViolent > 0 && metrics.aim_assessment_rate < 80) {
    insights.push(
      `[reflect] ${metrics.aim_assessment_rate}% of HSB cases have completed AIM3 assessments, below the ` +
        `expected standard for homes managing HSB. Are all staff trained in recognising the Hackett ` +
        `continuum levels, and is there a clear referral pathway to AIM3-trained assessors? ` +
        `NICE NG55 recommends evidence-based assessment for all Problematic, Abusive, and Violent HSB.`,
    );
  } else if (metrics.victim_rate > 30 && metrics.therapeutic_support_rate < 60) {
    insights.push(
      `[reflect] ${metrics.victim_rate}% of HSB incidents involve identified victims, but only ` +
        `${metrics.therapeutic_support_rate}% include therapeutic support. Are both the children ` +
        `displaying HSB and the victims receiving appropriate therapeutic intervention? NICE NG55 ` +
        `emphasises the need for trauma-informed responses for all children involved in HSB incidents.`,
    );
  } else if (metrics.child_views_obtained_rate < 70) {
    insights.push(
      `[reflect] Child views have been obtained in only ${metrics.child_views_obtained_rate}% of HSB cases. ` +
        `Are children being given age-appropriate opportunities to share their understanding of the ` +
        `behaviour and their views on the safety plan? The child's perspective is essential for ` +
        `effective intervention and should be central to all HSB assessments per NICE NG55.`,
    );
  } else {
    insights.push(
      `[reflect] How confident are staff in differentiating between age-appropriate sexual ` +
        `behaviour and harmful sexual behaviour using the Hackett continuum and Brook Traffic ` +
        `Light tool? Are regular refresher training sessions in place, and do staff feel ` +
        `supported to have professional conversations about HSB with children and colleagues?`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listHarmfulSexualBehaviour(
  homeId: string,
  filters?: {
    behaviourCategory?: BehaviourCategory;
    riskLevel?: RiskLevel;
    outcome?: Outcome;
    status?: Status;
    limit?: number;
  },
): Promise<ServiceResult<HarmfulSexualBehaviourRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_harmful_sexual_behaviour") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.behaviourCategory) q = q.eq("behaviour_category", filters.behaviourCategory);
  if (filters?.riskLevel) q = q.eq("risk_level", filters.riskLevel);
  if (filters?.outcome) q = q.eq("outcome", filters.outcome);
  if (filters?.status) q = q.eq("status", filters.status);

  q = q.order("incident_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getHarmfulSexualBehaviour(
  id: string,
): Promise<ServiceResult<HarmfulSexualBehaviourRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_harmful_sexual_behaviour") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createHarmfulSexualBehaviour(input: {
  homeId: string;
  childName: string;
  incidentDate: string;
  assessorName: string;
  referralSource: ReferralSource;
  behaviourCategory: BehaviourCategory;
  behaviourDescription: string;
  victimInvolved?: boolean;
  victimSupportProvided?: boolean;
  aimAssessmentCompleted?: boolean;
  brookTrafficLightUsed?: boolean;
  specialistReferralMade?: boolean;
  specialistService?: string | null;
  safetyPlanInPlace?: boolean;
  environmentalRiskAssessment?: boolean;
  sleepingArrangementsReviewed?: boolean;
  supervisionLevelAdjusted?: boolean;
  policeNotified?: boolean;
  socialWorkerInformed?: boolean;
  parentsCarersInformed?: boolean;
  multiAgencyMeetingHeld?: boolean;
  childViewsObtained?: boolean;
  therapeuticSupport?: boolean;
  riskLevel: RiskLevel;
  reviewDate?: string | null;
  outcome: Outcome;
  status?: Status;
  notes?: string | null;
}): Promise<ServiceResult<HarmfulSexualBehaviourRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateHarmfulSexualBehaviour({
    childName: input.childName,
    incidentDate: input.incidentDate,
    assessorName: input.assessorName,
    referralSource: input.referralSource,
    behaviourCategory: input.behaviourCategory,
    behaviourDescription: input.behaviourDescription,
    riskLevel: input.riskLevel,
    outcome: input.outcome,
    status: input.status,
    victimInvolved: input.victimInvolved,
    victimSupportProvided: input.victimSupportProvided,
    specialistReferralMade: input.specialistReferralMade,
    specialistService: input.specialistService,
    reviewDate: input.reviewDate,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_harmful_sexual_behaviour") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      incident_date: input.incidentDate,
      assessor_name: input.assessorName,
      referral_source: input.referralSource,
      behaviour_category: input.behaviourCategory,
      behaviour_description: input.behaviourDescription,
      victim_involved: input.victimInvolved ?? false,
      victim_support_provided: input.victimSupportProvided ?? false,
      aim_assessment_completed: input.aimAssessmentCompleted ?? false,
      brook_traffic_light_used: input.brookTrafficLightUsed ?? false,
      specialist_referral_made: input.specialistReferralMade ?? false,
      specialist_service: input.specialistService ?? null,
      safety_plan_in_place: input.safetyPlanInPlace ?? false,
      environmental_risk_assessment: input.environmentalRiskAssessment ?? false,
      sleeping_arrangements_reviewed: input.sleepingArrangementsReviewed ?? false,
      supervision_level_adjusted: input.supervisionLevelAdjusted ?? false,
      police_notified: input.policeNotified ?? false,
      social_worker_informed: input.socialWorkerInformed ?? false,
      parents_carers_informed: input.parentsCarersInformed ?? false,
      multi_agency_meeting_held: input.multiAgencyMeetingHeld ?? false,
      child_views_obtained: input.childViewsObtained ?? false,
      therapeutic_support: input.therapeuticSupport ?? false,
      risk_level: input.riskLevel,
      review_date: input.reviewDate ?? null,
      outcome: input.outcome,
      status: input.status ?? "Active",
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateHarmfulSexualBehaviour(
  id: string,
  updates: Partial<{
    childName: string;
    incidentDate: string;
    assessorName: string;
    referralSource: ReferralSource;
    behaviourCategory: BehaviourCategory;
    behaviourDescription: string;
    victimInvolved: boolean;
    victimSupportProvided: boolean;
    aimAssessmentCompleted: boolean;
    brookTrafficLightUsed: boolean;
    specialistReferralMade: boolean;
    specialistService: string | null;
    safetyPlanInPlace: boolean;
    environmentalRiskAssessment: boolean;
    sleepingArrangementsReviewed: boolean;
    supervisionLevelAdjusted: boolean;
    policeNotified: boolean;
    socialWorkerInformed: boolean;
    parentsCarersInformed: boolean;
    multiAgencyMeetingHeld: boolean;
    childViewsObtained: boolean;
    therapeuticSupport: boolean;
    riskLevel: RiskLevel;
    reviewDate: string | null;
    outcome: Outcome;
    status: Status;
    notes: string | null;
  }>,
): Promise<ServiceResult<HarmfulSexualBehaviourRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.incidentDate !== undefined) mapped.incident_date = updates.incidentDate;
  if (updates.assessorName !== undefined) mapped.assessor_name = updates.assessorName;
  if (updates.referralSource !== undefined) mapped.referral_source = updates.referralSource;
  if (updates.behaviourCategory !== undefined) mapped.behaviour_category = updates.behaviourCategory;
  if (updates.behaviourDescription !== undefined) mapped.behaviour_description = updates.behaviourDescription;
  if (updates.victimInvolved !== undefined) mapped.victim_involved = updates.victimInvolved;
  if (updates.victimSupportProvided !== undefined) mapped.victim_support_provided = updates.victimSupportProvided;
  if (updates.aimAssessmentCompleted !== undefined) mapped.aim_assessment_completed = updates.aimAssessmentCompleted;
  if (updates.brookTrafficLightUsed !== undefined) mapped.brook_traffic_light_used = updates.brookTrafficLightUsed;
  if (updates.specialistReferralMade !== undefined) mapped.specialist_referral_made = updates.specialistReferralMade;
  if (updates.specialistService !== undefined) mapped.specialist_service = updates.specialistService;
  if (updates.safetyPlanInPlace !== undefined) mapped.safety_plan_in_place = updates.safetyPlanInPlace;
  if (updates.environmentalRiskAssessment !== undefined) mapped.environmental_risk_assessment = updates.environmentalRiskAssessment;
  if (updates.sleepingArrangementsReviewed !== undefined) mapped.sleeping_arrangements_reviewed = updates.sleepingArrangementsReviewed;
  if (updates.supervisionLevelAdjusted !== undefined) mapped.supervision_level_adjusted = updates.supervisionLevelAdjusted;
  if (updates.policeNotified !== undefined) mapped.police_notified = updates.policeNotified;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.parentsCarersInformed !== undefined) mapped.parents_carers_informed = updates.parentsCarersInformed;
  if (updates.multiAgencyMeetingHeld !== undefined) mapped.multi_agency_meeting_held = updates.multiAgencyMeetingHeld;
  if (updates.childViewsObtained !== undefined) mapped.child_views_obtained = updates.childViewsObtained;
  if (updates.therapeuticSupport !== undefined) mapped.therapeutic_support = updates.therapeuticSupport;
  if (updates.riskLevel !== undefined) mapped.risk_level = updates.riskLevel;
  if (updates.reviewDate !== undefined) mapped.review_date = updates.reviewDate;
  if (updates.outcome !== undefined) mapped.outcome = updates.outcome;
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_harmful_sexual_behaviour") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteHarmfulSexualBehaviour(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { error } = await (client.from("cs_harmful_sexual_behaviour") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
