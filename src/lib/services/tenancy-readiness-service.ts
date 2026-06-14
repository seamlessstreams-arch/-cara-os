// ==============================================================================
// CARA -- TENANCY READINESS & HOUSING SKILLS SERVICE
// Tracks tenancy readiness sessions for care leavers, covering housing skill
// areas, delivery methods, competency assessments, engagement levels, practical
// components, housing applications, housing register status, deposit schemes,
// guarantee schemes, pathway plan linkage, and personal adviser involvement.
//
// Covers: Understanding tenancy agreements, paying rent and bills, property
// maintenance, neighbour relations, housing benefit applications, council tax,
// utility management, home safety (fire/gas/electric), decorating and furnishing,
// reporting repairs, anti-social behaviour awareness, shared living skills,
// emergency housing options, and homelessness prevention for young people
// preparing to leave care.
//
// UK Regulatory Framework:
// CHR 2015 Reg 5 (preparing children for independence),
// Children (Leaving Care) Act 2000 (pathway plans, personal advisers),
// Homelessness Reduction Act 2017 (prevention duty for care leavers),
// Housing Act 1996 s189 (priority need for care leavers),
// DfE statutory guidance on care leavers 2023,
// Staying Put arrangements,
// Staying Close arrangements.
//
// SCCIF: Experiences and progress — "Young people are prepared for independent
// living including housing. They develop practical skills for managing a tenancy,
// understand their rights and responsibilities as tenants, and are supported to
// access housing services. Pathway plans include clear housing goals and young
// people are involved in planning their housing future."
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const SKILL_AREAS = [
  "Understanding Tenancy Agreements",
  "Paying Rent & Bills",
  "Maintaining a Property",
  "Neighbour Relations",
  "Housing Benefit Applications",
  "Council Tax",
  "Utility Management",
  "Home Safety — Fire/Gas/Electric",
  "Decorating & Furnishing",
  "Reporting Repairs",
  "Anti-Social Behaviour Awareness",
  "Shared Living Skills",
  "Emergency Housing Options",
  "Homelessness Prevention",
] as const;
export type SkillArea = (typeof SKILL_AREAS)[number];

