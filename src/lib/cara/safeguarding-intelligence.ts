// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence Engine — Safeguarding
//
// Pure deterministic analysis of safeguarding for LAC in residential care.
// Tracks:
//   - Missing episodes (frequency, duration, return interviews)
//   - Restraint / physical intervention usage
//   - Bullying (as victim or perpetrator)
//   - Safeguarding referrals & outcomes
//   - CSE/CCE/radicalisation risk markers
//   - Online safety provisions
//   - Incident patterns and trends
//   - Location/contextual risk
//
// Regulatory alignment:
//   - CHR 2015 Reg 12 — Protection of children
//   - CHR 2015 Reg 34 — Consultation on behavioural measures
//   - CHR 2015 Reg 35 — Restraint
//   - CHR 2015 Reg 40(4)(c) — Notifiable events
//   - SCCIF — Safety domain ("Children are safe")
//   - Working Together 2023 (WT2023)
//   - Missing from care protocols (DfE statutory guidance)
//
// No AI calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ───────────────────────────────────────────────────────────────────

export type MissingSeverity = "unauthorised_absence" | "missing" | "absent";
export type RestraintType = "physical" | "mechanical" | "environmental";
export type BullyingRole = "victim" | "perpetrator" | "both";
export type RiskLevel = "none" | "low" | "medium" | "high";

export interface MissingEpisode {
  date: string;
  durationHours: number;
  severity: MissingSeverity;
  returnInterviewCompleted: boolean;
  returnInterviewWithin72Hours: boolean;
  policeInvolved: boolean;
  triggerIdentified: boolean;
}

export interface RestraintIncident {
  date: string;
  type: RestraintType;
  durationMinutes: number;
  debrief: boolean;
  injuryToChild: boolean;
  injuryToStaff: boolean;
  ofstedNotified: boolean;
}

export interface BullyingIncident {
  date: string;
  role: BullyingRole;
  type: "physical" | "verbal" | "online" | "social";
  actionTaken: boolean;
  resolved: boolean;
}

export interface SafeguardingReferral {
  date: string;
  type: "cse" | "cce" | "radicalisation" | "neglect" | "abuse" | "online" | "other";
  outcome: "ongoing" | "resolved" | "no_further_action" | "escalated";
  agencyInvolved: string;
}

export interface SafeguardingInput {
  childId: string;
  childName: string;
  age: number;

  // Missing
  missingEpisodes: MissingEpisode[]; // last 6 months
  missingTrend: "increasing" | "stable" | "decreasing";

  // Restraint
  restraintIncidents: RestraintIncident[]; // last 6 months
  restraintTrend: "increasing" | "stable" | "decreasing";

  // Bullying
  bullyingIncidents: BullyingIncident[]; // last 6 months

  // Referrals
  safeguardingReferrals: SafeguardingReferral[]; // last 12 months

  // Risk markers
  cseRiskLevel: RiskLevel;
  cceRiskLevel: RiskLevel;
  radicalisationRiskLevel: RiskLevel;
  onlineSafetyRiskLevel: RiskLevel;

  // Provisions in place
  riskAssessmentCurrent: boolean;
  riskAssessmentDate?: string;
  safeguardingPlanInPlace: boolean;
  locationRiskAssessmentDone: boolean;
  childAwareOfRisks: boolean;
  onlineSafetyPlanInPlace: boolean;
  antibullyingPolicyShared: boolean;
  restraintPolicyShared: boolean;
  independentReturnInterviews: boolean; // independent person conducts return interviews
  staffSafeguardingTrained: boolean;
  designatedSafeguardingLead: boolean;
  localaSafeguardingContactKnown: boolean;
  childKnowsHowToComplain: boolean;
  regularSafeguardingAudits: boolean;
}

// ── Output Types ───────────────────────────────────────────────────────────

export interface SafeguardingAssessment {
  childName: string;
  overallScore: number;
  overallRating: "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate";
  missingScore: number;
  restraintScore: number;
  protectionScore: number;
  complianceScore: number;

  // Key metrics
  missingEpisodeCount: number;
  missingAvgDurationHours: number;
  returnInterviewRate: number;
  restraintCount: number;
  restraintDebriefRate: number;
  bullyingCount: number;
  activeSafeguardingReferrals: number;
  highestExploitationRisk: RiskLevel;

