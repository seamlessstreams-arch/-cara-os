// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RISK INTELLIGENCE DASHBOARD ENGINE
//
// Home-level cross-cutting risk aggregation. Unifies risk assessments,
// exploitation screenings, missing episodes, incidents, restraints, and
// significant events into a single risk landscape for the Registered Manager.
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Injectable `today` parameter for deterministic testing.
//
// Regulatory: CHR 2015 Reg 12 (protection of children), Reg 34 (missing),
// Reg 35 (behaviour), Reg 40 (notifications), Reg 13 (safeguarding).
// SCCIF: "How well children are helped and protected."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export type RiskLevel = "very_high" | "high" | "medium" | "low" | "minimal";
export type ExploitationType = "cse" | "cce" | "online_exploitation" | "radicalisation" | "peer_on_peer" | string;
export type IncidentSeverity = "critical" | "high" | "medium" | "low";
export type IncidentType =
  | "safeguarding_concern" | "missing_from_care" | "physical_intervention"
  | "self_harm" | "damage_to_property" | "complaint" | "medication_error"
  | "allegation" | "police_involvement" | "hospital_attendance"
  | "behaviour_incident" | "contextual_safeguarding" | "exploitation_concern"
  | "bullying" | "online_safety" | "other";

export interface RiskAssessmentInput {
  id: string;
  child_id: string;
  child_name: string;
  domain: string;
  current_level: RiskLevel;
  previous_level: RiskLevel;
  trend: "increasing" | "stable" | "decreasing";
  status: string;
  assessed_date: string;
  review_date: string;
  has_child_views: boolean;
  has_contingency_plan: boolean;
  linked_incidents_count: number;
  mitigations: { strategy: string; effectiveness: string }[];
}

export interface ExploitationScreeningInput {
  id: string;
  child_id: string;
  child_name: string;
  date: string;
  exploitation_type: ExploitationType;
  risk_level: RiskLevel;
  previous_risk_level: RiskLevel | null;
  status: string;              // referred | monitoring | closed
  next_review_date: string;
  multi_agency_involved: string[];
  nrm_referral: boolean;
  safety_plan_in_place: boolean;
}

export interface MissingEpisodeInput {
  id: string;
  child_id: string;
  child_name: string;
  date: string;
  duration_hours: number;
  risk_level: string;
  return_interview_completed: boolean;
  contextual_safeguarding_risk: boolean;
  status: string;
}

export interface IncidentInput {
  id: string;
  child_id: string;
  child_name: string;
  date: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: string;
  requires_oversight: boolean;
  oversight_completed: boolean;
}

export interface RestraintInput {
  id: string;
  child_id: string;
  child_name: string;
  date: string;
  duration_minutes: number;
  reason: string;
  child_debriefed: boolean;
  staff_debriefed: boolean;
  review_status: string;
  injuries: number;
}

export interface SignificantEventInput {
  id: string;
  child_id: string;
  child_name: string;
  date: string;
  category: string;
  significance: string;
}

export interface ChildSummaryInput {
  id: string;
  name: string;
}

