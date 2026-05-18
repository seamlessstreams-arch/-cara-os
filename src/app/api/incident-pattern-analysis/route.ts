// ══════════════════════════════════════════════════════════════════════════════
// API: /api/incident-pattern-analysis
//
// Incident Pattern Analysis Intelligence
//
// GET  — Returns Oak House demo data with Alex, Jordan, Morgan
// POST — Accepts custom data and returns tailored analysis
//
// CHR 2015 Reg 12 — Protection of children standard (behaviour management)
// CHR 2015 Reg 40 — Notification of serious events
// SCCIF — Safety and wellbeing of children
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateIncidentPatternAnalysisIntelligence,
  getIncidentCategoryLabel,
  getIncidentSeverityLabel,
  getResponseQualityLabel,
  getNotificationStatusLabel,
  getDeEscalationOutcomeLabel,
  getPostIncidentActionLabel,
  getRatingLabel,
} from "@/lib/incident-pattern-analysis";
import type {
  IncidentRecord,
  IncidentTrend,
  StaffResponse,
  PatternIndicator,
} from "@/lib/incident-pattern-analysis";

// ── Demo Data ─────────────────────────────────────────────────────────────

const DEMO_INCIDENTS: IncidentRecord[] = [
  // Alex: 1 minor incident — verbal aggression, good response, child debriefed
  {
    id: "inc-alex-001",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-05-10",
    time: "16:00",
    category: "verbal_aggression",
    severity: "minor",
    description: "Verbal outburst during homework time — raised voice and refused to engage. Settled within 10 minutes with staff support.",
    staffPresent: ["Sarah Johnson"],
    responseQuality: "appropriate",
    deEscalationAttempted: true,
    deEscalationOutcome: "successful",
    restraintUsed: false,
    restraintDurationMinutes: null,
    injuryOccurred: false,
    injuryDetails: null,
    notificationStatus: "timely_and_complete",
    postIncidentActions: ["debrief_completed", "support_plan_updated"],
    childDebriefed: true,
    lessonsIdentified: true,
    managersInformed: true,
  },
  // Jordan: 3 incidents — 2 physical aggression moderate, 1 self-harm major
  {
    id: "inc-jordan-001",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-05-05",
    time: "14:30",
    category: "physical_aggression",
    severity: "moderate",
    description: "Physical altercation with peer during communal activity. Push and shove escalated before staff intervened.",
    staffPresent: ["Tom Richards", "Lisa Williams"],
    responseQuality: "appropriate",
    deEscalationAttempted: true,
    deEscalationOutcome: "partially_successful",
    restraintUsed: false,
    restraintDurationMinutes: null,
    injuryOccurred: false,
    injuryDetails: null,
    notificationStatus: "timely_and_complete",
    postIncidentActions: ["debrief_completed", "support_plan_updated"],
    childDebriefed: true,
    lessonsIdentified: true,
    managersInformed: true,
  },
  {
    id: "inc-jordan-002",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-05-08",
    time: "20:00",
    category: "physical_aggression",
    severity: "moderate",
    description: "Aggressive behaviour towards staff during bedtime routine. Threw a cup and shouted before retreating to room.",
    staffPresent: ["Lisa Williams"],
    responseQuality: "appropriate",
    deEscalationAttempted: true,
    deEscalationOutcome: "successful",
    restraintUsed: false,
    restraintDurationMinutes: null,
    injuryOccurred: false,
    injuryDetails: null,
    notificationStatus: "timely_and_complete",
    postIncidentActions: ["debrief_completed"],
    childDebriefed: true,
    lessonsIdentified: true,
    managersInformed: true,
  },
  {
    id: "inc-jordan-003",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-05-12",
    time: "09:30",
    category: "self_harm",
    severity: "major",
    description: "Self-harm episode following a distressing phone call with family member. Scratched forearms. Staff provided immediate first aid and emotional support.",
    staffPresent: ["Sarah Johnson", "Tom Richards"],
    responseQuality: "exemplary",
    deEscalationAttempted: true,
    deEscalationOutcome: "successful",
    restraintUsed: true,
    restraintDurationMinutes: 3,
    injuryOccurred: true,
    injuryDetails: "Superficial scratches to both forearms — first aid applied, GP informed",
    notificationStatus: "timely_and_complete",
    postIncidentActions: ["debrief_completed", "support_plan_updated", "medical_attention"],
    childDebriefed: true,
    lessonsIdentified: true,
    managersInformed: true,
  },
  // Morgan: 0 incidents (Morgan has no incident records)
];

const DEMO_TRENDS: IncidentTrend[] = [
  {
    id: "trend-jordan-001",
    childId: "child-jordan",
    childName: "Jordan",
    periodStart: "2026-05-01",
    periodEnd: "2026-05-18",
    incidentCount: 3,
    predominantCategory: "physical_aggression",
    escalating: true,
    triggerPatterns: ["family_contact", "transitions", "bedtime_routine"],
  },
];

