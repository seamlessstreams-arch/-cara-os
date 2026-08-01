// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILDREN'S RIGHTS SERVICE
// Monitors and evidences children's rights within the home, tracking
// rights awareness, rights-based practice, complaints empowerment,
// and advocacy access.
// CHR 2015 Reg 7 (children's wishes and feelings — right to be heard),
// Reg 8 (children's views, wishes, and feelings),
// Reg 16 (providing children with information — their rights).
//
// Ensures children understand their rights, have access to advocacy,
// know how to complain, and that the home actively promotes a
// rights-based culture in all aspects of care.
//
// SCCIF: Overall Experiences — "Children know their rights and feel
// empowered to express their views." "Children know how to make a
// complaint and feel confident to do so."
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

export type RightsCategory =
  | "right_to_be_heard"
  | "right_to_privacy"
  | "right_to_complain"
  | "right_to_advocacy"
  | "right_to_contact"
  | "right_to_education"
  | "right_to_health"
  | "right_to_identity"
  | "right_to_religion"
  | "right_to_information"
  | "right_to_safety"
  | "right_to_participation"
  | "other";

export type RightsCheckOutcome =
  | "fully_met"
  | "partially_met"
  | "not_met"
  | "not_applicable";

export type EmpowermentLevel =
  | "fully_empowered"
  | "mostly_empowered"
  | "partially_empowered"
  | "not_empowered"
  | "not_assessed";

export interface RightsAudit {
  id: string;
  home_id: string;
  audit_date: string;
  auditor: string;
  rights_checks: {
    category: RightsCategory;
    outcome: RightsCheckOutcome;
    evidence: string;
    action_required: string | null;
  }[];
  children_consulted: number;
  overall_rating: string;
  key_findings: string[];
  actions: string[];
  created_at: string;
}

