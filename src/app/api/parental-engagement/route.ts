// ══════════════════════════════════════════════════════════════════════════════
// API: /api/parental-engagement
//
// Parental Engagement Intelligence
//
// GET  — Returns parental engagement assessment with realistic Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateParentalEngagementIntelligence,
  getContactTypeLabel,
  getContactOutcomeLabel,
  getEngagementLevelLabel,
  getSupportTypeLabel,
  getRelationshipLabel,
  getEffectivenessLabel,
} from "@/lib/parental-engagement";
import type {
  ContactRecord,
  ParentalSupportRecord,
  FamilyPlanRecord,
  ParentalFeedbackRecord,
} from "@/lib/parental-engagement";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

const HOME_ID = "oak-house";
const PERIOD_START = "2026-05-01";
const PERIOD_END = "2026-05-31";
const REFERENCE_DATE = "2026-05-18";

const CHILD_IDS = ["child-alex", "child-jordan", "child-morgan"];

const DEMO_CONTACTS: ContactRecord[] = [
  // Alex (14) + Michelle (mum, engaged) — 4 contacts
  {
    id: "c-001", homeId: HOME_ID, childId: "child-alex", childName: "Alex",
    parentId: "parent-michelle", parentName: "Michelle", relationship: "mother",
    contactDate: "2026-05-03", contactType: "face_to_face", duration: 60,
    location: "Chamberlain House lounge", outcome: "positive", childMoodBefore: 5, childMoodAfter: 8,
    parentEngagement: 9, staffObservations: "Michelle and Alex played cards. Warm interaction throughout.",
    issuesRaised: [], positiveInteractions: ["Card game", "Shared snacks"], followUpNeeded: false,
  },
  {
    id: "c-002", homeId: HOME_ID, childId: "child-alex", childName: "Alex",
    parentId: "parent-michelle", parentName: "Michelle", relationship: "mother",
    contactDate: "2026-05-10", contactType: "phone", duration: 25,
    location: "Phone (Chamberlain House office)", outcome: "positive", childMoodBefore: 6, childMoodAfter: 7,
    parentEngagement: 8, staffObservations: "Good-natured call. Discussed school project.",
    issuesRaised: [], positiveInteractions: ["School discussion"], followUpNeeded: false,
  },
  {
    id: "c-003", homeId: HOME_ID, childId: "child-alex", childName: "Alex",
    parentId: "parent-michelle", parentName: "Michelle", relationship: "mother",
    contactDate: "2026-05-17", contactType: "supervised", duration: 90,
    supervisedBy: "Lisa Williams (Senior RSW)", location: "Community centre",
    outcome: "positive", childMoodBefore: 6, childMoodAfter: 9, parentEngagement: 9,
    staffObservations: "Excellent supervised session. Michelle brought art supplies.",
    issuesRaised: [], positiveInteractions: ["Art activity", "Walk in park"], followUpNeeded: false,
  },
  {
    id: "c-004", homeId: HOME_ID, childId: "child-alex", childName: "Alex",
    parentId: "parent-michelle", parentName: "Michelle", relationship: "mother",
    contactDate: "2026-05-24", contactType: "video_call", duration: 30,
    location: "Video call (Chamberlain House)", outcome: "positive", childMoodBefore: 7, childMoodAfter: 8,
    parentEngagement: 8, staffObservations: "Alex showed Michelle his room tidy-up.",
    issuesRaised: [], positiveInteractions: ["Room tour", "Planned next visit"],
    followUpNeeded: true, followUpCompleted: true,
  },

  // Jordan (13) + Steve (dad, inconsistent) — 3 contacts
  {
    id: "c-005", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan",
    parentId: "parent-steve", parentName: "Steve", relationship: "father",
    contactDate: "2026-05-04", contactType: "face_to_face", duration: 45,
    location: "Chamberlain House garden", outcome: "neutral", childMoodBefore: 5, childMoodAfter: 5,
    parentEngagement: 4, staffObservations: "Steve seemed distracted, checked phone frequently.",
    issuesRaised: ["Steve late by 20 mins"], positiveInteractions: ["Kicked football briefly"],
    followUpNeeded: true, followUpCompleted: false,
  },
  {
    id: "c-006", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan",
    parentId: "parent-steve", parentName: "Steve", relationship: "father",
    contactDate: "2026-05-11", contactType: "phone", duration: 10,
    location: "Phone (Chamberlain House)", outcome: "parent_no_show", childMoodBefore: 6, childMoodAfter: 4,
    parentEngagement: 0, staffObservations: "Steve did not answer. Jordan visibly upset.",
    issuesRaised: ["Parent no-show", "Jordan became withdrawn"],
    positiveInteractions: [], followUpNeeded: true, followUpCompleted: true,
  },
  {
    id: "c-007", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan",
    parentId: "parent-steve", parentName: "Steve", relationship: "father",
    contactDate: "2026-05-18", contactType: "face_to_face", duration: 60,
    location: "Chamberlain House lounge", outcome: "positive", childMoodBefore: 4, childMoodAfter: 7,
    parentEngagement: 7, staffObservations: "Better session. Steve more present, played PS5 with Jordan.",
    issuesRaised: [], positiveInteractions: ["Gaming together", "Steve apologised for missing call"],
    followUpNeeded: false,
  },

  // Morgan (15) + Karen (mum, highly engaged) — 4 contacts
  {
    id: "c-008", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan",
    parentId: "parent-karen", parentName: "Karen", relationship: "mother",
    contactDate: "2026-05-02", contactType: "face_to_face", duration: 90,
    location: "Chamberlain House lounge", outcome: "positive", childMoodBefore: 7, childMoodAfter: 9,
    parentEngagement: 10, staffObservations: "Karen brought home-cooked meal. Morgan thrilled.",
    issuesRaised: [], positiveInteractions: ["Shared meal", "Discussed college plans"],
    followUpNeeded: false,
  },
  {
    id: "c-009", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan",
    parentId: "parent-karen", parentName: "Karen", relationship: "mother",
    contactDate: "2026-05-09", contactType: "community_outing", duration: 180,
    location: "Local shopping centre", outcome: "positive", childMoodBefore: 8, childMoodAfter: 9,
    parentEngagement: 10, staffObservations: "Positive outing. Karen bought Morgan new clothes for college.",
    issuesRaised: [], positiveInteractions: ["Shopping trip", "Coffee and cake"],
    followUpNeeded: false,
  },
  {
    id: "c-010", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan",
    parentId: "parent-karen", parentName: "Karen", relationship: "mother",
    contactDate: "2026-05-16", contactType: "phone", duration: 40,
    location: "Phone (Morgan's room)", outcome: "positive", childMoodBefore: 7, childMoodAfter: 8,
    parentEngagement: 9, staffObservations: "Long phone call. Morgan discussed friendship worries.",
    issuesRaised: [], positiveInteractions: ["Emotional support from Karen"],
    followUpNeeded: true, followUpCompleted: true,
  },
  {
    id: "c-011", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan",
    parentId: "parent-karen", parentName: "Karen", relationship: "mother",
    contactDate: "2026-05-23", contactType: "face_to_face", duration: 120,
    location: "Chamberlain House and garden", outcome: "positive", childMoodBefore: 6, childMoodAfter: 9,
    parentEngagement: 10, staffObservations: "Karen helped Morgan with revision. Very engaged.",
    issuesRaised: [], positiveInteractions: ["Revision help", "Garden walk", "Plan for half-term"],
    followUpNeeded: false,
  },

  // Morgan + Dave (dad, disengaged) — 1 contact
  {
    id: "c-012", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan",
    parentId: "parent-dave", parentName: "Dave", relationship: "father",
    contactDate: "2026-05-08", contactType: "phone", duration: 5,
    location: "Phone (Chamberlain House)", outcome: "parent_no_show", childMoodBefore: 5, childMoodAfter: 3,
    parentEngagement: 0, staffObservations: "Dave did not answer scheduled call. Morgan said 'typical'.",
    issuesRaised: ["Father consistently unavailable"], positiveInteractions: [],
    followUpNeeded: true, followUpCompleted: false,
  },
];

