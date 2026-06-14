// ==============================================================================
// CARA -- UNACCOMPANIED ASYLUM-SEEKING CHILDREN (UASC) SUPPORT SERVICE
// Tracks UASC assessments, immigration status, legal representation, interpreter
// needs, age assessments (Merton compliant), trafficking screening, NRM referrals,
// education provision, health screening, mental health (CAMHS) support, cultural
// and religious needs, and scheduled reviews.
//
// Covers: Initial assessments, age assessments (Merton compliant), immigration
// updates, solicitor appointments, Home Office interviews, language support,
// cultural needs reviews, trafficking screening (NRM), ESOL provision, health
// screening, country of origin information, status decisions, appeals, and
// emotional wellbeing reviews for UASC young people in residential care.
//
// UK Regulatory Framework:
// CHR 2015 Reg 5 (individual needs — immigration, language, culture),
// Immigration Act 2016,
// National Transfer Scheme,
// UNCRC Articles 22 & 37,
// Home Office UASC guidance 2023,
// Age assessment (Merton compliant),
// Modern Slavery Act 2015 (trafficking screening & NRM),
// Children Act 1989 s20/s31 (looked-after children).
//
// SCCIF: Overall experiences — "The home meets UASC children's additional needs.
// Children seeking asylum receive appropriate support with their immigration
// status, legal representation, language and cultural needs, health screening,
// education provision, and emotional wellbeing. Staff understand the unique
// vulnerabilities of UASC young people including trafficking risks."
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const RECORD_TYPES = [
  "Initial Assessment",
  "Age Assessment",
  "Immigration Update",
  "Solicitor Appointment",
  "Home Office Interview",
  "Language Support",
  "Cultural Needs Review",
  "Trafficking Screening",
  "ESOL Provision",
  "Health Screening",
  "Country of Origin Information",
  "NRM Referral",
  "Status Decision",
  "Appeal",
  "Emotional Wellbeing Review",
] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

export const IMMIGRATION_STATUSES = [
  "Asylum Seeker",
  "Refugee — Granted",
  "Humanitarian Protection",
  "Discretionary Leave",
  "UASC Leave",
  "Appeal Pending",
  "Refused — Appeal Rights Exhausted",
  "Age Disputed",
  "Pre-Decision",
  "Unknown",
] as const;
export type ImmigrationStatus = (typeof IMMIGRATION_STATUSES)[number];

export const AGE_ASSESSMENT_STATUSES = [
  "Accepted",
  "Disputed — Merton Assessment",
  "Disputed — Judicial Review",
  "Not Required",
] as const;
export type AgeAssessmentStatus = (typeof AGE_ASSESSMENT_STATUSES)[number];

export const EDUCATION_PROVISIONS = [
  "Mainstream School",
  "College",
  "ESOL Only",
  "PRU",
  "Home Tutoring",
  "Awaiting Placement",
  "Not in Education",
] as const;
export type EducationProvision = (typeof EDUCATION_PROVISIONS)[number];

export const STATUSES = [
  "Active",
  "Under Review",
  "Resolved",
  "Archived",
] as const;
export type Status = (typeof STATUSES)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const LEGAL_RECORD_TYPES: RecordType[] = [
  "Solicitor Appointment",
  "Home Office Interview",
  "Status Decision",
  "Appeal",
];

export const VULNERABILITY_RECORD_TYPES: RecordType[] = [
  "Trafficking Screening",
  "NRM Referral",
  "Age Assessment",
];

export const WELLBEING_RECORD_TYPES: RecordType[] = [
  "Emotional Wellbeing Review",
  "Health Screening",
  "Cultural Needs Review",
];

// -- Label maps ---------------------------------------------------------------

export const RECORD_TYPE_LABELS: { type: RecordType; label: string }[] = [
  { type: "Initial Assessment", label: "Initial Assessment" },
  { type: "Age Assessment", label: "Age Assessment" },
  { type: "Immigration Update", label: "Immigration Update" },
  { type: "Solicitor Appointment", label: "Solicitor Appointment" },
  { type: "Home Office Interview", label: "Home Office Interview" },
  { type: "Language Support", label: "Language Support" },
  { type: "Cultural Needs Review", label: "Cultural Needs Review" },
  { type: "Trafficking Screening", label: "Trafficking Screening" },
  { type: "ESOL Provision", label: "ESOL Provision" },
  { type: "Health Screening", label: "Health Screening" },
  { type: "Country of Origin Information", label: "Country of Origin Info" },
  { type: "NRM Referral", label: "NRM Referral" },
  { type: "Status Decision", label: "Status Decision" },
  { type: "Appeal", label: "Appeal" },
  { type: "Emotional Wellbeing Review", label: "Emotional Wellbeing Review" },
];

