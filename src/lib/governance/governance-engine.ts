// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Governance & Leadership Intelligence Engine
//
// Pure deterministic engine. No AI, no external calls, no side-effects.
//
// Covers SCCIF Judgement Area 3: "Effectiveness of leaders and managers"
//
// Regulatory framework:
//   CHR 2015 Reg 16   — Statement of Purpose (reviewed annually, accurate)
//   CHR 2015 Reg 45   — Review of quality of care (monthly monitoring)
//   CHR 2015 Reg 39   — Notification of serious events
//   CHR 2015 Reg 40   — Notification of other events
//   CHR 2015 Reg 22   — Review of premises
//   CHR 2015 Sch 1    — Information for Ofsted (Schedule 1 accuracy)
//   SCCIF              — Leaders set and model high expectations
//   Working Together   — Governance, accountability, information sharing
//
// Key governance requirements:
//   1. Statement of Purpose reviewed annually and shared with Ofsted
//   2. Children's Guide accessible to all children
//   3. Reg 45 monthly monitoring reports completed on time
//   4. Reg 44 independent visits completed monthly (tracked elsewhere)
//   5. Development plan with measurable objectives, regularly reviewed
//   6. Policies reviewed at least annually
//   7. Ofsted notifications made within required timescales
//   8. Schedule 1 information kept up to date
//   9. Staff meetings held regularly
//   10. Management visible and present in the home
//
// Scoring breakdown (0–100):
//   Statement of Purpose compliance:  15
//   Reg 45 monitoring:                20
//   Policy review compliance:         15
//   Development plan progress:        15
//   Notification timeliness:          10
//   Staff meeting compliance:         10
//   Management presence:              10
//   Children's Guide accessibility:    5
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ─────────────────────────────────────────────────────────────────────

export type PolicyCategory =
  | "safeguarding"
  | "behaviour_management"
  | "complaints"
  | "missing_children"
  | "medication"
  | "fire_safety"
  | "health_safety"
  | "equality_diversity"
  | "whistleblowing"
  | "data_protection"
  | "recruitment"
  | "supervision"
  | "restraint"
  | "bullying"
  | "internet_safety"
  | "confidentiality"
  | "admissions"
  | "contact_arrangements"
  | "education";

export type NotificationType =
  | "serious_injury"
  | "death"
  | "child_protection"
  | "police_involvement"
  | "missing_child"
  | "serious_illness"
  | "absconding"
  | "restraint"
  | "allegation_against_staff"
  | "serious_complaint"
  | "fire"
  | "outbreak_infectious_disease"
  | "significant_incident";

export type NotificationRecipient =
  | "ofsted"
  | "placing_authority"
  | "parent_carer"
  | "police"
  | "lado";

export type DevelopmentObjectiveStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "ongoing"
  | "overdue";

export type MeetingType =
  | "staff_team"
  | "management"
  | "children_meeting"
  | "governance_board"
  | "policy_review";

// ── Data Models ───────────────────────────────────────────────────────────────

export interface StatementOfPurpose {
  lastReviewDate: string;
  nextReviewDue: string;
  sharedWithOfsted: boolean;
  lastSharedDate?: string;
  accurateChildrenCount: boolean;
  accurateStaffDetails: boolean;
  accurateServiceDescription: boolean;
  childrenGuideAvailable: boolean;
  childrenGuideLastUpdated?: string;
  childrenGuideAccessibleFormats: string[];
}

export interface Reg45Report {
  id: string;
  monthCovered: string; // "2026-01", "2026-02", etc.
  completedDate?: string;
  dueDate: string;
  submittedToOfsted: boolean;
  submissionDate?: string;
  areasReviewed: string[];
  actionsIdentified: number;
  actionsCompleted: number;
  childrenConsulted: boolean;
  staffConsulted: boolean;
  keyFindings: string[];
}

export interface PolicyRecord {
  id: string;
  policyName: string;
  category: PolicyCategory;
  lastReviewDate: string;
  nextReviewDue: string;
  reviewedBy: string;
  version: string;
  approvedBy: string;
  staffAcknowledged: boolean;
  staffAcknowledgedCount: number;
  totalStaff: number;
}

export interface NotificationRecord {
  id: string;
  date: string;
  notificationType: NotificationType;
  childId?: string;
  recipients: NotificationRecipient[];
  notifiedWithinTimescale: boolean;
  timescaleHours: number;
  actualHours?: number;
  description: string;
  ofstedReference?: string;
}

