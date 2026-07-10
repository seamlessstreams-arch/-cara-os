// ==============================================================================
// CARA -- HIGHER EDUCATION & FURTHER EDUCATION SUPPORT SERVICE
// Tracks HE/FE support for looked-after children and care leavers including
// UCAS applications, personal statement help, university visits, open days,
// taster sessions, student finance applications, bursary applications,
// accommodation planning, course research, interview preparation, results day
// support, freshers preparation, ongoing university support, college enrolment,
// apprenticeship applications, and T-Level support.
//
// Covers: UCAS application tracking, personal statement writing support,
// university/college visit coordination, open day and taster session attendance,
// student finance application support, care leaver bursary applications,
// accommodation securing for higher education, course research guidance,
// interview preparation sessions, results day support, freshers week
// preparation, ongoing university pastoral support, college enrolment
// assistance, apprenticeship exploration and applications, T-Level pathway
// support, personal adviser involvement, pathway plan updates, and social
// worker liaison.
//
// UK Regulatory Framework:
// CHR 2015 Reg 5 (development/independence),
// Children (Leaving Care) Act 2000 s24B (assistance with education/training),
// Children and Social Work Act 2017,
// DfE guidance on supporting care leavers into higher education 2023,
// SCCIF: Experiences and progress — "The home supports educational aspirations."
// UCAS/student finance support.
// ==============================================================================

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const RECORD_TYPES = [
  "UCAS Application Support",
  "Personal Statement Help",
  "University Visit",
  "Open Day",
  "Taster Session",
  "Student Finance Application",
  "Bursary Application",
  "Accommodation Planning",
  "Course Research",
  "Interview Preparation",
  "Results Day Support",
  "Freshers Preparation",
  "Ongoing University Support",
  "College Enrolment",
  "Apprenticeship Application",
  "T-Level Support",
] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

export const QUALIFICATION_LEVELS = [
  "Level 2",
  "Level 3 — A Level",
  "Level 3 — BTEC",
  "Level 3 — T-Level",
  "Level 4 — HNC",
  "Level 5 — HND/Foundation",
  "Level 6 — Degree",
  "Level 7 — Masters",
  "Apprenticeship — Intermediate",
  "Apprenticeship — Advanced",
  "Apprenticeship — Higher",
  "Apprenticeship — Degree",
  "Other",
] as const;
export type QualificationLevel = (typeof QUALIFICATION_LEVELS)[number];

