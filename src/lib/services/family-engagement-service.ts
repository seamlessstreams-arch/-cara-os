// ══════════════════════════════════════════════════════════════════════════════
// CARA — FAMILY ENGAGEMENT SERVICE
// Manages family contact, relationship quality, parental engagement,
// and family support planning for children in the home.
// CHR 2015 Reg 7 (children's wishes and feelings — contact with family),
// Reg 14 (care planning — family contact arrangements),
// Reg 6 (quality and purpose of care — maintaining family relationships).
//
// Tracks all family contact sessions, monitors relationship quality,
// ensures contact arrangements in care plans are delivered, and
// identifies children with declining family engagement.
//
// SCCIF: Experiences and Progress — "Children maintain positive
// relationships with their families where it is safe to do so."
// "Contact arrangements support children's wellbeing."
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

export type ContactType =
  | "face_to_face"
  | "supervised"
  | "unsupervised"
  | "video_call"
  | "phone_call"
  | "letter"
  | "email"
  | "overnight_stay"
  | "community_outing"
  | "other";

export type ContactOutcome =
  | "positive"
  | "mixed"
  | "difficult"
  | "distressing"
  | "cancelled_family"
  | "cancelled_child"
  | "cancelled_authority"
  | "dna_family"
  | "dna_child";

export type FamilyMemberType =
  | "birth_mother"
  | "birth_father"
  | "step_parent"
  | "sibling"
  | "grandparent"
  | "aunt_uncle"
  | "cousin"
  | "other_relative"
  | "family_friend"
  | "other";

export type RelationshipQuality =
  | "strong"
  | "developing"
  | "fragile"
  | "strained"
  | "no_contact";

export type EngagementTrend =
  | "improving"
  | "stable"
  | "declining"
  | "new";

export interface FamilyContact {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  family_member_name: string;
  family_member_type: FamilyMemberType;
  contact_type: ContactType;
  contact_date: string;
  duration_minutes: number;
  outcome: ContactOutcome;
  child_mood_before: string | null;
  child_mood_after: string | null;
  supervised: boolean;
  supervisor_name: string | null;
  notes: string | null;
  follow_up_actions: string[];
  recorded_by: string;
  created_at: string;
}