export interface DevelopmentObjective {
  id: string;
  description: string;
  category: string;
  targetDate: string;
  status: DevelopmentObjectiveStatus;
  completedDate?: string;
  progress: number; // 0–100
  measurableOutcome: string;
  evidence?: string;
  lastReviewedDate: string;
}

export interface StaffMeetingRecord {
  id: string;
  date: string;
  meetingType: MeetingType;
  attendeeCount: number;
  expectedAttendees: number;
  minutesRecorded: boolean;
  actionsAgreed: number;
  actionsCompleted: number;
  keyTopics: string[];
}

export interface ManagementPresence {
  weekCommencing: string;
  rmHoursInHome: number;
  rmTotalHours: number;
  drmHoursInHome: number;
  drmTotalHours: number;
  shiftsCoveredByManagement: number;
  childInteractionEvents: number; // meals eaten with children, activities, etc.
}

// ── Result Types ──────────────────────────────────────────────────────────────

export interface SoPComplianceResult {
  isReviewed: boolean;
  isOverdue: boolean;
  daysSinceReview: number;
  sharedWithOfsted: boolean;
  accuracy: {
    childrenCount: boolean;
    staffDetails: boolean;
    serviceDescription: boolean;
  };
  accuracyRate: number;
  childrenGuide: {
    available: boolean;
    accessibleFormats: number;
    lastUpdated?: string;
  };
}

export interface Reg45ComplianceResult {
  totalExpected: number;
  completed: number;
  completionRate: number;
  submittedToOfsted: number;
  ofstedSubmissionRate: number;
  averageActionsIdentified: number;
  averageActionsCompleted: number;
  actionCompletionRate: number;
  childrenConsultedRate: number;
  staffConsultedRate: number;
  overdueReports: string[];
}

export interface PolicyComplianceResult {
  totalPolicies: number;
  upToDate: number;
  overdue: number;
  complianceRate: number;
  averageStaffAcknowledgementRate: number;
  overdueByCategory: { category: PolicyCategory; count: number }[];
  policiesNearingReview: { policyName: string; nextReviewDue: string }[];
}

export interface NotificationComplianceResult {
  totalNotifications: number;
  withinTimescale: number;
  outsideTimescale: number;
  timelinesRate: number;
  typeBreakdown: { notificationType: NotificationType; count: number }[];
  averageResponseHours: number;
  ofstedNotifications: number;
}

export interface DevelopmentPlanResult {
  totalObjectives: number;
  completed: number;
  inProgress: number;
  overdue: number;
  notStarted: number;
  completionRate: number;
  overdueRate: number;
  averageProgress: number;
  categories: { category: string; count: number; avgProgress: number }[];
}

export interface MeetingComplianceResult {
  totalMeetings: number;
  staffMeetings: number;
  averageAttendanceRate: number;
  minutesRecordedRate: number;
  averageActionsPerMeeting: number;
  actionCompletionRate: number;
  meetingsPerMonth: number;
}

export interface ManagementPresenceResult {
  averageRmHoursInHome: number;
  averageRmPresenceRate: number;
  averageDrmHoursInHome: number;
  averageChildInteractions: number;
  weeksWithLowPresence: number;
  totalWeeksTracked: number;
}

export interface GovernanceIntelligenceResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  sopCompliance: SoPComplianceResult;
  reg45Compliance: Reg45ComplianceResult;
  policyCompliance: PolicyComplianceResult;
  notificationCompliance: NotificationComplianceResult;
  developmentPlan: DevelopmentPlanResult;
  meetingCompliance: MeetingComplianceResult;
  managementPresence: ManagementPresenceResult;
  strengths: string[];
  areasForDevelopment: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Labels ────────────────────────────────────────────────────────────────────

const POLICY_CATEGORY_LABELS: Record<PolicyCategory, string> = {
  safeguarding: "Safeguarding",
  behaviour_management: "Behaviour Management",
  complaints: "Complaints",
  missing_children: "Missing Children",
  medication: "Medication",
  fire_safety: "Fire Safety",
  health_safety: "Health & Safety",
  equality_diversity: "Equality & Diversity",
  whistleblowing: "Whistleblowing",
  data_protection: "Data Protection",
  recruitment: "Recruitment",
  supervision: "Supervision",
  restraint: "Restraint",
  bullying: "Bullying",
  internet_safety: "Internet Safety",
  confidentiality: "Confidentiality",
  admissions: "Admissions",
  contact_arrangements: "Contact Arrangements",
  education: "Education",
};

