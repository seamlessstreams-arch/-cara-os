// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Management Oversight Intelligence API Route
//
// GET → returns Oak House demo management oversight intelligence
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { generateManagementOversightIntelligence } from "@/lib/management-oversight/management-oversight-engine";
import type {
  OversightRecord,
  OversightPolicy,
  StaffOversightTraining,
} from "@/lib/management-oversight/management-oversight-engine";

// ── Oak House Demo Data ─────────────────────────────────────────────────────

const DEMO_RECORDS: OversightRecord[] = [
  {
    id: "mo-001",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-05-01",
    category: "case_file_audit",
    completedThoroughly: true,
    actionPlanCreated: true,
    followUpCompleted: true,
    childImpactAssessed: true,
    staffFeedbackGiven: true,
    documentedProperly: true,
  },
  {
    id: "mo-002",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-05-05",
    category: "practice_observation",
    completedThoroughly: true,
    actionPlanCreated: true,
    followUpCompleted: true,
    childImpactAssessed: true,
    staffFeedbackGiven: true,
    documentedProperly: true,
  },
  {
    id: "mo-003",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-05-02",
    category: "reg44_monitoring",
    completedThoroughly: true,
    actionPlanCreated: true,
    followUpCompleted: true,
    childImpactAssessed: true,
    staffFeedbackGiven: false,
    documentedProperly: true,
  },
  {
    id: "mo-004",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-05-08",
    category: "reg45_monitoring",
    completedThoroughly: true,
    actionPlanCreated: true,
    followUpCompleted: true,
    childImpactAssessed: true,
    staffFeedbackGiven: true,
    documentedProperly: true,
  },
  {
    id: "mo-005",
    childId: "child-morgan",
    childName: "Morgan",
    date: "2026-05-03",
    category: "incident_review",
    completedThoroughly: true,
    actionPlanCreated: true,
    followUpCompleted: false,
    childImpactAssessed: true,
    staffFeedbackGiven: true,
    documentedProperly: true,
  },
  {
    id: "mo-006",
    childId: "child-morgan",
    childName: "Morgan",
    date: "2026-05-10",
    category: "staff_supervision_audit",
    completedThoroughly: true,
    actionPlanCreated: true,
    followUpCompleted: true,
    childImpactAssessed: false,
    staffFeedbackGiven: true,
    documentedProperly: true,
  },
  {
    id: "mo-007",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-05-12",
    category: "quality_assurance_check",
    completedThoroughly: true,
    actionPlanCreated: true,
    followUpCompleted: true,
    childImpactAssessed: true,
    staffFeedbackGiven: true,
    documentedProperly: true,
  },
  {
    id: "mo-008",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-05-14",
    category: "outcomes_tracking",
    completedThoroughly: true,
    actionPlanCreated: false,
    followUpCompleted: true,
    childImpactAssessed: true,
    staffFeedbackGiven: true,
    documentedProperly: true,
  },
  {
    id: "mo-009",
    childId: "child-morgan",
    childName: "Morgan",
    date: "2026-05-15",
    category: "case_file_audit",
    completedThoroughly: true,
    actionPlanCreated: true,
    followUpCompleted: true,
    childImpactAssessed: true,
    staffFeedbackGiven: true,
    documentedProperly: false,
  },
  {
    id: "mo-010",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-05-18",
    category: "reg44_monitoring",
    completedThoroughly: true,
    actionPlanCreated: true,
    followUpCompleted: true,
    childImpactAssessed: true,
    staffFeedbackGiven: true,
    documentedProperly: true,
  },
];

const DEMO_POLICY: OversightPolicy = {
  id: "policy-oak",
  oversightFramework: true,
  auditSchedule: true,
  qualityAssurancePlan: true,
  incidentReviewProtocol: true,
  performanceMonitoring: true,
  regulatoryCompliancePlan: true,
  continuousImprovementPolicy: true,
};

const DEMO_STAFF: StaffOversightTraining[] = [
  {
    id: "sot-001",
    staffId: "staff-sarah",
    staffName: "Sarah",
    auditSkills: true,
    qualityAssuranceKnowledge: true,
    regulatoryAwareness: true,
    leadershipCapability: true,
    dataAnalysis: true,
    reflectivePractice: true,
  },
  {
    id: "sot-002",
    staffId: "staff-tom",
    staffName: "Tom",
    auditSkills: true,
    qualityAssuranceKnowledge: true,
    regulatoryAwareness: true,
    leadershipCapability: false,
    dataAnalysis: true,
    reflectivePractice: true,
  },
  {
    id: "sot-003",
    staffId: "staff-lisa",
    staffName: "Lisa",
    auditSkills: true,
    qualityAssuranceKnowledge: true,
    regulatoryAwareness: true,
    leadershipCapability: true,
    dataAnalysis: false,
    reflectivePractice: true,
  },
  {
    id: "sot-004",
    staffId: "staff-darren",
    staffName: "Darren",
    auditSkills: true,
    qualityAssuranceKnowledge: true,
    regulatoryAwareness: true,
    leadershipCapability: true,
    dataAnalysis: true,
    reflectivePractice: true,
  },
];

const TOTAL_CHILDREN = 3; // Alex, Jordan, Morgan

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const result = generateManagementOversightIntelligence(
      DEMO_RECORDS,
      DEMO_POLICY,
      DEMO_STAFF,
      TOTAL_CHILDREN,
    );

    return NextResponse.json({
      data: {
        ...result,
        meta: {
          generatedAt: new Date().toISOString(),
          engine: "management-oversight",
          version: "2.0.0",
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to generate management oversight intelligence",
        details: String(error),
      },
      { status: 500 },
    );
  }
}
