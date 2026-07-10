// ==============================================================================
// CARA -- CAREER GUIDANCE & WORK EXPERIENCE SERVICE
// Tracks career guidance and work experience activities for looked-after
// children including careers interviews, skills assessments, CV writing,
// interview practice, job search support, work experience placements,
// employer encounters, workplace visits, mentoring sessions, careers fairs,
// online research, personal statement support, labour market information,
// apprenticeship exploration, self-employment awareness, and volunteering
// placements.
//
// Covers: One-to-one careers interview delivery, skills and interests
// assessment, CV creation and updating, interview technique practice,
// job search guidance and support, work experience placement coordination,
// employer encounter facilitation, workplace visit organisation, mentoring
// session tracking, careers fair and event attendance, online careers
// research guidance, personal statement support for applications, labour
// market information provision, apprenticeship route exploration,
// self-employment and enterprise awareness, volunteering placement
// coordination, Gatsby Benchmark coverage tracking, confidence measurement,
// pathway plan linkage, and personal adviser involvement.
//
// UK Regulatory Framework:
// CHR 2015 Reg 5 (preparing for independence),
// Education Act 2011 s29 (duty to provide independent careers guidance),
// Careers Strategy 2017,
// Gatsby Benchmarks (8 benchmarks of good careers guidance),
// Baker Clause (provider access),
// SCCIF: Experiences and progress — "The home supports educational
// and career aspirations."
// ==============================================================================

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const ACTIVITY_TYPES = [
  "Careers Interview",
  "Skills Assessment",
  "CV Writing",
  "Interview Practice",
  "Job Search Support",
  "Work Experience Placement",
  "Employer Encounter",
  "Workplace Visit",
  "Mentoring Session",
  "Careers Fair/Event",
  "Online Research",
  "Personal Statement Support",
  "Labour Market Information",
  "Apprenticeship Exploration",
  "Self-Employment Awareness",
  "Volunteering Placement",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const GATSBY_BENCHMARKS = [
  "1 — Stable Careers Programme",
  "2 — Learning from Career Info",
  "3 — Addressing Needs",
  "4 — Linking Curriculum",
  "5 — Employer Encounters",
  "6 — Workplace Experiences",
  "7 — HE/FE Encounters",
  "8 — Personal Guidance",
] as const;
export type GatsbyBenchmark = (typeof GATSBY_BENCHMARKS)[number];

export const CONFIDENCE_LEVELS = [
  "Very Low",
  "Low",
  "Medium",
  "High",
  "Very High",
] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const EMPLOYER_ACTIVITY_TYPES: ActivityType[] = [
  "Employer Encounter",
  "Workplace Visit",
  "Work Experience Placement",
];

export const PRACTICAL_ACTIVITY_TYPES: ActivityType[] = [
  "CV Writing",
  "Interview Practice",
  "Work Experience Placement",
  "Volunteering Placement",
  "Self-Employment Awareness",
];

export const GUIDANCE_ACTIVITY_TYPES: ActivityType[] = [
  "Careers Interview",
  "Skills Assessment",
  "Labour Market Information",
  "Online Research",
  "Apprenticeship Exploration",
];

// Confidence level numeric mapping for improvement calculation
const CONFIDENCE_NUMERIC: Record<string, number> = {
  "Very Low": 1,
  "Low": 2,
  "Medium": 3,
  "High": 4,
  "Very High": 5,
};

// -- Label maps ---------------------------------------------------------------

export const ACTIVITY_TYPE_LABELS: { type: ActivityType; label: string }[] = [
  { type: "Careers Interview", label: "Careers Interview" },
  { type: "Skills Assessment", label: "Skills Assessment" },
  { type: "CV Writing", label: "CV Writing" },
  { type: "Interview Practice", label: "Interview Practice" },
  { type: "Job Search Support", label: "Job Search Support" },
  { type: "Work Experience Placement", label: "Work Experience Placement" },
  { type: "Employer Encounter", label: "Employer Encounter" },
  { type: "Workplace Visit", label: "Workplace Visit" },
  { type: "Mentoring Session", label: "Mentoring Session" },
  { type: "Careers Fair/Event", label: "Careers Fair / Event" },
  { type: "Online Research", label: "Online Research" },
  { type: "Personal Statement Support", label: "Personal Statement Support" },
  { type: "Labour Market Information", label: "Labour Market Information" },
  { type: "Apprenticeship Exploration", label: "Apprenticeship Exploration" },
  { type: "Self-Employment Awareness", label: "Self-Employment Awareness" },
  { type: "Volunteering Placement", label: "Volunteering Placement" },
];

export const GATSBY_BENCHMARK_LABELS: { benchmark: GatsbyBenchmark; label: string }[] = [
  { benchmark: "1 — Stable Careers Programme", label: "1 — Stable Careers Programme" },
  { benchmark: "2 — Learning from Career Info", label: "2 — Learning from Career Info" },
  { benchmark: "3 — Addressing Needs", label: "3 — Addressing Needs" },
  { benchmark: "4 — Linking Curriculum", label: "4 — Linking Curriculum" },
  { benchmark: "5 — Employer Encounters", label: "5 — Employer Encounters" },
  { benchmark: "6 — Workplace Experiences", label: "6 — Workplace Experiences" },
  { benchmark: "7 — HE/FE Encounters", label: "7 — HE/FE Encounters" },
  { benchmark: "8 — Personal Guidance", label: "8 — Personal Guidance" },
];

export const CONFIDENCE_LEVEL_LABELS: { level: ConfidenceLevel; label: string }[] = [
  { level: "Very Low", label: "Very Low" },
  { level: "Low", label: "Low" },
  { level: "Medium", label: "Medium" },
  { level: "High", label: "High" },
  { level: "Very High", label: "Very High" },
];

// -- Row type -----------------------------------------------------------------

export interface CareerGuidanceRow {
  id: string;
  home_id: string;
  young_person_name: string;
  session_date: string;
  facilitator_name: string;
  activity_type: ActivityType;
  gatsby_benchmark: GatsbyBenchmark | null;
  employer_name: string | null;
  placement_sector: string | null;
  duration_hours: number | null;
  young_person_engaged: boolean;
  practical_component: boolean;
  cv_created_updated: boolean;
  interview_skills_practised: boolean;
  pathway_plan_linked: boolean;
  personal_adviser_involved: boolean;
  social_worker_informed: boolean;
  confidence_before: ConfidenceLevel;
  confidence_after: ConfidenceLevel;
  next_session_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateCareerGuidance(input: {
  youngPersonName?: string;
  sessionDate?: string;
  facilitatorName?: string;
  activityType?: string;
  gatsbyBenchmark?: string | null;
  employerName?: string | null;
  durationHours?: number | null;
  confidenceBefore?: string;
  confidenceAfter?: string;
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

  if (!input.activityType || !(ACTIVITY_TYPES as readonly string[]).includes(input.activityType)) {
    errors.push(`Activity type must be one of: ${ACTIVITY_TYPES.join(", ")}`);
  }

  if (
    input.gatsbyBenchmark !== null &&
    input.gatsbyBenchmark !== undefined &&
    !(GATSBY_BENCHMARKS as readonly string[]).includes(input.gatsbyBenchmark)
  ) {
    errors.push(`Gatsby benchmark must be one of: ${GATSBY_BENCHMARKS.join(", ")}`);
  }

  if (
    input.confidenceBefore &&
    !(CONFIDENCE_LEVELS as readonly string[]).includes(input.confidenceBefore)
  ) {
    errors.push(`Confidence before must be one of: ${CONFIDENCE_LEVELS.join(", ")}`);
  }

  if (
    input.confidenceAfter &&
    !(CONFIDENCE_LEVELS as readonly string[]).includes(input.confidenceAfter)
  ) {
    errors.push(`Confidence after must be one of: ${CONFIDENCE_LEVELS.join(", ")}`);
  }

  // Business rule: Employer encounters, workplace visits, and work experience should have employer name
  if (
    input.activityType &&
    (EMPLOYER_ACTIVITY_TYPES as string[]).includes(input.activityType) &&
    (!input.employerName || input.employerName.trim().length === 0)
  ) {
    errors.push("Employer encounters, workplace visits, and work experience placements require an employer name");
  }

  // Business rule: Duration should be positive if provided
  if (input.durationHours !== null && input.durationHours !== undefined) {
    if (input.durationHours <= 0) {
      errors.push("Duration hours must be a positive number");
    }
    if (input.durationHours > 40) {
      errors.push("Duration hours should not exceed 40 hours for a single session");
    }
  }

  // Business rule: Work experience should have duration
  if (
    input.activityType === "Work Experience Placement" &&
    (input.durationHours === null || input.durationHours === undefined)
  ) {
    errors.push("Work experience placements require duration hours to be recorded");
  }

  // Business rule: Next session date should be in the future
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

  // Business rule: Gatsby benchmark should be mapped appropriately
  if (input.activityType && input.gatsbyBenchmark) {
    if (
      input.activityType === "Careers Interview" &&
      input.gatsbyBenchmark !== "8 — Personal Guidance" &&
      input.gatsbyBenchmark !== "3 — Addressing Needs"
    ) {
      // Advisory only — not blocking
    }
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: CareerGuidanceRow[],
): {
  total_sessions: number;
  unique_young_people: number;
  by_activity_type: Record<string, number>;
  by_gatsby_benchmark: Record<string, number>;
  engagement_rate: number;
  practical_rate: number;
  cv_rate: number;
  interview_skills_rate: number;
  pathway_plan_rate: number;
  pa_rate: number;
  confidence_improvement_rate: number;
  average_sessions_per_person: number;
  employer_encounter_count: number;
  work_experience_count: number;
  gatsby_coverage: number;
} {
  const total = rows.length;

  // Unique young people
  const uniqueYP = new Set(rows.map((r) => r.young_person_name.toLowerCase().trim()));

  // Activity type breakdown
  const byActivityType: Record<string, number> = {};
  for (const at of ACTIVITY_TYPES) byActivityType[at] = 0;
  for (const r of rows) byActivityType[r.activity_type] = (byActivityType[r.activity_type] || 0) + 1;

  // Gatsby benchmark breakdown
  const byGatsby: Record<string, number> = {};
  for (const gb of GATSBY_BENCHMARKS) byGatsby[gb] = 0;
  for (const r of rows) {
    if (r.gatsby_benchmark) {
      byGatsby[r.gatsby_benchmark] = (byGatsby[r.gatsby_benchmark] || 0) + 1;
    }
  }

  // Boolean rates
  const engagementRate = total > 0
    ? Math.round((rows.filter((r) => r.young_person_engaged).length / total) * 1000) / 10
    : 0;

  const practicalRate = total > 0
    ? Math.round((rows.filter((r) => r.practical_component).length / total) * 1000) / 10
    : 0;

  const cvRate = total > 0
    ? Math.round((rows.filter((r) => r.cv_created_updated).length / total) * 1000) / 10
    : 0;

  const interviewSkillsRate = total > 0
    ? Math.round((rows.filter((r) => r.interview_skills_practised).length / total) * 1000) / 10
    : 0;

  const pathwayPlanRate = total > 0
    ? Math.round((rows.filter((r) => r.pathway_plan_linked).length / total) * 1000) / 10
    : 0;

  const paRate = total > 0
    ? Math.round((rows.filter((r) => r.personal_adviser_involved).length / total) * 1000) / 10
    : 0;

  // Confidence improvement rate
  const rowsWithConfidence = rows.filter(
    (r) => r.confidence_before && r.confidence_after,
  );
  const improved = rowsWithConfidence.filter(
    (r) =>
      (CONFIDENCE_NUMERIC[r.confidence_after] ?? 0) > (CONFIDENCE_NUMERIC[r.confidence_before] ?? 0),
  );
  const confidenceImprovementRate = rowsWithConfidence.length > 0
    ? Math.round((improved.length / rowsWithConfidence.length) * 1000) / 10
    : 0;

  // Average sessions per person
  const avgSessions = uniqueYP.size > 0
    ? Math.round((total / uniqueYP.size) * 10) / 10
    : 0;

  // Employer encounter count
  const employerEncounterCount = rows.filter(
    (r) => (EMPLOYER_ACTIVITY_TYPES as string[]).includes(r.activity_type),
  ).length;

  // Work experience count
  const workExperienceCount = rows.filter(
    (r) => r.activity_type === "Work Experience Placement",
  ).length;

  // Gatsby coverage: how many of the 8 benchmarks are covered
  const coveredBenchmarks = new Set(
    rows.filter((r) => r.gatsby_benchmark).map((r) => r.gatsby_benchmark),
  );
  const gatsbyCoverage = coveredBenchmarks.size;

  return {
    total_sessions: total,
    unique_young_people: uniqueYP.size,
    by_activity_type: byActivityType,
    by_gatsby_benchmark: byGatsby,
    engagement_rate: engagementRate,
    practical_rate: practicalRate,
    cv_rate: cvRate,
    interview_skills_rate: interviewSkillsRate,
    pathway_plan_rate: pathwayPlanRate,
    pa_rate: paRate,
    confidence_improvement_rate: confidenceImprovementRate,
    average_sessions_per_person: avgSessions,
    employer_encounter_count: employerEncounterCount,
    work_experience_count: workExperienceCount,
    gatsby_coverage: gatsbyCoverage,
  };
}

export function computeAlerts(
  rows: CareerGuidanceRow[],
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

  // Critical: No employer encounters at all (Gatsby Benchmark 5 is mandatory)
  const employerEncounters = rows.filter(
    (r) => (EMPLOYER_ACTIVITY_TYPES as string[]).includes(r.activity_type),
  );
  if (rows.length >= 5 && employerEncounters.length === 0) {
    alerts.push({
      type: "no_employer_encounters",
      severity: "critical",
      message: "No employer encounters, workplace visits, or work experience placements have been recorded — Gatsby Benchmark 5 (Employer Encounters) and 6 (Workplace Experiences) require every young person to have meaningful contact with employers",
    });
  }

  // Critical: No personal guidance sessions (Gatsby Benchmark 8)
  const personalGuidance = rows.filter(
    (r) => r.activity_type === "Careers Interview" || r.gatsby_benchmark === "8 — Personal Guidance",
  );
  if (rows.length >= 5 && personalGuidance.length === 0) {
    alerts.push({
      type: "no_personal_guidance",
      severity: "critical",
      message: "No personal careers guidance sessions recorded — Gatsby Benchmark 8 requires every young person to have opportunities for personal guidance from a qualified careers adviser, and Education Act 2011 s29 places a duty to provide independent careers guidance",
    });
  }

  // High: Young person not engaged
  for (const r of rows) {
    if (!r.young_person_engaged) {
      alerts.push({
        type: "young_person_disengaged",
        severity: "high",
        message: `${r.young_person_name} was not engaged during ${r.activity_type} on ${r.session_date} — review approach and consider alternative strategies to motivate career engagement per CHR 2015 Reg 5`,
        record_id: r.id,
      });
    }
  }

  // High: Confidence decreased
  for (const r of rows) {
    if (
      r.confidence_before &&
      r.confidence_after &&
      (CONFIDENCE_NUMERIC[r.confidence_after] ?? 0) < (CONFIDENCE_NUMERIC[r.confidence_before] ?? 0)
    ) {
      alerts.push({
        type: "confidence_decreased",
        severity: "high",
        message: `${r.young_person_name}'s confidence decreased from ${r.confidence_before} to ${r.confidence_after} during ${r.activity_type} on ${r.session_date} — review session approach and provide additional support`,
        record_id: r.id,
      });
    }
  }

  // High: Low Gatsby coverage
  const coveredBenchmarks = new Set(
    rows.filter((r) => r.gatsby_benchmark).map((r) => r.gatsby_benchmark),
  );
  if (rows.length >= 10 && coveredBenchmarks.size < 4) {
    alerts.push({
      type: "low_gatsby_coverage",
      severity: "high",
      message: `Only ${coveredBenchmarks.size} of 8 Gatsby Benchmarks are covered in careers activities — the Careers Strategy 2017 expects all 8 benchmarks to be addressed for comprehensive careers guidance`,
    });
  }

  // High: Pathway plan not linked for multiple sessions
  const notLinked = rows.filter((r) => !r.pathway_plan_linked);
  if (notLinked.length >= 3) {
    alerts.push({
      type: "pathway_plan_not_linked",
      severity: "high",
      message: `${notLinked.length} careers sessions are not linked to pathway plans — CHR 2015 Reg 5 requires career aspirations to be integrated into the young person's development plan`,
    });
  }

  // High: Social worker not informed of career activities
  const swNotInformed = rows.filter((r) => !r.social_worker_informed);
  if (swNotInformed.length >= 3) {
    alerts.push({
      type: "sw_not_informed_pattern",
      severity: "high",
      message: `${swNotInformed.length} career guidance sessions have not informed the social worker — ensure multi-agency coordination on career planning per Care Planning Regulations 2010`,
    });
  }

  // Medium: Overdue next session dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const r of rows) {
    if (r.next_session_date) {
      const nextDate = new Date(r.next_session_date);
      if (nextDate < today) {
        alerts.push({
          type: "overdue_session",
          severity: "medium",
          message: `Next session for ${r.young_person_name} was due on ${r.next_session_date} and is now overdue — schedule follow-up to maintain career guidance momentum`,
          record_id: r.id,
        });
      }
    }
  }

  // Medium: No CV created for young people with multiple sessions
  const ypSessionMap = new Map<string, CareerGuidanceRow[]>();
  for (const r of rows) {
    const key = r.young_person_name.toLowerCase().trim();
    if (!ypSessionMap.has(key)) ypSessionMap.set(key, []);
    ypSessionMap.get(key)!.push(r);
  }
  for (const [, ypRows] of ypSessionMap) {
    if (ypRows.length >= 3 && !ypRows.some((r) => r.cv_created_updated)) {
      alerts.push({
        type: "no_cv_multiple_sessions",
        severity: "medium",
        message: `${ypRows[0].young_person_name} has had ${ypRows.length} career guidance sessions but no CV has been created or updated — a CV is a fundamental tool for employment readiness`,
      });
    }
  }

  // Medium: No work experience recorded
  const workExp = rows.filter((r) => r.activity_type === "Work Experience Placement");
  if (rows.length >= 8 && workExp.length === 0) {
    alerts.push({
      type: "no_work_experience",
      severity: "medium",
      message: "No work experience placements recorded — Gatsby Benchmark 6 (Workplace Experiences) expects every young person to have first-hand experience of the workplace",
    });
  }

  // Medium: Low practical component rate
  const practicalCount = rows.filter((r) => r.practical_component).length;
  if (rows.length >= 5 && practicalCount / rows.length < 0.3) {
    alerts.push({
      type: "low_practical_rate",
      severity: "medium",
      message: `Only ${Math.round((practicalCount / rows.length) * 100)}% of career guidance sessions include practical components — consider increasing hands-on activities to build employability skills`,
    });
  }

  return alerts;
}

export function generateCaraInsights(
  rows: CareerGuidanceRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const typeBreakdown = Object.entries(metrics.by_activity_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  const gatsbyBreakdown = Object.entries(metrics.by_gatsby_benchmark)
    .filter(([, count]) => count > 0)
    .map(([benchmark, count]) => `${benchmark}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_sessions} career guidance ${metrics.total_sessions === 1 ? "session" : "sessions"} ` +
      `for ${metrics.unique_young_people} young ${metrics.unique_young_people === 1 ? "person" : "people"} ` +
      `(avg ${metrics.average_sessions_per_person} per person). ` +
      `Activities: ${typeBreakdown || "none recorded"}. ` +
      `Gatsby benchmarks covered: ${metrics.gatsby_coverage}/8. ` +
      `${gatsbyBreakdown ? `Breakdown: ${gatsbyBreakdown}. ` : ""}` +
      `Employer encounters: ${metrics.employer_encounter_count}. ` +
      `Work experience placements: ${metrics.work_experience_count}. ` +
      `Confidence improvement rate: ${metrics.confidence_improvement_rate}%.`,
  );

  // Insight 2: Quality indicators and alerts
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts. ` +
        `Engagement rate: ${metrics.engagement_rate}%. ` +
        `Practical component rate: ${metrics.practical_rate}%. ` +
        `CV created/updated rate: ${metrics.cv_rate}%. ` +
        `Interview skills practised: ${metrics.interview_skills_rate}%. ` +
        `Pathway plan linked: ${metrics.pathway_plan_rate}%. ` +
        `PA involvement: ${metrics.pa_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority career guidance alerts. ` +
        `Engagement rate: ${metrics.engagement_rate}%. ` +
        `Practical component rate: ${metrics.practical_rate}%. ` +
        `CV created/updated rate: ${metrics.cv_rate}%. ` +
        `Interview skills practised: ${metrics.interview_skills_rate}%. ` +
        `Pathway plan linked: ${metrics.pathway_plan_rate}%. ` +
        `PA involvement: ${metrics.pa_rate}%. ` +
        `Continue building career aspirations per CHR 2015 Reg 5.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.gatsby_coverage < 4 && metrics.total_sessions > 0) {
    insights.push(
      `[reflect] Only ${metrics.gatsby_coverage} of the 8 Gatsby Benchmarks are being addressed ` +
        `in career guidance activities. Is the home providing a comprehensive careers programme? ` +
        `The Careers Strategy 2017 sets out that all 8 Gatsby Benchmarks should be met to ensure ` +
        `high-quality careers guidance. For looked-after children, this is particularly important ` +
        `as they may have fewer informal networks to draw on for career information and employer ` +
        `connections. Are employer encounters, workplace experiences, and HE/FE encounters being ` +
        `systematically offered to every young person?`,
    );
  } else if (metrics.employer_encounter_count === 0 && metrics.total_sessions > 0) {
    insights.push(
      `[reflect] No employer encounters or workplace experiences have been recorded. Are young ` +
        `people getting meaningful contact with employers and real workplace environments? Gatsby ` +
        `Benchmarks 5 and 6 require every young person to have encounters with employers and ` +
        `experiences of workplaces. For looked-after children, who may lack family networks that ` +
        `provide informal career exposure, the home has a crucial role in creating these ` +
        `opportunities. The Baker Clause also requires that young people hear from a range of ` +
        `education and training providers about the options available to them.`,
    );
  } else if (metrics.confidence_improvement_rate < 40 && metrics.total_sessions > 5) {
    insights.push(
      `[reflect] Confidence improvement rate is only ${metrics.confidence_improvement_rate}% across ` +
        `${metrics.total_sessions} sessions. Are career guidance activities genuinely building ` +
        `young people's confidence and self-belief? CHR 2015 Reg 5 requires the home to prepare ` +
        `children for independence, and confidence in their career prospects is fundamental to ` +
        `this. Consider whether activities are sufficiently tailored to individual interests, ` +
        `whether practical components are being included, and whether successes are being ` +
        `celebrated to reinforce positive self-image.`,
    );
  } else {
    insights.push(
      `[reflect] How does the home ensure that career guidance is ambitious and aspirational ` +
        `for every young person, regardless of their current academic attainment? Are activities ` +
        `tailored to individual interests and strengths? Do young people feel that the home ` +
        `genuinely believes in their potential? SCCIF inspectors look for evidence that the home ` +
        `supports educational and career aspirations, and the Education Act 2011 s29 duty to ` +
        `provide independent careers guidance means this must be more than a box-ticking exercise. ` +
        `Every young person deserves to explore a wide range of career possibilities.`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    activityType?: ActivityType;
    gatsbyBenchmark?: GatsbyBenchmark;
    limit?: number;
  },
): Promise<ServiceResult<CareerGuidanceRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_career_guidance") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.activityType) q = q.eq("activity_type", filters.activityType);
  if (filters?.gatsbyBenchmark) q = q.eq("gatsby_benchmark", filters.gatsbyBenchmark);

  q = q.order("session_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<CareerGuidanceRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_career_guidance") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createRecord(input: {
  homeId: string;
  youngPersonName: string;
  sessionDate: string;
  facilitatorName: string;
  activityType: ActivityType;
  gatsbyBenchmark?: GatsbyBenchmark | null;
  employerName?: string | null;
  placementSector?: string | null;
  durationHours?: number | null;
  youngPersonEngaged?: boolean;
  practicalComponent?: boolean;
  cvCreatedUpdated?: boolean;
  interviewSkillsPractised?: boolean;
  pathwayPlanLinked?: boolean;
  personalAdviserInvolved?: boolean;
  socialWorkerInformed?: boolean;
  confidenceBefore?: ConfidenceLevel;
  confidenceAfter?: ConfidenceLevel;
  nextSessionDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<CareerGuidanceRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateCareerGuidance({
    youngPersonName: input.youngPersonName,
    sessionDate: input.sessionDate,
    facilitatorName: input.facilitatorName,
    activityType: input.activityType,
    gatsbyBenchmark: input.gatsbyBenchmark,
    employerName: input.employerName,
    durationHours: input.durationHours,
    confidenceBefore: input.confidenceBefore,
    confidenceAfter: input.confidenceAfter,
    nextSessionDate: input.nextSessionDate,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_career_guidance") as SB)
    .insert({
      home_id: input.homeId,
      young_person_name: input.youngPersonName,
      session_date: input.sessionDate,
      facilitator_name: input.facilitatorName,
      activity_type: input.activityType,
      gatsby_benchmark: input.gatsbyBenchmark ?? null,
      employer_name: input.employerName ?? null,
      placement_sector: input.placementSector ?? null,
      duration_hours: input.durationHours ?? null,
      young_person_engaged: input.youngPersonEngaged ?? true,
      practical_component: input.practicalComponent ?? false,
      cv_created_updated: input.cvCreatedUpdated ?? false,
      interview_skills_practised: input.interviewSkillsPractised ?? false,
      pathway_plan_linked: input.pathwayPlanLinked ?? false,
      personal_adviser_involved: input.personalAdviserInvolved ?? false,
      social_worker_informed: input.socialWorkerInformed ?? false,
      confidence_before: input.confidenceBefore ?? "Medium",
      confidence_after: input.confidenceAfter ?? "Medium",
      next_session_date: input.nextSessionDate ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    youngPersonName: string;
    sessionDate: string;
    facilitatorName: string;
    activityType: ActivityType;
    gatsbyBenchmark: GatsbyBenchmark | null;
    employerName: string | null;
    placementSector: string | null;
    durationHours: number | null;
    youngPersonEngaged: boolean;
    practicalComponent: boolean;
    cvCreatedUpdated: boolean;
    interviewSkillsPractised: boolean;
    pathwayPlanLinked: boolean;
    personalAdviserInvolved: boolean;
    socialWorkerInformed: boolean;
    confidenceBefore: ConfidenceLevel;
    confidenceAfter: ConfidenceLevel;
    nextSessionDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<CareerGuidanceRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.youngPersonName !== undefined) mapped.young_person_name = updates.youngPersonName;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.facilitatorName !== undefined) mapped.facilitator_name = updates.facilitatorName;
  if (updates.activityType !== undefined) mapped.activity_type = updates.activityType;
  if (updates.gatsbyBenchmark !== undefined) mapped.gatsby_benchmark = updates.gatsbyBenchmark;
  if (updates.employerName !== undefined) mapped.employer_name = updates.employerName;
  if (updates.placementSector !== undefined) mapped.placement_sector = updates.placementSector;
  if (updates.durationHours !== undefined) mapped.duration_hours = updates.durationHours;
  if (updates.youngPersonEngaged !== undefined) mapped.young_person_engaged = updates.youngPersonEngaged;
  if (updates.practicalComponent !== undefined) mapped.practical_component = updates.practicalComponent;
  if (updates.cvCreatedUpdated !== undefined) mapped.cv_created_updated = updates.cvCreatedUpdated;
  if (updates.interviewSkillsPractised !== undefined) mapped.interview_skills_practised = updates.interviewSkillsPractised;
  if (updates.pathwayPlanLinked !== undefined) mapped.pathway_plan_linked = updates.pathwayPlanLinked;
  if (updates.personalAdviserInvolved !== undefined) mapped.personal_adviser_involved = updates.personalAdviserInvolved;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.confidenceBefore !== undefined) mapped.confidence_before = updates.confidenceBefore;
  if (updates.confidenceAfter !== undefined) mapped.confidence_after = updates.confidenceAfter;
  if (updates.nextSessionDate !== undefined) mapped.next_session_date = updates.nextSessionDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_career_guidance") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteRecord(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { error } = await (client.from("cs_career_guidance") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
