// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Notifiable Events Engine
//
// Deterministic engine for tracking, validating, and managing statutory
// notifications to Ofsted and other bodies under Schedule 5 CHR 2015.
//
// Aligned to:
//   - CHR 2015 Schedule 5 — Events to be notified to HMCI
//   - CHR 2015 Reg 40(4)(a) — Records of notifications
//   - Ofsted: Guide to notifications for children's homes
//   - DfE: Children who run away or go missing (notification duty)
//   - Working Together 2023 — Multi-agency notification
//
// Notification deadlines:
//   - Within 24 hours: death, serious injury/illness, allegation, abscond
//   - Within 5 working days: placement end by disruption, police involvement
//   - Immediately (same day): child protection concern escalated externally
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type NotifiableEventCategory =
  | "death"
  | "serious_injury"
  | "serious_illness"
  | "allegation_against_staff"
  | "child_missing"
  | "child_protection"
  | "police_involvement"
  | "placement_disruption"
  | "serious_incident"
  | "deprivation_of_liberty"
  | "restraint_injury"
  | "medication_error_serious"
  | "fire"
  | "safeguarding_referral_external"
  | "outbreak_infection";

export type NotificationStatus =
  | "pending"
  | "submitted"
  | "acknowledged"
  | "overdue"
  | "closed";

export type NotificationRecipient =
  | "ofsted"
  | "local_authority"
  | "social_worker"
  | "parent_carer"
  | "police"
  | "placing_authority"
  | "designated_officer"
  | "public_health";

export type Urgency = "immediate" | "within_24h" | "within_5_working_days";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface NotifiableEvent {
  id: string;
  homeId: string;
  category: NotifiableEventCategory;
  title: string;
  description: string;
  occurredAt: string;
  discoveredAt: string;
  childId?: string;
  childName?: string;
  staffInvolved?: string[];
  linkedIncidentId?: string;
  linkedMissingEpisodeId?: string;
  severity: 1 | 2 | 3 | 4 | 5;        // 1=low, 5=critical
  loggedBy: string;
  loggedAt: string;
  notifications: NotificationEntry[];
  outcome?: string;
  lessonsLearned?: string;
  closedAt?: string;
  closedBy?: string;
}

