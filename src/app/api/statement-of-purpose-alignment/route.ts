// ==============================================================================
// Cornerstone -- Statement of Purpose Alignment Intelligence API Route
//
// GET  -> returns Oak House demo SoP alignment intelligence
// POST -> accepts custom data for any home
// ==============================================================================

import { NextResponse } from "next/server";
import { generateStatementOfPurposeAlignmentIntelligence } from "@/lib/statement-of-purpose-alignment/statement-of-purpose-alignment-engine";
import type {
  SoPAlignmentAssessment,
  SoPReviewRecord,
  StakeholderFeedback,
  OfstedRecommendation,
  SoPSection,
  AlignmentLevel,
  EvidenceQuality,
  StakeholderType,
} from "@/lib/statement-of-purpose-alignment/statement-of-purpose-alignment-engine";

// -- Oak House Demo Data ------------------------------------------------------

function getDemoData() {
  const sections: SoPSection[] = [
    "ethos_values", "care_approach", "admission_criteria", "staffing_model",
    "education_support", "health_wellbeing", "behaviour_management",
    "safeguarding", "family_contact", "transition_planning",
    "location_community", "complaints_procedure",
  ];

  // 12 section assessments: mostly aligned with some partial
  const alignmentLevels: AlignmentLevel[] = [
    "fully_aligned",      // ethos_values
    "fully_aligned",      // care_approach
    "mostly_aligned",     // admission_criteria
    "fully_aligned",      // staffing_model
    "mostly_aligned",     // education_support
    "fully_aligned",      // health_wellbeing
    "fully_aligned",      // behaviour_management
    "fully_aligned",      // safeguarding
    "partially_aligned",  // family_contact
    "mostly_aligned",     // transition_planning
    "fully_aligned",      // location_community
    "partially_aligned",  // complaints_procedure
  ];

  const evidenceQualities: EvidenceQuality[] = [
    "strong",    // ethos_values
    "strong",    // care_approach
    "adequate",  // admission_criteria
    "strong",    // staffing_model
    "adequate",  // education_support
    "strong",    // health_wellbeing
    "adequate",  // behaviour_management
    "strong",    // safeguarding
    "limited",   // family_contact
    "adequate",  // transition_planning
    "strong",    // location_community
    "limited",   // complaints_procedure
  ];

  const assessments: SoPAlignmentAssessment[] = sections.map((section, i) => ({
    id: `sa-${String(i + 1).padStart(2, "0")}`,
    section,
    alignmentLevel: alignmentLevels[i],
    assessedDate: "2025-03-15",
    assessedBy: "Registered Manager",
    evidenceQuality: evidenceQualities[i],
    evidenceDescription: `Assessment of ${section.replace(/_/g, " ")} alignment documented through observation and records`,
    actionRequired: alignmentLevels[i] === "partially_aligned",
    actionTaken: alignmentLevels[i] === "partially_aligned" ? false : null,
  }));

  // 2 reviews: 1 current, 1 recent (due_for_review)
  const reviews: SoPReviewRecord[] = [
    {
      id: "sr-01",
      reviewDate: "2025-02-01",
      reviewedBy: "Registered Manager",
      sopVersion: "4.1",
      allSectionsReviewed: true,
      childrenConsulted: true,
      staffConsulted: true,
      regulatoryChangesIncorporated: true,
      ofstedRecommendationsAddressed: true,
      status: "current",
    },
    {
      id: "sr-02",
      reviewDate: "2024-08-15",
      reviewedBy: "Deputy Manager",
      sopVersion: "4.0",
      allSectionsReviewed: true,
      childrenConsulted: true,
      staffConsulted: false,
      regulatoryChangesIncorporated: true,
      ofstedRecommendationsAddressed: true,
      status: "due_for_review",
    },
  ];

  // Stakeholder feedback from mix of roles
  const stakeholderTypes: StakeholderType[] = [
    "child", "child", "staff", "staff", "social_worker",
    "family", "reg44_visitor", "manager",
  ];

  const stakeholderFeedback: StakeholderFeedback[] = stakeholderTypes.map((type, i) => ({
    id: `sf-${String(i + 1).padStart(2, "0")}`,
    stakeholderType: type,
    date: "2025-03-20",
    awareOfSoP: i < 7, // 7 of 8 aware
    sopReflectsReality: i < 6, // 6 of 8 reflect reality
    valuesEvident: i < 7, // 7 of 8 values evident
    suggestionsProvided: i === 0 || i === 2 || i === 6, // 3 provided suggestions
  }));

  // 2 Ofsted recommendations: 1 addressed, 1 not yet
  const ofstedRecommendations: OfstedRecommendation[] = [
    {
      id: "or-01",
      inspectionDate: "2024-11-20",
      recommendation: "Ensure the Statement of Purpose reflects the updated behaviour management approach",
      relatedSection: "behaviour_management",
      addressed: true,
      evidenceOfChange: true,
    },
    {
      id: "or-02",
      inspectionDate: "2024-11-20",
      recommendation: "Strengthen consultation with children and families when reviewing the Statement of Purpose",
      relatedSection: "family_contact",
      addressed: false,
      evidenceOfChange: false,
    },
  ];

  return { assessments, reviews, stakeholderFeedback, ofstedRecommendations };
}

// -- GET Handler --------------------------------------------------------------

export async function GET() {
  try {
    const { assessments, reviews, stakeholderFeedback, ofstedRecommendations } = getDemoData();
    const result = generateStatementOfPurposeAlignmentIntelligence(
      assessments,
      reviews,
      stakeholderFeedback,
      ofstedRecommendations,
      "oak-house",
      "2025-01-01",
      "2025-06-30",
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate statement of purpose alignment intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// -- POST Handler -------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      assessments,
      reviews,
      stakeholderFeedback,
      ofstedRecommendations,
      homeId,
      periodStart,
      periodEnd,
    } = body;

    if (
      !assessments || !reviews || !stakeholderFeedback ||
      !ofstedRecommendations || !homeId || !periodStart || !periodEnd
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: assessments, reviews, stakeholderFeedback, ofstedRecommendations, homeId, periodStart, periodEnd",
        },
        { status: 400 },
      );
    }

    if (
      !Array.isArray(assessments) ||
      !Array.isArray(reviews) ||
      !Array.isArray(stakeholderFeedback) ||
      !Array.isArray(ofstedRecommendations)
    ) {
      return NextResponse.json(
        { error: "assessments, reviews, stakeholderFeedback, and ofstedRecommendations must be arrays" },
        { status: 400 },
      );
    }

    const result = generateStatementOfPurposeAlignmentIntelligence(
      assessments,
      reviews,
      stakeholderFeedback,
      ofstedRecommendations,
      homeId,
      periodStart,
      periodEnd,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process statement of purpose alignment data", details: String(error) },
      { status: 500 },
    );
  }
}
