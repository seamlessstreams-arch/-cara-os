// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Restorative Practice Intelligence Engine
//
// Pure deterministic engine. No AI, no external calls, no side-effects.
//
// "Children experience care that promotes positive relationships, where
//  conflict is resolved through restorative approaches, not punitive
//  responses."
// — SCCIF 2023
//
// Regulatory framework:
//   CHR 2015 Reg 11         — Positive relationships
//   CHR 2015 Reg 12         — Protection of children — proportionate response
//   CHR 2015 Reg 19         — Behaviour management (restorative not punitive)
//   SCCIF Quality of Care   — Restorative approaches, relational repair,
//                              children's involvement in resolving conflicts
//
// Key quality indicators for Ofsted:
//   1. Restorative conversations happen consistently after incidents
//   2. Children's voices are heard in the resolution process
//   3. Child-led resolution is encouraged and evidenced
//   4. Staff facilitate quality restorative processes
//   5. Repair plans are agreed and followed up
//   6. Incidents are converted to restorative opportunities
//   7. Outcomes show genuine relationship repair
//   8. All parties are heard and harm is acknowledged
//
// Scoring breakdown (0-100):
//   Usage frequency:          20  — Conversations happening regularly
//   Quality of practice:      35  — Quality indicators met in conversations
//   Outcomes achieved:        25  — Repair rate and follow-through
//   Incident conversion:      20  — Incidents leading to restorative response
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ─────────────────────────────────────────────────────────────────────

export type ConversationType =
  | "restorative_chat"
  | "formal_conference"
  | "circle_time"
  | "community_meeting"
  | "mediation"
  | "repair_conversation"
  | "check_in"
  | "reflective_debrief";

export type ConversationStatus =
  | "completed"
  | "in_progress"
  | "scheduled"
  | "declined"
  | "not_needed";

export type ParticipantRole =
  | "child"
  | "staff"
  | "peer"
  | "family_member"
  | "external_professional";

export type TriggerType =
  | "conflict_between_children"
  | "conflict_child_staff"
  | "rule_breaking"
  | "property_damage"
  | "verbal_aggression"
  | "physical_aggression"
  | "emotional_distress"
  | "relationship_breakdown"
  | "community_issue"
  | "reintegration_after_incident";

export type OutcomeType =
  | "relationship_repaired"
  | "agreement_reached"
  | "understanding_improved"
  | "partial_resolution"
  | "no_resolution"
  | "further_action_needed"
  | "escalated";

// ── Data Models ───────────────────────────────────────────────────────────────

export interface RestorativeConversation {
  id: string;
  homeId: string;
  date: string;                   // ISO date
  conversationType: ConversationType;
  status: ConversationStatus;
  triggerType: TriggerType;
  triggerDescription: string;
  facilitatedBy: string;          // staff name
  participants: { name: string; role: ParticipantRole }[];
  childrenInvolved: { childId: string; childName: string }[];
  durationMinutes: number;
  childVoiceHeard: boolean;
  childLedResolution: boolean;
  outcome: OutcomeType;
  agreementsMade: string[];
  followUpDate?: string;
  followUpCompleted?: boolean;
  qualityIndicators: {
    allPartiesHeard: boolean;
    harmAcknowledged: boolean;
    needsIdentified: boolean;
    repairPlanAgreed: boolean;
    emotionsExplored: boolean;
  };
}

export interface IncidentLink {
  incidentId: string;
  restorativeConversationId: string;
  incidentDate: string;
  incidentType: string;
}

// ── Result Types ──────────────────────────────────────────────────────────────

export interface UsageResult {
  totalConversations: number;
  byType: Record<ConversationType, number>;
  byTrigger: Record<TriggerType, number>;
  completionRate: number;
  avgDuration: number;
  scheduledCount: number;
  declinedCount: number;
  conversationsPerWeek: number;
}

export interface QualityResult {
  avgQualityScore: number;
  childVoiceRate: number;
  childLedRate: number;
  allPartiesHeardRate: number;
  harmAcknowledgedRate: number;
  repairPlanRate: number;
  emotionsExploredRate: number;
  needsIdentifiedRate: number;
  conversationsAssessed: number;
}

