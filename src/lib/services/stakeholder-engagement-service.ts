// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAKEHOLDER ENGAGEMENT SERVICE
// Manages relationships and communication with social workers, placing
// authorities, parents/carers, IROs, advocates, and other professionals.
// CHR 2015 Reg 45 (independent person — collaboration with external),
// Reg 44 (visiting requirements), Reg 36 (notifications to stakeholders),
// Reg 14 (care planning — multi-agency working).
//
// Tracks stakeholder contacts, satisfaction, professional relationships,
// communication frequency, and ensures effective multi-agency collaboration
// in the best interests of children.
//
// SCCIF: Well-Led — "The home works effectively with external agencies."
// Helped & Protected — "Children benefit from effective multi-agency working."
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

export type StakeholderType =
  | "social_worker"
  | "placing_authority"
  | "parent_carer"
  | "iro"
  | "advocate"
  | "camhs"
  | "school"
  | "health_professional"
  | "police"
  | "ofsted"
  | "legal"
  | "voluntary_sector"
  | "other";

export type EngagementMethod =
  | "phone"
  | "email"
  | "meeting"
  | "video_call"
  | "letter"
  | "visit"
  | "conference"
  | "report"
  | "other";

export type RelationshipQuality =
  | "excellent"
  | "good"
  | "adequate"
  | "strained"
  | "poor";

export type FeedbackRating =
  | "very_satisfied"
  | "satisfied"
  | "neutral"
  | "dissatisfied"
  | "very_dissatisfied";

export interface StakeholderContact {
  id: string;
  home_id: string;
  stakeholder_type: StakeholderType;
  stakeholder_name: string;
  organisation: string;
  child_id: string | null;
  child_name: string | null;
  contact_date: string;
  engagement_method: EngagementMethod;
  initiated_by: "home" | "stakeholder";
  purpose: string;
  summary: string;
  outcomes: string | null;
  actions_agreed: string[];
  follow_up_date: string | null;
  follow_up_completed: boolean;
  staff_member: string;
  notes: string | null;
  created_at: string;
}