const DEMO_SUPPORTS: ParentalSupportRecord[] = [
  {
    id: "s-001", homeId: HOME_ID, parentId: "parent-michelle", parentName: "Michelle",
    childId: "child-alex", childName: "Alex", supportType: "transport",
    description: "Weekly taxi provided for face-to-face visits",
    startDate: "2026-01-15", ongoing: true, effectiveness: "effective", referralMade: false,
  },
  {
    id: "s-002", homeId: HOME_ID, parentId: "parent-michelle", parentName: "Michelle",
    childId: "child-alex", childName: "Alex", supportType: "parenting_support",
    description: "Parenting skills course referral",
    startDate: "2026-02-01", endDate: "2026-04-30", ongoing: false, effectiveness: "effective",
    referralMade: true, referralTo: "Local Authority Parenting Team",
  },
  {
    id: "s-003", homeId: HOME_ID, parentId: "parent-steve", parentName: "Steve",
    childId: "child-jordan", childName: "Jordan", supportType: "mediation",
    description: "Family mediation sessions offered",
    startDate: "2026-03-01", ongoing: true, effectiveness: "partially_effective",
    referralMade: true, referralTo: "Family Mediation Service",
  },
  {
    id: "s-004", homeId: HOME_ID, parentId: "parent-steve", parentName: "Steve",
    childId: "child-jordan", childName: "Jordan", supportType: "practical",
    description: "Flexible contact scheduling to accommodate work",
    startDate: "2026-04-01", ongoing: true, effectiveness: "too_early_to_tell",
    referralMade: false,
  },
  {
    id: "s-005", homeId: HOME_ID, parentId: "parent-karen", parentName: "Karen",
    childId: "child-morgan", childName: "Morgan", supportType: "venue",
    description: "Use of community room for extended visits",
    startDate: "2026-01-10", ongoing: true, effectiveness: "effective",
    referralMade: false,
  },
  {
    id: "s-006", homeId: HOME_ID, parentId: "parent-dave", parentName: "Dave",
    childId: "child-morgan", childName: "Morgan", supportType: "therapeutic",
    description: "Therapeutic re-engagement programme offered",
    startDate: "2026-04-15", ongoing: true, effectiveness: "ineffective",
    referralMade: true, referralTo: "Family Reconnect Service",
  },
];

