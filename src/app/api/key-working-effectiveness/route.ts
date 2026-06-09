// ==============================================================================
// API: /api/key-working-effectiveness
//
// Key Working Effectiveness Intelligence
//
// GET  -- Returns key working effectiveness metrics with demo data (Chamberlain House)
// POST -- Accepts custom data and returns analysis
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  generateKeyWorkingEffectivenessIntelligence,
  getSessionTypeLabel,
  getSessionQualityLabel,
  getRelationshipQualityLabel,
  getChildEngagementLabel,
  getCarePlanInputLabel,
  getChildVoiceEvidenceLabel,
  getRatingLabel,
} from "@/lib/key-working-effectiveness";
import type {
  KeyWorkSession,
  KeyWorkerRelationship,
  CarePlanContribution,
  KeyWorkerDevelopment,
} from "@/lib/key-working-effectiveness";

// -- Demo Data: Chamberlain House ----------------------------------------------------

function generateDemoData(): {
  sessions: KeyWorkSession[];
  relationships: KeyWorkerRelationship[];
  contributions: CarePlanContribution[];
  development: KeyWorkerDevelopment[];
} {
  // Alex assigned to Sarah Johnson: 8 sessions (mix), strong relationship, comprehensive
  const alexSessions: KeyWorkSession[] = [
    {
      id: "sess-001", childId: "child-alex", childName: "Alex",
      keyWorkerId: "kw-sarah", keyWorkerName: "Sarah Johnson",
      date: "2026-04-07", durationMinutes: 45, sessionType: "one_to_one",
      sessionQuality: "excellent", childEngagement: "fully_engaged",
      topicsCovered: ["feelings about placement", "school progress"],
      actionsAgreed: ["Contact school", "Update care plan"],
      actionsCompleted: 2, childVoiceEvidence: "wishes_captured_and_acted",
      recordedWithin24Hours: true, supervisorReviewed: true,
    },
    {
      id: "sess-002", childId: "child-alex", childName: "Alex",
      keyWorkerId: "kw-sarah", keyWorkerName: "Sarah Johnson",
      date: "2026-04-14", durationMinutes: 60, sessionType: "activity_based",
      sessionQuality: "good", childEngagement: "fully_engaged",
      topicsCovered: ["cooking together", "independence skills"],
      actionsAgreed: ["Plan weekly cooking session"],
      actionsCompleted: 1, childVoiceEvidence: "wishes_captured_and_acted",
      recordedWithin24Hours: true, supervisorReviewed: true,
    },
    {
      id: "sess-003", childId: "child-alex", childName: "Alex",
      keyWorkerId: "kw-sarah", keyWorkerName: "Sarah Johnson",
      date: "2026-04-21", durationMinutes: 50, sessionType: "one_to_one",
      sessionQuality: "excellent", childEngagement: "mostly_engaged",
      topicsCovered: ["contact with family", "upcoming LAC review"],
      actionsAgreed: ["Prepare Alex for LAC review", "Write report"],
      actionsCompleted: 2, childVoiceEvidence: "wishes_captured_and_acted",
      recordedWithin24Hours: true, supervisorReviewed: true,
    },
    {
      id: "sess-004", childId: "child-alex", childName: "Alex",
      keyWorkerId: "kw-sarah", keyWorkerName: "Sarah Johnson",
      date: "2026-04-28", durationMinutes: 40, sessionType: "care_plan_review",
      sessionQuality: "good", childEngagement: "fully_engaged",
      topicsCovered: ["care plan goals review", "education targets"],
      actionsAgreed: ["Update care plan goals", "Arrange tutor"],
      actionsCompleted: 1, childVoiceEvidence: "wishes_captured",
      recordedWithin24Hours: true, supervisorReviewed: false,
    },
    {
      id: "sess-005", childId: "child-alex", childName: "Alex",
      keyWorkerId: "kw-sarah", keyWorkerName: "Sarah Johnson",
      date: "2026-05-05", durationMinutes: 45, sessionType: "one_to_one",
      sessionQuality: "good", childEngagement: "fully_engaged",
      topicsCovered: ["friendship issues", "hobbies and interests"],
      actionsAgreed: ["Arrange football club trial"],
      actionsCompleted: 1, childVoiceEvidence: "wishes_captured_and_acted",
      recordedWithin24Hours: true, supervisorReviewed: true,
    },
    {
      id: "sess-006", childId: "child-alex", childName: "Alex",
      keyWorkerId: "kw-sarah", keyWorkerName: "Sarah Johnson",
      date: "2026-05-08", durationMinutes: 30, sessionType: "activity_based",
      sessionQuality: "excellent", childEngagement: "fully_engaged",
      topicsCovered: ["arts and crafts", "emotional expression"],
      actionsAgreed: ["Display artwork in room"],
      actionsCompleted: 1, childVoiceEvidence: "wishes_captured",
      recordedWithin24Hours: true, supervisorReviewed: true,
    },
    {
      id: "sess-007", childId: "child-alex", childName: "Alex",
      keyWorkerId: "kw-sarah", keyWorkerName: "Sarah Johnson",
      date: "2026-05-12", durationMinutes: 50, sessionType: "one_to_one",
      sessionQuality: "good", childEngagement: "mostly_engaged",
      topicsCovered: ["managing anger", "coping strategies"],
      actionsAgreed: ["Practice breathing techniques", "Create calm box"],
      actionsCompleted: 2, childVoiceEvidence: "wishes_captured_and_acted",
      recordedWithin24Hours: true, supervisorReviewed: true,
    },
    {
      id: "sess-008", childId: "child-alex", childName: "Alex",
      keyWorkerId: "kw-sarah", keyWorkerName: "Sarah Johnson",
      date: "2026-05-16", durationMinutes: 45, sessionType: "activity_based",
      sessionQuality: "excellent", childEngagement: "fully_engaged",
      topicsCovered: ["bike ride", "community awareness"],
      actionsAgreed: ["Plan weekend outing"],
      actionsCompleted: 1, childVoiceEvidence: "wishes_captured_and_acted",
      recordedWithin24Hours: true, supervisorReviewed: true,
    },
  ];

  // Jordan assigned to Tom Richards: 4 sessions (mostly crisis), developing, partial
  const jordanSessions: KeyWorkSession[] = [
    {
      id: "sess-009", childId: "child-jordan", childName: "Jordan",
      keyWorkerId: "kw-tom", keyWorkerName: "Tom Richards",
      date: "2026-04-10", durationMinutes: 30, sessionType: "crisis_support",
      sessionQuality: "adequate", childEngagement: "partially_engaged",
      topicsCovered: ["incident debrief", "calming strategies"],
      actionsAgreed: ["Create safety plan"],
      actionsCompleted: 0, childVoiceEvidence: "wishes_captured",
      recordedWithin24Hours: true, supervisorReviewed: false,
    },
    {
      id: "sess-010", childId: "child-jordan", childName: "Jordan",
      keyWorkerId: "kw-tom", keyWorkerName: "Tom Richards",
      date: "2026-04-22", durationMinutes: 25, sessionType: "crisis_support",
      sessionQuality: "adequate", childEngagement: "reluctant",
      topicsCovered: ["absconding risk", "trust building"],
      actionsAgreed: ["Risk assessment update", "Agreed check-in times"],
      actionsCompleted: 1, childVoiceEvidence: "token_consultation",
      recordedWithin24Hours: false, supervisorReviewed: false,
    },
    {
      id: "sess-011", childId: "child-jordan", childName: "Jordan",
      keyWorkerId: "kw-tom", keyWorkerName: "Tom Richards",
      date: "2026-05-03", durationMinutes: 35, sessionType: "one_to_one",
      sessionQuality: "good", childEngagement: "mostly_engaged",
      topicsCovered: ["future plans", "family contact"],
      actionsAgreed: ["Arrange family call"],
      actionsCompleted: 1, childVoiceEvidence: "wishes_captured",
      recordedWithin24Hours: true, supervisorReviewed: true,
    },
    {
      id: "sess-012", childId: "child-jordan", childName: "Jordan",
      keyWorkerId: "kw-tom", keyWorkerName: "Tom Richards",
      date: "2026-05-14", durationMinutes: 40, sessionType: "crisis_support",
      sessionQuality: "good", childEngagement: "partially_engaged",
      topicsCovered: ["emotional regulation", "placement stability"],
      actionsAgreed: ["Referral to therapist"],
      actionsCompleted: 0, childVoiceEvidence: "wishes_captured",
      recordedWithin24Hours: true, supervisorReviewed: false,
    },
  ];

  // Morgan assigned to Lisa Williams: 10 sessions (varied), strong, comprehensive
  const morganSessions: KeyWorkSession[] = [
    {
      id: "sess-013", childId: "child-morgan", childName: "Morgan",
      keyWorkerId: "kw-lisa", keyWorkerName: "Lisa Williams",
      date: "2026-04-03", durationMinutes: 50, sessionType: "one_to_one",
      sessionQuality: "excellent", childEngagement: "fully_engaged",
      topicsCovered: ["identity exploration", "cultural heritage"],
      actionsAgreed: ["Create life story book page"],
      actionsCompleted: 1, childVoiceEvidence: "wishes_captured_and_acted",
      recordedWithin24Hours: true, supervisorReviewed: true,
    },
    {
      id: "sess-014", childId: "child-morgan", childName: "Morgan",
      keyWorkerId: "kw-lisa", keyWorkerName: "Lisa Williams",
      date: "2026-04-08", durationMinutes: 60, sessionType: "life_story_work",
      sessionQuality: "excellent", childEngagement: "fully_engaged",
      topicsCovered: ["early memories", "timeline activity"],
      actionsAgreed: ["Gather photos from previous placements"],
      actionsCompleted: 1, childVoiceEvidence: "wishes_captured_and_acted",
      recordedWithin24Hours: true, supervisorReviewed: true,
    },
    {
      id: "sess-015", childId: "child-morgan", childName: "Morgan",
      keyWorkerId: "kw-lisa", keyWorkerName: "Lisa Williams",
      date: "2026-04-15", durationMinutes: 45, sessionType: "activity_based",
      sessionQuality: "good", childEngagement: "fully_engaged",
      topicsCovered: ["gardening together", "responsibility"],
      actionsAgreed: ["Maintain garden plot weekly"],
      actionsCompleted: 1, childVoiceEvidence: "wishes_captured",
      recordedWithin24Hours: true, supervisorReviewed: true,
    },
    {
      id: "sess-016", childId: "child-morgan", childName: "Morgan",
      keyWorkerId: "kw-lisa", keyWorkerName: "Lisa Williams",
      date: "2026-04-22", durationMinutes: 55, sessionType: "independence_planning",
      sessionQuality: "excellent", childEngagement: "fully_engaged",
      topicsCovered: ["budgeting skills", "cooking independently"],
      actionsAgreed: ["Budget exercise this week", "Cook meal alone"],
      actionsCompleted: 2, childVoiceEvidence: "wishes_captured_and_acted",
      recordedWithin24Hours: true, supervisorReviewed: true,
    },
    {
      id: "sess-017", childId: "child-morgan", childName: "Morgan",
      keyWorkerId: "kw-lisa", keyWorkerName: "Lisa Williams",
      date: "2026-04-29", durationMinutes: 45, sessionType: "care_plan_review",
      sessionQuality: "good", childEngagement: "mostly_engaged",
      topicsCovered: ["care plan progress", "education review prep"],
      actionsAgreed: ["Write review report", "Update targets"],
      actionsCompleted: 2, childVoiceEvidence: "wishes_captured_and_acted",
      recordedWithin24Hours: true, supervisorReviewed: true,
    },
    {
      id: "sess-018", childId: "child-morgan", childName: "Morgan",
      keyWorkerId: "kw-lisa", keyWorkerName: "Lisa Williams",
      date: "2026-05-01", durationMinutes: 40, sessionType: "advocacy",
      sessionQuality: "excellent", childEngagement: "fully_engaged",
      topicsCovered: ["rights awareness", "complaints process"],
      actionsAgreed: ["Display rights poster in room"],
      actionsCompleted: 1, childVoiceEvidence: "wishes_captured_and_acted",
      recordedWithin24Hours: true, supervisorReviewed: true,
    },
    {
      id: "sess-019", childId: "child-morgan", childName: "Morgan",
      keyWorkerId: "kw-lisa", keyWorkerName: "Lisa Williams",
      date: "2026-05-06", durationMinutes: 50, sessionType: "one_to_one",
      sessionQuality: "good", childEngagement: "fully_engaged",
      topicsCovered: ["friendships", "social skills"],
      actionsAgreed: ["Join youth club"],
      actionsCompleted: 1, childVoiceEvidence: "wishes_captured",
      recordedWithin24Hours: true, supervisorReviewed: true,
    },
    {
      id: "sess-020", childId: "child-morgan", childName: "Morgan",
      keyWorkerId: "kw-lisa", keyWorkerName: "Lisa Williams",
      date: "2026-05-09", durationMinutes: 60, sessionType: "life_story_work",
      sessionQuality: "excellent", childEngagement: "fully_engaged",
      topicsCovered: ["family tree activity", "understanding my story"],
      actionsAgreed: ["Complete family tree page"],
      actionsCompleted: 1, childVoiceEvidence: "wishes_captured_and_acted",
      recordedWithin24Hours: true, supervisorReviewed: true,
    },
    {
      id: "sess-021", childId: "child-morgan", childName: "Morgan",
      keyWorkerId: "kw-lisa", keyWorkerName: "Lisa Williams",
      date: "2026-05-13", durationMinutes: 45, sessionType: "activity_based",
      sessionQuality: "good", childEngagement: "mostly_engaged",
      topicsCovered: ["swimming trip", "physical health"],
      actionsAgreed: ["Weekly swim sessions"],
      actionsCompleted: 1, childVoiceEvidence: "wishes_captured",
      recordedWithin24Hours: true, supervisorReviewed: true,
    },
    {
      id: "sess-022", childId: "child-morgan", childName: "Morgan",
      keyWorkerId: "kw-lisa", keyWorkerName: "Lisa Williams",
      date: "2026-05-17", durationMinutes: 50, sessionType: "independence_planning",
      sessionQuality: "excellent", childEngagement: "fully_engaged",
      topicsCovered: ["travel training", "using public transport"],
      actionsAgreed: ["Practice bus journey this week"],
      actionsCompleted: 1, childVoiceEvidence: "wishes_captured_and_acted",
      recordedWithin24Hours: true, supervisorReviewed: true,
    },
  ];

  const sessions: KeyWorkSession[] = [
    ...alexSessions,
    ...jordanSessions,
    ...morganSessions,
  ];

  const relationships: KeyWorkerRelationship[] = [
    {
      id: "rel-001", childId: "child-alex", childName: "Alex",
      keyWorkerId: "kw-sarah", keyWorkerName: "Sarah Johnson",
      relationshipQuality: "strong_and_trusting", assignmentDate: "2025-09-01",
      keyWorkerChanges: 1, childFeelsListenedTo: true, childTrustsKeyWorker: true,
      culturalCompetence: true, consistencyRating: 9,
    },
    {
      id: "rel-002", childId: "child-jordan", childName: "Jordan",
      keyWorkerId: "kw-tom", keyWorkerName: "Tom Richards",
      relationshipQuality: "developing", assignmentDate: "2026-01-15",
      keyWorkerChanges: 2, childFeelsListenedTo: false, childTrustsKeyWorker: false,
      culturalCompetence: true, consistencyRating: 5,
    },
    {
      id: "rel-003", childId: "child-morgan", childName: "Morgan",
      keyWorkerId: "kw-lisa", keyWorkerName: "Lisa Williams",
      relationshipQuality: "strong_and_trusting", assignmentDate: "2025-06-01",
      keyWorkerChanges: 0, childFeelsListenedTo: true, childTrustsKeyWorker: true,
      culturalCompetence: true, consistencyRating: 10,
    },
  ];

  const contributions: CarePlanContribution[] = [
    {
      id: "cp-001", childId: "child-alex", childName: "Alex",
      keyWorkerId: "kw-sarah", keyWorkerName: "Sarah Johnson",
      carePlanInput: "comprehensive", reviewsAttended: 3, reviewsMissed: 0,
      reportsTimely: true, childViewsRepresented: true, outcomesFocused: true,
    },
    {
      id: "cp-002", childId: "child-jordan", childName: "Jordan",
      keyWorkerId: "kw-tom", keyWorkerName: "Tom Richards",
      carePlanInput: "partial", reviewsAttended: 2, reviewsMissed: 1,
      reportsTimely: false, childViewsRepresented: false, outcomesFocused: true,
    },
    {
      id: "cp-003", childId: "child-morgan", childName: "Morgan",
      keyWorkerId: "kw-lisa", keyWorkerName: "Lisa Williams",
      carePlanInput: "comprehensive", reviewsAttended: 4, reviewsMissed: 0,
      reportsTimely: true, childViewsRepresented: true, outcomesFocused: true,
    },
  ];

  const development: KeyWorkerDevelopment[] = [
    {
      id: "dev-001", keyWorkerId: "kw-sarah", keyWorkerName: "Sarah Johnson",
      trainingCompleted: ["Therapeutic key working", "Attachment theory", "Trauma-informed care"],
      supervisionRegular: true, reflectivePractice: true, caseloadCount: 3,
      peerSupportAccessed: true,
    },
    {
      id: "dev-002", keyWorkerId: "kw-tom", keyWorkerName: "Tom Richards",
      trainingCompleted: [],
      supervisionRegular: false, reflectivePractice: false, caseloadCount: 5,
      peerSupportAccessed: false,
    },
    {
      id: "dev-003", keyWorkerId: "kw-lisa", keyWorkerName: "Lisa Williams",
      trainingCompleted: ["Life story work", "Independence skills", "UNCRC rights-based practice", "Reflective supervision"],
      supervisionRegular: true, reflectivePractice: true, caseloadCount: 2,
      peerSupportAccessed: true,
    },
  ];

  return { sessions, relationships, contributions, development };
}

