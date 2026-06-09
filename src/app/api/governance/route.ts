// ══════════════════════════════════════════════════════════════════════════════
// API: /api/governance
//
// Governance & Leadership Intelligence
//
// GET  — Returns governance assessment with realistic Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateGovernanceIntelligence,
  getPolicyCategoryLabel,
  getNotificationTypeLabel,
} from "@/lib/governance";
import type {
  StatementOfPurpose,
  Reg45Report,
  PolicyRecord,
  NotificationRecord,
  DevelopmentObjective,
  StaffMeetingRecord,
  ManagementPresence,
} from "@/lib/governance";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

const DEMO_SOP: StatementOfPurpose = {
  lastReviewDate: "2026-01-10",
  nextReviewDue: "2027-01-10",
  sharedWithOfsted: true,
  lastSharedDate: "2026-01-15",
  accurateChildrenCount: true,
  accurateStaffDetails: true,
  accurateServiceDescription: true,
  childrenGuideAvailable: true,
  childrenGuideLastUpdated: "2026-01-10",
  childrenGuideAccessibleFormats: ["printed", "easy_read", "audio"],
};

const DEMO_REG45_REPORTS: Reg45Report[] = [
  {
    id: "r45-jan",
    monthCovered: "2026-01",
    completedDate: "2026-02-10",
    dueDate: "2026-02-15",
    submittedToOfsted: true,
    submissionDate: "2026-02-12",
    areasReviewed: ["safeguarding", "health", "education", "environment"],
    actionsIdentified: 4,
    actionsCompleted: 4,
    childrenConsulted: true,
    staffConsulted: true,
    keyFindings: ["Strong safeguarding culture embedded", "PEP meeting follow-up timely", "Environment well-maintained"],
  },
  {
    id: "r45-feb",
    monthCovered: "2026-02",
    completedDate: "2026-03-12",
    dueDate: "2026-03-15",
    submittedToOfsted: true,
    submissionDate: "2026-03-14",
    areasReviewed: ["behaviour", "activities", "contact", "staffing"],
    actionsIdentified: 3,
    actionsCompleted: 3,
    childrenConsulted: true,
    staffConsulted: true,
    keyFindings: ["Positive behaviour trends continuing", "Activity provision diverse and child-led", "Family contact well managed"],
  },
  {
    id: "r45-mar",
    monthCovered: "2026-03",
    completedDate: "2026-04-08",
    dueDate: "2026-04-15",
    submittedToOfsted: true,
    submissionDate: "2026-04-10",
    areasReviewed: ["supervision", "training", "workforce", "therapeutics"],
    actionsIdentified: 5,
    actionsCompleted: 4,
    childrenConsulted: true,
    staffConsulted: true,
    keyFindings: ["Supervision compliance improving — 95%", "One training gap identified for agency staff", "PACE model consistently applied"],
  },
  {
    id: "r45-apr",
    monthCovered: "2026-04",
    completedDate: "2026-05-10",
    dueDate: "2026-05-15",
    submittedToOfsted: true,
    submissionDate: "2026-05-12",
    areasReviewed: ["independence", "leaving_care", "health_safety", "privacy"],
    actionsIdentified: 3,
    actionsCompleted: 2,
    childrenConsulted: true,
    staffConsulted: false,
    keyFindings: ["Morgan's independence plan progressing well", "Health & safety checks current", "Privacy audit shows good practice"],
  },
  {
    id: "r45-may",
    monthCovered: "2026-05",
    dueDate: "2026-06-15",
    submittedToOfsted: false,
    areasReviewed: [],
    actionsIdentified: 0,
    actionsCompleted: 0,
    childrenConsulted: false,
    staffConsulted: false,
    keyFindings: [],
  },
];

