// ══════════════════════════════════════════════════════════════════════════════
// PEER DYNAMICS & GROUP COMPATIBILITY INTELLIGENCE — TEST SUITE
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  generatePeerDynamicsIntelligence,
  analyseDyads,
  detectBullyingPatterns,
  buildChildGroupProfiles,
  evaluateMatchingCompliance,
  determineGroupStabilityTrend,
  getInteractionTypeLabel,
  getCompatibilityFactorLabel,
  getRelationshipHealthLabel,
} from "../peer-dynamics-engine";
import type {
  ChildProfile,
  PeerInteraction,
  MatchingAssessment,
  GroupAssessment,
} from "../peer-dynamics-engine";

// ── Test Fixtures ──────────────────────────────────────────────────────────

const PERIOD_START = "2026-05-01";
const PERIOD_END = "2026-05-18";
const CURRENT_DATE = "2026-05-18";

function makeChildren(): ChildProfile[] {
  return [
    {
      id: "child-alex", name: "Alex", age: 14,
      admissionDate: "2025-10-01",
      riskFactors: ["county_lines", "criminal_exploitation"],
      vulnerabilities: ["attachment_disorder"],
      strengths: ["sport", "good_humour"],
      knownTriggers: ["feeling_controlled"],
      currentPlacement: true,
    },
    {
      id: "child-jordan", name: "Jordan", age: 13,
      admissionDate: "2025-11-01",
      riskFactors: ["self_harm"],
      vulnerabilities: ["anxiety", "low_self_esteem"],
      strengths: ["creative", "empathetic"],
      knownTriggers: ["rejection", "loud_noise"],
      currentPlacement: true,
    },
    {
      id: "child-morgan", name: "Morgan", age: 15,
      admissionDate: "2026-01-10",
      riskFactors: ["online_exploitation"],
      vulnerabilities: ["trauma_history"],
      strengths: ["academic", "music"],
      knownTriggers: ["mentions_of_family"],
      currentPlacement: true,
    },
  ];
}

function makePositiveInteractions(): PeerInteraction[] {
  return [
    {
      id: "int-001", date: "2026-05-02",
      childAId: "child-alex", childBId: "child-jordan",
      interactionType: "positive_social", severity: 1,
      context: "Playing football in the garden after school",
      deEscalationUsed: false, followUpRequired: false,
    },
    {
      id: "int-002", date: "2026-05-05",
      childAId: "child-alex", childBId: "child-morgan",
      interactionType: "cooperative_activity", severity: 1,
      context: "Cooking dinner together — Alex showed Morgan how to make pasta",
      deEscalationUsed: false, followUpRequired: false,
    },
    {
      id: "int-003", date: "2026-05-08",
      childAId: "child-jordan", childBId: "child-morgan",
      interactionType: "mutual_support", severity: 1,
      context: "Morgan comforted Jordan after a difficult phone call",
      deEscalationUsed: false, followUpRequired: false,
    },
    {
      id: "int-004", date: "2026-05-10",
      childAId: "child-alex", childBId: "child-jordan",
      interactionType: "positive_social", severity: 1,
      context: "Watching a film together and sharing snacks",
      deEscalationUsed: false, followUpRequired: false,
    },
    {
      id: "int-005", date: "2026-05-14",
      childAId: "child-alex", childBId: "child-morgan",
      interactionType: "mutual_support", severity: 1,
      context: "Alex helped Morgan with homework",
      deEscalationUsed: false, followUpRequired: false,
    },
  ];
}

function makeMixedInteractions(): PeerInteraction[] {
  return [
    ...makePositiveInteractions(),
    {
      id: "int-006", date: "2026-05-06",
      childAId: "child-alex", childBId: "child-jordan",
      interactionType: "conflict", severity: 2,
      initiatedBy: "child-alex",
      context: "Argument over TV remote — Alex raised voice",
      staffResponse: "Staff mediated, both calmed",
      deEscalationUsed: true, followUpRequired: false,
    },
    {
      id: "int-007", date: "2026-05-12",
      childAId: "child-alex", childBId: "child-jordan",
      interactionType: "verbal_aggression", severity: 3,
      initiatedBy: "child-alex",
      context: "Alex swore at Jordan during meal time",
      staffResponse: "Restorative conversation after cooling off",
      deEscalationUsed: true, followUpRequired: true, followUpCompleted: true,
    },
  ];
}

