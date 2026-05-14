// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MEDICATION CONSENT SERVICE
// Tracks consent for medication administration from those with
// parental responsibility, local authorities, and young people
// themselves (Gillick competence).
// CHR 2015 Reg 23 (health needs — medication management),
// Reg 34 (care planning — health plans),
// Reg 7 (individual child — consent arrangements).
//
// Covers: consent type, capacity assessment, review dates,
// restrictions, PRN authorisation, self-administration consent,
// and multi-agency agreement.
//
// SCCIF: Health — "Medication consent is properly obtained."
// "Children participate in their own health decisions."
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

export type ConsentType =
  | "parental_consent"
  | "local_authority_consent"
  | "gillick_competence"
  | "court_order"
  | "emergency_authorisation"
  | "prn_consent"
  | "self_administration"
  | "over_the_counter"
  | "homely_remedy"
  | "other";

export type ConsentStatus =
  | "active"
  | "expired"
  | "withdrawn"
  | "pending_review"
  | "refused";

export type MedicationType =
  | "prescribed_regular"
  | "prescribed_prn"
  | "over_the_counter"
  | "homely_remedy"
  | "controlled_drug"
  | "supplement"
  | "topical"
  | "inhaler"
  | "injectable"
  | "other";

export type ConsentGivenBy =
  | "parent_mother"
  | "parent_father"
  | "local_authority"
  | "young_person"
  | "court"
  | "foster_carer"
  | "social_worker"
  | "doctor"
  | "independent_advocate"
  | "other";

