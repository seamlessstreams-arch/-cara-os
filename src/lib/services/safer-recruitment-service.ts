// ==============================================================================
// CORNERSTONE -- SAFER RECRUITMENT SERVICE
// Manages the safer recruitment process for children's home staff under
// CHR 2015 Reg 32 (fitness of staff), Reg 33 (employment of staff),
// Schedule 1 (information about the registered person),
// Schedule 2 (information about staff), and SCCIF Leadership & Management.
//
// Tracks DBS checks, references, and pre-employment checklist items to ensure
// all staff are safely recruited before working with children and young people.
// ==============================================================================

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// -- Types --------------------------------------------------------------------

export interface DBSCheck {
  id: string;
  staff_id: string;
  staff_name: string;
  home_id: string;
  dbs_type: "basic" | "standard" | "enhanced" | "enhanced_barred";
  certificate_number: string;
  issue_date: string;
  expiry_date: string;
  update_service_registered: boolean;
  update_service_id: string | null;
  status: "valid" | "expiring" | "expired" | "pending" | "flagged";
  checked_by: string | null;
  checked_date: string | null;
  created_at: string;
}

export interface StaffReference {
  id: string;
  staff_id: string;
  staff_name: string;
  home_id: string;
  reference_type: "employer" | "personal" | "character" | "professional" | "academic";
  referee_name: string;
  referee_role: string | null;
  referee_organisation: string | null;
  referee_email: string | null;
  referee_phone: string | null;
  date_requested: string | null;
  date_received: string | null;
  satisfactory: boolean | null;
  concerns_noted: string | null;
  verified_by: string | null;
  verified_date: string | null;
  status: "requested" | "received" | "verified" | "unsatisfactory" | "outstanding";
  created_at: string;
}

export interface PreEmploymentCheck {
  id: string;
  staff_id: string;
  staff_name: string;
  home_id: string;
  check_type: string;
  completed: boolean;
  completed_date: string | null;
  completed_by: string | null;
  notes: string | null;
  document_reference: string | null;
  status: "pending" | "completed" | "na" | "concern";
  created_at: string;
}

// -- Constants ----------------------------------------------------------------

export const DBS_TYPES = [
  { type: "basic", label: "Basic DBS" },
  { type: "standard", label: "Standard DBS" },
  { type: "enhanced", label: "Enhanced DBS" },
  { type: "enhanced_barred", label: "Enhanced DBS with Barred List Check" },
] as const;

export const DBS_STATUSES = [
  { status: "valid", label: "Valid" },
  { status: "expiring", label: "Expiring Soon" },
  { status: "expired", label: "Expired" },
  { status: "pending", label: "Pending" },
  { status: "flagged", label: "Flagged" },
] as const;

export const REFERENCE_TYPES = [
  { type: "employer", label: "Employer Reference" },
  { type: "personal", label: "Personal Reference" },
  { type: "character", label: "Character Reference" },
  { type: "professional", label: "Professional Reference" },
  { type: "academic", label: "Academic Reference" },
] as const;

export const REFERENCE_STATUSES = [
  { status: "requested", label: "Requested" },
  { status: "received", label: "Received" },
  { status: "verified", label: "Verified" },
  { status: "unsatisfactory", label: "Unsatisfactory" },
  { status: "outstanding", label: "Outstanding" },
] as const;

export const PREEMPLOYMENT_CHECK_TYPES = [
  { type: "dbs_check", label: "DBS Check" },
  { type: "identity_verification", label: "Identity Verification" },
  { type: "right_to_work", label: "Right to Work in the UK" },
  { type: "two_references", label: "Two Satisfactory References" },
  { type: "qualifications", label: "Qualifications Verification" },
  { type: "employment_history_gaps", label: "Employment History & Gap Analysis" },
  { type: "health_declaration", label: "Health Declaration" },
  { type: "interview_record", label: "Interview Record" },
  { type: "safeguarding_declaration", label: "Safeguarding Self-Declaration" },
  { type: "disqualification_declaration", label: "Disqualification Declaration" },
  { type: "overseas_police_check", label: "Overseas Police Check" },
  { type: "social_media_check", label: "Social Media Check" },
] as const;

