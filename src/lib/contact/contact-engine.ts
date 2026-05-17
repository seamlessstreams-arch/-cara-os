// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Contact & Family Time — Intelligence Engine
//
// Deterministic engine for managing contact between looked-after children and
// their birth families/significant others. Tracks scheduling, attendance,
// quality observations, risk assessments, and compliance with care plans.
//
// Aligned to:
//   - CHR 2015 Reg 11(3)(d) — Contact arrangements
//   - CHR 2015 Schedule 7 — Matters to be monitored by RI
//   - Children Act 1989 s.34 — Contact with children in care
//   - Care Planning Regulations 2010 — Contact schedule
//
// Contact requirements for looked-after children:
//   1. Contact plan in place within 5 working days of placement
//   2. Contact frequency aligned to care plan/court order
//   3. Supervised contact must be staffed by trained supervisor
//   4. Quality observations recorded for each session
//   5. Risk assessment reviewed at least 3-monthly
//   6. Child's wishes recorded regarding contact
//   7. Contact log maintained with attendance and outcomes
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type ContactType =
  | "face_to_face"
  | "supervised"
  | "unsupervised"
  | "telephone"
  | "video_call"
  | "letterbox"
  | "indirect";

export type ContactVenue =
  | "contact_centre"
  | "home"
  | "community"
  | "school"
  | "neutral"
  | "other";

export type ContactOutcome =
  | "positive"
  | "mixed"
  | "negative"
  | "neutral"
  | "not_assessed";

export type SessionStatus =
  | "scheduled"
  | "attended"
  | "cancelled_by_family"
  | "cancelled_by_child"
  | "cancelled_by_la"
  | "dna_family"
  | "dna_child"
  | "cut_short";

export type RelationshipType =
  | "birth_mother"
  | "birth_father"
  | "sibling"
  | "grandparent"
  | "aunt_uncle"
  | "other_family"
  | "significant_other"
  | "previous_carer";

export type RiskLevel = "low" | "medium" | "high" | "very_high";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface ContactArrangement {
  id: string;
  childId: string;
  childName: string;
  homeId: string;
  contactPersonName: string;
  relationship: RelationshipType;
  contactType: ContactType;
  venue: ContactVenue;
  frequency: ContactFrequency;
  supervisorRequired: boolean;
  courtOrdered: boolean;
  careplanAgreed: boolean;
  riskLevel: RiskLevel;
  lastRiskAssessmentDate?: string;
  conditions: string[];               // restrictions or conditions
  childWishesRecorded: boolean;
  childWishesDate?: string;
  childWishesSummary?: string;         // brief summary of child's view
  placementStartDate: string;
  contactPlanDate?: string;            // when plan was established
  sessions: ContactSession[];
}

export interface ContactSession {
  id: string;
  scheduledDate: string;
  actualDate?: string;
  duration: number;                    // minutes planned
  actualDuration?: number;             // minutes actual
  status: SessionStatus;
  supervisorName?: string;
  venue: ContactVenue;
  outcome: ContactOutcome;
  childMood: ChildMood;
  observations: string[];
  concerns: string[];
  positives: string[];
  actionRequired: boolean;
  actionNotes?: string;
  recordedBy: string;
  recordedAt: string;
}

export interface ChildMood {
  before: number;                      // 1-5
  during: number;                      // 1-5
  after: number;                       // 1-5
}

