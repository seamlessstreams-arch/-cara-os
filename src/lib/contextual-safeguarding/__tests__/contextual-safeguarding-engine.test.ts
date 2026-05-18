// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Contextual Safeguarding Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  generateContextualAssessment,
  buildChildProfile,
  calculateChildRiskScore,
  calculateProtectiveScore,
  determineRiskLevel,
  identifyProtectiveGaps,
  getHarmDomainLabel,
  getEnvironmentTypeLabel,
  getRiskLevelLabel,
  getProtectiveFactorLabel,
} from "../contextual-safeguarding-engine";
import type {
  EnvironmentalRisk,
  PeerAssociation,
  OnlineRisk,
  ProtectiveFactor,
  Intervention,
  MappingEvent,
} from "../contextual-safeguarding-engine";

// ── Test Fixtures ──────────────────────────────────────────────────────────

const makeEnvRisk = (overrides: Partial<EnvironmentalRisk> = {}): EnvironmentalRisk => ({
  id: "env-1",
  type: "location",
  name: "Town Centre Car Park",
  description: "Known gathering point for county lines activity",
  harmDomains: ["county_lines", "criminal_exploitation"],
  riskLevel: "significant",
  lastAssessed: "2026-05-10",
  associatedChildren: ["child-1"],
  isActive: true,
  mitigationsInPlace: ["Curfew adjusted", "Community mapping shared with team"],
  ...overrides,
});

const makePeer = (overrides: Partial<PeerAssociation> = {}): PeerAssociation => ({
  id: "peer-1",
  childId: "child-1",
  peerName: "Kai (pseudonym)",
  peerType: "concerning",
  harmDomains: ["criminal_exploitation"],
  context: "town centre",
  frequency: "weekly",
  isMonitored: true,
  lastContact: "2026-05-14",
  ...overrides,
});

const makeOnlineRisk = (overrides: Partial<OnlineRisk> = {}): OnlineRisk => ({
  id: "online-1",
  childId: "child-1",
  platform: "Snapchat",
  riskType: "online_exploitation",
  riskLevel: "moderate",
  description: "Contact from unknown adults via disappearing messages",
  identifiedDate: "2026-05-08",
  isActive: true,
  ...overrides,
});

const makeProtective = (overrides: Partial<ProtectiveFactor> = {}): ProtectiveFactor => ({
  id: "pf-1",
  childId: "child-1",
  type: "trusted_adult",
  description: "Strong relationship with Key Worker Sarah",
  strength: "strong",
  lastEvidenced: "2026-05-15",
  ...overrides,
});

const makeIntervention = (overrides: Partial<Intervention> = {}): Intervention => ({
  id: "int-1",
  childId: "child-1",
  harmDomain: "criminal_exploitation",
  description: "Mentoring programme with local youth service",
  status: "effective",
  startDate: "2026-04-01",
  assignedTo: "Sarah Johnson (KW)",
  multiAgencyInvolved: true,
  partners: ["Youth Offending Team", "Local Authority"],
  impactEvidence: "Alex disengaged from town centre group for 4 weeks",
  ...overrides,
});

const makeEvent = (overrides: Partial<MappingEvent> = {}): MappingEvent => ({
  id: "event-1",
  childId: "child-1",
  date: "2026-05-12",
  harmDomain: "criminal_exploitation",
  description: "Alex seen near car park with known exploitative adult",
  environmentId: "env-1",
  severity: 3,
  wasEscalated: true,
  responseAdequate: true,
  ...overrides,
});

// ── calculateChildRiskScore ────────────────────────────────────────────────