export const PREEMPLOYMENT_CHECK_STATUSES = [
  { status: "pending", label: "Pending" },
  { status: "completed", label: "Completed" },
  { status: "na", label: "Not Applicable" },
  { status: "concern", label: "Concern Raised" },
] as const;

export const RECRUITMENT_STAGES = [
  { type: "application", label: "Application" },
  { type: "shortlisting", label: "Shortlisting" },
  { type: "interview", label: "Interview" },
  { type: "pre_employment_checks", label: "Pre-Employment Checks" },
  { type: "offer", label: "Conditional Offer" },
  { type: "induction", label: "Induction" },
  { type: "probation", label: "Probation" },
] as const;

// -- Pure functions (no DB) ---------------------------------------------------

export interface RecruitmentComplianceResult {
  total_staff: number;
  dbs_valid_count: number;
  dbs_expiring_count: number;
  dbs_expired_count: number;
  dbs_pending_count: number;
  dbs_flagged_count: number;
  dbs_validity_rate: number;
  references_verified_count: number;
  references_outstanding_count: number;
  references_unsatisfactory_count: number;
  reference_completion_rate: number;
  checks_completed_count: number;
  checks_pending_count: number;
  checks_concern_count: number;
  check_completion_rate: number;
  overall_compliance_rate: number;
}

/**
 * Compute recruitment compliance metrics across DBS checks, references,
 * and pre-employment checklist items.
 *
 * DBS validity rate = % of DBS records with status "valid" or "expiring".
 * Reference completion rate = % of references with status "verified".
 * Check completion rate = % of checks with status "completed" or "na".
 * Overall compliance = average of all three rates.
 */
export function computeRecruitmentCompliance(
  dbsChecks: DBSCheck[],
  references: StaffReference[],
  preEmploymentChecks: PreEmploymentCheck[],
  totalStaff: number,
): RecruitmentComplianceResult {
  // DBS metrics
  let dbsValid = 0;
  let dbsExpiring = 0;
  let dbsExpired = 0;
  let dbsPending = 0;
  let dbsFlagged = 0;

  for (const dbs of dbsChecks) {
    switch (dbs.status) {
      case "valid": dbsValid++; break;
      case "expiring": dbsExpiring++; break;
      case "expired": dbsExpired++; break;
      case "pending": dbsPending++; break;
      case "flagged": dbsFlagged++; break;
    }
  }

  const dbsTotal = dbsChecks.length;
  const dbsValidityRate = dbsTotal > 0
    ? Math.round(((dbsValid + dbsExpiring) / dbsTotal) * 100)
    : 0;

  // Reference metrics
  let refsVerified = 0;
  let refsOutstanding = 0;
  let refsUnsatisfactory = 0;

  for (const ref of references) {
    if (ref.status === "verified") refsVerified++;
    else if (ref.status === "outstanding" || ref.status === "requested") refsOutstanding++;
    else if (ref.status === "unsatisfactory") refsUnsatisfactory++;
  }

  const refsTotal = references.length;
  const referenceCompletionRate = refsTotal > 0
    ? Math.round((refsVerified / refsTotal) * 100)
    : 0;

  // Pre-employment check metrics
  let checksCompleted = 0;
  let checksPending = 0;
  let checksConcern = 0;

  for (const check of preEmploymentChecks) {
    if (check.status === "completed" || check.status === "na") checksCompleted++;
    else if (check.status === "pending") checksPending++;
    else if (check.status === "concern") checksConcern++;
  }

  const checksTotal = preEmploymentChecks.length;
  const checkCompletionRate = checksTotal > 0
    ? Math.round((checksCompleted / checksTotal) * 100)
    : 0;

  // Overall compliance is the average of the three rates
  const rateCount = [dbsTotal, refsTotal, checksTotal].filter((n) => n > 0).length;
  const overallCompliance = rateCount > 0
    ? Math.round(
        ([dbsValidityRate, referenceCompletionRate, checkCompletionRate]
          .slice(0, rateCount)
          .reduce((sum, r) => sum + r, 0)) / rateCount,
      )
    : 0;

  return {
    total_staff: totalStaff,
    dbs_valid_count: dbsValid,
    dbs_expiring_count: dbsExpiring,
    dbs_expired_count: dbsExpired,
    dbs_pending_count: dbsPending,
    dbs_flagged_count: dbsFlagged,
    dbs_validity_rate: dbsValidityRate,
    references_verified_count: refsVerified,
    references_outstanding_count: refsOutstanding,
    references_unsatisfactory_count: refsUnsatisfactory,
    reference_completion_rate: referenceCompletionRate,
    checks_completed_count: checksCompleted,
    checks_pending_count: checksPending,
    checks_concern_count: checksConcern,
    check_completion_rate: checkCompletionRate,
    overall_compliance_rate: overallCompliance,
  };
}

