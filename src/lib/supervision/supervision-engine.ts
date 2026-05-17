// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Staff Supervision — Intelligence Engine
//
// Deterministic engine for managing supervision schedules, compliance
// tracking, reflective practice documentation, and staff development.
//
// Aligned to:
//   - CHR 2015 Reg 33 — Employment of staff (supervision requirement)
//   - CHR 2015 Guide Ch.8 — Staff support, development and supervision
//   - Ofsted SCCIF — "Staff receive regular, high-quality supervision"
//   - Skills for Care — Effective supervision framework
//
// Supervision requirements:
//   1. Formal supervision minimum every 6 weeks (42 days max gap)
//   2. Must cover: caseload, wellbeing, development, safeguarding
//   3. Actions must be tracked and reviewed
//   4. Reflective practice component mandatory
//   5. New starters: weekly for first month, fortnightly for 3 months
//   6. Annual appraisal linked to supervision cycle
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type SupervisionType =
  | "formal"              // scheduled 1:1 supervision
  | "reflective"         // reflective practice session
  | "adhoc"              // unscheduled (responsive to incident/need)
  | "group"              // team supervision / group reflection
  | "management"         // management oversight (TL with RM)
  | "clinical"           // with external clinician
  | "probation";         // during probation period

export type SupervisionTopic =
  | "caseload_review"     // children allocated, keyworker responsibilities
  | "safeguarding"        // concerns, referrals, updates
  | "staff_wellbeing"     // emotional impact, burnout, personal issues
  | "professional_development" // training, qualifications, career
  | "practice_reflection" // critical incidents, what worked/didn't
  | "policy_compliance"   // recording, timelines, procedures
  | "team_dynamics"       // relationships with colleagues
  | "children_progress"   // individual child updates
  | "risk_management"     // risk assessments, safety plans
  | "organisational";     // home updates, inspections, changes

export type ActionStatus = "open" | "in_progress" | "completed" | "overdue" | "cancelled";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface SupervisionRecord {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  supervisorId: string;
  supervisorName: string;
  homeId: string;

  // Session details
  type: SupervisionType;
  date: string;
  durationMinutes: number;
  location: string;

  // Content
  topicsCovered: SupervisionTopic[];
  keyDiscussionPoints: string[];
  staffWellbeingRating: 1 | 2 | 3 | 4 | 5;   // 1=struggling, 5=thriving
  reflectivePracticeIncluded: boolean;
  safeguardingDiscussed: boolean;

  // Actions
  actions: SupervisionAction[];
  previousActionsReviewed: boolean;

  // Signatures
  staffAgreed: boolean;
  staffAgreedAt?: string;
  supervisorSignedAt: string;
}

export interface SupervisionAction {
  id: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  status: ActionStatus;
  completedAt?: string;
  notes?: string;
}