export interface OutcomeResult {
  totalResolved: number;
  repairRate: number;
  noResolutionRate: number;
  escalatedCount: number;
  followUpRate: number;
  followUpCompletedRate: number;
  averageAgreementsPerConversation: number;
  outcomeDistribution: Record<OutcomeType, number>;
}

export interface IncidentConversionResult {
  incidentsWithRestorative: number;
  totalLinkedIncidents: number;
  conversionRate: number;
  avgDaysToRestorative: number;
}

export interface StaffFacilitatorProfile {
  staffName: string;
  totalFacilitated: number;
  avgQualityScore: number;
  repairRate: number;
  childVoiceRate: number;
}

export interface RestorativePracticeResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  usage: UsageResult;
  quality: QualityResult;
  outcomes: OutcomeResult;
  incidentConversion: IncidentConversionResult;
  staffProfiles: StaffFacilitatorProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const CONVERSATION_TYPE_LABELS: Record<ConversationType, string> = {
  restorative_chat: "Restorative Chat",
  formal_conference: "Formal Conference",
  circle_time: "Circle Time",
  community_meeting: "Community Meeting",
  mediation: "Mediation",
  repair_conversation: "Repair Conversation",
  check_in: "Check-in",
  reflective_debrief: "Reflective Debrief",
};

const TRIGGER_TYPE_LABELS: Record<TriggerType, string> = {
  conflict_between_children: "Conflict Between Children",
  conflict_child_staff: "Conflict Between Child & Staff",
  rule_breaking: "Rule Breaking",
  property_damage: "Property Damage",
  verbal_aggression: "Verbal Aggression",
  physical_aggression: "Physical Aggression",
  emotional_distress: "Emotional Distress",
  relationship_breakdown: "Relationship Breakdown",
  community_issue: "Community Issue",
  reintegration_after_incident: "Reintegration After Incident",
};

const OUTCOME_TYPE_LABELS: Record<OutcomeType, string> = {
  relationship_repaired: "Relationship Repaired",
  agreement_reached: "Agreement Reached",
  understanding_improved: "Understanding Improved",
  partial_resolution: "Partial Resolution",
  no_resolution: "No Resolution",
  further_action_needed: "Further Action Needed",
  escalated: "Escalated",
};

const STATUS_LABELS: Record<ConversationStatus, string> = {
  completed: "Completed",
  in_progress: "In Progress",
  scheduled: "Scheduled",
  declined: "Declined",
  not_needed: "Not Needed",
};

// Positive outcomes that count toward repair rate
const POSITIVE_OUTCOMES: OutcomeType[] = [
  "relationship_repaired",
  "agreement_reached",
  "understanding_improved",
];

// ── Label Functions ──────────────────────────────────────────────────────────

export function getConversationTypeLabel(t: ConversationType): string {
  return CONVERSATION_TYPE_LABELS[t] ?? t.replace(/_/g, " ");
}

export function getTriggerTypeLabel(t: TriggerType): string {
  return TRIGGER_TYPE_LABELS[t] ?? t.replace(/_/g, " ");
}

export function getOutcomeTypeLabel(t: OutcomeType): string {
  return OUTCOME_TYPE_LABELS[t] ?? t.replace(/_/g, " ");
}

