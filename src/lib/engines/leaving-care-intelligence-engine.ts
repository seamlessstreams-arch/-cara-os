// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — LEAVING CARE INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses pathway plan completeness, independence skills readiness,
// accommodation status, EET status, support network mapping, and
// transition timeline adherence.
//
// Regulatory: Reg 12 (Preparing children to leave care, pathway plans),
// Reg 14 (Assessment of needs), Children (Leaving Care) Act 2000,
// SCCIF — evidence of planned, positive transitions.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface PathwayPlanInput {
  id: string;
  child_id: string;
  status: string; // active, draft, review_due, overdue
  plan_date: string;
  next_review_date: string;
  accommodation_plan: string; // secured, identified, searching, not_started
  eet_plan: string; // education, employment, training, neet, undecided
  health_plan_complete: boolean;
  finance_plan_complete: boolean;
  support_network_mapped: boolean;
  independence_skills_score: number; // 0-100
  young_person_involved: boolean;
}

export interface IndependenceSkillInput {
  id: string;
  child_id: string;
  skill_area: string; // cooking, budgeting, laundry, travel, health_management, communication, job_skills
  competency_level: string; // not_started, developing, competent, independent
  last_assessed: string;
  notes: string;
}

export interface ChildRef {
  id: string;
  name: string;
  date_of_birth: string;
}

export interface StaffRef {
  id: string;
  name: string;
}

