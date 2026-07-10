// ==============================================================================
// CARA -- SELF-HARM PREVENTION PLANNING SERVICE
// Tracks self-harm prevention plans, triggers, warning signs, coping strategies,
// safe environment actions, supervision levels, sharps and medication management,
// CAMHS engagement, and multi-agency notification for children in residential care.
//
// Covers: Plan creation and review scheduling, trigger and warning sign
// documentation, coping strategy development, environmental safety measures
// (means restriction), night supervision level assignment, sharps access
// management, medication management protocols, CAMHS engagement tracking,
// school and social worker notification, young person participation.
//
// UK Regulatory Framework:
// CHR 2015 Reg 12 (protection of children from harm),
// CHR 2015 Reg 13 (children's health and wellbeing),
// NICE CG133 (self-harm: longer-term management),
// NICE CG16 (self-harm: short-term management),
// SCCIF: Safety -- self-harm prevention and response,
// DfE Keeping Children Safe in Education 2023,
// Working Together to Safeguard Children 2023.
//
// SCCIF: Safety -- "Children at risk of self-harm have robust, individualised
// prevention plans that are regularly reviewed and shared with all relevant
// professionals." Ofsted expects clear documentation of triggers, warning
// signs, coping strategies, environmental safety measures, and appropriate
// supervision levels.
// ==============================================================================

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const RISK_LEVELS = [
  "Low",
  "Medium",
  "High",
  "Critical",
] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const FREQUENCY_CATEGORIES = [
  "Isolated",
  "Occasional",
  "Frequent",
  "Daily",
  "Historical",
] as const;
export type FrequencyCategory = (typeof FREQUENCY_CATEGORIES)[number];

export const NIGHT_SUPERVISION_LEVELS = [
  "Standard",
  "Enhanced",
  "1-to-1",
  "Waking Night",
] as const;
export type NightSupervisionLevel = (typeof NIGHT_SUPERVISION_LEVELS)[number];

export const SHARPS_MANAGEMENT_LEVELS = [
  "Not Required",
  "Locked Storage",
  "Supervised Access",
  "Full Restriction",
] as const;
export type SharpsManagement = (typeof SHARPS_MANAGEMENT_LEVELS)[number];

export const MEDICATION_MANAGEMENT_LEVELS = [
  "Self-Administered",
  "Supervised",
  "Controlled",
  "Withheld Pending Review",
] as const;
export type MedicationManagement = (typeof MEDICATION_MANAGEMENT_LEVELS)[number];

export const PLAN_STATUSES = [
  "Active",
  "Under Review",
  "Archived",
] as const;
export type PlanStatus = (typeof PLAN_STATUSES)[number];

// -- Label maps ---------------------------------------------------------------

export const RISK_LEVEL_LABELS: { level: RiskLevel; label: string }[] = [
  { level: "Low", label: "Low Risk" },
  { level: "Medium", label: "Medium Risk" },
  { level: "High", label: "High Risk" },
  { level: "Critical", label: "Critical Risk" },
];

export const FREQUENCY_CATEGORY_LABELS: { category: FrequencyCategory; label: string }[] = [
  { category: "Isolated", label: "Isolated Incident" },
  { category: "Occasional", label: "Occasional (less than weekly)" },
  { category: "Frequent", label: "Frequent (weekly or more)" },
  { category: "Daily", label: "Daily" },
  { category: "Historical", label: "Historical (no recent incidents)" },
];

export const NIGHT_SUPERVISION_LABELS: { level: NightSupervisionLevel; label: string }[] = [
  { level: "Standard", label: "Standard Checks" },
  { level: "Enhanced", label: "Enhanced Checks (increased frequency)" },
  { level: "1-to-1", label: "1-to-1 Supervision" },
  { level: "Waking Night", label: "Waking Night Staff" },
];

export const SHARPS_MANAGEMENT_LABELS: { level: SharpsManagement; label: string }[] = [
  { level: "Not Required", label: "Not Required" },
  { level: "Locked Storage", label: "Locked Storage" },
  { level: "Supervised Access", label: "Supervised Access Only" },
  { level: "Full Restriction", label: "Full Restriction" },
];