const DEMO_POLICIES: PolicyRecord[] = [
  { id: "pol-1", policyName: "Safeguarding & Child Protection", category: "safeguarding", lastReviewDate: "2026-01-15", nextReviewDue: "2027-01-15", reviewedBy: "Darren Laville", version: "4.2", approvedBy: "RI Board", staffAcknowledged: true, staffAcknowledgedCount: 4, totalStaff: 4 },
  { id: "pol-2", policyName: "Behaviour Management & De-escalation", category: "behaviour_management", lastReviewDate: "2025-11-01", nextReviewDue: "2026-11-01", reviewedBy: "Darren Laville", version: "3.1", approvedBy: "RI Board", staffAcknowledged: true, staffAcknowledgedCount: 4, totalStaff: 4 },
  { id: "pol-3", policyName: "Missing Children Protocol", category: "missing_children", lastReviewDate: "2025-09-01", nextReviewDue: "2026-09-01", reviewedBy: "Darren Laville", version: "2.5", approvedBy: "RI Board", staffAcknowledged: true, staffAcknowledgedCount: 3, totalStaff: 4 },
  { id: "pol-4", policyName: "Complaints Procedure", category: "complaints", lastReviewDate: "2026-02-01", nextReviewDue: "2027-02-01", reviewedBy: "Darren Laville", version: "2.0", approvedBy: "RI Board", staffAcknowledged: true, staffAcknowledgedCount: 4, totalStaff: 4 },
  { id: "pol-5", policyName: "Fire Safety & Emergency Procedures", category: "fire_safety", lastReviewDate: "2025-12-01", nextReviewDue: "2026-12-01", reviewedBy: "Darren Laville", version: "3.0", approvedBy: "RI Board", staffAcknowledged: true, staffAcknowledgedCount: 4, totalStaff: 4 },
  { id: "pol-6", policyName: "Medication Management", category: "medication", lastReviewDate: "2026-01-20", nextReviewDue: "2027-01-20", reviewedBy: "Darren Laville", version: "2.3", approvedBy: "RI Board", staffAcknowledged: true, staffAcknowledgedCount: 4, totalStaff: 4 },
  { id: "pol-7", policyName: "Equality, Diversity & Inclusion", category: "equality_diversity", lastReviewDate: "2025-10-15", nextReviewDue: "2026-10-15", reviewedBy: "Darren Laville", version: "2.1", approvedBy: "RI Board", staffAcknowledged: true, staffAcknowledgedCount: 4, totalStaff: 4 },
  { id: "pol-8", policyName: "Whistleblowing & Escalation", category: "whistleblowing", lastReviewDate: "2025-11-15", nextReviewDue: "2026-11-15", reviewedBy: "Darren Laville", version: "1.4", approvedBy: "RI Board", staffAcknowledged: true, staffAcknowledgedCount: 4, totalStaff: 4 },
  { id: "pol-9", policyName: "Data Protection & GDPR", category: "data_protection", lastReviewDate: "2026-03-01", nextReviewDue: "2027-03-01", reviewedBy: "Darren Laville", version: "3.0", approvedBy: "RI Board", staffAcknowledged: true, staffAcknowledgedCount: 4, totalStaff: 4 },
  { id: "pol-10", policyName: "Physical Intervention & Restraint", category: "restraint", lastReviewDate: "2026-02-15", nextReviewDue: "2027-02-15", reviewedBy: "Darren Laville", version: "2.8", approvedBy: "RI Board", staffAcknowledged: true, staffAcknowledgedCount: 4, totalStaff: 4 },
];

const DEMO_NOTIFICATIONS: NotificationRecord[] = [
  { id: "not-1", date: "2026-02-10", notificationType: "missing_child", childId: "child-morgan", recipients: ["ofsted", "placing_authority", "police"], notifiedWithinTimescale: true, timescaleHours: 24, actualHours: 2, description: "Morgan absent from home without permission — located at shopping centre after 3 hours, returned safely", ofstedReference: "SC-2026-0234" },
  { id: "not-2", date: "2026-03-15", notificationType: "restraint", childId: "child-alex", recipients: ["ofsted", "placing_authority", "parent_carer"], notifiedWithinTimescale: true, timescaleHours: 24, actualHours: 4, description: "Physical intervention (brief hold) — Alex escalated following contact session; de-escalation attempted first; hold lasted 45 seconds" },
  { id: "not-3", date: "2026-04-20", notificationType: "allegation_against_staff", recipients: ["ofsted", "placing_authority", "lado"], notifiedWithinTimescale: true, timescaleHours: 24, actualHours: 3, description: "Allegation of inappropriate restraint by agency worker — LADO referral made same day" },
];

