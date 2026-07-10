// ==============================================================================
// CARA -- IMMIGRATION STATUS & LEGAL SUPPORT SERVICE
// Tracks immigration status, legal proceedings, and support for looked-after
// children subject to immigration control including status updates, solicitor
// appointments, Home Office correspondence, biometric appointments, appeal
// hearings, tribunals, age assessments, travel document applications,
// citizenship applications, leave to remain applications, status decisions,
// support meetings, right to work checks, NI number applications, and
// emergency legal support.
//
// Covers: Legal representation verification, solicitor firm tracking, legal aid
// funding status, interpreter requirements and language needs, deadline
// management for time-critical applications and hearings, outcome recording,
// social worker notification, personal adviser involvement, emotional support
// provision, appointment scheduling, and case status tracking through the
// immigration system.
//
// UK Regulatory Framework:
// Immigration Act 2016, Nationality and Borders Act 2022,
// UNCRC Article 22 (refugee children),
// Home Office guidance on children subject to immigration control,
// CHR 2015 Reg 5 (meeting individual needs),
// SCCIF: Overall experiences — "The home supports children with immigration needs."
// ==============================================================================

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const RECORD_TYPES = [
  "Status Update",
  "Solicitor Appointment",
  "Home Office Correspondence",
  "Biometric Appointment",
  "Appeal Hearing",
  "Tribunal",
  "Age Assessment",
  "Travel Document Application",
  "Citizenship Application",
  "Leave to Remain Application",
  "Status Decision Received",
  "Support Meeting",
  "Right to Work Check",
  "NI Number Application",
  "Emergency Legal Support",
] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

export const IMMIGRATION_STATUSES = [
  "British Citizen",
  "Indefinite Leave to Remain",
  "Limited Leave to Remain",
  "Asylum Seeker",
  "Refugee Status",
  "Humanitarian Protection",
  "Discretionary Leave",
  "UASC Leave",
  "EEA Settled Status",
  "EEA Pre-Settled Status",
  "No Recourse to Public Funds",
  "Undocumented",
  "Age Disputed",
  "Pending Decision",
  "Appeal Pending",
  "Other",
] as const;
export type ImmigrationStatus = (typeof IMMIGRATION_STATUSES)[number];

export const CASE_STATUSES = [
  "Active",
  "Awaiting Decision",
  "Resolved",
  "Escalated",
  "Archived",
] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const URGENT_RECORD_TYPES: RecordType[] = [
  "Appeal Hearing",
  "Tribunal",
  "Emergency Legal Support",
  "Age Assessment",
  "Biometric Appointment",
];

export const LEGAL_PROCEEDING_TYPES: RecordType[] = [
  "Appeal Hearing",
  "Tribunal",
  "Solicitor Appointment",
  "Emergency Legal Support",
];

export const APPLICATION_TYPES: RecordType[] = [
  "Travel Document Application",
  "Citizenship Application",
  "Leave to Remain Application",
  "NI Number Application",
  "Right to Work Check",
];

export const PRECARIOUS_STATUSES: ImmigrationStatus[] = [
  "Asylum Seeker",
  "Undocumented",
  "Age Disputed",
  "Pending Decision",
  "Appeal Pending",
  "No Recourse to Public Funds",
];

export const SETTLED_STATUSES: ImmigrationStatus[] = [
  "British Citizen",
  "Indefinite Leave to Remain",
  "Refugee Status",
  "EEA Settled Status",
];

export const TIME_LIMITED_STATUSES: ImmigrationStatus[] = [
  "Limited Leave to Remain",
  "Humanitarian Protection",
  "Discretionary Leave",
  "UASC Leave",
  "EEA Pre-Settled Status",
];

// -- Label maps ---------------------------------------------------------------

export const RECORD_TYPE_LABELS: { type: RecordType; label: string }[] = [
  { type: "Status Update", label: "Status Update" },
  { type: "Solicitor Appointment", label: "Solicitor Appointment" },
  { type: "Home Office Correspondence", label: "Home Office Correspondence" },
  { type: "Biometric Appointment", label: "Biometric Appointment" },
  { type: "Appeal Hearing", label: "Appeal Hearing" },
  { type: "Tribunal", label: "Tribunal" },
  { type: "Age Assessment", label: "Age Assessment" },
  { type: "Travel Document Application", label: "Travel Document Application" },
  { type: "Citizenship Application", label: "Citizenship Application" },
  { type: "Leave to Remain Application", label: "Leave to Remain Application" },
  { type: "Status Decision Received", label: "Status Decision Received" },
  { type: "Support Meeting", label: "Support Meeting" },
  { type: "Right to Work Check", label: "Right to Work Check" },
  { type: "NI Number Application", label: "NI Number Application" },
  { type: "Emergency Legal Support", label: "Emergency Legal Support" },
];