export const MEDICATION_MANAGEMENT_LABELS: { level: MedicationManagement; label: string }[] = [
  { level: "Self-Administered", label: "Self-Administered" },
  { level: "Supervised", label: "Supervised Administration" },
  { level: "Controlled", label: "Controlled (staff-held)" },
  { level: "Withheld Pending Review", label: "Withheld Pending Review" },
];

export const PLAN_STATUS_LABELS: { status: PlanStatus; label: string }[] = [
  { status: "Active", label: "Active Plan" },
  { status: "Under Review", label: "Under Review" },
  { status: "Archived", label: "Archived" },
];

// -- Row type -----------------------------------------------------------------

export interface SelfHarmPreventionPlanRow {
  id: string;
  home_id: string;
  child_name: string;
  plan_date: string;
  lead_professional: string;
  review_date: string | null;
  triggers_identified: string;
  warning_signs: string;
  coping_strategies: string;
  safe_environment_actions: string;
  professional_support: string;
  emergency_contacts: string;
  young_person_contributed: boolean;
  risk_level: RiskLevel;
  last_incident_date: string | null;
  frequency_category: FrequencyCategory;
  method_awareness: boolean;
  night_supervision_level: NightSupervisionLevel;
  sharps_management: SharpsManagement;
  medication_management: MedicationManagement;
  camhs_engaged: boolean;
  school_aware: boolean;
  social_worker_informed: boolean;
  plan_shared_with_child: boolean;
  status: PlanStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateSelfHarmPreventionPlan(input: {
  childName?: string;
  planDate?: string;
  leadProfessional?: string;
  reviewDate?: string | null;
  triggersIdentified?: string;
  warningSigns?: string;
  copingStrategies?: string;
  safeEnvironmentActions?: string;
  professionalSupport?: string;
  emergencyContacts?: string;
  riskLevel?: string;
  frequencyCategory?: string;
  nightSupervisionLevel?: string;
  sharpsManagement?: string;
  medicationManagement?: string;
  status?: string;
  lastIncidentDate?: string | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.childName || input.childName.trim().length === 0) {
    errors.push("Child name is required");
  }
  if (!input.planDate) {
    errors.push("Plan date is required");
  } else {
    const dateObj = new Date(input.planDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Plan date must be a valid date");
    }
  }
  if (!input.leadProfessional || input.leadProfessional.trim().length === 0) {
    errors.push("Lead professional is required");
  }

  // Core plan content validation
  if (!input.triggersIdentified || input.triggersIdentified.trim().length === 0) {
    errors.push("Triggers identified is required — document known triggers for the young person");
  }
  if (!input.warningSigns || input.warningSigns.trim().length === 0) {
    errors.push("Warning signs is required — document observable warning signs for staff awareness");
  }
  if (!input.copingStrategies || input.copingStrategies.trim().length === 0) {
    errors.push("Coping strategies is required — document agreed coping strategies with the young person");
  }
  if (!input.safeEnvironmentActions || input.safeEnvironmentActions.trim().length === 0) {
    errors.push("Safe environment actions is required — document means restriction and environmental safety measures");
  }
  if (!input.professionalSupport || input.professionalSupport.trim().length === 0) {
    errors.push("Professional support is required — document which professionals are involved (e.g. CAMHS, GP)");
  }
  if (!input.emergencyContacts || input.emergencyContacts.trim().length === 0) {
    errors.push("Emergency contacts is required — document who to contact in a crisis");
  }

  // Enum validation
  if (!input.riskLevel || !(RISK_LEVELS as readonly string[]).includes(input.riskLevel)) {
    errors.push(`Risk level must be one of: ${RISK_LEVELS.join(", ")}`);
  }
  if (!input.frequencyCategory || !(FREQUENCY_CATEGORIES as readonly string[]).includes(input.frequencyCategory)) {
    errors.push(`Frequency category must be one of: ${FREQUENCY_CATEGORIES.join(", ")}`);
  }
  if (!input.nightSupervisionLevel || !(NIGHT_SUPERVISION_LEVELS as readonly string[]).includes(input.nightSupervisionLevel)) {
    errors.push(`Night supervision level must be one of: ${NIGHT_SUPERVISION_LEVELS.join(", ")}`);
  }
  if (!input.sharpsManagement || !(SHARPS_MANAGEMENT_LEVELS as readonly string[]).includes(input.sharpsManagement)) {
    errors.push(`Sharps management must be one of: ${SHARPS_MANAGEMENT_LEVELS.join(", ")}`);
  }
  if (!input.medicationManagement || !(MEDICATION_MANAGEMENT_LEVELS as readonly string[]).includes(input.medicationManagement)) {
    errors.push(`Medication management must be one of: ${MEDICATION_MANAGEMENT_LEVELS.join(", ")}`);
  }
  if (input.status && !(PLAN_STATUSES as readonly string[]).includes(input.status)) {
    errors.push(`Status must be one of: ${PLAN_STATUSES.join(", ")}`);
  }

  // Business rule: review date should be after plan date
  if (input.reviewDate && input.planDate) {
    const review = new Date(input.reviewDate);
    const plan = new Date(input.planDate);
    if (!isNaN(review.getTime()) && !isNaN(plan.getTime()) && review <= plan) {
      errors.push("Review date must be after plan date");
    }
  }

  // Business rule: last incident date cannot be in the future
  if (input.lastIncidentDate) {
    const incidentDate = new Date(input.lastIncidentDate);
    if (isNaN(incidentDate.getTime())) {
      errors.push("Last incident date must be a valid date");
    } else if (incidentDate > new Date()) {
      errors.push("Last incident date cannot be in the future");
    }
  }

  // Business rule: high/critical risk should have review date within 4 weeks
  if (
    (input.riskLevel === "High" || input.riskLevel === "Critical") &&
    input.planDate &&
    input.reviewDate
  ) {
    const plan = new Date(input.planDate);
    const review = new Date(input.reviewDate);
    const fourWeeks = 28 * 24 * 60 * 60 * 1000;
    if (!isNaN(plan.getTime()) && !isNaN(review.getTime()) && review.getTime() - plan.getTime() > fourWeeks) {
      errors.push("High/Critical risk plans should have review date within 4 weeks of plan date per NICE CG133");
    }
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: SelfHarmPreventionPlanRow[],
): {
  total_plans: number;
  active_count: number;
  under_review_count: number;
  archived_count: number;
  high_risk_count: number;
  critical_count: number;
  camhs_engagement_rate: number;
  child_contribution_rate: number;
  plan_shared_rate: number;
  school_aware_rate: number;
  social_worker_informed_rate: number;
  method_awareness_rate: number;
  overdue_review_count: number;
  unique_children: number;
  unique_professionals: number;
  by_risk_level: Record<string, number>;
  by_frequency: Record<string, number>;
  by_supervision: Record<string, number>;
  by_sharps: Record<string, number>;
  by_medication: Record<string, number>;
  enhanced_supervision_count: number;
  restricted_sharps_count: number;
} {
  const total = rows.length;

  const activeCount = rows.filter((r) => r.status === "Active").length;
  const underReviewCount = rows.filter((r) => r.status === "Under Review").length;
  const archivedCount = rows.filter((r) => r.status === "Archived").length;

  const highRisk = rows.filter((r) => r.risk_level === "High").length;
  const criticalCount = rows.filter((r) => r.risk_level === "Critical").length;

  const boolRate = (field: keyof SelfHarmPreventionPlanRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
  };

  // Overdue reviews (active plans only)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueReviews = rows.filter((r) => {
    if (r.status !== "Active" || !r.review_date) return false;
    const reviewDate = new Date(r.review_date);
    return reviewDate < today;
  }).length;

