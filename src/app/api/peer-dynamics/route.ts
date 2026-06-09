// ══════════════════════════════════════════════════════════════════════════════
// API: /api/peer-dynamics
//
// Peer Dynamics & Group Compatibility Intelligence
//
// GET  — Returns peer dynamics assessment with realistic Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generatePeerDynamicsIntelligence,
  getInteractionTypeLabel,
  getRelationshipHealthLabel,
} from "@/lib/peer-dynamics";
import type {
  ChildProfile,
  PeerInteraction,
  MatchingAssessment,
  GroupAssessment,
} from "@/lib/peer-dynamics";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

const DEMO_CHILDREN: ChildProfile[] = [
  {
    id: "child-alex", name: "Alex", age: 14,
    admissionDate: "2025-10-01",
    riskFactors: ["county_lines", "criminal_exploitation"],
    vulnerabilities: ["attachment_disorder", "impulsivity"],
    strengths: ["football", "good_humour", "protective_of_peers"],
    knownTriggers: ["feeling_controlled", "perceived_disrespect"],
    currentPlacement: true,
  },
  {
    id: "child-jordan", name: "Jordan", age: 13,
    admissionDate: "2025-11-01",
    riskFactors: ["self_harm", "emotional_dysregulation"],
    vulnerabilities: ["anxiety", "low_self_esteem", "rejection_sensitivity"],
    strengths: ["creative", "empathetic", "musical"],
    knownTriggers: ["rejection", "loud_noise", "confrontation"],
    currentPlacement: true,
  },
  {
    id: "child-morgan", name: "Morgan", age: 15,
    admissionDate: "2026-01-10",
    riskFactors: ["online_exploitation"],
    vulnerabilities: ["trauma_history", "trust_difficulties"],
    strengths: ["academic", "music", "caring_towards_younger_peers"],
    knownTriggers: ["mentions_of_family", "feeling_unsafe"],
    currentPlacement: true,
  },
];

const DEMO_INTERACTIONS: PeerInteraction[] = [
  // Positive dynamics — Alex & Jordan
  {
    id: "int-001", date: "2026-05-02",
    childAId: "child-alex", childBId: "child-jordan",
    interactionType: "positive_social", severity: 1,
    context: "Playing football in garden after school. Alex included Jordan in the game and offered encouragement.",
    deEscalationUsed: false, followUpRequired: false,
  },
  {
    id: "int-002", date: "2026-05-05",
    childAId: "child-alex", childBId: "child-jordan",
    interactionType: "cooperative_activity", severity: 1,
    context: "Both chose to play video games together during free time. Taking turns and laughing.",
    deEscalationUsed: false, followUpRequired: false,
  },
  // Conflict — Alex & Jordan
  {
    id: "int-003", date: "2026-05-08",
    childAId: "child-alex", childBId: "child-jordan",
    interactionType: "conflict", severity: 2,
    initiatedBy: "child-alex",
    context: "Alex became frustrated when Jordan changed the TV channel. Raised voice and called Jordan selfish.",
    staffResponse: "Staff intervened — PACE approach. Both calmed within 10 minutes. Restorative conversation facilitated.",
    deEscalationUsed: true, followUpRequired: true, followUpCompleted: true,
  },
  {
    id: "int-004", date: "2026-05-14",
    childAId: "child-alex", childBId: "child-jordan",
    interactionType: "verbal_aggression", severity: 3,
    initiatedBy: "child-alex",
    context: "Alex made hurtful comments about Jordan's family during an argument about bathroom time. Jordan became tearful.",
    staffResponse: "Immediate separation. Key worker session with Alex re impact of words. Jordan supported by waking staff.",
    deEscalationUsed: true, followUpRequired: true, followUpCompleted: true,
  },
  // Positive — Alex & Morgan
  {
    id: "int-005", date: "2026-05-03",
    childAId: "child-alex", childBId: "child-morgan",
    interactionType: "cooperative_activity", severity: 1,
    context: "Cooking dinner together — Alex showed Morgan how to make pasta sauce from scratch.",
    deEscalationUsed: false, followUpRequired: false,
  },
  {
    id: "int-006", date: "2026-05-10",
    childAId: "child-alex", childBId: "child-morgan",
    interactionType: "positive_social", severity: 1,
    context: "Both sitting in lounge doing homework. Alex asked Morgan for help with English essay.",
    deEscalationUsed: false, followUpRequired: false,
  },
  {
    id: "int-007", date: "2026-05-16",
    childAId: "child-alex", childBId: "child-morgan",
    interactionType: "mutual_support", severity: 1,
    context: "Morgan was upset after a video call with sibling. Alex made them a hot chocolate and sat with them quietly.",
    deEscalationUsed: false, followUpRequired: false,
  },
  // Positive — Jordan & Morgan
  {
    id: "int-008", date: "2026-05-04",
    childAId: "child-jordan", childBId: "child-morgan",
    interactionType: "mutual_support", severity: 1,
    context: "Morgan reassured Jordan before a contact visit. Jordan thanked Morgan afterwards.",
    deEscalationUsed: false, followUpRequired: false,
  },
  {
    id: "int-009", date: "2026-05-09",
    childAId: "child-jordan", childBId: "child-morgan",
    interactionType: "cooperative_activity", severity: 1,
    context: "Both worked on an art project for house meeting display. Shared materials and ideas.",
    deEscalationUsed: false, followUpRequired: false,
  },
  {
    id: "int-010", date: "2026-05-13",
    childAId: "child-jordan", childBId: "child-morgan",
    interactionType: "positive_social", severity: 1,
    context: "Walking to corner shop together with staff. Chatting and relaxed.",
    deEscalationUsed: false, followUpRequired: false,
  },
  // Minor tension — Jordan & Morgan
  {
    id: "int-011", date: "2026-05-17",
    childAId: "child-jordan", childBId: "child-morgan",
    interactionType: "conflict", severity: 1,
    initiatedBy: "child-jordan",
    context: "Jordan snapped at Morgan about noise while trying to sleep. Apologised next morning unprompted.",
    deEscalationUsed: false, followUpRequired: false,
  },
];

