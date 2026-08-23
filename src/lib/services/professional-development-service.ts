// ══════════════════════════════════════════════════════════════════════════════
// CARA — PROFESSIONAL DEVELOPMENT SERVICE
// Manages CPD tracking, qualification records, professional registration,
// and workforce development across the home.
// CHR 2015 Reg 33 (employment of staff — qualifications, skills, competence),
// Reg 34 (staff support, training, supervision).
//
// Tracks CPD hours, qualification expiry, development goals, evidence of
// learning impact, and ensures all staff meet qualification requirements.
//
// SCCIF: Well-Led — "Staff receive supervision, training and support that
// enables them to develop their skills and knowledge." "Staff have the
// qualifications, skills and knowledge to meet the needs of each child."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type CpdCategory =
  | "safeguarding"
  | "therapeutic_care"
  | "behaviour_management"
  | "medication"
  | "health_safety"
  | "first_aid"
  | "mental_health"
  | "attachment_trauma"
  | "restorative_practice"
  | "leadership_management"
  | "record_keeping"
  | "legislation_regulation"
  | "equality_diversity"
  | "communication"
  | "specialist_training"
  | "other";

export type CpdMethod =
  | "course"
  | "workshop"
  | "e_learning"
  | "conference"
  | "shadowing"
  | "mentoring"
  | "reading"
  | "reflective_practice"
  | "peer_learning"
  | "qualification"
  | "webinar"
  | "other";

export type QualificationStatus =
  | "achieved"
  | "in_progress"
  | "planned"
  | "expired"
  | "not_started";

export type DevelopmentGoalStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "deferred"
  | "cancelled";

export type RegistrationBody =
  | "social_work_england"
  | "ofsted"
  | "dbs"
  | "hcpc"
  | "nmc"
  | "other";

export interface CpdRecord {
  id: string;
  home_id: string;
  staff_id: string;
  staff_name: string;
  category: CpdCategory;
  method: CpdMethod;
  title: string;
  description: string;
  provider: string;
  date_completed: string;
  cpd_hours: number;
  certificate_reference: string | null;
  learning_outcomes: string[];
  impact_on_practice: string | null;
  evidence_attached: boolean;
  verified_by: string | null;
  created_at: string;
}

export interface QualificationRecord {
  id: string;
  home_id: string;
  staff_id: string;
  staff_name: string;
  qualification_name: string;
  awarding_body: string;
  level: string;
  status: QualificationStatus;
  date_achieved: string | null;
  expiry_date: string | null;
  registration_number: string | null;
  registration_body: RegistrationBody | null;
  mandatory: boolean;
  created_at: string;
  updated_at: string;
}

