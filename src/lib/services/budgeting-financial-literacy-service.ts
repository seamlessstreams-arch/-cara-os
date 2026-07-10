// ==============================================================================
// CARA -- BUDGETING & FINANCIAL LITERACY SKILLS SERVICE
// Tracks financial literacy sessions, skill area coverage, competency
// progression, practical exercises, bank account setup, savings habits,
// budget creation, and pathway plan linkage for children and young people
// preparing for independence.
//
// Covers: Skill area classification (budgeting, banking, savings, bills,
// shopping, debt, benefits, payslips, tax, insurance, tenancy, emergency
// funds, financial scams, credit scores), delivery method tracking,
// competency level assessment, engagement monitoring, practical component
// verification, real-money exercises, bank account opening, savings
// initiation, budget creation, pathway plan integration, social worker
// notification, session scheduling, and progress recording.
//
// UK Regulatory Framework:
// CHR 2015 Reg 5 (preparing children for independence),
// Children (Leaving Care) Act 2000 (pathway plans),
// Children and Social Work Act 2017 (extending support to age 25),
// Pathway Planning requirements,
// SCCIF: Experiences and progress -- "Children are prepared for adulthood
// including financial management."
//
// Ofsted expects homes to demonstrate progressive financial literacy
// development, practical real-world financial experiences, evidence of
// competency building, and clear links to pathway plans for looked-after
// children approaching independence.
// ==============================================================================

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const SKILL_AREAS = [
  "Budgeting Basics",
  "Bank Account Management",
  "Savings Planning",
  "Understanding Bills",
  "Shopping & Comparison",
  "Debt Awareness",
  "Benefits & Entitlements",
  "Payslip Understanding",
  "Tax Basics",
  "Insurance Awareness",
  "Tenancy Costs",
  "Emergency Funds",
  "Online Safety — Financial Scams",
  "Credit Scores",
] as const;
export type SkillArea = (typeof SKILL_AREAS)[number];

export const DELIVERY_METHODS = [
  "1-to-1 Session",
  "Group Workshop",
  "Practical Exercise",
  "Online Module",
  "Mentoring",
  "Real-World Practice",
  "Game/Simulation",
] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

export const COMPETENCY_LEVELS = [
  "Not Yet Started",
  "Emerging",
  "Developing",
  "Competent",
  "Confident",
] as const;
export type CompetencyLevel = (typeof COMPETENCY_LEVELS)[number];

// -- Label maps ---------------------------------------------------------------

export const SKILL_AREA_LABELS: { area: SkillArea; label: string; description: string }[] = [
  { area: "Budgeting Basics", label: "Budgeting Basics", description: "Understanding income vs expenditure, creating simple budgets, tracking spending" },
  { area: "Bank Account Management", label: "Bank Account Management", description: "Opening and managing a bank account, using online banking, direct debits and standing orders" },
  { area: "Savings Planning", label: "Savings Planning", description: "Importance of saving, setting savings goals, different savings accounts, compound interest basics" },
  { area: "Understanding Bills", label: "Understanding Bills", description: "Reading utility bills, council tax, understanding payment schedules, avoiding arrears" },
  { area: "Shopping & Comparison", label: "Shopping & Comparison", description: "Price comparison, budgeting for groceries, avoiding impulse purchases, loyalty schemes" },
  { area: "Debt Awareness", label: "Debt Awareness", description: "Understanding good vs bad debt, credit cards, loans, payday lenders, debt advice services" },
  { area: "Benefits & Entitlements", label: "Benefits & Entitlements", description: "Universal Credit, Housing Benefit, Council Tax Reduction, care leaver entitlements, bursaries" },
  { area: "Payslip Understanding", label: "Payslip Understanding", description: "Reading a payslip, understanding tax and NI deductions, pension contributions, gross vs net pay" },
  { area: "Tax Basics", label: "Tax Basics", description: "Personal allowance, income tax bands, National Insurance, tax codes, self-assessment basics" },
  { area: "Insurance Awareness", label: "Insurance Awareness", description: "Contents insurance, travel insurance, car insurance, understanding policy documents" },
  { area: "Tenancy Costs", label: "Tenancy Costs", description: "Rent, deposits, tenancy agreements, utility setup, council tax responsibility, landlord rights" },
  { area: "Emergency Funds", label: "Emergency Funds", description: "Building an emergency fund, understanding unexpected costs, contingency planning" },
  { area: "Online Safety — Financial Scams", label: "Online Safety: Financial Scams", description: "Recognising phishing, online fraud, identity theft, secure payments, reporting scams" },
  { area: "Credit Scores", label: "Credit Scores", description: "What credit scores are, how to build credit responsibly, checking credit reports, electoral roll" },
];

