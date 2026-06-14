// ==============================================================================
// CARA -- COUNTY LINES & CRIMINAL EXPLOITATION INTELLIGENCE SERVICE
// Tracks intelligence records, risk assessments, NRM referrals, safety plans,
// police liaison, peer mapping, contextual safeguarding, and disruption
// activities for children at risk of county lines and criminal exploitation.
//
// Covers: Intelligence type classification, risk level tracking, exploitation
// indicator monitoring (travel patterns, new possessions, phone activity,
// missing episodes, peer associations, drug concerns, debt bondage, violence),
// NRM referral management, police notification, multi-agency coordination,
// safety planning, disruption activities, child voice capture, outcome
// tracking, and status management.
//
// UK Regulatory Framework:
// CHR 2015 Reg 12 (protection of children from harm),
// CHR 2015 Reg 34 (behaviour management),
// Serious Violence Duty 2022,
// Home Office County Lines guidance 2023,
// Modern Slavery Act 2015 (National Referral Mechanism),
// Working Together to Safeguard Children 2023,
// Contextual Safeguarding framework.
//
// SCCIF: Safety -- "The home protects children from criminal exploitation
// and county lines." Ofsted expects robust intelligence gathering, prompt
// NRM referrals, multi-agency working, safety planning, and evidence that
// the child's voice informs all exploitation-related decisions.
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const INTELLIGENCE_TYPES = [
  "Risk Assessment",
  "Concern Report",
  "Intelligence Log",
  "NRM Referral",
  "Strategy Meeting",
  "Safety Plan",
  "Police Liaison",
  "Peer Mapping",
  "Contextual Safeguarding",
  "Review",
] as const;
export type IntelligenceType = (typeof INTELLIGENCE_TYPES)[number];

export const RISK_LEVELS = [
  "Low",
  "Medium",
  "High",
  "Critical",
] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const OUTCOMES = [
  "Ongoing Monitoring",
  "Escalated",
  "De-Escalated",
  "NRM Accepted",
  "NRM Rejected",
  "Exited Exploitation",
  "Relocated",
  "Closed",
] as const;
export type Outcome = (typeof OUTCOMES)[number];

export const STATUSES = [
  "Active",
  "Under Review",
  "Archived",
] as const;
export type Status = (typeof STATUSES)[number];

// -- Label maps ---------------------------------------------------------------

export const INTELLIGENCE_TYPE_LABELS: { type: IntelligenceType; label: string }[] = [
  { type: "Risk Assessment", label: "Risk Assessment" },
  { type: "Concern Report", label: "Concern Report" },
  { type: "Intelligence Log", label: "Intelligence Log" },
  { type: "NRM Referral", label: "NRM Referral (National Referral Mechanism)" },
  { type: "Strategy Meeting", label: "Strategy Meeting" },
  { type: "Safety Plan", label: "Safety Plan" },
  { type: "Police Liaison", label: "Police Liaison" },
  { type: "Peer Mapping", label: "Peer Mapping" },
  { type: "Contextual Safeguarding", label: "Contextual Safeguarding Assessment" },
  { type: "Review", label: "Review" },
];

export const RISK_LEVEL_LABELS: { level: RiskLevel; label: string }[] = [
  { level: "Low", label: "Low Risk" },
  { level: "Medium", label: "Medium Risk" },
  { level: "High", label: "High Risk" },
  { level: "Critical", label: "Critical Risk" },
];

export const OUTCOME_LABELS: { outcome: Outcome; label: string }[] = [
  { outcome: "Ongoing Monitoring", label: "Ongoing Monitoring" },
  { outcome: "Escalated", label: "Escalated" },
  { outcome: "De-Escalated", label: "De-Escalated" },
  { outcome: "NRM Accepted", label: "NRM Accepted" },
  { outcome: "NRM Rejected", label: "NRM Rejected" },
  { outcome: "Exited Exploitation", label: "Exited Exploitation" },
  { outcome: "Relocated", label: "Relocated" },
  { outcome: "Closed", label: "Closed" },
];

export const STATUS_LABELS: { status: Status; label: string }[] = [
  { status: "Active", label: "Active" },
  { status: "Under Review", label: "Under Review" },
  { status: "Archived", label: "Archived" },
];

// -- Exploitation indicator labels --------------------------------------------

