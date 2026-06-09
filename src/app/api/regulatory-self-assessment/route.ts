// ══════════════════════════════════════════════════════════════════════════════
// Regulatory Self-Assessment Intelligence — API Route
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  analyseSelfAssessment,
  getCriticalActions,
  getOverdueActions,
  getUnaddressedFeedback,
} from "@/lib/regulatory-self-assessment/regulatory-self-assessment-engine";
import type {
  SelfAssessmentEntry,
  ImprovementAction,
  ExternalFeedback,
} from "@/lib/regulatory-self-assessment/regulatory-self-assessment-engine";

// ── Demo Data — Chamberlain House ────────────────────────────────────────────────────

const DEMO_ENTRIES: SelfAssessmentEntry[] = [
  {
    id: "sa-oak-01",
    homeId: "oak-house",
    regulationArea: "quality_of_care",
    assessmentDate: "2026-04-01T10:00:00Z",
    assessedBy: "Sarah Johnson",
    complianceLevel: "fully_compliant",
    evidenceSources: ["policy", "procedure", "audit_report", "child_feedback", "staff_feedback"],
    evidenceNotes: "Comprehensive review of all care standards. Children confirm positive care experience.",
    strengthsIdentified: [
      "Children report feeling safe and cared for",
      "Care plans are personalised and reviewed regularly",
    ],
    gapsIdentified: [],
    actionsPlan: [],
  },
  {
    id: "sa-oak-02",
    homeId: "oak-house",
    regulationArea: "children_views",
    assessmentDate: "2026-04-01T10:00:00Z",
    assessedBy: "Sarah Johnson",
    complianceLevel: "fully_compliant",
    evidenceSources: ["child_feedback", "meeting_minutes", "staff_feedback"],
    evidenceNotes: "Children's voices captured through regular house meetings and key-work sessions.",
    strengthsIdentified: ["Active house meetings with clear record of children's input"],
    gapsIdentified: [],
    actionsPlan: [],
  },
  {
    id: "sa-oak-03",
    homeId: "oak-house",
    regulationArea: "education",
    assessmentDate: "2026-04-02T09:00:00Z",
    assessedBy: "Tom Richards",
    complianceLevel: "mostly_compliant",
    evidenceSources: ["audit_report", "external_review"],
    evidenceNotes: "PEPs are mostly current but one child's PEP is overdue for review.",
    strengthsIdentified: ["School attendance has improved across the home"],
    gapsIdentified: ["One PEP overdue for review"],
    actionsPlan: ["Chase virtual school head for PEP review date"],
  },
  {
    id: "sa-oak-04",
    homeId: "oak-house",
    regulationArea: "health",
    assessmentDate: "2026-04-02T09:00:00Z",
    assessedBy: "Tom Richards",
    complianceLevel: "mostly_compliant",
    evidenceSources: ["procedure", "incident_data", "training_record"],
    evidenceNotes: "Health plans in place. Medication administration mostly consistent.",
    strengthsIdentified: ["All children registered with GP and dentist"],
    gapsIdentified: ["Two late medication administrations in past month"],
    actionsPlan: ["Implement medication double-check at shift handover"],
  },
  {
    id: "sa-oak-05",
    homeId: "oak-house",
    regulationArea: "positive_relationships",
    assessmentDate: "2026-04-03T11:00:00Z",
    assessedBy: "Sarah Johnson",
    complianceLevel: "fully_compliant",
    evidenceSources: ["child_feedback", "staff_feedback", "external_review"],
    evidenceNotes: "Strong relationship between staff and young people evidenced by feedback.",
    strengthsIdentified: ["Children describe positive relationships with key workers"],
    gapsIdentified: [],
    actionsPlan: [],
  },
  {
    id: "sa-oak-06",
    homeId: "oak-house",
    regulationArea: "protection",
    assessmentDate: "2026-04-03T11:00:00Z",
    assessedBy: "Sarah Johnson",
    complianceLevel: "mostly_compliant",
    evidenceSources: ["policy", "training_record", "incident_data", "audit_report"],
    evidenceNotes: "Safeguarding procedures robust. One near-miss identified and managed.",
    strengthsIdentified: ["Staff safeguarding training at 100%"],
    gapsIdentified: ["Contextual safeguarding mapping needs refreshing"],
    actionsPlan: ["Update contextual safeguarding assessment for local area"],
  },
  {
    id: "sa-oak-07",
    homeId: "oak-house",
    regulationArea: "behaviour_management",
    assessmentDate: "2026-04-04T10:00:00Z",
    assessedBy: "Lisa Williams",
    complianceLevel: "partially_compliant",
    evidenceSources: ["incident_data", "staff_feedback"],
    evidenceNotes: "Some inconsistency in application of behaviour support plans.",
    strengthsIdentified: ["Reduced restraint incidents compared to last quarter"],
    gapsIdentified: [
      "Behaviour support plans not consistently followed by all staff",
      "Debriefing after incidents not always documented",
    ],
    actionsPlan: [
      "Deliver refresher training on behaviour support plans to all staff",
      "Implement mandatory post-incident debrief documentation",
    ],
  },
  {
    id: "sa-oak-08",
    homeId: "oak-house",
    regulationArea: "leadership",
    assessmentDate: "2026-04-04T10:00:00Z",
    assessedBy: "Sarah Johnson",
    complianceLevel: "fully_compliant",
    evidenceSources: ["audit_report", "meeting_minutes", "staff_feedback", "external_review"],
    evidenceNotes: "RM provides strong leadership. Regular supervision and team meetings in place.",
    strengthsIdentified: [
      "Clear management structure with regular supervision",
      "Staff feel supported by management team",
    ],
    gapsIdentified: [],
    actionsPlan: [],
  },
  {
    id: "sa-oak-09",
    homeId: "oak-house",
    regulationArea: "staffing",
    assessmentDate: "2026-04-05T09:00:00Z",
    assessedBy: "Sarah Johnson",
    complianceLevel: "mostly_compliant",
    evidenceSources: ["training_record", "audit_report", "staff_feedback"],
    evidenceNotes: "Staffing levels adequate. One vacancy being recruited. Agency usage low.",
    strengthsIdentified: ["Low agency staff usage", "Good staff retention"],
    gapsIdentified: ["One senior RSW vacancy unfilled for 6 weeks"],
    actionsPlan: ["Expedite recruitment for senior RSW role"],
  },
  {
    id: "sa-oak-10",
    homeId: "oak-house",
    regulationArea: "premises",
    assessmentDate: "2026-04-05T09:00:00Z",
    assessedBy: "Tom Richards",
    complianceLevel: "fully_compliant",
    evidenceSources: ["audit_report", "inspection_report"],
    evidenceNotes: "Premises well-maintained. Recent fire safety inspection passed.",
    strengthsIdentified: ["Fire safety inspection passed with no actions"],
    gapsIdentified: [],
    actionsPlan: [],
  },
  {
    id: "sa-oak-11",
    homeId: "oak-house",
    regulationArea: "complaints",
    assessmentDate: "2026-04-06T10:00:00Z",
    assessedBy: "Tom Richards",
    complianceLevel: "mostly_compliant",
    evidenceSources: ["procedure", "child_feedback", "audit_report"],
    evidenceNotes: "Complaints handled well overall. One complaint response slightly late.",
    strengthsIdentified: ["Children know how to complain and feel heard"],
    gapsIdentified: ["One complaint response exceeded target timescale by 2 days"],
    actionsPlan: ["Review complaint response tracking to prevent overruns"],
  },
  {
    id: "sa-oak-12",
    homeId: "oak-house",
    regulationArea: "records",
    assessmentDate: "2026-04-06T10:00:00Z",
    assessedBy: "Lisa Williams",
    complianceLevel: "partially_compliant",
    evidenceSources: ["audit_report"],
    evidenceNotes: "Some records incomplete. Daily logs sometimes lack detail.",
    strengthsIdentified: [],
    gapsIdentified: [
      "Daily logs inconsistent in quality across staff members",
      "Two children's files missing updated placement plans",
    ],
    actionsPlan: [
      "Run record-keeping workshop for all staff",
      "Complete missing placement plan updates within 2 weeks",
    ],
  },
];

