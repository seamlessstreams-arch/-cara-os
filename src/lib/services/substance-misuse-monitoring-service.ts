// ==============================================================================
// CARA -- SUBSTANCE MISUSE MONITORING SERVICE
// Tracks substance misuse assessments, risk levels, specialist referrals,
// harm reduction plans, engagement status, and outcome tracking for children
// in residential care.
//
// Covers: Substance type classification, usage frequency tracking, risk
// assessment, specialist referral management, harm reduction planning,
// young person engagement, multi-agency notification (parents, social
// workers, police), drug testing consent, support plan monitoring,
// review scheduling, and outcome recording.
//
// UK Regulatory Framework:
// CHR 2015 Reg 12 (protection of children from harm),
// CHR 2015 Reg 34 (meeting individual needs including health),
// NICE CG115 (alcohol misuse in young people),
// HM Government Drugs Strategy 2021 (From Harm to Hope),
// Working Together to Safeguard Children 2023.
//
// SCCIF: Health -- "Children are supported to understand the risks of
// substance misuse and receive appropriate specialist intervention."
// Ofsted expects homes to have robust substance misuse policies, prompt
// referral to specialist services, and evidence of harm reduction planning.
// ==============================================================================

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const SUBSTANCE_TYPES = [
  "Alcohol",
  "Cannabis",
  "Cocaine",
  "MDMA",
  "Nitrous Oxide",
  "Prescription Drugs",
  "Solvents/Inhalants",
  "Synthetic Cannabinoids",
  "Tobacco/Vaping",
  "Other",
] as const;
export type SubstanceType = (typeof SUBSTANCE_TYPES)[number];

export const USAGE_FREQUENCIES = [
  "Single Episode",
  "Occasional",
  "Regular",
  "Daily",
  "Unknown",
] as const;
export type UsageFrequency = (typeof USAGE_FREQUENCIES)[number];

export const RISK_LEVELS = [
  "Low",
  "Medium",
  "High",
  "Critical",
] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const OUTCOMES = [
  "Ongoing Support",
  "Reduced Usage",
  "Abstinent",
  "Disengaged",
  "Referred Out",
  "Closed",
] as const;
export type Outcome = (typeof OUTCOMES)[number];

export const COMPLIANCE_STATUSES = [
  "Compliant",
  "Non-Compliant",
  "Action Required",
  "Under Review",
] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

// -- Label maps ---------------------------------------------------------------

export const SUBSTANCE_TYPE_LABELS: { type: SubstanceType; label: string }[] = [
  { type: "Alcohol", label: "Alcohol" },
  { type: "Cannabis", label: "Cannabis" },
  { type: "Cocaine", label: "Cocaine" },
  { type: "MDMA", label: "MDMA / Ecstasy" },
  { type: "Nitrous Oxide", label: "Nitrous Oxide (NOS)" },
  { type: "Prescription Drugs", label: "Prescription Drugs" },
  { type: "Solvents/Inhalants", label: "Solvents / Inhalants" },
  { type: "Synthetic Cannabinoids", label: "Synthetic Cannabinoids (Spice)" },
  { type: "Tobacco/Vaping", label: "Tobacco / Vaping" },
  { type: "Other", label: "Other Substance" },
];

export const USAGE_FREQUENCY_LABELS: { frequency: UsageFrequency; label: string }[] = [
  { frequency: "Single Episode", label: "Single Episode" },
  { frequency: "Occasional", label: "Occasional (less than weekly)" },
  { frequency: "Regular", label: "Regular (weekly)" },
  { frequency: "Daily", label: "Daily" },
  { frequency: "Unknown", label: "Unknown / Not Disclosed" },
];

export const RISK_LEVEL_LABELS: { level: RiskLevel; label: string }[] = [
  { level: "Low", label: "Low Risk" },
  { level: "Medium", label: "Medium Risk" },
  { level: "High", label: "High Risk" },
  { level: "Critical", label: "Critical Risk" },
];

