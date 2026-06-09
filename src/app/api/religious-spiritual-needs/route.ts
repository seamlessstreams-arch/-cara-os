// ==============================================================================
// Cornerstone — Religious & Spiritual Needs Intelligence API Route
//
// GET  -> returns Chamberlain House demo intelligence (Alex, Jordan, Morgan, Sam)
// POST -> accepts custom data for any home
// ==============================================================================

import { NextResponse } from "next/server";
import { generateReligiousSpiritualNeedsIntelligence } from "@/lib/religious-spiritual-needs/religious-spiritual-needs-engine";
import type {
  ReligiousSpiritualAssessment,
  ReligiousSupportRecord,
  ReligiousPolicy,
  StaffReligiousTraining,
} from "@/lib/religious-spiritual-needs/religious-spiritual-needs-engine";

// -- Chamberlain House Demo Data ------------------------------------------------------

function getDemoData(): {
  assessments: ReligiousSpiritualAssessment[];
  records: ReligiousSupportRecord[];
  policies: ReligiousPolicy[];
  training: StaffReligiousTraining[];
} {
  const assessments: ReligiousSpiritualAssessment[] = [
    // Alex — Christian (Church of England)
    {
      id: "rsa-alex-01", childId: "child-alex", childName: "Alex",
      assessmentDate: "2026-02-01", assessedBy: "Sarah Thompson",
      faithBackground: "christian", needsIdentified: true,
      preferencesRecorded: true, childViewsSought: true,
      parentCarerConsulted: true, careplanUpdated: true,
    },

    // Jordan — Muslim
    {
      id: "rsa-jordan-01", childId: "child-jordan", childName: "Jordan",
      assessmentDate: "2026-02-15", assessedBy: "Lisa Chen",
      faithBackground: "muslim", needsIdentified: true,
      preferencesRecorded: true, childViewsSought: true,
      parentCarerConsulted: true, careplanUpdated: true,
    },

    // Morgan — Buddhist
    {
      id: "rsa-morgan-01", childId: "child-morgan", childName: "Morgan",
      assessmentDate: "2026-03-01", assessedBy: "Lisa Chen",
      faithBackground: "buddhist", needsIdentified: true,
      preferencesRecorded: true, childViewsSought: true,
      parentCarerConsulted: true, careplanUpdated: false,
    },

    // Sam — No faith
    {
      id: "rsa-sam-01", childId: "child-sam", childName: "Sam",
      assessmentDate: "2026-03-10", assessedBy: "Sarah Thompson",
      faithBackground: "no_faith", needsIdentified: true,
      preferencesRecorded: true, childViewsSought: true,
      parentCarerConsulted: false, careplanUpdated: true,
    },
  ];

  const records: ReligiousSupportRecord[] = [
    // Alex — Sunday church service
    {
      id: "rsr-alex-01", childId: "child-alex", childName: "Alex",
      supportDate: "2026-02-10", supportType: "worship_access",
      facilitated: true, childSatisfied: true,
      frequency: "weekly", culturallyAppropriate: true,
    },
    {
      id: "rsr-alex-02", childId: "child-alex", childName: "Alex",
      supportDate: "2026-04-20", supportType: "festival_celebration",
      facilitated: true, childSatisfied: true,
      frequency: "occasionally", culturallyAppropriate: true,
    },

    // Jordan — Friday prayers, halal diet, Ramadan, prayer space, imam contact
    {
      id: "rsr-jordan-01", childId: "child-jordan", childName: "Jordan",
      supportDate: "2026-02-20", supportType: "worship_access",
      facilitated: true, childSatisfied: true,
      frequency: "weekly", culturallyAppropriate: true,
    },
    {
      id: "rsr-jordan-02", childId: "child-jordan", childName: "Jordan",
      supportDate: "2026-02-20", supportType: "dietary_observance",
      facilitated: true, childSatisfied: true,
      frequency: "daily", culturallyAppropriate: true,
    },
    {
      id: "rsr-jordan-03", childId: "child-jordan", childName: "Jordan",
      supportDate: "2026-03-15", supportType: "festival_celebration",
      facilitated: true, childSatisfied: true,
      frequency: "monthly", culturallyAppropriate: true,
    },
    {
      id: "rsr-jordan-04", childId: "child-jordan", childName: "Jordan",
      supportDate: "2026-02-20", supportType: "prayer_space",
      facilitated: true, childSatisfied: true,
      frequency: "daily", culturallyAppropriate: true,
    },
    {
      id: "rsr-jordan-05", childId: "child-jordan", childName: "Jordan",
      supportDate: "2026-03-01", supportType: "faith_leader_contact",
      facilitated: true, childSatisfied: true,
      frequency: "monthly", culturallyAppropriate: true,
    },

    // Morgan — meditation, Vesak
    {
      id: "rsr-morgan-01", childId: "child-morgan", childName: "Morgan",
      supportDate: "2026-03-05", supportType: "worship_access",
      facilitated: true, childSatisfied: true,
      frequency: "weekly", culturallyAppropriate: true,
    },
    {
      id: "rsr-morgan-02", childId: "child-morgan", childName: "Morgan",
      supportDate: "2026-05-12", supportType: "festival_celebration",
      facilitated: true, childSatisfied: false,
      frequency: "occasionally", culturallyAppropriate: true,
    },
  ];

  const policies: ReligiousPolicy[] = [
    {
      id: "rp-oak-01",
      faithNeedsAssessedOnAdmission: true,
      worshipAccessProvided: true,
      dietaryObservanceMet: true,
      festivalRecognition: true,
      faithLeaderAccess: true,
      prayerSpaceAvailable: true,
      antiDiscriminationTraining: true,
    },
  ];

  const training: StaffReligiousTraining[] = [
    {
      id: "srt-sarah-01", staffId: "staff-sarah", staffName: "Sarah Thompson",
      faithAwareness: true, culturalCompetence: true, dietaryRequirements: true,
      festivalKnowledge: true, antiDiscrimination: true, childViewsAdvocacy: true,
    },
    {
      id: "srt-tom-01", staffId: "staff-tom", staffName: "Tom Williams",
      faithAwareness: true, culturalCompetence: true, dietaryRequirements: false,
      festivalKnowledge: false, antiDiscrimination: true, childViewsAdvocacy: false,
    },
    {
      id: "srt-lisa-01", staffId: "staff-lisa", staffName: "Lisa Chen",
      faithAwareness: true, culturalCompetence: true, dietaryRequirements: true,
      festivalKnowledge: true, antiDiscrimination: true, childViewsAdvocacy: true,
    },
  ];

  return { assessments, records, policies, training };
}

// -- GET Handler --------------------------------------------------------------

export async function GET() {
  try {
    const { assessments, records, policies, training } = getDemoData();
    const result = generateReligiousSpiritualNeedsIntelligence(
      assessments,
      records,
      policies,
      training,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate religious & spiritual needs intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// -- POST Handler -------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      assessments, records, policies, training,
      homeId, periodStart, periodEnd,
    } = body;

    if (
      !assessments || !records || !policies || !training ||
      !homeId || !periodStart || !periodEnd
    ) {
      return NextResponse.json(
        { error: "Missing required fields: assessments, records, policies, training, homeId, periodStart, periodEnd" },
        { status: 400 },
      );
    }

    if (
      !Array.isArray(assessments) || !Array.isArray(records) ||
      !Array.isArray(policies) || !Array.isArray(training)
    ) {
      return NextResponse.json(
        { error: "assessments, records, policies, and training must be arrays" },
        { status: 400 },
      );
    }

    const result = generateReligiousSpiritualNeedsIntelligence(
      assessments, records, policies, training,
      homeId, periodStart, periodEnd,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process religious & spiritual needs data", details: String(error) },
      { status: 500 },
    );
  }
}
