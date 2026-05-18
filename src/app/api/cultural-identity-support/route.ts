// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Cultural Identity Support Intelligence API Route
//
// GET  → returns Oak House demo intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generateCulturalIdentitySupportIntelligence } from "@/lib/cultural-identity-support/cultural-identity-support-engine";
import type {
  IdentityAssessment,
  CulturalActivity,
  DietaryNeedRecord,
  StaffCulturalCompetence,
} from "@/lib/cultural-identity-support/cultural-identity-support-engine";

// ── Oak House Demo Data ────────────────────────────────────────────────────

function getDemoData(): {
  assessments: IdentityAssessment[];
  activities: CulturalActivity[];
  dietaryRecords: DietaryNeedRecord[];
  staffCompetences: StaffCulturalCompetence[];
} {
  const assessments: IdentityAssessment[] = [
    // Alex — White British, Church of England
    {
      id: "ia-alex-01", childId: "child-alex", childName: "Alex",
      dimension: "ethnicity", supportLevel: "fully_supported",
      assessedDate: "2026-02-01", assessedBy: "Sarah Thompson",
      childViewsSought: true, needsIdentified: null, planInPlace: false,
    },
    {
      id: "ia-alex-02", childId: "child-alex", childName: "Alex",
      dimension: "religion", supportLevel: "fully_supported",
      assessedDate: "2026-02-01", assessedBy: "Sarah Thompson",
      childViewsSought: true, needsIdentified: "Wishes to attend church on Sundays", planInPlace: true,
    },
    {
      id: "ia-alex-03", childId: "child-alex", childName: "Alex",
      dimension: "heritage", supportLevel: "mostly_supported",
      assessedDate: "2026-02-01", assessedBy: "Sarah Thompson",
      childViewsSought: true, needsIdentified: "Wants to learn about family history", planInPlace: true,
    },
    {
      id: "ia-alex-04", childId: "child-alex", childName: "Alex",
      dimension: "family_traditions", supportLevel: "fully_supported",
      assessedDate: "2026-02-01", assessedBy: "Sarah Thompson",
      childViewsSought: true, needsIdentified: null, planInPlace: false,
    },

    // Jordan — Black Caribbean, Rastafarian
    {
      id: "ia-jordan-01", childId: "child-jordan", childName: "Jordan",
      dimension: "ethnicity", supportLevel: "mostly_supported",
      assessedDate: "2026-02-15", assessedBy: "Sarah Thompson",
      childViewsSought: true, needsIdentified: "Needs access to Black Caribbean community and role models", planInPlace: true,
    },
    {
      id: "ia-jordan-02", childId: "child-jordan", childName: "Jordan",
      dimension: "religion", supportLevel: "partially_supported",
      assessedDate: "2026-02-15", assessedBy: "Sarah Thompson",
      childViewsSought: true, needsIdentified: "Rastafarian faith needs — livity, meditation, music", planInPlace: true,
    },
    {
      id: "ia-jordan-03", childId: "child-jordan", childName: "Jordan",
      dimension: "language", supportLevel: "mostly_supported",
      assessedDate: "2026-02-15", assessedBy: "Sarah Thompson",
      childViewsSought: true, needsIdentified: "Jamaican Patois — maintain connection to heritage language", planInPlace: true,
    },
    {
      id: "ia-jordan-04", childId: "child-jordan", childName: "Jordan",
      dimension: "heritage", supportLevel: "mostly_supported",
      assessedDate: "2026-02-15", assessedBy: "Sarah Thompson",
      childViewsSought: true, needsIdentified: "Caribbean heritage exploration", planInPlace: true,
    },
    {
      id: "ia-jordan-05", childId: "child-jordan", childName: "Jordan",
      dimension: "nationality", supportLevel: "fully_supported",
      assessedDate: "2026-02-15", assessedBy: "Sarah Thompson",
      childViewsSought: true, needsIdentified: null, planInPlace: false,
    },

    // Morgan — Mixed heritage White/Asian, Buddhist
    {
      id: "ia-morgan-01", childId: "child-morgan", childName: "Morgan",
      dimension: "ethnicity", supportLevel: "fully_supported",
      assessedDate: "2026-03-01", assessedBy: "Lisa Chen",
      childViewsSought: true, needsIdentified: "Dual heritage — needs support exploring both sides", planInPlace: true,
    },
    {
      id: "ia-morgan-02", childId: "child-morgan", childName: "Morgan",
      dimension: "religion", supportLevel: "fully_supported",
      assessedDate: "2026-03-01", assessedBy: "Lisa Chen",
      childViewsSought: true, needsIdentified: "Buddhist practice — meditation and mindfulness", planInPlace: true,
    },
    {
      id: "ia-morgan-03", childId: "child-morgan", childName: "Morgan",
      dimension: "heritage", supportLevel: "fully_supported",
      assessedDate: "2026-03-01", assessedBy: "Lisa Chen",
      childViewsSought: true, needsIdentified: "Asian heritage exploration and family connection", planInPlace: true,
    },
    {
      id: "ia-morgan-04", childId: "child-morgan", childName: "Morgan",
      dimension: "family_traditions", supportLevel: "mostly_supported",
      assessedDate: "2026-03-01", assessedBy: "Lisa Chen",
      childViewsSought: true, needsIdentified: "Maintain family food traditions", planInPlace: true,
    },
  ];

  const activities: CulturalActivity[] = [
    // Alex — Church attendance, heritage activity
    {
      id: "ca-alex-01", childId: "child-alex", childName: "Alex",
      activityType: "religious_observance", date: "2026-02-10",
      description: "Sunday church service at local CofE parish",
      childChose: true, childEnjoyedIt: true, staffFacilitated: true, communityLink: true,
    },
    {
      id: "ca-alex-02", childId: "child-alex", childName: "Alex",
      activityType: "heritage_exploration", date: "2026-03-05",
      description: "Visit to local history museum — family tree project",
      childChose: true, childEnjoyedIt: true, staffFacilitated: true, communityLink: true,
    },
    {
      id: "ca-alex-03", childId: "child-alex", childName: "Alex",
      activityType: "life_story", date: "2026-03-15",
      description: "Life story session with key worker — exploring family heritage",
      childChose: false, childEnjoyedIt: true, staffFacilitated: true, communityLink: false,
    },

    // Jordan — Cultural celebrations, community connection, language
    {
      id: "ca-jordan-01", childId: "child-jordan", childName: "Jordan",
      activityType: "cultural_celebration", date: "2026-02-20",
      description: "Caribbean carnival preparation and community event",
      childChose: true, childEnjoyedIt: true, staffFacilitated: true, communityLink: true,
    },
    {
      id: "ca-jordan-02", childId: "child-jordan", childName: "Jordan",
      activityType: "community_connection", date: "2026-03-01",
      description: "Visit to local Black Caribbean community centre",
      childChose: true, childEnjoyedIt: true, staffFacilitated: true, communityLink: true,
    },
    {
      id: "ca-jordan-03", childId: "child-jordan", childName: "Jordan",
      activityType: "food_preparation", date: "2026-03-10",
      description: "Cooking ital Caribbean food with community volunteer",
      childChose: true, childEnjoyedIt: true, staffFacilitated: true, communityLink: true,
    },
    {
      id: "ca-jordan-04", childId: "child-jordan", childName: "Jordan",
      activityType: "language_maintenance", date: "2026-03-20",
      description: "Patois language session with community elder",
      childChose: true, childEnjoyedIt: true, staffFacilitated: true, communityLink: true,
    },

    // Morgan — Cultural celebrations, Buddhist practice, heritage
    {
      id: "ca-morgan-01", childId: "child-morgan", childName: "Morgan",
      activityType: "religious_observance", date: "2026-02-15",
      description: "Meditation session at local Buddhist temple",
      childChose: true, childEnjoyedIt: true, staffFacilitated: true, communityLink: true,
    },
    {
      id: "ca-morgan-02", childId: "child-morgan", childName: "Morgan",
      activityType: "cultural_celebration", date: "2026-02-28",
      description: "Lunar New Year celebration with Asian community group",
      childChose: true, childEnjoyedIt: true, staffFacilitated: true, communityLink: true,
    },
    {
      id: "ca-morgan-03", childId: "child-morgan", childName: "Morgan",
      activityType: "heritage_exploration", date: "2026-03-12",
      description: "Visit to Asian cultural exhibition",
      childChose: true, childEnjoyedIt: true, staffFacilitated: true, communityLink: true,
    },
    {
      id: "ca-morgan-04", childId: "child-morgan", childName: "Morgan",
      activityType: "identity_work", date: "2026-03-25",
      description: "1:1 identity work session exploring dual heritage with key worker",
      childChose: false, childEnjoyedIt: true, staffFacilitated: true, communityLink: false,
    },
  ];

  const dietaryRecords: DietaryNeedRecord[] = [
    // Alex — no specific dietary needs
    {
      id: "dr-alex-01", childId: "child-alex", childName: "Alex",
      dietaryRequirement: "No specific cultural dietary needs",
      provision: "not_applicable", reviewDate: "2026-02-01", childSatisfied: true,
    },

    // Jordan — Ital food (Rastafarian diet)
    {
      id: "dr-jordan-01", childId: "child-jordan", childName: "Jordan",
      dietaryRequirement: "Ital food — natural, unprocessed, plant-based Rastafarian diet",
      provision: "mostly_met", reviewDate: "2026-03-01", childSatisfied: true,
    },

    // Morgan — Vegetarian (Buddhist)
    {
      id: "dr-morgan-01", childId: "child-morgan", childName: "Morgan",
      dietaryRequirement: "Vegetarian — Buddhist practice",
      provision: "fully_met", reviewDate: "2026-03-01", childSatisfied: true,
    },
  ];

  const staffCompetences: StaffCulturalCompetence[] = [
    {
      id: "sc-sarah-01", staffId: "staff-sarah", staffName: "Sarah Thompson",
      competenceLevel: "competent",
      trainingCompleted: ["Cultural Awareness", "Equality & Diversity", "Anti-Racist Practice"],
      lastTrainingDate: "2026-01-15",
      canSupportLanguage: false, understandsFaithNeeds: true, antiRacistPractice: true,
    },
    {
      id: "sc-tom-01", staffId: "staff-tom", staffName: "Tom Williams",
      competenceLevel: "developing",
      trainingCompleted: ["Equality & Diversity"],
      lastTrainingDate: "2025-11-01",
      canSupportLanguage: false, understandsFaithNeeds: false, antiRacistPractice: true,
    },
    {
      id: "sc-lisa-01", staffId: "staff-lisa", staffName: "Lisa Chen",
      competenceLevel: "advanced",
      trainingCompleted: ["Cultural Awareness", "Equality & Diversity", "Anti-Racist Practice", "Faith Awareness", "Language Support"],
      lastTrainingDate: "2026-02-01",
      canSupportLanguage: true, understandsFaithNeeds: true, antiRacistPractice: true,
    },
  ];

  return { assessments, activities, dietaryRecords, staffCompetences };
}

// ── GET Handler ──────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { assessments, activities, dietaryRecords, staffCompetences } = getDemoData();
    const result = generateCulturalIdentitySupportIntelligence(
      assessments,
      activities,
      dietaryRecords,
      staffCompetences,
      "oak-house",
      "2026-01-01",
      "2026-05-18",
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate cultural identity support intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { assessments, activities, dietaryRecords, staffCompetences, homeId, periodStart, periodEnd } = body;

    if (!assessments || !activities || !dietaryRecords || !staffCompetences || !homeId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: "Missing required fields: assessments, activities, dietaryRecords, staffCompetences, homeId, periodStart, periodEnd" },
        { status: 400 },
      );
    }

    if (!Array.isArray(assessments) || !Array.isArray(activities) || !Array.isArray(dietaryRecords) || !Array.isArray(staffCompetences)) {
      return NextResponse.json(
        { error: "assessments, activities, dietaryRecords, and staffCompetences must be arrays" },
        { status: 400 },
      );
    }

    const result = generateCulturalIdentitySupportIntelligence(
      assessments, activities, dietaryRecords, staffCompetences,
      homeId, periodStart, periodEnd,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process cultural identity support data", details: String(error) },
      { status: 500 },
    );
  }
}