export const IMMIGRATION_STATUS_LABELS: { status: ImmigrationStatus; label: string }[] = [
  { status: "British Citizen", label: "British Citizen" },
  { status: "Indefinite Leave to Remain", label: "Indefinite Leave to Remain (ILR)" },
  { status: "Limited Leave to Remain", label: "Limited Leave to Remain (LLR)" },
  { status: "Asylum Seeker", label: "Asylum Seeker" },
  { status: "Refugee Status", label: "Refugee Status" },
  { status: "Humanitarian Protection", label: "Humanitarian Protection" },
  { status: "Discretionary Leave", label: "Discretionary Leave" },
  { status: "UASC Leave", label: "UASC Leave" },
  { status: "EEA Settled Status", label: "EEA Settled Status" },
  { status: "EEA Pre-Settled Status", label: "EEA Pre-Settled Status" },
  { status: "No Recourse to Public Funds", label: "No Recourse to Public Funds (NRPF)" },
  { status: "Undocumented", label: "Undocumented" },
  { status: "Age Disputed", label: "Age Disputed" },
  { status: "Pending Decision", label: "Pending Decision" },
  { status: "Appeal Pending", label: "Appeal Pending" },
  { status: "Other", label: "Other" },
];

export const CASE_STATUS_LABELS: { status: CaseStatus; label: string }[] = [
  { status: "Active", label: "Active" },
  { status: "Awaiting Decision", label: "Awaiting Decision" },
  { status: "Resolved", label: "Resolved" },
  { status: "Escalated", label: "Escalated" },
  { status: "Archived", label: "Archived" },
];

// -- Row type -----------------------------------------------------------------

export interface ImmigrationLegalSupportRow {
  id: string;
  home_id: string;
  child_name: string;
  record_date: string;
  worker_name: string;
  record_type: RecordType;
  current_immigration_status: ImmigrationStatus;
  legal_representation: boolean;
  solicitor_firm: string | null;
  legal_aid_funded: boolean;
  interpreter_required: boolean;
  interpreter_language: string | null;
  deadline_date: string | null;
  action_required: string | null;
  outcome: string | null;
  social_worker_informed: boolean;
  personal_adviser_involved: boolean;
  emotional_support_provided: boolean;
  next_appointment_date: string | null;
  status: CaseStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateImmigrationLegalSupport(input: {
  childName?: string;
  recordDate?: string;
  workerName?: string;
  recordType?: string;
  currentImmigrationStatus?: string;
  legalRepresentation?: boolean;
  solicitorFirm?: string | null;
  legalAidFunded?: boolean;
  interpreterRequired?: boolean;
  interpreterLanguage?: string | null;
  deadlineDate?: string | null;
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
    }
  }

  if (!input.workerName || input.workerName.trim().length === 0) {
    errors.push("Worker name is required");
  }

  if (!input.recordType || !(RECORD_TYPES as readonly string[]).includes(input.recordType)) {
    errors.push(`Record type must be one of: ${RECORD_TYPES.join(", ")}`);
  }

  if (
    input.currentImmigrationStatus &&
    !(IMMIGRATION_STATUSES as readonly string[]).includes(input.currentImmigrationStatus)
  ) {
    errors.push(`Immigration status must be one of: ${IMMIGRATION_STATUSES.join(", ")}`);
  }

  if (input.status && !(CASE_STATUSES as readonly string[]).includes(input.status)) {
    errors.push(`Case status must be one of: ${CASE_STATUSES.join(", ")}`);
  }

  // Business rule: Legal representation is critical for appeal hearings and tribunals
  if (
    input.recordType &&
    (LEGAL_PROCEEDING_TYPES as string[]).includes(input.recordType) &&
    input.legalRepresentation === false
  ) {
    errors.push(
      `${input.recordType} recorded without legal representation — Immigration Act 2016 and UNCRC Article 22 require that children subject to immigration control have access to appropriate legal representation. The home must urgently arrange legal support for this child`,
    );
  }

