// ══════════════════════════════════════════════════════════════════════════════
// ESCALATION & THRESHOLD DECISION INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating whether concerns are escalated
// at the right time, to the right people, through the right channels.
//
// Ofsted's SCCIF focuses heavily on threshold decisions:
//   "Staff identify and respond to all forms of abuse and exploitation…
//    Thresholds for referral are appropriate and applied consistently."
//
// Regulatory basis:
//   - CHR 2015, Reg 12 — Protection of children
//   - CHR 2015, Reg 34 — Review of quality of care
//   - CHR 2015, Reg 40 — Notification of serious events (Sch. 5)
//   - CHR 2015, Reg 36(1)(e) — Notifications: serious injury, abuse
//   - Working Together to Safeguard Children 2023
//   - Local authority threshold documents
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

import { withinPeriod } from "@/lib/date-period";
import { below, meets, rate, rateOf, weightedMeanOf } from "@/lib/metrics/rate";

// ── Types ──────────────────────────────────────────────────────────────────

export type ConcernCategory =
  | "safeguarding"
  | "exploitation"
  | "missing"
  | "self_harm"
  | "violence"
  | "substance_misuse"
  | "health_emergency"
  | "medication_error"
  | "staff_allegation"
  | "peer_on_peer_abuse"
  | "online_harm"
  | "radicalisation"
  | "restraint_injury"
  | "property_damage"
  | "emotional_distress";

export type ThresholdLevel =
  | "level_1_universal"
  | "level_2_early_help"
  | "level_3_child_in_need"
  | "level_4_child_protection";

export type EscalationTarget =
  | "internal_manager"
  | "registered_manager"
  | "responsible_individual"
  | "ofsted"
  | "local_authority_mash"
  | "police"
  | "lado"
  | "nhs_emergency"
  | "camhs_crisis"
  | "placing_authority"
  | "independent_reviewer"
  | "dbs";

export type NotificationTimeframe =
  | "immediate" // within 1 hour
  | "same_day" // within working day
  | "within_24_hours"
  | "within_48_hours"
  | "within_5_working_days"
  | "within_14_days";

export type EscalationOutcome =
  | "appropriate_and_timely"
  | "appropriate_but_delayed"
  | "under_escalated"
  | "over_escalated"
  | "not_escalated"
  | "pending";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface ConcernRecord {
  id: string;
  date: string; // ISO date
  time: string; // HH:MM
  category: ConcernCategory;
  severity: 1 | 2 | 3 | 4 | 5;
  childId?: string;
  childName?: string;
  raisedBy: string;
  description: string;
  contextFactors: string[];
  previousOccurrences: number;
  immediateRiskPresent: boolean;
}

export interface EscalationRecord {
  id: string;
  concernId: string;
  escalatedTo: EscalationTarget;
  escalatedBy: string;
  escalatedAt: string; // ISO datetime
  method: "phone" | "email" | "form" | "in_person" | "portal";
  responseReceived: boolean;
  responseTime?: string; // ISO datetime
  referenceNumber?: string;
  outcome?: string;
}

export interface ThresholdRule {
  category: ConcernCategory;
  minSeverity: number;
  requiredEscalations: EscalationTarget[];
  timeframe: NotificationTimeframe;
  regulatoryBasis: string;
  additionalConditions?: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface ThresholdAssessment {
  concernId: string;
  category: ConcernCategory;
  severity: number;
  determinedLevel: ThresholdLevel;
  requiredEscalations: {
    target: EscalationTarget;
    timeframe: NotificationTimeframe;
    regulatoryBasis: string;
  }[];
  actualEscalations: EscalationRecord[];
  missingEscalations: {
    target: EscalationTarget;
    timeframe: NotificationTimeframe;
    isOverdue: boolean;
    hoursOverdue?: number;
  }[];
  outcome: EscalationOutcome;
  timeliness: "on_time" | "delayed" | "not_completed";
  concerns: string[];
}

export interface HomeEscalationMetrics {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  // Summary — null when no concern in the period could be assessed, so there
  // is no escalation practice to score either way.
  overallScore: number | null; // 0-100
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate" | "not_assessed";

  // Counts
  totalConcernsRaised: number;
  totalEscalations: number;
  escalationsTimely: number;
  escalationsDelayed: number;
  escalationsMissing: number;

