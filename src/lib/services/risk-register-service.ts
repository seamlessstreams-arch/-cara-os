// ══════════════════════════════════════════════════════════════════════════════
// CARA — RISK MANAGEMENT REGISTER SERVICE
// Maintains a live risk register for the children's home, tracking
// identified risks, risk ratings, mitigation strategies, owners,
// and review cycles.
// CHR 2015 Reg 13 (leadership and management — risk management),
// Reg 40 (notifications — risk-related incidents),
// Reg 45 (review of quality of care — risk oversight).
//
// Tracks organisational, safeguarding, operational, environmental,
// and individual child risks with scoring and mitigation.
//
// SCCIF: Leadership & Management — "Risks are identified, managed,
// and regularly reviewed." "Risk management is proactive."
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

export type RiskCategory =
  | "safeguarding"
  | "health_safety"
  | "staffing"
  | "operational"
  | "environmental"
  | "financial"
  | "reputational"
  | "regulatory"
  | "individual_child"
  | "community"
  | "other";

export type LikelihoodRating = 1 | 2 | 3 | 4 | 5;
export type ImpactRating = 1 | 2 | 3 | 4 | 5;

export type RiskStatus =
  | "open"
  | "mitigated"
  | "accepted"
  | "escalated"
  | "closed"
  | "monitoring";

export type ReviewFrequency =
  | "weekly"
  | "fortnightly"
  | "monthly"
  | "quarterly"
  | "annually";