describe("calculateChildRiskScore", () => {
  it("returns 0 for no risk factors", () => {
    const score = calculateChildRiskScore([], [], [], []);
    expect(score).toBe(0);
  });

  it("increases with active environmental risks", () => {
    const lowRisk = calculateChildRiskScore(
      [makeEnvRisk({ riskLevel: "low" })], [], [], [],
    );
    const seriousRisk = calculateChildRiskScore(
      [makeEnvRisk({ riskLevel: "serious" })], [], [], [],
    );
    expect(seriousRisk).toBeGreaterThan(lowRisk);
  });

  it("increases with high-risk peer associations", () => {
    const noPeers = calculateChildRiskScore([], [], [], []);
    const highRiskPeers = calculateChildRiskScore(
      [], [makePeer({ peerType: "high_risk" }), makePeer({ id: "p2", peerType: "high_risk" })], [], [],
    );
    expect(highRiskPeers).toBeGreaterThan(noPeers);
  });

  it("decreases slightly with positive peers", () => {
    const noPeers = calculateChildRiskScore(
      [makeEnvRisk({ riskLevel: "moderate" })], [], [], [],
    );
    const positivePeers = calculateChildRiskScore(
      [makeEnvRisk({ riskLevel: "moderate" })],
      [makePeer({ peerType: "positive" }), makePeer({ id: "p2", peerType: "positive" })],
      [], [],
    );
    expect(positivePeers).toBeLessThan(noPeers);
  });

  it("increases with active online risks", () => {
    const noOnline = calculateChildRiskScore([], [], [], []);
    const withOnline = calculateChildRiskScore(
      [], [], [makeOnlineRisk({ riskLevel: "serious" })], [],
    );
    expect(withOnline).toBeGreaterThan(noOnline);
  });

  it("amplifies with high-severity events", () => {
    const noEvents = calculateChildRiskScore([makeEnvRisk()], [], [], []);
    const withEvents = calculateChildRiskScore(
      [makeEnvRisk()], [], [],
      [makeEvent({ severity: 5 }), makeEvent({ id: "e2", severity: 4 })],
    );
    expect(withEvents).toBeGreaterThan(noEvents);
  });

  it("penalises unescalated events", () => {
    const escalated = calculateChildRiskScore(
      [], [], [], [makeEvent({ severity: 3, wasEscalated: true })],
    );
    const unescalated = calculateChildRiskScore(
      [], [], [], [makeEvent({ severity: 3, wasEscalated: false })],
    );
    expect(unescalated).toBeGreaterThan(escalated);
  });

  it("ignores inactive environmental risks", () => {
    const active = calculateChildRiskScore([makeEnvRisk({ isActive: true })], [], [], []);
    const inactive = calculateChildRiskScore([makeEnvRisk({ isActive: false })], [], [], []);
    expect(active).toBeGreaterThan(inactive);
  });

  it("caps at 100", () => {
    const extreme = calculateChildRiskScore(
      [
        makeEnvRisk({ id: "e1", riskLevel: "serious" }),
        makeEnvRisk({ id: "e2", riskLevel: "serious" }),
        makeEnvRisk({ id: "e3", riskLevel: "serious" }),
      ],
      [
        makePeer({ id: "p1", peerType: "high_risk" }),
        makePeer({ id: "p2", peerType: "high_risk" }),
        makePeer({ id: "p3", peerType: "high_risk" }),
      ],
      [makeOnlineRisk({ riskLevel: "serious" })],
      [makeEvent({ severity: 5 }), makeEvent({ id: "ev2", severity: 5 })],
    );
    expect(extreme).toBeLessThanOrEqual(100);
  });
});

// ── calculateProtectiveScore ───────────────────────────────────────────────

describe("calculateProtectiveScore", () => {
  it("returns 0 for no protective factors", () => {
    expect(calculateProtectiveScore([])).toBe(0);
  });

  it("strong factors score higher than fragile", () => {
    const strong = calculateProtectiveScore([makeProtective({ strength: "strong" })]);
    const fragile = calculateProtectiveScore([makeProtective({ strength: "fragile" })]);
    expect(strong).toBeGreaterThan(fragile);
  });

  it("adds diversity bonus for 5+ unique types", () => {
    const fiveTypes: ProtectiveFactor[] = [
      makeProtective({ id: "1", type: "trusted_adult", strength: "moderate" }),
      makeProtective({ id: "2", type: "positive_peer", strength: "moderate" }),
      makeProtective({ id: "3", type: "structured_activity", strength: "moderate" }),
      makeProtective({ id: "4", type: "therapeutic_support", strength: "moderate" }),
      makeProtective({ id: "5", type: "education_engagement", strength: "moderate" }),
    ];
    const fourTypes = fiveTypes.slice(0, 4);

    const fiveScore = calculateProtectiveScore(fiveTypes);
    const fourScore = calculateProtectiveScore(fourTypes);
    // Five types gets diversity bonus (+10) plus the extra factor's score
    expect(fiveScore).toBeGreaterThan(fourScore);
  });

  it("caps at 100", () => {
    const many: ProtectiveFactor[] = Array.from({ length: 12 }, (_, i) => (
      makeProtective({ id: `pf-${i}`, strength: "strong", type: "trusted_adult" })
    ));
    expect(calculateProtectiveScore(many)).toBeLessThanOrEqual(100);
  });
});

