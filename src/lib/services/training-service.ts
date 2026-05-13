// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — TRAINING & DEVELOPMENT SERVICE
// Tracks mandatory training compliance, DBS checks, and qualifications for
// children's home staff under CHR 2015 Reg 33 (employment of staff) and
// Reg 34 (fitness of workers).
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

export interface TrainingRecord {
  id: string;
  home_id: string;
  staff_id: string;
  staff_name: string;
  training_type: string;
  completed_date: string;
  expiry_date: string;
  provider: string;
  certificate_reference?: string;
  status: "current" | "expiring" | "expired";
  created_at: string;
}

export interface StaffDBS {
  id: string;
  home_id: string;
  staff_id: string;
  staff_name: string;
  dbs_number: string;
  issue_date: string;
  dbs_type: "enhanced" | "enhanced_barred" | "standard";
  status: string;
  renewal_due: string;
  update_service_registered: boolean;
  created_at: string;
}

export interface StaffQualification {
  id: string;
  home_id: string;
  staff_id: string;
  staff_name: string;
  qualification_type: string;
  title: string;
  awarding_body: string;
  date_achieved?: string;
  expected_completion?: string;
  status: "achieved" | "in_progress" | "not_started";
  created_at: string;
}

// ── Constants ─────────────────────────────────────────────────────────────

export const MANDATORY_TRAINING = [
  { type: "safeguarding", label: "Safeguarding Children", renewal_months: 12, level: "mandatory" as const },
  { type: "first_aid", label: "First Aid at Work", renewal_months: 36, level: "mandatory" as const },
  { type: "fire_safety", label: "Fire Safety Awareness", renewal_months: 12, level: "mandatory" as const },
  { type: "physical_intervention", label: "Physical Intervention (PI)", renewal_months: 12, level: "mandatory" as const },
  { type: "food_hygiene", label: "Food Hygiene", renewal_months: 36, level: "mandatory" as const },
  { type: "medication_admin", label: "Medication Administration", renewal_months: 12, level: "mandatory" as const },
  { type: "health_and_safety", label: "Health & Safety", renewal_months: 24, level: "mandatory" as const },
  { type: "prevent", label: "PREVENT", renewal_months: 24, level: "mandatory" as const },
  { type: "equality_diversity", label: "Equality & Diversity", renewal_months: 24, level: "mandatory" as const },
  { type: "data_protection", label: "Data Protection / GDPR", renewal_months: 12, level: "mandatory" as const },
  { type: "lone_working", label: "Lone Working", renewal_months: 12, level: "mandatory" as const },
  { type: "mental_health_awareness", label: "Mental Health Awareness", renewal_months: 24, level: "recommended" as const },
  { type: "attachment_trauma", label: "Attachment & Trauma", renewal_months: 24, level: "recommended" as const },
  { type: "cse_cce", label: "CSE & CCE Awareness", renewal_months: 12, level: "mandatory" as const },
] as const;

export const DBS_STATUS = [
  "not_applied",
  "pending",
  "cleared",
  "barred",
  "expired",
] as const;

export const QUALIFICATION_TYPES = [
  "level_3_diploma",
  "level_4_diploma",
  "level_5_diploma",
  "social_work_degree",
  "nursing_qualification",
  "teaching_qualification",
  "management_qualification",
  "other",
] as const;

const MANDATORY_TYPES: string[] = MANDATORY_TRAINING
  .filter((t) => t.level === "mandatory")
  .map((t) => t.type);

// ── Pure functions (no DB) ────────────────────────────────────────────────

export interface TrainingComplianceResult {
  overall_compliance_rate: number;
  by_training_type: Record<
    string,
    { current: number; expiring: number; expired: number; not_done: number }
  >;
  fully_compliant_staff: number;
  expiring_within_30_days: TrainingRecord[];
  expired_count: number;
}

/**
 * Compute overall training compliance across the home.
 *
 * Compliance rate = % of (total staff x mandatory training count) that are current.
 * A record counts as "current" if its status is "current" or "expiring".
 */