export interface MedicationConsentRecord {
  id: string;
  home_id: string;
  consent_type: ConsentType;
  consent_status: ConsentStatus;
  medication_type: MedicationType;
  consent_given_by: ConsentGivenBy;
  consent_date: string;
  child_name: string;
  child_id: string | null;
  medication_name: string;
  consent_documented: boolean;
  capacity_assessed: boolean;
  child_informed: boolean;
  side_effects_explained: boolean;
  alternatives_discussed: boolean;
  review_date_set: boolean;
  social_worker_notified: boolean;
  gp_consulted: boolean;
  restrictions_noted: boolean;
  self_admin_assessed: boolean;
  storage_confirmed: boolean;
  disposal_arranged: boolean;
  issues_found: string[];
  actions_taken: string[];
  recorded_by: string;
  review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const CONSENT_TYPES: { type: ConsentType; label: string }[] = [
  { type: "parental_consent", label: "Parental Consent" },
  { type: "local_authority_consent", label: "Local Authority Consent" },
  { type: "gillick_competence", label: "Gillick Competence" },
  { type: "court_order", label: "Court Order" },
  { type: "emergency_authorisation", label: "Emergency Authorisation" },
  { type: "prn_consent", label: "PRN Consent" },
  { type: "self_administration", label: "Self-Administration" },
  { type: "over_the_counter", label: "Over the Counter" },
  { type: "homely_remedy", label: "Homely Remedy" },
  { type: "other", label: "Other" },
];

export const CONSENT_STATUSES: { status: ConsentStatus; label: string }[] = [
  { status: "active", label: "Active" },
  { status: "expired", label: "Expired" },
  { status: "withdrawn", label: "Withdrawn" },
  { status: "pending_review", label: "Pending Review" },
  { status: "refused", label: "Refused" },
];

export const MEDICATION_TYPES: { type: MedicationType; label: string }[] = [
  { type: "prescribed_regular", label: "Prescribed Regular" },
  { type: "prescribed_prn", label: "Prescribed PRN" },
  { type: "over_the_counter", label: "Over the Counter" },
  { type: "homely_remedy", label: "Homely Remedy" },
  { type: "controlled_drug", label: "Controlled Drug" },
  { type: "supplement", label: "Supplement" },
  { type: "topical", label: "Topical" },
  { type: "inhaler", label: "Inhaler" },
  { type: "injectable", label: "Injectable" },
  { type: "other", label: "Other" },
];

export const CONSENT_GIVEN_BY_OPTIONS: { by: ConsentGivenBy; label: string }[] = [
  { by: "parent_mother", label: "Parent (Mother)" },
  { by: "parent_father", label: "Parent (Father)" },
  { by: "local_authority", label: "Local Authority" },
  { by: "young_person", label: "Young Person" },
  { by: "court", label: "Court" },
  { by: "foster_carer", label: "Foster Carer" },
  { by: "social_worker", label: "Social Worker" },
  { by: "doctor", label: "Doctor" },
  { by: "independent_advocate", label: "Independent Advocate" },
  { by: "other", label: "Other" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeMedicationConsentMetrics(
  records: MedicationConsentRecord[],
): {
  total_consents: number;
  active_count: number;
  expired_count: number;
  withdrawn_count: number;
  refused_count: number;
  consent_documented_rate: number;
  capacity_assessed_rate: number;
  child_informed_rate: number;
  side_effects_explained_rate: number;
  alternatives_discussed_rate: number;
  review_date_set_rate: number;
  social_worker_notified_rate: number;
  gp_consulted_rate: number;
  restrictions_noted_rate: number;
  self_admin_assessed_rate: number;
  storage_confirmed_rate: number;
  disposal_arranged_rate: number;
  unique_children: number;
  by_consent_type: Record<string, number>;
  by_consent_status: Record<string, number>;
  by_medication_type: Record<string, number>;
  by_consent_given_by: Record<string, number>;
} {
  const active = records.filter((r) => r.consent_status === "active").length;
  const expired = records.filter((r) => r.consent_status === "expired").length;
  const withdrawn = records.filter((r) => r.consent_status === "withdrawn").length;
  const refused = records.filter((r) => r.consent_status === "refused").length;

  const boolRate = (field: keyof MedicationConsentRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0
      ? Math.round((count / records.length) * 1000) / 10
      : 0;
  };

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.consent_type] = (byType[r.consent_type] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const r of records) byStatus[r.consent_status] = (byStatus[r.consent_status] ?? 0) + 1;

  const byMedType: Record<string, number> = {};
  for (const r of records) byMedType[r.medication_type] = (byMedType[r.medication_type] ?? 0) + 1;

  const byGivenBy: Record<string, number> = {};
  for (const r of records) byGivenBy[r.consent_given_by] = (byGivenBy[r.consent_given_by] ?? 0) + 1;

  return {
    total_consents: records.length,
    active_count: active,
    expired_count: expired,
    withdrawn_count: withdrawn,
    refused_count: refused,
    consent_documented_rate: boolRate("consent_documented"),
    capacity_assessed_rate: boolRate("capacity_assessed"),
    child_informed_rate: boolRate("child_informed"),
    side_effects_explained_rate: boolRate("side_effects_explained"),
    alternatives_discussed_rate: boolRate("alternatives_discussed"),
    review_date_set_rate: boolRate("review_date_set"),
    social_worker_notified_rate: boolRate("social_worker_notified"),
    gp_consulted_rate: boolRate("gp_consulted"),
    restrictions_noted_rate: boolRate("restrictions_noted"),
    self_admin_assessed_rate: boolRate("self_admin_assessed"),
    storage_confirmed_rate: boolRate("storage_confirmed"),
    disposal_arranged_rate: boolRate("disposal_arranged"),
    unique_children: uniqueChildren,
    by_consent_type: byType,
    by_consent_status: byStatus,
    by_medication_type: byMedType,
    by_consent_given_by: byGivenBy,
  };
}

export function identifyMedicationConsentAlerts(
  records: MedicationConsentRecord[],
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

  // Controlled drug without consent documented
  for (const r of records) {
    if (r.medication_type === "controlled_drug" && !r.consent_documented) {
      alerts.push({
        type: "controlled_drug_no_consent",
        severity: "critical",
        message: `Controlled drug ${r.medication_name} for ${r.child_name} has no documented consent — obtain immediately`,
        id: r.id,
      });
    }
  }

  // Expired consent
  const expiredConsents = records.filter((r) => r.consent_status === "expired").length;
  if (expiredConsents >= 1) {
    alerts.push({
      type: "expired_consent",
      severity: "high",
      message: `${expiredConsents} medication ${expiredConsents === 1 ? "consent has" : "consents have"} expired — renew before administering`,
      id: "expired_consent",
    });
  }

  // Child not informed
  const noChildInfo = records.filter((r) => !r.child_informed).length;
  if (noChildInfo >= 1) {
    alerts.push({
      type: "child_not_informed",
      severity: "high",
      message: `${noChildInfo} ${noChildInfo === 1 ? "consent has" : "consents have"} not informed the child — ensure age-appropriate information`,
      id: "child_not_informed",
    });
  }

  // Side effects not explained
  const noSideEffects = records.filter((r) => !r.side_effects_explained).length;
  if (noSideEffects >= 2) {
    alerts.push({
      type: "side_effects_not_explained",
      severity: "medium",
      message: `${noSideEffects} consents without side effects explained — ensure informed consent`,
      id: "side_effects_not_explained",
    });
  }

  // No review date
  const noReview = records.filter((r) => !r.review_date_set).length;
  if (noReview >= 2) {
    alerts.push({
      type: "no_review_date",
      severity: "medium",
      message: `${noReview} consents without review date — schedule consent reviews`,
      id: "no_review_date",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    consentType?: ConsentType;
    consentStatus?: ConsentStatus;
    medicationType?: MedicationType;
    consentGivenBy?: ConsentGivenBy;
    limit?: number;
  },
): Promise<ServiceResult<MedicationConsentRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_medication_consent") as SB).select("*").eq("home_id", homeId);
  if (filters?.consentType) q = q.eq("consent_type", filters.consentType);
  if (filters?.consentStatus) q = q.eq("consent_status", filters.consentStatus);
  if (filters?.medicationType) q = q.eq("medication_type", filters.medicationType);
  if (filters?.consentGivenBy) q = q.eq("consent_given_by", filters.consentGivenBy);
  q = q.order("consent_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    consentType: ConsentType;
    consentStatus: ConsentStatus;
    medicationType: MedicationType;
    consentGivenBy: ConsentGivenBy;
    consentDate: string;
    childName: string;
    childId?: string | null;
    medicationName: string;
    consentDocumented?: boolean;
    capacityAssessed?: boolean;
    childInformed?: boolean;
    sideEffectsExplained?: boolean;
    alternativesDiscussed?: boolean;
    reviewDateSet?: boolean;
    socialWorkerNotified?: boolean;
    gpConsulted?: boolean;
    restrictionsNoted?: boolean;
    selfAdminAssessed?: boolean;
    storageConfirmed?: boolean;
    disposalArranged?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    recordedBy: string;
    reviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<MedicationConsentRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_medication_consent") as SB)
    .insert({
      home_id: payload.homeId,
      consent_type: payload.consentType,
      consent_status: payload.consentStatus,
      medication_type: payload.medicationType,
      consent_given_by: payload.consentGivenBy,
      consent_date: payload.consentDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      medication_name: payload.medicationName,
      consent_documented: payload.consentDocumented ?? true,
      capacity_assessed: payload.capacityAssessed ?? true,
      child_informed: payload.childInformed ?? true,
      side_effects_explained: payload.sideEffectsExplained ?? true,
      alternatives_discussed: payload.alternativesDiscussed ?? false,
      review_date_set: payload.reviewDateSet ?? true,
      social_worker_notified: payload.socialWorkerNotified ?? true,
      gp_consulted: payload.gpConsulted ?? true,
      restrictions_noted: payload.restrictionsNoted ?? false,
      self_admin_assessed: payload.selfAdminAssessed ?? false,
      storage_confirmed: payload.storageConfirmed ?? true,
      disposal_arranged: payload.disposalArranged ?? false,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      recorded_by: payload.recordedBy,
      review_date: payload.reviewDate ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    consentType: ConsentType;
    consentStatus: ConsentStatus;
    medicationType: MedicationType;
    consentGivenBy: ConsentGivenBy;
    consentDate: string;
    childName: string;
    childId: string | null;
    medicationName: string;
    consentDocumented: boolean;
    capacityAssessed: boolean;
    childInformed: boolean;
    sideEffectsExplained: boolean;
    alternativesDiscussed: boolean;
    reviewDateSet: boolean;
    socialWorkerNotified: boolean;
    gpConsulted: boolean;
    restrictionsNoted: boolean;
    selfAdminAssessed: boolean;
    storageConfirmed: boolean;
    disposalArranged: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    recordedBy: string;
    reviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<MedicationConsentRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.consentType !== undefined) mapped.consent_type = updates.consentType;
  if (updates.consentStatus !== undefined) mapped.consent_status = updates.consentStatus;
  if (updates.medicationType !== undefined) mapped.medication_type = updates.medicationType;
  if (updates.consentGivenBy !== undefined) mapped.consent_given_by = updates.consentGivenBy;
  if (updates.consentDate !== undefined) mapped.consent_date = updates.consentDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.medicationName !== undefined) mapped.medication_name = updates.medicationName;
  if (updates.consentDocumented !== undefined) mapped.consent_documented = updates.consentDocumented;
  if (updates.capacityAssessed !== undefined) mapped.capacity_assessed = updates.capacityAssessed;
  if (updates.childInformed !== undefined) mapped.child_informed = updates.childInformed;
  if (updates.sideEffectsExplained !== undefined) mapped.side_effects_explained = updates.sideEffectsExplained;
  if (updates.alternativesDiscussed !== undefined) mapped.alternatives_discussed = updates.alternativesDiscussed;
  if (updates.reviewDateSet !== undefined) mapped.review_date_set = updates.reviewDateSet;
  if (updates.socialWorkerNotified !== undefined) mapped.social_worker_notified = updates.socialWorkerNotified;
  if (updates.gpConsulted !== undefined) mapped.gp_consulted = updates.gpConsulted;
  if (updates.restrictionsNoted !== undefined) mapped.restrictions_noted = updates.restrictionsNoted;
  if (updates.selfAdminAssessed !== undefined) mapped.self_admin_assessed = updates.selfAdminAssessed;
  if (updates.storageConfirmed !== undefined) mapped.storage_confirmed = updates.storageConfirmed;
  if (updates.disposalArranged !== undefined) mapped.disposal_arranged = updates.disposalArranged;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.recordedBy !== undefined) mapped.recorded_by = updates.recordedBy;
  if (updates.reviewDate !== undefined) mapped.review_date = updates.reviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_medication_consent") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeMedicationConsentMetrics,
  identifyMedicationConsentAlerts,
};