export const OUTCOME_LABELS: { outcome: Outcome; label: string }[] = [
  { outcome: "Ongoing Support", label: "Ongoing Support" },
  { outcome: "Reduced Usage", label: "Reduced Usage" },
  { outcome: "Abstinent", label: "Abstinent" },
  { outcome: "Disengaged", label: "Disengaged from Support" },
  { outcome: "Referred Out", label: "Referred to External Service" },
  { outcome: "Closed", label: "Closed" },
];

export const COMPLIANCE_STATUS_LABELS: { status: ComplianceStatus; label: string }[] = [
  { status: "Compliant", label: "Compliant" },
  { status: "Non-Compliant", label: "Non-Compliant" },
  { status: "Action Required", label: "Action Required" },
  { status: "Under Review", label: "Under Review" },
];

// -- Row type -----------------------------------------------------------------

export interface SubstanceMisuseMonitoringRow {
  id: string;
  home_id: string;
  child_name: string;
  assessment_date: string;
  assessor_name: string;
  substance_type: SubstanceType;
  usage_frequency: UsageFrequency;
  risk_level: RiskLevel;
  referral_to_specialist: boolean;
  specialist_service_name: string | null;
  harm_reduction_plan: boolean;
  young_person_engaged: boolean;
  parental_carer_informed: boolean;
  social_worker_informed: boolean;
  police_involvement: boolean;
  drug_testing_consent: boolean;
  support_plan_in_place: boolean;
  next_review_date: string | null;
  outcome: Outcome;
  compliance_status: ComplianceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateSubstanceMisuseMonitoring(input: {
  childName?: string;
  assessmentDate?: string;
  assessorName?: string;
  substanceType?: string;
  usageFrequency?: string;
  riskLevel?: string;
  outcome?: string;
  complianceStatus?: string;
  referralToSpecialist?: boolean;
  specialistServiceName?: string | null;
  nextReviewDate?: string | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.childName || input.childName.trim().length === 0) {
    errors.push("Child name is required");
  }
  if (!input.assessmentDate) {
    errors.push("Assessment date is required");
  } else {
    const dateObj = new Date(input.assessmentDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Assessment date must be a valid date");
    } else if (dateObj > new Date()) {
      errors.push("Assessment date cannot be in the future");
    }
  }
  if (!input.assessorName || input.assessorName.trim().length === 0) {
    errors.push("Assessor name is required");
  }
  if (!input.substanceType || !(SUBSTANCE_TYPES as readonly string[]).includes(input.substanceType)) {
    errors.push(`Substance type must be one of: ${SUBSTANCE_TYPES.join(", ")}`);
  }
  if (!input.usageFrequency || !(USAGE_FREQUENCIES as readonly string[]).includes(input.usageFrequency)) {
    errors.push(`Usage frequency must be one of: ${USAGE_FREQUENCIES.join(", ")}`);
  }
  if (!input.riskLevel || !(RISK_LEVELS as readonly string[]).includes(input.riskLevel)) {
    errors.push(`Risk level must be one of: ${RISK_LEVELS.join(", ")}`);
  }
  if (!input.outcome || !(OUTCOMES as readonly string[]).includes(input.outcome)) {
    errors.push(`Outcome must be one of: ${OUTCOMES.join(", ")}`);
  }
  if (input.complianceStatus && !(COMPLIANCE_STATUSES as readonly string[]).includes(input.complianceStatus)) {
    errors.push(`Compliance status must be one of: ${COMPLIANCE_STATUSES.join(", ")}`);
  }

  // Business rule: if referred to specialist, specialist service name should be provided
  if (input.referralToSpecialist && (!input.specialistServiceName || input.specialistServiceName.trim().length === 0)) {
    errors.push("Specialist service name is required when referral to specialist is true");
  }

  // Business rule: next review date must not be in the past
  if (input.nextReviewDate) {
    const reviewDate = new Date(input.nextReviewDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(reviewDate.getTime())) {
      errors.push("Next review date must be a valid date");
    } else if (reviewDate < today) {
      errors.push("Next review date should not be in the past");
    }
  }

  // Business rule: high/critical risk should have support plan
  // (warning only, not blocking)

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: SubstanceMisuseMonitoringRow[],
): {
  total_assessments: number;
  high_risk_count: number;
  critical_count: number;
  specialist_referral_rate: number;
  engagement_rate: number;
  support_plan_rate: number;
  harm_reduction_rate: number;
  parental_informed_rate: number;
  social_worker_informed_rate: number;
  police_involvement_count: number;
  drug_testing_consent_rate: number;
  unique_children: number;
  unique_assessors: number;
  by_substance: Record<string, number>;
  by_outcome: Record<string, number>;
  by_risk_level: Record<string, number>;
  by_frequency: Record<string, number>;
  positive_outcome_rate: number;
  disengagement_rate: number;
} {
  const total = rows.length;

  const highRisk = rows.filter((r) => r.risk_level === "High").length;
  const criticalCount = rows.filter((r) => r.risk_level === "Critical").length;

  const boolRate = (field: keyof SubstanceMisuseMonitoringRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
  };

  const policeCount = rows.filter((r) => r.police_involvement).length;
  const uniqueChildren = new Set(rows.map((r) => r.child_name)).size;
  const uniqueAssessors = new Set(rows.map((r) => r.assessor_name)).size;

  // Substance breakdown
  const bySubstance: Record<string, number> = {};
  for (const st of SUBSTANCE_TYPES) bySubstance[st] = 0;
  for (const r of rows) bySubstance[r.substance_type] = (bySubstance[r.substance_type] || 0) + 1;

  // Outcome breakdown
  const byOutcome: Record<string, number> = {};
  for (const o of OUTCOMES) byOutcome[o] = 0;
  for (const r of rows) byOutcome[r.outcome] = (byOutcome[r.outcome] || 0) + 1;

  // Risk level breakdown
  const byRiskLevel: Record<string, number> = {};
  for (const rl of RISK_LEVELS) byRiskLevel[rl] = 0;
  for (const r of rows) byRiskLevel[r.risk_level] = (byRiskLevel[r.risk_level] || 0) + 1;

  // Frequency breakdown
  const byFrequency: Record<string, number> = {};
  for (const uf of USAGE_FREQUENCIES) byFrequency[uf] = 0;
  for (const r of rows) byFrequency[r.usage_frequency] = (byFrequency[r.usage_frequency] || 0) + 1;

  // Positive outcomes: Reduced Usage or Abstinent
  const positiveOutcomes = rows.filter(
    (r) => r.outcome === "Reduced Usage" || r.outcome === "Abstinent",
  ).length;
  const positiveOutcomeRate =
    total > 0 ? Math.round((positiveOutcomes / total) * 1000) / 10 : 0;

  // Disengagement rate
  const disengaged = rows.filter((r) => r.outcome === "Disengaged").length;
  const disengagementRate =
    total > 0 ? Math.round((disengaged / total) * 1000) / 10 : 0;

  return {
    total_assessments: total,
    high_risk_count: highRisk,
    critical_count: criticalCount,
    specialist_referral_rate: boolRate("referral_to_specialist"),
    engagement_rate: boolRate("young_person_engaged"),
    support_plan_rate: boolRate("support_plan_in_place"),
    harm_reduction_rate: boolRate("harm_reduction_plan"),
    parental_informed_rate: boolRate("parental_carer_informed"),
    social_worker_informed_rate: boolRate("social_worker_informed"),
    police_involvement_count: policeCount,
    drug_testing_consent_rate: boolRate("drug_testing_consent"),
    unique_children: uniqueChildren,
    unique_assessors: uniqueAssessors,
    by_substance: bySubstance,
    by_outcome: byOutcome,
    by_risk_level: byRiskLevel,
    by_frequency: byFrequency,
    positive_outcome_rate: positiveOutcomeRate,
    disengagement_rate: disengagementRate,
  };
}

export function computeAlerts(
  rows: SubstanceMisuseMonitoringRow[],
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

  // Critical: critical risk with no support plan
  for (const r of rows) {
    if (r.risk_level === "Critical" && !r.support_plan_in_place) {
      alerts.push({
        type: "critical_no_support_plan",
        severity: "critical",
        message: `${r.child_name} has Critical substance misuse risk with no support plan in place — immediate intervention and multi-agency planning required per Reg 12`,
        record_id: r.id,
      });
    }
  }

  // Critical: daily usage of Class A substances without specialist referral
  for (const r of rows) {
    if (
      r.usage_frequency === "Daily" &&
      (r.substance_type === "Cocaine" || r.substance_type === "MDMA") &&
      !r.referral_to_specialist
    ) {
      alerts.push({
        type: "daily_class_a_no_referral",
        severity: "critical",
        message: `${r.child_name} has daily ${r.substance_type} usage with no specialist referral — urgent referral to substance misuse service required`,
        record_id: r.id,
      });
    }
  }

  // High: high risk and young person not engaged
  for (const r of rows) {
    if (
      (r.risk_level === "High" || r.risk_level === "Critical") &&
      !r.young_person_engaged
    ) {
      alerts.push({
        type: "high_risk_not_engaged",
        severity: "high",
        message: `${r.child_name} has ${r.risk_level} substance misuse risk but is not engaged with support — consider motivational interviewing or alternative engagement strategies`,
        record_id: r.id,
      });
    }
  }

  // High: high/critical risk and social worker not informed
  for (const r of rows) {
    if (
      (r.risk_level === "High" || r.risk_level === "Critical") &&
      !r.social_worker_informed
    ) {
      alerts.push({
        type: "high_risk_sw_not_informed",
        severity: "high",
        message: `${r.child_name} has ${r.risk_level} substance misuse risk but social worker has not been informed — notification required under Working Together 2023`,
        record_id: r.id,
      });
    }
  }

  // High: no harm reduction plan for regular/daily usage
  for (const r of rows) {
    if (
      (r.usage_frequency === "Regular" || r.usage_frequency === "Daily") &&
      !r.harm_reduction_plan
    ) {
      alerts.push({
        type: "regular_use_no_harm_reduction",
        severity: "high",
        message: `${r.child_name} has ${r.usage_frequency} substance use (${r.substance_type}) with no harm reduction plan — develop harm reduction strategy per NICE CG115`,
        record_id: r.id,
      });
    }
  }

  // Medium: disengaged outcome
  for (const r of rows) {
    if (r.outcome === "Disengaged") {
      alerts.push({
        type: "disengaged_outcome",
        severity: "medium",
        message: `${r.child_name} has disengaged from substance misuse support for ${r.substance_type} — consider re-engagement approach and update care plan`,
        record_id: r.id,
      });
    }
  }

  // Medium: parental/carer not informed for under-16 context (high/critical)
  for (const r of rows) {
    if (
      (r.risk_level === "High" || r.risk_level === "Critical") &&
      !r.parental_carer_informed
    ) {
      alerts.push({
        type: "parent_not_informed_high_risk",
        severity: "medium",
        message: `Parent/carer not informed of ${r.child_name}'s ${r.risk_level} substance misuse risk — consider Gillick competence and notify where appropriate`,
        record_id: r.id,
      });
    }
  }

  // Medium: overdue review
  for (const r of rows) {
    if (r.next_review_date) {
      const reviewDate = new Date(r.next_review_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (reviewDate < today) {
        alerts.push({
          type: "overdue_review",
          severity: "medium",
          message: `Substance misuse review for ${r.child_name} was due on ${r.next_review_date} and is now overdue — schedule review promptly`,
          record_id: r.id,
        });
      }
    }
  }

  return alerts;
}

export function generateCaraInsights(
  rows: SubstanceMisuseMonitoringRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  insights.push(
    `[sky] ${metrics.total_assessments} substance misuse ${metrics.total_assessments === 1 ? "assessment" : "assessments"} recorded across ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `${metrics.high_risk_count} at High risk, ${metrics.critical_count} at Critical risk. ` +
      `Specialist referral rate: ${metrics.specialist_referral_rate}%. ` +
      `Engagement rate: ${metrics.engagement_rate}%. ` +
      `Support plan rate: ${metrics.support_plan_rate}%.`,
  );

  // Insight 2: Priority concerns
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    // Find most common substance
    const topSubstance = Object.entries(metrics.by_substance)
      .sort(([, a], [, b]) => b - a)
      .filter(([, count]) => count > 0)[0];
    const topSubstanceLabel = topSubstance ? `${topSubstance[0]} (${topSubstance[1]})` : "none recorded";

    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority substance misuse alerts active. ` +
        `Most common substance: ${topSubstanceLabel}. ` +
        `Positive outcome rate: ${metrics.positive_outcome_rate}%. ` +
        `Disengagement rate: ${metrics.disengagement_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority substance misuse alerts currently active. ` +
        `Harm reduction plan rate: ${metrics.harm_reduction_rate}%. ` +
        `Positive outcome rate: ${metrics.positive_outcome_rate}%. ` +
        `Continue monitoring and proactive support per NICE CG115.`,
    );
  }

  // Insight 3: Reflective safeguarding question
  if (metrics.disengagement_rate > 20) {
    insights.push(
      `[reflect] ${metrics.disengagement_rate}% of substance misuse cases show disengagement. ` +
        `What alternative engagement strategies are being used, and are motivational interviewing ` +
        `techniques being applied to re-engage young people who have withdrawn from support?`,
    );
  } else if (metrics.critical_count > 0) {
    insights.push(
      `[reflect] ${metrics.critical_count} ${metrics.critical_count === 1 ? "child is" : "children are"} at Critical substance misuse risk. ` +
        `Are multi-agency planning meetings in place for each critical case, ` +
        `and have all relevant professionals (CAMHS, YOT, social workers) been engaged ` +
        `in line with Working Together 2023 and the Drugs Strategy 2021?`,
    );
  } else {
    insights.push(
      `[reflect] Are staff trained in recognising the signs of substance misuse including ` +
        `novel psychoactive substances and vaping, and is there a clear pathway from ` +
        `identification through assessment to specialist referral in line with NICE CG115?`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listSubstanceMisuseMonitoring(
  homeId: string,
  filters?: {
    substanceType?: SubstanceType;
    riskLevel?: RiskLevel;
    outcome?: Outcome;
    complianceStatus?: ComplianceStatus;
    limit?: number;
  },
): Promise<ServiceResult<SubstanceMisuseMonitoringRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_substance_misuse_monitoring") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.substanceType) q = q.eq("substance_type", filters.substanceType);
  if (filters?.riskLevel) q = q.eq("risk_level", filters.riskLevel);
  if (filters?.outcome) q = q.eq("outcome", filters.outcome);
  if (filters?.complianceStatus) q = q.eq("compliance_status", filters.complianceStatus);

  q = q.order("assessment_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getSubstanceMisuseMonitoring(
  id: string,
): Promise<ServiceResult<SubstanceMisuseMonitoringRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_substance_misuse_monitoring") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createSubstanceMisuseMonitoring(input: {
  homeId: string;
  childName: string;
  assessmentDate: string;
  assessorName: string;
  substanceType: SubstanceType;
  usageFrequency: UsageFrequency;
  riskLevel: RiskLevel;
  referralToSpecialist?: boolean;
  specialistServiceName?: string | null;
  harmReductionPlan?: boolean;
  youngPersonEngaged?: boolean;
  parentalCarerInformed?: boolean;
  socialWorkerInformed?: boolean;
  policeInvolvement?: boolean;
  drugTestingConsent?: boolean;
  supportPlanInPlace?: boolean;
  nextReviewDate?: string | null;
  outcome: Outcome;
  complianceStatus?: ComplianceStatus;
  notes?: string | null;
}): Promise<ServiceResult<SubstanceMisuseMonitoringRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateSubstanceMisuseMonitoring({
    childName: input.childName,
    assessmentDate: input.assessmentDate,
    assessorName: input.assessorName,
    substanceType: input.substanceType,
    usageFrequency: input.usageFrequency,
    riskLevel: input.riskLevel,
    outcome: input.outcome,
    complianceStatus: input.complianceStatus,
    referralToSpecialist: input.referralToSpecialist,
    specialistServiceName: input.specialistServiceName,
    nextReviewDate: input.nextReviewDate,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_substance_misuse_monitoring") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      assessment_date: input.assessmentDate,
      assessor_name: input.assessorName,
      substance_type: input.substanceType,
      usage_frequency: input.usageFrequency,
      risk_level: input.riskLevel,
      referral_to_specialist: input.referralToSpecialist ?? false,
      specialist_service_name: input.specialistServiceName ?? null,
      harm_reduction_plan: input.harmReductionPlan ?? false,
      young_person_engaged: input.youngPersonEngaged ?? false,
      parental_carer_informed: input.parentalCarerInformed ?? false,
      social_worker_informed: input.socialWorkerInformed ?? false,
      police_involvement: input.policeInvolvement ?? false,
      drug_testing_consent: input.drugTestingConsent ?? false,
      support_plan_in_place: input.supportPlanInPlace ?? false,
      next_review_date: input.nextReviewDate ?? null,
      outcome: input.outcome,
      compliance_status: input.complianceStatus ?? "Under Review",
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateSubstanceMisuseMonitoring(
  id: string,
  updates: Partial<{
    childName: string;
    assessmentDate: string;
    assessorName: string;
    substanceType: SubstanceType;
    usageFrequency: UsageFrequency;
    riskLevel: RiskLevel;
    referralToSpecialist: boolean;
    specialistServiceName: string | null;
    harmReductionPlan: boolean;
    youngPersonEngaged: boolean;
    parentalCarerInformed: boolean;
    socialWorkerInformed: boolean;
    policeInvolvement: boolean;
    drugTestingConsent: boolean;
    supportPlanInPlace: boolean;
    nextReviewDate: string | null;
    outcome: Outcome;
    complianceStatus: ComplianceStatus;
    notes: string | null;
  }>,
): Promise<ServiceResult<SubstanceMisuseMonitoringRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.assessmentDate !== undefined) mapped.assessment_date = updates.assessmentDate;
  if (updates.assessorName !== undefined) mapped.assessor_name = updates.assessorName;
  if (updates.substanceType !== undefined) mapped.substance_type = updates.substanceType;
  if (updates.usageFrequency !== undefined) mapped.usage_frequency = updates.usageFrequency;
  if (updates.riskLevel !== undefined) mapped.risk_level = updates.riskLevel;
  if (updates.referralToSpecialist !== undefined) mapped.referral_to_specialist = updates.referralToSpecialist;
  if (updates.specialistServiceName !== undefined) mapped.specialist_service_name = updates.specialistServiceName;
  if (updates.harmReductionPlan !== undefined) mapped.harm_reduction_plan = updates.harmReductionPlan;
  if (updates.youngPersonEngaged !== undefined) mapped.young_person_engaged = updates.youngPersonEngaged;
  if (updates.parentalCarerInformed !== undefined) mapped.parental_carer_informed = updates.parentalCarerInformed;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.policeInvolvement !== undefined) mapped.police_involvement = updates.policeInvolvement;
  if (updates.drugTestingConsent !== undefined) mapped.drug_testing_consent = updates.drugTestingConsent;
  if (updates.supportPlanInPlace !== undefined) mapped.support_plan_in_place = updates.supportPlanInPlace;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.outcome !== undefined) mapped.outcome = updates.outcome;
  if (updates.complianceStatus !== undefined) mapped.compliance_status = updates.complianceStatus;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_substance_misuse_monitoring") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteSubstanceMisuseMonitoring(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { error } = await (client.from("cs_substance_misuse_monitoring") as SB)
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
  validateSubstanceMisuseMonitoring,
};