  const uniqueChildren = new Set(rows.map((r) => r.child_name)).size;
  const uniqueProfessionals = new Set(rows.map((r) => r.lead_professional)).size;

  // Risk level breakdown
  const byRiskLevel: Record<string, number> = {};
  for (const rl of RISK_LEVELS) byRiskLevel[rl] = 0;
  for (const r of rows) byRiskLevel[r.risk_level] = (byRiskLevel[r.risk_level] || 0) + 1;

  // Frequency breakdown
  const byFrequency: Record<string, number> = {};
  for (const fc of FREQUENCY_CATEGORIES) byFrequency[fc] = 0;
  for (const r of rows) byFrequency[r.frequency_category] = (byFrequency[r.frequency_category] || 0) + 1;

  // Supervision breakdown
  const bySupervision: Record<string, number> = {};
  for (const ns of NIGHT_SUPERVISION_LEVELS) bySupervision[ns] = 0;
  for (const r of rows) bySupervision[r.night_supervision_level] = (bySupervision[r.night_supervision_level] || 0) + 1;

  // Sharps breakdown
  const bySharps: Record<string, number> = {};
  for (const sm of SHARPS_MANAGEMENT_LEVELS) bySharps[sm] = 0;
  for (const r of rows) bySharps[r.sharps_management] = (bySharps[r.sharps_management] || 0) + 1;

