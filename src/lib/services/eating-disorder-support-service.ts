// ==============================================================================
// CARA -- EATING DISORDER & DISORDERED EATING SUPPORT SERVICE
// Tracks assessments, specialist referrals, meal plans, monitoring regimes,
// behavioural indicators, professional engagement, and recovery status for
// children with eating disorders or disordered eating patterns in residential
// care settings.
//
// Covers: Concern type classification (Anorexia, Bulimia, ARFID, Binge Eating
// etc), risk level tracking, weight monitoring, GP and specialist referral
// management, CAMHS engagement, dietitian involvement, meal plan and
// supervision arrangements, bathroom and exercise monitoring, purging and
// restriction behaviour identification, body weight status tracking,
// young person engagement, family involvement, school awareness, social
// worker notification, review scheduling, and status management.
//
// UK Regulatory Framework:
// CHR 2015 Reg 10 (health and wellbeing),
// CHR 2015 Reg 13 (health care arrangements),
// NICE NG69 (eating disorders: recognition and treatment),
// NICE QS175 (eating disorders quality standard),
// SCCIF: Health -- "The home ensures children's physical and mental health
// needs are met."
// BEAT charity guidance, ARFID awareness, MARSIPAN guidelines for
// medical assessment of severely malnourished patients.
//
// Ofsted expects homes to demonstrate prompt recognition of eating disorder
// symptoms, timely GP consultation, appropriate specialist referral, and
// evidence that meal planning and monitoring arrangements are proportionate
// to the level of risk while maintaining the child's dignity.
// ==============================================================================

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const CONCERN_TYPES = [
  "Anorexia Nervosa",
  "Bulimia Nervosa",
  "Binge Eating Disorder",
  "ARFID",
  "Orthorexia",
  "Pica",
  "Rumination Disorder",
  "Disordered Eating Patterns",
  "Body Image Concerns",
  "Emotional Eating",
  "Other",
] as const;
export type ConcernType = (typeof CONCERN_TYPES)[number];

export const RISK_LEVELS = [
  "Low",
  "Medium",
  "High",
  "Critical",
] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const BODY_WEIGHT_STATUSES = [
  "Significantly Underweight",
  "Underweight",
  "Healthy Weight",
  "Overweight",
  "Unknown",
] as const;
export type BodyWeightStatus = (typeof BODY_WEIGHT_STATUSES)[number];

export const STATUSES = [
  "Active",
  "Under Review",
  "Recovery",
  "Relapse",
  "Discharged",
] as const;
export type Status = (typeof STATUSES)[number];

// -- Label maps ---------------------------------------------------------------

export const CONCERN_TYPE_LABELS: { type: ConcernType; label: string }[] = [
  { type: "Anorexia Nervosa", label: "Anorexia Nervosa" },
  { type: "Bulimia Nervosa", label: "Bulimia Nervosa" },
  { type: "Binge Eating Disorder", label: "Binge Eating Disorder (BED)" },
  { type: "ARFID", label: "Avoidant/Restrictive Food Intake Disorder (ARFID)" },
  { type: "Orthorexia", label: "Orthorexia Nervosa" },
  { type: "Pica", label: "Pica" },
  { type: "Rumination Disorder", label: "Rumination Disorder" },
  { type: "Disordered Eating Patterns", label: "Disordered Eating Patterns" },
  { type: "Body Image Concerns", label: "Body Image Concerns" },
  { type: "Emotional Eating", label: "Emotional Eating" },
  { type: "Other", label: "Other Eating Concern" },
];

export const RISK_LEVEL_LABELS: { level: RiskLevel; label: string }[] = [
  { level: "Low", label: "Low Risk" },
  { level: "Medium", label: "Medium Risk" },
  { level: "High", label: "High Risk" },
  { level: "Critical", label: "Critical Risk" },
];

