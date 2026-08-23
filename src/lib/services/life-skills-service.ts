// ══════════════════════════════════════════════════════════════════════════════
// CARA — LIFE SKILLS & INDEPENDENCE SERVICE
// Manages skill assessments and pathway planning for children preparing for
// independence (CHR 2015 Reg 8 enjoyment & achievement, Reg 9 quality of care,
// Reg 14 care planning for children leaving care). Tracks readiness across
// eight life-skill domains and supports pathway plans for 16+ year olds.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface SkillAssessment {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  domain: string;
  skill: string;
  competency_level: string;
  assessed_date: string;
  assessed_by: string;
  notes?: string | null;
  evidence?: string | null;
  created_at: string;
}

export interface PathwayPlan {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  status: string;
  start_date: string;
  target_move_date?: string | null;
  accommodation_plan?: string | null;
  education_employment_plan?: string | null;
  support_network?: string | null;
  personal_adviser_name?: string | null;
  last_reviewed?: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

export const SKILL_DOMAINS: {
  domain: string;
  label: string;
  skills: string[];
}[] = [
  { domain: "cooking_nutrition", label: "Cooking & Nutrition", skills: ["meal_planning", "basic_cooking", "food_hygiene", "healthy_eating", "budgeting_food"] },
  { domain: "money_management", label: "Money Management", skills: ["budgeting", "saving", "banking", "understanding_bills", "benefits_awareness"] },
  { domain: "personal_care", label: "Personal Care & Hygiene", skills: ["personal_hygiene", "laundry", "clothing_care", "health_appointments", "sexual_health_awareness"] },
  { domain: "home_management", label: "Home Management", skills: ["cleaning", "basic_diy", "recycling", "fire_safety_awareness", "tenant_responsibilities"] },
  { domain: "social_networks", label: "Social Networks & Relationships", skills: ["healthy_relationships", "conflict_resolution", "online_safety", "community_involvement", "support_networks"] },
  { domain: "education_employment", label: "Education & Employment", skills: ["cv_writing", "interview_skills", "job_searching", "timekeeping", "workplace_conduct"] },
  { domain: "practical_skills", label: "Practical Skills", skills: ["travel_planning", "using_public_transport", "making_appointments", "basic_first_aid", "emergency_procedures"] },
  { domain: "emotional_wellbeing", label: "Emotional Wellbeing", skills: ["self_regulation", "seeking_help", "resilience", "identity_awareness", "positive_coping"] },
];

export const COMPETENCY_LEVELS: string[] = [
  "not_assessed",
  "needs_support",
  "developing",
  "competent",
  "independent",
];

export const PATHWAY_PLAN_STATUS: string[] = [
  "not_required",
  "not_started",
  "in_progress",
  "active",
  "completed",
];

// ── Derived constants ──────────────────────────────────────────────────────

const TOTAL_SKILLS = SKILL_DOMAINS.reduce((sum, d) => sum + d.skills.length, 0);

const COMPETENT_OR_INDEPENDENT = new Set(["competent", "independent"]);

// ── Pure functions (no DB) ──────────────────────────────────────────────────

/**
 * Compute readiness profile for a single child across all skill domains.
 */
export function computeChildReadiness(
  assessments: SkillAssessment[],
  childId: string,
): {
  total_skills_assessed: number;
  total_skills: number;
  by_domain: Record<string, { assessed: number; total: number; avg_level: number | null; competent_count: number }>;
  overall_readiness: number | null;
  strongest_domain: string | null;
  weakest_domain: string | null;
  not_assessed_count: number;
} {
  const childAssessments = assessments.filter((a) => a.child_id === childId);

  // Build a map of domain -> skill -> latest assessment (by assessed_date)
  const latestBySkill = new Map<string, SkillAssessment>();
  for (const a of childAssessments) {
    const key = `${a.domain}::${a.skill}`;
    const existing = latestBySkill.get(key);
    if (!existing || a.assessed_date > existing.assessed_date) {
      latestBySkill.set(key, a);
    }
  }

  const byDomain: Record<string, { assessed: number; total: number; avg_level: number | null; competent_count: number }> = {};
  let totalAssessed = 0;
  let totalCompetent = 0;

  for (const domainDef of SKILL_DOMAINS) {
    let assessed = 0;
    let levelSum = 0;
    let competentCount = 0;

    for (const skill of domainDef.skills) {
      const key = `${domainDef.domain}::${skill}`;
      const a = latestBySkill.get(key);
      if (a && a.competency_level !== "not_assessed") {
        assessed++;
        const levelIndex = COMPETENCY_LEVELS.indexOf(a.competency_level);
        levelSum += levelIndex >= 0 ? levelIndex : 0;
        if (COMPETENT_OR_INDEPENDENT.has(a.competency_level)) {
          competentCount++;
        }
      }
    }

    byDomain[domainDef.domain] = {
      assessed,
      total: domainDef.skills.length,
      avg_level: assessed > 0 ? Math.round((levelSum / assessed) * 100) / 100 : null,
      competent_count: competentCount,
    };

    totalAssessed += assessed;
    totalCompetent += competentCount;
  }

  const overallReadiness =
    TOTAL_SKILLS > 0
      ? Math.round((totalCompetent / TOTAL_SKILLS) * 1000) / 10
      : null;

  // Strongest / weakest domain (by avg_level, only considering domains with assessments)
  let strongestDomain: string | null = null;
  let weakestDomain: string | null = null;
  let highestAvg = -1;
  let lowestAvg = Infinity;

  for (const [domain, stats] of Object.entries(byDomain)) {
    if (stats.assessed > 0 && stats.avg_level !== null) {
      if (stats.avg_level > highestAvg) {
        highestAvg = stats.avg_level;
        strongestDomain = domain;
      }
      if (stats.avg_level < lowestAvg) {
        lowestAvg = stats.avg_level;
        weakestDomain = domain;
      }
    }
  }

  return {
    total_skills_assessed: totalAssessed,
    total_skills: TOTAL_SKILLS,
    by_domain: byDomain,
    overall_readiness: overallReadiness,
    strongest_domain: strongestDomain,
    weakest_domain: weakestDomain,
    not_assessed_count: TOTAL_SKILLS - totalAssessed,
  };
}

/**
 * Compute an overview of readiness across all children in a home.
 */
export function computeHomeReadinessOverview(
  assessments: SkillAssessment[],
  pathwayPlans: PathwayPlan[],
): {
  total_children: number;
  avg_readiness: number | null;
  children_with_pathway_plans: number;
  pathway_plans_active: number;
  by_domain_avg: Record<string, number>;
  children_needing_attention: { child_id: string; child_name: string; readiness: number | null }[];
} {
  // Unique children from assessments
  const childMap = new Map<string, string>();
  for (const a of assessments) {
    if (!childMap.has(a.child_id)) {
      childMap.set(a.child_id, a.child_name);
    }
  }
  // Also include children from pathway plans who may not have assessments yet
  for (const p of pathwayPlans) {
    if (!childMap.has(p.child_id)) {
      childMap.set(p.child_id, p.child_name);
    }
  }

  const childIds = [...childMap.keys()];
  const totalChildren = childIds.length;

  // Per-child readiness
  const childReadiness: { child_id: string; child_name: string; readiness: number | null }[] = [];
  const domainSums: Record<string, number> = {};
  const domainCounts: Record<string, number> = {};

  for (const childId of childIds) {
    const r = computeChildReadiness(assessments, childId);
    const name = childMap.get(childId) ?? "";
    childReadiness.push({ child_id: childId, child_name: name, readiness: r.overall_readiness });

    for (const [domain, stats] of Object.entries(r.by_domain)) {
      if (stats.assessed > 0 && stats.avg_level !== null) {
        domainSums[domain] = (domainSums[domain] ?? 0) + stats.avg_level;
        domainCounts[domain] = (domainCounts[domain] ?? 0) + 1;
      }
    }
  }

  const avgReadiness =
    totalChildren > 0
      ? Math.round((childReadiness.reduce((s, c) => s + (c.readiness ?? 0), 0) / totalChildren) * 10) / 10
      : null;

  // Pathway plan stats
  const childrenWithPlans = new Set(pathwayPlans.map((p) => p.child_id)).size;
  const activePlans = pathwayPlans.filter((p) => p.status === "active").length;

  // Domain averages
  const byDomainAvg: Record<string, number> = {};
  for (const domain of SKILL_DOMAINS.map((d) => d.domain)) {
    const count = domainCounts[domain] ?? 0;
    byDomainAvg[domain] = count > 0 ? Math.round(((domainSums[domain] ?? 0) / count) * 100) / 100 : 0;
  }

  // Children needing attention (readiness below 30%)
  const needingAttention = childReadiness
    .filter((c) => (c.readiness ?? 0) < 30)
    .sort((a, b) => (a.readiness ?? 0) - (b.readiness ?? 0));

  return {
    total_children: totalChildren,
    avg_readiness: avgReadiness,
    children_with_pathway_plans: childrenWithPlans,
    pathway_plans_active: activePlans,
    by_domain_avg: byDomainAvg,
    children_needing_attention: needingAttention,
  };
}

/**
 * Identify life-skills alerts requiring attention.
 */
export function identifyLifeSkillsAlerts(
  assessments: SkillAssessment[],
  pathwayPlans: PathwayPlan[],
): { type: string; severity: "high" | "medium" | "low"; message: string; child_name?: string }[] {
  const alerts: { type: string; severity: "high" | "medium" | "low"; message: string; child_name?: string }[] = [];
  const now = new Date();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

  // Collect all unique children from pathway plans
  const planChildIds = new Set(pathwayPlans.map((p) => p.child_id));
  const planChildNames = new Map<string, string>();
  for (const p of pathwayPlans) {
    planChildNames.set(p.child_id, p.child_name);
  }

  // Collect all unique children from assessments
  const assessedChildIds = new Set(assessments.map((a) => a.child_id));
  const assessedChildNames = new Map<string, string>();
  for (const a of assessments) {
    assessedChildNames.set(a.child_id, a.child_name);
  }

  // All unique children
  const allChildIds = new Set([...planChildIds, ...assessedChildIds]);
  const allChildNames = new Map<string, string>();
  for (const id of allChildIds) {
    allChildNames.set(id, planChildNames.get(id) ?? assessedChildNames.get(id) ?? "Unknown");
  }

  // ── no_pathway_plan: child in pathway plans array with status not_required excluded,
  // but actually the alert is for children who are 16+ but have NO pathway plan at all.
  // Since we don't have age data, we check: children who appear in pathway plans
  // (indicating they are 16+) should have an active/in_progress plan.
  // Actually, re-reading the spec: "child 16+ with no pathway plan — check based on
  // pathway plans array". So we look for children in the plans with status "not_started".
  for (const p of pathwayPlans) {
    if (p.status === "not_started") {
      alerts.push({
        type: "no_pathway_plan",
        severity: "high",
        message: `${p.child_name} is 16+ but their pathway plan has not been started — Reg 14 requires active pathway planning`,
        child_name: p.child_name,
      });
    }
  }

  // ── Per-child alerts ──────────────────────────────────────────────────
  for (const childId of allChildIds) {
    const childName = allChildNames.get(childId) ?? "Unknown";
    const childAssessments = assessments.filter((a) => a.child_id === childId);

    // low_readiness: overall readiness below 30%
    if (childAssessments.length > 0) {
      const readiness = computeChildReadiness(assessments, childId);
      if ((readiness.overall_readiness ?? 0) < 30) {
        alerts.push({
          type: "low_readiness",
          severity: "medium",
          message: `${childName} has overall life-skills readiness of ${readiness.overall_readiness}% — below 30% threshold`,
          child_name: childName,
        });
      }

      // domain_concern: any domain with 0 skills at competent/independent
      for (const [domain, stats] of Object.entries(readiness.by_domain)) {
        if (stats.assessed > 0 && stats.competent_count === 0) {
          const domainLabel = SKILL_DOMAINS.find((d) => d.domain === domain)?.label ?? domain;
          alerts.push({
            type: "domain_concern",
            severity: "medium",
            message: `${childName} has no competent/independent skills in ${domainLabel} (${stats.assessed} assessed)`,
            child_name: childName,
          });
        }
      }

      // stale_assessment: most recent assessment older than 90 days
      const latestDate = childAssessments
        .map((a) => new Date(a.assessed_date).getTime())
        .reduce((max, d) => Math.max(max, d), 0);
      if (latestDate > 0 && now.getTime() - latestDate > ninetyDaysMs) {
        alerts.push({
          type: "stale_assessment",
          severity: "low",
          message: `${childName}'s most recent skill assessment is over 90 days old — reassessment recommended`,
          child_name: childName,
        });
      }
    }

    // no_assessments: child in pathway plan but no assessments at all
    if (planChildIds.has(childId) && childAssessments.length === 0) {
      alerts.push({
        type: "no_assessments",
        severity: "medium",
        message: `${childName} has a pathway plan but no skill assessments recorded`,
        child_name: childName,
      });
    }
  }

  return alerts;
}

// ── CRUD — Skill Assessments ───────────────────────────────────────────────

export async function listSkillAssessments(
  homeId: string,
  filters?: {
    childId?: string;
    domain?: string;
    limit?: number;
  },
): Promise<ServiceResult<SkillAssessment[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_skill_assessments") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.domain) q = q.eq("domain", filters.domain);
  q = q.order("assessed_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createSkillAssessment(
  input: Omit<SkillAssessment, "id" | "created_at">,
): Promise<ServiceResult<SkillAssessment>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_skill_assessments") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      child_name: input.child_name,
      domain: input.domain,
      skill: input.skill,
      competency_level: input.competency_level,
      assessed_date: input.assessed_date,
      assessed_by: input.assessed_by,
      notes: input.notes ?? null,
      evidence: input.evidence ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Pathway Plans ───────────────────────────────────────────────────

export async function listPathwayPlans(
  homeId: string,
  filters?: {
    childId?: string;
    status?: string;
    limit?: number;
  },
): Promise<ServiceResult<PathwayPlan[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_pathway_plans") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createPathwayPlan(
  input: Omit<PathwayPlan, "id" | "created_at" | "updated_at">,
): Promise<ServiceResult<PathwayPlan>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_pathway_plans") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      child_name: input.child_name,
      status: input.status,
      start_date: input.start_date,
      target_move_date: input.target_move_date ?? null,
      accommodation_plan: input.accommodation_plan ?? null,
      education_employment_plan: input.education_employment_plan ?? null,
      support_network: input.support_network ?? null,
      personal_adviser_name: input.personal_adviser_name ?? null,
      last_reviewed: input.last_reviewed ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updatePathwayPlan(
  id: string,
  updates: Partial<PathwayPlan>,
): Promise<ServiceResult<PathwayPlan>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_pathway_plans") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ─────────────────────────────────────────────────────────

export const _testing = {
  computeChildReadiness,
  computeHomeReadinessOverview,
  identifyLifeSkillsAlerts,
};