  // Medication breakdown
  const byMedication: Record<string, number> = {};
  for (const mm of MEDICATION_MANAGEMENT_LEVELS) byMedication[mm] = 0;
  for (const r of rows) byMedication[r.medication_management] = (byMedication[r.medication_management] || 0) + 1;

  // Enhanced supervision count (Enhanced, 1-to-1, or Waking Night)
  const enhancedSupervision = rows.filter(
    (r) =>
      r.night_supervision_level === "Enhanced" ||
      r.night_supervision_level === "1-to-1" ||
      r.night_supervision_level === "Waking Night",
  ).length;

  // Restricted sharps count (Locked Storage, Supervised Access, or Full Restriction)
  const restrictedSharps = rows.filter(
    (r) =>
      r.sharps_management === "Locked Storage" ||
      r.sharps_management === "Supervised Access" ||
      r.sharps_management === "Full Restriction",
  ).length;

  return {
    total_plans: total,
    active_count: activeCount,
    under_review_count: underReviewCount,
    archived_count: archivedCount,
    high_risk_count: highRisk,
    critical_count: criticalCount,
    camhs_engagement_rate: boolRate("camhs_engaged"),
    child_contribution_rate: boolRate("young_person_contributed"),
    plan_shared_rate: boolRate("plan_shared_with_child"),
    school_aware_rate: boolRate("school_aware"),
    social_worker_informed_rate: boolRate("social_worker_informed"),
    method_awareness_rate: boolRate("method_awareness"),
    overdue_review_count: overdueReviews,
    unique_children: uniqueChildren,
    unique_professionals: uniqueProfessionals,
    by_risk_level: byRiskLevel,
    by_frequency: byFrequency,
    by_supervision: bySupervision,
    by_sharps: bySharps,
    by_medication: byMedication,
    enhanced_supervision_count: enhancedSupervision,
    restricted_sharps_count: restrictedSharps,
  };
}

