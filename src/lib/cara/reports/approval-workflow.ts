// ══════════════════════════════════════════════════════════════════════════════
// Cara — REPORT APPROVAL WORKFLOW
//
// Manages the status lifecycle of a child report:
//   draft → pending_review → approved → locked → archived
//                          ↘ rejected (back to draft for edits)
//
// Every transition is validated, persisted, and audit-logged. When Supabase
// is unavailable the functions return demo objects with the updated status
// so the UI can render the full workflow in offline / preview mode.
//
// Server-side only — never import in client components.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import type { ChildReport, ReportStatus } from "@/types/cara-reports";
import { writeCaraAudit } from "@/lib/cara/audit/cara-audit";

// ── Valid Transitions ─────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  draft: ["pending_review"],
  pending_review: ["approved", "rejected"],
  approved: ["locked"],
  rejected: ["draft", "pending_review"],
  locked: ["archived"],
  archived: [],
};

function validateTransition(
  currentStatus: ReportStatus,
  targetStatus: ReportStatus,
): void {
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(targetStatus)) {
    throw new Error(
      `Invalid status transition: ${currentStatus} → ${targetStatus}. ` +
      `Allowed transitions from "${currentStatus}": ${allowed?.join(", ") || "none"}.`,
    );
  }
}

// ── Fetch Report Helper ───────────────────────────────────────────────────

async function fetchReport(reportId: string): Promise<ChildReport | null> {
  const sb = createServerClient();
  if (!sb) return buildDemoReport(reportId, "draft");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.from("child_reports") as any)
    .select("*")
    .eq("id", reportId)
    .single();

  if (error || !data) return null;
  return data as ChildReport;
}

// ── Update Report Helper ──────────────────────────────────────────────────

async function updateReportStatus(
  reportId: string,
  updates: Partial<ChildReport>,
): Promise<ChildReport | null> {
  const sb = createServerClient();

  if (!sb) {
    // Demo mode — build a report with the updates applied
    return buildDemoReport(reportId, (updates.status ?? "draft") as ReportStatus, updates);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.from("child_reports") as any)
    .update(updates)
    .eq("id", reportId)
    .select("*")
    .single();

  if (error || !data) {
    console.error("[cara-approval] Failed to update report status:", error);
    return null;
  }

  return data as ChildReport;
}

// ══════════════════════════════════════════════════════════════════════════════
// SUBMIT FOR REVIEW
// ══════════════════════════════════════════════════════════════════════════════

export async function submitForReview(
  reportId: string,
  submittedBy: string,
): Promise<ChildReport> {
  const report = await fetchReport(reportId);
  if (!report) throw new Error(`Report not found: ${reportId}`);

  validateTransition(report.status, "pending_review");

  const now = new Date().toISOString();
  const updated = await updateReportStatus(reportId, {
    status: "pending_review",
    updated_at: now,
  });

  if (!updated) throw new Error(`Failed to submit report for review: ${reportId}`);

  await writeCaraAudit({
    organisationId: report.organisation_id,
    homeId: report.home_id,
    childId: report.child_id,
    actorId: submittedBy,
    eventType: "report_submitted_for_review",
    entityType: "report",
    entityId: reportId,
    summary: `Report "${report.title}" submitted for review by ${submittedBy}`,
  });

  return updated;
}

// ══════════════════════════════════════════════════════════════════════════════
// APPROVE REPORT
// ══════════════════════════════════════════════════════════════════════════════

export async function approveReport(
  reportId: string,
  approvedBy: string,
  reviewNote?: string,
): Promise<ChildReport> {
  const report = await fetchReport(reportId);
  if (!report) throw new Error(`Report not found: ${reportId}`);

  validateTransition(report.status, "approved");

  const now = new Date().toISOString();
  const updated = await updateReportStatus(reportId, {
    status: "approved",
    approved_by: approvedBy,
    approved_at: now,
    reviewed_by: approvedBy,
    reviewed_at: now,
    review_notes: reviewNote ?? null,
    rejection_reason: null,
    updated_at: now,
  });

  if (!updated) throw new Error(`Failed to approve report: ${reportId}`);

  await writeCaraAudit({
    organisationId: report.organisation_id,
    homeId: report.home_id,
    childId: report.child_id,
    actorId: approvedBy,
    eventType: "report_approved",
    entityType: "report",
    entityId: reportId,
    summary: `Report "${report.title}" approved by ${approvedBy}`,
    metadata: reviewNote ? { reviewNote } : undefined,
  });

  return updated;
}