export const IMMIGRATION_STATUS_LABELS: { status: ImmigrationStatus; label: string }[] = [
  { status: "Asylum Seeker", label: "Asylum Seeker" },
  { status: "Refugee — Granted", label: "Refugee (Granted)" },
  { status: "Humanitarian Protection", label: "Humanitarian Protection" },
  { status: "Discretionary Leave", label: "Discretionary Leave" },
  { status: "UASC Leave", label: "UASC Leave" },
  { status: "Appeal Pending", label: "Appeal Pending" },
  { status: "Refused — Appeal Rights Exhausted", label: "Refused (ARE)" },
  { status: "Age Disputed", label: "Age Disputed" },
  { status: "Pre-Decision", label: "Pre-Decision" },
  { status: "Unknown", label: "Unknown" },
];

export const AGE_ASSESSMENT_STATUS_LABELS: { status: AgeAssessmentStatus; label: string }[] = [
  { status: "Accepted", label: "Accepted" },
  { status: "Disputed — Merton Assessment", label: "Disputed (Merton)" },
  { status: "Disputed — Judicial Review", label: "Disputed (JR)" },
  { status: "Not Required", label: "Not Required" },
];

export const EDUCATION_PROVISION_LABELS: { provision: EducationProvision; label: string }[] = [
  { provision: "Mainstream School", label: "Mainstream School" },
  { provision: "College", label: "College" },
  { provision: "ESOL Only", label: "ESOL Only" },
  { provision: "PRU", label: "PRU" },
  { provision: "Home Tutoring", label: "Home Tutoring" },
  { provision: "Awaiting Placement", label: "Awaiting Placement" },
  { provision: "Not in Education", label: "Not in Education" },
];

export const STATUS_LABELS: { status: Status; label: string }[] = [
  { status: "Active", label: "Active" },
  { status: "Under Review", label: "Under Review" },
  { status: "Resolved", label: "Resolved" },
  { status: "Archived", label: "Archived" },
];

// -- Row type -----------------------------------------------------------------

export interface UascSupportRow {
  id: string;
  home_id: string;
  child_name: string;
  record_date: string;
  worker_name: string;
  record_type: RecordType;
  immigration_status: ImmigrationStatus;
  legal_representation: boolean;
  solicitor_name: string | null;
  interpreter_required: boolean;
  interpreter_language: string | null;
  age_assessment_status: AgeAssessmentStatus;
  trafficking_indicators: boolean;
  nrm_referred: boolean;
  education_provision: EducationProvision;
  health_screening_completed: boolean;
  mental_health_support: boolean;
  cultural_needs_met: boolean;
  religious_needs_met: boolean;
  social_worker_informed: boolean;
  next_review_date: string | null;
  status: Status;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateUascSupport(input: {
  childName?: string;
  recordDate?: string;
  workerName?: string;
  recordType?: string;
  immigrationStatus?: string;
  ageAssessmentStatus?: string;
  educationProvision?: string;
  solicitorName?: string | null;
  interpreterRequired?: boolean;
  interpreterLanguage?: string | null;
  legalRepresentation?: boolean;
  traffickingIndicators?: boolean;
  nrmReferred?: boolean;
  nextReviewDate?: string | null;
  status?: string;
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
    } else if (dateObj > new Date()) {
      errors.push("Record date cannot be in the future");
    }
  }
  if (!input.workerName || input.workerName.trim().length === 0) {
    errors.push("Worker name is required");
  }
  if (!input.recordType || !(RECORD_TYPES as readonly string[]).includes(input.recordType)) {
    errors.push(`Record type must be one of: ${RECORD_TYPES.join(", ")}`);
  }
  if (!input.immigrationStatus || !(IMMIGRATION_STATUSES as readonly string[]).includes(input.immigrationStatus)) {
    errors.push(`Immigration status must be one of: ${IMMIGRATION_STATUSES.join(", ")}`);
  }
  if (input.ageAssessmentStatus && !(AGE_ASSESSMENT_STATUSES as readonly string[]).includes(input.ageAssessmentStatus)) {
    errors.push(`Age assessment status must be one of: ${AGE_ASSESSMENT_STATUSES.join(", ")}`);
  }
  if (input.educationProvision && !(EDUCATION_PROVISIONS as readonly string[]).includes(input.educationProvision)) {
    errors.push(`Education provision must be one of: ${EDUCATION_PROVISIONS.join(", ")}`);
  }
  if (input.status && !(STATUSES as readonly string[]).includes(input.status)) {
    errors.push(`Status must be one of: ${STATUSES.join(", ")}`);
  }