export interface ContactFrequency {
  timesPerWeek?: number;
  timesPerMonth?: number;
  timesPerYear?: number;               // for letterbox/indirect
  notes?: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface ContactComplianceResult {
  arrangementId: string;
  childId: string;
  childName: string;
  contactPersonName: string;
  relationship: RelationshipType;
  isCompliant: boolean;
  issues: string[];
  recommendations: string[];
  contactPlanInPlace: boolean;
  contactPlanTimely: boolean;          // within 5 days of placement
  frequencyMet: boolean;
  riskAssessmentCurrent: boolean;
  childWishesCurrent: boolean;
  supervisorCompliant: boolean;
  attendanceRate: number;              // % of sessions attended
  cancellationRate: number;            // % cancelled by family
  averageOutcomeScore: number;         // average outcome quality
  moodTrend: "improving" | "stable" | "declining" | "insufficient_data";
}

export interface HomeContactMetrics {
  homeId: string;
  totalArrangements: number;
  activeArrangements: number;
  overallComplianceRate: number;
  averageAttendanceRate: number;
  averageCancellationRate: number;
  contactPlanRate: number;             // % with plan in place
  riskAssessmentCurrentRate: number;
  childWishesRecordedRate: number;
  upcomingSessions: { childId: string; childName: string; contactPerson: string; date: string }[];
  concerns: { childId: string; childName: string; concern: string }[];
  sessionsThisMonth: number;
  sessionsLastMonth: number;
  outcomeBreakdown: { positive: number; mixed: number; negative: number; neutral: number };
}

// ── Configuration ──────────────────────────────────────────────────────────

const CONTACT_PLAN_DEADLINE_DAYS = 5;         // 5 working days from placement
const RISK_ASSESSMENT_INTERVAL_DAYS = 90;     // 3-monthly review
const CHILD_WISHES_INTERVAL_DAYS = 90;        // 3-monthly review
const FREQUENCY_TOLERANCE = 0.75;             // 75% minimum adherence to frequency
const MIN_SESSIONS_FOR_TREND = 4;             // need 4+ sessions for mood trend

// ── Core: Evaluate Contact Compliance ───────────────────────────────────────

export function evaluateContactCompliance(
  arrangement: ContactArrangement,
  now?: string,
): ContactComplianceResult {
  const currentDate = now ? new Date(now) : new Date();
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Contact plan in place
  const contactPlanInPlace = !!arrangement.contactPlanDate;
  const placementStart = new Date(arrangement.placementStartDate);
  const planDeadline = new Date(placementStart.getTime() + CONTACT_PLAN_DEADLINE_DAYS * 1.5 * 24 * 60 * 60 * 1000); // approx working days
  const contactPlanTimely = contactPlanInPlace && new Date(arrangement.contactPlanDate!) <= planDeadline;

  if (!contactPlanInPlace) {
    const daysSincePlacement = Math.floor(
      (currentDate.getTime() - placementStart.getTime()) / (24 * 60 * 60 * 1000),
    );
    if (daysSincePlacement > CONTACT_PLAN_DEADLINE_DAYS * 1.5) {
      issues.push("Contact plan not established — statutory deadline passed (5 working days).");
      recommendations.push("URGENT: Establish contact plan with social worker and IRO.");
    }
  } else if (!contactPlanTimely) {
    issues.push("Contact plan was established after statutory deadline.");
  }

  // Frequency compliance (last 30 days)
  const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentSessions = arrangement.sessions.filter(
    s => new Date(s.scheduledDate) >= thirtyDaysAgo && new Date(s.scheduledDate) <= currentDate,
  );
  const attendedRecent = recentSessions.filter(
    s => s.status === "attended" || s.status === "cut_short",
  );

  let expectedPerMonth = 0;
  if (arrangement.frequency.timesPerWeek) {
    expectedPerMonth = arrangement.frequency.timesPerWeek * 4.33;
  } else if (arrangement.frequency.timesPerMonth) {
    expectedPerMonth = arrangement.frequency.timesPerMonth;
  } else if (arrangement.frequency.timesPerYear) {
    expectedPerMonth = arrangement.frequency.timesPerYear / 12;
  }

  const frequencyMet = expectedPerMonth === 0 ||
    attendedRecent.length >= expectedPerMonth * FREQUENCY_TOLERANCE;

  if (!frequencyMet && expectedPerMonth > 0) {
    issues.push(
      `Contact frequency not met: ${attendedRecent.length} sessions in last 30 days vs ${Math.ceil(expectedPerMonth)} expected.`,
    );
    recommendations.push("Review contact schedule and barriers to attendance.");
  }

  // Risk assessment currency
  const riskAssessmentCurrent = !!arrangement.lastRiskAssessmentDate &&
    (currentDate.getTime() - new Date(arrangement.lastRiskAssessmentDate).getTime()) <=
      RISK_ASSESSMENT_INTERVAL_DAYS * 24 * 60 * 60 * 1000;

  if (!riskAssessmentCurrent) {
    issues.push("Risk assessment overdue (3-monthly review required).");
    recommendations.push("Schedule contact risk assessment review.");
  }

  // Child wishes current
  const childWishesCurrent = arrangement.childWishesRecorded &&
    !!arrangement.childWishesDate &&
    (currentDate.getTime() - new Date(arrangement.childWishesDate).getTime()) <=
      CHILD_WISHES_INTERVAL_DAYS * 24 * 60 * 60 * 1000;

  if (!childWishesCurrent) {
    issues.push("Child's wishes regarding contact not recorded or overdue for review.");
    recommendations.push("Record child's current views on contact arrangements.");
  }

  // Supervisor compliance (supervised contact must have supervisor)
  const supervisedSessions = arrangement.sessions.filter(
    s => (s.status === "attended" || s.status === "cut_short") && arrangement.supervisorRequired,
  );
  const unsupervisedWhenRequired = supervisedSessions.filter(s => !s.supervisorName);
  const supervisorCompliant = unsupervisedWhenRequired.length === 0;

  if (!supervisorCompliant) {
    issues.push(`${unsupervisedWhenRequired.length} supervised session(s) without named supervisor.`);
    recommendations.push("Ensure trained supervisor is allocated for all supervised contact.");
  }

  // Attendance rate (all time)
  const completedSessions = arrangement.sessions.filter(
    s => s.status !== "scheduled",
  );
  const attendedSessions = completedSessions.filter(
    s => s.status === "attended" || s.status === "cut_short",
  );
  const attendanceRate = completedSessions.length > 0
    ? Math.round((attendedSessions.length / completedSessions.length) * 100)
    : 100;

  // Cancellation rate (by family)
  const familyCancellations = completedSessions.filter(
    s => s.status === "cancelled_by_family" || s.status === "dna_family",
  );
  const cancellationRate = completedSessions.length > 0
    ? Math.round((familyCancellations.length / completedSessions.length) * 100)
    : 0;

  if (cancellationRate > 30) {
    recommendations.push(
      `High family cancellation rate (${cancellationRate}%) — review barriers and support needed.`,
    );
  }

  // Average outcome score
  const outcomeScores: Record<ContactOutcome, number> = {
    positive: 4,
    mixed: 3,
    neutral: 2,
    negative: 1,
    not_assessed: 0,
  };
  const assessedSessions = attendedSessions.filter(s => s.outcome !== "not_assessed");
  const averageOutcomeScore = assessedSessions.length > 0
    ? Math.round(
        (assessedSessions.reduce((sum, s) => sum + outcomeScores[s.outcome], 0) / assessedSessions.length) * 10,
      ) / 10
    : 0;

  if (averageOutcomeScore > 0 && averageOutcomeScore < 2.5) {
    recommendations.push("Contact sessions averaging poor outcomes — consider supervision review with social worker.");
  }

  // Mood trend
  const moodTrend = calculateMoodTrend(attendedSessions);

  if (moodTrend === "declining") {
    recommendations.push("Child's mood declining during contact — discuss with child and review arrangements.");
  }

  // Court ordered compliance
  if (arrangement.courtOrdered && !frequencyMet) {
    issues.push("Court-ordered contact frequency not being met.");
    recommendations.push("URGENT: Court order non-compliance — escalate to social worker.");
  }

  const isCompliant = issues.length === 0;

  return {
    arrangementId: arrangement.id,
    childId: arrangement.childId,
    childName: arrangement.childName,
    contactPersonName: arrangement.contactPersonName,
    relationship: arrangement.relationship,
    isCompliant,
    issues,
    recommendations,
    contactPlanInPlace,
    contactPlanTimely,
    frequencyMet,
    riskAssessmentCurrent,
    childWishesCurrent,
    supervisorCompliant,
    attendanceRate,
    cancellationRate,
    averageOutcomeScore,
    moodTrend,
  };
}

// ── Core: Home Contact Metrics ─────────────────────────────────────────────

export function calculateHomeContactMetrics(
  arrangements: ContactArrangement[],
  homeId: string,
  now?: string,
): HomeContactMetrics {
  const currentDate = now ? new Date(now) : new Date();
  const homeArrangements = arrangements.filter(a => a.homeId === homeId);

  const results = homeArrangements.map(a => evaluateContactCompliance(a, now));

  // Compliance
  const compliantCount = results.filter(r => r.isCompliant).length;
  const overallComplianceRate = homeArrangements.length > 0
    ? Math.round((compliantCount / homeArrangements.length) * 100)
    : 100;

  // Attendance and cancellation
  const averageAttendanceRate = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.attendanceRate, 0) / results.length)
    : 100;
  const averageCancellationRate = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.cancellationRate, 0) / results.length)
    : 0;

  // Contact plan rate
  const withPlan = results.filter(r => r.contactPlanInPlace).length;
  const contactPlanRate = homeArrangements.length > 0
    ? Math.round((withPlan / homeArrangements.length) * 100)
    : 100;

  // Risk assessment rate
  const riskCurrent = results.filter(r => r.riskAssessmentCurrent).length;
  const riskAssessmentCurrentRate = homeArrangements.length > 0
    ? Math.round((riskCurrent / homeArrangements.length) * 100)
    : 100;

  // Child wishes rate
  const wishesCurrent = results.filter(r => r.childWishesCurrent).length;
  const childWishesRecordedRate = homeArrangements.length > 0
    ? Math.round((wishesCurrent / homeArrangements.length) * 100)
    : 100;

  // Upcoming sessions (next 14 days)
  const fourteenDays = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000);
  const upcomingSessions = homeArrangements.flatMap(a =>
    a.sessions
      .filter(s => s.status === "scheduled" && new Date(s.scheduledDate) >= currentDate && new Date(s.scheduledDate) <= fourteenDays)
      .map(s => ({ childId: a.childId, childName: a.childName, contactPerson: a.contactPersonName, date: s.scheduledDate })),
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Concerns
  const concerns: { childId: string; childName: string; concern: string }[] = [];
  for (const result of results) {
    for (const issue of result.issues) {
      concerns.push({ childId: result.childId, childName: result.childName, concern: issue });
    }
  }

  // Sessions this month / last month
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const startOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const allSessions = homeArrangements.flatMap(a => a.sessions);

  const sessionsThisMonth = allSessions.filter(s => {
    const d = new Date(s.scheduledDate);
    return d >= startOfMonth && d <= currentDate && (s.status === "attended" || s.status === "cut_short");
  }).length;

  const sessionsLastMonth = allSessions.filter(s => {
    const d = new Date(s.scheduledDate);
    return d >= startOfLastMonth && d < startOfMonth && (s.status === "attended" || s.status === "cut_short");
  }).length;

  // Outcome breakdown
  const attendedAll = allSessions.filter(s => s.status === "attended" || s.status === "cut_short");
  const outcomeBreakdown = {
    positive: attendedAll.filter(s => s.outcome === "positive").length,
    mixed: attendedAll.filter(s => s.outcome === "mixed").length,
    negative: attendedAll.filter(s => s.outcome === "negative").length,
    neutral: attendedAll.filter(s => s.outcome === "neutral" || s.outcome === "not_assessed").length,
  };

  return {
    homeId,
    totalArrangements: homeArrangements.length,
    activeArrangements: homeArrangements.length,
    overallComplianceRate,
    averageAttendanceRate,
    averageCancellationRate,
    contactPlanRate,
    riskAssessmentCurrentRate,
    childWishesRecordedRate,
    upcomingSessions,
    concerns,
    sessionsThisMonth,
    sessionsLastMonth,
    outcomeBreakdown,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────

function calculateMoodTrend(
  sessions: ContactSession[],
): "improving" | "stable" | "declining" | "insufficient_data" {
  if (sessions.length < MIN_SESSIONS_FOR_TREND) return "insufficient_data";

  const sorted = [...sessions].sort(
    (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime(),
  );
  const mid = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, mid);
  const secondHalf = sorted.slice(mid);

  const avgMood = (list: ContactSession[]) =>
    list.reduce((s, sess) => s + sess.childMood.after, 0) / list.length;

  const firstAvg = avgMood(firstHalf);
  const secondAvg = avgMood(secondHalf);
  const diff = secondAvg - firstAvg;

  if (diff > 0.5) return "improving";
  if (diff < -0.5) return "declining";
  return "stable";
}

export function getRelationshipLabel(rel: RelationshipType): string {
  const labels: Record<RelationshipType, string> = {
    birth_mother: "Birth Mother",
    birth_father: "Birth Father",
    sibling: "Sibling",
    grandparent: "Grandparent",
    aunt_uncle: "Aunt/Uncle",
    other_family: "Other Family Member",
    significant_other: "Significant Other",
    previous_carer: "Previous Carer",
  };
  return labels[rel];
}

export function getContactTypeLabel(type: ContactType): string {
  const labels: Record<ContactType, string> = {
    face_to_face: "Face to Face",
    supervised: "Supervised",
    unsupervised: "Unsupervised",
    telephone: "Telephone",
    video_call: "Video Call",
    letterbox: "Letterbox",
    indirect: "Indirect",
  };
  return labels[type];
}

export function getSessionStatusLabel(status: SessionStatus): string {
  const labels: Record<SessionStatus, string> = {
    scheduled: "Scheduled",
    attended: "Attended",
    cancelled_by_family: "Cancelled by Family",
    cancelled_by_child: "Cancelled by Child",
    cancelled_by_la: "Cancelled by LA",
    dna_family: "DNA (Family)",
    dna_child: "DNA (Child)",
    cut_short: "Cut Short",
  };
  return labels[status];
}
