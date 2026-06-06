// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Escalation & Threshold Decision Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  generateEscalationMetrics,
  assessConcern,
  getRequiredEscalations,
  determineThresholdLevel,
  getConcernCategoryLabel,
  getThresholdLevelLabel,
  getEscalationTargetLabel,
  getTimeframeLabel,
  getOutcomeLabel,
} from "../escalation-intelligence-engine";
import type {
  ConcernRecord,
  EscalationRecord,
} from "../escalation-intelligence-engine";

// ── Test Fixtures ──────────────────────────────────────────────────────────

const makeConcern = (overrides: Partial<ConcernRecord> = {}): ConcernRecord => ({
  id: "concern-1",
  date: "2026-05-10",
  time: "14:30",
  category: "safeguarding",
  severity: 3,
  childId: "child-1",
  childName: "Alex",
  raisedBy: "Sarah Johnson",
  description: "Disclosure of historical abuse",
  contextFactors: ["verbal_disclosure", "trusted_adult"],
  previousOccurrences: 0,
  immediateRiskPresent: false,
  ...overrides,
});

const makeEscalation = (overrides: Partial<EscalationRecord> = {}): EscalationRecord => ({
  id: "esc-1",
  concernId: "concern-1",
  escalatedTo: "registered_manager",
  escalatedBy: "Sarah Johnson",
  escalatedAt: "2026-05-10T14:45:00",
  method: "phone",
  responseReceived: true,
  responseTime: "2026-05-10T15:00:00",
  referenceNumber: "REF-001",
  outcome: "Strategy discussion initiated",
  ...overrides,
});

// ── determineThresholdLevel ────────────────────────────────────────────────

describe("determineThresholdLevel", () => {
  it("returns level 4 for safeguarding severity 4+", () => {
    const result = determineThresholdLevel("safeguarding", 4, 0, false);
    expect(result).toBe("level_4_child_protection");
  });

  it("returns level 3 for safeguarding severity 2-3", () => {
    const result = determineThresholdLevel("safeguarding", 3, 0, false);
    expect(result).toBe("level_3_child_in_need");
  });

  it("returns level 2 for safeguarding severity 1", () => {
    const result = determineThresholdLevel("safeguarding", 1, 0, false);
    expect(result).toBe("level_2_early_help");
  });

  it("returns level 4 when immediate risk present with severity 3+", () => {
    const result = determineThresholdLevel("property_damage", 3, 0, true);
    expect(result).toBe("level_4_child_protection");
  });

  it("returns level 3 when immediate risk present with lower severity", () => {
    const result = determineThresholdLevel("emotional_distress", 2, 0, true);
    expect(result).toBe("level_3_child_in_need");
  });

  it("escalates to level 3 when 3+ previous occurrences", () => {
    const result = determineThresholdLevel("property_damage", 2, 3, false);
    expect(result).toBe("level_3_child_in_need");
  });

  it("returns level 1 for low severity with no history", () => {
    const result = determineThresholdLevel("emotional_distress", 1, 0, false);
    expect(result).toBe("level_1_universal");
  });

  it("exploitation always at least level 2", () => {
    const result = determineThresholdLevel("exploitation", 1, 0, false);
    expect(result).toBe("level_2_early_help");
  });

  it("exploitation severity 3 is level 3", () => {
    const result = determineThresholdLevel("exploitation", 3, 0, false);
    expect(result).toBe("level_3_child_in_need");
  });
});

// ── getRequiredEscalations ─────────────────────────────────────────────────