const DEMO_OBJECTIVES: DevelopmentObjective[] = [
  { id: "obj-1", description: "Implement structured therapeutic key-work programme aligned to PACE model", category: "quality_of_care", targetDate: "2026-06-01", status: "completed", completedDate: "2026-04-15", progress: 100, measurableOutcome: "All children have weekly key-work sessions using PACE framework", evidence: "Key-work calendars show 100% compliance; session quality audited monthly", lastReviewedDate: "2026-04-20" },
  { id: "obj-2", description: "Achieve Outstanding rating across all safeguarding KPIs", category: "safeguarding", targetDate: "2026-09-01", status: "in_progress", progress: 70, measurableOutcome: "All safeguarding metrics at outstanding threshold for 3 consecutive months", lastReviewedDate: "2026-05-01" },
  { id: "obj-3", description: "Complete therapeutic parenting Level 3 training for all permanent staff", category: "workforce", targetDate: "2026-03-31", status: "completed", completedDate: "2026-03-20", progress: 100, measurableOutcome: "All permanent staff hold Level 3 therapeutic parenting certificate", evidence: "Training records updated; certificates on file for all 4 staff", lastReviewedDate: "2026-04-01" },
  { id: "obj-4", description: "Improve family contact quality metrics above 80% for all children", category: "quality_of_care", targetDate: "2026-07-01", status: "in_progress", progress: 55, measurableOutcome: "Contact quality score above 80% for all children every month", lastReviewedDate: "2026-05-10" },
  { id: "obj-5", description: "Establish children's council with elected representatives and charter", category: "participation", targetDate: "2026-04-01", status: "completed", completedDate: "2026-03-25", progress: 100, measurableOutcome: "Monthly children's council meetings with documented outcomes influencing practice", evidence: "3 meetings held; children's council charter signed by all; menu changes implemented", lastReviewedDate: "2026-04-15" },
  { id: "obj-6", description: "Reduce use of physical intervention by 30% through enhanced de-escalation", category: "safeguarding", targetDate: "2026-12-31", status: "in_progress", progress: 40, measurableOutcome: "Physical intervention rate reduced from baseline by 30%", lastReviewedDate: "2026-05-05" },
];

const DEMO_MEETINGS: StaffMeetingRecord[] = [
  { id: "mtg-1", date: "2026-01-15", meetingType: "staff_team", attendeeCount: 4, expectedAttendees: 4, minutesRecorded: true, actionsAgreed: 5, actionsCompleted: 5, keyTopics: ["New year planning", "Training schedule 2026", "Safeguarding refresher", "Reg 44 feedback"] },
  { id: "mtg-2", date: "2026-02-12", meetingType: "staff_team", attendeeCount: 3, expectedAttendees: 4, minutesRecorded: true, actionsAgreed: 4, actionsCompleted: 3, keyTopics: ["Reg 44 February feedback", "Activity planning", "Key-work review", "Missing protocol update"] },
  { id: "mtg-3", date: "2026-03-05", meetingType: "management", attendeeCount: 2, expectedAttendees: 2, minutesRecorded: true, actionsAgreed: 3, actionsCompleted: 3, keyTopics: ["Budget Q1 review", "Ofsted preparation plan", "Staff wellbeing check", "Development plan review"] },
  { id: "mtg-4", date: "2026-03-19", meetingType: "staff_team", attendeeCount: 4, expectedAttendees: 4, minutesRecorded: true, actionsAgreed: 6, actionsCompleted: 5, keyTopics: ["Therapeutic model embedding", "Incident analysis Q1", "Training feedback", "Ramadan preparation"] },
  { id: "mtg-5", date: "2026-04-16", meetingType: "staff_team", attendeeCount: 4, expectedAttendees: 4, minutesRecorded: true, actionsAgreed: 4, actionsCompleted: 4, keyTopics: ["Peer dynamics update", "Missing protocol review", "Summer activities", "Eid celebration planning"] },
  { id: "mtg-6", date: "2026-05-07", meetingType: "children_meeting", attendeeCount: 3, expectedAttendees: 3, minutesRecorded: true, actionsAgreed: 3, actionsCompleted: 2, keyTopics: ["Menu choices", "Activity requests", "House rules feedback", "Garden improvements"] },
  { id: "mtg-7", date: "2026-05-14", meetingType: "staff_team", attendeeCount: 3, expectedAttendees: 4, minutesRecorded: true, actionsAgreed: 5, actionsCompleted: 3, keyTopics: ["Quality audit outcomes", "Supervision catch-up", "Forthcoming transitions", "Agency worker review"] },
];