export function computeTrainingCompliance(
  records: TrainingRecord[],
  staffCount: number,
): TrainingComplianceResult {
  const now = new Date();
  const thirtyDaysMs = 30 * 86400000;

  // Build a map: staffId -> Set of mandatory types that are current
  const staffMandatoryMap = new Map<string, Set<string>>();

  const byType: Record<
    string,
    { current: number; expiring: number; expired: number; not_done: number }
  > = {};

  // Initialise by_training_type for every mandatory type
  for (const mt of MANDATORY_TYPES) {
    byType[mt] = { current: 0, expiring: 0, expired: 0, not_done: staffCount };
  }

  const expiringWithin30: TrainingRecord[] = [];
  let expiredCount = 0;

  // Collect unique staff IDs from records so we can check per-type counts
  const staffWithRecords = new Set<string>();

  for (const r of records) {
    staffWithRecords.add(r.staff_id);
    const isMandatory = MANDATORY_TYPES.includes(r.training_type);

    if (isMandatory && byType[r.training_type]) {
      const bucket = byType[r.training_type];
      // Decrease not_done since this staff member has a record for this type
      bucket.not_done = Math.max(0, bucket.not_done - 1);

      if (r.status === "current") {
        bucket.current++;
        // Track for fully compliant calculation
        if (!staffMandatoryMap.has(r.staff_id)) staffMandatoryMap.set(r.staff_id, new Set());
        staffMandatoryMap.get(r.staff_id)!.add(r.training_type);
      } else if (r.status === "expiring") {
        bucket.expiring++;
        // Expiring still counts toward compliance
        if (!staffMandatoryMap.has(r.staff_id)) staffMandatoryMap.set(r.staff_id, new Set());
        staffMandatoryMap.get(r.staff_id)!.add(r.training_type);
      } else if (r.status === "expired") {
        bucket.expired++;
        expiredCount++;
      }
    } else if (!isMandatory && r.status === "expired") {
      expiredCount++;
    }

    // Check if expiring within 30 days
    if (r.expiry_date) {
      const expiryDate = new Date(r.expiry_date);
      const daysUntilExpiry = expiryDate.getTime() - now.getTime();
      if (daysUntilExpiry > 0 && daysUntilExpiry <= thirtyDaysMs) {
        expiringWithin30.push(r);
      }
    }
  }

  // Fully compliant = staff who have ALL mandatory types current or expiring
  let fullyCompliant = 0;
  staffMandatoryMap.forEach((types) => {
    if (MANDATORY_TYPES.every((mt) => types.has(mt))) {
      fullyCompliant++;
    }
  });

  // Overall compliance: current mandatory slots / total mandatory slots
  const totalSlots = staffCount * MANDATORY_TYPES.length;
  let currentSlots = 0;
  for (const mt of MANDATORY_TYPES) {
    currentSlots += byType[mt].current + byType[mt].expiring;
  }

  const complianceRate = totalSlots > 0
    ? Math.round((currentSlots / totalSlots) * 100)
    : 0;

  return {
    overall_compliance_rate: complianceRate,
    by_training_type: byType,
    fully_compliant_staff: fullyCompliant,
    expiring_within_30_days: expiringWithin30,
    expired_count: expiredCount,
  };
}

export interface StaffTrainingProfileResult {
  mandatory_complete: number;
  mandatory_total: number;
  compliance_rate: number;
  missing_training: string[];
  expiring_soon: TrainingRecord[];
  has_level_3: boolean;
  dbs_status: string | null;
  dbs_renewal_due: string | null;
}

/**
 * Compute a single staff member's training profile including mandatory
 * training progress, qualifications, and DBS status.
 */
export function computeStaffTrainingProfile(
  records: TrainingRecord[],
  qualifications: StaffQualification[],
  dbs: StaffDBS | null,
  staffId: string,
): StaffTrainingProfileResult {
  const now = new Date();
  const thirtyDaysMs = 30 * 86400000;

  const staffRecords = records.filter((r) => r.staff_id === staffId);

  // Determine which mandatory types this staff member has current/expiring
  const currentMandatory = new Set<string>();
  for (const r of staffRecords) {
    if (
      MANDATORY_TYPES.includes(r.training_type) &&
      (r.status === "current" || r.status === "expiring")
    ) {
      currentMandatory.add(r.training_type);
    }
  }

  const mandatoryComplete = currentMandatory.size;
  const mandatoryTotal = MANDATORY_TYPES.length;
  const complianceRate = mandatoryTotal > 0
    ? Math.round((mandatoryComplete / mandatoryTotal) * 100)
    : 0;

  const missingTraining = MANDATORY_TYPES.filter((mt) => !currentMandatory.has(mt));

  const expiringSoon = staffRecords.filter((r) => {
    if (!r.expiry_date) return false;
    const daysUntilExpiry = new Date(r.expiry_date).getTime() - now.getTime();
    return daysUntilExpiry > 0 && daysUntilExpiry <= thirtyDaysMs;
  });

  // Check if staff has Level 3 Diploma achieved
  const staffQuals = qualifications.filter((q) => q.staff_id === staffId);
  const hasLevel3 = staffQuals.some(
    (q) => q.qualification_type === "level_3_diploma" && q.status === "achieved",
  );

  return {
    mandatory_complete: mandatoryComplete,
    mandatory_total: mandatoryTotal,
    compliance_rate: complianceRate,
    missing_training: missingTraining,
    expiring_soon: expiringSoon,
    has_level_3: hasLevel3,
    dbs_status: dbs?.status ?? null,
    dbs_renewal_due: dbs?.renewal_due ?? null,
  };
}

