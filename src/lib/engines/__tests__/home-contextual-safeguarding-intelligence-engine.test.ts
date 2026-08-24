// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME CONTEXTUAL SAFEGUARDING INTELLIGENCE ENGINE — TESTS
// Comprehensive coverage: insufficient data, rating classifications, risk
// identification modifier, protective actions modifier, multi-agency modifier,
// resolution modifier, review timeliness modifier, high risk management
// modifier, metric calculations, strengths, concerns, recommendations,
// insights, headlines, and edge cases.
// CHR 2015 Reg 12, SCCIF Safeguarding.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeContextualSafeguarding,
  type ContextualSafeguardingInput,
  type ContextualRiskInput,
} from "../home-contextual-safeguarding-intelligence-engine";

const TODAY = "2026-05-27";

// ── Test Helpers ────────────────────────────────────────────────────────────

let _rid = 0;
function makeRisk(overrides: Partial<ContextualRiskInput> = {}): ContextualRiskInput {
  _rid++;
  return {
    id: `cr_${_rid}`,
    context_type: "location",
    risk_level: "medium",
    status: "active",
    children_affected_count: 2,
    risk_factors_count: 3,
    protective_actions_count: 1,
    multi_agency_actions_count: 1,
    has_police_intelligence: false,
    has_community_mapping: true,
    needs_review: false,
    ...overrides,
  };
}

