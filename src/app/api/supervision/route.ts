/* ──────────────────────────────────────────────────────────────
   API: /api/supervision — Supervision Intelligence

   GET → returns Oak House demo supervision intelligence
   ────────────────────────────────────────────────────────────── */

import { NextResponse } from "next/server";
import { generateSupervisionIntelligence } from "@/lib/supervision/supervision-engine";
import type {
  SupervisionSession,
  SupervisionPolicy,
  StaffSupervisionTraining,
} from "@/lib/supervision/supervision-engine";

// ── Oak House Demo Data ─────────────────────────────────────────────────────

function getDemoData() {
  const sessions: SupervisionSession[] = [
    // Sarah Johnson — Senior RSW: 6 sessions, high quality
    {
      id: "sess-sj-01", staffId: "staff-sarah", staffName: "Sarah Johnson",
      sessionDate: "2026-01-15", supervisionType: "formal_one_to_one",
      contentCoverage: "comprehensive", reflectivePracticeIncluded: true,
      safeguardingDiscussed: true, wellbeingChecked: true,
      actionsFromPrevious: true, documentedProperly: true, withinTimescale: true,
    },
    {
      id: "sess-sj-02", staffId: "staff-sarah", staffName: "Sarah Johnson",
      sessionDate: "2026-02-12", supervisionType: "reflective_practice",
      contentCoverage: "comprehensive", reflectivePracticeIncluded: true,
      safeguardingDiscussed: true, wellbeingChecked: true,
      actionsFromPrevious: true, documentedProperly: true, withinTimescale: true,
    },
    {
      id: "sess-sj-03", staffId: "staff-sarah", staffName: "Sarah Johnson",
      sessionDate: "2026-03-11", supervisionType: "formal_one_to_one",
      contentCoverage: "adequate", reflectivePracticeIncluded: true,
      safeguardingDiscussed: true, wellbeingChecked: true,
      actionsFromPrevious: true, documentedProperly: true, withinTimescale: true,
    },
    {
      id: "sess-sj-04", staffId: "staff-sarah", staffName: "Sarah Johnson",
      sessionDate: "2026-04-08", supervisionType: "group_supervision",
      contentCoverage: "comprehensive", reflectivePracticeIncluded: true,
      safeguardingDiscussed: true, wellbeingChecked: true,
      actionsFromPrevious: true, documentedProperly: true, withinTimescale: true,
    },
    {
      id: "sess-sj-05", staffId: "staff-sarah", staffName: "Sarah Johnson",
      sessionDate: "2026-05-06", supervisionType: "formal_one_to_one",
      contentCoverage: "comprehensive", reflectivePracticeIncluded: true,
      safeguardingDiscussed: true, wellbeingChecked: true,
      actionsFromPrevious: true, documentedProperly: true, withinTimescale: true,
    },
    {
      id: "sess-sj-06", staffId: "staff-sarah", staffName: "Sarah Johnson",
      sessionDate: "2026-05-18", supervisionType: "clinical_supervision",
      contentCoverage: "comprehensive", reflectivePracticeIncluded: true,
      safeguardingDiscussed: true, wellbeingChecked: true,
      actionsFromPrevious: true, documentedProperly: true, withinTimescale: true,
    },

    // Tom Richards — RSW: 4 sessions, mixed quality
    {
      id: "sess-tr-01", staffId: "staff-tom", staffName: "Tom Richards",
      sessionDate: "2026-01-20", supervisionType: "formal_one_to_one",
      contentCoverage: "adequate", reflectivePracticeIncluded: false,
      safeguardingDiscussed: true, wellbeingChecked: true,
      actionsFromPrevious: true, documentedProperly: true, withinTimescale: true,
    },
    {
      id: "sess-tr-02", staffId: "staff-tom", staffName: "Tom Richards",
      sessionDate: "2026-02-24", supervisionType: "formal_one_to_one",
      contentCoverage: "adequate", reflectivePracticeIncluded: false,
      safeguardingDiscussed: true, wellbeingChecked: true,
      actionsFromPrevious: true, documentedProperly: false, withinTimescale: true,
    },
    {
      id: "sess-tr-03", staffId: "staff-tom", staffName: "Tom Richards",
      sessionDate: "2026-04-01", supervisionType: "reflective_practice",
      contentCoverage: "partial", reflectivePracticeIncluded: true,
      safeguardingDiscussed: false, wellbeingChecked: true,
      actionsFromPrevious: false, documentedProperly: true, withinTimescale: false,
    },
    {
      id: "sess-tr-04", staffId: "staff-tom", staffName: "Tom Richards",
      sessionDate: "2026-05-12", supervisionType: "formal_one_to_one",
      contentCoverage: "adequate", reflectivePracticeIncluded: true,
      safeguardingDiscussed: true, wellbeingChecked: true,
      actionsFromPrevious: true, documentedProperly: true, withinTimescale: true,
    },

    // Lisa Williams — Senior RSW: 5 sessions, outstanding quality
    {
      id: "sess-lw-01", staffId: "staff-lisa", staffName: "Lisa Williams",
      sessionDate: "2026-01-17", supervisionType: "formal_one_to_one",
      contentCoverage: "comprehensive", reflectivePracticeIncluded: true,
      safeguardingDiscussed: true, wellbeingChecked: true,
      actionsFromPrevious: true, documentedProperly: true, withinTimescale: true,
    },
    {
      id: "sess-lw-02", staffId: "staff-lisa", staffName: "Lisa Williams",
      sessionDate: "2026-02-14", supervisionType: "reflective_practice",
      contentCoverage: "comprehensive", reflectivePracticeIncluded: true,
      safeguardingDiscussed: true, wellbeingChecked: true,
      actionsFromPrevious: true, documentedProperly: true, withinTimescale: true,
    },
    {
      id: "sess-lw-03", staffId: "staff-lisa", staffName: "Lisa Williams",
      sessionDate: "2026-03-14", supervisionType: "group_supervision",
      contentCoverage: "comprehensive", reflectivePracticeIncluded: true,
      safeguardingDiscussed: true, wellbeingChecked: true,
      actionsFromPrevious: true, documentedProperly: true, withinTimescale: true,
    },
    {
      id: "sess-lw-04", staffId: "staff-lisa", staffName: "Lisa Williams",
      sessionDate: "2026-04-11", supervisionType: "clinical_supervision",
      contentCoverage: "adequate", reflectivePracticeIncluded: true,
      safeguardingDiscussed: true, wellbeingChecked: true,
      actionsFromPrevious: true, documentedProperly: true, withinTimescale: true,
    },
    {
      id: "sess-lw-05", staffId: "staff-lisa", staffName: "Lisa Williams",
      sessionDate: "2026-05-09", supervisionType: "formal_one_to_one",
      contentCoverage: "comprehensive", reflectivePracticeIncluded: true,
      safeguardingDiscussed: true, wellbeingChecked: true,
      actionsFromPrevious: true, documentedProperly: true, withinTimescale: true,
    },

    // Darren Laville — RM: 3 management supervision sessions
    {
      id: "sess-dl-01", staffId: "staff-darren", staffName: "Darren Laville",
      sessionDate: "2026-02-05", supervisionType: "management_oversight",
      contentCoverage: "comprehensive", reflectivePracticeIncluded: true,
      safeguardingDiscussed: true, wellbeingChecked: true,
      actionsFromPrevious: true, documentedProperly: true, withinTimescale: true,
    },
    {
      id: "sess-dl-02", staffId: "staff-darren", staffName: "Darren Laville",
      sessionDate: "2026-04-02", supervisionType: "management_oversight",
      contentCoverage: "comprehensive", reflectivePracticeIncluded: true,
      safeguardingDiscussed: true, wellbeingChecked: true,
      actionsFromPrevious: true, documentedProperly: true, withinTimescale: true,
    },
    {
      id: "sess-dl-03", staffId: "staff-darren", staffName: "Darren Laville",
      sessionDate: "2026-05-15", supervisionType: "annual_appraisal",
      contentCoverage: "comprehensive", reflectivePracticeIncluded: true,
      safeguardingDiscussed: true, wellbeingChecked: true,
      actionsFromPrevious: true, documentedProperly: true, withinTimescale: true,
    },
  ];

  const policy: SupervisionPolicy = {
    id: "policy-oak-house",
    supervisionSchedule: true,
    reflectivePracticeRequirement: true,
    safeguardingAgenda: true,
    wellbeingFramework: true,
    newStarterProtocol: true,
    documentationStandards: true,
    regularReview: true,
  };

  const training: StaffSupervisionTraining[] = [
    {
      id: "train-sarah", staffId: "staff-sarah", staffName: "Sarah Johnson",
      supervisorySkills: true, reflectivePractice: true,
      safeguardingKnowledge: true, wellbeingSupport: true,
      documentationCompetency: true, feedbackDelivery: true,
    },
    {
      id: "train-tom", staffId: "staff-tom", staffName: "Tom Richards",
      supervisorySkills: false, reflectivePractice: true,
      safeguardingKnowledge: true, wellbeingSupport: true,
      documentationCompetency: false, feedbackDelivery: false,
    },
    {
      id: "train-lisa", staffId: "staff-lisa", staffName: "Lisa Williams",
      supervisorySkills: true, reflectivePractice: true,
      safeguardingKnowledge: true, wellbeingSupport: true,
      documentationCompetency: true, feedbackDelivery: true,
    },
    {
      id: "train-darren", staffId: "staff-darren", staffName: "Darren Laville",
      supervisorySkills: true, reflectivePractice: true,
      safeguardingKnowledge: true, wellbeingSupport: true,
      documentationCompetency: true, feedbackDelivery: true,
    },
  ];

  return { sessions, policy, training };
}

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { sessions, policy, training } = getDemoData();
    const result = generateSupervisionIntelligence(
      sessions,
      policy,
      training,
      "oak-house",
      "2026-01-01",
      "2026-05-20",
    );
    return NextResponse.json({
      data: {
        ...result,
        meta: {
          generatedAt: new Date().toISOString(),
          engine: "supervision-intelligence",
          version: "2.0.0",
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate supervision intelligence", details: String(error) },
      { status: 500 },
    );
  }
}