export const DELIVERY_METHOD_LABELS: { method: DeliveryMethod; label: string }[] = [
  { method: "1-to-1 Session", label: "1-to-1 Session" },
  { method: "Group Workshop", label: "Group Workshop" },
  { method: "Practical Exercise", label: "Practical Exercise" },
  { method: "Online Module", label: "Online Module" },
  { method: "Mentoring", label: "Mentoring" },
  { method: "Real-World Practice", label: "Real-World Practice" },
  { method: "Game/Simulation", label: "Game / Simulation" },
];

export const COMPETENCY_LEVEL_LABELS: { level: CompetencyLevel; label: string; description: string }[] = [
  { level: "Not Yet Started", label: "Not Yet Started", description: "Skill area not yet introduced" },
  { level: "Emerging", label: "Emerging", description: "Beginning to understand concepts with significant support needed" },
  { level: "Developing", label: "Developing", description: "Growing understanding with some support still needed" },
  { level: "Competent", label: "Competent", description: "Can apply skill independently in structured contexts" },
  { level: "Confident", label: "Confident", description: "Can apply skill independently in real-world situations with minimal guidance" },
];

// -- Row type -----------------------------------------------------------------

export interface BudgetingFinancialLiteracyRow {
  id: string;
  home_id: string;
  child_name: string;
  session_date: string;
  facilitator_name: string;
  skill_area: SkillArea;
  delivery_method: DeliveryMethod;
  competency_level: CompetencyLevel;
  young_person_engaged: boolean;
  practical_component: boolean;
  real_money_used: boolean;
  bank_account_opened: boolean;
  savings_started: boolean;
  budget_created: boolean;
  pathway_plan_linked: boolean;
  social_worker_informed: boolean;
  next_session_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateBudgetingFinancialLiteracy(input: {
  childName?: string;
  sessionDate?: string;
  facilitatorName?: string;
  skillArea?: string;
  deliveryMethod?: string;
  competencyLevel?: string;
  nextSessionDate?: string | null;
  realMoneyUsed?: boolean;
  practicalComponent?: boolean;
  bankAccountOpened?: boolean;
  competencyLevelValue?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.childName || input.childName.trim().length === 0) {
    errors.push("Child name is required");
  }
  if (!input.sessionDate) {
    errors.push("Session date is required");
  } else {
    const dateObj = new Date(input.sessionDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Session date must be a valid date");
    } else if (dateObj > new Date()) {
      errors.push("Session date cannot be in the future");
    }
  }
  if (!input.facilitatorName || input.facilitatorName.trim().length === 0) {
    errors.push("Facilitator name is required");
  }
  if (!input.skillArea || !(SKILL_AREAS as readonly string[]).includes(input.skillArea)) {
    errors.push(`Skill area must be one of: ${SKILL_AREAS.join(", ")}`);
  }
  if (!input.deliveryMethod || !(DELIVERY_METHODS as readonly string[]).includes(input.deliveryMethod)) {
    errors.push(`Delivery method must be one of: ${DELIVERY_METHODS.join(", ")}`);
  }
  if (!input.competencyLevel || !(COMPETENCY_LEVELS as readonly string[]).includes(input.competencyLevel)) {
    errors.push(`Competency level must be one of: ${COMPETENCY_LEVELS.join(", ")}`);
  }

  // Business rule: next session date should not be in the past
  if (input.nextSessionDate) {
    const nextDate = new Date(input.nextSessionDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(nextDate.getTime())) {
      errors.push("Next session date must be a valid date");
    } else if (nextDate < today) {
      errors.push("Next session date should not be in the past");
    }
  }

  // Business rule: real money used implies practical component
  if (input.realMoneyUsed && !input.practicalComponent) {
    errors.push("Practical component should be true when real money is used");
  }

  // Business rule: bank account opened implies Bank Account Management skill or practical
  if (input.bankAccountOpened && input.skillArea && input.skillArea !== "Bank Account Management" && input.skillArea !== "Savings Planning") {
    errors.push("Bank account opened is typically recorded for Bank Account Management or Savings Planning skill areas");
  }

  // Business rule: Confident competency should have practical component
  if (input.competencyLevel === "Confident" && !input.practicalComponent) {
    errors.push("Confident competency level should be supported by practical component evidence");
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: BudgetingFinancialLiteracyRow[],
): {
  total_sessions: number;
  unique_children: number;
  unique_facilitators: number;
  by_skill_area: Record<string, number>;
  by_delivery_method: Record<string, number>;
  by_competency_level: Record<string, number>;
  engagement_rate: number;
  practical_rate: number;
  real_money_rate: number;
  bank_account_rate: number;
  savings_rate: number;
  budget_created_rate: number;
  pathway_plan_link_rate: number;
  social_worker_informed_rate: number;
  average_sessions_per_child: number;
  skill_coverage_per_child: Record<string, number>;
  competent_or_confident_rate: number;
  not_yet_started_count: number;
  children_with_bank_accounts: number;
  children_with_savings: number;
  children_with_budgets: number;
  skills_covered_count: number;
  most_common_skill: string;
  most_common_method: string;
} {
  const total = rows.length;

  const boolRate = (field: keyof BudgetingFinancialLiteracyRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
  };

  const uniqueChildren = new Set(rows.map((r) => r.child_name)).size;
  const uniqueFacilitators = new Set(rows.map((r) => r.facilitator_name)).size;

  // Skill area breakdown
  const bySkillArea: Record<string, number> = {};
  for (const sa of SKILL_AREAS) bySkillArea[sa] = 0;
  for (const r of rows) bySkillArea[r.skill_area] = (bySkillArea[r.skill_area] || 0) + 1;

  // Delivery method breakdown
  const byDeliveryMethod: Record<string, number> = {};
  for (const dm of DELIVERY_METHODS) byDeliveryMethod[dm] = 0;
  for (const r of rows) byDeliveryMethod[r.delivery_method] = (byDeliveryMethod[r.delivery_method] || 0) + 1;

  // Competency level breakdown
  const byCompetencyLevel: Record<string, number> = {};
  for (const cl of COMPETENCY_LEVELS) byCompetencyLevel[cl] = 0;
  for (const r of rows) byCompetencyLevel[r.competency_level] = (byCompetencyLevel[r.competency_level] || 0) + 1;

  // Average sessions per child
  const avgSessions = uniqueChildren > 0 ? Math.round((total / uniqueChildren) * 10) / 10 : 0;

  // Skill coverage per child — how many unique skill areas each child has covered
  const childSkillMap: Record<string, Set<string>> = {};
  for (const r of rows) {
    if (!childSkillMap[r.child_name]) childSkillMap[r.child_name] = new Set();
    childSkillMap[r.child_name].add(r.skill_area);
  }
  const skillCoveragePerChild: Record<string, number> = {};
  for (const [child, skills] of Object.entries(childSkillMap)) {
    skillCoveragePerChild[child] = skills.size;
  }

  // Competent or Confident rate
  const competentOrConfident = rows.filter(
    (r) => r.competency_level === "Competent" || r.competency_level === "Confident",
  ).length;
  const competentOrConfidentRate = total > 0 ? Math.round((competentOrConfident / total) * 1000) / 10 : 0;

  // Not yet started count
  const notYetStarted = rows.filter((r) => r.competency_level === "Not Yet Started").length;

  // Children with milestone achievements (unique children who have at least one record with the flag)
  const childrenWithBankAccounts = new Set(rows.filter((r) => r.bank_account_opened).map((r) => r.child_name)).size;
  const childrenWithSavings = new Set(rows.filter((r) => r.savings_started).map((r) => r.child_name)).size;
  const childrenWithBudgets = new Set(rows.filter((r) => r.budget_created).map((r) => r.child_name)).size;

  // Skills covered (how many unique skill areas have been delivered at least once)
  const skillsCoveredCount = Object.values(bySkillArea).filter((count) => count > 0).length;

  // Most common skill
  const mostCommonSkill = Object.entries(bySkillArea)
    .sort(([, a], [, b]) => b - a)
    .filter(([, count]) => count > 0)[0];
  const mostCommonSkillLabel = mostCommonSkill ? mostCommonSkill[0] : "none";

  // Most common method
  const mostCommonMethod = Object.entries(byDeliveryMethod)
    .sort(([, a], [, b]) => b - a)
    .filter(([, count]) => count > 0)[0];
  const mostCommonMethodLabel = mostCommonMethod ? mostCommonMethod[0] : "none";

  return {
    total_sessions: total,
    unique_children: uniqueChildren,
    unique_facilitators: uniqueFacilitators,
    by_skill_area: bySkillArea,
    by_delivery_method: byDeliveryMethod,
    by_competency_level: byCompetencyLevel,
    engagement_rate: boolRate("young_person_engaged"),
    practical_rate: boolRate("practical_component"),
    real_money_rate: boolRate("real_money_used"),
    bank_account_rate: boolRate("bank_account_opened"),
    savings_rate: boolRate("savings_started"),
    budget_created_rate: boolRate("budget_created"),
    pathway_plan_link_rate: boolRate("pathway_plan_linked"),
    social_worker_informed_rate: boolRate("social_worker_informed"),
    average_sessions_per_child: avgSessions,
    skill_coverage_per_child: skillCoveragePerChild,
    competent_or_confident_rate: competentOrConfidentRate,
    not_yet_started_count: notYetStarted,
    children_with_bank_accounts: childrenWithBankAccounts,
    children_with_savings: childrenWithSavings,
    children_with_budgets: childrenWithBudgets,
    skills_covered_count: skillsCoveredCount,
    most_common_skill: mostCommonSkillLabel,
    most_common_method: mostCommonMethodLabel,
  };
}

export function computeAlerts(
  rows: BudgetingFinancialLiteracyRow[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  record_id?: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    record_id?: string;
  }[] = [];

  const metrics = computeMetrics(rows);

  // High: children with no pathway plan linkage across all sessions
  const childPathwayMap: Record<string, boolean> = {};
  for (const r of rows) {
    if (!childPathwayMap[r.child_name]) childPathwayMap[r.child_name] = false;
    if (r.pathway_plan_linked) childPathwayMap[r.child_name] = true;
  }
  for (const [child, linked] of Object.entries(childPathwayMap)) {
    if (!linked) {
      alerts.push({
        type: "no_pathway_link",
        severity: "high",
        message: `${child} has financial literacy sessions but none are linked to their pathway plan — Reg 5 requires independence preparation to be integrated into pathway planning`,
      });
    }
  }

  // High: child with only 1 skill area covered in 3+ sessions (lacking breadth)
  for (const [child, skillCount] of Object.entries(metrics.skill_coverage_per_child)) {
    const childSessions = rows.filter((r) => r.child_name === child).length;
    if (childSessions >= 3 && skillCount <= 1) {
      alerts.push({
        type: "narrow_skill_coverage",
        severity: "high",
        message: `${child} has ${childSessions} sessions but only ${skillCount} skill area covered — broaden financial literacy provision to cover essential life skills per Reg 5`,
      });
    }
  }

  // High: disengaged young person across multiple sessions
  const childEngagementMap: Record<string, { total: number; engaged: number }> = {};
  for (const r of rows) {
    if (!childEngagementMap[r.child_name]) childEngagementMap[r.child_name] = { total: 0, engaged: 0 };
    childEngagementMap[r.child_name].total++;
    if (r.young_person_engaged) childEngagementMap[r.child_name].engaged++;
  }
  for (const [child, data] of Object.entries(childEngagementMap)) {
    if (data.total >= 3 && data.engaged / data.total < 0.5) {
      alerts.push({
        type: "low_engagement",
        severity: "high",
        message: `${child} has low engagement (${data.engaged}/${data.total} sessions) with financial literacy — consider alternative delivery methods or motivational approaches`,
      });
    }
  }

  // Medium: no practical component across sessions
  const childPracticalMap: Record<string, boolean> = {};
  for (const r of rows) {
    if (!childPracticalMap[r.child_name]) childPracticalMap[r.child_name] = false;
    if (r.practical_component) childPracticalMap[r.child_name] = true;
  }
  for (const [child, hasPractical] of Object.entries(childPracticalMap)) {
    const childSessions = rows.filter((r) => r.child_name === child).length;
    if (!hasPractical && childSessions >= 2) {
      alerts.push({
        type: "no_practical",
        severity: "medium",
        message: `${child} has ${childSessions} financial literacy sessions but none include practical components — practical real-world experience is essential for competency development`,
      });
    }
  }

  // Medium: child stuck at Not Yet Started or Emerging across many sessions
  const childCompetencyMap: Record<string, CompetencyLevel[]> = {};
  for (const r of rows) {
    if (!childCompetencyMap[r.child_name]) childCompetencyMap[r.child_name] = [];
    childCompetencyMap[r.child_name].push(r.competency_level);
  }
  for (const [child, levels] of Object.entries(childCompetencyMap)) {
    if (levels.length >= 4) {
      const allLow = levels.every((l) => l === "Not Yet Started" || l === "Emerging");
      if (allLow) {
        alerts.push({
          type: "stalled_progress",
          severity: "medium",
          message: `${child} has ${levels.length} sessions but competency remains at Emerging or below — review delivery approach and consider learning needs assessment`,
        });
      }
    }
  }

  // Medium: overdue next session
  for (const r of rows) {
    if (r.next_session_date) {
      const nextDate = new Date(r.next_session_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (nextDate < today) {
        alerts.push({
          type: "overdue_session",
          severity: "medium",
          message: `Financial literacy session for ${r.child_name} (${r.skill_area}) was due on ${r.next_session_date} and is now overdue — schedule promptly to maintain momentum`,
          record_id: r.id,
        });
      }
    }
  }

  // Medium: social worker not informed
  const childSWMap: Record<string, boolean> = {};
  for (const r of rows) {
    if (!childSWMap[r.child_name]) childSWMap[r.child_name] = false;
    if (r.social_worker_informed) childSWMap[r.child_name] = true;
  }
  for (const [child, informed] of Object.entries(childSWMap)) {
    const childSessions = rows.filter((r) => r.child_name === child).length;
    if (!informed && childSessions >= 2) {
      alerts.push({
        type: "sw_not_informed",
        severity: "medium",
        message: `Social worker not informed about ${child}'s financial literacy progress after ${childSessions} sessions — share progress for pathway plan integration`,
      });
    }
  }

  // Medium: no bank account for children with 5+ sessions
  const childBankMap: Record<string, boolean> = {};
  for (const r of rows) {
    if (!childBankMap[r.child_name]) childBankMap[r.child_name] = false;
    if (r.bank_account_opened) childBankMap[r.child_name] = true;
  }
  for (const [child, hasAccount] of Object.entries(childBankMap)) {
    const childSessions = rows.filter((r) => r.child_name === child).length;
    if (!hasAccount && childSessions >= 5) {
      alerts.push({
        type: "no_bank_account",
        severity: "medium",
        message: `${child} has ${childSessions} financial literacy sessions but no bank account opened — supporting children to open a bank account is a key independence milestone`,
      });
    }
  }

  return alerts;
}

export function generateCaraInsights(
  rows: BudgetingFinancialLiteracyRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  insights.push(
    `[sky] ${metrics.total_sessions} financial literacy ${metrics.total_sessions === 1 ? "session" : "sessions"} delivered to ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `Average ${metrics.average_sessions_per_child} sessions per child. ` +
      `${metrics.skills_covered_count} of ${SKILL_AREAS.length} skill areas covered. ` +
      `Engagement rate: ${metrics.engagement_rate}%. ` +
      `Practical component rate: ${metrics.practical_rate}%. ` +
      `Competent/Confident: ${metrics.competent_or_confident_rate}%.`,
  );

  // Insight 2: Progress and milestone tracking
  const highAlerts = alerts.filter((a) => a.severity === "high");
  const mediumAlerts = alerts.filter((a) => a.severity === "medium");

  if (highAlerts.length > 0 || mediumAlerts.length > 0) {
    insights.push(
      `[amber] ${highAlerts.length} high and ${mediumAlerts.length} medium priority alerts. ` +
        `${metrics.children_with_bank_accounts} ${metrics.children_with_bank_accounts === 1 ? "child has" : "children have"} opened bank accounts. ` +
        `${metrics.children_with_savings} started savings. ` +
        `${metrics.children_with_budgets} created budgets. ` +
        `Pathway plan linkage: ${metrics.pathway_plan_link_rate}%. ` +
        `Most common skill: ${metrics.most_common_skill}.`,
    );
  } else {
    insights.push(
      `[amber] No high-priority financial literacy alerts. ` +
        `${metrics.children_with_bank_accounts} ${metrics.children_with_bank_accounts === 1 ? "child has" : "children have"} bank accounts. ` +
        `${metrics.children_with_savings} started savings. ` +
        `${metrics.children_with_budgets} created budgets. ` +
        `Real money exercises: ${metrics.real_money_rate}%. ` +
        `Continue building practical financial skills per Reg 5.`,
    );
  }

  // Insight 3: Reflective safeguarding question
  if (metrics.pathway_plan_link_rate < 50 && metrics.unique_children > 0) {
    insights.push(
      `[reflect] Only ${metrics.pathway_plan_link_rate}% of sessions are linked to pathway plans. ` +
        `Is financial literacy development being systematically integrated into each ` +
        `young person's pathway plan, and are social workers receiving regular updates ` +
        `on competency progression as required by the Children (Leaving Care) Act 2000 ` +
        `and Children and Social Work Act 2017?`,
    );
  } else if (metrics.practical_rate < 40) {
    insights.push(
      `[reflect] Practical component rate is ${metrics.practical_rate}%. ` +
        `Are young people getting enough real-world financial experience — managing ` +
        `a shopping budget, paying bills, handling a bank account — rather than ` +
        `just theoretical learning? Ofsted SCCIF expects evidence that children ` +
        `are practically prepared for financial independence.`,
    );
  } else if (metrics.skills_covered_count < SKILL_AREAS.length * 0.5) {
    insights.push(
      `[reflect] Only ${metrics.skills_covered_count} of ${SKILL_AREAS.length} financial skill areas have been covered. ` +
        `Are there gaps in provision around essential areas like tenancy costs, ` +
        `benefits and entitlements, or debt awareness that young people will face ` +
        `when they transition to independence? Consider a structured curriculum ` +
        `covering all 14 skill areas over the pathway plan period.`,
    );
  } else {
    insights.push(
      `[reflect] Is each young person's financial literacy journey personalised ` +
        `to their age, understanding, and proximity to independence? Are those ` +
        `approaching 16-18 receiving intensive practical support (bank accounts, ` +
        `real budgets, tenancy preparation) while younger children build foundational ` +
        `skills through age-appropriate activities per CHR 2015 Reg 5?`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listBudgetingFinancialLiteracy(
  homeId: string,
  filters?: {
    skillArea?: SkillArea;
    deliveryMethod?: DeliveryMethod;
    competencyLevel?: CompetencyLevel;
    childName?: string;
    limit?: number;
  },
): Promise<ServiceResult<BudgetingFinancialLiteracyRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_budgeting_financial_literacy") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.skillArea) q = q.eq("skill_area", filters.skillArea);
  if (filters?.deliveryMethod) q = q.eq("delivery_method", filters.deliveryMethod);
  if (filters?.competencyLevel) q = q.eq("competency_level", filters.competencyLevel);
  if (filters?.childName) q = q.eq("child_name", filters.childName);

  q = q.order("session_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getBudgetingFinancialLiteracy(
  id: string,
): Promise<ServiceResult<BudgetingFinancialLiteracyRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_budgeting_financial_literacy") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createBudgetingFinancialLiteracy(input: {
  homeId: string;
  childName: string;
  sessionDate: string;
  facilitatorName: string;
  skillArea: SkillArea;
  deliveryMethod: DeliveryMethod;
  competencyLevel: CompetencyLevel;
  youngPersonEngaged?: boolean;
  practicalComponent?: boolean;
  realMoneyUsed?: boolean;
  bankAccountOpened?: boolean;
  savingsStarted?: boolean;
  budgetCreated?: boolean;
  pathwayPlanLinked?: boolean;
  socialWorkerInformed?: boolean;
  nextSessionDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<BudgetingFinancialLiteracyRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateBudgetingFinancialLiteracy({
    childName: input.childName,
    sessionDate: input.sessionDate,
    facilitatorName: input.facilitatorName,
    skillArea: input.skillArea,
    deliveryMethod: input.deliveryMethod,
    competencyLevel: input.competencyLevel,
    nextSessionDate: input.nextSessionDate,
    realMoneyUsed: input.realMoneyUsed,
    practicalComponent: input.practicalComponent,
    bankAccountOpened: input.bankAccountOpened,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_budgeting_financial_literacy") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      session_date: input.sessionDate,
      facilitator_name: input.facilitatorName,
      skill_area: input.skillArea,
      delivery_method: input.deliveryMethod,
      competency_level: input.competencyLevel,
      young_person_engaged: input.youngPersonEngaged ?? false,
      practical_component: input.practicalComponent ?? false,
      real_money_used: input.realMoneyUsed ?? false,
      bank_account_opened: input.bankAccountOpened ?? false,
      savings_started: input.savingsStarted ?? false,
      budget_created: input.budgetCreated ?? false,
      pathway_plan_linked: input.pathwayPlanLinked ?? false,
      social_worker_informed: input.socialWorkerInformed ?? false,
      next_session_date: input.nextSessionDate ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateBudgetingFinancialLiteracy(
  id: string,
  updates: Partial<{
    childName: string;
    sessionDate: string;
    facilitatorName: string;
    skillArea: SkillArea;
    deliveryMethod: DeliveryMethod;
    competencyLevel: CompetencyLevel;
    youngPersonEngaged: boolean;
    practicalComponent: boolean;
    realMoneyUsed: boolean;
    bankAccountOpened: boolean;
    savingsStarted: boolean;
    budgetCreated: boolean;
    pathwayPlanLinked: boolean;
    socialWorkerInformed: boolean;
    nextSessionDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<BudgetingFinancialLiteracyRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.facilitatorName !== undefined) mapped.facilitator_name = updates.facilitatorName;
  if (updates.skillArea !== undefined) mapped.skill_area = updates.skillArea;
  if (updates.deliveryMethod !== undefined) mapped.delivery_method = updates.deliveryMethod;
  if (updates.competencyLevel !== undefined) mapped.competency_level = updates.competencyLevel;
  if (updates.youngPersonEngaged !== undefined) mapped.young_person_engaged = updates.youngPersonEngaged;
  if (updates.practicalComponent !== undefined) mapped.practical_component = updates.practicalComponent;
  if (updates.realMoneyUsed !== undefined) mapped.real_money_used = updates.realMoneyUsed;
  if (updates.bankAccountOpened !== undefined) mapped.bank_account_opened = updates.bankAccountOpened;
  if (updates.savingsStarted !== undefined) mapped.savings_started = updates.savingsStarted;
  if (updates.budgetCreated !== undefined) mapped.budget_created = updates.budgetCreated;
  if (updates.pathwayPlanLinked !== undefined) mapped.pathway_plan_linked = updates.pathwayPlanLinked;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.nextSessionDate !== undefined) mapped.next_session_date = updates.nextSessionDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_budgeting_financial_literacy") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteBudgetingFinancialLiteracy(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { error } = await (client.from("cs_budgeting_financial_literacy") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}

// -- Testing exports ----------------------------------------------------------

export const _testing = {
  computeMetrics,
  computeAlerts,
  generateCaraInsights,
  validateBudgetingFinancialLiteracy,
};
