// ==============================================================================
// CARA -- EQUALITY, DIVERSITY & INCLUSION MONITORING SERVICE
// Tracks equality and diversity records including staff training, policy reviews,
// practice audits, discrimination complaints, hate crime incidents, inclusive
// practice examples, reasonable adjustments, accessibility reviews, cultural
// calendar events, diversity celebrations, and feedback from young people
// and staff.
//
// Covers: Staff equality training delivery, policy review scheduling,
// practice audit outcomes, discrimination complaint investigation and
// resolution, hate crime incident recording and escalation, inclusive
// practice documentation, reasonable adjustment tracking, accessibility
// reviews, cultural calendar event planning and delivery, diversity
// celebration coordination, young person feedback on equality experience,
// staff feedback on EDI practice, and external review findings.
//
// UK Regulatory Framework:
// Equality Act 2010 (9 protected characteristics),
// Public Sector Equality Duty s149,
// CHR 2015 Reg 5 (individual needs including disability, sexuality, gender identity),
// SCCIF: Leadership and management — "The home promotes equality and diversity.",
// UNCRC Article 2 (non-discrimination).
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const RECORD_TYPES = [
  "Staff Training",
  "Policy Review",
  "Practice Audit",
  "Complaint — Discrimination",
  "Incident — Hate Crime",
  "Inclusive Practice Example",
  "Reasonable Adjustment",
  "Accessibility Review",
  "Cultural Calendar Event",
  "Diversity Celebration",
  "Feedback — Young Person",
  "Feedback — Staff",
  "External Review",
] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

export const PROTECTED_CHARACTERISTICS = [
  "Age",
  "Disability",
  "Gender Reassignment",
  "Marriage/Civil Partnership",
  "Pregnancy/Maternity",
  "Race",
  "Religion/Belief",
  "Sex",
  "Sexual Orientation",
  "Multiple/Intersectional",
  "Not Specific",
] as const;
export type ProtectedCharacteristic = (typeof PROTECTED_CHARACTERISTICS)[number];

export const STATUSES = [
  "Recorded",
  "Under Investigation",
  "Action Taken",
  "Closed",
  "Escalated",
] as const;
export type Status = (typeof STATUSES)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const COMPLAINT_TYPES: RecordType[] = [
  "Complaint — Discrimination",
  "Incident — Hate Crime",
];

export const FEEDBACK_TYPES: RecordType[] = [
  "Feedback — Young Person",
  "Feedback — Staff",
];

export const POSITIVE_PRACTICE_TYPES: RecordType[] = [
  "Inclusive Practice Example",
  "Cultural Calendar Event",
  "Diversity Celebration",
];

// -- Label maps ---------------------------------------------------------------

export const RECORD_TYPE_LABELS: { type: RecordType; label: string }[] = [
  { type: "Staff Training", label: "Staff Training" },
  { type: "Policy Review", label: "Policy Review" },
  { type: "Practice Audit", label: "Practice Audit" },
  { type: "Complaint — Discrimination", label: "Complaint — Discrimination" },
  { type: "Incident — Hate Crime", label: "Incident — Hate Crime" },
  { type: "Inclusive Practice Example", label: "Inclusive Practice Example" },
  { type: "Reasonable Adjustment", label: "Reasonable Adjustment" },
  { type: "Accessibility Review", label: "Accessibility Review" },
  { type: "Cultural Calendar Event", label: "Cultural Calendar Event" },
  { type: "Diversity Celebration", label: "Diversity Celebration" },
  { type: "Feedback — Young Person", label: "Feedback — Young Person" },
  { type: "Feedback — Staff", label: "Feedback — Staff" },
  { type: "External Review", label: "External Review" },
];

export const PROTECTED_CHARACTERISTIC_LABELS: { characteristic: ProtectedCharacteristic; label: string }[] = [
  { characteristic: "Age", label: "Age" },
  { characteristic: "Disability", label: "Disability" },
  { characteristic: "Gender Reassignment", label: "Gender Reassignment" },
  { characteristic: "Marriage/Civil Partnership", label: "Marriage / Civil Partnership" },
  { characteristic: "Pregnancy/Maternity", label: "Pregnancy / Maternity" },
  { characteristic: "Race", label: "Race" },
  { characteristic: "Religion/Belief", label: "Religion / Belief" },
  { characteristic: "Sex", label: "Sex" },
  { characteristic: "Sexual Orientation", label: "Sexual Orientation" },
  { characteristic: "Multiple/Intersectional", label: "Multiple / Intersectional" },
  { characteristic: "Not Specific", label: "Not Specific" },
];

