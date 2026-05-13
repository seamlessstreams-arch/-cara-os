// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SUBSTANCE MISUSE SERVICE
// Manages substance misuse assessments, incident tracking, referrals, and
// intervention plans for children in residential care. CHR 2015 Reg 12
// (protection from harm — including substance-related risks), Reg 34
// (notifications to Ofsted of serious events including substance misuse
// incidents), and local safeguarding requirements.
//
// Tracks individual child substance assessments with risk levels, frequency,
// and context; records substance-related incidents with notification tracking
// (police, social worker, parents, Ofsted); and monitors intervention plans,
// referrals, and follow-up actions — ensuring children's homes meet statutory
// duties for safeguarding children from substance misuse harm.
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

export type SubstanceType =
  | "alcohol"
  | "cannabis"
  | "cocaine"
  | "ecstasy_mdma"
  | "solvents"
  | "prescription_misuse"
  | "new_psychoactive"
  | "tobacco"
  | "vaping"
  | "other";

export type RiskLevel =
  | "none"
  | "low"
  | "moderate"
  | "significant"
  | "serious";

export type Frequency =
  | "never"
  | "experimental"
  | "occasional"
  | "regular"
  | "dependent"
  | "unknown";

export type UseContext =
  | "peer_pressure"
  | "self_medication"
  | "recreational"
  | "addiction"
  | "exploitation";

export type AssessmentStatus =
  | "active"
  | "monitoring"
  | "resolved"
  | "escalated";

export type IncidentType =
  | "found_substance"
  | "found_paraphernalia"
  | "under_influence"
  | "disclosure"
  | "third_party_report"
  | "positive_test"
  | "suspected_dealing"
  | "overdose";

