// ══════════════════════════════════════════════════════════════════════════════
// API: /api/lessons-learned
//
// Critical Incident Lessons Learned Intelligence
//
// GET  — Returns learning organisation assessment with demo incident data
// POST — Accepts custom incident/review data and returns tailored assessment
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateLearningOrganisationScore,
  getCategoryLabel,
  getRatingLabel,
} from "@/lib/lessons-learned";
import type {
  IncidentRecord,
  PostIncidentReview,
  LessonAction,
} from "@/lib/lessons-learned";

// ── Demo Data ──────────────────────────────────────────────────────────────

function generateDemoData(): {
  incidents: IncidentRecord[];
  reviews: PostIncidentReview[];
} {
  const incidents: IncidentRecord[] = [
    {
      id: "inc-001",
      date: "2026-05-02",
      category: "restraint",
      severity: 3,
      childId: "child-alex",
      childName: "Alex",
      staffInvolved: ["Sarah Johnson", "Mike Chen"],
      description: "Physical intervention during escalation following denied screen time",
      triggers: ["denied_request", "transition"],
      location: "living room",
      timeOfDay: "16:45",
    },
    {
      id: "inc-002",
      date: "2026-05-05",
      category: "missing_from_care",
      severity: 4,
      childId: "child-jordan",
      childName: "Jordan",
      staffInvolved: ["Lisa Williams"],
      description: "Jordan left the home without permission at 21:30. Located by police at local park.",
      triggers: ["contact_with_family", "emotional_distress"],
      location: "front door",
      timeOfDay: "21:30",
    },
    {
      id: "inc-003",
      date: "2026-05-08",
      category: "self_harm",
      severity: 3,
      childId: "child-morgan",
      childName: "Morgan",
      staffInvolved: ["Tom Watson", "Sarah Johnson"],
      description: "Morgan disclosed self-harm (scratching). First aid administered.",
      triggers: ["peer_conflict", "anxiety"],
      location: "bedroom",
      timeOfDay: "22:15",
    },
    {
      id: "inc-004",
      date: "2026-05-12",
      category: "restraint",
      severity: 2,
      childId: "child-alex",
      childName: "Alex",
      staffInvolved: ["Mike Chen"],
      description: "Brief guided support during transition from gaming to bedtime routine",
      triggers: ["transition", "tired"],
      location: "gaming room",
      timeOfDay: "21:00",
    },
    {
      id: "inc-005",
      date: "2026-05-14",
      category: "violence_aggression",
      severity: 3,
      childId: "child-alex",
      childName: "Alex",
      staffInvolved: ["Sarah Johnson", "Lisa Williams"],
      description: "Alex threw objects in communal area after peer disagreement",
      triggers: ["peer_conflict", "frustration"],
      location: "dining room",
      timeOfDay: "18:30",
    },
  ];

  const reviews: PostIncidentReview[] = [
    {
      id: "review-001",
      incidentId: "inc-001",
      status: "completed",
      reviewDate: "2026-05-05",
      dueDate: "2026-05-09",
      reviewedBy: "Darren Laville (RM)",
      rootCauses: [
        "Unstructured transition between activities",
        "Alex's need for predictability not met",
      ],
      lessonsIdentified: [
        "Visual transition warnings needed 10 mins before screen time ends",
        "Staff to offer Alex choice of next activity during transition",
      ],
      childVoiceIncluded: true,
      staffReflectionCompleted: true,
      immediateChanges: ["Visual timer purchased for living room", "Transition procedure updated"],
      longerTermActions: [
        {
          id: "action-001",
          reviewId: "review-001",
          description: "Develop personalised transition support plan for Alex",
          assignedTo: "Sarah Johnson (KW)",
          status: "evidenced",
          dueDate: "2026-05-19",
          completedDate: "2026-05-14",
          evidenceDescription: "Transition plan in Alex's file, shared with all staff",
          embeddingStatus: "embedded_evidenced",
          embeddingEvidence: "3 successful transitions observed using new approach. Team briefed in supervision.",
        },
      ],
    },
    {
      id: "review-002",
      incidentId: "inc-002",
      status: "completed",
      reviewDate: "2026-05-08",
      dueDate: "2026-05-12",
      reviewedBy: "Darren Laville (RM)",
      rootCauses: [
        "Contact with mum triggered emotional response",
        "Evening routine disrupted by late contact call",
      ],
      lessonsIdentified: [
        "Contact calls to conclude by 20:00 to allow wind-down time",
        "Post-contact check-in to be standard practice",
      ],
      childVoiceIncluded: true,
      staffReflectionCompleted: true,
      immediateChanges: ["Contact schedule updated", "Jordan's risk assessment reviewed"],
      longerTermActions: [
        {
          id: "action-002",
          reviewId: "review-002",
          description: "Implement post-contact emotional check-in protocol",
          assignedTo: "Lisa Williams (KW)",
          status: "completed",
          dueDate: "2026-05-19",
          completedDate: "2026-05-12",
          evidenceDescription: "Protocol documented and added to placement plan",
          embeddingStatus: "practice_changed",
          embeddingEvidence: "Protocol in use but embedding evidence pending",
        },
        {
          id: "action-003",
          reviewId: "review-002",
          description: "Review missing from care response with multi-agency partners",
          assignedTo: "Darren Laville (RM)",
          status: "in_progress",
          dueDate: "2026-05-25",
          embeddingStatus: "not_started",
        },
      ],
    },
    {
      id: "review-003",
      incidentId: "inc-003",
      status: "completed",
      reviewDate: "2026-05-11",
      dueDate: "2026-05-15",
      reviewedBy: "Darren Laville (RM)",
      rootCauses: [
        "Unresolved peer tension from school day",
        "Morgan's existing anxiety management strategies insufficient for new triggers",
      ],
      lessonsIdentified: [
        "School debrief to be built into after-school routine",
        "CAMHS to review Morgan's anxiety toolkit",
      ],
      childVoiceIncluded: true,
      staffReflectionCompleted: false,
      immediateChanges: ["Safety plan updated", "Bedroom environment reviewed"],
      longerTermActions: [
        {
          id: "action-004",
          reviewId: "review-003",
          description: "CAMHS referral for anxiety toolkit review",
          assignedTo: "Tom Watson (KW)",
          status: "identified",
          dueDate: "2026-05-22",
          embeddingStatus: "not_started",
        },
      ],
    },
    {
      id: "review-004",
      incidentId: "inc-004",
      status: "in_progress",
      dueDate: "2026-05-19",
      reviewedBy: undefined,
      rootCauses: [],
      lessonsIdentified: [],
      childVoiceIncluded: false,
      staffReflectionCompleted: false,
      immediateChanges: [],
      longerTermActions: [],
    },
    {
      id: "review-005",
      incidentId: "inc-005",
      status: "pending",
      dueDate: "2026-05-21",
      reviewedBy: undefined,
      rootCauses: [],
      lessonsIdentified: [],
      childVoiceIncluded: false,
      staffReflectionCompleted: false,
      immediateChanges: [],
      longerTermActions: [],
    },
  ];

  return { incidents, reviews };
}