export interface StaffSupervisionProfile {
  staffId: string;
  staffName: string;
  staffRole: string;
  homeId: string;
  startDate: string;
  isInProbation: boolean;
  supervisorId: string;
  supervisorName: string;
  supervisionHistory: SupervisionRecord[];
  nextScheduledDate?: string;
  annualAppraisalDue?: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface SupervisionComplianceResult {
  staffId: string;
  staffName: string;
  isCompliant: boolean;
  issues: string[];
  lastSupervisionDate: string | null;
  daysSinceLastSupervision: number | null;
  isOverdue: boolean;
  supervisionsInPeriod: number;       // last 6 months
  frequencyMet: boolean;
  reflectivePracticeRate: number;     // %
  safeguardingDiscussionRate: number; // %
  actionsOverdue: number;
  wellbeingTrend: "improving" | "stable" | "declining";
  appraisalDue: boolean;
}

export interface TeamSupervisionMetrics {
  homeId: string;
  staffCount: number;
  complianceRate: number;              // %
  overdueCount: number;
  averageDaysSinceLast: number;
  averageWellbeing: number;            // 1-5
  totalOpenActions: number;
  totalOverdueActions: number;
  reflectivePracticeRate: number;      // % of sessions with RP
  safeguardingDiscussionRate: number;  // %
  staffAtRisk: { staffId: string; staffName: string; issue: string }[];
  upcomingDue: { staffId: string; staffName: string; dueBy: string }[];
}

// ── Configuration ──────────────────────────────────────────────────────────

const MAX_SUPERVISION_GAP_DAYS = 42;         // 6 weeks
const PROBATION_GAP_DAYS_WEEKLY = 7;         // first month
const PROBATION_GAP_DAYS_FORTNIGHTLY = 14;   // months 2-3
const APPRAISAL_INTERVAL_DAYS = 365;
const MINIMUM_SESSIONS_6_MONTHS = 8;         // ~every 6 weeks for 6 months

// ── Core: Evaluate Staff Supervision Compliance ──────────────────────────

export function evaluateSupervisionCompliance(
  profile: StaffSupervisionProfile,
  now?: string,
): SupervisionComplianceResult {
  const currentDate = now ? new Date(now) : new Date();
  const issues: string[] = [];

  // Sort history
  const sorted = [...profile.supervisionHistory]
    .filter(s => s.type === "formal" || s.type === "probation" || s.type === "management")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const lastSupervision = sorted[0] ?? null;
  const lastSupervisionDate = lastSupervision?.date ?? null;
  const daysSinceLastSupervision = lastSupervisionDate
    ? Math.floor((currentDate.getTime() - new Date(lastSupervisionDate).getTime()) / (24 * 60 * 60 * 1000))
    : null;

  // Overdue check
  const maxGap = profile.isInProbation ? PROBATION_GAP_DAYS_FORTNIGHTLY : MAX_SUPERVISION_GAP_DAYS;
  const isOverdue = daysSinceLastSupervision !== null
    ? daysSinceLastSupervision > maxGap
    : true; // never supervised = overdue

  if (isOverdue) {
    if (daysSinceLastSupervision === null) {
      issues.push("No supervision record found — immediate supervision required.");
    } else {
      issues.push(`Supervision overdue: ${daysSinceLastSupervision} days since last (max: ${maxGap}).`);
    }
  }

  // Frequency in last 6 months
  const sixMonthsAgo = new Date(currentDate.getTime() - 180 * 24 * 60 * 60 * 1000);
  const recentSessions = profile.supervisionHistory.filter(s =>
    new Date(s.date) >= sixMonthsAgo && (s.type === "formal" || s.type === "probation" || s.type === "management"),
  );
  const supervisionsInPeriod = recentSessions.length;
  const frequencyMet = supervisionsInPeriod >= MINIMUM_SESSIONS_6_MONTHS;
  if (!frequencyMet && supervisionsInPeriod > 0) {
    issues.push(`Only ${supervisionsInPeriod} formal supervisions in last 6 months (minimum: ${MINIMUM_SESSIONS_6_MONTHS}).`);
  }

  // Reflective practice rate
  const allRecent = profile.supervisionHistory.filter(s => new Date(s.date) >= sixMonthsAgo);
  const withRP = allRecent.filter(s => s.reflectivePracticeIncluded);
  const reflectivePracticeRate = allRecent.length > 0
    ? Math.round((withRP.length / allRecent.length) * 100)
    : 0;
  if (reflectivePracticeRate < 50) {
    issues.push(`Reflective practice included in only ${reflectivePracticeRate}% of sessions (target: 50%+).`);
  }

  // Safeguarding discussion rate
  const withSafeguarding = allRecent.filter(s => s.safeguardingDiscussed);
  const safeguardingDiscussionRate = allRecent.length > 0
    ? Math.round((withSafeguarding.length / allRecent.length) * 100)
    : 0;
  if (safeguardingDiscussionRate < 75) {
    issues.push(`Safeguarding discussed in only ${safeguardingDiscussionRate}% of sessions (target: 75%+).`);
  }

  // Overdue actions
  const allActions = profile.supervisionHistory.flatMap(s => s.actions);
  const actionsOverdue = allActions.filter(a =>
    a.status === "overdue" || (a.status === "open" && new Date(a.dueDate) < currentDate),
  ).length;
  if (actionsOverdue > 0) {
    issues.push(`${actionsOverdue} supervision action(s) overdue.`);
  }

  // Wellbeing trend
  const recentWellbeing = allRecent
    .filter(s => s.staffWellbeingRating)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(s => s.staffWellbeingRating);
  let wellbeingTrend: SupervisionComplianceResult["wellbeingTrend"] = "stable";
  if (recentWellbeing.length >= 3) {
    const mid = Math.floor(recentWellbeing.length / 2);
    const firstHalf = recentWellbeing.slice(0, mid);
    const secondHalf = recentWellbeing.slice(mid);
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    if (secondAvg - firstAvg >= 0.5) wellbeingTrend = "improving";
    else if (firstAvg - secondAvg >= 0.5) wellbeingTrend = "declining";
  }

  if (wellbeingTrend === "declining") {
    issues.push("Staff wellbeing showing declining trend — discuss in next supervision.");
  }

  // Appraisal
  const appraisalDue = profile.annualAppraisalDue
    ? new Date(profile.annualAppraisalDue) <= currentDate
    : false;
  if (appraisalDue) {
    issues.push("Annual appraisal overdue.");
  }

  return {
    staffId: profile.staffId,
    staffName: profile.staffName,
    isCompliant: issues.length === 0,
    issues,
    lastSupervisionDate,
    daysSinceLastSupervision,
    isOverdue,
    supervisionsInPeriod,
    frequencyMet,
    reflectivePracticeRate,
    safeguardingDiscussionRate,
    actionsOverdue,
    wellbeingTrend,
    appraisalDue,
  };
}

// ── Core: Team Supervision Metrics ───────────────────────────────────────

export function calculateTeamMetrics(
  profiles: StaffSupervisionProfile[],
  homeId: string,
  now?: string,
): TeamSupervisionMetrics {
  const currentDate = now ? new Date(now) : new Date();

  const homeProfiles = profiles.filter(p => p.homeId === homeId);
  const results = homeProfiles.map(p => evaluateSupervisionCompliance(p, now));

  // Compliance
  const compliantCount = results.filter(r => r.isCompliant).length;
  const complianceRate = homeProfiles.length > 0
    ? Math.round((compliantCount / homeProfiles.length) * 100)
    : 100;

  const overdueCount = results.filter(r => r.isOverdue).length;

  // Average days since last
  const daysValues = results
    .map(r => r.daysSinceLastSupervision)
    .filter((d): d is number => d !== null);
  const averageDaysSinceLast = daysValues.length > 0
    ? Math.round(daysValues.reduce((a, b) => a + b, 0) / daysValues.length)
    : 0;

  // Average wellbeing
  const sixMonthsAgo = new Date(currentDate.getTime() - 180 * 24 * 60 * 60 * 1000);
  const recentSessions = homeProfiles.flatMap(p =>
    p.supervisionHistory.filter(s => new Date(s.date) >= sixMonthsAgo),
  );
  const wellbeingRatings = recentSessions
    .map(s => s.staffWellbeingRating)
    .filter(Boolean);
  const averageWellbeing = wellbeingRatings.length > 0
    ? Math.round((wellbeingRatings.reduce((a, b) => a + b, 0) / wellbeingRatings.length) * 10) / 10
    : 3;

  // Actions
  const allActions = homeProfiles.flatMap(p =>
    p.supervisionHistory.flatMap(s => s.actions),
  );
  const totalOpenActions = allActions.filter(a => a.status === "open" || a.status === "in_progress").length;
  const totalOverdueActions = allActions.filter(a =>
    a.status === "overdue" || (a.status === "open" && new Date(a.dueDate) < currentDate),
  ).length;

  // Rates
  const reflectivePracticeRate = recentSessions.length > 0
    ? Math.round((recentSessions.filter(s => s.reflectivePracticeIncluded).length / recentSessions.length) * 100)
    : 0;
  const safeguardingDiscussionRate = recentSessions.length > 0
    ? Math.round((recentSessions.filter(s => s.safeguardingDiscussed).length / recentSessions.length) * 100)
    : 0;

  // Staff at risk (declining wellbeing or overdue)
  const staffAtRisk = results
    .filter(r => r.wellbeingTrend === "declining" || r.isOverdue)
    .map(r => ({
      staffId: r.staffId,
      staffName: r.staffName,
      issue: r.wellbeingTrend === "declining" ? "Declining wellbeing" : "Supervision overdue",
    }));

  // Upcoming due (next 14 days)
  const fourteenDaysFromNow = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000);
  const upcomingDue = homeProfiles
    .filter(p => p.nextScheduledDate && new Date(p.nextScheduledDate) <= fourteenDaysFromNow)
    .map(p => ({
      staffId: p.staffId,
      staffName: p.staffName,
      dueBy: p.nextScheduledDate!,
    }));

