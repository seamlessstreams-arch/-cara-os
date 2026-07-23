// ══════════════════════════════════════════════════════════════════════════════
// INTERNET SAFETY MONITORING INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating how well a children's residential
// home manages internet safety, content filtering, online risk management,
// and digital wellbeing for looked-after children.
//
// Scoring model:
//   incident_management        25  — response quality, timeliness, support
//   filtering_safeguards       25  — active filtering, review, severity dist
//   internet_policy            25  — comprehensiveness of internet safety policy
//   staff_internet_readiness   25  — breadth & completeness of staff training
//   TOTAL                     100
//
// Rating thresholds:
//   >= 80  outstanding
//   >= 60  good
//   >= 40  requires_improvement
//   <  40  inadequate
//
// Regulatory basis:
//   - CHR 2015 Reg 12 — Protection of children
//   - CHR 2015 Reg 13 — Promoting positive behaviour (digital behaviour)
//   - SCCIF — Social Care Common Inspection Framework
//   - Keeping Children Safe in Education 2024
//   - Online Safety Act 2023
//   - NMS 4 — National Minimum Standards for Children's Homes
//   - UNCRC Article 17 — Access to information from mass media
//
// No AI. No external calls. No randomness. No Date.now(). Pure input -> output.
// ══════════════════════════════════════════════════════════════════════════════

import { rate, rateOf } from "@/lib/metrics/rate";

// ── Type Unions ──────────────────────────────────────────────────────────────

export type RiskCategory =
  | "grooming"
  | "cyberbullying"
  | "inappropriate_content"
  | "radicalisation"
  | "self_harm_content"
  | "financial_exploitation"
  | "identity_theft"
  | "sexting";

export type FilteringLevel = "strict" | "moderate" | "minimal" | "none";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label Maps & Getters ────────────────────────────────────────────────────

const RISK_CATEGORY_LABELS: Record<RiskCategory, string> = {
  grooming: "Grooming",
  cyberbullying: "Cyberbullying",
  inappropriate_content: "Inappropriate Content",
  radicalisation: "Radicalisation",
  self_harm_content: "Self-Harm Content",
  financial_exploitation: "Financial Exploitation",
  identity_theft: "Identity Theft",
  sexting: "Sexting",
};

const FILTERING_LEVEL_LABELS: Record<FilteringLevel, string> = {
  strict: "Strict",
  moderate: "Moderate",
  minimal: "Minimal",
  none: "None",
};

const INCIDENT_SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getRiskCategoryLabel(category: RiskCategory): string {
  return RISK_CATEGORY_LABELS[category];
}

export function getFilteringLevelLabel(level: FilteringLevel): string {
  return FILTERING_LEVEL_LABELS[level];
}

export function getIncidentSeverityLabel(severity: IncidentSeverity): string {
  return INCIDENT_SEVERITY_LABELS[severity];
}

export function getRatingLabel(rating: Rating): string {
  return RATING_LABELS[rating];
}

// ── Input Interfaces ────────────────────────────────────────────────────────

export interface OnlineSafetyIncident {
  id: string;
  childId: string;
  childName: string;
  incidentDate: string; // ISO date
  riskCategory: RiskCategory;
  severity: IncidentSeverity;
  identifiedBy: "staff" | "filter" | "child_disclosure" | "external_report";
  actionTaken: boolean;
  childSupported: boolean;
  parentNotified: boolean;
  referralMade: boolean;
  recordedTimely: boolean;
  lessonsApplied: boolean;
}

export interface InternetSafetyPolicy {
  id: string;
  contentFilteringActive: boolean;
  filteringLevel: FilteringLevel;
  regularFilterReview: boolean;
  onlineSafetyEducation: boolean;
  socialMediaGuidance: boolean;
  reportingMechanism: boolean;
  deviceManagement: boolean;
}

export interface StaffInternetTraining {
  id: string;
  staffId: string;
  staffName: string;
  onlineSafety: boolean;
  groomingAwareness: boolean;
  cyberbullying: boolean;
  socialMediaRisks: boolean;
  reportingProcedures: boolean;
  ageAppropriateAccess: boolean;
}

// ── Child Internet Profile ──────────────────────────────────────────────────

export interface ChildInternetProfile {
  childId: string;
  childName: string;
  totalIncidents: number;
  highRiskIncidents: number;
  supportedRate: number; // percentage 0-100
  overallScore: number; // 0-10
}