  concerns: SafeguardingConcern[];
  strengths: SafeguardingStrength[];
  regulatoryFlags: RegulatoryFlag[];
  recommendations: string[];
  summary: string;
}

export interface SafeguardingConcern {
  severity: "critical" | "significant" | "moderate" | "low";
  category: string;
  description: string;
}

export interface SafeguardingStrength {
  category: string;
  description: string;
}

export interface RegulatoryFlag {
  regulation: string;
  area: string;
  status: "met" | "partially_met" | "not_met";
  detail: string;
}

// ── Main Engine ─────────────────────────────────────────────────────────────

export function analyseSafeguarding(input: SafeguardingInput): SafeguardingAssessment {
  const { childName } = input;

  // ── Key metrics ─────────────────────────────────────────────────
  const missingEpisodeCount = input.missingEpisodes.length;
  const missingAvgDurationHours = missingEpisodeCount > 0
    ? Math.round((input.missingEpisodes.reduce((s, e) => s + e.durationHours, 0) / missingEpisodeCount) * 10) / 10
    : 0;

  const returnInterviewsDone = input.missingEpisodes.filter(e => e.returnInterviewCompleted).length;
  const returnInterviewRate = missingEpisodeCount > 0
    ? Math.round((returnInterviewsDone / missingEpisodeCount) * 100) / 100
    : 1;

  const restraintCount = input.restraintIncidents.length;
  const debriefsDone = input.restraintIncidents.filter(r => r.debrief).length;
  const restraintDebriefRate = restraintCount > 0
    ? Math.round((debriefsDone / restraintCount) * 100) / 100
    : 1;

  const bullyingCount = input.bullyingIncidents.length;

  const activeSafeguardingReferrals = input.safeguardingReferrals
    .filter(r => r.outcome === "ongoing" || r.outcome === "escalated").length;

  const highestExploitationRisk = getHighestRisk([
    input.cseRiskLevel,
    input.cceRiskLevel,
    input.radicalisationRiskLevel,
  ]);

  // ── Scores ─────────────────────────────────────────────────────
  const missingScore = scoreMissing(input);
  const restraintScore = scoreRestraint(input);
  const protectionScore = scoreProtection(input, highestExploitationRisk);
  const complianceScore = scoreCompliance(input);

  // ── Overall ────────────────────────────────────────────────────
  const overallScore = Math.round(
    missingScore * 0.25 +
    restraintScore * 0.25 +
    protectionScore * 0.30 +
    complianceScore * 0.20
  );
  const overallRating = scoreToRating(overallScore);

  // ── Concerns ───────────────────────────────────────────────────
  const concerns = identifyConcerns(input, highestExploitationRisk, returnInterviewRate, restraintDebriefRate);

  // ── Strengths ──────────────────────────────────────────────────
  const strengths = identifyStrengths(input, missingEpisodeCount, restraintCount, bullyingCount);

  // ── Regulatory flags ───────────────────────────────────────────
  const regulatoryFlags = assessRegulatory(input, returnInterviewRate, restraintDebriefRate, highestExploitationRisk);

  // ── Recommendations ────────────────────────────────────────────
  const recommendations = buildRecommendations(input, returnInterviewRate, restraintDebriefRate, highestExploitationRisk);

  // ── Summary ────────────────────────────────────────────────────
  const summary = buildSummary(childName, overallRating, missingEpisodeCount, restraintCount, highestExploitationRisk);

  return {
    childName,
    overallScore,
    overallRating,
    missingScore,
    restraintScore,
    protectionScore,
    complianceScore,
    missingEpisodeCount,
    missingAvgDurationHours,
    returnInterviewRate,
    restraintCount,
    restraintDebriefRate,
    bullyingCount,
    activeSafeguardingReferrals,
    highestExploitationRisk,
    concerns,
    strengths,
    regulatoryFlags,
    recommendations,
    summary,
  };
}

// ── Scoring ─────────────────────────────────────────────────────────────────

