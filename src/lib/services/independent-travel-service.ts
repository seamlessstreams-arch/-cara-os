// ==============================================================================
// CARA -- INDEPENDENT TRAVEL TRAINING SERVICE
// Tracks young people's progress in developing independent travel skills including
// road safety, public transport, route learning, emergency preparedness, and
// confidence building. Supports transition to independence.
//
// UK Regulatory Framework:
// CHR 2015 Reg 5 (independence preparation — equipping young people for adulthood),
// SCCIF: Experiences & progress — "Young people develop independence skills."
// Road safety education, public transport confidence, journey planning.
// ==============================================================================

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const SKILL_AREAS = [
  "Road Safety Awareness",
  "Bus Route Learning",
  "Train Journey Planning",
  "Cycling Proficiency",
  "Walking Familiar Routes",
  "Walking New Routes",
  "Reading Timetables",
  "Buying Tickets",
  "Using Travel Apps",
  "Night-Time Safety",
  "Emergency Situations",
  "Journey to School",
  "Journey to Work",
  "Journey to Activities",
  "Long-Distance Travel",
  "Airport/Ferry Navigation",
] as const;
export type SkillArea = (typeof SKILL_AREAS)[number];

export const DELIVERY_METHODS = [
  "Accompanied Practice",
  "Observed Practice",
  "Independent Practice",
  "Theory Session",
  "Online Module",
  "Role Play",
] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

export const COMPETENCY_LEVELS = [
  "Not Ready",
  "Emerging",
  "Developing",
  "Competent",
  "Independent",
] as const;
export type CompetencyLevel = (typeof COMPETENCY_LEVELS)[number];

export const CONFIDENCE_LEVELS = [
  "Very Low",
  "Low",
  "Medium",
  "High",
  "Very High",
] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const ROAD_SAFETY_SKILLS: SkillArea[] = [
  "Road Safety Awareness",
  "Cycling Proficiency",
  "Walking Familiar Routes",
  "Walking New Routes",
  "Night-Time Safety",
];

export const PUBLIC_TRANSPORT_SKILLS: SkillArea[] = [
  "Bus Route Learning",
  "Train Journey Planning",
  "Reading Timetables",
  "Buying Tickets",
  "Using Travel Apps",
];

export const ESSENTIAL_JOURNEY_SKILLS: SkillArea[] = [
  "Journey to School",
  "Journey to Work",
  "Journey to Activities",
];

export const ADVANCED_SKILLS: SkillArea[] = [
  "Long-Distance Travel",
  "Airport/Ferry Navigation",
  "Emergency Situations",
];

export const PRACTICE_METHODS: DeliveryMethod[] = [
  "Accompanied Practice",
  "Observed Practice",
  "Independent Practice",
];

export const THEORY_METHODS: DeliveryMethod[] = [
  "Theory Session",
  "Online Module",
  "Role Play",
];

// -- Label maps ---------------------------------------------------------------

export const SKILL_AREA_LABELS: { skill: SkillArea; label: string }[] = [
  { skill: "Road Safety Awareness", label: "Road Safety Awareness" },
  { skill: "Bus Route Learning", label: "Bus Route Learning" },
  { skill: "Train Journey Planning", label: "Train Journey Planning" },
  { skill: "Cycling Proficiency", label: "Cycling Proficiency" },
  { skill: "Walking Familiar Routes", label: "Walking Familiar Routes" },
  { skill: "Walking New Routes", label: "Walking New Routes" },
  { skill: "Reading Timetables", label: "Reading Timetables" },
  { skill: "Buying Tickets", label: "Buying Tickets" },
  { skill: "Using Travel Apps", label: "Using Travel Apps" },
  { skill: "Night-Time Safety", label: "Night-Time Safety" },
  { skill: "Emergency Situations", label: "Emergency Situations" },
  { skill: "Journey to School", label: "Journey to School" },
  { skill: "Journey to Work", label: "Journey to Work" },
  { skill: "Journey to Activities", label: "Journey to Activities" },
  { skill: "Long-Distance Travel", label: "Long-Distance Travel" },
  { skill: "Airport/Ferry Navigation", label: "Airport / Ferry Navigation" },
];

