// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EMERGENCY PLANNING & BUSINESS CONTINUITY SERVICE
// Manages emergency procedures, fire drill records, evacuation plans,
// emergency contacts, business continuity plans, and contingency protocols.
// Reg 22 (arrangements when child not in home), Reg 25 (premises),
// Reg 40 (notifiable events). SCCIF Helped & Protected / Leadership.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface FireDrillRecord {
  id: string;
  home_id: string;
  drill_date: string;
  drill_time: string;
  drill_type: string;
  staff_present: string[];
  children_present: string[];
  children_absent: string[];
  evacuation_time_seconds: number;
  assembly_point_used: string;
  alarm_activated: boolean;
  all_accounted_for: boolean;
  issues_identified: string[];
  improvements_needed: string[];
  conducted_by: string;
  next_drill_date?: string | null;
  created_at: string;
}

export interface EmergencyContact {
  id: string;
  home_id: string;
  contact_type: string;
  name: string;
  role: string;
  phone_primary: string;
  phone_secondary?: string | null;
  email?: string | null;
  availability: string;
  priority_order: number;
  last_verified_date: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface ContingencyPlan {
  id: string;
  home_id: string;
  plan_type: string;
  title: string;
  description: string;
  trigger_conditions: string[];
  immediate_actions: string[];
  responsible_persons: string[];
  escalation_contacts: string[];
  review_date: string;
  reviewed_by?: string | null;
  status: "current" | "under_review" | "expired";
  version: number;
  created_at: string;
  updated_at: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

export const DRILL_TYPES: { type: string; label: string; frequency: string }[] = [
  { type: "fire_evacuation", label: "Fire Evacuation Drill", frequency: "Monthly" },
  { type: "fire_night", label: "Night-Time Fire Drill", frequency: "Quarterly" },
  { type: "lockdown", label: "Lockdown Drill", frequency: "6-monthly" },
  { type: "missing_child", label: "Missing Child Drill", frequency: "6-monthly" },
  { type: "medical_emergency", label: "Medical Emergency Drill", frequency: "6-monthly" },
  { type: "utility_failure", label: "Utility Failure Drill", frequency: "Annual" },
];

export const EMERGENCY_CONTACT_TYPES: { type: string; label: string }[] = [
  { type: "fire_service", label: "Fire & Rescue Service" },
  { type: "police", label: "Police" },
  { type: "ambulance", label: "Ambulance Service" },
  { type: "local_authority", label: "Local Authority EDT" },
  { type: "ofsted", label: "Ofsted" },
  { type: "responsible_individual", label: "Responsible Individual" },
  { type: "registered_manager", label: "Registered Manager" },
  { type: "on_call_manager", label: "On-Call Manager" },
  { type: "maintenance", label: "Emergency Maintenance" },
  { type: "utility_gas", label: "Gas Emergency" },
  { type: "utility_water", label: "Water Emergency" },
  { type: "utility_electric", label: "Electricity Emergency" },
  { type: "lado", label: "LADO" },
  { type: "camhs", label: "CAMHS Crisis Team" },
];

export const CONTINGENCY_PLAN_TYPES: { type: string; label: string }[] = [
  { type: "fire", label: "Fire & Evacuation" },
  { type: "flood", label: "Flood / Water Damage" },
  { type: "power_failure", label: "Power Failure" },
  { type: "gas_leak", label: "Gas Leak" },
  { type: "pandemic", label: "Pandemic / Infectious Disease" },
  { type: "staffing_crisis", label: "Staffing Crisis" },
  { type: "missing_child", label: "Missing Child" },
  { type: "serious_incident", label: "Serious Incident" },
  { type: "data_breach", label: "Data Breach / IT Failure" },
  { type: "building_damage", label: "Building Damage / Uninhabitable" },
];

// ── Pure functions (no DB) ──────────────────────────────────────────────────

/**
 * Compute emergency preparedness metrics.
 */
function computeEmergencyPreparedness(
  drills: FireDrillRecord[],
  contacts: EmergencyContact[],
  plans: ContingencyPlan[],
): {
  total_drills: number;
  drills_by_type: Record<string, number>;
  avg_evacuation_time: number;
  all_accounted_rate: number;
  drills_with_issues: number;
  active_contacts: number;
  contacts_verified: number;
  contacts_verification_rate: number;
  current_plans: number;
  expired_plans: number;
  total_plan_types_covered: number;
} {
  const totalDrills = drills.length;

  // Drills by type
  const drillsByType: Record<string, number> = {};
  for (const d of drills) {
    drillsByType[d.drill_type] = (drillsByType[d.drill_type] ?? 0) + 1;
  }

  // Average evacuation time
  let totalTime = 0;
  for (const d of drills) totalTime += d.evacuation_time_seconds;
  const avgTime = totalDrills > 0 ? Math.round(totalTime / totalDrills) : 0;

  // All accounted for
  const allAccounted = drills.filter((d) => d.all_accounted_for).length;
  const accountedRate = totalDrills > 0
    ? Math.round((allAccounted / totalDrills) * 100)
    : 0;

  // Drills with issues
  const withIssues = drills.filter((d) => d.issues_identified.length > 0).length;

  // Contacts
  const activeContacts = contacts.filter((c) => c.status === "active");
  const now = new Date();
  const sixMonthsMs = 180 * 24 * 60 * 60 * 1000;
  const verified = activeContacts.filter(
    (c) => now.getTime() - new Date(c.last_verified_date).getTime() <= sixMonthsMs,
  ).length;
  const verificationRate = activeContacts.length > 0
    ? Math.round((verified / activeContacts.length) * 100)
    : 0;

  // Plans
  const currentPlans = plans.filter((p) => p.status === "current").length;
  const expiredPlans = plans.filter((p) => p.status === "expired").length;
  const planTypes = new Set(plans.filter((p) => p.status === "current").map((p) => p.plan_type));

  return {
    total_drills: totalDrills,
    drills_by_type: drillsByType,
    avg_evacuation_time: avgTime,
    all_accounted_rate: accountedRate,
    drills_with_issues: withIssues,
    active_contacts: activeContacts.length,
    contacts_verified: verified,
    contacts_verification_rate: verificationRate,
    current_plans: currentPlans,
    expired_plans: expiredPlans,
    total_plan_types_covered: planTypes.size,
  };
}

/**
 * Identify emergency preparedness alerts.
 */
function identifyEmergencyAlerts(
  drills: FireDrillRecord[],
  contacts: EmergencyContact[],
  plans: ContingencyPlan[],
): { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [];
  const now = new Date();

  // No fire drill in last 30 days
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const recentFireDrills = drills.filter(
    (d) => d.drill_type === "fire_evacuation" &&
      now.getTime() - new Date(d.drill_date).getTime() <= thirtyDaysMs,
  );
  if (recentFireDrills.length === 0) {
    alerts.push({
      type: "no_fire_drill",
      severity: "high",
      message: "No fire evacuation drill recorded in the last 30 days. Monthly drills are required (Reg 25).",
    });
  }

  // Drill where not all accounted for
  const notAccounted = drills.filter((d) => !d.all_accounted_for);
  if (notAccounted.length > 0) {
    alerts.push({
      type: "not_all_accounted",
      severity: "critical",
      message: `${notAccounted.length} drill${notAccounted.length > 1 ? "s" : ""} where not all children were accounted for. Immediate review of evacuation procedures required.`,
    });
  }

  // Expired contingency plans
  const expired = plans.filter((p) => p.status === "expired");
  if (expired.length > 0) {
    alerts.push({
      type: "expired_plans",
      severity: "high",
      message: `${expired.length} contingency plan${expired.length > 1 ? "s" : ""} expired. Review and update immediately.`,
    });
  }

  // Unverified emergency contacts (>6 months)
  const sixMonthsMs = 180 * 24 * 60 * 60 * 1000;
  const activeContacts = contacts.filter((c) => c.status === "active");
  const unverified = activeContacts.filter(
    (c) => now.getTime() - new Date(c.last_verified_date).getTime() > sixMonthsMs,
  );
  if (unverified.length > 0) {
    alerts.push({
      type: "unverified_contacts",
      severity: "medium",
      message: `${unverified.length} emergency contact${unverified.length > 1 ? "s" : ""} not verified in the last 6 months.`,
    });
  }

  // Missing key plan types
  const currentPlanTypes = new Set(
    plans.filter((p) => p.status === "current").map((p) => p.plan_type),
  );
  const essentialTypes = ["fire", "missing_child", "serious_incident", "staffing_crisis"];
  const missingEssential = essentialTypes.filter((t) => !currentPlanTypes.has(t));
  if (missingEssential.length > 0) {
    alerts.push({
      type: "missing_essential_plans",
      severity: "high",
      message: `Missing contingency plans for: ${missingEssential.join(", ")}. These are essential for Ofsted inspection readiness.`,
    });
  }

  return alerts;
}

// ── CRUD — Fire Drills ──────────────────────────────────────────────────────

export async function listFireDrills(
  homeId: string,
  filters?: {
    drillType?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<FireDrillRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [], persisted: false } as ServiceResult<FireDrillRecord[]>;

  const s = sb();
  if (!s) return { ok: true, data: [], persisted: false } as ServiceResult<FireDrillRecord[]>;

  let q = (s.from("cs_fire_drills") as SB).select("*").eq("home_id", homeId);
  if (filters?.drillType) q = q.eq("drill_type", filters.drillType);
  if (filters?.dateFrom) q = q.gte("drill_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("drill_date", filters.dateTo);
  q = q.order("drill_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createFireDrill(
  input: Omit<FireDrillRecord, "id" | "created_at">,
): Promise<ServiceResult<FireDrillRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_fire_drills") as SB)
    .insert({
      home_id: input.home_id,
      drill_date: input.drill_date,
      drill_time: input.drill_time,
      drill_type: input.drill_type,
      staff_present: input.staff_present,
      children_present: input.children_present,
      children_absent: input.children_absent,
      evacuation_time_seconds: input.evacuation_time_seconds,
      assembly_point_used: input.assembly_point_used,
      alarm_activated: input.alarm_activated,
      all_accounted_for: input.all_accounted_for,
      issues_identified: input.issues_identified,
      improvements_needed: input.improvements_needed,
      conducted_by: input.conducted_by,
      next_drill_date: input.next_drill_date ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Emergency Contacts ───────────────────────────────────────────────

export async function listEmergencyContacts(
  homeId: string,
): Promise<ServiceResult<EmergencyContact[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [], persisted: false } as ServiceResult<EmergencyContact[]>;

  const s = sb();
  if (!s) return { ok: true, data: [], persisted: false } as ServiceResult<EmergencyContact[]>;

  const { data, error } = await (s.from("cs_emergency_contacts") as SB)
    .select("*")
    .eq("home_id", homeId)
    .order("priority_order", { ascending: true });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createEmergencyContact(
  input: Omit<EmergencyContact, "id" | "created_at" | "updated_at">,
): Promise<ServiceResult<EmergencyContact>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_emergency_contacts") as SB)
    .insert({
      home_id: input.home_id,
      contact_type: input.contact_type,
      name: input.name,
      role: input.role,
      phone_primary: input.phone_primary,
      phone_secondary: input.phone_secondary ?? null,
      email: input.email ?? null,
      availability: input.availability,
      priority_order: input.priority_order,
      last_verified_date: input.last_verified_date,
      status: input.status,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateEmergencyContact(
  id: string,
  updates: Partial<EmergencyContact>,
): Promise<ServiceResult<EmergencyContact>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_emergency_contacts") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Contingency Plans ────────────────────────────────────────────────

export async function listContingencyPlans(
  homeId: string,
  filters?: { status?: string; planType?: string; limit?: number },
): Promise<ServiceResult<ContingencyPlan[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [], persisted: false } as ServiceResult<ContingencyPlan[]>;

  const s = sb();
  if (!s) return { ok: true, data: [], persisted: false } as ServiceResult<ContingencyPlan[]>;

  let q = (s.from("cs_contingency_plans") as SB).select("*").eq("home_id", homeId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.planType) q = q.eq("plan_type", filters.planType);
  q = q.order("review_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createContingencyPlan(
  input: Omit<ContingencyPlan, "id" | "created_at" | "updated_at">,
): Promise<ServiceResult<ContingencyPlan>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_contingency_plans") as SB)
    .insert({
      home_id: input.home_id,
      plan_type: input.plan_type,
      title: input.title,
      description: input.description,
      trigger_conditions: input.trigger_conditions,
      immediate_actions: input.immediate_actions,
      responsible_persons: input.responsible_persons,
      escalation_contacts: input.escalation_contacts,
      review_date: input.review_date,
      reviewed_by: input.reviewed_by ?? null,
      status: input.status,
      version: input.version,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateContingencyPlan(
  id: string,
  updates: Partial<ContingencyPlan>,
): Promise<ServiceResult<ContingencyPlan>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_contingency_plans") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ────────────────────────────────────────────────────────

export const _testing = {
  computeEmergencyPreparedness,
  identifyEmergencyAlerts,
};
