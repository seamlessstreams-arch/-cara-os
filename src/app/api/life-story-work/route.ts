// ==============================================================================
// API: /api/life-story-work
//
// Life Story Work Intelligence
//
// GET  — Returns life story work assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateLifeStoryWorkIntelligence,
  getSessionTypeLabel,
  getEngagementLevelLabel,
  getMemoryItemTypeLabel,
  getRatingLabel,
} from "@/lib/life-story-work";
import type {
  LifeStorySession,
  MemoryRecord,
  LifeStoryPolicy,
  StaffLifeStoryTraining,
} from "@/lib/life-story-work";

// -- Demo Data: Chamberlain House -------------------------------------------------------

const DEMO_SESSIONS: LifeStorySession[] = [
  { id: "ls-1", childId: "child-alex", childName: "Alex", sessionDate: "2026-01-15", sessionType: "life_story_book", facilitator: "Sarah Johnson", durationMinutes: 45, engagementLevel: "highly_engaged", therapeuticApproachUsed: true, childLedPace: true, recordedInCasefile: true, followUpPlanned: true },
  { id: "ls-2", childId: "child-alex", childName: "Alex", sessionDate: "2026-02-10", sessionType: "therapeutic_narrative", facilitator: "Sarah Johnson", durationMinutes: 60, engagementLevel: "engaged", therapeuticApproachUsed: true, childLedPace: true, recordedInCasefile: true, followUpPlanned: true },
  { id: "ls-3", childId: "child-alex", childName: "Alex", sessionDate: "2026-03-12", sessionType: "photo_work", facilitator: "Sarah Johnson", durationMinutes: 30, engagementLevel: "highly_engaged", therapeuticApproachUsed: true, childLedPace: true, recordedInCasefile: true, followUpPlanned: true },
  { id: "ls-4", childId: "child-alex", childName: "Alex", sessionDate: "2026-04-08", sessionType: "timeline_work", facilitator: "Lisa Williams", durationMinutes: 50, engagementLevel: "engaged", therapeuticApproachUsed: true, childLedPace: true, recordedInCasefile: true, followUpPlanned: true },
  { id: "ls-5", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-02-05", sessionType: "memory_box", facilitator: "Tom Richards", durationMinutes: 40, engagementLevel: "engaged", therapeuticApproachUsed: true, childLedPace: true, recordedInCasefile: true, followUpPlanned: true },
  { id: "ls-6", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-03-15", sessionType: "family_tree", facilitator: "Tom Richards", durationMinutes: 55, engagementLevel: "highly_engaged", therapeuticApproachUsed: true, childLedPace: true, recordedInCasefile: true, followUpPlanned: true },
  { id: "ls-7", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-04-20", sessionType: "identity_exploration", facilitator: "Tom Richards", durationMinutes: 45, engagementLevel: "engaged", therapeuticApproachUsed: true, childLedPace: true, recordedInCasefile: true, followUpPlanned: true },
  { id: "ls-8", childId: "child-morgan", childName: "Morgan", sessionDate: "2026-01-25", sessionType: "life_story_book", facilitator: "Lisa Williams", durationMinutes: 50, engagementLevel: "highly_engaged", therapeuticApproachUsed: true, childLedPace: true, recordedInCasefile: true, followUpPlanned: true },
  { id: "ls-9", childId: "child-morgan", childName: "Morgan", sessionDate: "2026-03-05", sessionType: "digital_story", facilitator: "Lisa Williams", durationMinutes: 60, engagementLevel: "engaged", therapeuticApproachUsed: true, childLedPace: true, recordedInCasefile: true, followUpPlanned: true },
];

const DEMO_RECORDS: MemoryRecord[] = [
  { id: "mr-1", childId: "child-alex", childName: "Alex", itemType: "photograph", dateAdded: "2026-01-20", securelyStored: true, childAccessible: true, qualityChecked: true },
  { id: "mr-2", childId: "child-alex", childName: "Alex", itemType: "letter", dateAdded: "2026-02-15", securelyStored: true, childAccessible: true, qualityChecked: true },
  { id: "mr-3", childId: "child-alex", childName: "Alex", itemType: "certificate", dateAdded: "2026-03-10", securelyStored: true, childAccessible: true, qualityChecked: true },
  { id: "mr-4", childId: "child-jordan", childName: "Jordan", itemType: "keepsake", dateAdded: "2026-02-10", securelyStored: true, childAccessible: true, qualityChecked: true },
  { id: "mr-5", childId: "child-jordan", childName: "Jordan", itemType: "artwork", dateAdded: "2026-03-20", securelyStored: true, childAccessible: true, qualityChecked: true },
  { id: "mr-6", childId: "child-morgan", childName: "Morgan", itemType: "digital_media", dateAdded: "2026-01-30", securelyStored: true, childAccessible: true, qualityChecked: true },
  { id: "mr-7", childId: "child-morgan", childName: "Morgan", itemType: "photograph", dateAdded: "2026-03-08", securelyStored: true, childAccessible: true, qualityChecked: true },
];

const DEMO_POLICY: LifeStoryPolicy = {
  id: "lsp-1",
  lifeStoryWorkPolicy: true,
  identitySupportFramework: true,
  therapeuticApproachGuidance: true,
  memoryKeepingProtocol: true,
  culturalSensitivityGuidance: true,
  childConsentProcess: true,
  regularReviewSchedule: true,
};

const DEMO_TRAINING: StaffLifeStoryTraining[] = [
  { id: "lst-1", staffId: "staff-sarah", staffName: "Sarah Johnson", lifeStoryWork: true, therapeuticNarrative: true, traumaInformed: true, culturalSensitivity: true, childLedApproach: true, memoryKeeping: true },
  { id: "lst-2", staffId: "staff-tom", staffName: "Tom Richards", lifeStoryWork: true, therapeuticNarrative: true, traumaInformed: true, culturalSensitivity: true, childLedApproach: true, memoryKeeping: true },
  { id: "lst-3", staffId: "staff-lisa", staffName: "Lisa Williams", lifeStoryWork: true, therapeuticNarrative: true, traumaInformed: true, culturalSensitivity: true, childLedApproach: true, memoryKeeping: true },
  { id: "lst-4", staffId: "staff-darren", staffName: "Darren Laville", lifeStoryWork: true, therapeuticNarrative: true, traumaInformed: true, culturalSensitivity: true, childLedApproach: true, memoryKeeping: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateLifeStoryWorkIntelligence(
    DEMO_SESSIONS,
    DEMO_RECORDS,
    DEMO_POLICY,
    DEMO_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-19",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        sessionTypeLabels: Object.fromEntries(
          (["life_story_book", "memory_box", "photo_work", "therapeutic_narrative", "timeline_work", "family_tree", "identity_exploration", "digital_story"] as const).map(
            (s) => [s, getSessionTypeLabel(s)],
          ),
        ),
        engagementLevelLabels: Object.fromEntries(
          (["highly_engaged", "engaged", "partially_engaged", "reluctant", "refused"] as const).map(
            (e) => [e, getEngagementLevelLabel(e)],
          ),
        ),
        memoryItemTypeLabels: Object.fromEntries(
          (["photograph", "letter", "certificate", "artwork", "report", "keepsake", "digital_media", "other"] as const).map(
            (m) => [m, getMemoryItemTypeLabel(m)],
          ),
        ),
        ratingLabels: Object.fromEntries(
          (["outstanding", "good", "requires_improvement", "inadequate"] as const).map(
            (r) => [r, getRatingLabel(r)],
          ),
        ),
      },
    },
  });
}

// -- POST -----------------------------------------------------------------------

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { sessions, records, policy, training, homeId, periodStart, periodEnd } = body as {
    sessions?: LifeStorySession[];
    records?: MemoryRecord[];
    policy?: LifeStoryPolicy | null;
    training?: StaffLifeStoryTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateLifeStoryWorkIntelligence(
    sessions ?? [],
    records ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