export interface NotificationEntry {
  recipient: NotificationRecipient;
  recipientName?: string;
  method: "phone" | "email" | "online_form" | "letter" | "in_person";
  sentAt?: string;
  acknowledgedAt?: string;
  reference?: string;
  status: NotificationStatus;
  deadline: string;                     // ISO date by which notification must be sent
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface NotificationComplianceResult {
  eventId: string;
  category: NotifiableEventCategory;
  title: string;
  isCompliant: boolean;
  issues: string[];
  warnings: string[];
  requiredRecipients: NotificationRecipient[];
  notifiedRecipients: NotificationRecipient[];
  missingRecipients: NotificationRecipient[];
  overdueNotifications: { recipient: NotificationRecipient; deadline: string; hoursOverdue: number }[];
  timeliness: "on_time" | "late" | "pending";
}

export interface NotifiableEventsMetrics {
  homeId: string;
  totalEvents: number;
  eventsThisMonth: number;
  eventsThisQuarter: number;
  pendingNotifications: number;
  overdueNotifications: number;
  complianceRate: number;              // %
  averageResponseHours: number;
  byCategory: { category: NotifiableEventCategory; count: number }[];
  byStatus: { status: NotificationStatus; count: number }[];
  recentEvents: { id: string; category: NotifiableEventCategory; title: string; occurredAt: string; status: string }[];
  childrenInvolved: number;
  ofstedNotifications: number;
  requiresImmediateAction: NotifiableEvent[];
}

export interface NotificationTimeline {
  eventId: string;
  title: string;
  category: NotifiableEventCategory;
  occurredAt: string;
  entries: {
    recipient: NotificationRecipient;
    deadline: string;
    sentAt?: string;
    status: NotificationStatus;
    isLate: boolean;
    hoursLate?: number;
  }[];
}

// ── Configuration ──────────────────────────────────────────────────────────

const CATEGORY_URGENCY: Record<NotifiableEventCategory, Urgency> = {
  death: "immediate",
  serious_injury: "within_24h",
  serious_illness: "within_24h",
  allegation_against_staff: "within_24h",
  child_missing: "within_24h",
  child_protection: "immediate",
  police_involvement: "within_5_working_days",
  placement_disruption: "within_5_working_days",
  serious_incident: "within_24h",
  deprivation_of_liberty: "within_24h",
  restraint_injury: "within_24h",
  medication_error_serious: "within_24h",
  fire: "within_24h",
  safeguarding_referral_external: "immediate",
  outbreak_infection: "within_24h",
};

const CATEGORY_RECIPIENTS: Record<NotifiableEventCategory, NotificationRecipient[]> = {
  death: ["ofsted", "local_authority", "police", "parent_carer", "placing_authority"],
  serious_injury: ["ofsted", "local_authority", "parent_carer", "placing_authority"],
  serious_illness: ["ofsted", "local_authority", "parent_carer"],
  allegation_against_staff: ["ofsted", "local_authority", "designated_officer"],
  child_missing: ["ofsted", "police", "social_worker", "parent_carer"],
  child_protection: ["ofsted", "local_authority", "social_worker"],
  police_involvement: ["ofsted", "local_authority", "placing_authority"],
  placement_disruption: ["ofsted", "placing_authority", "social_worker"],
  serious_incident: ["ofsted", "local_authority"],
  deprivation_of_liberty: ["ofsted", "local_authority"],
  restraint_injury: ["ofsted", "local_authority", "parent_carer"],
  medication_error_serious: ["ofsted", "local_authority", "parent_carer"],
  fire: ["ofsted", "local_authority"],
  safeguarding_referral_external: ["ofsted", "local_authority", "social_worker"],
  outbreak_infection: ["ofsted", "public_health", "local_authority"],
};

const URGENCY_HOURS: Record<Urgency, number> = {
  immediate: 4,           // same-day, within 4 hours
  within_24h: 24,
  within_5_working_days: 120, // 5 × 24
};

const CATEGORY_LABELS: Record<NotifiableEventCategory, string> = {
  death: "Death of a Child",
  serious_injury: "Serious Injury",
  serious_illness: "Serious Illness",
  allegation_against_staff: "Allegation Against Staff",
  child_missing: "Child Missing",
  child_protection: "Child Protection Concern",
  police_involvement: "Police Involvement",
  placement_disruption: "Placement Disruption",
  serious_incident: "Serious Incident",
  deprivation_of_liberty: "Deprivation of Liberty",
  restraint_injury: "Restraint Injury",
  medication_error_serious: "Serious Medication Error",
  fire: "Fire",
  safeguarding_referral_external: "External Safeguarding Referral",
  outbreak_infection: "Outbreak / Infection",
};

// ── Core: Evaluate Notification Compliance ───────────────────────────────

export function evaluateNotificationCompliance(
  event: NotifiableEvent,
  now?: string,
): NotificationComplianceResult {
  const currentTime = now ? new Date(now).getTime() : Date.now();
  const issues: string[] = [];
  const warnings: string[] = [];

  const requiredRecipients = CATEGORY_RECIPIENTS[event.category] ?? ["ofsted"];
  const notifiedRecipients = event.notifications
    .filter(n => n.sentAt)
    .map(n => n.recipient);
  const missingRecipients = requiredRecipients.filter(r => !notifiedRecipients.includes(r));

  // Check overdue notifications
  const overdueNotifications: { recipient: NotificationRecipient; deadline: string; hoursOverdue: number }[] = [];

  for (const recipient of requiredRecipients) {
    const entry = event.notifications.find(n => n.recipient === recipient);
    if (!entry) {
      // No entry at all — check if deadline has passed
      const urgency = CATEGORY_URGENCY[event.category];
      const deadlineHours = URGENCY_HOURS[urgency];
      const discoveredTime = new Date(event.discoveredAt).getTime();
      const deadline = discoveredTime + deadlineHours * 60 * 60 * 1000;

      if (currentTime > deadline) {
        const hoursOverdue = Math.round((currentTime - deadline) / (60 * 60 * 1000));
        overdueNotifications.push({
          recipient,
          deadline: new Date(deadline).toISOString(),
          hoursOverdue,
        });
        issues.push(`${getRecipientLabel(recipient)} notification overdue by ${hoursOverdue}h`);
      }
    } else if (!entry.sentAt) {
      // Entry exists but not sent
      const deadlineTime = new Date(entry.deadline).getTime();
      if (currentTime > deadlineTime) {
        const hoursOverdue = Math.round((currentTime - deadlineTime) / (60 * 60 * 1000));
        overdueNotifications.push({
          recipient,
          deadline: entry.deadline,
          hoursOverdue,
        });
        issues.push(`${getRecipientLabel(recipient)} notification overdue by ${hoursOverdue}h`);
      }
    } else {
      // Was sent — check if it was late
      const sentTime = new Date(entry.sentAt).getTime();
      const deadlineTime = new Date(entry.deadline).getTime();
      if (sentTime > deadlineTime) {
        const hoursLate = Math.round((sentTime - deadlineTime) / (60 * 60 * 1000));
        warnings.push(`${getRecipientLabel(recipient)} notified ${hoursLate}h late`);
      }
    }
  }

  // Missing recipients
  if (missingRecipients.length > 0) {
    const urgency = CATEGORY_URGENCY[event.category];
    const deadlineHours = URGENCY_HOURS[urgency];
    const discoveredTime = new Date(event.discoveredAt).getTime();
    const deadline = discoveredTime + deadlineHours * 60 * 60 * 1000;

    if (currentTime <= deadline) {
      // Still within deadline — warning, not issue
      warnings.push(`${missingRecipients.length} notification(s) pending — deadline in ${Math.round((deadline - currentTime) / (60 * 60 * 1000))}h`);
    }
  }

  // Determine timeliness
  let timeliness: "on_time" | "late" | "pending" = "on_time";
  if (overdueNotifications.length > 0) {
    timeliness = "late";
  } else if (missingRecipients.length > 0) {
    timeliness = "pending";
  }

  const isCompliant = issues.length === 0;

  return {
    eventId: event.id,
    category: event.category,
    title: event.title,
    isCompliant,
    issues,
    warnings,
    requiredRecipients,
    notifiedRecipients,
    missingRecipients,
    overdueNotifications,
    timeliness,
  };
}

// ── Core: Calculate Metrics ──────────────────────────────────────────────

export function calculateNotifiableEventsMetrics(
  events: NotifiableEvent[],
  homeId: string,
  now?: string,
): NotifiableEventsMetrics {
  const currentTime = now ? new Date(now).getTime() : Date.now();
  const homeEvents = events.filter(e => e.homeId === homeId);

  const thirtyDaysAgo = currentTime - 30 * 24 * 60 * 60 * 1000;
  const ninetyDaysAgo = currentTime - 90 * 24 * 60 * 60 * 1000;

  const thisMonth = homeEvents.filter(e => new Date(e.occurredAt).getTime() > thirtyDaysAgo);
  const thisQuarter = homeEvents.filter(e => new Date(e.occurredAt).getTime() > ninetyDaysAgo);

  // Count pending and overdue
  let pendingNotifications = 0;
  let overdueNotifications = 0;
  let totalResponseHours = 0;
  let respondedCount = 0;

  for (const event of homeEvents) {
    const compliance = evaluateNotificationCompliance(event, now);
    if (compliance.timeliness === "pending") pendingNotifications++;
    overdueNotifications += compliance.overdueNotifications.length;

    // Calculate average response time for sent notifications
    for (const notification of event.notifications) {
      if (notification.sentAt) {
        const discoveredTime = new Date(event.discoveredAt).getTime();
        const sentTime = new Date(notification.sentAt).getTime();
        totalResponseHours += (sentTime - discoveredTime) / (60 * 60 * 1000);
        respondedCount++;
      }
    }
  }

  const complianceResults = homeEvents.map(e => evaluateNotificationCompliance(e, now));
  const compliantCount = complianceResults.filter(r => r.isCompliant).length;
  const complianceRate = homeEvents.length > 0
    ? Math.round((compliantCount / homeEvents.length) * 100)
    : 100;

  // By category
  const categoryMap = new Map<NotifiableEventCategory, number>();
  for (const event of homeEvents) {
    categoryMap.set(event.category, (categoryMap.get(event.category) ?? 0) + 1);
  }
  const byCategory = Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // By status
  const statusMap = new Map<NotificationStatus, number>();
  for (const event of homeEvents) {
    for (const n of event.notifications) {
      statusMap.set(n.status, (statusMap.get(n.status) ?? 0) + 1);
    }
  }
  const byStatus = Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }));

  // Children involved
  const childIds = new Set(homeEvents.filter(e => e.childId).map(e => e.childId));

  // Ofsted notifications
  const ofstedNotifications = homeEvents.filter(
    e => e.notifications.some(n => n.recipient === "ofsted" && n.sentAt)
  ).length;

  // Requires immediate action
  const requiresImmediateAction = homeEvents.filter(e => {
    const urgency = CATEGORY_URGENCY[e.category];
    if (urgency !== "immediate") return false;
    const compliance = evaluateNotificationCompliance(e, now);
    return !compliance.isCompliant || compliance.timeliness === "pending";
  });

  // Recent events
  const recentEvents = homeEvents
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 10)
    .map(e => {
      const c = evaluateNotificationCompliance(e, now);
      return {
        id: e.id,
        category: e.category,
        title: e.title,
        occurredAt: e.occurredAt,
        status: c.timeliness,
      };
    });

  return {
    homeId,
    totalEvents: homeEvents.length,
    eventsThisMonth: thisMonth.length,
    eventsThisQuarter: thisQuarter.length,
    pendingNotifications,
    overdueNotifications,
    complianceRate,
    averageResponseHours: respondedCount > 0 ? Math.round(totalResponseHours / respondedCount) : 0,
    byCategory,
    byStatus,
    recentEvents,
    childrenInvolved: childIds.size,
    ofstedNotifications,
    requiresImmediateAction,
  };
}

