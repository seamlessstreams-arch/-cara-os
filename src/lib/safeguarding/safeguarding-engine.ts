// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Safeguarding Engine
//
// Deterministic engine for managing safeguarding concerns, referrals,
// chronologies, multi-agency coordination, and escalation workflows.
//
// Aligned to:
//   - Children Act 1989 / 2004
//   - Working Together to Safeguard Children 2023
//   - CHR 2015 Reg 34 — Safeguarding of children
//   - CHR 2015 Reg 40 — Notifiable events
//   - Local Safeguarding Children Partnership (LSCP) procedures
//   - KCSIE (Keeping Children Safe in Education)
//   - What to Do If You're Worried a Child Is Being Abused (DfE 2015)
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type ConcernCategory =
  | "physical_abuse"
  | "emotional_abuse"
  | "sexual_abuse"
  | "neglect"
  | "child_sexual_exploitation"    // CSE
  | "child_criminal_exploitation"  // CCE / county lines
  | "radicalisation"               // Prevent
  | "online_harm"                  // grooming, sexting, cyberbullying
  | "peer_on_peer_abuse"
  | "domestic_abuse"               // in family context
  | "honour_based_abuse"           // HBA / FGM / forced marriage
  | "self_harm"
  | "trafficking"                  // modern slavery
  | "fabricated_illness"           // FDIA
  | "missing_linked"              // missing episode with safeguarding concern
  | "allegation_against_staff"
  | "disclosure"                   // child made a disclosure
  | "contextual_safeguarding"     // risks outside the home
  | "other";

export type ConcernSeverity = "low" | "medium" | "high" | "immediate";

export type ConcernStatus =
  | "initial_concern"
  | "information_gathering"
  | "consultation_with_dsl"
  | "referral_made"
  | "strategy_discussion"
  | "section_47_enquiry"
  | "section_17_assessment"
  | "no_further_action"
  | "ongoing_monitoring"
  | "child_protection_plan"
  | "closed";

export type ReferralDestination =
  | "local_authority_mash"        // Multi-Agency Safeguarding Hub
  | "lado"                        // Local Authority Designated Officer
  | "police"
  | "camhs"
  | "nspcc"
  | "ofsted"
  | "dbs"
  | "prevent_team"
  | "exploitation_hub"
  | "social_worker"
  | "irp"                          // Independent Reviewing Officer
  | "other_agency";

export type EscalationLevel = 1 | 2 | 3 | 4 | 5;
// 1 = Staff concern — record and monitor
// 2 = DSL consultation — internal discussion
// 3 = External referral — agency notification
// 4 = Strategy discussion / Section 47
// 5 = Immediate protection — police / emergency action

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface SafeguardingConcern {
  id: string;
  childId: string;
  childName: string;
  homeId: string;
  organisationId: string;

  // Classification
  category: ConcernCategory;
  severity: ConcernSeverity;
  status: ConcernStatus;
  escalationLevel: EscalationLevel;

  // Details
  description: string;
  raisedBy: string;
  raisedAt: string;
  dateOfConcern: string;            // when the concern relates to (may differ from raised)
  location?: string;

  // Evidence
  evidenceOfHarm: string[];         // observable indicators
  childWords?: string;              // exact words used by child (if disclosure)
  witnesses: string[];

  // Actions
  immediateActions: string[];
  dslConsulted: boolean;
  dslName?: string;
  dslConsultedAt?: string;
  referrals: SafeguardingReferral[];

  // Management
  assignedTo: string;
  reviewDate?: string;
  linkedConcerns: string[];         // IDs of related concerns
  linkedIncidents: string[];        // IDs of related incidents

  // Resolution
  outcome?: string;
  closedAt?: string;
  closedBy?: string;
  closureReason?: string;

  // Audit
  lastUpdatedBy: string;
  lastUpdatedAt: string;
  createdAt: string;
}