export const COMPETENCY_LEVEL_LABELS: { level: CompetencyLevel; label: string }[] = [
  { level: "Not Ready", label: "Not Ready" },
  { level: "Emerging", label: "Emerging" },
  { level: "Developing", label: "Developing" },
  { level: "Competent", label: "Competent" },
  { level: "Independent", label: "Independent" },
];

// -- Row type -----------------------------------------------------------------

export interface IndependentTravelRow {
  id: string;
  home_id: string;
  young_person_name: string;
  session_date: string;
  supporting_staff: string;
  skill_area: SkillArea;
  delivery_method: DeliveryMethod;
  route_description: string | null;
  competency_level: CompetencyLevel;
  risk_assessment_completed: boolean;
  young_person_engaged: boolean;
  gps_tracking_agreed: boolean | null;
  emergency_plan_in_place: boolean;
  phone_charged_checked: boolean;
  money_available: boolean;
  id_carried: boolean | null;
  confidence_level: ConfidenceLevel;
  incident_occurred: boolean;
  incident_details: string | null;
  next_session_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateIndependentTravel(input: {
  youngPersonName?: string;
  sessionDate?: string;
  supportingStaff?: string;
  skillArea?: string;
  deliveryMethod?: string;
  competencyLevel?: string;
  confidenceLevel?: string;
  riskAssessmentCompleted?: boolean;
  youngPersonEngaged?: boolean;
  emergencyPlanInPlace?: boolean;
  phoneChargedChecked?: boolean;
  moneyAvailable?: boolean;
  incidentOccurred?: boolean;
  incidentDetails?: string | null;
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
    }
  }

  if (!input.supportingStaff || input.supportingStaff.trim().length === 0) {
    errors.push("Supporting staff name is required");
  }

  if (
    !input.skillArea ||
    !(SKILL_AREAS as readonly string[]).includes(input.skillArea)
  ) {
    errors.push(`Skill area must be one of: ${SKILL_AREAS.join(", ")}`);
  }

  if (
    !input.deliveryMethod ||
    !(DELIVERY_METHODS as readonly string[]).includes(input.deliveryMethod)
  ) {
    errors.push(`Delivery method must be one of: ${DELIVERY_METHODS.join(", ")}`);
  }

  if (
    input.competencyLevel &&
    !(COMPETENCY_LEVELS as readonly string[]).includes(input.competencyLevel)
  ) {
    errors.push(`Competency level must be one of: ${COMPETENCY_LEVELS.join(", ")}`);
  }

  if (
    input.confidenceLevel &&
    !(CONFIDENCE_LEVELS as readonly string[]).includes(input.confidenceLevel)
  ) {
    errors.push(`Confidence level must be one of: ${CONFIDENCE_LEVELS.join(", ")}`);
  }

  // Business rule: Risk assessment required for practice sessions
  if (
    input.riskAssessmentCompleted === false &&
    input.deliveryMethod &&
    (PRACTICE_METHODS as string[]).includes(input.deliveryMethod)
  ) {
    errors.push(
      "Risk assessment not completed for practice session — CHR 2015 Reg 5 requires that independence training is safe and proportionate. Any practice session (accompanied, observed, or independent) where the young person is physically travelling requires a risk assessment covering route hazards, traffic, time of day, weather, the young person's current competency, and any specific vulnerabilities. This is a safeguarding requirement, not an option",
    );
  }

  // Business rule: Emergency plan for independent practice
  if (
    input.emergencyPlanInPlace === false &&
    input.deliveryMethod === "Independent Practice"
  ) {
    errors.push(
      "No emergency plan for independent practice — when a young person is travelling independently (even for the first time on a familiar route), there must be a clear plan for what they do if something goes wrong: who to call, what to do if lost, how to get help, where safe places are en route. CHR 2015 Reg 5 requires that independence-building is done safely. The young person must know the plan and have the means to enact it (charged phone, emergency contacts, money for emergency transport)",
    );
  }