export const INDICATOR_LABELS: { key: string; label: string; description: string }[] = [
  { key: "travel_patterns_noted", label: "Travel Patterns", description: "Unexplained travel, journeys to unfamiliar areas, use of taxis/rail" },
  { key: "new_possessions_noted", label: "New Possessions", description: "Unexplained new clothing, phones, jewellery, or money" },
  { key: "phone_activity_concerns", label: "Phone Activity", description: "Multiple phones, secretive calls, burner phones, increased social media contact" },
  { key: "missing_episodes_linked", label: "Missing Episodes", description: "Going missing from home linked to exploitation patterns" },
  { key: "peer_association_concerns", label: "Peer Associations", description: "New associations with older or unknown peers, gang affiliations" },
  { key: "drug_related_concerns", label: "Drug-Related Concerns", description: "Involvement in drug supply, carrying drugs, drug paraphernalia" },
  { key: "debt_bondage_suspected", label: "Debt Bondage", description: "Suspected debt owed to exploiters, working off debts" },
  { key: "violence_intimidation_present", label: "Violence/Intimidation", description: "Evidence of threats, injuries, fear, or coercive control" },
];

// -- Row type -----------------------------------------------------------------

export interface CountyLinesIntelligenceRow {
  id: string;
  home_id: string;
  child_name: string;
  assessment_date: string;
  assessor_name: string;
  intelligence_type: IntelligenceType;
  risk_level: RiskLevel;
  indicators_present: string;
  travel_patterns_noted: boolean;
  new_possessions_noted: boolean;
  phone_activity_concerns: boolean;
  missing_episodes_linked: boolean;
  peer_association_concerns: boolean;
  drug_related_concerns: boolean;
  debt_bondage_suspected: boolean;
  violence_intimidation_present: boolean;
  nrm_referral_made: boolean;
  nrm_referral_date: string | null;
  police_notified: boolean;
  social_worker_informed: boolean;
  multi_agency_meeting_held: boolean;
  safety_plan_in_place: boolean;
  disruption_activity: string | null;
  child_views_obtained: boolean;
  outcome: Outcome;
  status: Status;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateCountyLinesIntelligence(input: {
  childName?: string;
  assessmentDate?: string;
  assessorName?: string;
  intelligenceType?: string;
  riskLevel?: string;
  indicatorsPresent?: string;
  outcome?: string;
  status?: string;
  nrmReferralMade?: boolean;
  nrmReferralDate?: string | null;
  specialistReferralMade?: boolean;
  specialistService?: string | null;
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
  if (!input.assessorName || input.assessorName.trim().length === 0) {
    errors.push("Assessor name is required");
  }
  if (!input.intelligenceType || !(INTELLIGENCE_TYPES as readonly string[]).includes(input.intelligenceType)) {
    errors.push(`Intelligence type must be one of: ${INTELLIGENCE_TYPES.join(", ")}`);
  }
  if (!input.riskLevel || !(RISK_LEVELS as readonly string[]).includes(input.riskLevel)) {
    errors.push(`Risk level must be one of: ${RISK_LEVELS.join(", ")}`);
  }
  if (!input.indicatorsPresent || input.indicatorsPresent.trim().length === 0) {
    errors.push("Indicators present is required — describe observed exploitation indicators");
  }
  if (!input.outcome || !(OUTCOMES as readonly string[]).includes(input.outcome)) {
    errors.push(`Outcome must be one of: ${OUTCOMES.join(", ")}`);
  }
  if (input.status && !(STATUSES as readonly string[]).includes(input.status)) {
    errors.push(`Status must be one of: ${STATUSES.join(", ")}`);
  }

  // Business rule: NRM referral date required when NRM referral made
  if (input.nrmReferralMade && !input.nrmReferralDate) {
    errors.push("NRM referral date is required when an NRM referral has been made");
  }
  if (input.nrmReferralDate) {
    const nrmDate = new Date(input.nrmReferralDate);
    if (isNaN(nrmDate.getTime())) {
      errors.push("NRM referral date must be a valid date");
    } else if (nrmDate > new Date()) {
      errors.push("NRM referral date cannot be in the future");
    }
  }

  // Business rule: NRM referral type should have NRM referral made flag
  if (input.intelligenceType === "NRM Referral" && !input.nrmReferralMade) {
    errors.push("NRM referral made flag should be true when intelligence type is NRM Referral");
  }

  // Business rule: critical risk should have indicators documented
  if (input.riskLevel === "Critical" && input.indicatorsPresent && input.indicatorsPresent.trim().length < 20) {
    errors.push("Critical risk assessments require detailed indicator documentation (minimum 20 characters)");
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: CountyLinesIntelligenceRow[],
): {
  total_records: number;
  high_risk_count: number;
  critical_count: number;
  high_critical_count: number;
  nrm_referral_rate: number;
  safety_plan_rate: number;
  police_notification_rate: number;
  multi_agency_rate: number;
  social_worker_informed_rate: number;
  child_views_rate: number;
  unique_children: number;
  unique_assessors: number;
  active_cases: number;
  by_intelligence_type: Record<string, number>;
  by_outcome: Record<string, number>;
  by_risk_level: Record<string, number>;
  travel_patterns_rate: number;
  new_possessions_rate: number;
  phone_activity_rate: number;
  missing_episodes_rate: number;
  peer_association_rate: number;
  drug_related_rate: number;
  debt_bondage_rate: number;
  violence_intimidation_rate: number;
  average_indicators_per_record: number;
  disruption_activity_rate: number;
  nrm_accepted_count: number;
  escalation_rate: number;
} {
  const total = rows.length;

  const highRisk = rows.filter((r) => r.risk_level === "High").length;
  const criticalCount = rows.filter((r) => r.risk_level === "Critical").length;

  const boolRate = (field: keyof CountyLinesIntelligenceRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
  };

  const uniqueChildren = new Set(rows.map((r) => r.child_name)).size;
  const uniqueAssessors = new Set(rows.map((r) => r.assessor_name)).size;
  const activeCases = rows.filter((r) => r.status === "Active").length;

  // Intelligence type breakdown
  const byIntelligenceType: Record<string, number> = {};
  for (const it of INTELLIGENCE_TYPES) byIntelligenceType[it] = 0;
  for (const r of rows) byIntelligenceType[r.intelligence_type] = (byIntelligenceType[r.intelligence_type] || 0) + 1;

  // Outcome breakdown
  const byOutcome: Record<string, number> = {};
  for (const o of OUTCOMES) byOutcome[o] = 0;
  for (const r of rows) byOutcome[r.outcome] = (byOutcome[r.outcome] || 0) + 1;

  // Risk level breakdown
  const byRiskLevel: Record<string, number> = {};
  for (const rl of RISK_LEVELS) byRiskLevel[rl] = 0;
  for (const r of rows) byRiskLevel[r.risk_level] = (byRiskLevel[r.risk_level] || 0) + 1;

  // Count exploitation indicators per record
  const indicatorFields: (keyof CountyLinesIntelligenceRow)[] = [
    "travel_patterns_noted", "new_possessions_noted", "phone_activity_concerns",
    "missing_episodes_linked", "peer_association_concerns", "drug_related_concerns",
    "debt_bondage_suspected", "violence_intimidation_present",
  ];
  let totalIndicators = 0;
  for (const r of rows) {
    for (const f of indicatorFields) {
      if (r[f] === true) totalIndicators++;
    }
  }
  const avgIndicators = total > 0 ? Math.round((totalIndicators / total) * 10) / 10 : 0;

  // Disruption activity rate
  const disrupted = rows.filter((r) => r.disruption_activity && r.disruption_activity.trim().length > 0).length;
  const disruptionRate = total > 0 ? Math.round((disrupted / total) * 1000) / 10 : 0;

  // NRM accepted count
  const nrmAccepted = rows.filter((r) => r.outcome === "NRM Accepted").length;

  // Escalation rate
  const escalated = rows.filter((r) => r.outcome === "Escalated").length;
  const escalationRate = total > 0 ? Math.round((escalated / total) * 1000) / 10 : 0;

  return {
    total_records: total,
    high_risk_count: highRisk,
    critical_count: criticalCount,
    high_critical_count: highRisk + criticalCount,
    nrm_referral_rate: boolRate("nrm_referral_made"),
    safety_plan_rate: boolRate("safety_plan_in_place"),
    police_notification_rate: boolRate("police_notified"),
    multi_agency_rate: boolRate("multi_agency_meeting_held"),
    social_worker_informed_rate: boolRate("social_worker_informed"),
    child_views_rate: boolRate("child_views_obtained"),
    unique_children: uniqueChildren,
    unique_assessors: uniqueAssessors,
    active_cases: activeCases,
    by_intelligence_type: byIntelligenceType,
    by_outcome: byOutcome,
    by_risk_level: byRiskLevel,
    travel_patterns_rate: boolRate("travel_patterns_noted"),
    new_possessions_rate: boolRate("new_possessions_noted"),
    phone_activity_rate: boolRate("phone_activity_concerns"),
    missing_episodes_rate: boolRate("missing_episodes_linked"),
    peer_association_rate: boolRate("peer_association_concerns"),
    drug_related_rate: boolRate("drug_related_concerns"),
    debt_bondage_rate: boolRate("debt_bondage_suspected"),
    violence_intimidation_rate: boolRate("violence_intimidation_present"),
    average_indicators_per_record: avgIndicators,
    disruption_activity_rate: disruptionRate,
    nrm_accepted_count: nrmAccepted,
    escalation_rate: escalationRate,
  };
}

export function computeAlerts(
  rows: CountyLinesIntelligenceRow[],
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

  // Critical: critical risk with no safety plan
  for (const r of rows) {
    if (r.risk_level === "Critical" && !r.safety_plan_in_place && r.status === "Active") {
      alerts.push({
        type: "critical_no_safety_plan",
        severity: "critical",
        message: `${r.child_name} has Critical county lines risk with no safety plan — immediate multi-agency safety planning required per Home Office County Lines guidance 2023`,
        record_id: r.id,
      });
    }
  }

  // Critical: debt bondage or violence with no police notification
  for (const r of rows) {
    if ((r.debt_bondage_suspected || r.violence_intimidation_present) && !r.police_notified && r.status === "Active") {
      alerts.push({
        type: "exploitation_no_police",
        severity: "critical",
        message: `${r.child_name} has suspected ${r.debt_bondage_suspected ? "debt bondage" : "violence/intimidation"} but police have not been notified — urgent police referral required under Modern Slavery Act 2015`,
        record_id: r.id,
      });
    }
  }

  // Critical: critical risk with no NRM referral considered
  for (const r of rows) {
    if (r.risk_level === "Critical" && !r.nrm_referral_made && r.status === "Active") {
      alerts.push({
        type: "critical_no_nrm",
        severity: "critical",
        message: `${r.child_name} is at Critical exploitation risk but no NRM referral has been made — consider immediate NRM referral under Modern Slavery Act 2015`,
        record_id: r.id,
      });
    }
  }

  // High: high risk with no multi-agency meeting
  for (const r of rows) {
    if ((r.risk_level === "High" || r.risk_level === "Critical") && !r.multi_agency_meeting_held && r.status === "Active") {
      alerts.push({
        type: "high_risk_no_multi_agency",
        severity: "high",
        message: `${r.child_name} has ${r.risk_level} county lines risk but no multi-agency meeting has been held — convene strategy meeting per Working Together 2023`,
        record_id: r.id,
      });
    }
  }

  // High: missing episodes linked to exploitation with no social worker informed
  for (const r of rows) {
    if (r.missing_episodes_linked && !r.social_worker_informed && r.status === "Active") {
      alerts.push({
        type: "missing_no_sw",
        severity: "high",
        message: `${r.child_name} has missing episodes linked to exploitation but social worker not informed — immediate notification required`,
        record_id: r.id,
      });
    }
  }

  // High: child views not obtained on high/critical risk cases
  for (const r of rows) {
    if ((r.risk_level === "High" || r.risk_level === "Critical") && !r.child_views_obtained && r.status === "Active") {
      alerts.push({
        type: "no_child_voice",
        severity: "high",
        message: `${r.child_name} has ${r.risk_level} exploitation risk but child views have not been obtained — Ofsted SCCIF requires evidence of the child's voice in exploitation decisions`,
        record_id: r.id,
      });
    }
  }

  // High: multiple indicators (4+) with no disruption activity
  for (const r of rows) {
    const indicatorCount = [
      r.travel_patterns_noted, r.new_possessions_noted, r.phone_activity_concerns,
      r.missing_episodes_linked, r.peer_association_concerns, r.drug_related_concerns,
      r.debt_bondage_suspected, r.violence_intimidation_present,
    ].filter(Boolean).length;
    if (indicatorCount >= 4 && (!r.disruption_activity || r.disruption_activity.trim().length === 0) && r.status === "Active") {
      alerts.push({
        type: "multiple_indicators_no_disruption",
        severity: "high",
        message: `${r.child_name} has ${indicatorCount} exploitation indicators present but no disruption activity recorded — proactive disruption measures should be in place`,
        record_id: r.id,
      });
    }
  }

  // Medium: drug-related concerns without police liaison
  for (const r of rows) {
    if (r.drug_related_concerns && !r.police_notified && r.status === "Active" && r.risk_level !== "Critical") {
      alerts.push({
        type: "drug_concerns_no_police",
        severity: "medium",
        message: `${r.child_name} has drug-related concerns linked to exploitation — consider whether police liaison is needed per Serious Violence Duty 2022`,
        record_id: r.id,
      });
    }
  }

  // Medium: NRM rejected — review safety plan
  for (const r of rows) {
    if (r.outcome === "NRM Rejected" && r.status === "Active") {
      alerts.push({
        type: "nrm_rejected_review",
        severity: "medium",
        message: `NRM referral for ${r.child_name} was rejected — review safety plan and consider whether further evidence supports a fresh referral or alternative safeguarding measures`,
        record_id: r.id,
      });
    }
  }

  // Medium: active case with peer association and travel concerns combined
  for (const r of rows) {
    if (r.peer_association_concerns && r.travel_patterns_noted && r.status === "Active" && r.risk_level === "Medium") {
      alerts.push({
        type: "peer_travel_combined",
        severity: "medium",
        message: `${r.child_name} has combined peer association and travel pattern concerns — contextual safeguarding assessment recommended to map external risks`,
        record_id: r.id,
      });
    }
  }

  return alerts;
}

export function generateCaraInsights(
  rows: CountyLinesIntelligenceRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  insights.push(
    `[sky] ${metrics.total_records} county lines intelligence ${metrics.total_records === 1 ? "record" : "records"} across ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `${metrics.active_cases} active ${metrics.active_cases === 1 ? "case" : "cases"}. ` +
      `${metrics.high_risk_count} at High risk, ${metrics.critical_count} at Critical risk. ` +
      `NRM referral rate: ${metrics.nrm_referral_rate}%. ` +
      `Safety plan rate: ${metrics.safety_plan_rate}%. ` +
      `Police notification rate: ${metrics.police_notification_rate}%.`,
  );

  // Insight 2: Indicator analysis and priority concerns
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    // Find most prevalent indicator
    const indicatorRates = [
      { name: "travel patterns", rate: metrics.travel_patterns_rate },
      { name: "new possessions", rate: metrics.new_possessions_rate },
      { name: "phone activity", rate: metrics.phone_activity_rate },
      { name: "missing episodes", rate: metrics.missing_episodes_rate },
      { name: "peer associations", rate: metrics.peer_association_rate },
      { name: "drug-related", rate: metrics.drug_related_rate },
      { name: "debt bondage", rate: metrics.debt_bondage_rate },
      { name: "violence/intimidation", rate: metrics.violence_intimidation_rate },
    ].sort((a, b) => b.rate - a.rate);
    const topIndicator = indicatorRates[0];

    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority exploitation alerts active. ` +
        `Most prevalent indicator: ${topIndicator.name} (${topIndicator.rate}%). ` +
        `Average indicators per record: ${metrics.average_indicators_per_record}. ` +
        `Multi-agency meeting rate: ${metrics.multi_agency_rate}%. ` +
        `Child views obtained: ${metrics.child_views_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority county lines alerts currently active. ` +
        `Disruption activity rate: ${metrics.disruption_activity_rate}%. ` +
        `Multi-agency meeting rate: ${metrics.multi_agency_rate}%. ` +
        `Continue contextual safeguarding vigilance per Home Office guidance 2023.`,
    );
  }

  // Insight 3: Reflective safeguarding question
  if (metrics.critical_count > 0 && metrics.child_views_rate < 80) {
    insights.push(
      `[reflect] ${metrics.child_views_rate}% of records include the child's voice. ` +
        `With ${metrics.critical_count} critical ${metrics.critical_count === 1 ? "case" : "cases"}, ` +
        `are staff using trauma-informed, non-blaming approaches to capture the child's ` +
        `perspective on their exploitation, and is this informing safety planning ` +
        `as required by the SCCIF inspection framework?`,
    );
  } else if (metrics.nrm_referral_rate < 50 && metrics.high_critical_count > 0) {
    insights.push(
      `[reflect] NRM referral rate is ${metrics.nrm_referral_rate}% with ${metrics.high_critical_count} ` +
        `high/critical risk ${metrics.high_critical_count === 1 ? "case" : "cases"}. ` +
        `Is the home applying the Modern Slavery Act 2015 'duty to notify' threshold ` +
        `consistently, and are all staff trained in recognising when an NRM referral ` +
        `is appropriate for criminally exploited children?`,
    );
  } else if (metrics.average_indicators_per_record > 3) {
    insights.push(
      `[reflect] Average of ${metrics.average_indicators_per_record} exploitation indicators per record suggests ` +
        `children may be deeply embedded in county lines networks. Are disruption strategies ` +
        `(${metrics.disruption_activity_rate}% rate) targeting the external context as well as ` +
        `individual children, and is the Serious Violence Duty 2022 informing ` +
        `partnership responses with police and local authority?`,
    );
  } else {
    insights.push(
      `[reflect] Are staff trained to distinguish between typical adolescent ` +
        `risk-taking and criminal exploitation indicators? Is contextual safeguarding ` +
        `informing the home's understanding of the external environment, ` +
        `and are peer mapping exercises being used to identify exploitation networks ` +
        `per Home Office County Lines guidance 2023?`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listCountyLinesIntelligence(
  homeId: string,
  filters?: {
    intelligenceType?: IntelligenceType;
    riskLevel?: RiskLevel;
    outcome?: Outcome;
    status?: Status;
    limit?: number;
  },
): Promise<ServiceResult<CountyLinesIntelligenceRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_county_lines_intelligence") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.intelligenceType) q = q.eq("intelligence_type", filters.intelligenceType);
  if (filters?.riskLevel) q = q.eq("risk_level", filters.riskLevel);
  if (filters?.outcome) q = q.eq("outcome", filters.outcome);
  if (filters?.status) q = q.eq("status", filters.status);

  q = q.order("assessment_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getCountyLinesIntelligence(
  id: string,
): Promise<ServiceResult<CountyLinesIntelligenceRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_county_lines_intelligence") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createCountyLinesIntelligence(input: {
  homeId: string;
  childName: string;
  assessmentDate: string;
  assessorName: string;
  intelligenceType: IntelligenceType;
  riskLevel: RiskLevel;
  indicatorsPresent: string;
  travelPatternsNoted?: boolean;
  newPossessionsNoted?: boolean;
  phoneActivityConcerns?: boolean;
  missingEpisodesLinked?: boolean;
  peerAssociationConcerns?: boolean;
  drugRelatedConcerns?: boolean;
  debtBondageSuspected?: boolean;
  violenceIntimidationPresent?: boolean;
  nrmReferralMade?: boolean;
  nrmReferralDate?: string | null;
  policeNotified?: boolean;
  socialWorkerInformed?: boolean;
  multiAgencyMeetingHeld?: boolean;
  safetyPlanInPlace?: boolean;
  disruptionActivity?: string | null;
  childViewsObtained?: boolean;
  outcome: Outcome;
  status?: Status;
  notes?: string | null;
}): Promise<ServiceResult<CountyLinesIntelligenceRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateCountyLinesIntelligence({
    childName: input.childName,
    assessmentDate: input.assessmentDate,
    assessorName: input.assessorName,
    intelligenceType: input.intelligenceType,
    riskLevel: input.riskLevel,
    indicatorsPresent: input.indicatorsPresent,
    outcome: input.outcome,
    status: input.status,
    nrmReferralMade: input.nrmReferralMade,
    nrmReferralDate: input.nrmReferralDate,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_county_lines_intelligence") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      assessment_date: input.assessmentDate,
      assessor_name: input.assessorName,
      intelligence_type: input.intelligenceType,
      risk_level: input.riskLevel,
      indicators_present: input.indicatorsPresent,
      travel_patterns_noted: input.travelPatternsNoted ?? false,
      new_possessions_noted: input.newPossessionsNoted ?? false,
      phone_activity_concerns: input.phoneActivityConcerns ?? false,
      missing_episodes_linked: input.missingEpisodesLinked ?? false,
      peer_association_concerns: input.peerAssociationConcerns ?? false,
      drug_related_concerns: input.drugRelatedConcerns ?? false,
      debt_bondage_suspected: input.debtBondageSuspected ?? false,
      violence_intimidation_present: input.violenceIntimidationPresent ?? false,
      nrm_referral_made: input.nrmReferralMade ?? false,
      nrm_referral_date: input.nrmReferralDate ?? null,
      police_notified: input.policeNotified ?? false,
      social_worker_informed: input.socialWorkerInformed ?? false,
      multi_agency_meeting_held: input.multiAgencyMeetingHeld ?? false,
      safety_plan_in_place: input.safetyPlanInPlace ?? false,
      disruption_activity: input.disruptionActivity ?? null,
      child_views_obtained: input.childViewsObtained ?? false,
      outcome: input.outcome,
      status: input.status ?? "Active",
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateCountyLinesIntelligence(
  id: string,
  updates: Partial<{
    childName: string;
    assessmentDate: string;
    assessorName: string;
    intelligenceType: IntelligenceType;
    riskLevel: RiskLevel;
    indicatorsPresent: string;
    travelPatternsNoted: boolean;
    newPossessionsNoted: boolean;
    phoneActivityConcerns: boolean;
    missingEpisodesLinked: boolean;
    peerAssociationConcerns: boolean;
    drugRelatedConcerns: boolean;
    debtBondageSuspected: boolean;
    violenceIntimidationPresent: boolean;
    nrmReferralMade: boolean;
    nrmReferralDate: string | null;
    policeNotified: boolean;
    socialWorkerInformed: boolean;
    multiAgencyMeetingHeld: boolean;
    safetyPlanInPlace: boolean;
    disruptionActivity: string | null;
    childViewsObtained: boolean;
    outcome: Outcome;
    status: Status;
    notes: string | null;
  }>,
): Promise<ServiceResult<CountyLinesIntelligenceRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.assessmentDate !== undefined) mapped.assessment_date = updates.assessmentDate;
  if (updates.assessorName !== undefined) mapped.assessor_name = updates.assessorName;
  if (updates.intelligenceType !== undefined) mapped.intelligence_type = updates.intelligenceType;
  if (updates.riskLevel !== undefined) mapped.risk_level = updates.riskLevel;
  if (updates.indicatorsPresent !== undefined) mapped.indicators_present = updates.indicatorsPresent;
  if (updates.travelPatternsNoted !== undefined) mapped.travel_patterns_noted = updates.travelPatternsNoted;
  if (updates.newPossessionsNoted !== undefined) mapped.new_possessions_noted = updates.newPossessionsNoted;
  if (updates.phoneActivityConcerns !== undefined) mapped.phone_activity_concerns = updates.phoneActivityConcerns;
  if (updates.missingEpisodesLinked !== undefined) mapped.missing_episodes_linked = updates.missingEpisodesLinked;
  if (updates.peerAssociationConcerns !== undefined) mapped.peer_association_concerns = updates.peerAssociationConcerns;
  if (updates.drugRelatedConcerns !== undefined) mapped.drug_related_concerns = updates.drugRelatedConcerns;
  if (updates.debtBondageSuspected !== undefined) mapped.debt_bondage_suspected = updates.debtBondageSuspected;
  if (updates.violenceIntimidationPresent !== undefined) mapped.violence_intimidation_present = updates.violenceIntimidationPresent;
  if (updates.nrmReferralMade !== undefined) mapped.nrm_referral_made = updates.nrmReferralMade;
  if (updates.nrmReferralDate !== undefined) mapped.nrm_referral_date = updates.nrmReferralDate;
  if (updates.policeNotified !== undefined) mapped.police_notified = updates.policeNotified;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.multiAgencyMeetingHeld !== undefined) mapped.multi_agency_meeting_held = updates.multiAgencyMeetingHeld;
  if (updates.safetyPlanInPlace !== undefined) mapped.safety_plan_in_place = updates.safetyPlanInPlace;
  if (updates.disruptionActivity !== undefined) mapped.disruption_activity = updates.disruptionActivity;
  if (updates.childViewsObtained !== undefined) mapped.child_views_obtained = updates.childViewsObtained;
  if (updates.outcome !== undefined) mapped.outcome = updates.outcome;
  if (updates.status !== undefined) mapped.status = updates.status;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_county_lines_intelligence") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteCountyLinesIntelligence(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { error } = await (client.from("cs_county_lines_intelligence") as SB)
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
  validateCountyLinesIntelligence,
};
