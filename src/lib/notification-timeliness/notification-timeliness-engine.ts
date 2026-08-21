// ══════════════════════════════════════════════════════════════════════════════
// Cara Notification Timeliness Intelligence Engine
//
// Deterministic engine for analysing how effectively a children's home
// manages Schedule 5 and Schedule 6 notifications to Ofsted, the local
// authority, parents/carers, and other relevant parties.
//
// Aligned to:
//   - CHR 2015 Reg 40 — Notification of significant events
//   - CHR 2015 Schedule 5 — Events to be notified to Ofsted within 24 hours
//   - CHR 2015 Schedule 6 — Events to be notified to Ofsted without delay
//   - CHR 2015 Reg 39 — Notification of concerns, etc. to persons and bodies
//   - SCCIF (Social Care Common Inspection Framework) — Ofsted evaluation
//
// Scoring weights:
//   - Ofsted timeliness        (30)
//   - Stakeholder notification (25)
//   - Quality & completeness   (25)
//   - Policy compliance        (20)
//   Total = 100
//
// Rating thresholds:
//   >=80 outstanding | >=60 good | >=40 requires_improvement | <40 inadequate
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type NotificationCategory = "schedule_5" | "schedule_6";

export type NotificationType =
  | "death"
  | "serious_injury"
  | "serious_illness"
  | "allegation_against_staff"
  | "child_protection"
  | "police_involvement"
  | "absconding"
  | "serious_complaint"
  | "deprivation_of_liberty"
  | "accommodation_change"
  | "manager_change"
  | "closure"
  | "other";

export type NotificationRecipient =
  | "ofsted"
  | "local_authority"
  | "parent_carer"
  | "placing_authority"
  | "lado"
  | "police"
  | "other";

export type NotificationStatus =
  | "submitted_on_time"
  | "submitted_late"
  | "not_submitted"
  | "pending";

// ── Interfaces ─────────────────────────────────────────────────────────────

export interface NotifiableEvent {
  id: string;
  homeId: string;
  category: NotificationCategory;
  type: NotificationType;
  title: string;
  description: string;
  childId?: string;
  childName?: string;
  occurredAt: string;
  discoveredAt: string;
  severity: 1 | 2 | 3 | 4 | 5;
  loggedBy: string;
  loggedAt: string;
  notifications: NotificationRecord[];
  outcome?: string;
  followUpRequired: boolean;
  followUpCompletedAt?: string;
  closedAt?: string;
}

export interface NotificationRecord {
  recipient: NotificationRecipient;
  recipientName?: string;
  method: "phone" | "email" | "online_form" | "letter" | "in_person";
  sentAt?: string;
  acknowledgedAt?: string;
  reference?: string;
  status: NotificationStatus;
  contentSummary?: string;
  followUpSentAt?: string;
}

export interface NotificationPolicy {
  homeId: string;
  policyDocumentTitle: string;
  lastReviewedAt: string;
  nextReviewDue: string;
  approvedBy: string;
  coversSchedule5: boolean;
  coversSchedule6: boolean;
  coversStakeholderNotification: boolean;
  staffTrainedCount: number;
  totalStaffCount: number;
  escalationProcedureDocumented: boolean;
  outOfHoursContactsDocumented: boolean;
}

