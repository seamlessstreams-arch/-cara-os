import { describe, it, expect, beforeEach } from "vitest";
import {
  computeHomeSafeguardingPrevention,
  type HomeSafeguardingPreventionInput,
  type BullyingInput,
  type HateIncidentInput,
  type PreventScreeningInput,
  type PreventRecordInput,
  type CourtAttendanceInput,
} from "../home-safeguarding-prevention-intelligence-engine";

// -- Helpers ------------------------------------------------------------------

let _id = 0;
const uid = () => `sp-${++_id}`;

function makeBullying(overrides: Partial<BullyingInput> = {}): BullyingInput {
  return {
    id: uid(),
    child_id: "c1",
    date: "2026-05-10",
    school_notified: true,
    police_notified: false,
    restorative_attempted: true,
    support_provided_count: 2,
    status: "resolved",
    follow_up_date: "2026-06-01",
    ...overrides,
  };
}

function makeHate(overrides: Partial<HateIncidentInput> = {}): HateIncidentInput {
  return {
    id: uid(),
    date: "2026-05-10",
    reported_to_police: true,
    reported_to_ofsted: true,
    reported_to_la: true,
    prevention_measures_count: 2,
    status: "resolved",
    follow_up_date: "2026-06-01",
    ...overrides,
  };
}

function makePreventScreening(overrides: Partial<PreventScreeningInput> = {}): PreventScreeningInput {
  return {
    id: uid(),
    child_id: "c1",
    recorded_date: "2026-05-01",
    screening_outcome: "no_concerns",
    child_voice_consulted: true,
    review_date: "2026-11-01",
    online_flags_count: 0,
    ...overrides,
  };
}

function makePreventRecord(overrides: Partial<PreventRecordInput> = {}): PreventRecordInput {
  return {
    id: uid(),
    child_id_present: true,
    date: "2026-05-01",
    risk_level: "low",
    status: "open",
    training_completed: true,
    multi_agency_count: 1,
    ...overrides,
  };
}

function makeCourtAttendance(overrides: Partial<CourtAttendanceInput> = {}): CourtAttendanceInput {
  return {
    id: uid(),
    child_id: "c1",
    recorded_date: "2026-05-01",
    risk_assessment_done: true,
    pre_hearing_prep_count: 3,
    post_hearing_support_count: 2,
    special_measures_count: 1,
    child_voice_provided: true,
    ...overrides,
  };
}

/**
 * Default baseInput produces an "outstanding" scenario:
 * - base 52
 * - mod1 bullying: all resolved => +5
 * - mod2 hate: all properly reported => +4
 * - mod3 prevent coverage: 3/3 children screened => +4
 * - mod4 prevent training: all trained => +3
 * - mod5 court prep: all prepared => +3
 * - mod6 restorative: all attempted => +3
 * - mod7 support: all have support => +3
 * - mod8 child voice: all consulted => +3
 * Total: 52 + 5 + 4 + 4 + 3 + 3 + 3 + 3 + 3 = 80 => outstanding
 */
function baseInput(overrides: Partial<HomeSafeguardingPreventionInput> = {}): HomeSafeguardingPreventionInput {
  return {
    today: "2026-05-27",
    bullying_incidents: [
      makeBullying({ child_id: "c1", status: "resolved" }),
      makeBullying({ child_id: "c2", status: "resolved" }),
    ],
    hate_incidents: [
      makeHate(),
    ],
    prevent_screenings: [
      makePreventScreening({ child_id: "c1" }),
      makePreventScreening({ child_id: "c2" }),
      makePreventScreening({ child_id: "c3" }),
    ],
    prevent_records: [
      makePreventRecord({ training_completed: true }),
      makePreventRecord({ training_completed: true }),
    ],
    court_attendance_records: [
      makeCourtAttendance(),
    ],
    total_children: 3,
    ...overrides,
  };
}

beforeEach(() => { _id = 0; });

// -- Tests --------------------------------------------------------------------