export interface DBSComplianceResult {
  total_staff: number;
  cleared_count: number;
  pending_count: number;
  expired_count: number;
  update_service_count: number;
  compliance_rate: number;
}

/**
 * Compute DBS compliance across all staff DBS records.
 * Compliance = % cleared out of total.
 */
export function computeDBSCompliance(
  dbsRecords: StaffDBS[],
): DBSComplianceResult {
  const total = dbsRecords.length;
  let cleared = 0;
  let pending = 0;
  let expired = 0;
  let updateService = 0;

  for (const r of dbsRecords) {
    if (r.status === "cleared") cleared++;
    else if (r.status === "pending") pending++;
    else if (r.status === "expired") expired++;

    if (r.update_service_registered) updateService++;
  }

  return {
    total_staff: total,
    cleared_count: cleared,
    pending_count: pending,
    expired_count: expired,
    update_service_count: updateService,
    compliance_rate: total > 0 ? Math.round((cleared / total) * 100) : 0,
  };
}

export interface TrainingAlert {
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  staff_name?: string;
}

/**
 * Identify training, DBS, and qualification alerts across the workforce.
 *
 * Alert types:
 * - dbs_expired → critical
 * - dbs_expiring_30_days → high
 * - mandatory_training_expired → high
 * - training_expiring_30_days → medium
 * - no_level_3_after_2_years → high
 * - low_compliance → high (if overall compliance < 80%)
 */
export function identifyTrainingAlerts(
  records: TrainingRecord[],
  dbsRecords: StaffDBS[],
  qualifications: StaffQualification[],
): TrainingAlert[] {
  const now = new Date();
  const thirtyDaysMs = 30 * 86400000;
  const alerts: TrainingAlert[] = [];

  // DBS alerts
  for (const dbs of dbsRecords) {
    if (dbs.status === "expired") {
      alerts.push({
        type: "dbs_expired",
        severity: "critical",
        message: `DBS check expired for ${dbs.staff_name}`,
        staff_name: dbs.staff_name,
      });
    }

    if (dbs.renewal_due) {
      const renewalDate = new Date(dbs.renewal_due);
      const daysUntilRenewal = renewalDate.getTime() - now.getTime();
      if (daysUntilRenewal > 0 && daysUntilRenewal <= thirtyDaysMs) {
        alerts.push({
          type: "dbs_expiring_30_days",
          severity: "high",
          message: `DBS renewal due within 30 days for ${dbs.staff_name}`,
          staff_name: dbs.staff_name,
        });
      }
    }
  }

  // Mandatory training alerts
  for (const r of records) {
    if (!MANDATORY_TYPES.includes(r.training_type)) continue;

    const label =
      MANDATORY_TRAINING.find((mt) => mt.type === r.training_type)?.label ??
      r.training_type;

    if (r.status === "expired") {
      alerts.push({
        type: "mandatory_training_expired",
        severity: "high",
        message: `${label} training expired for ${r.staff_name}`,
        staff_name: r.staff_name,
      });
    }

    if (r.expiry_date) {
      const daysUntilExpiry = new Date(r.expiry_date).getTime() - now.getTime();
      if (daysUntilExpiry > 0 && daysUntilExpiry <= thirtyDaysMs) {
        alerts.push({
          type: "training_expiring_30_days",
          severity: "medium",
          message: `${label} training expiring within 30 days for ${r.staff_name}`,
          staff_name: r.staff_name,
        });
      }
    }
  }

  // Level 3 Diploma alerts — in_progress with expected_completion in the past
  for (const q of qualifications) {
    if (
      q.qualification_type === "level_3_diploma" &&
      q.status !== "achieved" &&
      q.expected_completion
    ) {
      const expectedDate = new Date(q.expected_completion);
      if (expectedDate.getTime() < now.getTime()) {
        alerts.push({
          type: "no_level_3_after_2_years",
          severity: "high",
          message: `Level 3 Diploma expected completion date passed for ${q.staff_name}`,
          staff_name: q.staff_name,
        });
      }
    }
  }

  // Low compliance alert — collect unique staff from records
  const uniqueStaff = new Set(records.map((r) => r.staff_id));
  const staffCount = uniqueStaff.size;
  if (staffCount > 0) {
    const compliance = computeTrainingCompliance(records, staffCount);
    if (compliance.overall_compliance_rate < 80) {
      alerts.push({
        type: "low_compliance",
        severity: "high",
        message: `Overall training compliance is ${compliance.overall_compliance_rate}% — below the 80% threshold`,
      });
    }
  }

  return alerts;
}