export interface RecruitmentAlert {
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  staff_name?: string;
  staff_id?: string;
}

/**
 * Identify recruitment alerts across DBS checks, references, and
 * pre-employment checklist items.
 *
 * Alert types:
 * - dbs_expired             -> critical (staff must not work unsupervised)
 * - dbs_flagged             -> critical (potential safeguarding risk)
 * - dbs_expiring_30_days    -> high (renewal needed before expiry)
 * - dbs_pending             -> medium (check not yet returned)
 * - reference_unsatisfactory -> critical (Reg 32 concern)
 * - reference_outstanding    -> high (references incomplete)
 * - check_concern           -> high (pre-employment concern raised)
 * - check_incomplete        -> medium (checks not yet completed)
 * - no_update_service       -> low (DBS Update Service not registered)
 */
export function identifyRecruitmentAlerts(
  dbsChecks: DBSCheck[],
  references: StaffReference[],
  preEmploymentChecks: PreEmploymentCheck[],
): RecruitmentAlert[] {
  const now = new Date();
  const thirtyDaysMs = 30 * 86400000;
  const alerts: RecruitmentAlert[] = [];

  // DBS alerts
  for (const dbs of dbsChecks) {
    if (dbs.status === "expired") {
      alerts.push({
        type: "dbs_expired",
        severity: "critical",
        message: `DBS check expired for ${dbs.staff_name} — staff must not work unsupervised (Reg 32)`,
        staff_name: dbs.staff_name,
        staff_id: dbs.staff_id,
      });
    }

    if (dbs.status === "flagged") {
      alerts.push({
        type: "dbs_flagged",
        severity: "critical",
        message: `DBS check flagged for ${dbs.staff_name} — requires immediate review (Reg 32)`,
        staff_name: dbs.staff_name,
        staff_id: dbs.staff_id,
      });
    }

    if (dbs.status === "pending") {
      alerts.push({
        type: "dbs_pending",
        severity: "medium",
        message: `DBS check pending for ${dbs.staff_name}`,
        staff_name: dbs.staff_name,
        staff_id: dbs.staff_id,
      });
    }

    // Check for expiry within 30 days
    if (dbs.expiry_date && dbs.status === "valid") {
      const expiryDate = new Date(dbs.expiry_date);
      const daysUntilExpiry = expiryDate.getTime() - now.getTime();
      if (daysUntilExpiry > 0 && daysUntilExpiry <= thirtyDaysMs) {
        alerts.push({
          type: "dbs_expiring_30_days",
          severity: "high",
          message: `DBS check expiring within 30 days for ${dbs.staff_name}`,
          staff_name: dbs.staff_name,
          staff_id: dbs.staff_id,
        });
      }
    }

    // Enhanced DBS without Update Service registration
    if (
      (dbs.dbs_type === "enhanced" || dbs.dbs_type === "enhanced_barred") &&
      !dbs.update_service_registered &&
      dbs.status === "valid"
    ) {
      alerts.push({
        type: "no_update_service",
        severity: "low",
        message: `${dbs.staff_name} has an enhanced DBS but is not registered with the Update Service`,
        staff_name: dbs.staff_name,
        staff_id: dbs.staff_id,
      });
    }
  }

  // Reference alerts
  for (const ref of references) {
    if (ref.status === "unsatisfactory") {
      alerts.push({
        type: "reference_unsatisfactory",
        severity: "critical",
        message: `Unsatisfactory reference received for ${ref.staff_name} from ${ref.referee_name} (Reg 32)`,
        staff_name: ref.staff_name,
        staff_id: ref.staff_id,
      });
    }

    if (ref.status === "outstanding" || ref.status === "requested") {
      alerts.push({
        type: "reference_outstanding",
        severity: "high",
        message: `Reference outstanding for ${ref.staff_name} — ${ref.reference_type} reference from ${ref.referee_name}`,
        staff_name: ref.staff_name,
        staff_id: ref.staff_id,
      });
    }
  }

  // Pre-employment check alerts
  for (const check of preEmploymentChecks) {
    if (check.status === "concern") {
      const checkLabel = PREEMPLOYMENT_CHECK_TYPES.find((c) => c.type === check.check_type)?.label ?? check.check_type;
      alerts.push({
        type: "check_concern",
        severity: "high",
        message: `Concern raised on ${checkLabel} for ${check.staff_name}`,
        staff_name: check.staff_name,
        staff_id: check.staff_id,
      });
    }

    if (check.status === "pending") {
      const checkLabel = PREEMPLOYMENT_CHECK_TYPES.find((c) => c.type === check.check_type)?.label ?? check.check_type;
      alerts.push({
        type: "check_incomplete",
        severity: "medium",
        message: `${checkLabel} not yet completed for ${check.staff_name}`,
        staff_name: check.staff_name,
        staff_id: check.staff_id,
      });
    }
  }

  return alerts;
}

