import { NextResponse } from "next/server";
import {
  generateStaffSupervisionEffectivenessIntelligence,
  getSupervisionTypeLabel,
  getSupervisionOutcomeLabel,
  getRatingLabel,
} from "@/lib/staff-supervision-effectiveness";
import type {
  SupervisionSession,
  SupervisionPolicy,
  SupervisorTraining,
} from "@/lib/staff-supervision-effectiveness";

const DEMO_SESSIONS: SupervisionSession[] = [
  { id: "ss-1", staffId: "staff-sarah", staffName: "Sarah Johnson", supervisorId: "staff-darren", supervisorName: "Darren Laville", sessionDate: "2026-04-01", supervisionType: "formal_one_to_one", supervisionOutcome: "very_effective", safeguardingDiscussed: true, wellbeingChecked: true, actionPointsSet: true, previousActionsReviewed: true, documentedInRecord: true, staffSatisfied: true },
  { id: "ss-2", staffId: "staff-sarah", staffName: "Sarah Johnson", supervisorId: "staff-darren", supervisorName: "Darren Laville", sessionDate: "2026-04-08", supervisionType: "reflective_practice", supervisionOutcome: "effective", safeguardingDiscussed: true, wellbeingChecked: true, actionPointsSet: true, previousActionsReviewed: true, documentedInRecord: true, staffSatisfied: true },
  { id: "ss-3", staffId: "staff-sarah", staffName: "Sarah Johnson", supervisorId: "staff-darren", supervisorName: "Darren Laville", sessionDate: "2026-04-15", supervisionType: "case_discussion", supervisionOutcome: "very_effective", safeguardingDiscussed: true, wellbeingChecked: true, actionPointsSet: true, previousActionsReviewed: true, documentedInRecord: true, staffSatisfied: true },
  { id: "ss-4", staffId: "staff-tom", staffName: "Tom Richards", supervisorId: "staff-darren", supervisorName: "Darren Laville", sessionDate: "2026-04-01", supervisionType: "formal_one_to_one", supervisionOutcome: "very_effective", safeguardingDiscussed: true, wellbeingChecked: true, actionPointsSet: true, previousActionsReviewed: true, documentedInRecord: true, staffSatisfied: true },
  { id: "ss-5", staffId: "staff-tom", staffName: "Tom Richards", supervisorId: "staff-darren", supervisorName: "Darren Laville", sessionDate: "2026-04-08", supervisionType: "group_supervision", supervisionOutcome: "effective", safeguardingDiscussed: true, wellbeingChecked: true, actionPointsSet: true, previousActionsReviewed: true, documentedInRecord: true, staffSatisfied: true },
  { id: "ss-6", staffId: "staff-tom", staffName: "Tom Richards", supervisorId: "staff-darren", supervisorName: "Darren Laville", sessionDate: "2026-04-15", supervisionType: "clinical_supervision", supervisionOutcome: "very_effective", safeguardingDiscussed: true, wellbeingChecked: true, actionPointsSet: true, previousActionsReviewed: true, documentedInRecord: true, staffSatisfied: true },
  { id: "ss-7", staffId: "staff-lisa", staffName: "Lisa Williams", supervisorId: "staff-darren", supervisorName: "Darren Laville", sessionDate: "2026-04-01", supervisionType: "formal_one_to_one", supervisionOutcome: "very_effective", safeguardingDiscussed: true, wellbeingChecked: true, actionPointsSet: true, previousActionsReviewed: true, documentedInRecord: true, staffSatisfied: true },
  { id: "ss-8", staffId: "staff-lisa", staffName: "Lisa Williams", supervisorId: "staff-darren", supervisorName: "Darren Laville", sessionDate: "2026-04-08", supervisionType: "management_supervision", supervisionOutcome: "effective", safeguardingDiscussed: true, wellbeingChecked: true, actionPointsSet: true, previousActionsReviewed: true, documentedInRecord: true, staffSatisfied: true },
  { id: "ss-9", staffId: "staff-lisa", staffName: "Lisa Williams", supervisorId: "staff-darren", supervisorName: "Darren Laville", sessionDate: "2026-04-15", supervisionType: "ad_hoc_support", supervisionOutcome: "very_effective", safeguardingDiscussed: true, wellbeingChecked: true, actionPointsSet: true, previousActionsReviewed: true, documentedInRecord: true, staffSatisfied: true },
  { id: "ss-10", staffId: "staff-sarah", staffName: "Sarah Johnson", supervisorId: "staff-darren", supervisorName: "Darren Laville", sessionDate: "2026-04-22", supervisionType: "peer_supervision", supervisionOutcome: "very_effective", safeguardingDiscussed: true, wellbeingChecked: true, actionPointsSet: true, previousActionsReviewed: true, documentedInRecord: true, staffSatisfied: true },
];

const DEMO_POLICY: SupervisionPolicy = {
  id: "sp-1",
  supervisionFramework: true,
  frequencyStandards: true,
  safeguardingRequirement: true,
  reflectivePracticeModel: true,
  documentationStandards: true,
  escalationProcedure: true,
  regularReview: true,
};

const DEMO_TRAINING: SupervisorTraining[] = [
  { id: "st-1", staffId: "staff-darren", staffName: "Darren Laville", supervisionSkills: true, reflectivePractice: true, safeguardingOversight: true, performanceManagement: true, wellbeingSupport: true, documentationSkills: true },
  { id: "st-2", staffId: "staff-sarah", staffName: "Sarah Johnson", supervisionSkills: true, reflectivePractice: true, safeguardingOversight: true, performanceManagement: true, wellbeingSupport: true, documentationSkills: true },
  { id: "st-3", staffId: "staff-tom", staffName: "Tom Richards", supervisionSkills: true, reflectivePractice: true, safeguardingOversight: true, performanceManagement: true, wellbeingSupport: true, documentationSkills: true },
  { id: "st-4", staffId: "staff-lisa", staffName: "Lisa Williams", supervisionSkills: true, reflectivePractice: true, safeguardingOversight: true, performanceManagement: true, wellbeingSupport: true, documentationSkills: true },
];

export async function GET() {
  const result = generateStaffSupervisionEffectivenessIntelligence(
    DEMO_SESSIONS, DEMO_POLICY, DEMO_TRAINING, "oak-house", "2026-01-01", "2026-05-19",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        supervisionTypeLabels: Object.fromEntries(
          (["formal_one_to_one", "group_supervision", "reflective_practice", "case_discussion", "clinical_supervision", "ad_hoc_support", "peer_supervision", "management_supervision"] as const).map((t) => [t, getSupervisionTypeLabel(t)]),
        ),
        supervisionOutcomeLabels: Object.fromEntries(
          (["very_effective", "effective", "partially_effective", "ineffective", "not_attended"] as const).map((o) => [o, getSupervisionOutcomeLabel(o)]),
        ),
        ratingLabels: Object.fromEntries(
          (["outstanding", "good", "requires_improvement", "inadequate"] as const).map((r) => [r, getRatingLabel(r)]),
        ),
      },
    },
  });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const { sessions, policy, training, homeId, periodStart, periodEnd } = body as {
    sessions?: SupervisionSession[]; policy?: SupervisionPolicy | null; training?: SupervisorTraining[];
    homeId?: string; periodStart?: string; periodEnd?: string;
  };

  if (!periodStart || !periodEnd) return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });

  const result = generateStaffSupervisionEffectivenessIntelligence(
    sessions ?? [], policy ?? null, training ?? [], homeId ?? "unknown", periodStart, periodEnd,
  );

  return NextResponse.json({ data: result });
}