export const APPLICATION_STATUSES = [
  "Exploring Options",
  "Applying",
  "Offer Received — Conditional",
  "Offer Received — Unconditional",
  "Firm Choice Made",
  "Enrolled",
  "Deferred",
  "Withdrawn",
  "Rejected",
  "Clearing",
  "Not Applicable",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const UCAS_TYPES: RecordType[] = [
  "UCAS Application Support",
  "Personal Statement Help",
  "Interview Preparation",
  "Results Day Support",
];

export const VISIT_TYPES: RecordType[] = [
  "University Visit",
  "Open Day",
  "Taster Session",
];

export const APPRENTICESHIP_TYPES: RecordType[] = [
  "Apprenticeship Application",
  "T-Level Support",
];

export const ACTIVE_APPLICATION_STATUSES: ApplicationStatus[] = [
  "Applying",
  "Offer Received — Conditional",
  "Offer Received — Unconditional",
  "Firm Choice Made",
  "Clearing",
];

// -- Label maps ---------------------------------------------------------------

export const RECORD_TYPE_LABELS: { type: RecordType; label: string }[] = [
  { type: "UCAS Application Support", label: "UCAS Application Support" },
  { type: "Personal Statement Help", label: "Personal Statement Help" },
  { type: "University Visit", label: "University Visit" },
  { type: "Open Day", label: "Open Day" },
  { type: "Taster Session", label: "Taster Session" },
  { type: "Student Finance Application", label: "Student Finance Application" },
  { type: "Bursary Application", label: "Bursary Application" },
  { type: "Accommodation Planning", label: "Accommodation Planning" },
  { type: "Course Research", label: "Course Research" },
  { type: "Interview Preparation", label: "Interview Preparation" },
  { type: "Results Day Support", label: "Results Day Support" },
  { type: "Freshers Preparation", label: "Freshers Preparation" },
  { type: "Ongoing University Support", label: "Ongoing University Support" },
  { type: "College Enrolment", label: "College Enrolment" },
  { type: "Apprenticeship Application", label: "Apprenticeship Application" },
  { type: "T-Level Support", label: "T-Level Support" },
];

export const QUALIFICATION_LEVEL_LABELS: { level: QualificationLevel; label: string }[] = [
  { level: "Level 2", label: "Level 2" },
  { level: "Level 3 — A Level", label: "Level 3 — A Level" },
  { level: "Level 3 — BTEC", label: "Level 3 — BTEC" },
  { level: "Level 3 — T-Level", label: "Level 3 — T-Level" },
  { level: "Level 4 — HNC", label: "Level 4 — HNC" },
  { level: "Level 5 — HND/Foundation", label: "Level 5 — HND/Foundation" },
  { level: "Level 6 — Degree", label: "Level 6 — Degree" },
  { level: "Level 7 — Masters", label: "Level 7 — Masters" },
  { level: "Apprenticeship — Intermediate", label: "Apprenticeship — Intermediate" },
  { level: "Apprenticeship — Advanced", label: "Apprenticeship — Advanced" },
  { level: "Apprenticeship — Higher", label: "Apprenticeship — Higher" },
  { level: "Apprenticeship — Degree", label: "Apprenticeship — Degree" },
  { level: "Other", label: "Other" },
];

export const APPLICATION_STATUS_LABELS: { status: ApplicationStatus; label: string }[] = [
  { status: "Exploring Options", label: "Exploring Options" },
  { status: "Applying", label: "Applying" },
  { status: "Offer Received — Conditional", label: "Offer Received — Conditional" },
  { status: "Offer Received — Unconditional", label: "Offer Received — Unconditional" },
  { status: "Firm Choice Made", label: "Firm Choice Made" },
  { status: "Enrolled", label: "Enrolled" },
  { status: "Deferred", label: "Deferred" },
  { status: "Withdrawn", label: "Withdrawn" },
  { status: "Rejected", label: "Rejected" },
  { status: "Clearing", label: "Clearing" },
  { status: "Not Applicable", label: "Not Applicable" },
];

// -- Row type -----------------------------------------------------------------

export interface HigherEducationSupportRow {
  id: string;
  home_id: string;
  young_person_name: string;
  record_date: string;
  supporting_staff: string;
  record_type: RecordType;
  institution_name: string | null;
  course_name: string | null;
  qualification_level: QualificationLevel;
  application_status: ApplicationStatus;
  student_finance_applied: boolean;
  bursary_applied: boolean;
  accommodation_secured: boolean;
  personal_adviser_involved: boolean;
  pathway_plan_updated: boolean;
  social_worker_informed: boolean;
  young_person_engaged: boolean;
  mentoring_in_place: boolean;
  next_milestone_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateHigherEducationSupport(input: {
  youngPersonName?: string;
  recordDate?: string;
  supportingStaff?: string;
  recordType?: string;
  institutionName?: string | null;
  courseName?: string | null;
  qualificationLevel?: string;
  applicationStatus?: string;
  nextMilestoneDate?: string | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.youngPersonName || input.youngPersonName.trim().length === 0) {
    errors.push("Young person name is required");
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

  if (!input.supportingStaff || input.supportingStaff.trim().length === 0) {
    errors.push("Supporting staff name is required");
  }

  if (!input.recordType || !(RECORD_TYPES as readonly string[]).includes(input.recordType)) {
    errors.push(`Record type must be one of: ${RECORD_TYPES.join(", ")}`);
  }

  if (
    input.qualificationLevel &&
    !(QUALIFICATION_LEVELS as readonly string[]).includes(input.qualificationLevel)
  ) {
    errors.push(`Qualification level must be one of: ${QUALIFICATION_LEVELS.join(", ")}`);
  }

  if (
    input.applicationStatus &&
    !(APPLICATION_STATUSES as readonly string[]).includes(input.applicationStatus)
  ) {
    errors.push(`Application status must be one of: ${APPLICATION_STATUSES.join(", ")}`);
  }

  // Business rule: UCAS types should have institution name or be at exploring stage
  if (
    input.recordType === "UCAS Application Support" &&
    input.applicationStatus !== "Exploring Options" &&
    input.applicationStatus !== "Not Applicable" &&
    (!input.institutionName || input.institutionName.trim().length === 0)
  ) {
    errors.push("UCAS application support beyond exploring options requires an institution name");
  }

  // Business rule: Enrolled status should have course name
  if (
    input.applicationStatus === "Enrolled" &&
    (!input.courseName || input.courseName.trim().length === 0)
  ) {
    errors.push("Enrolled status requires a course name to be specified");
  }

  // Business rule: University visit / open day should specify institution
  if (
    input.recordType &&
    (VISIT_TYPES as string[]).includes(input.recordType) &&
    (!input.institutionName || input.institutionName.trim().length === 0)
  ) {
    errors.push("University visits, open days, and taster sessions require an institution name");
  }

  // Business rule: Next milestone date should be in the future
  if (input.nextMilestoneDate) {
    const milestoneDate = new Date(input.nextMilestoneDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(milestoneDate.getTime())) {
      errors.push("Next milestone date must be a valid date");
    } else if (milestoneDate < today) {
      errors.push("Next milestone date should not be in the past");
    }
  }

  // Business rule: Apprenticeship types should have appropriate qualification level
  if (
    input.recordType &&
    (APPRENTICESHIP_TYPES as string[]).includes(input.recordType) &&
    input.qualificationLevel &&
    !input.qualificationLevel.startsWith("Apprenticeship") &&
    input.qualificationLevel !== "Level 3 — T-Level" &&
    input.qualificationLevel !== "Other"
  ) {
    errors.push("Apprenticeship or T-Level record types should use an apprenticeship or T-Level qualification level");
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: HigherEducationSupportRow[],
): {
  total_records: number;
  unique_young_people: number;
  by_record_type: Record<string, number>;
  by_qualification_level: Record<string, number>;
  by_application_status: Record<string, number>;
  finance_applied_rate: number;
  bursary_rate: number;
  accommodation_rate: number;
  pa_involvement_rate: number;
  pathway_plan_rate: number;
  engagement_rate: number;
  mentoring_rate: number;
  enrolled_count: number;
  offer_rate: number;
} {
  const total = rows.length;

  // Unique young people
  const uniqueYP = new Set(rows.map((r) => r.young_person_name.toLowerCase().trim()));

  // Record type breakdown
  const byRecordType: Record<string, number> = {};
  for (const rt of RECORD_TYPES) byRecordType[rt] = 0;
  for (const r of rows) byRecordType[r.record_type] = (byRecordType[r.record_type] || 0) + 1;

  // Qualification level breakdown
  const byQualLevel: Record<string, number> = {};
  for (const ql of QUALIFICATION_LEVELS) byQualLevel[ql] = 0;
  for (const r of rows) byQualLevel[r.qualification_level] = (byQualLevel[r.qualification_level] || 0) + 1;

  // Application status breakdown
  const byAppStatus: Record<string, number> = {};
  for (const as_ of APPLICATION_STATUSES) byAppStatus[as_] = 0;
  for (const r of rows) byAppStatus[r.application_status] = (byAppStatus[r.application_status] || 0) + 1;

  // Boolean rates
  const financeRate = total > 0
    ? Math.round((rows.filter((r) => r.student_finance_applied).length / total) * 1000) / 10
    : 0;

  const bursaryRate = total > 0
    ? Math.round((rows.filter((r) => r.bursary_applied).length / total) * 1000) / 10
    : 0;

  const accommodationRate = total > 0
    ? Math.round((rows.filter((r) => r.accommodation_secured).length / total) * 1000) / 10
    : 0;

  const paRate = total > 0
    ? Math.round((rows.filter((r) => r.personal_adviser_involved).length / total) * 1000) / 10
    : 0;

  const pathwayRate = total > 0
    ? Math.round((rows.filter((r) => r.pathway_plan_updated).length / total) * 1000) / 10
    : 0;

  const engagementRate = total > 0
    ? Math.round((rows.filter((r) => r.young_person_engaged).length / total) * 1000) / 10
    : 0;

  const mentoringRate = total > 0
    ? Math.round((rows.filter((r) => r.mentoring_in_place).length / total) * 1000) / 10
    : 0;

  // Enrolled count
  const enrolledCount = rows.filter((r) => r.application_status === "Enrolled").length;

  // Offer rate: proportion of those with an application who received an offer
  const applicants = rows.filter((r) =>
    r.application_status !== "Not Applicable" &&
    r.application_status !== "Exploring Options",
  );
  const offersReceived = applicants.filter((r) =>
    r.application_status === "Offer Received — Conditional" ||
    r.application_status === "Offer Received — Unconditional" ||
    r.application_status === "Firm Choice Made" ||
    r.application_status === "Enrolled" ||
    r.application_status === "Deferred",
  );
  const offerRate = applicants.length > 0
    ? Math.round((offersReceived.length / applicants.length) * 1000) / 10
    : 0;

  return {
    total_records: total,
    unique_young_people: uniqueYP.size,
    by_record_type: byRecordType,
    by_qualification_level: byQualLevel,
    by_application_status: byAppStatus,
    finance_applied_rate: financeRate,
    bursary_rate: bursaryRate,
    accommodation_rate: accommodationRate,
    pa_involvement_rate: paRate,
    pathway_plan_rate: pathwayRate,
    engagement_rate: engagementRate,
    mentoring_rate: mentoringRate,
    enrolled_count: enrolledCount,
    offer_rate: offerRate,
  };
}

export function computeAlerts(
  rows: HigherEducationSupportRow[],
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

  // Critical: Active application without personal adviser involvement
  for (const r of rows) {
    if (
      (ACTIVE_APPLICATION_STATUSES as string[]).includes(r.application_status) &&
      !r.personal_adviser_involved
    ) {
      alerts.push({
        type: "active_application_no_pa",
        severity: "critical",
        message: `${r.young_person_name} has an active application (${r.application_status}) but no personal adviser is involved — Children (Leaving Care) Act 2000 s24B requires the local authority to provide assistance with education and training`,
        record_id: r.id,
      });
    }
  }

  // Critical: Enrolled but student finance not applied
  for (const r of rows) {
    if (r.application_status === "Enrolled" && !r.student_finance_applied) {
      alerts.push({
        type: "enrolled_no_finance",
        severity: "critical",
        message: `${r.young_person_name} is enrolled at ${r.institution_name ?? "institution"} but student finance has not been applied for — care leavers are entitled to financial support per Children and Social Work Act 2017`,
        record_id: r.id,
      });
    }
  }

  // Critical: Enrolled but accommodation not secured
  for (const r of rows) {
    if (r.application_status === "Enrolled" && !r.accommodation_secured) {
      alerts.push({
        type: "enrolled_no_accommodation",
        severity: "critical",
        message: `${r.young_person_name} is enrolled but accommodation has not been secured — local authority has a duty to support care leavers with accommodation per Children (Leaving Care) Act 2000`,
        record_id: r.id,
      });
    }
  }

  // High: Active application without pathway plan update
  for (const r of rows) {
    if (
      (ACTIVE_APPLICATION_STATUSES as string[]).includes(r.application_status) &&
      !r.pathway_plan_updated
    ) {
      alerts.push({
        type: "application_no_pathway_plan",
        severity: "high",
        message: `${r.young_person_name} has an active application but pathway plan has not been updated — DfE guidance 2023 requires education plans to be reflected in the pathway plan`,
        record_id: r.id,
      });
    }
  }

  // High: Enrolled without care leaver bursary application
  for (const r of rows) {
    if (r.application_status === "Enrolled" && !r.bursary_applied) {
      alerts.push({
        type: "enrolled_no_bursary",
        severity: "high",
        message: `${r.young_person_name} is enrolled but has not applied for the care leaver bursary — ensure the young person is aware of and supported to access the care leaver bursary`,
        record_id: r.id,
      });
    }
  }

  // High: Young person not engaged
  for (const r of rows) {
    if (!r.young_person_engaged) {
      alerts.push({
        type: "young_person_disengaged",
        severity: "high",
        message: `${r.young_person_name} was recorded as not engaged during ${r.record_type} on ${r.record_date} — review approach and consider alternative strategies per CHR 2015 Reg 5 (development needs)`,
        record_id: r.id,
      });
    }
  }

  // High: Social worker not informed of application progress
  for (const r of rows) {
    if (
      (ACTIVE_APPLICATION_STATUSES as string[]).includes(r.application_status) &&
      !r.social_worker_informed
    ) {
      alerts.push({
        type: "sw_not_informed",
        severity: "high",
        message: `${r.young_person_name} has an active application (${r.application_status}) but social worker has not been informed — ensure multi-agency coordination per Care Planning Regulations 2010`,
        record_id: r.id,
      });
    }
  }

  // Medium: Overdue milestone dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const r of rows) {
    if (r.next_milestone_date) {
      const milestoneDate = new Date(r.next_milestone_date);
      if (milestoneDate < today) {
        alerts.push({
          type: "overdue_milestone",
          severity: "medium",
          message: `${r.young_person_name}: milestone for ${r.record_type} was due on ${r.next_milestone_date} and is now overdue — review and reschedule`,
          record_id: r.id,
        });
      }
    }
  }

  // Medium: No mentoring for enrolled young people
  for (const r of rows) {
    if (r.application_status === "Enrolled" && !r.mentoring_in_place) {
      alerts.push({
        type: "enrolled_no_mentoring",
        severity: "medium",
        message: `${r.young_person_name} is enrolled but has no mentoring in place — consider arranging a mentor to support retention per DfE guidance 2023`,
        record_id: r.id,
      });
    }
  }

  // Medium: Rejected application without follow-up record
  const rejectedYP = rows
    .filter((r) => r.application_status === "Rejected")
    .map((r) => r.young_person_name.toLowerCase().trim());
  const allYPNames = rows.map((r) => r.young_person_name.toLowerCase().trim());
  for (const name of new Set(rejectedYP)) {
    const records = rows.filter((r) => r.young_person_name.toLowerCase().trim() === name);
    const hasFollowUp = records.some(
      (r) =>
        r.application_status !== "Rejected" &&
        new Date(r.record_date) >= new Date(
          records.find((x) => x.application_status === "Rejected")!.record_date,
        ),
    );
    if (!hasFollowUp) {
      alerts.push({
        type: "rejection_no_followup",
        severity: "medium",
        message: `A young person received a rejection but no follow-up support record exists — ensure continued guidance and alternative pathway support per SCCIF expectations`,
      });
    }
  }

  return alerts;
}

export function generateCaraInsights(
  rows: HigherEducationSupportRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const typeBreakdown = Object.entries(metrics.by_record_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  const statusBreakdown = Object.entries(metrics.by_application_status)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => `${status}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_records} higher/further education support ${metrics.total_records === 1 ? "record" : "records"} ` +
      `for ${metrics.unique_young_people} young ${metrics.unique_young_people === 1 ? "person" : "people"}. ` +
      `Activities: ${typeBreakdown || "none recorded"}. ` +
      `Application statuses: ${statusBreakdown || "none tracked"}. ` +
      `Enrolled: ${metrics.enrolled_count}. Offer rate: ${metrics.offer_rate}%. ` +
      `Student finance applied: ${metrics.finance_applied_rate}%. ` +
      `Care leaver bursary applied: ${metrics.bursary_rate}%.`,
  );

  // Insight 2: Support quality indicators
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts. ` +
        `PA involvement: ${metrics.pa_involvement_rate}%. ` +
        `Pathway plan updated: ${metrics.pathway_plan_rate}%. ` +
        `Accommodation secured: ${metrics.accommodation_rate}%. ` +
        `Engagement rate: ${metrics.engagement_rate}%. ` +
        `Mentoring in place: ${metrics.mentoring_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority alerts. ` +
        `PA involvement: ${metrics.pa_involvement_rate}%. ` +
        `Pathway plan updated: ${metrics.pathway_plan_rate}%. ` +
        `Accommodation secured: ${metrics.accommodation_rate}%. ` +
        `Engagement rate: ${metrics.engagement_rate}%. ` +
        `Mentoring in place: ${metrics.mentoring_rate}%. ` +
        `Continue supporting educational aspirations per CHR 2015 Reg 5.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.enrolled_count > 0 && metrics.accommodation_rate < 50) {
    insights.push(
      `[reflect] ${metrics.enrolled_count} young ${metrics.enrolled_count === 1 ? "person is" : "people are"} enrolled ` +
        `but accommodation secured rate is only ${metrics.accommodation_rate}%. Are care leavers ` +
        `receiving adequate accommodation support? The Children (Leaving Care) Act 2000 places ` +
        `a duty on local authorities to assist with accommodation, and the DfE guidance 2023 ` +
        `emphasises that settled accommodation is critical to HE retention for care leavers.`,
    );
  } else if (metrics.pa_involvement_rate < 50 && metrics.total_records > 0) {
    insights.push(
      `[reflect] Personal adviser involvement is only ${metrics.pa_involvement_rate}% across ` +
        `${metrics.total_records} education support records. Are personal advisers being routinely ` +
        `engaged in education planning? The Children (Leaving Care) Act 2000 s24B requires that ` +
        `care leavers receive assistance with education and training, and the personal adviser ` +
        `is the key professional coordinating this support. SCCIF inspectors will expect evidence ` +
        `of proactive PA involvement in educational aspirations.`,
    );
  } else if (metrics.bursary_rate < 30 && metrics.enrolled_count > 0) {
    insights.push(
      `[reflect] Care leaver bursary application rate is only ${metrics.bursary_rate}%. ` +
        `Are all eligible young people being supported to apply for the care leaver bursary ` +
        `and other financial support? The Children and Social Work Act 2017 strengthened ` +
        `entitlements for care leavers, and the DfE guidance 2023 is clear that homes should ` +
        `actively support access to all available financial assistance for education.`,
    );
  } else {
    insights.push(
      `[reflect] How does the home ensure that every young person's educational aspirations are ` +
        `actively nurtured, regardless of their starting point? Are university visits, open days, ` +
        `and taster sessions offered to all young people or only those already considering HE? ` +
        `CHR 2015 Reg 5 requires homes to support development and independence, and SCCIF ` +
        `inspectors look for evidence that the home raises aspirations and broadens horizons ` +
        `for all children and young people, not just those on a traditional academic pathway.`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    recordType?: RecordType;
    qualificationLevel?: QualificationLevel;
    applicationStatus?: ApplicationStatus;
    limit?: number;
  },
): Promise<ServiceResult<HigherEducationSupportRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_higher_education_support") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.recordType) q = q.eq("record_type", filters.recordType);
  if (filters?.qualificationLevel) q = q.eq("qualification_level", filters.qualificationLevel);
  if (filters?.applicationStatus) q = q.eq("application_status", filters.applicationStatus);

  q = q.order("record_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<HigherEducationSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_higher_education_support") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createRecord(input: {
  homeId: string;
  youngPersonName: string;
  recordDate: string;
  supportingStaff: string;
  recordType: RecordType;
  institutionName?: string | null;
  courseName?: string | null;
  qualificationLevel?: QualificationLevel;
  applicationStatus?: ApplicationStatus;
  studentFinanceApplied?: boolean;
  bursaryApplied?: boolean;
  accommodationSecured?: boolean;
  personalAdviserInvolved?: boolean;
  pathwayPlanUpdated?: boolean;
  socialWorkerInformed?: boolean;
  youngPersonEngaged?: boolean;
  mentoringInPlace?: boolean;
  nextMilestoneDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<HigherEducationSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateHigherEducationSupport({
    youngPersonName: input.youngPersonName,
    recordDate: input.recordDate,
    supportingStaff: input.supportingStaff,
    recordType: input.recordType,
    institutionName: input.institutionName,
    courseName: input.courseName,
    qualificationLevel: input.qualificationLevel,
    applicationStatus: input.applicationStatus,
    nextMilestoneDate: input.nextMilestoneDate,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_higher_education_support") as SB)
    .insert({
      home_id: input.homeId,
      young_person_name: input.youngPersonName,
      record_date: input.recordDate,
      supporting_staff: input.supportingStaff,
      record_type: input.recordType,
      institution_name: input.institutionName ?? null,
      course_name: input.courseName ?? null,
      qualification_level: input.qualificationLevel ?? "Other",
      application_status: input.applicationStatus ?? "Not Applicable",
      student_finance_applied: input.studentFinanceApplied ?? false,
      bursary_applied: input.bursaryApplied ?? false,
      accommodation_secured: input.accommodationSecured ?? false,
      personal_adviser_involved: input.personalAdviserInvolved ?? false,
      pathway_plan_updated: input.pathwayPlanUpdated ?? false,
      social_worker_informed: input.socialWorkerInformed ?? false,
      young_person_engaged: input.youngPersonEngaged ?? true,
      mentoring_in_place: input.mentoringInPlace ?? false,
      next_milestone_date: input.nextMilestoneDate ?? null,
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
    youngPersonName: string;
    recordDate: string;
    supportingStaff: string;
    recordType: RecordType;
    institutionName: string | null;
    courseName: string | null;
    qualificationLevel: QualificationLevel;
    applicationStatus: ApplicationStatus;
    studentFinanceApplied: boolean;
    bursaryApplied: boolean;
    accommodationSecured: boolean;
    personalAdviserInvolved: boolean;
    pathwayPlanUpdated: boolean;
    socialWorkerInformed: boolean;
    youngPersonEngaged: boolean;
    mentoringInPlace: boolean;
    nextMilestoneDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<HigherEducationSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.youngPersonName !== undefined) mapped.young_person_name = updates.youngPersonName;
  if (updates.recordDate !== undefined) mapped.record_date = updates.recordDate;
  if (updates.supportingStaff !== undefined) mapped.supporting_staff = updates.supportingStaff;
  if (updates.recordType !== undefined) mapped.record_type = updates.recordType;
  if (updates.institutionName !== undefined) mapped.institution_name = updates.institutionName;
  if (updates.courseName !== undefined) mapped.course_name = updates.courseName;
  if (updates.qualificationLevel !== undefined) mapped.qualification_level = updates.qualificationLevel;
  if (updates.applicationStatus !== undefined) mapped.application_status = updates.applicationStatus;
  if (updates.studentFinanceApplied !== undefined) mapped.student_finance_applied = updates.studentFinanceApplied;
  if (updates.bursaryApplied !== undefined) mapped.bursary_applied = updates.bursaryApplied;
  if (updates.accommodationSecured !== undefined) mapped.accommodation_secured = updates.accommodationSecured;
  if (updates.personalAdviserInvolved !== undefined) mapped.personal_adviser_involved = updates.personalAdviserInvolved;
  if (updates.pathwayPlanUpdated !== undefined) mapped.pathway_plan_updated = updates.pathwayPlanUpdated;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.youngPersonEngaged !== undefined) mapped.young_person_engaged = updates.youngPersonEngaged;
  if (updates.mentoringInPlace !== undefined) mapped.mentoring_in_place = updates.mentoringInPlace;
  if (updates.nextMilestoneDate !== undefined) mapped.next_milestone_date = updates.nextMilestoneDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_higher_education_support") as SB)
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

  const { error } = await (client.from("cs_higher_education_support") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
