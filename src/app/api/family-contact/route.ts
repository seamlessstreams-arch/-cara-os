// ══════════════════════════════════════════════════════════════════════════════
// API: /api/family-contact
//
// Family Contact & Communication Intelligence
//
// GET  — Returns family contact assessment with realistic Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateFamilyContactIntelligence,
  getContactTypeLabel,
  getContactOutcomeLabel,
  getFamilyMemberLabel,
  getImpactIndicatorLabel,
} from "@/lib/family-contact";
import type {
  ContactArrangement,
  ContactSession,
  ContactReview,
} from "@/lib/family-contact";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

const DEMO_ARRANGEMENTS: ContactArrangement[] = [
  // Alex – Mother (court-ordered weekly supervised)
  {
    id: "arr-001",
    childId: "child-alex",
    childName: "Alex",
    familyMemberId: "fm-001",
    familyMemberName: "Michelle (Mother)",
    familyMemberType: "mother",
    contactType: "supervised_visit",
    agreedFrequency: "weekly",
    isCourtOrdered: true,
    supervisedRequired: true,
    conditions: ["Supervisor must be Level 3 trained", "No discussion of court proceedings"],
    placingAuthorityAgreed: true,
    startDate: "2026-01-15",
    reviewDate: "2026-05-20",
  },
  // Alex – Father (fortnightly telephone, not court-ordered)
  {
    id: "arr-002",
    childId: "child-alex",
    childName: "Alex",
    familyMemberId: "fm-002",
    familyMemberName: "David (Father)",
    familyMemberType: "father",
    contactType: "telephone",
    agreedFrequency: "fortnightly",
    isCourtOrdered: false,
    supervisedRequired: false,
    placingAuthorityAgreed: true,
    startDate: "2026-02-01",
    reviewDate: "2026-06-01",
  },
  // Jordan – Grandmother (weekly face-to-face, court-ordered)
  {
    id: "arr-003",
    childId: "child-jordan",
    childName: "Jordan",
    familyMemberId: "fm-003",
    familyMemberName: "Pat (Grandmother)",
    familyMemberType: "grandparent",
    contactType: "face_to_face",
    agreedFrequency: "weekly",
    isCourtOrdered: true,
    supervisedRequired: false,
    placingAuthorityAgreed: true,
    startDate: "2025-11-01",
    reviewDate: "2026-05-15",
  },
  // Jordan – Mother (monthly supervised, court-ordered with conditions)
  {
    id: "arr-004",
    childId: "child-jordan",
    childName: "Jordan",
    familyMemberId: "fm-004",
    familyMemberName: "Tracey (Mother)",
    familyMemberType: "mother",
    contactType: "supervised_visit",
    agreedFrequency: "monthly",
    isCourtOrdered: true,
    supervisedRequired: true,
    conditions: ["Mother must not attend under influence of substances", "Contact to end immediately if child becomes distressed"],
    placingAuthorityAgreed: true,
    startDate: "2025-12-01",
    reviewDate: "2026-04-30",
  },
  // Morgan – Sibling (fortnightly video call)
  {
    id: "arr-005",
    childId: "child-morgan",
    childName: "Morgan",
    familyMemberId: "fm-005",
    familyMemberName: "Kian (Brother, placed separately)",
    familyMemberType: "sibling",
    contactType: "video_call",
    agreedFrequency: "fortnightly",
    isCourtOrdered: false,
    supervisedRequired: false,
    placingAuthorityAgreed: true,
    startDate: "2026-01-10",
    reviewDate: "2026-06-10",
  },
  // Morgan – Mother (no contact order)
  {
    id: "arr-006",
    childId: "child-morgan",
    childName: "Morgan",
    familyMemberId: "fm-006",
    familyMemberName: "Claire (Mother)",
    familyMemberType: "mother",
    contactType: "indirect",
    agreedFrequency: "no_contact_order",
    isCourtOrdered: true,
    supervisedRequired: false,
    conditions: ["Letters only via placing authority", "No direct contact until further court review"],
    placingAuthorityAgreed: true,
    startDate: "2025-09-01",
    reviewDate: "2026-06-01",
  },
];