  // Business rule: Solicitor firm should be recorded when legal representation exists
  if (
    input.legalRepresentation === true &&
    (!input.solicitorFirm || input.solicitorFirm.trim().length === 0)
  ) {
    // Advisory only — not a hard error as firm may be being arranged
  }

  // Business rule: Interpreter language must be specified if interpreter required
  if (
    input.interpreterRequired === true &&
    (!input.interpreterLanguage || input.interpreterLanguage.trim().length === 0)
  ) {
    errors.push(
      "Interpreter language must be specified when an interpreter is required — failure to provide appropriate interpretation can invalidate legal proceedings and violate the child's rights under UNCRC Article 12 (right to be heard)",
    );
  }

  // Business rule: Deadline date should not be in the past for active records
  if (input.deadlineDate && input.status && input.status === "Active") {
    const deadline = new Date(input.deadlineDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deadline < today) {
      errors.push(
        "Deadline date is in the past for an active case — if the deadline has passed, update the case status or record the outcome. Missed immigration deadlines can have severe consequences for the child's legal status",
      );
    }
  }

  // Business rule: Age assessment records require special handling
  if (input.recordType === "Age Assessment") {
    if (
      input.currentImmigrationStatus &&
      input.currentImmigrationStatus !== "Age Disputed" &&
      input.currentImmigrationStatus !== "Asylum Seeker" &&
      input.currentImmigrationStatus !== "Pending Decision"
    ) {
      // Advisory: age assessments are typically for those whose age is disputed
    }
  }