export interface FamilyRelationship {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  family_member_name: string;
  family_member_type: FamilyMemberType;
  relationship_quality: RelationshipQuality;
  engagement_trend: EngagementTrend;
  contact_frequency_agreed: string;
  contact_frequency_actual: string;
  last_contact_date: string | null;
  court_order_restrictions: boolean;
  risk_assessment_in_place: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const CONTACT_TYPES: { type: ContactType; label: string }[] = [
  { type: "face_to_face", label: "Face to Face" },
  { type: "supervised", label: "Supervised" },
  { type: "unsupervised", label: "Unsupervised" },
  { type: "video_call", label: "Video Call" },
  { type: "phone_call", label: "Phone Call" },
  { type: "letter", label: "Letter" },
  { type: "email", label: "Email" },
  { type: "overnight_stay", label: "Overnight Stay" },
  { type: "community_outing", label: "Community Outing" },
  { type: "other", label: "Other" },
];

export const CONTACT_OUTCOMES: { outcome: ContactOutcome; label: string }[] = [
  { outcome: "positive", label: "Positive" },
  { outcome: "mixed", label: "Mixed" },
  { outcome: "difficult", label: "Difficult" },
  { outcome: "distressing", label: "Distressing" },
  { outcome: "cancelled_family", label: "Cancelled (Family)" },
  { outcome: "cancelled_child", label: "Cancelled (Child)" },
  { outcome: "cancelled_authority", label: "Cancelled (Authority)" },
  { outcome: "dna_family", label: "DNA (Family)" },
  { outcome: "dna_child", label: "DNA (Child)" },
];

export const FAMILY_MEMBER_TYPES: { type: FamilyMemberType; label: string }[] = [
  { type: "birth_mother", label: "Birth Mother" },
  { type: "birth_father", label: "Birth Father" },
  { type: "step_parent", label: "Step Parent" },
  { type: "sibling", label: "Sibling" },
  { type: "grandparent", label: "Grandparent" },
  { type: "aunt_uncle", label: "Aunt/Uncle" },
  { type: "cousin", label: "Cousin" },
  { type: "other_relative", label: "Other Relative" },
  { type: "family_friend", label: "Family Friend" },
  { type: "other", label: "Other" },
];

export const RELATIONSHIP_QUALITIES: { quality: RelationshipQuality; label: string }[] = [
  { quality: "strong", label: "Strong" },
  { quality: "developing", label: "Developing" },
  { quality: "fragile", label: "Fragile" },
  { quality: "strained", label: "Strained" },
  { quality: "no_contact", label: "No Contact" },
];

export const ENGAGEMENT_TRENDS: { trend: EngagementTrend; label: string }[] = [
  { trend: "improving", label: "Improving" },
  { trend: "stable", label: "Stable" },
  { trend: "declining", label: "Declining" },
  { trend: "new", label: "New" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute family engagement metrics.
 */
export function computeEngagementMetrics(
  contacts: FamilyContact[],
  relationships: FamilyRelationship[],
  totalChildren: number,
  now: Date = new Date(),
): {
  total_contacts: number;
  contacts_this_month: number;
  contacts_this_quarter: number;
  children_with_contact: number;
  positive_contact_rate: number | null;
  cancelled_dna_rate: number | null;
  avg_contact_duration: number | null;
  relationships_strong: number;
  relationships_fragile: number;
  relationships_no_contact: number;
  engagement_improving: number;
  engagement_declining: number;
  by_contact_type: Record<string, number>;
  by_outcome: Record<string, number>;
  by_family_member_type: Record<string, number>;
} {
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Contact counts
  const thisMonth = contacts.filter(
    (c) => new Date(c.contact_date) >= thirtyDaysAgo && new Date(c.contact_date) <= now,
  );
  const thisQuarter = contacts.filter(
    (c) => new Date(c.contact_date) >= ninetyDaysAgo && new Date(c.contact_date) <= now,
  );
  const childrenWithContact = new Set(contacts.map((c) => c.child_id)).size;

  // Outcome rates
  const completedContacts = contacts.filter(
    (c) =>
      c.outcome === "positive" ||
      c.outcome === "mixed" ||
      c.outcome === "difficult" ||
      c.outcome === "distressing",
  );
  const positiveContacts = contacts.filter((c) => c.outcome === "positive").length;
  const cancelledDna = contacts.filter(
    (c) =>
      c.outcome === "cancelled_family" ||
      c.outcome === "cancelled_child" ||
      c.outcome === "cancelled_authority" ||
      c.outcome === "dna_family" ||
      c.outcome === "dna_child",
  ).length;

  const positiveRate =
    completedContacts.length > 0
      ? Math.round((positiveContacts / completedContacts.length) * 1000) / 10
      : null;
  const cancelledDnaRate =
    contacts.length > 0
      ? Math.round((cancelledDna / contacts.length) * 1000) / 10
      : null;

  // Duration
  const avgDuration =
    completedContacts.length > 0
      ? Math.round(
          completedContacts.reduce((sum, c) => sum + c.duration_minutes, 0) /
            completedContacts.length,
        )
      : null;

  // Relationship quality
  let strong = 0;
  let fragile = 0;
  let noContact = 0;
  let improving = 0;
  let declining = 0;

  for (const r of relationships) {
    if (r.relationship_quality === "strong") strong++;
    if (r.relationship_quality === "fragile") fragile++;
    if (r.relationship_quality === "no_contact") noContact++;
    if (r.engagement_trend === "improving") improving++;
    if (r.engagement_trend === "declining") declining++;
  }

  // By type
  const byContactType: Record<string, number> = {};
  for (const c of contacts) {
    byContactType[c.contact_type] = (byContactType[c.contact_type] ?? 0) + 1;
  }

  // By outcome
  const byOutcome: Record<string, number> = {};
  for (const c of contacts) {
    byOutcome[c.outcome] = (byOutcome[c.outcome] ?? 0) + 1;
  }

  // By family member type
  const byFamilyMemberType: Record<string, number> = {};
  for (const c of contacts) {
    byFamilyMemberType[c.family_member_type] =
      (byFamilyMemberType[c.family_member_type] ?? 0) + 1;
  }

  return {
    total_contacts: contacts.length,
    contacts_this_month: thisMonth.length,
    contacts_this_quarter: thisQuarter.length,
    children_with_contact: childrenWithContact,
    positive_contact_rate: positiveRate,
    cancelled_dna_rate: cancelledDnaRate,
    avg_contact_duration: avgDuration,
    relationships_strong: strong,
    relationships_fragile: fragile,
    relationships_no_contact: noContact,
    engagement_improving: improving,
    engagement_declining: declining,
    by_contact_type: byContactType,
    by_outcome: byOutcome,
    by_family_member_type: byFamilyMemberType,
  };
}

/**
 * Identify family engagement alerts.
 */
export function identifyEngagementAlerts(
  contacts: FamilyContact[],
  relationships: FamilyRelationship[],
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

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Distressing contact
  const recentDistressing = contacts.filter(
    (c) =>
      c.outcome === "distressing" &&
      new Date(c.contact_date) >= thirtyDaysAgo,
  );
  for (const c of recentDistressing) {
    alerts.push({
      type: "distressing_contact",
      severity: "high",
      message: `${c.child_name} had distressing contact with ${c.family_member_name} on ${c.contact_date} — review contact arrangements and support plan`,
      id: c.id,
    });
  }

  // Repeated DNA by family
  const dnaByFamily = new Map<string, number>();
  const dnaDetails = new Map<string, FamilyContact>();
  for (const c of contacts) {
    if (c.outcome === "dna_family") {
      const key = `${c.child_id}-${c.family_member_name}`;
      dnaByFamily.set(key, (dnaByFamily.get(key) ?? 0) + 1);
      if (!dnaDetails.has(key)) dnaDetails.set(key, c);
    }
  }
  for (const [key, count] of dnaByFamily) {
    if (count >= 2) {
      const contact = dnaDetails.get(key)!;
      alerts.push({
        type: "repeated_dna",
        severity: "high",
        message: `${contact.family_member_name} has missed ${count} contact sessions with ${contact.child_name} — assess impact on child and review arrangements`,
        id: contact.id,
      });
    }
  }

  // Declining relationships
  for (const r of relationships) {
    if (r.engagement_trend === "declining") {
      alerts.push({
        type: "declining_engagement",
        severity: "medium",
        message: `${r.child_name}'s relationship with ${r.family_member_name} (${FAMILY_MEMBER_TYPES.find((t) => t.type === r.family_member_type)?.label ?? r.family_member_type}) is declining — discuss in key worker session`,
        id: r.id,
      });
    }
  }

  // Strained relationships
  for (const r of relationships) {
    if (r.relationship_quality === "strained") {
      alerts.push({
        type: "strained_relationship",
        severity: "medium",
        message: `${r.child_name}'s relationship with ${r.family_member_name} is strained — consider family mediation or therapeutic support`,
        id: r.id,
      });
    }
  }

  // No contact for 30+ days where contact is expected
  for (const r of relationships) {
    if (
      r.relationship_quality !== "no_contact" &&
      r.last_contact_date &&
      new Date(r.last_contact_date) < thirtyDaysAgo
    ) {
      const daysSince = Math.round(
        (now.getTime() - new Date(r.last_contact_date).getTime()) / (1000 * 60 * 60 * 24),
      );
      alerts.push({
        type: "no_recent_contact",
        severity: daysSince > 60 ? "high" as const : "medium" as const,
        message: `${r.child_name} has had no contact with ${r.family_member_name} for ${daysSince} days — check if contact arrangement needs updating`,
        id: r.id,
      });
    }
  }

  return alerts;
}

// ── CRUD — Family Contacts ──────────────────────────────────────────────

export async function listContacts(
  homeId: string,
  filters?: {
    childId?: string;
    familyMemberType?: FamilyMemberType;
    outcome?: ContactOutcome;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<FamilyContact[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_family_contacts") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.familyMemberType) q = q.eq("family_member_type", filters.familyMemberType);
  if (filters?.outcome) q = q.eq("outcome", filters.outcome);
  if (filters?.dateFrom) q = q.gte("contact_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("contact_date", filters.dateTo);
  q = q.order("contact_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createContact(
  input: {
    homeId: string;
    childId: string;
    childName: string;
    familyMemberName: string;
    familyMemberType: FamilyMemberType;
    contactType: ContactType;
    contactDate: string;
    durationMinutes: number;
    outcome: ContactOutcome;
    childMoodBefore?: string;
    childMoodAfter?: string;
    supervised?: boolean;
    supervisorName?: string;
    notes?: string;
    followUpActions?: string[];
    recordedBy: string;
  },
): Promise<ServiceResult<FamilyContact>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_family_contacts") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId,
      child_name: input.childName,
      family_member_name: input.familyMemberName,
      family_member_type: input.familyMemberType,
      contact_type: input.contactType,
      contact_date: input.contactDate,
      duration_minutes: input.durationMinutes,
      outcome: input.outcome,
      child_mood_before: input.childMoodBefore ?? null,
      child_mood_after: input.childMoodAfter ?? null,
      supervised: input.supervised ?? false,
      supervisor_name: input.supervisorName ?? null,
      notes: input.notes ?? null,
      follow_up_actions: input.followUpActions ?? [],
      recorded_by: input.recordedBy,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Family Relationships ─────────────────────────────────────────

export async function listRelationships(
  homeId: string,
  filters?: {
    childId?: string;
    quality?: RelationshipQuality;
    trend?: EngagementTrend;
    limit?: number;
  },
): Promise<ServiceResult<FamilyRelationship[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_family_relationships") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.quality) q = q.eq("relationship_quality", filters.quality);
  if (filters?.trend) q = q.eq("engagement_trend", filters.trend);
  q = q.order("child_name", { ascending: true }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRelationship(
  input: {
    homeId: string;
    childId: string;
    childName: string;
    familyMemberName: string;
    familyMemberType: FamilyMemberType;
    relationshipQuality: RelationshipQuality;
    engagementTrend: EngagementTrend;
    contactFrequencyAgreed: string;
    contactFrequencyActual: string;
    courtOrderRestrictions?: boolean;
    riskAssessmentInPlace?: boolean;
    notes?: string;
  },
): Promise<ServiceResult<FamilyRelationship>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_family_relationships") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId,
      child_name: input.childName,
      family_member_name: input.familyMemberName,
      family_member_type: input.familyMemberType,
      relationship_quality: input.relationshipQuality,
      engagement_trend: input.engagementTrend,
      contact_frequency_agreed: input.contactFrequencyAgreed,
      contact_frequency_actual: input.contactFrequencyActual,
      court_order_restrictions: input.courtOrderRestrictions ?? false,
      risk_assessment_in_place: input.riskAssessmentInPlace ?? false,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRelationship(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<FamilyRelationship>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_family_relationships") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
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