export interface LeavingCareIntelligenceInput {
  pathwayPlans: PathwayPlanInput[];
  independenceSkills: IndependenceSkillInput[];
  children: ChildRef[];
  staff: StaffRef[];
  today?: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface LeavingCareOverview {
  children_with_pathway_plan: number;
  plans_overdue_review: number;
  avg_independence_score: number;
  accommodation_secured_count: number;
  eet_confirmed_count: number;
  support_network_complete: number;
  total_eligible_children: number;
  avg_skills_competency_rate: number;
}

export interface ChildReadinessProfile {
  child_id: string;
  child_name: string;
  age: number;
  has_pathway_plan: boolean;
  plan_status: string;
  independence_score: number;
  accommodation_status: string;
  eet_status: string;
  skills_competent_count: number;
  skills_total: number;
  readiness_rating: string; // "on_track", "needs_attention", "at_risk"
}

export interface SkillAreaSummary {
  skill_area: string;
  skill_label: string;
  independent_count: number;
  competent_count: number;
  developing_count: number;
  not_started_count: number;
}

export interface LeavingCareAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface AriaLeavingCareInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface LeavingCareIntelligenceResult {
  overview: LeavingCareOverview;
  child_readiness: ChildReadinessProfile[];
  skills_summary: SkillAreaSummary[];
  alerts: LeavingCareAlert[];
  insights: AriaLeavingCareInsight[];
}

// ── Constants ───────────────────────────────────────────────────────────────

const SKILL_LABELS: Record<string, string> = {
  cooking: "Cooking",
  budgeting: "Budgeting",
  laundry: "Laundry",
  travel: "Travel",
  health_management: "Health Management",
  communication: "Communication",
  job_skills: "Job Skills",
};

const ALL_SKILL_AREAS = Object.keys(SKILL_LABELS);

// ── Helper Functions ────────────────────────────────────────────────────────

export function calculateAge(dob: string, today: string): number {
  const dobMs = new Date(dob).getTime();
  const todayMs = new Date(today).getTime();
  const diffMs = todayMs - dobMs;
  return Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
}

export function daysBetween(dateA: string, dateB: string): number {
  const msA = new Date(dateA).getTime();
  const msB = new Date(dateB).getTime();
  return Math.round(Math.abs(msB - msA) / (24 * 60 * 60 * 1000));
}

export function isDateBefore(dateA: string, dateB: string): boolean {
  return new Date(dateA).getTime() < new Date(dateB).getTime();
}

export function monthsBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// ── Core Engine ─────────────────────────────────────────────────────────────

export function computeLeavingCareIntelligence(
  input: LeavingCareIntelligenceInput
): LeavingCareIntelligenceResult {
  const today = input.today || new Date().toISOString().split("T")[0];
  const { pathwayPlans, independenceSkills, children, staff } = input;

  // ── Build child age map ─────────────────────────────────────────────────
  const childAgeMap = new Map<string, number>();
  const childNameMap = new Map<string, string>();
  for (const child of children) {
    childAgeMap.set(child.id, calculateAge(child.date_of_birth, today));
    childNameMap.set(child.id, child.name);
  }

  // ── Build plan map (latest plan per child) ──────────────────────────────
  const plansByChild = new Map<string, PathwayPlanInput>();
  for (const plan of pathwayPlans) {
    const existing = plansByChild.get(plan.child_id);
    if (!existing || isDateBefore(existing.plan_date, plan.plan_date)) {
      plansByChild.set(plan.child_id, plan);
    }
  }

  // ── Build skills by child ───────────────────────────────────────────────
  const skillsByChild = new Map<string, IndependenceSkillInput[]>();
  for (const skill of independenceSkills) {
    const list = skillsByChild.get(skill.child_id) || [];
    list.push(skill);
    skillsByChild.set(skill.child_id, list);
  }

  // ── Identify eligible children (16+) ────────────────────────────────────
  const eligibleChildren = children.filter((c) => (childAgeMap.get(c.id) ?? 0) >= 16);
  const totalEligible = eligibleChildren.length;

  // ── Compute overview ────────────────────────────────────────────────────
  const childrenWithPlan = eligibleChildren.filter((c) => plansByChild.has(c.id));
  const plansOverdueReview = pathwayPlans.filter(
    (p) => isDateBefore(p.next_review_date, today) && p.status !== "overdue"
  ).length + pathwayPlans.filter((p) => p.status === "overdue").length;

  const independenceScores = eligibleChildren
    .map((c) => plansByChild.get(c.id)?.independence_skills_score)
    .filter((s): s is number => s !== undefined);
  const avgIndependenceScore = roundTo(average(independenceScores), 1);

  const accommodationSecured = eligibleChildren.filter((c) => {
    const plan = plansByChild.get(c.id);
    return plan && plan.accommodation_plan === "secured";
  }).length;

  const eetConfirmed = eligibleChildren.filter((c) => {
    const plan = plansByChild.get(c.id);
    return plan && ["education", "employment", "training"].includes(plan.eet_plan);
  }).length;

  const supportNetworkComplete = eligibleChildren.filter((c) => {
    const plan = plansByChild.get(c.id);
    return plan && plan.support_network_mapped;
  }).length;

  // ── Skills competency rate ──────────────────────────────────────────────
  const allSkills = independenceSkills.filter((s) =>
    eligibleChildren.some((c) => c.id === s.child_id)
  );
  const competentSkills = allSkills.filter(
    (s) => s.competency_level === "competent" || s.competency_level === "independent"
  );
  const avgSkillsCompetencyRate =
    allSkills.length > 0 ? roundTo((competentSkills.length / allSkills.length) * 100, 1) : 0;

  const overview: LeavingCareOverview = {
    children_with_pathway_plan: childrenWithPlan.length,
    plans_overdue_review: plansOverdueReview,
    avg_independence_score: avgIndependenceScore,
    accommodation_secured_count: accommodationSecured,
    eet_confirmed_count: eetConfirmed,
    support_network_complete: supportNetworkComplete,
    total_eligible_children: totalEligible,
    avg_skills_competency_rate: avgSkillsCompetencyRate,
  };

  // ── Child readiness profiles ────────────────────────────────────────────
  const childReadiness: ChildReadinessProfile[] = children.map((child) => {
    const age = childAgeMap.get(child.id) ?? 0;
    const plan = plansByChild.get(child.id);
    const skills = skillsByChild.get(child.id) || [];
    const competentCount = skills.filter(
      (s) => s.competency_level === "competent" || s.competency_level === "independent"
    ).length;

    const independenceScore = plan?.independence_skills_score ?? 0;
    const accommodationStatus = plan?.accommodation_plan ?? "not_started";
    const eetStatus = plan?.eet_plan ?? "undecided";
    const planStatus = plan?.status ?? "none";
    const youngPersonInvolved = plan?.young_person_involved ?? false;

    // Readiness rating logic — check at_risk first since overdue overrides on_track
    let readinessRating: string;
    if (
      independenceScore < 40 ||
      accommodationStatus === "not_started" ||
      planStatus === "overdue"
    ) {
      readinessRating = "at_risk";
    } else if (
      independenceScore >= 60 &&
      (accommodationStatus === "secured" || accommodationStatus === "identified") &&
      youngPersonInvolved
    ) {
      readinessRating = "on_track";
    } else {
      readinessRating = "needs_attention";
    }

    return {
      child_id: child.id,
      child_name: child.name,
      age,
      has_pathway_plan: !!plan,
      plan_status: planStatus,
      independence_score: independenceScore,
      accommodation_status: accommodationStatus,
      eet_status: eetStatus,
      skills_competent_count: competentCount,
      skills_total: skills.length,
      readiness_rating: readinessRating,
    };
  });

  // ── Skills summary ──────────────────────────────────────────────────────
  const skillsSummary: SkillAreaSummary[] = ALL_SKILL_AREAS.map((area) => {
    const areaSkills = independenceSkills.filter((s) => s.skill_area === area);
    return {
      skill_area: area,
      skill_label: SKILL_LABELS[area],
      independent_count: areaSkills.filter((s) => s.competency_level === "independent").length,
      competent_count: areaSkills.filter((s) => s.competency_level === "competent").length,
      developing_count: areaSkills.filter((s) => s.competency_level === "developing").length,
      not_started_count: areaSkills.filter((s) => s.competency_level === "not_started").length,
    };
  });

  // ── Alerts ──────────────────────────────────────────────────────────────
  const alerts: LeavingCareAlert[] = [];

  // Critical: Any child aged 16+ without a pathway plan
  for (const child of eligibleChildren) {
    if (!plansByChild.has(child.id)) {
      alerts.push({
        severity: "critical",
        message: `${child.name} (age ${childAgeMap.get(child.id)}) has no pathway plan — Reg 12 requirement`,
      });
    }
  }

  // High: Pathway plan overdue for review
  for (const plan of pathwayPlans) {
    if (isDateBefore(plan.next_review_date, today) || plan.status === "overdue") {
      const childName = childNameMap.get(plan.child_id) || "Unknown child";
      alerts.push({
        severity: "high",
        message: `Pathway plan for ${childName} is overdue for review (due ${plan.next_review_date})`,
      });
    }
  }

  // High: Child aged 17+ with accommodation_plan "not_started"
  for (const child of children) {
    const age = childAgeMap.get(child.id) ?? 0;
    if (age >= 17) {
      const plan = plansByChild.get(child.id);
      if (plan && plan.accommodation_plan === "not_started") {
        alerts.push({
          severity: "high",
          message: `${child.name} (age ${age}) has no accommodation plan in place — urgent action needed`,
        });
      }
    }
  }

  // Medium: Independence skills score < 40 for any child aged 16+
  for (const child of eligibleChildren) {
    const plan = plansByChild.get(child.id);
    if (plan && plan.independence_skills_score < 40) {
      alerts.push({
        severity: "medium",
        message: `${child.name} has low independence skills score (${plan.independence_skills_score}/100)`,
      });
    }
  }

  // Medium: No support network mapped for child with active plan
  for (const plan of pathwayPlans) {
    if (plan.status === "active" && !plan.support_network_mapped) {
      const childName = childNameMap.get(plan.child_id) || "Unknown child";
      alerts.push({
        severity: "medium",
        message: `${childName} has an active pathway plan but no support network mapped`,
      });
    }
  }

  // Low: Any skill area at "not_started" for a child aged 16+
  for (const child of eligibleChildren) {
    const skills = skillsByChild.get(child.id) || [];
    const notStartedSkills = skills.filter((s) => s.competency_level === "not_started");
    for (const skill of notStartedSkills) {
      alerts.push({
        severity: "low",
        message: `${child.name} has not started ${SKILL_LABELS[skill.skill_area] || skill.skill_area} skills development`,
      });
    }
  }

  // ── Insights ────────────────────────────────────────────────────────────
  const insights: AriaLeavingCareInsight[] = [];

  // Critical: Child(ren) approaching 18 (within 6 months) without secured accommodation
  const approachingEighteen = children.filter((c) => {
    const age = childAgeMap.get(c.id) ?? 0;
    if (age < 17) return false;
    // Calculate months until 18th birthday
    const dob = new Date(c.date_of_birth);
    const eighteenthBirthday = new Date(dob.getFullYear() + 18, dob.getMonth(), dob.getDate());
    const todayDate = new Date(today);
    const monthsUntil18 =
      (eighteenthBirthday.getFullYear() - todayDate.getFullYear()) * 12 +
      (eighteenthBirthday.getMonth() - todayDate.getMonth());
    return monthsUntil18 <= 6 && monthsUntil18 >= 0;
  });
  const approachingWithoutAccom = approachingEighteen.filter((c) => {
    const plan = plansByChild.get(c.id);
    return !plan || plan.accommodation_plan !== "secured";
  });
  if (approachingWithoutAccom.length > 0) {
    const names = approachingWithoutAccom.map((c) => c.name).join(", ");
    insights.push({
      severity: "critical",
      text: `${approachingWithoutAccom.length === 1 ? names + " is" : names + " are"} approaching 18 within 6 months without secured accommodation — immediate planning required`,
    });
  }

  // Warning: Low average independence score (< 50) across all children
  if (avgIndependenceScore > 0 && avgIndependenceScore < 50) {
    insights.push({
      severity: "warning",
      text: `Average independence score is low (${avgIndependenceScore}/100) — consider intensifying life skills programmes`,
    });
  }

  // Warning: Multiple pathway plans overdue for review
  if (plansOverdueReview >= 2) {
    insights.push({
      severity: "warning",
      text: `${plansOverdueReview} pathway plans are overdue for review — risk of non-compliance with Reg 12`,
    });
  }

  // Positive: All eligible children have active pathway plans
  if (totalEligible > 0 && childrenWithPlan.length === totalEligible) {
    const allActive = eligibleChildren.every((c) => {
      const plan = plansByChild.get(c.id);
      return plan && (plan.status === "active" || plan.status === "review_due");
    });
    if (allActive) {
      insights.push({
        severity: "positive",
        text: "All eligible children have active pathway plans — good compliance with Reg 12",
      });
    }
  }

  // Positive: Average independence score >= 70
  if (avgIndependenceScore >= 70) {
    insights.push({
      severity: "positive",
      text: `Strong average independence score (${avgIndependenceScore}/100) — children are developing well for transition`,
    });
  }

  // Positive: All children have accommodation plans at "secured" or "identified"
  if (totalEligible > 0) {
    const allAccomPlanned = eligibleChildren.every((c) => {
      const plan = plansByChild.get(c.id);
      return plan && (plan.accommodation_plan === "secured" || plan.accommodation_plan === "identified");
    });
    if (allAccomPlanned) {
      insights.push({
        severity: "positive",
        text: "All eligible children have accommodation plans secured or identified — positive transition planning",
      });
    }
  }

  return {
    overview,
    child_readiness: childReadiness,
    skills_summary: skillsSummary,
    alerts,
    insights,
  };
}