export const STATUS_LABELS: { status: Status; label: string }[] = [
  { status: "Recorded", label: "Recorded" },
  { status: "Under Investigation", label: "Under Investigation" },
  { status: "Action Taken", label: "Action Taken" },
  { status: "Closed", label: "Closed" },
  { status: "Escalated", label: "Escalated" },
];

// -- Row type -----------------------------------------------------------------

export interface EqualityDiversityMonitoringRow {
  id: string;
  home_id: string;
  record_date: string;
  recorder_name: string;
  record_type: RecordType;
  protected_characteristic: ProtectedCharacteristic;
  child_name: string | null;
  staff_name: string | null;
  description: string;
  positive_action_taken: string | null;
  barriers_identified: string | null;
  reasonable_adjustments_made: boolean;
  training_delivered: boolean;
  policy_updated: boolean;
  complaint_upheld: boolean | null;
  external_agency_involved: boolean;
  evidence_attached: boolean;
  review_date: string | null;
  status: Status;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateEqualityDiversityMonitoring(input: {
  recordDate?: string;
  recorderName?: string;
  recordType?: string;
  protectedCharacteristic?: string;
  childName?: string | null;
  staffName?: string | null;
  description?: string;
  complaintUpheld?: boolean | null;
  reviewDate?: string | null;
  status?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

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

  if (!input.recorderName || input.recorderName.trim().length === 0) {
    errors.push("Recorder name is required");
  }

  if (!input.recordType || !(RECORD_TYPES as readonly string[]).includes(input.recordType)) {
    errors.push(`Record type must be one of: ${RECORD_TYPES.join(", ")}`);
  }

  if (
    !input.protectedCharacteristic ||
    !(PROTECTED_CHARACTERISTICS as readonly string[]).includes(input.protectedCharacteristic)
  ) {
    errors.push(`Protected characteristic must be one of: ${PROTECTED_CHARACTERISTICS.join(", ")}`);
  }

  if (!input.description || input.description.trim().length === 0) {
    errors.push("Description is required");
  }

  if (input.status && !(STATUSES as readonly string[]).includes(input.status)) {
    errors.push(`Status must be one of: ${STATUSES.join(", ")}`);
  }

  // Business rule: complaint type must specify child or staff name
  if (
    input.recordType &&
    (COMPLAINT_TYPES as string[]).includes(input.recordType) &&
    (!input.childName || input.childName.trim().length === 0) &&
    (!input.staffName || input.staffName.trim().length === 0)
  ) {
    errors.push("Complaint or hate crime incident must specify the child name or staff name involved");
  }

  // Business rule: complaint_upheld should only be set for complaint types
  if (
    input.recordType &&
    !(COMPLAINT_TYPES as string[]).includes(input.recordType) &&
    input.complaintUpheld !== null &&
    input.complaintUpheld !== undefined
  ) {
    errors.push("Complaint upheld field should only be set for Complaint or Hate Crime record types");
  }

  // Business rule: hate crime should have specific protected characteristic
  if (
    input.recordType === "Incident — Hate Crime" &&
    input.protectedCharacteristic === "Not Specific"
  ) {
    errors.push("Hate crime incident must specify the targeted protected characteristic under the Equality Act 2010");
  }

  // Business rule: feedback types should specify who gave feedback
  if (
    input.recordType === "Feedback — Young Person" &&
    (!input.childName || input.childName.trim().length === 0)
  ) {
    errors.push("Young person feedback must specify the child name");
  }
  if (
    input.recordType === "Feedback — Staff" &&
    (!input.staffName || input.staffName.trim().length === 0)
  ) {
    errors.push("Staff feedback must specify the staff name");
  }

  // Business rule: review date must not be in the past
  if (input.reviewDate) {
    const revDate = new Date(input.reviewDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(revDate.getTime())) {
      errors.push("Review date must be a valid date");
    } else if (revDate < today) {
      errors.push("Review date should not be in the past");
    }
  }

  // Business rule: escalated status should have external agency involved or description of escalation path
  if (
    input.status === "Escalated" &&
    input.description &&
    input.description.trim().length < 20
  ) {
    errors.push("Escalated records require a detailed description of the escalation rationale (minimum 20 characters)");
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: EqualityDiversityMonitoringRow[],
): {
  total_records: number;
  by_record_type: Record<string, number>;
  by_protected_characteristic: Record<string, number>;
  complaint_count: number;
  upheld_rate: number;
  training_rate: number;
  policy_update_rate: number;
  reasonable_adjustment_rate: number;
  positive_practice_count: number;
  incident_count: number;
  by_status: Record<string, number>;
  young_person_feedback_count: number;
  staff_feedback_count: number;
} {
  const total = rows.length;

  // Record type breakdown
  const byRecordType: Record<string, number> = {};
  for (const rt of RECORD_TYPES) byRecordType[rt] = 0;
  for (const r of rows) byRecordType[r.record_type] = (byRecordType[r.record_type] || 0) + 1;

  // Protected characteristic breakdown
  const byCharacteristic: Record<string, number> = {};
  for (const pc of PROTECTED_CHARACTERISTICS) byCharacteristic[pc] = 0;
  for (const r of rows) byCharacteristic[r.protected_characteristic] = (byCharacteristic[r.protected_characteristic] || 0) + 1;

  // Status breakdown
  const byStatus: Record<string, number> = {};
  for (const s of STATUSES) byStatus[s] = 0;
  for (const r of rows) byStatus[r.status] = (byStatus[r.status] || 0) + 1;

  // Complaint count and upheld rate
  const complaints = rows.filter((r) => (COMPLAINT_TYPES as string[]).includes(r.record_type));
  const complaintCount = complaints.length;
  const complaintsWithUpheld = complaints.filter((r) => r.complaint_upheld !== null);
  const upheldRate = complaintsWithUpheld.length > 0
    ? Math.round((complaintsWithUpheld.filter((r) => r.complaint_upheld === true).length / complaintsWithUpheld.length) * 1000) / 10
    : 0;

  // Training rate (proportion of records where training was delivered)
  const trainingRate = total > 0
    ? Math.round((rows.filter((r) => r.training_delivered).length / total) * 1000) / 10
    : 0;

  // Policy update rate
  const policyUpdateRate = total > 0
    ? Math.round((rows.filter((r) => r.policy_updated).length / total) * 1000) / 10
    : 0;

  // Reasonable adjustment rate
  const reasonableAdjustmentRate = total > 0
    ? Math.round((rows.filter((r) => r.reasonable_adjustments_made).length / total) * 1000) / 10
    : 0;

  // Positive practice count
  const positivePracticeCount = rows.filter(
    (r) => (POSITIVE_PRACTICE_TYPES as string[]).includes(r.record_type),
  ).length;

  // Incident count (hate crime only)
  const incidentCount = rows.filter((r) => r.record_type === "Incident — Hate Crime").length;

  // Feedback counts
  const youngPersonFeedbackCount = rows.filter((r) => r.record_type === "Feedback — Young Person").length;
  const staffFeedbackCount = rows.filter((r) => r.record_type === "Feedback — Staff").length;

  return {
    total_records: total,
    by_record_type: byRecordType,
    by_protected_characteristic: byCharacteristic,
    complaint_count: complaintCount,
    upheld_rate: upheldRate,
    training_rate: trainingRate,
    policy_update_rate: policyUpdateRate,
    reasonable_adjustment_rate: reasonableAdjustmentRate,
    positive_practice_count: positivePracticeCount,
    incident_count: incidentCount,
    by_status: byStatus,
    young_person_feedback_count: youngPersonFeedbackCount,
    staff_feedback_count: staffFeedbackCount,
  };
}

export function computeAlerts(
  rows: EqualityDiversityMonitoringRow[],
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

  // Critical: Hate crime incident that has not been escalated or actioned
  for (const r of rows) {
    if (
      r.record_type === "Incident — Hate Crime" &&
      r.status !== "Action Taken" &&
      r.status !== "Closed" &&
      r.status !== "Escalated"
    ) {
      alerts.push({
        type: "hate_crime_not_actioned",
        severity: "critical",
        message: `Hate crime incident recorded on ${r.record_date} targeting ${r.protected_characteristic}: status is "${r.status}" — immediate investigation and action required per Equality Act 2010 and UNCRC Article 2`,
        record_id: r.id,
      });
    }
  }

  // Critical: Hate crime without external agency involvement
  for (const r of rows) {
    if (r.record_type === "Incident — Hate Crime" && !r.external_agency_involved) {
      alerts.push({
        type: "hate_crime_no_external_agency",
        severity: "critical",
        message: `Hate crime incident on ${r.record_date}: no external agency involved — consider police referral and local authority notification as required`,
        record_id: r.id,
      });
    }
  }

  // High: Discrimination complaint under investigation for extended period
  for (const r of rows) {
    if (
      r.record_type === "Complaint — Discrimination" &&
      r.status === "Under Investigation"
    ) {
      const recordDate = new Date(r.record_date);
      const now = new Date();
      const daysSince = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince > 28) {
        alerts.push({
          type: "complaint_prolonged_investigation",
          severity: "high",
          message: `Discrimination complaint from ${r.record_date} has been under investigation for ${daysSince} days — resolve promptly to meet Public Sector Equality Duty s149`,
          record_id: r.id,
        });
      }
    }
  }

  // High: Upheld complaint without policy update
  for (const r of rows) {
    if (
      (COMPLAINT_TYPES as string[]).includes(r.record_type) &&
      r.complaint_upheld === true &&
      !r.policy_updated
    ) {
      alerts.push({
        type: "upheld_complaint_no_policy_update",
        severity: "high",
        message: `Upheld ${r.record_type} from ${r.record_date}: policy has not been updated to prevent recurrence — review and update equality policies per Equality Act 2010`,
        record_id: r.id,
      });
    }
  }

  // High: Escalated record without external agency
  for (const r of rows) {
    if (r.status === "Escalated" && !r.external_agency_involved) {
      alerts.push({
        type: "escalated_no_external",
        severity: "high",
        message: `Record from ${r.record_date} is escalated but no external agency is involved — ensure appropriate external oversight per SCCIF leadership requirements`,
        record_id: r.id,
      });
    }
  }

  // Medium: Reasonable adjustment requested but barriers still identified
  for (const r of rows) {
    if (
      r.record_type === "Reasonable Adjustment" &&
      r.barriers_identified &&
      r.barriers_identified.trim().length > 0 &&
      !r.reasonable_adjustments_made
    ) {
      alerts.push({
        type: "barriers_no_adjustment",
        severity: "medium",
        message: `Barriers identified for ${r.child_name ?? r.staff_name ?? "individual"} on ${r.record_date} but reasonable adjustments not yet made — Equality Act 2010 requires reasonable adjustments for disabled persons`,
        record_id: r.id,
      });
    }
  }

  // Medium: Overdue review dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const r of rows) {
    if (r.review_date) {
      const revDate = new Date(r.review_date);
      if (revDate < today) {
        alerts.push({
          type: "overdue_review",
          severity: "medium",
          message: `${r.record_type} from ${r.record_date} was due for review on ${r.review_date} and is now overdue — schedule review promptly`,
          record_id: r.id,
        });
      }
    }
  }

  // Medium: No young person feedback recorded
  const ypFeedback = rows.filter((r) => r.record_type === "Feedback — Young Person");
  if (rows.length > 5 && ypFeedback.length === 0) {
    alerts.push({
      type: "no_yp_feedback",
      severity: "medium",
      message: "No young person feedback on equality and diversity has been recorded — actively seek children's views per UNCRC Article 2 and CHR 2015 Reg 5",
    });
  }

  return alerts;
}

export function generateCaraInsights(
  rows: EqualityDiversityMonitoringRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const typeBreakdown = Object.entries(metrics.by_record_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  const charBreakdown = Object.entries(metrics.by_protected_characteristic)
    .filter(([, count]) => count > 0)
    .map(([char, count]) => `${char}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_records} equality, diversity & inclusion ${metrics.total_records === 1 ? "record" : "records"}. ` +
      `Types: ${typeBreakdown || "none recorded"}. ` +
      `Protected characteristics: ${charBreakdown || "none specified"}. ` +
      `Complaints: ${metrics.complaint_count} (upheld rate: ${metrics.upheld_rate}%). ` +
      `Hate crime incidents: ${metrics.incident_count}. ` +
      `Positive practice examples: ${metrics.positive_practice_count}. ` +
      `Training delivery rate: ${metrics.training_rate}%. ` +
      `Policy update rate: ${metrics.policy_update_rate}%.`,
  );

  // Insight 2: Priority concerns or positive indicators
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority EDI alerts active. ` +
        `Reasonable adjustment rate: ${metrics.reasonable_adjustment_rate}%. ` +
        `Young person feedback: ${metrics.young_person_feedback_count}. ` +
        `Staff feedback: ${metrics.staff_feedback_count}. ` +
        `Records by status: ${Object.entries(metrics.by_status).filter(([, c]) => c > 0).map(([s, c]) => `${s}: ${c}`).join(", ")}.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority EDI alerts currently active. ` +
        `Reasonable adjustment rate: ${metrics.reasonable_adjustment_rate}%. ` +
        `Young person feedback count: ${metrics.young_person_feedback_count}. ` +
        `Staff feedback count: ${metrics.staff_feedback_count}. ` +
        `Continue promoting equality, diversity, and inclusion per Public Sector Equality Duty s149.`,
    );
  }

  // Insight 3: Reflective safeguarding question
  if (metrics.incident_count > 0 && metrics.training_rate < 50) {
    insights.push(
      `[reflect] There have been ${metrics.incident_count} hate crime ${metrics.incident_count === 1 ? "incident" : "incidents"} ` +
        `but training delivery rate is only ${metrics.training_rate}%. Is the home investing sufficiently in ` +
        `equality and diversity training for all staff? The Equality Act 2010 and CHR 2015 Reg 5 ` +
        `require that children's individual needs, including those relating to disability, sexuality, ` +
        `and gender identity, are understood and met. SCCIF leadership standards expect the home to ` +
        `actively promote equality and diversity through informed, well-trained staff teams.`,
    );
  } else if (metrics.complaint_count > 0 && metrics.upheld_rate > 50) {
    insights.push(
      `[reflect] ${metrics.complaint_count} discrimination ${metrics.complaint_count === 1 ? "complaint has" : "complaints have"} ` +
        `been recorded with an upheld rate of ${metrics.upheld_rate}%. What systemic factors may be ` +
        `contributing to discrimination within the home? Has a full equality impact assessment been ` +
        `conducted? The Public Sector Equality Duty s149 requires proactive steps to eliminate ` +
        `discrimination, advance equality of opportunity, and foster good relations between people ` +
        `with different protected characteristics.`,
    );
  } else if (metrics.young_person_feedback_count === 0 && metrics.total_records > 0) {
    insights.push(
      `[reflect] No feedback from young people on equality and diversity has been recorded. ` +
        `Are children and young people being actively consulted about their experience of equality, ` +
        `diversity, and inclusion in the home? UNCRC Article 2 guarantees the right to non-discrimination, ` +
        `and children's views on whether they feel respected, included, and free from prejudice are ` +
        `essential evidence for SCCIF inspections and for genuinely meeting Reg 5 individual needs.`,
    );
  } else {
    insights.push(
      `[reflect] How does the home ensure that equality, diversity, and inclusion are embedded in ` +
        `everyday practice rather than treated as a compliance exercise? Are cultural celebrations, ` +
        `religious observances, and identity-affirming practices part of the home's routine? Do staff ` +
        `feel confident challenging discriminatory language and behaviour? The Equality Act 2010 ` +
        `protections extend to all nine protected characteristics and the home should be able to ` +
        `evidence active promotion of each.`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    recordType?: RecordType;
    protectedCharacteristic?: ProtectedCharacteristic;
    status?: Status;
    limit?: number;
  },
): Promise<ServiceResult<EqualityDiversityMonitoringRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_equality_diversity_monitoring") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.recordType) q = q.eq("record_type", filters.recordType);
  if (filters?.protectedCharacteristic) q = q.eq("protected_characteristic", filters.protectedCharacteristic);
  if (filters?.status) q = q.eq("status", filters.status);

