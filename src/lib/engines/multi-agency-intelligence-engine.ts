// ══════════════════════════════════════════════════════════════════════════════
// CARA — MULTI-AGENCY WORKING INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses LAC review compliance, professional contact currency,
// multi-agency meeting attendance/follow-up, child participation,
// and home report submission timeliness.
//
// Regulatory: Reg 5 (engagement with parents and others), Reg 13 (leadership
// and management), Working Together to Safeguard Children 2018.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface LACReviewInput {
  id: string;
  child_id: string;
  review_type: string; // initial, second, subsequent
  date: string;
  iro_name: string;
  child_participated: boolean;
  home_report_submitted: boolean;
  care_plan_agreed: boolean;
  actions: string[];
  next_review_due: string;
}

export interface ProfessionalContactInput {
  id: string;
  child_id: string;
  professional_role: string; // social_worker, iro, camhs, yot, education, health, police, other
  name: string;
  last_contact_date: string;
  contact_frequency_days: number; // expected frequency
  status: string; // active, inactive
}

export interface MultiAgencyMeetingInput {
  id: string;
  meeting_type: string; // lac_review, pep, professionals_meeting, strategy, child_protection
  date: string;
  child_id: string;
  attendees: string[];
  actions_count: number;
  actions_completed: number;
  home_report_submitted: boolean;
}

export interface ChildRef {
  id: string;
  name: string;
}

