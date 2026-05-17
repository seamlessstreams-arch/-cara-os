// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Regulatory — Reg 44/45 Reporting Engine
//
// Deterministic engine for tracking regulatory reporting requirements
// under the Children's Homes (England) Regulations 2015:
//
//   Reg 44: Independent person — monthly visits and reports
//   Reg 45: Review of quality of care — 6-monthly review by RI
//
// Also tracks:
//   - Schedule 4 matters to be monitored
//   - Statutory notifications to Ofsted
//   - Statement of purpose reviews
//   - Children's guide updates
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

import type { Role } from "../permissions/types";
import { isAtLeast } from "../permissions/role-rules";

// ── Types ──────────────────────────────────────────────────────────────────

export type ReportType =
  | "reg_44"                  // Independent visitor monthly report
  | "reg_45"                  // Quality of care 6-monthly review
  | "statutory_notification"  // Notification to Ofsted/LA
  | "schedule_4"             // Schedule 4 monitoring matters
  | "statement_of_purpose"   // Annual SoP review
  | "children_guide";        // Children's guide review

export type ReportStatus =
  | "scheduled"
  | "in_progress"
  | "submitted"
  | "reviewed"
  | "published"
  | "overdue"
  | "missed";

export type NotificationType =
  | "death"                  // within 24 hours
  | "serious_injury"        // within 24 hours
  | "serious_illness"       // within 24 hours
  | "serious_incident"      // within 24 hours
  | "police_involvement"    // without delay
  | "allegation_against_staff" // without delay
  | "child_protection"      // without delay
  | "absconding"           // within 24 hours
  | "unauthorised_absence"  // within 24 hours
  | "fire"                 // within 24 hours
  | "outbreak"             // within 24 hours
  | "accommodation_change" // within 5 working days
  | "manager_absence"      // 28+ days absence — within 14 days
  | "ofsted_change";       // changes to registration

export type Reg44Section =
  | "children_views"        // Views of children
  | "practice_standards"    // Practice and quality standards
  | "staffing"             // Staffing adequacy
  | "safeguarding"         // Safeguarding practice
  | "environment"          // Physical environment
  | "health"               // Health provision
  | "education"            // Education and achievement
  | "records"              // Record keeping
  | "complaints"           // Complaints and representations
  | "previous_actions"     // Follow-up on previous report actions
  | "overall_judgement";   // Overall judgement

export type Schedule4Matter =
  | "child_progress"
  | "staffing_issues"
  | "safeguarding_concerns"
  | "restraint_use"
  | "missing_episodes"
  | "complaints"
  | "medication_errors"
  | "maintenance_issues"
  | "training_deficits"
  | "notifiable_events";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface Reg44Report {
  id: string;
  homeId: string;
  visitDate: string;
  visitorId: string;
  visitorName: string;
  status: ReportStatus;
  reportMonth: string;            // e.g., "2026-04"
  dueDate: string;                // when report should be submitted
  submittedAt?: string;
  reviewedByRI?: string;
  reviewedAt?: string;
  publishedAt?: string;
  sections: Reg44SectionEntry[];
  actionPoints: ActionPoint[];
  overallJudgement?: "outstanding" | "good" | "requires_improvement" | "inadequate";
  childrenSpokenTo: number;
  staffSpokenTo: number;
  announced: boolean;             // false = unannounced (preferred)
}

export interface Reg44SectionEntry {
  section: Reg44Section;
  findings: string;
  rating: "strength" | "adequate" | "concern" | "serious_concern";
  evidenceNotes: string;
}

export interface ActionPoint {
  id: string;
  description: string;
  priority: "immediate" | "high" | "medium" | "low";
  assignedTo: string;
  dueDate: string;
  status: "open" | "in_progress" | "completed" | "overdue";
  completedAt?: string;
  completedBy?: string;
  response?: string;
}

