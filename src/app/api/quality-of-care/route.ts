import { NextResponse } from "next/server";
import {
  generateQualityOfCareIntelligence,
} from "@/lib/quality-of-care";
import type { QualityReviewRecord, QualityPolicy, StaffQualityTraining } from "@/lib/quality-of-care";

// ── Demo Data ──────────────────────────────────────────────────────────────

const demoRecords: QualityReviewRecord[] = [
  // Alex — strong quality reviews across domains
  { id: "qr-1", childId: "child-alex", childName: "Alex", reviewDate: "2026-02-15", domain: "safety_welfare", outcome: "meets_standard", evidenceDocumented: true, childViewCaptured: true, actionPlanCreated: true, followUpCompleted: true, regulatoryAligned: true, improvementIdentified: true },
  { id: "qr-2", childId: "child-alex", childName: "Alex", reviewDate: "2026-03-10", domain: "education_learning", outcome: "exceeds_standard", evidenceDocumented: true, childViewCaptured: true, actionPlanCreated: true, followUpCompleted: true, regulatoryAligned: true, improvementIdentified: false },
  { id: "qr-3", childId: "child-alex", childName: "Alex", reviewDate: "2026-03-25", domain: "health_wellbeing", outcome: "meets_standard", evidenceDocumented: true, childViewCaptured: true, actionPlanCreated: false, followUpCompleted: true, regulatoryAligned: true, improvementIdentified: true },
  { id: "qr-4", childId: "child-alex", childName: "Alex", reviewDate: "2026-04-15", domain: "positive_relationships", outcome: "exceeds_standard", evidenceDocumented: true, childViewCaptured: true, actionPlanCreated: true, followUpCompleted: true, regulatoryAligned: true, improvementIdentified: true },
  { id: "qr-5", childId: "child-alex", childName: "Alex", reviewDate: "2026-05-01", domain: "outcomes_progress", outcome: "meets_standard", evidenceDocumented: true, childViewCaptured: false, actionPlanCreated: true, followUpCompleted: true, regulatoryAligned: true, improvementIdentified: true },

  // Jordan — mixed results
  { id: "qr-6", childId: "child-jordan", childName: "Jordan", reviewDate: "2026-02-20", domain: "safety_welfare", outcome: "meets_standard", evidenceDocumented: true, childViewCaptured: true, actionPlanCreated: true, followUpCompleted: true, regulatoryAligned: true, improvementIdentified: true },
  { id: "qr-7", childId: "child-jordan", childName: "Jordan", reviewDate: "2026-03-15", domain: "protection_children", outcome: "partially_meets", evidenceDocumented: true, childViewCaptured: false, actionPlanCreated: true, followUpCompleted: false, regulatoryAligned: true, improvementIdentified: true },
  { id: "qr-8", childId: "child-jordan", childName: "Jordan", reviewDate: "2026-04-10", domain: "leadership_management", outcome: "meets_standard", evidenceDocumented: true, childViewCaptured: true, actionPlanCreated: false, followUpCompleted: true, regulatoryAligned: true, improvementIdentified: false },
  { id: "qr-9", childId: "child-jordan", childName: "Jordan", reviewDate: "2026-05-05", domain: "child_voice", outcome: "meets_standard", evidenceDocumented: false, childViewCaptured: true, actionPlanCreated: true, followUpCompleted: true, regulatoryAligned: false, improvementIdentified: true },

  // Morgan — newer, fewer reviews
  { id: "qr-10", childId: "child-morgan", childName: "Morgan", reviewDate: "2026-03-20", domain: "health_wellbeing", outcome: "meets_standard", evidenceDocumented: true, childViewCaptured: true, actionPlanCreated: true, followUpCompleted: true, regulatoryAligned: true, improvementIdentified: true },
  { id: "qr-11", childId: "child-morgan", childName: "Morgan", reviewDate: "2026-04-18", domain: "education_learning", outcome: "meets_standard", evidenceDocumented: true, childViewCaptured: true, actionPlanCreated: true, followUpCompleted: false, regulatoryAligned: true, improvementIdentified: true },
  { id: "qr-12", childId: "child-morgan", childName: "Morgan", reviewDate: "2026-05-10", domain: "positive_relationships", outcome: "exceeds_standard", evidenceDocumented: true, childViewCaptured: true, actionPlanCreated: true, followUpCompleted: true, regulatoryAligned: true, improvementIdentified: false },
];

const demoPolicy: QualityPolicy = {
  id: "pol-qoc-1",
  qualityAssuranceFramework: true,
  reg45ReviewSchedule: true,
  continuousImprovementPlan: true,
  outcomesMeasurementPolicy: true,
  childParticipationStrategy: true,
  auditSchedule: true,
  feedbackMechanism: true,
};

const demoStaff: StaffQualityTraining[] = [
  { id: "t-1", staffId: "staff-sarah", staffName: "Sarah Johnson", qualityAssuranceSkills: true, outcomesMonitoring: true, regulatoryKnowledge: true, reflectivePractice: true, dataAnalysis: true, childParticipation: true },
  { id: "t-2", staffId: "staff-tom", staffName: "Tom Richards", qualityAssuranceSkills: true, outcomesMonitoring: true, regulatoryKnowledge: true, reflectivePractice: false, dataAnalysis: false, childParticipation: true },
  { id: "t-3", staffId: "staff-lisa", staffName: "Lisa Williams", qualityAssuranceSkills: true, outcomesMonitoring: true, regulatoryKnowledge: true, reflectivePractice: true, dataAnalysis: true, childParticipation: false },
  { id: "t-4", staffId: "staff-darren", staffName: "Darren Laville", qualityAssuranceSkills: true, outcomesMonitoring: true, regulatoryKnowledge: true, reflectivePractice: true, dataAnalysis: true, childParticipation: true },
];

// ── Handler ────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateQualityOfCareIntelligence(
    demoRecords,
    demoPolicy,
    demoStaff,
    "oak-house",
    "2026-01-01",
    "2026-05-20",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: { generatedAt: new Date().toISOString(), engine: "quality-of-care", version: "2.0.0" },
    },
  });
}