// ══════════════════════════════════════════════════════════════════════════════
// REJECT REPORT
// ══════════════════════════════════════════════════════════════════════════════

export async function rejectReport(
  reportId: string,
  rejectedBy: string,
  reason: string,
): Promise<ChildReport> {
  const report = await fetchReport(reportId);
  if (!report) throw new Error(`Report not found: ${reportId}`);

  validateTransition(report.status, "rejected");

  if (!reason || reason.trim().length === 0) {
    throw new Error("A rejection reason is required when rejecting a report.");
  }

  const now = new Date().toISOString();
  const updated = await updateReportStatus(reportId, {
    status: "rejected",
    reviewed_by: rejectedBy,
    reviewed_at: now,
    rejection_reason: reason,
    approved_by: null,
    approved_at: null,
    updated_at: now,
  });

  if (!updated) throw new Error(`Failed to reject report: ${reportId}`);

  await writeCaraAudit({
    organisationId: report.organisation_id,
    homeId: report.home_id,
    childId: report.child_id,
    actorId: rejectedBy,
    eventType: "report_rejected",
    entityType: "report",
    entityId: reportId,
    summary: `Report "${report.title}" rejected by ${rejectedBy}: ${reason}`,
    metadata: { reason },
  });

  return updated;
}

// ══════════════════════════════════════════════════════════════════════════════
// LOCK REPORT
// ══════════════════════════════════════════════════════════════════════════════

export async function lockReport(
  reportId: string,
  lockedBy: string,
): Promise<ChildReport> {
  const report = await fetchReport(reportId);
  if (!report) throw new Error(`Report not found: ${reportId}`);

  validateTransition(report.status, "locked");

  const now = new Date().toISOString();
  const updated = await updateReportStatus(reportId, {
    status: "locked",
    locked_by: lockedBy,
    locked_at: now,
    updated_at: now,
  });

  if (!updated) throw new Error(`Failed to lock report: ${reportId}`);

  await writeCaraAudit({
    organisationId: report.organisation_id,
    homeId: report.home_id,
    childId: report.child_id,
    actorId: lockedBy,
    eventType: "report_locked",
    entityType: "report",
    entityId: reportId,
    summary: `Report "${report.title}" locked by ${lockedBy}. No further edits are permitted.`,
  });

  return updated;
}

// ══════════════════════════════════════════════════════════════════════════════
// ARCHIVE REPORT
// ══════════════════════════════════════════════════════════════════════════════

export async function archiveReport(
  reportId: string,
): Promise<ChildReport> {
  const report = await fetchReport(reportId);
  if (!report) throw new Error(`Report not found: ${reportId}`);

  validateTransition(report.status, "archived");

  const now = new Date().toISOString();
  const updated = await updateReportStatus(reportId, {
    status: "archived",
    updated_at: now,
  });

  if (!updated) throw new Error(`Failed to archive report: ${reportId}`);

  await writeCaraAudit({
    organisationId: report.organisation_id,
    homeId: report.home_id,
    childId: report.child_id,
    actorId: report.locked_by ?? "system",
    eventType: "report_archived",
    entityType: "report",
    entityId: reportId,
    summary: `Report "${report.title}" archived.`,
  });

  return updated;
}

// ══════════════════════════════════════════════════════════════════════════════
// DEMO DATA
// ══════════════════════════════════════════════════════════════════════════════

function buildDemoReport(
  reportId: string,
  status: ReportStatus,
  overrides?: Partial<ChildReport>,
): ChildReport {
  const now = new Date().toISOString();

  return {
    id: reportId,
    organisation_id: "demo-org",
    home_id: "demo-home",
    child_id: "demo-child",
    report_type: "weekly_child_report",
    audience: "internal_manager",
    title: "Jayden Mitchell — Weekly Child Report",
    status,
    version: 1,
    parent_report_id: null,
    date_range_start: "2026-05-05",
    date_range_end: "2026-05-11",
    overall_summary: "Jayden has had a broadly positive week.",
    overall_confidence_score: 72,
    risk_tier: "low",
    child_voice_included: true,
    evidence_gap_count: 2,
    agent_run_id: null,
    requested_by: "demo-user",
    generated_at: now,
    reviewed_by: null,
    reviewed_at: null,
    review_notes: null,
    approved_by: null,
    approved_at: null,
    rejection_reason: null,
    locked_by: null,
    locked_at: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}