// ── determineRiskLevel ─────────────────────────────────────────────────────

describe("determineRiskLevel", () => {
  it("returns serious for score >= 70", () => {
    expect(determineRiskLevel(70)).toBe("serious");
    expect(determineRiskLevel(100)).toBe("serious");
  });

  it("returns significant for score 45-69", () => {
    expect(determineRiskLevel(45)).toBe("significant");
    expect(determineRiskLevel(69)).toBe("significant");
  });

  it("returns moderate for score 20-44", () => {
    expect(determineRiskLevel(20)).toBe("moderate");
    expect(determineRiskLevel(44)).toBe("moderate");
  });

  it("returns low for score < 20", () => {
    expect(determineRiskLevel(0)).toBe("low");
    expect(determineRiskLevel(19)).toBe("low");
  });
});

// ── buildChildProfile ──────────────────────────────────────────────────────

describe("buildChildProfile", () => {
  it("correctly assembles child-specific data", () => {
    const envRisks = [
      makeEnvRisk({ id: "e1", associatedChildren: ["child-1"] }),
      makeEnvRisk({ id: "e2", associatedChildren: ["child-2"] }),
    ];
    const peers = [
      makePeer({ id: "p1", childId: "child-1" }),
      makePeer({ id: "p2", childId: "child-2" }),
    ];
    const online = [makeOnlineRisk({ childId: "child-1" })];
    const protective = [makeProtective({ childId: "child-1" })];
    const interventions = [makeIntervention({ childId: "child-1" })];
    const events = [makeEvent({ childId: "child-1" })];

    const profile = buildChildProfile(
      "child-1", "Alex",
      envRisks, peers, online, protective, interventions, events,
    );

    expect(profile.childId).toBe("child-1");
    expect(profile.childName).toBe("Alex");
    expect(profile.environmentalRisks).toHaveLength(1);
    expect(profile.peerAssociations).toHaveLength(1);
    expect(profile.onlineRisks).toHaveLength(1);
    expect(profile.protectiveFactors).toHaveLength(1);
    expect(profile.interventions).toHaveLength(1);
    expect(profile.events).toHaveLength(1);
  });

  it("calculates net risk score (vulnerability - protective offset)", () => {
    // High risk, low protection
    const highRisk = buildChildProfile(
      "child-1", "Alex",
      [makeEnvRisk({ riskLevel: "serious" }), makeEnvRisk({ id: "e2", riskLevel: "serious" })],
      [makePeer({ peerType: "high_risk" })],
      [], [], [], [],
    );

    // Same risk but with strong protective factors
    const withProtection = buildChildProfile(
      "child-1", "Alex",
      [makeEnvRisk({ riskLevel: "serious" }), makeEnvRisk({ id: "e2", riskLevel: "serious" })],
      [makePeer({ peerType: "high_risk" })],
      [],
      [
        makeProtective({ id: "p1", strength: "strong" }),
        makeProtective({ id: "p2", type: "safety_plan", strength: "strong" }),
        makeProtective({ id: "p3", type: "therapeutic_support", strength: "strong" }),
      ],
      [], [],
    );

    expect(withProtection.netRiskScore).toBeLessThan(highRisk.netRiskScore);
  });

  it("identifies active harm domains", () => {
    const profile = buildChildProfile(
      "child-1", "Alex",
      [makeEnvRisk({ harmDomains: ["county_lines", "criminal_exploitation"], isActive: true })],
      [makePeer({ peerType: "high_risk", harmDomains: ["substance_supply"] })],
      [makeOnlineRisk({ riskType: "online_exploitation", isActive: true })],
      [], [], [],
    );

    expect(profile.activeHarmDomains).toContain("county_lines");
    expect(profile.activeHarmDomains).toContain("criminal_exploitation");
    expect(profile.activeHarmDomains).toContain("substance_supply");
    expect(profile.activeHarmDomains).toContain("online_exploitation");
  });
});

// ── identifyProtectiveGaps ─────────────────────────────────────────────────

