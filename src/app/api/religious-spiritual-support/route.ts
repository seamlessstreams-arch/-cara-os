// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Religious & Spiritual Support Intelligence API Route
//
// GET  → returns Oak House demo intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generateReligiousSpiritualSupportIntelligence } from "@/lib/religious-spiritual-support/religious-spiritual-support-engine";
import type {
  ChildFaithProfile,
  ReligiousSupportActivity,
  FestivalObservance,
  StaffDiversityTraining,
} from "@/lib/religious-spiritual-support/religious-spiritual-support-engine";

// ── Oak House Demo Data ────────────────────────────────────────────────────

function getDemoData(): {
  profiles: ChildFaithProfile[];
  activities: ReligiousSupportActivity[];
  festivals: FestivalObservance[];
  staff: StaffDiversityTraining[];
} {
  const profiles: ChildFaithProfile[] = [
    // Alex — Christianity, interested, attends church monthly
    {
      id: "fp-alex-01",
      childId: "child-alex",
      childName: "Alex",
      faithBackground: "christianity",
      childPreference: "interested",
      needsAssessed: true,
      needsDocumented: true,
      supportPlanInPlace: true,
      lastReviewDate: "2026-04-15",
      reviewDue: false,
    },
    // Jordan — Islam, actively practising, halal diet, Friday prayers
    {
      id: "fp-jordan-01",
      childId: "child-jordan",
      childName: "Jordan",
      faithBackground: "islam",
      childPreference: "actively_practising",
      needsAssessed: true,
      needsDocumented: true,
      supportPlanInPlace: true,
      lastReviewDate: "2026-04-20",
      reviewDue: false,
    },
    // Morgan — No religion, indifferent
    {
      id: "fp-morgan-01",
      childId: "child-morgan",
      childName: "Morgan",
      faithBackground: "no_religion",
      childPreference: "indifferent",
      needsAssessed: true,
      needsDocumented: true,
      supportPlanInPlace: false,
      lastReviewDate: "2026-03-01",
      reviewDue: false,
    },
  ];

  const activities: ReligiousSupportActivity[] = [
    // Alex — church attendance
    {
      id: "rsa-alex-01",
      childId: "child-alex",
      childName: "Alex",
      date: "2026-03-10",
      supportType: "worship_access",
      quality: "good",
      childInitiated: true,
      childFeedbackPositive: true,
      facilitatedBy: "Sarah Johnson",
    },
    // Jordan — Friday prayers
    {
      id: "rsa-jordan-01",
      childId: "child-jordan",
      childName: "Jordan",
      date: "2026-03-14",
      supportType: "worship_access",
      quality: "excellent",
      childInitiated: true,
      childFeedbackPositive: true,
      facilitatedBy: "Darren Laville",
    },
    // Jordan — halal dietary observance
    {
      id: "rsa-jordan-02",
      childId: "child-jordan",
      childName: "Jordan",
      date: "2026-03-15",
      supportType: "dietary_observance",
      quality: "excellent",
      childInitiated: false,
      childFeedbackPositive: true,
      facilitatedBy: "Lisa Williams",
    },
    // Jordan — faith leader contact
    {
      id: "rsa-jordan-03",
      childId: "child-jordan",
      childName: "Jordan",
      date: "2026-04-01",
      supportType: "faith_leader_contact",
      quality: "good",
      childInitiated: true,
      childFeedbackPositive: true,
      facilitatedBy: "Tom Richards",
    },
    // Alex — pastoral support
    {
      id: "rsa-alex-02",
      childId: "child-alex",
      childName: "Alex",
      date: "2026-04-05",
      supportType: "pastoral_support",
      quality: "good",
      childInitiated: false,
      childFeedbackPositive: null,
      facilitatedBy: "Sarah Johnson",
    },
  ];

  const festivals: FestivalObservance[] = [
    // Jordan — Eid al-Fitr
    {
      id: "fo-jordan-01",
      childId: "child-jordan",
      childName: "Jordan",
      festivalName: "Eid al-Fitr",
      date: "2026-03-31",
      observed: true,
      childInvolved: true,
      culturallyAppropriate: true,
    },
    // Alex — Easter
    {
      id: "fo-alex-01",
      childId: "child-alex",
      childName: "Alex",
      festivalName: "Easter",
      date: "2026-04-05",
      observed: true,
      childInvolved: true,
      culturallyAppropriate: true,
    },
  ];

  const staff: StaffDiversityTraining[] = [
    {
      id: "sdt-sarah-01",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      faithAwareness: true,
      culturalCompetence: true,
      antiDiscrimination: true,
      childRightsTraining: true,
    },
    {
      id: "sdt-tom-01",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      faithAwareness: true,
      culturalCompetence: true,
      antiDiscrimination: true,
      childRightsTraining: false,
    },
    {
      id: "sdt-lisa-01",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      faithAwareness: true,
      culturalCompetence: true,
      antiDiscrimination: true,
      childRightsTraining: true,
    },
    {
      id: "sdt-darren-01",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      faithAwareness: true,
      culturalCompetence: true,
      antiDiscrimination: true,
      childRightsTraining: true,
    },
  ];

  return { profiles, activities, festivals, staff };
}

// ── GET Handler ──────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { profiles, activities, festivals, staff } = getDemoData();
    const result = generateReligiousSpiritualSupportIntelligence(
      profiles,
      activities,
      festivals,
      staff,
      "oak-house",
      "2026-01-01",
      "2026-05-18",
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate religious spiritual support intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profiles, activities, festivals, staff, homeId, periodStart, periodEnd } = body;

    if (!profiles || !activities || !festivals || !staff || !homeId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: "Missing required fields: profiles, activities, festivals, staff, homeId, periodStart, periodEnd" },
        { status: 400 },
      );
    }

    if (!Array.isArray(profiles) || !Array.isArray(activities) || !Array.isArray(festivals) || !Array.isArray(staff)) {
      return NextResponse.json(
        { error: "profiles, activities, festivals, and staff must be arrays" },
        { status: 400 },
      );
    }

    const result = generateReligiousSpiritualSupportIntelligence(
      profiles, activities, festivals, staff,
      homeId, periodStart, periodEnd,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process religious spiritual support data", details: String(error) },
      { status: 500 },
    );
  }
}
