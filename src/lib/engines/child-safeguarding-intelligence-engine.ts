// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD SAFEGUARDING INTELLIGENCE ENGINE
// Per-child engine producing a holistic safeguarding profile combining:
// risk assessments, incidents, missing episodes, restraints, contextual
// safeguarding markers, and professional input to determine a child's
// overall safeguarding status and trajectory.
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Injectable `today` parameter for deterministic testing.
//
// Regulatory: CHR 2015 Reg 12 (protection), Reg 13 (behaviour management),
// Reg 34 (notification), Reg 35 (notification of serious events).
// SCCIF: "How well children are helped and protected."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export type RiskLevel = "low" | "medium" | "high" | "very_high";
export type RiskTrend = "increasing" | "stable" | "decreasing";
export type MitigationEffectiveness = "effective" | "partially_effective" | "not_effective" | "not_yet_assessed";

export interface RiskAssessmentInput {
  id: string;
  domain: string;
  current_level: RiskLevel;
  previous_level: RiskLevel;
  trend: RiskTrend;
  status: string;                          // current, under_review, superseded, draft
  assessed_date: string;
  review_date: string;
  triggers: string[];
  indicators: string[];
  mitigations: { strategy: string; effectiveness: MitigationEffectiveness }[];
  child_views: string;
  linked_incidents: string[];
}

export interface IncidentInput {
  id: string;
  date: string;
  type: string;
  severity: string;                        // low, medium, high, critical
  involved_child: boolean;
}

export interface MissingEpisodeInput {
  id: string;
  date: string;
  duration_hours: number | null;
  risk_level: string;
  returned: boolean;
  return_interview_completed: boolean;
  contextual_safeguarding_risk: boolean;
  pattern_notes: string | null;
}

export interface RestraintInput {
  id: string;
  date: string;
  duration_minutes: number;
  reason: string;
  de_escalation_attempts: string[];
  injuries_count: number;
  child_debriefed: boolean;
  staff_debriefed: boolean;
  review_status: string;
}

export interface ContextualMarkerInput {
  id: string;
  domain: string;                          // exploitation, county_lines, gangs, radicalisation, etc.
  risk_level: string;
  date_identified: string;
  status: string;                          // active, monitoring, resolved
}

export interface ChildSafeguardingInput {
  today: string;
  child_id: string;
  child_name: string;
  child_age: number;
  risk_assessments: RiskAssessmentInput[];
  incidents: IncidentInput[];
  missing_episodes: MissingEpisodeInput[];
  restraints: RestraintInput[];
  contextual_markers: ContextualMarkerInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type SafeguardingStatus = "safe_and_well" | "managed" | "elevated" | "serious_concern" | "critical" | "insufficient_data";

export interface RiskDomainProfile {
  domain: string;
  current_level: RiskLevel;
  previous_level: RiskLevel;
  trend: RiskTrend;
  is_overdue: boolean;
  days_until_review: number;
  effective_mitigations: number;
  total_mitigations: number;
  triggers: string[];
  child_voice: string;
}

export interface IncidentProfile {
  total_90d: number;
  high_severity_count: number;
  critical_count: number;
  trend: "increasing" | "stable" | "decreasing" | "insufficient_data";
  types_breakdown: { type: string; count: number }[];
}

export interface MissingProfile {
  total_90d: number;
  total_hours_missing: number;
  high_risk_count: number;
  return_interview_rate: number;
  contextual_risk_count: number;
  repeat_pattern: boolean;
  trend: "increasing" | "stable" | "decreasing" | "insufficient_data";
}

export interface RestraintProfile {
  total_90d: number;
  total_duration_minutes: number;
  injuries_count: number;
  debrief_rate: number;
  review_rate: number;
  trend: "increasing" | "stable" | "decreasing" | "insufficient_data";
}

export interface SafeguardingRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  domain: string;
  regulatory_ref: string;
}

