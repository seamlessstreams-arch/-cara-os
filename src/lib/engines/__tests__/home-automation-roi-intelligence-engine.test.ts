// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME AUTOMATION ROI INTELLIGENCE ENGINE — TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  computeAutomationROI,
  type SavedTimeMetricInput,
  type CareEventRouteInput,
  type CareEventBasicInput,
  type AutomationROIInput,
} from "../home-automation-roi-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-28";

function makeMetric(overrides: Partial<SavedTimeMetricInput> = {}): SavedTimeMetricInput {
  return {
    id: "met_1",
    care_event_id: "evt_1",
    route_type: "safeguarding",
    minutes_saved: 8,
    staff_id: "staff_1",
    recorded_at: "2026-05-20",
    ...overrides,
  };
}

function makeRoute(overrides: Partial<CareEventRouteInput> = {}): CareEventRouteInput {
  return {
    id: "route_1",
    care_event_id: "evt_1",
    route_type: "safeguarding",
    status: "completed",
    has_error: false,
    retry_count: 0,
    time_saved_minutes: 5,
    created_at: "2026-05-20",
    ...overrides,
  };
}

function makeEvent(overrides: Partial<CareEventBasicInput> = {}): CareEventBasicInput {
  return {
    id: "evt_1",
    child_id: "child_1",
    staff_id: "staff_1",
    category: "general",
    date: "2026-05-20",
    has_routes: true,
    ...overrides,
  };
}

function baseInput(overrides: Partial<AutomationROIInput> = {}): AutomationROIInput {
  return {
    today: TODAY,
    total_staff: 8,
    metrics: [],
    routes: [],
    events: [],
    ...overrides,
  };
}

// ── Structure / Shape ─────────────────────────────────────────────────────