// -- GET handler -------------------------------------------------------------

export async function GET() {
  try {
    const { sessions, relationships, contributions, development } = generateDemoData();

    const result = generateKeyWorkingEffectivenessIntelligence(
      sessions,
      relationships,
      contributions,
      development,
      "oak-house",
      "2026-04-01",
      "2026-05-18",
    );

    return NextResponse.json({
      data: result,
      meta: {
        ratingLabel: getRatingLabel(result.rating),
        labelMaps: {
          sessionTypes: Object.fromEntries(
            (["one_to_one", "informal_check_in", "care_plan_review", "activity_based", "crisis_support", "life_story_work", "independence_planning", "advocacy"] as const).map(
              (t) => [t, getSessionTypeLabel(t)],
            ),
          ),
          sessionQualities: Object.fromEntries(
            (["excellent", "good", "adequate", "poor"] as const).map(
              (q) => [q, getSessionQualityLabel(q)],
            ),
          ),
          relationshipQualities: Object.fromEntries(
            (["strong_and_trusting", "developing", "inconsistent", "difficult", "not_established"] as const).map(
              (q) => [q, getRelationshipQualityLabel(q)],
            ),
          ),
          childEngagements: Object.fromEntries(
            (["fully_engaged", "mostly_engaged", "partially_engaged", "reluctant", "refused"] as const).map(
              (e) => [e, getChildEngagementLabel(e)],
            ),
          ),
          carePlanInputs: Object.fromEntries(
            (["comprehensive", "partial", "minimal", "none"] as const).map(
              (c) => [c, getCarePlanInputLabel(c)],
            ),
          ),
          childVoiceEvidence: Object.fromEntries(
            (["wishes_captured_and_acted", "wishes_captured", "token_consultation", "not_sought"] as const).map(
              (v) => [v, getChildVoiceEvidenceLabel(v)],
            ),
          ),
        },
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}

// -- POST handler ------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { sessions, relationships, contributions, development, homeId, periodStart, periodEnd } = body as {
      sessions?: KeyWorkSession[];
      relationships?: KeyWorkerRelationship[];
      contributions?: CarePlanContribution[];
      development?: KeyWorkerDevelopment[];
      homeId?: string;
      periodStart?: string;
      periodEnd?: string;
    };

    if (!homeId || typeof homeId !== "string") {
      return NextResponse.json({ error: "homeId is required" }, { status: 400 });
    }
    if (!periodStart || typeof periodStart !== "string") {
      return NextResponse.json({ error: "periodStart is required" }, { status: 400 });
    }
    if (!periodEnd || typeof periodEnd !== "string") {
      return NextResponse.json({ error: "periodEnd is required" }, { status: 400 });
    }
    if (!Array.isArray(sessions)) {
      return NextResponse.json({ error: "sessions must be an array" }, { status: 400 });
    }
    if (!Array.isArray(relationships)) {
      return NextResponse.json({ error: "relationships must be an array" }, { status: 400 });
    }
    if (!Array.isArray(contributions)) {
      return NextResponse.json({ error: "contributions must be an array" }, { status: 400 });
    }
    if (!Array.isArray(development)) {
      return NextResponse.json({ error: "development must be an array" }, { status: 400 });
    }

    const result = generateKeyWorkingEffectivenessIntelligence(
      sessions,
      relationships,
      contributions,
      development,
      homeId,
      periodStart,
      periodEnd,
    );

    return NextResponse.json({
      data: result,
      meta: { ratingLabel: getRatingLabel(result.rating) },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request body" },
      { status: 400 },
    );
  }
}