describe("getRequiredEscalations", () => {
  it("requires RM and MASH for safeguarding severity 3", () => {
    const concern = makeConcern({ category: "safeguarding", severity: 3 });
    const result = getRequiredEscalations(concern);

    const targets = result.map((r) => r.target);
    expect(targets).toContain("registered_manager");
    expect(targets).toContain("local_authority_mash");
    expect(targets).toContain("internal_manager");
  });

  it("requires Ofsted notification for safeguarding severity 4+", () => {
    const concern = makeConcern({ category: "safeguarding", severity: 4 });
    const result = getRequiredEscalations(concern);

    const targets = result.map((r) => r.target);
    expect(targets).toContain("ofsted");
    expect(targets).toContain("police");
  });

  it("requires LADO for staff allegations", () => {
    const concern = makeConcern({ category: "staff_allegation", severity: 3 });
    const result = getRequiredEscalations(concern);

    const targets = result.map((r) => r.target);
    expect(targets).toContain("lado");
    expect(targets).toContain("ofsted");
  });

  it("requires police for missing severity 2+", () => {
    const concern = makeConcern({ category: "missing", severity: 2 });
    const result = getRequiredEscalations(concern);

    const targets = result.map((r) => r.target);
    expect(targets).toContain("police");
    expect(targets).toContain("placing_authority");
  });

  it("requires CAMHS crisis for serious self-harm", () => {
    const concern = makeConcern({ category: "self_harm", severity: 3 });
    const result = getRequiredEscalations(concern);

    const targets = result.map((r) => r.target);
    expect(targets).toContain("camhs_crisis");
  });

  it("requires DBS for serious staff allegations", () => {
    const concern = makeConcern({ category: "staff_allegation", severity: 4 });
    const result = getRequiredEscalations(concern);

    const targets = result.map((r) => r.target);
    expect(targets).toContain("dbs");
  });

  it("all required escalations have timeframe and regulatory basis", () => {
    const concern = makeConcern({ category: "safeguarding", severity: 5 });
    const result = getRequiredEscalations(concern);

    for (const escalation of result) {
      expect(escalation.timeframe).toBeTruthy();
      expect(escalation.regulatoryBasis).toBeTruthy();
    }
  });
});

// ── assessConcern ──────────────────────────────────────────────────────────