  return {
    homeId,
    staffCount: homeProfiles.length,
    complianceRate,
    overdueCount,
    averageDaysSinceLast,
    averageWellbeing,
    totalOpenActions,
    totalOverdueActions,
    reflectivePracticeRate,
    safeguardingDiscussionRate,
    staffAtRisk,
    upcomingDue,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────

export function getSupervisionTypeLabel(type: SupervisionType): string {
  const labels: Record<SupervisionType, string> = {
    formal: "Formal 1:1 Supervision",
    reflective: "Reflective Practice",
    adhoc: "Ad-Hoc / Responsive",
    group: "Group Supervision",
    management: "Management Supervision",
    clinical: "Clinical Supervision",
    probation: "Probation Supervision",
  };
  return labels[type];
}

export function getTopicLabel(topic: SupervisionTopic): string {
  const labels: Record<SupervisionTopic, string> = {
    caseload_review: "Caseload Review",
    safeguarding: "Safeguarding",
    staff_wellbeing: "Staff Wellbeing",
    professional_development: "Professional Development",
    practice_reflection: "Practice Reflection",
    policy_compliance: "Policy & Compliance",
    team_dynamics: "Team Dynamics",
    children_progress: "Children's Progress",
    risk_management: "Risk Management",
    organisational: "Organisational",
  };
  return labels[topic];
}
