import { describe, it, expect } from "vitest";
import {
  computeHomeSafeguardingDepth,
  type HomeSafeguardingDepthInput,
  type BodyMapInput,
  type DisclosureInput,
  type EscalationInput,
  type LADOReferralInput,
  type SafeguardingSupervisionInput,
  type SafeTouchProtocolInput,
  type SubstanceScreeningInput,
} from "../home-safeguarding-depth-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-27";

function daysAgo(n: number): string {
  const d = new Date("2026-05-27");
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function futureDate(n: number): string {
  const d = new Date("2026-05-27");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function makeBodyMap(overrides: Partial<BodyMapInput> = {}): BodyMapInput {
  return {
    id: `bm_${Math.random().toString(36).slice(2, 8)}`,
    child_id: "c1",
    date: daysAgo(5),
    areas_documented: 3,
    photo_evidence: true,
    staff_signed: true,
    manager_reviewed: true,
    child_explanation_recorded: true,
    ...overrides,
  };
}

function makeDisclosure(overrides: Partial<DisclosureInput> = {}): DisclosureInput {
  return {
    id: `disc_${Math.random().toString(36).slice(2, 8)}`,
    child_id: "c1",
    date: daysAgo(10),
    response_within_1h: true,
    escalated_appropriately: true,
    child_informed_of_process: true,
    written_up_within_24h: true,
    outcome_recorded: true,
    ...overrides,
  };
}

function makeEscalation(overrides: Partial<EscalationInput> = {}): EscalationInput {
  return {
    id: `esc_${Math.random().toString(36).slice(2, 8)}`,
    date: daysAgo(15),
    multi_agency_engaged: true,
    resolution_date: daysAgo(10),
    outcome_documented: true,
    learning_captured: true,
    ...overrides,
  };
}

function makeLADOReferral(overrides: Partial<LADOReferralInput> = {}): LADOReferralInput {
  return {
    id: `lado_${Math.random().toString(36).slice(2, 8)}`,
    date: daysAgo(20),
    referred_within_1_business_day: true,
    outcome_recorded: true,
    staff_support_documented: true,
    learning_shared: true,
    review_date: futureDate(30),
    ...overrides,
  };
}

function makeSupervision(overrides: Partial<SafeguardingSupervisionInput> = {}): SafeguardingSupervisionInput {
  return {
    id: `sup_${Math.random().toString(36).slice(2, 8)}`,
    staff_id: "s1",
    date: daysAgo(7),
    cases_discussed: 3,
    actions_set: 4,
    actions_completed: 4,
    reflective_practice: true,
    ...overrides,
  };
}

function makeSafeTouch(overrides: Partial<SafeTouchProtocolInput> = {}): SafeTouchProtocolInput {
  return {
    id: `st_${Math.random().toString(36).slice(2, 8)}`,
    child_id: "c1",
    consent_obtained: true,
    protocol_documented: true,
    child_voice_captured: true,
    review_date: futureDate(30),
    ...overrides,
  };
}

function makeSubstanceScreening(overrides: Partial<SubstanceScreeningInput> = {}): SubstanceScreeningInput {
  return {
    id: `ss_${Math.random().toString(36).slice(2, 8)}`,
    date: daysAgo(10),
    child_id: "c1",
    result: "negative",
    follow_up_actioned: true,
    child_supported: true,
    ...overrides,
  };
}

/**
 * baseInput produces score = 80 (outstanding)
 * 52 base + 5 (mod1) + 4 (mod2) + 3 (mod3) + 4 (mod4) + 3 (mod5) + 3 (mod6) + 3 (mod7) + 3 (mod8) = 80
 */
function baseInput(overrides: Partial<HomeSafeguardingDepthInput> = {}): HomeSafeguardingDepthInput {
  return {
    today: TODAY,
    body_maps: [
      makeBodyMap({ id: "bm1", child_id: "c1" }),
      makeBodyMap({ id: "bm2", child_id: "c2" }),
      makeBodyMap({ id: "bm3", child_id: "c3" }),
      makeBodyMap({ id: "bm4", child_id: "c4" }),
      makeBodyMap({ id: "bm5", child_id: "c5" }),
    ],
    disclosures: [
      makeDisclosure({ id: "d1" }),
      makeDisclosure({ id: "d2" }),
      makeDisclosure({ id: "d3" }),
      makeDisclosure({ id: "d4" }),
      makeDisclosure({ id: "d5" }),
    ],
    escalations: [
      makeEscalation({ id: "e1" }),
      makeEscalation({ id: "e2" }),
      makeEscalation({ id: "e3" }),
      makeEscalation({ id: "e4" }),
      makeEscalation({ id: "e5" }),
    ],
    lado_referrals: [
      makeLADOReferral({ id: "l1" }),
      makeLADOReferral({ id: "l2" }),
      makeLADOReferral({ id: "l3" }),
    ],
    safeguarding_supervisions: [
      makeSupervision({ id: "sup1", staff_id: "s1" }),
      makeSupervision({ id: "sup2", staff_id: "s2" }),
      makeSupervision({ id: "sup3", staff_id: "s3" }),
      makeSupervision({ id: "sup4", staff_id: "s4" }),
      makeSupervision({ id: "sup5", staff_id: "s5" }),
    ],
    safe_touch_protocols: [
      makeSafeTouch({ id: "st1", child_id: "c1" }),
      makeSafeTouch({ id: "st2", child_id: "c2" }),
      makeSafeTouch({ id: "st3", child_id: "c3" }),
      makeSafeTouch({ id: "st4", child_id: "c4" }),
      makeSafeTouch({ id: "st5", child_id: "c5" }),
    ],
    substance_screenings: [
      makeSubstanceScreening({ id: "ss1", date: daysAgo(5) }),
      makeSubstanceScreening({ id: "ss2", date: daysAgo(15) }),
      makeSubstanceScreening({ id: "ss3", date: daysAgo(25) }),
      makeSubstanceScreening({ id: "ss4", date: daysAgo(35) }),
      makeSubstanceScreening({ id: "ss5", date: daysAgo(45) }),
    ],
    total_children: 5,
    total_staff: 5,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("computeHomeSafeguardingDepth", () => {
  // ── Insufficient data ──────────────────────────────────────────────
  describe("insufficient data", () => {
    it("returns insufficient_data when no data at all", () => {
      const r = computeHomeSafeguardingDepth({
        today: TODAY, body_maps: [], disclosures: [], escalations: [],
        lado_referrals: [], safeguarding_supervisions: [], safe_touch_protocols: [],
        substance_screenings: [], total_children: 0, total_staff: 0,
      });
      expect(r.safeguarding_depth_rating).toBe("insufficient_data");
      expect(r.safeguarding_depth_score).toBe(0);
    });

    it("returns empty arrays for narrative on insufficient data", () => {
      const r = computeHomeSafeguardingDepth({
        today: TODAY, body_maps: [], disclosures: [], escalations: [],
        lado_referrals: [], safeguarding_supervisions: [], safe_touch_protocols: [],
        substance_screenings: [], total_children: 0, total_staff: 0,
      });
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });

    it("does NOT return insufficient_data when total_children > 0", () => {
      const r = computeHomeSafeguardingDepth({
        today: TODAY, body_maps: [], disclosures: [], escalations: [],
        lado_referrals: [], safeguarding_supervisions: [], safe_touch_protocols: [],
        substance_screenings: [], total_children: 3, total_staff: 5,
      });
      expect(r.safeguarding_depth_rating).not.toBe("insufficient_data");
    });

    it("returns correct headline on insufficient data", () => {
      const r = computeHomeSafeguardingDepth({
        today: TODAY, body_maps: [], disclosures: [], escalations: [],
        lado_referrals: [], safeguarding_supervisions: [], safe_touch_protocols: [],
        substance_screenings: [], total_children: 0, total_staff: 0,
      });
      expect(r.headline).toContain("No safeguarding depth data");
    });
  });

  describe("review-date overdue + escalation surfacing", () => {
    function ctx(): Parameters<typeof computeHomeSafeguardingDepth>[0] {
      return {
        today: TODAY, body_maps: [], disclosures: [], escalations: [],
        lado_referrals: [], safeguarding_supervisions: [], safe_touch_protocols: [],
        substance_screenings: [], total_children: 3, total_staff: 5,
      };
    }

    it("counts a LADO referral with NO review date as overdue (not silently skipped)", () => {
      const r = computeHomeSafeguardingDepth({ ...ctx(), lado_referrals: [makeLADOReferral({ review_date: "" })] });
      expect(r.lado.overdue_reviews).toBe(1);
    });

    it("does not count a LADO referral with a future review date as overdue", () => {
      const r = computeHomeSafeguardingDepth({ ...ctx(), lado_referrals: [makeLADOReferral({ review_date: futureDate(30) })] });
      expect(r.lado.overdue_reviews).toBe(0);
    });

    it("counts a safe-touch protocol with NO review date as overdue", () => {
      const r = computeHomeSafeguardingDepth({ ...ctx(), safe_touch_protocols: [makeSafeTouch({ review_date: "" })] });
      expect(r.safe_touch.overdue_reviews).toBe(1);
    });

    it("surfaces a concern when disclosures are not appropriately escalated", () => {
      const r = computeHomeSafeguardingDepth({
        ...ctx(),
        disclosures: [
          makeDisclosure({ escalated_appropriately: false }),
          makeDisclosure({ escalated_appropriately: false }),
        ],
      });
      expect(r.concerns.some((c) => c.toLowerCase().includes("escalated"))).toBe(true);
    });
  });

  // ── Base score / outstanding ──────────────────────────────────────
  describe("base score and outstanding rating", () => {
    it("baseInput scores 80 — outstanding", () => {
      const r = computeHomeSafeguardingDepth(baseInput());
      expect(r.safeguarding_depth_score).toBe(80);
      expect(r.safeguarding_depth_rating).toBe("outstanding");
    });

    it("headline reflects outstanding rating", () => {
      const r = computeHomeSafeguardingDepth(baseInput());
      expect(r.headline).toContain("outstanding");
    });
  });

  // ── Rating thresholds ─────────────────────────────────────────────
  describe("rating thresholds", () => {
    it("score >= 80 is outstanding", () => {
      const r = computeHomeSafeguardingDepth(baseInput());
      expect(r.safeguarding_depth_score).toBeGreaterThanOrEqual(80);
      expect(r.safeguarding_depth_rating).toBe("outstanding");
    });

    it("score 65-79 is good", () => {
      // Remove body maps (mod1: -2) and escalations (mod3: 0 neutral) → drops ~10 pts
      // base 52 -2(mod1) +4(mod2) +0(mod3) +4(mod4) +3(mod5) +3(mod6) +3(mod7) +3(mod8) = 70
      const r = computeHomeSafeguardingDepth(baseInput({
        body_maps: [],
        escalations: [],
      }));
      expect(r.safeguarding_depth_score).toBeGreaterThanOrEqual(65);
      expect(r.safeguarding_depth_score).toBeLessThan(80);
      expect(r.safeguarding_depth_rating).toBe("good");
    });

    it("score 45-64 is adequate", () => {
      // Trace: base 52
      // mod1: body_maps degraded → photo 0%, manager 0%, child_expl 0%, staff_signed 0% → m = -1 -2 -1 -1 = -5 → score 47
      // mod2: disclosures degraded → resp 0%, escal 0%, informed 0%, written 0% → m = -1 -1 -1 -1 = -4 → score 43
      // mod3: escalations empty → m = 0 → score 43
      // mod4: LADO empty → m = 0 → score 43
      // mod5: supervisions present perfect → m = +3 → score 46
      // mod6: safe touch present perfect → m = +3 → score 49
      // mod7: substance screenings present perfect → m = +3 → score 52
      // mod8: child voice → body_maps childRate=0%, disclosures informed=0%, safe_touch voice=100% → avg = 33 → m = 0 (33 < 50 but >= 30) → score 52
      const r = computeHomeSafeguardingDepth(baseInput({
        body_maps: [
          makeBodyMap({ id: "bm1", photo_evidence: false, manager_reviewed: false, staff_signed: false, child_explanation_recorded: false }),
          makeBodyMap({ id: "bm2", photo_evidence: false, manager_reviewed: false, staff_signed: false, child_explanation_recorded: false }),
        ],
        disclosures: [
          makeDisclosure({ id: "d1", response_within_1h: false, escalated_appropriately: false, child_informed_of_process: false, written_up_within_24h: false }),
          makeDisclosure({ id: "d2", response_within_1h: false, escalated_appropriately: false, child_informed_of_process: false, written_up_within_24h: false }),
        ],
        escalations: [],
        lado_referrals: [],
      }));
      expect(r.safeguarding_depth_score).toBeGreaterThanOrEqual(45);
      expect(r.safeguarding_depth_score).toBeLessThan(65);
      expect(r.safeguarding_depth_rating).toBe("adequate");
    });

    it("score < 45 is inadequate", () => {
      // Actively degraded body maps + disclosures + empty everything else
      // 52 -5(mod1) -4(mod2) +0 +0 -2(mod5) -1(mod6) +0 -2(mod8) = 38
      const r = computeHomeSafeguardingDepth({
        today: TODAY,
        body_maps: Array.from({ length: 5 }, (_, i) =>
          makeBodyMap({ id: `bm${i}`, photo_evidence: false, manager_reviewed: false, staff_signed: false, child_explanation_recorded: false }),
        ),
        disclosures: Array.from({ length: 5 }, (_, i) =>
          makeDisclosure({ id: `d${i}`, response_within_1h: false, escalated_appropriately: false, child_informed_of_process: false, written_up_within_24h: false }),
        ),
        escalations: [],
        lado_referrals: [],
        safeguarding_supervisions: [],
        safe_touch_protocols: [],
        substance_screenings: [],
        total_children: 5, total_staff: 5,
      });
      expect(r.safeguarding_depth_score).toBeLessThan(45);
      expect(r.safeguarding_depth_rating).toBe("inadequate");
    });
  });

  // ── Mod 1: Body Map Documentation ─────────────────────────────────
  describe("Mod 1: Body Map Documentation", () => {
    it("+5 with perfect photo, manager review, child explanation, staff signed", () => {
      const r = computeHomeSafeguardingDepth(baseInput());
      expect(r.safeguarding_depth_score).toBe(80);
    });

    it("penalises low photo evidence rate", () => {
      const bms = Array.from({ length: 5 }, (_, i) =>
        makeBodyMap({ id: `bm${i}`, photo_evidence: false }),
      );
      const r = computeHomeSafeguardingDepth(baseInput({ body_maps: bms }));
      expect(r.safeguarding_depth_score).toBeLessThan(80);
    });

    it("penalises low manager review rate", () => {
      const bms = Array.from({ length: 5 }, (_, i) =>
        makeBodyMap({ id: `bm${i}`, manager_reviewed: false }),
      );
      const r = computeHomeSafeguardingDepth(baseInput({ body_maps: bms }));
      expect(r.safeguarding_depth_score).toBeLessThan(80);
    });

    it("penalises no body maps with children", () => {
      const r = computeHomeSafeguardingDepth(baseInput({ body_maps: [] }));
      expect(r.safeguarding_depth_score).toBeLessThan(80);
    });
  });

  // ── Mod 2: Disclosure Handling ────────────────────────────────────
  describe("Mod 2: Disclosure Handling", () => {
    it("+4 with perfect response, escalation, informed, written up", () => {
      const r = computeHomeSafeguardingDepth(baseInput());
      expect(r.disclosures.response_within_1h_rate).toBe(100);
    });

    it("penalises slow response time", () => {
      const discs = Array.from({ length: 5 }, (_, i) =>
        makeDisclosure({ id: `d${i}`, response_within_1h: false }),
      );
      const r = computeHomeSafeguardingDepth(baseInput({ disclosures: discs }));
      expect(r.safeguarding_depth_score).toBeLessThan(80);
    });

    it("penalises poor escalation rate", () => {
      const discs = Array.from({ length: 5 }, (_, i) =>
        makeDisclosure({ id: `d${i}`, escalated_appropriately: false }),
      );
      const r = computeHomeSafeguardingDepth(baseInput({ disclosures: discs }));
      expect(r.safeguarding_depth_score).toBeLessThan(80);
    });

    it("penalises children not informed", () => {
      const discs = Array.from({ length: 5 }, (_, i) =>
        makeDisclosure({ id: `d${i}`, child_informed_of_process: false }),
      );
      const r = computeHomeSafeguardingDepth(baseInput({ disclosures: discs }));
      expect(r.safeguarding_depth_score).toBeLessThan(80);
    });

    it("penalises late write-ups", () => {
      const discs = Array.from({ length: 5 }, (_, i) =>
        makeDisclosure({ id: `d${i}`, written_up_within_24h: false }),
      );
      const r = computeHomeSafeguardingDepth(baseInput({ disclosures: discs }));
      expect(r.safeguarding_depth_score).toBeLessThan(80);
    });

    it("no disclosures is neutral — loses mod2 bonus only", () => {
      const r = computeHomeSafeguardingDepth(baseInput({ disclosures: [] }));
      // Loses mod2 (+4) → 80 - 4 = 76
      expect(r.safeguarding_depth_score).toBe(76);
    });
  });

  // ── Mod 3: Escalation Effectiveness ───────────────────────────────
  describe("Mod 3: Escalation Effectiveness", () => {
    it("+3 with strong multi-agency, resolution, learning", () => {
      const r = computeHomeSafeguardingDepth(baseInput());
      expect(r.escalations.multi_agency_rate).toBe(100);
    });

    it("penalises low multi-agency engagement", () => {
      const escs = Array.from({ length: 5 }, (_, i) =>
        makeEscalation({ id: `e${i}`, multi_agency_engaged: false }),
      );
      const r = computeHomeSafeguardingDepth(baseInput({ escalations: escs }));
      expect(r.safeguarding_depth_score).toBeLessThan(80);
    });

    it("penalises unresolved escalations", () => {
      const escs = Array.from({ length: 5 }, (_, i) =>
        makeEscalation({ id: `e${i}`, resolution_date: "" }),
      );
      const r = computeHomeSafeguardingDepth(baseInput({ escalations: escs }));
      expect(r.safeguarding_depth_score).toBeLessThan(80);
    });

    it("penalises no learning captured", () => {
      const escs = Array.from({ length: 5 }, (_, i) =>
        makeEscalation({ id: `e${i}`, learning_captured: false }),
      );
      const r = computeHomeSafeguardingDepth(baseInput({ escalations: escs }));
      expect(r.safeguarding_depth_score).toBeLessThan(80);
    });
  });

  // ── Mod 4: LADO Referral Compliance ───────────────────────────────
  describe("Mod 4: LADO Referral Compliance", () => {
    it("+4 with timely referrals, outcomes, learning, no overdue", () => {
      const r = computeHomeSafeguardingDepth(baseInput());
      expect(r.lado.referred_timely_rate).toBe(100);
      expect(r.lado.overdue_reviews).toBe(0);
    });

    it("penalises late referrals", () => {
      const refs = Array.from({ length: 3 }, (_, i) =>
        makeLADOReferral({ id: `l${i}`, referred_within_1_business_day: false }),
      );
      const r = computeHomeSafeguardingDepth(baseInput({ lado_referrals: refs }));
      expect(r.safeguarding_depth_score).toBeLessThan(80);
    });

    it("penalises outcomes not recorded", () => {
      const refs = Array.from({ length: 3 }, (_, i) =>
        makeLADOReferral({ id: `l${i}`, outcome_recorded: false }),
      );
      const r = computeHomeSafeguardingDepth(baseInput({ lado_referrals: refs }));
      expect(r.safeguarding_depth_score).toBeLessThan(80);
    });

    it("penalises overdue LADO reviews", () => {
      const refs = Array.from({ length: 3 }, (_, i) =>
        makeLADOReferral({ id: `l${i}`, review_date: daysAgo(10) }),
      );
      const r = computeHomeSafeguardingDepth(baseInput({ lado_referrals: refs }));
      expect(r.safeguarding_depth_score).toBeLessThan(80);
    });

    it("penalises learning not shared", () => {
      const refs = Array.from({ length: 3 }, (_, i) =>
        makeLADOReferral({ id: `l${i}`, learning_shared: false }),
      );
      const r = computeHomeSafeguardingDepth(baseInput({ lado_referrals: refs }));
      expect(r.safeguarding_depth_score).toBeLessThan(80);
    });
  });

  // ── Mod 5: Safeguarding Supervision ───────────────────────────────
  describe("Mod 5: Safeguarding Supervision", () => {
    it("+3 with full coverage, action completion, reflective practice", () => {
      const r = computeHomeSafeguardingDepth(baseInput());
      expect(r.supervision.staff_coverage).toBe(100);
      expect(r.supervision.reflective_practice_rate).toBe(100);
    });

    it("penalises low staff coverage", () => {
      const sups = [makeSupervision({ id: "sup1", staff_id: "s1" })];
      const r = computeHomeSafeguardingDepth(baseInput({ safeguarding_supervisions: sups }));
      expect(r.supervision.staff_coverage).toBe(20);
      expect(r.safeguarding_depth_score).toBeLessThan(80);
    });

    it("penalises low action completion", () => {
      const sups = Array.from({ length: 5 }, (_, i) =>
        makeSupervision({ id: `sup${i}`, staff_id: `s${i + 1}`, actions_set: 10, actions_completed: 2 }),
      );
      const r = computeHomeSafeguardingDepth(baseInput({ safeguarding_supervisions: sups }));
      expect(r.safeguarding_depth_score).toBeLessThan(80);
    });

    it("penalises no reflective practice", () => {
      const sups = Array.from({ length: 5 }, (_, i) =>
        makeSupervision({ id: `sup${i}`, staff_id: `s${i + 1}`, reflective_practice: false }),
      );
      const r = computeHomeSafeguardingDepth(baseInput({ safeguarding_supervisions: sups }));
      expect(r.safeguarding_depth_score).toBeLessThan(80);
    });

    it("penalises no supervisions with staff", () => {
      const r = computeHomeSafeguardingDepth(baseInput({ safeguarding_supervisions: [] }));
      expect(r.safeguarding_depth_score).toBeLessThan(80);
    });
  });

  // ── Mod 6: Safe Touch Protocols ───────────────────────────────────
  describe("Mod 6: Safe Touch Protocols", () => {
    it("+3 with full coverage, consent, no overdue", () => {
      const r = computeHomeSafeguardingDepth(baseInput());
      expect(r.safe_touch.child_coverage).toBe(100);
      expect(r.safe_touch.consent_rate).toBe(100);
    });

    it("penalises low coverage", () => {
      const protos = [makeSafeTouch({ id: "st1", child_id: "c1" })];
      const r = computeHomeSafeguardingDepth(baseInput({ safe_touch_protocols: protos }));
      expect(r.safe_touch.child_coverage).toBe(20);
      expect(r.safeguarding_depth_score).toBeLessThan(80);
    });

    it("penalises no consent obtained", () => {
      const protos = Array.from({ length: 5 }, (_, i) =>
        makeSafeTouch({ id: `st${i}`, child_id: `c${i + 1}`, consent_obtained: false }),
      );
      const r = computeHomeSafeguardingDepth(baseInput({ safe_touch_protocols: protos }));
      expect(r.safeguarding_depth_score).toBeLessThan(80);
    });

    it("penalises overdue reviews", () => {
      const protos = Array.from({ length: 5 }, (_, i) =>
        makeSafeTouch({ id: `st${i}`, child_id: `c${i + 1}`, review_date: daysAgo(10) }),
      );
      const r = computeHomeSafeguardingDepth(baseInput({ safe_touch_protocols: protos }));
      expect(r.safeguarding_depth_score).toBeLessThan(80);
    });

    it("penalises no protocols with children", () => {
      const r = computeHomeSafeguardingDepth(baseInput({ safe_touch_protocols: [] }));
      expect(r.safeguarding_depth_score).toBeLessThan(80);
    });
  });

  // ── Mod 7: Substance Screening ────────────────────────────────────
  describe("Mod 7: Substance Screening", () => {
    it("+3 with good follow-up, support, low positive rate", () => {
      const r = computeHomeSafeguardingDepth(baseInput());
      expect(r.substance_screening.follow_up_rate).toBe(100);
      expect(r.substance_screening.positive_rate).toBe(0);
    });

    it("penalises low follow-up rate", () => {
      const screens = Array.from({ length: 5 }, (_, i) =>
        makeSubstanceScreening({ id: `ss${i}`, date: daysAgo(i * 10 + 5), follow_up_actioned: false }),
      );
      const r = computeHomeSafeguardingDepth(baseInput({ substance_screenings: screens }));
      expect(r.safeguarding_depth_score).toBeLessThan(80);
    });

    it("penalises low child support rate", () => {
      const screens = Array.from({ length: 5 }, (_, i) =>
        makeSubstanceScreening({ id: `ss${i}`, date: daysAgo(i * 10 + 5), child_supported: false }),
      );
      const r = computeHomeSafeguardingDepth(baseInput({ substance_screenings: screens }));
      expect(r.safeguarding_depth_score).toBeLessThan(80);
    });

    it("penalises high positive rate", () => {
      const screens = Array.from({ length: 5 }, (_, i) =>
        makeSubstanceScreening({ id: `ss${i}`, date: daysAgo(i * 10 + 5), result: "positive" }),
      );
      const r = computeHomeSafeguardingDepth(baseInput({ substance_screenings: screens }));
      expect(r.safeguarding_depth_score).toBeLessThan(80);
    });

    it("filters to 90-day window", () => {
      const screens = [
        makeSubstanceScreening({ id: "ss1", date: daysAgo(10) }),
        makeSubstanceScreening({ id: "ss2", date: daysAgo(95) }),
      ];
      const r = computeHomeSafeguardingDepth(baseInput({ substance_screenings: screens }));
      expect(r.substance_screening.total_90d).toBe(1);
    });
  });

  // ── Mod 8: Child Voice ────────────────────────────────────────────
  describe("Mod 8: Child Voice in Safeguarding", () => {
    it("+3 with strong voice across all sources", () => {
      const r = computeHomeSafeguardingDepth(baseInput());
      expect(r.safeguarding_depth_score).toBe(80);
    });

    it("penalises missing child explanation in body maps", () => {
      const bms = Array.from({ length: 5 }, (_, i) =>
        makeBodyMap({ id: `bm${i}`, child_explanation_recorded: false }),
      );
      const r = computeHomeSafeguardingDepth(baseInput({ body_maps: bms }));
      expect(r.safeguarding_depth_score).toBeLessThan(80);
    });

    it("penalises missing child voice in safe touch", () => {
      const protos = Array.from({ length: 5 }, (_, i) =>
        makeSafeTouch({ id: `st${i}`, child_id: `c${i + 1}`, child_voice_captured: false }),
      );
      const r = computeHomeSafeguardingDepth(baseInput({ safe_touch_protocols: protos }));
      expect(r.safeguarding_depth_score).toBeLessThan(80);
    });
  });

  // ── Summary Computations ──────────────────────────────────────────
  describe("Summary computations", () => {
    it("computes body map photo rate correctly", () => {
      const bms = [
        makeBodyMap({ id: "bm1", photo_evidence: true }),
        makeBodyMap({ id: "bm2", photo_evidence: false }),
      ];
      const r = computeHomeSafeguardingDepth(baseInput({ body_maps: bms }));
      expect(r.body_maps.photo_evidence_rate).toBe(50);
    });

    it("computes disclosure response rate correctly", () => {
      const discs = [
        makeDisclosure({ id: "d1", response_within_1h: true }),
        makeDisclosure({ id: "d2", response_within_1h: false }),
        makeDisclosure({ id: "d3", response_within_1h: false }),
      ];
      const r = computeHomeSafeguardingDepth(baseInput({ disclosures: discs }));
      expect(r.disclosures.response_within_1h_rate).toBe(33);
    });

    it("computes escalation resolution rate", () => {
      const escs = [
        makeEscalation({ id: "e1", resolution_date: daysAgo(5) }),
        makeEscalation({ id: "e2", resolution_date: "" }),
      ];
      const r = computeHomeSafeguardingDepth(baseInput({ escalations: escs }));
      expect(r.escalations.resolved_rate).toBe(50);
    });

    it("computes LADO overdue reviews", () => {
      const refs = [
        makeLADOReferral({ id: "l1", review_date: daysAgo(5) }),
        makeLADOReferral({ id: "l2", review_date: futureDate(10) }),
      ];
      const r = computeHomeSafeguardingDepth(baseInput({ lado_referrals: refs }));
      expect(r.lado.overdue_reviews).toBe(1);
    });

    it("computes supervision staff coverage", () => {
      const sups = [
        makeSupervision({ id: "sup1", staff_id: "s1" }),
        makeSupervision({ id: "sup2", staff_id: "s2" }),
      ];
      const r = computeHomeSafeguardingDepth(baseInput({ safeguarding_supervisions: sups }));
      expect(r.supervision.staff_coverage).toBe(40);
    });

    it("computes safe touch child coverage", () => {
      const protos = [
        makeSafeTouch({ id: "st1", child_id: "c1" }),
        makeSafeTouch({ id: "st2", child_id: "c2" }),
        makeSafeTouch({ id: "st3", child_id: "c3" }),
      ];
      const r = computeHomeSafeguardingDepth(baseInput({ safe_touch_protocols: protos }));
      expect(r.safe_touch.child_coverage).toBe(60);
    });

    it("computes substance screening positive rate", () => {
      const screens = [
        makeSubstanceScreening({ id: "ss1", date: daysAgo(5), result: "positive" }),
        makeSubstanceScreening({ id: "ss2", date: daysAgo(10), result: "negative" }),
        makeSubstanceScreening({ id: "ss3", date: daysAgo(15), result: "negative" }),
      ];
      const r = computeHomeSafeguardingDepth(baseInput({ substance_screenings: screens }));
      expect(r.substance_screening.positive_rate).toBe(33);
    });

    it("computes avg resolution days", () => {
      const escs = [
        makeEscalation({ id: "e1", date: daysAgo(20), resolution_date: daysAgo(10) }),
        makeEscalation({ id: "e2", date: daysAgo(15), resolution_date: daysAgo(10) }),
      ];
      const r = computeHomeSafeguardingDepth(baseInput({ escalations: escs }));
      expect(r.escalations.avg_resolution_days).toBe(7.5);
    });

    it("computes supervision avg action completion rate", () => {
      const sups = [
        makeSupervision({ id: "sup1", staff_id: "s1", actions_set: 10, actions_completed: 8 }),
        makeSupervision({ id: "sup2", staff_id: "s2", actions_set: 10, actions_completed: 6 }),
      ];
      const r = computeHomeSafeguardingDepth(baseInput({ safeguarding_supervisions: sups }));
      expect(r.supervision.avg_actions_completion_rate).toBe(70);
    });
  });

  // ── Narrative ─────────────────────────────────────────────────────
  describe("Narrative output", () => {
    it("generates body map strength for excellent documentation", () => {
      const r = computeHomeSafeguardingDepth(baseInput());
      expect(r.strengths.some(s => s.includes("body map documentation"))).toBe(true);
    });

    it("generates disclosure strength for strong handling", () => {
      const r = computeHomeSafeguardingDepth(baseInput());
      expect(r.strengths.some(s => s.includes("disclosure handling"))).toBe(true);
    });

    it("generates concern for low manager review rate", () => {
      const bms = Array.from({ length: 5 }, (_, i) =>
        makeBodyMap({ id: `bm${i}`, manager_reviewed: false }),
      );
      const r = computeHomeSafeguardingDepth(baseInput({ body_maps: bms }));
      expect(r.concerns.some(c => c.includes("manager review rate"))).toBe(true);
    });

    it("generates concern for poor disclosure response time", () => {
      const discs = Array.from({ length: 5 }, (_, i) =>
        makeDisclosure({ id: `d${i}`, response_within_1h: false }),
      );
      const r = computeHomeSafeguardingDepth(baseInput({ disclosures: discs }));
      expect(r.concerns.some(c => c.includes("disclosure response time"))).toBe(true);
    });

    it("generates concern for no supervision", () => {
      const r = computeHomeSafeguardingDepth(baseInput({ safeguarding_supervisions: [] }));
      expect(r.concerns.some(c => c.includes("safeguarding supervision"))).toBe(true);
    });

    it("generates concern for no safe touch protocols", () => {
      const r = computeHomeSafeguardingDepth(baseInput({ safe_touch_protocols: [] }));
      expect(r.concerns.some(c => c.includes("safe touch"))).toBe(true);
    });

    it("generates recommendations for critical issues", () => {
      const r = computeHomeSafeguardingDepth(baseInput({
        body_maps: Array.from({ length: 5 }, (_, i) =>
          makeBodyMap({ id: `bm${i}`, manager_reviewed: false }),
        ),
      }));
      expect(r.recommendations.length).toBeGreaterThan(0);
      expect(r.recommendations.every(rec => rec.rank > 0)).toBe(true);
    });

    it("generates outstanding insight", () => {
      const r = computeHomeSafeguardingDepth(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("outstanding"))).toBe(true);
    });

    it("generates inadequate insight", () => {
      const r = computeHomeSafeguardingDepth({
        today: TODAY,
        body_maps: Array.from({ length: 5 }, (_, i) =>
          makeBodyMap({ id: `bm${i}`, photo_evidence: false, manager_reviewed: false, staff_signed: false, child_explanation_recorded: false }),
        ),
        disclosures: Array.from({ length: 5 }, (_, i) =>
          makeDisclosure({ id: `d${i}`, response_within_1h: false, escalated_appropriately: false, child_informed_of_process: false, written_up_within_24h: false }),
        ),
        escalations: [], lado_referrals: [], safeguarding_supervisions: [],
        safe_touch_protocols: [], substance_screenings: [],
        total_children: 5, total_staff: 5,
      });
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("inadequate"))).toBe(true);
    });

    it("generates LADO strength insight", () => {
      const r = computeHomeSafeguardingDepth(baseInput());
      expect(r.insights.some(i => i.text.includes("LADO"))).toBe(true);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────
  describe("edge cases", () => {
    it("score is clamped to 0-100", () => {
      const r = computeHomeSafeguardingDepth({
        today: TODAY,
        body_maps: Array.from({ length: 5 }, (_, i) =>
          makeBodyMap({ id: `bm${i}`, photo_evidence: false, manager_reviewed: false, staff_signed: false, child_explanation_recorded: false }),
        ),
        disclosures: Array.from({ length: 5 }, (_, i) =>
          makeDisclosure({ id: `d${i}`, response_within_1h: false, escalated_appropriately: false, child_informed_of_process: false, written_up_within_24h: false }),
        ),
        escalations: Array.from({ length: 5 }, (_, i) =>
          makeEscalation({ id: `e${i}`, multi_agency_engaged: false, resolution_date: "", learning_captured: false }),
        ),
        lado_referrals: Array.from({ length: 3 }, (_, i) =>
          makeLADOReferral({ id: `l${i}`, referred_within_1_business_day: false, outcome_recorded: false, learning_shared: false, review_date: daysAgo(30) }),
        ),
        safeguarding_supervisions: Array.from({ length: 5 }, (_, i) =>
          makeSupervision({ id: `sup${i}`, staff_id: `s${i + 1}`, actions_set: 10, actions_completed: 1, reflective_practice: false }),
        ),
        safe_touch_protocols: Array.from({ length: 5 }, (_, i) =>
          makeSafeTouch({ id: `st${i}`, child_id: `c${i + 1}`, consent_obtained: false, child_voice_captured: false, review_date: daysAgo(30) }),
        ),
        substance_screenings: Array.from({ length: 5 }, (_, i) =>
          makeSubstanceScreening({ id: `ss${i}`, date: daysAgo(i * 10 + 5), result: "positive", follow_up_actioned: false, child_supported: false }),
        ),
        total_children: 5,
        total_staff: 5,
      });
      expect(r.safeguarding_depth_score).toBeGreaterThanOrEqual(0);
      expect(r.safeguarding_depth_score).toBeLessThanOrEqual(100);
    });

    it("handles single body map", () => {
      const r = computeHomeSafeguardingDepth(baseInput({
        body_maps: [makeBodyMap({ id: "bm1" })],
      }));
      expect(r.body_maps.total).toBe(1);
    });

    it("handles supervision with zero actions set", () => {
      const sups = [
        makeSupervision({ id: "sup1", staff_id: "s1", actions_set: 0, actions_completed: 0 }),
      ];
      const r = computeHomeSafeguardingDepth(baseInput({ safeguarding_supervisions: sups }));
      expect(r.supervision.avg_actions_completion_rate).toBe(100);
    });

    it("pct returns 0 when denominator is 0", () => {
      const r = computeHomeSafeguardingDepth({
        today: TODAY, body_maps: [], disclosures: [], escalations: [],
        lado_referrals: [], safeguarding_supervisions: [], safe_touch_protocols: [],
        substance_screenings: [], total_children: 0, total_staff: 0,
      });
      expect(r.body_maps.photo_evidence_rate).toBe(0);
      expect(r.disclosures.response_within_1h_rate).toBe(0);
    });
  });
});