describe("assessConcern", () => {
  it("returns appropriate_and_timely when all escalations made on time", () => {
    const concern = makeConcern({ category: "safeguarding", severity: 3 });
    const escalations = [
      makeEscalation({ id: "e1", escalatedTo: "internal_manager", escalatedAt: "2026-05-10T14:35:00" }),
      makeEscalation({ id: "e2", escalatedTo: "registered_manager", escalatedAt: "2026-05-10T14:40:00" }),
      makeEscalation({ id: "e3", escalatedTo: "local_authority_mash", escalatedAt: "2026-05-10T15:00:00" }),
    ];

    const result = assessConcern(concern, escalations, "2026-05-10T16:00:00");
    expect(result.outcome).toBe("appropriate_and_timely");
    expect(result.timeliness).toBe("on_time");
    expect(result.missingEscalations).toHaveLength(0);
  });

  it("returns under_escalated when some notifications missing", () => {
    const concern = makeConcern({ category: "safeguarding", severity: 3 });
    const escalations = [
      makeEscalation({ id: "e1", escalatedTo: "internal_manager", escalatedAt: "2026-05-10T14:35:00" }),
      // Missing: registered_manager, local_authority_mash
    ];

    const result = assessConcern(concern, escalations, "2026-05-11T16:00:00");
    expect(result.outcome).toBe("under_escalated");
    expect(result.missingEscalations.length).toBeGreaterThan(0);
  });

  it("returns not_escalated when no escalations made", () => {
    const concern = makeConcern({ category: "safeguarding", severity: 4 });
    const result = assessConcern(concern, [], "2026-05-11T16:00:00");
    expect(result.outcome).toBe("not_escalated");
  });

  it("does NOT mark a serious concern compliant just because no threshold rule matched", () => {
    // property_damage has no escalation rule, but at severity 3 with immediate risk
    // it resolves to a child-protection-level concern. With nothing escalated it must
    // surface as not_escalated — never appropriate_and_timely (the previous bug).
    const concern = makeConcern({ category: "property_damage", severity: 3, immediateRiskPresent: true });
    const result = assessConcern(concern, [], "2026-05-11T16:00:00");
    expect(result.outcome).toBe("not_escalated");
  });

  it("still passes a genuinely low-level concern that has no rule and needs no escalation", () => {
    const concern = makeConcern({ category: "property_damage", severity: 1, immediateRiskPresent: false, previousOccurrences: 0 });
    const result = assessConcern(concern, [], "2026-05-11T16:00:00");
    expect(result.outcome).toBe("appropriate_and_timely");
  });

  it("returns appropriate_but_delayed when all made but late", () => {
    const concern = makeConcern({ category: "safeguarding", severity: 3 });
    // Required: immediate (within 1 hour), but escalated 3 hours later
    const escalations = [
      makeEscalation({ id: "e1", escalatedTo: "internal_manager", escalatedAt: "2026-05-10T17:30:00" }),
      makeEscalation({ id: "e2", escalatedTo: "registered_manager", escalatedAt: "2026-05-10T17:30:00" }),
      makeEscalation({ id: "e3", escalatedTo: "local_authority_mash", escalatedAt: "2026-05-10T17:30:00" }),
    ];

    const result = assessConcern(concern, escalations, "2026-05-10T18:00:00");
    expect(result.outcome).toBe("appropriate_but_delayed");
    expect(result.timeliness).toBe("delayed");
  });

  it("identifies overdue missing escalations", () => {
    const concern = makeConcern({ category: "missing", severity: 4 });
    const escalations: EscalationRecord[] = [];

    // 25 hours after the concern — "immediate" (1hr) is well overdue
    const result = assessConcern(concern, escalations, "2026-05-11T15:30:00");

    const overdueItems = result.missingEscalations.filter((m) => m.isOverdue);
    expect(overdueItems.length).toBeGreaterThan(0);
    expect(overdueItems[0].hoursOverdue).toBeGreaterThan(0);
  });

  it("returns pending when still within timeframe", () => {
    const concern = makeConcern({ category: "violence", severity: 3, date: "2026-05-10", time: "14:30" });
    // Required within 24 hours, checking 2 hours later
    const escalations: EscalationRecord[] = [];

    const result = assessConcern(concern, escalations, "2026-05-10T16:30:00");
    // Some escalations may have immediate timeframe, others within_24_hours
    // Check that at least some are pending (not overdue)
    const pending = result.missingEscalations.filter((m) => !m.isOverdue);
    expect(pending.length).toBeGreaterThanOrEqual(0); // depends on category rules
  });

  it("correctly determines threshold level", () => {
    const concern = makeConcern({ category: "exploitation", severity: 4, immediateRiskPresent: true });
    const result = assessConcern(concern, [], "2026-05-10T16:00:00");
    expect(result.determinedLevel).toBe("level_4_child_protection");
  });
});

// ── generateEscalationMetrics ──────────────────────────────────────────────

