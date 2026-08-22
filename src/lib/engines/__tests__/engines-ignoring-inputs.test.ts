// ══════════════════════════════════════════════════════════════════════════════
// Three engines were handed a collection by their route and never read it.
//
// In each case the input type was declared, the route mapped real records into
// it, the engine destructured it — and nothing consumed it. The engines each
// promise the missing dimension in their own header, so these were unfinished
// wiring rather than deliberate scope:
//
//   rota-intelligence          "analyses shift coverage, staffing levels,
//                               ABSENCE, overtime, and agency usage"
//   staff-wellbeing            burnout assessment with no read of leave — the
//                               one signal that says whether someone stops
//   risk-intelligence-dashboard significant_events, promised as unified into
//                               the risk landscape
//
// Each test below asserts the OUTPUT changes when the ignored collection is
// populated, so a regression that stopped reading it would fail rather than
// quietly returning the same answer.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeRotaIntelligence,
  type ShiftInput,
  type AbsenceInput,
  type StaffRef,
} from "../rota-intelligence-engine";

const TODAY = "2026-05-25";
const STAFF: StaffRef[] = [
  { id: "staff_darren", name: "Darren" },
  { id: "staff_ryan", name: "Ryan" },
];

let n = 0;
function shift(overrides: Partial<ShiftInput> = {}): ShiftInput {
  n++;
  return {
    id: `s_${n}`, staff_id: "staff_darren", date: TODAY, shift_type: "day",
    start_time: "08:00", end_time: "17:00", break_minutes: 60,
    overtime_minutes: 0, status: "scheduled", is_open_shift: false, notes: null,
    ...overrides,
  };
}
function absence(overrides: Partial<AbsenceInput> = {}): AbsenceInput {
  return {
    id: "a_1", staff_id: "staff_darren", start_date: TODAY, end_date: TODAY,
    type: "sickness", return_to_work_completed: true, ...overrides,
  };
}

describe("rota intelligence reads absence", () => {
  it("flags someone rostered on a day their absence covers", () => {
    const result = computeRotaIntelligence({
      shifts: [shift({ staff_id: "staff_darren", date: TODAY })],
      absences: [absence({ staff_id: "staff_darren", start_date: TODAY, end_date: TODAY })],
      staff: STAFF,
      today: TODAY,
    });

    const conflict = result.alerts.find((a) => a.message.includes("recorded absent"));
    expect(conflict, "a shift that cannot be worked must be alerted").toBeTruthy();
    expect(conflict?.severity).toBe("critical"); // today
    expect(conflict?.message).toContain("Darren");
  });

  it("says nothing when the absence does not cover the shift", () => {
    const result = computeRotaIntelligence({
      shifts: [shift({ date: TODAY })],
      absences: [absence({ start_date: "2026-06-10", end_date: "2026-06-12" })],
      staff: STAFF,
      today: TODAY,
    });

    expect(result.alerts.some((a) => a.message.includes("recorded absent"))).toBe(false);
  });

  it("counts return-to-work discussions still outstanding", () => {
    const result = computeRotaIntelligence({
      shifts: [],
      absences: [
        absence({ id: "a_1", end_date: "2026-05-01", return_to_work_completed: false }),
        absence({ id: "a_2", end_date: "2026-05-02", return_to_work_completed: false }),
        absence({ id: "a_3", end_date: "2026-05-03", return_to_work_completed: true }),
      ],
      staff: STAFF,
      today: TODAY,
    });

    const rtw = result.alerts.find((a) => a.message.includes("return-to-work"));
    expect(rtw?.message).toContain("2");
  });

  it("stays silent on an empty absence list", () => {
    const result = computeRotaIntelligence({
      shifts: [shift()], absences: [], staff: STAFF, today: TODAY,
    });

    expect(result.alerts.some((a) => a.message.includes("recorded absent"))).toBe(false);
    expect(result.alerts.some((a) => a.message.includes("return-to-work"))).toBe(false);
  });
});

// ── Staff wellbeing: leave ──────────────────────────────────────────────────

import {
  computeStaffWellbeing,
  type StaffWellbeingInput,
  type LeaveRequestInput,
} from "../staff-wellbeing-intelligence-engine";