function makeBullyingInteractions(): PeerInteraction[] {
  return [
    // Alex → Jordan: 4 negative interactions with escalating severity
    {
      id: "bully-001", date: "2026-05-03",
      childAId: "child-alex", childBId: "child-jordan",
      interactionType: "verbal_aggression", severity: 2,
      initiatedBy: "child-alex",
      context: "Alex mocked Jordan's artwork in communal area",
      deEscalationUsed: true, followUpRequired: true, followUpCompleted: true,
    },
    {
      id: "bully-002", date: "2026-05-07",
      childAId: "child-alex", childBId: "child-jordan",
      interactionType: "exclusion", severity: 2,
      initiatedBy: "child-alex",
      context: "Alex told Morgan not to talk to Jordan",
      deEscalationUsed: false, followUpRequired: true, followUpCompleted: true,
    },
    {
      id: "bully-003", date: "2026-05-11",
      childAId: "child-alex", childBId: "child-jordan",
      interactionType: "verbal_aggression", severity: 3,
      initiatedBy: "child-alex",
      context: "Alex made threatening comments about Jordan's belongings",
      deEscalationUsed: true, followUpRequired: true, followUpCompleted: false,
    },
    {
      id: "bully-004", date: "2026-05-15",
      childAId: "child-alex", childBId: "child-jordan",
      interactionType: "physical_aggression", severity: 4,
      initiatedBy: "child-alex",
      context: "Alex pushed Jordan in hallway, Jordan fell",
      staffResponse: "Immediate separation, incident report filed",
      deEscalationUsed: true, followUpRequired: true, followUpCompleted: false,
      safeguardingReferral: true,
    },
  ];
}

function makeMatchingAssessments(): MatchingAssessment[] {
  return [
    {
      id: "match-001", childId: "child-alex",
      assessmentDate: "2025-10-01", assessedBy: "Darren Laville (RM)",
      compatibilityFactors: [
        { factor: "age_gap", impact: "neutral" },
        { factor: "risk_profile_clash", impact: "negative", notes: "Exploitation risk proximity" },
        { factor: "positive_peer_influence", impact: "positive" },
      ],
      overallSuitability: "suitable_with_conditions",
      conditions: ["Enhanced supervision during unstructured time", "No shared bedroom"],
      reviewDate: "2026-04-01",
    },
    {
      id: "match-002", childId: "child-jordan",
      assessmentDate: "2025-11-01", assessedBy: "Darren Laville (RM)",
      compatibilityFactors: [
        { factor: "emotional_needs_imbalance", impact: "negative" },
        { factor: "shared_interests", impact: "positive" },
      ],
      overallSuitability: "suitable",
      reviewDate: "2026-05-01",
    },
    {
      id: "match-003", childId: "child-morgan",
      assessmentDate: "2026-01-10", assessedBy: "Darren Laville (RM)",
      compatibilityFactors: [
        { factor: "trauma_trigger_proximity", impact: "neutral" },
        { factor: "mentoring_dynamic", impact: "positive" },
      ],
      overallSuitability: "suitable",
      reviewDate: "2026-07-10",
    },
  ];
}

