// ══════════════════════════════════════════════════════════════════════════════
// API: /api/peer-relationship-dynamics
//
// Peer Relationship Dynamics Intelligence
//
// GET  — Returns peer relationship dynamics metrics with demo data (Oak House)
// POST — Accepts custom data and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generatePeerRelationshipDynamicsIntelligence,
  getInteractionTypeLabel,
  getOutcomeLevelLabel,
  getRatingLabel,
} from "@/lib/peer-relationship-dynamics";
import type {
  PeerInteraction,
  PeerPolicy,
  StaffPeerTraining,
} from "@/lib/peer-relationship-dynamics";

// ── Demo Data: Oak House ──────────────────────────────────────────────────

function generateDemoData(): {
  interactions: PeerInteraction[];
  policy: PeerPolicy;
  training: StaffPeerTraining[];
} {
  const interactions: PeerInteraction[] = [
    {
      id: "pi-001",
      childId: "child-alex",
      childName: "Alex",
      interactionDate: "2026-01-15",
      interactionType: "positive_social",
      outcomeLevel: "very_positive",
      staffMediated: false,
      childReflected: true,
      resolutionAchieved: true,
      socialSkillPracticed: true,
      documentedInLog: true,
      followUpPlanned: false,
    },
    {
      id: "pi-002",
      childId: "child-jordan",
      childName: "Jordan",
      interactionDate: "2026-01-22",
      interactionType: "conflict_resolution",
      outcomeLevel: "positive",
      staffMediated: true,
      childReflected: true,
      resolutionAchieved: true,
      socialSkillPracticed: true,
      documentedInLog: true,
      followUpPlanned: true,
    },
    {
      id: "pi-003",
      childId: "child-morgan",
      childName: "Morgan",
      interactionDate: "2026-02-03",
      interactionType: "cooperative_activity",
      outcomeLevel: "very_positive",
      staffMediated: false,
      childReflected: true,
      resolutionAchieved: true,
      socialSkillPracticed: true,
      documentedInLog: true,
      followUpPlanned: false,
    },
    {
      id: "pi-004",
      childId: "child-alex",
      childName: "Alex",
      interactionDate: "2026-02-14",
      interactionType: "mentoring",
      outcomeLevel: "positive",
      staffMediated: false,
      childReflected: true,
      resolutionAchieved: true,
      socialSkillPracticed: true,
      documentedInLog: true,
      followUpPlanned: false,
    },
    {
      id: "pi-005",
      childId: "child-jordan",
      childName: "Jordan",
      interactionDate: "2026-03-01",
      interactionType: "conflict",
      outcomeLevel: "negative",
      staffMediated: true,
      childReflected: false,
      resolutionAchieved: false,
      socialSkillPracticed: false,
      documentedInLog: true,
      followUpPlanned: true,
    },
    {
      id: "pi-006",
      childId: "child-morgan",
      childName: "Morgan",
      interactionDate: "2026-03-10",
      interactionType: "shared_interest",
      outcomeLevel: "very_positive",
      staffMediated: false,
      childReflected: true,
      resolutionAchieved: true,
      socialSkillPracticed: true,
      documentedInLog: true,
      followUpPlanned: false,
    },
    {
      id: "pi-007",
      childId: "child-alex",
      childName: "Alex",
      interactionDate: "2026-04-05",
      interactionType: "positive_social",
      outcomeLevel: "positive",
      staffMediated: false,
      childReflected: true,
      resolutionAchieved: true,
      socialSkillPracticed: true,
      documentedInLog: true,
      followUpPlanned: false,
    },
    {
      id: "pi-008",
      childId: "child-jordan",
      childName: "Jordan",
      interactionDate: "2026-04-20",
      interactionType: "conflict_resolution",
      outcomeLevel: "positive",
      staffMediated: true,
      childReflected: true,
      resolutionAchieved: true,
      socialSkillPracticed: true,
      documentedInLog: true,
      followUpPlanned: false,
    },
  ];

  const policy: PeerPolicy = {
    id: "policy-001",
    antisBullyingStrategy: true,
    conflictResolutionFramework: true,
    socialSkillsProgramme: true,
    peerMentoringScheme: true,
    inclusionStrategy: true,
    restorationPractice: true,
    regularReview: true,
  };

  const training: StaffPeerTraining[] = [
    {
      id: "spt-001",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      conflictResolution: true,
      socialSkillsFacilitation: true,
      antibullyingPractice: true,
      restorativeJustice: true,
      groupDynamics: true,
      traumaInformedRelationships: true,
    },
    {
      id: "spt-002",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      conflictResolution: true,
      socialSkillsFacilitation: true,
      antibullyingPractice: true,
      restorativeJustice: true,
      groupDynamics: true,
      traumaInformedRelationships: false,
    },
    {
      id: "spt-003",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      conflictResolution: true,
      socialSkillsFacilitation: true,
      antibullyingPractice: true,
      restorativeJustice: false,
      groupDynamics: true,
      traumaInformedRelationships: true,
    },
    {
      id: "spt-004",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      conflictResolution: true,
      socialSkillsFacilitation: true,
      antibullyingPractice: true,
      restorativeJustice: true,
      groupDynamics: true,
      traumaInformedRelationships: true,
    },
  ];

  return { interactions, policy, training };
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { interactions, policy, training } = generateDemoData();

  const result = generatePeerRelationshipDynamicsIntelligence(
    interactions,
    policy,
    training,
    "oak-house",
    "2026-01-01",
    "2026-05-19",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        interactionSummary: interactions.map((i) => ({
          id: i.id,
          childName: i.childName,
          date: i.interactionDate,
          type: getInteractionTypeLabel(i.interactionType),
          outcome: getOutcomeLevelLabel(i.outcomeLevel),
        })),
        ratingLabel: getRatingLabel(result.rating),
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
    interactions,
    policy,
    training,
    homeId,
    periodStart,
    periodEnd,
  } = body as {
    interactions?: PeerInteraction[];
    policy?: PeerPolicy | null;
    training?: StaffPeerTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json(
      { error: "periodStart and periodEnd are required" },
      { status: 400 },
    );
  }

  const result = generatePeerRelationshipDynamicsIntelligence(
    interactions ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