// ── GET: Demo Assessment ───────────────────────────────────────────────────

export async function GET() {
  const { incidents, reviews } = generateDemoData();
  const result = generateLearningOrganisationScore(
    incidents,
    reviews,
    "oak-house",
    "2026-05-01",
    "2026-05-18",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        incidentSummary: incidents.map((i) => ({
          id: i.id,
          date: i.date,
          category: getCategoryLabel(i.category),
          severity: i.severity,
          childName: i.childName,
        })),
        reviewCount: reviews.length,
        ratingLabel: getRatingLabel(result.rating),
      },
    },
  });
}

// ── POST: Custom Assessment ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { incidents, reviews, homeId, periodStart, periodEnd, currentDate } = body as {
    incidents?: IncidentRecord[];
    reviews?: PostIncidentReview[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
    currentDate?: string;
  };

  if (!incidents || !Array.isArray(incidents)) {
    return NextResponse.json(
      { error: "incidents array is required" },
      { status: 400 },
    );
  }
  if (!reviews || !Array.isArray(reviews)) {
    return NextResponse.json(
      { error: "reviews array is required" },
      { status: 400 },
    );
  }
  if (!periodStart || !periodEnd) {
    return NextResponse.json(
      { error: "periodStart and periodEnd are required (YYYY-MM-DD)" },
      { status: 400 },
    );
  }

  const result = generateLearningOrganisationScore(
    incidents,
    reviews,
    homeId ?? "unknown",
    periodStart,
    periodEnd,
    currentDate ?? new Date().toISOString().split("T")[0],
  );

  return NextResponse.json({ data: result });
}
