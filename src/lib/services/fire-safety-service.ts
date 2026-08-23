// ══════════════════════════════════════════════════════════════════════════════
// CARA — FIRE SAFETY & DRILLS SERVICE
// Tracks fire drills, fire risk assessments, equipment checks,
// evacuation performance, and fire safety compliance.
// CHR 2015 Reg 25 (fire precautions — premises safety),
// Reg 36 (fitness of premises — fire safety measures),
// Fire Safety Order 2005 (responsible person duties).
//
// Covers: fire drills, risk assessments, equipment checks,
// evacuation times, staff competency, and compliance tracking.
//
// SCCIF: Helped & Protected — "The home has robust fire safety
// measures." "Children and staff know what to do in the event of fire."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type FireEventType =
  | "planned_drill"
  | "unannounced_drill"
  | "night_drill"
  | "actual_fire"
  | "false_alarm"
  | "equipment_check"
  | "risk_assessment"
  | "staff_training"
  | "other";

export type EvacuationResult =
  | "successful"
  | "partial"
  | "failed"
  | "not_applicable";

export type ComplianceStatus =
  | "compliant"
  | "minor_issues"
  | "significant_issues"
  | "non_compliant";

export type EquipmentStatus =
  | "operational"
  | "needs_maintenance"
  | "out_of_service"
  | "not_checked";