export const BODY_WEIGHT_STATUS_LABELS: { status: BodyWeightStatus; label: string }[] = [
  { status: "Significantly Underweight", label: "Significantly Underweight (BMI < 15 or centile concern)" },
  { status: "Underweight", label: "Underweight" },
  { status: "Healthy Weight", label: "Healthy Weight" },
  { status: "Overweight", label: "Overweight" },
  { status: "Unknown", label: "Unknown / Not Yet Assessed" },
];

export const STATUS_LABELS: { status: Status; label: string }[] = [
  { status: "Active", label: "Active" },
  { status: "Under Review", label: "Under Review" },
  { status: "Recovery", label: "In Recovery" },
  { status: "Relapse", label: "Relapse" },
  { status: "Discharged", label: "Discharged" },
];

// -- Behavioural indicator labels ---------------------------------------------

export const BEHAVIOUR_INDICATOR_LABELS: { key: string; label: string; description: string }[] = [
  { key: "purging_behaviours_identified", label: "Purging Behaviours", description: "Self-induced vomiting, laxative/diuretic misuse, excessive exercise after eating" },
  { key: "food_restriction_identified", label: "Food Restriction", description: "Significant calorie restriction, food group avoidance, skipping meals, food rituals" },
  { key: "binge_behaviours_identified", label: "Binge Behaviours", description: "Episodes of eating large amounts rapidly, feeling out of control, secretive eating" },
  { key: "self_induced_vomiting", label: "Self-Induced Vomiting", description: "Deliberate vomiting after meals, frequent bathroom visits, dental damage" },
  { key: "laxative_misuse", label: "Laxative Misuse", description: "Misuse of laxatives, diuretics, or diet pills to control weight" },
];

// -- Row type -----------------------------------------------------------------