function wellbeingInput(
  leave: LeaveRequestInput[],
  startDate = "2024-01-01", // long tenure, so "no leave in 6 months" applies
): StaffWellbeingInput {
  return {
    today: TODAY,
    home_name: "Oak House",
    staff: [{ id: "staff_darren", name: "Darren", role: "registered_manager", start_date: startDate, contracted_hours: 37.5, is_active: true }],
    shifts: [],
    leave_requests: leave,
    supervisions: [],
    sickness_records: [],
    wellbeing_checks: [],
    debrief_records: [],
    recognition_records: [],
    grievance_records: [],
    incidents: [],
  };
}
function leave(overrides: Partial<LeaveRequestInput> = {}): LeaveRequestInput {
  return {
    staff_id: "staff_darren", leave_type: "annual",
    start_date: "2026-04-01", end_date: "2026-04-05",
    total_days: 5, status: "approved", ...overrides,
  };
}

describe("staff wellbeing reads leave", () => {
  const factors = (input: StaffWellbeingInput) => {
    const p = computeStaffWellbeing(input).staff_profiles[0];
    return { risk: p.risk_factors, protective: p.protective_factors };
  };

  it("treats leave actually taken as protective", () => {
    const { protective } = factors(wellbeingInput([leave()]));
    expect(protective.some((f) => f.includes("leave taken"))).toBe(true);
  });

  it("treats a long stretch with no leave as a risk", () => {
    const { risk } = factors(wellbeingInput([]));
    expect(risk).toContain("No leave taken in 6 months");
  });

  it("does not call a new starter's lack of leave a risk", () => {
    // Two months in post: no leave yet is ordinary, not a burnout signal.
    const { risk } = factors(wellbeingInput([], "2026-03-20"));
    expect(risk).not.toContain("No leave taken in 6 months");
  });

  it("counts booked leave ahead as protective", () => {
    const { protective } = factors(
      wellbeingInput([leave({ start_date: "2026-07-01", end_date: "2026-07-10" })]),
    );
    expect(protective).toContain("Leave booked ahead");
  });

  it("ignores leave that was never approved", () => {
    const { risk } = factors(wellbeingInput([leave({ status: "pending" })]));
    expect(risk).toContain("No leave taken in 6 months");
  });
});

// ── Risk dashboard: significant events ──────────────────────────────────────

import {
  computeRiskIntelligenceDashboard,
  type RiskIntelligenceDashboardInput,
  type SignificantEventInput,
} from "../risk-intelligence-dashboard-engine";

function riskInput(events: SignificantEventInput[]): RiskIntelligenceDashboardInput {
  return {
    today: TODAY,
    children: [{ id: "yp_alex", name: "Alex" }],
    risk_assessments: [],
    exploitation_screenings: [],
    missing_episodes: [],
    incidents: [],
    restraints: [],
    significant_events: events,
  };
}
function event(overrides: Partial<SignificantEventInput> = {}): SignificantEventInput {
  return {
    id: "se_1", child_id: "yp_alex", child_name: "Alex",
    date: "2026-05-20", category: "safeguarding", significance: "significant",
    ...overrides,
  };
}
const flagsFor = (events: SignificantEventInput[]) =>
  computeRiskIntelligenceDashboard(riskInput(events)).child_profiles[0]?.flags ?? [];

describe("risk dashboard reads significant events", () => {
  it("flags a critical event in the last 90 days", () => {
    expect(flagsFor([event({ significance: "critical" })])).toContain("critical_significant_event");
  });

  it("flags a cluster of non-routine events", () => {
    expect(
      flagsFor([
        event({ id: "a", significance: "significant" }),
        event({ id: "b", significance: "significant" }),
        event({ id: "c", significance: "critical" }),
      ]),
    ).toContain("repeat_significant_events");
  });

  it("does not count routine events towards the cluster", () => {
    expect(
      flagsFor([
        event({ id: "a", significance: "routine" }),
        event({ id: "b", significance: "routine" }),
        event({ id: "c", significance: "routine" }),
      ]),
    ).not.toContain("repeat_significant_events");
  });

  it("ignores events outside the 90-day window", () => {
    expect(flagsFor([event({ date: "2025-01-01", significance: "critical" })]))
      .not.toContain("critical_significant_event");
  });

  it("adds no flags when there are no events", () => {
    expect(flagsFor([])).not.toContain("critical_significant_event");
  });
});
