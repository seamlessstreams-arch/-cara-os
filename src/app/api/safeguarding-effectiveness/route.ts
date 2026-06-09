// ══════════════════════════════════════════════════════════════════════════════
// API: /api/safeguarding-effectiveness
//
// Safeguarding Effectiveness Intelligence
//
// GET  — Returns safeguarding effectiveness metrics with demo data (Chamberlain House)
// POST — Accepts custom data and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateSafeguardingEffectivenessIntelligence,
  getReferralTypeLabel,
  getReferralOutcomeLabel,
  getOfstedRatingLabel,
} from "@/lib/safeguarding-effectiveness";
import type {
  SafeguardingReferral,
  SafeguardingTraining,
  SafeguardingAudit,
  SafeguardingSupervision,
} from "@/lib/safeguarding-effectiveness";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

function generateDemoData(): {
  referrals: SafeguardingReferral[];
  training: SafeguardingTraining[];
  audits: SafeguardingAudit[];
  supervision: SafeguardingSupervision[];
  staffIds: string[];
} {
  const staffIds = ["staff-sarah", "staff-tom", "staff-lisa", "staff-mike"];

  const referrals: SafeguardingReferral[] = [
    {
      id: "ref-001", homeId: "oak-house", childId: "child-alex", childName: "Alex",
      referralDate: "2026-05-03", referralType: "child_protection",
      referredBy: "Sarah Johnson", referredTo: "Local Authority MASH",
      timelinessHours: 2, appropriateThreshold: true, multiAgencyEngaged: true,
      outcome: "progressed", outcomeDate: "2026-05-10", childInformed: true,
      lessonsLearned: "Prompt response to disclosure — good practice example",
    },
    {
      id: "ref-002", homeId: "oak-house", childId: "child-jordan", childName: "Jordan",
      referralDate: "2026-05-07", referralType: "CSE",
      referredBy: "Tom Watson", referredTo: "Police",
      timelinessHours: 4, appropriateThreshold: true, multiAgencyEngaged: true,
      outcome: "progressed", outcomeDate: "2026-05-15", childInformed: true,
      lessonsLearned: "Multi-agency response effective — maintain contact with police",
    },
    {
      id: "ref-003", homeId: "oak-house", childId: "child-morgan", childName: "Morgan",
      referralDate: "2026-05-10", referralType: "LADO",
      referredBy: "Lisa Williams", referredTo: "LADO",
      timelinessHours: 1, appropriateThreshold: true, multiAgencyEngaged: false,
      outcome: "no_further_action", outcomeDate: "2026-05-14", childInformed: true,
    },
    {
      id: "ref-004", homeId: "oak-house", childId: "child-casey", childName: "Casey",
      referralDate: "2026-05-12", referralType: "child_in_need",
      referredBy: "Mike Chen", referredTo: "Local Authority",
      timelinessHours: 36, appropriateThreshold: false, multiAgencyEngaged: false,
      outcome: "stepped_down", outcomeDate: "2026-05-18", childInformed: false,
    },
    {
      id: "ref-005", homeId: "oak-house", childId: "child-alex", childName: "Alex",
      referralDate: "2026-05-15", referralType: "prevent",
      referredBy: "Sarah Johnson", referredTo: "Prevent Lead",
      timelinessHours: 8, appropriateThreshold: true, multiAgencyEngaged: true,
      outcome: "ongoing", childInformed: true,
      lessonsLearned: "Radicalisation indicators identified early through keywork",
    },
  ];

  const training: SafeguardingTraining[] = [
    {
      id: "train-001", staffId: "staff-sarah", staffName: "Sarah Johnson",
      trainingDate: "2026-01-15", trainingLevel: "level_3_dsl",
      provider: "NSPCC", expiryDate: "2027-01-15",
      completedOnTime: true, scenarioBasedElement: true, assessmentPassed: true,
    },
    {
      id: "train-002", staffId: "staff-sarah", staffName: "Sarah Johnson",
      trainingDate: "2026-03-10", trainingLevel: "specialist",
      provider: "NWG Network", expiryDate: "2027-03-10",
      completedOnTime: true, scenarioBasedElement: true, assessmentPassed: true,
    },
    {
      id: "train-003", staffId: "staff-tom", staffName: "Tom Watson",
      trainingDate: "2026-02-20", trainingLevel: "level_2",
      provider: "Virtual College", expiryDate: "2027-02-20",
      completedOnTime: true, scenarioBasedElement: true, assessmentPassed: true,
    },
    {
      id: "train-004", staffId: "staff-tom", staffName: "Tom Watson",
      trainingDate: "2025-11-10", trainingLevel: "level_1",
      provider: "In-house", expiryDate: "2026-11-10",
      completedOnTime: true, scenarioBasedElement: false, assessmentPassed: true,
    },
    {
      id: "train-005", staffId: "staff-lisa", staffName: "Lisa Williams",
      trainingDate: "2026-01-25", trainingLevel: "level_2",
      provider: "NSPCC", expiryDate: "2027-01-25",
      completedOnTime: true, scenarioBasedElement: true, assessmentPassed: true,
    },
    {
      id: "train-006", staffId: "staff-lisa", staffName: "Lisa Williams",
      trainingDate: "2025-06-15", trainingLevel: "basic_awareness",
      provider: "In-house", expiryDate: "2026-06-15",
      completedOnTime: false, scenarioBasedElement: false, assessmentPassed: true,
    },
    {
      id: "train-007", staffId: "staff-mike", staffName: "Mike Chen",
      trainingDate: "2025-03-01", trainingLevel: "level_1",
      provider: "Virtual College", expiryDate: "2026-03-01",
      completedOnTime: true, scenarioBasedElement: false, assessmentPassed: false,
    },
    {
      id: "train-008", staffId: "staff-mike", staffName: "Mike Chen",
      trainingDate: "2026-04-15", trainingLevel: "level_2",
      provider: "NSPCC", expiryDate: "2027-04-15",
      completedOnTime: false, scenarioBasedElement: true, assessmentPassed: true,
    },
  ];

  const audits: SafeguardingAudit[] = [
    {
      id: "audit-001", homeId: "oak-house", auditDate: "2026-04-01",
      auditor: "External Consultant", area: "policy",
      rating: "good", findingsCount: 3, criticalFindings: 0,
      actionsRequired: ["Update safeguarding policy", "Review referral pathways"],
      actionsCompleted: 2, previousRating: "requires_improvement",
    },
    {
      id: "audit-002", homeId: "oak-house", auditDate: "2026-04-10",
      auditor: "Registered Manager", area: "recording",
      rating: "requires_improvement", findingsCount: 5, criticalFindings: 1,
      actionsRequired: ["Improve chronology recording", "Standardise case notes", "Train staff on recording standards"],
      actionsCompleted: 1, previousRating: "requires_improvement",
    },
    {
      id: "audit-003", homeId: "oak-house", auditDate: "2026-04-20",
      auditor: "External Consultant", area: "training",
      rating: "good", findingsCount: 2, criticalFindings: 0,
      actionsRequired: ["Schedule DSL refresher", "Complete scenario exercises"],
      actionsCompleted: 2, previousRating: "good",
    },
    {
      id: "audit-004", homeId: "oak-house", auditDate: "2026-05-05",
      auditor: "Responsible Individual", area: "multi_agency",
      rating: "outstanding", findingsCount: 1, criticalFindings: 0,
      actionsRequired: ["Document multi-agency meeting minutes"],
      actionsCompleted: 1, previousRating: "good",
    },
  ];

  const supervision: SafeguardingSupervision[] = [
    {
      id: "sup-001", staffId: "staff-sarah", staffName: "Sarah Johnson",
      date: "2026-04-15", supervisor: "Darren Laville",
      safeguardingDiscussed: true, casesReviewed: 3,
      decisionsRecorded: true, reflectivePractice: true,
      actionPoints: 2, actionPointsCompleted: 2,
    },
    {
      id: "sup-002", staffId: "staff-sarah", staffName: "Sarah Johnson",
      date: "2026-05-10", supervisor: "Darren Laville",
      safeguardingDiscussed: true, casesReviewed: 4,
      decisionsRecorded: true, reflectivePractice: true,
      actionPoints: 3, actionPointsCompleted: 3,
    },
    {
      id: "sup-003", staffId: "staff-tom", staffName: "Tom Watson",
      date: "2026-04-20", supervisor: "Darren Laville",
      safeguardingDiscussed: true, casesReviewed: 2,
      decisionsRecorded: true, reflectivePractice: true,
      actionPoints: 2, actionPointsCompleted: 1,
    },
    {
      id: "sup-004", staffId: "staff-tom", staffName: "Tom Watson",
      date: "2026-05-12", supervisor: "Darren Laville",
      safeguardingDiscussed: true, casesReviewed: 3,
      decisionsRecorded: true, reflectivePractice: false,
      actionPoints: 2, actionPointsCompleted: 2,
    },
    {
      id: "sup-005", staffId: "staff-lisa", staffName: "Lisa Williams",
      date: "2026-04-18", supervisor: "Darren Laville",
      safeguardingDiscussed: true, casesReviewed: 2,
      decisionsRecorded: true, reflectivePractice: true,
      actionPoints: 1, actionPointsCompleted: 1,
    },
    {
      id: "sup-006", staffId: "staff-lisa", staffName: "Lisa Williams",
      date: "2026-05-08", supervisor: "Darren Laville",
      safeguardingDiscussed: false, casesReviewed: 1,
      decisionsRecorded: false, reflectivePractice: false,
      actionPoints: 2, actionPointsCompleted: 1,
    },
    {
      id: "sup-007", staffId: "staff-mike", staffName: "Mike Chen",
      date: "2026-04-22", supervisor: "Darren Laville",
      safeguardingDiscussed: true, casesReviewed: 1,
      decisionsRecorded: true, reflectivePractice: false,
      actionPoints: 3, actionPointsCompleted: 1,
    },
    {
      id: "sup-008", staffId: "staff-mike", staffName: "Mike Chen",
      date: "2026-05-14", supervisor: "Darren Laville",
      safeguardingDiscussed: true, casesReviewed: 2,
      decisionsRecorded: true, reflectivePractice: true,
      actionPoints: 2, actionPointsCompleted: 2,
    },
  ];

  return { referrals, training, audits, supervision, staffIds };
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { referrals, training, audits, supervision, staffIds } = generateDemoData();

  const result = generateSafeguardingEffectivenessIntelligence(
    referrals,
    training,
    audits,
    supervision,
    staffIds,
    "oak-house",
    "2026-04-01",
    "2026-05-18",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        referralSummary: referrals.map((r) => ({
          id: r.id,
          date: r.referralDate,
          type: getReferralTypeLabel(r.referralType),
          childName: r.childName,
          outcome: getReferralOutcomeLabel(r.outcome),
        })),
        ratingLabel: getOfstedRatingLabel(result.rating),
      },
    },
  });
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    referrals,
    training,
    audits,
    supervision,
    staffIds,
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
  } = body as {
    referrals?: SafeguardingReferral[];
    training?: SafeguardingTraining[];
    audits?: SafeguardingAudit[];
    supervision?: SafeguardingSupervision[];
    staffIds?: string[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
    referenceDate?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json(
      { error: "periodStart and periodEnd are required" },
      { status: 400 },
    );
  }

  const result = generateSafeguardingEffectivenessIntelligence(
    referrals ?? [],
    training ?? [],
    audits ?? [],
    supervision ?? [],
    staffIds ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
    referenceDate ?? new Date().toISOString().slice(0, 10),
  );

  return NextResponse.json({ data: result });
}