// ── Core: Build Notification Timeline ────────────────────────────────────

export function buildNotificationTimeline(
  event: NotifiableEvent,
  now?: string,
): NotificationTimeline {
  const currentTime = now ? new Date(now).getTime() : Date.now();
  const urgency = CATEGORY_URGENCY[event.category];
  const deadlineHours = URGENCY_HOURS[urgency];
  const discoveredTime = new Date(event.discoveredAt).getTime();
  const defaultDeadline = new Date(discoveredTime + deadlineHours * 60 * 60 * 1000).toISOString();

  const requiredRecipients = CATEGORY_RECIPIENTS[event.category] ?? ["ofsted"];

  const entries = requiredRecipients.map(recipient => {
    const notification = event.notifications.find(n => n.recipient === recipient);
    const deadline = notification?.deadline ?? defaultDeadline;
    const deadlineTime = new Date(deadline).getTime();
    const sentAt = notification?.sentAt;
    const sentTime = sentAt ? new Date(sentAt).getTime() : null;

    let status: NotificationStatus = "pending";
    let isLate = false;
    let hoursLate: number | undefined;

    if (sentAt) {
      status = notification?.acknowledgedAt ? "acknowledged" : "submitted";
      if (sentTime! > deadlineTime) {
        isLate = true;
        hoursLate = Math.round((sentTime! - deadlineTime) / (60 * 60 * 1000));
      }
    } else if (currentTime > deadlineTime) {
      status = "overdue";
      isLate = true;
      hoursLate = Math.round((currentTime - deadlineTime) / (60 * 60 * 1000));
    }

    return { recipient, deadline, sentAt, status, isLate, hoursLate };
  });

  return {
    eventId: event.id,
    title: event.title,
    category: event.category,
    occurredAt: event.occurredAt,
    entries,
  };
}