function scoreMissing(input: SafeguardingInput): number {
  const count = input.missingEpisodes.length;
  if (count === 0) return 100;

  let score = 70; // baseline: some missing episodes exist

  // Frequency penalty
  if (count >= 5) score -= 30;
  else if (count >= 3) score -= 20;
  else score -= 10;

  // Long duration penalty (avg > 12 hours)
  const avgDuration = input.missingEpisodes.reduce((s, e) => s + e.durationHours, 0) / count;
  if (avgDuration > 24) score -= 15;
  else if (avgDuration > 12) score -= 10;

  // Trend
  if (input.missingTrend === "decreasing") score += 10;
  else if (input.missingTrend === "increasing") score -= 15;

  // Return interviews
  const riRate = input.missingEpisodes.filter(e => e.returnInterviewCompleted).length / count;
  if (riRate >= 1) score += 10;
  else if (riRate < 0.5) score -= 10;

  // Triggers identified — shows understanding of patterns
  const triggerRate = input.missingEpisodes.filter(e => e.triggerIdentified).length / count;
  if (triggerRate >= 0.75) score += 5;

  return Math.max(0, Math.min(100, score));
}

function scoreRestraint(input: SafeguardingInput): number {
  const count = input.restraintIncidents.length;
  if (count === 0) return 100;

  let score = 60; // baseline: restraint used

  // Frequency penalty
  if (count >= 5) score -= 25;
  else if (count >= 3) score -= 15;
  else score -= 5;

  // Trend
  if (input.restraintTrend === "decreasing") score += 10;
  else if (input.restraintTrend === "increasing") score -= 15;

  // Debriefs
  const debriefRate = input.restraintIncidents.filter(r => r.debrief).length / count;
  if (debriefRate >= 1) score += 15;
  else if (debriefRate >= 0.75) score += 10;
  else score -= 10;

  // Injuries
  const childInjuries = input.restraintIncidents.filter(r => r.injuryToChild).length;
  if (childInjuries > 0) score -= childInjuries * 10;

  // Ofsted notification compliance
  const notified = input.restraintIncidents.filter(r => r.ofstedNotified).length;
  if (notified < count) score -= 10;

  return Math.max(0, Math.min(100, score));
}

function scoreProtection(input: SafeguardingInput, highestRisk: RiskLevel): number {
  let score = 0;

  // Base: no exploitation risk
  if (highestRisk === "none") score += 40;
  else if (highestRisk === "low") score += 30;
  else if (highestRisk === "medium") score += 15;
  else score += 0; // high

  // Provisions in place
  if (input.riskAssessmentCurrent) score += 15;
  if (input.safeguardingPlanInPlace) score += 15;
  if (input.locationRiskAssessmentDone) score += 10;
  if (input.childAwareOfRisks) score += 10;
  if (input.onlineSafetyPlanInPlace) score += 10;

  // Bullying impact
  const unresolvedBullying = input.bullyingIncidents.filter(b => !b.resolved).length;
  if (unresolvedBullying > 0) score -= unresolvedBullying * 5;

  return Math.max(0, Math.min(100, score));
}

function scoreCompliance(input: SafeguardingInput): number {
  let score = 0;

  if (input.staffSafeguardingTrained) score += 15;
  if (input.designatedSafeguardingLead) score += 15;
  if (input.localaSafeguardingContactKnown) score += 10;
  if (input.childKnowsHowToComplain) score += 15;
  if (input.regularSafeguardingAudits) score += 10;
  if (input.antibullyingPolicyShared) score += 10;
  if (input.restraintPolicyShared) score += 10;
  if (input.independentReturnInterviews) score += 15;

  return Math.min(100, score);
}

// ── Concerns ────────────────────────────────────────────────────────────────