export interface RiskIntelligenceDashboardInput {
  today: string;
  children: ChildSummaryInput[];
  risk_assessments: RiskAssessmentInput[];
  exploitation_screenings: ExploitationScreeningInput[];
  missing_episodes: MissingEpisodeInput[];
  incidents: IncidentInput[];
  restraints: RestraintInput[];
  significant_events: SignificantEventInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type HomeRiskLevel = "critical" | "elevated" | "moderate" | "managed" | "low";

export interface RiskLandscapeOverview {
  home_risk_level: HomeRiskLevel;
  home_risk_score: number;          // 0-100 (100 = highest risk)
  total_active_risks: number;
  very_high_risks: number;
  high_risks: number;
  escalating_risks: number;
  overdue_reviews: number;
  children_at_risk: number;         // children with >=1 high/very_high assessment
  total_children: number;
}

export interface IncidentAnalysis {
  total_90d: number;
  total_30d: number;
  critical_30d: number;
  high_30d: number;
  safeguarding_30d: number;
  trend: "increasing" | "stable" | "decreasing";
  top_types: { type: string; count: number }[];
  open_incidents: number;
  unreviewed_oversight: number;
}

export interface ExploitationOverview {
  active_screenings: number;
  high_risk_children: number;
  cse_count: number;
  cce_count: number;
  online_count: number;
  other_count: number;
  nrm_referrals: number;
  overdue_reviews: number;
  multi_agency_engaged: boolean;
}

export interface MissingOverview {
  total_90d: number;
  total_30d: number;
  unique_children_30d: number;
  avg_duration_hours: number;
  return_interview_rate: number;   // 0-100
  cs_risk_episodes: number;
  repeat_missing: boolean;
}

export interface RestraintOverview {
  total_90d: number;
  total_30d: number;
  unique_children_90d: number;
  avg_duration_minutes: number;
  trend: "increasing" | "stable" | "decreasing";
  debrief_rate: number;            // 0-100 (child debriefed)
  injuries_count: number;
  unreviewed_count: number;
}

export interface ChildRiskProfile {
  child_id: string;
  child_name: string;
  risk_level: HomeRiskLevel;
  risk_score: number;              // 0-100
  active_risk_assessments: number;
  highest_risk_domain: string;
  highest_risk_level: RiskLevel;
  exploitation_risk: RiskLevel | null;
  missing_episodes_90d: number;
  incidents_90d: number;
  restraints_90d: number;
  escalating_domains: string[];
  flags: string[];
}

export interface RiskDomain {
  domain: string;
  children_affected: number;
  avg_level: number;               // 1-5
  trend_direction: "improving" | "stable" | "worsening";
}

export type RecommendationUrgency = "immediate" | "urgent" | "planned";

export interface RiskRecommendation {
  rank: number;
  recommendation: string;
  urgency: RecommendationUrgency;
  domain: string;
  regulatory_ref: string;
}

export interface RiskInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface RiskIntelligenceDashboardResult {
  generated_at: string;
  landscape: RiskLandscapeOverview;
  incident_analysis: IncidentAnalysis;
  exploitation_overview: ExploitationOverview;
  missing_overview: MissingOverview;
  restraint_overview: RestraintOverview;
  child_profiles: ChildRiskProfile[];
  risk_domains: RiskDomain[];
  strengths: string[];
  concerns: string[];
  recommendations: RiskRecommendation[];
  insights: RiskInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.round(
    Math.abs(new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

function daysAgo(today: string, date: string): number {
  return Math.round(
    (new Date(today).getTime() - new Date(date).getTime()) / 86_400_000,
  );
}

function isWithin(today: string, date: string, days: number): boolean {
  return daysAgo(today, date) >= 0 && daysAgo(today, date) <= days;
}

function isOverdue(today: string, reviewDate: string): boolean {
  return new Date(reviewDate).getTime() < new Date(today).getTime();
}

const RISK_LEVEL_SCORE: Record<RiskLevel, number> = {
  minimal: 1,
  low: 2,
  medium: 3,
  high: 4,
  very_high: 5,
};

function highestRiskLevel(levels: RiskLevel[]): RiskLevel {
  if (levels.length === 0) return "minimal";
  let best = 0;
  for (const l of levels) {
    const s = RISK_LEVEL_SCORE[l] ?? 0;
    if (s > best) best = s;
  }
  const map: Record<number, RiskLevel> = { 1: "minimal", 2: "low", 3: "medium", 4: "high", 5: "very_high" };
  return map[best] ?? "minimal";
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function pct(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 100;
}

const SEVERITY_SCORE: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

// ── Main Computation ────────────────────────────────────────────────────────

export function computeRiskIntelligenceDashboard(
  input: RiskIntelligenceDashboardInput,
): RiskIntelligenceDashboardResult {
  const { today, children, risk_assessments, exploitation_screenings, missing_episodes, incidents, restraints, significant_events } = input;

  // ── Temporal filters ──────────────────────────────────────────────────
  const currentAssessments = risk_assessments.filter((a) => a.status === "current");
  const activeScreenings = exploitation_screenings.filter((s) => s.status !== "closed");
  const missing90d = missing_episodes.filter((m) => isWithin(today, m.date, 90));
  const missing30d = missing_episodes.filter((m) => isWithin(today, m.date, 30));
  const incidents90d = incidents.filter((i) => isWithin(today, i.date, 90));
  const incidents30d = incidents.filter((i) => isWithin(today, i.date, 30));
  const incidents60d = incidents.filter((i) => isWithin(today, i.date, 60) && !isWithin(today, i.date, 30));
  const restraints90d = restraints.filter((r) => isWithin(today, r.date, 90));
  const restraints30d = restraints.filter((r) => isWithin(today, r.date, 30));
  const restraints60d = restraints.filter((r) => isWithin(today, r.date, 60) && !isWithin(today, r.date, 30));

  // ── Risk Landscape ────────────────────────────────────────────────────
  const veryHighAssessments = currentAssessments.filter((a) => a.current_level === "very_high");
  const highAssessments = currentAssessments.filter((a) => a.current_level === "high");
  const escalatingAssessments = currentAssessments.filter((a) => a.trend === "increasing");
  const overdueAssessmentReviews = currentAssessments.filter((a) => isOverdue(today, a.review_date));

  const childrenWithHighRisk = new Set(
    currentAssessments
      .filter((a) => a.current_level === "high" || a.current_level === "very_high")
      .map((a) => a.child_id),
  );

  // ── Home Risk Score (0-100) ───────────────────────────────────────────
  // Starts at 20 (baseline), additively builds risk
  let homeRiskScore = 20;

  // Risk assessments
  homeRiskScore += veryHighAssessments.length * 12;
  homeRiskScore += highAssessments.length * 6;
  homeRiskScore += escalatingAssessments.length * 5;
  homeRiskScore += overdueAssessmentReviews.length * 3;

  // Exploitation
  const highExploitation = activeScreenings.filter((s) => s.risk_level === "high" || s.risk_level === "very_high");
  homeRiskScore += highExploitation.length * 10;
  homeRiskScore += activeScreenings.filter((s) => s.risk_level === "medium").length * 4;

  // Missing
  homeRiskScore += missing30d.length * 5;
  const csRiskMissing = missing90d.filter((m) => m.contextual_safeguarding_risk);
  homeRiskScore += csRiskMissing.length * 4;

  // Incidents
  const criticalIncidents30d = incidents30d.filter((i) => i.severity === "critical");
  const highIncidents30d = incidents30d.filter((i) => i.severity === "high");
  homeRiskScore += criticalIncidents30d.length * 8;
  homeRiskScore += highIncidents30d.length * 4;

  // Restraints
  homeRiskScore += restraints30d.length * 4;
  const injuryRestraints = restraints90d.filter((r) => r.injuries > 0);
  homeRiskScore += injuryRestraints.length * 5;

  // Protective reductions
  const decreasingAssessments = currentAssessments.filter((a) => a.trend === "decreasing");
  homeRiskScore -= decreasingAssessments.length * 3;
  if (currentAssessments.length > 0) {
    const childVoiceRate = pct(
      currentAssessments.filter((a) => a.has_child_views).length,
      currentAssessments.length,
    );
    if (childVoiceRate === 100) homeRiskScore -= 3;
  }
  if (missing30d.length === 0 && missing90d.length > 0) homeRiskScore -= 3;
  if (incidents30d.length === 0 && incidents90d.length > 0) homeRiskScore -= 3;

  homeRiskScore = clamp(Math.round(homeRiskScore), 0, 100);

  const homeRiskLevel: HomeRiskLevel =
    homeRiskScore >= 75 ? "critical" :
    homeRiskScore >= 55 ? "elevated" :
    homeRiskScore >= 35 ? "moderate" :
    homeRiskScore >= 20 ? "managed" :
    "low";

  const landscape: RiskLandscapeOverview = {
    home_risk_level: homeRiskLevel,
    home_risk_score: homeRiskScore,
    total_active_risks: currentAssessments.length,
    very_high_risks: veryHighAssessments.length,
    high_risks: highAssessments.length,
    escalating_risks: escalatingAssessments.length,
    overdue_reviews: overdueAssessmentReviews.length,
    children_at_risk: childrenWithHighRisk.size,
    total_children: children.length,
  };

  // ── Incident Analysis ─────────────────────────────────────────────────
  const safeguarding30d = incidents30d.filter(
    (i) => i.type === "safeguarding_concern" || i.type === "allegation" || i.type === "exploitation_concern",
  );
  const openIncidents = incidents.filter((i) => i.status === "open" || i.status === "under_review");
  const unreviewedOversight = incidents.filter(
    (i) => i.requires_oversight && !i.oversight_completed,
  );

  // Incident type frequency
  const typeCountMap = new Map<string, number>();
  for (const i of incidents90d) {
    typeCountMap.set(i.type, (typeCountMap.get(i.type) ?? 0) + 1);
  }
  const topTypes = [...typeCountMap.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Incident trend: compare 30d vs 30-60d
  const incidentTrend: "increasing" | "stable" | "decreasing" =
    incidents30d.length > incidents60d.length * 1.3 ? "increasing" :
    incidents30d.length < incidents60d.length * 0.7 ? "decreasing" :
    "stable";

  const incident_analysis: IncidentAnalysis = {
    total_90d: incidents90d.length,
    total_30d: incidents30d.length,
    critical_30d: criticalIncidents30d.length,
    high_30d: highIncidents30d.length,
    safeguarding_30d: safeguarding30d.length,
    trend: incidentTrend,
    top_types: topTypes,
    open_incidents: openIncidents.length,
    unreviewed_oversight: unreviewedOversight.length,
  };

  // ── Exploitation Overview ─────────────────────────────────────────────
  const activeExploitationChildren = new Set(activeScreenings.map((s) => s.child_id));
  const highRiskExploitationChildren = new Set(
    activeScreenings.filter((s) => s.risk_level === "high" || s.risk_level === "very_high").map((s) => s.child_id),
  );
  const overdueExploitationReviews = activeScreenings.filter(
    (s) => isOverdue(today, s.next_review_date),
  );
  const multiAgencyEngaged = activeScreenings.some((s) => s.multi_agency_involved.length >= 2);

  const exploitation_overview: ExploitationOverview = {
    active_screenings: activeScreenings.length,
    high_risk_children: highRiskExploitationChildren.size,
    cse_count: activeScreenings.filter((s) => s.exploitation_type === "cse").length,
    cce_count: activeScreenings.filter((s) => s.exploitation_type === "cce").length,
    online_count: activeScreenings.filter((s) => s.exploitation_type === "online_exploitation").length,
    other_count: activeScreenings.filter(
      (s) => s.exploitation_type !== "cse" && s.exploitation_type !== "cce" && s.exploitation_type !== "online_exploitation",
    ).length,
    nrm_referrals: activeScreenings.filter((s) => s.nrm_referral).length,
    overdue_reviews: overdueExploitationReviews.length,
    multi_agency_engaged: multiAgencyEngaged,
  };

  // ── Missing Overview ──────────────────────────────────────────────────
  const uniqueMissing30d = new Set(missing30d.map((m) => m.child_id));
  const avgDuration = missing90d.length > 0
    ? Math.round((missing90d.reduce((s, m) => s + m.duration_hours, 0) / missing90d.length) * 10) / 10
    : 0;
  const returnInterviewRate = pct(
    missing90d.filter((m) => m.return_interview_completed).length,
    missing90d.length,
  );
  const csRiskEpisodes = missing90d.filter((m) => m.contextual_safeguarding_risk).length;

  // Repeat missing: any child with >=2 episodes in 90d
  const missingChildCounts = new Map<string, number>();
  for (const m of missing90d) {
    missingChildCounts.set(m.child_id, (missingChildCounts.get(m.child_id) ?? 0) + 1);
  }
  const repeatMissing = [...missingChildCounts.values()].some((c) => c >= 2);

  const missing_overview: MissingOverview = {
    total_90d: missing90d.length,
    total_30d: missing30d.length,
    unique_children_30d: uniqueMissing30d.size,
    avg_duration_hours: avgDuration,
    return_interview_rate: returnInterviewRate,
    cs_risk_episodes: csRiskEpisodes,
    repeat_missing: repeatMissing,
  };

  // ── Restraint Overview ────────────────────────────────────────────────
  const uniqueRestraintChildren = new Set(restraints90d.map((r) => r.child_id));
  const avgRestraintDuration = restraints90d.length > 0
    ? Math.round(restraints90d.reduce((s, r) => s + r.duration_minutes, 0) / restraints90d.length)
    : 0;
  const childDebriefed = restraints90d.filter((r) => r.child_debriefed);
  const totalInjuries = restraints90d.reduce((s, r) => s + r.injuries, 0);
  const unreviewedRestraints = restraints90d.filter((r) => r.review_status === "pending");

  const restraintTrend: "increasing" | "stable" | "decreasing" =
    restraints30d.length > restraints60d.length * 1.3 ? "increasing" :
    restraints30d.length < restraints60d.length * 0.7 ? "decreasing" :
    "stable";

  const restraint_overview: RestraintOverview = {
    total_90d: restraints90d.length,
    total_30d: restraints30d.length,
    unique_children_90d: uniqueRestraintChildren.size,
    avg_duration_minutes: avgRestraintDuration,
    trend: restraintTrend,
    debrief_rate: pct(childDebriefed.length, restraints90d.length),
    injuries_count: totalInjuries,
    unreviewed_count: unreviewedRestraints.length,
  };

  // ── Child Risk Profiles ───────────────────────────────────────────────
  const child_profiles: ChildRiskProfile[] = children.map((child) => {
    const childAssessments = currentAssessments.filter((a) => a.child_id === child.id);
    const childScreenings = activeScreenings.filter((s) => s.child_id === child.id);
    const childMissing90d = missing90d.filter((m) => m.child_id === child.id);
    const childIncidents90d = incidents90d.filter((i) => i.child_id === child.id);
    const childRestraints90d = restraints90d.filter((r) => r.child_id === child.id);

    // Per-child risk score
    let childScore = 10;

    // Assessments
    for (const a of childAssessments) {
      childScore += RISK_LEVEL_SCORE[a.current_level] * 4;
      if (a.trend === "increasing") childScore += 8;
      if (a.trend === "decreasing") childScore -= 3;
    }

    // Exploitation
    for (const s of childScreenings) {
      childScore += (RISK_LEVEL_SCORE[s.risk_level] ?? 0) * 5;
    }

    // Missing
    childScore += childMissing90d.length * 5;
    childScore += childMissing90d.filter((m) => m.contextual_safeguarding_risk).length * 5;

    // Incidents
    for (const i of childIncidents90d) {
      childScore += (SEVERITY_SCORE[i.severity] ?? 1) * 3;
    }

    // Restraints
    childScore += childRestraints90d.length * 6;

    // Protective
    if (childAssessments.every((a) => a.has_child_views) && childAssessments.length > 0) childScore -= 3;
    if (childAssessments.every((a) => a.trend === "decreasing") && childAssessments.length > 0) childScore -= 5;

    childScore = clamp(Math.round(childScore), 0, 100);

    const childRiskLevel: HomeRiskLevel =
      childScore >= 75 ? "critical" :
      childScore >= 55 ? "elevated" :
      childScore >= 35 ? "moderate" :
      childScore >= 20 ? "managed" :
      "low";

    // Highest risk domain
    const levels = childAssessments.map((a) => a.current_level);
    const highestLevel = highestRiskLevel(levels);
    const highestDomainAssessment = childAssessments.find((a) => a.current_level === highestLevel);
    const highestDomain = highestDomainAssessment?.domain ?? "none";

    // Exploitation risk
    const exploitationLevels = childScreenings.map((s) => s.risk_level);
    const exploitationRisk = exploitationLevels.length > 0 ? highestRiskLevel(exploitationLevels) : null;

    // Escalating domains
    const escalatingDomains = childAssessments
      .filter((a) => a.trend === "increasing")
      .map((a) => a.domain);

    // Flags
    const flags: string[] = [];
    if (childAssessments.some((a) => a.current_level === "very_high")) flags.push("very_high_risk");
    if (escalatingDomains.length > 0) flags.push("escalating_risk");
    if (childScreenings.some((s) => s.risk_level === "high" || s.risk_level === "very_high")) flags.push("exploitation_concern");
    if (childMissing90d.length >= 3) flags.push("repeat_missing");
    if (childMissing90d.some((m) => m.contextual_safeguarding_risk)) flags.push("cs_risk");
    if (childRestraints90d.length >= 3) flags.push("frequent_restraint");
    if (childIncidents90d.some((i) => i.severity === "critical")) flags.push("critical_incident");

    return {
      child_id: child.id,
      child_name: child.name,
      risk_level: childRiskLevel,
      risk_score: childScore,
      active_risk_assessments: childAssessments.length,
      highest_risk_domain: highestDomain,
      highest_risk_level: highestLevel,
      exploitation_risk: exploitationRisk,
      missing_episodes_90d: childMissing90d.length,
      incidents_90d: childIncidents90d.length,
      restraints_90d: childRestraints90d.length,
      escalating_domains: escalatingDomains,
      flags,
    };
  }).sort((a, b) => b.risk_score - a.risk_score);

  // ── Risk Domains ──────────────────────────────────────────────────────
  const domainMap = new Map<string, RiskAssessmentInput[]>();
  for (const a of currentAssessments) {
    const arr = domainMap.get(a.domain) ?? [];
    arr.push(a);
    domainMap.set(a.domain, arr);
  }

  const risk_domains: RiskDomain[] = [...domainMap.entries()]
    .map(([domain, items]) => {
      const avgLevel = items.reduce((s, a) => s + RISK_LEVEL_SCORE[a.current_level], 0) / items.length;
      const increasing = items.filter((a) => a.trend === "increasing").length;
      const decreasing = items.filter((a) => a.trend === "decreasing").length;
      const trendDirection: "improving" | "stable" | "worsening" =
        decreasing > increasing ? "improving" :
        increasing > decreasing ? "worsening" :
        "stable";

      return {
        domain,
        children_affected: new Set(items.map((a) => a.child_id)).size,
        avg_level: Math.round(avgLevel * 10) / 10,
        trend_direction: trendDirection,
      };
    })
    .sort((a, b) => b.avg_level - a.avg_level);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (decreasingAssessments.length > 0 && escalatingAssessments.length === 0) {
    strengths.push(
      `${decreasingAssessments.length} of ${currentAssessments.length} risk assessments showing decreasing trends with no escalations — evidence of effective risk management.`,
    );
  }

  if (currentAssessments.length > 0) {
    const voiceRate = pct(currentAssessments.filter((a) => a.has_child_views).length, currentAssessments.length);
    if (voiceRate === 100) {
      strengths.push(
        "Child's voice present in 100% of active risk assessments — demonstrating genuine child-centred safety planning.",
      );
    }
  }

  if (currentAssessments.length > 0) {
    const contingencyRate = pct(currentAssessments.filter((a) => a.has_contingency_plan).length, currentAssessments.length);
    if (contingencyRate === 100) {
      strengths.push(
        "Contingency plans in place for all active risk assessments — preparedness for escalation is strong.",
      );
    }
  }

  if (missing90d.length > 0 && returnInterviewRate === 100) {
    strengths.push(
      `Return interviews completed for all ${missing90d.length} missing episodes — meeting Reg 34 requirements.`,
    );
  }

  if (restraints90d.length > 0 && restraint_overview.debrief_rate === 100) {
    strengths.push(
      "Child debriefed after every restraint episode — reflective practice supporting recovery and trust.",
    );
  }

  if (multiAgencyEngaged && activeScreenings.length > 0) {
    strengths.push(
      "Multi-agency engagement active for exploitation concerns — collaborative safeguarding in action.",
    );
  }

  if (incidents90d.length > 0 && incidents30d.length === 0) {
    strengths.push(
      "No incidents recorded in the last 30 days despite earlier activity — suggesting stabilisation.",
    );
  }

  if (restraints90d.length > 0 && restraints30d.length === 0) {
    strengths.push(
      "No restraint episodes in the last 30 days — de-escalation strategies may be taking effect.",
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (veryHighAssessments.length > 0) {
    const names = [...new Set(veryHighAssessments.map((a) => a.child_name))].join(", ");
    concerns.push(
      `${veryHighAssessments.length} risk assessment(s) at VERY HIGH level (${names}) — requires immediate multi-agency oversight and daily monitoring.`,
    );
  }

  if (escalatingAssessments.length > 0) {
    const names = [...new Set(escalatingAssessments.map((a) => a.child_name))].join(", ");
    concerns.push(
      `${escalatingAssessments.length} risk(s) showing INCREASING trend (${names}) — review whether current mitigations are adequate.`,
    );
  }

  if (overdueAssessmentReviews.length > 0) {
    concerns.push(
      `${overdueAssessmentReviews.length} risk assessment review(s) overdue — outdated assessments cannot effectively protect children (Reg 12).`,
    );
  }

  if (highExploitation.length > 0) {
    const names = [...new Set(highExploitation.map((s) => s.child_name))].join(", ");
    concerns.push(
      `High/very high exploitation risk for ${names} — ensure safety plans are current and multi-agency strategy is active.`,
    );
  }

  if (repeatMissing) {
    const repeaters = [...missingChildCounts.entries()]
      .filter(([, c]) => c >= 2)
      .map(([childId]) => {
        const child = children.find((c) => c.id === childId);
        return child?.name ?? childId;
      });
    concerns.push(
      `Repeat missing episodes for ${repeaters.join(", ")} — pattern requires root-cause analysis and updated safety plan (Reg 34).`,
    );
  }

  if (csRiskEpisodes > 0) {
    concerns.push(
      `${csRiskEpisodes} missing episode(s) with contextual safeguarding risk — exploitation pathways must be investigated.`,
    );
  }

  if (restraints30d.length >= 3) {
    concerns.push(
      `${restraints30d.length} restraint episodes in 30 days — high frequency suggests current behaviour support plans may need review (Reg 35).`,
    );
  }

  if (totalInjuries > 0) {
    concerns.push(
      `${totalInjuries} injury/injuries recorded during restraint episodes — review technique, proportionality, and consider external audit.`,
    );
  }

  if (unreviewedOversight.length > 0) {
    concerns.push(
      `${unreviewedOversight.length} incident(s) requiring management oversight not yet reviewed — timely oversight is a Reg 40 expectation.`,
    );
  }

  if (missing90d.length > 0 && returnInterviewRate < 100) {
    concerns.push(
      `Return interview completion rate at ${returnInterviewRate}% — all missing episodes must have a timely return interview (Reg 34).`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: RiskRecommendation[] = [];
  let rank = 0;

  if (veryHighAssessments.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Convene multi-agency strategy meeting for all very high risk children within 48 hours. Ensure daily monitoring logs and escalation to senior management.",
      urgency: "immediate",
      domain: "risk_assessment",
      regulatory_ref: "Reg 12",
    });
  }

  if (highExploitation.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Review exploitation safety plans and ensure MACE/strategy discussions are scheduled. Update contextual safeguarding maps.",
      urgency: "immediate",
      domain: "exploitation",
      regulatory_ref: "Reg 13",
    });
  }

  if (csRiskEpisodes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Conduct contextual safeguarding assessment for all children with CS-risk missing episodes. Map locations, associates, and online activity.",
      urgency: "immediate",
      domain: "missing",
      regulatory_ref: "Reg 34",
    });
  }

  if (escalatingAssessments.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Review and update risk assessments with increasing trends. Assess whether mitigations need strengthening and involve CAMHS or specialist services.",
      urgency: "urgent",
      domain: "risk_assessment",
      regulatory_ref: "Reg 12",
    });
  }

  if (overdueAssessmentReviews.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Schedule immediate review of ${overdueAssessmentReviews.length} overdue risk assessment(s). Risk assessments must reflect current risk levels.`,
      urgency: "urgent",
      domain: "compliance",
      regulatory_ref: "Reg 12",
    });
  }

  if (overdueExploitationReviews.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `${overdueExploitationReviews.length} exploitation screening review(s) overdue — schedule within 5 working days.`,
      urgency: "urgent",
      domain: "exploitation",
      regulatory_ref: "Reg 13",
    });
  }

  if (unreviewedRestraints.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Complete management review of ${unreviewedRestraints.length} pending restraint record(s). Ensure proportionality and technique are evaluated.`,
      urgency: "urgent",
      domain: "restraint",
      regulatory_ref: "Reg 35",
    });
  }

