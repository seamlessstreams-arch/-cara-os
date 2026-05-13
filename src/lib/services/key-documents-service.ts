// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — KEY DOCUMENTS SERVICE
// Tracks essential documents for each child — care plans, placement plans,
// pathway plans, risk assessments, PEPs, health plans, and other statutory
// documents required by regulations.
// CHR 2015 Reg 36 (records — maintaining essential documents),
// Reg 14 (healthcare plans), Reg 8 (placement plans),
// Reg 16 (education — PEPs).
//
// Ensures all required documents are in place, current, and reviewed
// within statutory timescales.
//
// SCCIF: Well-Led — "Essential records and plans are in place,
// up to date, and reviewed regularly."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type DocumentType =
  | "care_plan"
  | "placement_plan"
  | "pathway_plan"
  | "risk_assessment"
  | "pep"
  | "health_plan"
  | "behaviour_support_plan"
  | "missing_protocol"
  | "contact_plan"
  | "transition_plan"
  | "therapy_plan"
  | "safety_plan"
  | "life_story_work"
  | "delegated_authority"
  | "other";

export type DocumentStatus =
  | "current"
  | "due_review"
  | "overdue"
  | "draft"
  | "not_yet_created"
  | "archived";

export type ReviewFrequency =
  | "monthly"
  | "quarterly"
  | "six_monthly"
  | "annually"
  | "as_needed";

