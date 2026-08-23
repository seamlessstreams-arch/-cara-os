// ══════════════════════════════════════════════════════════════════════════════
// CARA — PROFESSIONAL NETWORK DIRECTORY SERVICE
// Tracks all professionals involved with each child — social worker, IRO,
// CAMHS therapist, guardian, advocate, health visitor, education link,
// YOT worker, and more. Ensures multi-agency communication is effective
// and no child falls through the gaps.
// CHR 2015 Reg 5 (quality and purpose of care),
// Reg 14 (care planning).
//
// SCCIF: "The home works effectively with other agencies."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type ProfessionalRole =
  | "social_worker"
  | "independent_reviewing_officer"
  | "camhs_therapist"
  | "guardian_ad_litem"
  | "advocate"
  | "education_link"
  | "health_visitor"
  | "yot_worker"
  | "family_support_worker"
  | "other";

export type ContactFrequency =
  | "daily"
  | "weekly"
  | "fortnightly"
  | "monthly"
  | "quarterly"
  | "as_needed"
  | "annually"
  | "on_referral"
  | "statutory_only"
  | "other";

export type EngagementQuality =
  | "excellent"
  | "good"
  | "adequate"
  | "poor"
  | "disengaged";

export type RelationshipStatus =
  | "active"
  | "pending_allocation"
  | "on_leave"
  | "changed"
  | "ended";