const DEMO_STAFF_RESPONSES: StaffResponse[] = [
  {
    id: "sr-001",
    incidentId: "inc-alex-001",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    responseTimeMins: 1,
    appropriateForce: true,
    bodyWornCameraUsed: false,
    reportCompletedTimely: true,
    debriedParticipated: true,
  },
  {
    id: "sr-002",
    incidentId: "inc-jordan-001",
    staffId: "staff-tom",
    staffName: "Tom Richards",
    responseTimeMins: 2,
    appropriateForce: true,
    bodyWornCameraUsed: false,
    reportCompletedTimely: true,
    debriedParticipated: true,
  },
  {
    id: "sr-003",
    incidentId: "inc-jordan-001",
    staffId: "staff-lisa",
    staffName: "Lisa Williams",
    responseTimeMins: 2,
    appropriateForce: true,
    bodyWornCameraUsed: false,
    reportCompletedTimely: true,
    debriedParticipated: true,
  },
  {
    id: "sr-004",
    incidentId: "inc-jordan-002",
    staffId: "staff-lisa",
    staffName: "Lisa Williams",
    responseTimeMins: 3,
    appropriateForce: true,
    bodyWornCameraUsed: false,
    reportCompletedTimely: true,
    debriedParticipated: true,
  },
  {
    id: "sr-005",
    incidentId: "inc-jordan-003",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    responseTimeMins: 1,
    appropriateForce: true,
    bodyWornCameraUsed: true,
    reportCompletedTimely: true,
    debriedParticipated: true,
  },
  {
    id: "sr-006",
    incidentId: "inc-jordan-003",
    staffId: "staff-tom",
    staffName: "Tom Richards",
    responseTimeMins: 2,
    appropriateForce: true,
    bodyWornCameraUsed: true,
    reportCompletedTimely: true,
    debriedParticipated: true,
  },
];

const DEMO_PATTERNS: PatternIndicator[] = [
  {
    id: "pat-001",
    homeId: "oak-house",
    category: "physical_aggression",
    frequency: "weekly",
    peakTime: "evening",
    environmentalTrigger: "Bedtime transitions and unstructured evening time",
    seasonalPattern: false,
  },
  {
    id: "pat-002",
    homeId: "oak-house",
    category: "self_harm",
    frequency: "occasional",
    peakTime: "morning",
    environmentalTrigger: "Following family contact or distressing phone calls",
    seasonalPattern: false,
  },
];

// ── Label Maps Builder ───────────────────────────────────────────────────

function buildLabelMaps() {
  const categories = [
    "physical_aggression", "verbal_aggression", "self_harm", "absconding",
    "property_damage", "substance_misuse", "sexual_behaviour", "online_safety",
    "bullying", "criminal_activity",
  ] as const;

  const severities = ["critical", "major", "moderate", "minor"] as const;
  const qualities = ["exemplary", "appropriate", "partially_appropriate", "inadequate"] as const;
  const notificationStatuses = ["timely_and_complete", "timely_incomplete", "late", "not_notified"] as const;
  const deEscOutcomes = ["successful", "partially_successful", "unsuccessful", "not_attempted"] as const;
  const postActions = ["debrief_completed", "support_plan_updated", "medical_attention", "external_referral", "no_action", "pending"] as const;
  const ratings = ["outstanding", "good", "requires_improvement", "inadequate"] as const;

  return {
    incidentCategory: Object.fromEntries(categories.map((c) => [c, getIncidentCategoryLabel(c)])),
    incidentSeverity: Object.fromEntries(severities.map((s) => [s, getIncidentSeverityLabel(s)])),
    responseQuality: Object.fromEntries(qualities.map((q) => [q, getResponseQualityLabel(q)])),
    notificationStatus: Object.fromEntries(notificationStatuses.map((n) => [n, getNotificationStatusLabel(n)])),
    deEscalationOutcome: Object.fromEntries(deEscOutcomes.map((d) => [d, getDeEscalationOutcomeLabel(d)])),
    postIncidentAction: Object.fromEntries(postActions.map((p) => [p, getPostIncidentActionLabel(p)])),
    rating: Object.fromEntries(ratings.map((r) => [r, getRatingLabel(r)])),
  };
}

// ── GET ───────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateIncidentPatternAnalysisIntelligence(
    DEMO_INCIDENTS,
    DEMO_TRENDS,
    DEMO_STAFF_RESPONSES,
    DEMO_PATTERNS,
    "oak-house",
    "2026-05-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        labelMaps: buildLabelMaps(),
      },
    },
  });
}

// ── POST ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    incidents,
    trends,
    staffResponses,
    patterns,
    homeId,
    periodStart,
    periodEnd,
  } = body as {
    incidents?: IncidentRecord[];
    trends?: IncidentTrend[];
    staffResponses?: StaffResponse[];
    patterns?: PatternIndicator[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json(
      { error: "periodStart and periodEnd are required" },
      { status: 400 },
    );
  }

  const result = generateIncidentPatternAnalysisIntelligence(
    incidents ?? [],
    trends ?? [],
    staffResponses ?? [],
    patterns ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