export interface NotificationAudit {
  id: string;
  homeId: string;
  auditDate: string;
  auditor: string;
  findings: string[];
  recommendations: string[];
  overallCompliance: "compliant" | "partially_compliant" | "non_compliant";
  actionPlanInPlace: boolean;
  nextAuditDue: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface EventTimelinessResult {
  eventId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  ofstedNotifiedOnTime: boolean;
  ofstedDelayHours: number;
  requiredRecipients: NotificationRecipient[];
  notifiedRecipients: NotificationRecipient[];
  missingRecipients: NotificationRecipient[];
  allRecipientsNotified: boolean;
  hasAcknowledgements: boolean;
  acknowledgementRate: number;
  hasFollowUp: boolean;
  issues: string[];
}

export interface TimelinessMetrics {
  totalEvents: number;
  schedule5Count: number;
  schedule6Count: number;
  onTimeCount: number;
  lateCount: number;
  notSubmittedCount: number;
  pendingCount: number;
  onTimeRate: number;
  lateRate: number;
  notSubmittedRate: number;
  averageDelayHours: number;
  completenessRate: number;
  acknowledgementRate: number;
  followUpRate: number;
}

export interface TimelinessScoreBreakdown {
  ofstedTimeliness: number;
  stakeholderNotification: number;
  qualityCompleteness: number;
  policyCompliance: number;
  total: number;
}

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

export interface NotificationTimelinessIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  metrics: TimelinessMetrics;
  score: TimelinessScoreBreakdown;
  rating: Rating;
  eventResults: EventTimelinessResult[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Configuration ──────────────────────────────────────────────────────────

const SCHEDULE_5_DEADLINE_HOURS = 24;
const SCHEDULE_6_DEADLINE_HOURS = 4; // "without delay" — interpreted as within 4 hours

const NOTIFICATION_TYPE_CATEGORY: Record<NotificationType, NotificationCategory> = {
  death: "schedule_5",
  serious_injury: "schedule_5",
  serious_illness: "schedule_5",
  allegation_against_staff: "schedule_5",
  child_protection: "schedule_6",
  police_involvement: "schedule_5",
  absconding: "schedule_5",
  serious_complaint: "schedule_5",
  deprivation_of_liberty: "schedule_6",
  accommodation_change: "schedule_5",
  manager_change: "schedule_5",
  closure: "schedule_5",
  other: "schedule_5",
};

const REQUIRED_RECIPIENTS: Record<NotificationType, NotificationRecipient[]> = {
  death: ["ofsted", "local_authority", "parent_carer", "placing_authority", "police"],
  serious_injury: ["ofsted", "local_authority", "parent_carer", "placing_authority"],
  serious_illness: ["ofsted", "local_authority", "parent_carer"],
  allegation_against_staff: ["ofsted", "local_authority", "lado"],
  child_protection: ["ofsted", "local_authority", "parent_carer", "placing_authority"],
  police_involvement: ["ofsted", "local_authority", "placing_authority"],
  absconding: ["ofsted", "local_authority", "parent_carer", "police"],
  serious_complaint: ["ofsted", "local_authority"],
  deprivation_of_liberty: ["ofsted", "local_authority", "placing_authority"],
  accommodation_change: ["ofsted"],
  manager_change: ["ofsted"],
  closure: ["ofsted", "local_authority", "placing_authority", "parent_carer"],
  other: ["ofsted"],
};

const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  death: "Death of a Child",
  serious_injury: "Serious Injury",
  serious_illness: "Serious Illness",
  allegation_against_staff: "Allegation Against Staff",
  child_protection: "Child Protection Concern",
  police_involvement: "Police Involvement",
  absconding: "Absconding / Missing",
  serious_complaint: "Serious Complaint",
  deprivation_of_liberty: "Deprivation of Liberty",
  accommodation_change: "Accommodation Change",
  manager_change: "Manager Change",
  closure: "Home Closure",
  other: "Other Notifiable Event",
};

const RECIPIENT_LABELS: Record<NotificationRecipient, string> = {
  ofsted: "Ofsted",
  local_authority: "Local Authority",
  parent_carer: "Parent/Carer",
  placing_authority: "Placing Authority",
  lado: "LADO",
  police: "Police",
  other: "Other",
};

const REGULATORY_LINKS: string[] = [
  "CHR 2015 Reg 40 — Notification of significant events",
  "CHR 2015 Schedule 5 — Events to be notified to HMCI within 24 hours",
  "CHR 2015 Schedule 6 — Events to be notified to HMCI without delay",
  "CHR 2015 Reg 39 — Notification of concerns, etc. to persons and bodies",
  "SCCIF — Social Care Common Inspection Framework",
];

// ── Helpers ────────────────────────────────────────────────────────────────

export function getDeadlineHours(category: NotificationCategory): number {
  return category === "schedule_5" ? SCHEDULE_5_DEADLINE_HOURS : SCHEDULE_6_DEADLINE_HOURS;
}

export function getNotificationTypeCategory(type: NotificationType): NotificationCategory {
  return NOTIFICATION_TYPE_CATEGORY[type];
}

export function getRequiredRecipients(type: NotificationType): NotificationRecipient[] {
  return REQUIRED_RECIPIENTS[type] ?? ["ofsted"];
}

export function getNotificationTypeLabel(type: NotificationType): string {
  return NOTIFICATION_TYPE_LABELS[type] ?? type.replace(/_/g, " ");
}

export function getRecipientLabel(recipient: NotificationRecipient): string {
  return RECIPIENT_LABELS[recipient] ?? recipient;
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

export function getRatingLabel(rating: Rating): string {
  const labels: Record<Rating, string> = {
    outstanding: "Outstanding",
    good: "Good",
    requires_improvement: "Requires Improvement",
    inadequate: "Inadequate",
  };
  return labels[rating];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// ── Core: Evaluate Single Event Timeliness ─────────────────────────────────

export function evaluateEventTimeliness(
  event: NotifiableEvent,
  now?: string,
): EventTimelinessResult {
  const currentTime = now ? new Date(now).getTime() : Date.now();
  const issues: string[] = [];

  const requiredRecipients = getRequiredRecipients(event.type);
  const deadlineHours = getDeadlineHours(event.category);
  const deadlineMs = new Date(event.discoveredAt).getTime() + deadlineHours * 60 * 60 * 1000;

  // Ofsted timeliness
  const ofstedNotification = event.notifications.find(n => n.recipient === "ofsted");
  let ofstedNotifiedOnTime = false;
  let ofstedDelayHours = 0;

  if (ofstedNotification && ofstedNotification.sentAt) {
    const sentTime = new Date(ofstedNotification.sentAt).getTime();
    if (sentTime <= deadlineMs) {
      ofstedNotifiedOnTime = true;
    } else {
      ofstedDelayHours = roundTo((sentTime - deadlineMs) / (1000 * 60 * 60), 1);
      issues.push(`Ofsted notified ${ofstedDelayHours}h after deadline`);
    }
  } else if (currentTime > deadlineMs) {
    ofstedDelayHours = roundTo((currentTime - deadlineMs) / (1000 * 60 * 60), 1);
    issues.push(`Ofsted notification overdue by ${ofstedDelayHours}h`);
  }

  // Recipient completeness
  const notifiedRecipients: NotificationRecipient[] = [];
  for (const n of event.notifications) {
    if (n.sentAt && requiredRecipients.includes(n.recipient)) {
      notifiedRecipients.push(n.recipient);
    }
  }
  const missingRecipients = requiredRecipients.filter(r => !notifiedRecipients.includes(r));

  if (missingRecipients.length > 0 && currentTime > deadlineMs) {
    for (const r of missingRecipients) {
      issues.push(`${getRecipientLabel(r)} not notified`);
    }
  }

  const allRecipientsNotified = missingRecipients.length === 0;

  // Acknowledgements
  const sentNotifications = event.notifications.filter(n => n.sentAt);
  const acknowledgedNotifications = sentNotifications.filter(n => n.acknowledgedAt);
  const acknowledgementRate = sentNotifications.length > 0
    ? roundTo((acknowledgedNotifications.length / sentNotifications.length) * 100, 1)
    : 0;
  const hasAcknowledgements = acknowledgedNotifications.length > 0;

  // Follow-up
  const hasFollowUp = event.followUpRequired ? !!event.followUpCompletedAt : true;
  if (event.followUpRequired && !event.followUpCompletedAt) {
    issues.push("Follow-up action required but not completed");
  }

  // Content completeness
  const notificationsWithContent = event.notifications.filter(n => n.contentSummary && n.contentSummary.length > 0);
  if (sentNotifications.length > 0 && notificationsWithContent.length === 0) {
    issues.push("No notification content summaries recorded");
  }

  return {
    eventId: event.id,
    type: event.type,
    category: event.category,
    title: event.title,
    ofstedNotifiedOnTime,
    ofstedDelayHours,
    requiredRecipients,
    notifiedRecipients,
    missingRecipients,
    allRecipientsNotified,
    hasAcknowledgements,
    acknowledgementRate,
    hasFollowUp,
    issues,
  };
}

// ── Core: Calculate Timeliness Metrics ─────────────────────────────────────

export function calculateTimelinessMetrics(
  events: NotifiableEvent[],
  now?: string,
): TimelinessMetrics {
  if (events.length === 0) {
    return {
      totalEvents: 0,
      schedule5Count: 0,
      schedule6Count: 0,
      onTimeCount: 0,
      lateCount: 0,
      notSubmittedCount: 0,
      pendingCount: 0,
      onTimeRate: 100,
      lateRate: 0,
      notSubmittedRate: 0,
      averageDelayHours: 0,
      completenessRate: 100,
      acknowledgementRate: 0,
      followUpRate: 100,
    };
  }

  const currentTime = now ? new Date(now).getTime() : Date.now();

  let schedule5Count = 0;
  let schedule6Count = 0;
  let onTimeCount = 0;
  let lateCount = 0;
  let notSubmittedCount = 0;
  let pendingCount = 0;
  let totalDelayHours = 0;
  let delayedCount = 0;
  let totalRequired = 0;
  let totalNotified = 0;
  let totalSent = 0;
  let totalAcknowledged = 0;
  let followUpRequired = 0;
  let followUpCompleted = 0;

  for (const event of events) {
    if (event.category === "schedule_5") schedule5Count++;
    else schedule6Count++;

    const deadlineHours = getDeadlineHours(event.category);
    const deadlineMs = new Date(event.discoveredAt).getTime() + deadlineHours * 60 * 60 * 1000;

    // Ofsted notification status
    const ofstedNotification = event.notifications.find(n => n.recipient === "ofsted");

    if (ofstedNotification && ofstedNotification.sentAt) {
      const sentTime = new Date(ofstedNotification.sentAt).getTime();
      if (sentTime <= deadlineMs) {
        onTimeCount++;
      } else {
        lateCount++;
        const delayMs = sentTime - deadlineMs;
        totalDelayHours += delayMs / (1000 * 60 * 60);
        delayedCount++;
      }
    } else if (currentTime > deadlineMs) {
      notSubmittedCount++;
      const delayMs = currentTime - deadlineMs;
      totalDelayHours += delayMs / (1000 * 60 * 60);
      delayedCount++;
    } else {
      pendingCount++;
    }

    // Completeness — all required recipients
    const requiredRecipients = getRequiredRecipients(event.type);
    totalRequired += requiredRecipients.length;
    for (const r of requiredRecipients) {
      const match = event.notifications.find(n => n.recipient === r && n.sentAt);
      if (match) totalNotified++;
    }

    // Acknowledgements
    for (const n of event.notifications) {
      if (n.sentAt) {
        totalSent++;
        if (n.acknowledgedAt) totalAcknowledged++;
      }
    }

    // Follow-ups
    if (event.followUpRequired) {
      followUpRequired++;
      if (event.followUpCompletedAt) followUpCompleted++;
    }
  }

  const total = events.length;

  return {
    totalEvents: total,
    schedule5Count,
    schedule6Count,
    onTimeCount,
    lateCount,
    notSubmittedCount,
    pendingCount,
    onTimeRate: roundTo((onTimeCount / total) * 100, 1),
    lateRate: roundTo((lateCount / total) * 100, 1),
    notSubmittedRate: roundTo((notSubmittedCount / total) * 100, 1),
    averageDelayHours: delayedCount > 0 ? roundTo(totalDelayHours / delayedCount, 1) : 0,
    completenessRate: totalRequired > 0 ? roundTo((totalNotified / totalRequired) * 100, 1) : 100,
    acknowledgementRate: totalSent > 0 ? roundTo((totalAcknowledged / totalSent) * 100, 1) : 0,
    followUpRate: followUpRequired > 0 ? roundTo((followUpCompleted / followUpRequired) * 100, 1) : 100,
  };
}

// ── Core: Calculate Score ──────────────────────────────────────────────────

export function calculateScore(
  metrics: TimelinessMetrics,
  policy: NotificationPolicy | null,
  audits: NotificationAudit[],
  now?: string,
): TimelinessScoreBreakdown {
  // 1. Ofsted timeliness (30 points)
  //    100% on-time = 30, scale linearly, heavy penalty for not_submitted
  const onTimeRatio = metrics.totalEvents > 0
    ? metrics.onTimeCount / metrics.totalEvents
    : 1;
  const notSubmittedPenalty = metrics.totalEvents > 0
    ? (metrics.notSubmittedCount / metrics.totalEvents) * 15
    : 0;
  const ofstedTimeliness = clamp(Math.round(onTimeRatio * 30 - notSubmittedPenalty), 0, 30);

  // 2. Stakeholder notification (25 points)
  //    completenessRate drives 15pts, acknowledgementRate drives 10pts
  const completenessScore = Math.round((metrics.completenessRate / 100) * 15);
  const ackScore = Math.round((metrics.acknowledgementRate / 100) * 10);
  const stakeholderNotification = clamp(completenessScore + ackScore, 0, 25);

  // 3. Quality & completeness (25 points)
  //    followUpRate drives 12pts, low delay drives 13pts
  const followUpScore = Math.round((metrics.followUpRate / 100) * 12);
  // Delay scoring: 0 delay = 13pts, >48h avg delay = 0pts
  const delayFactor = metrics.averageDelayHours <= 0
    ? 1
    : Math.max(0, 1 - metrics.averageDelayHours / 48);
  const delayScore = Math.round(delayFactor * 13);
  const qualityCompleteness = clamp(followUpScore + delayScore, 0, 25);

  // 4. Policy compliance (20 points)
  let policyCompliance = 0;
  if (policy) {
    const currentTime = now ? new Date(now).getTime() : Date.now();

    // Policy coverage (6pts)
    let coveragePoints = 0;
    if (policy.coversSchedule5) coveragePoints += 2;
    if (policy.coversSchedule6) coveragePoints += 2;
    if (policy.coversStakeholderNotification) coveragePoints += 2;

    // Policy review (4pts)
    const reviewDue = new Date(policy.nextReviewDue).getTime();
    const policyOverdue = currentTime > reviewDue;
    const reviewPoints = policyOverdue ? 0 : 4;

    // Staff training (4pts)
    const trainingRate = policy.totalStaffCount > 0
      ? policy.staffTrainedCount / policy.totalStaffCount
      : 0;
    const trainingPoints = Math.round(trainingRate * 4);

    // Escalation and out-of-hours (3pts each)
    const escalationPoints = policy.escalationProcedureDocumented ? 3 : 0;
    const oohPoints = policy.outOfHoursContactsDocumented ? 3 : 0;

    policyCompliance = clamp(coveragePoints + reviewPoints + trainingPoints + escalationPoints + oohPoints, 0, 20);
  }

  // Audit bonus/penalty (within policy compliance, max stays 20)
  if (audits.length > 0) {
    const latestAudit = audits.sort(
      (a, b) => new Date(b.auditDate).getTime() - new Date(a.auditDate).getTime(),
    )[0];

    if (latestAudit.overallCompliance === "non_compliant") {
      policyCompliance = Math.max(0, policyCompliance - 5);
    } else if (latestAudit.overallCompliance === "compliant" && latestAudit.actionPlanInPlace) {
      policyCompliance = Math.min(20, policyCompliance + 2);
    }

    // Check if audit is overdue
    const currentTime = now ? new Date(now).getTime() : Date.now();
    if (new Date(latestAudit.nextAuditDue).getTime() < currentTime) {
      policyCompliance = Math.max(0, policyCompliance - 3);
    }
  }

  const total = ofstedTimeliness + stakeholderNotification + qualityCompleteness + policyCompliance;

  return {
    ofstedTimeliness,
    stakeholderNotification,
    qualityCompleteness,
    policyCompliance,
    total,
  };
}

// ── Core: Generate Strengths, Areas for Improvement, Actions ───────────────

export function generateStrengths(
  metrics: TimelinessMetrics,
  score: TimelinessScoreBreakdown,
  policy: NotificationPolicy | null,
  eventResults: EventTimelinessResult[],
): string[] {
  const strengths: string[] = [];

  if (metrics.onTimeRate >= 90) {
    strengths.push("Excellent Ofsted notification timeliness with " + metrics.onTimeRate + "% of notifications submitted within the statutory deadline");
  } else if (metrics.onTimeRate >= 75) {
    strengths.push("Good Ofsted notification timeliness with " + metrics.onTimeRate + "% submitted on time");
  }

  if (metrics.completenessRate >= 90) {
    strengths.push("Strong stakeholder notification practice with " + metrics.completenessRate + "% of required recipients notified");
  }

  if (metrics.acknowledgementRate >= 70) {
    strengths.push("Good follow-through on obtaining acknowledgements from notified parties (" + metrics.acknowledgementRate + "%)");
  }

  if (metrics.followUpRate >= 90) {
    strengths.push("Follow-up actions are consistently completed following notification events");
  }

  if (metrics.notSubmittedRate === 0 && metrics.totalEvents > 0) {
    strengths.push("No missed notifications in the reporting period — all events have been notified");
  }

  if (score.policyCompliance >= 16) {
    strengths.push("Notification policy is comprehensive and well-maintained with strong staff training coverage");
  }

  if (policy && policy.escalationProcedureDocumented && policy.outOfHoursContactsDocumented) {
    strengths.push("Escalation procedures and out-of-hours contacts are documented and accessible");
  }

  if (metrics.averageDelayHours === 0 && metrics.totalEvents > 0) {
    strengths.push("Zero average delay across all notifications — demonstrating prompt regulatory reporting");
  }

  const allOnTime = eventResults.every(r => r.ofstedNotifiedOnTime);
  if (allOnTime && eventResults.length > 0) {
    strengths.push("Every individual event was reported to Ofsted within the statutory timeframe");
  }

  return strengths;
}

export function generateAreasForImprovement(
  metrics: TimelinessMetrics,
  _score: TimelinessScoreBreakdown,
  policy: NotificationPolicy | null,
  audits: NotificationAudit[],
  eventResults: EventTimelinessResult[],
  now?: string,
): string[] {
  const areas: string[] = [];

  if (metrics.lateRate > 20) {
    areas.push("Late notification rate of " + metrics.lateRate + "% exceeds acceptable threshold — review internal escalation process");
  } else if (metrics.lateRate > 0) {
    areas.push("Some notifications submitted late (" + metrics.lateRate + "%) — identify root causes for delays");
  }

  if (metrics.notSubmittedRate > 0) {
    areas.push("" + metrics.notSubmittedCount + " event(s) have not been notified to Ofsted — immediate action required");
  }

  if (metrics.completenessRate < 80) {
    areas.push("Stakeholder notification completeness at " + metrics.completenessRate + "% — ensure all required parties are notified for each event type");
  }

  if (metrics.acknowledgementRate < 50) {
    areas.push("Low acknowledgement rate (" + metrics.acknowledgementRate + "%) — implement a system to track and chase acknowledgements");
  }

  if (metrics.followUpRate < 80) {
    areas.push("Follow-up completion rate of " + metrics.followUpRate + "% needs improvement — assign clear ownership for follow-up actions");
  }

  if (metrics.averageDelayHours > 12) {
    areas.push("Average delay of " + metrics.averageDelayHours + " hours is significant — streamline the notification process");
  }

  if (policy) {
    const currentTime = now ? new Date(now).getTime() : Date.now();
    if (new Date(policy.nextReviewDue).getTime() < currentTime) {
      areas.push("Notification policy is overdue for review — schedule an immediate review");
    }

    if (policy.totalStaffCount > 0) {
      const trainingRate = (policy.staffTrainedCount / policy.totalStaffCount) * 100;
      if (trainingRate < 80) {
        areas.push("Only " + Math.round(trainingRate) + "% of staff trained on notification procedures — schedule additional training");
      }
    }

    if (!policy.escalationProcedureDocumented) {
      areas.push("Escalation procedure for notifications is not documented");
    }

    if (!policy.outOfHoursContactsDocumented) {
      areas.push("Out-of-hours notification contacts are not documented");
    }
  } else {
    areas.push("No notification policy found — create and implement a comprehensive notification policy immediately");
  }

  if (audits.length > 0) {
    const latest = audits.sort(
      (a, b) => new Date(b.auditDate).getTime() - new Date(a.auditDate).getTime(),
    )[0];

    const currentTime = now ? new Date(now).getTime() : Date.now();
    if (new Date(latest.nextAuditDue).getTime() < currentTime) {
      areas.push("Notification audit is overdue — the last audit was on " + latest.auditDate);
    }

    if (latest.overallCompliance === "non_compliant") {
      areas.push("Most recent audit found the home non-compliant with notification requirements");
    }
  } else {
    areas.push("No notification audits on record — schedule an internal audit of notification practices");
  }

  // Check for events with many missing recipients
  const highMissingEvents = eventResults.filter(r => r.missingRecipients.length >= 2);
  if (highMissingEvents.length > 0) {
    areas.push("" + highMissingEvents.length + " event(s) have 2 or more required recipients not yet notified");
  }

  return areas;
}

export function generateActions(
  metrics: TimelinessMetrics,
  _score: TimelinessScoreBreakdown,
  policy: NotificationPolicy | null,
  audits: NotificationAudit[],
  eventResults: EventTimelinessResult[],
  now?: string,
): string[] {
  const actions: string[] = [];

  // Immediate: not-submitted events
  const notSubmitted = eventResults.filter(r => !r.ofstedNotifiedOnTime && r.ofstedDelayHours > 0 && r.missingRecipients.includes("ofsted"));
  if (notSubmitted.length > 0) {
    actions.push("URGENT: Submit outstanding Ofsted notifications for " + notSubmitted.length + " event(s) immediately");
  }

  // Missing recipients
  const withMissing = eventResults.filter(r => r.missingRecipients.length > 0);
  if (withMissing.length > 0) {
    actions.push("Complete notifications for " + withMissing.length + " event(s) with missing recipient notifications");
  }

  // Follow-ups
  if (metrics.followUpRate < 100 && metrics.totalEvents > 0) {
    actions.push("Complete outstanding follow-up actions for notification events");
  }

  // Policy actions
  if (!policy) {
    actions.push("Develop and implement a notification policy covering Schedule 5, Schedule 6, and stakeholder notification requirements");
  } else {
    const currentTime = now ? new Date(now).getTime() : Date.now();
    if (new Date(policy.nextReviewDue).getTime() < currentTime) {
      actions.push("Review and update the notification policy (currently overdue)");
    }

    if (policy.totalStaffCount > 0 && policy.staffTrainedCount < policy.totalStaffCount) {
      const untrained = policy.totalStaffCount - policy.staffTrainedCount;
      actions.push("Schedule notification procedure training for " + untrained + " untrained staff member(s)");
    }

    if (!policy.escalationProcedureDocumented) {
      actions.push("Document the escalation procedure for notification events");
    }

    if (!policy.outOfHoursContactsDocumented) {
      actions.push("Document out-of-hours contacts for emergency notifications");
    }
  }

  // Audit actions
  if (audits.length === 0) {
    actions.push("Schedule an internal notification audit within the next 4 weeks");
  } else {
    const latest = audits.sort(
      (a, b) => new Date(b.auditDate).getTime() - new Date(a.auditDate).getTime(),
    )[0];

    const currentTime = now ? new Date(now).getTime() : Date.now();
    if (new Date(latest.nextAuditDue).getTime() < currentTime) {
      actions.push("Schedule an overdue notification audit (was due " + latest.nextAuditDue + ")");
    }

    if (!latest.actionPlanInPlace && latest.overallCompliance !== "compliant") {
      actions.push("Create an action plan to address findings from the most recent notification audit");
    }
  }

  // Acknowledgement tracking
  if (metrics.acknowledgementRate < 50 && metrics.totalEvents > 0) {
    actions.push("Implement a tracker for notification acknowledgements to improve the current " + metrics.acknowledgementRate + "% rate");
  }

  // Process improvement
  if (metrics.averageDelayHours > 24) {
    actions.push("Conduct a root-cause analysis for notification delays averaging " + metrics.averageDelayHours + " hours");
  }

  return actions;
}

// ── Core: Main Intelligence Function ───────────────────────────────────────

export function generateNotificationTimelinessIntelligence(
  events: NotifiableEvent[],
  policy: NotificationPolicy | null,
  audits: NotificationAudit[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  now?: string,
): NotificationTimelinessIntelligence {
  // Filter events for the home and period
  const periodStartMs = new Date(periodStart).getTime();
  const periodEndMs = new Date(periodEnd).getTime();

  const filteredEvents = events.filter(e => {
    if (e.homeId !== homeId) return false;
    const occurredMs = new Date(e.occurredAt).getTime();
    return occurredMs >= periodStartMs && occurredMs <= periodEndMs;
  });

  const eventResults = filteredEvents.map(e => evaluateEventTimeliness(e, now));
  const metrics = calculateTimelinessMetrics(filteredEvents, now);
  const homeAudits = audits.filter(a => a.homeId === homeId);
  const score = calculateScore(metrics, policy, homeAudits, now);
  const rating = getRating(score.total);

  const strengths = generateStrengths(metrics, score, policy, eventResults);
  const areasForImprovement = generateAreasForImprovement(metrics, score, policy, homeAudits, eventResults, now);
  const actions = generateActions(metrics, score, policy, homeAudits, eventResults, now);

  return {
    homeId,
    periodStart,
    periodEnd,
    metrics,
    score,
    rating,
    eventResults,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks: [...REGULATORY_LINKS],
  };
}
