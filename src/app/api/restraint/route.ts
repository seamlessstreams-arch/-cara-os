import { NextResponse } from "next/server";
import {
  generateRestraintIntelligence,
} from "@/lib/restraint";
import type {
  RestraintIncident,
  RestraintPolicy,
  StaffRestraintTraining,
} from "@/lib/restraint";

// ── Demo Data: Oak House ──────────────────────────────────────────────────

function generateDemoData(): {
  incidents: RestraintIncident[];
  policy: RestraintPolicy;
  training: StaffRestraintTraining[];
} {
  const incidents: RestraintIncident[] = [
    // Alex — 2 incidents, mostly well-managed
    { id: "inc-001", childId: "child-alex", childName: "Alex", incidentDate: "2026-01-22", restraintType: "physical_hold", outcome: "restraint_applied", deEscalationAttempted: true, proportionateResponse: true, injuryOccurred: false, bodyMapCompleted: true, parentNotified: true, ofstedNotified: true, debriefCompleted: true, childViewsRecorded: true },
    { id: "inc-002", childId: "child-alex", childName: "Alex", incidentDate: "2026-03-10", restraintType: "guided_away", outcome: "de_escalation_successful", deEscalationAttempted: true, proportionateResponse: true, injuryOccurred: false, bodyMapCompleted: true, parentNotified: true, ofstedNotified: false, debriefCompleted: true, childViewsRecorded: true },

    // Jordan — 2 incidents, one with injury
    { id: "inc-003", childId: "child-jordan", childName: "Jordan", incidentDate: "2026-02-14", restraintType: "standing_hold", outcome: "restraint_applied", deEscalationAttempted: true, proportionateResponse: true, injuryOccurred: true, bodyMapCompleted: true, parentNotified: true, ofstedNotified: true, debriefCompleted: true, childViewsRecorded: true },
    { id: "inc-004", childId: "child-jordan", childName: "Jordan", incidentDate: "2026-04-05", restraintType: "seated_hold", outcome: "restraint_applied", deEscalationAttempted: true, proportionateResponse: true, injuryOccurred: false, bodyMapCompleted: true, parentNotified: true, ofstedNotified: true, debriefCompleted: true, childViewsRecorded: false },

    // Morgan — 2 incidents, one without de-escalation
    { id: "inc-005", childId: "child-morgan", childName: "Morgan", incidentDate: "2026-03-28", restraintType: "physical_hold", outcome: "restraint_applied", deEscalationAttempted: false, proportionateResponse: true, injuryOccurred: false, bodyMapCompleted: true, parentNotified: true, ofstedNotified: true, debriefCompleted: false, childViewsRecorded: true },
    { id: "inc-006", childId: "child-morgan", childName: "Morgan", incidentDate: "2026-05-01", restraintType: "guided_away", outcome: "de_escalation_successful", deEscalationAttempted: true, proportionateResponse: true, injuryOccurred: false, bodyMapCompleted: true, parentNotified: true, ofstedNotified: false, debriefCompleted: true, childViewsRecorded: true },
  ];

  const policy: RestraintPolicy = {
    id: "pol-001",
    restraintReductionStrategy: true,
    approvedTechniquesOnly: true,
    deEscalationFirstPolicy: true,
    incidentReportingProtocol: true,
    bodyMapProtocol: true,
    notificationProcedure: true,
    regularReview: true,
  };

  const training: StaffRestraintTraining[] = [
    { id: "tr-001", staffId: "staff-sarah", staffName: "Sarah Johnson", approvedTechniquesCertified: true, deEscalationSkills: true, proportionalityUnderstanding: true, incidentReporting: true, childRightsAwareness: true, postIncidentSupport: true },
    { id: "tr-002", staffId: "staff-tom", staffName: "Tom Richards", approvedTechniquesCertified: true, deEscalationSkills: true, proportionalityUnderstanding: true, incidentReporting: true, childRightsAwareness: true, postIncidentSupport: false },
    { id: "tr-003", staffId: "staff-lisa", staffName: "Lisa Williams", approvedTechniquesCertified: true, deEscalationSkills: true, proportionalityUnderstanding: true, incidentReporting: false, childRightsAwareness: true, postIncidentSupport: true },
    { id: "tr-004", staffId: "staff-darren", staffName: "Darren Laville", approvedTechniquesCertified: true, deEscalationSkills: true, proportionalityUnderstanding: true, incidentReporting: true, childRightsAwareness: true, postIncidentSupport: true },
  ];

  return { incidents, policy, training };
}

// ── GET Handler ──────────────────────────────────────────────────────────

export async function GET() {
  const { incidents, policy, training } = generateDemoData();

  const result = generateRestraintIntelligence(
    incidents,
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
        engine: "restraint-intelligence",
        version: "1.0.0",
      },
    },
  });
}