  // Business rule: solicitor appointment must have legal representation
  if (
    input.recordType === "Solicitor Appointment" &&
    input.legalRepresentation === false
  ) {
    errors.push("Legal representation must be marked as true when recording a solicitor appointment — UASC children are entitled to legal aid");
  }

  // Business rule: solicitor name required when legal representation is true
  if (
    input.legalRepresentation === true &&
    (!input.solicitorName || input.solicitorName.trim().length === 0)
  ) {
    errors.push("Solicitor name should be recorded when legal representation is confirmed");
  }

  // Business rule: interpreter language required when interpreter is needed
  if (
    input.interpreterRequired === true &&
    (!input.interpreterLanguage || input.interpreterLanguage.trim().length === 0)
  ) {
    errors.push("Interpreter language must be specified when an interpreter is required");
  }

  // Business rule: trafficking indicators should trigger NRM referral consideration
  if (
    input.traffickingIndicators === true &&
    input.nrmReferred === false
  ) {
    errors.push("NRM referral should be considered when trafficking indicators are present — Modern Slavery Act 2015 requires referral to the NRM for potential victims");
  }

  // Business rule: NRM referral record type should have trafficking indicators flagged
  if (
    input.recordType === "NRM Referral" &&
    input.traffickingIndicators === false
  ) {
    errors.push("Trafficking indicators should be flagged when making an NRM referral");
  }

  // Business rule: age assessment record should have age assessment status set
  if (
    input.recordType === "Age Assessment" &&
    input.ageAssessmentStatus === "Not Required"
  ) {
    errors.push("Age assessment status should reflect the outcome when recording an age assessment — update from 'Not Required' to the appropriate Merton-compliant status");
  }

  // Business rule: next review date should be in the future
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