const DEMO_ACTIONS: ImprovementAction[] = [
  {
    id: "act-oak-01",
    homeId: "oak-house",
    regulationArea: "education",
    action: "Chase virtual school head for PEP review date",
    responsible: "Tom Richards",
    priority: "high",
    dueDate: "2026-05-15",
    status: "completed",
    completedDate: "2026-05-10",
  },
  {
    id: "act-oak-02",
    homeId: "oak-house",
    regulationArea: "health",
    action: "Implement medication double-check at shift handover",
    responsible: "Sarah Johnson",
    priority: "high",
    dueDate: "2026-05-01",
    status: "completed",
    completedDate: "2026-04-28",
  },
  {
    id: "act-oak-03",
    homeId: "oak-house",
    regulationArea: "protection",
    action: "Update contextual safeguarding assessment for local area",
    responsible: "Lisa Williams",
    priority: "medium",
    dueDate: "2026-06-01",
    status: "in_progress",
    completedDate: "",
  },
  {
    id: "act-oak-04",
    homeId: "oak-house",
    regulationArea: "behaviour_management",
    action: "Deliver refresher training on behaviour support plans to all staff",
    responsible: "Sarah Johnson",
    priority: "critical",
    dueDate: "2026-05-20",
    status: "in_progress",
    completedDate: "",
  },
  {
    id: "act-oak-05",
    homeId: "oak-house",
    regulationArea: "behaviour_management",
    action: "Implement mandatory post-incident debrief documentation",
    responsible: "Tom Richards",
    priority: "high",
    dueDate: "2026-04-30",
    status: "overdue",
    completedDate: "",
  },
  {
    id: "act-oak-06",
    homeId: "oak-house",
    regulationArea: "staffing",
    action: "Expedite recruitment for senior RSW role",
    responsible: "Sarah Johnson",
    priority: "high",
    dueDate: "2026-06-15",
    status: "in_progress",
    completedDate: "",
  },
  {
    id: "act-oak-07",
    homeId: "oak-house",
    regulationArea: "complaints",
    action: "Review complaint response tracking to prevent overruns",
    responsible: "Tom Richards",
    priority: "medium",
    dueDate: "2026-05-10",
    status: "completed",
    completedDate: "2026-05-08",
  },
  {
    id: "act-oak-08",
    homeId: "oak-house",
    regulationArea: "records",
    action: "Run record-keeping workshop for all staff",
    responsible: "Sarah Johnson",
    priority: "high",
    dueDate: "2026-05-25",
    status: "not_started",
    completedDate: "",
  },
  {
    id: "act-oak-09",
    homeId: "oak-house",
    regulationArea: "records",
    action: "Complete missing placement plan updates within 2 weeks",
    responsible: "Tom Richards",
    priority: "critical",
    dueDate: "2026-05-01",
    status: "overdue",
    completedDate: "",
  },
];