function makeGroupAssessments(): GroupAssessment[] {
  return [
    {
      id: "grp-001", assessmentDate: "2026-04-01", assessedBy: "Darren Laville",
      groupDynamicsNotes: "Group settling well. Alex and Jordan building rapport.",
      stabilityRating: 3,
      keyStrengths: ["Cooperative mealtimes"],
      keyConcerns: ["Alex occasionally dominating"],
      actionsTaken: ["Structured activities introduced"],
    },
    {
      id: "grp-002", assessmentDate: "2026-05-01", assessedBy: "Darren Laville",
      groupDynamicsNotes: "Positive trajectory. All three engaging in shared activities.",
      stabilityRating: 4,
      keyStrengths: ["Film nights together", "Cooking together"],
      keyConcerns: [],
      actionsTaken: [],
    },
    {
      id: "grp-003", assessmentDate: "2026-05-15", assessedBy: "Sarah Johnson",
      groupDynamicsNotes: "Group dynamics remain largely positive despite minor conflicts.",
      stabilityRating: 4,
      keyStrengths: ["Mutual support between Jordan and Morgan"],
      keyConcerns: ["Occasional tension between Alex and Jordan"],
      actionsTaken: ["Restorative session planned"],
    },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// analyseDyads
// ═══════════════════════════════════════════════════════════════════════════

describe("analyseDyads", () => {
  it("identifies healthy relationships with only positive interactions", () => {
    const children = makeChildren();
    const interactions = makePositiveInteractions();
    const dyads = analyseDyads(children, interactions, PERIOD_START, PERIOD_END);

    const alexJordan = dyads.find(
      (d) => (d.childAId === "child-alex" && d.childBId === "child-jordan") ||
        (d.childAId === "child-jordan" && d.childBId === "child-alex"),
    )!;

    expect(alexJordan.relationshipHealth).toBe("healthy");
    expect(alexJordan.positiveCount).toBe(2);
    expect(alexJordan.negativeCount).toBe(0);
    expect(alexJordan.requiresIntervention).toBe(false);
  });

  it("detects mixed relationships with both positive and negative interactions", () => {
    const children = makeChildren();
    const interactions = makeMixedInteractions();
    const dyads = analyseDyads(children, interactions, PERIOD_START, PERIOD_END);

    const alexJordan = dyads.find(
      (d) => (d.childAId === "child-alex" && d.childBId === "child-jordan") ||
        (d.childAId === "child-jordan" && d.childBId === "child-alex"),
    )!;

    expect(alexJordan.positiveCount).toBe(2);
    expect(alexJordan.negativeCount).toBe(2);
    expect(alexJordan.relationshipHealth).toBe("mixed");
  });

  it("flags harmful relationships with high-severity or many negative interactions", () => {
    const children = makeChildren();
    const interactions = makeBullyingInteractions();
    const dyads = analyseDyads(children, interactions, PERIOD_START, PERIOD_END);

    const alexJordan = dyads.find(
      (d) => (d.childAId === "child-alex" && d.childBId === "child-jordan") ||
        (d.childAId === "child-jordan" && d.childBId === "child-alex"),
    )!;

    expect(alexJordan.relationshipHealth).toBe("harmful");
    expect(alexJordan.requiresIntervention).toBe(true);
    expect(alexJordan.negativeCount).toBe(4);
  });

  it("detects one-directional aggression pattern", () => {
    const children = makeChildren();
    const interactions = makeBullyingInteractions();
    const dyads = analyseDyads(children, interactions, PERIOD_START, PERIOD_END);

    const alexJordan = dyads.find(
      (d) => (d.childAId === "child-alex" && d.childBId === "child-jordan") ||
        (d.childAId === "child-jordan" && d.childBId === "child-alex"),
    )!;

    expect(alexJordan.patterns.some((p) => p.includes("predominant aggressor"))).toBe(true);
  });

  it("detects escalating severity pattern", () => {
    const children = makeChildren();
    // Escalating: severity 2, 3, 4
    const interactions: PeerInteraction[] = [
      {
        id: "esc-1", date: "2026-05-05",
        childAId: "child-alex", childBId: "child-jordan",
        interactionType: "conflict", severity: 2, initiatedBy: "child-alex",
        context: "argument", deEscalationUsed: true, followUpRequired: false,
      },
      {
        id: "esc-2", date: "2026-05-10",
        childAId: "child-alex", childBId: "child-jordan",
        interactionType: "verbal_aggression", severity: 3, initiatedBy: "child-alex",
        context: "shouting", deEscalationUsed: true, followUpRequired: true,
      },
      {
        id: "esc-3", date: "2026-05-15",
        childAId: "child-alex", childBId: "child-jordan",
        interactionType: "physical_aggression", severity: 4, initiatedBy: "child-alex",
        context: "push", deEscalationUsed: true, followUpRequired: true,
      },
    ];

    const dyads = analyseDyads(children, interactions, PERIOD_START, PERIOD_END);
    const alexJordan = dyads.find(
      (d) => (d.childAId === "child-alex" && d.childBId === "child-jordan") ||
        (d.childAId === "child-jordan" && d.childBId === "child-alex"),
    )!;

    expect(alexJordan.patterns.some((p) => p.includes("Escalating severity"))).toBe(true);
  });

  it("returns empty array when no interactions exist", () => {
    const children = makeChildren();
    const dyads = analyseDyads(children, [], PERIOD_START, PERIOD_END);
    expect(dyads).toHaveLength(0);
  });

  it("filters interactions to period range", () => {
    const children = makeChildren();
    const interactions: PeerInteraction[] = [
      {
        id: "out-1", date: "2026-04-15",
        childAId: "child-alex", childBId: "child-jordan",
        interactionType: "conflict", severity: 3,
        context: "before period", deEscalationUsed: false, followUpRequired: false,
      },
    ];
    const dyads = analyseDyads(children, interactions, PERIOD_START, PERIOD_END);
    expect(dyads).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// detectBullyingPatterns
// ═══════════════════════════════════════════════════════════════════════════

describe("detectBullyingPatterns", () => {
  it("detects bullying when 3+ negative interactions from same aggressor to same victim", () => {
    const children = makeChildren();
    const interactions = makeBullyingInteractions();
    const patterns = detectBullyingPatterns(children, interactions, PERIOD_START, PERIOD_END);

    expect(patterns).toHaveLength(1);
    expect(patterns[0].aggressorName).toBe("Alex");
    expect(patterns[0].victimName).toBe("Jordan");
    expect(patterns[0].incidentCount).toBe(4);
  });

  it("marks escalating bullying correctly", () => {
    const children = makeChildren();
    const interactions = makeBullyingInteractions();
    const patterns = detectBullyingPatterns(children, interactions, PERIOD_START, PERIOD_END);

    expect(patterns[0].escalating).toBe(true);
    expect(patterns[0].safeguardingAction).toContain("URGENT");
  });

  it("returns empty when fewer than 3 incidents from same aggressor", () => {
    const children = makeChildren();
    const interactions: PeerInteraction[] = [
      {
        id: "few-1", date: "2026-05-05",
        childAId: "child-alex", childBId: "child-jordan",
        interactionType: "verbal_aggression", severity: 2, initiatedBy: "child-alex",
        context: "argument", deEscalationUsed: true, followUpRequired: false,
      },
      {
        id: "few-2", date: "2026-05-10",
        childAId: "child-alex", childBId: "child-jordan",
        interactionType: "conflict", severity: 2, initiatedBy: "child-alex",
        context: "dispute", deEscalationUsed: true, followUpRequired: false,
      },
    ];
    const patterns = detectBullyingPatterns(children, interactions, PERIOD_START, PERIOD_END);
    expect(patterns).toHaveLength(0);
  });

  it("does not flag mutual conflict as bullying", () => {
    const children = makeChildren();
    const interactions: PeerInteraction[] = [
      {
        id: "mut-1", date: "2026-05-03",
        childAId: "child-alex", childBId: "child-jordan",
        interactionType: "conflict", severity: 2, initiatedBy: "child-alex",
        context: "argument", deEscalationUsed: true, followUpRequired: false,
      },
      {
        id: "mut-2", date: "2026-05-07",
        childAId: "child-alex", childBId: "child-jordan",
        interactionType: "conflict", severity: 2, initiatedBy: "child-jordan",
        context: "argument", deEscalationUsed: true, followUpRequired: false,
      },
      {
        id: "mut-3", date: "2026-05-11",
        childAId: "child-alex", childBId: "child-jordan",
        interactionType: "conflict", severity: 2, initiatedBy: "child-alex",
        context: "argument", deEscalationUsed: true, followUpRequired: false,
      },
      {
        id: "mut-4", date: "2026-05-14",
        childAId: "child-alex", childBId: "child-jordan",
        interactionType: "conflict", severity: 2, initiatedBy: "child-jordan",
        context: "argument", deEscalationUsed: true, followUpRequired: false,
      },
    ];
    // Each child has 2 initiated — neither reaches 3 threshold
    const patterns = detectBullyingPatterns(children, interactions, PERIOD_START, PERIOD_END);
    expect(patterns).toHaveLength(0);
  });

  it("identifies non-escalating bullying with appropriate action", () => {
    const children = makeChildren();
    // 3 incidents, all severity 2 (not escalating)
    const interactions: PeerInteraction[] = [
      {
        id: "ne-1", date: "2026-05-03",
        childAId: "child-alex", childBId: "child-jordan",
        interactionType: "verbal_aggression", severity: 2, initiatedBy: "child-alex",
        context: "mocking", deEscalationUsed: true, followUpRequired: true,
      },
      {
        id: "ne-2", date: "2026-05-08",
        childAId: "child-alex", childBId: "child-jordan",
        interactionType: "exclusion", severity: 2, initiatedBy: "child-alex",
        context: "excluding", deEscalationUsed: false, followUpRequired: true,
      },
      {
        id: "ne-3", date: "2026-05-13",
        childAId: "child-alex", childBId: "child-jordan",
        interactionType: "verbal_aggression", severity: 2, initiatedBy: "child-alex",
        context: "name calling", deEscalationUsed: true, followUpRequired: true,
      },
    ];
    const patterns = detectBullyingPatterns(children, interactions, PERIOD_START, PERIOD_END);
    expect(patterns).toHaveLength(1);
    expect(patterns[0].escalating).toBe(false);
    expect(patterns[0].safeguardingAction).toContain("behaviour management");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// buildChildGroupProfiles
// ═══════════════════════════════════════════════════════════════════════════

describe("buildChildGroupProfiles", () => {
  it("builds profiles for all active children", () => {
    const children = makeChildren();
    const interactions = makePositiveInteractions();
    const profiles = buildChildGroupProfiles(children, interactions, PERIOD_START, PERIOD_END);

    expect(profiles).toHaveLength(3);
    expect(profiles.map((p) => p.childName).sort()).toEqual(["Alex", "Jordan", "Morgan"]);
  });

  it("calculates positive interaction rate correctly", () => {
    const children = makeChildren();
    const interactions = makePositiveInteractions();
    const profiles = buildChildGroupProfiles(children, interactions, PERIOD_START, PERIOD_END);

    // All interactions are positive
    for (const profile of profiles) {
      expect(profile.positiveInteractionRate).toBe(100);
    }
  });

  it("identifies socially isolated children", () => {
    const children = makeChildren();
    // Only Alex and Jordan interact — Morgan gets nothing
    const interactions: PeerInteraction[] = [
      {
        id: "iso-1", date: "2026-05-05",
        childAId: "child-alex", childBId: "child-jordan",
        interactionType: "positive_social", severity: 1,
        context: "playing", deEscalationUsed: false, followUpRequired: false,
      },
      {
        id: "iso-2", date: "2026-05-10",
        childAId: "child-alex", childBId: "child-jordan",
        interactionType: "cooperative_activity", severity: 1,
        context: "cooking", deEscalationUsed: false, followUpRequired: false,
      },
    ];
    const profiles = buildChildGroupProfiles(children, interactions, PERIOD_START, PERIOD_END);

    const morgan = profiles.find((p) => p.childId === "child-morgan")!;
    expect(morgan.isIsolated).toBe(true);
    expect(morgan.concerns.some((c) => c.includes("socially isolated"))).toBe(true);
  });

  it("identifies frequent aggressors", () => {
    const children = makeChildren();
    const interactions = makeBullyingInteractions();
    const profiles = buildChildGroupProfiles(children, interactions, PERIOD_START, PERIOD_END);

    const alex = profiles.find((p) => p.childId === "child-alex")!;
    expect(alex.isFrequentAggressor).toBe(true);
  });

  it("identifies frequent victims", () => {
    const children = makeChildren();
    const interactions = makeBullyingInteractions();
    const profiles = buildChildGroupProfiles(children, interactions, PERIOD_START, PERIOD_END);

    const jordan = profiles.find((p) => p.childId === "child-jordan")!;
    expect(jordan.isFrequentVictim).toBe(true);
  });

  it("excludes children not in current placement", () => {
    const children = [
      ...makeChildren(),
      {
        id: "child-left", name: "Sam", age: 16,
        admissionDate: "2025-06-01",
        riskFactors: [], vulnerabilities: [], strengths: [], knownTriggers: [],
        currentPlacement: false,
      },
    ];
    const profiles = buildChildGroupProfiles(children, [], PERIOD_START, PERIOD_END);
    expect(profiles.find((p) => p.childId === "child-left")).toBeUndefined();
  });

  it("maps peer relationships with correct health status", () => {
    const children = makeChildren();
    const interactions = makeMixedInteractions();
    const profiles = buildChildGroupProfiles(children, interactions, PERIOD_START, PERIOD_END);

    const alex = profiles.find((p) => p.childId === "child-alex")!;
    const jordanRel = alex.peerRelationships.find((r) => r.peerId === "child-jordan");
    expect(jordanRel).toBeDefined();
    // Alex has 2 positive and 2 negative with Jordan — mixed
    expect(jordanRel!.health).toBe("mixed");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// evaluateMatchingCompliance
// ═══════════════════════════════════════════════════════════════════════════

describe("evaluateMatchingCompliance", () => {
  it("reports full compliance when all children have assessments", () => {
    const children = makeChildren();
    const assessments = makeMatchingAssessments();
    const result = evaluateMatchingCompliance(children, assessments, CURRENT_DATE);

    expect(result.totalChildren).toBe(3);
    expect(result.assessmentsCompleted).toBe(3);
    expect(result.complianceRate).toBe(100);
  });

  it("detects overdue assessments", () => {
    const children = makeChildren();
    const assessments = makeMatchingAssessments();
    // Alex's review date is 2026-04-01, which is before current date
    // Jordan's review date is 2026-05-01, which is before current date
    const result = evaluateMatchingCompliance(children, assessments, CURRENT_DATE);

    expect(result.assessmentsOverdue).toBeGreaterThan(0);
  });

  it("tracks unsuitable placements", () => {
    const children = makeChildren();
    const assessments: MatchingAssessment[] = [
      ...makeMatchingAssessments(),
      {
        id: "match-unsuit", childId: "child-alex",
        assessmentDate: "2026-05-15", assessedBy: "RM",
        compatibilityFactors: [
          { factor: "exploitation_risk", impact: "negative" },
        ],
        overallSuitability: "unsuitable",
        reviewDate: "2026-06-15",
      },
    ];
    const result = evaluateMatchingCompliance(children, assessments, CURRENT_DATE);
    expect(result.unsuitablePlacements).toBe(1);
  });

  it("tracks conditional placements", () => {
    const children = makeChildren();
    const assessments = makeMatchingAssessments();
    const result = evaluateMatchingCompliance(children, assessments, CURRENT_DATE);

    // Alex is "suitable_with_conditions"
    expect(result.conditionalPlacements).toBe(1);
  });

  it("handles empty children array", () => {
    const result = evaluateMatchingCompliance([], [], CURRENT_DATE);
    expect(result.totalChildren).toBe(0);
    expect(result.complianceRate).toBeNull();
  });

  it("handles missing assessments for some children", () => {
    const children = makeChildren();
    // Only Alex has an assessment
    const assessments: MatchingAssessment[] = [makeMatchingAssessments()[0]];
    const result = evaluateMatchingCompliance(children, assessments, CURRENT_DATE);

    expect(result.assessmentsCompleted).toBe(1);
    expect(result.complianceRate).toBe(33); // 1/3
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// determineGroupStabilityTrend
// ═══════════════════════════════════════════════════════════════════════════

describe("determineGroupStabilityTrend", () => {
  it("returns improving when ratings increase over time", () => {
    const assessments: GroupAssessment[] = [
      { id: "g1", assessmentDate: "2026-04-01", assessedBy: "RM", groupDynamicsNotes: "", stabilityRating: 2, keyStrengths: [], keyConcerns: [], actionsTaken: [] },
      { id: "g2", assessmentDate: "2026-05-01", assessedBy: "RM", groupDynamicsNotes: "", stabilityRating: 3, keyStrengths: [], keyConcerns: [], actionsTaken: [] },
      { id: "g3", assessmentDate: "2026-05-15", assessedBy: "RM", groupDynamicsNotes: "", stabilityRating: 4, keyStrengths: [], keyConcerns: [], actionsTaken: [] },
    ];
    expect(determineGroupStabilityTrend(assessments)).toBe("improving");
  });

  it("returns declining when ratings decrease over time", () => {
    const assessments: GroupAssessment[] = [
      { id: "g1", assessmentDate: "2026-04-01", assessedBy: "RM", groupDynamicsNotes: "", stabilityRating: 4, keyStrengths: [], keyConcerns: [], actionsTaken: [] },
      { id: "g2", assessmentDate: "2026-05-01", assessedBy: "RM", groupDynamicsNotes: "", stabilityRating: 3, keyStrengths: [], keyConcerns: [], actionsTaken: [] },
      { id: "g3", assessmentDate: "2026-05-15", assessedBy: "RM", groupDynamicsNotes: "", stabilityRating: 2, keyStrengths: [], keyConcerns: [], actionsTaken: [] },
    ];
    expect(determineGroupStabilityTrend(assessments)).toBe("declining");
  });

  it("returns stable when ratings remain constant", () => {
    const assessments: GroupAssessment[] = [
      { id: "g1", assessmentDate: "2026-04-01", assessedBy: "RM", groupDynamicsNotes: "", stabilityRating: 3, keyStrengths: [], keyConcerns: [], actionsTaken: [] },
      { id: "g2", assessmentDate: "2026-05-01", assessedBy: "RM", groupDynamicsNotes: "", stabilityRating: 3, keyStrengths: [], keyConcerns: [], actionsTaken: [] },
      { id: "g3", assessmentDate: "2026-05-15", assessedBy: "RM", groupDynamicsNotes: "", stabilityRating: 3, keyStrengths: [], keyConcerns: [], actionsTaken: [] },
    ];
    expect(determineGroupStabilityTrend(assessments)).toBe("stable");
  });

  it("returns volatile when large swings detected", () => {
    const assessments: GroupAssessment[] = [
      { id: "g1", assessmentDate: "2026-04-01", assessedBy: "RM", groupDynamicsNotes: "", stabilityRating: 1, keyStrengths: [], keyConcerns: [], actionsTaken: [] },
      { id: "g2", assessmentDate: "2026-05-01", assessedBy: "RM", groupDynamicsNotes: "", stabilityRating: 4, keyStrengths: [], keyConcerns: [], actionsTaken: [] },
      { id: "g3", assessmentDate: "2026-05-15", assessedBy: "RM", groupDynamicsNotes: "", stabilityRating: 1, keyStrengths: [], keyConcerns: [], actionsTaken: [] },
    ];
    expect(determineGroupStabilityTrend(assessments)).toBe("volatile");
  });

  it("returns stable with fewer than 2 assessments", () => {
    const assessments: GroupAssessment[] = [
      { id: "g1", assessmentDate: "2026-05-01", assessedBy: "RM", groupDynamicsNotes: "", stabilityRating: 3, keyStrengths: [], keyConcerns: [], actionsTaken: [] },
    ];
    expect(determineGroupStabilityTrend(assessments)).toBe("stable");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// generatePeerDynamicsIntelligence (integration)
// ═══════════════════════════════════════════════════════════════════════════

describe("generatePeerDynamicsIntelligence", () => {
  it("produces a complete result with all fields populated", () => {
    const result = generatePeerDynamicsIntelligence(
      makeChildren(),
      makePositiveInteractions(),
      makeMatchingAssessments(),
      makeGroupAssessments(),
      "oak-house",
      PERIOD_START, PERIOD_END, CURRENT_DATE,
    );

    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(result.totalChildren).toBe(3);
    expect(result.totalInteractions).toBe(5);
    expect(typeof result.overallScore).toBe("number");
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("scores high with only positive interactions and full compliance", () => {
    const result = generatePeerDynamicsIntelligence(
      makeChildren(),
      makePositiveInteractions(),
      makeMatchingAssessments(),
      makeGroupAssessments(),
      "oak-house",
      PERIOD_START, PERIOD_END, CURRENT_DATE,
    );

    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(result.positiveInteractionRate).toBe(100);
    expect(result.conflictRate).toBe(0);
  });

  it("scores lower with bullying patterns", () => {
    const result = generatePeerDynamicsIntelligence(
      makeChildren(),
      makeBullyingInteractions(),
      makeMatchingAssessments(),
      makeGroupAssessments(),
      "oak-house",
      PERIOD_START, PERIOD_END, CURRENT_DATE,
    );

    expect(result.bullyingPatterns.length).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(60);
  });

  it("generates immediate actions for bullying scenarios", () => {
    const result = generatePeerDynamicsIntelligence(
      makeChildren(),
      makeBullyingInteractions(),
      makeMatchingAssessments(),
      makeGroupAssessments(),
      "oak-house",
      PERIOD_START, PERIOD_END, CURRENT_DATE,
    );

    expect(result.immediateActions.some((a) => a.includes("URGENT"))).toBe(true);
  });

  it("generates strengths for positive group dynamics", () => {
    const result = generatePeerDynamicsIntelligence(
      makeChildren(),
      makePositiveInteractions(),
      makeMatchingAssessments(),
      makeGroupAssessments(),
      "oak-house",
      PERIOD_START, PERIOD_END, CURRENT_DATE,
    );

    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.strengths.some((s) => s.includes("positive"))).toBe(true);
  });

  it("includes regulatory links for bullying", () => {
    const result = generatePeerDynamicsIntelligence(
      makeChildren(),
      makeBullyingInteractions(),
      makeMatchingAssessments(),
      makeGroupAssessments(),
      "oak-house",
      PERIOD_START, PERIOD_END, CURRENT_DATE,
    );

    expect(result.regulatoryLinks.some((l) => l.includes("Reg 12"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Peer-on-peer"))).toBe(true);
  });

  it("returns no immediate actions message when group is healthy", () => {
    // Use assessments with future review dates so nothing is overdue
    const futureAssessments: MatchingAssessment[] = [
      {
        id: "match-f1", childId: "child-alex",
        assessmentDate: "2026-05-01", assessedBy: "RM",
        compatibilityFactors: [{ factor: "positive_peer_influence", impact: "positive" }],
        overallSuitability: "suitable",
        reviewDate: "2026-11-01",
      },
      {
        id: "match-f2", childId: "child-jordan",
        assessmentDate: "2026-05-01", assessedBy: "RM",
        compatibilityFactors: [{ factor: "shared_interests", impact: "positive" }],
        overallSuitability: "suitable",
        reviewDate: "2026-11-01",
      },
      {
        id: "match-f3", childId: "child-morgan",
        assessmentDate: "2026-05-01", assessedBy: "RM",
        compatibilityFactors: [{ factor: "mentoring_dynamic", impact: "positive" }],
        overallSuitability: "suitable",
        reviewDate: "2026-11-01",
      },
    ];

    const result = generatePeerDynamicsIntelligence(
      makeChildren(),
      makePositiveInteractions(),
      futureAssessments,
      makeGroupAssessments(),
      "oak-house",
      PERIOD_START, PERIOD_END, CURRENT_DATE,
    );

    expect(result.immediateActions.some((a) => a.includes("No immediate actions"))).toBe(true);
  });

  it("tracks group stability trend correctly", () => {
    const result = generatePeerDynamicsIntelligence(
      makeChildren(),
      makePositiveInteractions(),
      makeMatchingAssessments(),
      makeGroupAssessments(),
      "oak-house",
      PERIOD_START, PERIOD_END, CURRENT_DATE,
    );

    // Group assessments go 3 → 4 → 4, so improving
    expect(result.groupStabilityTrend).toBe("improving");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Label Utilities
// ═══════════════════════════════════════════════════════════════════════════

describe("label utilities", () => {
  it("getInteractionTypeLabel returns correct labels", () => {
    expect(getInteractionTypeLabel("positive_social")).toBe("Positive Social");
    expect(getInteractionTypeLabel("physical_aggression")).toBe("Physical Aggression");
    expect(getInteractionTypeLabel("exploitation_dynamic")).toBe("Exploitation Dynamic");
    expect(getInteractionTypeLabel("bullying")).toBe("Bullying");
  });

  it("getCompatibilityFactorLabel returns correct labels", () => {
    expect(getCompatibilityFactorLabel("age_gap")).toBe("Age Gap");
    expect(getCompatibilityFactorLabel("exploitation_risk")).toBe("Exploitation Risk");
    expect(getCompatibilityFactorLabel("sibling_bond")).toBe("Sibling Bond");
  });

  it("getRelationshipHealthLabel returns correct labels", () => {
    expect(getRelationshipHealthLabel("healthy")).toBe("Healthy");
    expect(getRelationshipHealthLabel("harmful")).toBe("Harmful");
    expect(getRelationshipHealthLabel("concerning")).toBe("Concerning");
    expect(getRelationshipHealthLabel("mixed")).toBe("Mixed");
  });
});