  // Business rule: Emergency legal support should be escalated
  if (input.recordType === "Emergency Legal Support" && input.status !== "Escalated") {
    // Advisory: emergency support typically requires escalation
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: ImmigrationLegalSupportRow[],
): {
  total_records: number;
  unique_children: number;
  by_record_type: Record<string, number>;
  by_immigration_status: Record<string, number>;
  by_case_status: Record<string, number>;
  legal_representation_rate: number;
  legal_aid_rate: number;
  interpreter_rate: number;
  active_cases: number;
  pending_decisions: number;
  deadline_within_30_days: number;
  emotional_support_rate: number;
  social_worker_informed_rate: number;
  personal_adviser_rate: number;
  precarious_status_count: number;
  settled_status_count: number;
  time_limited_status_count: number;
  urgent_record_count: number;
  application_count: number;
  average_records_per_child: number;
} {
  const total = rows.length;

  // Unique children
  const uniqueChildren = new Set(rows.map((r) => r.child_name.toLowerCase().trim()));

  // Record type breakdown
  const byRecordType: Record<string, number> = {};
  for (const rt of RECORD_TYPES) byRecordType[rt] = 0;
  for (const r of rows) byRecordType[r.record_type] = (byRecordType[r.record_type] || 0) + 1;

  // Immigration status breakdown
  const byImmigrationStatus: Record<string, number> = {};
  for (const is_ of IMMIGRATION_STATUSES) byImmigrationStatus[is_] = 0;
  for (const r of rows)
    byImmigrationStatus[r.current_immigration_status] =
      (byImmigrationStatus[r.current_immigration_status] || 0) + 1;

  // Case status breakdown
  const byCaseStatus: Record<string, number> = {};
  for (const cs of CASE_STATUSES) byCaseStatus[cs] = 0;
  for (const r of rows) byCaseStatus[r.status] = (byCaseStatus[r.status] || 0) + 1;

  // Boolean rates
  const legalRepRate = total > 0
    ? Math.round((rows.filter((r) => r.legal_representation).length / total) * 1000) / 10
    : 0;

  const legalAidRate = total > 0
    ? Math.round((rows.filter((r) => r.legal_aid_funded).length / total) * 1000) / 10
    : 0;

  const interpreterRate = total > 0
    ? Math.round((rows.filter((r) => r.interpreter_required).length / total) * 1000) / 10
    : 0;

  const emotionalSupportRate = total > 0
    ? Math.round((rows.filter((r) => r.emotional_support_provided).length / total) * 1000) / 10
    : 0;

  const socialWorkerRate = total > 0
    ? Math.round((rows.filter((r) => r.social_worker_informed).length / total) * 1000) / 10
    : 0;

  const personalAdviserRate = total > 0
    ? Math.round((rows.filter((r) => r.personal_adviser_involved).length / total) * 1000) / 10
    : 0;

  // Active cases and pending decisions
  const activeCases = rows.filter((r) => r.status === "Active" || r.status === "Escalated").length;
  const pendingDecisions = rows.filter((r) => r.status === "Awaiting Decision").length;

  // Deadline within 30 days
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const deadlineWithin30 = rows.filter((r) => {
    if (!r.deadline_date) return false;
    const deadline = new Date(r.deadline_date);
    return deadline >= now && deadline <= thirtyDaysFromNow && r.status !== "Resolved" && r.status !== "Archived";
  }).length;

  // Status category counts (using most recent record per child)
  const latestByChild = new Map<string, ImmigrationLegalSupportRow>();
  for (const r of rows) {
    const key = r.child_name.toLowerCase().trim();
    const existing = latestByChild.get(key);
    if (!existing || new Date(r.record_date) > new Date(existing.record_date)) {
      latestByChild.set(key, r);
    }
  }
  const latestRows = Array.from(latestByChild.values());

  const precariousCount = latestRows.filter(
    (r) => (PRECARIOUS_STATUSES as string[]).includes(r.current_immigration_status),
  ).length;

  const settledCount = latestRows.filter(
    (r) => (SETTLED_STATUSES as string[]).includes(r.current_immigration_status),
  ).length;

  const timeLimitedCount = latestRows.filter(
    (r) => (TIME_LIMITED_STATUSES as string[]).includes(r.current_immigration_status),
  ).length;

  // Urgent and application counts
  const urgentCount = rows.filter(
    (r) => (URGENT_RECORD_TYPES as string[]).includes(r.record_type),
  ).length;

  const applicationCount = rows.filter(
    (r) => (APPLICATION_TYPES as string[]).includes(r.record_type),
  ).length;

  // Average records per child
  const avgPerChild = uniqueChildren.size > 0
    ? Math.round((total / uniqueChildren.size) * 10) / 10
    : 0;

  return {
    total_records: total,
    unique_children: uniqueChildren.size,
    by_record_type: byRecordType,
    by_immigration_status: byImmigrationStatus,
    by_case_status: byCaseStatus,
    legal_representation_rate: legalRepRate,
    legal_aid_rate: legalAidRate,
    interpreter_rate: interpreterRate,
    active_cases: activeCases,
    pending_decisions: pendingDecisions,
    deadline_within_30_days: deadlineWithin30,
    emotional_support_rate: emotionalSupportRate,
    social_worker_informed_rate: socialWorkerRate,
    personal_adviser_rate: personalAdviserRate,
    precarious_status_count: precariousCount,
    settled_status_count: settledCount,
    time_limited_status_count: timeLimitedCount,
    urgent_record_count: urgentCount,
    application_count: applicationCount,
    average_records_per_child: avgPerChild,
  };
}

export function computeAlerts(
  rows: ImmigrationLegalSupportRow[],
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

  const now = new Date();

  // Critical: Legal proceedings without legal representation
  for (const r of rows) {
    if (
      (LEGAL_PROCEEDING_TYPES as string[]).includes(r.record_type) &&
      !r.legal_representation
    ) {
      alerts.push({
        type: "no_legal_representation_proceedings",
        severity: "critical",
        message: `${r.child_name} has a ${r.record_type} recorded on ${r.record_date} without legal representation — Immigration Act 2016 and UNCRC Article 22 require children subject to immigration control have access to legal representation. The home must urgently arrange a solicitor, particularly for appeal hearings and tribunals where the consequences of inadequate representation can be devastating`,
        record_id: r.id,
      });
    }
  }

  // Critical: Deadline within 7 days
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  for (const r of rows) {
    if (r.deadline_date && r.status !== "Resolved" && r.status !== "Archived") {
      const deadline = new Date(r.deadline_date);
      if (deadline >= now && deadline <= sevenDays) {
        const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        alerts.push({
          type: "deadline_imminent",
          severity: "critical",
          message: `${r.child_name} has an immigration deadline in ${daysLeft} day${daysLeft !== 1 ? "s" : ""} (${r.deadline_date}) for ${r.record_type} — missing immigration deadlines can result in the child becoming undocumented, losing appeal rights, or deportation. Immediate action required to ensure all documentation is submitted`,
          record_id: r.id,
        });
      }
    }
  }

  // Critical: Missed deadline
  for (const r of rows) {
    if (r.deadline_date && r.status !== "Resolved" && r.status !== "Archived") {
      const deadline = new Date(r.deadline_date);
      if (deadline < now) {
        alerts.push({
          type: "missed_deadline",
          severity: "critical",
          message: `${r.child_name} has a missed immigration deadline (${r.deadline_date}) for ${r.record_type} — missed deadlines in immigration cases can have irreversible consequences. Escalate immediately and seek emergency legal advice on whether late submission or fresh application is possible`,
          record_id: r.id,
        });
      }
    }
  }

  // Critical: Undocumented child without active support
  const latestByChild = new Map<string, ImmigrationLegalSupportRow>();
  for (const r of rows) {
    const key = r.child_name.toLowerCase().trim();
    const existing = latestByChild.get(key);
    if (!existing || new Date(r.record_date) > new Date(existing.record_date)) {
      latestByChild.set(key, r);
    }
  }
  for (const [, r] of latestByChild) {
    if (r.current_immigration_status === "Undocumented" && r.status !== "Active" && r.status !== "Escalated") {
      alerts.push({
        type: "undocumented_no_active_support",
        severity: "critical",
        message: `${r.child_name} has an immigration status of Undocumented with no active case — Nationality and Borders Act 2022 creates additional vulnerability for undocumented children. The home must urgently arrange legal representation to regularise the child's status and protect their rights`,
        record_id: r.id,
      });
    }
  }

  // Critical: Age-disputed child
  for (const [, r] of latestByChild) {
    if (r.current_immigration_status === "Age Disputed") {
      alerts.push({
        type: "age_disputed",
        severity: "critical",
        message: `${r.child_name} has an age-disputed immigration status — age disputes can result in children being placed in adult accommodation or detention. Ensure the child has independent legal representation and that any Merton-compliant age assessment is conducted fairly with appropriate adult support present`,
        record_id: r.id,
      });
    }
  }

  // High: Interpreter required but not provided for legal proceedings
  for (const r of rows) {
    if (
      r.interpreter_required &&
      !r.interpreter_language &&
      (LEGAL_PROCEEDING_TYPES as string[]).includes(r.record_type)
    ) {
      alerts.push({
        type: "interpreter_not_arranged",
        severity: "high",
        message: `${r.child_name} requires an interpreter for ${r.record_type} on ${r.record_date} but no interpreter language is specified — failure to provide appropriate interpretation violates UNCRC Article 12 (right to be heard) and can invalidate legal proceedings`,
        record_id: r.id,
      });
    }
  }

  // High: No emotional support provided for child in precarious status
  for (const r of rows) {
    if (
      (PRECARIOUS_STATUSES as string[]).includes(r.current_immigration_status) &&
      !r.emotional_support_provided
    ) {
      alerts.push({
        type: "no_emotional_support_precarious",
        severity: "high",
        message: `${r.child_name} has a precarious immigration status (${r.current_immigration_status}) and no emotional support was provided during ${r.record_type} on ${r.record_date} — children with uncertain immigration status experience significant anxiety and stress. CHR 2015 Reg 5 requires the home to meet individual emotional needs`,
        record_id: r.id,
      });
    }
  }

  // High: Social worker not informed for significant events
  for (const r of rows) {
    if (
      (URGENT_RECORD_TYPES as string[]).includes(r.record_type) &&
      !r.social_worker_informed
    ) {
      alerts.push({
        type: "social_worker_not_informed_urgent",
        severity: "high",
        message: `Social worker was not informed about ${r.record_type} for ${r.child_name} on ${r.record_date} — the allocated social worker must be kept informed of all significant immigration events under the care planning framework. This is essential for coordinated support and statutory oversight`,
        record_id: r.id,
      });
    }
  }

  // High: Time-limited leave without deadline tracking
  for (const [, r] of latestByChild) {
    if (
      (TIME_LIMITED_STATUSES as string[]).includes(r.current_immigration_status) &&
      !r.deadline_date &&
      r.status !== "Resolved" &&
      r.status !== "Archived"
    ) {
      alerts.push({
        type: "time_limited_no_deadline",
        severity: "high",
        message: `${r.child_name} has ${r.current_immigration_status} but no deadline date is recorded — time-limited leave expires and must be renewed. Failure to track and act on renewal deadlines can result in the child becoming undocumented. Record the leave expiry date and set up early renewal reminders`,
        record_id: r.id,
      });
    }
  }

  // High: No legal representation for any child with precarious status
  for (const [, r] of latestByChild) {
    if (
      (PRECARIOUS_STATUSES as string[]).includes(r.current_immigration_status) &&
      !r.legal_representation
    ) {
      alerts.push({
        type: "no_legal_rep_precarious",
        severity: "high",
        message: `${r.child_name} has a precarious immigration status (${r.current_immigration_status}) without legal representation — Home Office guidance on children subject to immigration control states that local authorities should ensure access to quality immigration legal advice. Arrange a specialist immigration solicitor urgently`,
        record_id: r.id,
      });
    }
  }

  // Medium: Deadline within 30 days
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  for (const r of rows) {
    if (r.deadline_date && r.status !== "Resolved" && r.status !== "Archived") {
      const deadline = new Date(r.deadline_date);
      if (deadline > sevenDays && deadline <= thirtyDays) {
        const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        alerts.push({
          type: "deadline_approaching",
          severity: "medium",
          message: `${r.child_name} has an immigration deadline in ${daysLeft} days (${r.deadline_date}) for ${r.record_type} — plan ahead to ensure all documentation, legal representation, and interpreter arrangements are in place before the deadline`,
          record_id: r.id,
        });
      }
    }
  }

  // Medium: Low emotional support across records
  const emotionalSupportCount = rows.filter((r) => r.emotional_support_provided).length;
  if (rows.length >= 5 && emotionalSupportCount / rows.length < 0.3) {
    alerts.push({
      type: "low_emotional_support",
      severity: "medium",
      message: `Emotional support was provided in only ${Math.round((emotionalSupportCount / rows.length) * 100)}% of immigration-related records — children subject to immigration control often experience significant stress, anxiety, and uncertainty. CHR 2015 Reg 5 requires the home to meet individual emotional needs. Consider embedding therapeutic or key-worker support into all immigration-related activities`,
    });
  }

  // Medium: Low personal adviser involvement for older children
  const personalAdviserCount = rows.filter((r) => r.personal_adviser_involved).length;
  if (rows.length >= 5 && personalAdviserCount / rows.length < 0.2) {
    alerts.push({
      type: "low_personal_adviser_involvement",
      severity: "medium",
      message: `Personal adviser involvement recorded in only ${Math.round((personalAdviserCount / rows.length) * 100)}% of immigration records — for care leavers and those approaching 18, personal advisers play a critical role in immigration support continuity. The Children (Leaving Care) Act 2000 requires pathway planning that addresses immigration status`,
    });
  }

  // Medium: Multiple children with NRPF status
  const nrpfChildren = Array.from(latestByChild.values()).filter(
    (r) => r.current_immigration_status === "No Recourse to Public Funds",
  );
  if (nrpfChildren.length >= 2) {
    alerts.push({
      type: "multiple_nrpf_children",
      severity: "medium",
      message: `${nrpfChildren.length} children have No Recourse to Public Funds status — NRPF creates additional complexity for care planning, leaving care support, and pathway planning. Ensure the home and placing authorities understand the implications and that specialist legal advice is available for each child`,
    });
  }

  return alerts;
}

export function generateCaraInsights(
  rows: ImmigrationLegalSupportRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const typeBreakdown = Object.entries(metrics.by_record_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  const statusBreakdown = Object.entries(metrics.by_immigration_status)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => `${status}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_records} immigration/legal support ${metrics.total_records === 1 ? "record" : "records"} ` +
      `for ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `Record types: ${typeBreakdown || "none recorded"}. ` +
      `Immigration statuses: ${statusBreakdown || "none"}. ` +
      `Active cases: ${metrics.active_cases}. ` +
      `Pending decisions: ${metrics.pending_decisions}. ` +
      `Deadlines within 30 days: ${metrics.deadline_within_30_days}. ` +
      `Legal representation rate: ${metrics.legal_representation_rate}%. ` +
      `Legal aid funded: ${metrics.legal_aid_rate}%. ` +
      `Interpreter required: ${metrics.interpreter_rate}%. ` +
      `Children in precarious status: ${metrics.precarious_status_count}. ` +
      `Children in settled status: ${metrics.settled_status_count}.`,
  );

  // Insight 2: Quality indicators and alerts
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts. ` +
        `Emotional support rate: ${metrics.emotional_support_rate}%. ` +
        `Social worker informed rate: ${metrics.social_worker_informed_rate}%. ` +
        `Personal adviser involvement: ${metrics.personal_adviser_rate}%. ` +
        `Urgent records: ${metrics.urgent_record_count}. ` +
        `Applications pending: ${metrics.application_count}. ` +
        `Children with time-limited leave: ${metrics.time_limited_status_count}. ` +
        `Average records per child: ${metrics.average_records_per_child}.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority immigration alerts. ` +
        `Emotional support rate: ${metrics.emotional_support_rate}%. ` +
        `Social worker informed rate: ${metrics.social_worker_informed_rate}%. ` +
        `Personal adviser involvement: ${metrics.personal_adviser_rate}%. ` +
        `Urgent records: ${metrics.urgent_record_count}. ` +
        `Applications pending: ${metrics.application_count}. ` +
        `Children with time-limited leave: ${metrics.time_limited_status_count}. ` +
        `Continue monitoring immigration deadlines and ensuring legal representation per Immigration Act 2016.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.precarious_status_count > 0 && metrics.legal_representation_rate < 80) {
    insights.push(
      `[reflect] ${metrics.precarious_status_count} ${metrics.precarious_status_count === 1 ? "child has" : "children have"} ` +
        `a precarious immigration status but legal representation rate is only ` +
        `${metrics.legal_representation_rate}%. The Nationality and Borders Act 2022 has ` +
        `created additional complexity in the immigration system, and children subject to ` +
        `immigration control are among the most vulnerable in the care system. Is the home ` +
        `doing enough to ensure every child has access to quality specialist immigration ` +
        `legal advice? Are solicitors OISC-registered and experienced in children's ` +
        `immigration cases? Is legal aid being claimed where eligible? For UASC and ` +
        `asylum-seeking children, the stakes are exceptionally high — inadequate legal ` +
        `support can result in removal from the UK.`,
    );
  } else if (metrics.deadline_within_30_days > 0) {
    insights.push(
      `[reflect] ${metrics.deadline_within_30_days} immigration ${metrics.deadline_within_30_days === 1 ? "deadline falls" : "deadlines fall"} ` +
        `within the next 30 days. Immigration deadlines are absolute — missing a deadline ` +
        `can result in a child losing appeal rights, becoming undocumented, or being ` +
        `subject to removal. Does the home have a robust system for tracking and ` +
        `escalating approaching deadlines? Are solicitors, social workers, and personal ` +
        `advisers all aware of upcoming deadlines? Is there a contingency plan if ` +
        `documentation is not ready in time? For children turning 18, the transition ` +
        `from UASC leave to adult immigration status requires particularly careful ` +
        `planning and timely action.`,
    );
  } else if (metrics.emotional_support_rate < 50 && metrics.total_records > 3) {
    insights.push(
      `[reflect] Emotional support is recorded in only ${metrics.emotional_support_rate}% of ` +
        `immigration-related records. The immigration process is inherently stressful ` +
        `for children — uncertainty about their future, fear of removal, separation ` +
        `from family, and the trauma of their journey to the UK. CHR 2015 Reg 5 ` +
        `requires the home to meet individual needs, and UNCRC Article 22 specifically ` +
        `protects refugee children's right to assistance and protection. Is the home ` +
        `embedding emotional support into every immigration-related interaction? Are ` +
        `key workers prepared for the conversations that follow adverse decisions? ` +
        `Is therapeutic support available for children experiencing immigration-related ` +
        `anxiety and distress?`,
    );
  } else {
    insights.push(
      `[reflect] How does the home prepare children for the different possible outcomes ` +
        `of their immigration cases? For children awaiting asylum decisions, status ` +
        `determinations, or appeal outcomes, the uncertainty can be overwhelming. ` +
        `SCCIF inspectors expect the home to support children with immigration needs ` +
        `holistically — not just legally, but emotionally and practically. Is the home ` +
        `helping children understand their rights under UNCRC Article 22? Are pathway ` +
        `plans being developed that account for different immigration outcomes? Is the ` +
        `home advocating effectively with the Home Office and local authority on behalf ` +
        `of each child? For children who receive negative decisions, is there a plan ` +
        `for immediate emotional support and legal next steps?`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    recordType?: RecordType;
    immigrationStatus?: ImmigrationStatus;
    status?: CaseStatus;
    limit?: number;
  },
): Promise<ServiceResult<ImmigrationLegalSupportRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_immigration_legal_support") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.recordType) q = q.eq("record_type", filters.recordType);
  if (filters?.immigrationStatus) q = q.eq("current_immigration_status", filters.immigrationStatus);
  if (filters?.status) q = q.eq("status", filters.status);