  // Business rule: Phone must be charged for practice travel
  if (
    input.phoneChargedChecked === false &&
    input.deliveryMethod &&
    (PRACTICE_METHODS as string[]).includes(input.deliveryMethod)
  ) {
    errors.push(
      "Phone not confirmed charged before travel practice — a mobile phone is the primary safety tool for independent travel. The young person must have a charged phone with credit/data to contact the home in an emergency, use maps/navigation, check live transport updates, and call emergency services if needed. This should be checked before every practice session. If the young person does not have a phone, alternative safety measures must be documented",
    );
  }

  // Business rule: Money available for practice travel
  if (
    input.moneyAvailable === false &&
    input.deliveryMethod &&
    (PRACTICE_METHODS as string[]).includes(input.deliveryMethod) &&
    input.skillArea &&
    (PUBLIC_TRANSPORT_SKILLS as string[]).includes(input.skillArea)
  ) {
    errors.push(
      "No money available for public transport practice — the young person needs money for fares, and also emergency money in case they need to take alternative transport home (e.g., a taxi if they become lost or frightened). Being stranded without money is distressing and potentially dangerous. The home should provide travel money and emergency cash for all transport practice sessions",
    );
  }

  // Business rule: Incident occurred but no details
  if (input.incidentOccurred === true && (!input.incidentDetails || input.incidentDetails.trim().length === 0)) {
    errors.push(
      "Incident occurred but no details recorded — any incident during travel training must be fully documented. This could range from getting lost to near-misses to interactions with strangers. The details inform the risk assessment for future sessions and may indicate the young person needs more supported practice before progressing. If the incident was significant, it may require a Reg 40 notification",
    );
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: IndependentTravelRow[],
): {
  total_records: number;
  unique_young_people: number;
  by_skill_area: Record<string, number>;
  by_delivery_method: Record<string, number>;
  by_competency_level: Record<string, number>;
  by_confidence_level: Record<string, number>;
  road_safety_count: number;
  public_transport_count: number;
  essential_journey_count: number;
  advanced_skills_count: number;
  practice_session_count: number;
  theory_session_count: number;
  risk_assessment_rate: number;
  engagement_rate: number;
  emergency_plan_rate: number;
  phone_checked_rate: number;
  money_available_rate: number;
  incident_rate: number;
  independent_competency_count: number;
  competent_or_independent_rate: number;
  high_confidence_rate: number;
  average_sessions_per_person: number;
  gps_tracking_agreed_rate: number;
} {
  const total = rows.length;
  const uniquePeople = new Set(rows.map((r) => r.young_person_name.toLowerCase().trim()));

  // Skill area breakdown
  const bySkillArea: Record<string, number> = {};
  for (const sa of SKILL_AREAS) bySkillArea[sa] = 0;
  for (const r of rows) bySkillArea[r.skill_area] = (bySkillArea[r.skill_area] || 0) + 1;

  // Delivery method breakdown
  const byDeliveryMethod: Record<string, number> = {};
  for (const dm of DELIVERY_METHODS) byDeliveryMethod[dm] = 0;
  for (const r of rows) byDeliveryMethod[r.delivery_method] = (byDeliveryMethod[r.delivery_method] || 0) + 1;

  // Competency breakdown
  const byCompetency: Record<string, number> = {};
  for (const cl of COMPETENCY_LEVELS) byCompetency[cl] = 0;
  for (const r of rows) byCompetency[r.competency_level] = (byCompetency[r.competency_level] || 0) + 1;

  // Confidence breakdown
  const byConfidence: Record<string, number> = {};
  for (const cl of CONFIDENCE_LEVELS) byConfidence[cl] = 0;
  for (const r of rows) byConfidence[r.confidence_level] = (byConfidence[r.confidence_level] || 0) + 1;

  // Category counts
  const roadSafetyCount = rows.filter((r) => (ROAD_SAFETY_SKILLS as string[]).includes(r.skill_area)).length;
  const publicTransportCount = rows.filter((r) => (PUBLIC_TRANSPORT_SKILLS as string[]).includes(r.skill_area)).length;
  const essentialCount = rows.filter((r) => (ESSENTIAL_JOURNEY_SKILLS as string[]).includes(r.skill_area)).length;
  const advancedCount = rows.filter((r) => (ADVANCED_SKILLS as string[]).includes(r.skill_area)).length;
  const practiceCount = rows.filter((r) => (PRACTICE_METHODS as string[]).includes(r.delivery_method)).length;
  const theoryCount = rows.filter((r) => (THEORY_METHODS as string[]).includes(r.delivery_method)).length;

  // Boolean rates
  const pct = (filter: (r: IndependentTravelRow) => boolean) =>
    total > 0 ? Math.round((rows.filter(filter).length / total) * 1000) / 10 : 0;

  const riskRate = pct((r) => r.risk_assessment_completed);
  const engagementRate = pct((r) => r.young_person_engaged);
  const emergencyRate = pct((r) => r.emergency_plan_in_place);
  const phoneRate = pct((r) => r.phone_charged_checked);
  const moneyRate = pct((r) => r.money_available);
  const incidentRate = pct((r) => r.incident_occurred);

  // Competency outcomes
  const independentCount = rows.filter((r) => r.competency_level === "Independent").length;
  const competentOrIndependentRate = total > 0
    ? Math.round((rows.filter((r) => r.competency_level === "Competent" || r.competency_level === "Independent").length / total) * 1000) / 10
    : 0;

  // Confidence
  const highConfidenceRate = total > 0
    ? Math.round((rows.filter((r) => r.confidence_level === "High" || r.confidence_level === "Very High").length / total) * 1000) / 10
    : 0;

  // GPS tracking
  const gpsRows = rows.filter((r) => r.gps_tracking_agreed !== null);
  const gpsRate = gpsRows.length > 0
    ? Math.round((gpsRows.filter((r) => r.gps_tracking_agreed === true).length / gpsRows.length) * 1000) / 10
    : 0;

  const avgSessionsPerPerson = uniquePeople.size > 0
    ? Math.round((total / uniquePeople.size) * 10) / 10
    : 0;

  return {
    total_records: total,
    unique_young_people: uniquePeople.size,
    by_skill_area: bySkillArea,
    by_delivery_method: byDeliveryMethod,
    by_competency_level: byCompetency,
    by_confidence_level: byConfidence,
    road_safety_count: roadSafetyCount,
    public_transport_count: publicTransportCount,
    essential_journey_count: essentialCount,
    advanced_skills_count: advancedCount,
    practice_session_count: practiceCount,
    theory_session_count: theoryCount,
    risk_assessment_rate: riskRate,
    engagement_rate: engagementRate,
    emergency_plan_rate: emergencyRate,
    phone_checked_rate: phoneRate,
    money_available_rate: moneyRate,
    incident_rate: incidentRate,
    independent_competency_count: independentCount,
    competent_or_independent_rate: competentOrIndependentRate,
    high_confidence_rate: highConfidenceRate,
    average_sessions_per_person: avgSessionsPerPerson,
    gps_tracking_agreed_rate: gpsRate,
  };
}

export function computeAlerts(
  rows: IndependentTravelRow[],
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

  // Critical: Incident occurred
  for (const r of rows) {
    if (r.incident_occurred) {
      alerts.push({
        type: "incident_occurred",
        severity: "critical",
        message: `Incident during travel training for ${r.young_person_name} (${r.skill_area}, ${r.session_date}): ${r.incident_details || "No details recorded"}. Any incident during independent travel practice must be reviewed immediately. The risk assessment must be updated, the young person's confidence and willingness to continue assessed, and a decision made about whether to continue at the same level or step back to more supported practice. If the incident involved risk to the young person, a Reg 40 notification may be required`,
        record_id: r.id,
      });
    }
  }

  // Critical: Independent practice without risk assessment
  for (const r of rows) {
    if (
      !r.risk_assessment_completed &&
      (PRACTICE_METHODS as string[]).includes(r.delivery_method)
    ) {
      alerts.push({
        type: "no_risk_assessment_practice",
        severity: "critical",
        message: `${r.young_person_name}'s travel practice session (${r.skill_area}, ${r.session_date}) conducted without risk assessment. CHR 2015 Reg 5 requires safe independence-building. Sending a young person out to travel without assessing route hazards, time of day, their competency level, and specific vulnerabilities is a safeguarding failure. All future practice sessions must have a documented risk assessment`,
        record_id: r.id,
      });
    }
  }

  // Critical: Independent practice without emergency plan
  for (const r of rows) {
    if (r.delivery_method === "Independent Practice" && !r.emergency_plan_in_place) {
      alerts.push({
        type: "no_emergency_plan_independent",
        severity: "critical",
        message: `${r.young_person_name} practised independently (${r.skill_area}, ${r.session_date}) without an emergency plan. Independent travel without a clear plan for when things go wrong is unsafe. The young person must know: who to call, what to do if lost/frightened, where safe places are, how to get emergency transport. This must be in place before any further independent practice`,
        record_id: r.id,
      });
    }
  }

  // High: Young person not engaged
  const personEngagementMap = new Map<string, IndependentTravelRow[]>();
  for (const r of rows) {
    const key = r.young_person_name.toLowerCase().trim();
    if (!personEngagementMap.has(key)) personEngagementMap.set(key, []);
    personEngagementMap.get(key)!.push(r);
  }
  for (const [, personRows] of personEngagementMap) {
    const engagedCount = personRows.filter((r) => r.young_person_engaged).length;
    if (personRows.length >= 3 && engagedCount / personRows.length < 0.4) {
      alerts.push({
        type: "low_engagement",
        severity: "high",
        message: `${personRows[0].young_person_name} has low engagement (${Math.round((engagedCount / personRows.length) * 100)}%) across ${personRows.length} travel training sessions. If a young person is consistently disengaged from independence training, the approach may need to change. Are sessions relevant to their interests? Are they anxious about travel? Is the pace too fast or too slow? CHR 2015 Reg 5 requires that independence preparation meets individual needs — a one-size-fits-all approach will not work`,
      });
    }
  }

  // High: Stuck at same competency level
  for (const [, personRows] of personEngagementMap) {
    if (personRows.length >= 5) {
      const sorted = [...personRows].sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());
      const lastThree = sorted.slice(-3);
      const allSameLevel = lastThree.every((r) => r.competency_level === lastThree[0].competency_level);
      if (allSameLevel && lastThree[0].competency_level !== "Independent") {
        alerts.push({
          type: "stuck_competency",
          severity: "high",
          message: `${personRows[0].young_person_name} has remained at '${lastThree[0].competency_level}' competency across their last 3 sessions. Progression has stalled. Is the training method appropriate? Does the young person need more practice at a simpler level before advancing? Are there underlying barriers (anxiety, SEND, lack of motivation, bad experience)? Consider whether a different approach — different staff, different route, peer mentoring, technology aids — might help`,
        });
      }
    }
  }