function identifyConcerns(
  input: SafeguardingInput,
  highestRisk: RiskLevel,
  returnInterviewRate: number,
  restraintDebriefRate: number,
): SafeguardingConcern[] {
  const concerns: SafeguardingConcern[] = [];

  // Missing — high frequency
  if (input.missingEpisodes.length >= 5) {
    concerns.push({
      severity: "critical",
      category: "missing",
      description: `${input.missingEpisodes.length} missing episodes in 6 months — pattern indicates significant risk`,
    });
  } else if (input.missingEpisodes.length >= 3) {
    concerns.push({
      severity: "significant",
      category: "missing",
      description: `${input.missingEpisodes.length} missing episodes — review triggers and safety response`,
    });
  } else if (input.missingTrend === "increasing") {
    concerns.push({
      severity: "moderate",
      category: "missing",
      description: "Missing episodes increasing — early intervention needed",
    });
  }

  // Return interviews not completed
  if (input.missingEpisodes.length > 0 && returnInterviewRate < 1) {
    const missed = input.missingEpisodes.filter(e => !e.returnInterviewCompleted).length;
    concerns.push({
      severity: returnInterviewRate < 0.5 ? "critical" : "significant",
      category: "return_interviews",
      description: `${missed} return interview(s) not completed — statutory requirement`,
    });
  }

  // Restraint — high frequency
  if (input.restraintIncidents.length >= 5) {
    concerns.push({
      severity: "critical",
      category: "restraint",
      description: `${input.restraintIncidents.length} restraints in 6 months — review de-escalation strategy`,
    });
  } else if (input.restraintIncidents.length >= 3) {
    concerns.push({
      severity: "significant",
      category: "restraint",
      description: `${input.restraintIncidents.length} restraints — consider behavioural support review`,
    });
  } else if (input.restraintTrend === "increasing") {
    concerns.push({
      severity: "moderate",
      category: "restraint",
      description: "Restraint usage increasing — review approach",
    });
  }

  // Restraint debriefs
  if (input.restraintIncidents.length > 0 && restraintDebriefRate < 1) {
    concerns.push({
      severity: "significant",
      category: "debrief",
      description: "Not all restraint incidents debriefed — Reg 35 requirement",
    });
  }

  // Injuries from restraint
  const childInjuries = input.restraintIncidents.filter(r => r.injuryToChild).length;
  if (childInjuries > 0) {
    concerns.push({
      severity: "critical",
      category: "restraint_injury",
      description: `${childInjuries} restraint(s) resulted in injury to child — immediate review required`,
    });
  }

  // Exploitation risk
  if (highestRisk === "high") {
    concerns.push({
      severity: "critical",
      category: "exploitation",
      description: "High exploitation risk identified — specialist intervention and multi-agency response essential",
    });
  } else if (highestRisk === "medium") {
    concerns.push({
      severity: "significant",
      category: "exploitation",
      description: "Medium exploitation risk — active monitoring and disruption plan needed",
    });
  }

  // Online safety
  if (input.onlineSafetyRiskLevel === "high") {
    concerns.push({
      severity: "significant",
      category: "online_safety",
      description: "High online safety risk — review digital access and monitoring",
    });
  }

  // Bullying — unresolved
  const unresolvedBullying = input.bullyingIncidents.filter(b => !b.resolved).length;
  if (unresolvedBullying > 0) {
    concerns.push({
      severity: "moderate",
      category: "bullying",
      description: `${unresolvedBullying} unresolved bullying incident(s) — action needed`,
    });
  }

  // No risk assessment
  if (!input.riskAssessmentCurrent) {
    concerns.push({
      severity: "significant",
      category: "assessment",
      description: "Risk assessment not current — update required",
    });
  }

  // No safeguarding plan when referrals active
  const activeReferrals = input.safeguardingReferrals.filter(r => r.outcome === "ongoing" || r.outcome === "escalated");
  if (activeReferrals.length > 0 && !input.safeguardingPlanInPlace) {
    concerns.push({
      severity: "critical",
      category: "planning",
      description: "Active safeguarding referral without safeguarding plan",
    });
  }

  return concerns;
}

// ── Strengths ───────────────────────────────────────────────────────────────