export function getStatusLabel(s: ConversationStatus): string {
  return STATUS_LABELS[s] ?? s.replace(/_/g, " ");
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function inPeriod(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

function daysBetween(earlier: string, later: string): number {
  const diff = new Date(later).getTime() - new Date(earlier).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function weeksBetween(start: string, end: string): number {
  const days = daysBetween(start, end);
  return days <= 0 ? 1 : days / 7;
}

function qualityScore(qi: RestorativeConversation["qualityIndicators"]): number {
  const indicators = [
    qi.allPartiesHeard,
    qi.harmAcknowledged,
    qi.needsIdentified,
    qi.repairPlanAgreed,
    qi.emotionsExplored,
  ];
  const met = indicators.filter(Boolean).length;
  return Math.round((met / indicators.length) * 100);
}

// ── Core Functions ───────────────────────────────────────────────────────────

export function evaluateRestorativeUsage(
  conversations: RestorativeConversation[],
  periodStart: string,
  periodEnd: string,
): UsageResult {
  const inRange = conversations.filter((c) => inPeriod(c.date, periodStart, periodEnd));
  const totalConversations = inRange.length;

  // Distribution by type
  const byType = {} as Record<ConversationType, number>;
  for (const key of Object.keys(CONVERSATION_TYPE_LABELS) as ConversationType[]) {
    byType[key] = 0;
  }
  for (const c of inRange) {
    byType[c.conversationType] = (byType[c.conversationType] ?? 0) + 1;
  }

  // Distribution by trigger
  const byTrigger = {} as Record<TriggerType, number>;
  for (const key of Object.keys(TRIGGER_TYPE_LABELS) as TriggerType[]) {
    byTrigger[key] = 0;
  }
  for (const c of inRange) {
    byTrigger[c.triggerType] = (byTrigger[c.triggerType] ?? 0) + 1;
  }

  const completed = inRange.filter((c) => c.status === "completed");
  const completionRate = pct(completed.length, totalConversations);

  const avgDuration =
    completed.length === 0
      ? 0
      : Math.round(
          completed.reduce((sum, c) => sum + c.durationMinutes, 0) / completed.length,
        );

  const scheduledCount = inRange.filter((c) => c.status === "scheduled").length;
  const declinedCount = inRange.filter((c) => c.status === "declined").length;

  const weeks = weeksBetween(periodStart, periodEnd);
  const conversationsPerWeek = Math.round((totalConversations / weeks) * 10) / 10;

  return {
    totalConversations,
    byType,
    byTrigger,
    completionRate,
    avgDuration,
    scheduledCount,
    declinedCount,
    conversationsPerWeek,
  };
}

export function evaluateRestorativeQuality(
  conversations: RestorativeConversation[],
  periodStart: string,
  periodEnd: string,
): QualityResult {
  const completed = conversations.filter(
    (c) => inPeriod(c.date, periodStart, periodEnd) && c.status === "completed",
  );
  const count = completed.length;

  if (count === 0) {
    return {
      avgQualityScore: 0,
      childVoiceRate: 0,
      childLedRate: 0,
      allPartiesHeardRate: 0,
      harmAcknowledgedRate: 0,
      repairPlanRate: 0,
      emotionsExploredRate: 0,
      needsIdentifiedRate: 0,
      conversationsAssessed: 0,
    };
  }

  const totalQuality = completed.reduce((sum, c) => sum + qualityScore(c.qualityIndicators), 0);
  const avgQualityScore = Math.round(totalQuality / count);

  const childVoiceRate = pct(completed.filter((c) => c.childVoiceHeard).length, count);
  const childLedRate = pct(completed.filter((c) => c.childLedResolution).length, count);
  const allPartiesHeardRate = pct(
    completed.filter((c) => c.qualityIndicators.allPartiesHeard).length,
    count,
  );
  const harmAcknowledgedRate = pct(
    completed.filter((c) => c.qualityIndicators.harmAcknowledged).length,
    count,
  );
  const repairPlanRate = pct(
    completed.filter((c) => c.qualityIndicators.repairPlanAgreed).length,
    count,
  );
  const emotionsExploredRate = pct(
    completed.filter((c) => c.qualityIndicators.emotionsExplored).length,
    count,
  );
  const needsIdentifiedRate = pct(
    completed.filter((c) => c.qualityIndicators.needsIdentified).length,
    count,
  );

  return {
    avgQualityScore,
    childVoiceRate,
    childLedRate,
    allPartiesHeardRate,
    harmAcknowledgedRate,
    repairPlanRate,
    emotionsExploredRate,
    needsIdentifiedRate,
    conversationsAssessed: count,
  };
}

export function evaluateOutcomes(
  conversations: RestorativeConversation[],
  periodStart: string,
  periodEnd: string,
): OutcomeResult {
  const completed = conversations.filter(
    (c) => inPeriod(c.date, periodStart, periodEnd) && c.status === "completed",
  );
  const count = completed.length;

  // Outcome distribution
  const outcomeDistribution = {} as Record<OutcomeType, number>;
  for (const key of Object.keys(OUTCOME_TYPE_LABELS) as OutcomeType[]) {
    outcomeDistribution[key] = 0;
  }
  for (const c of completed) {
    outcomeDistribution[c.outcome] = (outcomeDistribution[c.outcome] ?? 0) + 1;
  }

  const positiveCount = completed.filter((c) => POSITIVE_OUTCOMES.includes(c.outcome)).length;
  const totalResolved = positiveCount;
  const repairRate = pct(positiveCount, count);

  const noResolutionCount = completed.filter((c) => c.outcome === "no_resolution").length;
  const noResolutionRate = pct(noResolutionCount, count);

  const escalatedCount = completed.filter((c) => c.outcome === "escalated").length;

  // Follow-up tracking
  const withFollowUp = completed.filter((c) => c.followUpDate);
  const followUpRate = pct(withFollowUp.length, count);
  const followUpCompleted = withFollowUp.filter((c) => c.followUpCompleted).length;
  const followUpCompletedRate = pct(followUpCompleted, withFollowUp.length);

  // Average agreements
  const totalAgreements = completed.reduce((sum, c) => sum + c.agreementsMade.length, 0);
  const averageAgreementsPerConversation =
    count === 0 ? 0 : Math.round((totalAgreements / count) * 10) / 10;

  return {
    totalResolved,
    repairRate,
    noResolutionRate,
    escalatedCount,
    followUpRate,
    followUpCompletedRate,
    averageAgreementsPerConversation,
    outcomeDistribution,
  };
}

export function evaluateIncidentConversion(
  conversations: RestorativeConversation[],
  incidentLinks: IncidentLink[],
  periodStart: string,
  periodEnd: string,
): IncidentConversionResult {
  const linksInRange = incidentLinks.filter((l) =>
    inPeriod(l.incidentDate, periodStart, periodEnd),
  );

  const totalLinkedIncidents = linksInRange.length;

  // Find unique incidents that led to a restorative conversation
  const incidentIdsWithRestorative = new Set<string>();
  let totalDays = 0;
  let daysCount = 0;

  for (const link of linksInRange) {
    const conversation = conversations.find(
      (c) => c.id === link.restorativeConversationId,
    );
    if (conversation && conversation.status !== "declined") {
      incidentIdsWithRestorative.add(link.incidentId);
      const days = daysBetween(link.incidentDate, conversation.date);
      if (days >= 0) {
        totalDays += days;
        daysCount++;
      }
    }
  }

  const incidentsWithRestorative = incidentIdsWithRestorative.size;
  // Unique incidents from links
  const uniqueIncidents = new Set(linksInRange.map((l) => l.incidentId)).size;
  const conversionRate = pct(incidentsWithRestorative, uniqueIncidents);

  const avgDaysToRestorative =
    daysCount === 0 ? 0 : Math.round((totalDays / daysCount) * 10) / 10;

  return {
    incidentsWithRestorative,
    totalLinkedIncidents,
    conversionRate,
    avgDaysToRestorative,
  };
}

export function buildStaffProfiles(
  conversations: RestorativeConversation[],
  periodStart: string,
  periodEnd: string,
): StaffFacilitatorProfile[] {
  const completed = conversations.filter(
    (c) => inPeriod(c.date, periodStart, periodEnd) && c.status === "completed",
  );

  // Group by facilitator
  const staffMap = new Map<string, RestorativeConversation[]>();
  for (const c of completed) {
    const existing = staffMap.get(c.facilitatedBy) ?? [];
    existing.push(c);
    staffMap.set(c.facilitatedBy, existing);
  }

  const profiles: StaffFacilitatorProfile[] = [];
  for (const [staffName, convos] of staffMap) {
    const totalFacilitated = convos.length;
    const totalQuality = convos.reduce(
      (sum, c) => sum + qualityScore(c.qualityIndicators),
      0,
    );
    const avgQualityScore = Math.round(totalQuality / totalFacilitated);

    const positiveCount = convos.filter((c) =>
      POSITIVE_OUTCOMES.includes(c.outcome),
    ).length;
    const repairRate = pct(positiveCount, totalFacilitated);

    const childVoiceCount = convos.filter((c) => c.childVoiceHeard).length;
    const childVoiceRate = pct(childVoiceCount, totalFacilitated);

    profiles.push({
      staffName,
      totalFacilitated,
      avgQualityScore,
      repairRate,
      childVoiceRate,
    });
  }

  // Sort by total facilitated descending
  profiles.sort((a, b) => b.totalFacilitated - a.totalFacilitated);

  return profiles;
}

// ── Main Intelligence Function ──────────────────────────────────────────────

export function generateRestorativePracticeIntelligence(
  conversations: RestorativeConversation[],
  incidentLinks: IncidentLink[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): RestorativePracticeResult {
  const usage = evaluateRestorativeUsage(conversations, periodStart, periodEnd);
  const quality = evaluateRestorativeQuality(conversations, periodStart, periodEnd);
  const outcomes = evaluateOutcomes(conversations, periodStart, periodEnd);
  const incidentConversion = evaluateIncidentConversion(
    conversations,
    incidentLinks,
    periodStart,
    periodEnd,
  );
  const staffProfiles = buildStaffProfiles(conversations, periodStart, periodEnd);

  // ── Scoring ──────────────────────────────────────────────────────────

  // 1. Usage frequency (20 pts) — based on conversations per week
  let usageScore = 0;
  if (usage.conversationsPerWeek >= 2) usageScore = 20;
  else if (usage.conversationsPerWeek >= 1) usageScore = 15;
  else if (usage.conversationsPerWeek >= 0.5) usageScore = 10;
  else usageScore = 5;
  // No conversations at all = 0
  if (usage.totalConversations === 0) usageScore = 0;

  // 2. Quality of practice (35 pts) — based on avg quality score
  let qualityScore = 0;
  if (quality.conversationsAssessed === 0) {
    qualityScore = 0;
  } else if (quality.avgQualityScore >= 80) {
    qualityScore = 35;
  } else if (quality.avgQualityScore >= 60) {
    qualityScore = 25;
  } else if (quality.avgQualityScore >= 40) {
    qualityScore = 15;
  } else {
    qualityScore = 7;
  }

  // 3. Outcomes (25 pts) — repair rate with follow-up deduction
  let outcomesScore = 0;
  if (outcomes.totalResolved === 0 && quality.conversationsAssessed === 0) {
    outcomesScore = 0;
  } else if (outcomes.repairRate >= 75) {
    outcomesScore = 25;
  } else if (outcomes.repairRate >= 50) {
    outcomesScore = 18;
  } else if (outcomes.repairRate >= 30) {
    outcomesScore = 10;
  } else {
    outcomesScore = 5;
  }
  // Deduct for low follow-up completed rate (if follow-ups exist)
  if (outcomes.followUpRate > 0 && outcomes.followUpCompletedRate < 50) {
    outcomesScore = Math.max(0, outcomesScore - 5);
  }

  // 4. Incident conversion (20 pts)
  let conversionScore = 0;
  if (incidentConversion.totalLinkedIncidents === 0) {
    conversionScore = 0;
  } else if (incidentConversion.conversionRate >= 60) {
    conversionScore = 20;
  } else if (incidentConversion.conversionRate >= 40) {
    conversionScore = 14;
  } else if (incidentConversion.conversionRate >= 20) {
    conversionScore = 8;
  } else {
    conversionScore = 3;
  }

  const overallScore = Math.min(
    100,
    Math.max(0, usageScore + qualityScore + outcomesScore + conversionScore),
  );

  const rating: RestorativePracticeResult["rating"] =
    overallScore >= 80
      ? "outstanding"
      : overallScore >= 60
        ? "good"
        : overallScore >= 40
          ? "requires_improvement"
          : "inadequate";

  // ── Strengths / Areas / Actions ──────────────────────────────────────

  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actions: string[] = [];

  // Strengths
  if (usage.conversationsPerWeek >= 2) {
    strengths.push(
      "Strong frequency of restorative conversations — embedded in daily practice",
    );
  } else if (usage.conversationsPerWeek >= 1) {
    strengths.push("Regular restorative conversations taking place weekly");
  }

  if (quality.avgQualityScore >= 80 && quality.conversationsAssessed > 0) {
    strengths.push(
      "High quality restorative practice — quality indicators consistently met",
    );
  }

  if (quality.childVoiceRate >= 80 && quality.conversationsAssessed > 0) {
    strengths.push("Children's voices consistently heard in restorative processes");
  }

  if (quality.childLedRate >= 40 && quality.conversationsAssessed > 0) {
    strengths.push("Evidence of child-led resolution in restorative conversations");
  }

  if (outcomes.repairRate >= 75 && quality.conversationsAssessed > 0) {
    strengths.push(
      "Excellent repair rate — most conversations achieve positive outcomes",
    );
  }

  if (
    incidentConversion.conversionRate >= 60 &&
    incidentConversion.totalLinkedIncidents > 0
  ) {
    strengths.push(
      "Good incident-to-restorative pipeline — incidents consistently followed by restorative response",
    );
  }

  if (outcomes.followUpCompletedRate >= 80 && outcomes.followUpRate > 0) {
    strengths.push("Follow-up actions are consistently completed after agreements");
  }

  if (strengths.length === 0) {
    strengths.push(
      "No significant strengths identified — restorative practice requires development",
    );
  }

  // Areas for improvement
  if (usage.conversationsPerWeek < 1 && usage.totalConversations > 0) {
    areasForImprovement.push(
      `Restorative conversations averaging ${usage.conversationsPerWeek} per week — aim for at least 1-2 weekly`,
    );
  }

  if (
    quality.avgQualityScore < 60 &&
    quality.avgQualityScore > 0 &&
    quality.conversationsAssessed > 0
  ) {
    areasForImprovement.push(
      `Quality score at ${quality.avgQualityScore}% — staff may need coaching on restorative frameworks`,
    );
  }

  if (quality.childVoiceRate < 70 && quality.conversationsAssessed > 0) {
    areasForImprovement.push(
      `Child voice heard in only ${quality.childVoiceRate}% of conversations — should be embedded in all`,
    );
  }

  if (outcomes.repairRate < 50 && quality.conversationsAssessed > 0) {
    areasForImprovement.push(
      `Repair rate at ${outcomes.repairRate}% — review facilitator skills and approach`,
    );
  }

  if (outcomes.followUpCompletedRate < 50 && outcomes.followUpRate > 0) {
    areasForImprovement.push(
      `Follow-up completion at ${outcomes.followUpCompletedRate}% — agreements require better tracking`,
    );
  }

  if (usage.declinedCount > 0) {
    areasForImprovement.push(
      `${usage.declinedCount} conversation${usage.declinedCount !== 1 ? "s" : ""} declined — explore barriers to engagement`,
    );
  }

  if (
    incidentConversion.conversionRate < 40 &&
    incidentConversion.totalLinkedIncidents > 0
  ) {
    areasForImprovement.push(
      `Only ${incidentConversion.conversionRate}% of incidents followed by restorative conversation — Ofsted expects consistent restorative response`,
    );
  }

  if (areasForImprovement.length === 0) {
    areasForImprovement.push("No significant areas for improvement identified");
  }

  // Actions
  if (usage.totalConversations === 0) {
    actions.push(
      "URGENT: No restorative conversations recorded — implement restorative practice framework immediately",
    );
  }

  if (quality.childVoiceRate < 50 && quality.conversationsAssessed > 0) {
    actions.push(
      "HIGH: Embed child voice in every restorative conversation — review staff training in restorative questioning",
    );
  }

  if (quality.avgQualityScore < 40 && quality.conversationsAssessed > 0) {
    actions.push(
      "HIGH: Quality of restorative practice below threshold — commission staff training in restorative approaches",
    );
  }

  if (outcomes.escalatedCount > 2) {
    actions.push(
      `MONITOR: ${outcomes.escalatedCount} conversations escalated — review whether early intervention could prevent escalation`,
    );
  }

  if (outcomes.noResolutionRate > 30 && quality.conversationsAssessed > 0) {
    actions.push(
      `REVIEW: ${outcomes.noResolutionRate}% no-resolution rate — consider additional facilitator support or external mediation`,
    );
  }

  if (
    incidentConversion.avgDaysToRestorative > 3 &&
    incidentConversion.totalLinkedIncidents > 0
  ) {
    actions.push(
      `IMPROVE: Average ${incidentConversion.avgDaysToRestorative} days between incident and restorative response — aim for same-day or next-day`,
    );
  }

  if (actions.length === 0) {
    actions.push(
      "No immediate actions required — restorative practice is well embedded",
    );
  }

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 11 — Positive relationships",
    "CHR 2015 Reg 12 — Protection of children (proportionate response)",
    "CHR 2015 Reg 19 — Behaviour management",
    "SCCIF Quality of Care — Restorative approaches and relational repair",
    "SCCIF Quality of Care — Children's involvement in resolving conflicts",
    "SCCIF Leadership & Management — Staff promote positive relationships",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    usage,
    quality,
    outcomes,
    incidentConversion,
    staffProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