export interface FireSafetyRecord {
  id: string;
  home_id: string;
  event_type: FireEventType;
  event_date: string;
  evacuation_result: EvacuationResult;
  evacuation_time_seconds: number | null;
  all_persons_accounted: boolean;
  children_present: number;
  staff_present: number;
  compliance_status: ComplianceStatus;
  equipment_status: EquipmentStatus;
  issues_identified: string[];
  actions_taken: string[];
  conducted_by: string;
  fire_service_attended: boolean;
  peep_plans_followed: boolean;
  night_staff_competent: boolean | null;
  next_drill_date: string | null;
  review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const FIRE_EVENT_TYPES: { type: FireEventType; label: string }[] = [
  { type: "planned_drill", label: "Planned Drill" },
  { type: "unannounced_drill", label: "Unannounced Drill" },
  { type: "night_drill", label: "Night Drill" },
  { type: "actual_fire", label: "Actual Fire" },
  { type: "false_alarm", label: "False Alarm" },
  { type: "equipment_check", label: "Equipment Check" },
  { type: "risk_assessment", label: "Risk Assessment" },
  { type: "staff_training", label: "Staff Training" },
  { type: "other", label: "Other" },
];

export const EVACUATION_RESULTS: { result: EvacuationResult; label: string }[] = [
  { result: "successful", label: "Successful" },
  { result: "partial", label: "Partial" },
  { result: "failed", label: "Failed" },
  { result: "not_applicable", label: "Not Applicable" },
];

export const COMPLIANCE_STATUSES: { status: ComplianceStatus; label: string }[] = [
  { status: "compliant", label: "Compliant" },
  { status: "minor_issues", label: "Minor Issues" },
  { status: "significant_issues", label: "Significant Issues" },
  { status: "non_compliant", label: "Non-Compliant" },
];

export const EQUIPMENT_STATUSES: { status: EquipmentStatus; label: string }[] = [
  { status: "operational", label: "Operational" },
  { status: "needs_maintenance", label: "Needs Maintenance" },
  { status: "out_of_service", label: "Out of Service" },
  { status: "not_checked", label: "Not Checked" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeFireSafetyMetrics(
  records: FireSafetyRecord[],
): {
  total_events: number;
  drills_count: number;
  night_drills_count: number;
  actual_fires_count: number;
  false_alarms_count: number;
  equipment_checks_count: number;
  risk_assessments_count: number;
  successful_evacuation_rate: number | null;
  // fab-0: null when no evacuations have timings recorded.
  average_evacuation_time: number | null;
  all_accounted_rate: number | null;
  compliant_rate: number | null;
  non_compliant_count: number;
  equipment_operational_rate: number | null;
  peep_plans_followed_rate: number | null;
  night_staff_competent_rate: number | null;
  drill_overdue: boolean;
  by_event_type: Record<string, number>;
  by_evacuation_result: Record<string, number>;
  by_compliance_status: Record<string, number>;
  by_equipment_status: Record<string, number>;
} {
  const drills = records.filter(
    (r) => r.event_type === "planned_drill" || r.event_type === "unannounced_drill" || r.event_type === "night_drill",
  );
  const nightDrills = records.filter((r) => r.event_type === "night_drill").length;
  const actualFires = records.filter((r) => r.event_type === "actual_fire").length;
  const falseAlarms = records.filter((r) => r.event_type === "false_alarm").length;
  const equipChecks = records.filter((r) => r.event_type === "equipment_check").length;
  const riskAx = records.filter((r) => r.event_type === "risk_assessment").length;

  const evacuationRecords = records.filter((r) => r.evacuation_result !== "not_applicable");
  const successful = evacuationRecords.filter((r) => r.evacuation_result === "successful").length;
  const successRate =
    evacuationRecords.length > 0
      ? Math.round((successful / evacuationRecords.length) * 1000) / 10
      : null;

  const timedRecords = records.filter((r) => r.evacuation_time_seconds !== null);
  const avgTime =
    timedRecords.length > 0
      ? Math.round((timedRecords.reduce((sum, r) => sum + (r.evacuation_time_seconds ?? 0), 0) / timedRecords.length) * 10) / 10
      : null;

  const allAccounted = records.filter((r) => r.all_persons_accounted).length;
  const accountedRate =
    records.length > 0
      ? Math.round((allAccounted / records.length) * 1000) / 10
      : null;

  const compliant = records.filter((r) => r.compliance_status === "compliant").length;
  const compliantRate =
    records.length > 0
      ? Math.round((compliant / records.length) * 1000) / 10
      : null;

  const nonCompliant = records.filter((r) => r.compliance_status === "non_compliant").length;

  const equipRecords = records.filter((r) => r.equipment_status !== "not_checked");
  const operational = equipRecords.filter((r) => r.equipment_status === "operational").length;
  const operationalRate =
    equipRecords.length > 0
      ? Math.round((operational / equipRecords.length) * 1000) / 10
      : null;

  const peepApplicable = records.filter(
    (r) => r.evacuation_result !== "not_applicable",
  );
  const peepFollowed = peepApplicable.filter((r) => r.peep_plans_followed).length;
  const peepRate =
    peepApplicable.length > 0
      ? Math.round((peepFollowed / peepApplicable.length) * 1000) / 10
      : null;

  const nightRecords = records.filter((r) => r.night_staff_competent !== null);
  const nightCompetent = nightRecords.filter((r) => r.night_staff_competent === true).length;
  const nightRate =
    nightRecords.length > 0
      ? Math.round((nightCompetent / nightRecords.length) * 1000) / 10
      : null;

  // Check if drill is overdue — last drill > 30 days ago or no drills at all
  const now = new Date();
  const lastDrill = drills.length > 0
    ? drills.reduce((latest, r) => {
        const d = new Date(r.event_date);
        return d > latest ? d : latest;
      }, new Date(0))
    : null;
  const drillOverdue = lastDrill === null || (now.getTime() - lastDrill.getTime()) > 30 * 24 * 60 * 60 * 1000;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.event_type] = (byType[r.event_type] ?? 0) + 1;

  const byEvac: Record<string, number> = {};
  for (const r of records) byEvac[r.evacuation_result] = (byEvac[r.evacuation_result] ?? 0) + 1;

  const byCompliance: Record<string, number> = {};
  for (const r of records) byCompliance[r.compliance_status] = (byCompliance[r.compliance_status] ?? 0) + 1;

  const byEquip: Record<string, number> = {};
  for (const r of records) byEquip[r.equipment_status] = (byEquip[r.equipment_status] ?? 0) + 1;

  return {
    total_events: records.length,
    drills_count: drills.length,
    night_drills_count: nightDrills,
    actual_fires_count: actualFires,
    false_alarms_count: falseAlarms,
    equipment_checks_count: equipChecks,
    risk_assessments_count: riskAx,
    successful_evacuation_rate: successRate,
    average_evacuation_time: avgTime,
    all_accounted_rate: accountedRate,
    compliant_rate: compliantRate,
    non_compliant_count: nonCompliant,
    equipment_operational_rate: operationalRate,
    peep_plans_followed_rate: peepRate,
    night_staff_competent_rate: nightRate,
    drill_overdue: drillOverdue,
    by_event_type: byType,
    by_evacuation_result: byEvac,
    by_compliance_status: byCompliance,
    by_equipment_status: byEquip,
  };
}

export function identifyFireSafetyAlerts(
  records: FireSafetyRecord[],
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

  // Failed evacuation
  for (const r of records) {
    if (r.evacuation_result === "failed") {
      alerts.push({
        type: "failed_evacuation",
        severity: "critical",
        message: `Failed evacuation during ${r.event_type.replace(/_/g, " ")} on ${r.event_date} — conduct immediate review and re-drill`,
        id: r.id,
      });
    }
  }

  // Not all persons accounted
  for (const r of records) {
    if (!r.all_persons_accounted && r.evacuation_result !== "not_applicable") {
      alerts.push({
        type: "persons_not_accounted",
        severity: "critical",
        message: `Not all persons accounted for during ${r.event_type.replace(/_/g, " ")} on ${r.event_date} — review roll-call procedures`,
        id: r.id,
      });
    }
  }

  // Non-compliant records
  for (const r of records) {
    if (r.compliance_status === "non_compliant") {
      alerts.push({
        type: "non_compliant",
        severity: "high",
        message: `Non-compliant fire safety finding on ${r.event_date} (${r.event_type.replace(/_/g, " ")}) — address immediately`,
        id: r.id,
      });
    }
  }

  // Equipment out of service
  const outOfService = records.filter((r) => r.equipment_status === "out_of_service").length;
  if (outOfService >= 1) {
    alerts.push({
      type: "equipment_out_of_service",
      severity: "high",
      message: `${outOfService} fire safety equipment ${outOfService === 1 ? "item is" : "items are"} out of service — arrange repair or replacement`,
      id: "equipment_out_of_service",
    });
  }

  // Drill overdue
  const drills = records.filter(
    (r) => r.event_type === "planned_drill" || r.event_type === "unannounced_drill" || r.event_type === "night_drill",
  );
  const now = new Date();
  const lastDrill = drills.length > 0
    ? drills.reduce((latest, r) => {
        const d = new Date(r.event_date);
        return d > latest ? d : latest;
      }, new Date(0))
    : null;
  if (lastDrill === null || (now.getTime() - lastDrill.getTime()) > 30 * 24 * 60 * 60 * 1000) {
    alerts.push({
      type: "drill_overdue",
      severity: "medium",
      message: lastDrill === null
        ? "No fire drills recorded — conduct fire drill immediately"
        : "Fire drill overdue (last drill more than 30 days ago) — schedule drill",
      id: "drill_overdue",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    eventType?: FireEventType;
    complianceStatus?: ComplianceStatus;
    limit?: number;
  },
): Promise<ServiceResult<FireSafetyRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_fire_safety") as SB).select("*").eq("home_id", homeId);
  if (filters?.eventType) q = q.eq("event_type", filters.eventType);
  if (filters?.complianceStatus) q = q.eq("compliance_status", filters.complianceStatus);
  q = q.order("event_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    eventType: FireEventType;
    eventDate: string;
    evacuationResult: EvacuationResult;
    evacuationTimeSeconds?: number;
    allPersonsAccounted: boolean;
    childrenPresent: number;
    staffPresent: number;
    complianceStatus: ComplianceStatus;
    equipmentStatus: EquipmentStatus;
    issuesIdentified: string[];
    actionsTaken: string[];
    conductedBy: string;
    fireServiceAttended: boolean;
    peepPlansFollowed: boolean;
    nightStaffCompetent?: boolean;
    nextDrillDate?: string;
    reviewDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<FireSafetyRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_fire_safety") as SB)
    .insert({
      home_id: input.homeId,
      event_type: input.eventType,
      event_date: input.eventDate,
      evacuation_result: input.evacuationResult,
      evacuation_time_seconds: input.evacuationTimeSeconds ?? null,
      all_persons_accounted: input.allPersonsAccounted,
      children_present: input.childrenPresent,
      staff_present: input.staffPresent,
      compliance_status: input.complianceStatus,
      equipment_status: input.equipmentStatus,
      issues_identified: input.issuesIdentified,
      actions_taken: input.actionsTaken,
      conducted_by: input.conductedBy,
      fire_service_attended: input.fireServiceAttended,
      peep_plans_followed: input.peepPlansFollowed,
      night_staff_competent: input.nightStaffCompetent ?? null,
      next_drill_date: input.nextDrillDate ?? null,
      review_date: input.reviewDate ?? null,
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
): Promise<ServiceResult<FireSafetyRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_fire_safety") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeFireSafetyMetrics,
  identifyFireSafetyAlerts,
};