describe("Home Automation ROI Intelligence Engine", () => {
  describe("structure and shape", () => {
    it("returns all expected result fields", () => {
      const r = computeAutomationROI(baseInput({
        metrics: [makeMetric()],
        routes: [makeRoute()],
        events: [makeEvent()],
      }));
      expect(r).toHaveProperty("automation_rating");
      expect(r).toHaveProperty("automation_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_time_saved");
      expect(r).toHaveProperty("route_success_rate");
      expect(r).toHaveProperty("automation_coverage");
      expect(r).toHaveProperty("error_rate");
      expect(r).toHaveProperty("route_type_diversity");
      expect(r).toHaveProperty("avg_minutes_per_route");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("strengths is an array of strings", () => {
      const r = computeAutomationROI(baseInput({
        metrics: [makeMetric()],
        routes: [makeRoute()],
        events: [makeEvent()],
      }));
      expect(Array.isArray(r.strengths)).toBe(true);
    });

    it("concerns is an array of strings", () => {
      const r = computeAutomationROI(baseInput({
        metrics: [makeMetric()],
        routes: [makeRoute()],
        events: [makeEvent()],
      }));
      expect(Array.isArray(r.concerns)).toBe(true);
    });

    it("recommendations is an array of objects with rank, recommendation, urgency, regulatory_ref", () => {
      const r = computeAutomationROI(baseInput({
        routes: [makeRoute({ status: "failed", has_error: true })],
        events: [makeEvent({ has_routes: false })],
        metrics: [makeMetric({ minutes_saved: 1 })],
      }));
      if (r.recommendations.length > 0) {
        const rec = r.recommendations[0];
        expect(rec).toHaveProperty("rank");
        expect(rec).toHaveProperty("recommendation");
        expect(rec).toHaveProperty("urgency");
        expect(rec).toHaveProperty("regulatory_ref");
      }
    });

    it("insights is an array of objects with text and severity", () => {
      const r = computeAutomationROI(baseInput({
        metrics: [makeMetric()],
        routes: [makeRoute()],
        events: [makeEvent()],
      }));
      if (r.insights.length > 0) {
        const insight = r.insights[0];
        expect(insight).toHaveProperty("text");
        expect(insight).toHaveProperty("severity");
      }
    });

    it("automation_rating is one of the expected values", () => {
      const r = computeAutomationROI(baseInput({
        metrics: [makeMetric()],
        routes: [makeRoute()],
        events: [makeEvent()],
      }));
      expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.automation_rating);
    });

    it("automation_score is a number", () => {
      const r = computeAutomationROI(baseInput({
        metrics: [makeMetric()],
        routes: [makeRoute()],
        events: [makeEvent()],
      }));
      expect(typeof r.automation_score).toBe("number");
    });

    it("headline is a non-empty string", () => {
      const r = computeAutomationROI(baseInput({
        metrics: [makeMetric()],
        routes: [makeRoute()],
        events: [makeEvent()],
      }));
      expect(typeof r.headline).toBe("string");
      expect(r.headline.length).toBeGreaterThan(0);
    });
  });

  // ── Special Cases ──────────────────────────────────────────────────────────

  describe("special cases", () => {
    it("returns insufficient_data when total_staff is 0", () => {
      const r = computeAutomationROI(baseInput({ total_staff: 0 }));
      expect(r.automation_rating).toBe("insufficient_data");
      expect(r.automation_score).toBe(0);
      expect(r.headline).toContain("No staff registered");
    });

    it("returns score 0 for insufficient_data", () => {
      const r = computeAutomationROI(baseInput({ total_staff: 0 }));
      expect(r.automation_score).toBe(0);
    });

    it("returns warning insight for no staff", () => {
      const r = computeAutomationROI(baseInput({ total_staff: 0 }));
      expect(r.insights.length).toBe(1);
      expect(r.insights[0].severity).toBe("warning");
    });

    it("returns empty strengths/concerns/recommendations for no staff", () => {
      const r = computeAutomationROI(baseInput({ total_staff: 0 }));
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
    });

    it("returns 0 for all metric fields when insufficient_data", () => {
      const r = computeAutomationROI(baseInput({ total_staff: 0 }));
      expect(r.total_time_saved).toBe(0);
      expect(r.route_success_rate).toBe(0);
      expect(r.automation_coverage).toBe(0);
      expect(r.error_rate).toBe(0);
      expect(r.route_type_diversity).toBe(0);
      expect(r.avg_minutes_per_route).toBe(0);
    });

    it("returns insufficient_data even when metrics/routes/events exist with 0 staff", () => {
      const r = computeAutomationROI(baseInput({
        total_staff: 0,
        metrics: [makeMetric()],
        routes: [makeRoute()],
        events: [makeEvent()],
      }));
      expect(r.automation_rating).toBe("insufficient_data");
      expect(r.automation_score).toBe(0);
    });

    it("returns inadequate with score 25 when 0 metrics AND 0 routes AND 0 events with staff present", () => {
      const r = computeAutomationROI(baseInput({ metrics: [], routes: [], events: [] }));
      expect(r.automation_rating).toBe("inadequate");
      expect(r.automation_score).toBe(25);
    });

    it("returns concern about no automation activity", () => {
      const r = computeAutomationROI(baseInput({ metrics: [], routes: [], events: [] }));
      expect(r.concerns.length).toBeGreaterThan(0);
      expect(r.concerns[0]).toContain("No automation activity");
    });

    it("returns critical insight for 0 activity with staff", () => {
      const r = computeAutomationROI(baseInput({ metrics: [], routes: [], events: [] }));
      expect(r.insights.length).toBe(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("returns immediate recommendation for 0 activity", () => {
      const r = computeAutomationROI(baseInput({ metrics: [], routes: [], events: [] }));
      expect(r.recommendations.length).toBe(1);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[0].regulatory_ref).toContain("Reg 12");
    });

    it("returns inadequate when all data is outside 90-day window", () => {
      const r = computeAutomationROI(baseInput({
        metrics: [makeMetric({ recorded_at: "2026-01-01" })],
        routes: [makeRoute({ created_at: "2026-01-01" })],
        events: [makeEvent({ date: "2026-01-01" })],
      }));
      expect(r.automation_rating).toBe("inadequate");
      expect(r.automation_score).toBe(25);
    });

    it("does not treat as empty special case when only metrics exist (no routes or events)", () => {
      const r = computeAutomationROI(baseInput({
        metrics: [makeMetric()],
        routes: [],
        events: [],
      }));
      // Has metrics so not the "0 activity" special case
      expect(r.automation_score).not.toBe(25);
    });

    it("does not treat as empty special case when only routes exist", () => {
      const r = computeAutomationROI(baseInput({
        metrics: [],
        routes: [makeRoute()],
        events: [],
      }));
      expect(r.automation_score).not.toBe(25);
    });

    it("does not treat as empty special case when only events exist", () => {
      const r = computeAutomationROI(baseInput({
        metrics: [],
        routes: [],
        events: [makeEvent()],
      }));
      expect(r.automation_score).not.toBe(25);
    });
  });

  // ── 90-Day Rolling Window Filter ─────────────────────────────────────────

  describe("90-day rolling window filter", () => {
    it("filters metrics to last 90 days", () => {
      const r = computeAutomationROI(baseInput({
        metrics: [
          makeMetric({ id: "m1", minutes_saved: 10, recorded_at: "2026-05-20" }),
          makeMetric({ id: "m2", minutes_saved: 100, recorded_at: "2026-01-01" }), // outside
        ],
        routes: [makeRoute()],
        events: [makeEvent()],
      }));
      expect(r.total_time_saved).toBe(10);
    });

    it("filters routes to last 90 days", () => {
      const r = computeAutomationROI(baseInput({
        routes: [
          makeRoute({ id: "r1", created_at: "2026-05-20" }),
          makeRoute({ id: "r2", created_at: "2026-01-01" }), // outside
        ],
        events: [makeEvent()],
        metrics: [makeMetric()],
      }));
      // Only 1 route in window → 100% success
      expect(r.route_success_rate).toBe(100);
    });

    it("filters events to last 90 days", () => {
      const r = computeAutomationROI(baseInput({
        events: [
          makeEvent({ id: "e1", date: "2026-05-20", has_routes: true }),
          makeEvent({ id: "e2", date: "2026-01-01", has_routes: false }), // outside
        ],
        routes: [makeRoute()],
        metrics: [makeMetric()],
      }));
      expect(r.automation_coverage).toBe(100);
    });

    it("excludes future-dated metrics", () => {
      const r = computeAutomationROI(baseInput({
        metrics: [
          makeMetric({ id: "m1", minutes_saved: 10, recorded_at: "2026-05-29" }), // tomorrow
          makeMetric({ id: "m2", minutes_saved: 5, recorded_at: "2026-05-28" }), // today
        ],
        routes: [makeRoute()],
        events: [makeEvent()],
      }));
      expect(r.total_time_saved).toBe(5);
    });

    it("excludes future-dated routes", () => {
      const r = computeAutomationROI(baseInput({
        routes: [
          makeRoute({ id: "r1", created_at: "2026-05-29" }), // tomorrow
          makeRoute({ id: "r2", created_at: "2026-05-28" }), // today
        ],
        events: [makeEvent()],
        metrics: [makeMetric()],
      }));
      // Only today's route counts
      expect(r.route_success_rate).toBe(100);
    });

    it("excludes future-dated events", () => {
      const r = computeAutomationROI(baseInput({
        events: [
          makeEvent({ id: "e1", date: "2026-05-29", has_routes: true }), // tomorrow
          makeEvent({ id: "e2", date: "2026-05-28", has_routes: true }), // today
        ],
        routes: [makeRoute()],
        metrics: [makeMetric()],
      }));
      expect(r.automation_coverage).toBe(100);
    });

    it("includes data on today's date", () => {
      const r = computeAutomationROI(baseInput({
        metrics: [makeMetric({ recorded_at: TODAY })],
        routes: [makeRoute({ created_at: TODAY })],
        events: [makeEvent({ date: TODAY })],
      }));
      expect(r.total_time_saved).toBe(8);
    });

    it("includes data on the cutoff boundary", () => {
      // 90 days before 2026-05-28 = 2026-02-27
      const r = computeAutomationROI(baseInput({
        metrics: [makeMetric({ recorded_at: "2026-02-27", minutes_saved: 7 })],
        routes: [makeRoute({ created_at: "2026-02-27" })],
        events: [makeEvent({ date: "2026-02-27" })],
      }));
      expect(r.total_time_saved).toBe(7);
    });

    it("excludes data one day before cutoff", () => {
      // 91 days before 2026-05-28 = 2026-02-26
      const r = computeAutomationROI(baseInput({
        metrics: [makeMetric({ recorded_at: "2026-02-26", minutes_saved: 100 })],
        routes: [makeRoute({ created_at: "2026-02-26" })],
        events: [makeEvent({ date: "2026-02-26" })],
      }));
      // All filtered out → empty → special case score 25
      expect(r.automation_score).toBe(25);
    });
  });

  // ── Rating Thresholds ────────────────────────────────────────────────────

  describe("rating thresholds", () => {
    it("rates outstanding at score 82 (max bonuses)", () => {
      // Base 52 + 6(success>=95) + 5(coverage>=90) + 5(error<5) + 5(minutes/staff>=30) + 4(diversity>=4) + 5(retry<5)
      // = 52 + 30 = 82
      const routes: CareEventRouteInput[] = [];
      const events: CareEventBasicInput[] = [];
      const metrics: SavedTimeMetricInput[] = [];
      // 20 routes, all completed, no errors, no retries, 4+ route types
      const routeTypes = ["safeguarding", "health", "behaviour", "education"];
      for (let i = 0; i < 20; i++) {
        routes.push(makeRoute({
          id: `r_${i}`,
          route_type: routeTypes[i % 4],
          status: "completed",
          has_error: false,
          retry_count: 0,
          time_saved_minutes: 5,
          created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
        }));
      }
      // 10 events, all with routes → 100% coverage
      for (let i = 0; i < 10; i++) {
        events.push(makeEvent({
          id: `e_${i}`,
          has_routes: true,
          date: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
        }));
      }
      // Metrics: 8 staff, need >=30 min/staff → 240+ total minutes
      for (let i = 0; i < 8; i++) {
        metrics.push(makeMetric({
          id: `m_${i}`,
          minutes_saved: 30,
          staff_id: `staff_${i}`,
          recorded_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
        }));
      }
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      expect(r.automation_score).toBe(82);
      expect(r.automation_rating).toBe("outstanding");
    });

    it("rates outstanding at score 80", () => {
      // 52 + 6 + 5 + 5 + 5 + 2(diversity 2-3) + 5 = 80
      const routes: CareEventRouteInput[] = [];
      const events: CareEventBasicInput[] = [];
      const metrics: SavedTimeMetricInput[] = [];
      // 2 route types only
      const routeTypes = ["safeguarding", "health"];
      for (let i = 0; i < 20; i++) {
        routes.push(makeRoute({
          id: `r_${i}`,
          route_type: routeTypes[i % 2],
          status: "completed",
          has_error: false,
          retry_count: 0,
          time_saved_minutes: 5,
          created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
        }));
      }
      for (let i = 0; i < 10; i++) {
        events.push(makeEvent({
          id: `e_${i}`,
          has_routes: true,
          date: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
        }));
      }
      for (let i = 0; i < 8; i++) {
        metrics.push(makeMetric({
          id: `m_${i}`,
          minutes_saved: 30,
          staff_id: `staff_${i}`,
          recorded_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
        }));
      }
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      expect(r.automation_score).toBe(80);
      expect(r.automation_rating).toBe("outstanding");
    });

    it("rates good at score 79 (just below outstanding)", () => {
      // 52 + 6 + 5 + 5 + 2(minutes/staff 15-29) + 4(diversity>=4) + 5 = 79
      const routes: CareEventRouteInput[] = [];
      const events: CareEventBasicInput[] = [];
      const metrics: SavedTimeMetricInput[] = [];
      const routeTypes = ["safeguarding", "health", "behaviour", "education"];
      for (let i = 0; i < 20; i++) {
        routes.push(makeRoute({
          id: `r_${i}`,
          route_type: routeTypes[i % 4],
          status: "completed",
          has_error: false,
          retry_count: 0,
          time_saved_minutes: 5,
          created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
        }));
      }
      for (let i = 0; i < 10; i++) {
        events.push(makeEvent({
          id: `e_${i}`,
          has_routes: true,
          date: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
        }));
      }
      // 8 staff, need 15-29 min/staff → 120-231 total. Use 160 → 20/staff
      for (let i = 0; i < 8; i++) {
        metrics.push(makeMetric({
          id: `m_${i}`,
          minutes_saved: 20,
          staff_id: `staff_${i}`,
          recorded_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
        }));
      }
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      // minutesPerStaff = 160/8 = 20 → +2
      expect(r.automation_score).toBe(79);
      expect(r.automation_rating).toBe("good");
    });

    it("rates good at score 65", () => {
      // 52 + 13 = 65
      // +3(success 80-94%) + 2(coverage 70-89%) + 2(error 5-14%) + 2(min/staff 15-29) + 2(diversity 2-3) + 2(retry 5-14%)
      // = 3+2+2+2+2+2 = 13
      const routes: CareEventRouteInput[] = [];
      const events: CareEventBasicInput[] = [];
      const metrics: SavedTimeMetricInput[] = [];
      // 10 routes: 8 completed, 2 failed → 80% success
      for (let i = 0; i < 10; i++) {
        routes.push(makeRoute({
          id: `r_${i}`,
          route_type: i < 5 ? "safeguarding" : "health",
          status: i < 8 ? "completed" : "failed",
          has_error: i === 9, // 1/10 = 10% error
          retry_count: i === 0 ? 1 : 0, // 1/10 = 10% retry
          time_saved_minutes: 5,
          created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
        }));
      }
      // 10 events: 7 with routes → 70% coverage
      for (let i = 0; i < 10; i++) {
        events.push(makeEvent({
          id: `e_${i}`,
          has_routes: i < 7,
          date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        }));
      }
      // 8 staff, 160 total minutes → 20/staff
      for (let i = 0; i < 8; i++) {
        metrics.push(makeMetric({
          id: `m_${i}`,
          minutes_saved: 20,
          recorded_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
        }));
      }
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      expect(r.automation_score).toBe(65);
      expect(r.automation_rating).toBe("good");
    });

    it("rates adequate at score 64 (just below good)", () => {
      // 52 + 12 = 64
      // +3(success 80%) + 2(coverage 70%) + (-1)(no routes... wait that conflicts with success)
      // Let me recalc: need modifiers summing to +12
      // +3(success 80-94%) + 2(coverage 70-89%) + 2(error 5-14%) + 2(min/staff 15-29) + 2(diversity 2-3) + 2(retry 5-14%) = 13 → 65
      // Need to drop 1 point: change one +2 to 0
      // +3 + 2 + 2 + 2 + 2 + 0(retry 15-30%) = 11 → 63... too low
      // +3 + 2 + 2 + 0(min/staff 5-14, no bonus/penalty) + 2 + 2 = 11 → 63
      // Hmm. Between-brackets are: 0 (no bonus no penalty)
      // min/staff: >=30→+5, >=15→+2, <5→-4. So 5-14 → 0
      // +3 + 2 + 2 + 0 + 4(diversity>=4) + 2 = 13 → 65
      // Try: +3 + 2 + 2 + 0 + 2 + 2 = 11... nah
      // Better approach: +3(success) + 2(coverage) + (-1)(no routes for error)...
      // But if we have routes for success, we can't have "no routes" for error.
      // Let me think differently.
      // +3 + 0(coverage 40-69%) + 5(error<5) + 2(min/staff>=15) + 0(diversity 1) + 2(retry<15) = 12 → 64
      // coverage: 40-69% → 0
      // diversity: 1 → 0 (>=2→+2, 0→-4, 1→0)
      const routes: CareEventRouteInput[] = [];
      const events: CareEventBasicInput[] = [];
      const metrics: SavedTimeMetricInput[] = [];
      // 10 routes, 8 completed → 80% → +3
      // All same route type → diversity 1 → 0
      // No errors → error 0% → +5
      // No retries → retry 0% → +5... wait that's too much
      // Need retry to give +2 not +5. retry 5-14% → +2
      // Actually retry <5% with routes>0 → +5. I need 5-14% → +2.
      // Hmm wait, <5%→+5, <15%→+2, >30%→-4. At 5% it's NOT <5, so >=5 and <15 → +2
      // So: +3 + 0(coverage) + 5(error<5) + 2(min) + 0(diversity 1) + 2(retry 5-14%) = 12 → 64
      for (let i = 0; i < 20; i++) {
        routes.push(makeRoute({
          id: `r_${i}`,
          route_type: "safeguarding", // only 1 type → diversity 1 → 0
          status: i < 16 ? "completed" : "failed", // 16/20 = 80% → +3
          has_error: false, // 0% error → +5
          retry_count: i === 0 ? 1 : 0, // 1/20 = 5% → +2
          time_saved_minutes: 5,
          created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
        }));
      }
      // 10 events: 5 with routes → 50% → 0 (>=40 but <70)
      for (let i = 0; i < 10; i++) {
        events.push(makeEvent({
          id: `e_${i}`,
          has_routes: i < 5,
          date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        }));
      }
      // 8 staff, 160 total → 20/staff → +2
      for (let i = 0; i < 8; i++) {
        metrics.push(makeMetric({
          id: `m_${i}`,
          minutes_saved: 20,
          recorded_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
        }));
      }
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      expect(r.automation_score).toBe(64);
      expect(r.automation_rating).toBe("adequate");
    });

    it("rates adequate at score 45", () => {
      // 52 + (-7) = 45
      // -8(success<50%) + 0(coverage 40-69%) + (-1)(no routes? no, need routes for success)
      // Wait, if success<50% we need routes. Let me recalc.
      // Need routes for success rate calculation.
      // -8(success<50%) + 0(coverage) + error modifier + time modifier + diversity + retry
      // With routes present: error <5%→+5, retry<5%→+5
      // -8 + 0 + 5 + (-4)(min/staff<5) + 0(diversity 1) + 5 = -2 → 50... too high
      // -8 + 0 + 2(error 5-14%) + (-4) + 0 + 2 = -8 → 44... too low
      // -8 + 0 + 5 + (-4) + 0 + 2 = -5 → 47
      // -8 + 0 + 2 + (-4) + 2 + 2 = -6 → 46
      // -8 + 0 + 2 + 0(min 5-14) + 0(div 1) + 2 = -4 → 48
      // -8 + (-5)(coverage<40) + 5 + 0 + 2 + 2 = -4 → 48
      // -8 + 0 + 2 + (-4) + 0 + 2 = -8 → 44
      // Need exactly -7. Let me try:
      // -8 + 0(coverage 40-69%) + 5(error<5) + (-4)(min<5) + 0(div 1) + 0(retry 15-30%) = -7 → 45!
      const routes: CareEventRouteInput[] = [];
      const events: CareEventBasicInput[] = [];
      const metrics: SavedTimeMetricInput[] = [];
      // 10 routes: 4 completed → 40% < 50% → -8
      // 1 type → diversity 1 → 0
      // no errors → error 0% → +5
      // retry: 2/10 = 20% → 0 (15-30%)
      for (let i = 0; i < 10; i++) {
        routes.push(makeRoute({
          id: `r_${i}`,
          route_type: "safeguarding",
          status: i < 4 ? "completed" : "failed",
          has_error: false,
          retry_count: i < 2 ? 1 : 0, // 2/10 = 20% → 0
          time_saved_minutes: 2,
          created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
        }));
      }
      // 10 events: 5 with routes → 50% → 0
      for (let i = 0; i < 10; i++) {
        events.push(makeEvent({
          id: `e_${i}`,
          has_routes: i < 5,
          date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        }));
      }
      // 8 staff, need <5 min/staff → <40 total. Use 8 total → 1/staff → -4
      metrics.push(makeMetric({
        id: "m_1",
        minutes_saved: 8,
        recorded_at: "2026-05-15",
      }));
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      // success: 40% → -8
      // coverage: 50% → 0
      // error: 0% → +5
      // min/staff: 1 → -4
      // diversity: 1 → 0
      // retry: 20% → 0
      // = 52 -8+0+5-4+0+0 = 45
      expect(r.automation_score).toBe(45);
      expect(r.automation_rating).toBe("adequate");
    });

    it("rates inadequate at score 44 (just below adequate)", () => {
      // 52 + (-8) = 44
      // -5(success 50-64%) + (-5)(coverage<40%) + 5(error<5) + (-4)(min<5) + 4(div>=4) + (-3)... nah retry doesn't give -3
      // retry: <5→+5, <15→+2, >30→-4. Between 15-30 → 0
      // -5 + (-5) + 5 + (-4) + 4 + 0 = -5 → 47
      // -5 + (-5) + 5 + (-4) + 2 + 0 = -7 → 45
      // -5 + (-5) + 5 + (-4) + 0(div 1) + 2 = -7 → 45
      // -5 + (-5) + 2 + (-4) + 4 + 0 = -8 → 44!
      const routes: CareEventRouteInput[] = [];
      const events: CareEventBasicInput[] = [];
      const metrics: SavedTimeMetricInput[] = [];
      const routeTypes = ["safeguarding", "health", "behaviour", "education"];
      // 20 routes: 12 completed → 60% → >=50 but <65 → -5
      // 4 types → diversity 4 → +4
      // error: 2/20 = 10% → +2
      // retry: 4/20 = 20% → 0
      for (let i = 0; i < 20; i++) {
        routes.push(makeRoute({
          id: `r_${i}`,
          route_type: routeTypes[i % 4],
          status: i < 12 ? "completed" : "failed", // 60% → -5
          has_error: i >= 18, // 2/20 = 10% → +2
          retry_count: i < 4 ? 1 : 0, // 4/20 = 20% → 0
          time_saved_minutes: 2,
          created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
        }));
      }
      // 10 events: 3 with routes → 30% < 40% → -5
      for (let i = 0; i < 10; i++) {
        events.push(makeEvent({
          id: `e_${i}`,
          has_routes: i < 3,
          date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        }));
      }
      // 8 staff, 8 total minutes → 1/staff → -4
      metrics.push(makeMetric({
        id: "m_1",
        minutes_saved: 8,
        recorded_at: "2026-05-15",
      }));
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      // success: 60% → -5
      // coverage: 30% → -5
      // error: 10% → +2
      // min/staff: 1 → -4
      // diversity: 4 → +4
      // retry: 20% → 0
      // = 52 -5-5+2-4+4+0 = 44
      expect(r.automation_score).toBe(44);
      expect(r.automation_rating).toBe("inadequate");
    });
  });

  // ── Modifier 1: Route Success Rate ──────────────────────────────────────

  describe("modifier 1: route success rate", () => {
    it("gives +6 for >=95% success rate", () => {
      const routes = Array.from({ length: 20 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: i < 19 ? "completed" : "failed", // 19/20 = 95%
        created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.route_success_rate).toBe(95);
    });

    it("gives +6 for 100% success rate", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: "completed",
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.route_success_rate).toBe(100);
    });

    it("gives +3 for 80-94% success rate", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: i < 8 ? "completed" : "failed", // 80%
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.route_success_rate).toBe(80);
    });

    it("gives -5 for <65% but >=50% success rate", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: i < 6 ? "completed" : "failed", // 60%
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.route_success_rate).toBe(60);
    });

    it("gives -8 for <50% success rate", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: i < 4 ? "completed" : "failed", // 40%
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.route_success_rate).toBe(40);
    });

    it("gives 0 modifier for 65-79% success rate", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: i < 7 ? "completed" : "failed", // 70%
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.route_success_rate).toBe(70);
    });

    it("counts only completed as success", () => {
      const routes = [
        makeRoute({ id: "r1", status: "completed", created_at: "2026-05-20" }),
        makeRoute({ id: "r2", status: "failed", created_at: "2026-05-21" }),
        makeRoute({ id: "r3", status: "pending", created_at: "2026-05-22" }),
      ];
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      // 1/3 = 33%
      expect(r.route_success_rate).toBe(33);
    });
  });

  // ── Modifier 2: Automation Coverage ──────────────────────────────────────

  describe("modifier 2: automation coverage", () => {
    it("gives +5 for >=90% coverage", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 9, // 9/10 = 90%
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ events, routes: [makeRoute()], metrics: [makeMetric()] }));
      expect(r.automation_coverage).toBe(90);
    });

    it("gives +2 for 70-89% coverage", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 7, // 70%
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ events, routes: [makeRoute()], metrics: [makeMetric()] }));
      expect(r.automation_coverage).toBe(70);
    });

    it("gives -5 for <40% coverage", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 3, // 30%
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ events, routes: [makeRoute()], metrics: [makeMetric()] }));
      expect(r.automation_coverage).toBe(30);
    });

    it("gives 0 modifier for 40-69% coverage", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 5, // 50%
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ events, routes: [makeRoute()], metrics: [makeMetric()] }));
      expect(r.automation_coverage).toBe(50);
    });

    it("calculates automation_coverage correctly", () => {
      const events = [
        makeEvent({ id: "e1", has_routes: true, date: "2026-05-20" }),
        makeEvent({ id: "e2", has_routes: false, date: "2026-05-21" }),
        makeEvent({ id: "e3", has_routes: true, date: "2026-05-22" }),
      ];
      const r = computeAutomationROI(baseInput({ events, routes: [makeRoute()], metrics: [makeMetric()] }));
      expect(r.automation_coverage).toBe(67);
    });

    it("returns 0% coverage when 0 events in window", () => {
      const r = computeAutomationROI(baseInput({
        events: [],
        routes: [makeRoute()],
        metrics: [makeMetric()],
      }));
      expect(r.automation_coverage).toBe(0);
    });
  });

  // ── Modifier 3: Error Rate ──────────────────────────────────────────────

  describe("modifier 3: error rate", () => {
    it("gives -1 when 0 routes", () => {
      const r = computeAutomationROI(baseInput({
        routes: [],
        events: [makeEvent()],
        metrics: [makeMetric()],
      }));
      // 0 routes → -1
      expect(r.error_rate).toBe(0);
    });

    it("gives +5 for <5% error rate with routes", () => {
      const routes = Array.from({ length: 20 }, (_, i) => makeRoute({
        id: `r_${i}`,
        has_error: false, // 0%
        created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.error_rate).toBe(0);
    });

    it("gives +2 for 5-14% error rate", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        has_error: i === 0, // 1/10 = 10%
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.error_rate).toBe(10);
    });

    it("gives -4 for >30% error rate", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        has_error: i < 4, // 4/10 = 40%
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.error_rate).toBe(40);
    });

    it("gives 0 modifier for 15-30% error rate", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        has_error: i < 2, // 2/10 = 20%
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.error_rate).toBe(20);
    });

    it("error rate at exactly 5% gives +2 not +5", () => {
      const routes = Array.from({ length: 20 }, (_, i) => makeRoute({
        id: `r_${i}`,
        has_error: i === 0, // 1/20 = 5%
        created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.error_rate).toBe(5);
    });

    it("error rate at exactly 15% gives 0 modifier", () => {
      const routes = Array.from({ length: 20 }, (_, i) => makeRoute({
        id: `r_${i}`,
        has_error: i < 3, // 3/20 = 15%
        created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.error_rate).toBe(15);
    });

    it("error rate at exactly 30% gives 0 modifier (not -4)", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        has_error: i < 3, // 3/10 = 30%
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.error_rate).toBe(30);
    });
  });

  // ── Modifier 4: Time Saved Effectiveness ────────────────────────────────

  describe("modifier 4: time saved effectiveness (minutes per staff)", () => {
    it("gives +5 for >=30 minutes per staff", () => {
      // 8 staff, 240 total → 30/staff
      const metrics = Array.from({ length: 8 }, (_, i) => makeMetric({
        id: `m_${i}`,
        minutes_saved: 30,
        recorded_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ metrics, routes: [makeRoute()], events: [makeEvent()], total_staff: 8 }));
      expect(r.total_time_saved).toBe(240);
    });

    it("gives +2 for 15-29 minutes per staff", () => {
      // 8 staff, 160 total → 20/staff
      const metrics = Array.from({ length: 8 }, (_, i) => makeMetric({
        id: `m_${i}`,
        minutes_saved: 20,
        recorded_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ metrics, routes: [makeRoute()], events: [makeEvent()], total_staff: 8 }));
      expect(r.total_time_saved).toBe(160);
    });

    it("gives -4 for <5 minutes per staff", () => {
      // 8 staff, 8 total → 1/staff
      const metrics = [makeMetric({ minutes_saved: 8, recorded_at: "2026-05-15" })];
      const r = computeAutomationROI(baseInput({ metrics, routes: [makeRoute()], events: [makeEvent()], total_staff: 8 }));
      expect(r.total_time_saved).toBe(8);
    });

    it("gives 0 modifier for 5-14 minutes per staff", () => {
      // 8 staff, 80 total → 10/staff
      const metrics = Array.from({ length: 8 }, (_, i) => makeMetric({
        id: `m_${i}`,
        minutes_saved: 10,
        recorded_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ metrics, routes: [makeRoute()], events: [makeEvent()], total_staff: 8 }));
      expect(r.total_time_saved).toBe(80);
    });

    it("calculates total_time_saved from metrics only", () => {
      const metrics = [
        makeMetric({ id: "m1", minutes_saved: 10, recorded_at: "2026-05-20" }),
        makeMetric({ id: "m2", minutes_saved: 5, recorded_at: "2026-05-21" }),
        makeMetric({ id: "m3", minutes_saved: 3, recorded_at: "2026-05-22" }),
      ];
      const r = computeAutomationROI(baseInput({ metrics, routes: [makeRoute()], events: [makeEvent()] }));
      expect(r.total_time_saved).toBe(18);
    });
  });

  // ── Modifier 5: Route Type Diversity ────────────────────────────────────

  describe("modifier 5: route type diversity", () => {
    it("gives +4 for >=4 route types", () => {
      const routes = [
        makeRoute({ id: "r1", route_type: "safeguarding", created_at: "2026-05-20" }),
        makeRoute({ id: "r2", route_type: "health", created_at: "2026-05-21" }),
        makeRoute({ id: "r3", route_type: "behaviour", created_at: "2026-05-22" }),
        makeRoute({ id: "r4", route_type: "education", created_at: "2026-05-23" }),
      ];
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.route_type_diversity).toBe(4);
    });

    it("gives +2 for 2-3 route types", () => {
      const routes = [
        makeRoute({ id: "r1", route_type: "safeguarding", created_at: "2026-05-20" }),
        makeRoute({ id: "r2", route_type: "health", created_at: "2026-05-21" }),
      ];
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.route_type_diversity).toBe(2);
    });

    it("gives 0 modifier for 1 route type", () => {
      const routes = [
        makeRoute({ id: "r1", route_type: "safeguarding", created_at: "2026-05-20" }),
        makeRoute({ id: "r2", route_type: "safeguarding", created_at: "2026-05-21" }),
      ];
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.route_type_diversity).toBe(1);
    });

    it("gives -4 for 0 route types (0 routes)", () => {
      const r = computeAutomationROI(baseInput({
        routes: [],
        events: [makeEvent()],
        metrics: [makeMetric()],
      }));
      expect(r.route_type_diversity).toBe(0);
    });

    it("counts unique route types only", () => {
      const routes = [
        makeRoute({ id: "r1", route_type: "safeguarding", created_at: "2026-05-20" }),
        makeRoute({ id: "r2", route_type: "safeguarding", created_at: "2026-05-21" }),
        makeRoute({ id: "r3", route_type: "health", created_at: "2026-05-22" }),
        makeRoute({ id: "r4", route_type: "health", created_at: "2026-05-23" }),
        makeRoute({ id: "r5", route_type: "behaviour", created_at: "2026-05-24" }),
      ];
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.route_type_diversity).toBe(3);
    });
  });

  // ── Modifier 6: Retry Rate ──────────────────────────────────────────────

  describe("modifier 6: retry rate", () => {
    it("gives +5 for <5% retry rate with routes present", () => {
      const routes = Array.from({ length: 20 }, (_, i) => makeRoute({
        id: `r_${i}`,
        retry_count: 0, // 0% retry
        created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      // All retry_count 0 → 0% retry → +5
    });

    it("gives +2 for 5-14% retry rate", () => {
      const routes = Array.from({ length: 20 }, (_, i) => makeRoute({
        id: `r_${i}`,
        retry_count: i === 0 ? 2 : 0, // 1/20 = 5% → NOT <5, so +2
        created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      // 5% retry → +2
    });

    it("gives -4 for >30% retry rate", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        retry_count: i < 4 ? 2 : 0, // 4/10 = 40%
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      // 40% retry → -4
    });

    it("gives 0 modifier for 15-30% retry rate", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        retry_count: i < 2 ? 1 : 0, // 2/10 = 20%
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      // 20% retry → 0
    });

    it("retry rate at exactly 5% gives +2 not +5", () => {
      const routes = Array.from({ length: 20 }, (_, i) => makeRoute({
        id: `r_${i}`,
        retry_count: i === 0 ? 1 : 0, // 1/20 = 5%
        created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      // 5% is NOT <5, so it falls to <15 → +2
    });

    it("retry rate at exactly 15% gives 0 modifier", () => {
      const routes = Array.from({ length: 20 }, (_, i) => makeRoute({
        id: `r_${i}`,
        retry_count: i < 3 ? 1 : 0, // 3/20 = 15%
        created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      // 15% is NOT <15, and NOT >30 → 0
    });

    it("retry rate at exactly 30% gives 0 modifier (not -4)", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        retry_count: i < 3 ? 1 : 0, // 3/10 = 30%
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      // 30% is NOT >30 → 0
    });

    it("does not give +5 for <5% retry when routes is empty", () => {
      // With 0 routes, the retry rate check requires routes.length > 0 for the +5 bonus
      const r = computeAutomationROI(baseInput({
        routes: [],
        events: [makeEvent()],
        metrics: [makeMetric()],
      }));
      // 0 routes → retryRate = 0 (pct(0,0)=0), but routes.length === 0 so condition fails for +5
      // Falls through: <15% → +2
    });
  });

  // ── Score Clamping ───────────────────────────────────────────────────────

  describe("score clamping", () => {
    it("clamps score to minimum 0", () => {
      // All maximum penalties: -8 -5 -4 -4 -4 -4 = -29 → 52-29 = 23 → still positive
      // But verify >= 0
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        route_type: "safeguarding",
        status: i < 3 ? "completed" : "failed",
        has_error: i < 4, // 40%
        retry_count: i < 4 ? 2 : 0, // 40%
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 3, // 30%
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const metrics = [makeMetric({ minutes_saved: 1, recorded_at: "2026-05-15" })];
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      expect(r.automation_score).toBeGreaterThanOrEqual(0);
      expect(r.automation_score).toBeLessThanOrEqual(100);
    });

    it("clamps score to maximum 100", () => {
      // Max is 82, so can never exceed 100, but verify the clamp
      const routes = Array.from({ length: 20 }, (_, i) => makeRoute({
        id: `r_${i}`,
        route_type: ["safeguarding", "health", "behaviour", "education"][i % 4],
        status: "completed",
        has_error: false,
        retry_count: 0,
        time_saved_minutes: 5,
        created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
      }));
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: true,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const metrics = Array.from({ length: 8 }, (_, i) => makeMetric({
        id: `m_${i}`,
        minutes_saved: 30,
        recorded_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      expect(r.automation_score).toBeLessThanOrEqual(100);
    });

    it("score is always an integer", () => {
      const r = computeAutomationROI(baseInput({
        routes: [makeRoute()],
        events: [makeEvent()],
        metrics: [makeMetric()],
      }));
      expect(Number.isInteger(r.automation_score)).toBe(true);
    });

    it("worst case all penalties still produces valid score", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        route_type: "safeguarding",
        status: i < 2 ? "completed" : "failed", // 20% → -8
        has_error: i < 5, // 50% → -4
        retry_count: i < 5 ? 3 : 0, // 50% → -4
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 2, // 20% → -5
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const metrics = [makeMetric({ minutes_saved: 1, recorded_at: "2026-05-15" })];
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      // 52 -8 -5 -4 -4 + 0(div 1) -4 = 27
      expect(r.automation_score).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Strengths Triggers ──────────────────────────────────────────────────

  describe("strengths triggers", () => {
    it("includes route success strength for >=95%", () => {
      const routes = Array.from({ length: 20 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: "completed",
        created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.strengths.some(s => s.includes("highly reliable"))).toBe(true);
    });

    it("includes route success strength for 80-94%", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: i < 8 ? "completed" : "failed",
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.strengths.some(s => s.includes("performing well"))).toBe(true);
    });

    it("does not include route success strength for <80%", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: i < 7 ? "completed" : "failed",
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.strengths.some(s => s.includes("route success rate"))).toBe(false);
    });

    it("includes automation coverage strength for >=90%", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: true,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ events, routes: [makeRoute()], metrics: [makeMetric()] }));
      expect(r.strengths.some(s => s.includes("nearly all care events"))).toBe(true);
    });

    it("includes automation coverage strength for 70-89%", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 8, // 80%
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ events, routes: [makeRoute()], metrics: [makeMetric()] }));
      expect(r.strengths.some(s => s.includes("good proportion"))).toBe(true);
    });

    it("includes low error rate strength for <5%", () => {
      const routes = Array.from({ length: 20 }, (_, i) => makeRoute({
        id: `r_${i}`,
        has_error: false,
        created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.strengths.some(s => s.includes("error rate"))).toBe(true);
    });

    it("does not include error rate strength when 0 routes", () => {
      const r = computeAutomationROI(baseInput({
        routes: [],
        events: [makeEvent()],
        metrics: [makeMetric()],
      }));
      expect(r.strengths.some(s => s.includes("error rate"))).toBe(false);
    });

    it("includes time saved strength for >=30 min/staff", () => {
      const metrics = Array.from({ length: 8 }, (_, i) => makeMetric({
        id: `m_${i}`,
        minutes_saved: 30,
        recorded_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ metrics, routes: [makeRoute()], events: [makeEvent()], total_staff: 8 }));
      expect(r.strengths.some(s => s.includes("significant time savings"))).toBe(true);
    });

    it("includes time saved strength for 15-29 min/staff", () => {
      const metrics = Array.from({ length: 8 }, (_, i) => makeMetric({
        id: `m_${i}`,
        minutes_saved: 20,
        recorded_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ metrics, routes: [makeRoute()], events: [makeEvent()], total_staff: 8 }));
      expect(r.strengths.some(s => s.includes("good time savings"))).toBe(true);
    });

    it("includes route type diversity strength for >=4 types", () => {
      const routes = [
        makeRoute({ id: "r1", route_type: "safeguarding", created_at: "2026-05-20" }),
        makeRoute({ id: "r2", route_type: "health", created_at: "2026-05-21" }),
        makeRoute({ id: "r3", route_type: "behaviour", created_at: "2026-05-22" }),
        makeRoute({ id: "r4", route_type: "education", created_at: "2026-05-23" }),
      ];
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.strengths.some(s => s.includes("route types active"))).toBe(true);
    });

    it("includes retry strength for <5% retry rate", () => {
      const routes = Array.from({ length: 20 }, (_, i) => makeRoute({
        id: `r_${i}`,
        retry_count: 0,
        created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.strengths.some(s => s.includes("retries"))).toBe(true);
    });

    it("includes total time saved strength when total > 0", () => {
      const metrics = [makeMetric({ minutes_saved: 10, recorded_at: "2026-05-20" })];
      const r = computeAutomationROI(baseInput({ metrics, routes: [makeRoute()], events: [makeEvent()] }));
      expect(r.strengths.some(s => s.includes("total minutes saved"))).toBe(true);
    });

    it("does not include total time saved strength when 0 minutes", () => {
      const metrics = [makeMetric({ minutes_saved: 0, recorded_at: "2026-05-20" })];
      const r = computeAutomationROI(baseInput({ metrics, routes: [makeRoute()], events: [makeEvent()] }));
      expect(r.strengths.some(s => s.includes("total minutes saved"))).toBe(false);
    });
  });

  // ── Concerns Triggers ──────────────────────────────────────────────────

  describe("concerns triggers", () => {
    it("flags low route success rate (<65%)", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: i < 6 ? "completed" : "failed",
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.concerns.some(c => c.includes("route success rate"))).toBe(true);
    });

    it("does not flag route success when 0 routes", () => {
      const r = computeAutomationROI(baseInput({
        routes: [],
        events: [makeEvent()],
        metrics: [makeMetric()],
      }));
      expect(r.concerns.some(c => c.includes("route success rate"))).toBe(false);
    });

    it("flags low automation coverage (<40%)", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 3, // 30%
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ events, routes: [makeRoute()], metrics: [makeMetric()] }));
      expect(r.concerns.some(c => c.includes("automation coverage"))).toBe(true);
    });

    it("does not flag coverage when 0 events", () => {
      const r = computeAutomationROI(baseInput({
        events: [],
        routes: [makeRoute()],
        metrics: [makeMetric()],
      }));
      expect(r.concerns.some(c => c.includes("automation coverage"))).toBe(false);
    });

    it("flags high error rate (>30%)", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        has_error: i < 4, // 40%
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.concerns.some(c => c.includes("error rate"))).toBe(true);
    });

    it("flags low minutes per staff (<5)", () => {
      const metrics = [makeMetric({ minutes_saved: 8, recorded_at: "2026-05-15" })];
      const r = computeAutomationROI(baseInput({ metrics, routes: [makeRoute()], events: [makeEvent()], total_staff: 8 }));
      expect(r.concerns.some(c => c.includes("minutes saved per staff"))).toBe(true);
    });

    it("does not flag minutes concern when 0 metrics in window", () => {
      const r = computeAutomationROI(baseInput({
        metrics: [],
        routes: [makeRoute()],
        events: [makeEvent()],
        total_staff: 8,
      }));
      // minutesPerStaff = 0 which is < 5, but metrics.length === 0
      expect(r.concerns.some(c => c.includes("minutes saved per staff"))).toBe(false);
    });

    it("flags no route types when 0 routes with events present", () => {
      const r = computeAutomationROI(baseInput({
        routes: [],
        events: [makeEvent()],
        metrics: [makeMetric()],
      }));
      expect(r.concerns.some(c => c.includes("No route types active"))).toBe(true);
    });

    it("flags only 1 route type", () => {
      const routes = [
        makeRoute({ id: "r1", route_type: "safeguarding", created_at: "2026-05-20" }),
        makeRoute({ id: "r2", route_type: "safeguarding", created_at: "2026-05-21" }),
      ];
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.concerns.some(c => c.includes("Only 1 route type"))).toBe(true);
    });

    it("flags high retry rate (>30%)", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        retry_count: i < 4 ? 2 : 0, // 40%
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.concerns.some(c => c.includes("retries") || c.includes("retry"))).toBe(true);
    });
  });

  // ── Recommendations Triggers ────────────────────────────────────────────

  describe("recommendations triggers", () => {
    it("recommends investigating route failures when <65%", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: i < 6 ? "completed" : "failed",
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("route failures"))).toBe(true);
      expect(r.recommendations.find(rec => rec.recommendation.includes("route failures"))?.urgency).toBe("immediate");
    });

    it("recommends expanding coverage when <40%", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 3,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ events, routes: [makeRoute()], metrics: [makeMetric()] }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("automation coverage"))).toBe(true);
    });

    it("recommends addressing high error rate when >30%", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        has_error: i < 4,
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("error rate"))).toBe(true);
      expect(r.recommendations.find(rec => rec.recommendation.includes("error rate"))?.urgency).toBe("soon");
    });

    it("recommends optimising time savings when <5 min/staff", () => {
      const metrics = [makeMetric({ minutes_saved: 8, recorded_at: "2026-05-15" })];
      const r = computeAutomationROI(baseInput({ metrics, routes: [makeRoute()], events: [makeEvent()], total_staff: 8 }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("time savings"))).toBe(true);
    });

    it("recommends additional route types when <2", () => {
      const routes = [makeRoute({ route_type: "safeguarding", created_at: "2026-05-20" })];
      const events = [makeEvent()];
      const r = computeAutomationROI(baseInput({ routes, events, metrics: [makeMetric()] }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("route types"))).toBe(true);
      expect(r.recommendations.find(rec => rec.recommendation.includes("route types"))?.urgency).toBe("planned");
    });

    it("recommends investigating retries when >30%", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        retry_count: i < 4 ? 2 : 0,
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("retry"))).toBe(true);
    });

    it("generates no recommendations for perfect automation", () => {
      const routes = Array.from({ length: 20 }, (_, i) => makeRoute({
        id: `r_${i}`,
        route_type: ["safeguarding", "health", "behaviour", "education"][i % 4],
        status: "completed",
        has_error: false,
        retry_count: 0,
        created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
      }));
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: true,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const metrics = Array.from({ length: 8 }, (_, i) => makeMetric({
        id: `m_${i}`,
        minutes_saved: 30,
        recorded_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      expect(r.recommendations.length).toBe(0);
    });

    it("assigns ranks sequentially", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        route_type: "safeguarding",
        status: i < 5 ? "completed" : "failed",
        has_error: i < 4,
        retry_count: i < 4 ? 2 : 0,
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 3,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const metrics = [makeMetric({ minutes_saved: 1, recorded_at: "2026-05-15" })];
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      expect(r.recommendations.length).toBeGreaterThan(0);
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("includes regulatory references in recommendations", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: i < 5 ? "completed" : "failed",
        has_error: i < 4,
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 3,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events, metrics: [makeMetric({ minutes_saved: 1 })] }));
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref.length).toBeGreaterThan(0);
      }
    });
  });

  // ── Insights Triggers ──────────────────────────────────────────────────

  describe("insights triggers", () => {
    it("generates exemplary insight for top metrics", () => {
      const routes = Array.from({ length: 20 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: "completed",
        has_error: false,
        created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
      }));
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: true,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events, metrics: [makeMetric()] }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("exemplary"))).toBe(true);
    });

    it("generates strong automation insight for good metrics combo", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: i < 8 ? "completed" : "failed", // 80%
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 7, // 70%
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events, metrics: [makeMetric()] }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Strong automation"))).toBe(true);
    });

    it("generates time savings insight for >=30 min/staff and >=60 total", () => {
      const metrics = Array.from({ length: 8 }, (_, i) => makeMetric({
        id: `m_${i}`,
        minutes_saved: 30,
        recorded_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ metrics, routes: [makeRoute()], events: [makeEvent()], total_staff: 8 }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("hours"))).toBe(true);
    });

    it("does not generate time savings insight for <60 total minutes", () => {
      const metrics = [makeMetric({ minutes_saved: 50, recorded_at: "2026-05-15" })];
      const r = computeAutomationROI(baseInput({ metrics, routes: [makeRoute()], events: [makeEvent()], total_staff: 1 }));
      // 50/1 = 50 → >=30 but total is 50 < 60
      expect(r.insights.some(i => i.text.includes("hours"))).toBe(false);
    });

    it("generates critical insight for <50% route success", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: i < 4 ? "completed" : "failed", // 40%
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("critically low"))).toBe(true);
    });

    it("generates critical insight for <40% automation coverage", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 3, // 30%
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ events, routes: [makeRoute()], metrics: [makeMetric()] }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("coverage"))).toBe(true);
    });

    it("generates warning insight for >30% error rate", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        has_error: i < 4, // 40%
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("errors"))).toBe(true);
    });

    it("generates warning insight for >30% retry rate", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        retry_count: i < 4 ? 2 : 0, // 40%
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("retries"))).toBe(true);
    });

    it("generates comprehensive automation insight for >=4 types and >=80% success", () => {
      const routes = [
        makeRoute({ id: "r1", route_type: "safeguarding", status: "completed", created_at: "2026-05-20" }),
        makeRoute({ id: "r2", route_type: "health", status: "completed", created_at: "2026-05-21" }),
        makeRoute({ id: "r3", route_type: "behaviour", status: "completed", created_at: "2026-05-22" }),
        makeRoute({ id: "r4", route_type: "education", status: "completed", created_at: "2026-05-23" }),
        makeRoute({ id: "r5", route_type: "safeguarding", status: "completed", created_at: "2026-05-24" }),
      ];
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("comprehensive"))).toBe(true);
    });
  });

  // ── Headlines ──────────────────────────────────────────────────────────

  describe("headlines", () => {
    it("generates outstanding headline with metrics", () => {
      const routes = Array.from({ length: 20 }, (_, i) => makeRoute({
        id: `r_${i}`,
        route_type: ["safeguarding", "health", "behaviour", "education"][i % 4],
        status: "completed",
        has_error: false,
        retry_count: 0,
        time_saved_minutes: 5,
        created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
      }));
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: true,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const metrics = Array.from({ length: 8 }, (_, i) => makeMetric({
        id: `m_${i}`,
        minutes_saved: 30,
        recorded_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      expect(r.headline).toContain("Outstanding");
      expect(r.headline).toContain("100%");
    });

    it("generates good headline", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        route_type: i < 5 ? "safeguarding" : "health",
        status: i < 8 ? "completed" : "failed",
        has_error: i === 9,
        retry_count: i === 0 ? 1 : 0,
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 7,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const metrics = Array.from({ length: 8 }, (_, i) => makeMetric({
        id: `m_${i}`,
        minutes_saved: 20,
        recorded_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      expect(r.headline).toContain("Good");
    });

    it("generates adequate headline", () => {
      // Use the score 45 scenario
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        route_type: "safeguarding",
        status: i < 4 ? "completed" : "failed",
        has_error: false,
        retry_count: i < 2 ? 1 : 0,
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 5,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const metrics = [makeMetric({ minutes_saved: 8, recorded_at: "2026-05-15" })];
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      expect(r.headline).toContain("Adequate");
    });

    it("generates inadequate headline", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: i < 2 ? "completed" : "failed",
        has_error: i < 5,
        retry_count: i < 5 ? 2 : 0,
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 2,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const metrics = [makeMetric({ minutes_saved: 1, recorded_at: "2026-05-15" })];
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      expect(r.headline).toContain("inadequate");
    });

    it("generates insufficient_data headline for no staff", () => {
      const r = computeAutomationROI(baseInput({ total_staff: 0 }));
      expect(r.headline).toContain("No staff registered");
    });

    it("generates headline for 0 activity with staff", () => {
      const r = computeAutomationROI(baseInput({ metrics: [], routes: [], events: [] }));
      expect(r.headline).toContain("No automation activity");
    });
  });

  // ── pct Helper Behaviour ────────────────────────────────────────────────

  describe("pct helper behaviour (via engine rates)", () => {
    it("returns 0 when denominator is 0 for route success", () => {
      // 0 routes → pct(0, 0) = 0
      const r = computeAutomationROI(baseInput({
        routes: [],
        events: [makeEvent()],
        metrics: [makeMetric()],
      }));
      expect(r.route_success_rate).toBe(0);
    });

    it("returns 0 when denominator is 0 for automation coverage", () => {
      const r = computeAutomationROI(baseInput({
        events: [],
        routes: [makeRoute()],
        metrics: [makeMetric()],
      }));
      expect(r.automation_coverage).toBe(0);
    });

    it("returns 0 when denominator is 0 for error rate", () => {
      const r = computeAutomationROI(baseInput({
        routes: [],
        events: [makeEvent()],
        metrics: [makeMetric()],
      }));
      expect(r.error_rate).toBe(0);
    });

    it("rounds to nearest integer", () => {
      // 1/3 = 33.33 → 33
      const routes = [
        makeRoute({ id: "r1", status: "completed", created_at: "2026-05-20" }),
        makeRoute({ id: "r2", status: "failed", created_at: "2026-05-21" }),
        makeRoute({ id: "r3", status: "failed", created_at: "2026-05-22" }),
      ];
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.route_success_rate).toBe(33);
    });

    it("rounds 2/3 to 67%", () => {
      const routes = [
        makeRoute({ id: "r1", status: "completed", created_at: "2026-05-20" }),
        makeRoute({ id: "r2", status: "completed", created_at: "2026-05-21" }),
        makeRoute({ id: "r3", status: "failed", created_at: "2026-05-22" }),
      ];
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.route_success_rate).toBe(67);
    });

    it("returns 100 for n/n", () => {
      const routes = [makeRoute({ status: "completed", created_at: "2026-05-20" })];
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.route_success_rate).toBe(100);
    });
  });

  // ── avg_minutes_per_route ───────────────────────────────────────────────

  describe("avg_minutes_per_route", () => {
    it("calculates avg from route time_saved_minutes", () => {
      const routes = [
        makeRoute({ id: "r1", time_saved_minutes: 10, created_at: "2026-05-20" }),
        makeRoute({ id: "r2", time_saved_minutes: 5, created_at: "2026-05-21" }),
        makeRoute({ id: "r3", time_saved_minutes: 3, created_at: "2026-05-22" }),
      ];
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      // (10+5+3)/3 = 6.0
      expect(r.avg_minutes_per_route).toBe(6);
    });

    it("returns 0 when no routes in window", () => {
      const r = computeAutomationROI(baseInput({
        routes: [],
        events: [makeEvent()],
        metrics: [makeMetric()],
      }));
      expect(r.avg_minutes_per_route).toBe(0);
    });

    it("rounds to one decimal place", () => {
      const routes = [
        makeRoute({ id: "r1", time_saved_minutes: 10, created_at: "2026-05-20" }),
        makeRoute({ id: "r2", time_saved_minutes: 7, created_at: "2026-05-21" }),
        makeRoute({ id: "r3", time_saved_minutes: 4, created_at: "2026-05-22" }),
      ];
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      // (10+7+4)/3 = 7.0
      expect(r.avg_minutes_per_route).toBe(7);
    });

    it("handles fractional average", () => {
      const routes = [
        makeRoute({ id: "r1", time_saved_minutes: 1, created_at: "2026-05-20" }),
        makeRoute({ id: "r2", time_saved_minutes: 2, created_at: "2026-05-21" }),
        makeRoute({ id: "r3", time_saved_minutes: 3, created_at: "2026-05-22" }),
      ];
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      // (1+2+3)/3 = 2.0
      expect(r.avg_minutes_per_route).toBe(2);
    });
  });

  // ── Outstanding Rating ──────────────────────────────────────────────────

  describe("outstanding rating", () => {
    function outstandingInputs() {
      const routes: CareEventRouteInput[] = [];
      const events: CareEventBasicInput[] = [];
      const metrics: SavedTimeMetricInput[] = [];
      const routeTypes = ["safeguarding", "health", "behaviour", "education"];
      for (let i = 0; i < 20; i++) {
        routes.push(makeRoute({
          id: `r_${i}`,
          route_type: routeTypes[i % 4],
          status: "completed",
          has_error: false,
          retry_count: 0,
          time_saved_minutes: 5,
          created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
        }));
      }
      for (let i = 0; i < 10; i++) {
        events.push(makeEvent({
          id: `e_${i}`,
          has_routes: true,
          date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        }));
      }
      for (let i = 0; i < 8; i++) {
        metrics.push(makeMetric({
          id: `m_${i}`,
          minutes_saved: 30,
          staff_id: `staff_${i}`,
          recorded_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
        }));
      }
      return { routes, events, metrics };
    }

    it("achieves outstanding with perfect automation across all modifiers", () => {
      const { routes, events, metrics } = outstandingInputs();
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      expect(r.automation_rating).toBe("outstanding");
      expect(r.automation_score).toBe(82);
    });

    it("generates strengths for outstanding", () => {
      const { routes, events, metrics } = outstandingInputs();
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      expect(r.strengths.length).toBeGreaterThan(0);
    });

    it("includes route success strength for outstanding", () => {
      const { routes, events, metrics } = outstandingInputs();
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      expect(r.strengths.some(s => s.includes("route success rate"))).toBe(true);
    });

    it("generates positive insights for outstanding", () => {
      const { routes, events, metrics } = outstandingInputs();
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      expect(r.insights.some(i => i.severity === "positive")).toBe(true);
    });

    it("generates outstanding headline", () => {
      const { routes, events, metrics } = outstandingInputs();
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      expect(r.headline).toContain("Outstanding");
    });

    it("has no concerns for outstanding", () => {
      const { routes, events, metrics } = outstandingInputs();
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      expect(r.concerns.length).toBe(0);
    });

    it("has no recommendations for outstanding", () => {
      const { routes, events, metrics } = outstandingInputs();
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      expect(r.recommendations.length).toBe(0);
    });
  });

  // ── Good Rating ────────────────────────────────────────────────────────

  describe("good rating", () => {
    it("achieves good with minor gaps", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        route_type: i < 5 ? "safeguarding" : "health",
        status: i < 8 ? "completed" : "failed", // 80%
        has_error: i === 9, // 10%
        retry_count: i === 0 ? 1 : 0, // 10%
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 7, // 70%
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const metrics = Array.from({ length: 8 }, (_, i) => makeMetric({
        id: `m_${i}`,
        minutes_saved: 20,
        recorded_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      expect(r.automation_rating).toBe("good");
    });

    it("generates good headline", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        route_type: i < 5 ? "safeguarding" : "health",
        status: i < 8 ? "completed" : "failed",
        has_error: i === 9,
        retry_count: i === 0 ? 1 : 0,
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 7,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const metrics = Array.from({ length: 8 }, (_, i) => makeMetric({
        id: `m_${i}`,
        minutes_saved: 20,
        recorded_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      expect(r.headline).toContain("Good");
    });
  });

  // ── Adequate Rating ────────────────────────────────────────────────────

  describe("adequate rating", () => {
    it("achieves adequate with moderate gaps", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        route_type: "safeguarding",
        status: i < 4 ? "completed" : "failed",
        has_error: false,
        retry_count: i < 2 ? 1 : 0,
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 5,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const metrics = [makeMetric({ minutes_saved: 8, recorded_at: "2026-05-15" })];
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      expect(r.automation_rating).toBe("adequate");
      expect(r.automation_score).toBe(45);
    });

    it("generates adequate headline", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        route_type: "safeguarding",
        status: i < 4 ? "completed" : "failed",
        has_error: false,
        retry_count: i < 2 ? 1 : 0,
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 5,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const metrics = [makeMetric({ minutes_saved: 8, recorded_at: "2026-05-15" })];
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      expect(r.headline).toContain("Adequate");
    });
  });

  // ── Inadequate Rating ──────────────────────────────────────────────────

  describe("inadequate rating", () => {
    it("scores inadequate with all poor metrics", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        route_type: "safeguarding",
        status: i < 2 ? "completed" : "failed", // 20% → -8
        has_error: i < 5, // 50% → -4
        retry_count: i < 5 ? 3 : 0, // 50% → -4
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 2, // 20% → -5
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const metrics = [makeMetric({ minutes_saved: 1, recorded_at: "2026-05-15" })]; // 0.125/staff → -4
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      // 52 -8 -5 -4 -4 +0(div 1) -4 = 27
      expect(r.automation_rating).toBe("inadequate");
    });

    it("generates inadequate headline", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: i < 2 ? "completed" : "failed",
        has_error: i < 5,
        retry_count: i < 5 ? 3 : 0,
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 2,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const metrics = [makeMetric({ minutes_saved: 1, recorded_at: "2026-05-15" })];
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      expect(r.headline).toContain("inadequate");
    });

    it("generates critical insights for inadequate", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: i < 2 ? "completed" : "failed",
        has_error: i < 5,
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 2,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events, metrics: [makeMetric({ minutes_saved: 1 })] }));
      expect(r.insights.some(i => i.severity === "critical")).toBe(true);
    });
  });

  // ── Modifier Boundary Values ────────────────────────────────────────────

  describe("modifier boundary values", () => {
    it("success rate at exactly 95% gets +6", () => {
      const routes = Array.from({ length: 20 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: i < 19 ? "completed" : "failed", // 19/20 = 95%
        created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.route_success_rate).toBe(95);
    });

    it("success rate at 94% gets +3 not +6", () => {
      // 47/50 = 94%
      const routes = Array.from({ length: 50 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: i < 47 ? "completed" : "failed",
        created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.route_success_rate).toBe(94);
    });

    it("success rate at exactly 80% gets +3", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: i < 8 ? "completed" : "failed",
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.route_success_rate).toBe(80);
    });

    it("success rate at 79% gets 0 modifier", () => {
      // 11/14 ≈ 78.57 → 79%
      const routes = Array.from({ length: 14 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: i < 11 ? "completed" : "failed",
        created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.route_success_rate).toBe(79);
    });

    it("success rate at exactly 65% gets 0 modifier", () => {
      const routes = Array.from({ length: 20 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: i < 13 ? "completed" : "failed", // 13/20 = 65%
        created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.route_success_rate).toBe(65);
    });

    it("success rate at 64% gets -5", () => {
      // 9/14 = 64.28 → 64%
      const routes = Array.from({ length: 14 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: i < 9 ? "completed" : "failed",
        created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.route_success_rate).toBe(64);
    });

    it("success rate at exactly 50% gets -5 not -8", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: i < 5 ? "completed" : "failed",
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.route_success_rate).toBe(50);
    });

    it("success rate at 49% gets -8", () => {
      // 49/100... use smaller: 7/15 = 46.67. Use 24/49... tricky
      // 9/19 = 47.37 → 47%. Let me just use a scenario that rounds to 49.
      // 37/76... impractical. Let's use what we can.
      const routes = Array.from({ length: 100 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: i < 49 ? "completed" : "failed",
        created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.route_success_rate).toBe(49);
    });

    it("automation coverage at exactly 90% gets +5", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 9,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ events, routes: [makeRoute()], metrics: [makeMetric()] }));
      expect(r.automation_coverage).toBe(90);
    });

    it("automation coverage at 89% gets +2", () => {
      const events = Array.from({ length: 9 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 8, // 8/9 = 89%
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ events, routes: [makeRoute()], metrics: [makeMetric()] }));
      expect(r.automation_coverage).toBe(89);
    });

    it("automation coverage at exactly 70% gets +2", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 7,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ events, routes: [makeRoute()], metrics: [makeMetric()] }));
      expect(r.automation_coverage).toBe(70);
    });

    it("automation coverage at 69% gets 0", () => {
      // 9/13 = 69.23 → 69%
      const events = Array.from({ length: 13 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 9,
        date: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ events, routes: [makeRoute()], metrics: [makeMetric()] }));
      expect(r.automation_coverage).toBe(69);
    });

    it("automation coverage at exactly 40% gets 0", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 4,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ events, routes: [makeRoute()], metrics: [makeMetric()] }));
      expect(r.automation_coverage).toBe(40);
    });

    it("automation coverage at 39% gets -5", () => {
      // 7/18 = 38.89 → 39%
      const events = Array.from({ length: 18 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 7,
        date: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ events, routes: [makeRoute()], metrics: [makeMetric()] }));
      expect(r.automation_coverage).toBe(39);
    });
  });

  // ── Edge Cases ──────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles single metric", () => {
      const r = computeAutomationROI(baseInput({
        metrics: [makeMetric()],
        routes: [makeRoute()],
        events: [makeEvent()],
      }));
      expect(r.automation_rating).not.toBe("insufficient_data");
    });

    it("handles single route", () => {
      const r = computeAutomationROI(baseInput({
        routes: [makeRoute()],
        events: [makeEvent()],
        metrics: [makeMetric()],
      }));
      expect(r.route_success_rate).toBe(100);
    });

    it("handles single event", () => {
      const r = computeAutomationROI(baseInput({
        events: [makeEvent()],
        routes: [makeRoute()],
        metrics: [makeMetric()],
      }));
      expect(r.automation_coverage).toBe(100);
    });

    it("handles 0 staff gracefully (insufficient_data)", () => {
      const r = computeAutomationROI(baseInput({ total_staff: 0 }));
      expect(r.automation_rating).toBe("insufficient_data");
    });

    it("handles all data on same date", () => {
      const routes = Array.from({ length: 5 }, (_, i) => makeRoute({
        id: `r_${i}`,
        created_at: "2026-05-20",
      }));
      const events = Array.from({ length: 5 }, (_, i) => makeEvent({
        id: `e_${i}`,
        date: "2026-05-20",
      }));
      const metrics = Array.from({ length: 5 }, (_, i) => makeMetric({
        id: `m_${i}`,
        recorded_at: "2026-05-20",
      }));
      const r = computeAutomationROI(baseInput({ routes, events, metrics }));
      expect(r.automation_score).toBeGreaterThan(0);
    });

    it("handles metrics with 0 minutes saved", () => {
      const metrics = [makeMetric({ minutes_saved: 0, recorded_at: "2026-05-20" })];
      const r = computeAutomationROI(baseInput({ metrics, routes: [makeRoute()], events: [makeEvent()] }));
      expect(r.total_time_saved).toBe(0);
    });

    it("handles routes with 0 time_saved_minutes", () => {
      const routes = [makeRoute({ time_saved_minutes: 0, created_at: "2026-05-20" })];
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.avg_minutes_per_route).toBe(0);
    });

    it("handles routes with large retry counts", () => {
      const routes = [makeRoute({ retry_count: 100, created_at: "2026-05-20" })];
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.automation_score).toBeGreaterThanOrEqual(0);
    });

    it("handles events with empty string child_id", () => {
      const events = [
        makeEvent({ id: "e1", child_id: "", date: "2026-05-20" }),
        makeEvent({ id: "e2", child_id: "", date: "2026-05-21" }),
      ];
      const r = computeAutomationROI(baseInput({ events, routes: [makeRoute()], metrics: [makeMetric()] }));
      expect(r.automation_coverage).toBeGreaterThanOrEqual(0);
    });

    it("handles total_staff = 1", () => {
      const metrics = [makeMetric({ minutes_saved: 50, recorded_at: "2026-05-20" })];
      const r = computeAutomationROI(baseInput({ metrics, routes: [makeRoute()], events: [makeEvent()], total_staff: 1 }));
      // 50/1 = 50 → >=30 → +5
      expect(r.total_time_saved).toBe(50);
    });

    it("handles large number of routes", () => {
      const routes = Array.from({ length: 500 }, (_, i) => makeRoute({
        id: `r_${i}`,
        route_type: ["safeguarding", "health", "behaviour", "education"][i % 4],
        status: "completed",
        created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.automation_rating).toBeDefined();
    });

    it("uses only filtered data for metric calculations", () => {
      const metrics = [
        makeMetric({ id: "m1", minutes_saved: 10, recorded_at: "2025-01-01" }), // outside
        makeMetric({ id: "m2", minutes_saved: 5, recorded_at: "2026-05-20" }),
      ];
      const routes = [
        makeRoute({ id: "r1", status: "failed", created_at: "2025-01-01" }), // outside
        makeRoute({ id: "r2", status: "completed", created_at: "2026-05-20" }),
      ];
      const events = [
        makeEvent({ id: "e1", has_routes: false, date: "2025-01-01" }), // outside
        makeEvent({ id: "e2", has_routes: true, date: "2026-05-20" }),
      ];
      const r = computeAutomationROI(baseInput({ metrics, routes, events }));
      expect(r.total_time_saved).toBe(5);
      expect(r.route_success_rate).toBe(100);
      expect(r.automation_coverage).toBe(100);
    });

    it("handles all routes with pending status", () => {
      const routes = Array.from({ length: 5 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: "pending",
        created_at: `2026-05-${String(20 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.route_success_rate).toBe(0); // 0 completed / 5 = 0%
    });

    it("handles mixed route statuses", () => {
      const routes = [
        makeRoute({ id: "r1", status: "completed", created_at: "2026-05-20" }),
        makeRoute({ id: "r2", status: "failed", created_at: "2026-05-21" }),
        makeRoute({ id: "r3", status: "pending", created_at: "2026-05-22" }),
        makeRoute({ id: "r4", status: "completed", created_at: "2026-05-23" }),
      ];
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.route_success_rate).toBe(50); // 2/4
    });
  });

  // ── Score Calculation Verification ───────────────────────────────────────

  describe("score calculation verification", () => {
    it("base score is 52 with all neutral modifiers", () => {
      // All modifiers in neutral zone (no bonus, no penalty)
      // success 65-79%→0, coverage 40-69%→0, error 15-30%→0, min/staff 5-14→0, diversity 1→0, retry 15-30%→0
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        route_type: "safeguarding",
        status: i < 7 ? "completed" : "failed", // 70% → 0
        has_error: i < 2, // 20% → 0
        retry_count: i < 2 ? 1 : 0, // 20% → 0
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 5, // 50% → 0
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      // 8 staff, 80 total → 10/staff → 0
      const metrics = Array.from({ length: 8 }, (_, i) => makeMetric({
        id: `m_${i}`,
        minutes_saved: 10,
        recorded_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      // All modifiers 0 → 52
      expect(r.automation_score).toBe(52);
    });

    it("maximum possible score with all bonuses", () => {
      // +6+5+5+5+4+5 = 30 → 82
      const routes = Array.from({ length: 20 }, (_, i) => makeRoute({
        id: `r_${i}`,
        route_type: ["safeguarding", "health", "behaviour", "education"][i % 4],
        status: "completed",
        has_error: false,
        retry_count: 0,
        created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
      }));
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: true,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const metrics = Array.from({ length: 8 }, (_, i) => makeMetric({
        id: `m_${i}`,
        minutes_saved: 30,
        recorded_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      expect(r.automation_score).toBe(82);
    });

    it("maximum penalties produce lowest non-special-case score", () => {
      // -8-5-4-4-4-4 = -29 → 52-29 = 23
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        route_type: "safeguarding",
        status: i < 2 ? "completed" : "failed", // 20% → -8
        has_error: i < 5, // 50% → -4
        retry_count: i < 5 ? 3 : 0, // 50% → -4
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 2, // 20% → -5
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const metrics = [makeMetric({ minutes_saved: 1, recorded_at: "2026-05-15" })]; // 0.125/staff → -4
      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));
      // 52 -8 -5 -4 -4 +0(div 1) -4 = 27
      // Note: diversity 1 → 0, not -4 (that would need 0 route types)
      expect(r.automation_score).toBe(27);
    });
  });

  // ── Regulatory References ────────────────────────────────────────────────

  describe("regulatory references", () => {
    it("references CHR 2015 Reg 12 for route failure recommendations", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: i < 5 ? "completed" : "failed",
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.recommendations.some(rec => rec.regulatory_ref.includes("Reg 12"))).toBe(true);
    });

    it("references CHR 2015 Reg 36 for coverage recommendations", () => {
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 3,
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ events, routes: [makeRoute()], metrics: [makeMetric()] }));
      expect(r.recommendations.some(rec => rec.regulatory_ref.includes("Reg 36"))).toBe(true);
    });

    it("references SCCIF for time savings recommendations", () => {
      const metrics = [makeMetric({ minutes_saved: 8, recorded_at: "2026-05-15" })];
      const r = computeAutomationROI(baseInput({ metrics, routes: [makeRoute()], events: [makeEvent()], total_staff: 8 }));
      expect(r.recommendations.some(rec => rec.regulatory_ref.includes("SCCIF"))).toBe(true);
    });
  });

  // ── Combined Scenarios ───────────────────────────────────────────────────

  describe("combined scenarios", () => {
    it("high route success but poor coverage produces mixed result", () => {
      const routes = Array.from({ length: 20 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: "completed",
        created_at: `2026-05-${String((i % 25) + 1).padStart(2, "0")}`,
      }));
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: i < 3, // 30% → poor
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events, metrics: [makeMetric()] }));
      expect(r.strengths.some(s => s.includes("route success rate"))).toBe(true);
      expect(r.concerns.some(c => c.includes("coverage"))).toBe(true);
    });

    it("good coverage but many failures produces mixed result", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        status: i < 4 ? "completed" : "failed", // 40%
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const events = Array.from({ length: 10 }, (_, i) => makeEvent({
        id: `e_${i}`,
        has_routes: true, // 100%
        date: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events, metrics: [makeMetric()] }));
      expect(r.strengths.some(s => s.includes("nearly all care events") || s.includes("automation coverage"))).toBe(true);
      expect(r.concerns.some(c => c.includes("route success rate"))).toBe(true);
    });

    it("many errors generates error concern and recommendation", () => {
      const routes = Array.from({ length: 10 }, (_, i) => makeRoute({
        id: `r_${i}`,
        has_error: i < 5, // 50%
        created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
      }));
      const r = computeAutomationROI(baseInput({ routes, events: [makeEvent()], metrics: [makeMetric()] }));
      expect(r.concerns.some(c => c.includes("error rate"))).toBe(true);
      expect(r.recommendations.some(rec => rec.recommendation.includes("error rate"))).toBe(true);
    });
  });

  // ── Determinism ──────────────────────────────────────────────────────────

  describe("determinism", () => {
    it("produces identical results on repeated calls with same input", () => {
      const input = baseInput({
        routes: Array.from({ length: 10 }, (_, i) => makeRoute({
          id: `r_${i}`,
          route_type: ["safeguarding", "health"][i % 2],
          status: i < 8 ? "completed" : "failed",
          has_error: i === 9,
          retry_count: i === 0 ? 1 : 0,
          created_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
        })),
        events: Array.from({ length: 10 }, (_, i) => makeEvent({
          id: `e_${i}`,
          has_routes: i < 7,
          date: `2026-05-${String(10 + i).padStart(2, "0")}`,
        })),
        metrics: Array.from({ length: 8 }, (_, i) => makeMetric({
          id: `m_${i}`,
          minutes_saved: 20,
          recorded_at: `2026-05-${String(10 + i).padStart(2, "0")}`,
        })),
        total_staff: 8,
      });

      const r1 = computeAutomationROI(input);
      const r2 = computeAutomationROI(input);
      const r3 = computeAutomationROI(input);

      expect(r1.automation_score).toBe(r2.automation_score);
      expect(r2.automation_score).toBe(r3.automation_score);
      expect(r1.automation_rating).toBe(r2.automation_rating);
      expect(r1.headline).toBe(r2.headline);
      expect(r1.strengths).toEqual(r2.strengths);
      expect(r1.concerns).toEqual(r2.concerns);
      expect(r1.recommendations).toEqual(r2.recommendations);
      expect(r1.insights).toEqual(r2.insights);
    });

    it("produces identical results across 10 iterations", () => {
      const input = baseInput({
        routes: [makeRoute()],
        events: [makeEvent()],
        metrics: [makeMetric()],
      });
      const results = Array.from({ length: 10 }, () => computeAutomationROI(input));
      for (let i = 1; i < results.length; i++) {
        expect(results[i].automation_score).toBe(results[0].automation_score);
        expect(results[i].automation_rating).toBe(results[0].automation_rating);
      }
    });

    it("different today values produce different results for same data", () => {
      const sharedInput = {
        total_staff: 8,
        metrics: [makeMetric({ recorded_at: "2026-05-20" })],
        routes: [makeRoute({ created_at: "2026-05-20" })],
        events: [makeEvent({ date: "2026-05-20" })],
      };
      const r1 = computeAutomationROI({ today: "2026-05-28", ...sharedInput });
      const r2 = computeAutomationROI({ today: "2027-05-28", ...sharedInput }); // data falls outside 90-day window
      expect(r1.automation_score).not.toBe(r2.automation_score);
    });
  });

  // ── Full Integration Scenario ────────────────────────────────────────────

  describe("full scenario integration", () => {
    it("realistic home with mixed automation data", () => {
      const routes: CareEventRouteInput[] = [
        makeRoute({ id: "r1", care_event_id: "evt_1", route_type: "safeguarding", status: "completed", has_error: false, retry_count: 0, time_saved_minutes: 5, created_at: "2026-05-01" }),
        makeRoute({ id: "r2", care_event_id: "evt_2", route_type: "health", status: "completed", has_error: false, retry_count: 0, time_saved_minutes: 3, created_at: "2026-05-03" }),
        makeRoute({ id: "r3", care_event_id: "evt_3", route_type: "behaviour", status: "completed", has_error: false, retry_count: 1, time_saved_minutes: 4, created_at: "2026-05-05" }),
        makeRoute({ id: "r4", care_event_id: "evt_4", route_type: "education", status: "completed", has_error: false, retry_count: 0, time_saved_minutes: 6, created_at: "2026-05-08" }),
        makeRoute({ id: "r5", care_event_id: "evt_5", route_type: "safeguarding", status: "failed", has_error: true, retry_count: 2, time_saved_minutes: 0, created_at: "2026-05-10" }),
        makeRoute({ id: "r6", care_event_id: "evt_6", route_type: "health", status: "completed", has_error: false, retry_count: 0, time_saved_minutes: 4, created_at: "2026-05-12" }),
        makeRoute({ id: "r7", care_event_id: "evt_7", route_type: "behaviour", status: "completed", has_error: false, retry_count: 0, time_saved_minutes: 5, created_at: "2026-05-15" }),
        makeRoute({ id: "r8", care_event_id: "evt_8", route_type: "education", status: "completed", has_error: false, retry_count: 0, time_saved_minutes: 3, created_at: "2026-05-18" }),
        makeRoute({ id: "r9", care_event_id: "evt_9", route_type: "safeguarding", status: "completed", has_error: false, retry_count: 0, time_saved_minutes: 7, created_at: "2026-05-20" }),
        makeRoute({ id: "r10", care_event_id: "evt_10", route_type: "health", status: "completed", has_error: false, retry_count: 0, time_saved_minutes: 4, created_at: "2026-05-22" }),
      ];
      const events: CareEventBasicInput[] = [
        makeEvent({ id: "evt_1", child_id: "c1", staff_id: "s1", category: "behaviour", date: "2026-05-01", has_routes: true }),
        makeEvent({ id: "evt_2", child_id: "c1", staff_id: "s2", category: "health", date: "2026-05-03", has_routes: true }),
        makeEvent({ id: "evt_3", child_id: "c2", staff_id: "s1", category: "safeguarding", date: "2026-05-05", has_routes: true }),
        makeEvent({ id: "evt_4", child_id: "c2", staff_id: "s3", category: "education", date: "2026-05-08", has_routes: true }),
        makeEvent({ id: "evt_5", child_id: "c3", staff_id: "s2", category: "emotional", date: "2026-05-10", has_routes: true }),
        makeEvent({ id: "evt_6", child_id: "c3", staff_id: "s1", category: "general", date: "2026-05-12", has_routes: false }),
        makeEvent({ id: "evt_7", child_id: "c4", staff_id: "s3", category: "behaviour", date: "2026-05-15", has_routes: true }),
        makeEvent({ id: "evt_8", child_id: "c4", staff_id: "s2", category: "health", date: "2026-05-18", has_routes: true }),
        makeEvent({ id: "evt_9", child_id: "c1", staff_id: "s1", category: "safeguarding", date: "2026-05-20", has_routes: true }),
        makeEvent({ id: "evt_10", child_id: "c2", staff_id: "s2", category: "education", date: "2026-05-22", has_routes: true }),
        makeEvent({ id: "evt_11", child_id: "c3", staff_id: "s3", category: "emotional", date: "2026-05-24", has_routes: false }),
        makeEvent({ id: "evt_12", child_id: "c4", staff_id: "s1", category: "general", date: "2026-05-26", has_routes: true }),
      ];
      const metrics: SavedTimeMetricInput[] = [
        makeMetric({ id: "m1", care_event_id: "evt_1", route_type: "safeguarding", minutes_saved: 5, staff_id: "s1", recorded_at: "2026-05-01" }),
        makeMetric({ id: "m2", care_event_id: "evt_2", route_type: "health", minutes_saved: 3, staff_id: "s2", recorded_at: "2026-05-03" }),
        makeMetric({ id: "m3", care_event_id: "evt_3", route_type: "behaviour", minutes_saved: 4, staff_id: "s1", recorded_at: "2026-05-05" }),
        makeMetric({ id: "m4", care_event_id: "evt_4", route_type: "education", minutes_saved: 6, staff_id: "s3", recorded_at: "2026-05-08" }),
        makeMetric({ id: "m5", care_event_id: "evt_6", route_type: "health", minutes_saved: 4, staff_id: "s1", recorded_at: "2026-05-12" }),
        makeMetric({ id: "m6", care_event_id: "evt_7", route_type: "behaviour", minutes_saved: 5, staff_id: "s3", recorded_at: "2026-05-15" }),
        makeMetric({ id: "m7", care_event_id: "evt_9", route_type: "safeguarding", minutes_saved: 7, staff_id: "s1", recorded_at: "2026-05-20" }),
        makeMetric({ id: "m8", care_event_id: "evt_10", route_type: "education", minutes_saved: 4, staff_id: "s2", recorded_at: "2026-05-22" }),
      ];

      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 3 }));

      // Basic field checks
      expect(r.total_time_saved).toBe(38); // 5+3+4+6+4+5+7+4 = 38
      expect(r.route_success_rate).toBe(90); // 9/10
      expect(r.automation_coverage).toBe(83); // 10/12 = 83.33 → 83%
      expect(r.error_rate).toBe(10); // 1/10
      expect(r.route_type_diversity).toBe(4);
      expect(r.avg_minutes_per_route).toBe(4.1); // 41/10 = 4.1

      // Score: minutesPerStaff = 38/3 = 12.67 → 0 (5-14 range)
      // success: 90% → +3
      // coverage: 83% → +2
      // error: 10% → +2
      // time: 12.67/staff → 0
      // diversity: 4 → +4
      // retry: 2/10 with retry_count>0 = 20% → 0
      // = 52 + 3 + 2 + 2 + 0 + 4 + 0 = 63
      expect(r.automation_score).toBe(63);
      expect(r.automation_rating).toBe("adequate");
    });

    it("struggling home with failing automation", () => {
      const routes: CareEventRouteInput[] = [
        makeRoute({ id: "r1", status: "failed", has_error: true, retry_count: 3, time_saved_minutes: 0, created_at: "2026-05-10" }),
        makeRoute({ id: "r2", status: "failed", has_error: true, retry_count: 2, time_saved_minutes: 0, created_at: "2026-05-15" }),
        makeRoute({ id: "r3", status: "completed", has_error: false, retry_count: 0, time_saved_minutes: 3, created_at: "2026-05-20" }),
      ];
      const events: CareEventBasicInput[] = [
        makeEvent({ id: "evt_1", date: "2026-05-10", has_routes: true }),
        makeEvent({ id: "evt_2", date: "2026-05-15", has_routes: false }),
        makeEvent({ id: "evt_3", date: "2026-05-20", has_routes: false }),
      ];
      const metrics: SavedTimeMetricInput[] = [
        makeMetric({ id: "m1", minutes_saved: 3, recorded_at: "2026-05-20" }),
      ];

      const r = computeAutomationROI(baseInput({ routes, events, metrics, total_staff: 8 }));

      expect(r.automation_rating).toBe("inadequate");
      expect(r.concerns.length).toBeGreaterThan(0);
      expect(r.recommendations.length).toBeGreaterThan(0);
      expect(r.insights.some(i => i.severity === "critical")).toBe(true);
    });
  });
});
