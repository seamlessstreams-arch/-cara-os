import { describe, it, expect } from "vitest";
import { computeStaffWellbeing } from "../staff-wellbeing-intelligence-engine";
import { computeRotaIntelligence } from "../rota-intelligence-engine";
import { computeBehaviourIntelligence } from "../behaviour-intelligence-engine";

// ══════════════════════════════════════════════════════════════════════════════
// Word-boundary regressions — three engines matched free-text keywords by
// SUBSTRING (`.includes()`), producing false signals. These pin the fixed
// behaviour through the public compute functions:
//   • "distressed"            must NOT count as a stress-related absence
//   • "the situation escalated" must NOT count as de-escalation attempted
//   • "interagency meeting"   must NOT count as an agency-staff shift
// ══════════════════════════════════════════════════════════════════════════════

const TODAY = "2026-07-12";

// ── staff-wellbeing: stress-related sickness classification ───────────────────

function wellbeingWithReason(reason: string) {
  return computeStaffWellbeing({
    today: TODAY,
    home_name: "Oak House",
    staff: [
      {
        id: "s1",
        name: "Jane Smith",
        role: "Residential Care Worker",
        start_date: "2024-01-01",
        contracted_hours: 37.5,
        is_active: true,
      },
    ],
    shifts: [],
    leave_requests: [],
    supervisions: [],
    sickness_records: [
      {
        staff_id: "s1",
        date_started: "2026-06-20",
        date_ended: "2026-06-22",
        total_days: 3,
        category: "physical", // category alone must not trigger; only the reason text
        reason,
        rtw_status: "completed",
        occupational_health_referral: false,
        trigger_points: [],
      },
    ],
    wellbeing_checks: [],
    debrief_records: [],
    recognition_records: [],
    grievance_records: [],
    incidents: [],
  });
}

describe("staff-wellbeing — stress keyword is word-boundaried", () => {
  it('"caring for a distressed relative" is NOT stress-related', () => {
    const r = wellbeingWithReason("Absent caring for a distressed relative");
    expect(r.sickness_analysis.stress_related_pct).toBe(0);
  });

  it('"work stress" IS stress-related', () => {
    const r = wellbeingWithReason("Signed off with work stress");
    expect(r.sickness_analysis.stress_related_pct).toBe(100);
  });

  it('"feeling anxious" IS stress-related (word form covered)', () => {
    const r = wellbeingWithReason("Feeling anxious about return");
    expect(r.sickness_analysis.stress_related_pct).toBe(100);
  });
});

// ── rota: agency-shift detection ───────────────────────────────────────────────

function rotaWithNote(notes: string) {
  return computeRotaIntelligence({
    shifts: [
      {
        id: "sh1",
        staff_id: "staff_a",
        date: TODAY,
        shift_type: "day",
        start_time: "08:00",
        end_time: "17:00",
        break_minutes: 60,
        overtime_minutes: 0,
        status: "completed",
        is_open_shift: false,
        notes,
      },
    ],
    absences: [],
    staff: [{ id: "staff_a", name: "Anna" }],
    today: TODAY,
  });
}

describe("rota — agency keyword is word-boundaried", () => {
  it('"interagency meeting held" is NOT an agency shift', () => {
    expect(rotaWithNote("interagency meeting held on shift").overview.agency_shifts).toBe(0);
  });

  it('"Agency cover for the night" IS an agency shift', () => {
    expect(rotaWithNote("Agency cover for the night").overview.agency_shifts).toBe(1);
  });
});

// ── behaviour: physical-intervention debrief / de-escalation flags ─────────────

function behaviourWithPi(description: string, immediateAction: string) {
  return computeBehaviourIntelligence({
    behaviourEntries: [],
    incidents: [
      {
        id: "inc1",
        child_id: "yp1",
        date: TODAY,
        time: "18:00",
        type: "physical_intervention",
        severity: "high",
        description,
        immediate_action: immediateAction,
        status: "closed",
        body_map_completed: false,
        reported_by: "s1",
      },
    ],
    restraints: [],
    sanctionRewards: [],
    today: TODAY,
  });
}

describe("behaviour — de-escalation/debrief keywords are word-boundaried", () => {
  it('"the situation escalated" is NOT de-escalation attempted', () => {
    const r = behaviourWithPi("The situation escalated quickly in the lounge", "Staff supported Alex");
    expect(r.pi_entries[0]?.de_escalation_attempted).toBe(false);
  });

  it('"staff de-escalated" IS de-escalation attempted (hyphen form)', () => {
    const r = behaviourWithPi("Staff de-escalated before any hold", "Verbal reassurance");
    expect(r.pi_entries[0]?.de_escalation_attempted).toBe(true);
  });

  it('"attempted verbal redirection" IS de-escalation attempted', () => {
    const r = behaviourWithPi("Staff attempted verbal redirection first", "Support given");
    expect(r.pi_entries[0]?.de_escalation_attempted).toBe(true);
  });

  it('"debriefing held afterwards" IS debriefed (suffix form now covered)', () => {
    const r = behaviourWithPi("A debriefing was held with staff afterwards", "Support");
    expect(r.pi_entries[0]?.debriefed).toBe(true);
  });
});