// ── Core: Determine Required Notifications ───────────────────────────────

export function getRequiredNotifications(
  category: NotifiableEventCategory,
  discoveredAt: string,
): { recipient: NotificationRecipient; deadline: string; urgency: Urgency }[] {
  const urgency = CATEGORY_URGENCY[category];
  const deadlineHours = URGENCY_HOURS[urgency];
  const discoveredTime = new Date(discoveredAt).getTime();
  const deadline = new Date(discoveredTime + deadlineHours * 60 * 60 * 1000).toISOString();
  const recipients = CATEGORY_RECIPIENTS[category] ?? ["ofsted"];

  return recipients.map(recipient => ({ recipient, deadline, urgency }));
}

// ── Helpers ──────────────────────────────────────────────────────────────

export function getCategoryLabel(category: NotifiableEventCategory): string {
  return CATEGORY_LABELS[category] ?? category.replace(/_/g, " ");
}

export function getRecipientLabel(recipient: NotificationRecipient): string {
  const labels: Record<NotificationRecipient, string> = {
    ofsted: "Ofsted",
    local_authority: "Local Authority",
    social_worker: "Social Worker",
    parent_carer: "Parent/Carer",
    police: "Police",
    placing_authority: "Placing Authority",
    designated_officer: "LADO/Designated Officer",
    public_health: "Public Health",
  };
  return labels[recipient] ?? recipient;
}

export function getUrgencyLabel(urgency: Urgency): string {
  const labels: Record<Urgency, string> = {
    immediate: "Immediate (within 4 hours)",
    within_24h: "Within 24 hours",
    within_5_working_days: "Within 5 working days",
  };
  return labels[urgency] ?? urgency;
}

export function getCategoryUrgency(category: NotifiableEventCategory): Urgency {
  return CATEGORY_URGENCY[category];
}