// ── CRUD ──────────────────────────────────────────────────────────────────

export async function listTrainingRecords(
  homeId: string,
  filters?: {
    staffId?: string;
    trainingType?: string;
    status?: string;
    limit?: number;
  },
): Promise<ServiceResult<TrainingRecord[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_training_records") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.staffId) q = q.eq("staff_id", filters.staffId);
  if (filters?.trainingType) q = q.eq("training_type", filters.trainingType);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("completed_date", { ascending: false }).limit(filters?.limit ?? 50);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createTrainingRecord(
  input: {
    homeId: string;
    staffId: string;
    staffName: string;
    trainingType: string;
    completedDate: string;
    expiryDate: string;
    provider: string;
    certificateReference?: string;
    status: "current" | "expiring" | "expired";
  },
): Promise<ServiceResult<TrainingRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_training_records") as SB)
    .insert({
      home_id: input.homeId,
      staff_id: input.staffId,
      staff_name: input.staffName,
      training_type: input.trainingType,
      completed_date: input.completedDate,
      expiry_date: input.expiryDate,
      provider: input.provider,
      certificate_reference: input.certificateReference ?? null,
      status: input.status,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function listDBSRecords(
  homeId: string,
  filters?: {
    staffId?: string;
    status?: string;
    limit?: number;
  },
): Promise<ServiceResult<StaffDBS[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_staff_dbs") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.staffId) q = q.eq("staff_id", filters.staffId);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 50);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createDBSRecord(
  input: {
    homeId: string;
    staffId: string;
    staffName: string;
    dbsNumber: string;
    issueDate: string;
    dbsType: "enhanced" | "enhanced_barred" | "standard";
    status: string;
    renewalDue: string;
    updateServiceRegistered: boolean;
  },
): Promise<ServiceResult<StaffDBS>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_dbs") as SB)
    .insert({
      home_id: input.homeId,
      staff_id: input.staffId,
      staff_name: input.staffName,
      dbs_number: input.dbsNumber,
      issue_date: input.issueDate,
      dbs_type: input.dbsType,
      status: input.status,
      renewal_due: input.renewalDue,
      update_service_registered: input.updateServiceRegistered,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateDBSRecord(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<StaffDBS>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_dbs") as SB)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function listQualifications(
  homeId: string,
  filters?: {
    staffId?: string;
    qualificationType?: string;
    status?: string;
    limit?: number;
  },
): Promise<ServiceResult<StaffQualification[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_staff_qualifications") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.staffId) q = q.eq("staff_id", filters.staffId);
  if (filters?.qualificationType) q = q.eq("qualification_type", filters.qualificationType);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 50);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createQualification(
  input: {
    homeId: string;
    staffId: string;
    staffName: string;
    qualificationType: string;
    title: string;
    awardingBody: string;
    dateAchieved?: string;
    expectedCompletion?: string;
    status: "achieved" | "in_progress" | "not_started";
  },
): Promise<ServiceResult<StaffQualification>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_qualifications") as SB)
    .insert({
      home_id: input.homeId,
      staff_id: input.staffId,
      staff_name: input.staffName,
      qualification_type: input.qualificationType,
      title: input.title,
      awarding_body: input.awardingBody,
      date_achieved: input.dateAchieved ?? null,
      expected_completion: input.expectedCompletion ?? null,
      status: input.status,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateQualification(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<StaffQualification>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_qualifications") as SB)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ───────────────────────────────────────────────────────

export const _testing = {
  computeTrainingCompliance,
  computeStaffTrainingProfile,
  computeDBSCompliance,
  identifyTrainingAlerts,
  MANDATORY_TRAINING,
  DBS_STATUS,
  QUALIFICATION_TYPES,
};