// ── Result Interface ────────────────────────────────────────────────────────

export interface InternetSafetyMonitoringResult {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  // Overall
  overallScore: number; // 0-100
  rating: Rating;

  // Sub-scores (each 0-25)
  incidentManagementScore: number;
  filteringSafeguardsScore: number;
  internetPolicyScore: number;
  staffInternetReadinessScore: number;

  // Key metrics
  totalIncidents: number;
  highCriticalIncidents: number;
  actionTakenRate: number | null;
  childSupportedRate: number | null;
  recordedTimelyRate: number | null;
  lessonsAppliedRate: number | null;
  referralAppropriatenessRate: number | null;  // null = no high/critical incident to refer
  staffTrainingCoverageRate: number | null;    // null = no training records held

  // Breakdowns
  incidentsByCategory: { category: RiskCategory; count: number; label: string }[];
  incidentsBySeverity: { severity: IncidentSeverity; count: number; label: string }[];

  // Child profiles
  childInternetProfiles: ChildInternetProfile[];

  // Insights
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluator 1: Incident Management (0-25) ────────────────────────────────
//
// Empty incidents = 25 (absence of bad things is ideal).
// When incidents exist:
//   action taken + child supported rate → 0-7
//   recording timeliness rate → 0-6
//   referral appropriateness (referralMade when severity high/critical) → 0-6
//   lessons applied rate → 0-6

export function evaluateIncidentManagement(
  incidents: OnlineSafetyIncident[],
): number {
  if (incidents.length === 0) return 25;

  let score = 0;
  const total = incidents.length;

  // 1. Action taken + child supported rate (0-7)
  const actionAndSupported = incidents.filter(
    (i) => i.actionTaken && i.childSupported,
  ).length;
  score += Math.round((actionAndSupported / total) * 7);

  // 2. Recording timeliness rate (0-6)
  const timelyCount = incidents.filter((i) => i.recordedTimely).length;
  score += Math.round((timelyCount / total) * 6);

  // 3. Referral appropriateness: referralMade when severity is high/critical (0-6)
  const highCritical = incidents.filter(
    (i) => i.severity === "high" || i.severity === "critical",
  );
  if (highCritical.length > 0) {
    const referred = highCritical.filter((i) => i.referralMade).length;
    score += Math.round((referred / highCritical.length) * 6);
  } else {
    // No high/critical incidents — award full marks for appropriateness
    score += 6;
  }

  // 4. Lessons applied rate (0-6)
  const lessonsCount = incidents.filter((i) => i.lessonsApplied).length;
  score += Math.round((lessonsCount / total) * 6);

  return Math.max(0, Math.min(25, score));
}

// ── Evaluator 2: Filtering Safeguards (0-25) ───────────────────────────────
//
// Empty incidents + full policy = good. No policy = poor.
//   filtering active + level (strict=6, moderate=4, minimal=2, none=0) → 0-6
//   filter review regular → 0-5
//   low severity distribution when filtering active → 0-7
//   device management → 0-7

export function evaluateFilteringSafeguards(
  incidents: OnlineSafetyIncident[],
  policy: InternetSafetyPolicy | null,
): number {
  if (!policy) return 0;

  let score = 0;

  // 1. Filtering active + level (0-6)
  if (policy.contentFilteringActive) {
    switch (policy.filteringLevel) {
      case "strict":
        score += 6;
        break;
      case "moderate":
        score += 4;
        break;
      case "minimal":
        score += 2;
        break;
      case "none":
        score += 0;
        break;
    }
  }

  // 2. Filter review regular (0-5)
  if (policy.regularFilterReview) {
    score += 5;
  }

  // 3. Low severity distribution when filtering active (0-7)
  if (policy.contentFilteringActive && incidents.length > 0) {
    const lowSeverity = incidents.filter((i) => i.severity === "low").length;
    const lowRate = lowSeverity / incidents.length;
    score += Math.round(lowRate * 7);
  } else if (policy.contentFilteringActive && incidents.length === 0) {
    // No incidents with active filtering = excellent
    score += 7;
  }

  // 4. Device management (0-7)
  if (policy.deviceManagement) {
    score += 7;
  }

  return Math.max(0, Math.min(25, score));
}

// ── Evaluator 3: Internet Policy (0-25) ─────────────────────────────────────
//
// Null policy = 0. 7 boolean/enum fields scored at different weights = 25.

export function evaluateInternetPolicy(
  policy: InternetSafetyPolicy | null,
): number {
  if (!policy) return 0;

  let score = 0;

  // contentFilteringActive (0-4)
  if (policy.contentFilteringActive) score += 4;

  // filteringLevel (0-4): strict=4, moderate=3, minimal=1, none=0
  switch (policy.filteringLevel) {
    case "strict":
      score += 4;
      break;
    case "moderate":
      score += 3;
      break;
    case "minimal":
      score += 1;
      break;
    case "none":
      score += 0;
      break;
  }

  // regularFilterReview (0-4)
  if (policy.regularFilterReview) score += 4;

  // onlineSafetyEducation (0-4)
  if (policy.onlineSafetyEducation) score += 4;

  // socialMediaGuidance (0-3)
  if (policy.socialMediaGuidance) score += 3;

  // reportingMechanism (0-3)
  if (policy.reportingMechanism) score += 3;

  // deviceManagement (0-3)
  if (policy.deviceManagement) score += 3;

  return Math.max(0, Math.min(25, score));
}

// ── Evaluator 4: Staff Internet Readiness (0-25) ────────────────────────────
//
// Empty array = 0.
// 6 boolean training fields scored at different weights = 25.

export function evaluateStaffInternetReadiness(
  training: StaffInternetTraining[],
): number {
  if (training.length === 0) return 0;

  const total = training.length;

  // onlineSafety (0-5)
  const onlineSafetyCount = training.filter((t) => t.onlineSafety).length;
  const onlineSafetyScore = Math.round((onlineSafetyCount / total) * 5);

  // groomingAwareness (0-5)
  const groomingCount = training.filter((t) => t.groomingAwareness).length;
  const groomingScore = Math.round((groomingCount / total) * 5);

  // cyberbullying (0-4)
  const cyberbullyingCount = training.filter((t) => t.cyberbullying).length;
  const cyberbullyingScore = Math.round((cyberbullyingCount / total) * 4);

  // socialMediaRisks (0-4)
  const socialMediaCount = training.filter((t) => t.socialMediaRisks).length;
  const socialMediaScore = Math.round((socialMediaCount / total) * 4);

  // reportingProcedures (0-4)
  const reportingCount = training.filter((t) => t.reportingProcedures).length;
  const reportingScore = Math.round((reportingCount / total) * 4);

  // ageAppropriateAccess (0-3)
  const ageAccessCount = training.filter((t) => t.ageAppropriateAccess).length;
  const ageAccessScore = Math.round((ageAccessCount / total) * 3);

  const score =
    onlineSafetyScore +
    groomingScore +
    cyberbullyingScore +
    socialMediaScore +
    reportingScore +
    ageAccessScore;

  return Math.max(0, Math.min(25, score));
}

// ── Build Child Internet Profiles ───────────────────────────────────────────

export function buildChildInternetProfiles(
  incidents: OnlineSafetyIncident[],
): ChildInternetProfile[] {
  const childMap = new Map<
    string,
    { childName: string; incidents: OnlineSafetyIncident[] }
  >();

  for (const inc of incidents) {
    const existing = childMap.get(inc.childId);
    if (existing) {
      existing.incidents.push(inc);
    } else {
      childMap.set(inc.childId, { childName: inc.childName, incidents: [inc] });
    }
  }

  const profiles: ChildInternetProfile[] = [];

  for (const [childId, data] of childMap) {
    const total = data.incidents.length;
    const highRisk = data.incidents.filter(
      (i) => i.severity === "high" || i.severity === "critical",
    ).length;
    const supported = data.incidents.filter((i) => i.childSupported).length;
    const supportedRate = pct(supported, total);

    // Overall score 0-10: starts at 10, lose points for incidents and severity
    // Deduct 1 per incident (capped so we don't go below 0)
    // Deduct additional 1 per high/critical
    // Add back up to 2 if all supported
    let childScore = 10;
    childScore -= Math.min(total, 5); // max -5 for volume
    childScore -= Math.min(highRisk, 3); // max -3 for severity
    if (total > 0 && supportedRate === 100) childScore += 2;
    else if (total > 0 && supportedRate >= 50) childScore += 1;
    childScore = Math.max(0, Math.min(10, childScore));

    profiles.push({
      childId,
      childName: data.childName,
      totalIncidents: total,
      highRiskIncidents: highRisk,
      supportedRate,
      overallScore: childScore,
    });
  }

  return profiles;
}

// ── Insight Generation ──────────────────────────────────────────────────────

export function generateStrengths(
  incidentManagementScore: number,
  filteringSafeguardsScore: number,
  internetPolicyScore: number,
  staffReadinessScore: number,
  incidents: OnlineSafetyIncident[],
  policy: InternetSafetyPolicy | null,
  training: StaffInternetTraining[],
): string[] {
  const strengths: string[] = [];

  if (incidents.length === 0) {
    strengths.push(
      "No online safety incidents recorded during the period — proactive prevention is effective",
    );
  }

  if (incidentManagementScore >= 20) {
    strengths.push(
      "Incident management is thorough with strong action, support, and timely recording",
    );
  }

  if (filteringSafeguardsScore >= 20) {
    strengths.push(
      "Content filtering and device management safeguards are robust and regularly reviewed",
    );
  }

  if (internetPolicyScore >= 20) {
    strengths.push(
      "Comprehensive internet safety policy covers filtering, education, social media, and reporting",
    );
  }

  if (staffReadinessScore >= 20) {
    strengths.push(
      "Staff are well-trained across all internet safety domains including grooming and cyberbullying awareness",
    );
  }

  if (policy?.contentFilteringActive && policy.filteringLevel === "strict") {
    strengths.push(
      "Strict content filtering is active, providing the highest level of online protection",
    );
  }

  if (policy?.onlineSafetyEducation && policy?.socialMediaGuidance) {
    strengths.push(
      "Children receive both online safety education and social media guidance, supporting digital literacy",
    );
  }

  if (incidents.length > 0) {
    const allSupported = incidents.every((i) => i.childSupported);
    if (allSupported) {
      strengths.push(
        "All children involved in online safety incidents received appropriate support",
      );
    }
  }

  if (training.length > 0) {
    const allHaveGrooming = training.every((t) => t.groomingAwareness);
    if (allHaveGrooming) {
      strengths.push(
        "All staff have completed grooming awareness training, a critical safeguarding competency",
      );
    }
  }

  return strengths;
}

export function generateAreasForImprovement(
  incidentManagementScore: number,
  filteringSafeguardsScore: number,
  internetPolicyScore: number,
  staffReadinessScore: number,
  incidents: OnlineSafetyIncident[],
  policy: InternetSafetyPolicy | null,
  training: StaffInternetTraining[],
): string[] {
  const areas: string[] = [];

  if (!policy) {
    areas.push(
      "No internet safety policy is in place — this is a serious gap and must be addressed urgently",
    );
  }

  if (policy && !policy.contentFilteringActive) {
    areas.push(
      "Content filtering is not active — children are exposed to unfiltered internet access",
    );
  }

  if (policy && policy.contentFilteringActive && policy.filteringLevel === "minimal") {
    areas.push(
      "Filtering level is set to minimal — consider increasing to moderate or strict for looked-after children",
    );
  }

  if (policy && policy.contentFilteringActive && policy.filteringLevel === "none") {
    areas.push(
      "Filtering level is set to none despite filtering being marked as active — configure appropriate filtering",
    );
  }

  if (policy && !policy.regularFilterReview) {
    areas.push(
      "Content filters are not regularly reviewed — filters must be checked and updated at least quarterly",
    );
  }

  if (policy && !policy.onlineSafetyEducation) {
    areas.push(
      "No online safety education programme is in place for children — this is a core Ofsted expectation",
    );
  }

  if (policy && !policy.deviceManagement) {
    areas.push(
      "Device management is not in place — all home devices should be managed and monitored",
    );
  }

  if (training.length === 0) {
    areas.push(
      "No staff have completed internet safety training — this is a fundamental safeguarding requirement",
    );
  }

  if (staffReadinessScore < 15 && training.length > 0) {
    areas.push(
      "Staff internet safety training coverage is below expectations — ensure all staff complete all required modules",
    );
  }

  if (incidents.length > 0) {
    const actionRate = pct(
      incidents.filter((i) => i.actionTaken).length,
      incidents.length,
    );
    if (actionRate < 80) {
      areas.push(
        `Only ${actionRate}% of incidents had action taken — all online safety incidents must receive a documented response`,
      );
    }

    const timelyRate = pct(
      incidents.filter((i) => i.recordedTimely).length,
      incidents.length,
    );
    if (timelyRate < 80) {
      areas.push(
        `Recording timeliness is at ${timelyRate}% — incidents should be recorded within 24 hours`,
      );
    }

    const lessonsRate = pct(
      incidents.filter((i) => i.lessonsApplied).length,
      incidents.length,
    );
    if (lessonsRate < 60) {
      areas.push(
        `Lessons learned are applied in only ${lessonsRate}% of incidents — embed reflective practice after every incident`,
      );
    }
  }

  return areas;
}

export function generateActions(
  incidents: OnlineSafetyIncident[],
  policy: InternetSafetyPolicy | null,
  training: StaffInternetTraining[],
  childProfiles: ChildInternetProfile[],
): string[] {
  const actions: string[] = [];

  // Critical: children with high-risk profiles
  const highRiskChildren = childProfiles.filter((p) => p.highRiskIncidents >= 2);
  for (const child of highRiskChildren) {
    actions.push(
      `URGENT: ${child.childName} has ${child.highRiskIncidents} high/critical internet safety incidents. Convene safeguarding review and update online safety plan.`,
    );
  }

  // Critical: no policy
  if (!policy) {
    actions.push(
      "URGENT: Develop and implement an internet safety policy immediately. This is a regulatory requirement under CHR 2015 Reg 12.",
    );
  }

  // High: filtering gaps
  if (policy && !policy.contentFilteringActive) {
    actions.push(
      "HIGH: Activate content filtering on all home devices and networks. Children must not have unfiltered internet access.",
    );
  }

  // High: no training
  if (training.length === 0) {
    actions.push(
      "HIGH: Schedule internet safety training for all staff covering online grooming, cyberbullying, and reporting procedures.",
    );
  }

  // Medium: unsupported children
  const unsupportedChildren = childProfiles.filter(
    (p) => p.totalIncidents > 0 && p.supportedRate < 100,
  );
  for (const child of unsupportedChildren) {
    actions.push(
      `MEDIUM: ${child.childName} was not consistently supported after incidents (${child.supportedRate}% supported). Review key worker response.`,
    );
  }

  // Medium: referral gaps for high/critical
  if (incidents.length > 0) {
    const highCritNoRef = incidents.filter(
      (i) =>
        (i.severity === "high" || i.severity === "critical") && !i.referralMade,
    );
    if (highCritNoRef.length > 0) {
      actions.push(
        `MEDIUM: ${highCritNoRef.length} high/critical incident(s) had no referral made. Review referral pathways and thresholds.`,
      );
    }
  }

  // Low: policy enhancements
  if (policy && !policy.socialMediaGuidance) {
    actions.push(
      "LOW: Develop social media guidance for children covering safe use, privacy settings, and reporting mechanisms.",
    );
  }

  if (policy && !policy.reportingMechanism) {
    actions.push(
      "LOW: Establish a clear reporting mechanism for children and staff to report online safety concerns (e.g. CEOP button, IWF reporting).",
    );
  }

  if (actions.length === 0) {
    actions.push(
      "No immediate actions required. Continue maintaining strong internet safety practices and regular monitoring.",
    );
  }

  return actions;
}

export function generateRegulatoryLinks(
  incidents: OnlineSafetyIncident[],
  policy: InternetSafetyPolicy | null,
): string[] {
  const links: string[] = [
    "CHR 2015 Reg 12 — Protection of children (includes online harm prevention)",
    "CHR 2015 Reg 13 — Promoting positive behaviour (digital behaviour expectations)",
    "SCCIF — Social Care Common Inspection Framework (online safety culture)",
    "Keeping Children Safe in Education 2024 — Online safety responsibilities",
    "Online Safety Act 2023 — Duties of care for online services used by children",
    "NMS 4 — National Minimum Standards for Children's Homes (safeguarding)",
    "UNCRC Article 17 — Right to access information balanced with protection",
  ];

  // Add contextual links
  const hasGrooming = incidents.some((i) => i.riskCategory === "grooming");
  if (hasGrooming) {
    links.push(
      "KCSIE 2024 Annex B — Online grooming indicators and response",
    );
  }

  const hasRadicalisation = incidents.some(
    (i) => i.riskCategory === "radicalisation",
  );
  if (hasRadicalisation) {
    links.push(
      "Prevent Duty Guidance 2015 — Online radicalisation awareness and reporting",
    );
  }

  const hasSexting = incidents.some((i) => i.riskCategory === "sexting");
  if (hasSexting) {
    links.push(
      "UKCIS Sharing Nudes and Semi-Nudes Guidance — Response to sexting incidents",
    );
  }

  if (!policy || !policy.contentFilteringActive) {
    links.push(
      "DfE Filtering and Monitoring Standards — Requirements for content filtering in care settings",
    );
  }

  return links;
}

// ── Main Orchestrator ───────────────────────────────────────────────────────

export function generateInternetSafetyMonitoringIntelligence(
  incidents: OnlineSafetyIncident[],
  policy: InternetSafetyPolicy | null,
  training: StaffInternetTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): InternetSafetyMonitoringResult {
  const assessedAt = periodEnd; // deterministic — no Date.now()

  // Sub-scores
  const incidentManagementScore = evaluateIncidentManagement(incidents);
  const filteringSafeguardsScore = evaluateFilteringSafeguards(incidents, policy);
  const internetPolicyScore = evaluateInternetPolicy(policy);
  const staffInternetReadinessScore = evaluateStaffInternetReadiness(training);

  const overallScore = Math.max(
    0,
    Math.min(
      100,
      incidentManagementScore +
        filteringSafeguardsScore +
        internetPolicyScore +
        staffInternetReadinessScore,
    ),
  );
  const rating = getRating(overallScore);

  // Key metrics
  const totalIncidents = incidents.length;
  const highCriticalIncidents = incidents.filter(
    (i) => i.severity === "high" || i.severity === "critical",
  ).length;
  const actionTakenRate = rate(
    incidents.filter((i) => i.actionTaken).length,
    totalIncidents,
  );
  const childSupportedRate = rate(
    incidents.filter((i) => i.childSupported).length,
    totalIncidents,
  );
  const recordedTimelyRate = rate(
    incidents.filter((i) => i.recordedTimely).length,
    totalIncidents,
  );
  const lessonsAppliedRate = rate(
    incidents.filter((i) => i.lessonsApplied).length,
    totalIncidents,
  );

  // Referral appropriateness: referralMade when high/critical
  const highCritical = incidents.filter(
    (i) => i.severity === "high" || i.severity === "critical",
  );
  const referralAppropriatenessRate = rateOf(
    highCritical.filter((i) => i.referralMade),
    highCritical,
  );

  // Staff training coverage
  const staffTrainingCoverageRate = rateOf(
    training.filter(
      (t) =>
        t.onlineSafety &&
        t.groomingAwareness &&
        t.cyberbullying &&
        t.socialMediaRisks &&
        t.reportingProcedures &&
        t.ageAppropriateAccess,
    ),
    training,
  );

  // Incidents by category
  const categoryMap = new Map<RiskCategory, number>();
  for (const inc of incidents) {
    categoryMap.set(inc.riskCategory, (categoryMap.get(inc.riskCategory) ?? 0) + 1);
  }
  const incidentsByCategory = [...categoryMap.entries()].map(([category, count]) => ({
    category,
    count,
    label: getRiskCategoryLabel(category),
  }));

  // Incidents by severity
  const severityMap = new Map<IncidentSeverity, number>();
  for (const inc of incidents) {
    severityMap.set(inc.severity, (severityMap.get(inc.severity) ?? 0) + 1);
  }
  const incidentsBySeverity = [...severityMap.entries()].map(
    ([severity, count]) => ({
      severity,
      count,
      label: getIncidentSeverityLabel(severity),
    }),
  );

  // Child profiles
  const childInternetProfiles = buildChildInternetProfiles(incidents);

  // Insights
  const strengths = generateStrengths(
    incidentManagementScore,
    filteringSafeguardsScore,
    internetPolicyScore,
    staffInternetReadinessScore,
    incidents,
    policy,
    training,
  );
  const areasForImprovement = generateAreasForImprovement(
    incidentManagementScore,
    filteringSafeguardsScore,
    internetPolicyScore,
    staffInternetReadinessScore,
    incidents,
    policy,
    training,
  );
  const actionsResult = generateActions(incidents, policy, training, childInternetProfiles);
  const regulatoryLinks = generateRegulatoryLinks(incidents, policy);

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    incidentManagementScore,
    filteringSafeguardsScore,
    internetPolicyScore,
    staffInternetReadinessScore,
    totalIncidents,
    highCriticalIncidents,
    actionTakenRate,
    childSupportedRate,
    recordedTimelyRate,
    lessonsAppliedRate,
    referralAppropriatenessRate,
    staffTrainingCoverageRate,
    incidentsByCategory,
    incidentsBySeverity,
    childInternetProfiles,
    strengths,
    areasForImprovement,
    actions: actionsResult,
    regulatoryLinks,
  };
}