export interface ProfessionalNetworkRecord {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string | null;
  professional_role: ProfessionalRole;
  contact_frequency: ContactFrequency;
  engagement_quality: EngagementQuality;
  relationship_status: RelationshipStatus;
  session_date: string;
  recorded_by: string;
  professional_name: string;
  organisation: string;
  contact_email: string | null;
  contact_phone: string | null;
  last_contact_date: string | null;
  next_planned_contact: string | null;
  relationship_notes: string | null;
  communication_preferences: string | null;
  escalation_contact: string | null;
  referral_source: string | null;
  approved_by: string | null;
  approved_at: string | null;
  next_review_date: string | null;
  notes: string | null;
  contact_details_current: boolean;
  consent_to_share: boolean;
  regular_communication: boolean;
  attends_reviews: boolean;
  responsive_to_contact: boolean;
  child_aware_of_professional: boolean;
  child_views_shared: boolean;
  information_sharing_agreed: boolean;
  emergency_contact_confirmed: boolean;
  statutory_requirements_met: boolean;
  relationship_quality_reviewed: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const PROFESSIONAL_ROLES: { role: ProfessionalRole; label: string }[] = [
  { role: "social_worker", label: "Social Worker" },
  { role: "independent_reviewing_officer", label: "Independent Reviewing Officer" },
  { role: "camhs_therapist", label: "CAMHS Therapist" },
  { role: "guardian_ad_litem", label: "Guardian ad Litem" },
  { role: "advocate", label: "Advocate" },
  { role: "education_link", label: "Education Link" },
  { role: "health_visitor", label: "Health Visitor" },
  { role: "yot_worker", label: "YOT Worker" },
  { role: "family_support_worker", label: "Family Support Worker" },
  { role: "other", label: "Other" },
];

export const CONTACT_FREQUENCIES: { frequency: ContactFrequency; label: string }[] = [
  { frequency: "daily", label: "Daily" },
  { frequency: "weekly", label: "Weekly" },
  { frequency: "fortnightly", label: "Fortnightly" },
  { frequency: "monthly", label: "Monthly" },
  { frequency: "quarterly", label: "Quarterly" },
  { frequency: "as_needed", label: "As Needed" },
  { frequency: "annually", label: "Annually" },
  { frequency: "on_referral", label: "On Referral" },
  { frequency: "statutory_only", label: "Statutory Only" },
  { frequency: "other", label: "Other" },
];

export const ENGAGEMENT_QUALITIES: { quality: EngagementQuality; label: string }[] = [
  { quality: "excellent", label: "Excellent" },
  { quality: "good", label: "Good" },
  { quality: "adequate", label: "Adequate" },
  { quality: "poor", label: "Poor" },
  { quality: "disengaged", label: "Disengaged" },
];

export const RELATIONSHIP_STATUSES: { status: RelationshipStatus; label: string }[] = [
  { status: "active", label: "Active" },
  { status: "pending_allocation", label: "Pending Allocation" },
  { status: "on_leave", label: "On Leave" },
  { status: "changed", label: "Changed" },
  { status: "ended", label: "Ended" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeProfessionalNetworkMetrics(
  records: ProfessionalNetworkRecord[],
): {
  total_contacts: number;
  poor_engagement_count: number;
  pending_allocation_count: number;
  ended_count: number;
  active_count: number;
  contact_current_rate: number | null;
  consent_rate: number | null;
  communication_rate: number | null;
  attends_reviews_rate: number | null;
  responsive_rate: number | null;
  child_aware_rate: number | null;
  child_views_rate: number | null;
  info_sharing_rate: number | null;
  emergency_contact_rate: number | null;
  statutory_met_rate: number | null;
  quality_reviewed_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_professional_role: Record<string, number>;
  by_contact_frequency: Record<string, number>;
  by_engagement_quality: Record<string, number>;
  by_relationship_status: Record<string, number>;
} {
  const poorEngagement = records.filter(
    (r) => r.engagement_quality === "poor" || r.engagement_quality === "disengaged",
  ).length;
  const pendingAllocation = records.filter(
    (r) => r.relationship_status === "pending_allocation",
  ).length;
  const ended = records.filter((r) => r.relationship_status === "ended").length;
  const active = records.filter((r) => r.relationship_status === "active").length;

  const boolRate = (field: keyof ProfessionalNetworkRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : null;
  };

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byRole: Record<string, number> = {};
  for (const r of records) byRole[r.professional_role] = (byRole[r.professional_role] ?? 0) + 1;

  const byFrequency: Record<string, number> = {};
  for (const r of records) byFrequency[r.contact_frequency] = (byFrequency[r.contact_frequency] ?? 0) + 1;

  const byQuality: Record<string, number> = {};
  for (const r of records) byQuality[r.engagement_quality] = (byQuality[r.engagement_quality] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.relationship_status] = (byStatus[r.relationship_status] ?? 0) + 1;

  return {
    total_contacts: records.length,
    poor_engagement_count: poorEngagement,
    pending_allocation_count: pendingAllocation,
    ended_count: ended,
    active_count: active,
    contact_current_rate: boolRate("contact_details_current"),
    consent_rate: boolRate("consent_to_share"),
    communication_rate: boolRate("regular_communication"),
    attends_reviews_rate: boolRate("attends_reviews"),
    responsive_rate: boolRate("responsive_to_contact"),
    child_aware_rate: boolRate("child_aware_of_professional"),
    child_views_rate: boolRate("child_views_shared"),
    info_sharing_rate: boolRate("information_sharing_agreed"),
    emergency_contact_rate: boolRate("emergency_contact_confirmed"),
    statutory_met_rate: boolRate("statutory_requirements_met"),
    quality_reviewed_rate: boolRate("relationship_quality_reviewed"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: uniqueChildren,
    by_professional_role: byRole,
    by_contact_frequency: byFrequency,
    by_engagement_quality: byQuality,
    by_relationship_status: byStatus,
  };
}

export function identifyProfessionalNetworkAlerts(
  records: ProfessionalNetworkRecord[],
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

  // Critical per-record: disengaged and statutory requirements not met
  for (const r of records) {
    if (r.engagement_quality === "disengaged" && !r.statutory_requirements_met) {
      alerts.push({
        type: "disengaged_statutory",
        severity: "critical",
        message: `${r.child_name}'s ${r.professional_role.replace(/_/g, " ")} is disengaged and statutory requirements not met — escalation needed.`,
        record_id: r.id,
      });
    }
  }

  // High: pending allocation
  const pendingCount = records.filter(
    (r) => r.relationship_status === "pending_allocation",
  ).length;
  if (pendingCount >= 1) {
    alerts.push({
      type: "pending_allocation",
      severity: "high",
      message: `${pendingCount} professional role${pendingCount === 1 ? " is" : "s are"} pending allocation.`,
    });
  }

  // High: contact details outdated
  const outdatedCount = records.filter((r) => !r.contact_details_current).length;
  if (outdatedCount >= 1) {
    alerts.push({
      type: "contact_details_outdated",
      severity: "high",
      message: `${outdatedCount} contact record${outdatedCount === 1 ? " has" : "s have"} outdated details.`,
    });
  }

  // Medium: poor engagement (>= 2)
  const poorCount = records.filter(
    (r) => r.engagement_quality === "poor" || r.engagement_quality === "disengaged",
  ).length;
  if (poorCount >= 2) {
    alerts.push({
      type: "poor_engagement",
      severity: "medium",
      message: `${poorCount} professional contacts have poor or disengaged engagement quality.`,
    });
  }

  // Medium: no information sharing agreed (>= 2)
  const noInfoSharing = records.filter((r) => !r.information_sharing_agreed).length;
  if (noInfoSharing >= 2) {
    alerts.push({
      type: "no_information_sharing",
      severity: "medium",
      message: `${noInfoSharing} professional contacts do not have information sharing agreed.`,
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listProfessionalNetwork(
  homeId: string,
): Promise<ServiceResult<ProfessionalNetworkRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  const { data, error } = await (s.from("cs_professional_network_directory") as SB)
    .select("*")
    .eq("home_id", homeId)
    .order("session_date", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createProfessionalContact(
  input: {
    homeId: string;
    childName: string;
    childId?: string | null;
    professionalRole: ProfessionalRole;
    contactFrequency: ContactFrequency;
    engagementQuality: EngagementQuality;
    relationshipStatus: RelationshipStatus;
    sessionDate: string;
    recordedBy: string;
    professionalName: string;
    organisation: string;
    contactEmail?: string | null;
    contactPhone?: string | null;
    lastContactDate?: string | null;
    nextPlannedContact?: string | null;
    relationshipNotes?: string | null;
    communicationPreferences?: string | null;
    escalationContact?: string | null;
    referralSource?: string | null;
    approvedBy?: string | null;
    approvedAt?: string | null;
    nextReviewDate?: string | null;
    notes?: string | null;
    contactDetailsCurrent: boolean;
    consentToShare: boolean;
    regularCommunication: boolean;
    attendsReviews: boolean;
    responsiveToContact: boolean;
    childAwareOfProfessional: boolean;
    childViewsShared: boolean;
    informationSharingAgreed: boolean;
    emergencyContactConfirmed: boolean;
    statutoryRequirementsMet: boolean;
    relationshipQualityReviewed: boolean;
    recordedPromptly: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
  },
): Promise<ServiceResult<ProfessionalNetworkRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_professional_network_directory") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId ?? null,
      professional_role: input.professionalRole,
      contact_frequency: input.contactFrequency,
      engagement_quality: input.engagementQuality,
      relationship_status: input.relationshipStatus,
      session_date: input.sessionDate,
      recorded_by: input.recordedBy,
      professional_name: input.professionalName,
      organisation: input.organisation,
      contact_email: input.contactEmail ?? null,
      contact_phone: input.contactPhone ?? null,
      last_contact_date: input.lastContactDate ?? null,
      next_planned_contact: input.nextPlannedContact ?? null,
      relationship_notes: input.relationshipNotes ?? null,
      communication_preferences: input.communicationPreferences ?? null,
      escalation_contact: input.escalationContact ?? null,
      referral_source: input.referralSource ?? null,
      approved_by: input.approvedBy ?? null,
      approved_at: input.approvedAt ?? null,
      next_review_date: input.nextReviewDate ?? null,
      notes: input.notes ?? null,
      contact_details_current: input.contactDetailsCurrent,
      consent_to_share: input.consentToShare,
      regular_communication: input.regularCommunication,
      attends_reviews: input.attendsReviews,
      responsive_to_contact: input.responsiveToContact,
      child_aware_of_professional: input.childAwareOfProfessional,
      child_views_shared: input.childViewsShared,
      information_sharing_agreed: input.informationSharingAgreed,
      emergency_contact_confirmed: input.emergencyContactConfirmed,
      statutory_requirements_met: input.statutoryRequirementsMet,
      relationship_quality_reviewed: input.relationshipQualityReviewed,
      recorded_promptly: input.recordedPromptly,
      issues_found: input.issuesFound ?? [],
      actions_taken: input.actionsTaken ?? [],
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateProfessionalContact(
  id: string,
  updates: Partial<Omit<ProfessionalNetworkRecord, "id" | "home_id" | "created_at">>,
): Promise<ServiceResult<ProfessionalNetworkRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_professional_network_directory") as SB)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeProfessionalNetworkMetrics,
  identifyProfessionalNetworkAlerts,
};