export interface EatingDisorderSupportRow {
  id: string;
  home_id: string;
  child_name: string;
  assessment_date: string;
  lead_professional: string;
  concern_type: ConcernType;
  risk_level: RiskLevel;
  weight_monitoring_in_place: boolean;
  gp_consulted: boolean;
  specialist_referral_made: boolean;
  specialist_service: string | null;
  camhs_engaged: boolean;
  dietitian_involved: boolean;
  meal_plan_in_place: boolean;
  supervised_meals: boolean;
  bathroom_supervision: boolean;
  exercise_monitoring: boolean;
  purging_behaviours_identified: boolean;
  food_restriction_identified: boolean;
  binge_behaviours_identified: boolean;
  self_induced_vomiting: boolean;
  laxative_misuse: boolean;
  body_weight_status: BodyWeightStatus;
  young_person_engaged: boolean;
  family_involved: boolean;
  school_aware: boolean;
  social_worker_informed: boolean;
  review_date: string | null;
  status: Status;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateEatingDisorderSupport(input: {
  childName?: string;
  assessmentDate?: string;
  leadProfessional?: string;
  concernType?: string;
  riskLevel?: string;
  bodyWeightStatus?: string;
  status?: string;
  specialistReferralMade?: boolean;
  specialistService?: string | null;
  reviewDate?: string | null;
  purgingBehavioursIdentified?: boolean;
  selfInducedVomiting?: boolean;
  laxativeMisuse?: boolean;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.childName || input.childName.trim().length === 0) {
    errors.push("Child name is required");
  }
  if (!input.assessmentDate) {
    errors.push("Assessment date is required");
  } else {
    const dateObj = new Date(input.assessmentDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Assessment date must be a valid date");
    } else if (dateObj > new Date()) {
      errors.push("Assessment date cannot be in the future");
    }
  }
  if (!input.leadProfessional || input.leadProfessional.trim().length === 0) {
    errors.push("Lead professional is required");
  }
  if (!input.concernType || !(CONCERN_TYPES as readonly string[]).includes(input.concernType)) {
    errors.push(`Concern type must be one of: ${CONCERN_TYPES.join(", ")}`);
  }
  if (!input.riskLevel || !(RISK_LEVELS as readonly string[]).includes(input.riskLevel)) {
    errors.push(`Risk level must be one of: ${RISK_LEVELS.join(", ")}`);
  }
  if (!input.bodyWeightStatus || !(BODY_WEIGHT_STATUSES as readonly string[]).includes(input.bodyWeightStatus)) {
    errors.push(`Body weight status must be one of: ${BODY_WEIGHT_STATUSES.join(", ")}`);
  }
  if (input.status && !(STATUSES as readonly string[]).includes(input.status)) {
    errors.push(`Status must be one of: ${STATUSES.join(", ")}`);
  }

  // Business rule: specialist service name required when referral made
  if (input.specialistReferralMade && (!input.specialistService || input.specialistService.trim().length === 0)) {
    errors.push("Specialist service name is required when a specialist referral has been made");
  }

  // Business rule: review date should not be in the past
  if (input.reviewDate) {
    const reviewDate = new Date(input.reviewDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(reviewDate.getTime())) {
      errors.push("Review date must be a valid date");
    } else if (reviewDate < today) {
      errors.push("Review date should not be in the past");
    }
  }

  // Business rule: purging sub-types should align
  if (input.selfInducedVomiting && !input.purgingBehavioursIdentified) {
    errors.push("Purging behaviours should be identified when self-induced vomiting is recorded");
  }
  if (input.laxativeMisuse && !input.purgingBehavioursIdentified) {
    errors.push("Purging behaviours should be identified when laxative misuse is recorded");
  }

  // Business rule: critical risk should have specialist referral
  if (input.riskLevel === "Critical" && !input.specialistReferralMade) {
    errors.push("Critical risk cases should have a specialist referral per NICE NG69");
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: EatingDisorderSupportRow[],
): {
  total_records: number;
  unique_children: number;
  active_cases: number;
  by_concern_type: Record<string, number>;
  by_risk_level: Record<string, number>;
  by_body_weight_status: Record<string, number>;
  by_status: Record<string, number>;
  specialist_referral_rate: number;
  camhs_engagement_rate: number;
  gp_consulted_rate: number;
  dietitian_rate: number;
  meal_plan_rate: number;
  supervised_meals_rate: number;
  weight_monitoring_rate: number;
  bathroom_supervision_rate: number;
  exercise_monitoring_rate: number;
  engagement_rate: number;
  family_involvement_rate: number;
  school_aware_rate: number;
  social_worker_informed_rate: number;
  purging_rate: number;
  restriction_rate: number;
  binge_rate: number;
  self_induced_vomiting_rate: number;
  laxative_misuse_rate: number;
  recovery_count: number;
  relapse_count: number;
  high_risk_count: number;
  critical_count: number;
} {
  const total = rows.length;

  const boolRate = (field: keyof EatingDisorderSupportRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
  };

  const uniqueChildren = new Set(rows.map((r) => r.child_name)).size;
  const activeCases = rows.filter((r) => r.status === "Active" || r.status === "Relapse").length;

  // Concern type breakdown
  const byConcernType: Record<string, number> = {};
  for (const ct of CONCERN_TYPES) byConcernType[ct] = 0;
  for (const r of rows) byConcernType[r.concern_type] = (byConcernType[r.concern_type] || 0) + 1;

  // Risk level breakdown
  const byRiskLevel: Record<string, number> = {};
  for (const rl of RISK_LEVELS) byRiskLevel[rl] = 0;
  for (const r of rows) byRiskLevel[r.risk_level] = (byRiskLevel[r.risk_level] || 0) + 1;

  // Body weight status breakdown
  const byBodyWeightStatus: Record<string, number> = {};
  for (const bws of BODY_WEIGHT_STATUSES) byBodyWeightStatus[bws] = 0;
  for (const r of rows) byBodyWeightStatus[r.body_weight_status] = (byBodyWeightStatus[r.body_weight_status] || 0) + 1;

  // Status breakdown
  const byStatus: Record<string, number> = {};
  for (const s of STATUSES) byStatus[s] = 0;
  for (const r of rows) byStatus[r.status] = (byStatus[r.status] || 0) + 1;

  const recoveryCount = rows.filter((r) => r.status === "Recovery").length;
  const relapseCount = rows.filter((r) => r.status === "Relapse").length;
  const highRiskCount = rows.filter((r) => r.risk_level === "High").length;
  const criticalCount = rows.filter((r) => r.risk_level === "Critical").length;

  return {
    total_records: total,
    unique_children: uniqueChildren,
    active_cases: activeCases,
    by_concern_type: byConcernType,
    by_risk_level: byRiskLevel,
    by_body_weight_status: byBodyWeightStatus,
    by_status: byStatus,
    specialist_referral_rate: boolRate("specialist_referral_made"),
    camhs_engagement_rate: boolRate("camhs_engaged"),
    gp_consulted_rate: boolRate("gp_consulted"),
    dietitian_rate: boolRate("dietitian_involved"),
    meal_plan_rate: boolRate("meal_plan_in_place"),
    supervised_meals_rate: boolRate("supervised_meals"),
    weight_monitoring_rate: boolRate("weight_monitoring_in_place"),
    bathroom_supervision_rate: boolRate("bathroom_supervision"),
    exercise_monitoring_rate: boolRate("exercise_monitoring"),
    engagement_rate: boolRate("young_person_engaged"),
    family_involvement_rate: boolRate("family_involved"),
    school_aware_rate: boolRate("school_aware"),
    social_worker_informed_rate: boolRate("social_worker_informed"),
    purging_rate: boolRate("purging_behaviours_identified"),
    restriction_rate: boolRate("food_restriction_identified"),
    binge_rate: boolRate("binge_behaviours_identified"),
    self_induced_vomiting_rate: boolRate("self_induced_vomiting"),
    laxative_misuse_rate: boolRate("laxative_misuse"),
    recovery_count: recoveryCount,
    relapse_count: relapseCount,
    high_risk_count: highRiskCount,
    critical_count: criticalCount,
  };
}

export function computeAlerts(
  rows: EatingDisorderSupportRow[],
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

  // Critical: significantly underweight with no specialist referral
  for (const r of rows) {
    if (r.body_weight_status === "Significantly Underweight" && !r.specialist_referral_made && (r.status === "Active" || r.status === "Relapse")) {
      alerts.push({
        type: "sig_underweight_no_specialist",
        severity: "critical",
        message: `${r.child_name} is significantly underweight with no specialist referral — urgent eating disorder service referral required per NICE NG69 and MARSIPAN guidelines`,
        record_id: r.id,
      });
    }
  }

  // Critical: critical risk with no GP consultation
  for (const r of rows) {
    if (r.risk_level === "Critical" && !r.gp_consulted && (r.status === "Active" || r.status === "Relapse")) {
      alerts.push({
        type: "critical_no_gp",
        severity: "critical",
        message: `${r.child_name} has Critical eating disorder risk with no GP consultation — immediate medical assessment required per NICE NG69`,
        record_id: r.id,
      });
    }
  }

  // Critical: self-induced vomiting with no medical oversight
  for (const r of rows) {
    if (r.self_induced_vomiting && !r.gp_consulted && !r.specialist_referral_made && (r.status === "Active" || r.status === "Relapse")) {
      alerts.push({
        type: "vomiting_no_medical",
        severity: "critical",
        message: `${r.child_name} has self-induced vomiting identified with no medical oversight — risk of electrolyte imbalance and oesophageal damage, urgent GP referral needed`,
        record_id: r.id,
      });
    }
  }

  // High: anorexia nervosa without weight monitoring
  for (const r of rows) {
    if (r.concern_type === "Anorexia Nervosa" && !r.weight_monitoring_in_place && (r.status === "Active" || r.status === "Relapse")) {
      alerts.push({
        type: "anorexia_no_weight_monitoring",
        severity: "high",
        message: `${r.child_name} has Anorexia Nervosa diagnosis but no weight monitoring in place — regular weight monitoring required per NICE NG69 to track physical health`,
        record_id: r.id,
      });
    }
  }

  // High: high/critical risk without meal plan
  for (const r of rows) {
    if ((r.risk_level === "High" || r.risk_level === "Critical") && !r.meal_plan_in_place && (r.status === "Active" || r.status === "Relapse")) {
      alerts.push({
        type: "high_risk_no_meal_plan",
        severity: "high",
        message: `${r.child_name} has ${r.risk_level} eating disorder risk but no meal plan in place — structured meal planning should be implemented with dietitian guidance`,
        record_id: r.id,
      });
    }
  }

  // High: purging behaviours without bathroom supervision
  for (const r of rows) {
    if (r.purging_behaviours_identified && !r.bathroom_supervision && (r.status === "Active" || r.status === "Relapse")) {
      alerts.push({
        type: "purging_no_bathroom_supervision",
        severity: "high",
        message: `${r.child_name} has purging behaviours identified but no bathroom supervision — consider proportionate supervision while maintaining dignity per Reg 10`,
        record_id: r.id,
      });
    }
  }

  // High: relapse status without CAMHS engagement
  for (const r of rows) {
    if (r.status === "Relapse" && !r.camhs_engaged) {
      alerts.push({
        type: "relapse_no_camhs",
        severity: "high",
        message: `${r.child_name} has relapsed but CAMHS is not engaged — urgent CAMHS re-referral needed to support recovery per NICE NG69`,
        record_id: r.id,
      });
    }
  }

  // High: young person not engaged on active cases
  for (const r of rows) {
    if ((r.risk_level === "High" || r.risk_level === "Critical") && !r.young_person_engaged && (r.status === "Active" || r.status === "Relapse")) {
      alerts.push({
        type: "high_risk_not_engaged",
        severity: "high",
        message: `${r.child_name} has ${r.risk_level} eating disorder risk but the young person is not engaged — therapeutic engagement is essential for recovery per NICE QS175`,
        record_id: r.id,
      });
    }
  }

  // Medium: laxative misuse identified
  for (const r of rows) {
    if (r.laxative_misuse && (r.status === "Active" || r.status === "Relapse")) {
      alerts.push({
        type: "laxative_misuse",
        severity: "medium",
        message: `${r.child_name} has laxative misuse identified — monitor for dehydration and electrolyte disturbance, ensure GP is aware`,
        record_id: r.id,
      });
    }
  }

  // Medium: overdue review
  for (const r of rows) {
    if (r.review_date) {
      const reviewDate = new Date(r.review_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (reviewDate < today && (r.status === "Active" || r.status === "Relapse")) {
        alerts.push({
          type: "overdue_review",
          severity: "medium",
          message: `Eating disorder review for ${r.child_name} was due on ${r.review_date} and is now overdue — schedule review promptly to ensure continuity of care`,
          record_id: r.id,
        });
      }
    }
  }

  // Medium: social worker not informed for active high/critical cases
  for (const r of rows) {
    if ((r.risk_level === "High" || r.risk_level === "Critical") && !r.social_worker_informed && (r.status === "Active" || r.status === "Relapse")) {
      alerts.push({
        type: "high_risk_sw_not_informed",
        severity: "medium",
        message: `Social worker not informed of ${r.child_name}'s ${r.risk_level} eating disorder risk — notification required per Reg 13 health care arrangements`,
        record_id: r.id,
      });
    }
  }

  // Medium: ARFID without dietitian
  for (const r of rows) {
    if (r.concern_type === "ARFID" && !r.dietitian_involved && (r.status === "Active" || r.status === "Relapse")) {
      alerts.push({
        type: "arfid_no_dietitian",
        severity: "medium",
        message: `${r.child_name} has ARFID but no dietitian involved — ARFID management benefits significantly from specialist dietetic input per NICE NG69`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateCaraInsights(
  rows: EatingDisorderSupportRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  insights.push(
    `[sky] ${metrics.total_records} eating disorder/disordered eating ${metrics.total_records === 1 ? "record" : "records"} across ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `${metrics.active_cases} active ${metrics.active_cases === 1 ? "case" : "cases"} (including relapses). ` +
      `${metrics.high_risk_count} at High risk, ${metrics.critical_count} at Critical risk. ` +
      `Specialist referral rate: ${metrics.specialist_referral_rate}%. ` +
      `GP consulted rate: ${metrics.gp_consulted_rate}%. ` +
      `CAMHS engagement: ${metrics.camhs_engagement_rate}%.`,
  );

  // Insight 2: Clinical picture and priority concerns
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    // Find most common concern type
    const topConcern = Object.entries(metrics.by_concern_type)
      .sort(([, a], [, b]) => b - a)
      .filter(([, count]) => count > 0)[0];
    const topConcernLabel = topConcern ? `${topConcern[0]} (${topConcern[1]})` : "none recorded";

    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority eating disorder alerts active. ` +
        `Most common concern: ${topConcernLabel}. ` +
        `Meal plan rate: ${metrics.meal_plan_rate}%. ` +
        `Supervised meals: ${metrics.supervised_meals_rate}%. ` +
        `Purging identified: ${metrics.purging_rate}%. ` +
        `Restriction identified: ${metrics.restriction_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority eating disorder alerts currently active. ` +
        `${metrics.recovery_count} ${metrics.recovery_count === 1 ? "child" : "children"} in recovery. ` +
        `Engagement rate: ${metrics.engagement_rate}%. ` +
        `Dietitian involvement: ${metrics.dietitian_rate}%. ` +
        `Continue monitoring per NICE NG69 and maintain supportive mealtime environments.`,
    );
  }

  // Insight 3: Reflective safeguarding question
  if (metrics.critical_count > 0 && metrics.gp_consulted_rate < 100) {
    insights.push(
      `[reflect] ${metrics.critical_count} critical ${metrics.critical_count === 1 ? "case" : "cases"} with GP consultation at ${metrics.gp_consulted_rate}%. ` +
        `Are all critical cases receiving timely medical assessment including physical ` +
        `observations (BMI, heart rate, blood pressure, bloods) as required by NICE NG69, ` +
        `and are MARSIPAN guidelines being followed for any significantly malnourished children?`,
    );
  } else if (metrics.relapse_count > 0) {
    insights.push(
      `[reflect] ${metrics.relapse_count} ${metrics.relapse_count === 1 ? "child has" : "children have"} relapsed. ` +
        `Are relapse prevention plans in place that identify early warning signs, ` +
        `and is the home creating a supportive, non-judgemental environment around food ` +
        `and body image as recommended by BEAT charity guidance and NICE QS175?`,
    );
  } else if (metrics.engagement_rate < 70) {
    insights.push(
      `[reflect] Young person engagement rate is ${metrics.engagement_rate}%. ` +
        `Are staff using motivational and person-centred approaches to support ` +
        `engagement with eating disorder treatment, and is the home avoiding ` +
        `punitive or controlling approaches to food that could exacerbate disordered ` +
        `eating patterns, in line with NICE NG69 and trauma-informed care principles?`,
    );
  } else {
    insights.push(
      `[reflect] Are staff trained to recognise the early signs of eating disorders ` +
        `including ARFID and emotional eating, and does the home promote a positive ` +
        `relationship with food through flexible meal planning, access to varied ` +
        `foods, and a non-shaming mealtime culture in line with NICE NG69 ` +
        `and BEAT charity guidance?`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listEatingDisorderSupport(
  homeId: string,
  filters?: {
    concernType?: ConcernType;
    riskLevel?: RiskLevel;
    bodyWeightStatus?: BodyWeightStatus;
    status?: Status;
    limit?: number;
  },
): Promise<ServiceResult<EatingDisorderSupportRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_eating_disorder_support") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.concernType) q = q.eq("concern_type", filters.concernType);
  if (filters?.riskLevel) q = q.eq("risk_level", filters.riskLevel);
  if (filters?.bodyWeightStatus) q = q.eq("body_weight_status", filters.bodyWeightStatus);
  if (filters?.status) q = q.eq("status", filters.status);

  q = q.order("assessment_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getEatingDisorderSupport(
  id: string,
): Promise<ServiceResult<EatingDisorderSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_eating_disorder_support") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createEatingDisorderSupport(input: {
  homeId: string;
  childName: string;
  assessmentDate: string;
  leadProfessional: string;
  concernType: ConcernType;
  riskLevel: RiskLevel;
  weightMonitoringInPlace?: boolean;
  gpConsulted?: boolean;
  specialistReferralMade?: boolean;
  specialistService?: string | null;
  camhsEngaged?: boolean;
  dietitianInvolved?: boolean;
  mealPlanInPlace?: boolean;
  supervisedMeals?: boolean;
  bathroomSupervision?: boolean;
  exerciseMonitoring?: boolean;
  purgingBehavioursIdentified?: boolean;
  foodRestrictionIdentified?: boolean;
  bingeBehavioursIdentified?: boolean;
  selfInducedVomiting?: boolean;
  laxativeMisuse?: boolean;
  bodyWeightStatus: BodyWeightStatus;
  youngPersonEngaged?: boolean;
  familyInvolved?: boolean;
  schoolAware?: boolean;
  socialWorkerInformed?: boolean;
  reviewDate?: string | null;
  status?: Status;
  notes?: string | null;
}): Promise<ServiceResult<EatingDisorderSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateEatingDisorderSupport({
    childName: input.childName,
    assessmentDate: input.assessmentDate,
    leadProfessional: input.leadProfessional,
    concernType: input.concernType,
    riskLevel: input.riskLevel,
    bodyWeightStatus: input.bodyWeightStatus,
    status: input.status,
    specialistReferralMade: input.specialistReferralMade,
    specialistService: input.specialistService,
    reviewDate: input.reviewDate,
    purgingBehavioursIdentified: input.purgingBehavioursIdentified,
    selfInducedVomiting: input.selfInducedVomiting,
    laxativeMisuse: input.laxativeMisuse,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_eating_disorder_support") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      assessment_date: input.assessmentDate,
      lead_professional: input.leadProfessional,
      concern_type: input.concernType,
      risk_level: input.riskLevel,
      weight_monitoring_in_place: input.weightMonitoringInPlace ?? false,
      gp_consulted: input.gpConsulted ?? false,
      specialist_referral_made: input.specialistReferralMade ?? false,
      specialist_service: input.specialistService ?? null,
      camhs_engaged: input.camhsEngaged ?? false,
      dietitian_involved: input.dietitianInvolved ?? false,
      meal_plan_in_place: input.mealPlanInPlace ?? false,
      supervised_meals: input.supervisedMeals ?? false,
      bathroom_supervision: input.bathroomSupervision ?? false,
      exercise_monitoring: input.exerciseMonitoring ?? false,
      purging_behaviours_identified: input.purgingBehavioursIdentified ?? false,
      food_restriction_identified: input.foodRestrictionIdentified ?? false,
      binge_behaviours_identified: input.bingeBehavioursIdentified ?? false,
      self_induced_vomiting: input.selfInducedVomiting ?? false,
      laxative_misuse: input.laxativeMisuse ?? false,
      body_weight_status: input.bodyWeightStatus,
      young_person_engaged: input.youngPersonEngaged ?? false,
      family_involved: input.familyInvolved ?? false,
      school_aware: input.schoolAware ?? false,
      social_worker_informed: input.socialWorkerInformed ?? false,
      review_date: input.reviewDate ?? null,
      status: input.status ?? "Active",
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateEatingDisorderSupport(
  id: string,
  updates: Partial<{
    childName: string;
    assessmentDate: string;
    leadProfessional: string;
    concernType: ConcernType;
    riskLevel: RiskLevel;
    weightMonitoringInPlace: boolean;
    gpConsulted: boolean;
    specialistReferralMade: boolean;
    specialistService: string | null;
    camhsEngaged: boolean;
    dietitianInvolved: boolean;
    mealPlanInPlace: boolean;
    supervisedMeals: boolean;
    bathroomSupervision: boolean;
    exerciseMonitoring: boolean;
    purgingBehavioursIdentified: boolean;
    foodRestrictionIdentified: boolean;
    bingeBehavioursIdentified: boolean;
    selfInducedVomiting: boolean;
    laxativeMisuse: boolean;
    bodyWeightStatus: BodyWeightStatus;
    youngPersonEngaged: boolean;
    familyInvolved: boolean;
    schoolAware: boolean;
    socialWorkerInformed: boolean;
    reviewDate: string | null;
    status: Status;
    notes: string | null;
  }>,
): Promise<ServiceResult<EatingDisorderSupportRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.assessmentDate !== undefined) mapped.assessment_date = updates.assessmentDate;
  if (updates.leadProfessional !== undefined) mapped.lead_professional = updates.leadProfessional;
  if (updates.concernType !== undefined) mapped.concern_type = updates.concernType;
  if (updates.riskLevel !== undefined) mapped.risk_level = updates.riskLevel;
  if (updates.weightMonitoringInPlace !== undefined) mapped.weight_monitoring_in_place = updates.weightMonitoringInPlace;
  if (updates.gpConsulted !== undefined) mapped.gp_consulted = updates.gpConsulted;
  if (updates.specialistReferralMade !== undefined) mapped.specialist_referral_made = updates.specialistReferralMade;
  if (updates.specialistService !== undefined) mapped.specialist_service = updates.specialistService;
  if (updates.camhsEngaged !== undefined) mapped.camhs_engaged = updates.camhsEngaged;
  if (updates.dietitianInvolved !== undefined) mapped.dietitian_involved = updates.dietitianInvolved;
  if (updates.mealPlanInPlace !== undefined) mapped.meal_plan_in_place = updates.mealPlanInPlace;
  if (updates.supervisedMeals !== undefined) mapped.supervised_meals = updates.supervisedMeals;
  if (updates.bathroomSupervision !== undefined) mapped.bathroom_supervision = updates.bathroomSupervision;
  if (updates.exerciseMonitoring !== undefined) mapped.exercise_monitoring = updates.exerciseMonitoring;
  if (updates.purgingBehavioursIdentified !== undefined) mapped.purging_behaviours_identified = updates.purgingBehavioursIdentified;
  if (updates.foodRestrictionIdentified !== undefined) mapped.food_restriction_identified = updates.foodRestrictionIdentified;
  if (updates.bingeBehavioursIdentified !== undefined) mapped.binge_behaviours_identified = updates.bingeBehavioursIdentified;
  if (updates.selfInducedVomiting !== undefined) mapped.self_induced_vomiting = updates.selfInducedVomiting;
  if (updates.laxativeMisuse !== undefined) mapped.laxative_misuse = updates.laxativeMisuse;
  if (updates.bodyWeightStatus !== undefined) mapped.body_weight_status = updates.bodyWeightStatus;
  if (updates.youngPersonEngaged !== undefined) mapped.young_person_engaged = updates.youngPersonEngaged;
  if (updates.familyInvolved !== undefined) mapped.family_involved = updates.familyInvolved;
  if (updates.schoolAware !== undefined) mapped.school_aware = updates.schoolAware;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.reviewDate !== undefined) mapped.review_date = updates.reviewDate;
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_eating_disorder_support") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteEatingDisorderSupport(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { error } = await (client.from("cs_eating_disorder_support") as SB)
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
  validateEatingDisorderSupport,
};