export interface RiskEntry {
  id: string;
  home_id: string;
  risk_title: string;
  risk_description: string;
  risk_category: RiskCategory;
  likelihood: LikelihoodRating;
  impact: ImpactRating;
  risk_score: number | null;
  risk_status: RiskStatus;
  mitigations: string[];
  risk_owner: string;
  review_frequency: ReviewFrequency;
  last_review_date: string | null;
  next_review_date: string | null;
  child_id: string | null;
  child_name: string | null;
  linked_incident_ids: string[];
  escalated_to: string | null;
  date_identified: string;
  date_closed: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const RISK_CATEGORIES: { category: RiskCategory; label: string }[] = [
  { category: "safeguarding", label: "Safeguarding" },
  { category: "health_safety", label: "Health & Safety" },
  { category: "staffing", label: "Staffing" },
  { category: "operational", label: "Operational" },
  { category: "environmental", label: "Environmental" },
  { category: "financial", label: "Financial" },
  { category: "reputational", label: "Reputational" },
  { category: "regulatory", label: "Regulatory" },
  { category: "individual_child", label: "Individual Child" },
  { category: "community", label: "Community" },
  { category: "other", label: "Other" },
];

export const RISK_STATUSES: { status: RiskStatus; label: string }[] = [
  { status: "open", label: "Open" },
  { status: "mitigated", label: "Mitigated" },
  { status: "accepted", label: "Accepted" },
  { status: "escalated", label: "Escalated" },
  { status: "closed", label: "Closed" },
  { status: "monitoring", label: "Monitoring" },
];

export const REVIEW_FREQUENCIES: { frequency: ReviewFrequency; label: string }[] = [
  { frequency: "weekly", label: "Weekly" },
  { frequency: "fortnightly", label: "Fortnightly" },
  { frequency: "monthly", label: "Monthly" },
  { frequency: "quarterly", label: "Quarterly" },
  { frequency: "annually", label: "Annually" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeRiskScore(likelihood: LikelihoodRating, impact: ImpactRating): number {
  return likelihood * impact;
}

export function getRiskLevel(score: number): "critical" | "high" | "medium" | "low" {
  if (score >= 20) return "critical";
  if (score >= 12) return "high";
  if (score >= 6) return "medium";
  return "low";
}

export function computeRiskMetrics(
  entries: RiskEntry[],
): {
  total_risks: number;
  open_risks: number;
  mitigated_risks: number;
  escalated_risks: number;
  closed_risks: number;
  critical_risks: number;
  high_risks: number;
  medium_risks: number;
  low_risks: number;
  average_risk_score: number | null;
  highest_risk_score: number | null;
  risks_without_mitigations: number;
  review_overdue_count: number;
  child_specific_risks: number;
  by_category: Record<string, number>;
  by_status: Record<string, number>;
  by_risk_level: Record<string, number>;
  by_review_frequency: Record<string, number>;
} {
  const open = entries.filter((e) => e.risk_status === "open").length;
  const mitigated = entries.filter((e) => e.risk_status === "mitigated").length;
  const escalated = entries.filter((e) => e.risk_status === "escalated").length;
  const closed = entries.filter((e) => e.risk_status === "closed").length;

  let critical = 0;
  let high = 0;
  let medium = 0;
  let low = 0;
  for (const e of entries) {
    const level = getRiskLevel(e.risk_score ?? 0);
    if (level === "critical") critical++;
    else if (level === "high") high++;
    else if (level === "medium") medium++;
    else low++;
  }

  const totalScore = entries.reduce((sum, e) => sum + (e.risk_score ?? 0), 0);
  const avgScore =
    entries.length > 0
      ? Math.round((totalScore / entries.length) * 10) / 10
      : null;

  const highestScore = entries.length > 0
    ? Math.max(...entries.map((e) => e.risk_score ?? 0))
    : null;

  const noMitigations = entries.filter((e) => e.mitigations.length === 0 && e.risk_status !== "closed").length;

  const now = new Date();
  const reviewOverdue = entries.filter(
    (e) => e.next_review_date && new Date(e.next_review_date) < now && e.risk_status !== "closed",
  ).length;

  const childSpecific = entries.filter((e) => e.child_id !== null).length;

  const byCat: Record<string, number> = {};
  for (const e of entries) byCat[e.risk_category] = (byCat[e.risk_category] ?? 0) + 1;

  const byStatus: Record<string, number> = {};
  for (const e of entries) byStatus[e.risk_status] = (byStatus[e.risk_status] ?? 0) + 1;

  const byLevel: Record<string, number> = {};
  for (const e of entries) {
    const level = getRiskLevel(e.risk_score ?? 0);
    byLevel[level] = (byLevel[level] ?? 0) + 1;
  }

  const byFreq: Record<string, number> = {};
  for (const e of entries) byFreq[e.review_frequency] = (byFreq[e.review_frequency] ?? 0) + 1;

  return {
    total_risks: entries.length,
    open_risks: open,
    mitigated_risks: mitigated,
    escalated_risks: escalated,
    closed_risks: closed,
    critical_risks: critical,
    high_risks: high,
    medium_risks: medium,
    low_risks: low,
    average_risk_score: avgScore,
    highest_risk_score: highestScore,
    risks_without_mitigations: noMitigations,
    review_overdue_count: reviewOverdue,
    child_specific_risks: childSpecific,
    by_category: byCat,
    by_status: byStatus,
    by_risk_level: byLevel,
    by_review_frequency: byFreq,
  };
}

export function identifyRiskAlerts(
  entries: RiskEntry[],
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

  // Critical risks (score >= 20)
  for (const e of entries) {
    if ((e.risk_score ?? 0) >= 20 && e.risk_status !== "closed") {
      alerts.push({
        type: "critical_risk",
        severity: "critical",
        message: `Critical risk: ${e.risk_title} (score ${e.risk_score}) — requires immediate management attention and escalation`,
        id: e.id,
      });
    }
  }

  // Escalated risks
  for (const e of entries) {
    if (e.risk_status === "escalated") {
      alerts.push({
        type: "risk_escalated",
        severity: "critical",
        message: `Risk escalated: ${e.risk_title} — escalated to ${e.escalated_to ?? "senior management"} for action`,
        id: e.id,
      });
    }
  }

  // Open risks without mitigations
  for (const e of entries) {
    if (e.mitigations.length === 0 && e.risk_status === "open") {
      alerts.push({
        type: "no_mitigations",
        severity: "high",
        message: `Risk "${e.risk_title}" has no mitigation strategies — identify and implement controls`,
        id: e.id,
      });
    }
  }

  // Review overdue
  for (const e of entries) {
    if (e.next_review_date && new Date(e.next_review_date) < now && e.risk_status !== "closed") {
      alerts.push({
        type: "review_overdue",
        severity: "medium",
        message: `Risk review overdue for "${e.risk_title}" since ${e.next_review_date} — review and update risk assessment`,
        id: e.id,
      });
    }
  }

  // High safeguarding risks
  for (const e of entries) {
    if (e.risk_category === "safeguarding" && (e.risk_score ?? 0) >= 12 && e.risk_status !== "closed") {
      alerts.push({
        type: "safeguarding_risk",
        severity: "high",
        message: `High safeguarding risk: ${e.risk_title} (score ${e.risk_score}) — ensure robust safeguarding measures in place`,
        id: e.id,
      });
    }
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listEntries(
  homeId: string,
  filters?: {
    riskCategory?: RiskCategory;
    riskStatus?: RiskStatus;
    childId?: string;
    limit?: number;
  },
): Promise<ServiceResult<RiskEntry[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_risk_register") as SB).select("*").eq("home_id", homeId);
  if (filters?.riskCategory) q = q.eq("risk_category", filters.riskCategory);
  if (filters?.riskStatus) q = q.eq("risk_status", filters.riskStatus);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  q = q.order("risk_score", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createEntry(
  input: {
    homeId: string;
    riskTitle: string;
    riskDescription: string;
    riskCategory: RiskCategory;
    likelihood: LikelihoodRating;
    impact: ImpactRating;
    riskStatus: RiskStatus;
    mitigations: string[];
    riskOwner: string;
    reviewFrequency: ReviewFrequency;
    nextReviewDate?: string;
    childId?: string;
    childName?: string;
    linkedIncidentIds: string[];
    escalatedTo?: string;
    dateIdentified: string;
    notes?: string;
  },
): Promise<ServiceResult<RiskEntry>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const riskScore = computeRiskScore(input.likelihood, input.impact);

  const { data, error } = await (s.from("cs_risk_register") as SB)
    .insert({
      home_id: input.homeId,
      risk_title: input.riskTitle,
      risk_description: input.riskDescription,
      risk_category: input.riskCategory,
      likelihood: input.likelihood,
      impact: input.impact,
      risk_score: riskScore,
      risk_status: input.riskStatus,
      mitigations: input.mitigations,
      risk_owner: input.riskOwner,
      review_frequency: input.reviewFrequency,
      last_review_date: null,
      next_review_date: input.nextReviewDate ?? null,
      child_id: input.childId ?? null,
      child_name: input.childName ?? null,
      linked_incident_ids: input.linkedIncidentIds,
      escalated_to: input.escalatedTo ?? null,
      date_identified: input.dateIdentified,
      date_closed: null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateEntry(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<RiskEntry>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_risk_register") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeRiskScore,
  getRiskLevel,
  computeRiskMetrics,
  identifyRiskAlerts,
};