const DEMO_SESSIONS: ContactSession[] = [
  // ── Alex + Mother (supervised weekly – May 2026) ────────────────────────
  {
    id: "sess-001",
    arrangementId: "arr-001",
    childId: "child-alex",
    scheduledDate: "2026-05-03",
    scheduledTime: "14:00",
    actualDate: "2026-05-03",
    duration: 60,
    contactType: "supervised_visit",
    outcome: "positive",
    familyMemberPresent: true,
    supervisorPresent: true,
    childPrepared: true,
    impactIndicators: ["settled_after", "positive_mood"],
    childVoiceRecorded: true,
    childWishesFeelings: "Alex said he enjoyed playing cards with Mum and asked when he could see her next",
    staffObservations: "Warm interaction. Michelle was emotionally available throughout.",
    placingAuthorityInformed: true,
  },
  {
    id: "sess-002",
    arrangementId: "arr-001",
    childId: "child-alex",
    scheduledDate: "2026-05-10",
    scheduledTime: "14:00",
    actualDate: "2026-05-10",
    duration: 55,
    contactType: "supervised_visit",
    outcome: "mixed",
    familyMemberPresent: true,
    supervisorPresent: true,
    childPrepared: true,
    impactIndicators: ["unsettled_after"],
    childVoiceRecorded: true,
    childWishesFeelings: "Alex said he felt upset because Mum cried at the end",
    staffObservations: "Michelle became tearful discussing care proceedings. Alex comforted her but became withdrawn afterwards.",
    followUpActions: ["Key worker debrief with Alex", "Remind Michelle of contact conditions"],
    placingAuthorityInformed: true,
  },
  {
    id: "sess-003",
    arrangementId: "arr-001",
    childId: "child-alex",
    scheduledDate: "2026-05-17",
    scheduledTime: "14:00",
    actualDate: "2026-05-17",
    duration: 60,
    contactType: "supervised_visit",
    outcome: "positive",
    familyMemberPresent: true,
    supervisorPresent: true,
    childPrepared: true,
    impactIndicators: ["settled_after", "positive_mood"],
    childVoiceRecorded: true,
    childWishesFeelings: "Alex said this was 'the best visit' because they went to the park",
    placingAuthorityInformed: true,
  },
  // ── Alex + Father (fortnightly phone – May) ────────────────────────────
  {
    id: "sess-004",
    arrangementId: "arr-002",
    childId: "child-alex",
    scheduledDate: "2026-05-04",
    scheduledTime: "18:00",
    duration: 15,
    contactType: "telephone",
    outcome: "neutral",
    familyMemberPresent: true,
    childPrepared: false,
    impactIndicators: [],
    childVoiceRecorded: false,
    placingAuthorityInformed: false,
  },
  {
    id: "sess-005",
    arrangementId: "arr-002",
    childId: "child-alex",
    scheduledDate: "2026-05-18",
    scheduledTime: "18:00",
    contactType: "telephone",
    outcome: "no_show",
    familyMemberPresent: false,
    childPrepared: true,
    impactIndicators: ["withdrawn_after"],
    childVoiceRecorded: true,
    childWishesFeelings: "Alex said he's not surprised because Dad always lets him down",
    staffObservations: "Alex was clearly disappointed. Spent rest of evening in his room.",
    followUpActions: ["Follow up with David (Father) re commitment", "Discuss with Alex in key work session"],
    placingAuthorityInformed: true,
  },
  // ── Jordan + Grandmother (weekly face-to-face – May) ────────────────────
  {
    id: "sess-006",
    arrangementId: "arr-003",
    childId: "child-jordan",
    scheduledDate: "2026-05-01",
    scheduledTime: "16:00",
    actualDate: "2026-05-01",
    duration: 90,
    contactType: "face_to_face",
    outcome: "positive",
    familyMemberPresent: true,
    childPrepared: true,
    impactIndicators: ["settled_after", "positive_mood"],
    childVoiceRecorded: true,
    childWishesFeelings: "Jordan said Nan always makes her feel safe and happy",
    placingAuthorityInformed: true,
  },
  {
    id: "sess-007",
    arrangementId: "arr-003",
    childId: "child-jordan",
    scheduledDate: "2026-05-08",
    scheduledTime: "16:00",
    actualDate: "2026-05-08",
    duration: 90,
    contactType: "face_to_face",
    outcome: "positive",
    familyMemberPresent: true,
    childPrepared: true,
    impactIndicators: ["settled_after", "positive_mood", "improved_engagement"],
    childVoiceRecorded: true,
    placingAuthorityInformed: true,
  },
  {
    id: "sess-008",
    arrangementId: "arr-003",
    childId: "child-jordan",
    scheduledDate: "2026-05-15",
    scheduledTime: "16:00",
    actualDate: "2026-05-15",
    duration: 85,
    contactType: "face_to_face",
    outcome: "positive",
    familyMemberPresent: true,
    childPrepared: true,
    impactIndicators: ["settled_after", "positive_mood"],
    childVoiceRecorded: true,
    placingAuthorityInformed: true,
  },
  // ── Jordan + Mother (monthly supervised – triggered concern) ────────────
  {
    id: "sess-009",
    arrangementId: "arr-004",
    childId: "child-jordan",
    scheduledDate: "2026-05-05",
    scheduledTime: "11:00",
    actualDate: "2026-05-05",
    duration: 40,
    contactType: "supervised_visit",
    outcome: "distressing",
    familyMemberPresent: true,
    supervisorPresent: true,
    childPrepared: true,
    impactIndicators: ["dysregulated_after", "sleep_disrupted", "absconding_risk"],
    childVoiceRecorded: true,
    childWishesFeelings: "Jordan became tearful and asked to leave early. Later said 'Mum doesn't care about me, she just pretends'",
    staffObservations: "Tracey appeared under influence. Contact ended early per conditions. Jordan was dysregulated for remainder of day — attempted to leave the home at 21:30.",
    followUpActions: ["Urgent notification to placing authority", "Review contact arrangement with IRO", "Therapeutic debrief with Jordan"],
    placingAuthorityInformed: true,
  },
  // ── Morgan + Brother (fortnightly video – May) ──────────────────────────
  {
    id: "sess-010",
    arrangementId: "arr-005",
    childId: "child-morgan",
    scheduledDate: "2026-05-02",
    scheduledTime: "17:00",
    actualDate: "2026-05-02",
    duration: 30,
    contactType: "video_call",
    outcome: "positive",
    familyMemberPresent: true,
    childPrepared: true,
    impactIndicators: ["positive_mood", "settled_after"],
    childVoiceRecorded: true,
    childWishesFeelings: "Morgan said seeing Kian made them feel less alone",
    placingAuthorityInformed: true,
  },
  {
    id: "sess-011",
    arrangementId: "arr-005",
    childId: "child-morgan",
    scheduledDate: "2026-05-16",
    scheduledTime: "17:00",
    actualDate: "2026-05-16",
    duration: 25,
    contactType: "video_call",
    outcome: "mixed",
    familyMemberPresent: true,
    childPrepared: true,
    impactIndicators: ["unsettled_after"],
    childVoiceRecorded: true,
    childWishesFeelings: "Morgan said they miss Kian and it's not fair they can't live together",
    staffObservations: "Morgan became teary at end of call. Needed 20 minutes with KW afterwards to de-escalate.",
    placingAuthorityInformed: true,
  },
  // ── Morgan + Mother (indirect only – letter received) ──────────────────
  {
    id: "sess-012",
    arrangementId: "arr-006",
    childId: "child-morgan",
    scheduledDate: "2026-05-10",
    contactType: "indirect",
    outcome: "distressing",
    familyMemberPresent: false,
    childPrepared: false,
    impactIndicators: ["dysregulated_after", "self_harm_risk"],
    childVoiceRecorded: true,
    childWishesFeelings: "Morgan said reading the letter made them feel like everything was their fault",
    staffObservations: "Letter contained guilt-inducing language. Morgan self-isolated and expressed fleeting suicidal ideation. Crisis protocol activated.",
    followUpActions: ["Placing authority notified immediately", "Review letter-screening process", "Extra CAMHS session arranged", "Safety plan reviewed with Morgan"],
    placingAuthorityInformed: true,
  },
  // ── Cancelled session — home (creates compliance concern) ──────────────
  {
    id: "sess-013",
    arrangementId: "arr-003",
    childId: "child-jordan",
    scheduledDate: "2026-05-04",
    scheduledTime: "16:00",
    contactType: "face_to_face",
    outcome: "cancelled_by_home",
    familyMemberPresent: false,
    childPrepared: false,
    impactIndicators: [],
    childVoiceRecorded: false,
    staffObservations: "Cancelled due to staffing issues — lone worker unable to transport. Rescheduled for following day but clashes with Nan's work.",
    placingAuthorityInformed: true,
  },
];