// -- CRUD: DBS Checks ---------------------------------------------------------

export async function listDBSChecks(
  homeId: string,
  filters?: {
    staffId?: string;
    dbsType?: string;
    status?: string;
    limit?: number;
  },
): Promise<ServiceResult<DBSCheck[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [], persisted: false } as ServiceResult<DBSCheck[]>;

  const s = sb();
  if (!s) return { ok: true, data: [], persisted: false } as ServiceResult<DBSCheck[]>;

  let q = (s.from("cs_dbs_checks") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.staffId) q = q.eq("staff_id", filters.staffId);
  if (filters?.dbsType) q = q.eq("dbs_type", filters.dbsType);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 50);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createDBSCheck(
  input: {
    homeId: string;
    staffId: string;
    staffName: string;
    dbsType: "basic" | "standard" | "enhanced" | "enhanced_barred";
    certificateNumber: string;
    issueDate: string;
    expiryDate: string;
    updateServiceRegistered: boolean;
    updateServiceId?: string;
    status: "valid" | "expiring" | "expired" | "pending" | "flagged";
    checkedBy?: string;
    checkedDate?: string;
  },
): Promise<ServiceResult<DBSCheck>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_dbs_checks") as SB)
    .insert({
      home_id: input.homeId,
      staff_id: input.staffId,
      staff_name: input.staffName,
      dbs_type: input.dbsType,
      certificate_number: input.certificateNumber,
      issue_date: input.issueDate,
      expiry_date: input.expiryDate,
      update_service_registered: input.updateServiceRegistered,
      update_service_id: input.updateServiceId ?? null,
      status: input.status,
      checked_by: input.checkedBy ?? null,
      checked_date: input.checkedDate ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateDBSCheck(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<DBSCheck>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_dbs_checks") as SB)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// -- CRUD: References ---------------------------------------------------------

export async function listReferences(
  homeId: string,
  filters?: {
    staffId?: string;
    referenceType?: string;
    status?: string;
    limit?: number;
  },
): Promise<ServiceResult<StaffReference[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [], persisted: false } as ServiceResult<StaffReference[]>;

  const s = sb();
  if (!s) return { ok: true, data: [], persisted: false } as ServiceResult<StaffReference[]>;

  let q = (s.from("cs_staff_references") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.staffId) q = q.eq("staff_id", filters.staffId);
  if (filters?.referenceType) q = q.eq("reference_type", filters.referenceType);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 50);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createReference(
  input: {
    homeId: string;
    staffId: string;
    staffName: string;
    referenceType: "employer" | "personal" | "character" | "professional" | "academic";
    refereeName: string;
    refereeRole?: string;
    refereeOrganisation?: string;
    refereeEmail?: string;
    refereePhone?: string;
    dateRequested?: string;
    dateReceived?: string;
    satisfactory?: boolean;
    concernsNoted?: string;
    verifiedBy?: string;
    verifiedDate?: string;
    status: "requested" | "received" | "verified" | "unsatisfactory" | "outstanding";
  },
): Promise<ServiceResult<StaffReference>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_references") as SB)
    .insert({
      home_id: input.homeId,
      staff_id: input.staffId,
      staff_name: input.staffName,
      reference_type: input.referenceType,
      referee_name: input.refereeName,
      referee_role: input.refereeRole ?? null,
      referee_organisation: input.refereeOrganisation ?? null,
      referee_email: input.refereeEmail ?? null,
      referee_phone: input.refereePhone ?? null,
      date_requested: input.dateRequested ?? null,
      date_received: input.dateReceived ?? null,
      satisfactory: input.satisfactory ?? null,
      concerns_noted: input.concernsNoted ?? null,
      verified_by: input.verifiedBy ?? null,
      verified_date: input.verifiedDate ?? null,
      status: input.status,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateReference(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<StaffReference>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_staff_references") as SB)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// -- CRUD: Pre-Employment Checks ----------------------------------------------

export async function listPreEmploymentChecks(
  homeId: string,
  filters?: {
    staffId?: string;
    checkType?: string;
    status?: string;
    limit?: number;
  },
): Promise<ServiceResult<PreEmploymentCheck[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [], persisted: false } as ServiceResult<PreEmploymentCheck[]>;

  const s = sb();
  if (!s) return { ok: true, data: [], persisted: false } as ServiceResult<PreEmploymentCheck[]>;

  let q = (s.from("cs_pre_employment_checks") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.staffId) q = q.eq("staff_id", filters.staffId);
  if (filters?.checkType) q = q.eq("check_type", filters.checkType);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 50);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createPreEmploymentCheck(
  input: {
    homeId: string;
    staffId: string;
    staffName: string;
    checkType: string;
    completed: boolean;
    completedDate?: string;
    completedBy?: string;
    notes?: string;
    documentReference?: string;
    status: "pending" | "completed" | "na" | "concern";
  },
): Promise<ServiceResult<PreEmploymentCheck>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_pre_employment_checks") as SB)
    .insert({
      home_id: input.homeId,
      staff_id: input.staffId,
      staff_name: input.staffName,
      check_type: input.checkType,
      completed: input.completed,
      completed_date: input.completedDate ?? null,
      completed_by: input.completedBy ?? null,
      notes: input.notes ?? null,
      document_reference: input.documentReference ?? null,
      status: input.status,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updatePreEmploymentCheck(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<PreEmploymentCheck>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_pre_employment_checks") as SB)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// -- Testing exports ----------------------------------------------------------

export const _testing = {
  computeRecruitmentCompliance,
  identifyRecruitmentAlerts,
  DBS_TYPES,
  DBS_STATUSES,
  REFERENCE_TYPES,
  REFERENCE_STATUSES,
  PREEMPLOYMENT_CHECK_TYPES,
  PREEMPLOYMENT_CHECK_STATUSES,
  RECRUITMENT_STAGES,
};
