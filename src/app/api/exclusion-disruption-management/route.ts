// ==============================================================================
// API: /api/exclusion-disruption-management
//
// Exclusion & Disruption Management Intelligence
//
// GET  — Returns exclusion/disruption assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateExclusionDisruptionManagementIntelligence,
  getExclusionTypeLabel,
  getDisruptionTypeLabel,
  getPreventionStrategyLabel,
  getReintegrationStatusLabel,
  getRatingLabel,
} from "@/lib/exclusion-disruption-management";
import type {
  ExclusionRecord,
  DisruptionEpisode,
  PreventionPlan,
  StaffExclusionTraining,
} from "@/lib/exclusion-disruption-management";

// -- Demo Data: Chamberlain House -------------------------------------------------------

const DEMO_EXCLUSIONS: ExclusionRecord[] = [
  {
    id: "exc-1",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-04-10",
    exclusionType: "fixed_term",
    durationDays: 2,
    reason: "Persistent disruptive behaviour",
    schoolName: "Riverside Academy",
    alternativeProvisionArranged: true,
    educationContinuityMaintained: true,
    reintegrationStatus: "in_progress",
    parentNotified: true,
    socialWorkerNotified: true,
    pepReviewed: true,
  },
];

const DEMO_DISRUPTIONS: DisruptionEpisode[] = [
  {
    id: "dis-1",
    childId: "child-jordan",
    childName: "Jordan",
    date: "2026-03-25",
    disruptionType: "placement_at_risk",
    preventionStrategiesUsed: ["early_warning_meeting", "pep_review", "behaviour_support_plan"],
    multiAgencyInvolved: true,
    outcomeResolved: true,
    lessonsIdentified: true,
    planUpdated: true,
  },
];

const DEMO_PLANS: PreventionPlan[] = [
  {
    id: "pp-1",
    childId: "child-alex",
    childName: "Alex",
    planDate: "2026-02-15",
    earlyWarningSignsDocumented: true,
    triggersIdentified: true,
    strategiesAgreed: ["therapeutic_intervention", "restorative_practice"],
    schoolEngaged: true,
    reviewDate: "2026-05-15",
    reviewCurrent: true,
  },
  {
    id: "pp-2",
    childId: "child-jordan",
    childName: "Jordan",
    planDate: "2026-03-01",
    earlyWarningSignsDocumented: true,
    triggersIdentified: true,
    strategiesAgreed: ["early_warning_meeting", "behaviour_support_plan", "mediation"],
    schoolEngaged: true,
    reviewDate: "2026-05-01",
    reviewCurrent: true,
  },
  {
    id: "pp-3",
    childId: "child-morgan",
    childName: "Morgan",
    planDate: "2026-02-20",
    earlyWarningSignsDocumented: true,
    triggersIdentified: true,
    strategiesAgreed: ["pep_review", "therapeutic_intervention"],
    schoolEngaged: true,
    reviewDate: "2026-05-20",
    reviewCurrent: true,
  },
];

const DEMO_TRAINING: StaffExclusionTraining[] = [
  { id: "set-1", staffId: "staff-sarah", staffName: "Sarah Johnson", exclusionGuidanceTrained: true, educationAdvocacy: true, alternativeProvision: true, reintegrationSupport: true, multiAgencyWorking: true, traumaInformedBehaviour: true },
  { id: "set-2", staffId: "staff-tom", staffName: "Tom Richards", exclusionGuidanceTrained: true, educationAdvocacy: true, alternativeProvision: true, reintegrationSupport: true, multiAgencyWorking: true, traumaInformedBehaviour: true },
  { id: "set-3", staffId: "staff-lisa", staffName: "Lisa Williams", exclusionGuidanceTrained: true, educationAdvocacy: true, alternativeProvision: true, reintegrationSupport: true, multiAgencyWorking: true, traumaInformedBehaviour: true },
  { id: "set-4", staffId: "staff-darren", staffName: "Darren Laville", exclusionGuidanceTrained: true, educationAdvocacy: true, alternativeProvision: true, reintegrationSupport: true, multiAgencyWorking: true, traumaInformedBehaviour: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateExclusionDisruptionManagementIntelligence(
    DEMO_EXCLUSIONS,
    DEMO_DISRUPTIONS,
    DEMO_PLANS,
    DEMO_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        exclusionTypeLabels: Object.fromEntries(
          (["fixed_term", "permanent", "internal", "informal", "managed_move"] as const).map(
            (t) => [t, getExclusionTypeLabel(t)],
          ),
        ),
        disruptionTypeLabels: Object.fromEntries(
          (["school_exclusion", "placement_at_risk", "unplanned_move", "emergency_placement", "placement_breakdown"] as const).map(
            (t) => [t, getDisruptionTypeLabel(t)],
          ),
        ),
        preventionStrategyLabels: Object.fromEntries(
          (["early_warning_meeting", "pep_review", "behaviour_support_plan", "therapeutic_intervention", "mediation", "restorative_practice", "alternative_provision"] as const).map(
            (s) => [s, getPreventionStrategyLabel(s)],
          ),
        ),
        reintegrationStatusLabels: Object.fromEntries(
          (["successful", "in_progress", "failed", "not_applicable"] as const).map(
            (s) => [s, getReintegrationStatusLabel(s)],
          ),
        ),
        ratingLabels: Object.fromEntries(
          (["outstanding", "good", "requires_improvement", "inadequate"] as const).map(
            (r) => [r, getRatingLabel(r)],
          ),
        ),
      },
    },
  });
}

// -- POST -----------------------------------------------------------------------

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { exclusions, disruptions, plans, training, homeId, periodStart, periodEnd } = body as {
    exclusions?: ExclusionRecord[];
    disruptions?: DisruptionEpisode[];
    plans?: PreventionPlan[];
    training?: StaffExclusionTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateExclusionDisruptionManagementIntelligence(
    exclusions ?? [],
    disruptions ?? [],
    plans ?? [],
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