export interface StaffRef {
  id: string;
  name: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface MultiAgencyIntelligenceResult {
  overview: MultiAgencyOverview;
  meeting_types: MeetingTypeSummary[];
  child_engagement: ChildEngagementProfile[];
  upcoming_reviews: UpcomingReview[];
  alerts: MultiAgencyAlert[];
  insights: CaraMultiAgencyInsight[];
}

export interface MultiAgencyOverview {
  total_professionals: number;
  children_with_social_worker: number;
  total_children: number;
  overdue_contacts: number;
  lac_reviews_this_year: number;
  child_participation_rate: number;
  home_report_rate: number;
  meetings_this_quarter: number;
  follow_up_completion_rate: number;
}

export interface MeetingTypeSummary {
  meeting_type: string;
  type_label: string;
  count: number;
  actions_completion_rate: number;
}

export interface ChildEngagementProfile {
  child_id: string;
  child_name: string;
  professional_count: number;
  overdue_contacts: number;
  last_review_date: string | null;
  next_review_due: string | null;
  participation_rate: number;
}

export interface UpcomingReview {
  review_id: string;
  child_name: string;
  review_type: string;
  date: string;
  days_until: number;
  home_report_submitted: boolean;
  iro_name: string;
}

export interface MultiAgencyAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraMultiAgencyInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

// ── Engine Input ────────────────────────────────────────────────────────────

export interface MultiAgencyEngineInput {
  lacReviews: LACReviewInput[];
  professionalContacts: ProfessionalContactInput[];
  meetings: MultiAgencyMeetingInput[];
  children: ChildRef[];
  staff: StaffRef[];
  today?: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const MEETING_TYPE_LABELS: Record<string, string> = {
  lac_review: "LAC Review",
  pep: "PEP Meeting",
  professionals_meeting: "Professionals Meeting",
  strategy: "Strategy Meeting",
  child_protection: "Child Protection Conference",
};

const ROLE_LABELS: Record<string, string> = {
  social_worker: "Social Worker",
  iro: "IRO",
  camhs: "CAMHS",
  yot: "YOT",
  education: "Education",
  health: "Health",
  police: "Police",
  other: "Other",
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function isWithinDays(dateStr: string, today: string, days: number): boolean {
  const diff = daysBetween(today, dateStr);
  return diff >= 0 && diff <= days;
}

function isWithinPastDays(dateStr: string, today: string, days: number): boolean {
  const diff = daysBetween(dateStr, today);
  return diff >= 0 && diff <= days;
}

export function getMeetingTypeLabel(meetingType: string): string {
  return MEETING_TYPE_LABELS[meetingType] ?? meetingType;
}

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

// ── Main Engine ─────────────────────────────────────────────────────────────

export function computeMultiAgencyIntelligence(input: MultiAgencyEngineInput): MultiAgencyIntelligenceResult {
  const today = input.today ?? new Date().toISOString().split("T")[0];
  const { lacReviews, professionalContacts, meetings, children } = input;

  // ── Overview calculations ───────────────────────────────────────────────
  const activeProfessionals = professionalContacts.filter((p) => p.status === "active");
  const totalProfessionals = activeProfessionals.length;

  const childrenWithSW = new Set(
    activeProfessionals
      .filter((p) => p.professional_role === "social_worker")
      .map((p) => p.child_id)
  ).size;

  const totalChildren = children.length;

  // Overdue contacts: active contacts where last_contact_date + frequency < today
  const overdueContacts = activeProfessionals.filter((p) => {
    const nextDueDate = addDays(p.last_contact_date, p.contact_frequency_days);
    return daysBetween(nextDueDate, today) > 0;
  });

  // LAC reviews this year (365-day window ending at today)
  const reviewsThisYear = lacReviews.filter((r) => isWithinPastDays(r.date, today, 365));

  // Child participation rate
  const participatingReviews = reviewsThisYear.filter((r) => r.child_participated);
  const childParticipationRate = reviewsThisYear.length > 0
    ? Math.round((participatingReviews.length / reviewsThisYear.length) * 100)
    : 0;

  // Home report submission rate
  const homeReportSubmitted = reviewsThisYear.filter((r) => r.home_report_submitted);
  const homeReportRate = reviewsThisYear.length > 0
    ? Math.round((homeReportSubmitted.length / reviewsThisYear.length) * 100)
    : 0;

  // Meetings this quarter (90-day window ending at today)
  const meetingsThisQuarter = meetings.filter((m) => isWithinPastDays(m.date, today, 90));

  // Follow-up completion rate (across all meetings this quarter)
  const totalActions = meetingsThisQuarter.reduce((sum, m) => sum + m.actions_count, 0);
  const completedActions = meetingsThisQuarter.reduce((sum, m) => sum + m.actions_completed, 0);
  const followUpCompletionRate = totalActions > 0
    ? Math.round((completedActions / totalActions) * 100)
    : 0;

  const overview: MultiAgencyOverview = {
    total_professionals: totalProfessionals,
    children_with_social_worker: childrenWithSW,
    total_children: totalChildren,
    overdue_contacts: overdueContacts.length,
    lac_reviews_this_year: reviewsThisYear.length,
    child_participation_rate: childParticipationRate,
    home_report_rate: homeReportRate,
    meetings_this_quarter: meetingsThisQuarter.length,
    follow_up_completion_rate: followUpCompletionRate,
  };

  // ── Meeting type summaries ──────────────────────────────────────────────
  const meetingTypeMap = new Map<string, MultiAgencyMeetingInput[]>();
  for (const m of meetingsThisQuarter) {
    const existing = meetingTypeMap.get(m.meeting_type) ?? [];
    existing.push(m);
    meetingTypeMap.set(m.meeting_type, existing);
  }

  const meetingTypes: MeetingTypeSummary[] = Array.from(meetingTypeMap.entries()).map(
    ([type, ms]) => {
      const totalAct = ms.reduce((sum, m) => sum + m.actions_count, 0);
      const completedAct = ms.reduce((sum, m) => sum + m.actions_completed, 0);
      return {
        meeting_type: type,
        type_label: getMeetingTypeLabel(type),
        count: ms.length,
        actions_completion_rate: totalAct > 0 ? Math.round((completedAct / totalAct) * 100) : 0,
      };
    }
  );

  // ── Child engagement profiles ───────────────────────────────────────────
  const childEngagement: ChildEngagementProfile[] = children.map((child) => {
    const childContacts = activeProfessionals.filter((p) => p.child_id === child.id);
    const childOverdue = childContacts.filter((p) => {
      const nextDueDate = addDays(p.last_contact_date, p.contact_frequency_days);
      return daysBetween(nextDueDate, today) > 0;
    });

    const childReviews = lacReviews
      .filter((r) => r.child_id === child.id)
      .sort((a, b) => b.date.localeCompare(a.date));

    const lastReview = childReviews[0] ?? null;

    const childParticipated = childReviews.filter((r) => r.child_participated);
    const participationRate = childReviews.length > 0
      ? Math.round((childParticipated.length / childReviews.length) * 100)
      : 0;

    return {
      child_id: child.id,
      child_name: child.name,
      professional_count: childContacts.length,
      overdue_contacts: childOverdue.length,
      last_review_date: lastReview?.date ?? null,
      next_review_due: lastReview?.next_review_due ?? null,
      participation_rate: participationRate,
    };
  });

  // ── Upcoming reviews ────────────────────────────────────────────────────
  const upcomingReviews: UpcomingReview[] = [];
  for (const review of lacReviews) {
    if (isWithinDays(review.next_review_due, today, 30)) {
      const child = children.find((c) => c.id === review.child_id);
      const daysUntil = daysBetween(today, review.next_review_due);
      upcomingReviews.push({
        review_id: review.id,
        child_name: child?.name ?? "Unknown",
        review_type: review.review_type,
        date: review.next_review_due,
        days_until: daysUntil,
        home_report_submitted: review.home_report_submitted,
        iro_name: review.iro_name,
      });
    }
  }
  upcomingReviews.sort((a, b) => a.days_until - b.days_until);

  // ── Alerts ──────────────────────────────────────────────────────────────
  const alerts: MultiAgencyAlert[] = [];

  // Critical: Child without allocated social worker
  for (const child of children) {
    const hasSW = activeProfessionals.some(
      (p) => p.child_id === child.id && p.professional_role === "social_worker"
    );
    if (!hasSW) {
      alerts.push({
        severity: "critical",
        message: `${child.name} does not have an allocated social worker`,
      });
    }
  }

  // High: Home report not submitted for review due within 5 days
  for (const review of lacReviews) {
    const daysUntilReview = daysBetween(today, review.next_review_due);
    if (daysUntilReview >= 0 && daysUntilReview <= 5 && !review.home_report_submitted) {
      const child = children.find((c) => c.id === review.child_id);
      alerts.push({
        severity: "high",
        message: `Home report not submitted for ${child?.name ?? "Unknown"} — review due in ${daysUntilReview} day${daysUntilReview !== 1 ? "s" : ""}`,
      });
    }
  }

  // High: LAC review overdue (next_review_due < today)
  for (const review of lacReviews) {
    const daysUntilReview = daysBetween(today, review.next_review_due);
    if (daysUntilReview < 0) {
      const child = children.find((c) => c.id === review.child_id);
      const daysOverdue = Math.abs(daysUntilReview);
      alerts.push({
        severity: "high",
        message: `LAC review overdue for ${child?.name ?? "Unknown"} by ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""}`,
      });
    }
  }

  // Medium: Professional contact overdue
  for (const contact of overdueContacts) {
    const child = children.find((c) => c.id === contact.child_id);
    const roleLabel = getRoleLabel(contact.professional_role);
    alerts.push({
      severity: "medium",
      message: `${roleLabel} contact overdue for ${child?.name ?? "Unknown"} (${contact.name})`,
    });
  }

  // Medium: Follow-up actions completion rate below 70%
  if (totalActions > 0 && followUpCompletionRate < 70) {
    alerts.push({
      severity: "medium",
      message: `Meeting follow-up completion rate is ${followUpCompletionRate}% — below 70% threshold`,
    });
  }

  // Low: Meeting with no documented actions
  for (const meeting of meetingsThisQuarter) {
    if (meeting.actions_count === 0) {
      const child = children.find((c) => c.id === meeting.child_id);
      const typeLabel = getMeetingTypeLabel(meeting.meeting_type);
      alerts.push({
        severity: "low",
        message: `${typeLabel} for ${child?.name ?? "Unknown"} on ${meeting.date} has no documented actions`,
      });
    }
  }

  // ── Insights ────────────────────────────────────────────────────────────
  const insights: CaraMultiAgencyInsight[] = [];

  // Critical: Children missing statutory professionals
  const childrenWithoutSW = children.filter(
    (c) => !activeProfessionals.some((p) => p.child_id === c.id && p.professional_role === "social_worker")
  );
  if (childrenWithoutSW.length > 0) {
    insights.push({
      severity: "critical",
      text: `${childrenWithoutSW.length} child${childrenWithoutSW.length !== 1 ? "ren" : ""} missing allocated social worker — statutory compliance failure`,
    });
  }

  // Warning: Multiple overdue professional contacts
  if (overdueContacts.length > 1) {
    insights.push({
      severity: "warning",
      text: `${overdueContacts.length} professional contacts overdue — multi-agency engagement dropping`,
    });
  } else if (overdueContacts.length === 1) {
    insights.push({
      severity: "warning",
      text: `1 professional contact overdue — monitor engagement levels`,
    });
  }

  // Warning: Home report submission rate below 100%
  if (reviewsThisYear.length > 0 && homeReportRate < 100) {
    insights.push({
      severity: "warning",
      text: `Home report submission rate at ${homeReportRate}% — preparation gap identified`,
    });
  }

  // Positive: All children have allocated social workers and IROs
  const allHaveSW = children.every(
    (c) => activeProfessionals.some((p) => p.child_id === c.id && p.professional_role === "social_worker")
  );
  const allHaveIRO = children.every(
    (c) => activeProfessionals.some((p) => p.child_id === c.id && p.professional_role === "iro")
  );
  if (allHaveSW && allHaveIRO && children.length > 0) {
    insights.push({
      severity: "positive",
      text: "All children have allocated social workers and IROs — statutory requirements met",
    });
  }

  // Positive: 100% child participation in LAC reviews
  if (reviewsThisYear.length > 0 && childParticipationRate === 100) {
    insights.push({
      severity: "positive",
      text: "100% child participation in LAC reviews — excellent engagement",
    });
  }

  // Positive: All actions from meetings completed on time
  if (totalActions > 0 && followUpCompletionRate === 100) {
    insights.push({
      severity: "positive",
      text: "All meeting actions completed on time — strong multi-agency follow-through",
    });
  }

  return {
    overview,
    meeting_types: meetingTypes,
    child_engagement: childEngagement,
    upcoming_reviews: upcomingReviews,
    alerts,
    insights,
  };
}

// ── Utility ─────────────────────────────────────────────────────────────────

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
