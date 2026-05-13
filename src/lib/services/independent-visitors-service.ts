// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — INDEPENDENT VISITORS SERVICE
// Manages independent visitor assignments (Children Act 1989 s23ZB), visit
// records, and compliance tracking. CHR 2015 Reg 44 (independent person
// visiting children's homes), IRO Handbook 2010 (independent reviewing
// officer role in ensuring IV provision for looked-after children).
//
// Children Act 1989 s23ZB — local authority duty to appoint an independent
// visitor for looked-after children who have had no or infrequent contact
// with their parents, or where it would be in the child's best interests.
//
// CHR 2015 Reg 44 — the registered provider must ensure that an independent
// person visits the children's home at least once a month, producing a
// report on the conduct of the home.
//
// IRO Handbook 2010 — the Independent Reviewing Officer must ensure that
// children who would benefit from an independent visitor are referred for
// one and that the arrangement is reviewed regularly.
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

export type AssignmentReason =
  | "no_contact_with_parent"
  | "infrequent_contact"
  | "child_request"
  | "social_worker_recommendation"
  | "lac_review_recommendation"
  | "statutory_requirement";

export type VisitFrequency =
  | "weekly"
  | "fortnightly"
  | "monthly"
  | "six_weekly";

export type AssignmentStatus =
  | "pending"
  | "active"
  | "paused"
  | "ended";

export type VisitType =
  | "in_person"
  | "phone_call"
  | "video_call"
  | "activity_outing"
  | "letter";

