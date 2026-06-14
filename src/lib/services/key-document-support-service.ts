// ==============================================================================
// CARA -- NATIONAL INSURANCE & KEY DOCUMENT SUPPORT SERVICE
// Tracks support for care leavers and looked-after young people to obtain essential
// documents: birth certificates, passports, National Insurance numbers, provisional
// driving licences, proof of address, bank account setup, NHS/dental/GP registration,
// biometric residence permits, exam certificates, electoral roll registration, and
// other key documents needed for adult life.
//
// Covers: Document type and support stage tracking, document custody and location,
// cost and funding monitoring, young person engagement, personal adviser involvement,
// social worker notification, pathway plan linkage, deadline tracking, essential
// document coverage analysis, lost/missing document alerts, and completion rate
// monitoring.
//
// UK Regulatory Framework:
// CHR 2015 Reg 5 (independence preparation),
// Children (Leaving Care) Act 2000,
// DfE statutory guidance — care leavers must be supported to obtain essential documents,
// SCCIF: Experiences & progress — "Young people have the documents they need for
// adult life."
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const DOCUMENT_TYPES = [
  "Birth Certificate",
  "Passport",
  "National Insurance Number",
  "Provisional Driving Licence",
  "Proof of Address",
  "Bank Account Setup",
  "NHS Medical Card",
  "Dental Registration",
  "GP Registration",
  "Biometric Residence Permit",
  "Travel Document",
  "Right to Work Letter",
  "National Record of Achievement",
  "Exam Certificates",
  "School Records",
  "Care Leaver ID",
  "Utility Account Setup",
  "Phone Contract Support",
  "Electoral Roll Registration",
  "Other",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const SUPPORT_STAGES = [
  "Identified as Needed",
  "Application Started",
  "Supporting Documents Gathered",
  "Application Submitted",
  "Awaiting Decision",
  "Document Received",
  "Replacement Requested",
  "Renewal Due",
  "Complete",
  "Not Applicable",
] as const;
export type SupportStage = (typeof SUPPORT_STAGES)[number];

export const DOCUMENT_HOLDERS = [
  "Young Person",
  "Home — Secure Storage",
  "Social Worker",
  "Solicitor",
  "Home Office",
  "Lost/Missing",
  "Not Yet Obtained",
] as const;
export type DocumentHolder = (typeof DOCUMENT_HOLDERS)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const ESSENTIAL_DOCUMENTS: DocumentType[] = [
  "Birth Certificate",
  "National Insurance Number",
  "Bank Account Setup",
  "GP Registration",
];

export const IDENTITY_DOCUMENTS: DocumentType[] = [
  "Birth Certificate",
  "Passport",
  "Provisional Driving Licence",
  "Biometric Residence Permit",
  "Care Leaver ID",
];

export const HEALTH_DOCUMENTS: DocumentType[] = [
  "NHS Medical Card",
  "Dental Registration",
  "GP Registration",
];

export const EDUCATION_DOCUMENTS: DocumentType[] = [
  "National Record of Achievement",
  "Exam Certificates",
  "School Records",
];

export const FINANCIAL_DOCUMENTS: DocumentType[] = [
  "National Insurance Number",
  "Bank Account Setup",
  "Utility Account Setup",
  "Phone Contract Support",
];

export const ACTIVE_STAGES: SupportStage[] = [
  "Application Started",
  "Supporting Documents Gathered",
  "Application Submitted",
  "Awaiting Decision",
  "Replacement Requested",
];

export const COMPLETED_STAGES: SupportStage[] = [
  "Document Received",
  "Complete",
];

export const SECURE_HOLDERS: DocumentHolder[] = [
  "Young Person",
  "Home — Secure Storage",
  "Social Worker",
  "Solicitor",
];

// -- Label maps ---------------------------------------------------------------

export const DOCUMENT_TYPE_LABELS: { type: DocumentType; label: string }[] = [
  { type: "Birth Certificate", label: "Birth Certificate" },
  { type: "Passport", label: "Passport" },
  { type: "National Insurance Number", label: "National Insurance Number" },
  { type: "Provisional Driving Licence", label: "Provisional Driving Licence" },
  { type: "Proof of Address", label: "Proof of Address" },
  { type: "Bank Account Setup", label: "Bank Account Setup" },
  { type: "NHS Medical Card", label: "NHS Medical Card" },
  { type: "Dental Registration", label: "Dental Registration" },
  { type: "GP Registration", label: "GP Registration" },
  { type: "Biometric Residence Permit", label: "Biometric Residence Permit" },
  { type: "Travel Document", label: "Travel Document" },
  { type: "Right to Work Letter", label: "Right to Work Letter" },
  { type: "National Record of Achievement", label: "National Record of Achievement" },
  { type: "Exam Certificates", label: "Exam Certificates" },
  { type: "School Records", label: "School Records" },
  { type: "Care Leaver ID", label: "Care Leaver ID" },
  { type: "Utility Account Setup", label: "Utility Account Setup" },
  { type: "Phone Contract Support", label: "Phone Contract Support" },
  { type: "Electoral Roll Registration", label: "Electoral Roll Registration" },
  { type: "Other", label: "Other" },
];

export const SUPPORT_STAGE_LABELS: { stage: SupportStage; label: string }[] = [
  { stage: "Identified as Needed", label: "Identified as Needed" },
  { stage: "Application Started", label: "Application Started" },
  { stage: "Supporting Documents Gathered", label: "Supporting Documents Gathered" },
  { stage: "Application Submitted", label: "Application Submitted" },
  { stage: "Awaiting Decision", label: "Awaiting Decision" },
  { stage: "Document Received", label: "Document Received" },
  { stage: "Replacement Requested", label: "Replacement Requested" },
  { stage: "Renewal Due", label: "Renewal Due" },
  { stage: "Complete", label: "Complete" },
  { stage: "Not Applicable", label: "Not Applicable" },
];

export const DOCUMENT_HOLDER_LABELS: { holder: DocumentHolder; label: string }[] = [
  { holder: "Young Person", label: "Young Person" },
  { holder: "Home — Secure Storage", label: "Home — Secure Storage" },
  { holder: "Social Worker", label: "Social Worker" },
  { holder: "Solicitor", label: "Solicitor" },
  { holder: "Home Office", label: "Home Office" },
  { holder: "Lost/Missing", label: "Lost/Missing" },
  { holder: "Not Yet Obtained", label: "Not Yet Obtained" },
];

// -- Row type -----------------------------------------------------------------

export interface KeyDocumentSupportRow {
  id: string;
  home_id: string;
  young_person_name: string;
  record_date: string;
  supporting_staff: string;
  document_type: DocumentType;
  support_stage: SupportStage;
  document_held_by: DocumentHolder;
  cost: number | null;
  funded_by: string | null;
  young_person_engaged: boolean;
  personal_adviser_involved: boolean;
  social_worker_informed: boolean;
  pathway_plan_linked: boolean;
  deadline_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateKeyDocumentSupport(input: {
  youngPersonName?: string;
  recordDate?: string;
  supportingStaff?: string;
  documentType?: string;
  supportStage?: string;
  documentHeldBy?: string;
  cost?: number | null;
  deadlineDate?: string | null;
  youngPersonEngaged?: boolean;
  personalAdviserInvolved?: boolean;
  pathwayPlanLinked?: boolean;
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

  if (!input.documentType || !(DOCUMENT_TYPES as readonly string[]).includes(input.documentType)) {
    errors.push(`Document type must be one of: ${DOCUMENT_TYPES.join(", ")}`);
  }

  if (
    input.supportStage &&
    !(SUPPORT_STAGES as readonly string[]).includes(input.supportStage)
  ) {
    errors.push(`Support stage must be one of: ${SUPPORT_STAGES.join(", ")}`);
  }

  if (
    input.documentHeldBy &&
    !(DOCUMENT_HOLDERS as readonly string[]).includes(input.documentHeldBy)
  ) {
    errors.push(`Document held by must be one of: ${DOCUMENT_HOLDERS.join(", ")}`);
  }

  // Business rule: Cost should be non-negative
  if (input.cost !== undefined && input.cost !== null && input.cost < 0) {
    errors.push("Cost cannot be negative");
  }

  // Business rule: Deadline date should be in the future or recent past
  if (input.deadlineDate) {
    const deadline = new Date(input.deadlineDate);
    if (isNaN(deadline.getTime())) {
      errors.push("Deadline date must be a valid date");
    }
  }

  // Business rule: Essential documents should have pathway plan linkage
  if (
    input.documentType &&
    (ESSENTIAL_DOCUMENTS as string[]).includes(input.documentType) &&
    input.pathwayPlanLinked === false
  ) {
    // Advisory: essential documents should be tracked in the pathway plan
  }

  // Business rule: Lost/missing documents with no PA involvement
  if (
    input.documentHeldBy === "Lost/Missing" &&
    input.personalAdviserInvolved === false
  ) {
    // Advisory: PA should be involved when documents are lost or missing
  }

  // Business rule: Document marked complete but held by "Not Yet Obtained"
  if (
    input.supportStage === "Complete" &&
    input.documentHeldBy === "Not Yet Obtained"
  ) {
    errors.push(
      `Document support stage is marked as "Complete" but the document is listed as "Not Yet Obtained" — these statuses conflict. DfE statutory guidance requires that care leavers are actively supported to obtain essential documents. If the document has been obtained, update the holder field. If the document has not been obtained, the support stage should not be marked as complete`,
    );
  }

  // Business rule: Document received but no holder specified
  if (
    input.supportStage === "Document Received" &&
    input.documentHeldBy === "Not Yet Obtained"
  ) {
    errors.push(
      `Document has been received but holder is still "Not Yet Obtained" — update the holder to reflect where the document is being kept (Young Person, Home — Secure Storage, Social Worker, etc.)`,
    );
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: KeyDocumentSupportRow[],
): {
  total_records: number;
  by_document_type: Record<string, number>;
  by_support_stage: Record<string, number>;
  by_document_held_by: Record<string, number>;
  completion_rate: number;
  lost_missing_count: number;
  young_person_engagement_rate: number;
  personal_adviser_rate: number;
  social_worker_informed_rate: number;
  pathway_plan_rate: number;
  deadline_approaching_count: number;
  total_cost: number;
  unique_young_people: number;
  essential_documents_coverage: number;
  identity_document_count: number;
  health_document_count: number;
  education_document_count: number;
  financial_document_count: number;
  active_applications_count: number;
  average_documents_per_yp: number;
  secure_storage_rate: number;
  not_yet_obtained_count: number;
} {
  const total = rows.length;

  // Unique young people
  const uniqueYP = new Set(rows.map((r) => r.young_person_name.toLowerCase().trim()));

  // Document type breakdown
  const byDocumentType: Record<string, number> = {};
  for (const dt of DOCUMENT_TYPES) byDocumentType[dt] = 0;
  for (const r of rows) byDocumentType[r.document_type] = (byDocumentType[r.document_type] || 0) + 1;

  // Support stage breakdown
  const bySupportStage: Record<string, number> = {};
  for (const ss of SUPPORT_STAGES) bySupportStage[ss] = 0;
  for (const r of rows) bySupportStage[r.support_stage] = (bySupportStage[r.support_stage] || 0) + 1;

  // Document held by breakdown
  const byDocumentHeldBy: Record<string, number> = {};
  for (const dh of DOCUMENT_HOLDERS) byDocumentHeldBy[dh] = 0;
  for (const r of rows) byDocumentHeldBy[r.document_held_by] = (byDocumentHeldBy[r.document_held_by] || 0) + 1;

  // Completion rate
  const completedCount = rows.filter(
    (r) => (COMPLETED_STAGES as string[]).includes(r.support_stage),
  ).length;
  const completionRate = total > 0
    ? Math.round((completedCount / total) * 1000) / 10
    : 0;

  // Lost/missing count
  const lostMissing = rows.filter((r) => r.document_held_by === "Lost/Missing").length;

  // Boolean rates
  const engagementRate = total > 0
    ? Math.round((rows.filter((r) => r.young_person_engaged).length / total) * 1000) / 10
    : 0;

  const paRate = total > 0
    ? Math.round((rows.filter((r) => r.personal_adviser_involved).length / total) * 1000) / 10
    : 0;

  const swRate = total > 0
    ? Math.round((rows.filter((r) => r.social_worker_informed).length / total) * 1000) / 10
    : 0;

  const pathwayRate = total > 0
    ? Math.round((rows.filter((r) => r.pathway_plan_linked).length / total) * 1000) / 10
    : 0;

  // Deadline approaching count (within 30 days)
  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const deadlineApproaching = rows.filter((r) => {
    if (!r.deadline_date) return false;
    const deadline = new Date(r.deadline_date);
    return deadline >= now && deadline <= thirtyDays;
  }).length;

  // Total cost
  const totalCost = rows.reduce((sum, r) => sum + (r.cost ?? 0), 0);

  // Essential documents coverage — for each young person, what % of the 4 essential docs are complete?
  let essentialCoverage = 0;
  if (uniqueYP.size > 0) {
    let totalCoveredEssentials = 0;
    for (const yp of uniqueYP) {
      const ypRows = rows.filter((r) => r.young_person_name.toLowerCase().trim() === yp);
      const essentialComplete = ESSENTIAL_DOCUMENTS.filter((doc) =>
        ypRows.some(
          (r) =>
            r.document_type === doc &&
            (COMPLETED_STAGES as string[]).includes(r.support_stage),
        ),
      ).length;
      totalCoveredEssentials += essentialComplete;
    }
    essentialCoverage = Math.round(
      (totalCoveredEssentials / (uniqueYP.size * ESSENTIAL_DOCUMENTS.length)) * 1000,
    ) / 10;
  }

  // Category counts
  const identityCount = rows.filter(
    (r) => (IDENTITY_DOCUMENTS as string[]).includes(r.document_type),
  ).length;

  const healthCount = rows.filter(
    (r) => (HEALTH_DOCUMENTS as string[]).includes(r.document_type),
  ).length;

  const educationCount = rows.filter(
    (r) => (EDUCATION_DOCUMENTS as string[]).includes(r.document_type),
  ).length;

  const financialCount = rows.filter(
    (r) => (FINANCIAL_DOCUMENTS as string[]).includes(r.document_type),
  ).length;

  // Active applications
  const activeApplications = rows.filter(
    (r) => (ACTIVE_STAGES as string[]).includes(r.support_stage),
  ).length;

  // Average documents per young person
  const avgDocsPerYP = uniqueYP.size > 0
    ? Math.round((total / uniqueYP.size) * 10) / 10
    : 0;

  // Secure storage rate
  const secureCount = rows.filter(
    (r) => (SECURE_HOLDERS as string[]).includes(r.document_held_by),
  ).length;
  const secureRate = total > 0
    ? Math.round((secureCount / total) * 1000) / 10
    : 0;

  // Not yet obtained count
  const notObtained = rows.filter((r) => r.document_held_by === "Not Yet Obtained").length;

  return {
    total_records: total,
    by_document_type: byDocumentType,
    by_support_stage: bySupportStage,
    by_document_held_by: byDocumentHeldBy,
    completion_rate: completionRate,
    lost_missing_count: lostMissing,
    young_person_engagement_rate: engagementRate,
    personal_adviser_rate: paRate,
    social_worker_informed_rate: swRate,
    pathway_plan_rate: pathwayRate,
    deadline_approaching_count: deadlineApproaching,
    total_cost: Math.round(totalCost * 100) / 100,
    unique_young_people: uniqueYP.size,
    essential_documents_coverage: essentialCoverage,
    identity_document_count: identityCount,
    health_document_count: healthCount,
    education_document_count: educationCount,
    financial_document_count: financialCount,
    active_applications_count: activeApplications,
    average_documents_per_yp: avgDocsPerYP,
    secure_storage_rate: secureRate,
    not_yet_obtained_count: notObtained,
  };
}

export function computeAlerts(
  rows: KeyDocumentSupportRow[],
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

  // Critical: Essential document lost or missing
  for (const r of rows) {
    if (
      (ESSENTIAL_DOCUMENTS as string[]).includes(r.document_type) &&
      r.document_held_by === "Lost/Missing"
    ) {
      alerts.push({
        type: "essential_document_lost",
        severity: "critical",
        message: `${r.young_person_name}'s ${r.document_type} is recorded as Lost/Missing — this is one of the four essential documents (birth certificate, NI number, bank account, GP registration) that every care leaver needs for adult life. DfE statutory guidance requires that local authorities ensure care leavers have these documents. Urgent action is needed to obtain a replacement. The personal adviser and social worker must be informed immediately`,
        record_id: r.id,
      });
    }
  }

  // Critical: Young person approaching 18 without essential documents
  // (We check for young people with "Identified as Needed" or "Not Yet Obtained" for essentials)
  const uniqueYP = new Set(rows.map((r) => r.young_person_name.toLowerCase().trim()));
  for (const yp of uniqueYP) {
    const ypRows = rows.filter((r) => r.young_person_name.toLowerCase().trim() === yp);
    const missingEssentials = ESSENTIAL_DOCUMENTS.filter((doc) => {
      const docRows = ypRows.filter((r) => r.document_type === doc);
      if (docRows.length === 0) return true; // Not even tracked
      return docRows.every(
        (r) =>
          r.document_held_by === "Not Yet Obtained" ||
          r.document_held_by === "Lost/Missing" ||
          r.support_stage === "Identified as Needed",
      );
    });
    if (missingEssentials.length >= 2) {
      const displayName = ypRows[0]?.young_person_name ?? yp;
      alerts.push({
        type: "multiple_essential_docs_missing",
        severity: "critical",
        message: `${displayName} is missing ${missingEssentials.length} essential documents: ${missingEssentials.join(", ")} — DfE statutory guidance requires that care leavers have birth certificate, NI number, bank account, and GP registration before leaving care. These documents are fundamental to accessing employment, benefits, housing, and healthcare. A coordinated plan is needed to obtain these documents urgently`,
      });
    }
  }

  // Critical: Deadline passed without completion
  const now = new Date();
  for (const r of rows) {
    if (
      r.deadline_date &&
      new Date(r.deadline_date) < now &&
      !(COMPLETED_STAGES as string[]).includes(r.support_stage)
    ) {
      alerts.push({
        type: "deadline_passed",
        severity: "critical",
        message: `${r.young_person_name}'s ${r.document_type} had a deadline of ${r.deadline_date} which has passed without completion — current stage is "${r.support_stage}". Review what is blocking progress and escalate if necessary. Some documents (e.g. passports, BRP) have time-sensitive implications for the young person's rights and entitlements`,
        record_id: r.id,
      });
    }
  }

  // High: Identity documents not securely held
  for (const r of rows) {
    if (
      (IDENTITY_DOCUMENTS as string[]).includes(r.document_type) &&
      r.document_held_by !== "Young Person" &&
      r.document_held_by !== "Home — Secure Storage" &&
      r.document_held_by !== "Not Yet Obtained" &&
      (COMPLETED_STAGES as string[]).includes(r.support_stage)
    ) {
      alerts.push({
        type: "identity_doc_not_secure",
        severity: "high",
        message: `${r.young_person_name}'s ${r.document_type} is completed but held by "${r.document_held_by}" rather than the young person or in secure storage — identity documents should be either held by the young person (if age-appropriate and they wish to) or kept in the home's secure storage. The young person should know where their documents are and have access to them when needed`,
        record_id: r.id,
      });
    }
  }

  // High: Low PA involvement for essential documents
  const essentialRows = rows.filter(
    (r) => (ESSENTIAL_DOCUMENTS as string[]).includes(r.document_type),
  );
  const essentialPaCount = essentialRows.filter((r) => r.personal_adviser_involved).length;
  if (essentialRows.length >= 3 && essentialPaCount / essentialRows.length < 0.3) {
    alerts.push({
      type: "low_pa_essential_docs",
      severity: "high",
      message: `Personal adviser involved in only ${Math.round((essentialPaCount / essentialRows.length) * 100)}% of essential document support — the Children (Leaving Care) Act 2000 places a duty on the personal adviser to coordinate support for care leavers. Obtaining essential documents is a core PA responsibility and should be actively monitored in pathway plan reviews`,
    });
  }

  // High: Low pathway plan linkage
  const pathwayLinked = rows.filter((r) => r.pathway_plan_linked).length;
  if (rows.length >= 5 && pathwayLinked / rows.length < 0.3) {
    alerts.push({
      type: "low_pathway_plan_linkage",
      severity: "high",
      message: `Only ${Math.round((pathwayLinked / rows.length) * 100)}% of document support is linked to the pathway plan — DfE statutory guidance requires that the pathway plan sets out how the young person will be supported to obtain essential documents. Without pathway plan linkage, document support may not be reviewed at statutory reviews and gaps may not be identified`,
    });
  }

  // High: Multiple documents in "Identified as Needed" with no progress
  for (const yp of uniqueYP) {
    const ypRows = rows.filter((r) => r.young_person_name.toLowerCase().trim() === yp);
    const stuckIdentified = ypRows.filter((r) => r.support_stage === "Identified as Needed");
    if (stuckIdentified.length >= 3) {
      const displayName = ypRows[0]?.young_person_name ?? yp;
      alerts.push({
        type: "multiple_identified_no_progress",
        severity: "high",
        message: `${displayName} has ${stuckIdentified.length} documents stuck at "Identified as Needed" with no progress — documents identified as needed should move to "Application Started" within a reasonable timeframe. What is blocking progress? Are there cost barriers, complexity issues, or is the young person not being actively supported to begin the process?`,
      });
    }
  }

  // High: Deadline approaching within 14 days
  const fourteenDays = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  for (const r of rows) {
    if (
      r.deadline_date &&
      new Date(r.deadline_date) >= now &&
      new Date(r.deadline_date) <= fourteenDays &&
      !(COMPLETED_STAGES as string[]).includes(r.support_stage)
    ) {
      alerts.push({
        type: "deadline_approaching",
        severity: "high",
        message: `${r.young_person_name}'s ${r.document_type} has a deadline of ${r.deadline_date} (within 14 days) and is currently at stage "${r.support_stage}" — escalate to ensure the deadline is met. If the deadline cannot be met, inform the young person and plan next steps`,
        record_id: r.id,
      });
    }
  }

  // Medium: Low engagement rate
  const engagedCount = rows.filter((r) => r.young_person_engaged).length;
  if (rows.length >= 5 && engagedCount / rows.length < 0.5) {
    alerts.push({
      type: "low_engagement",
      severity: "medium",
      message: `Young person engagement rate is only ${Math.round((engagedCount / rows.length) * 100)}% for document support — obtaining key documents requires the young person's participation (signatures, photos, attending appointments). Low engagement may indicate the young person does not understand the importance of these documents, feels overwhelmed by bureaucracy, or needs more support. Are staff explaining why each document matters in practical terms?`,
    });
  }

  // Medium: No health documents tracked
  const healthDocs = rows.filter(
    (r) => (HEALTH_DOCUMENTS as string[]).includes(r.document_type),
  );
  if (rows.length >= 5 && healthDocs.length === 0) {
    alerts.push({
      type: "no_health_documents",
      severity: "medium",
      message: `No health document support recorded (NHS card, dental registration, GP registration) — care leavers are at higher risk of health inequalities. DfE guidance requires that young people are registered with a GP and dentist before leaving care. Health document support should be tracked alongside identity and financial documents`,
    });
  }

  // Medium: No education documents tracked
  const eduDocs = rows.filter(
    (r) => (EDUCATION_DOCUMENTS as string[]).includes(r.document_type),
  );
  if (rows.length >= 5 && eduDocs.length === 0) {
    alerts.push({
      type: "no_education_documents",
      severity: "medium",
      message: `No education document support recorded (exam certificates, school records, NRA) — care leavers need their educational records for employment and further education applications. These documents can be difficult to obtain after leaving care, so securing them while the young person is still looked after is essential`,
    });
  }

  // Medium: Low social worker informed rate
  const swCount = rows.filter((r) => r.social_worker_informed).length;
  if (rows.length >= 5 && swCount / rows.length < 0.3) {
    alerts.push({
      type: "low_sw_informed",
      severity: "medium",
      message: `Social worker informed for only ${Math.round((swCount / rows.length) * 100)}% of document support activities — the social worker needs to know the status of essential documents as this feeds into care planning and statutory reviews. Document readiness is a key indicator of preparation for independence`,
    });
  }

  // Medium: Documents held by Home Office with no progress
  const homeOfficeHeld = rows.filter(
    (r) => r.document_held_by === "Home Office" && !(COMPLETED_STAGES as string[]).includes(r.support_stage),
  );
  if (homeOfficeHeld.length > 0) {
    alerts.push({
      type: "home_office_documents_pending",
      severity: "medium",
      message: `${homeOfficeHeld.length} document${homeOfficeHeld.length === 1 ? " is" : "s are"} held by the Home Office with pending status — ensure that the home is tracking progress with immigration solicitors where relevant and that the young person understands the timeline. BRP and travel document delays can significantly impact a young person's access to employment and services`,
    });
  }

  return alerts;
}

export function generateCaraInsights(
  rows: KeyDocumentSupportRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const typeBreakdown = Object.entries(metrics.by_document_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  const stageBreakdown = Object.entries(metrics.by_support_stage)
    .filter(([, count]) => count > 0)
    .map(([stage, count]) => `${stage}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_records} key document support ${metrics.total_records === 1 ? "record" : "records"} ` +
      `for ${metrics.unique_young_people} young ${metrics.unique_young_people === 1 ? "person" : "people"}. ` +
      `Documents: ${typeBreakdown || "none recorded"}. ` +
      `Stages: ${stageBreakdown || "none"}. ` +
      `Completion rate: ${metrics.completion_rate}%. ` +
      `Essential documents coverage: ${metrics.essential_documents_coverage}%. ` +
      `Lost/missing: ${metrics.lost_missing_count}. ` +
      `Active applications: ${metrics.active_applications_count}. ` +
      `Total cost: £${metrics.total_cost.toFixed(2)}. ` +
      `Average documents per young person: ${metrics.average_documents_per_yp}. ` +
      `Deadlines approaching (30 days): ${metrics.deadline_approaching_count}. ` +
      `Engagement rate: ${metrics.young_person_engagement_rate}%.`,
  );

  // Insight 2: Quality indicators and alerts
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts. ` +
        `PA involvement: ${metrics.personal_adviser_rate}%. ` +
        `Pathway plan linked: ${metrics.pathway_plan_rate}%. ` +
        `Social worker informed: ${metrics.social_worker_informed_rate}%. ` +
        `Secure storage rate: ${metrics.secure_storage_rate}%. ` +
        `Not yet obtained: ${metrics.not_yet_obtained_count}. ` +
        `Identity documents: ${metrics.identity_document_count}. ` +
        `Health documents: ${metrics.health_document_count}. ` +
        `Education documents: ${metrics.education_document_count}. ` +
        `Financial documents: ${metrics.financial_document_count}.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority document support alerts. ` +
        `PA involvement: ${metrics.personal_adviser_rate}%. ` +
        `Pathway plan linked: ${metrics.pathway_plan_rate}%. ` +
        `Social worker informed: ${metrics.social_worker_informed_rate}%. ` +
        `Secure storage rate: ${metrics.secure_storage_rate}%. ` +
        `Not yet obtained: ${metrics.not_yet_obtained_count}. ` +
        `Identity documents: ${metrics.identity_document_count}. ` +
        `Health documents: ${metrics.health_document_count}. ` +
        `Education documents: ${metrics.education_document_count}. ` +
        `Financial documents: ${metrics.financial_document_count}. ` +
        `Continue supporting document readiness per DfE statutory guidance.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.essential_documents_coverage < 50 && metrics.unique_young_people > 0 && metrics.total_records > 3) {
    insights.push(
      `[reflect] Essential documents coverage is only ${metrics.essential_documents_coverage}% — ` +
        `this means fewer than half of the four essential documents (birth certificate, ` +
        `NI number, bank account, GP registration) are complete across the young people ` +
        `tracked. These are the documents that DfE statutory guidance identifies as the ` +
        `minimum a care leaver needs for adult life. Without a birth certificate, a young ` +
        `person cannot prove their identity. Without an NI number, they cannot work or ` +
        `claim benefits. Without a bank account, they cannot receive wages or housing ` +
        `benefit. Without a GP, they have no primary healthcare. Is the home treating ` +
        `document readiness as a genuine priority, or has it become a box-ticking ` +
        `exercise that slips down the to-do list?`,
    );
  } else if (metrics.lost_missing_count > 0 && metrics.total_records > 3) {
    insights.push(
      `[reflect] ${metrics.lost_missing_count} document${metrics.lost_missing_count === 1 ? " is" : "s are"} ` +
        `recorded as lost or missing. For care leavers, losing a document is not just ` +
        `an inconvenience — it can mean being unable to start a job, open a bank ` +
        `account, or register with a GP. Many care leavers have experienced multiple ` +
        `placement moves where documents were lost in transit. The home has a corporate ` +
        `parenting duty to safeguard these documents. Is the home's secure storage ` +
        `system adequate? Are documents being properly tracked through placement changes? ` +
        `DfE guidance expects that the home holds essential documents securely and ` +
        `supports young people to access them when needed.`,
    );
  } else if (metrics.young_person_engagement_rate < 60 && metrics.total_records > 5) {
    insights.push(
      `[reflect] Engagement rate is ${metrics.young_person_engagement_rate}% for document ` +
        `support. Many care leavers do not understand the bureaucratic importance of ` +
        `documents until they need them — and by then it may be too late for easy ` +
        `application. Is the home making document readiness feel relevant and urgent ` +
        `rather than abstract? Are young people shown real examples of when they will ` +
        `need each document? Is the process being broken into manageable steps rather ` +
        `than presented as an overwhelming list? SCCIF inspectors look for evidence ` +
        `that young people understand what documents they need and are actively ` +
        `participating in obtaining them.`,
    );
  } else {
    insights.push(
      `[reflect] How confident is the home that every young person approaching 18 has ` +
        `a complete set of essential documents? DfE statutory guidance sets a clear ` +
        `expectation: by the time a young person leaves care, they should have their ` +
        `birth certificate, NI number, bank account, and GP registration at minimum. ` +
        `In practice, many care leavers leave without these basics — and the ` +
        `consequences cascade through every area of their adult life. Does the home ` +
        `have a systematic document readiness checklist that is reviewed at every ` +
        `pathway plan meeting? Are gaps identified early enough to allow time for ` +
        `applications and replacements? Is there a named staff member responsible ` +
        `for document readiness for each young person?`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    documentType?: DocumentType;
    supportStage?: SupportStage;
    documentHeldBy?: DocumentHolder;
    limit?: number;
  },
): Promise<ServiceResult<KeyDocumentSupportRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_key_document_support") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.documentType) q = q.eq("document_type", filters.documentType);
  if (filters?.supportStage) q = q.eq("support_stage", filters.supportStage);
  if (filters?.documentHeldBy) q = q.eq("document_held_by", filters.documentHeldBy);

  q = q.order("record_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<KeyDocumentSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_key_document_support") as SB)
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
  documentType: DocumentType;
  supportStage?: SupportStage;
  documentHeldBy?: DocumentHolder;
  cost?: number | null;
  fundedBy?: string | null;
  youngPersonEngaged?: boolean;
  personalAdviserInvolved?: boolean;
  socialWorkerInformed?: boolean;
  pathwayPlanLinked?: boolean;
  deadlineDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<KeyDocumentSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateKeyDocumentSupport({
    youngPersonName: input.youngPersonName,
    recordDate: input.recordDate,
    supportingStaff: input.supportingStaff,
    documentType: input.documentType,
    supportStage: input.supportStage,
    documentHeldBy: input.documentHeldBy,
    cost: input.cost,
    deadlineDate: input.deadlineDate,
    youngPersonEngaged: input.youngPersonEngaged,
    personalAdviserInvolved: input.personalAdviserInvolved,
    pathwayPlanLinked: input.pathwayPlanLinked,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_key_document_support") as SB)
    .insert({
      home_id: input.homeId,
      young_person_name: input.youngPersonName,
      record_date: input.recordDate,
      supporting_staff: input.supportingStaff,
      document_type: input.documentType,
      support_stage: input.supportStage ?? "Identified as Needed",
      document_held_by: input.documentHeldBy ?? "Not Yet Obtained",
      cost: input.cost ?? null,
      funded_by: input.fundedBy ?? null,
      young_person_engaged: input.youngPersonEngaged ?? false,
      personal_adviser_involved: input.personalAdviserInvolved ?? false,
      social_worker_informed: input.socialWorkerInformed ?? false,
      pathway_plan_linked: input.pathwayPlanLinked ?? false,
      deadline_date: input.deadlineDate ?? null,
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
    documentType: DocumentType;
    supportStage: SupportStage;
    documentHeldBy: DocumentHolder;
    cost: number | null;
    fundedBy: string | null;
    youngPersonEngaged: boolean;
    personalAdviserInvolved: boolean;
    socialWorkerInformed: boolean;
    pathwayPlanLinked: boolean;
    deadlineDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<KeyDocumentSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.youngPersonName !== undefined) mapped.young_person_name = updates.youngPersonName;
  if (updates.recordDate !== undefined) mapped.record_date = updates.recordDate;
  if (updates.supportingStaff !== undefined) mapped.supporting_staff = updates.supportingStaff;
  if (updates.documentType !== undefined) mapped.document_type = updates.documentType;
  if (updates.supportStage !== undefined) mapped.support_stage = updates.supportStage;
  if (updates.documentHeldBy !== undefined) mapped.document_held_by = updates.documentHeldBy;
  if (updates.cost !== undefined) mapped.cost = updates.cost;
  if (updates.fundedBy !== undefined) mapped.funded_by = updates.fundedBy;
  if (updates.youngPersonEngaged !== undefined) mapped.young_person_engaged = updates.youngPersonEngaged;
  if (updates.personalAdviserInvolved !== undefined) mapped.personal_adviser_involved = updates.personalAdviserInvolved;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.pathwayPlanLinked !== undefined) mapped.pathway_plan_linked = updates.pathwayPlanLinked;
  if (updates.deadlineDate !== undefined) mapped.deadline_date = updates.deadlineDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_key_document_support") as SB)
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

  const { error } = await (client.from("cs_key_document_support") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