export function computeAlerts(
  rows: SelfHarmPreventionPlanRow[],
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

  const activeRows = rows.filter((r) => r.status === "Active");

  // Critical: critical risk with no CAMHS engagement
  for (const r of activeRows) {
    if (r.risk_level === "Critical" && !r.camhs_engaged) {
      alerts.push({
        type: "critical_no_camhs",
        severity: "critical",
        message: `${r.child_name} has Critical self-harm risk with no CAMHS engagement — urgent referral required per NICE CG133 and Reg 13`,
        record_id: r.id,
      });
    }
  }

  // Critical: daily frequency with standard supervision
  for (const r of activeRows) {
    if (r.frequency_category === "Daily" && r.night_supervision_level === "Standard") {
      alerts.push({
        type: "daily_standard_supervision",
        severity: "critical",
        message: `${r.child_name} has daily self-harm frequency but only standard night supervision — immediate review of supervision level required`,
        record_id: r.id,
      });
    }
  }

  // Critical: critical risk with self-administered medication
  for (const r of activeRows) {
    if (r.risk_level === "Critical" && r.medication_management === "Self-Administered") {
      alerts.push({
        type: "critical_self_administered_meds",
        severity: "critical",
        message: `${r.child_name} has Critical self-harm risk with self-administered medication — review medication management protocol urgently for means restriction`,
        record_id: r.id,
      });
    }
  }

  // High: high/critical risk and social worker not informed
  for (const r of activeRows) {
    if (
      (r.risk_level === "High" || r.risk_level === "Critical") &&
      !r.social_worker_informed
    ) {
      alerts.push({
        type: "high_risk_sw_not_informed",
        severity: "high",
        message: `${r.child_name} has ${r.risk_level} self-harm risk but social worker has not been informed — notification required under Working Together 2023`,
        record_id: r.id,
      });
    }
  }

  // High: plan not shared with child
  for (const r of activeRows) {
    if (!r.plan_shared_with_child && r.young_person_contributed) {
      alerts.push({
        type: "plan_not_shared",
        severity: "high",
        message: `${r.child_name} contributed to their prevention plan but it has not been shared with them — share the plan to support self-management and agency`,
        record_id: r.id,
      });
    }
  }

  // High: high/critical risk with no sharps management
  for (const r of activeRows) {
    if (
      (r.risk_level === "High" || r.risk_level === "Critical") &&
      r.sharps_management === "Not Required"
    ) {
      alerts.push({
        type: "high_risk_no_sharps_management",
        severity: "high",
        message: `${r.child_name} has ${r.risk_level} self-harm risk but sharps management is set to Not Required — review means restriction measures`,
        record_id: r.id,
      });
    }
  }

  // Medium: overdue review
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const r of activeRows) {
    if (r.review_date) {
      const reviewDate = new Date(r.review_date);
      if (reviewDate < today) {
        alerts.push({
          type: "overdue_review",
          severity: "medium",
          message: `Self-harm prevention plan for ${r.child_name} was due for review on ${r.review_date} and is now overdue — schedule review promptly`,
          record_id: r.id,
        });
      }
    }
  }

  // Medium: young person did not contribute to plan
  for (const r of activeRows) {
    if (!r.young_person_contributed) {
      alerts.push({
        type: "no_yp_contribution",
        severity: "medium",
        message: `${r.child_name} did not contribute to their self-harm prevention plan — seek to involve the young person in their plan per Reg 12 voice of the child`,
        record_id: r.id,
      });
    }
  }

  // Medium: school not aware for active high/critical
  for (const r of activeRows) {
    if (
      (r.risk_level === "High" || r.risk_level === "Critical") &&
      !r.school_aware
    ) {
      alerts.push({
        type: "school_not_aware",
        severity: "medium",
        message: `School is not aware of ${r.child_name}'s ${r.risk_level} self-harm risk — consider informing designated safeguarding lead per KCSIE 2023`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateCaraInsights(
  rows: SelfHarmPreventionPlanRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  insights.push(
    `[sky] ${metrics.total_plans} self-harm prevention ${metrics.total_plans === 1 ? "plan" : "plans"} recorded for ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `${metrics.active_count} active, ${metrics.under_review_count} under review, ${metrics.archived_count} archived. ` +
      `${metrics.high_risk_count} at High risk, ${metrics.critical_count} at Critical risk. ` +
      `CAMHS engagement rate: ${metrics.camhs_engagement_rate}%.`,
  );

  // Insight 2: Priority concerns
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority self-harm prevention alerts active. ` +
        `${metrics.overdue_review_count} ${metrics.overdue_review_count === 1 ? "plan has" : "plans have"} overdue reviews. ` +
        `Young person contribution rate: ${metrics.child_contribution_rate}%. ` +
        `${metrics.enhanced_supervision_count} ${metrics.enhanced_supervision_count === 1 ? "child requires" : "children require"} enhanced night supervision.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority self-harm prevention alerts currently active. ` +
        `Child contribution rate: ${metrics.child_contribution_rate}%. ` +
        `Plan shared rate: ${metrics.plan_shared_rate}%. ` +
        `Continue reviewing plans at scheduled intervals per NICE CG133.`,
    );
  }

  // Insight 3: Reflective safeguarding question
  if (metrics.overdue_review_count > 0) {
    insights.push(
      `[reflect] ${metrics.overdue_review_count} self-harm prevention ${metrics.overdue_review_count === 1 ? "plan is" : "plans are"} overdue for review. ` +
        `Are all active plans being reviewed at the frequency required by the child's risk level, ` +
        `and do reviews involve the young person, their social worker, and CAMHS where engaged?`,
    );
  } else if (metrics.critical_count > 0) {
    insights.push(
      `[reflect] ${metrics.critical_count} ${metrics.critical_count === 1 ? "child has" : "children have"} Critical self-harm risk. ` +
        `Are environmental safety measures (sharps management, medication protocols, supervision levels) ` +
        `proportionate to the risk level, and is there evidence of regular multi-agency review ` +
        `involving CAMHS, the social worker, and the young person themselves?`,
    );
  } else {
    insights.push(
      `[reflect] Are all staff aware of each child's self-harm prevention plan including their ` +
        `specific triggers, warning signs, and agreed coping strategies, and do handover ` +
        `processes ensure night staff are briefed on supervision requirements and emergency contacts?`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listSelfHarmPreventionPlans(
  homeId: string,
  filters?: {
    status?: PlanStatus;
    riskLevel?: RiskLevel;
    frequencyCategory?: FrequencyCategory;
    limit?: number;
  },
): Promise<ServiceResult<SelfHarmPreventionPlanRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_self_harm_prevention_plans") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.riskLevel) q = q.eq("risk_level", filters.riskLevel);
  if (filters?.frequencyCategory) q = q.eq("frequency_category", filters.frequencyCategory);

  q = q.order("plan_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getSelfHarmPreventionPlan(
  id: string,
): Promise<ServiceResult<SelfHarmPreventionPlanRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_self_harm_prevention_plans") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createSelfHarmPreventionPlan(input: {
  homeId: string;
  childName: string;
  planDate: string;
  leadProfessional: string;
  reviewDate?: string | null;
  triggersIdentified: string;
  warningSigns: string;
  copingStrategies: string;
  safeEnvironmentActions: string;
  professionalSupport: string;
  emergencyContacts: string;
  youngPersonContributed?: boolean;
  riskLevel: RiskLevel;
  lastIncidentDate?: string | null;
  frequencyCategory: FrequencyCategory;
  methodAwareness?: boolean;
  nightSupervisionLevel: NightSupervisionLevel;
  sharpsManagement: SharpsManagement;
  medicationManagement: MedicationManagement;
  camhsEngaged?: boolean;
  schoolAware?: boolean;
  socialWorkerInformed?: boolean;
  planSharedWithChild?: boolean;
  status?: PlanStatus;
  notes?: string | null;
}): Promise<ServiceResult<SelfHarmPreventionPlanRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateSelfHarmPreventionPlan({
    childName: input.childName,
    planDate: input.planDate,
    leadProfessional: input.leadProfessional,
    reviewDate: input.reviewDate,
    triggersIdentified: input.triggersIdentified,
    warningSigns: input.warningSigns,
    copingStrategies: input.copingStrategies,
    safeEnvironmentActions: input.safeEnvironmentActions,
    professionalSupport: input.professionalSupport,
    emergencyContacts: input.emergencyContacts,
    riskLevel: input.riskLevel,
    frequencyCategory: input.frequencyCategory,
    nightSupervisionLevel: input.nightSupervisionLevel,
    sharpsManagement: input.sharpsManagement,
    medicationManagement: input.medicationManagement,
    status: input.status,
    lastIncidentDate: input.lastIncidentDate,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_self_harm_prevention_plans") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      plan_date: input.planDate,
      lead_professional: input.leadProfessional,
      review_date: input.reviewDate ?? null,
      triggers_identified: input.triggersIdentified,
      warning_signs: input.warningSigns,
      coping_strategies: input.copingStrategies,
      safe_environment_actions: input.safeEnvironmentActions,
      professional_support: input.professionalSupport,
      emergency_contacts: input.emergencyContacts,
      young_person_contributed: input.youngPersonContributed ?? false,
      risk_level: input.riskLevel,
      last_incident_date: input.lastIncidentDate ?? null,
      frequency_category: input.frequencyCategory,
      method_awareness: input.methodAwareness ?? false,
      night_supervision_level: input.nightSupervisionLevel,
      sharps_management: input.sharpsManagement,
      medication_management: input.medicationManagement,
      camhs_engaged: input.camhsEngaged ?? false,
      school_aware: input.schoolAware ?? false,
      social_worker_informed: input.socialWorkerInformed ?? false,
      plan_shared_with_child: input.planSharedWithChild ?? false,
      status: input.status ?? "Active",
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateSelfHarmPreventionPlan(
  id: string,
  updates: Partial<{
    childName: string;
    planDate: string;
    leadProfessional: string;
    reviewDate: string | null;
    triggersIdentified: string;
    warningSigns: string;
    copingStrategies: string;
    safeEnvironmentActions: string;
    professionalSupport: string;
    emergencyContacts: string;
    youngPersonContributed: boolean;
    riskLevel: RiskLevel;
    lastIncidentDate: string | null;
    frequencyCategory: FrequencyCategory;
    methodAwareness: boolean;
    nightSupervisionLevel: NightSupervisionLevel;
    sharpsManagement: SharpsManagement;
    medicationManagement: MedicationManagement;
    camhsEngaged: boolean;
    schoolAware: boolean;
    socialWorkerInformed: boolean;
    planSharedWithChild: boolean;
    status: PlanStatus;
    notes: string | null;
  }>,
): Promise<ServiceResult<SelfHarmPreventionPlanRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.planDate !== undefined) mapped.plan_date = updates.planDate;
  if (updates.leadProfessional !== undefined) mapped.lead_professional = updates.leadProfessional;
  if (updates.reviewDate !== undefined) mapped.review_date = updates.reviewDate;
  if (updates.triggersIdentified !== undefined) mapped.triggers_identified = updates.triggersIdentified;
  if (updates.warningSigns !== undefined) mapped.warning_signs = updates.warningSigns;
  if (updates.copingStrategies !== undefined) mapped.coping_strategies = updates.copingStrategies;
  if (updates.safeEnvironmentActions !== undefined) mapped.safe_environment_actions = updates.safeEnvironmentActions;
  if (updates.professionalSupport !== undefined) mapped.professional_support = updates.professionalSupport;
  if (updates.emergencyContacts !== undefined) mapped.emergency_contacts = updates.emergencyContacts;
  if (updates.youngPersonContributed !== undefined) mapped.young_person_contributed = updates.youngPersonContributed;
  if (updates.riskLevel !== undefined) mapped.risk_level = updates.riskLevel;
  if (updates.lastIncidentDate !== undefined) mapped.last_incident_date = updates.lastIncidentDate;
  if (updates.frequencyCategory !== undefined) mapped.frequency_category = updates.frequencyCategory;
  if (updates.methodAwareness !== undefined) mapped.method_awareness = updates.methodAwareness;
  if (updates.nightSupervisionLevel !== undefined) mapped.night_supervision_level = updates.nightSupervisionLevel;
  if (updates.sharpsManagement !== undefined) mapped.sharps_management = updates.sharpsManagement;
  if (updates.medicationManagement !== undefined) mapped.medication_management = updates.medicationManagement;
  if (updates.camhsEngaged !== undefined) mapped.camhs_engaged = updates.camhsEngaged;
  if (updates.schoolAware !== undefined) mapped.school_aware = updates.schoolAware;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.planSharedWithChild !== undefined) mapped.plan_shared_with_child = updates.planSharedWithChild;
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_self_harm_prevention_plans") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteSelfHarmPreventionPlan(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { error } = await (client.from("cs_self_harm_prevention_plans") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}

// -- Testing exports ----------------------------------------------------------

export const _testing = {
  computeMetrics,
  computeAlerts,
  generateCaraInsights,
  validateSelfHarmPreventionPlan,
};