const DEMO_MATCHING: MatchingAssessment[] = [
  {
    id: "match-001", childId: "child-alex",
    assessmentDate: "2025-10-01", assessedBy: "Darren Laville (RM)",
    compatibilityFactors: [
      { factor: "age_gap", impact: "neutral", notes: "1 year gap with Jordan, acceptable range" },
      { factor: "risk_profile_clash", impact: "negative", notes: "Alex's exploitation risk could influence younger Jordan" },
      { factor: "positive_peer_influence", impact: "positive", notes: "Alex's sports interests could engage Jordan" },
    ],
    overallSuitability: "suitable_with_conditions",
    conditions: ["Enhanced supervision during unstructured time", "Regular group dynamics monitoring"],
    reviewDate: "2026-04-01",
  },
  {
    id: "match-002", childId: "child-jordan",
    assessmentDate: "2025-11-01", assessedBy: "Darren Laville (RM)",
    compatibilityFactors: [
      { factor: "emotional_needs_imbalance", impact: "negative", notes: "Jordan's anxiety may be triggered by Alex's impulsivity" },
      { factor: "shared_interests", impact: "positive", notes: "Both enjoy gaming and outdoor activities" },
    ],
    overallSuitability: "suitable",
    reviewDate: "2026-05-01",
  },
  {
    id: "match-003", childId: "child-morgan",
    assessmentDate: "2026-01-10", assessedBy: "Darren Laville (RM)",
    compatibilityFactors: [
      { factor: "trauma_trigger_proximity", impact: "neutral", notes: "Different trauma profiles — low risk of cross-triggering" },
      { factor: "mentoring_dynamic", impact: "positive", notes: "Morgan's maturity could be stabilising influence" },
      { factor: "positive_peer_influence", impact: "positive", notes: "All three share music and creative interests" },
    ],
    overallSuitability: "suitable",
    reviewDate: "2026-07-10",
  },
];

