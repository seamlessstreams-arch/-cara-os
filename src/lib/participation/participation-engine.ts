// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Children's Participation & Advocacy Engine
//
// Deterministic engine for tracking children's voice, participation in
// decisions, advocacy access, house meetings, complaints awareness,
// and Article 12 UNCRC compliance.
//
// Aligned to:
//   - CHR 2015 Reg 7 — Children's wishes and feelings
//   - CHR 2015 Reg 16 — Statement of purpose (child-centred)
//   - UNCRC Article 12 — Right to be heard
//   - SCCIF — Overall experiences: voice of the child
//   - Children Act 1989 s.20 & s.22 — Ascertain wishes/feelings
//   - Advocacy Services and Representations Procedure Regs 2004
//
// Key requirements:
//   - Children consulted on decisions affecting them
//   - Regular house meetings with recorded actions
//   - Independent advocacy access explained and available
//   - Children's views recorded in care plans / reviews
//   - Complaints process explained and accessible
//   - Feedback mechanisms in place (suggestion box, surveys)
//   - Key decisions evidence child's voice
//   - Children involved in matching for new admissions
//   - Children know their rights and how to raise concerns
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type ParticipationMethod =
  | "verbal"
  | "written"
  | "picture"
  | "advocate"
  | "keyworker"
  | "survey"
  | "house_meeting"
  | "review_meeting"
  | "informal";

export type DecisionArea =
  | "care_plan"
  | "placement"
  | "education"
  | "health"
  | "contact"
  | "daily_routine"
  | "activities"
  | "room_decoration"
  | "food_menu"
  | "house_rules"
  | "complaints"
  | "matching_new_child";

export type MeetingType =
  | "house_meeting"
  | "children_committee"
  | "review_meeting"
  | "key_work_session"
  | "feedback_session";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface ChildParticipationProfile {
  childId: string;
  childName: string;
  homeId: string;
  advocateOffered: boolean;
  advocateAccepted: boolean;
  advocateName?: string;
  advocateLastVisit?: string;
  complaintsProcessExplained: boolean;
  complaintsProcessDate?: string;
  rightsExplained: boolean;
  rightsExplainedDate?: string;
  childrenGuideGiven: boolean;
  preferredCommunicationMethod?: ParticipationMethod;
  participationEntries: ParticipationEntry[];
}

export interface ParticipationEntry {
  id: string;
  date: string;
  decisionArea: DecisionArea;
  method: ParticipationMethod;
  childViews: string;
  viewsActedUpon: boolean;
  outcome?: string;
  reasonIfNotActedUpon?: string;
  recordedBy: string;
}

export interface HouseMeeting {
  id: string;
  homeId: string;
  date: string;
  type: MeetingType;
  attendees: string[];
  childAttendees: string[];
  totalChildrenInHome: number;
  agendaItems: string[];
  childSuggestedItems: string[];
  actionsAgreed: { action: string; assignedTo: string; dueDate: string; completed: boolean }[];
  minutesRecorded: boolean;
  chairPerson: string;
  followUpFromPrevious: boolean;
}