  q = q.order("record_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<ImmigrationLegalSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_immigration_legal_support") as SB)
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
  workerName: string;
  recordType: RecordType;
  currentImmigrationStatus?: ImmigrationStatus;
  legalRepresentation?: boolean;
  solicitorFirm?: string | null;
  legalAidFunded?: boolean;
  interpreterRequired?: boolean;
  interpreterLanguage?: string | null;
  deadlineDate?: string | null;
  actionRequired?: string | null;
  outcome?: string | null;
  socialWorkerInformed?: boolean;
  personalAdviserInvolved?: boolean;
  emotionalSupportProvided?: boolean;
  nextAppointmentDate?: string | null;
  status?: CaseStatus;
  notes?: string | null;
}): Promise<ServiceResult<ImmigrationLegalSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateImmigrationLegalSupport({
    childName: input.childName,
    recordDate: input.recordDate,
    workerName: input.workerName,
    recordType: input.recordType,
    currentImmigrationStatus: input.currentImmigrationStatus,
    legalRepresentation: input.legalRepresentation,
    solicitorFirm: input.solicitorFirm,
    legalAidFunded: input.legalAidFunded,
    interpreterRequired: input.interpreterRequired,
    interpreterLanguage: input.interpreterLanguage,
    deadlineDate: input.deadlineDate,
    status: input.status,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_immigration_legal_support") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      record_date: input.recordDate,
      worker_name: input.workerName,
      record_type: input.recordType,
      current_immigration_status: input.currentImmigrationStatus ?? "Pending Decision",
      legal_representation: input.legalRepresentation ?? false,
      solicitor_firm: input.solicitorFirm ?? null,
      legal_aid_funded: input.legalAidFunded ?? false,
      interpreter_required: input.interpreterRequired ?? false,
      interpreter_language: input.interpreterLanguage ?? null,
      deadline_date: input.deadlineDate ?? null,
      action_required: input.actionRequired ?? null,
      outcome: input.outcome ?? null,
      social_worker_informed: input.socialWorkerInformed ?? false,
      personal_adviser_involved: input.personalAdviserInvolved ?? false,
      emotional_support_provided: input.emotionalSupportProvided ?? false,
      next_appointment_date: input.nextAppointmentDate ?? null,
      status: input.status ?? "Active",
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
    workerName: string;
    recordType: RecordType;
    currentImmigrationStatus: ImmigrationStatus;
    legalRepresentation: boolean;
    solicitorFirm: string | null;
    legalAidFunded: boolean;
    interpreterRequired: boolean;
    interpreterLanguage: string | null;
    deadlineDate: string | null;
    actionRequired: string | null;
    outcome: string | null;
    socialWorkerInformed: boolean;
    personalAdviserInvolved: boolean;
    emotionalSupportProvided: boolean;
    nextAppointmentDate: string | null;
    status: CaseStatus;
    notes: string | null;
  }>,
): Promise<ServiceResult<ImmigrationLegalSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.recordDate !== undefined) mapped.record_date = updates.recordDate;
  if (updates.workerName !== undefined) mapped.worker_name = updates.workerName;
  if (updates.recordType !== undefined) mapped.record_type = updates.recordType;
  if (updates.currentImmigrationStatus !== undefined) mapped.current_immigration_status = updates.currentImmigrationStatus;
  if (updates.legalRepresentation !== undefined) mapped.legal_representation = updates.legalRepresentation;
  if (updates.solicitorFirm !== undefined) mapped.solicitor_firm = updates.solicitorFirm;
  if (updates.legalAidFunded !== undefined) mapped.legal_aid_funded = updates.legalAidFunded;
  if (updates.interpreterRequired !== undefined) mapped.interpreter_required = updates.interpreterRequired;
  if (updates.interpreterLanguage !== undefined) mapped.interpreter_language = updates.interpreterLanguage;
  if (updates.deadlineDate !== undefined) mapped.deadline_date = updates.deadlineDate;
  if (updates.actionRequired !== undefined) mapped.action_required = updates.actionRequired;
  if (updates.outcome !== undefined) mapped.outcome = updates.outcome;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.personalAdviserInvolved !== undefined) mapped.personal_adviser_involved = updates.personalAdviserInvolved;
  if (updates.emotionalSupportProvided !== undefined) mapped.emotional_support_provided = updates.emotionalSupportProvided;
  if (updates.nextAppointmentDate !== undefined) mapped.next_appointment_date = updates.nextAppointmentDate;
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_immigration_legal_support") as SB)
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

  const { error } = await (client.from("cs_immigration_legal_support") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
