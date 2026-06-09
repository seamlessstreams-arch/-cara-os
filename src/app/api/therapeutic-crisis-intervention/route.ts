// ==============================================================================
// API: /api/therapeutic-crisis-intervention
//
// Therapeutic Crisis Intervention Intelligence
//
// GET  — Returns crisis intervention assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateTherapeuticCrisisInterventionIntelligence,
  getInterventionTypeLabel,
  getIncidentSeverityLabel,
  getDeescalationOutcomeLabel,
  getRatingLabel,
} from "@/lib/therapeutic-crisis-intervention";
import type {
  CrisisIncident,
  CrisisPolicy,
  StaffCrisisTraining,
} from "@/lib/therapeutic-crisis-intervention";

// -- Demo Data: Chamberlain House -------------------------------------------------------

const DEMO_INCIDENTS: CrisisIncident[] = [
  // Alex — 1 low-level crisis, verbal de-escalation, successful, debriefed
  {
    id: "inc-alex-1",
    childId: "child-alex",
    childName: "Alex",
    incidentDate: "2026-04-10",
    interventionType: "verbal_de_escalation",
    severity: "low",
    deescalationAttempted: true,
    deescalationOutcome: "successful",
    physicalInterventionUsed: false,
    physicalInterventionJustified: false,
    physicalInterventionDuration: null,
    childDebrief: true,
    staffDebrief: true,
    bodyMapCompleted: false,
    parentNotified: true,
    regulatorNotified: false,
    lessonsLearned: true,
    recordedTimely: true,
  },
  // Jordan — crisis 1: medium verbal de-escalation, partially successful
  {
    id: "inc-jordan-1",
    childId: "child-jordan",
    childName: "Jordan",
    incidentDate: "2026-03-22",
    interventionType: "verbal_de_escalation",
    severity: "medium",
    deescalationAttempted: true,
    deescalationOutcome: "partially_successful",
    physicalInterventionUsed: false,
    physicalInterventionJustified: false,
    physicalInterventionDuration: null,
    childDebrief: true,
    staffDebrief: true,
    bodyMapCompleted: false,
    parentNotified: true,
    regulatorNotified: false,
    lessonsLearned: true,
    recordedTimely: true,
  },
  // Jordan — crisis 2: medium with guided physical, de-escalation attempted first
  {
    id: "inc-jordan-2",
    childId: "child-jordan",
    childName: "Jordan",
    incidentDate: "2026-04-28",
    interventionType: "guided_physical",
    severity: "medium",
    deescalationAttempted: true,
    deescalationOutcome: "physical_intervention_required",
    physicalInterventionUsed: true,
    physicalInterventionJustified: true,
    physicalInterventionDuration: 8,
    childDebrief: true,
    staffDebrief: true,
    bodyMapCompleted: true,
    parentNotified: true,
    regulatorNotified: true,
    lessonsLearned: true,
    recordedTimely: true,
  },
  // Morgan — 1 low-level crisis, distraction technique, successful
  {
    id: "inc-morgan-1",
    childId: "child-morgan",
    childName: "Morgan",
    incidentDate: "2026-05-05",
    interventionType: "distraction",
    severity: "low",
    deescalationAttempted: true,
    deescalationOutcome: "successful",
    physicalInterventionUsed: false,
    physicalInterventionJustified: false,
    physicalInterventionDuration: null,
    childDebrief: true,
    staffDebrief: true,
    bodyMapCompleted: false,
    parentNotified: true,
    regulatorNotified: false,
    lessonsLearned: true,
    recordedTimely: true,
  },
];

const DEMO_POLICY: CrisisPolicy = {
  id: "policy-oak-house",
  therapeuticApproachDocumented: true,
  deescalationProtocol: true,
  physicalInterventionPolicy: true,
  postIncidentProcess: true,
  bodyMapRequirement: true,
  notificationProtocol: true,
  reviewSchedule: true,
};

const DEMO_TRAINING: StaffCrisisTraining[] = [
  { id: "tr-1", staffId: "staff-sarah", staffName: "Sarah Johnson", therapeuticApproach: true, deescalation: true, physicalIntervention: true, postIncidentSupport: true, recordKeeping: true, bodyMapping: true },
  { id: "tr-2", staffId: "staff-tom", staffName: "Tom Richards", therapeuticApproach: true, deescalation: true, physicalIntervention: true, postIncidentSupport: true, recordKeeping: true, bodyMapping: true },
  { id: "tr-3", staffId: "staff-lisa", staffName: "Lisa Williams", therapeuticApproach: true, deescalation: true, physicalIntervention: true, postIncidentSupport: true, recordKeeping: true, bodyMapping: true },
  { id: "tr-4", staffId: "staff-darren", staffName: "Darren Laville", therapeuticApproach: true, deescalation: true, physicalIntervention: true, postIncidentSupport: true, recordKeeping: true, bodyMapping: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateTherapeuticCrisisInterventionIntelligence(
    DEMO_INCIDENTS,
    DEMO_POLICY,
    DEMO_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-19",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        interventionTypeLabels: Object.fromEntries(
          (["verbal_de_escalation", "distraction", "planned_ignoring", "time_away", "guided_physical", "restrictive_physical", "mechanical_restraint", "medical_intervention"] as const).map(
            (v) => [v, getInterventionTypeLabel(v)],
          ),
        ),
        incidentSeverityLabels: Object.fromEntries(
          (["low", "medium", "high", "critical"] as const).map(
            (v) => [v, getIncidentSeverityLabel(v)],
          ),
        ),
        deescalationOutcomeLabels: Object.fromEntries(
          (["successful", "partially_successful", "escalated", "physical_intervention_required"] as const).map(
            (v) => [v, getDeescalationOutcomeLabel(v)],
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

  const { incidents, policy, training, homeId, periodStart, periodEnd } = body as {
    incidents?: CrisisIncident[];
    policy?: CrisisPolicy | null;
    training?: StaffCrisisTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateTherapeuticCrisisInterventionIntelligence(
    incidents ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
