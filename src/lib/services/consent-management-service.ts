// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CONSENT MANAGEMENT SERVICE
// Manages consent recording for medical treatment, photographs, outings,
// information sharing, and other activities requiring parental/child consent.
// CHR 2015 Reg 7 (children's wishes and feelings),
// Reg 8 (parental responsibility),
// Reg 14 (healthcare — consent to treatment),
// Reg 32 (provision of information — data sharing consent).
//
// Tracks consent status per child, expiry dates, who gave consent,
// any conditions or restrictions, and ensures consent is current.
//
// SCCIF: Overall Experiences — "Children's wishes and feelings are
// respected." "Consent is sought appropriately and recorded."
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

export type ConsentCategory =
  | "medical_treatment"
  | "dental_treatment"
  | "immunisation"
  | "emergency_medical"
  | "photographs"
  | "social_media"
  | "outings_trips"
  | "overnight_stays"
  | "information_sharing"
  | "education_records"
  | "therapy_counselling"
  | "religious_activities"
  | "contact_arrangements"
  | "research_participation"
  | "other";

export type ConsentStatus =
  | "granted"
  | "refused"
  | "withdrawn"
  | "expired"
  | "pending"
  | "not_applicable";

export type ConsentGivenBy =
  | "parent_mother"
  | "parent_father"
  | "local_authority"
  | "young_person"
  | "guardian"
  | "court_order"
  | "social_worker"
  | "other";