export interface SafeguardingInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface ChildSafeguardingResult {
  generated_at: string;
  child_id: string;
  child_name: string;
  safeguarding_status: SafeguardingStatus;
  safeguarding_score: number;
  headline: string;
  risk_domains: RiskDomainProfile[];
  incident_profile: IncidentProfile;
  missing_profile: MissingProfile;
  restraint_profile: RestraintProfile;
  contextual_risks_active: number;
  child_voice: string;
  strengths: string[];
  concerns: string[];
  recommendations: SafeguardingRecommendation[];
  insights: SafeguardingInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(today: string, date: string): number {
  return Math.round(
    (new Date(today).getTime() - new Date(date).getTime()) / 86_400_000,
  );
}

function isWithin(today: string, date: string, days: number): boolean {
  const da = daysAgo(today, date);
  return da >= 0 && da <= days;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function pct(n: number, d: number): number {
  return d > 0 ? Math.round((n / d) * 100) : 100;
}

function riskLevelScore(level: RiskLevel): number {
  switch (level) {
    case "very_high": return 4;
    case "high":      return 3;
    case "medium":    return 2;
    case "low":       return 1;
    default:          return 0;
  }
}

function compareTrend(
  recent: number[],
  older: number[],
): "increasing" | "stable" | "decreasing" | "insufficient_data" {
  if (recent.length === 0 && older.length === 0) return "insufficient_data";
  const recentAvg = recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
  const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : 0;
  if (recent.length === 0 && older.length > 0) return "decreasing";
  if (older.length === 0 && recent.length > 0) return "increasing";
  if (recentAvg > olderAvg * 1.2) return "increasing";
  if (recentAvg < olderAvg * 0.8) return "decreasing";
  return "stable";
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeChildSafeguarding(
  input: ChildSafeguardingInput,
): ChildSafeguardingResult {
  const { today, child_id, child_name, child_age, risk_assessments, incidents, missing_episodes, restraints, contextual_markers } = input;

  // ── Risk Domain Profiles ─────────────────────────────────────────────
  const currentAssessments = risk_assessments.filter((r) => r.status === "current" || r.status === "under_review");

  const risk_domains: RiskDomainProfile[] = currentAssessments.map((ra) => {
    const daysToReview = -daysAgo(today, ra.review_date);
    const effectiveMits = ra.mitigations.filter((m) => m.effectiveness === "effective").length;
    return {
      domain: ra.domain,
      current_level: ra.current_level,
      previous_level: ra.previous_level,
      trend: ra.trend,
      is_overdue: daysToReview < 0,
      days_until_review: daysToReview,
      effective_mitigations: effectiveMits,
      total_mitigations: ra.mitigations.length,
      triggers: ra.triggers,
      child_voice: ra.child_views ?? "",
    };
  }).sort((a, b) => riskLevelScore(b.current_level) - riskLevelScore(a.current_level));

  // ── Incident Profile ─────────────────────────────────────────────────
  const incidents90d = incidents.filter((i) => isWithin(today, i.date, 90));
  const incidentsRecent = incidents.filter((i) => isWithin(today, i.date, 45));
  const incidentsOlder = incidents.filter((i) => {
    const da = daysAgo(today, i.date);
    return da > 45 && da <= 90;
  });
  const highSeverity = incidents90d.filter((i) => i.severity === "high" || i.severity === "critical");
  const criticalIncidents = incidents90d.filter((i) => i.severity === "critical");

  const typeCountsMap: Record<string, number> = {};
  incidents90d.forEach((i) => {
    typeCountsMap[i.type] = (typeCountsMap[i.type] ?? 0) + 1;
  });
  const typesBreakdown = Object.entries(typeCountsMap)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));

  const incident_profile: IncidentProfile = {
    total_90d: incidents90d.length,
    high_severity_count: highSeverity.length,
    critical_count: criticalIncidents.length,
    trend: compareTrend(
      incidentsRecent.map(() => 1),
      incidentsOlder.map(() => 1),
    ),
    types_breakdown: typesBreakdown,
  };

  // ── Missing Profile ──────────────────────────────────────────────────
  const missing90d = missing_episodes.filter((m) => isWithin(today, m.date, 90));
  const missingRecent = missing_episodes.filter((m) => isWithin(today, m.date, 45));
  const missingOlder = missing_episodes.filter((m) => {
    const da = daysAgo(today, m.date);
    return da > 45 && da <= 90;
  });
  const totalHoursMissing = missing90d.reduce((s, m) => s + (m.duration_hours ?? 0), 0);
  const highRiskMissing = missing90d.filter((m) => m.risk_level === "high" || m.risk_level === "critical");
  const riCompleted = missing90d.filter((m) => m.returned && m.return_interview_completed);
  const returnedEpisodes = missing90d.filter((m) => m.returned);
  const contextualRiskMissing = missing90d.filter((m) => m.contextual_safeguarding_risk);
  const hasRepeatPattern = missing90d.some((m) => m.pattern_notes && m.pattern_notes.trim().length > 0);

  const missing_profile: MissingProfile = {
    total_90d: missing90d.length,
    total_hours_missing: Math.round(totalHoursMissing * 10) / 10,
    high_risk_count: highRiskMissing.length,
    return_interview_rate: pct(riCompleted.length, returnedEpisodes.length),
    contextual_risk_count: contextualRiskMissing.length,
    repeat_pattern: hasRepeatPattern,
    trend: compareTrend(
      missingRecent.map(() => 1),
      missingOlder.map(() => 1),
    ),
  };

  // ── Restraint Profile ────────────────────────────────────────────────
  const restraints90d = restraints.filter((r) => isWithin(today, r.date, 90));
  const restraintsRecent = restraints.filter((r) => isWithin(today, r.date, 45));
  const restraintsOlder = restraints.filter((r) => {
    const da = daysAgo(today, r.date);
    return da > 45 && da <= 90;
  });
  const totalRestraintMins = restraints90d.reduce((s, r) => s + r.duration_minutes, 0);
  const injuriesFromRestraints = restraints90d.reduce((s, r) => s + r.injuries_count, 0);
  const debriefed = restraints90d.filter((r) => r.child_debriefed);
  const reviewed = restraints90d.filter((r) => r.review_status === "reviewed" || r.review_status === "completed");

  const restraint_profile: RestraintProfile = {
    total_90d: restraints90d.length,
    total_duration_minutes: totalRestraintMins,
    injuries_count: injuriesFromRestraints,
    debrief_rate: pct(debriefed.length, restraints90d.length),
    review_rate: pct(reviewed.length, restraints90d.length),
    trend: compareTrend(
      restraintsRecent.map(() => 1),
      restraintsOlder.map(() => 1),
    ),
  };

  // ── Contextual Risks ─────────────────────────────────────────────────
  const activeContextualRisks = contextual_markers.filter((c) => c.status === "active" || c.status === "monitoring");
  const contextual_risks_active = activeContextualRisks.length;

  // ── Child Voice (most recent from risk assessments) ──────────────────
  const childVoices = currentAssessments
    .filter((r) => r.child_views && r.child_views.trim().length > 0)
    .sort((a, b) => b.assessed_date.localeCompare(a.assessed_date));
  const child_voice = childVoices.length > 0 ? childVoices[0].child_views : "";

  // ── Composite Safeguarding Score (0-100, higher = safer) ─────────────
  let score = 50;

  // Risk assessment coverage
  if (currentAssessments.length === 0 && (incidents90d.length > 0 || missing90d.length > 0)) {
    score -= 10; // Incidents/missing but no risk assessments
  }

  // Risk levels
  const veryHighDomains = risk_domains.filter((d) => d.current_level === "very_high");
  const highDomains = risk_domains.filter((d) => d.current_level === "high");
  const decreasingDomains = risk_domains.filter((d) => d.trend === "decreasing");
  const increasingDomains = risk_domains.filter((d) => d.trend === "increasing");

  if (veryHighDomains.length > 0) score -= veryHighDomains.length * 8;
  if (highDomains.length > 0) score -= highDomains.length * 4;
  if (decreasingDomains.length > 0) score += decreasingDomains.length * 3;
  if (increasingDomains.length > 0) score -= increasingDomains.length * 5;

  // Overdue reviews
  const overdueDomains = risk_domains.filter((d) => d.is_overdue);
  if (overdueDomains.length > 0) score -= overdueDomains.length * 4;

  // Mitigation effectiveness
  const totalMits = currentAssessments.reduce((s, r) => s + r.mitigations.length, 0);
  const effectiveMits = currentAssessments.reduce(
    (s, r) => s + r.mitigations.filter((m) => m.effectiveness === "effective").length,
    0,
  );
  if (totalMits > 0) {
    const effRate = effectiveMits / totalMits;
    if (effRate >= 0.8) score += 5;
    else if (effRate < 0.4) score -= 5;
  }

  // Incidents
  if (incidents90d.length === 0) score += 5;
  else if (incidents90d.length >= 5) score -= 5;
  if (criticalIncidents.length > 0) score -= criticalIncidents.length * 5;
  if (incident_profile.trend === "decreasing") score += 3;
  if (incident_profile.trend === "increasing") score -= 5;

  // Missing
  if (missing90d.length === 0) score += 5;
  else if (missing90d.length >= 3) score -= 5;
  if (highRiskMissing.length > 0) score -= highRiskMissing.length * 3;
  if (missing_profile.return_interview_rate === 100 && returnedEpisodes.length > 0) score += 3;
  else if (missing_profile.return_interview_rate < 100 && returnedEpisodes.length > 0) score -= 3;
  if (missing_profile.trend === "decreasing") score += 3;
  if (missing_profile.trend === "increasing") score -= 5;
  if (contextualRiskMissing.length > 0) score -= 3;

  // Restraints
  if (restraints90d.length === 0) score += 5;
  else if (restraints90d.length >= 3) score -= 5;
  if (injuriesFromRestraints > 0) score -= 5;
  if (restraint_profile.debrief_rate === 100 && restraints90d.length > 0) score += 3;
  else if (restraint_profile.debrief_rate < 100 && restraints90d.length > 0) score -= 3;
  if (restraint_profile.trend === "decreasing") score += 3;
  if (restraint_profile.trend === "increasing") score -= 5;

  // Contextual safeguarding
  if (contextual_risks_active > 0) score -= contextual_risks_active * 4;

  // Child voice present in assessments
  if (child_voice.length > 0) score += 3;

  // All risk assessments have child views
  const allHaveViews = currentAssessments.length > 0 && currentAssessments.every((r) => r.child_views && r.child_views.trim().length > 0);
  if (allHaveViews) score += 2;

  score = clamp(Math.round(score), 0, 100);

  // ── Status Determination ─────────────────────────────────────────────
  const hasData = currentAssessments.length > 0 || incidents90d.length > 0 || missing90d.length > 0 || restraints90d.length > 0;

  let safeguarding_status: SafeguardingStatus;
  if (!hasData) {
    safeguarding_status = "insufficient_data";
  } else if (score >= 75) {
    safeguarding_status = "safe_and_well";
  } else if (score >= 60) {
    safeguarding_status = "managed";
  } else if (score >= 45) {
    safeguarding_status = "elevated";
  } else if (score >= 30) {
    safeguarding_status = "serious_concern";
  } else {
    safeguarding_status = "critical";
  }

  // ── Headline ──────────────────────────────────────────────────────────
  const parts: string[] = [];
  parts.push(`${child_name} safeguarding status: ${safeguarding_status.replace(/_/g, " ")}`);
  if (risk_domains.length > 0) {
    const highest = risk_domains[0];
    parts.push(`highest risk: ${highest.domain.replace(/_/g, " ")} (${highest.current_level.replace(/_/g, " ")})`);
  }
  if (decreasingDomains.length > 0) parts.push(`${decreasingDomains.length} risk${decreasingDomains.length !== 1 ? "s" : ""} decreasing`);
  if (incidents90d.length > 0) parts.push(`${incidents90d.length} incident${incidents90d.length !== 1 ? "s" : ""} in 90d`);
  if (missing90d.length > 0) parts.push(`${missing90d.length} missing episode${missing90d.length !== 1 ? "s" : ""}`);
  const headline = parts.join(". ") + ".";

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (decreasingDomains.length > 0) {
    const names = decreasingDomains.map((d) => d.domain.replace(/_/g, " ")).join(", ");
    strengths.push(`Risk levels decreasing across ${decreasingDomains.length} domain${decreasingDomains.length !== 1 ? "s" : ""}: ${names}. Mitigations and therapeutic work are having a positive impact.`);
  }

  if (effectiveMits > 0 && totalMits > 0 && effectiveMits / totalMits >= 0.7) {
    strengths.push(`${Math.round((effectiveMits / totalMits) * 100)}% of risk mitigations assessed as effective. The home is implementing meaningful safeguarding strategies.`);
  }

  if (incidents90d.length === 0) {
    strengths.push("No incidents recorded in the past 90 days. This evidences a settled and safe environment for this child.");
  }

  if (incident_profile.trend === "decreasing" && incidents90d.length > 0) {
    strengths.push("Incident trend is decreasing. Interventions and care strategies are reducing the frequency of safeguarding events.");
  }

  if (missing90d.length === 0) {
    strengths.push("No missing episodes in 90 days. The child feels safe enough to remain at the home and any previous patterns have been addressed.");
  }

  if (missing_profile.return_interview_rate === 100 && returnedEpisodes.length > 0) {
    strengths.push("100% return interview completion rate. Compliance with missing from care protocol ensures learning from every episode (Reg 34).");
  }

  if (restraints90d.length === 0) {
    strengths.push("No restraints required in 90 days. De-escalation strategies are effective and the child is being managed without restrictive intervention (Reg 13).");
  }

  if (restraint_profile.debrief_rate === 100 && restraints90d.length > 0) {
    strengths.push("All restraints have been debriefed with the child. This supports the therapeutic relationship and demonstrates child-centred practice.");
  }

  if (allHaveViews && currentAssessments.length >= 2) {
    strengths.push(`Child views recorded in all ${currentAssessments.length} risk assessments. ${child_name} is actively involved in their own safeguarding planning.`);
  }

  if (overdueDomains.length === 0 && currentAssessments.length > 0) {
    strengths.push("All risk assessments are up to date with no overdue reviews. This demonstrates proactive safeguarding management.");
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (veryHighDomains.length > 0) {
    const names = veryHighDomains.map((d) => d.domain.replace(/_/g, " ")).join(", ");
    concerns.push(`Very high risk identified in: ${names}. Enhanced monitoring and multi-agency oversight required (Reg 12).`);
  }

  if (increasingDomains.length > 0) {
    const names = increasingDomains.map((d) => d.domain.replace(/_/g, " ")).join(", ");
    concerns.push(`Risk trend increasing in: ${names}. Current mitigations may be insufficient — review strategies urgently.`);
  }

  if (overdueDomains.length > 0) {
    const names = overdueDomains.map((d) => d.domain.replace(/_/g, " ")).join(", ");
    concerns.push(`Overdue risk assessment reviews: ${names}. Timely reviews are essential for dynamic risk management.`);
  }

  if (criticalIncidents.length > 0) {
    concerns.push(`${criticalIncidents.length} critical incident${criticalIncidents.length !== 1 ? "s" : ""} in 90 days. Each requires thorough investigation, notification to Ofsted, and learning review (Reg 35).`);
  }

  if (highRiskMissing.length > 0) {
    concerns.push(`${highRiskMissing.length} high/critical risk missing episode${highRiskMissing.length !== 1 ? "s" : ""}. Each episode represents a significant safeguarding concern.`);
  }

  if (missing_profile.return_interview_rate < 100 && returnedEpisodes.length > 0) {
    concerns.push(`Return interview completion at ${missing_profile.return_interview_rate}%. All returned children must have a return interview to understand push/pull factors (Reg 34).`);
  }

  if (contextualRiskMissing.length > 0) {
    concerns.push(`${contextualRiskMissing.length} missing episode${contextualRiskMissing.length !== 1 ? "s" : ""} flagged with contextual safeguarding risk. This child may be at risk of exploitation when missing.`);
  }

  if (injuriesFromRestraints > 0) {
    concerns.push(`${injuriesFromRestraints} injur${injuriesFromRestraints !== 1 ? "ies" : "y"} recorded during restraint in 90 days. Every injury must be documented, reported, and investigated (Reg 13, Reg 35).`);
  }

  if (restraint_profile.debrief_rate < 100 && restraints90d.length > 0) {
    concerns.push(`Restraint debrief rate at ${restraint_profile.debrief_rate}%. All children must be debriefed after restrictive intervention to ensure their wellbeing and views are heard.`);
  }

  if (contextual_risks_active > 0) {
    const domains = activeContextualRisks.map((c) => c.domain.replace(/_/g, " ")).join(", ");
    concerns.push(`Active contextual safeguarding risks: ${domains}. Multi-agency coordination essential to mitigate external threats.`);
  }

  if (currentAssessments.length === 0 && (incidents90d.length > 0 || missing90d.length > 0)) {
    concerns.push("No current risk assessments despite recent incidents/missing episodes. Risk assessments must be completed to inform care planning.");
  }

  const ineffectiveMits = currentAssessments.reduce(
    (s, r) => s + r.mitigations.filter((m) => m.effectiveness === "not_effective").length,
    0,
  );
  if (ineffectiveMits > 0) {
    concerns.push(`${ineffectiveMits} risk mitigation${ineffectiveMits !== 1 ? "s" : ""} assessed as not effective. These must be replaced with alternative strategies.`);
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: SafeguardingRecommendation[] = [];
  let rank = 0;

  if (veryHighDomains.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Convene an urgent multi-agency strategy meeting to address very high risk in ${veryHighDomains.map((d) => d.domain.replace(/_/g, " ")).join(", ")}. Ensure social worker, CAMHS, and police (if applicable) are involved.`,
      urgency: "immediate",
      domain: "risk_management",
      regulatory_ref: "Reg 12",
    });
  }

  if (overdueDomains.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Complete overdue risk assessment reviews for ${overdueDomains.map((d) => d.domain.replace(/_/g, " ")).join(", ")}. Risk assessments are living documents and must be reviewed at the scheduled date.`,
      urgency: "immediate",
      domain: "risk_assessment",
      regulatory_ref: "Reg 12",
    });
  }

  if (contextualRiskMissing.length > 0 && contextual_risks_active === 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Missing episodes flagged with contextual safeguarding risk but no formal contextual markers are in place. Complete a contextual safeguarding assessment and refer to MACE if exploitation indicators are present.",
      urgency: "immediate",
      domain: "contextual_safeguarding",
      regulatory_ref: "Reg 12",
    });
  }

  if (missing_profile.return_interview_rate < 100 && returnedEpisodes.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Ensure all return interviews are completed within 72 hours of a child being found. Use an independent person where possible to capture the child's experience and identify push/pull factors.",
      urgency: "soon",
      domain: "missing",
      regulatory_ref: "Reg 34",
    });
  }

  if (ineffectiveMits > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Replace ${ineffectiveMits} ineffective mitigation${ineffectiveMits !== 1 ? "s" : ""} with evidence-based alternative strategies. Involve the child in identifying what works for them.`,
      urgency: "soon",
      domain: "risk_management",
      regulatory_ref: "Reg 12",
    });
  }

  if (restraint_profile.debrief_rate < 100 && restraints90d.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Ensure all children are debriefed within 24 hours of any restrictive intervention. Document the debrief and incorporate learning into the behaviour support plan.",
      urgency: "soon",
      domain: "restraint",
      regulatory_ref: "Reg 13",
    });
  }

  if (increasingDomains.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Review and strengthen care strategies for domains with increasing risk: ${increasingDomains.map((d) => d.domain.replace(/_/g, " ")).join(", ")}. Consider requesting additional professional input.`,
      urgency: "soon",
      domain: "risk_management",
      regulatory_ref: "Reg 12",
    });
  }

  // ── ARIA Insights ─────────────────────────────────────────────────────
  const insights: SafeguardingInsight[] = [];

  if (safeguarding_status === "critical") {
    insights.push({
      severity: "critical",
      text: `${child_name} has a critical safeguarding profile. Multiple high-risk indicators are present and the current score (${score}%) indicates the home's capacity to safeguard this child may be under significant strain. An urgent multi-agency review is recommended.`,
    });
  }

  if (veryHighDomains.length > 0 && increasingDomains.some((d) => d.current_level === "very_high")) {
    insights.push({
      severity: "critical",
      text: "A very-high-risk domain is on an increasing trajectory. This combination demands immediate escalation — the current approach is not containing the risk. Ofsted would expect evidence of urgent multi-agency response.",
    });
  }

  if (highRiskMissing.length >= 2 && contextualRiskMissing.length > 0) {
    insights.push({
      severity: "critical",
      text: "Multiple high-risk missing episodes with contextual safeguarding concerns. This pattern is consistent with exploitation risk — ensure MACE referral is made and NRM considered.",
    });
  }

  if (decreasingDomains.length >= 2 && increasingDomains.length === 0) {
    insights.push({
      severity: "positive",
      text: `${decreasingDomains.length} risk domains are decreasing with none increasing. This evidences effective safeguarding practice — the therapeutic approach and risk mitigations are working. Inspectors would view this trajectory favourably.`,
    });
  }

  if (safeguarding_status === "safe_and_well" && currentAssessments.length > 0) {
    insights.push({
      severity: "positive",
      text: `${child_name} has a strong safeguarding profile (score: ${score}%). Risk assessments are in place, trends are positive, and the child's voice is evidenced in safety planning. This is exactly what good safeguarding looks like.`,
    });
  }

  if (restraints90d.length === 0 && incidents90d.length <= 2 && missing90d.length === 0) {
    insights.push({
      severity: "positive",
      text: "No restraints, no missing episodes, and minimal incidents. This child is settled and the home environment supports their safety. The absence of restrictive intervention is a positive indicator of relational practice.",
    });
  }

  if (allHaveViews && currentAssessments.length >= 2) {
    insights.push({
      severity: "positive",
      text: `${child_name}'s voice is present in all risk assessments. The child is an active participant in their own safeguarding, which strengthens both the quality of the assessment and the therapeutic relationship.`,
    });
  }

  return {
    generated_at: today,
    child_id,
    child_name,
    safeguarding_status,
    safeguarding_score: score,
    headline,
    risk_domains,
    incident_profile,
    missing_profile,
    restraint_profile,
    contextual_risks_active,
    child_voice,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
