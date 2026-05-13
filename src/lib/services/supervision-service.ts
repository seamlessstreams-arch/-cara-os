// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF SUPERVISION SERVICE
// Manages formal and informal supervision sessions, tracks compliance against
// Reg 33 frequencies, computes quality metrics, and flags overdue staff.
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

export type SupervisionType =
  | "formal" | "informal" | "group" | "peer" | "management" | "safeguarding";

export type SupervisionStatus =
  | "scheduled" | "completed" | "cancelled" | "overdue" | "rescheduled";

export interface SupervisionRecord {
  id: string;
  home_id: string;
  staff_id: string;
  supervisor_id: string;
  type: SupervisionType;
  status: SupervisionStatus;
  scheduled_date: string;
  completed_date: string | null;
  duration_minutes: number | null;
  location: string | null;
  agenda_items: string[];
  key_discussions: string | null;
  actions_agreed: string | null;
  staff_wellbeing_score: number | null;       // 1-10
  practice_quality_score: number | null;      // 1-10
  safeguarding_discussed: boolean;
  training_needs_identified: string | null;
  next_supervision_date: string | null;
  staff_signature: boolean;
  supervisor_signature: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ─────────────────────────────────────────────────────────────

/** Required supervision frequency by staff role (in weeks). Reg 33 mandates at least monthly. */
export const SUPERVISION_FREQUENCIES: Record<string, number> = {
  registered_manager: 4,
  deputy_manager: 4,
  senior_rsw: 4,
  rsw: 4,               // Reg 33 requires at least monthly
  night_staff: 6,
  bank_staff: 8,
  agency: 8,
};

/** Standard agenda template for children's home supervision sessions. */
export const SUPERVISION_AGENDA_TEMPLATE: string[] = [
  "Safeguarding updates and concerns",
  "Young people — progress, relationships, behaviour",
  "Key working sessions and care plan reviews",
  "Recording quality and timeliness",
  "Training and professional development",
  "Staff wellbeing and workload",
  "Team dynamics and communication",
  "Incident review and learning",
  "Practice standards and regulatory compliance",
  "Actions from previous supervision",
];

// ── Pure functions (no DB) ────────────────────────────────────────────────

export interface SupervisionComplianceResult {
  total_staff: number;
  supervised_in_period: number;
  overdue: number;
  never_supervised: number;
  compliance_percentage: number;
  overdue_staff: {
    staff_id: string;
    role: string;
    last_supervised: string | null;
    days_overdue: number;
  }[];
}

/**
 * Compute supervision compliance across a staff team.
 *
 * For each staff member, looks up their role frequency in SUPERVISION_FREQUENCIES,
 * then checks whether they have a completed supervision within that window.
 */
export function computeSupervisionCompliance(
  records: { staff_id: string; status: string; completed_date: string | null }[],
  staffList: { id: string; role: string }[],
  now: Date,
): SupervisionComplianceResult {
  const overdueStaff: SupervisionComplianceResult["overdue_staff"] = [];
  let supervisedInPeriod = 0;
  let neverSupervised = 0;

  for (const staff of staffList) {
    const frequencyWeeks = SUPERVISION_FREQUENCIES[staff.role] ?? 4;
    const windowMs = frequencyWeeks * 7 * 86400000;

    // Find all completed supervisions for this staff member, sorted latest first
    const staffRecords = records
      .filter((r) => r.staff_id === staff.id && r.status === "completed" && r.completed_date)
      .sort((a, b) => new Date(b.completed_date!).getTime() - new Date(a.completed_date!).getTime());

    if (staffRecords.length === 0) {
      neverSupervised++;
      overdueStaff.push({
        staff_id: staff.id,
        role: staff.role,
        last_supervised: null,
        days_overdue: Math.floor(windowMs / 86400000), // full period overdue as a baseline
      });
      continue;
    }

    const lastDate = new Date(staffRecords[0].completed_date!);
    const gapMs = now.getTime() - lastDate.getTime();

    if (gapMs <= windowMs) {
      supervisedInPeriod++;
    } else {
      const daysOverdue = Math.floor((gapMs - windowMs) / 86400000);
      overdueStaff.push({
        staff_id: staff.id,
        role: staff.role,
        last_supervised: staffRecords[0].completed_date,
        days_overdue: daysOverdue,
      });
    }
  }

  const overdue = overdueStaff.length;
  const totalStaff = staffList.length;

  return {
    total_staff: totalStaff,
    supervised_in_period: supervisedInPeriod,
    overdue,
    never_supervised: neverSupervised,
    compliance_percentage: totalStaff > 0 ? Math.round((supervisedInPeriod / totalStaff) * 100) : 0,
    overdue_staff: overdueStaff,
  };
}

export type SupervisionQualityRating = "excellent" | "good" | "requires_improvement" | "inadequate";

export interface SupervisionQualityResult {
  avg_wellbeing: number;
  avg_practice: number;
  safeguarding_coverage: number;
  total_sessions: number;
  quality_rating: SupervisionQualityRating;
}

/**
 * Compute quality metrics across completed supervision sessions.
 *
 * Quality rating based on average of both scores:
 *   >= 8 = excellent, >= 6 = good, >= 4 = requires_improvement, else inadequate
 */
export function computeSupervisionQuality(
  records: {
    staff_wellbeing_score: number | null;
    practice_quality_score: number | null;
    safeguarding_discussed: boolean;
  }[],
): SupervisionQualityResult {
  if (records.length === 0) {
    return {
      avg_wellbeing: 0,
      avg_practice: 0,
      safeguarding_coverage: 0,
      total_sessions: 0,
      quality_rating: "inadequate",
    };
  }

  let wellbeingSum = 0;
  let wellbeingCount = 0;
  let practiceSum = 0;
  let practiceCount = 0;
  let safeguardingCount = 0;

  for (const r of records) {
    if (r.staff_wellbeing_score != null) {
      wellbeingSum += r.staff_wellbeing_score;
      wellbeingCount++;
    }
    if (r.practice_quality_score != null) {
      practiceSum += r.practice_quality_score;
      practiceCount++;
    }
    if (r.safeguarding_discussed) {
      safeguardingCount++;
    }
  }

  const avgWellbeing = wellbeingCount > 0
    ? Math.round((wellbeingSum / wellbeingCount) * 10) / 10
    : 0;
  const avgPractice = practiceCount > 0
    ? Math.round((practiceSum / practiceCount) * 10) / 10
    : 0;
  const safeguardingCoverage = Math.round((safeguardingCount / records.length) * 100);

  // Quality rating: average of both score averages
  const combinedAvg = (avgWellbeing + avgPractice) / 2;
  let qualityRating: SupervisionQualityRating;
  if (combinedAvg >= 8) qualityRating = "excellent";
  else if (combinedAvg >= 6) qualityRating = "good";
  else if (combinedAvg >= 4) qualityRating = "requires_improvement";
  else qualityRating = "inadequate";

  return {
    avg_wellbeing: avgWellbeing,
    avg_practice: avgPractice,
    safeguarding_coverage: safeguardingCoverage,
    total_sessions: records.length,
    quality_rating: qualityRating,
  };
}

/**
 * Check whether a staff member's supervision is overdue based on their role frequency.
 */
export function isSupervisionOverdue(
  lastSupervisionDate: string | null,
  role: string,
  now: Date,
): boolean {
  if (!lastSupervisionDate) return true;

  const frequencyWeeks = SUPERVISION_FREQUENCIES[role] ?? 4;
  const windowMs = frequencyWeeks * 7 * 86400000;
  const lastDate = new Date(lastSupervisionDate);

  return now.getTime() - lastDate.getTime() > windowMs;
}

/**
 * Compute the next due date for supervision based on last session and role frequency.
 */
export function computeNextDueDate(
  lastSupervisionDate: string,
  role: string,
): string {
  const frequencyWeeks = SUPERVISION_FREQUENCIES[role] ?? 4;
  const lastDate = new Date(lastSupervisionDate);
  const nextDate = new Date(lastDate.getTime() + frequencyWeeks * 7 * 86400000);
  return nextDate.toISOString().split("T")[0];
}

// ── CRUD ──────────────────────────────────────────────────────────────────

export async function listSupervisions(
  homeId: string,
  opts?: {
    staffId?: string;
    supervisorId?: string;
    status?: SupervisionStatus;
    type?: SupervisionType;
    limit?: number;
  },
): Promise<ServiceResult<SupervisionRecord[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_supervision_records") as SB).select("*").eq("home_id", homeId);
  if (opts?.staffId) q = q.eq("staff_id", opts.staffId);
  if (opts?.supervisorId) q = q.eq("supervisor_id", opts.supervisorId);
  if (opts?.status) q = q.eq("status", opts.status);
  if (opts?.type) q = q.eq("type", opts.type);
  q = q.order("scheduled_date", { ascending: false }).limit(opts?.limit ?? 50);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getSupervision(
  id: string,
): Promise<ServiceResult<SupervisionRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_supervision_records") as SB)
    .select("*")
    .eq("id", id)
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createSupervision(
  input: {
    homeId: string;
    staffId: string;
    supervisorId: string;
    type: SupervisionType;
    status?: SupervisionStatus;
    scheduledDate: string;
    location?: string;
    agendaItems?: string[];
    notes?: string;
  },
): Promise<ServiceResult<SupervisionRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_supervision_records") as SB)
    .insert({
      home_id: input.homeId,
      staff_id: input.staffId,
      supervisor_id: input.supervisorId,
      type: input.type,
      status: input.status ?? "scheduled",
      scheduled_date: input.scheduledDate,
      completed_date: null,
      duration_minutes: null,
      location: input.location ?? null,
      agenda_items: input.agendaItems ?? SUPERVISION_AGENDA_TEMPLATE,
      key_discussions: null,
      actions_agreed: null,
      staff_wellbeing_score: null,
      practice_quality_score: null,
      safeguarding_discussed: false,
      training_needs_identified: null,
      next_supervision_date: null,
      staff_signature: false,
      supervisor_signature: false,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateSupervision(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<SupervisionRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_supervision_records") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function completeSupervision(
  id: string,
  completionData: {
    durationMinutes: number;
    keyDiscussions: string;
    actionsAgreed: string;
    staffWellbeingScore: number;
    practiceQualityScore: number;
    safeguardingDiscussed: boolean;
    trainingNeedsIdentified?: string;
    nextSupervisionDate?: string;
    staffSignature: boolean;
    supervisorSignature: boolean;
    notes?: string;
  },
): Promise<ServiceResult<SupervisionRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_supervision_records") as SB)
    .update({
      status: "completed",
      completed_date: new Date().toISOString(),
      duration_minutes: completionData.durationMinutes,
      key_discussions: completionData.keyDiscussions,
      actions_agreed: completionData.actionsAgreed,
      staff_wellbeing_score: completionData.staffWellbeingScore,
      practice_quality_score: completionData.practiceQualityScore,
      safeguarding_discussed: completionData.safeguardingDiscussed,
      training_needs_identified: completionData.trainingNeedsIdentified ?? null,
      next_supervision_date: completionData.nextSupervisionDate ?? null,
      staff_signature: completionData.staffSignature,
      supervisor_signature: completionData.supervisorSignature,
      notes: completionData.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ───────────────────────────────────────────────────────

export const _testing = {
  computeSupervisionCompliance,
  computeSupervisionQuality,
  isSupervisionOverdue,
  computeNextDueDate,
  SUPERVISION_FREQUENCIES,
  SUPERVISION_AGENDA_TEMPLATE,
};