export interface Reg45Review {
  id: string;
  homeId: string;
  reviewPeriod: string;           // e.g., "2025-H2" (second half 2025)
  reviewedBy: string;             // Must be RI
  reviewerRole: Role;
  status: ReportStatus;
  dueDate: string;
  submittedAt?: string;
  schedule4Findings: Schedule4Finding[];
  qualityRating?: "outstanding" | "good" | "requires_improvement" | "inadequate";
  improvementActions: ActionPoint[];
  developmentPlan: string[];
  sentToOfsted: boolean;
  sentToOfstedAt?: string;
}

export interface Schedule4Finding {
  matter: Schedule4Matter;
  finding: string;
  trend: "improving" | "stable" | "declining";
  dataPoints: number;
  concern: boolean;
  action?: string;
}

export interface StatutoryNotification {
  id: string;
  homeId: string;
  type: NotificationType;
  incidentDate: string;
  reportedAt: string;
  reportedBy: string;
  sentToOfsted: boolean;
  sentToOfstedAt?: string;
  sentToLA: boolean;
  sentToLAAt?: string;
  dueBy: string;                  // statutory deadline
  isOverdue: boolean;
  summary: string;
  childId?: string;
  staffId?: string;
  ofstedRef?: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface RegulatoryComplianceResult {
  homeId: string;
  reg44Compliance: {
    totalExpected: number;        // should be 12 per year
    completed: number;
    overdue: number;
    lastVisitDate: string | null;
    daysSinceLastVisit: number | null;
    nextDueDate: string;
    unannounced: number;          // should be majority
    announcedPercentage: number;
    openActionPoints: number;
    overdueActionPoints: number;
  };
  reg45Compliance: {
    totalExpected: number;        // should be 2 per year
    completed: number;
    overdue: number;
    lastReviewDate: string | null;
    nextDueDate: string;
    sentToOfsted: boolean;
  };
  notifications: {
    total: number;
    overdue: number;
    withinTimescale: number;
    complianceRate: number;       // %
  };
  overallStatus: "compliant" | "at_risk" | "non_compliant";
  issues: string[];
}

// ── Configuration ──────────────────────────────────────────────────────────

const NOTIFICATION_DEADLINES: Record<NotificationType, number> = {
  death: 24,
  serious_injury: 24,
  serious_illness: 24,
  serious_incident: 24,
  police_involvement: 0,          // "without delay"
  allegation_against_staff: 0,
  child_protection: 0,
  absconding: 24,
  unauthorised_absence: 24,
  fire: 24,
  outbreak: 24,
  accommodation_change: 120,      // 5 working days (hours)
  manager_absence: 336,           // 14 days
  ofsted_change: 336,
};

const REG44_SECTIONS: Reg44Section[] = [
  "children_views",
  "practice_standards",
  "staffing",
  "safeguarding",
  "environment",
  "health",
  "education",
  "records",
  "complaints",
  "previous_actions",
  "overall_judgement",
];

// ── Core: Evaluate Regulatory Compliance ──────────────────────────────────

export function evaluateRegulatoryCompliance(
  reports: Reg44Report[],
  reviews: Reg45Review[],
  notifications: StatutoryNotification[],
  homeId: string,
  now?: string,
): RegulatoryComplianceResult {
  const currentDate = now ? new Date(now) : new Date();
  const issues: string[] = [];

  // ── Reg 44 Analysis ──
  const homeReports = reports.filter(r => r.homeId === homeId);
  const completedReports = homeReports.filter(r =>
    r.status === "submitted" || r.status === "reviewed" || r.status === "published",
  );
  const overdueReports = homeReports.filter(r => r.status === "overdue" || r.status === "missed");

  const sortedByDate = [...completedReports].sort(
    (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime(),
  );
  const lastVisit = sortedByDate[0] ?? null;
  const lastVisitDate = lastVisit?.visitDate ?? null;
  const daysSinceLastVisit = lastVisitDate
    ? Math.floor((currentDate.getTime() - new Date(lastVisitDate).getTime()) / (24 * 60 * 60 * 1000))
    : null;

  // Next due: 1st of next month (monthly visits)
  const nextMonth = new Date(currentDate);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1, 1);
  const nextDueDate = nextMonth.toISOString();

  // Unannounced tracking
  const announcedCount = completedReports.filter(r => r.announced).length;
  const announcedPercentage = completedReports.length > 0
    ? Math.round((announcedCount / completedReports.length) * 100)
    : 0;
  const unannouncedCount = completedReports.filter(r => !r.announced).length;

  // Action points
  const allActions = homeReports.flatMap(r => r.actionPoints);
  const openActions = allActions.filter(a => a.status === "open" || a.status === "in_progress");
  const overdueActions = allActions.filter(a =>
    a.status === "overdue" || (a.status === "open" && new Date(a.dueDate) < currentDate),
  );

  if (daysSinceLastVisit !== null && daysSinceLastVisit > 35) {
    issues.push(`Reg 44 visit overdue — ${daysSinceLastVisit} days since last visit (max 28 days between visits).`);
  }
  if (overdueReports.length > 0) {
    issues.push(`${overdueReports.length} Reg 44 report(s) overdue or missed.`);
  }
  if (announcedPercentage > 50 && completedReports.length >= 3) {
    issues.push("Majority of Reg 44 visits are announced — should be predominantly unannounced.");
  }

  // ── Reg 45 Analysis ──
  const homeReviews = reviews.filter(r => r.homeId === homeId);
  const completedReviews = homeReviews.filter(r =>
    r.status === "submitted" || r.status === "reviewed" || r.status === "published",
  );
  const overdueReviews = homeReviews.filter(r => r.status === "overdue" || r.status === "missed");

  const sortedReviews = [...completedReviews].sort(
    (a, b) => new Date(b.submittedAt ?? b.dueDate).getTime() - new Date(a.submittedAt ?? a.dueDate).getTime(),
  );
  const lastReview = sortedReviews[0] ?? null;
  const lastReviewDate = lastReview?.submittedAt ?? null;

  // Reg 45 reviews due every 6 months
  const nextReviewDue = new Date(currentDate);
  nextReviewDue.setUTCMonth(nextReviewDue.getUTCMonth() + 6);

  const lastReviewSentToOfsted = lastReview?.sentToOfsted ?? false;

  if (overdueReviews.length > 0) {
    issues.push("Reg 45 quality of care review overdue.");
  }
  if (lastReview && !lastReview.sentToOfsted) {
    issues.push("Most recent Reg 45 review has not been sent to Ofsted.");
  }

  // ── Notifications Analysis ──
  const homeNotifications = notifications.filter(n => n.homeId === homeId);
  const overdueNotifications = homeNotifications.filter(n => n.isOverdue);
  const withinTimescale = homeNotifications.filter(n => !n.isOverdue);
  const notificationComplianceRate = homeNotifications.length > 0
    ? Math.round((withinTimescale.length / homeNotifications.length) * 100)
    : 100;

  if (overdueNotifications.length > 0) {
    issues.push(`${overdueNotifications.length} statutory notification(s) were submitted late.`);
  }

  // ── Overall Status ──
  let overallStatus: "compliant" | "at_risk" | "non_compliant";
  if (issues.length === 0) {
    overallStatus = "compliant";
  } else if (issues.some(i => i.includes("overdue") || i.includes("missed") || i.includes("late"))) {
    overallStatus = "non_compliant";
  } else {
    overallStatus = "at_risk";
  }

  return {
    homeId,
    reg44Compliance: {
      totalExpected: 12,
      completed: completedReports.length,
      overdue: overdueReports.length,
      lastVisitDate,
      daysSinceLastVisit,
      nextDueDate,
      unannounced: unannouncedCount,
      announcedPercentage,
      openActionPoints: openActions.length,
      overdueActionPoints: overdueActions.length,
    },
    reg45Compliance: {
      totalExpected: 2,
      completed: completedReviews.length,
      overdue: overdueReviews.length,
      lastReviewDate,
      nextDueDate: nextReviewDue.toISOString(),
      sentToOfsted: lastReviewSentToOfsted,
    },
    notifications: {
      total: homeNotifications.length,
      overdue: overdueNotifications.length,
      withinTimescale: withinTimescale.length,
      complianceRate: notificationComplianceRate,
    },
    overallStatus,
    issues,
  };
}

// ── Core: Check Notification Timeliness ───────────────────────────────────

export function checkNotificationTimeliness(
  notification: StatutoryNotification,
): { timely: boolean; hoursToDeadline: number; deadlineHours: number } {
  const deadlineHours = NOTIFICATION_DEADLINES[notification.type] ?? 24;
  const incidentTime = new Date(notification.incidentDate);
  const reportedTime = new Date(notification.reportedAt);
  const hoursTaken = (reportedTime.getTime() - incidentTime.getTime()) / (60 * 60 * 1000);
  const hoursToDeadline = deadlineHours - hoursTaken;

  return {
    timely: hoursTaken <= deadlineHours,
    hoursToDeadline,
    deadlineHours,
  };
}

// ── Core: Generate Reg 44 Schedule ────────────────────────────────────────

export function generateReg44Schedule(
  homeId: string,
  year: number,
  visitorId: string,
  visitorName: string,
): Reg44Report[] {
  const schedule: Reg44Report[] = [];

  for (let month = 0; month < 12; month++) {
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    // Visit should be between 1st and 28th of month
    const visitDay = 10 + (month % 18); // stagger through month
    const visitDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(Math.min(visitDay, 28)).padStart(2, "0")}T10:00:00Z`;
    // Report due within 5 working days of visit
    const dueDateObj = new Date(visitDate);
    dueDateObj.setUTCDate(dueDateObj.getUTCDate() + 7);

    schedule.push({
      id: `reg44-${homeId}-${monthStr}`,
      homeId,
      visitDate,
      visitorId,
      visitorName,
      status: "scheduled",
      reportMonth: monthStr,
      dueDate: dueDateObj.toISOString(),
      sections: [],
      actionPoints: [],
      childrenSpokenTo: 0,
      staffSpokenTo: 0,
      announced: month % 4 === 0, // 1 in 4 announced, rest unannounced
    });
  }

  return schedule;
}

// ── Core: Validate Reg 44 Report Completeness ─────────────────────────────

export interface Reg44ValidationResult {
  isComplete: boolean;
  missingSections: Reg44Section[];
  warnings: string[];
  errors: string[];
}

export function validateReg44Report(report: Reg44Report): Reg44ValidationResult {
  const missingSections: Reg44Section[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  // All 11 sections must be completed
  for (const section of REG44_SECTIONS) {
    if (!report.sections.find(s => s.section === section)) {
      missingSections.push(section);
    }
  }

  if (missingSections.length > 0) {
    errors.push(`${missingSections.length} required sections not completed.`);
  }

  // Must speak to at least 1 child
  if (report.childrenSpokenTo === 0) {
    errors.push("No children spoken to during visit — Reg 44(3)(b) requires visitor to seek views of children.");
  }

  // Must speak to staff
  if (report.staffSpokenTo === 0) {
    warnings.push("No staff spoken to during visit — recommended to gather staff views.");
  }

  // Overall judgement required
  if (!report.overallJudgement) {
    errors.push("Overall judgement not recorded.");
  }

  // Action points should have due dates and assignees
  for (const action of report.actionPoints) {
    if (!action.assignedTo) {
      warnings.push(`Action point "${action.description.slice(0, 40)}..." has no assignee.`);
    }
    if (!action.dueDate) {
      warnings.push(`Action point "${action.description.slice(0, 40)}..." has no due date.`);
    }
  }

  return {
    isComplete: errors.length === 0 && missingSections.length === 0,
    missingSections,
    warnings,
    errors,
  };
}

// ── Core: Track Action Point Progress ─────────────────────────────────────

export interface ActionPointSummary {
  total: number;
  completed: number;
  open: number;
  overdue: number;
  completionRate: number;
  byPriority: Record<string, number>;
  averageResolutionDays: number;
}

export function summarizeActionPoints(
  reports: Reg44Report[],
  now?: string,
): ActionPointSummary {
  const currentDate = now ? new Date(now) : new Date();
  const allActions = reports.flatMap(r => r.actionPoints);

  const completed = allActions.filter(a => a.status === "completed");
  const open = allActions.filter(a => a.status === "open" || a.status === "in_progress");
  const overdue = allActions.filter(a =>
    a.status === "overdue" || ((a.status === "open" || a.status === "in_progress") && new Date(a.dueDate) < currentDate),
  );

  const byPriority: Record<string, number> = {
    immediate: allActions.filter(a => a.priority === "immediate" && a.status !== "completed").length,
    high: allActions.filter(a => a.priority === "high" && a.status !== "completed").length,
    medium: allActions.filter(a => a.priority === "medium" && a.status !== "completed").length,
    low: allActions.filter(a => a.priority === "low" && a.status !== "completed").length,
  };

  // Average resolution time
  const resolvedWithDates = completed.filter(a => a.completedAt);
  let totalDays = 0;
  for (const action of resolvedWithDates) {
    // Find the report this action belongs to
    const report = reports.find(r => r.actionPoints.some(ap => ap.id === action.id));
    if (report) {
      const created = new Date(report.visitDate);
      const resolved = new Date(action.completedAt!);
      totalDays += (resolved.getTime() - created.getTime()) / (24 * 60 * 60 * 1000);
    }
  }
  const averageResolutionDays = resolvedWithDates.length > 0
    ? Math.round(totalDays / resolvedWithDates.length)
    : 0;

  return {
    total: allActions.length,
    completed: completed.length,
    open: open.length,
    overdue: overdue.length,
    completionRate: allActions.length > 0
      ? Math.round((completed.length / allActions.length) * 100)
      : 100,
    byPriority,
    averageResolutionDays,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────

export function getNotificationDeadlineHours(type: NotificationType): number {
  return NOTIFICATION_DEADLINES[type] ?? 24;
}

export function getReg44Sections(): Reg44Section[] {
  return [...REG44_SECTIONS];
}

export function getNotificationTypeLabel(type: NotificationType): string {
  const labels: Record<NotificationType, string> = {
    death: "Death of a Child",
    serious_injury: "Serious Injury",
    serious_illness: "Serious Illness",
    serious_incident: "Serious Incident",
    police_involvement: "Police Involvement",
    allegation_against_staff: "Allegation Against Staff",
    child_protection: "Child Protection Concern",
    absconding: "Absconding",
    unauthorised_absence: "Unauthorised Absence",
    fire: "Fire",
    outbreak: "Outbreak/Infectious Disease",
    accommodation_change: "Accommodation Change",
    manager_absence: "Manager Absence (28+ days)",
    ofsted_change: "Change to Registration",
  };
  return labels[type];
}

export function getReg44SectionLabel(section: Reg44Section): string {
  const labels: Record<Reg44Section, string> = {
    children_views: "Children's Views",
    practice_standards: "Practice Standards",
    staffing: "Staffing",
    safeguarding: "Safeguarding",
    environment: "Physical Environment",
    health: "Health",
    education: "Education",
    records: "Records",
    complaints: "Complaints",
    previous_actions: "Previous Actions",
    overall_judgement: "Overall Judgement",
  };
  return labels[section];
}