describe("identifyProtectiveGaps", () => {
  it("identifies missing critical types for at-risk children", () => {
    const profile = buildChildProfile(
      "child-1", "Alex",
      [makeEnvRisk({ riskLevel: "serious" }), makeEnvRisk({ id: "e2", riskLevel: "serious" })],
      [makePeer({ peerType: "high_risk" })],
      [], [], [], [],
    );

    const gaps = identifyProtectiveGaps([profile]);
    // Should flag missing trusted_adult, safety_plan, therapeutic_support, education_engagement
    expect(gaps.length).toBeGreaterThan(0);
    expect(gaps.some((g) => g.includes("Alex"))).toBe(true);
  });

  it("returns empty for low-risk children", () => {
    const profile = buildChildProfile(
      "child-1", "Alex",
      [makeEnvRisk({ riskLevel: "low" })],
      [], [], [], [], [],
    );

    const gaps = identifyProtectiveGaps([profile]);
    expect(gaps).toHaveLength(0);
  });

  it("flags insufficient protective factor count", () => {
    const profile = buildChildProfile(
      "child-1", "Alex",
      [makeEnvRisk({ riskLevel: "serious" }), makeEnvRisk({ id: "e2", riskLevel: "serious" })],
      [makePeer({ peerType: "high_risk" })],
      [],
      [makeProtective({ type: "trusted_adult" })], // only 1
      [], [],
    );

    const gaps = identifyProtectiveGaps([profile]);
    expect(gaps.some((g) => g.includes("insufficient resilience"))).toBe(true);
  });
});

// ── generateContextualAssessment ───────────────────────────────────────────

