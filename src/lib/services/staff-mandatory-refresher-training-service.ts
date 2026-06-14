// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF MANDATORY REFRESHER TRAINING SERVICE
// Tracks mandatory training renewals and compliance for staff in children's
// residential homes — completion dates, expiry dates, refresher booking status,
// certificate management, and competency assessment.
//
// CHR 2015 Reg 33 (employment of staff), Reg 34 (fitness of workers),
// Reg 35 (supervision and training). Schedule 2 — fitness of workers.
//
// Covers: training renewal cycles, expiry tracking, refresher scheduling,
// certificate verification, competency assessment, delivery method analysis,
// and training hours monitoring.
//
// SCCIF: Well-Led — "Staff are trained and supported. Leaders ensure training
// is current and fit for purpose."
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums ─────────────────────────────────────────────────────────────────

export const TRAINING_TYPES = [
  "Safeguarding",
  "First Aid",
  "Fire Safety",
  "Manual Handling",
  "Medication",
  "Restraint",
  "Food Hygiene",
  "Health & Safety",
  "Data Protection",
  "Equality & Diversity",
] as const;
export type TrainingType = (typeof TRAINING_TYPES)[number];

export const TRAINING_STATUSES = ["Current", "Due Soon", "Overdue", "Expired", "Booked"] as const;
export type TrainingStatus = (typeof TRAINING_STATUSES)[number];

export const DELIVERY_METHODS = ["Classroom", "E-Learning", "Blended", "Workplace", "External"] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

// ── Row Interface ─────────────────────────────────────────────────────────

