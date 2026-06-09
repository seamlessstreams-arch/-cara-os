// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Communication & Accessibility Intelligence API Route
//
// GET  → returns Chamberlain House demo communication & accessibility intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generateCommunicationAccessibilityIntelligence } from "@/lib/communication-accessibility/communication-accessibility-engine";
import type {
  ChildCommunicationProfile,
  CommunicationAssessment,
  AccessibleDocument,
  CommunicationTraining,
} from "@/lib/communication-accessibility/communication-accessibility-engine";

// ── Chamberlain House Demo Data ─────────────────────────────────────────────────────

const CHILD_IDS = ["alex", "jordan", "morgan"];
const CHILD_NAMES: Record<string, string> = {
  alex: "Alex",
  jordan: "Jordan",
  morgan: "Morgan",
};
const STAFF_IDS = ["staff-01", "staff-02", "staff-03"];

function getDemoData() {
  // Alex: speech & language needs, receiving speech therapy
  // Jordan: no significant communication needs
  // Morgan: EAL + autism, requires interpreter and visual aids
  const profiles: ChildCommunicationProfile[] = [
    {
      childId: "alex",
      childName: "Alex",
      communicationNeeds: ["speech_language"],
      primaryLanguage: "English",
      interpreterRequired: false,
      currentSupports: ["speech_therapy", "makaton"],
      speechTherapyAccess: true,
      lastSLTDate: "2025-04-10",
      communicationPassport: true,
      staffTrainedInNeeds: true,
    },
    {
      childId: "jordan",
      childName: "Jordan",
      communicationNeeds: [],
      primaryLanguage: "English",
      interpreterRequired: false,
      currentSupports: [],
      speechTherapyAccess: false,
      communicationPassport: false,
      staffTrainedInNeeds: true,
    },
    {
      childId: "morgan",
      childName: "Morgan",
      communicationNeeds: ["eal", "autism"],
      primaryLanguage: "Arabic",
      interpreterRequired: true,
      currentSupports: ["interpreter", "visual_aids", "social_stories"],
      speechTherapyAccess: false,
      communicationPassport: true,
      staffTrainedInNeeds: false,
    },
  ];

  const assessments: CommunicationAssessment[] = [
    {
      id: "ca-01",
      homeId: "oak-house",
      childId: "alex",
      childName: "Alex",
      assessmentDate: "2025-03-15",
      assessedBy: "Sarah Thompson (SLT)",
      needsIdentified: ["speech_language"],
      supportsRecommended: ["speech_therapy", "makaton", "visual_aids"],
      supportsInPlace: ["speech_therapy", "makaton"],
      engagementLevel: "fully_engaged",
      childView: "I like my speech sessions, they help me talk better",
    },
    {
      id: "ca-02",
      homeId: "oak-house",
      childId: "jordan",
      childName: "Jordan",
      assessmentDate: "2025-03-20",
      assessedBy: "Mark Davies (Key Worker)",
      needsIdentified: [],
      supportsRecommended: [],
      supportsInPlace: [],
      engagementLevel: "fully_engaged",
      childView: "I can talk to anyone when I need to",
    },
    {
      id: "ca-03",
      homeId: "oak-house",
      childId: "morgan",
      childName: "Morgan",
      assessmentDate: "2025-02-28",
      assessedBy: "Dr Amira Hassan (EP)",
      needsIdentified: ["eal", "autism"],
      supportsRecommended: [
        "interpreter",
        "visual_aids",
        "social_stories",
        "translation",
      ],
      supportsInPlace: ["interpreter", "visual_aids", "social_stories"],
      engagementLevel: "partially_engaged",
      childView: "Sometimes it is hard to understand what people say",
    },
  ];

  const documents: AccessibleDocument[] = [
    {
      id: "doc-01",
      homeId: "oak-house",
      documentType: "childrens_guide",
      formatsAvailable: ["standard", "easy_read", "pictorial", "translated"],
      lastUpdated: "2025-01-15",
    },
    {
      id: "doc-02",
      homeId: "oak-house",
      documentType: "complaints_procedure",
      formatsAvailable: ["standard", "easy_read", "pictorial"],
      lastUpdated: "2025-02-01",
    },
    {
      id: "doc-03",
      homeId: "oak-house",
      documentType: "house_rules",
      formatsAvailable: ["standard", "easy_read", "pictorial", "translated"],
      lastUpdated: "2025-01-20",
    },
    {
      id: "doc-04",
      homeId: "oak-house",
      documentType: "key_info",
      formatsAvailable: ["standard", "large_print"],
      lastUpdated: "2025-03-01",
    },
    {
      id: "doc-05",
      homeId: "oak-house",
      documentType: "health_plan",
      formatsAvailable: ["standard"],
      lastUpdated: "2025-02-15",
    },
  ];

  const training: CommunicationTraining[] = [
    {
      staffId: "staff-01",
      staffName: "Claire Robinson",
      trainingType: "makaton",
      completionDate: "2024-09-15",
      expiryDate: "2026-09-15",
    },
    {
      staffId: "staff-01",
      staffName: "Claire Robinson",
      trainingType: "autism_communication",
      completionDate: "2024-11-01",
      expiryDate: "2026-11-01",
    },
    {
      staffId: "staff-02",
      staffName: "James Patel",
      trainingType: "eal_support",
      completionDate: "2025-01-10",
      expiryDate: "2027-01-10",
    },
    {
      staffId: "staff-02",
      staffName: "James Patel",
      trainingType: "trauma_informed_communication",
      completionDate: "2024-06-15",
      expiryDate: "2026-06-15",
    },
    {
      staffId: "staff-03",
      staffName: "Fatima Al-Rashid",
      trainingType: "deaf_awareness",
      completionDate: "2024-08-20",
      expiryDate: "2026-08-20",
    },
    {
      staffId: "staff-03",
      staffName: "Fatima Al-Rashid",
      trainingType: "easy_read_creation",
      completionDate: "2025-02-01",
      expiryDate: "2027-02-01",
    },
  ];

  return { profiles, assessments, documents, training };
}

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { profiles, assessments, documents, training } = getDemoData();
    const referenceDate = new Date().toISOString().split("T")[0];
    const result = generateCommunicationAccessibilityIntelligence(
      profiles,
      assessments,
      documents,
      training,
      CHILD_IDS,
      CHILD_NAMES,
      STAFF_IDS,
      "oak-house",
      "2025-01-01",
      "2025-06-30",
      referenceDate,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to generate communication & accessibility intelligence",
        details: String(error),
      },
      { status: 500 },
    );
  }
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      profiles,
      assessments,
      documents,
      training,
      childIds,
      childNames,
      staffIds,
      homeId,
      periodStart,
      periodEnd,
      referenceDate,
    } = body;

    if (
      !profiles ||
      !assessments ||
      !documents ||
      !training ||
      !childIds ||
      !childNames ||
      !staffIds ||
      !homeId ||
      !periodStart ||
      !periodEnd ||
      !referenceDate
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: profiles, assessments, documents, training, childIds, childNames, staffIds, homeId, periodStart, periodEnd, referenceDate",
        },
        { status: 400 },
      );
    }

    if (
      !Array.isArray(profiles) ||
      !Array.isArray(assessments) ||
      !Array.isArray(documents) ||
      !Array.isArray(training) ||
      !Array.isArray(childIds) ||
      !Array.isArray(staffIds)
    ) {
      return NextResponse.json(
        {
          error:
            "profiles, assessments, documents, training, childIds, and staffIds must be arrays",
        },
        { status: 400 },
      );
    }

    if (typeof childNames !== "object" || childNames === null) {
      return NextResponse.json(
        { error: "childNames must be an object" },
        { status: 400 },
      );
    }

    const result = generateCommunicationAccessibilityIntelligence(
      profiles,
      assessments,
      documents,
      training,
      childIds,
      childNames,
      staffIds,
      homeId,
      periodStart,
      periodEnd,
      referenceDate,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process communication & accessibility data",
        details: String(error),
      },
      { status: 500 },
    );
  }
}
