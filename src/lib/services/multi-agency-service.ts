// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MULTI-AGENCY WORKING SERVICE
// Manages professional contacts, LAC/CLA reviews, and multi-agency meetings
// to ensure effective inter-agency collaboration around children in care.
//
// CHR 2015 Reg 5 (engagement with parents and others — ensuring the home
// engages effectively with parents, placing authorities, and other
// professionals involved in a child's care), Reg 13 (leadership and
// management — the registered person must ensure that staff work
// co-operatively with relevant professionals and agencies).
//
// Working Together to Safeguard Children 2018 — statutory guidance on
// inter-agency working to safeguard and promote the welfare of children,
// including information sharing, joint assessments, and multi-agency meetings.
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

export type ProfessionalRole =
  | "social_worker"
  | "irm"
  | "irp"
  | "guardian"
  | "solicitor"
  | "camhs"
  | "psychologist"
  | "gp"
  | "dentist"
  | "nurse"
  | "senco"
  | "teacher"
  | "virtual_school_head"
  | "yot_worker"
  | "police_liaison"
  | "housing_officer"
  | "employment_advisor"
  | "other";

export type ContactStatus =
  | "active"
  | "inactive"
  | "changed";

export type LACReviewType =
  | "initial"
  | "second"
  | "subsequent"
  | "interim"
  | "emergency";

export type ContributionMethod =
  | "attended_in_person"
  | "attended_virtually"
  | "written_views"
  | "advocate_represented"
  | "chose_not_participate";

export type ReviewStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rescheduled";

export type MeetingType =
  | "strategy_meeting"
  | "child_protection_conference"
  | "mace"
  | "pep_meeting"
  | "professionals_meeting"
  | "network_meeting"
  | "disruption_meeting"
  | "placement_planning"
  | "other";

export type MeetingStatus =
  | "scheduled"
  | "completed"
  | "cancelled";