export interface DevelopmentGoal {
  id: string;
  home_id: string;
  staff_id: string;
  staff_name: string;
  goal: string;
  rationale: string;
  target_date: string;
  status: DevelopmentGoalStatus;
  progress_notes: string[];
  linked_cpd_ids: string[];
  date_completed: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const CPD_CATEGORIES: { category: CpdCategory; label: string }[] = [
  { category: "safeguarding", label: "Safeguarding" },
  { category: "therapeutic_care", label: "Therapeutic Care" },
  { category: "behaviour_management", label: "Behaviour Management" },
  { category: "medication", label: "Medication" },
  { category: "health_safety", label: "Health & Safety" },
  { category: "first_aid", label: "First Aid" },
  { category: "mental_health", label: "Mental Health" },
  { category: "attachment_trauma", label: "Attachment & Trauma" },
  { category: "restorative_practice", label: "Restorative Practice" },
  { category: "leadership_management", label: "Leadership & Management" },
  { category: "record_keeping", label: "Record Keeping" },
  { category: "legislation_regulation", label: "Legislation & Regulation" },
  { category: "equality_diversity", label: "Equality & Diversity" },
  { category: "communication", label: "Communication" },
  { category: "specialist_training", label: "Specialist Training" },
  { category: "other", label: "Other" },
];

export const CPD_METHODS: { method: CpdMethod; label: string }[] = [
  { method: "course", label: "Course" },
  { method: "workshop", label: "Workshop" },
  { method: "e_learning", label: "E-Learning" },
  { method: "conference", label: "Conference" },
  { method: "shadowing", label: "Shadowing" },
  { method: "mentoring", label: "Mentoring" },
  { method: "reading", label: "Reading" },
  { method: "reflective_practice", label: "Reflective Practice" },
  { method: "peer_learning", label: "Peer Learning" },
  { method: "qualification", label: "Qualification Study" },
  { method: "webinar", label: "Webinar" },
  { method: "other", label: "Other" },
];

export const QUALIFICATION_STATUSES: { status: QualificationStatus; label: string }[] = [
  { status: "achieved", label: "Achieved" },
  { status: "in_progress", label: "In Progress" },
  { status: "planned", label: "Planned" },
  { status: "expired", label: "Expired" },
  { status: "not_started", label: "Not Started" },
];

export const DEVELOPMENT_GOAL_STATUSES: { status: DevelopmentGoalStatus; label: string }[] = [
  { status: "not_started", label: "Not Started" },
  { status: "in_progress", label: "In Progress" },
  { status: "completed", label: "Completed" },
  { status: "deferred", label: "Deferred" },
  { status: "cancelled", label: "Cancelled" },
];

export const REGISTRATION_BODIES: { body: RegistrationBody; label: string }[] = [
  { body: "social_work_england", label: "Social Work England" },
  { body: "ofsted", label: "Ofsted" },
  { body: "dbs", label: "DBS" },
  { body: "hcpc", label: "HCPC" },
  { body: "nmc", label: "NMC" },
  { body: "other", label: "Other" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute professional development metrics across the home.
 */
export function computeDevelopmentMetrics(
  cpdRecords: CpdRecord[],
  qualifications: QualificationRecord[],
  goals: DevelopmentGoal[],
  totalStaff: number,
  now: Date = new Date(),
): {
  total_cpd_records: number;
  total_cpd_hours: number;
  avg_cpd_hours_per_staff: number | null;
  cpd_this_quarter: number;
  cpd_hours_this_quarter: number;
  staff_with_cpd: number;
  qualifications_achieved: number;
  qualifications_in_progress: number;
  qualifications_expired: number;
  qualifications_expiring_soon: number;
  goals_completed: number;
  goals_in_progress: number;
  goals_overdue: number;
  by_category: Record<string, number>;
  by_method: Record<string, number>;
} {
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  // CPD metrics
  const cpdThisQuarter = cpdRecords.filter(
    (r) => new Date(r.date_completed) >= ninetyDaysAgo && new Date(r.date_completed) <= now,
  );
  const totalHours = cpdRecords.reduce((sum, r) => sum + r.cpd_hours, 0);
  const hoursThisQuarter = cpdThisQuarter.reduce((sum, r) => sum + r.cpd_hours, 0);
  const staffWithCpd = new Set(cpdRecords.map((r) => r.staff_id)).size;

  // Qualification metrics
  let achieved = 0;
  let inProgress = 0;
  let expired = 0;
  let expiringSoon = 0;

  for (const q of qualifications) {
    if (q.status === "achieved") achieved++;
    else if (q.status === "in_progress") inProgress++;
    else if (q.status === "expired") expired++;

    if (
      q.status === "achieved" &&
      q.expiry_date &&
      new Date(q.expiry_date) > now &&
      new Date(q.expiry_date) <= thirtyDaysFromNow
    ) {
      expiringSoon++;
    }
  }

  // Goal metrics
  let goalsCompleted = 0;
  let goalsInProgress = 0;
  let goalsOverdue = 0;

  for (const g of goals) {
    if (g.status === "completed") goalsCompleted++;
    else if (g.status === "in_progress") goalsInProgress++;

    if (
      (g.status === "not_started" || g.status === "in_progress") &&
      new Date(g.target_date) < now
    ) {
      goalsOverdue++;
    }
  }

  // By category
  const byCategory: Record<string, number> = {};
  for (const r of cpdRecords) {
    byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
  }

  // By method
  const byMethod: Record<string, number> = {};
  for (const r of cpdRecords) {
    byMethod[r.method] = (byMethod[r.method] ?? 0) + 1;
  }

  return {
    total_cpd_records: cpdRecords.length,
    total_cpd_hours: totalHours,
    avg_cpd_hours_per_staff: totalStaff > 0 ? Math.round((totalHours / totalStaff) * 10) / 10 : null,
    cpd_this_quarter: cpdThisQuarter.length,
    cpd_hours_this_quarter: hoursThisQuarter,
    staff_with_cpd: staffWithCpd,
    qualifications_achieved: achieved,
    qualifications_in_progress: inProgress,
    qualifications_expired: expired,
    qualifications_expiring_soon: expiringSoon,
    goals_completed: goalsCompleted,
    goals_in_progress: goalsInProgress,
    goals_overdue: goalsOverdue,
    by_category: byCategory,
    by_method: byMethod,
  };
}

/**
 * Identify professional development alerts.
 */
export function identifyDevelopmentAlerts(
  cpdRecords: CpdRecord[],
  qualifications: QualificationRecord[],
  goals: DevelopmentGoal[],
  _totalStaff: number,
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

  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  // Expired qualifications
  for (const q of qualifications) {
    if (q.status === "expired") {
      alerts.push({
        type: "qualification_expired",
        severity: "critical",
        message: `${q.staff_name}'s qualification "${q.qualification_name}" has expired${q.mandatory ? " — this is a mandatory qualification" : ""}`,
        id: q.id,
      });
    }
  }

  // Expiring soon
  for (const q of qualifications) {
    if (
      q.status === "achieved" &&
      q.expiry_date &&
      new Date(q.expiry_date) > now &&
      new Date(q.expiry_date) <= thirtyDaysFromNow
    ) {
      alerts.push({
        type: "qualification_expiring",
        severity: "high",
        message: `${q.staff_name}'s qualification "${q.qualification_name}" expires on ${q.expiry_date}`,
        id: q.id,
      });
    }
  }

  // Mandatory qualification not achieved
  for (const q of qualifications) {
    if (q.mandatory && q.status !== "achieved" && q.status !== "in_progress") {
      alerts.push({
        type: "mandatory_not_started",
        severity: "high",
        message: `${q.staff_name} has not started mandatory qualification "${q.qualification_name}"`,
        id: q.id,
      });
    }
  }

  // Overdue development goals
  for (const g of goals) {
    if (
      (g.status === "not_started" || g.status === "in_progress") &&
      new Date(g.target_date) < now
    ) {
      alerts.push({
        type: "goal_overdue",
        severity: "medium",
        message: `${g.staff_name}'s development goal "${g.goal}" is overdue — target date was ${g.target_date}`,
        id: g.id,
      });
    }
  }

  // Staff with no CPD in last 90 days
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const staffWithRecentCpd = new Set(
    cpdRecords
      .filter((r) => new Date(r.date_completed) >= ninetyDaysAgo)
      .map((r) => r.staff_id),
  );
  const allStaffIds = new Set(cpdRecords.map((r) => r.staff_id));
  for (const staffId of allStaffIds) {
    if (!staffWithRecentCpd.has(staffId)) {
      const staffRecord = cpdRecords.find((r) => r.staff_id === staffId);
      if (staffRecord) {
        alerts.push({
          type: "no_recent_cpd",
          severity: "medium",
          message: `${staffRecord.staff_name} has no CPD recorded in the last 90 days`,
          id: staffId,
        });
      }
    }
  }

  return alerts;
}

// ── CRUD — CPD Records ────────────────────────────────────────────────────

export async function listCpdRecords(
  homeId: string,
  filters?: {
    staffId?: string;
    category?: CpdCategory;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<CpdRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_cpd_records") as SB).select("*").eq("home_id", homeId);
  if (filters?.staffId) q = q.eq("staff_id", filters.staffId);
  if (filters?.category) q = q.eq("category", filters.category);
  if (filters?.dateFrom) q = q.gte("date_completed", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("date_completed", filters.dateTo);
  q = q.order("date_completed", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createCpdRecord(
  input: {
    homeId: string;
    staffId: string;
    staffName: string;
    category: CpdCategory;
    method: CpdMethod;
    title: string;
    description: string;
    provider: string;
    dateCompleted: string;
    cpdHours: number;
    certificateReference?: string;
    learningOutcomes: string[];
    impactOnPractice?: string;
    evidenceAttached?: boolean;
    verifiedBy?: string;
  },
): Promise<ServiceResult<CpdRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_cpd_records") as SB)
    .insert({
      home_id: input.homeId,
      staff_id: input.staffId,
      staff_name: input.staffName,
      category: input.category,
      method: input.method,
      title: input.title,
      description: input.description,
      provider: input.provider,
      date_completed: input.dateCompleted,
      cpd_hours: input.cpdHours,
      certificate_reference: input.certificateReference ?? null,
      learning_outcomes: input.learningOutcomes,
      impact_on_practice: input.impactOnPractice ?? null,
      evidence_attached: input.evidenceAttached ?? false,
      verified_by: input.verifiedBy ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Qualifications ─────────────────────────────────────────────────

export async function listQualifications(
  homeId: string,
  filters?: {
    staffId?: string;
    status?: QualificationStatus;
    mandatory?: boolean;
    limit?: number;
  },
): Promise<ServiceResult<QualificationRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_qualification_records") as SB).select("*").eq("home_id", homeId);
  if (filters?.staffId) q = q.eq("staff_id", filters.staffId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.mandatory !== undefined) q = q.eq("mandatory", filters.mandatory);
  q = q.order("staff_name", { ascending: true }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createQualification(
  input: {
    homeId: string;
    staffId: string;
    staffName: string;
    qualificationName: string;
    awardingBody: string;
    level: string;
    status: QualificationStatus;
    dateAchieved?: string;
    expiryDate?: string;
    registrationNumber?: string;
    registrationBody?: RegistrationBody;
    mandatory?: boolean;
  },
): Promise<ServiceResult<QualificationRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_qualification_records") as SB)
    .insert({
      home_id: input.homeId,
      staff_id: input.staffId,
      staff_name: input.staffName,
      qualification_name: input.qualificationName,
      awarding_body: input.awardingBody,
      level: input.level,
      status: input.status,
      date_achieved: input.dateAchieved ?? null,
      expiry_date: input.expiryDate ?? null,
      registration_number: input.registrationNumber ?? null,
      registration_body: input.registrationBody ?? null,
      mandatory: input.mandatory ?? false,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateQualification(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<QualificationRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_qualification_records") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Development Goals ──────────────────────────────────────────────

export async function listGoals(
  homeId: string,
  filters?: {
    staffId?: string;
    status?: DevelopmentGoalStatus;
    limit?: number;
  },
): Promise<ServiceResult<DevelopmentGoal[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_development_goals") as SB).select("*").eq("home_id", homeId);
  if (filters?.staffId) q = q.eq("staff_id", filters.staffId);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("target_date", { ascending: true }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createGoal(
  input: {
    homeId: string;
    staffId: string;
    staffName: string;
    goal: string;
    rationale: string;
    targetDate: string;
    progressNotes?: string[];
    linkedCpdIds?: string[];
  },
): Promise<ServiceResult<DevelopmentGoal>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_development_goals") as SB)
    .insert({
      home_id: input.homeId,
      staff_id: input.staffId,
      staff_name: input.staffName,
      goal: input.goal,
      rationale: input.rationale,
      target_date: input.targetDate,
      status: "not_started",
      progress_notes: input.progressNotes ?? [],
      linked_cpd_ids: input.linkedCpdIds ?? [],
      date_completed: null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateGoal(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<DevelopmentGoal>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_development_goals") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeDevelopmentMetrics,
  identifyDevelopmentAlerts,
};