const DEMO_REVIEWS: ContactReview[] = [
  {
    id: "rev-001",
    arrangementId: "arr-001",
    reviewDate: "2026-04-15",
    reviewedBy: "Darren Laville (RM) with IRO",
    overallAssessment: "meeting_needs",
    childViewConsidered: true,
    frequencyAppropriate: true,
    typeAppropriate: true,
    nextReviewDate: "2026-07-15",
  },
  {
    id: "rev-002",
    arrangementId: "arr-003",
    reviewDate: "2026-03-20",
    reviewedBy: "Darren Laville (RM)",
    overallAssessment: "meeting_needs",
    childViewConsidered: true,
    frequencyAppropriate: true,
    typeAppropriate: true,
    nextReviewDate: "2026-06-20",
  },
  // NOTE: arr-004 (Jordan + Mother) review is OVERDUE (due 2026-04-30)
];

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateFamilyContactIntelligence(
    DEMO_ARRANGEMENTS,
    DEMO_SESSIONS,
    DEMO_REVIEWS,
    "oak-house",
    "2026-05-01",
    "2026-05-18",
    "2026-05-18",
  );

  // Enrich with labels for UI
  const impactLabels = result.impact.highRiskImpacts.map((h) => ({
    ...h,
    label: getImpactIndicatorLabel(h.indicator),
  }));

  const patternLabels = result.impact.impactPatterns.map((p) => ({
    ...p,
    contactTypeLabel: getContactTypeLabel(p.contactType),
  }));

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        impactLabels,
        patternLabels,
        contactTypeLabels: Object.fromEntries(
          (["face_to_face", "telephone", "video_call", "letter", "supervised_visit", "unsupervised_visit", "overnight_stay", "community_contact", "indirect"] as const).map(
            (t) => [t, getContactTypeLabel(t)],
          ),
        ),
        outcomeLabels: Object.fromEntries(
          (["positive", "mixed", "negative", "neutral", "distressing", "cancelled_by_family", "cancelled_by_home", "cancelled_by_authority", "child_refused", "no_show"] as const).map(
            (o) => [o, getContactOutcomeLabel(o)],
          ),
        ),
        familyMemberLabels: Object.fromEntries(
          (["mother", "father", "sibling", "grandparent", "extended_family", "other_significant"] as const).map(
            (fm) => [fm, getFamilyMemberLabel(fm)],
          ),
        ),
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

  const { arrangements, sessions, reviews, homeId, periodStart, periodEnd, currentDate } = body as {
    arrangements?: ContactArrangement[];
    sessions?: ContactSession[];
    reviews?: ContactReview[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
    currentDate?: string;
  };

  if (!arrangements || !Array.isArray(arrangements) || arrangements.length === 0) {
    return NextResponse.json({ error: "arrangements array is required" }, { status: 400 });
  }
  if (!sessions || !Array.isArray(sessions)) {
    return NextResponse.json({ error: "sessions array is required" }, { status: 400 });
  }
  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateFamilyContactIntelligence(
    arrangements,
    sessions,
    reviews ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
    currentDate ?? new Date().toISOString().split("T")[0],
  );

  return NextResponse.json({ data: result });
}