const DEMO_PLANS: FamilyPlanRecord[] = [
  {
    id: "fp-001", homeId: HOME_ID, childId: "child-alex", childName: "Alex",
    planDate: "2026-03-01", reviewDate: "2026-05-01", nextReviewDate: "2026-08-01",
    goalsSet: 4, goalsAchieved: 3, goalsPartiallyAchieved: 1,
    familyInvolved: true, childInvolved: true, professionalInvolved: true,
    barriers: ["Transport from Michelle's area"],
    strengthsIdentified: ["Strong mother-child bond", "Michelle attends all sessions"],
  },
  {
    id: "fp-002", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan",
    planDate: "2026-02-15", reviewDate: "2026-04-15", nextReviewDate: "2026-07-15",
    goalsSet: 5, goalsAchieved: 1, goalsPartiallyAchieved: 2,
    familyInvolved: true, childInvolved: true, professionalInvolved: true,
    barriers: ["Steve's inconsistent availability", "Jordan's ambivalence about contact"],
    strengthsIdentified: ["Jordan does want a relationship with dad"],
  },
  {
    id: "fp-003", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan",
    planDate: "2026-03-15", reviewDate: "2026-05-15", nextReviewDate: "2026-08-15",
    goalsSet: 6, goalsAchieved: 5, goalsPartiallyAchieved: 1,
    familyInvolved: true, childInvolved: true, professionalInvolved: true,
    barriers: ["Dave's non-engagement"],
    strengthsIdentified: ["Karen extremely engaged", "Morgan articulate about needs", "Strong sibling bond"],
  },
];

