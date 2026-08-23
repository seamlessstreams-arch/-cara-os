// ══════════════════════════════════════════════════════════════════════════════
// CARA — RISK ASSESSMENT SERVICE
// Manages individual and environmental risk assessments, scoring matrices,
// mitigation tracking, and generates Cara risk intelligence.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type RiskCategory =
  | "self_harm" | "violence_aggression" | "absconding" | "exploitation"
  | "substance_misuse" | "online_safety" | "fire_setting" | "bullying"
  | "sexual_behaviour" | "environmental" | "health_medical" | "transport"
  | "activities" | "emotional_wellbeing" | "radicalisation";

export type RiskLevel = "very_high" | "high" | "medium" | "low" | "very_low";

export type RiskStatus = "active" | "under_review" | "mitigated" | "closed" | "escalated";

export interface RiskAssessment {
  id: string;
  home_id: string;
  child_id: string | null;
  category: RiskCategory;
  title: string;
  description: string;
  likelihood: number;            // 1-5
  impact: number;                // 1-5
  inherent_risk_score: number;   // likelihood * impact
  current_risk_level: RiskLevel;
  residual_risk_level: RiskLevel | null;
  mitigations: string[];
  triggers: string[];
  protective_factors: string[];
  status: RiskStatus;
  assessor_id: string;
  reviewer_id: string | null;
  review_date: string | null;
  next_review_date: string;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const RISK_CATEGORIES: {
  category: RiskCategory;
  label: string;
  description: string;
  regulationRef: string;
}[] = [
  { category: "self_harm", label: "Self-Harm & Suicidal Ideation", description: "Risk of self-inflicted harm or suicidal thoughts and behaviours", regulationRef: "Reg 12" },
  { category: "violence_aggression", label: "Violence & Aggression", description: "Risk of violent or aggressive behaviour towards others", regulationRef: "Reg 12" },
  { category: "absconding", label: "Missing / Absconding", description: "Risk of going missing or absconding from placement", regulationRef: "Reg 12, CHR2015 Reg 34" },
  { category: "exploitation", label: "Exploitation (CSE/CCE/County Lines)", description: "Risk of child sexual exploitation, criminal exploitation, or county lines involvement", regulationRef: "Working Together 2023" },
  { category: "substance_misuse", label: "Substance Misuse", description: "Risk related to use of drugs, alcohol, or other substances", regulationRef: "Reg 12" },
  { category: "online_safety", label: "Online Safety", description: "Risk of online harm including grooming, cyberbullying, and inappropriate content", regulationRef: "Keeping Children Safe in Education" },
  { category: "fire_setting", label: "Fire Setting", description: "Risk of fire-setting behaviour or arson", regulationRef: "Fire Safety Order 2005" },
  { category: "bullying", label: "Bullying (including cyber)", description: "Risk of bullying or being bullied, including cyberbullying", regulationRef: "Reg 12" },
  { category: "sexual_behaviour", label: "Harmful Sexual Behaviour", description: "Risk of displaying harmful sexual behaviour towards self or others", regulationRef: "Reg 12" },
  { category: "environmental", label: "Environmental / Premises", description: "Risks related to the physical environment, premises, and surroundings", regulationRef: "Reg 25" },
  { category: "health_medical", label: "Health & Medical", description: "Risks related to physical or mental health conditions and medical needs", regulationRef: "Reg 10" },
  { category: "transport", label: "Transport & Travel", description: "Risks associated with transport arrangements and travel", regulationRef: "Reg 12" },
  { category: "activities", label: "Activities & Outings", description: "Risks associated with planned activities, trips, and outings", regulationRef: "Reg 12" },
  { category: "emotional_wellbeing", label: "Emotional Wellbeing", description: "Risks to emotional wellbeing, mental health, and psychological safety", regulationRef: "Reg 12" },
  { category: "radicalisation", label: "Radicalisation (Prevent)", description: "Risk of radicalisation or extremist influence", regulationRef: "Prevent Duty 2023" },
];

// ── Risk matrix ──────────────────────────────────────────────────────────

/**
 * 5x5 risk matrix lookup.
 *
 * Score = likelihood * impact (1-25).
 *   1-4   → very_low
 *   5-8   → low
 *   9-12  → medium
 *   13-19 → high
 *   20-25 → very_high
 */
export const RISK_MATRIX: Record<string, RiskLevel> = (() => {
  const m: Record<string, RiskLevel> = {};
  for (let l = 1; l <= 5; l++) {
    for (let i = 1; i <= 5; i++) {
      const score = l * i;
      let level: RiskLevel;
      if (score >= 20) level = "very_high";
      else if (score >= 13) level = "high";
      else if (score >= 9) level = "medium";
      else if (score >= 5) level = "low";
      else level = "very_low";
      m[`${l}x${i}`] = level;
    }
  }
  return m;
})();

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute the inherent risk score and level from likelihood and impact.
 */
export function computeRiskScore(
  likelihood: number,
  impact: number,
): { score: number; level: RiskLevel } {
  const score = likelihood * impact;
  const level = RISK_MATRIX[`${likelihood}x${impact}`] ?? "medium";
  return { score, level };
}

const RISK_LEVEL_RANK: Record<RiskLevel, number> = {
  very_low: 0,
  low: 1,
  medium: 2,
  high: 3,
  very_high: 4,
};

/**
 * Compute a risk profile summary across multiple assessments.
 */
export function computeRiskProfile(
  assessments: { category: string; current_risk_level: RiskLevel; status: string }[],
): {
  total_assessments: number;
  active: number;
  by_level: Record<RiskLevel, number>;
  by_category: Record<string, number>;
  highest_risk_category: string | null;
  overall_risk_level: RiskLevel;
  needs_immediate_review: number;
} {
  const byLevel: Record<RiskLevel, number> = {
    very_high: 0, high: 0, medium: 0, low: 0, very_low: 0,
  };
  const byCategory: Record<string, number> = {};

  const active = assessments.filter((a) => a.status === "active" || a.status === "escalated");

  for (const a of assessments) {
    byLevel[a.current_risk_level]++;
    byCategory[a.category] = (byCategory[a.category] ?? 0) + 1;
  }

  // Determine highest risk category among active assessments
  let highestRiskCategory: string | null = null;
  let highestRank = -1;

  for (const a of active) {
    const rank = RISK_LEVEL_RANK[a.current_risk_level] ?? 0;
    if (rank > highestRank) {
      highestRank = rank;
      highestRiskCategory = a.category;
    }
  }

  // Overall risk level = highest active risk level
  let overallRiskLevel: RiskLevel = "very_low";
  for (const a of active) {
    const rank = RISK_LEVEL_RANK[a.current_risk_level] ?? 0;
    if (rank > RISK_LEVEL_RANK[overallRiskLevel]) {
      overallRiskLevel = a.current_risk_level;
    }
  }

  // Count active assessments at very_high or high
  const needsImmediateReview = active.filter(
    (a) => a.current_risk_level === "very_high" || a.current_risk_level === "high",
  ).length;

  return {
    total_assessments: assessments.length,
    active: active.length,
    by_level: byLevel,
    by_category: byCategory,
    highest_risk_category: highestRiskCategory,
    overall_risk_level: overallRiskLevel,
    needs_immediate_review: needsImmediateReview,
  };
}

/**
 * Compare two snapshots of assessments to determine risk trend direction.
 */
export function computeRiskTrend(
  currentAssessments: { category: string; current_risk_level: RiskLevel; status: string }[],
  previousAssessments: { category: string; current_risk_level: RiskLevel; status: string }[],
): {
  direction: "improving" | "stable" | "deteriorating";
  change_count: number;
  new_risks: number;
  closed_risks: number;
} {
  const currentActiveHighPlus = currentAssessments.filter(
    (a) =>
      (a.status === "active" || a.status === "escalated") &&
      (a.current_risk_level === "very_high" || a.current_risk_level === "high"),
  ).length;

  const previousActiveHighPlus = previousAssessments.filter(
    (a) =>
      (a.status === "active" || a.status === "escalated") &&
      (a.current_risk_level === "very_high" || a.current_risk_level === "high"),
  ).length;

  const currentActive = currentAssessments.filter(
    (a) => a.status === "active" || a.status === "escalated",
  ).length;
  const previousActive = previousAssessments.filter(
    (a) => a.status === "active" || a.status === "escalated",
  ).length;

  const newRisks = Math.max(0, currentActive - previousActive);
  const closedRisks = Math.max(0, previousActive - currentActive);

  const changeCount = currentActiveHighPlus - previousActiveHighPlus;

  let direction: "improving" | "stable" | "deteriorating";
  if (changeCount < 0) direction = "improving";
  else if (changeCount > 0) direction = "deteriorating";
  else direction = "stable";

  return {
    direction,
    change_count: changeCount,
    new_risks: newRisks,
    closed_risks: closedRisks,
  };
}

/**
 * Check whether a risk assessment is overdue for review.
 */
export function isReviewOverdue(
  nextReviewDate: string,
  now: Date,
): boolean {
  const reviewDate = new Date(nextReviewDate);
  return now.getTime() > reviewDate.getTime();
}

/**
 * Compute a summary of risk for a specific child.
 */
export function computeChildRiskSummary(
  assessments: { child_id: string | null; category: string; current_risk_level: RiskLevel; status: string }[],
): {
  child_id: string | null;
  total: number;
  active_high_plus: number;
  categories: string[];
  recommended_review_frequency: "weekly" | "fortnightly" | "monthly" | "quarterly";
  flag_level: "red" | "amber" | "green";
} {
  const childId = assessments.length > 0 ? assessments[0].child_id : null;

  const active = assessments.filter((a) => a.status === "active" || a.status === "escalated");
  const activeHighPlus = active.filter(
    (a) => a.current_risk_level === "very_high" || a.current_risk_level === "high",
  ).length;

  const categories = [...new Set(assessments.map((a) => a.category))];

  // Determine highest risk level among active assessments
  let highestRank = -1;
  for (const a of active) {
    const rank = RISK_LEVEL_RANK[a.current_risk_level] ?? 0;
    if (rank > highestRank) highestRank = rank;
  }

  // Recommended review frequency based on highest active risk
  let recommendedReviewFrequency: "weekly" | "fortnightly" | "monthly" | "quarterly";
  if (highestRank >= 4) recommendedReviewFrequency = "weekly";           // very_high
  else if (highestRank >= 3) recommendedReviewFrequency = "fortnightly"; // high
  else if (highestRank >= 2) recommendedReviewFrequency = "monthly";     // medium
  else recommendedReviewFrequency = "quarterly";                          // low / very_low / none

  // Flag level
  let flagLevel: "red" | "amber" | "green";
  if (highestRank >= 4) flagLevel = "red";
  else if (highestRank >= 3) flagLevel = "red";
  else if (highestRank >= 2) flagLevel = "amber";
  else flagLevel = "green";

  return {
    child_id: childId,
    total: assessments.length,
    active_high_plus: activeHighPlus,
    categories,
    recommended_review_frequency: recommendedReviewFrequency,
    flag_level: flagLevel,
  };
}

// ── CRUD ──────────────────────────────────────────────────────────────────

export async function listRiskAssessments(
  homeId: string,
  opts?: {
    childId?: string;
    category?: RiskCategory;
    status?: RiskStatus;
    riskLevel?: RiskLevel;
    limit?: number;
  },
): Promise<ServiceResult<RiskAssessment[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_risk_assessments") as SB).select("*").eq("home_id", homeId);
  if (opts?.childId) q = q.eq("child_id", opts.childId);
  if (opts?.category) q = q.eq("category", opts.category);
  if (opts?.status) q = q.eq("status", opts.status);
  if (opts?.riskLevel) q = q.eq("current_risk_level", opts.riskLevel);
  q = q.order("created_at", { ascending: false }).limit(opts?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRiskAssessment(
  id: string,
): Promise<ServiceResult<RiskAssessment>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_risk_assessments") as SB)
    .select("*")
    .eq("id", id)
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createRiskAssessment(
  input: {
    homeId: string;
    childId?: string;
    category: RiskCategory;
    title: string;
    description: string;
    likelihood: number;
    impact: number;
    residualRiskLevel?: RiskLevel;
    mitigations?: string[];
    triggers?: string[];
    protectiveFactors?: string[];
    status?: RiskStatus;
    assessorId: string;
    reviewerId?: string;
    reviewDate?: string;
    nextReviewDate: string;
  },
): Promise<ServiceResult<RiskAssessment>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { score, level } = computeRiskScore(input.likelihood, input.impact);

  const { data, error } = await (s.from("cs_risk_assessments") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId ?? null,
      category: input.category,
      title: input.title,
      description: input.description,
      likelihood: input.likelihood,
      impact: input.impact,
      inherent_risk_score: score,
      current_risk_level: level,
      residual_risk_level: input.residualRiskLevel ?? null,
      mitigations: input.mitigations ?? [],
      triggers: input.triggers ?? [],
      protective_factors: input.protectiveFactors ?? [],
      status: input.status ?? "active",
      assessor_id: input.assessorId,
      reviewer_id: input.reviewerId ?? null,
      review_date: input.reviewDate ?? null,
      next_review_date: input.nextReviewDate,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRiskAssessment(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<RiskAssessment>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_risk_assessments") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function reviewRiskAssessment(
  id: string,
  reviewerId: string,
  nextReviewDate: string,
): Promise<ServiceResult<RiskAssessment>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_risk_assessments") as SB)
    .update({
      reviewer_id: reviewerId,
      review_date: new Date().toISOString(),
      next_review_date: nextReviewDate,
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeRiskScore,
  computeRiskProfile,
  computeRiskTrend,
  isReviewOverdue,
  computeChildRiskSummary,
  RISK_CATEGORIES,
  RISK_MATRIX,
};