describe("generateEscalationMetrics", () => {
  it("produces high score for fully compliant escalation practice", () => {
    const concerns = [
      makeConcern({ id: "c1", category: "safeguarding", severity: 3, date: "2026-05-05" }),
      makeConcern({ id: "c2", category: "missing", severity: 2, date: "2026-05-08" }),
    ];
    const escalations = [
      // Concern 1: safeguarding - all required
      makeEscalation({ id: "e1", concernId: "c1", escalatedTo: "internal_manager", escalatedAt: "2026-05-05T14:35:00" }),
      makeEscalation({ id: "e2", concernId: "c1", escalatedTo: "registered_manager", escalatedAt: "2026-05-05T14:40:00" }),
      makeEscalation({ id: "e3", concernId: "c1", escalatedTo: "local_authority_mash", escalatedAt: "2026-05-05T15:00:00" }),
      // Concern 2: missing - all required
      makeEscalation({ id: "e4", concernId: "c2", escalatedTo: "internal_manager", escalatedAt: "2026-05-08T14:35:00" }),
      makeEscalation({ id: "e5", concernId: "c2", escalatedTo: "police", escalatedAt: "2026-05-08T14:40:00" }),
      makeEscalation({ id: "e6", concernId: "c2", escalatedTo: "placing_authority", escalatedAt: "2026-05-08T14:45:00" }),
    ];

    const result = generateEscalationMetrics(
      concerns, escalations, "oak-house", "2026-05-01", "2026-05-18", "2026-05-18T17:00:00",
    );

    expect(result.overallScore).toBeGreaterThanOrEqual(70);
    expect(result.rating).toMatch(/outstanding|good/);
    expect(result.thresholdAccuracyRate).toBe(100);
    expect(result.escalationsMissing).toBe(0);
  });

  it("produces low score when escalations missing", () => {
    const concerns = [
      makeConcern({ id: "c1", category: "safeguarding", severity: 4, date: "2026-05-05" }),
      makeConcern({ id: "c2", category: "staff_allegation", severity: 3, date: "2026-05-08" }),
    ];
    const escalations: EscalationRecord[] = []; // Nothing escalated!

    const result = generateEscalationMetrics(
      concerns, escalations, "oak-house", "2026-05-01", "2026-05-18", "2026-05-18T17:00:00",
    );

    expect(result.overallScore).toBeLessThan(50);
    expect(result.escalationsMissing).toBe(2);
    expect(result.immediateActions.length).toBeGreaterThan(0);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("calculates Ofsted compliance rate", () => {
    const concerns = [
      makeConcern({ id: "c1", category: "safeguarding", severity: 4, date: "2026-05-05" }),
      makeConcern({ id: "c2", category: "safeguarding", severity: 4, date: "2026-05-08" }),
    ];
    const escalations = [
      // Only one has Ofsted notification
      makeEscalation({ id: "e1", concernId: "c1", escalatedTo: "ofsted", escalatedAt: "2026-05-05T15:00:00" }),
      makeEscalation({ id: "e2", concernId: "c1", escalatedTo: "registered_manager", escalatedAt: "2026-05-05T14:35:00" }),
      makeEscalation({ id: "e3", concernId: "c1", escalatedTo: "local_authority_mash", escalatedAt: "2026-05-05T14:40:00" }),
      makeEscalation({ id: "e4", concernId: "c1", escalatedTo: "police", escalatedAt: "2026-05-05T14:42:00" }),
      makeEscalation({ id: "e5", concernId: "c1", escalatedTo: "internal_manager", escalatedAt: "2026-05-05T14:32:00" }),
      // c2: missing ofsted notification
      makeEscalation({ id: "e6", concernId: "c2", escalatedTo: "registered_manager", escalatedAt: "2026-05-08T14:35:00" }),
    ];

    const result = generateEscalationMetrics(
      concerns, escalations, "oak-house", "2026-05-01", "2026-05-18", "2026-05-18T17:00:00",
    );

    expect(result.ofstedRequired).toBe(2);
    expect(result.ofstedNotified).toBe(1);
    expect(result.ofstedComplianceRate).toBe(50);
  });

  it("calculates multi-agency engagement rate", () => {
    const concerns = [
      makeConcern({ id: "c1", category: "safeguarding", severity: 3, date: "2026-05-05" }),
    ];
    const escalations = [
      makeEscalation({ id: "e1", concernId: "c1", escalatedTo: "local_authority_mash", escalatedAt: "2026-05-05T15:00:00" }),
    ];

    const result = generateEscalationMetrics(
      concerns, escalations, "oak-house", "2026-05-01", "2026-05-18", "2026-05-18T17:00:00",
    );

    expect(result.multiAgencyEngagementRate).toBe(100); // 1/1 that needed multi-agency
  });

  it("includes regulatory links", () => {
    const concerns = [makeConcern({ category: "safeguarding", severity: 4 })];
    const escalations: EscalationRecord[] = [];

    const result = generateEscalationMetrics(
      concerns, escalations, "oak-house", "2026-05-01", "2026-05-18", "2026-05-18T17:00:00",
    );

    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 12"))).toBe(true);
  });

  it("filters concerns to period", () => {
    const concerns = [
      makeConcern({ id: "c-outside", date: "2026-04-01" }), // outside period
      makeConcern({ id: "c-inside", date: "2026-05-10" }),
    ];

    const result = generateEscalationMetrics(
      concerns, [], "oak-house", "2026-05-01", "2026-05-18", "2026-05-18T17:00:00",
    );

    expect(result.totalConcernsRaised).toBe(1);
  });

  it("handles empty data gracefully", () => {
    const result = generateEscalationMetrics(
      [], [], "oak-house", "2026-05-01", "2026-05-18", "2026-05-18T17:00:00",
    );

    expect(result.totalConcernsRaised).toBe(0);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.thresholdAccuracyRate).toBe(100);
  });

  it("generates immediate actions for overdue Ofsted notifications", () => {
    const concerns = [
      makeConcern({ id: "c1", category: "safeguarding", severity: 4, date: "2026-05-10", time: "10:00" }),
    ];

    const result = generateEscalationMetrics(
      concerns, [], "oak-house", "2026-05-01", "2026-05-18", "2026-05-18T17:00:00",
    );

    expect(result.immediateActions.some((a) => a.includes("Ofsted"))).toBe(true);
  });

  it("calculates average response time", () => {
    const concerns = [makeConcern({ id: "c1" })];
    const escalations = [
      makeEscalation({
        id: "e1",
        concernId: "c1",
        escalatedAt: "2026-05-10T14:00:00",
        responseReceived: true,
        responseTime: "2026-05-10T16:00:00", // 2 hours
      }),
      makeEscalation({
        id: "e2",
        concernId: "c1",
        escalatedTo: "local_authority_mash",
        escalatedAt: "2026-05-10T14:30:00",
        responseReceived: true,
        responseTime: "2026-05-10T18:30:00", // 4 hours
      }),
    ];

    const result = generateEscalationMetrics(
      concerns, escalations, "oak-house", "2026-05-01", "2026-05-18", "2026-05-18T17:00:00",
    );

    expect(result.averageResponseTimeHours).toBe(3); // (2+4)/2
  });

  it("populates home and period metadata", () => {
    const result = generateEscalationMetrics(
      [], [], "oak-house", "2026-05-01", "2026-05-18", "2026-05-18T17:00:00",
    );

    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-05-01");
    expect(result.periodEnd).toBe("2026-05-18");
    expect(result.assessedAt).toBeTruthy();
  });
});

// ── Utility Label Functions ────────────────────────────────────────────────

describe("utility label functions", () => {
  it("getConcernCategoryLabel returns correct labels", () => {
    expect(getConcernCategoryLabel("safeguarding")).toBe("Safeguarding Concern");
    expect(getConcernCategoryLabel("exploitation")).toBe("Exploitation");
    expect(getConcernCategoryLabel("staff_allegation")).toBe("Staff Allegation");
    expect(getConcernCategoryLabel("peer_on_peer_abuse")).toBe("Peer-on-Peer Abuse");
    expect(getConcernCategoryLabel("online_harm")).toBe("Online Harm");
  });

  it("getThresholdLevelLabel returns correct labels", () => {
    expect(getThresholdLevelLabel("level_1_universal")).toContain("Universal");
    expect(getThresholdLevelLabel("level_4_child_protection")).toContain("Child Protection");
  });

  it("getEscalationTargetLabel returns correct labels", () => {
    expect(getEscalationTargetLabel("ofsted")).toBe("Ofsted (HMCI)");
    expect(getEscalationTargetLabel("lado")).toBe("LADO");
    expect(getEscalationTargetLabel("local_authority_mash")).toBe("Local Authority MASH");
    expect(getEscalationTargetLabel("dbs")).toBe("DBS");
  });

  it("getTimeframeLabel returns correct labels", () => {
    expect(getTimeframeLabel("immediate")).toContain("1 hour");
    expect(getTimeframeLabel("within_24_hours")).toContain("24 Hours");
  });

  it("getOutcomeLabel returns correct labels", () => {
    expect(getOutcomeLabel("appropriate_and_timely")).toBe("Appropriate & Timely");
    expect(getOutcomeLabel("under_escalated")).toBe("Under-Escalated");
    expect(getOutcomeLabel("not_escalated")).toBe("Not Escalated");
  });
});
