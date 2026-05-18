// ══════════════════════════════════════════════════════════════════════════════
// Ofsted Readiness Intelligence — API Route
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateOfstedReadinessIntelligence,
} from "@/lib/ofsted-readiness/ofsted-readiness-engine";
import type {
  AreaScore,
  SCCIFEvidenceItem,
  InspectionHistory,
  ActionPlanItem,
} from "@/lib/ofsted-readiness/ofsted-readiness-engine";

// ── Demo Data — Oak House ────────────────────────────────────────────────────

const DEMO_AREA_SCORES: AreaScore[] = [
  {
    id: "as-oak-01",
    area: "safeguarding",
    score: 82,
    rating: "outstanding",
    lastAssessedDate: "2026-04-15",
    assessedBy: "Sarah Johnson",
  },
  {
    id: "as-oak-02",
    area: "education",
    score: 75,
    rating: "good",
    lastAssessedDate: "2026-04-12",
    assessedBy: "Tom Richards",
  },
  {
    id: "as-oak-03",
    area: "health",
    score: 78,
    rating: "good",
    lastAssessedDate: "2026-04-12",
    assessedBy: "Tom Richards",
  },
  {
    id: "as-oak-04",
    area: "behaviour",
    score: 85,
    rating: "outstanding",
    lastAssessedDate: "2026-04-10",
    assessedBy: "Lisa Williams",
  },
  {
    id: "as-oak-05",
    area: "care_planning",
    score: 70,
    rating: "good",
    lastAssessedDate: "2026-04-08",
    assessedBy: "Sarah Johnson",
  },
  {
    id: "as-oak-06",
    area: "staff_training",
    score: 88,
    rating: "outstanding",
    lastAssessedDate: "2026-04-05",
    assessedBy: "Sarah Johnson",
  },
  {
    id: "as-oak-07",
    area: "leadership",
    score: 72,
    rating: "good",
    lastAssessedDate: "2026-04-05",
    assessedBy: "Sarah Johnson",
  },
  {
    id: "as-oak-08",
    area: "participation",
    score: 80,
    rating: "outstanding",
    lastAssessedDate: "2026-04-18",
    assessedBy: "Lisa Williams",
  },
];

const DEMO_EVIDENCE: SCCIFEvidenceItem[] = [
  {
    id: "ev-oak-01",
    requirement: "children_make_progress",
    judgmentArea: "overall_experiences",
    evidenceStrength: "strong",
    description: "Care plans show clear progress tracking for all young people",
    lastUpdated: "2026-04-10",
    linkedDocuments: 5,
  },
  {
    id: "ev-oak-02",
    requirement: "children_are_safe",
    judgmentArea: "help_and_protection",
    evidenceStrength: "strong",
    description: "Robust safeguarding procedures with staff training at 100%",
    lastUpdated: "2026-04-15",
    linkedDocuments: 6,
  },
  {
    id: "ev-oak-03",
    requirement: "staff_are_skilled",
    judgmentArea: "leadership_and_management",
    evidenceStrength: "strong",
    description: "Comprehensive training programme with 88% training completion",
    lastUpdated: "2026-04-05",
    linkedDocuments: 4,
  },
  {
    id: "ev-oak-04",
    requirement: "leaders_are_ambitious",
    judgmentArea: "leadership_and_management",
    evidenceStrength: "adequate",
    description: "Development plans in place but some targets not yet met",
    lastUpdated: "2026-04-05",
    linkedDocuments: 3,
  },
  {
    id: "ev-oak-05",
    requirement: "matching_is_effective",
    judgmentArea: "overall_experiences",
    evidenceStrength: "strong",
    description: "Matching assessments completed for all current placements",
    lastUpdated: "2026-04-08",
    linkedDocuments: 4,
  },
  {
    id: "ev-oak-06",
    requirement: "care_is_individualised",
    judgmentArea: "overall_experiences",
    evidenceStrength: "strong",
    description: "Person-centred care plans reviewed monthly with children's input",
    lastUpdated: "2026-04-10",
    linkedDocuments: 5,
  },
  {
    id: "ev-oak-07",
    requirement: "records_are_thorough",
    judgmentArea: "leadership_and_management",
    evidenceStrength: "adequate",
    description: "Record-keeping mostly consistent but some daily logs lack detail",
    lastUpdated: "2026-04-06",
    linkedDocuments: 3,
  },
  {
    id: "ev-oak-08",
    requirement: "partnership_working",
    judgmentArea: "help_and_protection",
    evidenceStrength: "strong",
    description: "Active engagement with social workers, CAMHS, and schools",
    lastUpdated: "2026-04-12",
    linkedDocuments: 4,
  },
  {
    id: "ev-oak-09",
    requirement: "children_participate",
    judgmentArea: "overall_experiences",
    evidenceStrength: "strong",
    description: "Regular house meetings and participation in care plan reviews",
    lastUpdated: "2026-04-18",
    linkedDocuments: 4,
  },
  {
    id: "ev-oak-10",
    requirement: "complaints_are_resolved",
    judgmentArea: "help_and_protection",
    evidenceStrength: "adequate",
    description: "Complaints process in place; one response slightly late",
    lastUpdated: "2026-04-06",
    linkedDocuments: 3,
  },
  {
    id: "ev-oak-11",
    requirement: "health_needs_met",
    judgmentArea: "overall_experiences",
    evidenceStrength: "strong",
    description: "All children registered with GP and dentist, health plans current",
    lastUpdated: "2026-04-12",
    linkedDocuments: 5,
  },
  {
    id: "ev-oak-12",
    requirement: "education_supported",
    judgmentArea: "overall_experiences",
    evidenceStrength: "adequate",
    description: "PEPs in place and attendance improving, one PEP review overdue",
    lastUpdated: "2026-04-12",
    linkedDocuments: 3,
  },
  {
    id: "ev-oak-13",
    requirement: "independence_promoted",
    judgmentArea: "overall_experiences",
    evidenceStrength: "strong",
    description: "Independence skills programme tailored to each young person",
    lastUpdated: "2026-04-10",
    linkedDocuments: 4,
  },
  {
    id: "ev-oak-14",
    requirement: "contact_is_purposeful",
    judgmentArea: "overall_experiences",
    evidenceStrength: "strong",
    description: "Contact arrangements well-managed with purposeful family engagement",
    lastUpdated: "2026-04-08",
    linkedDocuments: 3,
  },
  {
    id: "ev-oak-15",
    requirement: "behaviour_is_understood",
    judgmentArea: "help_and_protection",
    evidenceStrength: "adequate",
    description: "Behaviour support plans in place but inconsistently applied by some staff",
    lastUpdated: "2026-04-10",
    linkedDocuments: 3,
  },
];