const DEMO_FEEDBACK: ParentalFeedbackRecord[] = [
  {
    id: "fb-001", homeId: HOME_ID, parentId: "parent-michelle", parentName: "Michelle",
    childId: "child-alex", date: "2026-05-05", satisfactionScore: 9, communicationScore: 8,
    involvementScore: 9, comments: "Staff are brilliant. I always feel welcome.",
    areasForImprovement: [],
    positiveAspects: ["Welcoming environment", "Regular updates from key worker"],
  },
  {
    id: "fb-002", homeId: HOME_ID, parentId: "parent-steve", parentName: "Steve",
    childId: "child-jordan", date: "2026-05-06", satisfactionScore: 5, communicationScore: 4,
    involvementScore: 3, comments: "I feel like I'm always being judged. Hard to engage when you feel watched.",
    areasForImprovement: ["Less formal contact environment", "More flexible scheduling"],
    positiveAspects: ["Jordan seems happy and safe"],
  },
  {
    id: "fb-003", homeId: HOME_ID, parentId: "parent-karen", parentName: "Karen",
    childId: "child-morgan", date: "2026-05-08", satisfactionScore: 10, communicationScore: 9,
    involvementScore: 10, comments: "Could not be happier. The team treat Morgan like family.",
    areasForImprovement: [],
    positiveAspects: ["Exceptional communication", "Genuinely care about Morgan", "Always included in decisions"],
  },
  {
    id: "fb-004", homeId: HOME_ID, parentId: "parent-dave", parentName: "Dave",
    childId: "child-morgan", date: "2026-05-12", satisfactionScore: 3, communicationScore: 3,
    involvementScore: 2, comments: "Don't really know what's going on. Nobody tells me anything.",
    areasForImprovement: ["More communication", "Include me in meetings", "Give me more notice of events"],
    positiveAspects: [],
  },
];

// ── GET ───────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateParentalEngagementIntelligence(
    DEMO_CONTACTS,
    DEMO_SUPPORTS,
    DEMO_PLANS,
    DEMO_FEEDBACK,
    CHILD_IDS,
    HOME_ID,
    PERIOD_START,
    PERIOD_END,
    REFERENCE_DATE,
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        contactTypeLabels: Object.fromEntries(
          (["face_to_face", "phone", "video_call", "letter", "email", "supervised", "community_outing"] as const).map(
            (t) => [t, getContactTypeLabel(t)],
          ),
        ),
        outcomeLabels: Object.fromEntries(
          (["positive", "neutral", "negative", "child_refused", "parent_no_show", "cancelled_by_professional"] as const).map(
            (o) => [o, getContactOutcomeLabel(o)],
          ),
        ),
        engagementLevelLabels: Object.fromEntries(
          (["highly_engaged", "engaged", "inconsistent", "disengaged", "hostile", "no_contact"] as const).map(
            (e) => [e, getEngagementLevelLabel(e)],
          ),
        ),
        supportTypeLabels: Object.fromEntries(
          (["transport", "venue", "mediation", "parenting_support", "therapeutic", "financial", "practical"] as const).map(
            (s) => [s, getSupportTypeLabel(s)],
          ),
        ),
        relationshipLabels: Object.fromEntries(
          (["mother", "father", "step_parent", "grandparent", "sibling", "other"] as const).map(
            (r) => [r, getRelationshipLabel(r)],
          ),
        ),
        effectivenessLabels: Object.fromEntries(
          (["effective", "partially_effective", "ineffective", "too_early_to_tell"] as const).map(
            (e) => [e, getEffectivenessLabel(e)],
          ),
        ),
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
    contacts,
    support,
    plans,
    feedback,
    childIds,
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
  } = body as {
    contacts?: ContactRecord[];
    support?: ParentalSupportRecord[];
    plans?: FamilyPlanRecord[];
    feedback?: ParentalFeedbackRecord[];
    childIds?: string[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
    referenceDate?: string;
  };

  if (!contacts || !Array.isArray(contacts)) {
    return NextResponse.json({ error: "contacts array is required" }, { status: 400 });
  }
  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }
  if (!childIds || !Array.isArray(childIds) || childIds.length === 0) {
    return NextResponse.json({ error: "childIds array is required" }, { status: 400 });
  }

  const result = generateParentalEngagementIntelligence(
    contacts,
    support ?? [],
    plans ?? [],
    feedback ?? [],
    childIds,
    homeId ?? "unknown",
    periodStart,
    periodEnd,
    referenceDate ?? new Date().toISOString().split("T")[0],
  );

  return NextResponse.json({ data: result });
}