export interface KeyDocument {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  document_type: DocumentType;
  document_name: string;
  status: DocumentStatus;
  created_date: string;
  last_reviewed: string | null;
  next_review_due: string | null;
  review_frequency: ReviewFrequency;
  responsible_person: string;
  social_worker_approved: boolean;
  child_contributed: boolean;
  stored_location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const DOCUMENT_TYPES: { type: DocumentType; label: string }[] = [
  { type: "care_plan", label: "Care Plan" },
  { type: "placement_plan", label: "Placement Plan" },
  { type: "pathway_plan", label: "Pathway Plan" },
  { type: "risk_assessment", label: "Risk Assessment" },
  { type: "pep", label: "Personal Education Plan (PEP)" },
  { type: "health_plan", label: "Health Plan" },
  { type: "behaviour_support_plan", label: "Behaviour Support Plan" },
  { type: "missing_protocol", label: "Missing Protocol" },
  { type: "contact_plan", label: "Contact Plan" },
  { type: "transition_plan", label: "Transition Plan" },
  { type: "therapy_plan", label: "Therapy Plan" },
  { type: "safety_plan", label: "Safety Plan" },
  { type: "life_story_work", label: "Life Story Work" },
  { type: "delegated_authority", label: "Delegated Authority" },
  { type: "other", label: "Other" },
];

export const DOCUMENT_STATUSES: { status: DocumentStatus; label: string }[] = [
  { status: "current", label: "Current" },
  { status: "due_review", label: "Due Review" },
  { status: "overdue", label: "Overdue" },
  { status: "draft", label: "Draft" },
  { status: "not_yet_created", label: "Not Yet Created" },
  { status: "archived", label: "Archived" },
];

export const REVIEW_FREQUENCIES: { frequency: ReviewFrequency; label: string }[] = [
  { frequency: "monthly", label: "Monthly" },
  { frequency: "quarterly", label: "Quarterly" },
  { frequency: "six_monthly", label: "Six Monthly" },
  { frequency: "annually", label: "Annually" },
  { frequency: "as_needed", label: "As Needed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute key documents metrics.
 */
export function computeDocumentMetrics(
  documents: KeyDocument[],
  totalChildren: number,
  now: Date = new Date(),
): {
  total_documents: number;
  current_count: number;
  due_review_count: number;
  overdue_count: number;
  draft_count: number;
  not_created_count: number;
  children_with_documents: number;
  document_coverage: number;
  social_worker_approved_rate: number;
  child_contributed_rate: number;
  care_plans_current: number;
  placement_plans_current: number;
  risk_assessments_current: number;
  by_document_type: Record<string, number>;
  by_status: Record<string, number>;
  by_review_frequency: Record<string, number>;
} {
  const current = documents.filter((d) => d.status === "current").length;
  const dueReview = documents.filter((d) => d.status === "due_review").length;
  const overdue = documents.filter((d) => d.status === "overdue").length;
  const draft = documents.filter((d) => d.status === "draft").length;
  const notCreated = documents.filter((d) => d.status === "not_yet_created").length;

  // Also check for documents overdue by date
  const overdueByDate = documents.filter(
    (d) =>
      d.status === "current" &&
      d.next_review_due &&
      new Date(d.next_review_due) < now,
  ).length;

  const uniqueChildren = new Set(documents.map((d) => d.child_id)).size;
  const coverage =
    totalChildren > 0
      ? Math.round((uniqueChildren / totalChildren) * 1000) / 10
      : 0;

  const swApproved = documents.filter((d) => d.social_worker_approved).length;
  const swRate =
    documents.length > 0
      ? Math.round((swApproved / documents.length) * 1000) / 10
      : 0;

  const childContributed = documents.filter((d) => d.child_contributed).length;
  const childRate =
    documents.length > 0
      ? Math.round((childContributed / documents.length) * 1000) / 10
      : 0;

  // Specific document type checks
  const carePlansCurrent = documents.filter(
    (d) => d.document_type === "care_plan" && d.status === "current",
  ).length;
  const placementPlansCurrent = documents.filter(
    (d) => d.document_type === "placement_plan" && d.status === "current",
  ).length;
  const riskAssessmentsCurrent = documents.filter(
    (d) => d.document_type === "risk_assessment" && d.status === "current",
  ).length;

  // By document type
  const byDocumentType: Record<string, number> = {};
  for (const d of documents) {
    byDocumentType[d.document_type] = (byDocumentType[d.document_type] ?? 0) + 1;
  }

  // By status
  const byStatus: Record<string, number> = {};
  for (const d of documents) {
    byStatus[d.status] = (byStatus[d.status] ?? 0) + 1;
  }

  // By review frequency
  const byReviewFrequency: Record<string, number> = {};
  for (const d of documents) {
    byReviewFrequency[d.review_frequency] = (byReviewFrequency[d.review_frequency] ?? 0) + 1;
  }

  return {
    total_documents: documents.length,
    current_count: current,
    due_review_count: dueReview + overdueByDate,
    overdue_count: overdue,
    draft_count: draft,
    not_created_count: notCreated,
    children_with_documents: uniqueChildren,
    document_coverage: coverage,
    social_worker_approved_rate: swRate,
    child_contributed_rate: childRate,
    care_plans_current: carePlansCurrent,
    placement_plans_current: placementPlansCurrent,
    risk_assessments_current: riskAssessmentsCurrent,
    by_document_type: byDocumentType,
    by_status: byStatus,
    by_review_frequency: byReviewFrequency,
  };
}

/**
 * Identify key documents alerts.
 */
export function identifyDocumentAlerts(
  documents: KeyDocument[],
  totalChildren: number,
  now: Date = new Date(),
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  id: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    id: string;
  }[] = [];

  // Missing care plans
  const childrenWithCarePlan = new Set(
    documents
      .filter((d) => d.document_type === "care_plan" && (d.status === "current" || d.status === "due_review"))
      .map((d) => d.child_id),
  );
  if (totalChildren > 0 && childrenWithCarePlan.size < totalChildren) {
    const gap = totalChildren - childrenWithCarePlan.size;
    alerts.push({
      type: "missing_care_plan",
      severity: "critical",
      message: `${gap} ${gap === 1 ? "child does" : "children do"} not have a current care plan — this is a statutory requirement`,
      id: "care_plan_gap",
    });
  }

  // Missing placement plans
  const childrenWithPlacementPlan = new Set(
    documents
      .filter((d) => d.document_type === "placement_plan" && (d.status === "current" || d.status === "due_review"))
      .map((d) => d.child_id),
  );
  if (totalChildren > 0 && childrenWithPlacementPlan.size < totalChildren) {
    const gap = totalChildren - childrenWithPlacementPlan.size;
    alerts.push({
      type: "missing_placement_plan",
      severity: "critical",
      message: `${gap} ${gap === 1 ? "child does" : "children do"} not have a current placement plan — required under Reg 8`,
      id: "placement_plan_gap",
    });
  }

  // Overdue documents
  for (const d of documents) {
    if (d.status === "overdue") {
      alerts.push({
        type: "document_overdue",
        severity: "high",
        message: `${d.document_name} for ${d.child_name} is overdue for review — review was due ${d.next_review_due ?? "unknown"}`,
        id: d.id,
      });
    }
  }

  // Documents overdue by date (still marked current)
  for (const d of documents) {
    if (
      d.status === "current" &&
      d.next_review_due &&
      new Date(d.next_review_due) < now
    ) {
      alerts.push({
        type: "review_overdue_by_date",
        severity: "high",
        message: `${d.document_name} for ${d.child_name} is past review date (${d.next_review_due}) — update status and arrange review`,
        id: d.id,
      });
    }
  }

  // Documents not yet created
  for (const d of documents) {
    if (d.status === "not_yet_created") {
      const severity = (d.document_type === "care_plan" || d.document_type === "placement_plan" || d.document_type === "risk_assessment")
        ? "critical" as const
        : "medium" as const;
      alerts.push({
        type: "document_not_created",
        severity,
        message: `${d.document_name} for ${d.child_name} has not yet been created — ensure this is completed promptly`,
        id: d.id,
      });
    }
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listDocuments(
  homeId: string,
  filters?: {
    childId?: string;
    documentType?: DocumentType;
    status?: DocumentStatus;
    limit?: number;
  },
): Promise<ServiceResult<KeyDocument[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_key_documents") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.documentType) q = q.eq("document_type", filters.documentType);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createDocument(
  input: {
    homeId: string;
    childName: string;
    childId: string;
    documentType: DocumentType;
    documentName: string;
    status: DocumentStatus;
    createdDate: string;
    lastReviewed?: string;
    nextReviewDue?: string;
    reviewFrequency: ReviewFrequency;
    responsiblePerson: string;
    socialWorkerApproved: boolean;
    childContributed: boolean;
    storedLocation?: string;
    notes?: string;
  },
): Promise<ServiceResult<KeyDocument>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_key_documents") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      document_type: input.documentType,
      document_name: input.documentName,
      status: input.status,
      created_date: input.createdDate,
      last_reviewed: input.lastReviewed ?? null,
      next_review_due: input.nextReviewDue ?? null,
      review_frequency: input.reviewFrequency,
      responsible_person: input.responsiblePerson,
      social_worker_approved: input.socialWorkerApproved,
      child_contributed: input.childContributed,
      stored_location: input.storedLocation ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateDocument(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<KeyDocument>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_key_documents") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeDocumentMetrics,
  identifyDocumentAlerts,
};