  // High: No phone for practice
  for (const r of rows) {
    if (
      !r.phone_charged_checked &&
      (PRACTICE_METHODS as string[]).includes(r.delivery_method)
    ) {
      alerts.push({
        type: "no_phone_practice",
        severity: "high",
        message: `${r.young_person_name} went to travel practice without confirmed charged phone (${r.skill_area}, ${r.session_date}). A mobile phone is the primary safety tool for independent travel — for navigation, contacting the home, and calling emergency services. Every practice session must confirm the young person has a working, charged phone with credit/data`,
        record_id: r.id,
      });
    }
  }

  // Medium: Very low confidence
  for (const r of rows) {
    if (r.confidence_level === "Very Low") {
      alerts.push({
        type: "very_low_confidence",
        severity: "medium",
        message: `${r.young_person_name} recorded as having very low confidence in ${r.skill_area} (${r.session_date}). Confidence is as important as competence for independent travel. A young person who is technically capable but very low in confidence may freeze in unexpected situations. Consider whether the pace of progression is right, whether smaller steps would build confidence, and whether anxiety support is needed. Travel confidence often links to wider anxiety issues`,
        record_id: r.id,
      });
    }
  }

  // Medium: All theory, no practice
  for (const [, personRows] of personEngagementMap) {
    if (personRows.length >= 4) {
      const practiceCount = personRows.filter((r) => (PRACTICE_METHODS as string[]).includes(r.delivery_method)).length;
      if (practiceCount === 0) {
        alerts.push({
          type: "theory_only",
          severity: "medium",
          message: `${personRows[0].young_person_name} has ${personRows.length} travel training records but all are theory-based — no practice sessions recorded. Independent travel cannot be learned solely through theory. The young person needs accompanied practice, progressing to observed and then independent practice. Is there a barrier to practice sessions (staffing, risk aversion, young person's anxiety)? CHR 2015 Reg 5 requires practical independence preparation`,
        });
      }
    }
  }