describe("generateContextualAssessment", () => {
  const baseChildren = [
    { id: "child-1", name: "Alex" },
    { id: "child-2", name: "Jordan" },
    { id: "child-3", name: "Morgan" },
  ];

  it("produces good score for well-managed contextual risks", () => {
    const envRisks = [makeEnvRisk({ riskLevel: "moderate", associatedChildren: ["child-1"] })];
    const peers = [makePeer({ childId: "child-1", peerType: "concerning", isMonitored: true })];
    const online: OnlineRisk[] = [];
    const protective = [
      makeProtective({ id: "p1", childId: "child-1", type: "trusted_adult", strength: "strong" }),
      makeProtective({ id: "p2", childId: "child-1", type: "safety_plan", strength: "moderate" }),
      makeProtective({ id: "p3", childId: "child-1", type: "therapeutic_support", strength: "strong" }),
      makeProtective({ id: "p4", childId: "child-2", type: "trusted_adult", strength: "strong" }),
      makeProtective({ id: "p5", childId: "child-3", type: "trusted_adult", strength: "strong" }),
    ];
    const interventions = [makeIntervention({ childId: "child-1", status: "effective", multiAgencyInvolved: true })];
    const events: MappingEvent[] = [];

    const result = generateContextualAssessment(
      baseChildren, envRisks, peers, online, protective, interventions, events,
      "oak-house", "2026-05-01", "2026-05-18",
    );

    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(result.rating).toMatch(/outstanding|good/);
    expect(result.childrenAtSeriousRisk).toBe(0);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("identifies children at serious risk", () => {
    const envRisks = [
      makeEnvRisk({ id: "e1", riskLevel: "serious", associatedChildren: ["child-1"] }),
      makeEnvRisk({ id: "e2", riskLevel: "serious", associatedChildren: ["child-1"] }),
    ];
    const peers = [
      makePeer({ id: "p1", childId: "child-1", peerType: "high_risk" }),
      makePeer({ id: "p2", childId: "child-1", peerType: "high_risk" }),
    ];

    const result = generateContextualAssessment(
      baseChildren, envRisks, peers, [], [], [], [],
      "oak-house", "2026-05-01", "2026-05-18",
    );

    expect(result.childrenAtSeriousRisk).toBeGreaterThanOrEqual(1);
    expect(result.immediateActions.some((a) => a.includes("Alex"))).toBe(true);
  });

  it("calculates harm domain breakdown", () => {
    const envRisks = [
      makeEnvRisk({ id: "e1", harmDomains: ["county_lines", "criminal_exploitation"], associatedChildren: ["child-1"] }),
      makeEnvRisk({ id: "e2", harmDomains: ["sexual_exploitation"], associatedChildren: ["child-2"] }),
    ];

    const result = generateContextualAssessment(
      baseChildren, envRisks, [], [], [], [], [],
      "oak-house", "2026-05-01", "2026-05-18",
    );

    expect(result.harmDomainBreakdown.length).toBeGreaterThan(0);
    const countyLines = result.harmDomainBreakdown.find((h) => h.domain === "county_lines");
    expect(countyLines).toBeDefined();
  });

  it("calculates peer monitoring rate", () => {
    const peers = [
      makePeer({ id: "p1", childId: "child-1", peerType: "high_risk", isMonitored: true }),
      makePeer({ id: "p2", childId: "child-1", peerType: "concerning", isMonitored: false }),
      makePeer({ id: "p3", childId: "child-2", peerType: "positive", isMonitored: false }),
    ];

    const result = generateContextualAssessment(
      baseChildren, [], peers, [], [], [], [],
      "oak-house", "2026-05-01", "2026-05-18",
    );

    // 1 monitored out of 2 concerning/high-risk = 50%
    expect(result.monitoredPeerRate).toBe(50);
    expect(result.highRiskPeers).toBe(1);
  });

  it("calculates intervention effectiveness", () => {
    const interventions: Intervention[] = [
      makeIntervention({ id: "i1", childId: "child-1", status: "effective" }),
      makeIntervention({ id: "i2", childId: "child-1", status: "ineffective" }),
      makeIntervention({ id: "i3", childId: "child-2", status: "effective" }),
      makeIntervention({ id: "i4", childId: "child-2", status: "in_progress" }), // not counted
    ];

    const result = generateContextualAssessment(
      baseChildren, [], [], [], [], interventions, [],
      "oak-house", "2026-05-01", "2026-05-18",
    );

    expect(result.effectiveInterventions).toBe(2);
    // 2 effective out of 3 completed (effective + ineffective) = 67%
    expect(result.interventionEffectivenessRate).toBe(67);
  });

  it("calculates multi-agency rate", () => {
    const interventions: Intervention[] = [
      makeIntervention({ id: "i1", multiAgencyInvolved: true }),
      makeIntervention({ id: "i2", childId: "child-2", multiAgencyInvolved: false }),
    ];

    const result = generateContextualAssessment(
      baseChildren, [], [], [], [], interventions, [],
      "oak-house", "2026-05-01", "2026-05-18",
    );

    expect(result.multiAgencyRate).toBe(50);
  });

  it("includes regulatory links for exploitation", () => {
    const envRisks = [
      makeEnvRisk({ harmDomains: ["criminal_exploitation"], associatedChildren: ["child-1"] }),
    ];

    const result = generateContextualAssessment(
      baseChildren, envRisks, [], [], [], [], [],
      "oak-house", "2026-05-01", "2026-05-18",
    );

    expect(result.regulatoryLinks.some((l) => l.includes("exploitation"))).toBe(true);
  });

  it("handles empty data gracefully", () => {
    const result = generateContextualAssessment(
      baseChildren, [], [], [], [], [], [],
      "oak-house", "2026-05-01", "2026-05-18",
    );

    expect(result.totalChildren).toBe(3);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.childrenAtSeriousRisk).toBe(0);
  });

  it("populates metadata", () => {
    const result = generateContextualAssessment(
      baseChildren, [], [], [], [], [], [],
      "oak-house", "2026-05-01", "2026-05-18",
    );

    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-05-01");
    expect(result.periodEnd).toBe("2026-05-18");
    expect(result.assessedAt).toBeTruthy();
  });
});

// ── Utility Labels ─────────────────────────────────────────────────────────

describe("utility label functions", () => {
  it("getHarmDomainLabel returns correct labels", () => {
    expect(getHarmDomainLabel("county_lines")).toBe("County Lines");
    expect(getHarmDomainLabel("sexual_exploitation")).toBe("Sexual Exploitation (CSE)");
    expect(getHarmDomainLabel("online_exploitation")).toBe("Online Exploitation");
    expect(getHarmDomainLabel("harmful_sexual_behaviour")).toBe("Harmful Sexual Behaviour");
  });

  it("getEnvironmentTypeLabel returns correct labels", () => {
    expect(getEnvironmentTypeLabel("location")).toBe("Location");
    expect(getEnvironmentTypeLabel("peer_group")).toBe("Peer Group");
    expect(getEnvironmentTypeLabel("online_space")).toBe("Online Space");
  });

  it("getRiskLevelLabel returns correct labels", () => {
    expect(getRiskLevelLabel("low")).toBe("Low");
    expect(getRiskLevelLabel("serious")).toBe("Serious");
  });

  it("getProtectiveFactorLabel returns correct labels", () => {
    expect(getProtectiveFactorLabel("trusted_adult")).toBe("Trusted Adult Relationship");
    expect(getProtectiveFactorLabel("safety_plan")).toBe("Safety Plan");
    expect(getProtectiveFactorLabel("placement_stability")).toBe("Placement Stability");
  });
});