export const DELIVERY_METHODS = [
  "1-to-1 Session",
  "Group Workshop",
  "Practical Exercise",
  "Accompanied Visit",
  "Online Module",
  "Real-World Practice",
  "Mentoring",
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

// -- Derived enum subsets for domain logic ------------------------------------

export const FINANCIAL_SKILL_AREAS: SkillArea[] = [
  "Paying Rent & Bills",
  "Housing Benefit Applications",
  "Council Tax",
  "Utility Management",
];

export const SAFETY_SKILL_AREAS: SkillArea[] = [
  "Home Safety — Fire/Gas/Electric",
  "Anti-Social Behaviour Awareness",
  "Emergency Housing Options",
  "Homelessness Prevention",
];

export const PRACTICAL_SKILL_AREAS: SkillArea[] = [
  "Maintaining a Property",
  "Decorating & Furnishing",
  "Reporting Repairs",
  "Shared Living Skills",
];

export const COMPETENT_OR_CONFIDENT: CompetencyLevel[] = [
  "Competent",
  "Confident",
];

// -- Label maps ---------------------------------------------------------------

export const SKILL_AREA_LABELS: { area: SkillArea; label: string }[] = [
  { area: "Understanding Tenancy Agreements", label: "Understanding Tenancy Agreements" },
  { area: "Paying Rent & Bills", label: "Paying Rent & Bills" },
  { area: "Maintaining a Property", label: "Maintaining a Property" },
  { area: "Neighbour Relations", label: "Neighbour Relations" },
  { area: "Housing Benefit Applications", label: "Housing Benefit Applications" },
  { area: "Council Tax", label: "Council Tax" },
  { area: "Utility Management", label: "Utility Management" },
  { area: "Home Safety — Fire/Gas/Electric", label: "Home Safety (Fire/Gas/Electric)" },
  { area: "Decorating & Furnishing", label: "Decorating & Furnishing" },
  { area: "Reporting Repairs", label: "Reporting Repairs" },
  { area: "Anti-Social Behaviour Awareness", label: "Anti-Social Behaviour Awareness" },
  { area: "Shared Living Skills", label: "Shared Living Skills" },
  { area: "Emergency Housing Options", label: "Emergency Housing Options" },
  { area: "Homelessness Prevention", label: "Homelessness Prevention" },
];

export const DELIVERY_METHOD_LABELS: { method: DeliveryMethod; label: string }[] = [
  { method: "1-to-1 Session", label: "1-to-1 Session" },
  { method: "Group Workshop", label: "Group Workshop" },
  { method: "Practical Exercise", label: "Practical Exercise" },
  { method: "Accompanied Visit", label: "Accompanied Visit" },
  { method: "Online Module", label: "Online Module" },
  { method: "Real-World Practice", label: "Real-World Practice" },
  { method: "Mentoring", label: "Mentoring" },
];

export const COMPETENCY_LEVEL_LABELS: { level: CompetencyLevel; label: string }[] = [
  { level: "Not Yet Started", label: "Not Yet Started" },
  { level: "Emerging", label: "Emerging" },
  { level: "Developing", label: "Developing" },
  { level: "Competent", label: "Competent" },
  { level: "Confident", label: "Confident" },
];

// -- Row type -----------------------------------------------------------------

export interface TenancyReadinessRow {
  id: string;
  home_id: string;
  young_person_name: string;
  session_date: string;
  facilitator_name: string;
  skill_area: SkillArea;
  delivery_method: DeliveryMethod;
  competency_level: CompetencyLevel;
  young_person_engaged: boolean;
  practical_component: boolean;
  housing_application_started: boolean;
  housing_register_joined: boolean;
  deposit_scheme_aware: boolean;
  guarantee_scheme_explored: boolean;
  pathway_plan_linked: boolean;
  personal_adviser_involved: boolean;
  social_worker_informed: boolean;
  next_session_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateTenancyReadiness(input: {
  youngPersonName?: string;
  sessionDate?: string;
  facilitatorName?: string;
  skillArea?: string;
  deliveryMethod?: string;
  competencyLevel?: string;
  youngPersonEngaged?: boolean;
  practicalComponent?: boolean;
  housingApplicationStarted?: boolean;
  housingRegisterJoined?: boolean;
  pathwayPlanLinked?: boolean;
  personalAdviserInvolved?: boolean;
  nextSessionDate?: string | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.youngPersonName || input.youngPersonName.trim().length === 0) {
    errors.push("Young person name is required");
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

  // Business rule: young person should be engaged for competency to progress
  if (
    input.competencyLevel &&
    (COMPETENT_OR_CONFIDENT as string[]).includes(input.competencyLevel) &&
    input.youngPersonEngaged === false
  ) {
    errors.push("Competency cannot be recorded as Competent or Confident if the young person was not engaged in the session — reassess engagement level");
  }

  // Business rule: practical component should be present for real-world practice
  if (
    input.deliveryMethod === "Real-World Practice" &&
    input.practicalComponent === false
  ) {
    errors.push("Practical component must be marked as true when the delivery method is Real-World Practice");
  }

  // Business rule: practical component should be present for accompanied visits
  if (
    input.deliveryMethod === "Accompanied Visit" &&
    input.practicalComponent === false
  ) {
    errors.push("Practical component should be marked as true for accompanied visits — these involve real-world exposure to housing services");
  }

  // Business rule: housing application started should have housing register context
  if (
    input.housingApplicationStarted === true &&
    input.housingRegisterJoined === false
  ) {
    errors.push("If a housing application has been started, the young person should also be on or joining the housing register — please confirm housing register status");
  }

  // Business rule: pathway plan should be linked for housing-critical skills
  if (
    input.skillArea &&
    (input.skillArea === "Emergency Housing Options" || input.skillArea === "Homelessness Prevention") &&
    input.pathwayPlanLinked === false
  ) {
    errors.push("Pathway plan should be linked when covering emergency housing or homelessness prevention — the Children (Leaving Care) Act 2000 requires these to be part of the pathway plan");
  }

  // Business rule: personal adviser should be involved for housing applications
  if (
    input.housingApplicationStarted === true &&
    input.personalAdviserInvolved === false
  ) {
    errors.push("Personal adviser should be involved when a housing application has been started — the PA has a statutory duty to support care leavers with housing under the Children (Leaving Care) Act 2000");
  }

  // Business rule: next session date should be in the future
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

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: TenancyReadinessRow[],
): {
  total_sessions: number;
  unique_young_people: number;
  by_skill_area: Record<string, number>;
  by_delivery_method: Record<string, number>;
  by_competency_level: Record<string, number>;
  engagement_rate: number;
  practical_rate: number;
  housing_application_rate: number;
  housing_register_rate: number;
  deposit_awareness_rate: number;
  pathway_plan_rate: number;
  pa_involvement_rate: number;
  average_sessions_per_person: number;
  competent_confident_rate: number;
  guarantee_scheme_rate: number;
  social_worker_informed_rate: number;
  skill_coverage: number;
  overdue_session_count: number;
} {
  const total = rows.length;

  const boolRate = (field: keyof TenancyReadinessRow, subset?: TenancyReadinessRow[]) => {
    const pool = subset ?? rows;
    const count = pool.filter((r) => r[field] === true).length;
    return pool.length > 0 ? Math.round((count / pool.length) * 1000) / 10 : 0;
  };

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

  // Unique young people
  const uniqueYoungPeople = new Set(rows.map((r) => r.young_person_name)).size;

  // Average sessions per person
  const averageSessionsPerPerson = uniqueYoungPeople > 0
    ? Math.round((total / uniqueYoungPeople) * 10) / 10
    : 0;

  // Competent/Confident rate
  const competentConfidentCount = rows.filter(
    (r) => (COMPETENT_OR_CONFIDENT as string[]).includes(r.competency_level),
  ).length;
  const competentConfidentRate = total > 0
    ? Math.round((competentConfidentCount / total) * 1000) / 10
    : 0;

  // Skill coverage: how many of the 14 skill areas have been covered
  const coveredSkills = new Set(rows.map((r) => r.skill_area)).size;
  const skillCoverage = Math.round((coveredSkills / SKILL_AREAS.length) * 1000) / 10;

  // Overdue sessions
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueSessionCount = rows.filter((r) => {
    if (!r.next_session_date) return false;
    const nextDate = new Date(r.next_session_date);
    return nextDate < today;
  }).length;

  return {
    total_sessions: total,
    unique_young_people: uniqueYoungPeople,
    by_skill_area: bySkillArea,
    by_delivery_method: byDeliveryMethod,
    by_competency_level: byCompetencyLevel,
    engagement_rate: boolRate("young_person_engaged"),
    practical_rate: boolRate("practical_component"),
    housing_application_rate: boolRate("housing_application_started"),
    housing_register_rate: boolRate("housing_register_joined"),
    deposit_awareness_rate: boolRate("deposit_scheme_aware"),
    pathway_plan_rate: boolRate("pathway_plan_linked"),
    pa_involvement_rate: boolRate("personal_adviser_involved"),
    average_sessions_per_person: averageSessionsPerPerson,
    competent_confident_rate: competentConfidentRate,
    guarantee_scheme_rate: boolRate("guarantee_scheme_explored"),
    social_worker_informed_rate: boolRate("social_worker_informed"),
    skill_coverage: skillCoverage,
    overdue_session_count: overdueSessionCount,
  };
}

export function computeAlerts(
  rows: TenancyReadinessRow[],
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

  // Critical: Young person approaching 18 with no housing application (inferred from multiple sessions)
  // We check for young people with 5+ sessions who haven't started a housing application
  const personSessions: Record<string, { count: number; hasApplication: boolean; hasRegister: boolean; latestId: string }> = {};
  for (const r of rows) {
    if (!personSessions[r.young_person_name]) {
      personSessions[r.young_person_name] = { count: 0, hasApplication: false, hasRegister: false, latestId: r.id };
    }
    personSessions[r.young_person_name].count++;
    if (r.housing_application_started) personSessions[r.young_person_name].hasApplication = true;
    if (r.housing_register_joined) personSessions[r.young_person_name].hasRegister = true;
  }

  for (const [name, data] of Object.entries(personSessions)) {
    if (data.count >= 5 && !data.hasApplication) {
      alerts.push({
        type: "many_sessions_no_application",
        severity: "critical",
        message: `${name} has completed ${data.count} tenancy readiness sessions but has not yet started a housing application — the Homelessness Reduction Act 2017 requires the local authority to take steps to prevent homelessness for care leavers, and applications should be submitted well before the young person's 18th birthday`,
        record_id: data.latestId,
      });
    }
  }

  // Critical: No pathway plan link for any sessions
  const personPathway: Record<string, boolean> = {};
  for (const r of rows) {
    if (!personPathway[r.young_person_name]) personPathway[r.young_person_name] = false;
    if (r.pathway_plan_linked) personPathway[r.young_person_name] = true;
  }
  for (const [name, linked] of Object.entries(personPathway)) {
    if (!linked && (personSessions[name]?.count ?? 0) >= 3) {
      alerts.push({
        type: "no_pathway_link",
        severity: "critical",
        message: `${name} has ${personSessions[name]?.count ?? 0} sessions but none are linked to their pathway plan — the Children (Leaving Care) Act 2000 requires housing preparation to be part of the pathway plan`,
      });
    }
  }

  // High: Low engagement across sessions
  const personEngagement: Record<string, { total: number; engaged: number; latestId: string }> = {};
  for (const r of rows) {
    if (!personEngagement[r.young_person_name]) {
      personEngagement[r.young_person_name] = { total: 0, engaged: 0, latestId: r.id };
    }
    personEngagement[r.young_person_name].total++;
    if (r.young_person_engaged) personEngagement[r.young_person_name].engaged++;
  }
  for (const [name, data] of Object.entries(personEngagement)) {
    if (data.total >= 3 && data.engaged / data.total < 0.5) {
      alerts.push({
        type: "low_engagement",
        severity: "high",
        message: `${name} has been engaged in only ${data.engaged} of ${data.total} sessions (${Math.round((data.engaged / data.total) * 100)}%) — consider alternative delivery methods, timing, or content to increase engagement with housing skills`,
        record_id: data.latestId,
      });
    }
  }

  // High: No personal adviser involvement
  const personPA: Record<string, boolean> = {};
  for (const r of rows) {
    if (!personPA[r.young_person_name]) personPA[r.young_person_name] = false;
    if (r.personal_adviser_involved) personPA[r.young_person_name] = true;
  }
  for (const [name, involved] of Object.entries(personPA)) {
    if (!involved && (personSessions[name]?.count ?? 0) >= 2) {
      alerts.push({
        type: "no_pa_involvement",
        severity: "high",
        message: `${name}'s personal adviser has not been involved in any tenancy readiness sessions — the PA has a key role in supporting housing transition under the Children (Leaving Care) Act 2000`,
      });
    }
  }

  // High: Housing register not joined where application started
  for (const r of rows) {
    if (r.housing_application_started && !r.housing_register_joined) {
      alerts.push({
        type: "application_no_register",
        severity: "high",
        message: `${r.young_person_name} has started a housing application but has not joined the housing register — ensure registration with the local authority housing register to access social housing options`,
        record_id: r.id,
      });
    }
  }

  // High: No safety skills covered
  const personSafetySkills: Record<string, boolean> = {};
  for (const r of rows) {
    if (!personSafetySkills[r.young_person_name]) personSafetySkills[r.young_person_name] = false;
    if ((SAFETY_SKILL_AREAS as string[]).includes(r.skill_area)) personSafetySkills[r.young_person_name] = true;
  }
  for (const [name, covered] of Object.entries(personSafetySkills)) {
    if (!covered && (personSessions[name]?.count ?? 0) >= 4) {
      alerts.push({
        type: "no_safety_skills",
        severity: "high",
        message: `${name} has ${personSessions[name]?.count ?? 0} sessions but none cover home safety, ASB awareness, emergency housing, or homelessness prevention — these are essential safety skills for independent living`,
      });
    }
  }

  // Medium: No practical component
  for (const r of rows) {
    if (
      !r.practical_component &&
      (r.delivery_method === "Accompanied Visit" || r.delivery_method === "Real-World Practice")
    ) {
      alerts.push({
        type: "no_practical",
        severity: "medium",
        message: `${r.young_person_name}'s ${r.delivery_method} session on ${r.skill_area} did not include a practical component — practical experience is essential for developing real-world housing skills`,
        record_id: r.id,
      });
    }
  }

  // Medium: Overdue sessions
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const r of rows) {
    if (r.next_session_date) {
      const nextDate = new Date(r.next_session_date);
      if (nextDate < today) {
        alerts.push({
          type: "overdue_session",
          severity: "medium",
          message: `${r.young_person_name}: next session on ${r.skill_area} was due on ${r.next_session_date} and is now overdue — schedule promptly to maintain continuity of housing skills preparation`,
          record_id: r.id,
        });
      }
    }
  }

  // Medium: Deposit scheme not explored
  for (const [name, data] of Object.entries(personSessions)) {
    if (data.count >= 3) {
      const hasDeposit = rows.some((r) => r.young_person_name === name && r.deposit_scheme_aware);
      if (!hasDeposit) {
        alerts.push({
          type: "no_deposit_awareness",
          severity: "medium",
          message: `${name} has not yet been introduced to deposit schemes — awareness of the Tenancy Deposit Scheme (TDS) and local deposit guarantee schemes is important for securing accommodation`,
        });
      }
    }
  }

  return alerts;
}

export function generateCaraInsights(
  rows: TenancyReadinessRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const competencyBreakdown = Object.entries(metrics.by_competency_level)
    .filter(([, count]) => count > 0)
    .map(([level, count]) => `${level}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_sessions} tenancy readiness ${metrics.total_sessions === 1 ? "session" : "sessions"} ` +
      `with ${metrics.unique_young_people} young ${metrics.unique_young_people === 1 ? "person" : "people"}. ` +
      `Avg sessions/person: ${metrics.average_sessions_per_person}. ` +
      `Competency: ${competencyBreakdown || "none recorded"}. ` +
      `Competent/Confident rate: ${metrics.competent_confident_rate}%. ` +
      `Skill coverage: ${metrics.skill_coverage}% (of 14 areas). ` +
      `Engagement: ${metrics.engagement_rate}%. ` +
      `Housing applications: ${metrics.housing_application_rate}%.`,
  );

  // Insight 2: Priority concerns
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    const deliveryBreakdown = Object.entries(metrics.by_delivery_method)
      .filter(([, count]) => count > 0)
      .map(([method, count]) => `${method}: ${count}`)
      .join(", ");

    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority tenancy readiness alerts active. ` +
        `Pathway plan linkage: ${metrics.pathway_plan_rate}%. ` +
        `PA involvement: ${metrics.pa_involvement_rate}%. ` +
        `Housing register: ${metrics.housing_register_rate}%. ` +
        `Deposit awareness: ${metrics.deposit_awareness_rate}%. ` +
        `Delivery: ${deliveryBreakdown}. ` +
        `${metrics.overdue_session_count} overdue ${metrics.overdue_session_count === 1 ? "session" : "sessions"}.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority tenancy readiness alerts currently active. ` +
        `Practical component: ${metrics.practical_rate}%. ` +
        `Guarantee scheme explored: ${metrics.guarantee_scheme_rate}%. ` +
        `Social worker informed: ${metrics.social_worker_informed_rate}%. ` +
        `Continue building housing skills systematically per CHR 2015 Reg 5 and the Children (Leaving Care) Act 2000.`,
    );
  }

  // Insight 3: Reflective safeguarding question
  if (metrics.competent_confident_rate < 30 && metrics.total_sessions > 5) {
    insights.push(
      `[reflect] Only ${metrics.competent_confident_rate}% of sessions show Competent or Confident ` +
        `competency levels. Are tenancy readiness sessions being delivered in a way that ` +
        `builds real-world confidence? The DfE statutory guidance on care leavers emphasises ` +
        `that preparation for independence must be practical and progressive, not just ` +
        `theoretical. Consider increasing accompanied visits, real-world practice, and ` +
        `mentoring from care leavers who have successfully managed tenancies. Young people ` +
        `learn housing skills best through doing, not just discussing.`,
    );
  } else if (metrics.skill_coverage < 50 && metrics.total_sessions > 3) {
    insights.push(
      `[reflect] Only ${metrics.skill_coverage}% of the 14 housing skill areas have been covered. ` +
        `Are sessions focused too narrowly on certain topics while neglecting others? ` +
        `Young people need a broad range of housing skills — from understanding tenancy ` +
        `agreements to managing utilities, maintaining neighbour relations, and knowing ` +
        `their rights if facing homelessness. The Homelessness Reduction Act 2017 ` +
        `prevention duty makes it essential that young people understand emergency options ` +
        `before they leave care.`,
    );
  } else if (metrics.engagement_rate < 70 && metrics.total_sessions > 3) {
    insights.push(
      `[reflect] Engagement rate is ${metrics.engagement_rate}%. Are sessions tailored to each ` +
        `young person's interests, learning style, and readiness? Some young people respond ` +
        `better to practical activities and real-world visits than classroom-style sessions. ` +
        `Are young people involved in choosing which skills they want to develop and how? ` +
        `The SCCIF expects that young people are active participants in their preparation ` +
        `for independence, not passive recipients of a programme.`,
    );
  } else {
    insights.push(
      `[reflect] Are young people's housing goals reflected in their pathway plans, and are ` +
        `personal advisers actively involved in supporting the transition to independent ` +
        `living? The Children (Leaving Care) Act 2000 requires pathway plans to set out ` +
        `a clear housing plan. Are young people being introduced to their local housing ` +
        `options early enough — including social housing, supported accommodation, Staying ` +
        `Close, and the private rented sector? Is the home building relationships with ` +
        `local housing providers to smooth the transition?`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listTenancyReadiness(
  homeId: string,
  filters?: {
    skillArea?: SkillArea;
    competencyLevel?: CompetencyLevel;
    deliveryMethod?: DeliveryMethod;
    youngPersonName?: string;
    limit?: number;
  },
): Promise<ServiceResult<TenancyReadinessRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_tenancy_readiness") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.skillArea) q = q.eq("skill_area", filters.skillArea);
  if (filters?.competencyLevel) q = q.eq("competency_level", filters.competencyLevel);
  if (filters?.deliveryMethod) q = q.eq("delivery_method", filters.deliveryMethod);
  if (filters?.youngPersonName) q = q.eq("young_person_name", filters.youngPersonName);

  q = q.order("session_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getTenancyReadiness(
  id: string,
): Promise<ServiceResult<TenancyReadinessRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_tenancy_readiness") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createTenancyReadiness(input: {
  homeId: string;
  youngPersonName: string;
  sessionDate: string;
  facilitatorName: string;
  skillArea: SkillArea;
  deliveryMethod: DeliveryMethod;
  competencyLevel: CompetencyLevel;
  youngPersonEngaged?: boolean;
  practicalComponent?: boolean;
  housingApplicationStarted?: boolean;
  housingRegisterJoined?: boolean;
  depositSchemeAware?: boolean;
  guaranteeSchemeExplored?: boolean;
  pathwayPlanLinked?: boolean;
  personalAdviserInvolved?: boolean;
  socialWorkerInformed?: boolean;
  nextSessionDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<TenancyReadinessRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateTenancyReadiness({
    youngPersonName: input.youngPersonName,
    sessionDate: input.sessionDate,
    facilitatorName: input.facilitatorName,
    skillArea: input.skillArea,
    deliveryMethod: input.deliveryMethod,
    competencyLevel: input.competencyLevel,
    youngPersonEngaged: input.youngPersonEngaged,
    practicalComponent: input.practicalComponent,
    housingApplicationStarted: input.housingApplicationStarted,
    housingRegisterJoined: input.housingRegisterJoined,
    pathwayPlanLinked: input.pathwayPlanLinked,
    personalAdviserInvolved: input.personalAdviserInvolved,
    nextSessionDate: input.nextSessionDate,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_tenancy_readiness") as SB)
    .insert({
      home_id: input.homeId,
      young_person_name: input.youngPersonName,
      session_date: input.sessionDate,
      facilitator_name: input.facilitatorName,
      skill_area: input.skillArea,
      delivery_method: input.deliveryMethod,
      competency_level: input.competencyLevel,
      young_person_engaged: input.youngPersonEngaged ?? false,
      practical_component: input.practicalComponent ?? false,
      housing_application_started: input.housingApplicationStarted ?? false,
      housing_register_joined: input.housingRegisterJoined ?? false,
      deposit_scheme_aware: input.depositSchemeAware ?? false,
      guarantee_scheme_explored: input.guaranteeSchemeExplored ?? false,
      pathway_plan_linked: input.pathwayPlanLinked ?? false,
      personal_adviser_involved: input.personalAdviserInvolved ?? false,
      social_worker_informed: input.socialWorkerInformed ?? false,
      next_session_date: input.nextSessionDate ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateTenancyReadiness(
  id: string,
  updates: Partial<{
    youngPersonName: string;
    sessionDate: string;
    facilitatorName: string;
    skillArea: SkillArea;
    deliveryMethod: DeliveryMethod;
    competencyLevel: CompetencyLevel;
    youngPersonEngaged: boolean;
    practicalComponent: boolean;
    housingApplicationStarted: boolean;
    housingRegisterJoined: boolean;
    depositSchemeAware: boolean;
    guaranteeSchemeExplored: boolean;
    pathwayPlanLinked: boolean;
    personalAdviserInvolved: boolean;
    socialWorkerInformed: boolean;
    nextSessionDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<TenancyReadinessRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.youngPersonName !== undefined) mapped.young_person_name = updates.youngPersonName;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.facilitatorName !== undefined) mapped.facilitator_name = updates.facilitatorName;
  if (updates.skillArea !== undefined) mapped.skill_area = updates.skillArea;
  if (updates.deliveryMethod !== undefined) mapped.delivery_method = updates.deliveryMethod;
  if (updates.competencyLevel !== undefined) mapped.competency_level = updates.competencyLevel;
  if (updates.youngPersonEngaged !== undefined) mapped.young_person_engaged = updates.youngPersonEngaged;
  if (updates.practicalComponent !== undefined) mapped.practical_component = updates.practicalComponent;
  if (updates.housingApplicationStarted !== undefined) mapped.housing_application_started = updates.housingApplicationStarted;
  if (updates.housingRegisterJoined !== undefined) mapped.housing_register_joined = updates.housingRegisterJoined;
  if (updates.depositSchemeAware !== undefined) mapped.deposit_scheme_aware = updates.depositSchemeAware;
  if (updates.guaranteeSchemeExplored !== undefined) mapped.guarantee_scheme_explored = updates.guaranteeSchemeExplored;
  if (updates.pathwayPlanLinked !== undefined) mapped.pathway_plan_linked = updates.pathwayPlanLinked;
  if (updates.personalAdviserInvolved !== undefined) mapped.personal_adviser_involved = updates.personalAdviserInvolved;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.nextSessionDate !== undefined) mapped.next_session_date = updates.nextSessionDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_tenancy_readiness") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteTenancyReadiness(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { error } = await (client.from("cs_tenancy_readiness") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