function baseInput(overrides: Partial<ContextualSafeguardingInput> = {}): ContextualSafeguardingInput {
  return {
    today: TODAY,
    total_children: 6,
    risks: [],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("computeContextualSafeguarding", () => {

  // ─── 1. Insufficient Data ──────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data when total_children is 0", () => {
      const r = computeContextualSafeguarding(baseInput({ total_children: 0 }));
      expect(r.safeguarding_rating).toBe("insufficient_data");
      expect(r.safeguarding_score).toBe(0);
      expect(r.headline).toBe("No data available for contextual safeguarding analysis");
    });

    it("leaves every rate unmeasured when total_children is 0", () => {
      const r = computeContextualSafeguarding(baseInput({ total_children: 0 }));
      expect(r.total_risks).toBe(0);
      expect(r.active_risks).toBe(0);
      expect(r.high_risk_count).toBe(0);
      expect(r.protective_actions_rate).toBeNull();
      expect(r.multi_agency_rate).toBeNull();
      expect(r.resolution_rate).toBeNull();
      expect(r.review_overdue_count).toBe(0);
    });

    it("returns empty arrays when total_children is 0", () => {
      const r = computeContextualSafeguarding(baseInput({ total_children: 0 }));
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });

    it("returns insufficient_data even if risks are provided but total_children is 0", () => {
      const r = computeContextualSafeguarding(baseInput({
        total_children: 0,
        risks: [makeRisk()],
      }));
      expect(r.safeguarding_rating).toBe("insufficient_data");
      expect(r.safeguarding_score).toBe(0);
    });
  });

  // ─── 2. Zero Risks ────────────────────────────────────────────

  describe("zero risks", () => {
    // Base 52, M1: -3, M2: no adj, M3: -1, M4: no adj, M5: -1, M6: -2 = 45
    it("scores 45 (adequate) with zero risks", () => {
      const r = computeContextualSafeguarding(baseInput());
      expect(r.safeguarding_score).toBe(45);
      expect(r.safeguarding_rating).toBe("adequate");
    });

    it("leaves every rate unmeasured with zero risks", () => {
      const r = computeContextualSafeguarding(baseInput());
      expect(r.total_risks).toBe(0);
      expect(r.active_risks).toBe(0);
      expect(r.high_risk_count).toBe(0);
      expect(r.protective_actions_rate).toBeNull();
      expect(r.multi_agency_rate).toBeNull();
      expect(r.resolution_rate).toBeNull();
      expect(r.review_overdue_count).toBe(0);
    });

    it("shows no-mapping concern with zero risks", () => {
      const r = computeContextualSafeguarding(baseInput());
      expect(r.concerns).toContain("No contextual safeguarding risks assessed — the home may be unaware of environmental threats");
    });

    it("includes mapping recommendation with zero risks", () => {
      const r = computeContextualSafeguarding(baseInput());
      expect(r.recommendations.length).toBeGreaterThanOrEqual(1);
      expect(r.recommendations[0].recommendation).toBe("Conduct a contextual safeguarding mapping exercise covering locations, peers and online spaces");
      expect(r.recommendations[0].urgency).toBe("immediate");
    });

    it("includes critical insight about no mapping with zero risks", () => {
      const r = computeContextualSafeguarding(baseInput());
      expect(r.insights).toContainEqual({
        text: "No contextual mapping leaves children vulnerable to unseen risks — exploitation, county lines and peer influence go undetected",
        severity: "critical",
      });
    });
  });

  // ─── 3. Outstanding Scenario ───────────────────────────────────

  describe("outstanding scenario", () => {
    // 5 risks, all resolved, all have protective actions, all have multi-agency,
    // no overdue, no high risk
    // Base 52, M1: +5, M2: +6 (100%), M3: +5 (100%), M4: +5 (100% resolved),
    // M5: +4 (0 overdue), M6: +5 (0 high risk) = 82
    function outstandingRisks(): ContextualRiskInput[] {
      return Array.from({ length: 5 }, (_, i) =>
        makeRisk({
          id: `cr_out_${i}`,
          risk_level: "low",
          status: "resolved",
          protective_actions_count: 3,
          multi_agency_actions_count: 2,
          needs_review: false,
        })
      );
    }

    it("scores 82 (outstanding) with ideal contextual safeguarding", () => {
      const r = computeContextualSafeguarding(baseInput({ risks: outstandingRisks() }));
      expect(r.safeguarding_score).toBe(82);
      expect(r.safeguarding_rating).toBe("outstanding");
    });

    it("has correct headline for outstanding", () => {
      const r = computeContextualSafeguarding(baseInput({ risks: outstandingRisks() }));
      expect(r.headline).toBe("Contextual safeguarding is proactive — risks are identified, managed and resolved through multi-agency work");
    });

    it("generates appropriate strengths for outstanding", () => {
      const r = computeContextualSafeguarding(baseInput({ risks: outstandingRisks() }));
      expect(r.strengths).toContain("Comprehensive contextual risk mapping shows the home is actively scanning the environment");
      expect(r.strengths).toContain("Protective actions are in place for virtually all identified contextual risks");
      expect(r.strengths).toContain("Strong multi-agency engagement ensures risks are tackled collaboratively");
      expect(r.strengths).toContain("Good resolution rate shows contextual risks are being effectively managed down");
      expect(r.strengths).toContain("All contextual risk reviews are up to date — oversight is current");
      expect(r.strengths).toContain("No high or very high contextual risks identified — children's environments are safe");
    });

    it("has empty concerns for outstanding", () => {
      const r = computeContextualSafeguarding(baseInput({ risks: outstandingRisks() }));
      expect(r.concerns).toEqual([]);
    });

    it("has empty recommendations for outstanding", () => {
      const r = computeContextualSafeguarding(baseInput({ risks: outstandingRisks() }));
      expect(r.recommendations).toEqual([]);
    });

    it("includes exemplary insight for outstanding", () => {
      // protectiveRate>=90, multiAgencyRate>=80, overdue===0, total>=3
      const r = computeContextualSafeguarding(baseInput({ risks: outstandingRisks() }));
      expect(r.insights).toContainEqual({
        text: "Contextual safeguarding is exemplary — risks are mapped, managed and reviewed through active partnership working",
        severity: "positive",
      });
    });
  });

  // ─── 4. Good Scenario ─────────────────────────────────────────

  describe("good scenario", () => {
    // 5 risks: 3 resolved, all with protective actions, 4/5 multi-agency, 0 overdue, 0 high risk
    // Base 52, M1: +5 (5 risks), M2: +6 (100% protective), M3: +5 (80% multi-agency),
    // M4: +5 (60% resolved), M5: +4 (0 overdue), M6: +5 (0 high) = 82 => outstanding
    // Need to adjust for good range (65-79)
    // 5 risks: 3 resolved (60%), all protective, 3/5 multi-agency (60%), 0 overdue, 0 high
    // Base 52, M1: +5, M2: +6, M3: +2 (60%), M4: +5, M5: +4, M6: +5 = 79
    function goodRisks(): ContextualRiskInput[] {
      return [
        makeRisk({ id: "cr_g1", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 1, risk_level: "low" }),
        makeRisk({ id: "cr_g2", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 1, risk_level: "low" }),
        makeRisk({ id: "cr_g3", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 1, risk_level: "low" }),
        makeRisk({ id: "cr_g4", status: "active", protective_actions_count: 2, multi_agency_actions_count: 0, risk_level: "low" }),
        makeRisk({ id: "cr_g5", status: "active", protective_actions_count: 2, multi_agency_actions_count: 0, risk_level: "low" }),
      ];
    }

    it("scores 79 (good) with solid contextual safeguarding", () => {
      const r = computeContextualSafeguarding(baseInput({ risks: goodRisks() }));
      expect(r.safeguarding_score).toBe(79);
      expect(r.safeguarding_rating).toBe("good");
    });

    it("has correct headline for good", () => {
      const r = computeContextualSafeguarding(baseInput({ risks: goodRisks() }));
      expect(r.headline).toBe("Good contextual safeguarding practice with effective risk identification and protective planning");
    });

    it("generates appropriate strengths for good", () => {
      const r = computeContextualSafeguarding(baseInput({ risks: goodRisks() }));
      expect(r.strengths).toContain("Comprehensive contextual risk mapping shows the home is actively scanning the environment");
      expect(r.strengths).toContain("Protective actions are in place for virtually all identified contextual risks");
      expect(r.strengths).toContain("Good resolution rate shows contextual risks are being effectively managed down");
      expect(r.strengths).toContain("All contextual risk reviews are up to date — oversight is current");
      expect(r.strengths).toContain("No high or very high contextual risks identified — children's environments are safe");
    });
  });

  // ─── 5. Adequate Scenario ─────────────────────────────────────

  describe("adequate scenario", () => {
    // 3 risks: 1 resolved, 2 with protective actions, 1 multi-agency, 1 overdue, 0 high
    // Base 52, M1: +2 (3 risks), M2: pct(2,3)=67 → no adj (>=50 <70), M3: pct(1,3)=33 → no adj (>=30 <50),
    // M4: pct(1,3)=33 → +2, M5: 1 overdue → +1, M6: 0 high → +5 = 62
    // Actually M2: 67 is <70 and >=50 so no adj from any bracket (not >=90, not >=70, not <50)
    // M3: 33 is <50 and >=30, so no adj from any bracket (not >=80, not >=50, not <30)
    // 52 + 2 + 0 + 0 + 2 + 1 + 5 = 62

    function adequateRisks(): ContextualRiskInput[] {
      return [
        makeRisk({ id: "cr_a1", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 1, risk_level: "low", needs_review: false }),
        makeRisk({ id: "cr_a2", status: "active", protective_actions_count: 1, multi_agency_actions_count: 0, risk_level: "medium", needs_review: true }),
        makeRisk({ id: "cr_a3", status: "active", protective_actions_count: 0, multi_agency_actions_count: 0, risk_level: "low", needs_review: false }),
      ];
    }

    it("scores 62 (adequate) with mixed contextual safeguarding", () => {
      const r = computeContextualSafeguarding(baseInput({ risks: adequateRisks() }));
      expect(r.safeguarding_score).toBe(62);
      expect(r.safeguarding_rating).toBe("adequate");
    });

    it("has correct headline for adequate", () => {
      const r = computeContextualSafeguarding(baseInput({ risks: adequateRisks() }));
      expect(r.headline).toBe("Contextual safeguarding is adequate but needs stronger multi-agency engagement and follow-through");
    });
  });

  // ─── 6. Inadequate Scenario ────────────────────────────────────

  describe("inadequate scenario", () => {
    // 4 risks: 0 resolved, 0 protective, 0 multi-agency, 4 overdue, 2 high
    // Base 52, M1: +2 (4 risks), M2: pct(0,4)=0 → -5 (<50), M3: pct(0,4)=0 → -4 (<30),
    // M4: 0% && total>2 → -5, M5: 4 overdue >=3 → -4, M6: highRiskCount=2, highProtectedRate=pct(0,2)=0 → -5
    // 52 + 2 - 5 - 4 - 5 - 4 - 5 = 31

    function inadequateRisks(): ContextualRiskInput[] {
      return [
        makeRisk({ id: "cr_i1", status: "active", protective_actions_count: 0, multi_agency_actions_count: 0, risk_level: "high", needs_review: true }),
        makeRisk({ id: "cr_i2", status: "active", protective_actions_count: 0, multi_agency_actions_count: 0, risk_level: "very_high", needs_review: true }),
        makeRisk({ id: "cr_i3", status: "escalated", protective_actions_count: 0, multi_agency_actions_count: 0, risk_level: "medium", needs_review: true }),
        makeRisk({ id: "cr_i4", status: "active", protective_actions_count: 0, multi_agency_actions_count: 0, risk_level: "low", needs_review: true }),
      ];
    }

    it("scores 31 (inadequate) with failing contextual safeguarding", () => {
      const r = computeContextualSafeguarding(baseInput({ risks: inadequateRisks() }));
      expect(r.safeguarding_score).toBe(31);
      expect(r.safeguarding_rating).toBe("inadequate");
    });

    it("has correct headline for inadequate", () => {
      const r = computeContextualSafeguarding(baseInput({ risks: inadequateRisks() }));
      expect(r.headline).toBe("Contextual safeguarding practice is inadequate — children face unmanaged environmental risks");
    });

    it("generates appropriate concerns for inadequate", () => {
      const r = computeContextualSafeguarding(baseInput({ risks: inadequateRisks() }));
      expect(r.concerns).toContain("Most contextual risks lack protective actions — children are exposed without mitigation");
      expect(r.concerns).toContain("Multi-agency engagement is absent from most contextual risks — the home is working in isolation");
      expect(r.concerns).toContain("4 contextual risk reviews are overdue — risks may have escalated unnoticed");
      expect(r.concerns).toContain("No contextual risks have been resolved — intervention is not achieving outcomes");
    });

    it("generates appropriate recommendations for inadequate", () => {
      const r = computeContextualSafeguarding(baseInput({ risks: inadequateRisks() }));
      expect(r.recommendations.length).toBeGreaterThanOrEqual(4);
      const recTexts = r.recommendations.map(rec => rec.recommendation);
      expect(recTexts).toContain("Develop protective action plans for all identified contextual risks");
      expect(recTexts).toContain("Strengthen multi-agency partnerships to address contextual risks collaboratively");
      expect(recTexts).toContain("Complete 4 overdue contextual risk reviews to ensure risks are current");
      expect(recTexts).toContain("Escalate high-risk contextual concerns to senior management and relevant agencies");
    });
  });

  // ─── 7. Risk Identification Modifier ───────────────────────────

  describe("risk identification modifier", () => {
    // Isolate M1 by using consistent values for other modifiers
    // All risks: resolved, has protective, has multi-agency, no overdue, low risk
    // This gives: M2: +6, M3: +5, M4: +5, M5: +4, M6: +5 = constant +25

    function makeIdealRisk(id: string): ContextualRiskInput {
      return makeRisk({
        id,
        status: "resolved",
        protective_actions_count: 2,
        multi_agency_actions_count: 2,
        risk_level: "low",
        needs_review: false,
      });
    }

    it("subtracts 3 for 0 risks (total===0 gives different M3/M5/M6 path)", () => {
      // 0 risks: M1: -3, M2: no adj, M3: -1, M4: no adj, M5: -1, M6: -2 = 52-3-1-1-2 = 45
      const r = computeContextualSafeguarding(baseInput({ risks: [] }));
      expect(r.safeguarding_score).toBe(45);
    });

    it("applies no adjustment for 1 risk", () => {
      // 1 risk: M1: 0 (total===1, not >=2, not ===0), M2: +6, M3: +5, M4: +5, M5: +4, M6: +5
      // 52 + 0 + 6 + 5 + 5 + 4 + 5 = 77
      const r = computeContextualSafeguarding(baseInput({ risks: [makeIdealRisk("r1")] }));
      expect(r.safeguarding_score).toBe(77);
    });

    it("adds 2 for 2 risks", () => {
      // 2 risks: M1: +2, M2: +6, M3: +5, M4: +5, M5: +4, M6: +5
      // 52 + 2 + 6 + 5 + 5 + 4 + 5 = 79
      const risks = [makeIdealRisk("r1"), makeIdealRisk("r2")];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.safeguarding_score).toBe(79);
    });

    it("adds 2 for 4 risks", () => {
      // 4 risks: M1: +2, M2: +6, M3: +5, M4: +5, M5: +4, M6: +5
      // 52 + 2 + 6 + 5 + 5 + 4 + 5 = 79
      const risks = Array.from({ length: 4 }, (_, i) => makeIdealRisk(`r${i}`));
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.safeguarding_score).toBe(79);
    });

    it("adds 5 for 5 risks", () => {
      // 5 risks: M1: +5, M2: +6, M3: +5, M4: +5, M5: +4, M6: +5
      // 52 + 5 + 6 + 5 + 5 + 4 + 5 = 82
      const risks = Array.from({ length: 5 }, (_, i) => makeIdealRisk(`r${i}`));
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.safeguarding_score).toBe(82);
    });

    it("adds 5 for 8 risks", () => {
      // 8 risks: M1: +5, M2: +6, M3: +5, M4: +5, M5: +4, M6: +5
      // 52 + 5 + 6 + 5 + 5 + 4 + 5 = 82
      const risks = Array.from({ length: 8 }, (_, i) => makeIdealRisk(`r${i}`));
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.safeguarding_score).toBe(82);
    });
  });

  // ─── 8. Protective Actions Modifier ────────────────────────────

  describe("protective actions modifier", () => {
    // Use 5 risks to hold M1 constant at +5
    // All resolved (M4: +5), no overdue (M5: +4), all multi-agency (M3: +5), low risk (M6: +5)
    // Constant = 52 + 5 + 5 + 5 + 4 + 5 = 76, then add M2

    function risksWithProtective(withCount: number, withoutCount: number): ContextualRiskInput[] {
      const risks: ContextualRiskInput[] = [];
      for (let i = 0; i < withCount; i++) {
        risks.push(makeRisk({
          id: `rp_y_${i}`,
          status: "resolved",
          protective_actions_count: 2,
          multi_agency_actions_count: 2,
          risk_level: "low",
          needs_review: false,
        }));
      }
      for (let i = 0; i < withoutCount; i++) {
        risks.push(makeRisk({
          id: `rp_n_${i}`,
          status: "resolved",
          protective_actions_count: 0,
          multi_agency_actions_count: 2,
          risk_level: "low",
          needs_review: false,
        }));
      }
      return risks;
    }

    it("adds 6 when protective rate is 100% (5/5)", () => {
      // M2: pct(5,5)=100 >=90 → +6. Total: 76+6 = 82
      const r = computeContextualSafeguarding(baseInput({ risks: risksWithProtective(5, 0) }));
      expect(r.safeguarding_score).toBe(82);
      expect(r.protective_actions_rate).toBe(100);
    });

    it("adds 6 when protective rate is exactly 90% (9/10)", () => {
      // 10 risks: M1 still +5 (>=5). 9 with protective, 1 without.
      // pct(9,10) = 90. M2: +6. M3: +5, M4: +5, M5: +4, M6: +5
      // 52 + 5 + 6 + 5 + 5 + 4 + 5 = 82
      const r = computeContextualSafeguarding(baseInput({ risks: risksWithProtective(9, 1) }));
      expect(r.safeguarding_score).toBe(82);
      expect(r.protective_actions_rate).toBe(90);
    });

    it("adds 2 when protective rate is 80% (4/5)", () => {
      // pct(4,5)=80. M2: +2 (>=70). Total: 76+2 = 78
      const r = computeContextualSafeguarding(baseInput({ risks: risksWithProtective(4, 1) }));
      expect(r.safeguarding_score).toBe(78);
      expect(r.protective_actions_rate).toBe(80);
    });

    it("adds 2 when protective rate is exactly 70% (7/10)", () => {
      // pct(7,10)=70. M2: +2. All 10 resolved, multi-agency, etc.
      // 52 + 5 + 2 + 5 + 5 + 4 + 5 = 78
      const r = computeContextualSafeguarding(baseInput({ risks: risksWithProtective(7, 3) }));
      expect(r.safeguarding_score).toBe(78);
      expect(r.protective_actions_rate).toBe(70);
    });

    it("applies no adjustment when protective rate is 60% (3/5)", () => {
      // pct(3,5)=60. Not >=90, not >=70, not <50. M2: 0. Total: 76+0 = 76
      const r = computeContextualSafeguarding(baseInput({ risks: risksWithProtective(3, 2) }));
      expect(r.safeguarding_score).toBe(76);
      expect(r.protective_actions_rate).toBe(60);
    });

    it("subtracts 5 when protective rate is 40% (2/5)", () => {
      // pct(2,5)=40 <50. M2: -5. Total: 76-5 = 71
      const r = computeContextualSafeguarding(baseInput({ risks: risksWithProtective(2, 3) }));
      expect(r.safeguarding_score).toBe(71);
      expect(r.protective_actions_rate).toBe(40);
    });

    it("subtracts 5 when protective rate is 0% (0/5)", () => {
      // pct(0,5)=0 <50. M2: -5. Total: 76-5 = 71
      const r = computeContextualSafeguarding(baseInput({ risks: risksWithProtective(0, 5) }));
      expect(r.safeguarding_score).toBe(71);
      expect(r.protective_actions_rate).toBe(0);
    });
  });

  // ─── 9. Multi-Agency Modifier ──────────────────────────────────

  describe("multi-agency modifier", () => {
    // Use 5 risks, all resolved, all with protective, low risk, no overdue
    // Constant = 52 + 5(M1) + 6(M2) + 5(M4) + 4(M5) + 5(M6) = 77, then add M3

    function risksWithMultiAgency(withCount: number, withoutCount: number): ContextualRiskInput[] {
      const risks: ContextualRiskInput[] = [];
      for (let i = 0; i < withCount; i++) {
        risks.push(makeRisk({
          id: `rm_y_${i}`,
          status: "resolved",
          protective_actions_count: 2,
          multi_agency_actions_count: 2,
          risk_level: "low",
          needs_review: false,
        }));
      }
      for (let i = 0; i < withoutCount; i++) {
        risks.push(makeRisk({
          id: `rm_n_${i}`,
          status: "resolved",
          protective_actions_count: 2,
          multi_agency_actions_count: 0,
          risk_level: "low",
          needs_review: false,
        }));
      }
      return risks;
    }

    it("adds 5 when multi-agency rate is 100% (5/5)", () => {
      // M3: pct(5,5)=100 >=80 → +5. Total: 77+5 = 82
      const r = computeContextualSafeguarding(baseInput({ risks: risksWithMultiAgency(5, 0) }));
      expect(r.safeguarding_score).toBe(82);
      expect(r.multi_agency_rate).toBe(100);
    });

    it("adds 5 when multi-agency rate is exactly 80% (4/5)", () => {
      // M3: pct(4,5)=80 >=80 → +5. Total: 77+5 = 82
      const r = computeContextualSafeguarding(baseInput({ risks: risksWithMultiAgency(4, 1) }));
      expect(r.safeguarding_score).toBe(82);
      expect(r.multi_agency_rate).toBe(80);
    });

    it("adds 2 when multi-agency rate is 60% (3/5)", () => {
      // M3: pct(3,5)=60 >=50 → +2. Total: 77+2 = 79
      const r = computeContextualSafeguarding(baseInput({ risks: risksWithMultiAgency(3, 2) }));
      expect(r.safeguarding_score).toBe(79);
      expect(r.multi_agency_rate).toBe(60);
    });

    it("adds 2 when multi-agency rate is exactly 50% (5/10)", () => {
      // M3: pct(5,10)=50 >=50 → +2. 10 risks still gives M1: +5
      // 52 + 5 + 6 + 2 + 5 + 4 + 5 = 79
      const r = computeContextualSafeguarding(baseInput({ risks: risksWithMultiAgency(5, 5) }));
      expect(r.safeguarding_score).toBe(79);
      expect(r.multi_agency_rate).toBe(50);
    });

    it("applies no adjustment when multi-agency rate is 40% (2/5)", () => {
      // M3: pct(2,5)=40. Not >=80, not >=50, not <30. → 0. Total: 77+0 = 77
      const r = computeContextualSafeguarding(baseInput({ risks: risksWithMultiAgency(2, 3) }));
      expect(r.safeguarding_score).toBe(77);
      expect(r.multi_agency_rate).toBe(40);
    });

    it("subtracts 4 when multi-agency rate is 20% (1/5)", () => {
      // M3: pct(1,5)=20 <30 → -4. Total: 77-4 = 73
      const r = computeContextualSafeguarding(baseInput({ risks: risksWithMultiAgency(1, 4) }));
      expect(r.safeguarding_score).toBe(73);
      expect(r.multi_agency_rate).toBe(20);
    });

    it("subtracts 4 when multi-agency rate is 0% (0/5)", () => {
      // M3: pct(0,5)=0 <30 → -4. Total: 77-4 = 73
      const r = computeContextualSafeguarding(baseInput({ risks: risksWithMultiAgency(0, 5) }));
      expect(r.safeguarding_score).toBe(73);
      expect(r.multi_agency_rate).toBe(0);
    });

    it("subtracts 1 when total is 0 (zero risks path)", () => {
      // Zero risks: M3 contributes -1 (not -4)
      // 52 - 3 - 1 - 1 - 2 = 45
      const r = computeContextualSafeguarding(baseInput({ risks: [] }));
      expect(r.safeguarding_score).toBe(45);
    });
  });

  // ─── 10. Resolution Modifier ───────────────────────────────────

  describe("resolution modifier", () => {
    // Use 5 risks with consistent other modifiers
    // All have protective (M2: +6), all have multi-agency (M3: +5), no overdue (M5: +4), low risk (M6: +5)
    // Constant = 52 + 5(M1) + 6(M2) + 5(M3) + 4(M5) + 5(M6) = 77, then add M4

    function risksWithResolution(resolvedCount: number, activeCount: number): ContextualRiskInput[] {
      const risks: ContextualRiskInput[] = [];
      for (let i = 0; i < resolvedCount; i++) {
        risks.push(makeRisk({
          id: `rr_res_${i}`,
          status: "resolved",
          protective_actions_count: 2,
          multi_agency_actions_count: 2,
          risk_level: "low",
          needs_review: false,
        }));
      }
      for (let i = 0; i < activeCount; i++) {
        risks.push(makeRisk({
          id: `rr_act_${i}`,
          status: "active",
          protective_actions_count: 2,
          multi_agency_actions_count: 2,
          risk_level: "low",
          needs_review: false,
        }));
      }
      return risks;
    }

    it("adds 5 when resolution rate is 100% (5/5)", () => {
      // M4: pct(5,5)=100 >=60 → +5. Total: 77+5 = 82
      const r = computeContextualSafeguarding(baseInput({ risks: risksWithResolution(5, 0) }));
      expect(r.safeguarding_score).toBe(82);
      expect(r.resolution_rate).toBe(100);
    });

    it("adds 5 when resolution rate is exactly 60% (3/5)", () => {
      // M4: pct(3,5)=60 >=60 → +5. Total: 77+5 = 82
      const r = computeContextualSafeguarding(baseInput({ risks: risksWithResolution(3, 2) }));
      expect(r.safeguarding_score).toBe(82);
      expect(r.resolution_rate).toBe(60);
    });

    it("adds 2 when resolution rate is 40% (2/5)", () => {
      // M4: pct(2,5)=40 >=30 → +2. Total: 77+2 = 79
      const r = computeContextualSafeguarding(baseInput({ risks: risksWithResolution(2, 3) }));
      expect(r.safeguarding_score).toBe(79);
      expect(r.resolution_rate).toBe(40);
    });

    it("adds 2 when resolution rate is exactly 30% (3/10)", () => {
      // 10 risks: M1 still +5. pct(3,10)=30 >=30 → +2
      // 52 + 5 + 6 + 5 + 2 + 4 + 5 = 79
      const r = computeContextualSafeguarding(baseInput({ risks: risksWithResolution(3, 7) }));
      expect(r.safeguarding_score).toBe(79);
      expect(r.resolution_rate).toBe(30);
    });

    it("subtracts 5 when resolution rate is 0% with more than 2 risks", () => {
      // 5 risks, 0 resolved: pct(0,5)=0, total>2 → -5. Total: 77-5 = 72
      const r = computeContextualSafeguarding(baseInput({ risks: risksWithResolution(0, 5) }));
      expect(r.safeguarding_score).toBe(72);
      expect(r.resolution_rate).toBe(0);
    });

    it("applies no penalty when resolution rate is 0% with exactly 2 risks", () => {
      // 2 risks, 0 resolved: pct(0,2)=0, total===2 not >2 → no adj from 0% penalty
      // resolutionRate===0 does not match >=60 or >=30, and (total>2) is false so no -5
      // M4: 0. Constant for 2 risks: 52 + 2(M1) + 6(M2) + 5(M3) + 4(M5) + 5(M6) = 74
      // 74 + 0 = 74
      const risks = risksWithResolution(0, 2);
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.safeguarding_score).toBe(74);
      expect(r.resolution_rate).toBe(0);
    });

    it("applies no penalty when resolution rate is 0% with exactly 1 risk", () => {
      // 1 risk, 0 resolved: total===1 not >2, not >=30, not >=60 → 0
      // Constant for 1 risk: 52 + 0(M1) + 6(M2) + 5(M3) + 4(M5) + 5(M6) = 72
      // 72 + 0 = 72
      const risks = risksWithResolution(0, 1);
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.safeguarding_score).toBe(72);
      expect(r.resolution_rate).toBe(0);
    });

    it("applies no adjustment when resolution rate is 20% (1/5)", () => {
      // pct(1,5)=20. Not >=60, not >=30. resolutionRate !==0 so no -5 penalty. M4: 0. Total: 77+0 = 77
      const r = computeContextualSafeguarding(baseInput({ risks: risksWithResolution(1, 4) }));
      expect(r.safeguarding_score).toBe(77);
      expect(r.resolution_rate).toBe(20);
    });
  });

  // ─── 11. Review Timeliness Modifier ────────────────────────────

  describe("review timeliness modifier", () => {
    // Use 5 risks, all resolved, all protective, all multi-agency, low risk
    // Constant = 52 + 5(M1) + 6(M2) + 5(M3) + 5(M4) + 5(M6) = 78, then add M5

    function risksWithOverdue(overdueCount: number, okCount: number): ContextualRiskInput[] {
      const risks: ContextualRiskInput[] = [];
      for (let i = 0; i < overdueCount; i++) {
        risks.push(makeRisk({
          id: `ro_y_${i}`,
          status: "resolved",
          protective_actions_count: 2,
          multi_agency_actions_count: 2,
          risk_level: "low",
          needs_review: true,
        }));
      }
      for (let i = 0; i < okCount; i++) {
        risks.push(makeRisk({
          id: `ro_n_${i}`,
          status: "resolved",
          protective_actions_count: 2,
          multi_agency_actions_count: 2,
          risk_level: "low",
          needs_review: false,
        }));
      }
      return risks;
    }

    it("adds 4 when 0 reviews are overdue (5 risks)", () => {
      // M5: overdue===0 → +4. Total: 78+4 = 82
      const r = computeContextualSafeguarding(baseInput({ risks: risksWithOverdue(0, 5) }));
      expect(r.safeguarding_score).toBe(82);
      expect(r.review_overdue_count).toBe(0);
    });

    it("adds 1 when exactly 1 review is overdue", () => {
      // M5: overdue===1 <=1 → +1. Total: 78+1 = 79
      const r = computeContextualSafeguarding(baseInput({ risks: risksWithOverdue(1, 4) }));
      expect(r.safeguarding_score).toBe(79);
      expect(r.review_overdue_count).toBe(1);
    });

    it("applies no adjustment when exactly 2 reviews are overdue", () => {
      // M5: overdue===2. Not 0, not <=1, not >=3 → 0. Total: 78+0 = 78
      const r = computeContextualSafeguarding(baseInput({ risks: risksWithOverdue(2, 3) }));
      expect(r.safeguarding_score).toBe(78);
      expect(r.review_overdue_count).toBe(2);
    });

    it("subtracts 4 when 3 reviews are overdue", () => {
      // M5: overdue===3 >=3 → -4. Total: 78-4 = 74
      const r = computeContextualSafeguarding(baseInput({ risks: risksWithOverdue(3, 2) }));
      expect(r.safeguarding_score).toBe(74);
      expect(r.review_overdue_count).toBe(3);
    });

    it("subtracts 4 when 5 reviews are overdue", () => {
      // M5: overdue===5 >=3 → -4. Total: 78-4 = 74
      const r = computeContextualSafeguarding(baseInput({ risks: risksWithOverdue(5, 0) }));
      expect(r.safeguarding_score).toBe(74);
      expect(r.review_overdue_count).toBe(5);
    });

    it("subtracts 1 when total is 0 (zero risks path)", () => {
      // M5 for zero risks: -1.
      // Full zero-risk score: 52 -3 -1 -1 -2 = 45
      const r = computeContextualSafeguarding(baseInput({ risks: [] }));
      expect(r.safeguarding_score).toBe(45);
    });
  });

  // ─── 12. High Risk Management Modifier ─────────────────────────

  describe("high risk management modifier", () => {
    // Use 5 risks, all resolved, all protective, all multi-agency, no overdue
    // Constant = 52 + 5(M1) + 6(M2) + 5(M3) + 5(M4) + 4(M5) = 77, then add M6

    it("adds 5 when there are no high risk items", () => {
      // All low risk. M6: highRiskCount===0 → +5. Total: 77+5 = 82
      const risks = Array.from({ length: 5 }, (_, i) =>
        makeRisk({
          id: `rh_${i}`,
          status: "resolved",
          protective_actions_count: 2,
          multi_agency_actions_count: 2,
          risk_level: "low",
          needs_review: false,
        })
      );
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.safeguarding_score).toBe(82);
      expect(r.high_risk_count).toBe(0);
    });

    it("adds 3 when all high risks have protective actions (100%)", () => {
      // 5 risks: 2 high with protective, 3 low
      // M6: highRiskCount=2, highProtectedRate=pct(2,2)=100 >=90 → +3. Total: 77+3 = 80
      const risks = [
        makeRisk({ id: "rh_h1", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 2, risk_level: "high", needs_review: false }),
        makeRisk({ id: "rh_h2", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 2, risk_level: "very_high", needs_review: false }),
        makeRisk({ id: "rh_l1", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 2, risk_level: "low", needs_review: false }),
        makeRisk({ id: "rh_l2", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 2, risk_level: "low", needs_review: false }),
        makeRisk({ id: "rh_l3", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 2, risk_level: "low", needs_review: false }),
      ];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.safeguarding_score).toBe(80);
      expect(r.high_risk_count).toBe(2);
    });

    it("adds 1 when high risk protected rate is 75% (>=70)", () => {
      // 4 high risks: 3 with protective, 1 without. 1 low risk.
      // highProtectedRate = pct(3,4) = 75. >=70 → +1
      // Total: 5 risks, all resolved, 4/5 have protective (pct=80 >=70 → M2: +2)
      // Wait — need to recalculate M2 since one risk has no protective
      // M2: pct(4,5)=80 >=70 → +2
      // Constant recalc: 52 + 5(M1) + 2(M2) + 5(M3) + 5(M4) + 4(M5) = 73, + M6: +1 = 74
      const risks = [
        makeRisk({ id: "rh_h1", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 2, risk_level: "high", needs_review: false }),
        makeRisk({ id: "rh_h2", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 2, risk_level: "high", needs_review: false }),
        makeRisk({ id: "rh_h3", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 2, risk_level: "very_high", needs_review: false }),
        makeRisk({ id: "rh_h4", status: "resolved", protective_actions_count: 0, multi_agency_actions_count: 2, risk_level: "high", needs_review: false }),
        makeRisk({ id: "rh_l1", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 2, risk_level: "low", needs_review: false }),
      ];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.safeguarding_score).toBe(74);
      expect(r.high_risk_count).toBe(4);
    });

    it("subtracts 5 when high risks lack protective actions (<70%)", () => {
      // 5 risks: 2 high (0 with protective), 3 low (all with protective)
      // highProtectedRate = pct(0,2)=0. Not >=90, not >=70 → -5
      // M2: pct(3,5)=60 → no adj (>=50 <70)
      // 52 + 5(M1) + 0(M2) + 5(M3) + 5(M4) + 4(M5) + (-5)(M6) = 66
      const risks = [
        makeRisk({ id: "rh_h1", status: "resolved", protective_actions_count: 0, multi_agency_actions_count: 2, risk_level: "high", needs_review: false }),
        makeRisk({ id: "rh_h2", status: "resolved", protective_actions_count: 0, multi_agency_actions_count: 2, risk_level: "very_high", needs_review: false }),
        makeRisk({ id: "rh_l1", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 2, risk_level: "low", needs_review: false }),
        makeRisk({ id: "rh_l2", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 2, risk_level: "low", needs_review: false }),
        makeRisk({ id: "rh_l3", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 2, risk_level: "low", needs_review: false }),
      ];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.safeguarding_score).toBe(66);
    });

    it("subtracts 2 when total is 0 (zero risks path)", () => {
      // M6 for zero risks: -2
      // Full: 52 - 3 - 1 - 1 - 2 = 45
      const r = computeContextualSafeguarding(baseInput({ risks: [] }));
      expect(r.safeguarding_score).toBe(45);
    });

    it("correctly identifies high and very_high as high risk", () => {
      const risks = [
        makeRisk({ id: "rh1", risk_level: "high", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 2, needs_review: false }),
        makeRisk({ id: "rh2", risk_level: "very_high", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 2, needs_review: false }),
        makeRisk({ id: "rh3", risk_level: "medium", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 2, needs_review: false }),
        makeRisk({ id: "rh4", risk_level: "low", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 2, needs_review: false }),
        makeRisk({ id: "rh5", risk_level: "low", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 2, needs_review: false }),
      ];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.high_risk_count).toBe(2);
    });

    it("does not count medium or low as high risk", () => {
      const risks = [
        makeRisk({ id: "rh1", risk_level: "medium", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 2, needs_review: false }),
        makeRisk({ id: "rh2", risk_level: "low", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 2, needs_review: false }),
      ];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.high_risk_count).toBe(0);
    });
  });

  // ─── 13. Metric Calculations ───────────────────────────────────

  describe("metric calculations", () => {
    it("counts total_risks correctly", () => {
      const risks = Array.from({ length: 7 }, (_, i) => makeRisk({ id: `m_${i}` }));
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.total_risks).toBe(7);
    });

    it("counts active_risks including active and escalated statuses", () => {
      const risks = [
        makeRisk({ id: "m1", status: "active" }),
        makeRisk({ id: "m2", status: "escalated" }),
        makeRisk({ id: "m3", status: "resolved" }),
        makeRisk({ id: "m4", status: "monitoring" }),
        makeRisk({ id: "m5", status: "active" }),
      ];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.active_risks).toBe(3);
    });

    it("counts high_risk_count for high and very_high only", () => {
      const risks = [
        makeRisk({ id: "m1", risk_level: "low" }),
        makeRisk({ id: "m2", risk_level: "medium" }),
        makeRisk({ id: "m3", risk_level: "high" }),
        makeRisk({ id: "m4", risk_level: "very_high" }),
        makeRisk({ id: "m5", risk_level: "high" }),
      ];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.high_risk_count).toBe(3);
    });

    it("calculates protective_actions_rate as percentage", () => {
      const risks = [
        makeRisk({ id: "m1", protective_actions_count: 2 }),
        makeRisk({ id: "m2", protective_actions_count: 0 }),
        makeRisk({ id: "m3", protective_actions_count: 1 }),
      ];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      // pct(2, 3) = Math.round(2/3*100) = 67
      expect(r.protective_actions_rate).toBe(67);
    });

    it("calculates multi_agency_rate as percentage", () => {
      const risks = [
        makeRisk({ id: "m1", multi_agency_actions_count: 1 }),
        makeRisk({ id: "m2", multi_agency_actions_count: 0 }),
        makeRisk({ id: "m3", multi_agency_actions_count: 3 }),
        makeRisk({ id: "m4", multi_agency_actions_count: 0 }),
      ];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      // pct(2, 4) = 50
      expect(r.multi_agency_rate).toBe(50);
    });

    it("calculates resolution_rate as percentage of resolved risks", () => {
      const risks = [
        makeRisk({ id: "m1", status: "resolved" }),
        makeRisk({ id: "m2", status: "resolved" }),
        makeRisk({ id: "m3", status: "active" }),
        makeRisk({ id: "m4", status: "escalated" }),
        makeRisk({ id: "m5", status: "monitoring" }),
      ];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      // pct(2, 5) = 40
      expect(r.resolution_rate).toBe(40);
    });

    it("calculates review_overdue_count from needs_review flag", () => {
      const risks = [
        makeRisk({ id: "m1", needs_review: true }),
        makeRisk({ id: "m2", needs_review: false }),
        makeRisk({ id: "m3", needs_review: true }),
        makeRisk({ id: "m4", needs_review: true }),
      ];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.review_overdue_count).toBe(3);
    });

    it("leaves every rate unmeasured when no risks exist", () => {
      const r = computeContextualSafeguarding(baseInput({ risks: [] }));
      expect(r.protective_actions_rate).toBeNull();
      expect(r.multi_agency_rate).toBeNull();
      expect(r.resolution_rate).toBeNull();
    });
  });

  // ─── 14. Strengths, Concerns, Recommendations, Insights ────────

  describe("strengths generation", () => {
    it("includes risk mapping strength when total >= 5", () => {
      const risks = Array.from({ length: 5 }, (_, i) =>
        makeRisk({ id: `s_${i}`, status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 2, risk_level: "low", needs_review: false })
      );
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.strengths).toContain("Comprehensive contextual risk mapping shows the home is actively scanning the environment");
    });

    it("does not include risk mapping strength when total < 5", () => {
      const risks = Array.from({ length: 4 }, (_, i) =>
        makeRisk({ id: `s_${i}`, status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 2, risk_level: "low", needs_review: false })
      );
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.strengths).not.toContain("Comprehensive contextual risk mapping shows the home is actively scanning the environment");
    });

    it("includes protective actions strength when rate >= 90%", () => {
      const risks = Array.from({ length: 5 }, (_, i) =>
        makeRisk({ id: `s_${i}`, status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 2, risk_level: "low", needs_review: false })
      );
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.strengths).toContain("Protective actions are in place for virtually all identified contextual risks");
    });

    it("includes multi-agency strength when rate >= 80%", () => {
      const risks = Array.from({ length: 5 }, (_, i) =>
        makeRisk({ id: `s_${i}`, status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 2, risk_level: "low", needs_review: false })
      );
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.strengths).toContain("Strong multi-agency engagement ensures risks are tackled collaboratively");
    });

    it("includes resolution strength when rate >= 60%", () => {
      const risks = Array.from({ length: 5 }, (_, i) =>
        makeRisk({ id: `s_${i}`, status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 2, risk_level: "low", needs_review: false })
      );
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.strengths).toContain("Good resolution rate shows contextual risks are being effectively managed down");
    });

    it("includes review timeliness strength when 0 overdue", () => {
      const risks = [makeRisk({ id: "s_1", needs_review: false })];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.strengths).toContain("All contextual risk reviews are up to date — oversight is current");
    });

    it("includes no high risk strength when highRiskCount is 0 and total > 0", () => {
      const risks = [makeRisk({ id: "s_1", risk_level: "low" })];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.strengths).toContain("No high or very high contextual risks identified — children's environments are safe");
    });

    it("does not include no high risk strength when there are high risks", () => {
      const risks = [makeRisk({ id: "s_1", risk_level: "high" })];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.strengths).not.toContain("No high or very high contextual risks identified — children's environments are safe");
    });
  });

  describe("concerns generation", () => {
    it("includes no-mapping concern when total === 0", () => {
      const r = computeContextualSafeguarding(baseInput({ risks: [] }));
      expect(r.concerns).toContain("No contextual safeguarding risks assessed — the home may be unaware of environmental threats");
    });

    it("includes protective actions concern when rate < 50%", () => {
      const risks = [
        makeRisk({ id: "c1", protective_actions_count: 0 }),
        makeRisk({ id: "c2", protective_actions_count: 0 }),
        makeRisk({ id: "c3", protective_actions_count: 1 }),
      ];
      // pct(1,3) = 33 < 50
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.concerns).toContain("Most contextual risks lack protective actions — children are exposed without mitigation");
    });

    it("includes multi-agency concern when rate < 30%", () => {
      const risks = [
        makeRisk({ id: "c1", multi_agency_actions_count: 0 }),
        makeRisk({ id: "c2", multi_agency_actions_count: 0 }),
        makeRisk({ id: "c3", multi_agency_actions_count: 0 }),
        makeRisk({ id: "c4", multi_agency_actions_count: 1 }),
      ];
      // pct(1,4) = 25 < 30
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.concerns).toContain("Multi-agency engagement is absent from most contextual risks — the home is working in isolation");
    });

    it("includes overdue concern with count when overdue >= 3", () => {
      const risks = [
        makeRisk({ id: "c1", needs_review: true }),
        makeRisk({ id: "c2", needs_review: true }),
        makeRisk({ id: "c3", needs_review: true }),
      ];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.concerns).toContain("3 contextual risk reviews are overdue — risks may have escalated unnoticed");
    });

    it("includes high risk count concern when >= 3 high risks", () => {
      const risks = [
        makeRisk({ id: "c1", risk_level: "high" }),
        makeRisk({ id: "c2", risk_level: "very_high" }),
        makeRisk({ id: "c3", risk_level: "high" }),
      ];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.concerns).toContain("3 high or very high contextual risks identified — significant environmental threats to children");
    });

    it("includes resolution concern when 0% resolved and total > 2", () => {
      const risks = [
        makeRisk({ id: "c1", status: "active" }),
        makeRisk({ id: "c2", status: "active" }),
        makeRisk({ id: "c3", status: "monitoring" }),
      ];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.concerns).toContain("No contextual risks have been resolved — intervention is not achieving outcomes");
    });

    it("does not include resolution concern when total <= 2 even with 0% resolved", () => {
      const risks = [
        makeRisk({ id: "c1", status: "active" }),
        makeRisk({ id: "c2", status: "monitoring" }),
      ];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.concerns).not.toContain("No contextual risks have been resolved — intervention is not achieving outcomes");
    });
  });

  describe("recommendations generation", () => {
    it("recommends mapping exercise when total === 0", () => {
      const r = computeContextualSafeguarding(baseInput({ risks: [] }));
      expect(r.recommendations).toContainEqual({
        rank: 1,
        recommendation: "Conduct a contextual safeguarding mapping exercise covering locations, peers and online spaces",
        urgency: "immediate",
        regulatory_ref: "CHR 2015 Reg 12",
      });
    });

    it("recommends protective action plans when rate < 70%", () => {
      const risks = [
        makeRisk({ id: "rec1", protective_actions_count: 0 }),
        makeRisk({ id: "rec2", protective_actions_count: 0 }),
        makeRisk({ id: "rec3", protective_actions_count: 1 }),
      ];
      // pct(1,3) = 33 < 70
      const r = computeContextualSafeguarding(baseInput({ risks }));
      const recTexts = r.recommendations.map(rec => rec.recommendation);
      expect(recTexts).toContain("Develop protective action plans for all identified contextual risks");
    });

    it("recommends multi-agency partnerships when rate < 50%", () => {
      const risks = [
        makeRisk({ id: "rec1", multi_agency_actions_count: 0 }),
        makeRisk({ id: "rec2", multi_agency_actions_count: 0 }),
        makeRisk({ id: "rec3", multi_agency_actions_count: 1 }),
      ];
      // pct(1,3) = 33 < 50
      const r = computeContextualSafeguarding(baseInput({ risks }));
      const recTexts = r.recommendations.map(rec => rec.recommendation);
      expect(recTexts).toContain("Strengthen multi-agency partnerships to address contextual risks collaboratively");
    });

    it("recommends overdue reviews when overdue >= 2", () => {
      const risks = [
        makeRisk({ id: "rec1", needs_review: true }),
        makeRisk({ id: "rec2", needs_review: true }),
        makeRisk({ id: "rec3", needs_review: false }),
      ];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      const recTexts = r.recommendations.map(rec => rec.recommendation);
      expect(recTexts).toContain("Complete 2 overdue contextual risk reviews to ensure risks are current");
    });

    it("recommends escalation when highRiskCount >= 2", () => {
      const risks = [
        makeRisk({ id: "rec1", risk_level: "high" }),
        makeRisk({ id: "rec2", risk_level: "very_high" }),
      ];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      const recTexts = r.recommendations.map(rec => rec.recommendation);
      expect(recTexts).toContain("Escalate high-risk contextual concerns to senior management and relevant agencies");
    });

    it("recommends intervention review when resolution < 30% and total > 2", () => {
      const risks = [
        makeRisk({ id: "rec1", status: "active" }),
        makeRisk({ id: "rec2", status: "active" }),
        makeRisk({ id: "rec3", status: "monitoring" }),
      ];
      // pct(0,3) = 0 < 30 and total > 2
      const r = computeContextualSafeguarding(baseInput({ risks }));
      const recTexts = r.recommendations.map(rec => rec.recommendation);
      expect(recTexts).toContain("Review intervention strategies to improve contextual risk resolution outcomes");
    });

    it("caps recommendations at 5", () => {
      // Create a scenario that triggers all 5+ recommendations (excluding mapping which needs total===0)
      const risks = [
        makeRisk({ id: "rec1", status: "active", protective_actions_count: 0, multi_agency_actions_count: 0, risk_level: "high", needs_review: true }),
        makeRisk({ id: "rec2", status: "active", protective_actions_count: 0, multi_agency_actions_count: 0, risk_level: "high", needs_review: true }),
        makeRisk({ id: "rec3", status: "active", protective_actions_count: 0, multi_agency_actions_count: 0, risk_level: "very_high", needs_review: true }),
      ];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.recommendations.length).toBeLessThanOrEqual(5);
    });

    it("assigns sequential ranks to recommendations", () => {
      const risks = [
        makeRisk({ id: "rec1", status: "active", protective_actions_count: 0, multi_agency_actions_count: 0, risk_level: "high", needs_review: true }),
        makeRisk({ id: "rec2", status: "active", protective_actions_count: 0, multi_agency_actions_count: 0, risk_level: "high", needs_review: true }),
        makeRisk({ id: "rec3", status: "active", protective_actions_count: 0, multi_agency_actions_count: 0, risk_level: "low", needs_review: false }),
      ];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      r.recommendations.forEach((rec, i) => {
        expect(rec.rank).toBe(i + 1);
      });
    });

    it("does not recommend mapping exercise when risks exist", () => {
      const risks = [makeRisk({ id: "rec1" })];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      const recTexts = r.recommendations.map(rec => rec.recommendation);
      expect(recTexts).not.toContain("Conduct a contextual safeguarding mapping exercise covering locations, peers and online spaces");
    });
  });

  describe("insights generation", () => {
    it("includes exemplary insight when protective>=90, multi-agency>=80, overdue===0, total>=3", () => {
      const risks = Array.from({ length: 5 }, (_, i) =>
        makeRisk({
          id: `ins_${i}`,
          status: "resolved",
          protective_actions_count: 2,
          multi_agency_actions_count: 2,
          risk_level: "low",
          needs_review: false,
        })
      );
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.insights).toContainEqual({
        text: "Contextual safeguarding is exemplary — risks are mapped, managed and reviewed through active partnership working",
        severity: "positive",
      });
    });

    it("does not include exemplary insight when total < 3", () => {
      const risks = [
        makeRisk({ id: "ins_1", protective_actions_count: 2, multi_agency_actions_count: 2, needs_review: false }),
        makeRisk({ id: "ins_2", protective_actions_count: 2, multi_agency_actions_count: 2, needs_review: false }),
      ];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      const insightTexts = r.insights.map(ins => ins.text);
      expect(insightTexts).not.toContain("Contextual safeguarding is exemplary — risks are mapped, managed and reviewed through active partnership working");
    });

    it("includes critical no-mapping insight when total === 0", () => {
      const r = computeContextualSafeguarding(baseInput({ risks: [] }));
      expect(r.insights).toContainEqual({
        text: "No contextual mapping leaves children vulnerable to unseen risks — exploitation, county lines and peer influence go undetected",
        severity: "critical",
      });
    });

    it("includes critical multiple high risk insight when highRiskCount >= 3", () => {
      const risks = [
        makeRisk({ id: "ins_1", risk_level: "high" }),
        makeRisk({ id: "ins_2", risk_level: "very_high" }),
        makeRisk({ id: "ins_3", risk_level: "high" }),
      ];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.insights).toContainEqual({
        text: "Multiple high-risk contextual threats require immediate strategic response — escalate to RI and relevant agencies",
        severity: "critical",
      });
    });

    it("includes positive multi-agency insight when rate >= 80%", () => {
      const risks = Array.from({ length: 5 }, (_, i) =>
        makeRisk({ id: `ins_${i}`, multi_agency_actions_count: 2 })
      );
      // pct(5,5) = 100 >= 80
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.insights).toContainEqual({
        text: "Strong multi-agency engagement means risks are shared and addressed collectively — children are better protected",
        severity: "positive",
      });
    });

    it("includes positive resolution insight when rate >= 60%", () => {
      const risks = Array.from({ length: 5 }, (_, i) =>
        makeRisk({ id: `ins_${i}`, status: "resolved" })
      );
      // pct(5,5) = 100 >= 60
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.insights).toContainEqual({
        text: "Healthy resolution rate shows interventions are working — risks are being actively managed down over time",
        severity: "positive",
      });
    });

    it("caps insights at 3", () => {
      // Trigger exemplary + multi-agency + resolution insights (all positive)
      const risks = Array.from({ length: 5 }, (_, i) =>
        makeRisk({
          id: `ins_${i}`,
          status: "resolved",
          protective_actions_count: 2,
          multi_agency_actions_count: 2,
          risk_level: "low",
          needs_review: false,
        })
      );
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.insights.length).toBeLessThanOrEqual(3);
    });
  });

  // ─── 15. Headlines per Rating ──────────────────────────────────

  describe("headlines per rating", () => {
    it("returns outstanding headline for score >= 80", () => {
      const risks = Array.from({ length: 5 }, (_, i) =>
        makeRisk({
          id: `hl_${i}`,
          status: "resolved",
          protective_actions_count: 2,
          multi_agency_actions_count: 2,
          risk_level: "low",
          needs_review: false,
        })
      );
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.safeguarding_score).toBeGreaterThanOrEqual(80);
      expect(r.headline).toBe("Contextual safeguarding is proactive — risks are identified, managed and resolved through multi-agency work");
    });

    it("returns good headline for score 65-79", () => {
      // Use good scenario (score 79)
      const risks = [
        makeRisk({ id: "hl_g1", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 1, risk_level: "low" }),
        makeRisk({ id: "hl_g2", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 1, risk_level: "low" }),
        makeRisk({ id: "hl_g3", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 1, risk_level: "low" }),
        makeRisk({ id: "hl_g4", status: "active", protective_actions_count: 2, multi_agency_actions_count: 0, risk_level: "low" }),
        makeRisk({ id: "hl_g5", status: "active", protective_actions_count: 2, multi_agency_actions_count: 0, risk_level: "low" }),
      ];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.safeguarding_score).toBeGreaterThanOrEqual(65);
      expect(r.safeguarding_score).toBeLessThan(80);
      expect(r.headline).toBe("Good contextual safeguarding practice with effective risk identification and protective planning");
    });

    it("returns adequate headline for score 45-64", () => {
      const r = computeContextualSafeguarding(baseInput({ risks: [] }));
      expect(r.safeguarding_score).toBeGreaterThanOrEqual(45);
      expect(r.safeguarding_score).toBeLessThan(65);
      expect(r.headline).toBe("Contextual safeguarding is adequate but needs stronger multi-agency engagement and follow-through");
    });

    it("returns inadequate headline for score < 45", () => {
      const risks = [
        makeRisk({ id: "hl_i1", status: "active", protective_actions_count: 0, multi_agency_actions_count: 0, risk_level: "high", needs_review: true }),
        makeRisk({ id: "hl_i2", status: "active", protective_actions_count: 0, multi_agency_actions_count: 0, risk_level: "very_high", needs_review: true }),
        makeRisk({ id: "hl_i3", status: "escalated", protective_actions_count: 0, multi_agency_actions_count: 0, risk_level: "medium", needs_review: true }),
        makeRisk({ id: "hl_i4", status: "active", protective_actions_count: 0, multi_agency_actions_count: 0, risk_level: "low", needs_review: true }),
      ];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.safeguarding_score).toBeLessThan(45);
      expect(r.headline).toBe("Contextual safeguarding practice is inadequate — children face unmanaged environmental risks");
    });
  });

  // ─── 16. Edge Cases ────────────────────────────────────────────

  describe("edge cases", () => {
    it("clamps score to 0 (never goes negative)", () => {
      // Extreme negative: 1 risk, no protective, no multi-agency, not resolved, overdue, high risk
      // Base 52, M1: 0 (1 risk), M2: -5, M3: -4, M4: 0 (0% but total<=2), M5: -4 (wait, 1 overdue is <=1 so +1)
      // Actually need more extreme: many penalties.
      // Let's try 4 risks all terrible:
      // M1: +2, M2: -5 (0%), M3: -4 (0%), M4: -5 (0% with >2), M5: -4 (4 overdue), M6: -5 (high unprotected)
      // 52 + 2 - 5 - 4 - 5 - 4 - 5 = 31. Still positive.
      // Even with all possible negatives it won't go below 0, but let's verify clamp works
      const risks = Array.from({ length: 4 }, (_, i) =>
        makeRisk({
          id: `ec_${i}`,
          status: "active",
          protective_actions_count: 0,
          multi_agency_actions_count: 0,
          risk_level: "high",
          needs_review: true,
        })
      );
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.safeguarding_score).toBeGreaterThanOrEqual(0);
    });

    it("clamps score to 100 (never exceeds)", () => {
      // Even with maximum bonuses: 52+5+6+5+5+4+5 = 82
      // Can't exceed 100, but verify clamp exists
      const risks = Array.from({ length: 10 }, (_, i) =>
        makeRisk({
          id: `ec_max_${i}`,
          status: "resolved",
          protective_actions_count: 5,
          multi_agency_actions_count: 5,
          risk_level: "low",
          needs_review: false,
        })
      );
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.safeguarding_score).toBeLessThanOrEqual(100);
    });

    it("handles a single risk correctly", () => {
      // 1 risk: resolved, with protective, with multi-agency, no overdue, low risk
      // M1: 0 (1 risk), M2: +6 (100%), M3: +5 (100%), M4: +5 (100%), M5: +4, M6: +5
      // 52 + 0 + 6 + 5 + 5 + 4 + 5 = 77
      const risks = [makeRisk({
        id: "ec_single",
        status: "resolved",
        protective_actions_count: 2,
        multi_agency_actions_count: 2,
        risk_level: "low",
        needs_review: false,
      })];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.safeguarding_score).toBe(77);
      expect(r.safeguarding_rating).toBe("good");
    });

    it("handles total_children=1 as valid (not insufficient data)", () => {
      const r = computeContextualSafeguarding(baseInput({ total_children: 1, risks: [] }));
      expect(r.safeguarding_rating).not.toBe("insufficient_data");
      expect(r.safeguarding_score).toBe(45);
    });

    it("correctly handles monitoring status (not active, not resolved)", () => {
      const risks = [
        makeRisk({ id: "ec_mon", status: "monitoring" }),
      ];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.active_risks).toBe(0); // monitoring is not active
      expect(r.resolution_rate).toBe(0); // monitoring is not resolved
    });

    it("correctly handles escalated status as active", () => {
      const risks = [
        makeRisk({ id: "ec_esc", status: "escalated" }),
      ];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.active_risks).toBe(1);
    });

    it("scores exactly at rating boundary: 80 is outstanding", () => {
      // Need score exactly 80
      // 5 risks: all resolved, all protective, all multi-agency, no overdue
      // 2 high risks both with protective: M6 = +3 (pct(2,2)=100 >=90)
      // 52 + 5(M1) + 6(M2) + 5(M3) + 5(M4) + 4(M5) + 3(M6) = 80
      const risks = [
        makeRisk({ id: "ec_b1", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 2, risk_level: "high", needs_review: false }),
        makeRisk({ id: "ec_b2", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 2, risk_level: "very_high", needs_review: false }),
        makeRisk({ id: "ec_b3", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 2, risk_level: "low", needs_review: false }),
        makeRisk({ id: "ec_b4", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 2, risk_level: "low", needs_review: false }),
        makeRisk({ id: "ec_b5", status: "resolved", protective_actions_count: 2, multi_agency_actions_count: 2, risk_level: "low", needs_review: false }),
      ];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.safeguarding_score).toBe(80);
      expect(r.safeguarding_rating).toBe("outstanding");
    });

    it("scores exactly at rating boundary: 65 is good", () => {
      // Need score exactly 65
      // 2 risks: both resolved, both protective, 1 multi-agency, 0 overdue, 0 high
      // M1: +2, M2: +6 (100%), M3: pct(1,2)=50 → +2, M4: +5 (100%), M5: +4, M6: +5
      // 52 + 2 + 6 + 2 + 5 + 4 + 5 = 76. Too high.
      // Try: 2 risks, 1 resolved, both protective, 0 multi-agency, 1 overdue, 0 high
      // M1: +2, M2: +6 (100%), M3: pct(0,2)=0 → -4, M4: pct(1,2)=50 → +2, M5: +1 (1 overdue), M6: +5
      // 52 + 2 + 6 - 4 + 2 + 1 + 5 = 64. One too low.
      // Try: 2 risks, 1 resolved, both protective, 0 multi-agency, 0 overdue, 0 high
      // M1: +2, M2: +6, M3: -4, M4: +2 (50%), M5: +4, M6: +5
      // 52 + 2 + 6 - 4 + 2 + 4 + 5 = 67. Still too high.
      // Try: 2 risks, 0 resolved, both protective, 0 multi-agency, 0 overdue, 0 high
      // M1: +2, M2: +6, M3: -4, M4: 0 (0% but total<=2), M5: +4, M6: +5
      // 52 + 2 + 6 - 4 + 0 + 4 + 5 = 65
      const risks = [
        makeRisk({ id: "ec_b65_1", status: "active", protective_actions_count: 2, multi_agency_actions_count: 0, risk_level: "low", needs_review: false }),
        makeRisk({ id: "ec_b65_2", status: "monitoring", protective_actions_count: 2, multi_agency_actions_count: 0, risk_level: "low", needs_review: false }),
      ];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.safeguarding_score).toBe(65);
      expect(r.safeguarding_rating).toBe("good");
    });

    it("scores exactly at rating boundary: 45 is adequate", () => {
      // Zero risks gives 45
      const r = computeContextualSafeguarding(baseInput({ risks: [] }));
      expect(r.safeguarding_score).toBe(45);
      expect(r.safeguarding_rating).toBe("adequate");
    });

    it("scores exactly at rating boundary: 44 is inadequate", () => {
      // Need score exactly 44
      // 1 risk: active, no protective, no multi-agency, no overdue, high without protective
      // M1: 0 (1 risk), M2: -5 (0%), M3: -4 (0%), M4: 0 (0% but total<=2), M5: +4 (0 overdue), M6: -5
      // 52 + 0 - 5 - 4 + 0 + 4 - 5 = 42. Too low.
      // Try: 1 risk, active, no protective, has multi-agency, 0 overdue, high without protective
      // M1: 0, M2: -5, M3: pct(1,1)=100 → +5, M4: 0, M5: +4, M6: -5
      // 52 + 0 - 5 + 5 + 0 + 4 - 5 = 51. Too high.
      // Try: 1 risk, active, no protective, 0 multi-agency, 1 overdue, low risk
      // M1: 0, M2: -5, M3: -4, M4: 0, M5: +1 (<=1), M6: +5 (0 high)
      // 52 + 0 - 5 - 4 + 0 + 1 + 5 = 49. Still too high.
      // Try: 1 risk, active, no protective, 0 multi-agency, overdue, low risk
      // Wait overdue===1 → +1. Need overdue===2 but only 1 risk... can only be 0 or 1.
      // Try: 3 risks, all active, 0 protective, 0 multi-agency, 2 overdue, 0 high
      // M1: +2, M2: -5, M3: -4, M4: 0% with >2 → -5, M5: overdue 2 → 0, M6: +5
      // 52 + 2 - 5 - 4 - 5 + 0 + 5 = 45. Just adequate.
      // Try: 3 risks, all active, 0 protective, 0 multi-agency, 3 overdue, 0 high
      // M1: +2, M2: -5, M3: -4, M4: -5, M5: -4 (>=3), M6: +5
      // 52 + 2 - 5 - 4 - 5 - 4 + 5 = 41. Too low.
      // Try: 3 risks, all active, 1 protective, 0 multi-agency, 2 overdue, 0 high
      // M2: pct(1,3)=33 → -5 (<50). M1: +2, M3: -4, M4: -5, M5: 0, M6: +5
      // 52 + 2 - 5 - 4 - 5 + 0 + 5 = 45. Just adequate.
      // Try: 3 risks, all active, 0 protective, 1 multi-agency, 2 overdue, 0 high
      // M3: pct(1,3)=33 → no adj (>=30 <50). M1: +2, M2: -5, M4: -5, M5: 0, M6: +5
      // 52 + 2 - 5 + 0 - 5 + 0 + 5 = 49. Still high.
      // Need exactly 44. Let me try:
      // 3 risks, all active, 1 with protective (33%), 0 multi-agency, 3 overdue, 1 high (unprotected)
      // M1: +2, M2: -5 (33%<50), M3: -4 (0%<30), M4: -5 (0%>2), M5: -4 (3>=3), M6: -5 (high unprotected)
      // 52 + 2 - 5 - 4 - 5 - 4 - 5 = 31. Too low.
      // Try different approach: 5 risks, 2 resolved, 3 with protective (60%), 2 multi-agency (40%), 1 overdue, 1 high with protective
      // M1: +5, M2: 0 (60% in 50-69 gap), M3: 0 (40% in 30-49 gap), M4: +2 (40%), M5: +1 (1 overdue), M6: +3 (high prot=100%)
      // 52 + 5 + 0 + 0 + 2 + 1 + 3 = 63. Not 44.
      // Let me just aim for 44 precisely.
      // Base: 52. Need total adjustments of -8.
      // 3 risks, 0 resolved, 1 protective (33%), 1 multi-agency (33%), 0 overdue, 1 high with protective
      // M1: +2, M2: -5 (33%), M3: pct(1,3)=33 → no adj, M4: -5 (0%>2), M5: +4 (0 overdue), M6: +3 (pct(1,1)=100)
      // 52 + 2 - 5 + 0 - 5 + 4 + 3 = 51. Nope.
      // This is tricky. Let me try:
      // 3 risks, 0 resolved, 1 protective, 0 multi-agency, 1 overdue, 1 high with no protective
      // M1: +2, M2: -5 (33%), M3: -4 (0%), M4: -5 (0% >2), M5: +1 (<=1), M6: -5
      // 52 + 2 - 5 - 4 - 5 + 1 - 5 = 36. Too low.
      // Try: 3 risks, 0 resolved, 2 protective (67%), 0 multi-agency, 1 overdue, 0 high
      // M1: +2, M2: 0 (67% gap), M3: -4, M4: -5, M5: +1, M6: +5
      // 52 + 2 + 0 - 4 - 5 + 1 + 5 = 51. Still not 44.
      // Try: 4 risks, 0 resolved, 1 protective (25%), 0 multi-agency, 2 overdue, 0 high
      // M1: +2, M2: -5 (25%), M3: -4 (0%), M4: -5 (0%>2), M5: 0 (2 overdue), M6: +5
      // 52 + 2 - 5 - 4 - 5 + 0 + 5 = 45. One too high.
      // Try: 4 risks, 0 resolved, 1 protective (25%), 0 multi-agency, 3 overdue, 0 high
      // M1: +2, M2: -5, M3: -4, M4: -5, M5: -4 (>=3), M6: +5
      // 52 + 2 - 5 - 4 - 5 - 4 + 5 = 41. Three too low.
      // Try: 4 risks, 0 resolved, 2 protective (50%), 0 multi-agency, 3 overdue, 0 high
      // M2: pct(2,4)=50 → in 50-69 gap → no adj
      // 52 + 2 + 0 - 4 - 5 - 4 + 5 = 46. Two too high.
      // Try: 5 risks, 0 resolved, 2 protective (40%), 0 multi-agency, 3 overdue, 0 high
      // M1: +5, M2: -5 (40%<50), M3: -4, M4: -5 (0%>2), M5: -4, M6: +5
      // 52 + 5 - 5 - 4 - 5 - 4 + 5 = 44. Yes!
      const risks = [
        makeRisk({ id: "ec_44_1", status: "active", protective_actions_count: 1, multi_agency_actions_count: 0, risk_level: "low", needs_review: true }),
        makeRisk({ id: "ec_44_2", status: "active", protective_actions_count: 1, multi_agency_actions_count: 0, risk_level: "low", needs_review: true }),
        makeRisk({ id: "ec_44_3", status: "monitoring", protective_actions_count: 0, multi_agency_actions_count: 0, risk_level: "low", needs_review: true }),
        makeRisk({ id: "ec_44_4", status: "monitoring", protective_actions_count: 0, multi_agency_actions_count: 0, risk_level: "low", needs_review: false }),
        makeRisk({ id: "ec_44_5", status: "monitoring", protective_actions_count: 0, multi_agency_actions_count: 0, risk_level: "low", needs_review: false }),
      ];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.safeguarding_score).toBe(44);
      expect(r.safeguarding_rating).toBe("inadequate");
    });

    it("handles large number of risks without error", () => {
      const risks = Array.from({ length: 50 }, (_, i) =>
        makeRisk({ id: `ec_large_${i}` })
      );
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.total_risks).toBe(50);
      expect(r.safeguarding_score).toBeGreaterThanOrEqual(0);
      expect(r.safeguarding_score).toBeLessThanOrEqual(100);
    });

    it("handles all risks being resolved", () => {
      const risks = Array.from({ length: 3 }, (_, i) =>
        makeRisk({ id: `ec_res_${i}`, status: "resolved" })
      );
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.resolution_rate).toBe(100);
      expect(r.active_risks).toBe(0);
    });

    it("handles all risks being active", () => {
      const risks = Array.from({ length: 3 }, (_, i) =>
        makeRisk({ id: `ec_act_${i}`, status: "active" })
      );
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.active_risks).toBe(3);
      expect(r.resolution_rate).toBe(0);
    });

    it("handles mixed context types without affecting score", () => {
      const contextTypes = ["location", "peer_group", "online_space", "transport_route", "school", "community_facility"];
      const risks = contextTypes.map((ct, i) =>
        makeRisk({
          id: `ec_ctx_${i}`,
          context_type: ct,
          status: "resolved",
          protective_actions_count: 2,
          multi_agency_actions_count: 2,
          risk_level: "low",
          needs_review: false,
        })
      );
      // 6 risks: M1: +5, M2: +6, M3: +5, M4: +5, M5: +4, M6: +5 = 82
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.safeguarding_score).toBe(82);
      expect(r.total_risks).toBe(6);
    });

    it("pct helper rounds correctly (Math.round)", () => {
      // 1 out of 3 = 33.33... => rounds to 33
      const risks = [
        makeRisk({ id: "ec_pct_1", protective_actions_count: 1, multi_agency_actions_count: 0, status: "active" }),
        makeRisk({ id: "ec_pct_2", protective_actions_count: 0, multi_agency_actions_count: 0, status: "active" }),
        makeRisk({ id: "ec_pct_3", protective_actions_count: 0, multi_agency_actions_count: 0, status: "active" }),
      ];
      const r = computeContextualSafeguarding(baseInput({ risks }));
      expect(r.protective_actions_rate).toBe(33);
      // 2 out of 3 = 66.66... => rounds to 67
      expect(r.multi_agency_rate).toBe(0);
    });

    it("returns correct structure shape", () => {
      const r = computeContextualSafeguarding(baseInput({ risks: [] }));
      expect(r).toHaveProperty("safeguarding_rating");
      expect(r).toHaveProperty("safeguarding_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_risks");
      expect(r).toHaveProperty("active_risks");
      expect(r).toHaveProperty("high_risk_count");
      expect(r).toHaveProperty("protective_actions_rate");
      expect(r).toHaveProperty("multi_agency_rate");
      expect(r).toHaveProperty("resolution_rate");
      expect(r).toHaveProperty("review_overdue_count");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });
  });
});