export interface StaffMandatoryRefresherTrainingRow {
  id: string;
  home_id: string;
  staff_name: string;
  training_type: TrainingType;
  completion_date: string;
  expiry_date: string;
  training_status: TrainingStatus;
  training_provider: string | null;
  certificate_held: boolean;
  assessed_competent: boolean;
  refresher_booked: boolean;
  refresher_date: string | null;
  training_hours: number;
  delivery_method: DeliveryMethod;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Supabase helper ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sb(): any | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Metrics ───────────────────────────────────────────────────────────────

export function computeMetrics(rows: StaffMandatoryRefresherTrainingRow[]): {
  total_records: number;
  current_count: number;
  overdue_count: number;
  expired_count: number;
  due_soon_count: number;
  booked_count: number;
  certificate_rate: number;
  competency_rate: number;
  refresher_booked_rate: number;
  avg_training_hours: number;
  unique_staff: number;
  training_type_breakdown: Record<string, number>;
} {
  const currentCount = rows.filter((r) => r.training_status === "Current").length;
  const overdueCount = rows.filter((r) => r.training_status === "Overdue").length;
  const expiredCount = rows.filter((r) => r.training_status === "Expired").length;
  const dueSoonCount = rows.filter((r) => r.training_status === "Due Soon").length;
  const bookedCount = rows.filter((r) => r.training_status === "Booked").length;

  const boolRate = (field: keyof StaffMandatoryRefresherTrainingRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return rows.length > 0 ? Math.round((count / rows.length) * 1000) / 10 : 0;
  };

  const totalHours = rows.reduce((sum, r) => sum + r.training_hours, 0);
  const avgHours = rows.length > 0 ? Math.round((totalHours / rows.length) * 10) / 10 : 0;

  const typeBreakdown: Record<string, number> = {};
  for (const r of rows) typeBreakdown[r.training_type] = (typeBreakdown[r.training_type] ?? 0) + 1;

  return {
    total_records: rows.length,
    current_count: currentCount,
    overdue_count: overdueCount,
    expired_count: expiredCount,
    due_soon_count: dueSoonCount,
    booked_count: bookedCount,
    certificate_rate: boolRate("certificate_held"),
    competency_rate: boolRate("assessed_competent"),
    refresher_booked_rate: boolRate("refresher_booked"),
    avg_training_hours: avgHours,
    unique_staff: new Set(rows.map((r) => r.staff_name)).size,
    training_type_breakdown: typeBreakdown,
  };
}

// ── Alerts ─────────────────────────────────────────────────────────────────

export function computeAlerts(
  rows: StaffMandatoryRefresherTrainingRow[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical: any expired training
  for (const r of rows) {
    if (r.training_status === "Expired") {
      alerts.push({
        type: "expired_training",
        severity: "critical",
        message: `${r.staff_name} has expired ${r.training_type} training — immediate renewal required under Reg 33/35.`,
        record_id: r.id,
      });
    }
  }

  // High: any overdue training
  for (const r of rows) {
    if (r.training_status === "Overdue") {
      alerts.push({
        type: "overdue_training",
        severity: "high",
        message: `${r.staff_name} has overdue ${r.training_type} training — refresher must be arranged promptly.`,
        record_id: r.id,
      });
    }
  }

  // Medium: due soon without refresher booked
  for (const r of rows) {
    if (r.training_status === "Due Soon" && !r.refresher_booked) {
      alerts.push({
        type: "due_soon_no_refresher",
        severity: "medium",
        message: `${r.staff_name} has ${r.training_type} training due soon but no refresher booked.`,
        record_id: r.id,
      });
    }
  }

  // Medium: not assessed competent
  for (const r of rows) {
    if (!r.assessed_competent) {
      alerts.push({
        type: "not_assessed_competent",
        severity: "medium",
        message: `${r.staff_name} has not been assessed as competent for ${r.training_type} training.`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

// ── Cara Insights ─────────────────────────────────────────────────────────

export function computeCaraInsights(rows: StaffMandatoryRefresherTrainingRow[]): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary (purple-themed)
  insights.push(
    `[purple] ${metrics.total_records} refresher training ${metrics.total_records === 1 ? "record" : "records"} tracked across ${metrics.unique_staff} staff ${metrics.unique_staff === 1 ? "member" : "members"}. ` +
      `${metrics.current_count} current, ${metrics.expired_count} expired, ` +
      `${metrics.overdue_count} overdue, and ${metrics.due_soon_count} due soon.`,
  );

  // Insight 2: Priorities (amber-themed)
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts identified. ` +
        `Certificate rate: ${metrics.certificate_rate}%, competency rate: ${metrics.competency_rate}%, ` +
        `refresher booked rate: ${metrics.refresher_booked_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority alerts currently active. ` +
        `Certificate rate: ${metrics.certificate_rate}%, competency rate: ${metrics.competency_rate}%. ` +
        `Continue monitoring refresher cycles to maintain Reg 33/35 compliance.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.expired_count > 0) {
    insights.push(
      `[reflect] ${metrics.expired_count} training ${metrics.expired_count === 1 ? "record has" : "records have"} expired. ` +
        `What barriers exist to timely refresher completion, and how can the home ensure ` +
        `all staff maintain current mandatory training under Reg 35?`,
    );
  } else if (metrics.refresher_booked_rate < 100) {
    insights.push(
      `[reflect] ${metrics.refresher_booked_rate}% of training records have a refresher booked. ` +
        `Would proactive refresher scheduling reduce the risk of training gaps and support ` +
        `continuous compliance with Reg 33/35?`,
    );
  } else {
    insights.push(
      `[reflect] All mandatory refresher training is current and refreshers are booked. ` +
        `How can the home build on this strong compliance position to enhance training ` +
        `effectiveness and evidence impact on practice under CHR 2015?`,
    );
  }

  return insights;
}

// ── CRUD ──────────────────────────────────────────────────────────────────

export async function listStaffMandatoryRefresherTraining(
  homeId: string,
): Promise<ServiceResult<StaffMandatoryRefresherTrainingRow[]>> {
  const client = sb();
  if (!client) return { ok: true, data: [] };
  const { data, error } = await (client.from("cs_staff_mandatory_refresher_training") as SB)
    .select("*")
    .eq("home_id", homeId)
    .order("expiry_date", { ascending: true });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffMandatoryRefresherTrainingRow[] };
}

export async function createStaffMandatoryRefresherTraining(input: {
  homeId: string;
  staffName: string;
  trainingType: TrainingType;
  completionDate: string;
  expiryDate: string;
  trainingStatus: TrainingStatus;
  trainingProvider?: string | null;
  certificateHeld: boolean;
  assessedCompetent: boolean;
  refresherBooked: boolean;
  refresherDate?: string | null;
  trainingHours: number;
  deliveryMethod: DeliveryMethod;
  notes?: string | null;
}): Promise<ServiceResult<StaffMandatoryRefresherTrainingRow>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_mandatory_refresher_training") as SB)
    .insert({
      home_id: input.homeId,
      staff_name: input.staffName,
      training_type: input.trainingType,
      completion_date: input.completionDate,
      expiry_date: input.expiryDate,
      training_status: input.trainingStatus,
      training_provider: input.trainingProvider ?? null,
      certificate_held: input.certificateHeld,
      assessed_competent: input.assessedCompetent,
      refresher_booked: input.refresherBooked,
      refresher_date: input.refresherDate ?? null,
      training_hours: input.trainingHours,
      delivery_method: input.deliveryMethod,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffMandatoryRefresherTrainingRow };
}

export async function updateStaffMandatoryRefresherTraining(
  id: string,
  updates: Partial<Omit<StaffMandatoryRefresherTrainingRow, "id" | "home_id" | "created_at">>,
): Promise<ServiceResult<StaffMandatoryRefresherTrainingRow>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_staff_mandatory_refresher_training") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as StaffMandatoryRefresherTrainingRow };
}

// ── Testing export ────────────────────────────────────────────────────────

export const _testing = { computeMetrics, computeAlerts, computeCaraInsights };