export interface SafeguardingReferral {
  id: string;
  concernId: string;
  destination: ReferralDestination;
  referralDate: string;
  referredBy: string;
  referralMethod: "phone" | "form" | "email" | "portal";
  referenceNumber?: string;         // external reference
  acknowledged: boolean;
  acknowledgedAt?: string;
  outcome?: string;
  responseReceived: boolean;
  responseDate?: string;
}

export interface ChronologyEntry {
  id: string;
  childId: string;
  date: string;
  category: "concern" | "referral" | "meeting" | "disclosure" | "incident" | "action" | "review" | "communication";
  description: string;
  significance: "routine" | "significant" | "critical";
  source: string;                   // who recorded it
  linkedConcernId?: string;
  linkedIncidentId?: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface ConcernComplianceResult {
  concernId: string;
  isCompliant: boolean;
  issues: string[];
  dslConsultedTimely: boolean;
  referralTimely: boolean;
  actionsTaken: boolean;
  childWordsRecorded: boolean | null;  // null if not a disclosure
  chronologyUpdated: boolean;
  reviewScheduled: boolean;
}

export interface SafeguardingMetrics {
  homeId: string;
  organisationId: string;
  totalConcerns: number;
  activeConcerns: number;
  concernsThisMonth: number;
  concernsThisQuarter: number;
  byCategory: { category: ConcernCategory; count: number }[];
  bySeverity: { severity: ConcernSeverity; count: number }[];
  byStatus: { status: ConcernStatus; count: number }[];
  byChild: { childId: string; childName: string; count: number }[];
  referralsMade: number;
  averageEscalationLevel: number;
  complianceRate: number;
  overdueReviews: number;
  strategyDiscussions: number;
  childProtectionPlans: number;
  immediateProtectionActions: number;
}

export interface EscalationDecision {
  recommendedLevel: EscalationLevel;
  reasons: string[];
  immediateActions: string[];
  referralsRequired: ReferralDestination[];
  timeframe: "immediate" | "within_1_hour" | "within_4_hours" | "within_24_hours" | "within_3_days";
  notifyRM: boolean;
  notifyOfsted: boolean;
  notifyPolice: boolean;
}

export interface SafeguardingTimeline {
  childId: string;
  entries: ChronologyEntry[];
  activeConcerns: SafeguardingConcern[];
  riskIndicators: string[];
  patternFlags: string[];
}

// ── Configuration ──────────────────────────────────────────────────────────

const DSL_CONSULTATION_HOURS = 1;       // DSL must be consulted within 1 hour for high/immediate
const REFERRAL_HOURS_IMMEDIATE = 1;     // immediate concerns: refer within 1 hour
const REFERRAL_HOURS_HIGH = 4;          // high concerns: refer within 4 hours
const REFERRAL_HOURS_MEDIUM = 24;       // medium concerns: refer within 24 hours
const REVIEW_DAYS_DEFAULT = 7;          // review within 7 days
const REVIEW_DAYS_ACTIVE = 3;           // active concerns: review within 3 days

// Categories that always require external referral
const ALWAYS_REFER_CATEGORIES: ConcernCategory[] = [
  "sexual_abuse",
  "child_sexual_exploitation",
  "child_criminal_exploitation",
  "radicalisation",
  "trafficking",
  "honour_based_abuse",
  "fabricated_illness",
  "allegation_against_staff",
];

// Categories that require police notification
const POLICE_NOTIFICATION_CATEGORIES: ConcernCategory[] = [
  "sexual_abuse",
  "child_sexual_exploitation",
  "child_criminal_exploitation",
  "trafficking",
  "honour_based_abuse",
];

// ── Core: Determine Escalation ─────────────────────────────────────────────

export function determineEscalation(
  concern: SafeguardingConcern,
  existingConcerns: SafeguardingConcern[] = [],
): EscalationDecision {
  const reasons: string[] = [];
  const immediateActions: string[] = [];
  const referralsRequired: ReferralDestination[] = [];
  let level: EscalationLevel = 1;
  let notifyRM = false;
  let notifyOfsted = false;
  let notifyPolice = false;
  let timeframe: EscalationDecision["timeframe"] = "within_24_hours";

  // Severity-based escalation
  if (concern.severity === "immediate") {
    level = Math.max(level, 5) as EscalationLevel;
    reasons.push("Concern rated as requiring immediate protection.");
    immediateActions.push("Ensure child is safe and remove from immediate danger.");
    immediateActions.push("Do not leave child alone until safety confirmed.");
    timeframe = "immediate";
    notifyRM = true;
    notifyOfsted = true;
    notifyPolice = true;
  } else if (concern.severity === "high") {
    level = Math.max(level, 3) as EscalationLevel;
    reasons.push("High severity concern requires external referral.");
    timeframe = "within_4_hours";
    notifyRM = true;
  } else if (concern.severity === "medium") {
    level = Math.max(level, 2) as EscalationLevel;
    reasons.push("Medium severity concern requires DSL consultation.");
    timeframe = "within_24_hours";
  }

  // Category-based escalation
  if (ALWAYS_REFER_CATEGORIES.includes(concern.category)) {
    level = Math.max(level, 3) as EscalationLevel;
    reasons.push(`Category '${formatCategory(concern.category)}' always requires external referral.`);
    referralsRequired.push("local_authority_mash");
    notifyRM = true;
  }

  if (POLICE_NOTIFICATION_CATEGORIES.includes(concern.category)) {
    level = Math.max(level, 4) as EscalationLevel;
    reasons.push(`Category '${formatCategory(concern.category)}' requires police notification.`);
    referralsRequired.push("police");
    notifyPolice = true;
    notifyOfsted = true;
    if (timeframe === "within_24_hours") timeframe = "within_1_hour";
  }

  if (concern.category === "allegation_against_staff") {
    level = Math.max(level, 4) as EscalationLevel;
    reasons.push("Allegation against staff requires LADO referral.");
    referralsRequired.push("lado");
    referralsRequired.push("local_authority_mash");
    immediateActions.push("Consider whether staff member should be removed from contact with children.");
    notifyRM = true;
    notifyOfsted = true;
    timeframe = "within_1_hour";
  }

  if (concern.category === "radicalisation") {
    referralsRequired.push("prevent_team");
    reasons.push("Prevent duty: must refer to local authority Channel programme.");
  }

  if (concern.category === "child_sexual_exploitation" || concern.category === "child_criminal_exploitation") {
    referralsRequired.push("exploitation_hub");
    immediateActions.push("Complete exploitation screening tool.");
    immediateActions.push("Review child's recent missing episodes and associations.");
  }

  // Disclosure handling
  if (concern.category === "disclosure") {
    level = Math.max(level, 3) as EscalationLevel;
    reasons.push("Child disclosure — must refer to local authority.");
    referralsRequired.push("local_authority_mash");
    immediateActions.push("Record child's exact words verbatim.");
    immediateActions.push("Do not ask leading questions.");
    immediateActions.push("Reassure child they have done the right thing.");
    notifyRM = true;
    if (timeframe === "within_24_hours") timeframe = "within_4_hours";
  }

  // Pattern escalation — repeat concerns for same child
  const childConcerns = existingConcerns.filter(
    c => c.childId === concern.childId && c.status !== "closed" && c.status !== "no_further_action"
  );
  if (childConcerns.length >= 3) {
    level = Math.max(level, 3) as EscalationLevel;
    reasons.push(`Pattern: ${childConcerns.length} active concerns for this child — possible cumulative harm.`);
    immediateActions.push("Review all concerns together for pattern analysis.");
    notifyRM = true;
  }

  // Self-harm specific
  if (concern.category === "self_harm") {
    level = Math.max(level, 2) as EscalationLevel;
    immediateActions.push("Ensure immediate safety — remove means of self-harm.");
    immediateActions.push("Apply self-harm safety plan if one exists.");
    immediateActions.push("Consider CAMHS referral.");
    referralsRequired.push("camhs");
    if (concern.severity === "high" || concern.severity === "immediate") {
      referralsRequired.push("local_authority_mash");
      notifyRM = true;
    }
  }

  // Contextual safeguarding
  if (concern.category === "contextual_safeguarding") {
    immediateActions.push("Map the external environment — locations, peers, adults of concern.");
    immediateActions.push("Consider whether locations should be reported to police.");
  }

  // Always add DSL consultation for level 2+
  if (level >= 2) {
    immediateActions.push("Consult with Designated Safeguarding Lead (DSL).");
  }

  // Always add social worker notification for level 3+
  if (level >= 3 && !referralsRequired.includes("social_worker")) {
    referralsRequired.push("social_worker");
  }

  // Deduplicate
  const uniqueReferrals = [...new Set(referralsRequired)];
  const uniqueActions = [...new Set(immediateActions)];

  return {
    recommendedLevel: level,
    reasons,
    immediateActions: uniqueActions,
    referralsRequired: uniqueReferrals,
    timeframe,
    notifyRM,
    notifyOfsted,
    notifyPolice,
  };
}

// ── Core: Evaluate Concern Compliance ──────────────────────────────────────

export function evaluateConcernCompliance(
  concern: SafeguardingConcern,
): ConcernComplianceResult {
  const issues: string[] = [];

  // 1. DSL consultation timeliness
  let dslConsultedTimely = true;
  if (concern.severity === "high" || concern.severity === "immediate") {
    if (!concern.dslConsulted) {
      issues.push("DSL not consulted for high/immediate severity concern.");
      dslConsultedTimely = false;
    } else if (concern.dslConsultedAt) {
      const raisedTime = new Date(concern.raisedAt).getTime();
      const consultedTime = new Date(concern.dslConsultedAt).getTime();
      const hoursToConsult = (consultedTime - raisedTime) / (60 * 60 * 1000);
      if (hoursToConsult > DSL_CONSULTATION_HOURS) {
        issues.push(`DSL consulted ${Math.round(hoursToConsult)}h after concern raised (required within ${DSL_CONSULTATION_HOURS}h for high/immediate).`);
        dslConsultedTimely = false;
      }
    }
  } else if (!concern.dslConsulted && concern.status !== "initial_concern") {
    issues.push("DSL not consulted before progressing concern.");
    dslConsultedTimely = false;
  }

  // 2. Referral timeliness
  let referralTimely = true;
  if (ALWAYS_REFER_CATEGORIES.includes(concern.category) && concern.referrals.length === 0) {
    issues.push(`Category '${formatCategory(concern.category)}' requires external referral — none made.`);
    referralTimely = false;
  } else if (concern.referrals.length > 0) {
    const firstReferral = concern.referrals[0];
    const raisedTime = new Date(concern.raisedAt).getTime();
    const referralTime = new Date(firstReferral.referralDate).getTime();
    const hoursToRefer = (referralTime - raisedTime) / (60 * 60 * 1000);

    let maxHours = REFERRAL_HOURS_MEDIUM;
    if (concern.severity === "immediate") maxHours = REFERRAL_HOURS_IMMEDIATE;
    else if (concern.severity === "high") maxHours = REFERRAL_HOURS_HIGH;

    if (hoursToRefer > maxHours) {
      issues.push(`Referral made ${Math.round(hoursToRefer)}h after concern raised (required within ${maxHours}h for ${concern.severity} severity).`);
      referralTimely = false;
    }
  }

  // 3. Actions taken
  const actionsTaken = concern.immediateActions.length > 0;
  if (!actionsTaken) {
    issues.push("No immediate actions recorded.");
  }

  // 4. Child's words (if disclosure)
  let childWordsRecorded: boolean | null = null;
  if (concern.category === "disclosure") {
    childWordsRecorded = !!concern.childWords && concern.childWords.trim().length > 0;
    if (!childWordsRecorded) {
      issues.push("Child disclosure: exact words not recorded verbatim.");
    }
  }

  // 5. Chronology — at least evidence of harm documented
  const chronologyUpdated = concern.evidenceOfHarm.length > 0;
  if (!chronologyUpdated) {
    issues.push("No observable evidence of harm documented.");
  }

  // 6. Review scheduled
  const reviewScheduled = !!concern.reviewDate;
  if (!reviewScheduled && concern.status !== "closed" && concern.status !== "no_further_action") {
    issues.push("No review date scheduled for active concern.");
  }

  const isCompliant = issues.length === 0;

  return {
    concernId: concern.id,
    isCompliant,
    issues,
    dslConsultedTimely,
    referralTimely,
    actionsTaken,
    childWordsRecorded,
    chronologyUpdated,
    reviewScheduled,
  };
}

// ── Core: Calculate Safeguarding Metrics ───────────────────────────────────

export function calculateSafeguardingMetrics(
  concerns: SafeguardingConcern[],
  homeId: string,
  organisationId: string,
  now?: string,
): SafeguardingMetrics {
  const currentDate = now ? new Date(now) : new Date();
  const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const thisQuarter = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3, 1);