  // Business rule: Home Office interview should have interpreter considered
  if (
    input.recordType === "Home Office Interview" &&
    input.interpreterRequired === undefined
  ) {
    errors.push("Interpreter requirement must be assessed before a Home Office interview");
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: UascSupportRow[],
): {
  total_records: number;
  by_record_type: Record<string, number>;
  by_immigration_status: Record<string, number>;
  legal_representation_rate: number;
  interpreter_rate: number;
  trafficking_rate: number;
  nrm_rate: number;
  by_education_provision: Record<string, number>;
  health_screening_rate: number;
  camhs_rate: number;
  cultural_needs_met_rate: number;
  religious_needs_met_rate: number;
  age_dispute_count: number;
  unique_children: number;
  social_worker_informed_rate: number;
  active_count: number;
  overdue_review_count: number;
} {
  const total = rows.length;

  const boolRate = (field: keyof UascSupportRow, subset?: UascSupportRow[]) => {
    const pool = subset ?? rows;
    const count = pool.filter((r) => r[field] === true).length;
    return pool.length > 0 ? Math.round((count / pool.length) * 1000) / 10 : 0;
  };

  // Record type breakdown
  const byRecordType: Record<string, number> = {};
  for (const rt of RECORD_TYPES) byRecordType[rt] = 0;
  for (const r of rows) byRecordType[r.record_type] = (byRecordType[r.record_type] || 0) + 1;

  // Immigration status breakdown
  const byImmigrationStatus: Record<string, number> = {};
  for (const is_ of IMMIGRATION_STATUSES) byImmigrationStatus[is_] = 0;
  for (const r of rows) byImmigrationStatus[r.immigration_status] = (byImmigrationStatus[r.immigration_status] || 0) + 1;

  // Education provision breakdown
  const byEducationProvision: Record<string, number> = {};
  for (const ep of EDUCATION_PROVISIONS) byEducationProvision[ep] = 0;
  for (const r of rows) byEducationProvision[r.education_provision] = (byEducationProvision[r.education_provision] || 0) + 1;

  // Age dispute count
  const ageDisputeCount = rows.filter(
    (r) => r.age_assessment_status === "Disputed — Merton Assessment" || r.age_assessment_status === "Disputed — Judicial Review",
  ).length;

  // Unique children
  const uniqueChildren = new Set(rows.map((r) => r.child_name)).size;

  // Active count
  const activeCount = rows.filter((r) => r.status === "Active").length;

  // Overdue reviews
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueReviewCount = rows.filter((r) => {
    if (!r.next_review_date) return false;
    const reviewDate = new Date(r.next_review_date);
    return reviewDate < today;
  }).length;

  return {
    total_records: total,
    by_record_type: byRecordType,
    by_immigration_status: byImmigrationStatus,
    legal_representation_rate: boolRate("legal_representation"),
    interpreter_rate: boolRate("interpreter_required"),
    trafficking_rate: boolRate("trafficking_indicators"),
    nrm_rate: boolRate("nrm_referred"),
    by_education_provision: byEducationProvision,
    health_screening_rate: boolRate("health_screening_completed"),
    camhs_rate: boolRate("mental_health_support"),
    cultural_needs_met_rate: boolRate("cultural_needs_met"),
    religious_needs_met_rate: boolRate("religious_needs_met"),
    age_dispute_count: ageDisputeCount,
    unique_children: uniqueChildren,
    social_worker_informed_rate: boolRate("social_worker_informed"),
    active_count: activeCount,
    overdue_review_count: overdueReviewCount,
  };
}

export function computeAlerts(
  rows: UascSupportRow[],
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

  // Critical: Trafficking indicators without NRM referral
  for (const r of rows) {
    if (r.trafficking_indicators && !r.nrm_referred && r.status === "Active") {
      alerts.push({
        type: "trafficking_no_nrm",
        severity: "critical",
        message: `${r.child_name} has trafficking indicators identified but has not been referred to the NRM — referral is a statutory duty under the Modern Slavery Act 2015 for potential child victims of trafficking`,
        record_id: r.id,
      });
    }
  }

  // Critical: Refused status with no legal representation
  for (const r of rows) {
    if (
      r.immigration_status === "Refused — Appeal Rights Exhausted" &&
      !r.legal_representation &&
      r.status === "Active"
    ) {
      alerts.push({
        type: "refused_no_legal",
        severity: "critical",
        message: `${r.child_name} has exhausted appeal rights without legal representation — urgent legal review needed to explore further options and prevent unlawful removal of a potentially vulnerable child`,
        record_id: r.id,
      });
    }
  }

  // Critical: Age disputed child without appropriate assessment
  for (const r of rows) {
    if (
      r.immigration_status === "Age Disputed" &&
      r.age_assessment_status === "Not Required" &&
      r.status === "Active"
    ) {
      alerts.push({
        type: "age_disputed_no_assessment",
        severity: "critical",
        message: `${r.child_name} has age disputed immigration status but no Merton-compliant age assessment has been initiated — this must be arranged urgently as the child's access to support depends on age determination`,
        record_id: r.id,
      });
    }
  }

  // High: No legal representation for active asylum seeker
  for (const r of rows) {
    if (
      (r.immigration_status === "Asylum Seeker" || r.immigration_status === "Pre-Decision") &&
      !r.legal_representation &&
      r.status === "Active"
    ) {
      alerts.push({
        type: "asylum_no_legal",
        severity: "high",
        message: `${r.child_name} is an active asylum seeker without legal representation — UASC children are entitled to legal aid and a solicitor must be appointed to support their claim`,
        record_id: r.id,
      });
    }
  }

  // High: Interpreter required but no language specified
  for (const r of rows) {
    if (
      r.interpreter_required &&
      (!r.interpreter_language || r.interpreter_language.trim().length === 0) &&
      r.status === "Active"
    ) {
      alerts.push({
        type: "interpreter_no_language",
        severity: "high",
        message: `${r.child_name} requires an interpreter but the language has not been recorded — this must be identified to ensure access to services, legal proceedings, and day-to-day communication`,
        record_id: r.id,
      });
    }
  }

  // High: No health screening completed
  for (const r of rows) {
    if (
      !r.health_screening_completed &&
      r.record_type === "Initial Assessment" &&
      r.status === "Active"
    ) {
      alerts.push({
        type: "no_health_screening",
        severity: "high",
        message: `${r.child_name} has not completed an initial health screening — UASC children often have undiagnosed health needs and screening should be completed within 28 days of arrival per Home Office UASC guidance 2023`,
        record_id: r.id,
      });
    }
  }

  // High: Not in education
  for (const r of rows) {
    if (
      r.education_provision === "Not in Education" &&
      r.status === "Active"
    ) {
      alerts.push({
        type: "not_in_education",
        severity: "high",
        message: `${r.child_name} is not in any form of education provision — all UASC children have a right to education under UNCRC Article 28 and a placement must be sought urgently`,
        record_id: r.id,
      });
    }
  }

  // High: Social worker not informed for vulnerability records
  for (const r of rows) {
    if (
      (VULNERABILITY_RECORD_TYPES as string[]).includes(r.record_type) &&
      !r.social_worker_informed &&
      r.status === "Active"
    ) {
      alerts.push({
        type: "vulnerability_sw_not_informed",
        severity: "high",
        message: `${r.child_name}: ${r.record_type} recorded but social worker not informed — social worker must be notified of all vulnerability-related assessments under Working Together 2023`,
        record_id: r.id,
      });
    }
  }

  // Medium: Cultural or religious needs not met
  for (const r of rows) {
    if (
      (!r.cultural_needs_met || !r.religious_needs_met) &&
      r.status === "Active"
    ) {
      const unmet = [];
      if (!r.cultural_needs_met) unmet.push("cultural");
      if (!r.religious_needs_met) unmet.push("religious");
      alerts.push({
        type: "unmet_cultural_religious",
        severity: "medium",
        message: `${r.child_name} has unmet ${unmet.join(" and ")} needs — CHR 2015 Reg 5 requires homes to meet children's individual cultural, linguistic, and religious needs`,
        record_id: r.id,
      });
    }
  }

  // Medium: Overdue reviews
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const r of rows) {
    if (r.next_review_date) {
      const reviewDate = new Date(r.next_review_date);
      if (reviewDate < today && r.status === "Active") {
        alerts.push({
          type: "overdue_review",
          severity: "medium",
          message: `${r.child_name}: review was due on ${r.next_review_date} and is now overdue — schedule promptly to maintain ongoing assessment of UASC needs`,
          record_id: r.id,
        });
      }
    }
  }

