import { NextResponse } from "next/server";
import {
  generateTransitionsIntelligence,
} from "@/lib/transitions";
import type { TransitionRecord, TransitionPolicy, StaffTransitionTraining } from "@/lib/transitions";

// ── Demo Data ──────────────────────────────────────────────────────────────

const demoRecords: TransitionRecord[] = [
  // Alex — thorough transition process across multiple categories
  { id: "tr-1", childId: "child-alex", childName: "Alex", transitionDate: "2026-01-15", category: "admission_transition", transitionPlanInPlace: true, childPrepared: true, receivingServiceBriefed: true, handoverComplete: true, documentationComplete: true, timelyProcess: true },
  { id: "tr-2", childId: "child-alex", childName: "Alex", transitionDate: "2026-01-20", category: "placement_move", transitionPlanInPlace: true, childPrepared: true, receivingServiceBriefed: true, handoverComplete: true, documentationComplete: true, timelyProcess: true },
  { id: "tr-3", childId: "child-alex", childName: "Alex", transitionDate: "2026-02-10", category: "step_down", transitionPlanInPlace: true, childPrepared: true, receivingServiceBriefed: true, handoverComplete: true, documentationComplete: true, timelyProcess: true },
  { id: "tr-4", childId: "child-alex", childName: "Alex", transitionDate: "2026-03-01", category: "family_reunification", transitionPlanInPlace: true, childPrepared: true, receivingServiceBriefed: true, handoverComplete: true, documentationComplete: true, timelyProcess: true },

  // Jordan — mostly good but some gaps in process
  { id: "tr-5", childId: "child-jordan", childName: "Jordan", transitionDate: "2026-02-20", category: "admission_transition", transitionPlanInPlace: true, childPrepared: true, receivingServiceBriefed: true, handoverComplete: true, documentationComplete: true, timelyProcess: true },
  { id: "tr-6", childId: "child-jordan", childName: "Jordan", transitionDate: "2026-03-05", category: "discharge_planning", transitionPlanInPlace: true, childPrepared: true, receivingServiceBriefed: true, handoverComplete: false, documentationComplete: true, timelyProcess: true },
  { id: "tr-7", childId: "child-jordan", childName: "Jordan", transitionDate: "2026-03-15", category: "step_up", transitionPlanInPlace: true, childPrepared: false, receivingServiceBriefed: true, handoverComplete: true, documentationComplete: true, timelyProcess: false },
  { id: "tr-8", childId: "child-jordan", childName: "Jordan", transitionDate: "2026-04-01", category: "independent_living", transitionPlanInPlace: false, childPrepared: true, receivingServiceBriefed: true, handoverComplete: true, documentationComplete: false, timelyProcess: true },

  // Morgan — emergency placement, some areas incomplete
  { id: "tr-9", childId: "child-morgan", childName: "Morgan", transitionDate: "2026-03-10", category: "emergency_move", transitionPlanInPlace: true, childPrepared: true, receivingServiceBriefed: true, handoverComplete: false, documentationComplete: true, timelyProcess: true },
  { id: "tr-10", childId: "child-morgan", childName: "Morgan", transitionDate: "2026-03-20", category: "placement_move", transitionPlanInPlace: true, childPrepared: true, receivingServiceBriefed: false, handoverComplete: false, documentationComplete: true, timelyProcess: false },
  { id: "tr-11", childId: "child-morgan", childName: "Morgan", transitionDate: "2026-04-05", category: "admission_transition", transitionPlanInPlace: true, childPrepared: false, receivingServiceBriefed: true, handoverComplete: true, documentationComplete: true, timelyProcess: true },
  { id: "tr-12", childId: "child-morgan", childName: "Morgan", transitionDate: "2026-04-15", category: "discharge_planning", transitionPlanInPlace: false, childPrepared: true, receivingServiceBriefed: true, handoverComplete: true, documentationComplete: false, timelyProcess: true },
];

const demoPolicy: TransitionPolicy = {
  id: "pol-trans-1",
  transitionPolicy: true,
  placementStabilityGuidance: true,
  handoverProtocol: true,
  childPreparationFramework: true,
  familyInvolvementPolicy: true,
  emergencyMoveProtocol: true,
  reviewSchedule: true,
};

const demoStaff: StaffTransitionTraining[] = [
  { id: "t-1", staffId: "staff-sarah", staffName: "Sarah Johnson", transitionPlanning: true, childPreparation: true, handoverSkills: true, familyEngagement: true, multiAgencyWorking: true, emotionalSupport: true },
  { id: "t-2", staffId: "staff-tom", staffName: "Tom Richards", transitionPlanning: true, childPreparation: true, handoverSkills: true, familyEngagement: false, multiAgencyWorking: true, emotionalSupport: false },
  { id: "t-3", staffId: "staff-lisa", staffName: "Lisa Williams", transitionPlanning: true, childPreparation: true, handoverSkills: true, familyEngagement: true, multiAgencyWorking: false, emotionalSupport: true },
  { id: "t-4", staffId: "staff-darren", staffName: "Darren Laville", transitionPlanning: true, childPreparation: true, handoverSkills: true, familyEngagement: true, multiAgencyWorking: true, emotionalSupport: true },
];

// ── Handler ────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateTransitionsIntelligence(
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
      meta: { generatedAt: new Date().toISOString(), engine: "transitions", version: "2.0.0" },
    },
  });
}