  if (unreviewedOversight.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Complete management oversight for ${unreviewedOversight.length} incident(s). Document analysis, actions, and lessons learned.`,
      urgency: "urgent",
      domain: "incidents",
      regulatory_ref: "Reg 40",
    });
  }

  if (missing90d.length > 0 && returnInterviewRate < 100) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Complete outstanding return interviews for missing episodes. Each interview should explore push/pull factors and update safety planning.",
      urgency: "urgent",
      domain: "missing",
      regulatory_ref: "Reg 34",
    });
  }

  if (totalInjuries > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Commission external review of restraint practice following recorded injuries. Ensure body maps, medical checks, and notifications are complete.",
      urgency: "urgent",
      domain: "restraint",
      regulatory_ref: "Reg 35",
    });
  }

  if (currentAssessments.length > 0) {
    const voiceMissing = currentAssessments.filter((a) => !a.has_child_views);
    if (voiceMissing.length > 0) {
      recommendations.push({
        rank: ++rank,
        recommendation: `Capture child's voice in ${voiceMissing.length} risk assessment(s) missing child views. Children must participate in their safety planning.`,
        urgency: "planned",
        domain: "voice",
        regulatory_ref: "Reg 7",
      });
    }
  }

  if (restraints90d.length > 0 && restraint_overview.debrief_rate < 100) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Ensure child debrief is completed for all restraint episodes. Debriefs should happen within 24 hours of the incident.",
      urgency: "planned",
      domain: "restraint",
      regulatory_ref: "Reg 35",
    });
  }

  // ── ARIA Insights ─────────────────────────────────────────────────────
  const insights: RiskInsight[] = [];

  // Critical
  if (homeRiskLevel === "critical") {
    insights.push({
      severity: "critical",
      text: "Home risk level is CRITICAL. Multiple high-severity risk indicators are active. Ofsted inspectors will scrutinise whether senior management oversight, multi-agency collaboration, and protective measures are robust and current. Ensure all risk assessments, safety plans, and monitoring logs are up to date.",
    });
  }

  if (veryHighAssessments.length > 0 && escalatingAssessments.length > 0) {
    insights.push({
      severity: "critical",
      text: `Very high risk assessments combined with escalating trends present significant safeguarding concerns. This combination suggests current interventions may be insufficient. Consider whether placement suitability needs reassessing for affected children.`,
    });
  }

  if (highExploitation.length > 0 && csRiskEpisodes > 0) {
    insights.push({
      severity: "critical",
      text: "High exploitation risk combined with contextual safeguarding-flagged missing episodes creates a concerning pattern. Ensure NRM referrals are considered, MACE panels are engaged, and police intelligence is current.",
    });
  }

  // Warnings
  if (incidentTrend === "increasing") {
    insights.push({
      severity: "warning",
      text: `Incident frequency is increasing (${incidents30d.length} in last 30 days vs ${incidents60d.length} in prior 30 days). Analyse triggers and consider whether staffing, routines, or environmental factors are contributing.`,
    });
  }

  if (restraintTrend === "increasing") {
    insights.push({
      severity: "warning",
      text: `Restraint frequency is increasing. Review whether positive behaviour support plans are current, Team Teach refreshers are up to date, and de-escalation strategies are being consistently applied.`,
    });
  }

  if (overdueAssessmentReviews.length > 0) {
    insights.push({
      severity: "warning",
      text: `${overdueAssessmentReviews.length} risk assessment review(s) overdue. Outdated assessments cannot effectively protect children and represent a regulatory compliance gap inspectors will identify.`,
    });
  }

  if (repeatMissing) {
    insights.push({
      severity: "warning",
      text: "Repeat missing episodes detected. Patterns of going missing can indicate exploitation, placement instability, or unmet emotional needs. A multi-agency review of push and pull factors is essential.",
    });
  }

  // Positive
  if (homeRiskLevel === "low" || homeRiskLevel === "managed") {
    insights.push({
      severity: "positive",
      text: `Home risk level is ${homeRiskLevel.toUpperCase()}. Current risk management, safeguarding practice, and staff vigilance are keeping children safe. Continue dynamic risk assessment and maintain multi-agency engagement.`,
    });
  }

  if (decreasingAssessments.length > 0 && escalatingAssessments.length === 0 && currentAssessments.length >= 2) {
    insights.push({
      severity: "positive",
      text: `${decreasingAssessments.length} risk assessment(s) trending downward with zero escalations. This evidences that therapeutic interventions, consistent care, and relationship-based practice are reducing risk over time.`,
    });
  }

  if (restraints90d.length > 0 && restraints30d.length === 0) {
    insights.push({
      severity: "positive",
      text: "No restraint episodes in the last 30 days. This suggests de-escalation approaches and positive behaviour support are effective — a strong indicator for Reg 35 compliance.",
    });
  }

  if (missing90d.length > 0 && returnInterviewRate === 100) {
    insights.push({
      severity: "positive",
      text: "Return interviews completed for all missing episodes. This demonstrates robust Reg 34 compliance and commitment to understanding each child's experience.",
    });
  }

  return {
    generated_at: today,
    landscape,
    incident_analysis,
    exploitation_overview,
    missing_overview,
    restraint_overview,
    child_profiles,
    risk_domains,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