  // Medium: Awaiting education placement
  for (const r of rows) {
    if (
      r.education_provision === "Awaiting Placement" &&
      r.status === "Active"
    ) {
      alerts.push({
        type: "awaiting_education",
        severity: "medium",
        message: `${r.child_name} is awaiting an education placement — follow up with the local authority Virtual School Head to secure provision promptly per Children Act 1989`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateCaraInsights(
  rows: UascSupportRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const statusBreakdown = Object.entries(metrics.by_immigration_status)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => `${status}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_records} UASC support ${metrics.total_records === 1 ? "record" : "records"} ` +
      `across ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `Immigration statuses: ${statusBreakdown || "none recorded"}. ` +
      `Legal representation: ${metrics.legal_representation_rate}%. ` +
      `Interpreter required: ${metrics.interpreter_rate}%. ` +
      `Health screening: ${metrics.health_screening_rate}%. ` +
      `CAMHS support: ${metrics.camhs_rate}%. ` +
      `Age disputes: ${metrics.age_dispute_count}.`,
  );

  // Insight 2: Priority concerns
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    const educationBreakdown = Object.entries(metrics.by_education_provision)
      .filter(([, count]) => count > 0)
      .map(([prov, count]) => `${prov}: ${count}`)
      .join(", ");

    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority UASC alerts active. ` +
        `Trafficking indicators: ${metrics.trafficking_rate}%, NRM referred: ${metrics.nrm_rate}%. ` +
        `Cultural needs met: ${metrics.cultural_needs_met_rate}%, Religious needs met: ${metrics.religious_needs_met_rate}%. ` +
        `Education: ${educationBreakdown}. ` +
        `${metrics.overdue_review_count} overdue ${metrics.overdue_review_count === 1 ? "review" : "reviews"}.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority UASC alerts currently active. ` +
        `Social worker informed: ${metrics.social_worker_informed_rate}%. ` +
        `Cultural needs met: ${metrics.cultural_needs_met_rate}%, Religious needs met: ${metrics.religious_needs_met_rate}%. ` +
        `Continue regular reviews to ensure UASC children's evolving needs are met per CHR 2015 Reg 5 and UNCRC Articles 22 & 37.`,
    );
  }

  // Insight 3: Reflective safeguarding question
  if (metrics.trafficking_rate > 0 && metrics.nrm_rate === 0) {
    insights.push(
      `[reflect] Trafficking indicators have been identified in ${metrics.trafficking_rate}% of records ` +
        `but no NRM referrals have been made. Are staff confident in the NRM referral process ` +
        `under the Modern Slavery Act 2015? Every child with trafficking indicators must be ` +
        `referred to the NRM as a potential victim, regardless of immigration status. The ` +
        `home should ensure that all staff understand the duty to refer and the indicators ` +
        `of child trafficking, including labour exploitation, domestic servitude, and sexual exploitation.`,
    );
  } else if (metrics.legal_representation_rate < 100 && metrics.total_records > 0) {
    insights.push(
      `[reflect] Legal representation is at ${metrics.legal_representation_rate}%, below the expected ` +
        `100% for UASC children. All UASC children are entitled to legal aid for their ` +
        `immigration and asylum claims. Is the home proactively referring children to ` +
        `immigration solicitors specialising in children's cases? Are Solicitor Appointments ` +
        `being scheduled promptly after arrival? The Immigration Act 2016 and Home Office ` +
        `UASC guidance 2023 require that legal representation is secured as a priority.`,
    );
  } else if (metrics.cultural_needs_met_rate < 80 || metrics.religious_needs_met_rate < 80) {
    insights.push(
      `[reflect] Cultural needs met: ${metrics.cultural_needs_met_rate}%, Religious needs met: ` +
        `${metrics.religious_needs_met_rate}%. CHR 2015 Reg 5 requires the home to meet each ` +
        `child's individual cultural, linguistic, and religious needs. Are staff offering ` +
        `culturally appropriate food, facilitating religious observance, providing access to ` +
        `community and faith groups, and supporting children to maintain their cultural ` +
        `identity? Cultural needs reviews should be conducted regularly and should involve ` +
        `the child's views and wishes.`,
    );
  } else {
    insights.push(
      `[reflect] Are staff receiving regular training on the unique vulnerabilities and ` +
        `needs of UASC children, including the asylum process, trafficking awareness, ` +
        `Merton-compliant age assessments, the National Transfer Scheme, and the impact ` +
        `of pre-migration trauma? UASC children may have experienced war, persecution, ` +
        `trafficking, and loss — staff must be equipped to provide trauma-informed care ` +
        `and to advocate effectively for these children's rights under the UNCRC.`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listUascSupport(
  homeId: string,
  filters?: {
    recordType?: RecordType;
    immigrationStatus?: ImmigrationStatus;
    status?: Status;
    limit?: number;
  },
): Promise<ServiceResult<UascSupportRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_uasc_support") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.recordType) q = q.eq("record_type", filters.recordType);
  if (filters?.immigrationStatus) q = q.eq("immigration_status", filters.immigrationStatus);
  if (filters?.status) q = q.eq("status", filters.status);

  q = q.order("record_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getUascSupport(
  id: string,
): Promise<ServiceResult<UascSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_uasc_support") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createUascSupport(input: {
  homeId: string;
  childName: string;
  recordDate: string;
  workerName: string;
  recordType: RecordType;
  immigrationStatus: ImmigrationStatus;
  legalRepresentation?: boolean;
  solicitorName?: string | null;
  interpreterRequired?: boolean;
  interpreterLanguage?: string | null;
  ageAssessmentStatus?: AgeAssessmentStatus;
  traffickingIndicators?: boolean;
  nrmReferred?: boolean;
  educationProvision?: EducationProvision;
  healthScreeningCompleted?: boolean;
  mentalHealthSupport?: boolean;
  culturalNeedsMet?: boolean;
  religiousNeedsMet?: boolean;
  socialWorkerInformed?: boolean;
  nextReviewDate?: string | null;
  status?: Status;
  notes?: string | null;
}): Promise<ServiceResult<UascSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateUascSupport({
    childName: input.childName,
    recordDate: input.recordDate,
    workerName: input.workerName,
    recordType: input.recordType,
    immigrationStatus: input.immigrationStatus,
    ageAssessmentStatus: input.ageAssessmentStatus,
    educationProvision: input.educationProvision,
    solicitorName: input.solicitorName,
    interpreterRequired: input.interpreterRequired,
    interpreterLanguage: input.interpreterLanguage,
    legalRepresentation: input.legalRepresentation,
    traffickingIndicators: input.traffickingIndicators,
    nrmReferred: input.nrmReferred,
    nextReviewDate: input.nextReviewDate,
    status: input.status,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_uasc_support") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      record_date: input.recordDate,
      worker_name: input.workerName,
      record_type: input.recordType,
      immigration_status: input.immigrationStatus,
      legal_representation: input.legalRepresentation ?? false,
      solicitor_name: input.solicitorName ?? null,
      interpreter_required: input.interpreterRequired ?? false,
      interpreter_language: input.interpreterLanguage ?? null,
      age_assessment_status: input.ageAssessmentStatus ?? "Not Required",
      trafficking_indicators: input.traffickingIndicators ?? false,
      nrm_referred: input.nrmReferred ?? false,
      education_provision: input.educationProvision ?? "Awaiting Placement",
      health_screening_completed: input.healthScreeningCompleted ?? false,
      mental_health_support: input.mentalHealthSupport ?? false,
      cultural_needs_met: input.culturalNeedsMet ?? false,
      religious_needs_met: input.religiousNeedsMet ?? false,
      social_worker_informed: input.socialWorkerInformed ?? false,
      next_review_date: input.nextReviewDate ?? null,
      status: input.status ?? "Active",
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateUascSupport(
  id: string,
  updates: Partial<{
    childName: string;
    recordDate: string;
    workerName: string;
    recordType: RecordType;
    immigrationStatus: ImmigrationStatus;
    legalRepresentation: boolean;
    solicitorName: string | null;
    interpreterRequired: boolean;
    interpreterLanguage: string | null;
    ageAssessmentStatus: AgeAssessmentStatus;
    traffickingIndicators: boolean;
    nrmReferred: boolean;
    educationProvision: EducationProvision;
    healthScreeningCompleted: boolean;
    mentalHealthSupport: boolean;
    culturalNeedsMet: boolean;
    religiousNeedsMet: boolean;
    socialWorkerInformed: boolean;
    nextReviewDate: string | null;
    status: Status;
    notes: string | null;
  }>,
): Promise<ServiceResult<UascSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.recordDate !== undefined) mapped.record_date = updates.recordDate;
  if (updates.workerName !== undefined) mapped.worker_name = updates.workerName;
  if (updates.recordType !== undefined) mapped.record_type = updates.recordType;
  if (updates.immigrationStatus !== undefined) mapped.immigration_status = updates.immigrationStatus;
  if (updates.legalRepresentation !== undefined) mapped.legal_representation = updates.legalRepresentation;
  if (updates.solicitorName !== undefined) mapped.solicitor_name = updates.solicitorName;
  if (updates.interpreterRequired !== undefined) mapped.interpreter_required = updates.interpreterRequired;
  if (updates.interpreterLanguage !== undefined) mapped.interpreter_language = updates.interpreterLanguage;
  if (updates.ageAssessmentStatus !== undefined) mapped.age_assessment_status = updates.ageAssessmentStatus;
  if (updates.traffickingIndicators !== undefined) mapped.trafficking_indicators = updates.traffickingIndicators;
  if (updates.nrmReferred !== undefined) mapped.nrm_referred = updates.nrmReferred;
  if (updates.educationProvision !== undefined) mapped.education_provision = updates.educationProvision;
  if (updates.healthScreeningCompleted !== undefined) mapped.health_screening_completed = updates.healthScreeningCompleted;
  if (updates.mentalHealthSupport !== undefined) mapped.mental_health_support = updates.mentalHealthSupport;
  if (updates.culturalNeedsMet !== undefined) mapped.cultural_needs_met = updates.culturalNeedsMet;
  if (updates.religiousNeedsMet !== undefined) mapped.religious_needs_met = updates.religiousNeedsMet;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_uasc_support") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteUascSupport(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { error } = await (client.from("cs_uasc_support") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