function identifyStrengths(
  input: SafeguardingInput,
  missingCount: number,
  restraintCount: number,
  bullyingCount: number,
): SafeguardingStrength[] {
  const strengths: SafeguardingStrength[] = [];

  if (missingCount === 0) {
    strengths.push({ category: "missing", description: "No missing episodes — child feels safe and settled" });
  } else if (input.missingTrend === "decreasing") {
    strengths.push({ category: "missing", description: "Missing episodes decreasing — interventions working" });
  }

  if (restraintCount === 0) {
    strengths.push({ category: "restraint", description: "No restraint used — positive behaviour management in place" });
  } else if (input.restraintTrend === "decreasing") {
    strengths.push({ category: "restraint", description: "Restraint usage decreasing — de-escalation strategies effective" });
  }

  if (bullyingCount === 0) {
    strengths.push({ category: "bullying", description: "No bullying incidents reported" });
  }

  if (input.cseRiskLevel === "none" && input.cceRiskLevel === "none" && input.radicalisationRiskLevel === "none") {
    strengths.push({ category: "exploitation", description: "No exploitation risks identified" });
  }

  if (input.staffSafeguardingTrained && input.designatedSafeguardingLead) {
    strengths.push({ category: "compliance", description: "Staff safeguarding trained with designated lead in place" });
  }

  if (input.childKnowsHowToComplain && input.childAwareOfRisks) {
    strengths.push({ category: "empowerment", description: "Child knows how to raise concerns and is aware of risks" });
  }

  if (input.riskAssessmentCurrent && input.locationRiskAssessmentDone) {
    strengths.push({ category: "assessment", description: "Risk and location assessments current" });
  }

  return strengths;
}

// ── Regulatory Flags ────────────────────────────────────────────────────────

function assessRegulatory(
  input: SafeguardingInput,
  returnInterviewRate: number,
  restraintDebriefRate: number,
  highestRisk: RiskLevel,
): RegulatoryFlag[] {
  const flags: RegulatoryFlag[] = [];

  // CHR 2015 Reg 12 — Protection of children
  const reg12Met = input.riskAssessmentCurrent &&
    input.safeguardingPlanInPlace &&
    input.staffSafeguardingTrained &&
    (highestRisk === "none" || highestRisk === "low" || input.safeguardingPlanInPlace);
  flags.push({
    regulation: "CHR 2015 Reg 12",
    area: "Child Protection",
    status: reg12Met ? "met"
      : (input.riskAssessmentCurrent || input.safeguardingPlanInPlace) ? "partially_met"
      : "not_met",
    detail: reg12Met
      ? "Child protection measures in place and current"
      : "Protection measures need strengthening",
  });

  // CHR 2015 Reg 35 — Restraint
  const hasRestraint = input.restraintIncidents.length > 0;
  const reg35Met = !hasRestraint || (restraintDebriefRate >= 1 && input.restraintPolicyShared);
  flags.push({
    regulation: "CHR 2015 Reg 35",
    area: "Restraint",
    status: reg35Met ? "met"
      : restraintDebriefRate >= 0.75 ? "partially_met"
      : "not_met",
    detail: reg35Met
      ? hasRestraint ? "All restraints debriefed, policy shared" : "No restraint used"
      : "Restraint practice needs improvement — debrief or policy gaps",
  });

  // Missing from care — DfE statutory guidance
  const hasMissing = input.missingEpisodes.length > 0;
  const missingCompliant = !hasMissing || (returnInterviewRate >= 1 && input.independentReturnInterviews);
  flags.push({
    regulation: "DfE Missing from Care",
    area: "Return Interviews",
    status: missingCompliant ? "met"
      : returnInterviewRate >= 0.5 ? "partially_met"
      : "not_met",
    detail: missingCompliant
      ? hasMissing ? "Return interviews completed independently" : "No missing episodes"
      : "Return interview compliance below standard",
  });

  // SCCIF — Safety domain
  const sccifSafe = input.missingEpisodes.length <= 2 &&
    input.restraintIncidents.length <= 2 &&
    (highestRisk === "none" || highestRisk === "low") &&
    input.staffSafeguardingTrained;
  flags.push({
    regulation: "SCCIF",
    area: "Children Are Safe",
    status: sccifSafe ? "met"
      : input.staffSafeguardingTrained ? "partially_met"
      : "not_met",
    detail: sccifSafe
      ? "Safety outcomes positive across indicators"
      : "Safety domain needs improvement",
  });

  // CHR 2015 Reg 40(4)(c) — Notifiable events
  const allNotified = input.restraintIncidents.every(r => r.ofstedNotified);
  if (hasRestraint) {
    flags.push({
      regulation: "CHR 2015 Reg 40(4)(c)",
      area: "Ofsted Notifications",
      status: allNotified ? "met" : "not_met",
      detail: allNotified
        ? "All notifiable events reported to Ofsted"
        : "Some restraint incidents not notified to Ofsted",
    });
  }

  return flags;
}