export interface ChildRightsProfile {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  knows_rights: boolean;
  knows_how_to_complain: boolean;
  has_advocate: boolean;
  advocate_name: string | null;
  views_sought_regularly: boolean;
  empowerment_level: EmpowermentLevel;
  preferred_communication: string;
  last_rights_discussion: string | null;
  barriers_to_participation: string[];
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const RIGHTS_CATEGORIES: { category: RightsCategory; label: string }[] = [
  { category: "right_to_be_heard", label: "Right to Be Heard" },
  { category: "right_to_privacy", label: "Right to Privacy" },
  { category: "right_to_complain", label: "Right to Complain" },
  { category: "right_to_advocacy", label: "Right to Advocacy" },
  { category: "right_to_contact", label: "Right to Contact" },
  { category: "right_to_education", label: "Right to Education" },
  { category: "right_to_health", label: "Right to Health" },
  { category: "right_to_identity", label: "Right to Identity" },
  { category: "right_to_religion", label: "Right to Religion" },
  { category: "right_to_information", label: "Right to Information" },
  { category: "right_to_safety", label: "Right to Safety" },
  { category: "right_to_participation", label: "Right to Participation" },
  { category: "other", label: "Other" },
];

export const RIGHTS_CHECK_OUTCOMES: { outcome: RightsCheckOutcome; label: string }[] = [
  { outcome: "fully_met", label: "Fully Met" },
  { outcome: "partially_met", label: "Partially Met" },
  { outcome: "not_met", label: "Not Met" },
  { outcome: "not_applicable", label: "Not Applicable" },
];

export const EMPOWERMENT_LEVELS: { level: EmpowermentLevel; label: string }[] = [
  { level: "fully_empowered", label: "Fully Empowered" },
  { level: "mostly_empowered", label: "Mostly Empowered" },
  { level: "partially_empowered", label: "Partially Empowered" },
  { level: "not_empowered", label: "Not Empowered" },
  { level: "not_assessed", label: "Not Assessed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute children's rights metrics.
 */
export function computeRightsMetrics(
  audits: RightsAudit[],
  profiles: ChildRightsProfile[],
  totalChildren: number,
): {
  total_audits: number;
  children_with_profiles: number;
  profile_coverage_rate: number | null;
  knows_rights_rate: number | null;
  knows_complaints_rate: number | null;
  has_advocate_rate: number | null;
  views_sought_rate: number | null;
  fully_empowered_count: number;
  not_empowered_count: number;
  rights_fully_met: number;
  rights_partially_met: number;
  rights_not_met: number;
  by_empowerment: Record<string, number>;
  by_rights_outcome: Record<string, number>;
} {
  // Profile coverage
  const childrenWithProfiles = new Set(profiles.map((p) => p.child_id)).size;
  const profileCoverageRate =
    totalChildren > 0
      ? Math.round((childrenWithProfiles / totalChildren) * 1000) / 10
      : null;

  // Rights awareness
  const knowsRights = profiles.filter((p) => p.knows_rights).length;
  const knowsComplaints = profiles.filter((p) => p.knows_how_to_complain).length;
  const hasAdvocate = profiles.filter((p) => p.has_advocate).length;
  const viewsSought = profiles.filter((p) => p.views_sought_regularly).length;

  const knowsRightsRate =
    profiles.length > 0
      ? Math.round((knowsRights / profiles.length) * 1000) / 10
      : null;
  const knowsComplaintsRate =
    profiles.length > 0
      ? Math.round((knowsComplaints / profiles.length) * 1000) / 10
      : null;
  const hasAdvocateRate =
    profiles.length > 0
      ? Math.round((hasAdvocate / profiles.length) * 1000) / 10
      : null;
  const viewsSoughtRate =
    profiles.length > 0
      ? Math.round((viewsSought / profiles.length) * 1000) / 10
      : null;

  // Empowerment
  let fullyEmpowered = 0;
  let notEmpowered = 0;
  const byEmpowerment: Record<string, number> = {};
  for (const p of profiles) {
    byEmpowerment[p.empowerment_level] = (byEmpowerment[p.empowerment_level] ?? 0) + 1;
    if (p.empowerment_level === "fully_empowered") fullyEmpowered++;
    if (p.empowerment_level === "not_empowered") notEmpowered++;
  }

  // Rights audit outcomes (from all audits)
  let fullyMet = 0;
  let partiallyMet = 0;
  let notMet = 0;
  const byRightsOutcome: Record<string, number> = {};

  for (const a of audits) {
    for (const check of a.rights_checks) {
      if (check.outcome === "not_applicable") continue;
      byRightsOutcome[check.outcome] = (byRightsOutcome[check.outcome] ?? 0) + 1;
      if (check.outcome === "fully_met") fullyMet++;
      if (check.outcome === "partially_met") partiallyMet++;
      if (check.outcome === "not_met") notMet++;
    }
  }

  return {
    total_audits: audits.length,
    children_with_profiles: childrenWithProfiles,
    profile_coverage_rate: profileCoverageRate,
    knows_rights_rate: knowsRightsRate,
    knows_complaints_rate: knowsComplaintsRate,
    has_advocate_rate: hasAdvocateRate,
    views_sought_rate: viewsSoughtRate,
    fully_empowered_count: fullyEmpowered,
    not_empowered_count: notEmpowered,
    rights_fully_met: fullyMet,
    rights_partially_met: partiallyMet,
    rights_not_met: notMet,
    by_empowerment: byEmpowerment,
    by_rights_outcome: byRightsOutcome,
  };
}

/**
 * Identify children's rights alerts.
 */
export function identifyRightsAlerts(
  audits: RightsAudit[],
  profiles: ChildRightsProfile[],
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

  // Children who don't know their rights
  for (const p of profiles) {
    if (!p.knows_rights) {
      alerts.push({
        type: "rights_not_known",
        severity: "high",
        message: `${p.child_name} does not understand their rights — schedule rights discussion using age-appropriate materials`,
        id: p.id,
      });
    }
  }

  // Children who don't know how to complain
  for (const p of profiles) {
    if (!p.knows_how_to_complain) {
      alerts.push({
        type: "complaints_not_known",
        severity: "high",
        message: `${p.child_name} does not know how to make a complaint — ensure complaints procedure is explained and accessible`,
        id: p.id,
      });
    }
  }

  // Children without advocates
  for (const p of profiles) {
    if (!p.has_advocate) {
      alerts.push({
        type: "no_advocate",
        severity: "medium",
        message: `${p.child_name} does not have an independent advocate — refer to advocacy service`,
        id: p.id,
      });
    }
  }

  // Not empowered
  for (const p of profiles) {
    if (p.empowerment_level === "not_empowered") {
      alerts.push({
        type: "not_empowered",
        severity: "high",
        message: `${p.child_name} is assessed as not empowered — review barriers to participation and develop empowerment plan`,
        id: p.id,
      });
    }
  }

  // Rights not met in latest audit
  const sortedAudits = [...audits].sort(
    (a, b) => new Date(b.audit_date).getTime() - new Date(a.audit_date).getTime(),
  );
  const latestAudit = sortedAudits[0];
  if (latestAudit) {
    for (const check of latestAudit.rights_checks) {
      if (check.outcome === "not_met") {
        alerts.push({
          type: "right_not_met",
          severity: "critical",
          message: `${RIGHTS_CATEGORIES.find((c) => c.category === check.category)?.label ?? check.category} was assessed as not met in latest audit — ${check.action_required ?? "action required"}`,
          id: latestAudit.id,
        });
      }
    }
  }

  // Coverage gap
  const childrenWithProfiles = new Set(profiles.map((p) => p.child_id)).size;
  if (totalChildren > childrenWithProfiles) {
    const missing = totalChildren - childrenWithProfiles;
    alerts.push({
      type: "coverage_gap",
      severity: "high",
      message: `${missing} child${missing > 1 ? "ren" : ""} without rights profiles — complete rights assessment for all children`,
      id: "coverage-gap",
    });
  }

  return alerts;
}

// ── CRUD — Rights Audits ─────────────────────────────────────────────────

export async function listAudits(
  homeId: string,
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<RightsAudit[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_rights_audits") as SB).select("*").eq("home_id", homeId);
  if (filters?.dateFrom) q = q.gte("audit_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("audit_date", filters.dateTo);
  q = q.order("audit_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createAudit(
  input: {
    homeId: string;
    auditDate: string;
    auditor: string;
    rightsChecks: {
      category: RightsCategory;
      outcome: RightsCheckOutcome;
      evidence: string;
      actionRequired?: string;
    }[];
    childrenConsulted: number;
    overallRating: string;
    keyFindings: string[];
    actions: string[];
  },
): Promise<ServiceResult<RightsAudit>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_rights_audits") as SB)
    .insert({
      home_id: input.homeId,
      audit_date: input.auditDate,
      auditor: input.auditor,
      rights_checks: input.rightsChecks.map((c) => ({
        ...c,
        action_required: c.actionRequired ?? null,
      })),
      children_consulted: input.childrenConsulted,
      overall_rating: input.overallRating,
      key_findings: input.keyFindings,
      actions: input.actions,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Child Rights Profiles ────────────────────────────────────────

export async function listProfiles(
  homeId: string,
  filters?: {
    childId?: string;
    empowermentLevel?: EmpowermentLevel;
    limit?: number;
  },
): Promise<ServiceResult<ChildRightsProfile[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_child_rights_profiles") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.empowermentLevel) q = q.eq("empowerment_level", filters.empowermentLevel);
  q = q.order("child_name", { ascending: true }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createProfile(
  input: {
    homeId: string;
    childId: string;
    childName: string;
    knowsRights: boolean;
    knowsHowToComplain: boolean;
    hasAdvocate: boolean;
    advocateName?: string;
    viewsSoughtRegularly: boolean;
    empowermentLevel: EmpowermentLevel;
    preferredCommunication: string;
    barriersToParticipation?: string[];
  },
): Promise<ServiceResult<ChildRightsProfile>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_child_rights_profiles") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId,
      child_name: input.childName,
      knows_rights: input.knowsRights,
      knows_how_to_complain: input.knowsHowToComplain,
      has_advocate: input.hasAdvocate,
      advocate_name: input.advocateName ?? null,
      views_sought_regularly: input.viewsSoughtRegularly,
      empowerment_level: input.empowermentLevel,
      preferred_communication: input.preferredCommunication,
      last_rights_discussion: null,
      barriers_to_participation: input.barriersToParticipation ?? [],
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateProfile(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<ChildRightsProfile>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_child_rights_profiles") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeRightsMetrics,
  identifyRightsAlerts,
};