export interface IndependentVisitorAssignment {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  visitor_name: string;
  visitor_organisation: string | null;
  visitor_contact: string | null;
  dbs_check_date: string | null;
  dbs_reference: string | null;
  assignment_date: string;
  assignment_reason: AssignmentReason;
  visit_frequency: VisitFrequency;
  last_visit_date: string | null;
  next_visit_due: string | null;
  status: AssignmentStatus;
  end_date: string | null;
  end_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface IndependentVisitorVisit {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  assignment_id: string;
  visit_date: string;
  visit_duration_minutes: number | null;
  visit_type: VisitType;
  visitor_name: string;
  location: string | null;
  child_attended: boolean;
  child_views: string | null;
  topics_discussed: unknown[];
  concerns_raised: boolean;
  concern_details: string | null;
  concerns_escalated: boolean;
  escalated_to: string | null;
  child_wishes_recorded: boolean;
  child_wishes: string | null;
  next_visit_date: string | null;
  notes: string | null;
  created_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const ASSIGNMENT_REASONS: { reason: AssignmentReason; label: string }[] = [
  { reason: "no_contact_with_parent", label: "No Contact with Parent" },
  { reason: "infrequent_contact", label: "Infrequent Contact" },
  { reason: "child_request", label: "Child Request" },
  { reason: "social_worker_recommendation", label: "Social Worker Recommendation" },
  { reason: "lac_review_recommendation", label: "LAC Review Recommendation" },
  { reason: "statutory_requirement", label: "Statutory Requirement" },
];

export const VISIT_FREQUENCIES: { frequency: VisitFrequency; label: string }[] = [
  { frequency: "weekly", label: "Weekly" },
  { frequency: "fortnightly", label: "Fortnightly" },
  { frequency: "monthly", label: "Monthly" },
  { frequency: "six_weekly", label: "Six-Weekly" },
];

export const ASSIGNMENT_STATUSES: { status: AssignmentStatus; label: string }[] = [
  { status: "pending", label: "Pending" },
  { status: "active", label: "Active" },
  { status: "paused", label: "Paused" },
  { status: "ended", label: "Ended" },
];

export const VISIT_TYPES: { type: VisitType; label: string }[] = [
  { type: "in_person", label: "In Person" },
  { type: "phone_call", label: "Phone Call" },
  { type: "video_call", label: "Video Call" },
  { type: "activity_outing", label: "Activity Outing" },
  { type: "letter", label: "Letter" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute independent visitor metrics from assignments and visits.
 *
 * Regulation references: Children Act 1989 s23ZB (IV appointment duty),
 * CHR 2015 Reg 44 (independent person visits), IRO Handbook 2010
 * (IV provision review).
 */
export function computeIVMetrics(
  assignments: IndependentVisitorAssignment[],
  visits: IndependentVisitorVisit[],
): {
  children_with_iv: number;
  active_assignments: number;
  overdue_visits: number;
  visits_this_quarter: number;
  avg_visit_duration: number;
  child_attendance_rate: number;
  concerns_raised_count: number;
  by_visit_type: Record<string, number>;
  by_assignment_reason: Record<string, number>;
} {
  const now = new Date();
  const quarterStart = new Date(
    now.getFullYear(),
    Math.floor(now.getMonth() / 3) * 3,
    1,
  );

  // ── Assignment metrics ────────────────────────────────────────────────

  const activeAssignments = assignments.filter((a) => a.status === "active");
  const childrenWithIV = new Set(
    activeAssignments.map((a) => a.child_id),
  );

  // Overdue visits: active assignments where next_visit_due is in the past
  let overdueVisits = 0;
  for (const a of activeAssignments) {
    if (a.next_visit_due && new Date(a.next_visit_due) < now) {
      overdueVisits++;
    }
  }

  // By assignment reason
  const byAssignmentReason: Record<string, number> = {};
  for (const a of assignments) {
    byAssignmentReason[a.assignment_reason] =
      (byAssignmentReason[a.assignment_reason] ?? 0) + 1;
  }

  // ── Visit metrics ────────────────────────────────────────────────────

  const visitsThisQuarter = visits.filter(
    (v) => new Date(v.visit_date) >= quarterStart,
  );

  // Average visit duration (only visits with a recorded duration)
  let totalDuration = 0;
  let durationCount = 0;
  for (const v of visits) {
    if (v.visit_duration_minutes != null && v.visit_duration_minutes > 0) {
      totalDuration += v.visit_duration_minutes;
      durationCount++;
    }
  }
  const avgVisitDuration =
    durationCount > 0
      ? Math.round((totalDuration / durationCount) * 10) / 10
      : 0;

  // Child attendance rate
  let attendedCount = 0;
  for (const v of visits) {
    if (v.child_attended) attendedCount++;
  }
  const childAttendanceRate =
    visits.length > 0
      ? Math.round((attendedCount / visits.length) * 1000) / 10
      : 0;

  // Concerns raised count
  let concernsRaisedCount = 0;
  for (const v of visits) {
    if (v.concerns_raised) concernsRaisedCount++;
  }

  // By visit type
  const byVisitType: Record<string, number> = {};
  for (const v of visits) {
    byVisitType[v.visit_type] = (byVisitType[v.visit_type] ?? 0) + 1;
  }

  return {
    children_with_iv: childrenWithIV.size,
    active_assignments: activeAssignments.length,
    overdue_visits: overdueVisits,
    visits_this_quarter: visitsThisQuarter.length,
    avg_visit_duration: avgVisitDuration,
    child_attendance_rate: childAttendanceRate,
    concerns_raised_count: concernsRaisedCount,
    by_visit_type: byVisitType,
    by_assignment_reason: byAssignmentReason,
  };
}

/**
 * Identify independent visitor alerts requiring management attention.
 *
 * Alert categories:
 *   - Visit overdue (high) — active assignment with next_visit_due in the past
 *   - Assignment pending > 14 days (high) — pending assignment not activated
 *   - DBS check expired or missing (critical) — visitor safeguarding concern
 *   - Concerns raised not escalated (critical) — child protection obligation
 *   - Child not attending visits (medium) — engagement concern
 *   - No visit recorded in 2+ months (high) — s23ZB compliance gap
 *   - Assignment ended without reason (medium) — governance gap
 *   - Child wishes not recorded (medium) — child's voice not captured
 *
 * Regulation references: Children Act 1989 s23ZB, CHR 2015 Reg 44,
 * IRO Handbook 2010.
 */
export function identifyIVAlerts(
  assignments: IndependentVisitorAssignment[],
  visits: IndependentVisitorVisit[],
  now: Date = new Date(),
): {
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  message: string;
  related_id: string;
  related_type: "assignment" | "visit";
}[] {
  const alerts: {
    severity: "critical" | "high" | "medium" | "low";
    category: string;
    message: string;
    related_id: string;
    related_type: "assignment" | "visit";
  }[] = [];

  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
  const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;

  // Build map: assignment_id -> visits for that assignment
  const visitsByAssignment = new Map<string, IndependentVisitorVisit[]>();
  for (const v of visits) {
    if (!visitsByAssignment.has(v.assignment_id)) {
      visitsByAssignment.set(v.assignment_id, []);
    }
    visitsByAssignment.get(v.assignment_id)!.push(v);
  }

  for (const a of assignments) {
    // ── Visit overdue (high) ──────────────────────────────────────────
    if (
      a.status === "active" &&
      a.next_visit_due &&
      new Date(a.next_visit_due) < now
    ) {
      const daysOverdue = Math.round(
        (now.getTime() - new Date(a.next_visit_due).getTime()) / (1000 * 60 * 60 * 24),
      );
      alerts.push({
        severity: "high",
        category: "visit_overdue",
        message: `Independent visitor visit for ${a.child_name} is ${daysOverdue} days overdue — s23ZB requires regular visiting`,
        related_id: a.id,
        related_type: "assignment",
      });
    }

    // ── Assignment pending > 14 days (high) ──────────────────────────
    if (a.status === "pending") {
      const assignmentDate = new Date(a.assignment_date).getTime();
      if (now.getTime() - assignmentDate > fourteenDaysMs) {
        const daysPending = Math.round(
          (now.getTime() - assignmentDate) / (1000 * 60 * 60 * 24),
        );
        alerts.push({
          severity: "high",
          category: "assignment_pending_too_long",
          message: `Independent visitor assignment for ${a.child_name} has been pending for ${daysPending} days — activation expected within 14 days`,
          related_id: a.id,
          related_type: "assignment",
        });
      }
    }

    // ── DBS check expired or missing (critical) ─────────────────────
    if (a.status === "active" || a.status === "pending") {
      if (!a.dbs_check_date) {
        alerts.push({
          severity: "critical",
          category: "dbs_missing",
          message: `No DBS check date recorded for independent visitor ${a.visitor_name} assigned to ${a.child_name} — safeguarding requirement under Reg 44`,
          related_id: a.id,
          related_type: "assignment",
        });
      } else {
        const dbsDate = new Date(a.dbs_check_date).getTime();
        if (now.getTime() - dbsDate > oneYearMs) {
          const monthsExpired = Math.round(
            (now.getTime() - dbsDate) / (1000 * 60 * 60 * 24 * 30),
          );
          alerts.push({
            severity: "critical",
            category: "dbs_expired",
            message: `DBS check for independent visitor ${a.visitor_name} expired ${monthsExpired} months ago — renewal required for safeguarding compliance`,
            related_id: a.id,
            related_type: "assignment",
          });
        }
      }
    }

    // ── No visit recorded in 2+ months (high) ──────────────────────
    if (a.status === "active") {
      const assignmentVisits = visitsByAssignment.get(a.id) ?? [];
      if (assignmentVisits.length === 0) {
        // No visits at all — check if assignment has been active long enough
        const assignmentDate = new Date(a.assignment_date).getTime();
        if (now.getTime() - assignmentDate > sixtyDaysMs) {
          alerts.push({
            severity: "high",
            category: "no_visits_recorded",
            message: `No visits recorded for ${a.child_name}'s independent visitor since assignment on ${a.assignment_date} — s23ZB requires regular visiting`,
            related_id: a.id,
            related_type: "assignment",
          });
        }
      } else {
        // Find most recent visit date
        const latestVisit = assignmentVisits.reduce((latest, v) =>
          new Date(v.visit_date) > new Date(latest.visit_date) ? v : latest,
        );
        const lastVisitDate = new Date(latestVisit.visit_date).getTime();
        if (now.getTime() - lastVisitDate > sixtyDaysMs) {
          const daysSince = Math.round(
            (now.getTime() - lastVisitDate) / (1000 * 60 * 60 * 24),
          );
          alerts.push({
            severity: "high",
            category: "no_recent_visit",
            message: `No independent visitor visit for ${a.child_name} in ${daysSince} days — s23ZB requires regular visiting`,
            related_id: a.id,
            related_type: "assignment",
          });
        }
      }
    }

    // ── Assignment ended without reason (medium) ─────────────────────
    if (a.status === "ended" && !a.end_reason) {
      alerts.push({
        severity: "medium",
        category: "ended_without_reason",
        message: `Independent visitor assignment for ${a.child_name} ended without a recorded reason — governance requires documented rationale`,
        related_id: a.id,
        related_type: "assignment",
      });
    }
  }

  // ── Visit-level alerts ──────────────────────────────────────────────

  // Build map: child_id -> recent visits (to check attendance pattern)
  const visitsByChild = new Map<string, IndependentVisitorVisit[]>();
  for (const v of visits) {
    if (!visitsByChild.has(v.child_id)) {
      visitsByChild.set(v.child_id, []);
    }
    visitsByChild.get(v.child_id)!.push(v);
  }

  for (const v of visits) {
    // ── Concerns raised not escalated (critical) ────────────────────
    if (v.concerns_raised && !v.concerns_escalated) {
      alerts.push({
        severity: "critical",
        category: "concerns_not_escalated",
        message: `Concerns raised during independent visitor visit with ${v.child_name} on ${v.visit_date} have not been escalated — safeguarding obligation under Reg 44`,
        related_id: v.id,
        related_type: "visit",
      });
    }

    // ── Child wishes not recorded (medium) ──────────────────────────
    if (!v.child_wishes_recorded && v.child_attended) {
      alerts.push({
        severity: "medium",
        category: "wishes_not_recorded",
        message: `Child wishes not recorded for ${v.child_name} during independent visitor visit on ${v.visit_date} — IRO Handbook requires capturing the child's voice`,
        related_id: v.id,
        related_type: "visit",
      });
    }
  }

  // ── Child not attending visits (medium) ─────────────────────────────
  // Check for children with 3+ consecutive non-attended visits
  for (const [childId, childVisits] of visitsByChild) {
    const sorted = [...childVisits].sort(
      (a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime(),
    );
    // Check the last 3 visits
    const recentVisits = sorted.slice(0, 3);
    if (recentVisits.length >= 3) {
      const allNotAttended = recentVisits.every((v) => !v.child_attended);
      if (allNotAttended) {
        alerts.push({
          severity: "medium",
          category: "child_not_attending",
          message: `${recentVisits[0].child_name} has not attended the last ${recentVisits.length} independent visitor visits — engagement review required`,
          related_id: recentVisits[0].id,
          related_type: "visit",
        });
      }
    }
  }

  // Sort alerts: critical first, then high, then medium, then low
  const severityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
}

// ── CRUD — Independent Visitor Assignments ────────────────────────────────

export async function listAssignments(
  homeId: string,
  filters?: {
    childId?: string;
    status?: AssignmentStatus;
    assignmentReason?: AssignmentReason;
    limit?: number;
  },
): Promise<ServiceResult<IndependentVisitorAssignment[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_independent_visitor_assignments") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.assignmentReason) q = q.eq("assignment_reason", filters.assignmentReason);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createAssignment(
  input: {
    homeId: string;
    childId: string;
    childName: string;
    visitorName: string;
    visitorOrganisation?: string;
    visitorContact?: string;
    dbsCheckDate?: string;
    dbsReference?: string;
    assignmentDate?: string;
    assignmentReason: AssignmentReason;
    visitFrequency?: VisitFrequency;
    nextVisitDue?: string;
    notes?: string;
  },
): Promise<ServiceResult<IndependentVisitorAssignment>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_independent_visitor_assignments") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId,
      child_name: input.childName,
      visitor_name: input.visitorName,
      visitor_organisation: input.visitorOrganisation ?? null,
      visitor_contact: input.visitorContact ?? null,
      dbs_check_date: input.dbsCheckDate ?? null,
      dbs_reference: input.dbsReference ?? null,
      assignment_date: input.assignmentDate ?? new Date().toISOString().split("T")[0],
      assignment_reason: input.assignmentReason,
      visit_frequency: input.visitFrequency ?? "monthly",
      last_visit_date: null,
      next_visit_due: input.nextVisitDue ?? null,
      status: "pending",
      end_date: null,
      end_reason: null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateAssignment(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<IndependentVisitorAssignment>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_independent_visitor_assignments") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Independent Visitor Visits ─────────────────────────────────────

export async function listVisits(
  homeId: string,
  filters?: {
    childId?: string;
    assignmentId?: string;
    visitType?: VisitType;
    limit?: number;
  },
): Promise<ServiceResult<IndependentVisitorVisit[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_independent_visitor_visits") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.assignmentId) q = q.eq("assignment_id", filters.assignmentId);
  if (filters?.visitType) q = q.eq("visit_type", filters.visitType);
  q = q.order("visit_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createVisit(
  input: {
    homeId: string;
    childId: string;
    childName: string;
    assignmentId: string;
    visitDate?: string;
    visitDurationMinutes?: number;
    visitType: VisitType;
    visitorName: string;
    location?: string;
    childAttended?: boolean;
    childViews?: string;
    topicsDiscussed?: unknown[];
    concernsRaised?: boolean;
    concernDetails?: string;
    concernsEscalated?: boolean;
    escalatedTo?: string;
    childWishesRecorded?: boolean;
    childWishes?: string;
    nextVisitDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<IndependentVisitorVisit>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_independent_visitor_visits") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId,
      child_name: input.childName,
      assignment_id: input.assignmentId,
      visit_date: input.visitDate ?? new Date().toISOString().split("T")[0],
      visit_duration_minutes: input.visitDurationMinutes ?? null,
      visit_type: input.visitType,
      visitor_name: input.visitorName,
      location: input.location ?? null,
      child_attended: input.childAttended ?? true,
      child_views: input.childViews ?? null,
      topics_discussed: input.topicsDiscussed ?? [],
      concerns_raised: input.concernsRaised ?? false,
      concern_details: input.concernDetails ?? null,
      concerns_escalated: input.concernsEscalated ?? false,
      escalated_to: input.escalatedTo ?? null,
      child_wishes_recorded: input.childWishesRecorded ?? false,
      child_wishes: input.childWishes ?? null,
      next_visit_date: input.nextVisitDate ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeIVMetrics,
  identifyIVAlerts,
  ASSIGNMENT_REASONS,
  VISIT_FREQUENCIES,
  ASSIGNMENT_STATUSES,
  VISIT_TYPES,
};
