// ══════════════════════════════════════════════════════════════════════════════
// API: /api/sanctions
//
// Sanctions Intelligence
//
// GET  — Returns sanctions metrics with Chamberlain House demo data
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generateSanctionsIntelligence } from "@/lib/sanctions";
import type {
  SanctionRecord,
  SanctionPolicy,
  StaffSanctionTraining,
} from "@/lib/sanctions";

// ── Demo Data ──────────────────────────────────────────────────────────────

function generateDemoData() {
  const records: SanctionRecord[] = [
    {
      id: "san-001",
      childId: "child-alex",
      childName: "Alex",
      sanctionDate: "2026-01-20",
      sanctionType: "loss_of_privilege",
      outcome: "accepted_by_child",
      proportionateToIncident: true,
      childViewsRecorded: true,
      parentNotified: true,
      documentedProperly: true,
      staffApplied: true,
      reviewScheduled: true,
    },
    {
      id: "san-002",
      childId: "child-alex",
      childName: "Alex",
      sanctionDate: "2026-02-14",
      sanctionType: "restricted_screen_time",
      outcome: "accepted_by_child",
      proportionateToIncident: true,
      childViewsRecorded: true,
      parentNotified: true,
      documentedProperly: true,
      staffApplied: true,
      reviewScheduled: true,
    },
    {
      id: "san-003",
      childId: "child-jordan",
      childName: "Jordan",
      sanctionDate: "2026-01-30",
      sanctionType: "verbal_warning",
      outcome: "accepted_by_child",
      proportionateToIncident: true,
      childViewsRecorded: true,
      parentNotified: true,
      documentedProperly: true,
      staffApplied: true,
      reviewScheduled: true,
    },
    {
      id: "san-004",
      childId: "child-jordan",
      childName: "Jordan",
      sanctionDate: "2026-03-10",
      sanctionType: "additional_chore",
      outcome: "accepted_by_child",
      proportionateToIncident: true,
      childViewsRecorded: true,
      parentNotified: true,
      documentedProperly: true,
      staffApplied: true,
      reviewScheduled: true,
    },
    {
      id: "san-005",
      childId: "child-jordan",
      childName: "Jordan",
      sanctionDate: "2026-04-05",
      sanctionType: "earlier_bedtime",
      outcome: "partially_accepted",
      proportionateToIncident: true,
      childViewsRecorded: true,
      parentNotified: true,
      documentedProperly: true,
      staffApplied: true,
      reviewScheduled: true,
    },
    {
      id: "san-006",
      childId: "child-morgan",
      childName: "Morgan",
      sanctionDate: "2026-02-22",
      sanctionType: "grounding",
      outcome: "accepted_by_child",
      proportionateToIncident: true,
      childViewsRecorded: true,
      parentNotified: true,
      documentedProperly: true,
      staffApplied: true,
      reviewScheduled: true,
    },
    {
      id: "san-007",
      childId: "child-morgan",
      childName: "Morgan",
      sanctionDate: "2026-03-28",
      sanctionType: "written_warning",
      outcome: "accepted_by_child",
      proportionateToIncident: true,
      childViewsRecorded: true,
      parentNotified: true,
      documentedProperly: true,
      staffApplied: true,
      reviewScheduled: true,
    },
    {
      id: "san-008",
      childId: "child-alex",
      childName: "Alex",
      sanctionDate: "2026-04-18",
      sanctionType: "restorative_task",
      outcome: "accepted_by_child",
      proportionateToIncident: true,
      childViewsRecorded: true,
      parentNotified: true,
      documentedProperly: true,
      staffApplied: true,
      reviewScheduled: true,
    },
  ];

  const policy: SanctionPolicy = {
    id: "pol-001",
    behaviourManagementPolicy: true,
    sanctionsGuidance: true,
    prohibitedSanctionsList: true,
    childParticipationProcess: true,
    complaintsMechanism: true,
    restorativeApproach: true,
    regularReview: true,
  };

  const training: StaffSanctionTraining[] = [
    {
      id: "tr-001",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      behaviourManagement: true,
      proportionalityAssessment: true,
      restorativeApproach: true,
      childRightsAwareness: true,
      documentationSkills: true,
      deEscalationFirst: true,
    },
    {
      id: "tr-002",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      behaviourManagement: true,
      proportionalityAssessment: true,
      restorativeApproach: true,
      childRightsAwareness: true,
      documentationSkills: true,
      deEscalationFirst: true,
    },
    {
      id: "tr-003",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      behaviourManagement: true,
      proportionalityAssessment: true,
      restorativeApproach: true,
      childRightsAwareness: true,
      documentationSkills: true,
      deEscalationFirst: true,
    },
    {
      id: "tr-004",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      behaviourManagement: true,
      proportionalityAssessment: true,
      restorativeApproach: true,
      childRightsAwareness: true,
      documentationSkills: true,
      deEscalationFirst: true,
    },
  ];

  return { records, policy, training };
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { records, policy, training } = generateDemoData();

  const result = generateSanctionsIntelligence(
    records,
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
        engine: "sanctions-intelligence",
        version: "1.0.0",
      },
    },
  });
}