  // Medium: No essential journey skills covered
  for (const [, personRows] of personEngagementMap) {
    if (personRows.length >= 4) {
      const essentialCount = personRows.filter((r) => (ESSENTIAL_JOURNEY_SKILLS as string[]).includes(r.skill_area)).length;
      if (essentialCount === 0) {
        alerts.push({
          type: "no_essential_journeys",
          severity: "medium",
          message: `${personRows[0].young_person_name} has ${personRows.length} travel sessions but none focused on essential daily journeys (school, work, activities). While building general skills is valuable, the primary goal of travel training is enabling the young person to make their daily journeys independently. Are they able to get to school on their own? To work experience? To their activities? These functional journeys should be prioritised`,
        });
      }
    }
  }

  return alerts;
}

export function generateCaraInsights(
  rows: IndependentTravelRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const skillBreakdown = Object.entries(metrics.by_skill_area)
    .filter(([, count]) => count > 0)
    .map(([skill, count]) => `${skill}: ${count}`)
    .join(", ");

  const competencyBreakdown = Object.entries(metrics.by_competency_level)
    .filter(([, count]) => count > 0)
    .map(([level, count]) => `${level}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_records} travel training ${metrics.total_records === 1 ? "session" : "sessions"} ` +
      `for ${metrics.unique_young_people} young ${metrics.unique_young_people === 1 ? "person" : "people"}. ` +
      `Skills: ${skillBreakdown || "none recorded"}. ` +
      `Competency levels: ${competencyBreakdown || "none"}. ` +
      `Practice sessions: ${metrics.practice_session_count}. Theory: ${metrics.theory_session_count}. ` +
      `Road safety: ${metrics.road_safety_count}. Public transport: ${metrics.public_transport_count}. ` +
      `Essential journeys: ${metrics.essential_journey_count}. ` +
      `Engagement rate: ${metrics.engagement_rate}%. ` +
      `Competent/independent rate: ${metrics.competent_or_independent_rate}%. ` +
      `High confidence rate: ${metrics.high_confidence_rate}%. ` +
      `Average sessions per person: ${metrics.average_sessions_per_person}.`,
  );

  // Insight 2: Quality indicators and alerts
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts. ` +
        `Risk assessment rate: ${metrics.risk_assessment_rate}%. ` +
        `Emergency plan rate: ${metrics.emergency_plan_rate}%. ` +
        `Phone checked rate: ${metrics.phone_checked_rate}%. ` +
        `Money available rate: ${metrics.money_available_rate}%. ` +
        `Incident rate: ${metrics.incident_rate}%. ` +
        `Independent competency achieved: ${metrics.independent_competency_count} sessions. ` +
        `GPS tracking agreed rate: ${metrics.gps_tracking_agreed_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority travel training alerts. ` +
        `Risk assessment rate: ${metrics.risk_assessment_rate}%. ` +
        `Emergency plan rate: ${metrics.emergency_plan_rate}%. ` +
        `Incident rate: ${metrics.incident_rate}%. ` +
        `Continue building independence safely per CHR 2015 Reg 5.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.incident_rate > 20 && metrics.total_records > 5) {
    insights.push(
      `[reflect] Incident rate of ${metrics.incident_rate}% across travel training sessions. ` +
        `While some minor incidents are a normal part of learning (getting ` +
        `temporarily lost, missing a bus), a high rate suggests that young ` +
        `people may be progressing too quickly for their competency level. ` +
        `Are risk assessments adequately identifying hazards? Is the ` +
        `progression from accompanied to independent practice too rapid? ` +
        `Each incident should inform the next session — is the home ` +
        `adapting its approach based on what goes wrong?`,
    );
  } else if (metrics.competent_or_independent_rate < 30 && metrics.total_records > 8) {
    insights.push(
      `[reflect] Only ${metrics.competent_or_independent_rate}% of sessions result in competent ` +
        `or independent assessments. Independent travel is a critical ` +
        `life skill — young people leaving care who cannot travel ` +
        `independently face significant barriers to employment, education, ` +
        `and social life. CHR 2015 Reg 5 requires that homes prepare ` +
        `young people for independence. Is the training programme ` +
        `systematic enough? Are sessions frequent enough to build ` +
        `confidence? Are barriers (anxiety, SEND, past experiences) ` +
        `being addressed? Many care leavers report that they were not ` +
        `adequately prepared for basic independence skills.`,
    );
  } else if (metrics.practice_session_count < metrics.theory_session_count && metrics.total_records > 5) {
    insights.push(
      `[reflect] Theory sessions (${metrics.theory_session_count}) outnumber practice sessions ` +
        `(${metrics.practice_session_count}). Travel skills are fundamentally ` +
        `practical — they cannot be learned from a classroom alone. Young ` +
        `people need repeated, real-world practice with graduated support ` +
        `(accompanied, then observed, then independent). Is the home ` +
        `prioritising theory because practice is harder to resource ` +
        `(staffing for accompanied practice), or because of risk aversion? ` +
        `A young person who knows the theory but has never practised will ` +
        `not be confident when they need to travel alone.`,
    );
  } else {
    insights.push(
      `[reflect] How does the home ensure that travel training is ` +
        `individualised and progressive? CHR 2015 Reg 5 requires ` +
        `independence preparation tailored to the young person. Some ` +
        `young people will progress quickly; others (particularly those ` +
        `with anxiety, autism, learning disabilities, or trauma) may need ` +
        `many more sessions at each stage. Is there a documented travel ` +
        `training plan for each young person that maps their current ` +
        `competencies, target journeys, and progression steps? Are ` +
        `achievements celebrated? Is the young person's growing ` +
        `independence recognised as a positive outcome?`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    skillArea?: SkillArea;
    competencyLevel?: CompetencyLevel;
    limit?: number;
  },
): Promise<ServiceResult<IndependentTravelRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_independent_travel") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.skillArea) q = q.eq("skill_area", filters.skillArea);
  if (filters?.competencyLevel) q = q.eq("competency_level", filters.competencyLevel);

  q = q.order("session_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<IndependentTravelRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_independent_travel") as SB)
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
  supportingStaff: string;
  skillArea: SkillArea;
  deliveryMethod: DeliveryMethod;
  routeDescription?: string | null;
  competencyLevel?: CompetencyLevel;
  riskAssessmentCompleted?: boolean;
  youngPersonEngaged?: boolean;
  gpsTrackingAgreed?: boolean | null;
  emergencyPlanInPlace?: boolean;
  phoneChargedChecked?: boolean;
  moneyAvailable?: boolean;
  idCarried?: boolean | null;
  confidenceLevel?: ConfidenceLevel;
  incidentOccurred?: boolean;
  incidentDetails?: string | null;
  nextSessionDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<IndependentTravelRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateIndependentTravel({
    youngPersonName: input.youngPersonName,
    sessionDate: input.sessionDate,
    supportingStaff: input.supportingStaff,
    skillArea: input.skillArea,
    deliveryMethod: input.deliveryMethod,
    competencyLevel: input.competencyLevel,
    confidenceLevel: input.confidenceLevel,
    riskAssessmentCompleted: input.riskAssessmentCompleted,
    youngPersonEngaged: input.youngPersonEngaged,
    emergencyPlanInPlace: input.emergencyPlanInPlace,
    phoneChargedChecked: input.phoneChargedChecked,
    moneyAvailable: input.moneyAvailable,
    incidentOccurred: input.incidentOccurred,
    incidentDetails: input.incidentDetails,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_independent_travel") as SB)
    .insert({
      home_id: input.homeId,
      young_person_name: input.youngPersonName,
      session_date: input.sessionDate,
      supporting_staff: input.supportingStaff,
      skill_area: input.skillArea,
      delivery_method: input.deliveryMethod,
      route_description: input.routeDescription ?? null,
      competency_level: input.competencyLevel ?? "Not Ready",
      risk_assessment_completed: input.riskAssessmentCompleted ?? false,
      young_person_engaged: input.youngPersonEngaged ?? false,
      gps_tracking_agreed: input.gpsTrackingAgreed ?? null,
      emergency_plan_in_place: input.emergencyPlanInPlace ?? false,
      phone_charged_checked: input.phoneChargedChecked ?? false,
      money_available: input.moneyAvailable ?? false,
      id_carried: input.idCarried ?? null,
      confidence_level: input.confidenceLevel ?? "Medium",
      incident_occurred: input.incidentOccurred ?? false,
      incident_details: input.incidentDetails ?? null,
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
    supportingStaff: string;
    skillArea: SkillArea;
    deliveryMethod: DeliveryMethod;
    routeDescription: string | null;
    competencyLevel: CompetencyLevel;
    riskAssessmentCompleted: boolean;
    youngPersonEngaged: boolean;
    gpsTrackingAgreed: boolean | null;
    emergencyPlanInPlace: boolean;
    phoneChargedChecked: boolean;
    moneyAvailable: boolean;
    idCarried: boolean | null;
    confidenceLevel: ConfidenceLevel;
    incidentOccurred: boolean;
    incidentDetails: string | null;
    nextSessionDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<IndependentTravelRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.youngPersonName !== undefined) mapped.young_person_name = updates.youngPersonName;
  if (updates.sessionDate !== undefined) mapped.session_date = updates.sessionDate;
  if (updates.supportingStaff !== undefined) mapped.supporting_staff = updates.supportingStaff;
  if (updates.skillArea !== undefined) mapped.skill_area = updates.skillArea;
  if (updates.deliveryMethod !== undefined) mapped.delivery_method = updates.deliveryMethod;
  if (updates.routeDescription !== undefined) mapped.route_description = updates.routeDescription;
  if (updates.competencyLevel !== undefined) mapped.competency_level = updates.competencyLevel;
  if (updates.riskAssessmentCompleted !== undefined) mapped.risk_assessment_completed = updates.riskAssessmentCompleted;
  if (updates.youngPersonEngaged !== undefined) mapped.young_person_engaged = updates.youngPersonEngaged;
  if (updates.gpsTrackingAgreed !== undefined) mapped.gps_tracking_agreed = updates.gpsTrackingAgreed;
  if (updates.emergencyPlanInPlace !== undefined) mapped.emergency_plan_in_place = updates.emergencyPlanInPlace;
  if (updates.phoneChargedChecked !== undefined) mapped.phone_charged_checked = updates.phoneChargedChecked;
  if (updates.moneyAvailable !== undefined) mapped.money_available = updates.moneyAvailable;
  if (updates.idCarried !== undefined) mapped.id_carried = updates.idCarried;
  if (updates.confidenceLevel !== undefined) mapped.confidence_level = updates.confidenceLevel;
  if (updates.incidentOccurred !== undefined) mapped.incident_occurred = updates.incidentOccurred;
  if (updates.incidentDetails !== undefined) mapped.incident_details = updates.incidentDetails;
  if (updates.nextSessionDate !== undefined) mapped.next_session_date = updates.nextSessionDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_independent_travel") as SB)
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

  const { error } = await (client.from("cs_independent_travel") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