  q = q.order("record_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<EqualityDiversityMonitoringRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_equality_diversity_monitoring") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createRecord(input: {
  homeId: string;
  recordDate: string;
  recorderName: string;
  recordType: RecordType;
  protectedCharacteristic: ProtectedCharacteristic;
  childName?: string | null;
  staffName?: string | null;
  description: string;
  positiveActionTaken?: string | null;
  barriersIdentified?: string | null;
  reasonableAdjustmentsMade?: boolean;
  trainingDelivered?: boolean;
  policyUpdated?: boolean;
  complaintUpheld?: boolean | null;
  externalAgencyInvolved?: boolean;
  evidenceAttached?: boolean;
  reviewDate?: string | null;
  status?: Status;
  notes?: string | null;
}): Promise<ServiceResult<EqualityDiversityMonitoringRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateEqualityDiversityMonitoring({
    recordDate: input.recordDate,
    recorderName: input.recorderName,
    recordType: input.recordType,
    protectedCharacteristic: input.protectedCharacteristic,
    childName: input.childName,
    staffName: input.staffName,
    description: input.description,
    complaintUpheld: input.complaintUpheld,
    reviewDate: input.reviewDate,
    status: input.status,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_equality_diversity_monitoring") as SB)
    .insert({
      home_id: input.homeId,
      record_date: input.recordDate,
      recorder_name: input.recorderName,
      record_type: input.recordType,
      protected_characteristic: input.protectedCharacteristic,
      child_name: input.childName ?? null,
      staff_name: input.staffName ?? null,
      description: input.description,
      positive_action_taken: input.positiveActionTaken ?? null,
      barriers_identified: input.barriersIdentified ?? null,
      reasonable_adjustments_made: input.reasonableAdjustmentsMade ?? false,
      training_delivered: input.trainingDelivered ?? false,
      policy_updated: input.policyUpdated ?? false,
      complaint_upheld: input.complaintUpheld ?? null,
      external_agency_involved: input.externalAgencyInvolved ?? false,
      evidence_attached: input.evidenceAttached ?? false,
      review_date: input.reviewDate ?? null,
      status: input.status ?? "Recorded",
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
    recordDate: string;
    recorderName: string;
    recordType: RecordType;
    protectedCharacteristic: ProtectedCharacteristic;
    childName: string | null;
    staffName: string | null;
    description: string;
    positiveActionTaken: string | null;
    barriersIdentified: string | null;
    reasonableAdjustmentsMade: boolean;
    trainingDelivered: boolean;
    policyUpdated: boolean;
    complaintUpheld: boolean | null;
    externalAgencyInvolved: boolean;
    evidenceAttached: boolean;
    reviewDate: string | null;
    status: Status;
    notes: string | null;
  }>,
): Promise<ServiceResult<EqualityDiversityMonitoringRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.recordDate !== undefined) mapped.record_date = updates.recordDate;
  if (updates.recorderName !== undefined) mapped.recorder_name = updates.recorderName;
  if (updates.recordType !== undefined) mapped.record_type = updates.recordType;
  if (updates.protectedCharacteristic !== undefined) mapped.protected_characteristic = updates.protectedCharacteristic;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.staffName !== undefined) mapped.staff_name = updates.staffName;
  if (updates.description !== undefined) mapped.description = updates.description;
  if (updates.positiveActionTaken !== undefined) mapped.positive_action_taken = updates.positiveActionTaken;
  if (updates.barriersIdentified !== undefined) mapped.barriers_identified = updates.barriersIdentified;
  if (updates.reasonableAdjustmentsMade !== undefined) mapped.reasonable_adjustments_made = updates.reasonableAdjustmentsMade;
  if (updates.trainingDelivered !== undefined) mapped.training_delivered = updates.trainingDelivered;
  if (updates.policyUpdated !== undefined) mapped.policy_updated = updates.policyUpdated;
  if (updates.complaintUpheld !== undefined) mapped.complaint_upheld = updates.complaintUpheld;
  if (updates.externalAgencyInvolved !== undefined) mapped.external_agency_involved = updates.externalAgencyInvolved;
  if (updates.evidenceAttached !== undefined) mapped.evidence_attached = updates.evidenceAttached;
  if (updates.reviewDate !== undefined) mapped.review_date = updates.reviewDate;
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_equality_diversity_monitoring") as SB)
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

  const { error } = await (client.from("cs_equality_diversity_monitoring") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