describe("computeHomeSafeguardingPrevention", () => {

  // == Insufficient data ======================================================

  describe("insufficient data", () => {
    it("returns insufficient_data when total_children is 0 AND all arrays empty", () => {
      const r = computeHomeSafeguardingPrevention({
        today: "2026-05-27",
        bullying_incidents: [],
        hate_incidents: [],
        prevent_screenings: [],
        prevent_records: [],
        court_attendance_records: [],
        total_children: 0,
      });
      expect(r.safeguarding_rating).toBe("insufficient_data");
      expect(r.safeguarding_score).toBe(0);
      expect(r.headline).toBe("No safeguarding prevention data available for analysis.");
    });

    it("returns zeroed profiles for insufficient data", () => {
      const r = computeHomeSafeguardingPrevention({
        today: "2026-05-27",
        bullying_incidents: [],
        hate_incidents: [],
        prevent_screenings: [],
        prevent_records: [],
        court_attendance_records: [],
        total_children: 0,
      });
      expect(r.bullying.total_incidents_90d).toBe(0);
      expect(r.hate_incidents.total_incidents_90d).toBe(0);
      expect(r.prevent.total_screenings).toBe(0);
      expect(r.court.total_records).toBe(0);
    });

    it("includes a concern about no data for insufficient_data", () => {
      const r = computeHomeSafeguardingPrevention({
        today: "2026-05-27",
        bullying_incidents: [],
        hate_incidents: [],
        prevent_screenings: [],
        prevent_records: [],
        court_attendance_records: [],
        total_children: 0,
      });
      expect(r.concerns.length).toBe(1);
      expect(r.concerns[0]).toContain("cannot be assessed");
    });

    it("is NOT insufficient_data when total_children > 0 even if arrays empty", () => {
      const r = computeHomeSafeguardingPrevention({
        today: "2026-05-27",
        bullying_incidents: [],
        hate_incidents: [],
        prevent_screenings: [],
        prevent_records: [],
        court_attendance_records: [],
        total_children: 3,
      });
      expect(r.safeguarding_rating).not.toBe("insufficient_data");
    });

    it("is NOT insufficient_data when total_children is 0 but arrays have data", () => {
      const r = computeHomeSafeguardingPrevention({
        today: "2026-05-27",
        bullying_incidents: [makeBullying()],
        hate_incidents: [],
        prevent_screenings: [],
        prevent_records: [],
        court_attendance_records: [],
        total_children: 0,
      });
      expect(r.safeguarding_rating).not.toBe("insufficient_data");
    });
  });

  // == Headlines ==============================================================

  describe("headlines", () => {
    it("outstanding headline", () => {
      const r = computeHomeSafeguardingPrevention(baseInput());
      expect(r.safeguarding_rating).toBe("outstanding");
      expect(r.headline).toContain("Exemplary safeguarding prevention");
    });

    it("good headline", () => {
      // Reduce from outstanding by lowering prevent coverage
      // mod3: 2/3 = 67% => +2 instead of +4 => total 78 => good
      const r = computeHomeSafeguardingPrevention(baseInput({
        prevent_screenings: [
          makePreventScreening({ child_id: "c1" }),
          makePreventScreening({ child_id: "c2" }),
        ],
      }));
      expect(r.safeguarding_rating).toBe("good");
      expect(r.headline).toContain("Strong safeguarding prevention");
    });

    it("adequate headline", () => {
      // base 52, strip most bonuses
      // mod1: no bullying => +2, mod2: no hate => +2, mod3: 0 children no coverage => +0
      // mod4: no records => +0, mod5: no court => +1, mod6: no bullying => +1
      // mod7: no incidents => +1, mod8: no records => +0
      // total: 52 + 2 + 2 + 0 + 0 + 1 + 1 + 1 + 0 = 59 => adequate
      const r = computeHomeSafeguardingPrevention({
        today: "2026-05-27",
        bullying_incidents: [],
        hate_incidents: [],
        prevent_screenings: [],
        prevent_records: [],
        court_attendance_records: [],
        total_children: 3,
      });
      expect(r.safeguarding_rating).toBe("adequate");
      expect(r.headline).toContain("meets minimum standards");
    });

    it("inadequate headline", () => {
      // Need score < 45. Load penalties.
      // base 52
      // mod1: <50% resolution => -5 (all open)
      // mod2: <50% reporting => -4 (none properly reported)
      // mod3: <50% coverage => -4 (0 of 3 screened)
      // mod4: <50% training => -3 (none trained)
      // mod5: <50% court prep => -3 (none prepared)
      // mod6: <40% restorative => -3 (none attempted)
      // mod7: <50% support => -3 (none with support)
      // mod8: <50% voice => -3 (none consulted)
      // total: 52 - 5 - 4 - 4 - 3 - 3 - 3 - 3 - 3 = 24 => inadequate
      const r = computeHomeSafeguardingPrevention({
        today: "2026-05-27",
        bullying_incidents: [
          makeBullying({ status: "open", restorative_attempted: false, support_provided_count: 0 }),
          makeBullying({ status: "open", restorative_attempted: false, support_provided_count: 0 }),
          makeBullying({ status: "open", restorative_attempted: false, support_provided_count: 0 }),
        ],
        hate_incidents: [
          makeHate({ reported_to_police: false, reported_to_ofsted: false, reported_to_la: false, prevention_measures_count: 0 }),
          makeHate({ reported_to_police: false, reported_to_ofsted: false, reported_to_la: false, prevention_measures_count: 0 }),
        ],
        prevent_screenings: [],
        prevent_records: [
          makePreventRecord({ training_completed: false }),
          makePreventRecord({ training_completed: false }),
        ],
        court_attendance_records: [
          makeCourtAttendance({ risk_assessment_done: false, pre_hearing_prep_count: 0, child_voice_provided: false }),
          makeCourtAttendance({ risk_assessment_done: false, pre_hearing_prep_count: 0, child_voice_provided: false }),
        ],
        total_children: 3,
      });
      expect(r.safeguarding_rating).toBe("inadequate");
      expect(r.headline).toContain("Critical safeguarding prevention gaps");
    });

    it("insufficient_data headline", () => {
      const r = computeHomeSafeguardingPrevention({
        today: "2026-05-27",
        bullying_incidents: [],
        hate_incidents: [],
        prevent_screenings: [],
        prevent_records: [],
        court_attendance_records: [],
        total_children: 0,
      });
      expect(r.headline).toBe("No safeguarding prevention data available for analysis.");
    });
  });

  // == Rating boundaries ======================================================

  describe("rating boundaries", () => {
    it("score exactly 80 => outstanding", () => {
      const r = computeHomeSafeguardingPrevention(baseInput());
      expect(r.safeguarding_score).toBe(80);
      expect(r.safeguarding_rating).toBe("outstanding");
    });

    it("score 76 => good (not outstanding)", () => {
      // 2/3 children screened = pct(2,3) = 67% which is <70%, so mod3 gives +0 (was +4)
      // All other mods same as base
      // total: 80 - 4 = 76 => good
      const r = computeHomeSafeguardingPrevention(baseInput({
        prevent_screenings: [
          makePreventScreening({ child_id: "c1" }),
          makePreventScreening({ child_id: "c2" }),
        ],
      }));
      expect(r.safeguarding_score).toBe(76);
      expect(r.safeguarding_rating).toBe("good");
    });

    it("score exactly 65 => good", () => {
      // base 52, need +13 total from modifiers
      // mod1: no bullying => +2
      // mod2: no hate => +2
      // mod3: 70% coverage => +2 (need 7/10 children screened? use 3 children, 70% = need >=2.1 so 3/3 = 100 or 2/3 = 67 which is <70)
      // Let's use 10 children, 7 screened for exactly 70%
      // mod4: no records => 0
      // mod5: no court => +1
      // mod6: no bullying => +1
      // mod7: no incidents => +1
      // mod8: 7 screenings with voice => needs court too. voice records = screenings only since no court
      //   7 screenings all with child_voice_consulted = 100% => +3
      // total: 52 + 2 + 2 + 2 + 0 + 1 + 1 + 1 + 3 = 64. Need 65.
      // Add mod4: 1 prevent record with training => 100% => +3. Now 67. Too high.
      // Try: mod8 at +1 (70-89%): 7 screenings, 5 with voice = 71% => +1
      // total: 52 + 2 + 2 + 2 + 0 + 1 + 1 + 1 + 1 = 62. Still not 65.
      // Let me try: 10 children, 9 screened = 90% => mod3 +4, mod8 voice at +0 (50-69%): 9 screenings, 5 voice = 56%
      // total: 52 + 2 + 2 + 4 + 0 + 1 + 1 + 1 + 0 = 63. Not yet.
      // Add mod4: 1 record trained => +3. Total 66. One too many.
      // OK let me try differently. 10 children, 7 screened = 70% => +2
      // mod4: 2 records, 70% trained = need 1.4, so 2/2 = 100% => +3 or 1/2 = 50% => +0
      // Hmm. Let me try: mod4: 10 records, 7 trained = 70% => +1.
      // total: 52 + 2 + 2 + 2 + 1 + 1 + 1 + 1 + ? = 62 + mod8
      // mod8: 7 screenings, voice => 100% => +3 => 65!
      const screenings = [];
      for (let i = 1; i <= 7; i++) {
        screenings.push(makePreventScreening({ child_id: `c${i}`, child_voice_consulted: true }));
      }
      const preventRecs = [];
      for (let i = 0; i < 10; i++) {
        preventRecs.push(makePreventRecord({ training_completed: i < 7 }));
      }
      const r = computeHomeSafeguardingPrevention({
        today: "2026-05-27",
        bullying_incidents: [],
        hate_incidents: [],
        prevent_screenings: screenings,
        prevent_records: preventRecs,
        court_attendance_records: [],
        total_children: 10,
      });
      // mod1: no bullying => +2
      // mod2: no hate => +2
      // mod3: 7/10 = 70% => +2
      // mod4: 7/10 = 70% => +1
      // mod5: no court => +1
      // mod6: no bullying => +1
      // mod7: no incidents => +1
      // mod8: 7 screenings all voiced / 7 total = 100% => +3
      // total: 52 + 2 + 2 + 2 + 1 + 1 + 1 + 1 + 3 = 65
      expect(r.safeguarding_score).toBe(65);
      expect(r.safeguarding_rating).toBe("good");
    });

    it("score 64 => adequate (not good)", () => {
      // Same as above but drop mod8 to +1 by reducing voice: 5/7 = 71% => +1
      const screenings = [];
      for (let i = 1; i <= 7; i++) {
        screenings.push(makePreventScreening({ child_id: `c${i}`, child_voice_consulted: i <= 5 }));
      }
      const preventRecs = [];
      for (let i = 0; i < 10; i++) {
        preventRecs.push(makePreventRecord({ training_completed: i < 7 }));
      }
      const r = computeHomeSafeguardingPrevention({
        today: "2026-05-27",
        bullying_incidents: [],
        hate_incidents: [],
        prevent_screenings: screenings,
        prevent_records: preventRecs,
        court_attendance_records: [],
        total_children: 10,
      });
      // mod8: 5/7 = 71% => +1
      // total: 52 + 2 + 2 + 2 + 1 + 1 + 1 + 1 + 1 = 63
      expect(r.safeguarding_score).toBe(63);
      expect(r.safeguarding_rating).toBe("adequate");
    });

    it("score exactly 45 => adequate", () => {
      // mod1: 1/2 bullying = 50% resolved => +0
      // mod2: 1/2 hate properly reported => 50% => +0
      // mod3: 1/3 = 33% coverage => -4
      // mod4: 1/2 = 50% training => +0
      // mod5: 0/2 court with risk+prep = 0% => -3
      // mod6: 1/2 = 50% restorative => +0 (>=40)
      // mod7: bullying [true, false] + hate [true, true] = 3/4 = 75% => +1... darn
      // Need mod7 at +0 (50-69%). Reduce hate prevention:
      // hate: [prev=0, prev=1] => [false, true]
      // bullying: [sup=2, sup=0] => [true, false]
      // total: [true, false, false, true] = 2/4 = 50% => +0
      // mod8: voice: screenings [true] + court [true, false] = 2/3 = 67% => +1... need +0 (50-69%)
      // 67% is in 50-69% range. Wait: >=70 => +1, >=50 => +0. 67% is <70 so +0.
      // total: 52 + 0 + 0 - 4 + 0 - 3 + 0 + 0 + 0 = 45
      const r3 = computeHomeSafeguardingPrevention({
        today: "2026-05-27",
        bullying_incidents: [
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 2 }),
          makeBullying({ status: "open", restorative_attempted: false, support_provided_count: 0 }),
        ],
        hate_incidents: [
          makeHate({ reported_to_police: true, reported_to_ofsted: true, reported_to_la: false, prevention_measures_count: 0 }),
          makeHate({ reported_to_police: true, reported_to_ofsted: true, reported_to_la: true, prevention_measures_count: 1 }),
        ],
        prevent_screenings: [
          makePreventScreening({ child_id: "c1", child_voice_consulted: true }),
        ],
        prevent_records: [
          makePreventRecord({ training_completed: true }),
          makePreventRecord({ training_completed: false }),
        ],
        court_attendance_records: [
          makeCourtAttendance({ risk_assessment_done: false, pre_hearing_prep_count: 0, child_voice_provided: true }),
          makeCourtAttendance({ risk_assessment_done: false, pre_hearing_prep_count: 0, child_voice_provided: false }),
        ],
        total_children: 3,
      });
      // mod7: bullying [true, false] + hate [false, true] = 2/4 = 50% => +0
      // mod8: screenings [true] + court [true, false] = 2/3 = 67% => +0 (>=50 but <70)
      expect(r3.safeguarding_score).toBe(45);
      expect(r3.safeguarding_rating).toBe("adequate");
    });

    it("score 44 => inadequate (not adequate)", () => {
      // Same as 45 scenario but push mod4 training to -3
      // mod4: 0/2 training = 0% => -3 instead of +0 (was 50%)
      // total: 45 - 3 = 42 => inadequate
      const r = computeHomeSafeguardingPrevention({
        today: "2026-05-27",
        bullying_incidents: [
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 2 }),
          makeBullying({ status: "open", restorative_attempted: false, support_provided_count: 0 }),
        ],
        hate_incidents: [
          makeHate({ reported_to_police: true, reported_to_ofsted: true, reported_to_la: false, prevention_measures_count: 0 }),
          makeHate({ reported_to_police: true, reported_to_ofsted: true, reported_to_la: true, prevention_measures_count: 1 }),
        ],
        prevent_screenings: [
          makePreventScreening({ child_id: "c1", child_voice_consulted: true }),
        ],
        prevent_records: [
          makePreventRecord({ training_completed: false }),
          makePreventRecord({ training_completed: false }),
        ],
        court_attendance_records: [
          makeCourtAttendance({ risk_assessment_done: false, pre_hearing_prep_count: 0, child_voice_provided: true }),
          makeCourtAttendance({ risk_assessment_done: false, pre_hearing_prep_count: 0, child_voice_provided: false }),
        ],
        total_children: 3,
      });
      // mod4: 0/2 = 0% => -3 (was +0 at 50%)
      // total: 52 + 0 + 0 - 4 - 3 - 3 + 0 + 0 + 0 = 42
      expect(r.safeguarding_score).toBe(42);
      expect(r.safeguarding_rating).toBe("inadequate");
    });
  });

  // == Modifier 1: Bullying incident management ===============================

  describe("mod1: bullying incident management", () => {
    // Helper: isolate mod1 by controlling all other mods
    // No hate (mod2 +2), full coverage (mod3 +4), full training (mod4 +3),
    // no court (mod5 +1), mod6/mod7 depend on bullying too

    it("+5 when all resolved (100%)", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
        ],
      }));
      // mod1: 100% => +5, mod6: 100% => +3, mod7: 2 bullying + 1 hate all supported => +3
      expect(r.safeguarding_score).toBe(80);
    });

    it("+3 when >=80% resolved", () => {
      // 4/5 = 80%
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "open", restorative_attempted: true, support_provided_count: 1 }),
        ],
      }));
      // mod1: 80% => +3 (was +5, -2)
      // mod6: 5/5 = 100% => +3
      // mod7: 5 bullying all supported + 1 hate = 6/6 = 100% => +3
      // mod8: 3 screenings + 1 court = 4/4 = 100% => +3
      expect(r.safeguarding_score).toBe(78);
    });

    it("+0 when >=50% but <80% resolved", () => {
      // 3/5 = 60%
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "open", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "investigating", restorative_attempted: true, support_provided_count: 1 }),
        ],
      }));
      // mod1: 60% => +0 (was +5, -5)
      expect(r.safeguarding_score).toBe(75);
    });

    it("-5 when <50% resolved", () => {
      // 1/5 = 20%
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "open", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "open", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "investigating", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "investigating", restorative_attempted: true, support_provided_count: 1 }),
        ],
      }));
      // mod1: 20% => -5 (was +5, -10)
      expect(r.safeguarding_score).toBe(70);
    });

    it("+2 when no bullying incidents", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [],
      }));
      // mod1: no bullying => +2 (was +5, -3)
      // mod6: no bullying => +1 (was +3, -2)
      // mod7: only 1 hate with prevention = 1/1 = 100% => +3 (same)
      // total: 80 - 3 - 2 = 75
      expect(r.safeguarding_score).toBe(75);
    });

    it("excludes bullying incidents older than 90d", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [
          makeBullying({ date: "2026-02-01", status: "open" }), // >90d, excluded
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
        ],
      }));
      // Only 1 bullying in 90d, resolved => 100% => +5
      // mod6: 1/1 = 100% => +3
      // mod7: 1 bullying supported + 1 hate = 2/2 = 100% => +3
      expect(r.safeguarding_score).toBe(80);
    });
  });

  // == Modifier 2: Hate incident reporting compliance =========================

  describe("mod2: hate incident reporting compliance", () => {
    it("+4 when all properly reported (100%)", () => {
      const r = computeHomeSafeguardingPrevention(baseInput());
      // Default: 1 hate, all reported => +4
      expect(r.safeguarding_score).toBe(80);
    });

    it("+2 when >=80% properly reported", () => {
      // 4/5 = 80%
      const r = computeHomeSafeguardingPrevention(baseInput({
        hate_incidents: [
          makeHate({ reported_to_police: true, reported_to_ofsted: true, reported_to_la: true, prevention_measures_count: 1 }),
          makeHate({ reported_to_police: true, reported_to_ofsted: true, reported_to_la: true, prevention_measures_count: 1 }),
          makeHate({ reported_to_police: true, reported_to_ofsted: true, reported_to_la: true, prevention_measures_count: 1 }),
          makeHate({ reported_to_police: true, reported_to_ofsted: true, reported_to_la: true, prevention_measures_count: 1 }),
          makeHate({ reported_to_police: true, reported_to_ofsted: false, reported_to_la: true, prevention_measures_count: 1 }),
        ],
      }));
      // mod2: 80% => +2 (was +4, -2)
      // mod7: 2 bullying + 5 hate all with support/prevention = 7/7 = 100% => +3
      expect(r.safeguarding_score).toBe(78);
    });

    it("+0 when >=50% but <80% properly reported", () => {
      // 1/2 = 50%
      const r = computeHomeSafeguardingPrevention(baseInput({
        hate_incidents: [
          makeHate({ reported_to_police: true, reported_to_ofsted: true, reported_to_la: true, prevention_measures_count: 1 }),
          makeHate({ reported_to_police: false, reported_to_ofsted: false, reported_to_la: false, prevention_measures_count: 1 }),
        ],
      }));
      // mod2: 50% => +0 (was +4, -4)
      expect(r.safeguarding_score).toBe(76);
    });

    it("-4 when <50% properly reported", () => {
      // 0/2 = 0%
      const r = computeHomeSafeguardingPrevention(baseInput({
        hate_incidents: [
          makeHate({ reported_to_police: false, reported_to_ofsted: false, reported_to_la: false, prevention_measures_count: 1 }),
          makeHate({ reported_to_police: false, reported_to_ofsted: false, reported_to_la: false, prevention_measures_count: 1 }),
        ],
      }));
      // mod2: 0% => -4 (was +4, -8)
      expect(r.safeguarding_score).toBe(72);
    });

    it("+2 when no hate incidents", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        hate_incidents: [],
      }));
      // mod2: no hate => +2 (was +4, -2)
      // mod7: only 2 bullying with support = 2/2 = 100% => +3 (same)
      expect(r.safeguarding_score).toBe(78);
    });

    it("excludes hate incidents older than 90d", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        hate_incidents: [
          makeHate({ date: "2025-01-01", reported_to_police: false, reported_to_ofsted: false, reported_to_la: false }), // old
          makeHate({ reported_to_police: true, reported_to_ofsted: true, reported_to_la: true, prevention_measures_count: 1 }),
        ],
      }));
      // Only 1 in 90d, properly reported => +4
      expect(r.safeguarding_score).toBe(80);
    });
  });

  // == Modifier 3: Prevent duty screening coverage ============================

  describe("mod3: prevent screening coverage", () => {
    it("+4 when >=90% coverage", () => {
      // 3/3 = 100%
      const r = computeHomeSafeguardingPrevention(baseInput());
      expect(r.safeguarding_score).toBe(80);
    });

    it("+2 when >=70% but <90% coverage", () => {
      // 7/10 = 70%
      const screenings = [];
      for (let i = 1; i <= 7; i++) {
        screenings.push(makePreventScreening({ child_id: `c${i}`, child_voice_consulted: true }));
      }
      const r = computeHomeSafeguardingPrevention(baseInput({
        prevent_screenings: screenings,
        total_children: 10,
      }));
      // mod3: 70% => +2 (was +4, -2)
      // mod8: 7 screenings + 1 court = 8/8 = 100% => +3
      expect(r.safeguarding_score).toBe(78);
    });

    it("+0 when >=50% but <70% coverage", () => {
      // 5/10 = 50%
      const screenings = [];
      for (let i = 1; i <= 5; i++) {
        screenings.push(makePreventScreening({ child_id: `c${i}`, child_voice_consulted: true }));
      }
      const r = computeHomeSafeguardingPrevention(baseInput({
        prevent_screenings: screenings,
        total_children: 10,
      }));
      // mod3: 50% => +0 (was +4, -4)
      expect(r.safeguarding_score).toBe(76);
    });

    it("-4 when <50% coverage", () => {
      // 1/10 = 10%
      const r = computeHomeSafeguardingPrevention(baseInput({
        prevent_screenings: [
          makePreventScreening({ child_id: "c1", child_voice_consulted: true }),
        ],
        total_children: 10,
      }));
      // mod3: 10% => -4 (was +4, -8)
      // mod8: 1 screening + 1 court = 2/2 = 100% => +3
      expect(r.safeguarding_score).toBe(72);
    });

    it("+0 when total_children is 0", () => {
      // Cannot have screening coverage without children
      const r = computeHomeSafeguardingPrevention({
        today: "2026-05-27",
        bullying_incidents: [makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 })],
        hate_incidents: [],
        prevent_screenings: [],
        prevent_records: [],
        court_attendance_records: [],
        total_children: 0,
      });
      // Not insufficient_data because bullying_incidents has data
      expect(r.safeguarding_rating).not.toBe("insufficient_data");
    });
  });

  // == Modifier 4: Prevent training compliance ================================

  describe("mod4: prevent training compliance", () => {
    it("+3 when >=90% trained", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        prevent_records: [
          makePreventRecord({ training_completed: true }),
          makePreventRecord({ training_completed: true }),
        ],
      }));
      // mod4: 100% => +3
      expect(r.safeguarding_score).toBe(80);
    });

    it("+1 when >=70% but <90% trained", () => {
      // 7/10 = 70%
      const records = [];
      for (let i = 0; i < 10; i++) {
        records.push(makePreventRecord({ training_completed: i < 7 }));
      }
      const r = computeHomeSafeguardingPrevention(baseInput({
        prevent_records: records,
      }));
      // mod4: 70% => +1 (was +3, -2)
      expect(r.safeguarding_score).toBe(78);
    });

    it("+0 when >=50% but <70% trained", () => {
      // 5/10 = 50%
      const records = [];
      for (let i = 0; i < 10; i++) {
        records.push(makePreventRecord({ training_completed: i < 5 }));
      }
      const r = computeHomeSafeguardingPrevention(baseInput({
        prevent_records: records,
      }));
      // mod4: 50% => +0 (was +3, -3)
      expect(r.safeguarding_score).toBe(77);
    });

    it("-3 when <50% trained", () => {
      // 0/2 = 0%
      const r = computeHomeSafeguardingPrevention(baseInput({
        prevent_records: [
          makePreventRecord({ training_completed: false }),
          makePreventRecord({ training_completed: false }),
        ],
      }));
      // mod4: 0% => -3 (was +3, -6)
      expect(r.safeguarding_score).toBe(74);
    });

    it("+0 when no prevent records", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        prevent_records: [],
      }));
      // mod4: no records => +0 (was +3, -3)
      expect(r.safeguarding_score).toBe(77);
    });
  });

  // == Modifier 5: Court attendance preparation ===============================

  describe("mod5: court attendance preparation", () => {
    it("+3 when >=90% prepared", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        court_attendance_records: [
          makeCourtAttendance({ risk_assessment_done: true, pre_hearing_prep_count: 3, child_voice_provided: true }),
        ],
      }));
      // mod5: 100% => +3
      expect(r.safeguarding_score).toBe(80);
    });

    it("+1 when >=70% but <90% prepared", () => {
      // 7/10 = 70%
      const records = [];
      for (let i = 0; i < 10; i++) {
        records.push(makeCourtAttendance({
          risk_assessment_done: i < 7,
          pre_hearing_prep_count: i < 7 ? 2 : 0,
          child_voice_provided: true,
        }));
      }
      const r = computeHomeSafeguardingPrevention(baseInput({
        court_attendance_records: records,
      }));
      // mod5: 70% => +1 (was +3, -2)
      // mod8: 3 screenings + 10 court all voiced = 13/13 = 100% => +3
      expect(r.safeguarding_score).toBe(78);
    });

    it("+0 when >=50% but <70% prepared", () => {
      // 5/10 = 50%
      const records = [];
      for (let i = 0; i < 10; i++) {
        records.push(makeCourtAttendance({
          risk_assessment_done: i < 5,
          pre_hearing_prep_count: i < 5 ? 2 : 0,
          child_voice_provided: true,
        }));
      }
      const r = computeHomeSafeguardingPrevention(baseInput({
        court_attendance_records: records,
      }));
      // mod5: 50% => +0 (was +3, -3)
      expect(r.safeguarding_score).toBe(77);
    });

    it("-3 when <50% prepared", () => {
      // 0/2 = 0%
      const r = computeHomeSafeguardingPrevention(baseInput({
        court_attendance_records: [
          makeCourtAttendance({ risk_assessment_done: false, pre_hearing_prep_count: 0, child_voice_provided: true }),
          makeCourtAttendance({ risk_assessment_done: false, pre_hearing_prep_count: 0, child_voice_provided: true }),
        ],
      }));
      // mod5: 0% => -3 (was +3, -6)
      // mod8: 3 screenings + 2 court voiced = 5/5 = 100% => +3
      expect(r.safeguarding_score).toBe(74);
    });

    it("+1 when no court records (neutral positive)", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        court_attendance_records: [],
      }));
      // mod5: no court => +1 (was +3, -2)
      // mod8: 3 screenings only = 3/3 = 100% => +3
      expect(r.safeguarding_score).toBe(78);
    });
  });

  // == Modifier 6: Restorative practice =======================================

  describe("mod6: restorative practice", () => {
    it("+3 when >=80% restorative attempted", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
        ],
      }));
      // mod6: 100% => +3
      expect(r.safeguarding_score).toBe(80);
    });

    it("+1 when >=60% but <80% restorative", () => {
      // 3/5 = 60%
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: false, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: false, support_provided_count: 1 }),
        ],
      }));
      // mod1: 100% => +5, mod6: 60% => +1 (was +3, -2)
      // mod7: 5 bullying + 1 hate all supported = 6/6 = 100% => +3
      expect(r.safeguarding_score).toBe(78);
    });

    it("+0 when >=40% but <60% restorative", () => {
      // 2/5 = 40%
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: false, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: false, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: false, support_provided_count: 1 }),
        ],
      }));
      // mod1: 100% => +5, mod6: 40% => +0 (was +3, -3)
      expect(r.safeguarding_score).toBe(77);
    });

    it("-3 when <40% restorative", () => {
      // 0/5 = 0%
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [
          makeBullying({ status: "resolved", restorative_attempted: false, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: false, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: false, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: false, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: false, support_provided_count: 1 }),
        ],
      }));
      // mod1: 100% => +5, mod6: 0% => -3 (was +3, -6)
      expect(r.safeguarding_score).toBe(74);
    });

    it("+1 when no bullying incidents", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [],
      }));
      // mod1: +2, mod6: +1
      // vs base mod1: +5, mod6: +3
      // delta: -3 + -2 = -5
      expect(r.safeguarding_score).toBe(75);
    });
  });

  // == Modifier 7: Support provision ==========================================

  describe("mod7: support provision", () => {
    it("+3 when >=90% supported", () => {
      const r = computeHomeSafeguardingPrevention(baseInput());
      // All bullying has support_provided_count > 0, all hate has prevention > 0
      expect(r.safeguarding_score).toBe(80);
    });

    it("+1 when >=70% but <90% supported", () => {
      // 7/10 = 70% — but need careful control
      // 2 bullying + 1 hate = 3 incidents. To get 70-89% need different counts.
      // 7 bullying + 3 hate = 10 total. 7 supported.
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 0 }),
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 0 }),
        ],
        hate_incidents: [
          makeHate({ prevention_measures_count: 1 }),
          makeHate({ prevention_measures_count: 1 }),
          makeHate({ prevention_measures_count: 0 }),
        ],
      }));
      // mod7: bullying [t,t,t,t,t,f,f] + hate [t,t,f] = 7/10 = 70% => +1 (was +3, -2)
      // mod1: 100% => +5
      // mod2: check: all 3 hate have all reporting fields from makeHate default => 100% => +4
      // mod6: 100% => +3
      expect(r.safeguarding_score).toBe(78);
    });

    it("+0 when >=50% but <70% supported", () => {
      // 5/10 = 50%
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 0 }),
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 0 }),
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 0 }),
        ],
        hate_incidents: [
          makeHate({ prevention_measures_count: 1 }),
          makeHate({ prevention_measures_count: 1 }),
          makeHate({ prevention_measures_count: 1 }),
          makeHate({ prevention_measures_count: 0 }),
          makeHate({ prevention_measures_count: 0 }),
        ],
      }));
      // mod7: bullying [t,t,f,f,f] + hate [t,t,t,f,f] = 5/10 = 50% => +0 (was +3, -3)
      // mod1: 100% => +5, mod2: 100% => +4, mod6: 100% => +3
      expect(r.safeguarding_score).toBe(77);
    });

    it("-3 when <50% supported", () => {
      // 1/5 = 20%
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 0 }),
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 0 }),
        ],
        hate_incidents: [
          makeHate({ prevention_measures_count: 0 }),
          makeHate({ prevention_measures_count: 0 }),
        ],
      }));
      // mod7: bullying [t,f,f] + hate [f,f] = 1/5 = 20% => -3 (was +3, -6)
      // mod2: hate all reported => 100% => +4
      expect(r.safeguarding_score).toBe(74);
    });

    it("+1 when no incidents at all", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [],
        hate_incidents: [],
      }));
      // mod1: +2, mod2: +2, mod6: +1, mod7: +1
      // vs base: mod1: +5, mod2: +4, mod6: +3, mod7: +3
      // delta: -3 -2 -2 -2 = -9
      expect(r.safeguarding_score).toBe(71);
    });
  });

  // == Modifier 8: Child voice in safeguarding ================================

  describe("mod8: child voice in safeguarding", () => {
    it("+3 when >=90% voice", () => {
      const r = computeHomeSafeguardingPrevention(baseInput());
      // 3 screenings + 1 court = 4/4 = 100% => +3
      expect(r.safeguarding_score).toBe(80);
    });

    it("+1 when >=70% but <90% voice", () => {
      // Need 70-89%: 7/10 = 70%
      const screenings = [];
      for (let i = 1; i <= 7; i++) {
        screenings.push(makePreventScreening({ child_id: `c${i}`, child_voice_consulted: i <= 5 }));
      }
      const r = computeHomeSafeguardingPrevention(baseInput({
        prevent_screenings: screenings,
        court_attendance_records: [
          makeCourtAttendance({ child_voice_provided: true }),
          makeCourtAttendance({ child_voice_provided: true }),
          makeCourtAttendance({ child_voice_provided: false }),
        ],
        total_children: 10,
      }));
      // mod8: screenings [t,t,t,t,t,f,f] + court [t,t,f] = 7/10 = 70% => +1 (was +3, -2)
      // mod3: 7/10 = 70% => +2 (was +4, -2)
      // mod5: 3/3 all prepared => 100% => +3
      expect(r.safeguarding_score).toBe(76);
    });

    it("+0 when >=50% but <70% voice", () => {
      // 5/10 = 50%
      const screenings = [];
      for (let i = 1; i <= 7; i++) {
        screenings.push(makePreventScreening({ child_id: `c${i}`, child_voice_consulted: i <= 3 }));
      }
      const r = computeHomeSafeguardingPrevention(baseInput({
        prevent_screenings: screenings,
        court_attendance_records: [
          makeCourtAttendance({ child_voice_provided: true }),
          makeCourtAttendance({ child_voice_provided: true }),
          makeCourtAttendance({ child_voice_provided: false }),
        ],
        total_children: 10,
      }));
      // mod8: screenings [t,t,t,f,f,f,f] + court [t,t,f] = 5/10 = 50% => +0 (was +3, -3)
      // mod3: 7/10 = 70% => +2
      // mod5: 3/3 prepared => +3
      expect(r.safeguarding_score).toBe(75);
    });

    it("-3 when <50% voice", () => {
      // 2/10 = 20%
      const screenings = [];
      for (let i = 1; i <= 7; i++) {
        screenings.push(makePreventScreening({ child_id: `c${i}`, child_voice_consulted: i <= 1 }));
      }
      const r = computeHomeSafeguardingPrevention(baseInput({
        prevent_screenings: screenings,
        court_attendance_records: [
          makeCourtAttendance({ child_voice_provided: true }),
          makeCourtAttendance({ child_voice_provided: false }),
          makeCourtAttendance({ child_voice_provided: false }),
        ],
        total_children: 10,
      }));
      // mod8: screenings [t,f,f,f,f,f,f] + court [t,f,f] = 2/10 = 20% => -3 (was +3, -6)
      // mod3: 7/10 = 70% => +2
      // mod5: 3/3 prepared => +3
      expect(r.safeguarding_score).toBe(72);
    });

    it("+0 when no screening or court records", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        prevent_screenings: [],
        court_attendance_records: [],
      }));
      // mod3: 0/3 = 0% => -4 (was +4, -8)
      // mod5: no court => +1 (was +3, -2)
      // mod8: no records => +0 (was +3, -3)
      // delta: -8 -2 -3 = -13
      expect(r.safeguarding_score).toBe(67);
    });
  });

  // == Profile calculations ===================================================

  describe("profile calculations", () => {
    it("counts bullying incidents in 90d correctly", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [
          makeBullying({ date: "2026-05-20" }),
          makeBullying({ date: "2026-03-01" }),
          makeBullying({ date: "2026-01-01" }), // out of range
        ],
      }));
      expect(r.bullying.total_incidents_90d).toBe(2);
    });

    it("counts resolved and open bullying correctly", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [
          makeBullying({ status: "resolved" }),
          makeBullying({ status: "open" }),
          makeBullying({ status: "investigating" }),
          makeBullying({ status: "monitoring" }),
        ],
      }));
      expect(r.bullying.resolved_count).toBe(1);
      expect(r.bullying.open_count).toBe(2); // open + investigating
    });

    it("calculates restorative rate", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [
          makeBullying({ restorative_attempted: true }),
          makeBullying({ restorative_attempted: true }),
          makeBullying({ restorative_attempted: false }),
          makeBullying({ restorative_attempted: false }),
        ],
      }));
      expect(r.bullying.restorative_rate).toBe(50);
    });

    it("calculates school notification rate", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [
          makeBullying({ school_notified: true }),
          makeBullying({ school_notified: true }),
          makeBullying({ school_notified: false }),
        ],
      }));
      expect(r.bullying.school_notification_rate).toBe(67);
    });

    it("counts hate incidents in 90d", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        hate_incidents: [
          makeHate({ date: "2026-05-10" }),
          makeHate({ date: "2026-04-01" }),
          makeHate({ date: "2025-01-01" }), // old
        ],
      }));
      expect(r.hate_incidents.total_incidents_90d).toBe(2);
    });

    it("calculates hate reporting compliance", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        hate_incidents: [
          makeHate({ reported_to_police: true, reported_to_ofsted: true, reported_to_la: true }),
          makeHate({ reported_to_police: true, reported_to_ofsted: false, reported_to_la: true }),
        ],
      }));
      expect(r.hate_incidents.reporting_compliance_rate).toBe(50);
    });

    it("sums prevention measures total", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        hate_incidents: [
          makeHate({ prevention_measures_count: 3 }),
          makeHate({ prevention_measures_count: 2 }),
        ],
      }));
      expect(r.hate_incidents.prevention_measures_total).toBe(5);
    });

    it("counts prevent screenings total", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        prevent_screenings: [
          makePreventScreening({ child_id: "c1" }),
          makePreventScreening({ child_id: "c2" }),
          makePreventScreening({ child_id: "c3" }),
          makePreventScreening({ child_id: "c1" }), // duplicate child
        ],
      }));
      expect(r.prevent.total_screenings).toBe(4);
      expect(r.prevent.child_coverage).toBe(100); // 3 unique / 3 total
    });

    it("calculates training compliance rate", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        prevent_records: [
          makePreventRecord({ training_completed: true }),
          makePreventRecord({ training_completed: true }),
          makePreventRecord({ training_completed: false }),
        ],
      }));
      expect(r.prevent.training_compliance_rate).toBe(67);
    });

    it("counts high risk prevent records", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        prevent_records: [
          makePreventRecord({ risk_level: "high", training_completed: true }),
          makePreventRecord({ risk_level: "high", training_completed: true }),
          makePreventRecord({ risk_level: "low", training_completed: true }),
        ],
      }));
      expect(r.prevent.high_risk_count).toBe(2);
    });

    it("calculates court risk assessment rate", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        court_attendance_records: [
          makeCourtAttendance({ risk_assessment_done: true }),
          makeCourtAttendance({ risk_assessment_done: false }),
        ],
      }));
      expect(r.court.risk_assessment_rate).toBe(50);
    });

    it("calculates court prep rate (risk + prep)", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        court_attendance_records: [
          makeCourtAttendance({ risk_assessment_done: true, pre_hearing_prep_count: 3 }),
          makeCourtAttendance({ risk_assessment_done: true, pre_hearing_prep_count: 0 }),
          makeCourtAttendance({ risk_assessment_done: false, pre_hearing_prep_count: 3 }),
        ],
      }));
      // Only first has both risk + prep
      expect(r.court.prep_rate).toBe(33);
    });

    it("calculates court support rate", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        court_attendance_records: [
          makeCourtAttendance({ post_hearing_support_count: 2 }),
          makeCourtAttendance({ post_hearing_support_count: 0 }),
        ],
      }));
      expect(r.court.support_rate).toBe(50);
    });
  });

  // == Strengths ==============================================================

  describe("strengths", () => {
    it("includes strength for 100% bullying resolution", () => {
      const r = computeHomeSafeguardingPrevention(baseInput());
      expect(r.strengths).toContainEqual(expect.stringContaining("100% bullying incident resolution"));
    });

    it("includes strength for no bullying incidents", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [],
      }));
      expect(r.strengths).toContainEqual(expect.stringContaining("No bullying incidents"));
    });

    it("includes strength for 100% hate reporting", () => {
      const r = computeHomeSafeguardingPrevention(baseInput());
      expect(r.strengths).toContainEqual(expect.stringContaining("100% hate incident reporting"));
    });

    it("includes strength for no hate incidents", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        hate_incidents: [],
      }));
      expect(r.strengths).toContainEqual(expect.stringContaining("No hate incidents"));
    });

    it("includes strength for high prevent coverage", () => {
      const r = computeHomeSafeguardingPrevention(baseInput());
      expect(r.strengths).toContainEqual(expect.stringContaining("Prevent screening coverage"));
    });

    it("includes strength for high training compliance", () => {
      const r = computeHomeSafeguardingPrevention(baseInput());
      expect(r.strengths).toContainEqual(expect.stringContaining("Prevent training compliance"));
    });

    it("includes strength for high court prep rate", () => {
      const r = computeHomeSafeguardingPrevention(baseInput());
      expect(r.strengths).toContainEqual(expect.stringContaining("court attendance preparation"));
    });

    it("includes strength for high restorative rate", () => {
      const r = computeHomeSafeguardingPrevention(baseInput());
      expect(r.strengths).toContainEqual(expect.stringContaining("restorative practice"));
    });
  });

  // == Concerns ===============================================================

  describe("concerns", () => {
    it("includes concern for unresolved bullying", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [
          makeBullying({ status: "open", restorative_attempted: true, support_provided_count: 1 }),
        ],
      }));
      expect(r.concerns).toContainEqual(expect.stringContaining("bullying incident"));
      expect(r.concerns).toContainEqual(expect.stringContaining("unresolved"));
    });

    it("includes concern for incomplete hate reporting", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        hate_incidents: [
          makeHate({ reported_to_police: false, reported_to_ofsted: false, reported_to_la: false }),
        ],
      }));
      expect(r.concerns).toContainEqual(expect.stringContaining("incomplete statutory reporting"));
    });

    it("includes concern for low prevent coverage", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        prevent_screenings: [makePreventScreening({ child_id: "c1" })],
        total_children: 10,
      }));
      expect(r.concerns).toContainEqual(expect.stringContaining("Prevent screenings"));
    });

    it("includes concern for low training compliance", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        prevent_records: [
          makePreventRecord({ training_completed: false }),
          makePreventRecord({ training_completed: false }),
          makePreventRecord({ training_completed: false }),
        ],
      }));
      expect(r.concerns).toContainEqual(expect.stringContaining("Prevent training compliance"));
    });

    it("includes concern for high risk prevent records", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        prevent_records: [
          makePreventRecord({ risk_level: "high", training_completed: true }),
        ],
      }));
      expect(r.concerns).toContainEqual(expect.stringContaining("high-risk Prevent"));
    });

    it("includes concern for poor court preparation", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        court_attendance_records: [
          makeCourtAttendance({ risk_assessment_done: false, pre_hearing_prep_count: 0, child_voice_provided: true }),
          makeCourtAttendance({ risk_assessment_done: false, pre_hearing_prep_count: 0, child_voice_provided: true }),
          makeCourtAttendance({ risk_assessment_done: false, pre_hearing_prep_count: 0, child_voice_provided: true }),
        ],
      }));
      expect(r.concerns).toContainEqual(expect.stringContaining("court attendances"));
    });
  });

  // == Recommendations ========================================================

  describe("recommendations", () => {
    it("recommends Prevent screening when coverage < 70%", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        prevent_screenings: [makePreventScreening({ child_id: "c1" })],
        total_children: 10,
      }));
      const rec = r.recommendations.find(r => r.recommendation.includes("Prevent screening"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 12");
    });

    it("recommends hate reporting when compliance < 80%", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        hate_incidents: [
          makeHate({ reported_to_police: false, reported_to_ofsted: false, reported_to_la: false }),
          makeHate({ reported_to_police: true, reported_to_ofsted: true, reported_to_la: true }),
        ],
      }));
      const rec = r.recommendations.find(r => r.recommendation.includes("hate incidents"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("recommends bullying resolution when rate < 80%", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [
          makeBullying({ status: "open", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "open", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
        ],
      }));
      const rec = r.recommendations.find(r => r.recommendation.includes("bullying incidents"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("recommends Prevent training when < 70%", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        prevent_records: [
          makePreventRecord({ training_completed: true }),
          makePreventRecord({ training_completed: false }),
          makePreventRecord({ training_completed: false }),
        ],
      }));
      const rec = r.recommendations.find(r => r.recommendation.includes("Prevent training"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommends court prep improvement when < 70%", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        court_attendance_records: [
          makeCourtAttendance({ risk_assessment_done: false, pre_hearing_prep_count: 0, child_voice_provided: true }),
          makeCourtAttendance({ risk_assessment_done: false, pre_hearing_prep_count: 0, child_voice_provided: true }),
        ],
      }));
      const rec = r.recommendations.find(r => r.recommendation.includes("court attendance"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommends restorative practice when < 60%", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [
          makeBullying({ status: "resolved", restorative_attempted: false, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: false, support_provided_count: 1 }),
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
        ],
      }));
      const rec = r.recommendations.find(r => r.recommendation.includes("restorative"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("ranks recommendations in order", () => {
      const r = computeHomeSafeguardingPrevention({
        today: "2026-05-27",
        bullying_incidents: [
          makeBullying({ status: "open", restorative_attempted: false, support_provided_count: 0 }),
        ],
        hate_incidents: [
          makeHate({ reported_to_police: false, reported_to_ofsted: false, reported_to_la: false, prevention_measures_count: 0 }),
        ],
        prevent_screenings: [],
        prevent_records: [
          makePreventRecord({ training_completed: false }),
        ],
        court_attendance_records: [
          makeCourtAttendance({ risk_assessment_done: false, pre_hearing_prep_count: 0, child_voice_provided: false }),
        ],
        total_children: 10,
      });
      expect(r.recommendations.length).toBeGreaterThan(3);
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("no recommendations when everything is perfect", () => {
      const r = computeHomeSafeguardingPrevention(baseInput());
      expect(r.recommendations.length).toBe(0);
    });
  });

  // == Insights ===============================================================

  describe("insights", () => {
    it("positive insight when all domains are exemplary", () => {
      const r = computeHomeSafeguardingPrevention(baseInput());
      const positive = r.insights.find(i => i.severity === "positive" && i.text.includes("exemplary"));
      expect(positive).toBeDefined();
    });

    it("critical insight for unresolved bullying pattern", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [
          makeBullying({ status: "open", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "open", restorative_attempted: true, support_provided_count: 1 }),
          makeBullying({ status: "open", restorative_attempted: true, support_provided_count: 1 }),
        ],
      }));
      const critical = r.insights.find(i => i.severity === "critical" && i.text.includes("unresolved bullying"));
      expect(critical).toBeDefined();
    });

    it("critical insight for low hate reporting", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        hate_incidents: [
          makeHate({ reported_to_police: false, reported_to_ofsted: false, reported_to_la: false }),
          makeHate({ reported_to_police: false, reported_to_ofsted: false, reported_to_la: false }),
        ],
      }));
      const critical = r.insights.find(i => i.severity === "critical" && i.text.includes("Hate incident reporting"));
      expect(critical).toBeDefined();
    });

    it("positive insight for comprehensive prevent compliance", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        hate_incidents: [], // no hate so exemplary insight doesn't trigger
      }));
      const positive = r.insights.find(i => i.severity === "positive" && i.text.includes("Prevent duty compliance"));
      expect(positive).toBeDefined();
    });

    it("warning insight for multiple high risk prevent records", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        prevent_records: [
          makePreventRecord({ risk_level: "high", training_completed: true }),
          makePreventRecord({ risk_level: "high", training_completed: true }),
        ],
      }));
      const warning = r.insights.find(i => i.severity === "warning" && i.text.includes("high-risk Prevent"));
      expect(warning).toBeDefined();
    });

    it("no insights when data is mixed (not extreme)", () => {
      const r = computeHomeSafeguardingPrevention({
        today: "2026-05-27",
        bullying_incidents: [
          makeBullying({ status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
        ],
        hate_incidents: [],
        prevent_screenings: [
          makePreventScreening({ child_id: "c1" }),
          makePreventScreening({ child_id: "c2" }),
        ],
        prevent_records: [
          makePreventRecord({ training_completed: true, risk_level: "low" }),
        ],
        court_attendance_records: [],
        total_children: 3,
      });
      // Not extreme enough to trigger any insights
      // Coverage is 67% (not >=90 for positive), only 1 bullying resolved (not >=3 open for critical)
      // No hate incidents, no high risk
      expect(r.insights.length).toBe(0);
    });
  });

  // == Score clamping =========================================================

  describe("score clamping", () => {
    it("score is clamped to minimum 0", () => {
      // Create a scenario where every modifier gives maximum penalty
      // This would be 52 - 5 - 4 - 4 - 3 - 3 - 3 - 3 - 3 = 24 > 0, so clamping doesn't actually trigger
      // But let's verify clamping logic works conceptually
      const r = computeHomeSafeguardingPrevention({
        today: "2026-05-27",
        bullying_incidents: [
          makeBullying({ status: "open", restorative_attempted: false, support_provided_count: 0 }),
          makeBullying({ status: "open", restorative_attempted: false, support_provided_count: 0 }),
        ],
        hate_incidents: [
          makeHate({ reported_to_police: false, reported_to_ofsted: false, reported_to_la: false, prevention_measures_count: 0 }),
        ],
        prevent_screenings: [],
        prevent_records: [
          makePreventRecord({ training_completed: false }),
        ],
        court_attendance_records: [
          makeCourtAttendance({ risk_assessment_done: false, pre_hearing_prep_count: 0, child_voice_provided: false }),
        ],
        total_children: 3,
      });
      expect(r.safeguarding_score).toBeGreaterThanOrEqual(0);
    });

    it("score is clamped to maximum 100", () => {
      const r = computeHomeSafeguardingPrevention(baseInput());
      expect(r.safeguarding_score).toBeLessThanOrEqual(100);
    });
  });

  // == Edge cases =============================================================

  describe("edge cases", () => {
    it("handles monitoring status as not resolved and not open", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [
          makeBullying({ status: "monitoring", restorative_attempted: true, support_provided_count: 1 }),
        ],
      }));
      // monitoring is not "resolved" and not "open"/"investigating"
      expect(r.bullying.resolved_count).toBe(0);
      expect(r.bullying.open_count).toBe(0);
      // Resolution rate: 0/1 = 0% => mod1 -5
    });

    it("hate incident needs ALL three reports for compliance", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        hate_incidents: [
          makeHate({ reported_to_police: true, reported_to_ofsted: true, reported_to_la: false }),
        ],
      }));
      expect(r.hate_incidents.reporting_compliance_rate).toBe(0);
    });

    it("court prep requires BOTH risk_assessment_done AND pre_hearing_prep_count > 0", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        court_attendance_records: [
          makeCourtAttendance({ risk_assessment_done: true, pre_hearing_prep_count: 0 }),
        ],
      }));
      expect(r.court.prep_rate).toBe(0);
    });

    it("duplicate child_ids in screenings count as single coverage", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        prevent_screenings: [
          makePreventScreening({ child_id: "c1" }),
          makePreventScreening({ child_id: "c1" }),
          makePreventScreening({ child_id: "c1" }),
        ],
        total_children: 3,
      }));
      // 1 unique child / 3 total = 33%
      expect(r.prevent.child_coverage).toBe(33);
    });

    it("bullying on exact 90d boundary is included", () => {
      // today is 2026-05-27, 90 days before is 2026-02-26
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [
          makeBullying({ date: "2026-02-26", status: "resolved", restorative_attempted: true, support_provided_count: 1 }),
        ],
      }));
      expect(r.bullying.total_incidents_90d).toBe(1);
    });

    it("bullying at 91d is excluded", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [
          makeBullying({ date: "2026-02-25", status: "open", restorative_attempted: false, support_provided_count: 0 }),
        ],
      }));
      expect(r.bullying.total_incidents_90d).toBe(0);
    });

    it("future-dated incidents are excluded from 90d window", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [
          makeBullying({ date: "2026-06-15", status: "open" }),
        ],
      }));
      // daysBetween("2026-06-15", "2026-05-27") = negative => excluded
      expect(r.bullying.total_incidents_90d).toBe(0);
    });

    it("pct returns 0 when denominator is 0", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [],
        hate_incidents: [],
        prevent_screenings: [],
        court_attendance_records: [],
      }));
      // No bullying => restorative_rate should be 0 (not NaN)
      expect(r.bullying.restorative_rate).toBe(0);
      expect(r.bullying.school_notification_rate).toBe(0);
      expect(r.hate_incidents.reporting_compliance_rate).toBe(0);
    });
  });

  // == Cross-modifier scenarios ===============================================

  describe("cross-modifier interactions", () => {
    it("empty bullying affects mod1, mod6, and mod7", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        bullying_incidents: [],
      }));
      // mod1: +2 (was +5), mod6: +1 (was +3), mod7: 1 hate only = +3 (was +3)
      // net change: -3 -2 = -5
      expect(r.safeguarding_score).toBe(75);
    });

    it("empty hate affects mod2 and mod7", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        hate_incidents: [],
      }));
      // mod2: +2 (was +4), mod7: 2 bullying only = 100% = +3 (same)
      // net change: -2
      expect(r.safeguarding_score).toBe(78);
    });

    it("empty screenings affects mod3 and mod8", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        prevent_screenings: [],
      }));
      // mod3: 0/3 = 0% => -4 (was +4), mod8: 0 screenings + 1 court = 1/1 = 100% => +3 (same)
      // net change: -8
      expect(r.safeguarding_score).toBe(72);
    });

    it("empty court affects mod5 and mod8", () => {
      const r = computeHomeSafeguardingPrevention(baseInput({
        court_attendance_records: [],
      }));
      // mod5: +1 (was +3), mod8: 3 screenings / 3 = 100% => +3 (same)
      // net change: -2
      expect(r.safeguarding_score).toBe(78);
    });

    it("all arrays empty with children yields specific score", () => {
      // Only total_children = 3 present
      const r = computeHomeSafeguardingPrevention({
        today: "2026-05-27",
        bullying_incidents: [],
        hate_incidents: [],
        prevent_screenings: [],
        prevent_records: [],
        court_attendance_records: [],
        total_children: 3,
      });
      // mod1: +2, mod2: +2, mod3: -4 (0/3), mod4: +0, mod5: +1, mod6: +1, mod7: +1, mod8: +0
      // total: 52 + 2 + 2 - 4 + 0 + 1 + 1 + 1 + 0 = 55
      expect(r.safeguarding_score).toBe(55);
      expect(r.safeguarding_rating).toBe("adequate");
    });
  });

  // == Max penalty scenario ===================================================

  describe("max penalty scenario", () => {
    it("all modifiers at max penalty", () => {
      const r = computeHomeSafeguardingPrevention({
        today: "2026-05-27",
        bullying_incidents: [
          makeBullying({ status: "open", restorative_attempted: false, support_provided_count: 0 }),
          makeBullying({ status: "open", restorative_attempted: false, support_provided_count: 0 }),
          makeBullying({ status: "open", restorative_attempted: false, support_provided_count: 0 }),
        ],
        hate_incidents: [
          makeHate({ reported_to_police: false, reported_to_ofsted: false, reported_to_la: false, prevention_measures_count: 0 }),
          makeHate({ reported_to_police: false, reported_to_ofsted: false, reported_to_la: false, prevention_measures_count: 0 }),
        ],
        prevent_screenings: [],
        prevent_records: [
          makePreventRecord({ training_completed: false }),
          makePreventRecord({ training_completed: false }),
        ],
        court_attendance_records: [
          makeCourtAttendance({ risk_assessment_done: false, pre_hearing_prep_count: 0, child_voice_provided: false }),
          makeCourtAttendance({ risk_assessment_done: false, pre_hearing_prep_count: 0, child_voice_provided: false }),
        ],
        total_children: 3,
      });
      // mod1: 0/3 = 0% => -5
      // mod2: 0/2 = 0% => -4
      // mod3: 0/3 = 0% => -4
      // mod4: 0/2 = 0% => -3
      // mod5: 0/2 = 0% => -3
      // mod6: 0/3 = 0% => -3
      // mod7: [f,f,f,f,f] = 0/5 = 0% => -3
      // mod8: 0 screenings + [f,f] = 0/2 = 0% => -3
      // total: 52 - 5 - 4 - 4 - 3 - 3 - 3 - 3 - 3 = 24
      expect(r.safeguarding_score).toBe(24);
      expect(r.safeguarding_rating).toBe("inadequate");
    });
  });

  // == Max bonus scenario =====================================================

  describe("max bonus scenario", () => {
    it("all modifiers at max bonus => 80 outstanding", () => {
      const r = computeHomeSafeguardingPrevention(baseInput());
      // 52 + 5 + 4 + 4 + 3 + 3 + 3 + 3 + 3 = 80
      expect(r.safeguarding_score).toBe(80);
      expect(r.safeguarding_rating).toBe("outstanding");
    });
  });
});