// ── Recommendations ─────────────────────────────────────────────────────────

function buildRecommendations(
  input: SafeguardingInput,
  returnInterviewRate: number,
  restraintDebriefRate: number,
  highestRisk: RiskLevel,
): string[] {
  const recs: string[] = [];

  // Missing
  if (input.missingEpisodes.length >= 3) {
    recs.push("Convene multi-agency strategy to address repeat missing episodes");
  }
  if (input.missingEpisodes.length > 0 && returnInterviewRate < 1) {
    recs.push("Complete outstanding return interviews — statutory requirement");
  }
  if (input.missingEpisodes.length > 0 && !input.independentReturnInterviews) {
    recs.push("Ensure return interviews conducted by independent person");
  }

  // Restraint
  if (input.restraintIncidents.length >= 3) {
    recs.push("Review behaviour support plan and de-escalation strategies");
  }
  if (input.restraintIncidents.length > 0 && restraintDebriefRate < 1) {
    recs.push("Complete all post-restraint debriefs — Reg 35 requirement");
  }
  if (input.restraintIncidents.some(r => r.injuryToChild)) {
    recs.push("URGENT: Review restraint technique — child injury occurred");
  }
  if (input.restraintIncidents.some(r => !r.ofstedNotified)) {
    recs.push("Notify Ofsted of all restraint incidents — Reg 40(4)(c)");
  }

  // Exploitation
  if (highestRisk === "high") {
    recs.push("URGENT: Multi-agency exploitation response — high risk identified");
  } else if (highestRisk === "medium") {
    recs.push("Ensure NRM referral considered and disruption plan active");
  }

  // Online safety
  if (input.onlineSafetyRiskLevel === "high" || input.onlineSafetyRiskLevel === "medium") {
    recs.push("Review online safety provisions and digital access monitoring");
  }
  if (!input.onlineSafetyPlanInPlace) {
    recs.push("Implement online safety plan");
  }

  // Bullying
  const unresolvedBullying = input.bullyingIncidents.filter(b => !b.resolved).length;
  if (unresolvedBullying > 0) {
    recs.push("Resolve outstanding bullying incidents and review prevention strategy");
  }

  // Compliance gaps
  if (!input.riskAssessmentCurrent) {
    recs.push("Update risk assessment — currently out of date");
  }
  if (!input.staffSafeguardingTrained) {
    recs.push("Ensure all staff complete safeguarding training");
  }
  if (!input.designatedSafeguardingLead) {
    recs.push("Appoint and register designated safeguarding lead");
  }
  if (!input.childKnowsHowToComplain) {
    recs.push("Ensure child knows how to make a complaint or raise a concern");
  }
  if (!input.regularSafeguardingAudits) {
    recs.push("Implement regular safeguarding audits");
  }

  return recs;
}

// ── Summary ─────────────────────────────────────────────────────────────────

function buildSummary(
  childName: string,
  rating: string,
  missingCount: number,
  restraintCount: number,
  highestRisk: RiskLevel,
): string {
  const parts: string[] = [];

  if (missingCount === 0) parts.push("no missing episodes");
  else parts.push(`${missingCount} missing episode(s)`);

  if (restraintCount === 0) parts.push("no restraint used");
  else parts.push(`${restraintCount} restraint(s)`);

  if (highestRisk !== "none") parts.push(`exploitation risk ${highestRisk}`);

  return `${childName}: Safeguarding rated ${rating.replace(/_/g, " ")}. ${parts.join(", ")}.`;
}

// ── Utility ─────────────────────────────────────────────────────────────────

function getHighestRisk(levels: RiskLevel[]): RiskLevel {
  const order: RiskLevel[] = ["high", "medium", "low", "none"];
  for (const level of order) {
    if (levels.includes(level)) return level;
  }
  return "none";
}

function scoreToRating(score: number): "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate" {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 55) return "adequate";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}