const DEMO_GROUP_ASSESSMENTS: GroupAssessment[] = [
  {
    id: "grp-001",
    assessmentDate: "2026-04-01",
    assessedBy: "Darren Laville",
    groupDynamicsNotes: "Group settling well since Morgan's arrival in January. Alex initially tested boundaries but has formed a positive relationship with Morgan. Jordan occasionally withdraws when Alex is loud.",
    stabilityRating: 3,
    keyStrengths: ["Cooperative mealtimes", "Shared gaming interests"],
    keyConcerns: ["Alex's volume can trigger Jordan", "Need more structured group activities"],
    actionsTaken: ["Introduced Friday film night", "Alex's key worker addressing voice regulation"],
  },
  {
    id: "grp-002",
    assessmentDate: "2026-05-01",
    assessedBy: "Darren Laville",
    groupDynamicsNotes: "Positive trajectory. All three engaging in shared cooking and garden activities. Alex showing protective qualities towards both peers. One notable conflict between Alex and Jordan resolved restoratively.",
    stabilityRating: 4,
    keyStrengths: ["Cooking together weekly", "Morgan acting as positive mediator", "Alex's protective instincts channelled positively"],
    keyConcerns: ["Alex's verbal impulsivity when frustrated"],
    actionsTaken: ["Restorative practice training for all staff"],
  },
  {
    id: "grp-003",
    assessmentDate: "2026-05-15",
    assessedBy: "Sarah Johnson",
    groupDynamicsNotes: "Group dynamics remain largely positive. Alex and Jordan's relationship needs monitoring — two verbal conflicts this fortnight but de-escalated well. Morgan is a stabilising presence. Jordan and Morgan's bond is genuinely supportive.",
    stabilityRating: 4,
    keyStrengths: ["Jordan-Morgan mutual support", "Group meals remain cooperative", "Alex showed empathy towards Morgan after sibling contact"],
    keyConcerns: ["Alex-Jordan conflict pattern needs monitoring", "Alex's verbal aggression when stressed"],
    actionsTaken: ["Planned restorative session for Alex and Jordan", "Key work focus on Alex's emotional vocabulary"],
  },
];

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generatePeerDynamicsIntelligence(
    DEMO_CHILDREN,
    DEMO_INTERACTIONS,
    DEMO_MATCHING,
    DEMO_GROUP_ASSESSMENTS,
    "oak-house",
    "2026-05-01",
    "2026-05-18",
    "2026-05-18",
  );

  // Enrich with labels for UI
  const enrichedDyads = result.dyadAnalyses.map((d) => ({
    ...d,
    relationshipHealthLabel: getRelationshipHealthLabel(d.relationshipHealth),
  }));

  const enrichedBullying = result.bullyingPatterns.map((b) => ({
    ...b,
    interactionTypeLabels: b.interactionTypes.map(getInteractionTypeLabel),
  }));

  return NextResponse.json({
    data: {
      ...result,
      dyadAnalyses: enrichedDyads,
      bullyingPatterns: enrichedBullying,
      meta: {
        interactionTypeLabels: Object.fromEntries(
          (["positive_social", "cooperative_activity", "mutual_support", "conflict", "verbal_aggression", "physical_aggression", "bullying", "exclusion", "coercion", "sexual_behaviour", "exploitation_dynamic"] as const).map(
            (t) => [t, getInteractionTypeLabel(t)],
          ),
        ),
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

  const { children, interactions, matchingAssessments, groupAssessments, homeId, periodStart, periodEnd, currentDate } = body as {
    children?: ChildProfile[];
    interactions?: PeerInteraction[];
    matchingAssessments?: MatchingAssessment[];
    groupAssessments?: GroupAssessment[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
    currentDate?: string;
  };

  if (!children || !Array.isArray(children) || children.length === 0) {
    return NextResponse.json({ error: "children array is required" }, { status: 400 });
  }
  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generatePeerDynamicsIntelligence(
    children,
    interactions ?? [],
    matchingAssessments ?? [],
    groupAssessments ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
    currentDate ?? new Date().toISOString().split("T")[0],
  );

  return NextResponse.json({ data: result });
}