  // Threshold accuracy
  appropriateThresholds: number;
  underEscalated: number;
  overEscalated: number;
  thresholdAccuracyRate: number | null;

  // Notification compliance
  ofstedNotified: number;
  ofstedRequired: number;
  ofstedComplianceRate: number | null;   // null when no concern required Ofsted notification
  laNotified: number;
  laRequired: number;
  laComplianceRate: number | null;       // null when no concern required LA notification

  // Per-concern breakdown
  assessments: ThresholdAssessment[];

  // Quality indicators
  averageResponseTimeHours: number;
  multiAgencyEngagementRate: number | null;

  // Actions & regulatory
  strengths: string[];
  concerns: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Threshold Rules Database ───────────────────────────────────────────────
// Maps concern category + severity to required escalation targets and timeframes

const THRESHOLD_RULES: ThresholdRule[] = [
  // Safeguarding — always escalate
  { category: "safeguarding", minSeverity: 1, requiredEscalations: ["internal_manager"], timeframe: "immediate", regulatoryBasis: "CHR 2015, Reg 12(2)(a)" },
  { category: "safeguarding", minSeverity: 3, requiredEscalations: ["registered_manager", "local_authority_mash"], timeframe: "immediate", regulatoryBasis: "CHR 2015, Reg 12(2)(a); Working Together 2023" },
  { category: "safeguarding", minSeverity: 4, requiredEscalations: ["registered_manager", "local_authority_mash", "police", "ofsted"], timeframe: "immediate", regulatoryBasis: "CHR 2015, Reg 40(4)(a); Sch 5 Para 1" },

  // Exploitation
  { category: "exploitation", minSeverity: 1, requiredEscalations: ["internal_manager", "registered_manager"], timeframe: "immediate", regulatoryBasis: "CHR 2015, Reg 12; Working Together 2023" },
  { category: "exploitation", minSeverity: 3, requiredEscalations: ["registered_manager", "local_authority_mash", "police"], timeframe: "immediate", regulatoryBasis: "CHR 2015, Reg 12; Reg 40(4)(a)" },
  { category: "exploitation", minSeverity: 4, requiredEscalations: ["registered_manager", "local_authority_mash", "police", "ofsted"], timeframe: "immediate", regulatoryBasis: "CHR 2015, Reg 40(4)(a); Sch 5" },

  // Missing from care
  { category: "missing", minSeverity: 1, requiredEscalations: ["internal_manager"], timeframe: "immediate", regulatoryBasis: "CHR 2015, Reg 12(2)(b)" },
  { category: "missing", minSeverity: 2, requiredEscalations: ["internal_manager", "police", "placing_authority"], timeframe: "immediate", regulatoryBasis: "CHR 2015, Reg 12(2)(b); Missing Persons Protocol" },
  { category: "missing", minSeverity: 4, requiredEscalations: ["registered_manager", "police", "placing_authority", "ofsted"], timeframe: "immediate", regulatoryBasis: "CHR 2015, Reg 40(4)(d); Sch 5 Para 5" },

  // Self-harm
  { category: "self_harm", minSeverity: 1, requiredEscalations: ["internal_manager"], timeframe: "same_day", regulatoryBasis: "CHR 2015, Reg 10(2)(d)" },
  { category: "self_harm", minSeverity: 3, requiredEscalations: ["registered_manager", "camhs_crisis", "placing_authority"], timeframe: "immediate", regulatoryBasis: "CHR 2015, Reg 10(2)(d); Reg 40" },
  { category: "self_harm", minSeverity: 5, requiredEscalations: ["registered_manager", "nhs_emergency", "placing_authority", "ofsted"], timeframe: "immediate", regulatoryBasis: "CHR 2015, Reg 40(4)(a); Sch 5 Para 1" },

  // Violence
  { category: "violence", minSeverity: 1, requiredEscalations: ["internal_manager"], timeframe: "same_day", regulatoryBasis: "CHR 2015, Reg 12(2)(a)" },
  { category: "violence", minSeverity: 3, requiredEscalations: ["registered_manager", "placing_authority"], timeframe: "within_24_hours", regulatoryBasis: "CHR 2015, Reg 12; Reg 40" },
  { category: "violence", minSeverity: 4, requiredEscalations: ["registered_manager", "police", "placing_authority", "ofsted"], timeframe: "immediate", regulatoryBasis: "CHR 2015, Reg 40(4)(a); Sch 5 Para 1" },

  // Staff allegation
  { category: "staff_allegation", minSeverity: 1, requiredEscalations: ["registered_manager", "responsible_individual"], timeframe: "immediate", regulatoryBasis: "CHR 2015, Reg 12(3); Working Together 2023" },
  { category: "staff_allegation", minSeverity: 3, requiredEscalations: ["registered_manager", "responsible_individual", "lado", "ofsted"], timeframe: "immediate", regulatoryBasis: "CHR 2015, Reg 12(3); Reg 40(4)(b); LADO process" },
  { category: "staff_allegation", minSeverity: 4, requiredEscalations: ["registered_manager", "responsible_individual", "lado", "police", "dbs", "ofsted"], timeframe: "immediate", regulatoryBasis: "CHR 2015, Reg 40(4)(b); Sch 5 Para 3; DBS referral duty" },

  // Peer-on-peer abuse
  { category: "peer_on_peer_abuse", minSeverity: 2, requiredEscalations: ["registered_manager", "placing_authority"], timeframe: "same_day", regulatoryBasis: "CHR 2015, Reg 12(2)(a); Working Together 2023" },
  { category: "peer_on_peer_abuse", minSeverity: 4, requiredEscalations: ["registered_manager", "local_authority_mash", "placing_authority", "ofsted"], timeframe: "immediate", regulatoryBasis: "CHR 2015, Reg 12; Reg 40(4)(a)" },

  // Health emergency
  { category: "health_emergency", minSeverity: 3, requiredEscalations: ["nhs_emergency", "registered_manager", "placing_authority"], timeframe: "immediate", regulatoryBasis: "CHR 2015, Reg 10(1); Reg 40" },
  { category: "health_emergency", minSeverity: 5, requiredEscalations: ["nhs_emergency", "registered_manager", "placing_authority", "ofsted"], timeframe: "immediate", regulatoryBasis: "CHR 2015, Reg 40(4)(a); Sch 5 Para 1" },

  // Medication error
  { category: "medication_error", minSeverity: 2, requiredEscalations: ["registered_manager"], timeframe: "same_day", regulatoryBasis: "CHR 2015, Reg 23" },
  { category: "medication_error", minSeverity: 4, requiredEscalations: ["registered_manager", "nhs_emergency", "placing_authority", "ofsted"], timeframe: "immediate", regulatoryBasis: "CHR 2015, Reg 23; Reg 40(4)(a)" },

  // Restraint injury
  { category: "restraint_injury", minSeverity: 2, requiredEscalations: ["registered_manager", "placing_authority"], timeframe: "within_24_hours", regulatoryBasis: "CHR 2015, Reg 35; Reg 40" },
  { category: "restraint_injury", minSeverity: 4, requiredEscalations: ["registered_manager", "placing_authority", "ofsted"], timeframe: "immediate", regulatoryBasis: "CHR 2015, Reg 35; Reg 40(4)(a); Sch 5 Para 1" },

  // Substance misuse
  { category: "substance_misuse", minSeverity: 2, requiredEscalations: ["internal_manager", "registered_manager"], timeframe: "same_day", regulatoryBasis: "CHR 2015, Reg 10(2)(d)" },
  { category: "substance_misuse", minSeverity: 4, requiredEscalations: ["registered_manager", "nhs_emergency", "placing_authority"], timeframe: "immediate", regulatoryBasis: "CHR 2015, Reg 10(2)(d); Reg 40" },

  // Online harm
  { category: "online_harm", minSeverity: 2, requiredEscalations: ["registered_manager"], timeframe: "same_day", regulatoryBasis: "CHR 2015, Reg 12(2)(a); Keeping Children Safe in Education" },
  { category: "online_harm", minSeverity: 4, requiredEscalations: ["registered_manager", "police", "local_authority_mash", "ofsted"], timeframe: "immediate", regulatoryBasis: "CHR 2015, Reg 12; Reg 40(4)(a)" },

  // Radicalisation
  { category: "radicalisation", minSeverity: 1, requiredEscalations: ["registered_manager"], timeframe: "same_day", regulatoryBasis: "Prevent Duty; CHR 2015, Reg 12" },
  { category: "radicalisation", minSeverity: 3, requiredEscalations: ["registered_manager", "police", "local_authority_mash"], timeframe: "immediate", regulatoryBasis: "Prevent Duty; CHR 2015, Reg 12; Counter-Terrorism Act 2015" },
];

// ── Helper: Timeframe to hours ─────────────────────────────────────────────

function timeframeToHours(tf: NotificationTimeframe): number {
  switch (tf) {
    case "immediate": return 1;
    case "same_day": return 8;
    case "within_24_hours": return 24;
    case "within_48_hours": return 48;
    case "within_5_working_days": return 5 * 8;
    case "within_14_days": return 14 * 24;
  }
}

// ── Helper: Hours between datetimes ────────────────────────────────────────

function hoursBetween(dt1: string, dt2: string): number {
  const d1 = new Date(dt1);
  const d2 = new Date(dt2);
  return Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60);
}

// ── Core: Determine threshold level ────────────────────────────────────────

export function determineThresholdLevel(
  category: ConcernCategory,
  severity: number,
  previousOccurrences: number,
  immediateRisk: boolean,
): ThresholdLevel {
  // Immediate risk always pushes to level 4
  if (immediateRisk && severity >= 3) return "level_4_child_protection";
  if (immediateRisk && severity >= 1) return "level_3_child_in_need";

  // Category-severity mapping
  const highSeverityCategories: ConcernCategory[] = [
    "safeguarding", "exploitation", "staff_allegation", "radicalisation",
  ];

  if (highSeverityCategories.includes(category)) {
    if (severity >= 4) return "level_4_child_protection";
    if (severity >= 2) return "level_3_child_in_need";
    return "level_2_early_help";
  }

  if (severity >= 5) return "level_4_child_protection";
  if (severity >= 4) return "level_3_child_in_need";
  if (severity >= 3 || previousOccurrences >= 3) return "level_3_child_in_need";
  if (severity >= 2 || previousOccurrences >= 1) return "level_2_early_help";
  return "level_1_universal";
}

// ── Core: Get required escalations for a concern ───────────────────────────

export function getRequiredEscalations(
  concern: ConcernRecord,
): { target: EscalationTarget; timeframe: NotificationTimeframe; regulatoryBasis: string }[] {
  const matchingRules = THRESHOLD_RULES.filter(
    (rule) =>
      rule.category === concern.category &&
      concern.severity >= rule.minSeverity,
  );

  // Merge all required targets from matching rules (most severe takes precedence)
  const targetMap = new Map<EscalationTarget, { timeframe: NotificationTimeframe; regulatoryBasis: string }>();

  for (const rule of matchingRules) {
    for (const target of rule.requiredEscalations) {
      const existing = targetMap.get(target);
      if (!existing || timeframeToHours(rule.timeframe) < timeframeToHours(existing.timeframe)) {
        targetMap.set(target, {
          timeframe: rule.timeframe,
          regulatoryBasis: rule.regulatoryBasis,
        });
      }
    }
  }

  return [...targetMap.entries()].map(([target, meta]) => ({
    target,
    timeframe: meta.timeframe,
    regulatoryBasis: meta.regulatoryBasis,
  }));
}

// ── Core: Assess a single concern ──────────────────────────────────────────

export function assessConcern(
  concern: ConcernRecord,
  escalations: EscalationRecord[],
  currentDate: string,
): ThresholdAssessment {
  const determinedLevel = determineThresholdLevel(
    concern.category,
    concern.severity,
    concern.previousOccurrences,
    concern.immediateRiskPresent,
  );

  const requiredEscalations = getRequiredEscalations(concern);
  const concernEscalations = escalations.filter((e) => e.concernId === concern.id);

  // Check each required escalation
  const missingEscalations: ThresholdAssessment["missingEscalations"] = [];
  let allTimely = true;
  let allCompleted = true;

  for (const req of requiredEscalations) {
    const actual = concernEscalations.find((e) => e.escalatedTo === req.target);

    if (!actual) {
      const concernDateTime = `${concern.date}T${concern.time}:00`;
      const deadlineHours = timeframeToHours(req.timeframe);
      const hoursSince = hoursBetween(concernDateTime, currentDate);
      const isOverdue = hoursSince > deadlineHours;

      missingEscalations.push({
        target: req.target,
        timeframe: req.timeframe,
        isOverdue,
        hoursOverdue: isOverdue ? Math.round(hoursSince - deadlineHours) : undefined,
      });
      allCompleted = false;
      if (isOverdue) allTimely = false;
    } else {
      // Check timeliness
      const concernDateTime = `${concern.date}T${concern.time}:00`;
      const escalationHours = hoursBetween(concernDateTime, actual.escalatedAt);
      const deadlineHours = timeframeToHours(req.timeframe);
      if (escalationHours > deadlineHours) {
        allTimely = false;
      }
    }
  }

  // Determine outcome
  let outcome: EscalationOutcome;
  if (requiredEscalations.length === 0) {
    // No threshold rule matched this category/severity. Don't blanket-pass it: a
    // serious concern (child-in-need / child-protection level, or with immediate
    // risk present) that has no rule AND nothing escalated must still be surfaced,
    // not silently scored as compliant.
    const serious =
      determinedLevel === "level_3_child_in_need" ||
      determinedLevel === "level_4_child_protection" ||
      concern.immediateRiskPresent;
    outcome = serious && concernEscalations.length === 0 ? "not_escalated" : "appropriate_and_timely";
  } else if (allCompleted && allTimely) {
    outcome = "appropriate_and_timely";
  } else if (allCompleted && !allTimely) {
    outcome = "appropriate_but_delayed";
  } else if (missingEscalations.some((m) => m.isOverdue)) {
    // "Not escalated" only when ALL required targets are actually overdue; targets
    // still within their window are not failures, just not-yet-due.
    const overdueCount = missingEscalations.filter((m) => m.isOverdue).length;
    outcome = overdueCount === requiredEscalations.length ? "not_escalated" : "under_escalated";
  } else {
    outcome = "pending";
  }

  const timeliness: ThresholdAssessment["timeliness"] =
    allCompleted && allTimely ? "on_time" : allCompleted ? "delayed" : "not_completed";

  // Generate concern-level issues
  const assessmentConcerns: string[] = [];
  for (const missing of missingEscalations) {
    if (missing.isOverdue) {
      assessmentConcerns.push(
        `${getEscalationTargetLabel(missing.target)} notification overdue by ${missing.hoursOverdue}hrs (required: ${getTimeframeLabel(missing.timeframe)})`,
      );
    }
  }
  if (outcome === "under_escalated") {
    assessmentConcerns.push("Concern was under-escalated: not all required parties notified");
  }

  return {
    concernId: concern.id,
    category: concern.category,
    severity: concern.severity,
    determinedLevel,
    requiredEscalations,
    actualEscalations: concernEscalations,
    missingEscalations,
    outcome,
    timeliness,
    concerns: assessmentConcerns,
  };
}

// ── Main: Generate Home Escalation Metrics ─────────────────────────────────

export function generateEscalationMetrics(
  concerns: ConcernRecord[],
  escalations: EscalationRecord[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  currentDate: string,
): HomeEscalationMetrics {
  const assessedAt = new Date().toISOString();

  // Filter to period
  const periodConcerns = concerns.filter(
    (c) => withinPeriod(c.date, periodStart, periodEnd),
  );

  // Assess each concern
  const assessments = periodConcerns.map((c) =>
    assessConcern(c, escalations, currentDate),
  );

  // Aggregate metrics
  const totalConcernsRaised = periodConcerns.length;
  const totalEscalations = escalations.filter((e) =>
    periodConcerns.some((c) => c.id === e.concernId),
  ).length;

  const escalationsTimely = assessments.filter((a) => a.timeliness === "on_time").length;
  const escalationsDelayed = assessments.filter((a) => a.timeliness === "delayed").length;
  const escalationsMissing = assessments.filter(
    (a) => a.outcome === "not_escalated" || a.outcome === "under_escalated",
  ).length;

  // Threshold accuracy
  const appropriateThresholds = assessments.filter(
    (a) => a.outcome === "appropriate_and_timely" || a.outcome === "appropriate_but_delayed",
  ).length;
  const underEscalated = assessments.filter((a) => a.outcome === "under_escalated" || a.outcome === "not_escalated").length;
  const overEscalated = assessments.filter((a) => a.outcome === "over_escalated").length;
  const thresholdAccuracyRate = rate(appropriateThresholds, totalConcernsRaised);

  // Ofsted notification compliance
  const ofstedRequired = assessments.filter((a) =>
    a.requiredEscalations.some((e) => e.target === "ofsted"),
  ).length;
  const ofstedNotified = assessments.filter((a) =>
    a.requiredEscalations.some((e) => e.target === "ofsted") &&
    a.actualEscalations.some((e) => e.escalatedTo === "ofsted"),
  ).length;
  // Null when nothing met the Ofsted threshold — no notification was owed, which
  // is not the same as every owed notification having been made.
  const ofstedComplianceRate = rate(ofstedNotified, ofstedRequired);

  // LA notification compliance
  const laTargets: EscalationTarget[] = ["local_authority_mash", "placing_authority"];
  const laRequired = assessments.filter((a) =>
    a.requiredEscalations.some((e) => laTargets.includes(e.target)),
  ).length;
  const laNotified = assessments.filter((a) =>
    a.requiredEscalations.some((e) => laTargets.includes(e.target)) &&
    a.actualEscalations.some((e) => laTargets.includes(e.escalatedTo)),
  ).length;
  const laComplianceRate = rate(laNotified, laRequired);

  // Average response time (from escalations that got a response)
  const responseTimes = escalations
    .filter((e) => e.responseReceived && e.responseTime)
    .map((e) => hoursBetween(e.escalatedAt, e.responseTime!));
  const averageResponseTimeHours =
    responseTimes.length > 0
      ? Math.round((responseTimes.reduce((s, t) => s + t, 0) / responseTimes.length) * 10) / 10
      : 0;

  // Multi-agency engagement
  const multiAgencyTargets: EscalationTarget[] = [
    "local_authority_mash", "police", "lado", "nhs_emergency", "camhs_crisis", "placing_authority",
  ];
  const concernsNeedingMultiAgency = assessments.filter((a) =>
    a.requiredEscalations.some((e) => multiAgencyTargets.includes(e.target)),
  );
  const multiAgencyEngaged = concernsNeedingMultiAgency.filter((a) =>
    a.actualEscalations.some((e) => multiAgencyTargets.includes(e.escalatedTo)),
  );
  const multiAgencyEngagementRate = rateOf(multiAgencyEngaged, concernsNeedingMultiAgency);

  // Calculate overall score
  const overallScore = calculateEscalationScore(
    thresholdAccuracyRate,
    ofstedComplianceRate,
    laComplianceRate,
    escalationsTimely,
    totalConcernsRaised,
    escalationsMissing,
    multiAgencyEngagementRate,
  );

  const rating = getEscalationRating(overallScore);

  // Insights
  const strengths = generateEscalationStrengths(
    thresholdAccuracyRate, ofstedComplianceRate, laComplianceRate,
    multiAgencyEngagementRate, assessments,
  );
  const insightConcerns = generateEscalationConcerns(
    assessments, ofstedComplianceRate, laComplianceRate,
    multiAgencyEngagementRate,
  );
  const immediateActions = generateEscalationActions(assessments, currentDate);
  const regulatoryLinks = generateEscalationRegulatoryLinks(assessments);

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    totalConcernsRaised,
    totalEscalations,
    escalationsTimely,
    escalationsDelayed,
    escalationsMissing,
    appropriateThresholds,
    underEscalated,
    overEscalated,
    thresholdAccuracyRate,
    ofstedNotified,
    ofstedRequired,
    ofstedComplianceRate,
    laNotified,
    laRequired,
    laComplianceRate,
    assessments,
    averageResponseTimeHours,
    multiAgencyEngagementRate,
    strengths,
    concerns: insightConcerns,
    immediateActions,
    regulatoryLinks,
  };
}

// ── Scoring ────────────────────────────────────────────────────────────────

function calculateEscalationScore(
  thresholdAccuracy: number | null,
  ofstedCompliance: number | null,
  laCompliance: number | null,
  timelyCount: number,
  totalConcerns: number,
  missingCount: number,
  multiAgencyRate: number | null,
): number | null {
  // Limbs that could not be measured — no concern met that threshold — are
  // dropped and the weights renormalised over what WAS measured, so an empty
  // safeguarding register cannot score 100.
  const measured = weightedMeanOf([
    { score: thresholdAccuracy, weight: 30 },
    { score: ofstedCompliance, weight: 20 },
    { score: laCompliance, weight: 15 },
    { score: rate(timelyCount, totalConcerns), weight: 20 },
    { score: multiAgencyRate, weight: 15 },
  ]);
  if (measured === null) return null;

  const score = measured - missingCount * 8;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getEscalationRating(
  score: number | null,
): "outstanding" | "good" | "requires_improvement" | "inadequate" | "not_assessed" {
  if (score === null) return "not_assessed";
  if (score >= 85) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "requires_improvement";
  return "inadequate";
}

// ── Insight Generation ─────────────────────────────────────────────────────

function generateEscalationStrengths(
  thresholdAccuracy: number | null,
  ofstedCompliance: number | null,
  laCompliance: number | null,
  multiAgencyRate: number | null,
  assessments: ThresholdAssessment[],
): string[] {
  const strengths: string[] = [];

  if (meets(thresholdAccuracy, 90)) {
    strengths.push("Excellent threshold decision-making: appropriate escalation in over 90% of cases");
  }
  if (ofstedCompliance === 100 && assessments.some((a) => a.requiredEscalations.some((e) => e.target === "ofsted"))) {
    strengths.push("100% Ofsted notification compliance: all required notifications made in time");
  }
  if (meets(laCompliance, 90)) {
    strengths.push("Strong local authority engagement: timely notifications to placing authorities and MASH");
  }
  if (meets(multiAgencyRate, 90)) {
    strengths.push("High multi-agency engagement rate demonstrates effective partnership working");
  }

  const allTimely = assessments.every((a) => a.timeliness === "on_time" || a.requiredEscalations.length === 0);
  if (allTimely && assessments.length > 0) {
    strengths.push("All escalations completed within required timeframes");
  }

  return strengths;
}

function generateEscalationConcerns(
  assessments: ThresholdAssessment[],
  ofstedCompliance: number | null,
  laCompliance: number | null,
  multiAgencyRate: number | null,
): string[] {
  const concerns: string[] = [];

  const notEscalated = assessments.filter((a) => a.outcome === "not_escalated");
  if (notEscalated.length > 0) {
    concerns.push(`${notEscalated.length} concern(s) not escalated despite meeting threshold criteria`);
  }

  const underEsc = assessments.filter((a) => a.outcome === "under_escalated");
  if (underEsc.length > 0) {
    concerns.push(`${underEsc.length} concern(s) under-escalated: not all required notifications made`);
  }

  if (below(ofstedCompliance, 100)) {
    concerns.push(`Ofsted notification compliance at ${ofstedCompliance}%: some required notifications missed`);
  }

  if (below(laCompliance, 80)) {
    concerns.push(`Local authority notification rate below 80%: potential safeguarding gap`);
  }

  if (below(multiAgencyRate, 70)) {
    concerns.push(`Multi-agency engagement rate of ${multiAgencyRate}% suggests insufficient partnership working`);
  }

  const delayed = assessments.filter((a) => a.timeliness === "delayed");
  if (delayed.length > 0) {
    concerns.push(`${delayed.length} escalation(s) completed but outside required timeframe`);
  }

  return concerns;
}

function generateEscalationActions(
  assessments: ThresholdAssessment[],
  currentDate: string,
): string[] {
  const actions: string[] = [];

  // Overdue notifications
  const overdueOfsted = assessments.filter((a) =>
    a.missingEscalations.some((m) => m.target === "ofsted" && m.isOverdue),
  );
  if (overdueOfsted.length > 0) {
    actions.push(
      `IMMEDIATE: ${overdueOfsted.length} overdue Ofsted notification(s). Complete Schedule 5 notification within 24 hours. Failure to notify is a regulatory breach.`,
    );
  }

  const overduePolice = assessments.filter((a) =>
    a.missingEscalations.some((m) => m.target === "police" && m.isOverdue),
  );
  if (overduePolice.length > 0) {
    actions.push(
      `IMMEDIATE: ${overduePolice.length} concern(s) requiring police notification. Contact police without delay and document referral.`,
    );
  }

  const overdueMash = assessments.filter((a) =>
    a.missingEscalations.some((m) => m.target === "local_authority_mash" && m.isOverdue),
  );
  if (overdueMash.length > 0) {
    actions.push(
      `URGENT: ${overdueMash.length} MASH/LADO referral(s) overdue. Complete multi-agency referral form and submit immediately.`,
    );
  }

  const notEscalated = assessments.filter((a) => a.outcome === "not_escalated");
  if (notEscalated.length > 0) {
    actions.push(
      `HIGH: ${notEscalated.length} concern(s) not escalated. Review each concern and complete required notifications. Document rationale for any delay.`,
    );
  }

  if (actions.length === 0) {
    actions.push(
      assessments.length === 0
        ? "No concerns recorded in the period — escalation practice cannot be assessed. Confirm concerns are being logged."
        : "No immediate actions required. Escalation practice is operating within required standards.",
    );
  }

  return actions;
}

function generateEscalationRegulatoryLinks(
  assessments: ThresholdAssessment[],
): string[] {
  const links = new Set<string>();

  links.add("CHR 2015, Reg 12 — Protection of children: effective safeguarding systems");
  links.add("SCCIF: How well children are helped and protected — threshold decisions");

  const hasOfstedGap = assessments.some((a) =>
    a.missingEscalations.some((m) => m.target === "ofsted"),
  );
  if (hasOfstedGap) {
    links.add("CHR 2015, Reg 40(4) — Notification of serious events to HMCI (Ofsted)");
    links.add("CHR 2015, Schedule 5 — Events to be notified to HMCI");
  }

  const hasPoliceGap = assessments.some((a) =>
    a.missingEscalations.some((m) => m.target === "police"),
  );
  if (hasPoliceGap) {
    links.add("Working Together 2023 — Duty to refer to police where criminal offence suspected");
  }

  const hasLadoGap = assessments.some((a) =>
    a.missingEscalations.some((m) => m.target === "lado"),
  );
  if (hasLadoGap) {
    links.add("Working Together 2023 — Allegations against staff: LADO notification duty");
    links.add("CHR 2015, Reg 40(4)(b) — Notification of allegation against person working at home");
  }

  const hasMissingGap = assessments.some((a) => a.category === "missing");
  if (hasMissingGap) {
    links.add("CHR 2015, Reg 40(4)(d) — Notification of child absent without authority");
    links.add("Statutory guidance on children who go missing from home or care 2014");
  }

  return [...links];
}

// ── Utility: Labels ────────────────────────────────────────────────────────

export function getConcernCategoryLabel(category: ConcernCategory): string {
  const labels: Record<ConcernCategory, string> = {
    safeguarding: "Safeguarding Concern",
    exploitation: "Exploitation",
    missing: "Missing from Care",
    self_harm: "Self-Harm",
    violence: "Violence/Aggression",
    substance_misuse: "Substance Misuse",
    health_emergency: "Health Emergency",
    medication_error: "Medication Error",
    staff_allegation: "Staff Allegation",
    peer_on_peer_abuse: "Peer-on-Peer Abuse",
    online_harm: "Online Harm",
    radicalisation: "Radicalisation",
    restraint_injury: "Restraint Injury",
    property_damage: "Property Damage",
    emotional_distress: "Emotional Distress",
  };
  return labels[category];
}

export function getThresholdLevelLabel(level: ThresholdLevel): string {
  const labels: Record<ThresholdLevel, string> = {
    level_1_universal: "Level 1 — Universal Services",
    level_2_early_help: "Level 2 — Early Help",
    level_3_child_in_need: "Level 3 — Child in Need (S17)",
    level_4_child_protection: "Level 4 — Child Protection (S47)",
  };
  return labels[level];
}

export function getEscalationTargetLabel(target: EscalationTarget): string {
  const labels: Record<EscalationTarget, string> = {
    internal_manager: "Internal Manager",
    registered_manager: "Registered Manager",
    responsible_individual: "Responsible Individual",
    ofsted: "Ofsted (HMCI)",
    local_authority_mash: "Local Authority MASH",
    police: "Police",
    lado: "LADO",
    nhs_emergency: "NHS Emergency",
    camhs_crisis: "CAMHS Crisis Team",
    placing_authority: "Placing Authority",
    independent_reviewer: "Independent Reviewer",
    dbs: "DBS",
  };
  return labels[target];
}

export function getTimeframeLabel(tf: NotificationTimeframe): string {
  const labels: Record<NotificationTimeframe, string> = {
    immediate: "Immediate (within 1 hour)",
    same_day: "Same Day",
    within_24_hours: "Within 24 Hours",
    within_48_hours: "Within 48 Hours",
    within_5_working_days: "Within 5 Working Days",
    within_14_days: "Within 14 Days",
  };
  return labels[tf];
}

export function getOutcomeLabel(outcome: EscalationOutcome): string {
  const labels: Record<EscalationOutcome, string> = {
    appropriate_and_timely: "Appropriate & Timely",
    appropriate_but_delayed: "Appropriate but Delayed",
    under_escalated: "Under-Escalated",
    over_escalated: "Over-Escalated",
    not_escalated: "Not Escalated",
    pending: "Pending",
  };
  return labels[outcome];
}