const DEMO_INSPECTION_HISTORY: InspectionHistory[] = [
  {
    id: "insp-oak-01",
    inspectionDate: "2025-01-15",
    overallJudgment: "good",
    experiencesJudgment: "good",
    helpProtectionJudgment: "good",
    leadershipJudgment: "good",
    requirementsIssued: 1,
    recommendationsIssued: 2,
    requirementsCompleted: 1,
    recommendationsCompleted: 1,
  },
];

const DEMO_ACTION_ITEMS: ActionPlanItem[] = [
  {
    id: "act-oak-01",
    source: "ofsted_requirement",
    description: "Ensure all behaviour support plans are consistently applied by all staff",
    status: "completed",
    targetDate: "2025-07-15",
    completedDate: "2025-06-20",
    priority: "critical",
    assignedTo: "Sarah Johnson",
  },
  {
    id: "act-oak-02",
    source: "ofsted_recommendation",
    description: "Improve daily log detail and consistency across all staff",
    status: "in_progress",
    targetDate: "2026-06-01",
    priority: "high",
    assignedTo: "Tom Richards",
  },
  {
    id: "act-oak-03",
    source: "ofsted_recommendation",
    description: "Develop more structured independence skills tracking",
    status: "completed",
    targetDate: "2025-09-01",
    completedDate: "2025-08-15",
    priority: "medium",
    assignedTo: "Lisa Williams",
  },
  {
    id: "act-oak-04",
    source: "internal_audit",
    description: "Update contextual safeguarding assessment for local area",
    status: "in_progress",
    targetDate: "2026-06-01",
    priority: "medium",
    assignedTo: "Lisa Williams",
  },
  {
    id: "act-oak-05",
    source: "reg44",
    description: "Address Reg 44 recommendation on medication administration timing",
    status: "completed",
    targetDate: "2026-03-01",
    completedDate: "2026-02-25",
    priority: "high",
    assignedTo: "Sarah Johnson",
  },
  {
    id: "act-oak-06",
    source: "internal_audit",
    description: "Refresh PEP review tracking process",
    status: "completed",
    targetDate: "2026-04-15",
    completedDate: "2026-04-10",
    priority: "medium",
    assignedTo: "Tom Richards",
  },
];

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateOfstedReadinessIntelligence(
    DEMO_AREA_SCORES,
    DEMO_EVIDENCE,
    DEMO_INSPECTION_HISTORY,
    DEMO_ACTION_ITEMS,
    "oak-house",
    "2026-01-01",
    "2026-04-30",
  );

  return NextResponse.json(result);
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    areaScores,
    evidenceItems,
    inspectionHistory,
    actionItems,
    homeId,
    periodStart,
    periodEnd,
  } = body;

  if (!homeId || !periodStart || !periodEnd) {
    return NextResponse.json(
      { error: "Missing required fields: homeId, periodStart, periodEnd" },
      { status: 400 },
    );
  }

  if (typeof homeId !== "string" || homeId.length === 0) {
    return NextResponse.json(
      { error: "homeId must be a non-empty string" },
      { status: 400 },
    );
  }

  if (areaScores && !Array.isArray(areaScores)) {
    return NextResponse.json(
      { error: "areaScores must be an array" },
      { status: 400 },
    );
  }

  if (evidenceItems && !Array.isArray(evidenceItems)) {
    return NextResponse.json(
      { error: "evidenceItems must be an array" },
      { status: 400 },
    );
  }

  if (inspectionHistory && !Array.isArray(inspectionHistory)) {
    return NextResponse.json(
      { error: "inspectionHistory must be an array" },
      { status: 400 },
    );
  }

  if (actionItems && !Array.isArray(actionItems)) {
    return NextResponse.json(
      { error: "actionItems must be an array" },
      { status: 400 },
    );
  }

  const result = generateOfstedReadinessIntelligence(
    (areaScores ?? []) as AreaScore[],
    (evidenceItems ?? []) as SCCIFEvidenceItem[],
    (inspectionHistory ?? []) as InspectionHistory[],
    (actionItems ?? []) as ActionPlanItem[],
    homeId,
    periodStart,
    periodEnd,
  );

  return NextResponse.json(result);
}