export interface SubstanceAssessment {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  assessment_date: string;
  assessed_by: string;
  substance_type: SubstanceType;
  risk_level: RiskLevel;
  frequency: Frequency;
  context: UseContext | null;
  impact_on_health: string | null;
  impact_on_behaviour: string | null;
  impact_on_education: string | null;
  referral_made: boolean;
  referral_to: string | null;
  referral_date: string | null;
  intervention_plan: string | null;
  next_assessment_date: string | null;
  status: AssessmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubstanceIncident {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  incident_date: string;
  reported_by: string;
  substance_type: SubstanceType;
  incident_type: IncidentType;
  description: string;
  location: string | null;
  immediate_action: string;
  medical_attention: boolean;
  police_involved: boolean;
  social_worker_notified: boolean;
  parent_notified: boolean;
  ofsted_notified: boolean;
  follow_up_actions: { action: string; assigned_to: string; due_date: string; completed: boolean }[];
  follow_up_date: string | null;
  follow_up_completed: boolean;
  created_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const SUBSTANCE_TYPES: { type: SubstanceType; label: string }[] = [
  { type: "alcohol", label: "Alcohol" },
  { type: "cannabis", label: "Cannabis" },
  { type: "cocaine", label: "Cocaine" },
  { type: "ecstasy_mdma", label: "Ecstasy / MDMA" },
  { type: "solvents", label: "Solvents" },
  { type: "prescription_misuse", label: "Prescription Misuse" },
  { type: "new_psychoactive", label: "New Psychoactive Substances" },
  { type: "tobacco", label: "Tobacco" },
  { type: "vaping", label: "Vaping" },
  { type: "other", label: "Other" },
];

export const RISK_LEVELS: { level: RiskLevel; label: string }[] = [
  { level: "none", label: "None" },
  { level: "low", label: "Low" },
  { level: "moderate", label: "Moderate" },
  { level: "significant", label: "Significant" },
  { level: "serious", label: "Serious" },
];

export const FREQUENCY_LEVELS: { frequency: Frequency; label: string }[] = [
  { frequency: "never", label: "Never" },
  { frequency: "experimental", label: "Experimental" },
  { frequency: "occasional", label: "Occasional" },
  { frequency: "regular", label: "Regular" },
  { frequency: "dependent", label: "Dependent" },
  { frequency: "unknown", label: "Unknown" },
];

export const USE_CONTEXTS: { context: UseContext; label: string }[] = [
  { context: "peer_pressure", label: "Peer Pressure" },
  { context: "self_medication", label: "Self-Medication" },
  { context: "recreational", label: "Recreational" },
  { context: "addiction", label: "Addiction" },
  { context: "exploitation", label: "Exploitation" },
];

export const ASSESSMENT_STATUSES: { status: AssessmentStatus; label: string }[] = [
  { status: "active", label: "Active" },
  { status: "monitoring", label: "Monitoring" },
  { status: "resolved", label: "Resolved" },
  { status: "escalated", label: "Escalated" },
];

export const INCIDENT_TYPES: { type: IncidentType; label: string }[] = [
  { type: "found_substance", label: "Found Substance" },
  { type: "found_paraphernalia", label: "Found Paraphernalia" },
  { type: "under_influence", label: "Under the Influence" },
  { type: "disclosure", label: "Disclosure" },
  { type: "third_party_report", label: "Third-Party Report" },
  { type: "positive_test", label: "Positive Test" },
  { type: "suspected_dealing", label: "Suspected Dealing" },
  { type: "overdose", label: "Overdose" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute summary metrics across substance misuse assessments and incidents.
 */
export function computeSubstanceMisuseMetrics(
  assessments: SubstanceAssessment[],
  incidents: SubstanceIncident[],
): {
  children_assessed: number;
  by_risk_level: Record<string, number>;
  by_substance_type: Record<string, number>;
  active_referrals: number;
  incidents_this_quarter: number;
  by_incident_type: Record<string, number>;
  children_with_intervention_plans: number;
  overdue_assessments: number;
  escalated_count: number;
} {
  const now = new Date();

  // Unique children assessed
  const uniqueChildren = new Set<string>();
  for (const a of assessments) {
    uniqueChildren.add(a.child_id);
  }
  const childrenAssessed = uniqueChildren.size;

  // By risk level breakdown
  const byRiskLevel: Record<string, number> = {};
  for (const a of assessments) {
    byRiskLevel[a.risk_level] = (byRiskLevel[a.risk_level] ?? 0) + 1;
  }

  // By substance type breakdown (across assessments)
  const bySubstanceType: Record<string, number> = {};
  for (const a of assessments) {
    bySubstanceType[a.substance_type] = (bySubstanceType[a.substance_type] ?? 0) + 1;
  }

  // Active referrals: assessments where referral_made is true and status is active or monitoring
  let activeReferrals = 0;
  for (const a of assessments) {
    if (a.referral_made && (a.status === "active" || a.status === "monitoring")) {
      activeReferrals++;
    }
  }

  // Incidents this quarter: incidents where incident_date falls within the current quarter
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  let incidentsThisQuarter = 0;
  for (const i of incidents) {
    if (new Date(i.incident_date).getTime() >= quarterStart.getTime()) {
      incidentsThisQuarter++;
    }
  }

  // By incident type breakdown
  const byIncidentType: Record<string, number> = {};
  for (const i of incidents) {
    byIncidentType[i.incident_type] = (byIncidentType[i.incident_type] ?? 0) + 1;
  }

  // Children with intervention plans (active/monitoring assessments that have a plan)
  const childrenWithPlans = new Set<string>();
  for (const a of assessments) {
    if (a.intervention_plan && (a.status === "active" || a.status === "monitoring")) {
      childrenWithPlans.add(a.child_id);
    }
  }
  const childrenWithInterventionPlans = childrenWithPlans.size;

  // Overdue assessments: active/monitoring assessments where next_assessment_date is past
  let overdueAssessments = 0;
  for (const a of assessments) {
    if (
      (a.status === "active" || a.status === "monitoring") &&
      a.next_assessment_date &&
      new Date(a.next_assessment_date).getTime() < now.getTime()
    ) {
      overdueAssessments++;
    }
  }

  // Escalated count
  let escalatedCount = 0;
  for (const a of assessments) {
    if (a.status === "escalated") {
      escalatedCount++;
    }
  }

  return {
    children_assessed: childrenAssessed,
    by_risk_level: byRiskLevel,
    by_substance_type: bySubstanceType,
    active_referrals: activeReferrals,
    incidents_this_quarter: incidentsThisQuarter,
    by_incident_type: byIncidentType,
    children_with_intervention_plans: childrenWithInterventionPlans,
    overdue_assessments: overdueAssessments,
    escalated_count: escalatedCount,
  };
}

/**
 * Identify alerts requiring management attention from substance misuse
 * assessments and incidents.
 */
export function identifySubstanceMisuseAlerts(
  assessments: SubstanceAssessment[],
  incidents: SubstanceIncident[],
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
  const now = new Date();

  // ── Assessment-level alerts ────────────────────────────────────────

  for (const a of assessments) {
    // Serious or significant risk child — critical
    if (a.risk_level === "serious" && (a.status === "active" || a.status === "escalated")) {
      alerts.push({
        type: "serious_risk_child",
        severity: "critical",
        message: `${a.child_name} assessed at serious risk for ${a.substance_type.replace(/_/g, " ")} — Reg 12 requires immediate protective action`,
        id: a.id,
      });
    } else if (a.risk_level === "significant" && (a.status === "active" || a.status === "escalated")) {
      alerts.push({
        type: "significant_risk_child",
        severity: "critical",
        message: `${a.child_name} assessed at significant risk for ${a.substance_type.replace(/_/g, " ")} — enhanced monitoring and intervention required`,
        id: a.id,
      });
    }

    // Overdue assessment — high
    if (
      (a.status === "active" || a.status === "monitoring") &&
      a.next_assessment_date &&
      new Date(a.next_assessment_date).getTime() < now.getTime()
    ) {
      const daysOverdue = Math.floor(
        (now.getTime() - new Date(a.next_assessment_date).getTime()) / 86400000,
      );
      alerts.push({
        type: "overdue_assessment",
        severity: "high",
        message: `Substance assessment for ${a.child_name} is ${daysOverdue} days overdue — reassessment required to maintain Reg 12 compliance`,
        id: a.id,
      });
    }

    // No intervention plan for moderate+ risk — medium
    if (
      (a.risk_level === "moderate" || a.risk_level === "significant" || a.risk_level === "serious") &&
      !a.intervention_plan &&
      (a.status === "active" || a.status === "monitoring")
    ) {
      alerts.push({
        type: "no_intervention_plan",
        severity: "medium",
        message: `${a.child_name} has ${a.risk_level} substance risk but no intervention plan recorded — plan required under Reg 12`,
        id: a.id,
      });
    }
  }

  // ── Incident-level alerts ──────────────────────────────────────────

  for (const i of incidents) {
    // Overdose incident — critical
    if (i.incident_type === "overdose") {
      alerts.push({
        type: "overdose_incident",
        severity: "critical",
        message: `Overdose incident recorded for ${i.child_name} on ${i.incident_date} — Reg 34 notification required, immediate safeguarding response needed`,
        id: i.id,
      });
    }

    // Incident without follow-up — high
    if (i.follow_up_date && !i.follow_up_completed && new Date(i.follow_up_date).getTime() < now.getTime()) {
      alerts.push({
        type: "incident_no_follow_up",
        severity: "high",
        message: `Substance incident for ${i.child_name} on ${i.incident_date} has overdue follow-up — action required`,
        id: i.id,
      });
    }

    // Police involvement not recorded — high (for serious incident types)
    if (
      (i.incident_type === "suspected_dealing" || i.incident_type === "overdose") &&
      !i.police_involved
    ) {
      alerts.push({
        type: "police_not_recorded",
        severity: "high",
        message: `${i.incident_type.replace(/_/g, " ")} incident for ${i.child_name} — police involvement not recorded, review whether notification is required`,
        id: i.id,
      });
    }

    // Social worker not notified — high
    if (
      (i.incident_type === "overdose" || i.incident_type === "suspected_dealing" || i.incident_type === "under_influence") &&
      !i.social_worker_notified
    ) {
      alerts.push({
        type: "social_worker_not_notified",
        severity: "high",
        message: `Social worker not notified for ${i.incident_type.replace(/_/g, " ")} incident involving ${i.child_name} — safeguarding protocol requires notification`,
        id: i.id,
      });
    }

    // Ofsted not notified for serious case — critical
    if (
      (i.incident_type === "overdose" || i.incident_type === "suspected_dealing") &&
      !i.ofsted_notified
    ) {
      alerts.push({
        type: "ofsted_not_notified",
        severity: "critical",
        message: `Ofsted not notified for ${i.incident_type.replace(/_/g, " ")} incident involving ${i.child_name} — Reg 34 requires notification without delay`,
        id: i.id,
      });
    }
  }

  return alerts;
}

// ── CRUD — Substance Assessments ───────────────────────────────────────

export async function listAssessments(
  homeId: string,
  filters?: {
    childId?: string;
    substanceType?: SubstanceType;
    riskLevel?: RiskLevel;
    status?: AssessmentStatus;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<SubstanceAssessment[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_substance_assessments") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.substanceType) q = q.eq("substance_type", filters.substanceType);
  if (filters?.riskLevel) q = q.eq("risk_level", filters.riskLevel);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.dateFrom) q = q.gte("assessment_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("assessment_date", filters.dateTo);
  q = q.order("assessment_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createAssessment(
  input: {
    homeId: string;
    childId: string;
    childName: string;
    assessmentDate: string;
    assessedBy: string;
    substanceType: SubstanceType;
    riskLevel?: RiskLevel;
    frequency?: Frequency;
    context?: UseContext;
    impactOnHealth?: string;
    impactOnBehaviour?: string;
    impactOnEducation?: string;
    referralMade?: boolean;
    referralTo?: string;
    referralDate?: string;
    interventionPlan?: string;
    nextAssessmentDate?: string;
    status?: AssessmentStatus;
    notes?: string;
  },
): Promise<ServiceResult<SubstanceAssessment>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_substance_assessments") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId,
      child_name: input.childName,
      assessment_date: input.assessmentDate,
      assessed_by: input.assessedBy,
      substance_type: input.substanceType,
      risk_level: input.riskLevel ?? "low",
      frequency: input.frequency ?? "unknown",
      context: input.context ?? null,
      impact_on_health: input.impactOnHealth ?? null,
      impact_on_behaviour: input.impactOnBehaviour ?? null,
      impact_on_education: input.impactOnEducation ?? null,
      referral_made: input.referralMade ?? false,
      referral_to: input.referralTo ?? null,
      referral_date: input.referralDate ?? null,
      intervention_plan: input.interventionPlan ?? null,
      next_assessment_date: input.nextAssessmentDate ?? null,
      status: input.status ?? "active",
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateAssessment(
  id: string,
  updates: Partial<SubstanceAssessment>,
): Promise<ServiceResult<SubstanceAssessment>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_substance_assessments") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Substance Incidents ─────────────────────────────────────────

export async function listIncidents(
  homeId: string,
  filters?: {
    childId?: string;
    substanceType?: SubstanceType;
    incidentType?: IncidentType;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<SubstanceIncident[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_substance_incidents") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.substanceType) q = q.eq("substance_type", filters.substanceType);
  if (filters?.incidentType) q = q.eq("incident_type", filters.incidentType);
  if (filters?.dateFrom) q = q.gte("incident_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("incident_date", filters.dateTo);
  q = q.order("incident_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createIncident(
  input: {
    homeId: string;
    childId: string;
    childName: string;
    incidentDate: string;
    reportedBy: string;
    substanceType: SubstanceType;
    incidentType: IncidentType;
    description?: string;
    location?: string;
    immediateAction?: string;
    medicalAttention?: boolean;
    policeInvolved?: boolean;
    socialWorkerNotified?: boolean;
    parentNotified?: boolean;
    ofstedNotified?: boolean;
    followUpActions?: { action: string; assigned_to: string; due_date: string; completed: boolean }[];
    followUpDate?: string;
    followUpCompleted?: boolean;
  },
): Promise<ServiceResult<SubstanceIncident>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_substance_incidents") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId,
      child_name: input.childName,
      incident_date: input.incidentDate,
      reported_by: input.reportedBy,
      substance_type: input.substanceType,
      incident_type: input.incidentType,
      description: input.description ?? "",
      location: input.location ?? null,
      immediate_action: input.immediateAction ?? "",
      medical_attention: input.medicalAttention ?? false,
      police_involved: input.policeInvolved ?? false,
      social_worker_notified: input.socialWorkerNotified ?? false,
      parent_notified: input.parentNotified ?? false,
      ofsted_notified: input.ofstedNotified ?? false,
      follow_up_actions: input.followUpActions ?? [],
      follow_up_date: input.followUpDate ?? null,
      follow_up_completed: input.followUpCompleted ?? false,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeSubstanceMisuseMetrics,
  identifySubstanceMisuseAlerts,
};