export interface FeedbackRecord {
  id: string;
  homeId: string;
  childId?: string;
  date: string;
  type: "suggestion" | "compliment" | "concern" | "survey_response";
  content: string;
  acknowledged: boolean;
  actionTaken?: string;
  anonymous: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface ChildParticipationResult {
  childId: string;
  childName: string;
  isCompliant: boolean;
  issues: string[];
  warnings: string[];
  advocacyAccessible: boolean;
  complaintsAware: boolean;
  rightsExplained: boolean;
  participationScore: number;        // 0-100
  totalEntries: number;
  entriesLast30Days: number;
  viewsActedUponRate: number;        // %
  decisionsInvolved: DecisionArea[];
  areasNotCovered: DecisionArea[];
}

export interface HomeParticipationMetrics {
  homeId: string;
  childCount: number;
  overallParticipationScore: number;
  advocacyAccessRate: number;        // % offered and explained
  complaintsAwarenessRate: number;
  rightsExplainedRate: number;
  houseMeetingFrequency: number;     // meetings per month (last 3 months)
  houseMeetingAttendanceRate: number;
  actionCompletionRate: number;      // % of meeting actions completed
  childSuggestedItemsRate: number;   // % meetings with child-suggested items
  viewsActedUponRate: number;
  feedbackCount30Days: number;
  feedbackAcknowledgedRate: number;
  childrenWithIssues: { childName: string; issues: string[] }[];
  complianceIssues: string[];
}

// ── Configuration ──────────────────────────────────────────────────────────

const HOUSE_MEETING_TARGET_PER_MONTH = 2;    // at least fortnightly
const ADVOCATE_VISIT_MAX_DAYS = 90;           // advocate should visit quarterly
const MINIMUM_DECISION_AREAS = 4;             // child should be involved in at least 4 areas
const VIEWS_ACTED_UPON_TARGET = 70;           // at least 70% of views should be acted on

const KEY_DECISION_AREAS: DecisionArea[] = [
  "care_plan",
  "education",
  "health",
  "contact",
  "daily_routine",
  "activities",
];

// ── Core: Evaluate Child Participation ─────────────────────────────────────

export function evaluateChildParticipation(
  profile: ChildParticipationProfile,
  now?: string,
): ChildParticipationResult {
  const currentTime = now ? new Date(now).getTime() : Date.now();
  const thirtyDaysAgo = currentTime - 30 * 24 * 60 * 60 * 1000;
  const issues: string[] = [];
  const warnings: string[] = [];

  // Advocacy
  const advocacyAccessible = profile.advocateOffered;
  if (!advocacyAccessible) {
    issues.push("Independent advocacy not offered to child");
  }
  if (profile.advocateAccepted && profile.advocateLastVisit) {
    const daysSinceVisit = (currentTime - new Date(profile.advocateLastVisit).getTime()) / (24 * 60 * 60 * 1000);
    if (daysSinceVisit > ADVOCATE_VISIT_MAX_DAYS) {
      warnings.push(`Advocate not visited in ${Math.round(daysSinceVisit)} days`);
    }
  }

  // Complaints awareness
  if (!profile.complaintsProcessExplained) {
    issues.push("Complaints process not explained to child");
  }

  // Rights
  if (!profile.rightsExplained) {
    issues.push("Children's rights not explained to child");
  }

  // Children's guide
  if (!profile.childrenGuideGiven) {
    warnings.push("Children's guide not provided");
  }

  // Participation entries
  const recentEntries = profile.participationEntries.filter(e =>
    new Date(e.date).getTime() > thirtyDaysAgo
  );

  if (recentEntries.length === 0 && profile.participationEntries.length === 0) {
    issues.push("No recorded participation — child's voice not evidenced");
  } else if (recentEntries.length === 0) {
    warnings.push("No participation recorded in last 30 days");
  }

  // Views acted upon
  const withAction = profile.participationEntries.filter(e => e.viewsActedUpon);
  const viewsActedUponRate = profile.participationEntries.length > 0
    ? Math.round((withAction.length / profile.participationEntries.length) * 100)
    : 0;

  if (profile.participationEntries.length >= 3 && viewsActedUponRate < VIEWS_ACTED_UPON_TARGET) {
    warnings.push(`Low views-acted-upon rate (${viewsActedUponRate}%) — review if child feels heard`);
  }

  // Decision areas covered
  const areasInvolved = [...new Set(profile.participationEntries.map(e => e.decisionArea))];
  const areasNotCovered = KEY_DECISION_AREAS.filter(a => !areasInvolved.includes(a));

  if (areasNotCovered.length > KEY_DECISION_AREAS.length - MINIMUM_DECISION_AREAS) {
    warnings.push(`Child not consulted in key areas: ${areasNotCovered.slice(0, 3).join(", ")}`);
  }

  // Participation score
  const scoringFactors = [
    profile.advocateOffered ? 15 : 0,
    profile.complaintsProcessExplained ? 15 : 0,
    profile.rightsExplained ? 10 : 0,
    profile.childrenGuideGiven ? 5 : 0,
    recentEntries.length >= 3 ? 20 : recentEntries.length >= 1 ? 10 : 0,
    viewsActedUponRate >= 70 ? 15 : viewsActedUponRate >= 50 ? 8 : 0,
    areasInvolved.length >= 4 ? 15 : areasInvolved.length >= 2 ? 8 : 0,
    profile.preferredCommunicationMethod ? 5 : 0,
  ];
  const participationScore = scoringFactors.reduce((a, b) => a + b, 0);

  return {
    childId: profile.childId,
    childName: profile.childName,
    isCompliant: issues.length === 0,
    issues,
    warnings,
    advocacyAccessible,
    complaintsAware: profile.complaintsProcessExplained,
    rightsExplained: profile.rightsExplained,
    participationScore,
    totalEntries: profile.participationEntries.length,
    entriesLast30Days: recentEntries.length,
    viewsActedUponRate,
    decisionsInvolved: areasInvolved,
    areasNotCovered,
  };
}

// ── Core: Calculate Home Participation Metrics ─────────────────────────────

export function calculateHomeParticipationMetrics(
  profiles: ChildParticipationProfile[],
  meetings: HouseMeeting[],
  feedback: FeedbackRecord[],
  homeId: string,
  now?: string,
): HomeParticipationMetrics {
  const currentTime = now ? new Date(now).getTime() : Date.now();
  const thirtyDaysAgo = currentTime - 30 * 24 * 60 * 60 * 1000;
  const ninetyDaysAgo = currentTime - 90 * 24 * 60 * 60 * 1000;

  const homeProfiles = profiles.filter(p => p.homeId === homeId);
  const homeMeetings = meetings.filter(m => m.homeId === homeId);
  const homeFeedback = feedback.filter(f => f.homeId === homeId);

  const results = homeProfiles.map(p => evaluateChildParticipation(p, now));
  const childCount = homeProfiles.length;

  // Participation score
  const overallParticipationScore = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.participationScore, 0) / results.length)
    : 0;

  // Advocacy
  const advocacyOffered = homeProfiles.filter(p => p.advocateOffered).length;
  const advocacyAccessRate = childCount > 0
    ? Math.round((advocacyOffered / childCount) * 100)
    : 100;

  // Complaints awareness
  const complaintsAware = homeProfiles.filter(p => p.complaintsProcessExplained).length;
  const complaintsAwarenessRate = childCount > 0
    ? Math.round((complaintsAware / childCount) * 100)
    : 100;

  // Rights explained
  const rightsExplained = homeProfiles.filter(p => p.rightsExplained).length;
  const rightsExplainedRate = childCount > 0
    ? Math.round((rightsExplained / childCount) * 100)
    : 100;

  // House meetings (last 3 months)
  const recentMeetings = homeMeetings.filter(m =>
    m.type === "house_meeting" && new Date(m.date).getTime() > ninetyDaysAgo
  );
  const houseMeetingFrequency = recentMeetings.length > 0
    ? Math.round((recentMeetings.length / 3) * 10) / 10
    : 0;

  // Meeting attendance
  const totalAttendance = recentMeetings.reduce((s, m) => s + m.childAttendees.length, 0);
  const totalPossible = recentMeetings.reduce((s, m) => s + m.totalChildrenInHome, 0);
  const houseMeetingAttendanceRate = totalPossible > 0
    ? Math.round((totalAttendance / totalPossible) * 100)
    : 0;

  // Action completion
  const allActions = recentMeetings.flatMap(m => m.actionsAgreed);
  const completedActions = allActions.filter(a => a.completed);
  const actionCompletionRate = allActions.length > 0
    ? Math.round((completedActions.length / allActions.length) * 100)
    : 100;

  // Child-suggested items
  const meetingsWithChildItems = recentMeetings.filter(m => m.childSuggestedItems.length > 0);
  const childSuggestedItemsRate = recentMeetings.length > 0
    ? Math.round((meetingsWithChildItems.length / recentMeetings.length) * 100)
    : 0;

  // Views acted upon
  const allEntries = homeProfiles.flatMap(p => p.participationEntries);
  const allActedUpon = allEntries.filter(e => e.viewsActedUpon);
  const viewsActedUponRate = allEntries.length > 0
    ? Math.round((allActedUpon.length / allEntries.length) * 100)
    : 0;

  // Feedback
  const recentFeedback = homeFeedback.filter(f => new Date(f.date).getTime() > thirtyDaysAgo);
  const acknowledgedFeedback = recentFeedback.filter(f => f.acknowledged);
  const feedbackAcknowledgedRate = recentFeedback.length > 0
    ? Math.round((acknowledgedFeedback.length / recentFeedback.length) * 100)
    : 100;

  // Children with issues
  const childrenWithIssues = results
    .filter(r => r.issues.length > 0)
    .map(r => ({ childName: r.childName, issues: r.issues }));

  const complianceIssues = [...new Set(results.flatMap(r => r.issues))];

  return {
    homeId,
    childCount,
    overallParticipationScore,
    advocacyAccessRate,
    complaintsAwarenessRate,
    rightsExplainedRate,
    houseMeetingFrequency,
    houseMeetingAttendanceRate,
    actionCompletionRate,
    childSuggestedItemsRate,
    viewsActedUponRate,
    feedbackCount30Days: recentFeedback.length,
    feedbackAcknowledgedRate,
    childrenWithIssues,
    complianceIssues,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────

export function getDecisionAreaLabel(area: DecisionArea): string {
  const labels: Record<DecisionArea, string> = {
    care_plan: "Care Plan",
    placement: "Placement",
    education: "Education",
    health: "Health",
    contact: "Contact",
    daily_routine: "Daily Routine",
    activities: "Activities",
    room_decoration: "Room & Space",
    food_menu: "Food & Menus",
    house_rules: "House Rules",
    complaints: "Complaints",
    matching_new_child: "New Admissions",
  };
  return labels[area] ?? area;
}

export function getParticipationMethodLabel(method: ParticipationMethod): string {
  const labels: Record<ParticipationMethod, string> = {
    verbal: "Verbal",
    written: "Written",
    picture: "Picture/Drawing",
    advocate: "Via Advocate",
    keyworker: "Via Keyworker",
    survey: "Survey",
    house_meeting: "House Meeting",
    review_meeting: "Review Meeting",
    informal: "Informal Chat",
  };
  return labels[method] ?? method;
}