export interface StakeholderFeedback {
  id: string;
  home_id: string;
  stakeholder_type: StakeholderType;
  stakeholder_name: string;
  organisation: string;
  feedback_date: string;
  rating: FeedbackRating;
  communication_rating: FeedbackRating;
  responsiveness_rating: FeedbackRating;
  information_sharing_rating: FeedbackRating;
  overall_relationship: RelationshipQuality;
  strengths: string | null;
  areas_for_improvement: string | null;
  comments: string | null;
  collected_by: string;
  created_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const STAKEHOLDER_TYPES: { type: StakeholderType; label: string }[] = [
  { type: "social_worker", label: "Social Worker" },
  { type: "placing_authority", label: "Placing Authority" },
  { type: "parent_carer", label: "Parent/Carer" },
  { type: "iro", label: "IRO" },
  { type: "advocate", label: "Advocate" },
  { type: "camhs", label: "CAMHS" },
  { type: "school", label: "School" },
  { type: "health_professional", label: "Health Professional" },
  { type: "police", label: "Police" },
  { type: "ofsted", label: "Ofsted" },
  { type: "legal", label: "Legal" },
  { type: "voluntary_sector", label: "Voluntary Sector" },
  { type: "other", label: "Other" },
];

export const ENGAGEMENT_METHODS: { method: EngagementMethod; label: string }[] = [
  { method: "phone", label: "Phone" },
  { method: "email", label: "Email" },
  { method: "meeting", label: "Meeting" },
  { method: "video_call", label: "Video Call" },
  { method: "letter", label: "Letter" },
  { method: "visit", label: "Visit" },
  { method: "conference", label: "Conference" },
  { method: "report", label: "Report" },
  { method: "other", label: "Other" },
];

export const RELATIONSHIP_QUALITIES: { quality: RelationshipQuality; label: string }[] = [
  { quality: "excellent", label: "Excellent" },
  { quality: "good", label: "Good" },
  { quality: "adequate", label: "Adequate" },
  { quality: "strained", label: "Strained" },
  { quality: "poor", label: "Poor" },
];

export const FEEDBACK_RATINGS: { rating: FeedbackRating; label: string }[] = [
  { rating: "very_satisfied", label: "Very Satisfied" },
  { rating: "satisfied", label: "Satisfied" },
  { rating: "neutral", label: "Neutral" },
  { rating: "dissatisfied", label: "Dissatisfied" },
  { rating: "very_dissatisfied", label: "Very Dissatisfied" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute stakeholder engagement metrics.
 */
export function computeEngagementMetrics(
  contacts: StakeholderContact[],
  feedback: StakeholderFeedback[],
): {
  total_contacts: number;
  contacts_this_month: number;
  unique_stakeholders: number;
  by_stakeholder_type: Record<string, number>;
  by_engagement_method: Record<string, number>;
  home_initiated_rate: number | null;
  follow_up_completion_rate: number | null;
  overdue_follow_ups: number;
  avg_satisfaction_score: number | null;
  relationship_distribution: Record<string, number>;
  feedback_count: number;
} {
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 86400000);

  // Contacts this month
  const contactsThisMonth = contacts.filter(
    (c) => new Date(c.contact_date) >= monthAgo,
  ).length;

  // Unique stakeholders
  const uniqueStakeholders = new Set(contacts.map((c) => c.stakeholder_name)).size;

  // By stakeholder type
  const byStakeholderType: Record<string, number> = {};
  for (const c of contacts) {
    byStakeholderType[c.stakeholder_type] =
      (byStakeholderType[c.stakeholder_type] ?? 0) + 1;
  }

  // By engagement method
  const byEngagementMethod: Record<string, number> = {};
  for (const c of contacts) {
    byEngagementMethod[c.engagement_method] =
      (byEngagementMethod[c.engagement_method] ?? 0) + 1;
  }

  // Home initiated rate
  let homeInitiated = 0;
  for (const c of contacts) {
    if (c.initiated_by === "home") homeInitiated++;
  }
  const homeInitiatedRate =
    contacts.length > 0
      ? Math.round((homeInitiated / contacts.length) * 1000) / 10
      : null;

  // Follow-up completion
  let followUpsNeeded = 0;
  let followUpsCompleted = 0;
  let overdueFollowUps = 0;
  for (const c of contacts) {
    if (c.follow_up_date) {
      followUpsNeeded++;
      if (c.follow_up_completed) {
        followUpsCompleted++;
      } else if (new Date(c.follow_up_date) < now) {
        overdueFollowUps++;
      }
    }
  }
  const followUpCompletionRate =
    followUpsNeeded > 0
      ? Math.round((followUpsCompleted / followUpsNeeded) * 1000) / 10
      : null;

  // Satisfaction score (very_satisfied=5, satisfied=4, neutral=3, dissatisfied=2, very_dissatisfied=1)
  const ratingScores: Record<string, number> = {
    very_satisfied: 5,
    satisfied: 4,
    neutral: 3,
    dissatisfied: 2,
    very_dissatisfied: 1,
  };
  let totalSat = 0;
  let satCount = 0;
  for (const f of feedback) {
    if (ratingScores[f.rating] != null) {
      totalSat += ratingScores[f.rating];
      satCount++;
    }
  }
  const avgSatisfactionScore =
    satCount > 0
      ? Math.round((totalSat / satCount) * 10) / 10
      : null;

  // Relationship distribution
  const relationshipDist: Record<string, number> = {};
  for (const f of feedback) {
    relationshipDist[f.overall_relationship] =
      (relationshipDist[f.overall_relationship] ?? 0) + 1;
  }

  return {
    total_contacts: contacts.length,
    contacts_this_month: contactsThisMonth,
    unique_stakeholders: uniqueStakeholders,
    by_stakeholder_type: byStakeholderType,
    by_engagement_method: byEngagementMethod,
    home_initiated_rate: homeInitiatedRate,
    follow_up_completion_rate: followUpCompletionRate,
    overdue_follow_ups: overdueFollowUps,
    avg_satisfaction_score: avgSatisfactionScore,
    relationship_distribution: relationshipDist,
    feedback_count: feedback.length,
  };
}

/**
 * Identify stakeholder engagement alerts.
 */
export function identifyEngagementAlerts(
  contacts: StakeholderContact[],
  feedback: StakeholderFeedback[],
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

  // ── Follow-up alerts ────────────────────────────────────────────────

  for (const c of contacts) {
    if (c.follow_up_date && !c.follow_up_completed && new Date(c.follow_up_date) < now) {
      const daysOverdue = Math.round(
        (now.getTime() - new Date(c.follow_up_date).getTime()) / 86400000,
      );
      alerts.push({
        type: "follow_up_overdue",
        severity: daysOverdue > 14 ? "high" : "medium",
        message: `Follow-up with ${c.stakeholder_name} (${c.stakeholder_type.replace(/_/g, " ")}) is ${daysOverdue} days overdue`,
        id: c.id,
      });
    }
  }

  // ── Relationship alerts ─────────────────────────────────────────────

  for (const f of feedback) {
    if (f.overall_relationship === "poor") {
      alerts.push({
        type: "poor_relationship",
        severity: "high",
        message: `Relationship with ${f.stakeholder_name} (${f.stakeholder_type.replace(/_/g, " ")}) rated 'poor' — review and develop action plan`,
        id: f.id,
      });
    } else if (f.overall_relationship === "strained") {
      alerts.push({
        type: "strained_relationship",
        severity: "medium",
        message: `Relationship with ${f.stakeholder_name} (${f.stakeholder_type.replace(/_/g, " ")}) rated 'strained' — consider proactive engagement`,
        id: f.id,
      });
    }
  }

  // ── Communication gap alerts ────────────────────────────────────────

  // Social workers not contacted in 30 days
  const swContacts = contacts.filter((c) => c.stakeholder_type === "social_worker");
  const swNames = new Set(swContacts.map((c) => c.stakeholder_name));
  for (const swName of swNames) {
    const lastContact = swContacts
      .filter((c) => c.stakeholder_name === swName)
      .sort((a, b) => new Date(b.contact_date).getTime() - new Date(a.contact_date).getTime())[0];
    if (lastContact) {
      const daysSince = Math.round(
        (now.getTime() - new Date(lastContact.contact_date).getTime()) / 86400000,
      );
      if (daysSince > 30) {
        alerts.push({
          type: "social_worker_no_contact",
          severity: "medium",
          message: `No contact with social worker ${swName} in ${daysSince} days — maintain regular communication`,
          id: lastContact.id,
        });
      }
    }
  }

  // ── Dissatisfaction alerts ──────────────────────────────────────────

  for (const f of feedback) {
    if (f.rating === "very_dissatisfied") {
      alerts.push({
        type: "stakeholder_very_dissatisfied",
        severity: "high",
        message: `${f.stakeholder_name} rated overall satisfaction as 'very dissatisfied' — immediate response required`,
        id: f.id,
      });
    }
  }

  return alerts;
}

// ── CRUD — Stakeholder Contacts ─────────────────────────────────────────

export async function listContacts(
  homeId: string,
  filters?: {
    stakeholderType?: StakeholderType;
    childId?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<StakeholderContact[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_stakeholder_contacts") as SB).select("*").eq("home_id", homeId);
  if (filters?.stakeholderType) q = q.eq("stakeholder_type", filters.stakeholderType);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.dateFrom) q = q.gte("contact_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("contact_date", filters.dateTo);
  q = q.order("contact_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createContact(
  input: {
    homeId: string;
    stakeholderType: StakeholderType;
    stakeholderName: string;
    organisation: string;
    childId?: string;
    childName?: string;
    contactDate: string;
    engagementMethod: EngagementMethod;
    initiatedBy: "home" | "stakeholder";
    purpose: string;
    summary: string;
    outcomes?: string;
    actionsAgreed?: string[];
    followUpDate?: string;
    staffMember: string;
    notes?: string;
  },
): Promise<ServiceResult<StakeholderContact>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_stakeholder_contacts") as SB)
    .insert({
      home_id: input.homeId,
      stakeholder_type: input.stakeholderType,
      stakeholder_name: input.stakeholderName,
      organisation: input.organisation,
      child_id: input.childId ?? null,
      child_name: input.childName ?? null,
      contact_date: input.contactDate,
      engagement_method: input.engagementMethod,
      initiated_by: input.initiatedBy,
      purpose: input.purpose,
      summary: input.summary,
      outcomes: input.outcomes ?? null,
      actions_agreed: input.actionsAgreed ?? [],
      follow_up_date: input.followUpDate ?? null,
      follow_up_completed: false,
      staff_member: input.staffMember,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Stakeholder Feedback ─────────────────────────────────────────

export async function listFeedback(
  homeId: string,
  filters?: {
    stakeholderType?: StakeholderType;
    limit?: number;
  },
): Promise<ServiceResult<StakeholderFeedback[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_stakeholder_feedback") as SB).select("*").eq("home_id", homeId);
  if (filters?.stakeholderType) q = q.eq("stakeholder_type", filters.stakeholderType);
  q = q.order("feedback_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createFeedback(
  input: {
    homeId: string;
    stakeholderType: StakeholderType;
    stakeholderName: string;
    organisation: string;
    feedbackDate: string;
    rating: FeedbackRating;
    communicationRating: FeedbackRating;
    responsivenessRating: FeedbackRating;
    informationSharingRating: FeedbackRating;
    overallRelationship: RelationshipQuality;
    strengths?: string;
    areasForImprovement?: string;
    comments?: string;
    collectedBy: string;
  },
): Promise<ServiceResult<StakeholderFeedback>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_stakeholder_feedback") as SB)
    .insert({
      home_id: input.homeId,
      stakeholder_type: input.stakeholderType,
      stakeholder_name: input.stakeholderName,
      organisation: input.organisation,
      feedback_date: input.feedbackDate,
      rating: input.rating,
      communication_rating: input.communicationRating,
      responsiveness_rating: input.responsivenessRating,
      information_sharing_rating: input.informationSharingRating,
      overall_relationship: input.overallRelationship,
      strengths: input.strengths ?? null,
      areas_for_improvement: input.areasForImprovement ?? null,
      comments: input.comments ?? null,
      collected_by: input.collectedBy,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeEngagementMetrics,
  identifyEngagementAlerts,
};