const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  serious_injury: "Serious Injury",
  death: "Death",
  child_protection: "Child Protection",
  police_involvement: "Police Involvement",
  missing_child: "Missing Child",
  serious_illness: "Serious Illness",
  absconding: "Absconding",
  restraint: "Restraint",
  allegation_against_staff: "Allegation Against Staff",
  serious_complaint: "Serious Complaint",
  fire: "Fire",
  outbreak_infectious_disease: "Infectious Disease Outbreak",
  significant_incident: "Significant Incident",
};

const DEV_OBJECTIVE_STATUS_LABELS: Record<DevelopmentObjectiveStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
  ongoing: "Ongoing",
  overdue: "Overdue",
};

export function getPolicyCategoryLabel(c: PolicyCategory): string {
  return POLICY_CATEGORY_LABELS[c] ?? c.replace(/_/g, " ");
}

export function getNotificationTypeLabel(t: NotificationType): string {
  return NOTIFICATION_TYPE_LABELS[t] ?? t.replace(/_/g, " ");
}

export function getObjectiveStatusLabel(s: DevelopmentObjectiveStatus): string {
  return DEV_OBJECTIVE_STATUS_LABELS[s] ?? s.replace(/_/g, " ");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.floor(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function inPeriod(date: string, start: string, end: string): boolean {
  return date.slice(0, 10) >= start.slice(0, 10) && date.slice(0, 10) <= end.slice(0, 10);
}

// ── Core Functions ────────────────────────────────────────────────────────────

/**
 * Evaluates Statement of Purpose compliance.
 */
export function evaluateSoPCompliance(
  sop: StatementOfPurpose,
  currentDate: string,
): SoPComplianceResult {
  const daysSinceReview = daysBetween(sop.lastReviewDate, currentDate);
  const isOverdue = sop.nextReviewDue < currentDate;
  const isReviewed = daysSinceReview <= 365;

  const accuracyChecks = [
    sop.accurateChildrenCount,
    sop.accurateStaffDetails,
    sop.accurateServiceDescription,
  ];
  const accurateCount = accuracyChecks.filter(Boolean).length;
  const accuracyRate = pct(accurateCount, accuracyChecks.length);

  return {
    isReviewed,
    isOverdue,
    daysSinceReview,
    sharedWithOfsted: sop.sharedWithOfsted,
    accuracy: {
      childrenCount: sop.accurateChildrenCount,
      staffDetails: sop.accurateStaffDetails,
      serviceDescription: sop.accurateServiceDescription,
    },
    accuracyRate,
    childrenGuide: {
      available: sop.childrenGuideAvailable,
      accessibleFormats: sop.childrenGuideAccessibleFormats.length,
      lastUpdated: sop.childrenGuideLastUpdated,
    },
  };
}

/**
 * Evaluates Reg 45 monthly monitoring compliance.
 */
export function evaluateReg45Compliance(
  reports: Reg45Report[],
  periodStart: string,
  periodEnd: string,
): Reg45ComplianceResult {
  // Determine expected months
  const startDate = new Date(periodStart);
  const endDate = new Date(periodEnd);
  const expectedMonths: string[] = [];
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  while (current <= endDate) {
    expectedMonths.push(
      `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`,
    );
    current.setMonth(current.getMonth() + 1);
  }

  const totalExpected = expectedMonths.length;
  const completedReports = reports.filter(
    (r) => r.completedDate && expectedMonths.includes(r.monthCovered),
  );
  const completed = completedReports.length;
  const completionRate = pct(completed, totalExpected);

  const submittedToOfsted = completedReports.filter(
    (r) => r.submittedToOfsted,
  ).length;
  const ofstedSubmissionRate = pct(submittedToOfsted, completed);

  const totalActionsIdentified = completedReports.reduce(
    (sum, r) => sum + r.actionsIdentified,
    0,
  );
  const totalActionsCompleted = completedReports.reduce(
    (sum, r) => sum + r.actionsCompleted,
    0,
  );
  const averageActionsIdentified =
    completed === 0
      ? 0
      : Math.round((totalActionsIdentified / completed) * 10) / 10;
  const averageActionsCompleted =
    completed === 0
      ? 0
      : Math.round((totalActionsCompleted / completed) * 10) / 10;
  const actionCompletionRate = pct(
    totalActionsCompleted,
    totalActionsIdentified,
  );

  const childrenConsulted = completedReports.filter(
    (r) => r.childrenConsulted,
  ).length;
  const childrenConsultedRate = pct(childrenConsulted, completed);
  const staffConsulted = completedReports.filter(
    (r) => r.staffConsulted,
  ).length;
  const staffConsultedRate = pct(staffConsulted, completed);

  // Overdue reports (expected but not completed)
  const completedMonths = new Set(
    completedReports.map((r) => r.monthCovered),
  );
  const overdueReports = expectedMonths.filter(
    (m) => !completedMonths.has(m),
  );

  return {
    totalExpected,
    completed,
    completionRate,
    submittedToOfsted,
    ofstedSubmissionRate,
    averageActionsIdentified,
    averageActionsCompleted,
    actionCompletionRate,
    childrenConsultedRate,
    staffConsultedRate,
    overdueReports,
  };
}

/**
 * Evaluates policy review compliance.
 */
export function evaluatePolicyCompliance(
  policies: PolicyRecord[],
  currentDate: string,
): PolicyComplianceResult {
  const totalPolicies = policies.length;
  const upToDate = policies.filter(
    (p) => p.nextReviewDue >= currentDate,
  ).length;
  const overdue = totalPolicies - upToDate;
  const complianceRate = pct(upToDate, totalPolicies);

  // Average staff acknowledgement rate
  const totalAckRate =
    policies.length === 0
      ? 0
      : policies.reduce(
          (sum, p) =>
            sum + (p.totalStaff === 0 ? 0 : p.staffAcknowledgedCount / p.totalStaff),
          0,
        ) / policies.length;
  const averageStaffAcknowledgementRate = Math.round(totalAckRate * 100);

  // Overdue by category
  const overdueCategoryCounts = new Map<PolicyCategory, number>();
  for (const p of policies.filter((p) => p.nextReviewDue < currentDate)) {
    overdueCategoryCounts.set(
      p.category,
      (overdueCategoryCounts.get(p.category) ?? 0) + 1,
    );
  }
  const overdueByCategory = Array.from(overdueCategoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // Policies nearing review (within 30 days)
  const thirtyDaysFromNow = new Date(currentDate);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const thirtyDaysStr = thirtyDaysFromNow.toISOString().split("T")[0];
  const policiesNearingReview = policies
    .filter(
      (p) =>
        p.nextReviewDue >= currentDate && p.nextReviewDue <= thirtyDaysStr,
    )
    .map((p) => ({ policyName: p.policyName, nextReviewDue: p.nextReviewDue }));

  return {
    totalPolicies,
    upToDate,
    overdue,
    complianceRate,
    averageStaffAcknowledgementRate,
    overdueByCategory,
    policiesNearingReview,
  };
}

/**
 * Evaluates Ofsted/statutory notification timeliness.
 */
export function evaluateNotificationCompliance(
  notifications: NotificationRecord[],
  periodStart: string,
  periodEnd: string,
): NotificationComplianceResult {
  const periodNotifications = notifications.filter((n) =>
    inPeriod(n.date, periodStart, periodEnd),
  );
  const totalNotifications = periodNotifications.length;

  const withinTimescale = periodNotifications.filter(
    (n) => n.notifiedWithinTimescale,
  ).length;
  const outsideTimescale = totalNotifications - withinTimescale;
  const timelinesRate = pct(withinTimescale, totalNotifications);

  // Type breakdown
  const typeCounts = new Map<NotificationType, number>();
  for (const n of periodNotifications) {
    typeCounts.set(
      n.notificationType,
      (typeCounts.get(n.notificationType) ?? 0) + 1,
    );
  }
  const typeBreakdown = Array.from(typeCounts.entries())
    .map(([notificationType, count]) => ({ notificationType, count }))
    .sort((a, b) => b.count - a.count);

  // Average response hours
  const withHours = periodNotifications.filter(
    (n) => n.actualHours !== undefined,
  );
  const totalHours = withHours.reduce(
    (sum, n) => sum + (n.actualHours ?? 0),
    0,
  );
  const averageResponseHours =
    withHours.length === 0
      ? 0
      : Math.round((totalHours / withHours.length) * 10) / 10;

  const ofstedNotifications = periodNotifications.filter((n) =>
    n.recipients.includes("ofsted"),
  ).length;

  return {
    totalNotifications,
    withinTimescale,
    outsideTimescale,
    timelinesRate,
    typeBreakdown,
    averageResponseHours,
    ofstedNotifications,
  };
}

/**
 * Evaluates development plan progress.
 */
export function evaluateDevelopmentPlan(
  objectives: DevelopmentObjective[],
  currentDate: string,
): DevelopmentPlanResult {
  const totalObjectives = objectives.length;

  // Determine actual status (mark overdue if target date passed and not completed)
  const effectiveStatus = objectives.map((o) => {
    if (
      o.status !== "completed" &&
      o.status !== "ongoing" &&
      o.targetDate < currentDate
    ) {
      return "overdue";
    }
    return o.status;
  });

  const completed = effectiveStatus.filter((s) => s === "completed").length;
  const inProgress = effectiveStatus.filter(
    (s) => s === "in_progress" || s === "ongoing",
  ).length;
  const overdue = effectiveStatus.filter((s) => s === "overdue").length;
  const notStarted = effectiveStatus.filter(
    (s) => s === "not_started",
  ).length;
  const completionRate = pct(completed, totalObjectives);
  const overdueRate = pct(overdue, totalObjectives);

  const averageProgress =
    totalObjectives === 0
      ? 0
      : Math.round(
          objectives.reduce((sum, o) => sum + o.progress, 0) /
            totalObjectives,
        );

  // Category breakdown
  const categoryMap = new Map<
    string,
    { count: number; totalProgress: number }
  >();
  for (const o of objectives) {
    const existing = categoryMap.get(o.category) ?? {
      count: 0,
      totalProgress: 0,
    };
    categoryMap.set(o.category, {
      count: existing.count + 1,
      totalProgress: existing.totalProgress + o.progress,
    });
  }
  const categories = Array.from(categoryMap.entries())
    .map(([category, { count, totalProgress }]) => ({
      category,
      count,
      avgProgress: Math.round(totalProgress / count),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalObjectives,
    completed,
    inProgress,
    overdue,
    notStarted,
    completionRate,
    overdueRate,
    averageProgress,
    categories,
  };
}

/**
 * Evaluates staff meeting compliance.
 */
export function evaluateMeetingCompliance(
  meetings: StaffMeetingRecord[],
  periodStart: string,
  periodEnd: string,
): MeetingComplianceResult {
  const periodMeetings = meetings.filter((m) =>
    inPeriod(m.date, periodStart, periodEnd),
  );
  const totalMeetings = periodMeetings.length;
  const staffMeetings = periodMeetings.filter(
    (m) => m.meetingType === "staff_team",
  ).length;

  // Attendance rate
  const totalAttendance = periodMeetings.reduce(
    (sum, m) => sum + (m.expectedAttendees === 0 ? 0 : m.attendeeCount / m.expectedAttendees),
    0,
  );
  const averageAttendanceRate =
    totalMeetings === 0
      ? 0
      : Math.round((totalAttendance / totalMeetings) * 100);

  // Minutes recorded
  const minutesRecorded = periodMeetings.filter(
    (m) => m.minutesRecorded,
  ).length;
  const minutesRecordedRate = pct(minutesRecorded, totalMeetings);

  // Actions
  const totalActions = periodMeetings.reduce(
    (sum, m) => sum + m.actionsAgreed,
    0,
  );
  const completedActions = periodMeetings.reduce(
    (sum, m) => sum + m.actionsCompleted,
    0,
  );
  const averageActionsPerMeeting =
    totalMeetings === 0
      ? 0
      : Math.round((totalActions / totalMeetings) * 10) / 10;
  const actionCompletionRate = pct(completedActions, totalActions);

  // Meetings per month
  const periodDays = daysBetween(periodStart, periodEnd);
  const periodMonths = Math.max(1, periodDays / 30);
  const meetingsPerMonth =
    Math.round((totalMeetings / periodMonths) * 10) / 10;

  return {
    totalMeetings,
    staffMeetings,
    averageAttendanceRate,
    minutesRecordedRate,
    averageActionsPerMeeting,
    actionCompletionRate,
    meetingsPerMonth,
  };
}

/**
 * Evaluates management presence and visibility.
 */
export function evaluateManagementPresence(
  presenceRecords: ManagementPresence[],
): ManagementPresenceResult {
  const totalWeeksTracked = presenceRecords.length;

  if (totalWeeksTracked === 0) {
    return {
      averageRmHoursInHome: 0,
      averageRmPresenceRate: 0,
      averageDrmHoursInHome: 0,
      averageChildInteractions: 0,
      weeksWithLowPresence: 0,
      totalWeeksTracked: 0,
    };
  }

  const totalRmInHome = presenceRecords.reduce(
    (sum, p) => sum + p.rmHoursInHome,
    0,
  );
  const totalRmHours = presenceRecords.reduce(
    (sum, p) => sum + p.rmTotalHours,
    0,
  );
  const totalDrmInHome = presenceRecords.reduce(
    (sum, p) => sum + p.drmHoursInHome,
    0,
  );
  const totalInteractions = presenceRecords.reduce(
    (sum, p) => sum + p.childInteractionEvents,
    0,
  );

  const averageRmHoursInHome =
    Math.round((totalRmInHome / totalWeeksTracked) * 10) / 10;
  const averageRmPresenceRate = pct(totalRmInHome, totalRmHours);
  const averageDrmHoursInHome =
    Math.round((totalDrmInHome / totalWeeksTracked) * 10) / 10;
  const averageChildInteractions =
    Math.round((totalInteractions / totalWeeksTracked) * 10) / 10;

  // Low presence = RM less than 15 hours in home in a week
  const weeksWithLowPresence = presenceRecords.filter(
    (p) => p.rmHoursInHome < 15,
  ).length;

  return {
    averageRmHoursInHome,
    averageRmPresenceRate,
    averageDrmHoursInHome,
    averageChildInteractions,
    weeksWithLowPresence,
    totalWeeksTracked,
  };
}

// ── Main Intelligence Function ────────────────────────────────────────────────

export function generateGovernanceIntelligence(
  sop: StatementOfPurpose,
  reg45Reports: Reg45Report[],
  policies: PolicyRecord[],
  notifications: NotificationRecord[],
  objectives: DevelopmentObjective[],
  meetings: StaffMeetingRecord[],
  presenceRecords: ManagementPresence[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): GovernanceIntelligenceResult {
  const currentDate = periodEnd;

  const sopCompliance = evaluateSoPCompliance(sop, currentDate);
  const reg45Compliance = evaluateReg45Compliance(
    reg45Reports,
    periodStart,
    periodEnd,
  );
  const policyCompliance = evaluatePolicyCompliance(policies, currentDate);
  const notificationCompliance = evaluateNotificationCompliance(
    notifications,
    periodStart,
    periodEnd,
  );
  const developmentPlan = evaluateDevelopmentPlan(objectives, currentDate);
  const meetingCompliance = evaluateMeetingCompliance(
    meetings,
    periodStart,
    periodEnd,
  );
  const managementPresence = evaluateManagementPresence(presenceRecords);

  // ── Scoring ──────────────────────────────────────────────────────────────

  // 1. Statement of Purpose (15)
  let sopScore = 0;
  if (sopCompliance.isReviewed && !sopCompliance.isOverdue) sopScore += 5;
  if (sopCompliance.sharedWithOfsted) sopScore += 3;
  if (sopCompliance.accuracyRate === 100) sopScore += 4;
  else if (sopCompliance.accuracyRate >= 67) sopScore += 2;
  if (sopCompliance.childrenGuide.available) sopScore += 2;
  if (sopCompliance.childrenGuide.accessibleFormats >= 2) sopScore += 1;
  sopScore = Math.min(sopScore, 15);

  // 2. Reg 45 monitoring (20)
  let reg45Score = 0;
  if (reg45Compliance.completionRate === 100) reg45Score += 8;
  else if (reg45Compliance.completionRate >= 80) reg45Score += 5;
  else if (reg45Compliance.completionRate >= 60) reg45Score += 3;

  if (reg45Compliance.ofstedSubmissionRate === 100) reg45Score += 4;
  else if (reg45Compliance.ofstedSubmissionRate >= 80) reg45Score += 2;

  if (reg45Compliance.actionCompletionRate >= 80) reg45Score += 4;
  else if (reg45Compliance.actionCompletionRate >= 60) reg45Score += 2;

  if (reg45Compliance.childrenConsultedRate >= 80) reg45Score += 2;
  if (reg45Compliance.staffConsultedRate >= 80) reg45Score += 2;
  reg45Score = Math.min(reg45Score, 20);

  // 3. Policy compliance (15)
  let policyScore = 0;
  if (policyCompliance.complianceRate === 100) policyScore += 8;
  else if (policyCompliance.complianceRate >= 90) policyScore += 6;
  else if (policyCompliance.complianceRate >= 75) policyScore += 4;
  else if (policyCompliance.complianceRate >= 50) policyScore += 2;

  if (policyCompliance.averageStaffAcknowledgementRate >= 90) policyScore += 5;
  else if (policyCompliance.averageStaffAcknowledgementRate >= 75)
    policyScore += 3;
  else if (policyCompliance.averageStaffAcknowledgementRate >= 50)
    policyScore += 1;

  // Penalty for overdue critical policies
  const criticalCategories: PolicyCategory[] = [
    "safeguarding",
    "medication",
    "fire_safety",
    "missing_children",
  ];
  const criticalOverdue = policyCompliance.overdueByCategory.filter((o) =>
    criticalCategories.includes(o.category),
  ).length;
  if (criticalOverdue > 0) policyScore -= Math.min(criticalOverdue * 2, 5);

  policyScore = Math.max(0, Math.min(policyScore, 15));

  // 4. Development plan (15)
  let devPlanScore = 0;
  if (developmentPlan.completionRate >= 80) devPlanScore += 6;
  else if (developmentPlan.completionRate >= 60) devPlanScore += 4;
  else if (developmentPlan.completionRate >= 40) devPlanScore += 2;

  if (developmentPlan.overdueRate === 0) devPlanScore += 4;
  else if (developmentPlan.overdueRate <= 10) devPlanScore += 2;

  if (developmentPlan.averageProgress >= 70) devPlanScore += 3;
  else if (developmentPlan.averageProgress >= 50) devPlanScore += 2;
  else if (developmentPlan.averageProgress >= 30) devPlanScore += 1;

  if (developmentPlan.categories.length >= 3) devPlanScore += 2;
  devPlanScore = Math.min(devPlanScore, 15);

  // 5. Notifications (10)
  let notificationScore = 10;
  if (notificationCompliance.totalNotifications > 0) {
    if (notificationCompliance.timelinesRate < 100) {
      const missedCount = notificationCompliance.outsideTimescale;
      notificationScore -= Math.min(missedCount * 3, 8);
    }
    if (notificationCompliance.averageResponseHours > 24) {
      notificationScore -= 2;
    }
  }
  notificationScore = Math.max(0, notificationScore);

  // 6. Staff meetings (10)
  let meetingScore = 0;
  if (meetingCompliance.meetingsPerMonth >= 2) meetingScore += 3;
  else if (meetingCompliance.meetingsPerMonth >= 1) meetingScore += 2;

  if (meetingCompliance.averageAttendanceRate >= 80) meetingScore += 3;
  else if (meetingCompliance.averageAttendanceRate >= 60) meetingScore += 2;

  if (meetingCompliance.minutesRecordedRate >= 90) meetingScore += 2;

  if (meetingCompliance.actionCompletionRate >= 80) meetingScore += 2;
  else if (meetingCompliance.actionCompletionRate >= 60) meetingScore += 1;

  meetingScore = Math.min(meetingScore, 10);

  // 7. Management presence (5) + Children's guide (contributed above in SoP)
  let presenceScore = 0;
  if (managementPresence.totalWeeksTracked > 0) {
    if (managementPresence.averageRmPresenceRate >= 60) presenceScore += 3;
    else if (managementPresence.averageRmPresenceRate >= 40) presenceScore += 2;
    else if (managementPresence.averageRmPresenceRate >= 20) presenceScore += 1;

    if (managementPresence.averageChildInteractions >= 5) presenceScore += 2;
    else if (managementPresence.averageChildInteractions >= 3)
      presenceScore += 1;

    if (managementPresence.weeksWithLowPresence > managementPresence.totalWeeksTracked / 2) {
      presenceScore -= 2;
    }
  }
  presenceScore = Math.max(0, Math.min(presenceScore, 5));

  const overallScore = Math.min(
    100,
    Math.max(
      0,
      sopScore +
        reg45Score +
        policyScore +
        devPlanScore +
        notificationScore +
        meetingScore +
        presenceScore,
    ),
  );

  // ── Rating ──────────────────────────────────────────────────────────────
  const rating: GovernanceIntelligenceResult["rating"] =
    overallScore >= 80
      ? "outstanding"
      : overallScore >= 60
        ? "good"
        : overallScore >= 40
          ? "requires_improvement"
          : "inadequate";

  // ── Strengths / Areas / Actions ─────────────────────────────────────────
  const strengths: string[] = [];
  const areasForDevelopment: string[] = [];
  const immediateActions: string[] = [];

  if (sopCompliance.isReviewed && sopCompliance.accuracyRate === 100) {
    strengths.push("Statement of Purpose is current, accurate, and shared with Ofsted");
  }
  if (reg45Compliance.completionRate === 100) {
    strengths.push("All Reg 45 monthly monitoring reports completed on time");
  }
  if (policyCompliance.complianceRate === 100) {
    strengths.push("All policies reviewed and up to date");
  }
  if (
    notificationCompliance.totalNotifications > 0 &&
    notificationCompliance.timelinesRate === 100
  ) {
    strengths.push("All statutory notifications made within required timescales");
  }
  if (developmentPlan.completionRate >= 80) {
    strengths.push(
      `Strong development plan progress — ${developmentPlan.completionRate}% of objectives completed`,
    );
  }
  if (meetingCompliance.averageAttendanceRate >= 85) {
    strengths.push("Excellent staff meeting attendance and engagement");
  }
  if (
    managementPresence.totalWeeksTracked > 0 &&
    managementPresence.averageRmPresenceRate >= 60
  ) {
    strengths.push("Registered Manager maintains strong visible presence in the home");
  }
  if (strengths.length === 0) {
    strengths.push("No significant strengths identified — governance improvement needed");
  }

  // Areas for development
  if (sopCompliance.isOverdue) {
    areasForDevelopment.push("Statement of Purpose review is overdue");
  }
  if (reg45Compliance.overdueReports.length > 0) {
    areasForDevelopment.push(
      `${reg45Compliance.overdueReports.length} Reg 45 report${reg45Compliance.overdueReports.length !== 1 ? "s" : ""} not completed`,
    );
  }
  if (policyCompliance.overdue > 0) {
    areasForDevelopment.push(
      `${policyCompliance.overdue} polic${policyCompliance.overdue !== 1 ? "ies" : "y"} overdue for review`,
    );
  }
  if (developmentPlan.overdue > 0) {
    areasForDevelopment.push(
      `${developmentPlan.overdue} development objective${developmentPlan.overdue !== 1 ? "s" : ""} overdue`,
    );
  }
  if (
    managementPresence.totalWeeksTracked > 0 &&
    managementPresence.weeksWithLowPresence > 0
  ) {
    areasForDevelopment.push(
      `RM had low in-home presence for ${managementPresence.weeksWithLowPresence} of ${managementPresence.totalWeeksTracked} weeks`,
    );
  }
  if (policyCompliance.averageStaffAcknowledgementRate < 80) {
    areasForDevelopment.push(
      `Staff policy acknowledgement rate is ${policyCompliance.averageStaffAcknowledgementRate}% (target: 100%)`,
    );
  }
  if (areasForDevelopment.length === 0) {
    areasForDevelopment.push("No significant areas for development identified");
  }

  // Immediate actions
  if (sopCompliance.isOverdue) {
    immediateActions.push(
      "URGENT: Statement of Purpose review overdue — Reg 16 requirement",
    );
  }
  if (
    notificationCompliance.totalNotifications > 0 &&
    notificationCompliance.timelinesRate < 100
  ) {
    immediateActions.push(
      `URGENT: ${notificationCompliance.outsideTimescale} notification${notificationCompliance.outsideTimescale !== 1 ? "s" : ""} made outside required timescale — Reg 39/40 breach`,
    );
  }
  if (criticalOverdue > 0) {
    immediateActions.push(
      "URGENT: Critical policies (safeguarding, medication, fire safety, missing children) overdue for review",
    );
  }
  if (reg45Compliance.overdueReports.length > 0) {
    immediateActions.push(
      `HIGH: Complete overdue Reg 45 reports for: ${reg45Compliance.overdueReports.join(", ")}`,
    );
  }
  if (developmentPlan.overdue > 0) {
    immediateActions.push(
      `MEDIUM: Review and update ${developmentPlan.overdue} overdue development objective${developmentPlan.overdue !== 1 ? "s" : ""}`,
    );
  }
  if (policyCompliance.policiesNearingReview.length > 0) {
    immediateActions.push(
      `MEDIUM: ${policyCompliance.policiesNearingReview.length} polic${policyCompliance.policiesNearingReview.length !== 1 ? "ies" : "y"} due for review within 30 days`,
    );
  }
  if (immediateActions.length === 0) {
    immediateActions.push(
      "No immediate actions required — governance framework is robust",
    );
  }

  // Regulatory links
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 16 — Statement of Purpose (reviewed annually, accurate, shared)",
    "CHR 2015 Reg 45 — Review of quality of care (monthly monitoring reports)",
    "CHR 2015 Reg 39 — Notification of serious events (within 24 hours)",
    "CHR 2015 Reg 40 — Notification of other events (without delay)",
    "CHR 2015 Sch 1 — Information to be included in Statement of Purpose",
    "SCCIF — Effectiveness of leaders and managers (Judgement Area 3)",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    sopCompliance,
    reg45Compliance,
    policyCompliance,
    notificationCompliance,
    developmentPlan,
    meetingCompliance,
    managementPresence,
    strengths,
    areasForDevelopment,
    immediateActions,
    regulatoryLinks,
  };
}