  const homeConcerns = concerns.filter(c => c.homeId === homeId);

  const activeConcerns = homeConcerns.filter(c =>
    c.status !== "closed" && c.status !== "no_further_action"
  );
  const concernsThisMonth = homeConcerns.filter(c => new Date(c.raisedAt) >= thisMonth).length;
  const concernsThisQuarter = homeConcerns.filter(c => new Date(c.raisedAt) >= thisQuarter).length;

  // By category
  const categoryCounts = new Map<ConcernCategory, number>();
  for (const c of homeConcerns) {
    categoryCounts.set(c.category, (categoryCounts.get(c.category) ?? 0) + 1);
  }
  const byCategory = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // By severity
  const severityCounts = new Map<ConcernSeverity, number>();
  for (const c of homeConcerns) {
    severityCounts.set(c.severity, (severityCounts.get(c.severity) ?? 0) + 1);
  }
  const bySeverity = (["low", "medium", "high", "immediate"] as ConcernSeverity[]).map(severity => ({
    severity,
    count: severityCounts.get(severity) ?? 0,
  }));

  // By status
  const statusCounts = new Map<ConcernStatus, number>();
  for (const c of homeConcerns) {
    statusCounts.set(c.status, (statusCounts.get(c.status) ?? 0) + 1);
  }
  const byStatus = Array.from(statusCounts.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  // By child
  const childCounts = new Map<string, { name: string; count: number }>();
  for (const c of homeConcerns) {
    const existing = childCounts.get(c.childId);
    if (existing) existing.count++;
    else childCounts.set(c.childId, { name: c.childName, count: 1 });
  }
  const byChild = Array.from(childCounts.entries())
    .map(([childId, { name, count }]) => ({ childId, childName: name, count }))
    .sort((a, b) => b.count - a.count);

  // Referrals
  const referralsMade = homeConcerns.reduce((sum, c) => sum + c.referrals.length, 0);

  // Average escalation level
  const avgEscalation = homeConcerns.length > 0
    ? Math.round((homeConcerns.reduce((sum, c) => sum + c.escalationLevel, 0) / homeConcerns.length) * 10) / 10
    : 0;

  // Compliance rate
  const complianceResults = homeConcerns.map(evaluateConcernCompliance);
  const compliantCount = complianceResults.filter(r => r.isCompliant).length;
  const complianceRate = homeConcerns.length > 0
    ? Math.round((compliantCount / homeConcerns.length) * 100)
    : 100;

  // Overdue reviews
  const overdueReviews = activeConcerns.filter(c => {
    if (!c.reviewDate) return true;
    return new Date(c.reviewDate) < currentDate;
  }).length;

  // Key counts
  const strategyDiscussions = homeConcerns.filter(c => c.status === "strategy_discussion").length;
  const childProtectionPlans = homeConcerns.filter(c => c.status === "child_protection_plan").length;
  const immediateProtectionActions = homeConcerns.filter(c => c.escalationLevel === 5).length;

  return {
    homeId,
    organisationId,
    totalConcerns: homeConcerns.length,
    activeConcerns: activeConcerns.length,
    concernsThisMonth,
    concernsThisQuarter,
    byCategory,
    bySeverity,
    byStatus,
    byChild,
    referralsMade,
    averageEscalationLevel: avgEscalation,
    complianceRate,
    overdueReviews,
    strategyDiscussions,
    childProtectionPlans,
    immediateProtectionActions,
  };
}

// ── Core: Build Child Safeguarding Timeline ─────────────────────────────────

export function buildSafeguardingTimeline(
  concerns: SafeguardingConcern[],
  chronology: ChronologyEntry[],
  childId: string,
): SafeguardingTimeline {
  const childConcerns = concerns.filter(c => c.childId === childId);
  const childChronology = chronology.filter(e => e.childId === childId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const activeConcerns = childConcerns.filter(c =>
    c.status !== "closed" && c.status !== "no_further_action"
  );

  // Risk indicators
  const riskIndicators: string[] = [];

  if (activeConcerns.length >= 3) {
    riskIndicators.push(`${activeConcerns.length} active safeguarding concerns — consider cumulative harm.`);
  }

  const cseIndicators = childConcerns.filter(c =>
    c.category === "child_sexual_exploitation" || c.category === "child_criminal_exploitation"
  );
  if (cseIndicators.length > 0) {
    riskIndicators.push("Exploitation concern on record — heightened monitoring required.");
  }

  const selfHarmConcerns = childConcerns.filter(c => c.category === "self_harm");
  if (selfHarmConcerns.length >= 2) {
    riskIndicators.push(`${selfHarmConcerns.length} self-harm concerns — ensure safety plan in place.`);
  }

  const missingLinked = childConcerns.filter(c => c.category === "missing_linked");
  if (missingLinked.length >= 2) {
    riskIndicators.push("Repeat missing episodes linked to safeguarding — exploitation risk.");
  }

  // Pattern flags
  const patternFlags: string[] = [];

  // Check for escalating severity
  const recentConcerns = childConcerns
    .sort((a, b) => new Date(a.raisedAt).getTime() - new Date(b.raisedAt).getTime())
    .slice(-5);

  if (recentConcerns.length >= 3) {
    const severityValues = { low: 1, medium: 2, high: 3, immediate: 4 };
    const recentSeverities = recentConcerns.map(c => severityValues[c.severity]);
    const isEscalating = recentSeverities.every((val, i) =>
      i === 0 || val >= recentSeverities[i - 1]
    ) && recentSeverities[recentSeverities.length - 1] > recentSeverities[0];

    if (isEscalating) {
      patternFlags.push("Escalating pattern: concern severity increasing over recent entries.");
    }
  }

  // Multiple categories
  const uniqueCategories = new Set(childConcerns.map(c => c.category));
  if (uniqueCategories.size >= 4) {
    patternFlags.push(`Concerns across ${uniqueCategories.size} different categories — complex needs.`);
  }

  // Referrals not responded to
  const unresolvedReferrals = childConcerns
    .flatMap(c => c.referrals)
    .filter(r => !r.responseReceived);
  if (unresolvedReferrals.length >= 2) {
    patternFlags.push(`${unresolvedReferrals.length} referrals without agency response — follow up needed.`);
  }

  return {
    childId,
    entries: childChronology,
    activeConcerns,
    riskIndicators,
    patternFlags,
  };
}

// ── Core: Check Overdue Actions ─────────────────────────────────────────────

export function getOverdueConcerns(
  concerns: SafeguardingConcern[],
  now?: string,
): { concern: SafeguardingConcern; overdueBy: number; type: string }[] {
  const currentDate = now ? new Date(now) : new Date();
  const overdue: { concern: SafeguardingConcern; overdueBy: number; type: string }[] = [];

  for (const concern of concerns) {
    if (concern.status === "closed" || concern.status === "no_further_action") continue;

    // Review overdue
    if (concern.reviewDate) {
      const reviewDate = new Date(concern.reviewDate);
      if (reviewDate < currentDate) {
        const overdueDays = Math.floor((currentDate.getTime() - reviewDate.getTime()) / (24 * 60 * 60 * 1000));
        overdue.push({ concern, overdueBy: overdueDays, type: "review" });
      }
    } else {
      // No review scheduled — overdue if more than default days since last update
      const lastUpdate = new Date(concern.lastUpdatedAt);
      const daysSinceUpdate = Math.floor((currentDate.getTime() - lastUpdate.getTime()) / (24 * 60 * 60 * 1000));
      const maxDays = concern.severity === "high" || concern.severity === "immediate"
        ? REVIEW_DAYS_ACTIVE
        : REVIEW_DAYS_DEFAULT;
      if (daysSinceUpdate > maxDays) {
        overdue.push({ concern, overdueBy: daysSinceUpdate - maxDays, type: "no_review_scheduled" });
      }
    }

    // Unacknowledged referrals
    for (const referral of concern.referrals) {
      if (!referral.acknowledged) {
        const referralDate = new Date(referral.referralDate);
        const daysSinceReferral = Math.floor((currentDate.getTime() - referralDate.getTime()) / (24 * 60 * 60 * 1000));
        if (daysSinceReferral > 2) {
          overdue.push({ concern, overdueBy: daysSinceReferral - 2, type: "unacknowledged_referral" });
        }
      }
    }
  }

  return overdue.sort((a, b) => b.overdueBy - a.overdueBy);
}

// ── Helpers ───────────────────────────────────────────────────────────────

export function formatCategory(category: ConcernCategory): string {
  const labels: Record<ConcernCategory, string> = {
    physical_abuse: "Physical Abuse",
    emotional_abuse: "Emotional Abuse",
    sexual_abuse: "Sexual Abuse",
    neglect: "Neglect",
    child_sexual_exploitation: "CSE",
    child_criminal_exploitation: "CCE",
    radicalisation: "Radicalisation",
    online_harm: "Online Harm",
    peer_on_peer_abuse: "Peer-on-Peer Abuse",
    domestic_abuse: "Domestic Abuse",
    honour_based_abuse: "HBA/FGM",
    self_harm: "Self-Harm",
    trafficking: "Trafficking",
    fabricated_illness: "FDIA",
    missing_linked: "Missing (Safeguarding)",
    allegation_against_staff: "Staff Allegation",
    disclosure: "Disclosure",
    contextual_safeguarding: "Contextual Safeguarding",
    other: "Other",
  };
  return labels[category];
}

export function formatSeverity(severity: ConcernSeverity): string {
  const labels: Record<ConcernSeverity, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    immediate: "Immediate",
  };
  return labels[severity];
}

export function formatStatus(status: ConcernStatus): string {
  const labels: Record<ConcernStatus, string> = {
    initial_concern: "Initial Concern",
    information_gathering: "Information Gathering",
    consultation_with_dsl: "DSL Consultation",
    referral_made: "Referral Made",
    strategy_discussion: "Strategy Discussion",
    section_47_enquiry: "Section 47 Enquiry",
    section_17_assessment: "Section 17 Assessment",
    no_further_action: "No Further Action",
    ongoing_monitoring: "Ongoing Monitoring",
    child_protection_plan: "Child Protection Plan",
    closed: "Closed",
  };
  return labels[status];
}

export function requiresOfstedNotification(concern: SafeguardingConcern): boolean {
  return concern.escalationLevel >= 4 ||
    concern.severity === "immediate" ||
    concern.category === "allegation_against_staff" ||
    POLICE_NOTIFICATION_CATEGORIES.includes(concern.category);
}

export function isHighRiskCategory(category: ConcernCategory): boolean {
  return ALWAYS_REFER_CATEGORIES.includes(category) ||
    POLICE_NOTIFICATION_CATEGORIES.includes(category);
}