const DEMO_PRESENCE: ManagementPresence[] = [
  { weekCommencing: "2026-04-07", rmHoursInHome: 28, rmTotalHours: 40, drmHoursInHome: 20, drmTotalHours: 40, shiftsCoveredByManagement: 1, childInteractionEvents: 6 },
  { weekCommencing: "2026-04-14", rmHoursInHome: 25, rmTotalHours: 40, drmHoursInHome: 22, drmTotalHours: 40, shiftsCoveredByManagement: 0, childInteractionEvents: 5 },
  { weekCommencing: "2026-04-21", rmHoursInHome: 30, rmTotalHours: 40, drmHoursInHome: 18, drmTotalHours: 40, shiftsCoveredByManagement: 2, childInteractionEvents: 7 },
  { weekCommencing: "2026-04-28", rmHoursInHome: 22, rmTotalHours: 40, drmHoursInHome: 24, drmTotalHours: 40, shiftsCoveredByManagement: 0, childInteractionEvents: 5 },
  { weekCommencing: "2026-05-05", rmHoursInHome: 26, rmTotalHours: 40, drmHoursInHome: 20, drmTotalHours: 40, shiftsCoveredByManagement: 1, childInteractionEvents: 6 },
  { weekCommencing: "2026-05-12", rmHoursInHome: 24, rmTotalHours: 40, drmHoursInHome: 22, drmTotalHours: 40, shiftsCoveredByManagement: 0, childInteractionEvents: 5 },
];

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateGovernanceIntelligence(
    DEMO_SOP,
    DEMO_REG45_REPORTS,
    DEMO_POLICIES,
    DEMO_NOTIFICATIONS,
    DEMO_OBJECTIVES,
    DEMO_MEETINGS,
    DEMO_PRESENCE,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  // Enrich notification type breakdown with labels
  const enrichedNotificationTypes = result.notificationCompliance.typeBreakdown.map((t) => ({
    ...t,
    notificationTypeLabel: getNotificationTypeLabel(t.notificationType),
  }));

  // Enrich overdue policies with category labels
  const enrichedOverdueCategories = result.policyCompliance.overdueByCategory.map((o) => ({
    ...o,
    categoryLabel: getPolicyCategoryLabel(o.category),
  }));

  return NextResponse.json({
    data: {
      ...result,
      notificationCompliance: {
        ...result.notificationCompliance,
        typeBreakdown: enrichedNotificationTypes,
      },
      policyCompliance: {
        ...result.policyCompliance,
        overdueByCategory: enrichedOverdueCategories,
      },
    },
  });
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    sop,
    reg45Reports,
    policies,
    notifications,
    objectives,
    meetings,
    presenceRecords,
    homeId,
    periodStart,
    periodEnd,
  } = body as {
    sop?: StatementOfPurpose;
    reg45Reports?: Reg45Report[];
    policies?: PolicyRecord[];
    notifications?: NotificationRecord[];
    objectives?: DevelopmentObjective[];
    meetings?: StaffMeetingRecord[];
    presenceRecords?: ManagementPresence[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!sop) {
    return NextResponse.json({ error: "sop object is required" }, { status: 400 });
  }
  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateGovernanceIntelligence(
    sop,
    reg45Reports ?? [],
    policies ?? [],
    notifications ?? [],
    objectives ?? [],
    meetings ?? [],
    presenceRecords ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