const DEMO_FEEDBACK: ExternalFeedback[] = [
  {
    id: "fb-oak-01",
    homeId: "oak-house",
    source: "reg44",
    date: "2026-04-15",
    regulationArea: "quality_of_care",
    feedback: "Good overall standards observed. Children appear happy and settled.",
    actionRequired: false,
    addressed: false,
  },
  {
    id: "fb-oak-02",
    homeId: "oak-house",
    source: "reg44",
    date: "2026-04-15",
    regulationArea: "records",
    feedback: "Daily logs reviewed — some lack sufficient detail for accountability purposes.",
    actionRequired: true,
    addressed: false,
  },
  {
    id: "fb-oak-03",
    homeId: "oak-house",
    source: "ofsted",
    date: "2026-03-20",
    regulationArea: "behaviour_management",
    feedback: "Ensure all staff consistently follow behaviour support plans.",
    actionRequired: true,
    addressed: false,
  },
  {
    id: "fb-oak-04",
    homeId: "oak-house",
    source: "local_authority",
    date: "2026-04-10",
    regulationArea: "education",
    feedback: "Virtual school head pleased with improved attendance figures.",
    actionRequired: false,
    addressed: false,
  },
  {
    id: "fb-oak-05",
    homeId: "oak-house",
    source: "parent",
    date: "2026-04-08",
    regulationArea: "positive_relationships",
    feedback: "Parent commended key worker for excellent communication about their child.",
    actionRequired: false,
    addressed: false,
  },
  {
    id: "fb-oak-06",
    homeId: "oak-house",
    source: "child",
    date: "2026-04-12",
    regulationArea: "children_views",
    feedback: "Alex said house meetings are useful and staff listen to what young people say.",
    actionRequired: false,
    addressed: false,
  },
  {
    id: "fb-oak-07",
    homeId: "oak-house",
    source: "irp",
    date: "2026-04-05",
    regulationArea: "staffing",
    feedback: "Panel noted the ongoing vacancy and its potential impact on continuity of care.",
    actionRequired: true,
    addressed: true,
  },
  {
    id: "fb-oak-08",
    homeId: "oak-house",
    source: "staff",
    date: "2026-04-14",
    regulationArea: "leadership",
    feedback: "Staff survey indicates high satisfaction with management support and supervision.",
    actionRequired: false,
    addressed: false,
  },
];

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  const homeId = "oak-house";

  const analysis = analyseSelfAssessment(
    DEMO_ENTRIES,
    DEMO_ACTIONS,
    DEMO_FEEDBACK,
    homeId,
  );

  const criticalActions = getCriticalActions(DEMO_ACTIONS, homeId);
  const overdueActions = getOverdueActions(DEMO_ACTIONS, homeId);
  const unaddressedFeedback = getUnaddressedFeedback(DEMO_FEEDBACK, homeId);

  return NextResponse.json({
    analysis,
    criticalActions,
    overdueActions,
    unaddressedFeedback,
  });
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { entries, actions, feedback, homeId } = body;

  if (!entries || !homeId) {
    return NextResponse.json(
      { error: "Missing required fields: entries, homeId" },
      { status: 400 },
    );
  }

  if (!Array.isArray(entries)) {
    return NextResponse.json(
      { error: "entries must be an array" },
      { status: 400 },
    );
  }

  if (typeof homeId !== "string" || homeId.length === 0) {
    return NextResponse.json(
      { error: "homeId must be a non-empty string" },
      { status: 400 },
    );
  }

  if (actions && !Array.isArray(actions)) {
    return NextResponse.json(
      { error: "actions must be an array" },
      { status: 400 },
    );
  }

  if (feedback && !Array.isArray(feedback)) {
    return NextResponse.json(
      { error: "feedback must be an array" },
      { status: 400 },
    );
  }

  const analysis = analyseSelfAssessment(
    entries as SelfAssessmentEntry[],
    (actions ?? []) as ImprovementAction[],
    (feedback ?? []) as ExternalFeedback[],
    homeId,
  );

  const criticalActionsList = getCriticalActions(
    (actions ?? []) as ImprovementAction[],
    homeId,
  );
  const overdueActionsList = getOverdueActions(
    (actions ?? []) as ImprovementAction[],
    homeId,
  );
  const unaddressedFeedbackList = getUnaddressedFeedback(
    (feedback ?? []) as ExternalFeedback[],
    homeId,
  );

  return NextResponse.json({
    analysis,
    criticalActions: criticalActionsList,
    overdueActions: overdueActionsList,
    unaddressedFeedback: unaddressedFeedbackList,
  });
}