export interface ConsentRecord {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  category: ConsentCategory;
  status: ConsentStatus;
  given_by: ConsentGivenBy;
  given_by_name: string;
  consent_date: string;
  expiry_date: string | null;
  conditions: string | null;
  evidence_on_file: boolean;
  reviewed_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const CONSENT_CATEGORIES: { category: ConsentCategory; label: string }[] = [
  { category: "medical_treatment", label: "Medical Treatment" },
  { category: "dental_treatment", label: "Dental Treatment" },
  { category: "immunisation", label: "Immunisation" },
  { category: "emergency_medical", label: "Emergency Medical" },
  { category: "photographs", label: "Photographs" },
  { category: "social_media", label: "Social Media" },
  { category: "outings_trips", label: "Outings & Trips" },
  { category: "overnight_stays", label: "Overnight Stays" },
  { category: "information_sharing", label: "Information Sharing" },
  { category: "education_records", label: "Education Records" },
  { category: "therapy_counselling", label: "Therapy/Counselling" },
  { category: "religious_activities", label: "Religious Activities" },
  { category: "contact_arrangements", label: "Contact Arrangements" },
  { category: "research_participation", label: "Research Participation" },
  { category: "other", label: "Other" },
];

export const CONSENT_STATUSES: { status: ConsentStatus; label: string }[] = [
  { status: "granted", label: "Granted" },
  { status: "refused", label: "Refused" },
  { status: "withdrawn", label: "Withdrawn" },
  { status: "expired", label: "Expired" },
  { status: "pending", label: "Pending" },
  { status: "not_applicable", label: "Not Applicable" },
];

export const CONSENT_GIVEN_BY: { givenBy: ConsentGivenBy; label: string }[] = [
  { givenBy: "parent_mother", label: "Parent (Mother)" },
  { givenBy: "parent_father", label: "Parent (Father)" },
  { givenBy: "local_authority", label: "Local Authority" },
  { givenBy: "young_person", label: "Young Person" },
  { givenBy: "guardian", label: "Guardian" },
  { givenBy: "court_order", label: "Court Order" },
  { givenBy: "social_worker", label: "Social Worker" },
  { givenBy: "other", label: "Other" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute consent management metrics.
 */
export function computeConsentMetrics(
  records: ConsentRecord[],
  totalChildren: number,
  now: Date = new Date(),
): {
  total_records: number;
  granted_count: number;
  refused_count: number;
  pending_count: number;
  expired_count: number;
  withdrawn_count: number;
  children_with_consent: number;
  consent_coverage: number;
  evidence_on_file_rate: number;
  expiring_soon: number;
  medical_consent_rate: number;
  emergency_consent_rate: number;
  photo_consent_granted: number;
  by_category: Record<string, number>;
  by_status: Record<string, number>;
  by_given_by: Record<string, number>;
} {
  const granted = records.filter((r) => r.status === "granted").length;
  const refused = records.filter((r) => r.status === "refused").length;
  const pending = records.filter((r) => r.status === "pending").length;
  const expired = records.filter((r) => r.status === "expired").length;
  const withdrawn = records.filter((r) => r.status === "withdrawn").length;

  // Also check for records that have expired by date but not marked
  const actuallyExpired = records.filter(
    (r) => r.status === "granted" && r.expiry_date && new Date(r.expiry_date) < now,
  ).length;

  const uniqueChildren = new Set(
    records.filter((r) => r.status === "granted").map((r) => r.child_id),
  ).size;
  const coverage =
    totalChildren > 0
      ? Math.round((uniqueChildren / totalChildren) * 1000) / 10
      : 0;

  const evidenceOnFile = records.filter((r) => r.evidence_on_file).length;
  const evidenceRate =
    records.length > 0
      ? Math.round((evidenceOnFile / records.length) * 1000) / 10
      : 0;

  // Expiring within 30 days
  const thirtyDaysAhead = new Date(now);
  thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);
  const expiringSoon = records.filter(
    (r) =>
      r.status === "granted" &&
      r.expiry_date &&
      new Date(r.expiry_date) >= now &&
      new Date(r.expiry_date) <= thirtyDaysAhead,
  ).length;

  // Medical consent — unique children with granted medical_treatment
  const medicalGranted = new Set(
    records
      .filter((r) => r.category === "medical_treatment" && r.status === "granted")
      .map((r) => r.child_id),
  ).size;
  const medicalRate =
    totalChildren > 0
      ? Math.round((medicalGranted / totalChildren) * 1000) / 10
      : 0;

  // Emergency medical consent
  const emergencyGranted = new Set(
    records
      .filter((r) => r.category === "emergency_medical" && r.status === "granted")
      .map((r) => r.child_id),
  ).size;
  const emergencyRate =
    totalChildren > 0
      ? Math.round((emergencyGranted / totalChildren) * 1000) / 10
      : 0;

  // Photo consent granted count
  const photoGranted = records.filter(
    (r) => r.category === "photographs" && r.status === "granted",
  ).length;

  // By category
  const byCategory: Record<string, number> = {};
  for (const r of records) {
    byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
  }

  // By status
  const byStatus: Record<string, number> = {};
  for (const r of records) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
  }

  // By given by
  const byGivenBy: Record<string, number> = {};
  for (const r of records) {
    byGivenBy[r.given_by] = (byGivenBy[r.given_by] ?? 0) + 1;
  }

  return {
    total_records: records.length,
    granted_count: granted,
    refused_count: refused,
    pending_count: pending,
    expired_count: expired + actuallyExpired,
    withdrawn_count: withdrawn,
    children_with_consent: uniqueChildren,
    consent_coverage: coverage,
    evidence_on_file_rate: evidenceRate,
    expiring_soon: expiringSoon,
    medical_consent_rate: medicalRate,
    emergency_consent_rate: emergencyRate,
    photo_consent_granted: photoGranted,
    by_category: byCategory,
    by_status: byStatus,
    by_given_by: byGivenBy,
  };
}

/**
 * Identify consent management alerts.
 */
export function identifyConsentAlerts(
  records: ConsentRecord[],
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

  // Emergency medical consent not granted
  const childrenWithEmergency = new Set(
    records
      .filter((r) => r.category === "emergency_medical" && r.status === "granted")
      .map((r) => r.child_id),
  );
  if (totalChildren > 0 && childrenWithEmergency.size < totalChildren) {
    const gap = totalChildren - childrenWithEmergency.size;
    alerts.push({
      type: "no_emergency_consent",
      severity: "critical",
      message: `${gap} ${gap === 1 ? "child does" : "children do"} not have emergency medical consent on file — this must be obtained urgently`,
      id: "emergency_gap",
    });
  }

  // Consent expiring within 14 days
  const fourteenDaysAhead = new Date(now);
  fourteenDaysAhead.setDate(fourteenDaysAhead.getDate() + 14);
  for (const r of records) {
    if (
      r.status === "granted" &&
      r.expiry_date &&
      new Date(r.expiry_date) >= now &&
      new Date(r.expiry_date) <= fourteenDaysAhead
    ) {
      alerts.push({
        type: "consent_expiring",
        severity: "medium",
        message: `${r.category.replace(/_/g, " ")} consent for ${r.child_name} expires ${r.expiry_date} — arrange renewal`,
        id: r.id,
      });
    }
  }

  // Already expired but still marked granted
  for (const r of records) {
    if (
      r.status === "granted" &&
      r.expiry_date &&
      new Date(r.expiry_date) < now
    ) {
      alerts.push({
        type: "consent_expired",
        severity: "high",
        message: `${r.category.replace(/_/g, " ")} consent for ${r.child_name} expired on ${r.expiry_date} — do not proceed without renewed consent`,
        id: r.id,
      });
    }
  }

  // Pending consents
  for (const r of records) {
    if (r.status === "pending") {
      alerts.push({
        type: "consent_pending",
        severity: r.category === "medical_treatment" || r.category === "emergency_medical" ? "high" as const : "medium" as const,
        message: `${r.category.replace(/_/g, " ")} consent for ${r.child_name} is pending — chase with ${r.given_by_name}`,
        id: r.id,
      });
    }
  }

  // No evidence on file for granted consent
  for (const r of records) {
    if (r.status === "granted" && !r.evidence_on_file) {
      alerts.push({
        type: "no_evidence",
        severity: "medium",
        message: `${r.category.replace(/_/g, " ")} consent for ${r.child_name} granted but no evidence on file — obtain signed form`,
        id: r.id,
      });
    }
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    childId?: string;
    category?: ConsentCategory;
    status?: ConsentStatus;
    limit?: number;
  },
): Promise<ServiceResult<ConsentRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_consent_records") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.category) q = q.eq("category", filters.category);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("consent_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    childName: string;
    childId: string;
    category: ConsentCategory;
    status: ConsentStatus;
    givenBy: ConsentGivenBy;
    givenByName: string;
    consentDate: string;
    expiryDate?: string;
    conditions?: string;
    evidenceOnFile: boolean;
    notes?: string;
  },
): Promise<ServiceResult<ConsentRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_consent_records") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      category: input.category,
      status: input.status,
      given_by: input.givenBy,
      given_by_name: input.givenByName,
      consent_date: input.consentDate,
      expiry_date: input.expiryDate ?? null,
      conditions: input.conditions ?? null,
      evidence_on_file: input.evidenceOnFile,
      reviewed_date: null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<ConsentRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_consent_records") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeConsentMetrics,
  identifyConsentAlerts,
};