export interface ProfessionalContact {
  id: string;
  home_id: string;
  child_id: string | null;
  child_name: string | null;
  professional_name: string;
  role: ProfessionalRole;
  organisation: string;
  email: string | null;
  phone: string | null;
  is_primary_contact: boolean;
  relationship_start_date: string | null;
  last_contact_date: string | null;
  next_contact_due: string | null;
  status: ContactStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LACReview {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  review_date: string;
  review_type: LACReviewType;
  chaired_by: string;
  venue: string | null;
  child_attended: boolean;
  child_contributed: boolean;
  contribution_method: ContributionMethod | null;
  care_plan_agreed: boolean;
  placement_confirmed: boolean;
  key_decisions: unknown[];
  actions: unknown[];
  next_review_date: string | null;
  next_review_type: LACReviewType | null;
  home_report_submitted: boolean;
  home_report_submitted_date: string | null;
  status: ReviewStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfessionalMeeting {
  id: string;
  home_id: string;
  child_id: string | null;
  child_name: string | null;
  meeting_date: string;
  meeting_type: MeetingType;
  purpose: string;
  location: string | null;
  attendees: unknown[];
  apologies: unknown[];
  home_representative: string;
  key_decisions: unknown[];
  actions: unknown[];
  follow_up_date: string | null;
  follow_up_completed: boolean;
  status: MeetingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const PROFESSIONAL_ROLES: { role: ProfessionalRole; label: string }[] = [
  { role: "social_worker", label: "Social Worker" },
  { role: "irm", label: "Independent Reviewing Mechanism" },
  { role: "irp", label: "Independent Registered Person" },
  { role: "guardian", label: "Guardian" },
  { role: "solicitor", label: "Solicitor" },
  { role: "camhs", label: "CAMHS" },
  { role: "psychologist", label: "Psychologist" },
  { role: "gp", label: "GP" },
  { role: "dentist", label: "Dentist" },
  { role: "nurse", label: "Nurse" },
  { role: "senco", label: "SENCO" },
  { role: "teacher", label: "Teacher" },
  { role: "virtual_school_head", label: "Virtual School Head" },
  { role: "yot_worker", label: "YOT Worker" },
  { role: "police_liaison", label: "Police Liaison" },
  { role: "housing_officer", label: "Housing Officer" },
  { role: "employment_advisor", label: "Employment Advisor" },
  { role: "other", label: "Other" },
];

export const CONTACT_STATUSES: { status: ContactStatus; label: string }[] = [
  { status: "active", label: "Active" },
  { status: "inactive", label: "Inactive" },
  { status: "changed", label: "Changed" },
];

export const LAC_REVIEW_TYPES: { type: LACReviewType; label: string }[] = [
  { type: "initial", label: "Initial Review" },
  { type: "second", label: "Second Review" },
  { type: "subsequent", label: "Subsequent Review" },
  { type: "interim", label: "Interim Review" },
  { type: "emergency", label: "Emergency Review" },
];

export const CONTRIBUTION_METHODS: { method: ContributionMethod; label: string }[] = [
  { method: "attended_in_person", label: "Attended in Person" },
  { method: "attended_virtually", label: "Attended Virtually" },
  { method: "written_views", label: "Written Views" },
  { method: "advocate_represented", label: "Advocate Represented" },
  { method: "chose_not_participate", label: "Chose Not to Participate" },
];

export const REVIEW_STATUSES: { status: ReviewStatus; label: string }[] = [
  { status: "scheduled", label: "Scheduled" },
  { status: "completed", label: "Completed" },
  { status: "cancelled", label: "Cancelled" },
  { status: "rescheduled", label: "Rescheduled" },
];

export const MEETING_TYPES: { type: MeetingType; label: string }[] = [
  { type: "strategy_meeting", label: "Strategy Meeting" },
  { type: "child_protection_conference", label: "Child Protection Conference" },
  { type: "mace", label: "MACE" },
  { type: "pep_meeting", label: "PEP Meeting" },
  { type: "professionals_meeting", label: "Professionals Meeting" },
  { type: "network_meeting", label: "Network Meeting" },
  { type: "disruption_meeting", label: "Disruption Meeting" },
  { type: "placement_planning", label: "Placement Planning" },
  { type: "other", label: "Other" },
];

export const MEETING_STATUSES: { status: MeetingStatus; label: string }[] = [
  { status: "scheduled", label: "Scheduled" },
  { status: "completed", label: "Completed" },
  { status: "cancelled", label: "Cancelled" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute summary metrics across professional contacts, LAC reviews,
 * and multi-agency meetings for a home.
 */
export function computeMultiAgencyMetrics(
  contacts: ProfessionalContact[],
  lacReviews: LACReview[],
  meetings: ProfessionalMeeting[],
): {
  total_contacts: number;
  active_contacts: number;
  children_with_social_worker: number;
  overdue_contacts: number;
  lac_reviews_this_year: number;
  child_participation_rate: number;
  care_plan_agreement_rate: number;
  home_report_submission_rate: number;
  meetings_this_quarter: number;
  by_meeting_type: Record<string, number>;
  follow_up_completion_rate: number;
} {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const quarterStart = new Date(
    now.getFullYear(),
    Math.floor(now.getMonth() / 3) * 3,
    1,
  );

  // ── Contacts metrics ─────────────────────────────────────────────────

  const activeContacts = contacts.filter((c) => c.status === "active");

  // Children who have at least one active social worker
  const childrenWithSW = new Set(
    contacts
      .filter((c) => c.status === "active" && c.role === "social_worker" && c.child_id)
      .map((c) => c.child_id),
  );

  // Overdue contacts: next_contact_due in the past
  let overdueContacts = 0;
  for (const c of contacts) {
    if (
      c.status === "active" &&
      c.next_contact_due &&
      new Date(c.next_contact_due) < now
    ) {
      overdueContacts++;
    }
  }

  // ── LAC review metrics ───────────────────────────────────────────────

  const completedReviews = lacReviews.filter((r) => r.status === "completed");
  const reviewsThisYear = completedReviews.filter(
    (r) => new Date(r.review_date) >= yearStart,
  );

  // Child participation: completed reviews where child contributed
  let childParticipated = 0;
  for (const r of completedReviews) {
    if (r.child_contributed) childParticipated++;
  }
  const childParticipationRate =
    completedReviews.length > 0
      ? Math.round((childParticipated / completedReviews.length) * 1000) / 10
      : 0;

  // Care plan agreement rate
  let carePlanAgreed = 0;
  for (const r of completedReviews) {
    if (r.care_plan_agreed) carePlanAgreed++;
  }
  const carePlanAgreementRate =
    completedReviews.length > 0
      ? Math.round((carePlanAgreed / completedReviews.length) * 1000) / 10
      : 0;

  // Home report submission rate
  let homeReportSubmitted = 0;
  for (const r of completedReviews) {
    if (r.home_report_submitted) homeReportSubmitted++;
  }
  const homeReportSubmissionRate =
    completedReviews.length > 0
      ? Math.round((homeReportSubmitted / completedReviews.length) * 1000) / 10
      : 0;

  // ── Meeting metrics ──────────────────────────────────────────────────

  const completedMeetings = meetings.filter((m) => m.status === "completed");
  const meetingsThisQuarter = completedMeetings.filter(
    (m) => new Date(m.meeting_date) >= quarterStart,
  );

  const byMeetingType: Record<string, number> = {};
  for (const m of completedMeetings) {
    byMeetingType[m.meeting_type] = (byMeetingType[m.meeting_type] ?? 0) + 1;
  }

  // Follow-up completion rate (for meetings that have a follow_up_date)
  const meetingsWithFollowUp = completedMeetings.filter(
    (m) => m.follow_up_date,
  );
  let followUpCompleted = 0;
  for (const m of meetingsWithFollowUp) {
    if (m.follow_up_completed) followUpCompleted++;
  }
  const followUpCompletionRate =
    meetingsWithFollowUp.length > 0
      ? Math.round((followUpCompleted / meetingsWithFollowUp.length) * 1000) / 10
      : 0;

  return {
    total_contacts: contacts.length,
    active_contacts: activeContacts.length,
    children_with_social_worker: childrenWithSW.size,
    overdue_contacts: overdueContacts,
    lac_reviews_this_year: reviewsThisYear.length,
    child_participation_rate: childParticipationRate,
    care_plan_agreement_rate: carePlanAgreementRate,
    home_report_submission_rate: homeReportSubmissionRate,
    meetings_this_quarter: meetingsThisQuarter.length,
    by_meeting_type: byMeetingType,
    follow_up_completion_rate: followUpCompletionRate,
  };
}

/**
 * Identify alerts requiring management attention from multi-agency data.
 * Covers Reg 5 (engagement), Reg 13 (leadership), and Working Together 2018.
 */
export function identifyMultiAgencyAlerts(
  contacts: ProfessionalContact[],
  lacReviews: LACReview[],
  meetings: ProfessionalMeeting[],
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
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

  // ── Contact alerts ───────────────────────────────────────────────────

  // Build a set of child IDs that have at least one active social worker
  const childrenWithSW = new Set(
    contacts
      .filter((c) => c.status === "active" && c.role === "social_worker" && c.child_id)
      .map((c) => c.child_id),
  );

  // Build a set of all unique child IDs from contacts
  const allChildIds = new Set(
    contacts.filter((c) => c.child_id).map((c) => c.child_id),
  );
  // Also include children from LAC reviews
  for (const r of lacReviews) {
    allChildIds.add(r.child_id);
  }
  // Also include children from meetings
  for (const m of meetings) {
    if (m.child_id) allChildIds.add(m.child_id);
  }

  // Missing social worker for a child — critical
  for (const childId of allChildIds) {
    if (!childrenWithSW.has(childId)) {
      // Find the child name from any source
      const contactForChild = contacts.find((c) => c.child_id === childId && c.child_name);
      const reviewForChild = lacReviews.find((r) => r.child_id === childId);
      const meetingForChild = meetings.find((m) => m.child_id === childId && m.child_name);
      const childName =
        contactForChild?.child_name ??
        reviewForChild?.child_name ??
        meetingForChild?.child_name ??
        "Unknown";

      alerts.push({
        type: "missing_social_worker",
        severity: "critical",
        message: `No active social worker recorded for ${childName} — Reg 5 requires engagement with placing authority`,
        id: childId!,
      });
    }
  }

  // Social worker contact overdue > 14 days — high
  for (const c of contacts) {
    if (
      c.status === "active" &&
      c.role === "social_worker" &&
      c.next_contact_due
    ) {
      const dueDate = new Date(c.next_contact_due).getTime();
      if (now.getTime() - dueDate > fourteenDaysMs) {
        const daysOverdue = Math.round(
          (now.getTime() - dueDate) / (1000 * 60 * 60 * 24),
        );
        alerts.push({
          type: "sw_contact_overdue",
          severity: "high",
          message: `Social worker contact with ${c.professional_name} is ${daysOverdue} days overdue — Working Together 2018 requires regular inter-agency communication`,
          id: c.id,
        });
      }
    }
  }

  // No professional contacts for a child — high
  const childrenWithContacts = new Set(
    contacts.filter((c) => c.status === "active" && c.child_id).map((c) => c.child_id),
  );
  for (const childId of allChildIds) {
    if (!childrenWithContacts.has(childId)) {
      const reviewForChild = lacReviews.find((r) => r.child_id === childId);
      const meetingForChild = meetings.find((m) => m.child_id === childId && m.child_name);
      const childName =
        reviewForChild?.child_name ??
        meetingForChild?.child_name ??
        "Unknown";

      alerts.push({
        type: "no_professional_contacts",
        severity: "high",
        message: `No active professional contacts recorded for ${childName} — Reg 5 requires a network of professionals around each child`,
        id: childId!,
      });
    }
  }

  // ── LAC review alerts ────────────────────────────────────────────────

  for (const r of lacReviews) {
    // LAC review overdue — critical
    if (
      r.status === "scheduled" &&
      new Date(r.review_date) < now
    ) {
      const daysOverdue = Math.round(
        (now.getTime() - new Date(r.review_date).getTime()) / (1000 * 60 * 60 * 24),
      );
      alerts.push({
        type: "lac_review_overdue",
        severity: "critical",
        message: `LAC review for ${r.child_name} is ${daysOverdue} days overdue — statutory review timescales breached`,
        id: r.id,
      });
    }

    // Home report not submitted before review — high
    if (
      r.status === "scheduled" &&
      !r.home_report_submitted
    ) {
      const reviewDate = new Date(r.review_date);
      const sevenDaysBefore = new Date(reviewDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (now >= sevenDaysBefore) {
        alerts.push({
          type: "home_report_not_submitted",
          severity: "high",
          message: `Home report not yet submitted for ${r.child_name}'s LAC review on ${r.review_date} — Reg 13 requires timely reporting`,
          id: r.id,
        });
      }
    }

    // Child not participating in reviews — medium
    if (
      r.status === "completed" &&
      !r.child_contributed
    ) {
      alerts.push({
        type: "child_not_participating",
        severity: "medium",
        message: `${r.child_name} did not contribute to their LAC review on ${r.review_date} — child's voice must be captured per Working Together 2018`,
        id: r.id,
      });
    }
  }

  // ── Meeting alerts ───────────────────────────────────────────────────

  for (const m of meetings) {
    // Follow-up actions overdue — high
    if (
      m.status === "completed" &&
      m.follow_up_date &&
      !m.follow_up_completed &&
      new Date(m.follow_up_date) < now
    ) {
      const daysOverdue = Math.round(
        (now.getTime() - new Date(m.follow_up_date).getTime()) / (1000 * 60 * 60 * 24),
      );
      alerts.push({
        type: "follow_up_overdue",
        severity: "high",
        message: `Follow-up actions from ${m.meeting_type.replace(/_/g, " ")} on ${m.meeting_date} are ${daysOverdue} days overdue — Reg 13 requires effective follow-through`,
        id: m.id,
      });
    }

    // Meeting cancelled without reschedule — medium
    if (m.status === "cancelled") {
      // Check if there is a subsequent meeting of the same type for the same child
      const rescheduled = meetings.some(
        (other) =>
          other.id !== m.id &&
          other.child_id === m.child_id &&
          other.meeting_type === m.meeting_type &&
          other.status !== "cancelled" &&
          new Date(other.meeting_date) > new Date(m.meeting_date),
      );

      if (!rescheduled) {
        alerts.push({
          type: "meeting_cancelled_no_reschedule",
          severity: "medium",
          message: `${m.meeting_type.replace(/_/g, " ")} on ${m.meeting_date} was cancelled and has not been rescheduled — Working Together 2018 requires continuity of multi-agency planning`,
          id: m.id,
        });
      }
    }
  }

  return alerts;
}

// ── CRUD — Professional Contacts ───────────────────────────────────────

export async function listContacts(
  homeId: string,
  filters?: {
    childId?: string;
    role?: ProfessionalRole;
    status?: ContactStatus;
    limit?: number;
  },
): Promise<ServiceResult<ProfessionalContact[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_professional_contacts") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.role) q = q.eq("role", filters.role);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createContact(
  input: {
    homeId: string;
    childId?: string;
    childName?: string;
    professionalName: string;
    role: ProfessionalRole;
    organisation: string;
    email?: string;
    phone?: string;
    isPrimaryContact?: boolean;
    relationshipStartDate?: string;
    lastContactDate?: string;
    nextContactDue?: string;
    notes?: string;
  },
): Promise<ServiceResult<ProfessionalContact>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_professional_contacts") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId ?? null,
      child_name: input.childName ?? null,
      professional_name: input.professionalName,
      role: input.role,
      organisation: input.organisation,
      email: input.email ?? null,
      phone: input.phone ?? null,
      is_primary_contact: input.isPrimaryContact ?? false,
      relationship_start_date: input.relationshipStartDate ?? null,
      last_contact_date: input.lastContactDate ?? null,
      next_contact_due: input.nextContactDue ?? null,
      status: "active",
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateContact(
  id: string,
  updates: Partial<ProfessionalContact>,
): Promise<ServiceResult<ProfessionalContact>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_professional_contacts") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — LAC Reviews ─────────────────────────────────────────────────

export async function listLACReviews(
  homeId: string,
  filters?: {
    childId?: string;
    reviewType?: LACReviewType;
    status?: ReviewStatus;
    limit?: number;
  },
): Promise<ServiceResult<LACReview[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_lac_reviews") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.reviewType) q = q.eq("review_type", filters.reviewType);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("review_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createLACReview(
  input: {
    homeId: string;
    childId: string;
    childName: string;
    reviewDate: string;
    reviewType: LACReviewType;
    chairedBy: string;
    venue?: string;
    childAttended?: boolean;
    childContributed?: boolean;
    contributionMethod?: ContributionMethod;
    carePlanAgreed?: boolean;
    placementConfirmed?: boolean;
    keyDecisions?: unknown[];
    actions?: unknown[];
    nextReviewDate?: string;
    nextReviewType?: LACReviewType;
    homeReportSubmitted?: boolean;
    homeReportSubmittedDate?: string;
    status?: ReviewStatus;
    notes?: string;
  },
): Promise<ServiceResult<LACReview>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_lac_reviews") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId,
      child_name: input.childName,
      review_date: input.reviewDate,
      review_type: input.reviewType,
      chaired_by: input.chairedBy,
      venue: input.venue ?? null,
      child_attended: input.childAttended ?? false,
      child_contributed: input.childContributed ?? false,
      contribution_method: input.contributionMethod ?? null,
      care_plan_agreed: input.carePlanAgreed ?? false,
      placement_confirmed: input.placementConfirmed ?? false,
      key_decisions: input.keyDecisions ?? [],
      actions: input.actions ?? [],
      next_review_date: input.nextReviewDate ?? null,
      next_review_type: input.nextReviewType ?? null,
      home_report_submitted: input.homeReportSubmitted ?? false,
      home_report_submitted_date: input.homeReportSubmittedDate ?? null,
      status: input.status ?? "scheduled",
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateLACReview(
  id: string,
  updates: Partial<LACReview>,
): Promise<ServiceResult<LACReview>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_lac_reviews") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Professional Meetings ───────────────────────────────────────

export async function listMeetings(
  homeId: string,
  filters?: {
    childId?: string;
    meetingType?: MeetingType;
    status?: MeetingStatus;
    limit?: number;
  },
): Promise<ServiceResult<ProfessionalMeeting[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_professional_meetings") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.meetingType) q = q.eq("meeting_type", filters.meetingType);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("meeting_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createMeeting(
  input: {
    homeId: string;
    childId?: string;
    childName?: string;
    meetingDate: string;
    meetingType: MeetingType;
    purpose: string;
    location?: string;
    attendees?: unknown[];
    apologies?: unknown[];
    homeRepresentative: string;
    keyDecisions?: unknown[];
    actions?: unknown[];
    followUpDate?: string;
    followUpCompleted?: boolean;
    status?: MeetingStatus;
    notes?: string;
  },
): Promise<ServiceResult<ProfessionalMeeting>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_professional_meetings") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId ?? null,
      child_name: input.childName ?? null,
      meeting_date: input.meetingDate,
      meeting_type: input.meetingType,
      purpose: input.purpose,
      location: input.location ?? null,
      attendees: input.attendees ?? [],
      apologies: input.apologies ?? [],
      home_representative: input.homeRepresentative,
      key_decisions: input.keyDecisions ?? [],
      actions: input.actions ?? [],
      follow_up_date: input.followUpDate ?? null,
      follow_up_completed: input.followUpCompleted ?? false,
      status: input.status ?? "scheduled",
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateMeeting(
  id: string,
  updates: Partial<ProfessionalMeeting>,
): Promise<ServiceResult<ProfessionalMeeting>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_professional_meetings") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeMultiAgencyMetrics,
  identifyMultiAgencyAlerts,
};
