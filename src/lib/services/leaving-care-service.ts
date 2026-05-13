// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — LEAVING CARE / PATHWAY PLANNING SERVICE
// Manages transition planning for young people aged 16+ leaving residential
// care. Covers pathway plans, independence skills assessments, and leaving
// care entitlements (CHR 2015 Reg 14 duty of care leaving, Children (Leaving
// Care) Act 2000, Reg 36 case records, SCCIF Experiences & Progress).
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

export interface SocialNetworkContact {
  name: string;
  relationship: string;
  contact: string;
}

export interface LifeSkillItem {
  skill_area: string;
  current_level: number; // 1-5
  target_level: number;  // 1-5
  notes: string;
  support_needed: string;
}

export interface PathwayPlan {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  plan_type: string;
  status: string;
  start_date: string;
  target_leaving_date?: string | null;
  accommodation_plan?: string | null;
  accommodation_type?: string | null;
  education_training_plan?: string | null;
  education_status?: string | null;
  employment_plan?: string | null;
  financial_plan?: string | null;
  benefit_entitlements?: string[] | null;
  health_plan?: string | null;
  registered_gp?: boolean | null;
  registered_dentist?: boolean | null;
  emotional_support_plan?: string | null;
  social_network?: SocialNetworkContact[] | null;
  life_skills_assessment?: LifeSkillItem[] | null;
  personal_advisor_name?: string | null;
  personal_advisor_contact?: string | null;
  reviewed_by?: string | null;
  review_date?: string | null;
  next_review_date?: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface IndependenceAssessment {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  assessment_date: string;
  assessed_by: string;
  skills: LifeSkillItem[];
  overall_readiness_score: number;
  areas_of_strength: string[];
  areas_needing_development: string[];
  recommended_actions: string[];
  next_assessment_date?: string | null;
  created_at: string;
}

export interface LeavingCareEntitlement {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  entitlement_type: string;
  description: string;
  amount: number;
  frequency: string;
  start_date: string;
  end_date?: string | null;
  status: string;
  claimed_date?: string | null;
  claimed_amount?: number | null;
  recorded_by?: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

export const ACCOMMODATION_TYPES: { type: string; label: string }[] = [
  { type: "semi_independent", label: "Semi-Independent Living" },
  { type: "supported_lodgings", label: "Supported Lodgings" },
  { type: "staying_put", label: "Staying Put" },
  { type: "university_halls", label: "University Halls" },
  { type: "shared_house", label: "Shared House" },
  { type: "own_tenancy", label: "Own Tenancy" },
  { type: "family_return", label: "Return to Family" },
  { type: "foyer", label: "Foyer" },
  { type: "other", label: "Other" },
];

export const EDUCATION_STATUS_OPTIONS: { status: string; label: string }[] = [
  { status: "full_time_education", label: "Full-Time Education" },
  { status: "part_time_education", label: "Part-Time Education" },
  { status: "apprenticeship", label: "Apprenticeship" },
  { status: "training", label: "Training" },
  { status: "employment", label: "Employment" },
  { status: "neet", label: "NEET" },
  { status: "gap_year", label: "Gap Year" },
  { status: "university", label: "University" },
];

export const INDEPENDENCE_SKILL_AREAS: { area: string; label: string }[] = [
  { area: "budgeting", label: "Budgeting & Money Management" },
  { area: "cooking", label: "Cooking & Meal Preparation" },
  { area: "cleaning", label: "Cleaning & Home Maintenance" },
  { area: "laundry", label: "Laundry & Clothing Care" },
  { area: "shopping", label: "Shopping & Consumer Skills" },
  { area: "travel", label: "Travel & Transport" },
  { area: "health_management", label: "Health Management" },
  { area: "personal_hygiene", label: "Personal Hygiene" },
  { area: "communication", label: "Communication Skills" },
  { area: "problem_solving", label: "Problem Solving" },
  { area: "time_management", label: "Time Management" },
  { area: "digital_skills", label: "Digital Skills" },
  { area: "tenancy_management", label: "Tenancy Management" },
  { area: "job_searching", label: "Job Searching & Applications" },
];

export const ENTITLEMENT_TYPES: { type: string; label: string }[] = [
  { type: "setting_up_home_allowance", label: "Setting Up Home Allowance" },
  { type: "clothing_allowance", label: "Clothing Allowance" },
  { type: "birthday_allowance", label: "Birthday Allowance" },
  { type: "festival_allowance", label: "Festival Allowance" },
  { type: "education_bursary", label: "Education Bursary" },
  { type: "travel_costs", label: "Travel Costs" },
  { type: "contact_costs", label: "Contact Costs" },
  { type: "council_tax_exemption", label: "Council Tax Exemption" },
  { type: "higher_education_bursary", label: "Higher Education Bursary" },
  { type: "staying_put_support", label: "Staying Put Support" },
];

export const PATHWAY_PLAN_STATUS: string[] = [
  "draft",
  "active",
  "under_review",
  "completed",
  "archived",
];

export const PATHWAY_PLAN_TYPES: string[] = [
  "initial",
  "review",
  "final",
];

export const ENTITLEMENT_STATUS: string[] = [
  "active",
  "pending",
  "expired",
  "claimed",
];

export const ENTITLEMENT_FREQUENCY: string[] = [
  "one_off",
  "weekly",
  "monthly",
  "annual",
];

// ── Pure functions (no DB) ──────────────────────────────────────────────────

/**
 * Compute leaving-care metrics across pathway plans, assessments, and
 * entitlements for a home. Used on dashboards and for regulatory reporting.
 */
export function computeLeavingCareMetrics(
  pathwayPlans: PathwayPlan[],
  assessments: IndependenceAssessment[],
  entitlements: LeavingCareEntitlement[],
  totalEligibleYP: number,
): {
  total_pathway_plans: number;
  active_plans: number;
  draft_plans: number;
  completed_plans: number;
  plan_coverage_pct: number;
  avg_readiness_score: number;
  readiness_above_70_count: number;
  readiness_below_40_count: number;
  total_entitlements: number;
  active_entitlements: number;
  claimed_entitlements: number;
  entitlement_take_up_pct: number;
  total_claimed_amount: number;
  yp_with_gp: number;
  yp_with_dentist: number;
  plans_with_personal_advisor: number;
  avg_plan_version: number;
} {
  const activePlans = pathwayPlans.filter((p) => p.status === "active");
  const draftPlans = pathwayPlans.filter((p) => p.status === "draft");
  const completedPlans = pathwayPlans.filter((p) => p.status === "completed");

  // Plan coverage: unique children with at least one active or completed plan
  const coveredChildren = new Set(
    pathwayPlans
      .filter((p) => p.status === "active" || p.status === "completed")
      .map((p) => p.child_id),
  );
  const planCoveragePct =
    totalEligibleYP > 0
      ? Math.round((coveredChildren.size / totalEligibleYP) * 1000) / 10
      : 0;

  // Readiness scores from latest assessment per child
  const latestAssessmentByChild = new Map<string, IndependenceAssessment>();
  for (const a of assessments) {
    const existing = latestAssessmentByChild.get(a.child_id);
    if (!existing || a.assessment_date > existing.assessment_date) {
      latestAssessmentByChild.set(a.child_id, a);
    }
  }

  const readinessScores = [...latestAssessmentByChild.values()].map(
    (a) => a.overall_readiness_score,
  );
  const avgReadiness =
    readinessScores.length > 0
      ? Math.round(
          (readinessScores.reduce((sum, s) => sum + s, 0) / readinessScores.length) * 10,
        ) / 10
      : 0;
  const above70 = readinessScores.filter((s) => s >= 70).length;
  const below40 = readinessScores.filter((s) => s < 40).length;

  // Entitlement take-up
  const activeEntitlements = entitlements.filter((e) => e.status === "active");
  const claimedEntitlements = entitlements.filter((e) => e.status === "claimed");
  const entitlementTakeUpPct =
    entitlements.length > 0
      ? Math.round(
          (claimedEntitlements.length / entitlements.length) * 1000,
        ) / 10
      : 0;
  const totalClaimedAmount = claimedEntitlements.reduce(
    (sum, e) => sum + (e.claimed_amount ?? e.amount),
    0,
  );

  // Health registration from latest active plan per child
  let ypWithGp = 0;
  let ypWithDentist = 0;
  let plansWithPA = 0;
  const latestPlanByChild = new Map<string, PathwayPlan>();
  for (const p of pathwayPlans) {
    if (p.status !== "active") continue;
    const existing = latestPlanByChild.get(p.child_id);
    if (!existing || p.updated_at > existing.updated_at) {
      latestPlanByChild.set(p.child_id, p);
    }
  }
  for (const p of latestPlanByChild.values()) {
    if (p.registered_gp) ypWithGp++;
    if (p.registered_dentist) ypWithDentist++;
    if (p.personal_advisor_name) plansWithPA++;
  }

  // Average plan version
  const avgVersion =
    pathwayPlans.length > 0
      ? Math.round(
          (pathwayPlans.reduce((sum, p) => sum + p.version, 0) / pathwayPlans.length) * 10,
        ) / 10
      : 0;

  return {
    total_pathway_plans: pathwayPlans.length,
    active_plans: activePlans.length,
    draft_plans: draftPlans.length,
    completed_plans: completedPlans.length,
    plan_coverage_pct: planCoveragePct,
    avg_readiness_score: avgReadiness,
    readiness_above_70_count: above70,
    readiness_below_40_count: below40,
    total_entitlements: entitlements.length,
    active_entitlements: activeEntitlements.length,
    claimed_entitlements: claimedEntitlements.length,
    entitlement_take_up_pct: entitlementTakeUpPct,
    total_claimed_amount: totalClaimedAmount,
    yp_with_gp: ypWithGp,
    yp_with_dentist: ypWithDentist,
    plans_with_personal_advisor: plansWithPA,
    avg_plan_version: avgVersion,
  };
}

/**
 * Identify alerts for leaving-care planning that require staff attention.
 * Returns a prioritised list of actionable alerts.
 */
export function identifyLeavingCareAlerts(
  pathwayPlans: PathwayPlan[],
  assessments: IndependenceAssessment[],
  entitlements: LeavingCareEntitlement[],
): {
  type: string;
  severity: "high" | "medium" | "low";
  message: string;
  child_name?: string;
  regulation_ref?: string;
}[] {
  const alerts: {
    type: string;
    severity: "high" | "medium" | "low";
    message: string;
    child_name?: string;
    regulation_ref?: string;
  }[] = [];
  const now = new Date();
  const sixMonthsMs = 182 * 24 * 60 * 60 * 1000;
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  // ── Overdue pathway plan reviews ──────────────────────────────────────
  for (const p of pathwayPlans) {
    if (p.status !== "active" && p.status !== "under_review") continue;

    if (p.next_review_date) {
      const reviewDue = new Date(p.next_review_date);
      if (now > reviewDue) {
        const daysOverdue = Math.floor(
          (now.getTime() - reviewDue.getTime()) / (24 * 60 * 60 * 1000),
        );
        alerts.push({
          type: "overdue_pathway_review",
          severity: daysOverdue > 30 ? "high" : "medium",
          message: `${p.child_name}'s pathway plan review is ${daysOverdue} days overdue — Children (Leaving Care) Act 2000 requires regular reviews`,
          child_name: p.child_name,
          regulation_ref: "Children (Leaving Care) Act 2000",
        });
      }
    }

    // Plans active for 6+ months with no review date
    if (!p.review_date && !p.next_review_date) {
      const startDate = new Date(p.start_date);
      if (now.getTime() - startDate.getTime() > sixMonthsMs) {
        alerts.push({
          type: "no_review_scheduled",
          severity: "high",
          message: `${p.child_name}'s pathway plan has been active for over 6 months with no review recorded or scheduled`,
          child_name: p.child_name,
          regulation_ref: "Reg 14",
        });
      }
    }

    // No personal advisor assigned
    if (!p.personal_advisor_name) {
      alerts.push({
        type: "no_personal_advisor",
        severity: "high",
        message: `${p.child_name} has no personal advisor assigned — required under Children (Leaving Care) Act 2000`,
        child_name: p.child_name,
        regulation_ref: "Children (Leaving Care) Act 2000",
      });
    }

    // Not registered with GP
    if (p.registered_gp === false) {
      alerts.push({
        type: "no_gp_registration",
        severity: "medium",
        message: `${p.child_name} is not registered with a GP — health plan should address this`,
        child_name: p.child_name,
        regulation_ref: "Reg 14",
      });
    }

    // Not registered with dentist
    if (p.registered_dentist === false) {
      alerts.push({
        type: "no_dentist_registration",
        severity: "low",
        message: `${p.child_name} is not registered with a dentist`,
        child_name: p.child_name,
        regulation_ref: "Reg 14",
      });
    }

    // Target leaving date approaching (within 30 days) but plan still draft
    if (p.target_leaving_date && p.status === "active") {
      const targetDate = new Date(p.target_leaving_date);
      const daysUntilLeaving = Math.floor(
        (targetDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
      );
      if (daysUntilLeaving >= 0 && daysUntilLeaving <= 30) {
        alerts.push({
          type: "leaving_date_approaching",
          severity: "high",
          message: `${p.child_name}'s target leaving date is in ${daysUntilLeaving} days — ensure all transition arrangements are finalised`,
          child_name: p.child_name,
          regulation_ref: "Reg 14",
        });
      }
    }
  }

  // ── Draft plans that have been sitting for too long ────────────────────
  for (const p of pathwayPlans) {
    if (p.status !== "draft") continue;
    const createdAt = new Date(p.created_at);
    if (now.getTime() - createdAt.getTime() > thirtyDaysMs) {
      alerts.push({
        type: "stale_draft_plan",
        severity: "medium",
        message: `${p.child_name}'s pathway plan has been in draft for over 30 days — should be progressed to active`,
        child_name: p.child_name,
        regulation_ref: "Reg 14",
      });
    }
  }

  // ── Low readiness scores ──────────────────────────────────────────────
  const latestAssessmentByChild = new Map<string, IndependenceAssessment>();
  for (const a of assessments) {
    const existing = latestAssessmentByChild.get(a.child_id);
    if (!existing || a.assessment_date > existing.assessment_date) {
      latestAssessmentByChild.set(a.child_id, a);
    }
  }

  for (const a of latestAssessmentByChild.values()) {
    if (a.overall_readiness_score < 40) {
      alerts.push({
        type: "low_readiness_score",
        severity: a.overall_readiness_score < 20 ? "high" : "medium",
        message: `${a.child_name}'s independence readiness score is ${a.overall_readiness_score}% — intensive support recommended`,
        child_name: a.child_name,
        regulation_ref: "SCCIF Experiences & Progress",
      });
    }

    // Overdue reassessment
    if (a.next_assessment_date) {
      const nextDate = new Date(a.next_assessment_date);
      if (now > nextDate) {
        const daysOverdue = Math.floor(
          (now.getTime() - nextDate.getTime()) / (24 * 60 * 60 * 1000),
        );
        alerts.push({
          type: "overdue_independence_assessment",
          severity: daysOverdue > 60 ? "high" : "medium",
          message: `${a.child_name}'s independence assessment is ${daysOverdue} days overdue for reassessment`,
          child_name: a.child_name,
          regulation_ref: "Reg 14",
        });
      }
    }

    // Skills with large gap between current and target level
    const criticalSkillGaps = a.skills.filter(
      (s) => s.target_level - s.current_level >= 3,
    );
    if (criticalSkillGaps.length >= 3) {
      const areas = criticalSkillGaps
        .map((s) => {
          const label = INDEPENDENCE_SKILL_AREAS.find((isa) => isa.area === s.skill_area)?.label ?? s.skill_area;
          return label;
        })
        .join(", ");
      alerts.push({
        type: "significant_skill_gaps",
        severity: "medium",
        message: `${a.child_name} has significant gaps (3+ levels) in ${criticalSkillGaps.length} skill areas: ${areas}`,
        child_name: a.child_name,
        regulation_ref: "SCCIF Experiences & Progress",
      });
    }
  }

  // ── Unclaimed entitlements ────────────────────────────────────────────
  const activeUnclaimed = entitlements.filter(
    (e) => e.status === "active" && !e.claimed_date,
  );

  // Group by child
  const unclaimedByChild = new Map<string, LeavingCareEntitlement[]>();
  for (const e of activeUnclaimed) {
    const list = unclaimedByChild.get(e.child_id) ?? [];
    list.push(e);
    unclaimedByChild.set(e.child_id, list);
  }

  for (const [, childEntitlements] of unclaimedByChild) {
    if (childEntitlements.length >= 2) {
      const childName = childEntitlements[0].child_name;
      const types = childEntitlements
        .map((e) => {
          const label = ENTITLEMENT_TYPES.find((t) => t.type === e.entitlement_type)?.label ?? e.entitlement_type;
          return label;
        })
        .join(", ");
      alerts.push({
        type: "unclaimed_entitlements",
        severity: "medium",
        message: `${childName} has ${childEntitlements.length} unclaimed entitlements: ${types}`,
        child_name: childName,
        regulation_ref: "Children (Leaving Care) Act 2000",
      });
    }
  }

  // Expired entitlements that were never claimed
  const expiredUnclaimed = entitlements.filter(
    (e) => e.status === "expired" && !e.claimed_date,
  );
  for (const e of expiredUnclaimed) {
    const typeLabel = ENTITLEMENT_TYPES.find((t) => t.type === e.entitlement_type)?.label ?? e.entitlement_type;
    alerts.push({
      type: "expired_unclaimed_entitlement",
      severity: "low",
      message: `${e.child_name}'s ${typeLabel} entitlement expired without being claimed`,
      child_name: e.child_name,
      regulation_ref: "Children (Leaving Care) Act 2000",
    });
  }

  return alerts;
}

// ── CRUD — Pathway Plans ────────────────────────────────────────────────────

export async function listPathwayPlans(
  homeId: string,
  filters?: {
    childId?: string;
    status?: string;
    planType?: string;
    limit?: number;
  },
): Promise<ServiceResult<PathwayPlan[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_pathway_plans") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.planType) q = q.eq("plan_type", filters.planType);
  q = q.order("updated_at", { ascending: false }).limit(filters?.limit ?? 100);

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
      plan_type: input.plan_type,
      status: input.status,
      start_date: input.start_date,
      target_leaving_date: input.target_leaving_date ?? null,
      accommodation_plan: input.accommodation_plan ?? null,
      accommodation_type: input.accommodation_type ?? null,
      education_training_plan: input.education_training_plan ?? null,
      education_status: input.education_status ?? null,
      employment_plan: input.employment_plan ?? null,
      financial_plan: input.financial_plan ?? null,
      benefit_entitlements: input.benefit_entitlements ?? null,
      health_plan: input.health_plan ?? null,
      registered_gp: input.registered_gp ?? null,
      registered_dentist: input.registered_dentist ?? null,
      emotional_support_plan: input.emotional_support_plan ?? null,
      social_network: input.social_network ?? null,
      life_skills_assessment: input.life_skills_assessment ?? null,
      personal_advisor_name: input.personal_advisor_name ?? null,
      personal_advisor_contact: input.personal_advisor_contact ?? null,
      reviewed_by: input.reviewed_by ?? null,
      review_date: input.review_date ?? null,
      next_review_date: input.next_review_date ?? null,
      version: input.version ?? 1,
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

// ── CRUD — Independence Assessments ─────────────────────────────────────────

export async function listIndependenceAssessments(
  homeId: string,
  filters?: {
    childId?: string;
    limit?: number;
  },
): Promise<ServiceResult<IndependenceAssessment[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_independence_assessments") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  q = q.order("assessment_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createIndependenceAssessment(
  input: Omit<IndependenceAssessment, "id" | "created_at">,
): Promise<ServiceResult<IndependenceAssessment>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_independence_assessments") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      child_name: input.child_name,
      assessment_date: input.assessment_date,
      assessed_by: input.assessed_by,
      skills: input.skills,
      overall_readiness_score: input.overall_readiness_score,
      areas_of_strength: input.areas_of_strength,
      areas_needing_development: input.areas_needing_development,
      recommended_actions: input.recommended_actions,
      next_assessment_date: input.next_assessment_date ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Leaving Care Entitlements ────────────────────────────────────────

export async function listEntitlements(
  homeId: string,
  filters?: {
    childId?: string;
    status?: string;
    entitlementType?: string;
    limit?: number;
  },
): Promise<ServiceResult<LeavingCareEntitlement[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_leaving_care_entitlements") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.entitlementType) q = q.eq("entitlement_type", filters.entitlementType);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createEntitlement(
  input: Omit<LeavingCareEntitlement, "id" | "created_at" | "updated_at">,
): Promise<ServiceResult<LeavingCareEntitlement>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_leaving_care_entitlements") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      child_name: input.child_name,
      entitlement_type: input.entitlement_type,
      description: input.description,
      amount: input.amount,
      frequency: input.frequency,
      start_date: input.start_date,
      end_date: input.end_date ?? null,
      status: input.status,
      claimed_date: input.claimed_date ?? null,
      claimed_amount: input.claimed_amount ?? null,
      recorded_by: input.recorded_by ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateEntitlement(
  id: string,
  updates: Partial<LeavingCareEntitlement>,
): Promise<ServiceResult<LeavingCareEntitlement>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_leaving_care_entitlements") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ─────────────────────────────────────────────────────────

export const _testing = {
  computeLeavingCareMetrics,
  identifyLeavingCareAlerts,
};
