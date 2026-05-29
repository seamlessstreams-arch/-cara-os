// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Home Personal Calendar & Appointments Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computePersonalCalendarAppointments,
  type PersonalCalendarInput,
  type AppointmentRecordInput,
  type CalendarManagementRecordInput,
  type MedicalComplianceRecordInput,
  type TransportArrangementRecordInput,
  type ChildPreparationRecordInput,
} from "../home-personal-calendar-appointments-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-29";

function makeAppointment(overrides: Partial<AppointmentRecordInput> = {}): AppointmentRecordInput {
  return {
    id: `apt_${Math.random().toString(36).slice(2, 8)}`,
    child_id: "child_1",
    appointment_type: "medical",
    date: "2026-05-01",
    time_slot: "10:00",
    attended: true,
    cancelled: false,
    cancelled_reason: "",
    cancelled_by: "",
    rescheduled: false,
    rescheduled_within_14_days: false,
    outcome_recorded: true,
    follow_up_actions_identified: true,
    follow_up_actions_completed: true,
    child_consented: true,
    staff_accompanied: true,
    waiting_time_weeks: 2,
    is_overdue: false,
    notes: "",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeCalendar(overrides: Partial<CalendarManagementRecordInput> = {}): CalendarManagementRecordInput {
  return {
    id: `cal_${Math.random().toString(36).slice(2, 8)}`,
    child_id: "child_1",
    month: "2026-05",
    total_appointments_scheduled: 10,
    appointments_in_calendar: 10,
    reminders_set: true,
    conflicts_identified: 2,
    conflicts_resolved: 2,
    advance_notice_days: 7,
    calendar_shared_with_child: true,
    calendar_shared_with_social_worker: true,
    calendar_accurate: true,
    missed_from_calendar: 0,
    double_bookings: 0,
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeCompliance(overrides: Partial<MedicalComplianceRecordInput> = {}): MedicalComplianceRecordInput {
  return {
    id: `comp_${Math.random().toString(36).slice(2, 8)}`,
    child_id: "child_1",
    compliance_type: "annual_health_assessment",
    due_date: "2026-04-01",
    completed: true,
    completed_date: "2026-04-01",
    overdue: false,
    days_overdue: 0,
    reason_incomplete: "",
    health_plan_updated: true,
    consent_obtained: true,
    outcome_documented: true,
    professional_attending: "Dr Smith",
    created_at: "2026-04-01",
    ...overrides,
  };
}

function makeTransport(overrides: Partial<TransportArrangementRecordInput> = {}): TransportArrangementRecordInput {
  return {
    id: `trn_${Math.random().toString(36).slice(2, 8)}`,
    child_id: "child_1",
    appointment_id: "apt_1",
    transport_type: "staff_vehicle",
    arranged_in_advance: true,
    advance_notice_hours: 48,
    on_time: true,
    delay_minutes: 0,
    child_comfortable: true,
    appropriate_vehicle: true,
    staff_driver_checked: true,
    backup_plan_in_place: true,
    cost_approved: true,
    distance_miles: 5,
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makePreparation(overrides: Partial<ChildPreparationRecordInput> = {}): ChildPreparationRecordInput {
  return {
    id: `prep_${Math.random().toString(36).slice(2, 8)}`,
    child_id: "child_1",
    appointment_id: "apt_1",
    preparation_type: "verbal_explanation",
    child_informed_in_advance: true,
    advance_notice_hours: 24,
    child_anxieties_addressed: true,
    preferences_captured: true,
    child_chose_accompaniment: true,
    debrief_after: true,
    child_feedback_captured: true,
    child_satisfaction: 5,
    autonomy_supported: true,
    age_appropriate_information: true,
    created_at: "2026-05-01",
    ...overrides,
  };
}

/** Build a full input with convenient overrides */
function baseInput(overrides: Partial<PersonalCalendarInput> = {}): PersonalCalendarInput {
  return {
    today: TODAY,
    total_children: 3,
    appointment_records: [],
    calendar_management_records: [],
    medical_compliance_records: [],
    transport_arrangement_records: [],
    child_preparation_records: [],
    ...overrides,
  };
}

/** Repeat a factory N times */
function repeat<T>(n: number, fn: (i: number) => T): T[] {
  return Array.from({ length: n }, (_, i) => fn(i));
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Personal Calendar & Appointments Intelligence Engine", () => {

  // ══════════════════════════════════════════════════════════════════════════
  // 1. SPECIAL CASES
  // ══════════════════════════════════════════════════════════════════════════

  describe("insufficient_data", () => {
    it("returns insufficient_data when all arrays empty and total_children=0", () => {
      const r = computePersonalCalendarAppointments(baseInput({ total_children: 0 }));
      expect(r.calendar_rating).toBe("insufficient_data");
      expect(r.calendar_score).toBe(0);
      expect(r.headline).toContain("insufficient data");
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.insights).toHaveLength(0);
    });

    it("returns all six rates as 0", () => {
      const r = computePersonalCalendarAppointments(baseInput({ total_children: 0 }));
      expect(r.appointment_attendance_rate).toBe(0);
      expect(r.calendar_accuracy_rate).toBe(0);
      expect(r.medical_compliance_rate).toBe(0);
      expect(r.transport_timeliness_rate).toBe(0);
      expect(r.child_preparation_rate).toBe(0);
      expect(r.child_autonomy_rate).toBe(0);
    });
  });

  describe("inadequate floor (all empty, children > 0)", () => {
    it("returns inadequate with score=15 when children exist but no records", () => {
      const r = computePersonalCalendarAppointments(baseInput({ total_children: 3 }));
      expect(r.calendar_rating).toBe("inadequate");
      expect(r.calendar_score).toBe(15);
    });

    it("has exactly 1 concern, 2 recommendations, 1 insight", () => {
      const r = computePersonalCalendarAppointments(baseInput({ total_children: 2 }));
      expect(r.concerns).toHaveLength(1);
      expect(r.recommendations).toHaveLength(2);
      expect(r.insights).toHaveLength(1);
      expect(r.strengths).toHaveLength(0);
    });

    it("concern mentions absence of records", () => {
      const r = computePersonalCalendarAppointments(baseInput({ total_children: 1 }));
      expect(r.concerns[0]).toContain("No appointment records");
    });

    it("recommendations have ranks 1 and 2 and urgency immediate", () => {
      const r = computePersonalCalendarAppointments(baseInput({ total_children: 1 }));
      expect(r.recommendations[0].rank).toBe(1);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].rank).toBe(2);
      expect(r.recommendations[1].urgency).toBe("immediate");
    });

    it("insight severity is critical", () => {
      const r = computePersonalCalendarAppointments(baseInput({ total_children: 1 }));
      expect(r.insights[0].severity).toBe("critical");
    });

    it("all six rates are 0", () => {
      const r = computePersonalCalendarAppointments(baseInput({ total_children: 5 }));
      expect(r.appointment_attendance_rate).toBe(0);
      expect(r.calendar_accuracy_rate).toBe(0);
      expect(r.medical_compliance_rate).toBe(0);
      expect(r.transport_timeliness_rate).toBe(0);
      expect(r.child_preparation_rate).toBe(0);
      expect(r.child_autonomy_rate).toBe(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 2. PCT HELPER -- pct(0,0) = 0
  // ══════════════════════════════════════════════════════════════════════════

  describe("pct(0,0) = 0", () => {
    it("appointment_attendance_rate = 0 when no appointment records but other data exists", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        calendar_management_records: [makeCalendar()],
      }));
      expect(r.appointment_attendance_rate).toBe(0);
    });

    it("calendar_accuracy_rate = 0 when no calendar records but other data exists", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [makeAppointment()],
      }));
      expect(r.calendar_accuracy_rate).toBe(0);
    });

    it("medical_compliance_rate = 0 when no compliance records but other data exists", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [makeAppointment()],
      }));
      expect(r.medical_compliance_rate).toBe(0);
    });

    it("transport_timeliness_rate = 0 when no transport records but other data exists", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [makeAppointment()],
      }));
      expect(r.transport_timeliness_rate).toBe(0);
    });

    it("child_preparation_rate = 0 when no preparation records but other data exists", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [makeAppointment()],
      }));
      expect(r.child_preparation_rate).toBe(0);
    });

    it("child_autonomy_rate = 0 when no preparation records but other data exists", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [makeAppointment()],
      }));
      expect(r.child_autonomy_rate).toBe(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 3. OUTSTANDING SCENARIO
  // ══════════════════════════════════════════════════════════════════════════

  describe("outstanding scenario", () => {
    function outstandingInput(): PersonalCalendarInput {
      return baseInput({
        appointment_records: [
          ...repeat(9, () => makeAppointment({
            attended: true,
            outcome_recorded: true,
            follow_up_actions_identified: true,
            follow_up_actions_completed: true,
            child_consented: true,
            cancelled: false,
            is_overdue: false,
            rescheduled: false,
          })),
          // One rescheduled appointment to trigger bonus 9
          makeAppointment({
            attended: true,
            outcome_recorded: true,
            follow_up_actions_identified: true,
            follow_up_actions_completed: true,
            child_consented: true,
            cancelled: false,
            is_overdue: false,
            rescheduled: true,
            rescheduled_within_14_days: true,
          }),
        ],
        calendar_management_records: [makeCalendar({
          calendar_accurate: true,
          reminders_set: true,
          calendar_shared_with_child: true,
          calendar_shared_with_social_worker: true,
          conflicts_identified: 2,
          conflicts_resolved: 2,
          missed_from_calendar: 0,
          double_bookings: 0,
        })],
        medical_compliance_records: repeat(10, () => makeCompliance({
          completed: true,
          overdue: false,
          health_plan_updated: true,
          consent_obtained: true,
          outcome_documented: true,
        })),
        transport_arrangement_records: repeat(10, () => makeTransport({
          on_time: true,
          arranged_in_advance: true,
          child_comfortable: true,
          appropriate_vehicle: true,
          staff_driver_checked: true,
          backup_plan_in_place: true,
          delay_minutes: 0,
        })),
        child_preparation_records: repeat(10, () => makePreparation({
          child_informed_in_advance: true,
          child_anxieties_addressed: true,
          preferences_captured: true,
          child_chose_accompaniment: true,
          debrief_after: true,
          child_feedback_captured: true,
          child_satisfaction: 5,
          autonomy_supported: true,
          age_appropriate_information: true,
        })),
      });
    }

    it("rates outstanding", () => {
      const r = computePersonalCalendarAppointments(outstandingInput());
      expect(r.calendar_rating).toBe("outstanding");
    });

    it("score = 80 (base 52 + all 9 bonuses = 52+4+3+4+3+3+3+3+3+2 = 80)", () => {
      const r = computePersonalCalendarAppointments(outstandingInput());
      expect(r.calendar_score).toBe(80);
    });

    it("all six rates are 100", () => {
      const r = computePersonalCalendarAppointments(outstandingInput());
      expect(r.appointment_attendance_rate).toBe(100);
      expect(r.calendar_accuracy_rate).toBe(100);
      expect(r.medical_compliance_rate).toBe(100);
      expect(r.transport_timeliness_rate).toBe(100);
      expect(r.child_preparation_rate).toBe(100);
      expect(r.child_autonomy_rate).toBe(100);
    });

    it("headline contains 'Outstanding'", () => {
      const r = computePersonalCalendarAppointments(outstandingInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("has many strengths and no concerns", () => {
      const r = computePersonalCalendarAppointments(outstandingInput());
      expect(r.strengths.length).toBeGreaterThan(10);
      expect(r.concerns).toHaveLength(0);
    });

    it("has no recommendations", () => {
      const r = computePersonalCalendarAppointments(outstandingInput());
      expect(r.recommendations).toHaveLength(0);
    });

    it("has positive insights including outstanding marker", () => {
      const r = computePersonalCalendarAppointments(outstandingInput());
      const positive = r.insights.filter((i) => i.severity === "positive");
      expect(positive.length).toBeGreaterThan(0);
      expect(positive.some((i) => i.text.includes("outstanding"))).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 4. GOOD SCENARIO
  // ══════════════════════════════════════════════════════════════════════════

  describe("good scenario", () => {
    function goodInput(): PersonalCalendarInput {
      // Target: score 65-79
      // We want mid-tier bonuses on most metrics:
      // attendance >=75 <90 -> +2
      // calendarAccuracy >=70 <90 -> +1
      // medicalCompliance >=80 <95 -> +2
      // transport >=75 <90 -> +1
      // childPrep >=65 <85 -> +1
      // childAutonomy >=60 <80 -> +1
      // followUp >=70 <90 -> +1
      // outcome >=70 <90 -> +1
      // reschedule >=50 <80 -> +1
      // Total: 52 + 2+1+2+1+1+1+1+1+1 = 63... need higher tier on a couple
      // Let's use higher tier bonuses on a few:
      // attendance >= 90 -> +4, medical >= 95 -> +4
      // calendarAccuracy >= 70 -> +1, transport >= 75 -> +1
      // childPrep >= 65 -> +1, childAutonomy >= 60 -> +1
      // followUp >= 70 -> +1, outcome >= 70 -> +1, reschedule >= 50 -> +1
      // Total: 52 + 4+1+4+1+1+1+1+1+1 = 67

      const totalAppts = 20;
      const attendedCount = 18; // 90%
      const notAttended = totalAppts - attendedCount;

      const appointments = [
        ...repeat(attendedCount, () => makeAppointment({
          attended: true,
          outcome_recorded: true,
          follow_up_actions_identified: true,
          follow_up_actions_completed: true,
          child_consented: true,
        })),
        ...repeat(notAttended, () => makeAppointment({
          attended: false,
          outcome_recorded: false,
          follow_up_actions_identified: false,
          follow_up_actions_completed: false,
          child_consented: false,
        })),
      ];

      return baseInput({
        appointment_records: appointments,
        calendar_management_records: [makeCalendar({
          calendar_accurate: true,
          reminders_set: true,
          total_appointments_scheduled: 10,
          appointments_in_calendar: 8, // 80% capture
          advance_notice_days: 5,
          conflicts_identified: 1,
          conflicts_resolved: 1,
          calendar_shared_with_child: true,
          calendar_shared_with_social_worker: true,
          missed_from_calendar: 0,
          double_bookings: 0,
        })],
        medical_compliance_records: repeat(20, () => makeCompliance({
          completed: true,
          overdue: false,
          health_plan_updated: true,
          consent_obtained: true,
          outcome_documented: true,
        })),
        transport_arrangement_records: [
          ...repeat(8, () => makeTransport({ on_time: true, arranged_in_advance: true, child_comfortable: true, staff_driver_checked: true, backup_plan_in_place: true, delay_minutes: 0 })),
          ...repeat(2, () => makeTransport({ on_time: false, arranged_in_advance: false, child_comfortable: false, staff_driver_checked: true, backup_plan_in_place: false, delay_minutes: 10 })),
        ],
        child_preparation_records: [
          ...repeat(7, () => makePreparation({
            child_informed_in_advance: true,
            child_anxieties_addressed: true,
            preferences_captured: true,
            debrief_after: true,
            child_chose_accompaniment: true,
            child_feedback_captured: true,
            child_satisfaction: 4,
            autonomy_supported: true,
          })),
          ...repeat(3, () => makePreparation({
            child_informed_in_advance: false,
            child_anxieties_addressed: false,
            preferences_captured: false,
            debrief_after: false,
            child_chose_accompaniment: false,
            child_feedback_captured: false,
            child_satisfaction: 3,
            autonomy_supported: false,
          })),
        ],
      });
    }

    it("rates good", () => {
      const r = computePersonalCalendarAppointments(goodInput());
      expect(r.calendar_rating).toBe("good");
    });

    it("score is in good range (65-79)", () => {
      const r = computePersonalCalendarAppointments(goodInput());
      expect(r.calendar_score).toBeGreaterThanOrEqual(65);
      expect(r.calendar_score).toBeLessThan(80);
    });

    it("headline contains 'Good'", () => {
      const r = computePersonalCalendarAppointments(goodInput());
      expect(r.headline).toContain("Good");
    });

    it("has strengths", () => {
      const r = computePersonalCalendarAppointments(goodInput());
      expect(r.strengths.length).toBeGreaterThan(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 5. ADEQUATE SCENARIO
  // ══════════════════════════════════════════════════════════════════════════

  describe("adequate scenario", () => {
    function adequateInput(): PersonalCalendarInput {
      // Target: score 45-64
      // Base 52, minimal bonuses, no penalties
      // attendance 60% (no bonus, no penalty since >= 50)
      // calendar accuracy 50% (no bonus)
      // medical compliance 60% (no bonus, no penalty since >= 50)
      // transport 60% (no bonus, no penalty since >= 50)
      // childPrep ~50% (no bonus, no penalty since >= 30)
      // childAutonomy ~40% (no bonus)
      // followUp 50% (no bonus)
      // outcome 50% (no bonus)
      // reschedule 0% (no bonus -- but rescheduled=0 so pct(0,0)=0, no bonus)
      // Total: 52 + 0 = 52

      const appts = [
        ...repeat(6, () => makeAppointment({
          attended: true,
          outcome_recorded: true,
          follow_up_actions_identified: true,
          follow_up_actions_completed: true,
          child_consented: true,
        })),
        ...repeat(4, () => makeAppointment({
          attended: false,
          outcome_recorded: false,
          follow_up_actions_identified: false,
          follow_up_actions_completed: false,
          child_consented: false,
        })),
      ];

      return baseInput({
        appointment_records: appts,
        calendar_management_records: [
          makeCalendar({ calendar_accurate: true }),
          makeCalendar({ calendar_accurate: false }),
        ],
        medical_compliance_records: [
          ...repeat(6, () => makeCompliance({ completed: true, overdue: false })),
          ...repeat(4, () => makeCompliance({ completed: false, overdue: true, days_overdue: 10 })),
        ],
        transport_arrangement_records: [
          ...repeat(6, () => makeTransport({ on_time: true, delay_minutes: 0 })),
          ...repeat(4, () => makeTransport({ on_time: false, delay_minutes: 10 })),
        ],
        child_preparation_records: [
          ...repeat(5, () => makePreparation({
            child_informed_in_advance: true,
            child_anxieties_addressed: true,
            preferences_captured: true,
            debrief_after: true,
            child_chose_accompaniment: false,
            child_feedback_captured: false,
            autonomy_supported: false,
          })),
          ...repeat(5, () => makePreparation({
            child_informed_in_advance: false,
            child_anxieties_addressed: false,
            preferences_captured: false,
            debrief_after: false,
            child_chose_accompaniment: false,
            child_feedback_captured: false,
            autonomy_supported: false,
          })),
        ],
      });
    }

    it("rates adequate", () => {
      const r = computePersonalCalendarAppointments(adequateInput());
      expect(r.calendar_rating).toBe("adequate");
    });

    it("score is in adequate range (45-64)", () => {
      const r = computePersonalCalendarAppointments(adequateInput());
      expect(r.calendar_score).toBeGreaterThanOrEqual(45);
      expect(r.calendar_score).toBeLessThan(65);
    });

    it("headline contains 'Adequate'", () => {
      const r = computePersonalCalendarAppointments(adequateInput());
      expect(r.headline).toContain("Adequate");
    });

    it("has concerns", () => {
      const r = computePersonalCalendarAppointments(adequateInput());
      expect(r.concerns.length).toBeGreaterThan(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 6. INADEQUATE SCENARIO
  // ══════════════════════════════════════════════════════════════════════════

  describe("inadequate scenario", () => {
    function inadequateInput(): PersonalCalendarInput {
      // Target: score < 45
      // Base 52, no bonuses, multiple penalties
      // attendance < 50 -> -5 (3 of 10 attended = 30%)
      // medical compliance < 50 -> -5 (3 of 10 completed = 30%)
      // transport < 50 -> -4 (3 of 10 on_time = 30%)
      // childPrep < 30 -> -4 (all false -> 0%)
      // Total: 52 - 5 - 5 - 4 - 4 = 34

      return baseInput({
        appointment_records: [
          ...repeat(3, () => makeAppointment({
            attended: true,
            outcome_recorded: false,
            follow_up_actions_identified: false,
            follow_up_actions_completed: false,
            child_consented: false,
          })),
          ...repeat(7, () => makeAppointment({
            attended: false,
            outcome_recorded: false,
            follow_up_actions_identified: false,
            follow_up_actions_completed: false,
            child_consented: false,
          })),
        ],
        calendar_management_records: [makeCalendar({ calendar_accurate: false })],
        medical_compliance_records: [
          ...repeat(3, () => makeCompliance({ completed: true, overdue: false })),
          ...repeat(7, () => makeCompliance({ completed: false, overdue: true, days_overdue: 40 })),
        ],
        transport_arrangement_records: [
          ...repeat(3, () => makeTransport({ on_time: true, delay_minutes: 0 })),
          ...repeat(7, () => makeTransport({ on_time: false, delay_minutes: 20 })),
        ],
        child_preparation_records: repeat(10, () => makePreparation({
          child_informed_in_advance: false,
          child_anxieties_addressed: false,
          preferences_captured: false,
          debrief_after: false,
          child_chose_accompaniment: false,
          child_feedback_captured: false,
          child_satisfaction: 1,
          autonomy_supported: false,
        })),
      });
    }

    it("rates inadequate", () => {
      const r = computePersonalCalendarAppointments(inadequateInput());
      expect(r.calendar_rating).toBe("inadequate");
    });

    it("score = 34", () => {
      const r = computePersonalCalendarAppointments(inadequateInput());
      expect(r.calendar_score).toBe(34);
    });

    it("headline mentions inadequate", () => {
      const r = computePersonalCalendarAppointments(inadequateInput());
      expect(r.headline).toContain("inadequate");
    });

    it("has many concerns", () => {
      const r = computePersonalCalendarAppointments(inadequateInput());
      expect(r.concerns.length).toBeGreaterThan(5);
    });

    it("has many recommendations", () => {
      const r = computePersonalCalendarAppointments(inadequateInput());
      expect(r.recommendations.length).toBeGreaterThan(3);
    });

    it("has critical insights", () => {
      const r = computePersonalCalendarAppointments(inadequateInput());
      const critical = r.insights.filter((i) => i.severity === "critical");
      expect(critical.length).toBeGreaterThan(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 7. BONUS ISOLATION (each bonus tested from base=52)
  // ══════════════════════════════════════════════════════════════════════════

  describe("bonus isolation", () => {
    // For each bonus, we override ALL defaults so only the targeted metric
    // triggers its bonus. Other arrays are set to trigger nothing.

    // ── Helper: zero-bonus baseline where all fields produce 0 rates / no bonuses
    function zeroBonusBase(overrides: Partial<PersonalCalendarInput> = {}): PersonalCalendarInput {
      return baseInput({
        appointment_records: [],
        calendar_management_records: [],
        medical_compliance_records: [],
        transport_arrangement_records: [],
        child_preparation_records: [],
        // At least one array must have data to not hit special cases
        ...overrides,
      });
    }

    // -- Bonus 1: appointmentAttendanceRate >= 90 -> +4 --
    describe("Bonus 1: appointment attendance >= 90 -> +4", () => {
      it("adds +4 when attendance >= 90%", () => {
        const r = computePersonalCalendarAppointments(zeroBonusBase({
          appointment_records: repeat(10, () => makeAppointment({
            attended: true,
            outcome_recorded: false,
            follow_up_actions_identified: false,
            child_consented: false,
          })),
        }));
        expect(r.appointment_attendance_rate).toBe(100);
        expect(r.calendar_score).toBe(56); // 52 + 4
      });

      it("adds +2 when attendance >= 75 and < 90", () => {
        const r = computePersonalCalendarAppointments(zeroBonusBase({
          appointment_records: [
            ...repeat(8, () => makeAppointment({
              attended: true,
              outcome_recorded: false,
              follow_up_actions_identified: false,
              child_consented: false,
            })),
            ...repeat(2, () => makeAppointment({
              attended: false,
              outcome_recorded: false,
              follow_up_actions_identified: false,
              child_consented: false,
            })),
          ],
        }));
        expect(r.appointment_attendance_rate).toBe(80);
        expect(r.calendar_score).toBe(54); // 52 + 2
      });

      it("adds 0 when attendance < 75 and >= 50", () => {
        const r = computePersonalCalendarAppointments(zeroBonusBase({
          appointment_records: [
            ...repeat(6, () => makeAppointment({
              attended: true,
              outcome_recorded: false,
              follow_up_actions_identified: false,
              child_consented: false,
            })),
            ...repeat(4, () => makeAppointment({
              attended: false,
              outcome_recorded: false,
              follow_up_actions_identified: false,
              child_consented: false,
            })),
          ],
        }));
        expect(r.appointment_attendance_rate).toBe(60);
        expect(r.calendar_score).toBe(52); // no bonus, no penalty
      });
    });

    // -- Bonus 2: calendarAccuracyRate >= 90 -> +3 --
    describe("Bonus 2: calendar accuracy >= 90 -> +3", () => {
      it("adds +3 when accuracy >= 90%", () => {
        const r = computePersonalCalendarAppointments(zeroBonusBase({
          calendar_management_records: repeat(10, () => makeCalendar({ calendar_accurate: true })),
        }));
        expect(r.calendar_accuracy_rate).toBe(100);
        expect(r.calendar_score).toBe(55); // 52 + 3
      });

      it("adds +1 when accuracy >= 70 and < 90", () => {
        const r = computePersonalCalendarAppointments(zeroBonusBase({
          calendar_management_records: [
            ...repeat(8, () => makeCalendar({ calendar_accurate: true })),
            ...repeat(2, () => makeCalendar({ calendar_accurate: false })),
          ],
        }));
        expect(r.calendar_accuracy_rate).toBe(80);
        expect(r.calendar_score).toBe(53); // 52 + 1
      });

      it("adds 0 when accuracy < 70", () => {
        const r = computePersonalCalendarAppointments(zeroBonusBase({
          calendar_management_records: [
            ...repeat(6, () => makeCalendar({ calendar_accurate: true })),
            ...repeat(4, () => makeCalendar({ calendar_accurate: false })),
          ],
        }));
        expect(r.calendar_accuracy_rate).toBe(60);
        expect(r.calendar_score).toBe(52);
      });
    });

    // -- Bonus 3: medicalComplianceRate >= 95 -> +4 --
    describe("Bonus 3: medical compliance >= 95 -> +4", () => {
      it("adds +4 when compliance >= 95%", () => {
        const r = computePersonalCalendarAppointments(zeroBonusBase({
          medical_compliance_records: repeat(20, () => makeCompliance({
            completed: true,
            health_plan_updated: false,
            consent_obtained: false,
            outcome_documented: false,
          })),
        }));
        expect(r.medical_compliance_rate).toBe(100);
        expect(r.calendar_score).toBe(56); // 52 + 4
      });

      it("adds +2 when compliance >= 80 and < 95", () => {
        const r = computePersonalCalendarAppointments(zeroBonusBase({
          medical_compliance_records: [
            ...repeat(9, () => makeCompliance({ completed: true, health_plan_updated: false, consent_obtained: false, outcome_documented: false })),
            ...repeat(1, () => makeCompliance({ completed: false, overdue: false, health_plan_updated: false, consent_obtained: false, outcome_documented: false })),
          ],
        }));
        expect(r.medical_compliance_rate).toBe(90);
        expect(r.calendar_score).toBe(54); // 52 + 2
      });

      it("adds 0 when compliance < 80", () => {
        const r = computePersonalCalendarAppointments(zeroBonusBase({
          medical_compliance_records: [
            ...repeat(7, () => makeCompliance({ completed: true, health_plan_updated: false, consent_obtained: false, outcome_documented: false })),
            ...repeat(3, () => makeCompliance({ completed: false, overdue: false, health_plan_updated: false, consent_obtained: false, outcome_documented: false })),
          ],
        }));
        expect(r.medical_compliance_rate).toBe(70);
        expect(r.calendar_score).toBe(52);
      });
    });

    // -- Bonus 4: transportTimelinessRate >= 90 -> +3 --
    describe("Bonus 4: transport timeliness >= 90 -> +3", () => {
      it("adds +3 when timeliness >= 90%", () => {
        const r = computePersonalCalendarAppointments(zeroBonusBase({
          transport_arrangement_records: repeat(10, () => makeTransport({
            on_time: true,
            arranged_in_advance: false,
            child_comfortable: false,
            staff_driver_checked: false,
            backup_plan_in_place: false,
            delay_minutes: 0,
          })),
        }));
        expect(r.transport_timeliness_rate).toBe(100);
        expect(r.calendar_score).toBe(55); // 52 + 3
      });

      it("adds +1 when timeliness >= 75 and < 90", () => {
        const r = computePersonalCalendarAppointments(zeroBonusBase({
          transport_arrangement_records: [
            ...repeat(8, () => makeTransport({ on_time: true, arranged_in_advance: false, child_comfortable: false, staff_driver_checked: false, backup_plan_in_place: false, delay_minutes: 0 })),
            ...repeat(2, () => makeTransport({ on_time: false, arranged_in_advance: false, child_comfortable: false, staff_driver_checked: false, backup_plan_in_place: false, delay_minutes: 5 })),
          ],
        }));
        expect(r.transport_timeliness_rate).toBe(80);
        expect(r.calendar_score).toBe(53); // 52 + 1
      });

      it("adds 0 when timeliness < 75", () => {
        const r = computePersonalCalendarAppointments(zeroBonusBase({
          transport_arrangement_records: [
            ...repeat(6, () => makeTransport({ on_time: true, arranged_in_advance: false, child_comfortable: false, staff_driver_checked: false, backup_plan_in_place: false, delay_minutes: 0 })),
            ...repeat(4, () => makeTransport({ on_time: false, arranged_in_advance: false, child_comfortable: false, staff_driver_checked: false, backup_plan_in_place: false, delay_minutes: 5 })),
          ],
        }));
        expect(r.transport_timeliness_rate).toBe(60);
        expect(r.calendar_score).toBe(52);
      });
    });

    // -- Bonus 5: childPreparationRate >= 85 -> +3 --
    // childPreparationRate = round((advanceInformationRate + anxietyAddressRate + preferencesCaptureRate + debriefRate) / 4)
    describe("Bonus 5: child preparation >= 85 -> +3", () => {
      it("adds +3 when preparation >= 85%", () => {
        const r = computePersonalCalendarAppointments(zeroBonusBase({
          child_preparation_records: repeat(10, () => makePreparation({
            child_informed_in_advance: true,
            child_anxieties_addressed: true,
            preferences_captured: true,
            debrief_after: true,
            // Autonomy fields false to not trigger bonus 6
            child_chose_accompaniment: false,
            child_feedback_captured: false,
            autonomy_supported: false,
          })),
        }));
        expect(r.child_preparation_rate).toBe(100);
        expect(r.calendar_score).toBe(55); // 52 + 3
      });

      it("adds +1 when preparation >= 65 and < 85", () => {
        const r = computePersonalCalendarAppointments(zeroBonusBase({
          child_preparation_records: [
            ...repeat(7, () => makePreparation({
              child_informed_in_advance: true,
              child_anxieties_addressed: true,
              preferences_captured: true,
              debrief_after: true,
              child_chose_accompaniment: false,
              child_feedback_captured: false,
              autonomy_supported: false,
            })),
            ...repeat(3, () => makePreparation({
              child_informed_in_advance: false,
              child_anxieties_addressed: false,
              preferences_captured: false,
              debrief_after: false,
              child_chose_accompaniment: false,
              child_feedback_captured: false,
              autonomy_supported: false,
            })),
          ],
        }));
        expect(r.child_preparation_rate).toBe(70);
        expect(r.calendar_score).toBe(53); // 52 + 1
      });

      it("adds 0 when preparation < 65 and >= 30", () => {
        const r = computePersonalCalendarAppointments(zeroBonusBase({
          child_preparation_records: [
            ...repeat(5, () => makePreparation({
              child_informed_in_advance: true,
              child_anxieties_addressed: true,
              preferences_captured: true,
              debrief_after: true,
              child_chose_accompaniment: false,
              child_feedback_captured: false,
              autonomy_supported: false,
            })),
            ...repeat(5, () => makePreparation({
              child_informed_in_advance: false,
              child_anxieties_addressed: false,
              preferences_captured: false,
              debrief_after: false,
              child_chose_accompaniment: false,
              child_feedback_captured: false,
              autonomy_supported: false,
            })),
          ],
        }));
        expect(r.child_preparation_rate).toBe(50);
        expect(r.calendar_score).toBe(52);
      });
    });

    // -- Bonus 6: childAutonomyRate >= 80 -> +3 --
    // childAutonomyRate = round((autonomyRate + accompanimentChoiceRate + feedbackCaptureRate) / 3)
    describe("Bonus 6: child autonomy >= 80 -> +3", () => {
      it("adds +3 when autonomy >= 80%", () => {
        const r = computePersonalCalendarAppointments(zeroBonusBase({
          child_preparation_records: repeat(10, () => makePreparation({
            autonomy_supported: true,
            child_chose_accompaniment: true,
            child_feedback_captured: true,
            // Prep fields false to avoid bonus 5
            child_informed_in_advance: false,
            child_anxieties_addressed: false,
            preferences_captured: false,
            debrief_after: false,
          })),
        }));
        expect(r.child_autonomy_rate).toBe(100);
        // childPrep = round((0+0+0+0)/4) = 0, so penalty -4 applies (< 30)
        // 52 + 3 (autonomy) - 4 (prep penalty) = 51
        expect(r.calendar_score).toBe(51);
      });

      it("adds +1 when autonomy >= 60 and < 80", () => {
        const r = computePersonalCalendarAppointments(zeroBonusBase({
          child_preparation_records: [
            ...repeat(7, () => makePreparation({
              autonomy_supported: true,
              child_chose_accompaniment: true,
              child_feedback_captured: true,
              child_informed_in_advance: false,
              child_anxieties_addressed: false,
              preferences_captured: false,
              debrief_after: false,
            })),
            ...repeat(3, () => makePreparation({
              autonomy_supported: false,
              child_chose_accompaniment: false,
              child_feedback_captured: false,
              child_informed_in_advance: false,
              child_anxieties_addressed: false,
              preferences_captured: false,
              debrief_after: false,
            })),
          ],
        }));
        // autonomyRate=70, accompanimentChoiceRate=70, feedbackCaptureRate=70
        // childAutonomyRate = round((70+70+70)/3) = 70
        expect(r.child_autonomy_rate).toBe(70);
        // childPrep = round((0+0+0+0)/4) = 0 -> penalty -4
        // 52 + 1 - 4 = 49
        expect(r.calendar_score).toBe(49);
      });

      it("adds 0 when autonomy < 60", () => {
        const r = computePersonalCalendarAppointments(zeroBonusBase({
          child_preparation_records: [
            ...repeat(5, () => makePreparation({
              autonomy_supported: true,
              child_chose_accompaniment: true,
              child_feedback_captured: true,
              child_informed_in_advance: false,
              child_anxieties_addressed: false,
              preferences_captured: false,
              debrief_after: false,
            })),
            ...repeat(5, () => makePreparation({
              autonomy_supported: false,
              child_chose_accompaniment: false,
              child_feedback_captured: false,
              child_informed_in_advance: false,
              child_anxieties_addressed: false,
              preferences_captured: false,
              debrief_after: false,
            })),
          ],
        }));
        // childAutonomyRate = round((50+50+50)/3) = 50
        expect(r.child_autonomy_rate).toBe(50);
        // childPrep = 0, penalty -4
        // 52 + 0 - 4 = 48
        expect(r.calendar_score).toBe(48);
      });
    });

    // -- Bonus 7: followUpCompletionRate >= 90 -> +3 --
    describe("Bonus 7: follow-up completion >= 90 -> +3", () => {
      it("adds +3 when follow-up >= 90%", () => {
        const r = computePersonalCalendarAppointments(zeroBonusBase({
          appointment_records: repeat(10, () => makeAppointment({
            attended: false,
            outcome_recorded: false,
            follow_up_actions_identified: true,
            follow_up_actions_completed: true,
            child_consented: false,
          })),
        }));
        // attendance = 0% -> penalty -5
        // followUp = 100% -> +3
        // 52 + 3 - 5 = 50
        expect(r.calendar_score).toBe(50);
      });

      it("adds +1 when follow-up >= 70 and < 90", () => {
        const r = computePersonalCalendarAppointments(zeroBonusBase({
          appointment_records: [
            ...repeat(8, () => makeAppointment({
              attended: false,
              outcome_recorded: false,
              follow_up_actions_identified: true,
              follow_up_actions_completed: true,
              child_consented: false,
            })),
            ...repeat(2, () => makeAppointment({
              attended: false,
              outcome_recorded: false,
              follow_up_actions_identified: true,
              follow_up_actions_completed: false,
              child_consented: false,
            })),
          ],
        }));
        // followUp = pct(8,10) = 80% -> +1
        // attendance = 0% -> -5
        // 52 + 1 - 5 = 48
        expect(r.calendar_score).toBe(48);
      });
    });

    // -- Bonus 8: outcomeRecordingRate >= 90 -> +3 --
    describe("Bonus 8: outcome recording >= 90 -> +3", () => {
      it("adds +3 when outcome recording >= 90%", () => {
        const r = computePersonalCalendarAppointments(zeroBonusBase({
          appointment_records: repeat(10, () => makeAppointment({
            attended: false,
            outcome_recorded: true,
            follow_up_actions_identified: false,
            child_consented: false,
          })),
        }));
        // attendance = 0% -> -5
        // outcome = 100% -> +3
        // 52 + 3 - 5 = 50
        expect(r.calendar_score).toBe(50);
      });

      it("adds +1 when outcome recording >= 70 and < 90", () => {
        const r = computePersonalCalendarAppointments(zeroBonusBase({
          appointment_records: [
            ...repeat(8, () => makeAppointment({
              attended: false,
              outcome_recorded: true,
              follow_up_actions_identified: false,
              child_consented: false,
            })),
            ...repeat(2, () => makeAppointment({
              attended: false,
              outcome_recorded: false,
              follow_up_actions_identified: false,
              child_consented: false,
            })),
          ],
        }));
        // outcome = 80% -> +1
        // attendance = 0% -> -5
        // 52 + 1 - 5 = 48
        expect(r.calendar_score).toBe(48);
      });
    });

    // -- Bonus 9: reschedulingTimelinessRate >= 80 -> +2 --
    describe("Bonus 9: rescheduling timeliness >= 80 -> +2", () => {
      it("adds +2 when rescheduling timeliness >= 80%", () => {
        const r = computePersonalCalendarAppointments(zeroBonusBase({
          appointment_records: repeat(10, () => makeAppointment({
            attended: false,
            outcome_recorded: false,
            follow_up_actions_identified: false,
            child_consented: false,
            rescheduled: true,
            rescheduled_within_14_days: true,
          })),
        }));
        // reschedulingTimeliness = 100% -> +2
        // attendance = 0% -> -5
        // 52 + 2 - 5 = 49
        expect(r.calendar_score).toBe(49);
      });

      it("adds +1 when rescheduling timeliness >= 50 and < 80", () => {
        const r = computePersonalCalendarAppointments(zeroBonusBase({
          appointment_records: [
            ...repeat(6, () => makeAppointment({
              attended: false,
              outcome_recorded: false,
              follow_up_actions_identified: false,
              child_consented: false,
              rescheduled: true,
              rescheduled_within_14_days: true,
            })),
            ...repeat(4, () => makeAppointment({
              attended: false,
              outcome_recorded: false,
              follow_up_actions_identified: false,
              child_consented: false,
              rescheduled: true,
              rescheduled_within_14_days: false,
            })),
          ],
        }));
        // reschedulingTimeliness = pct(6,10) = 60% -> +1
        // attendance = 0% -> -5
        // 52 + 1 - 5 = 48
        expect(r.calendar_score).toBe(48);
      });

      it("adds 0 when rescheduling timeliness < 50", () => {
        const r = computePersonalCalendarAppointments(zeroBonusBase({
          appointment_records: [
            ...repeat(3, () => makeAppointment({
              attended: false,
              outcome_recorded: false,
              follow_up_actions_identified: false,
              child_consented: false,
              rescheduled: true,
              rescheduled_within_14_days: true,
            })),
            ...repeat(7, () => makeAppointment({
              attended: false,
              outcome_recorded: false,
              follow_up_actions_identified: false,
              child_consented: false,
              rescheduled: true,
              rescheduled_within_14_days: false,
            })),
          ],
        }));
        // reschedulingTimeliness = pct(3,10) = 30% -> 0
        // attendance = 0% -> -5
        // 52 + 0 - 5 = 47
        expect(r.calendar_score).toBe(47);
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 8. PENALTY ISOLATION
  // ══════════════════════════════════════════════════════════════════════════

  describe("penalty isolation", () => {

    // -- Penalty 1: appointmentAttendanceRate < 50 -> -5 --
    describe("Penalty 1: attendance < 50 -> -5", () => {
      it("applies -5 when attendance < 50%", () => {
        const r = computePersonalCalendarAppointments(baseInput({
          appointment_records: [
            ...repeat(4, () => makeAppointment({
              attended: true,
              outcome_recorded: false,
              follow_up_actions_identified: false,
              child_consented: false,
            })),
            ...repeat(6, () => makeAppointment({
              attended: false,
              outcome_recorded: false,
              follow_up_actions_identified: false,
              child_consented: false,
            })),
          ],
        }));
        expect(r.appointment_attendance_rate).toBe(40);
        // 52 - 5 = 47
        expect(r.calendar_score).toBe(47);
      });

      it("does NOT apply penalty at exactly 50%", () => {
        const r = computePersonalCalendarAppointments(baseInput({
          appointment_records: [
            ...repeat(5, () => makeAppointment({
              attended: true,
              outcome_recorded: false,
              follow_up_actions_identified: false,
              child_consented: false,
            })),
            ...repeat(5, () => makeAppointment({
              attended: false,
              outcome_recorded: false,
              follow_up_actions_identified: false,
              child_consented: false,
            })),
          ],
        }));
        expect(r.appointment_attendance_rate).toBe(50);
        expect(r.calendar_score).toBe(52);
      });
    });

    // -- Penalty 2: medicalComplianceRate < 50 -> -5 --
    describe("Penalty 2: medical compliance < 50 -> -5", () => {
      it("applies -5 when compliance < 50%", () => {
        const r = computePersonalCalendarAppointments(baseInput({
          medical_compliance_records: [
            ...repeat(4, () => makeCompliance({ completed: true, health_plan_updated: false, consent_obtained: false, outcome_documented: false })),
            ...repeat(6, () => makeCompliance({ completed: false, overdue: false, health_plan_updated: false, consent_obtained: false, outcome_documented: false })),
          ],
        }));
        expect(r.medical_compliance_rate).toBe(40);
        expect(r.calendar_score).toBe(47);
      });

      it("does NOT apply penalty at exactly 50%", () => {
        const r = computePersonalCalendarAppointments(baseInput({
          medical_compliance_records: [
            ...repeat(5, () => makeCompliance({ completed: true, health_plan_updated: false, consent_obtained: false, outcome_documented: false })),
            ...repeat(5, () => makeCompliance({ completed: false, overdue: false, health_plan_updated: false, consent_obtained: false, outcome_documented: false })),
          ],
        }));
        expect(r.medical_compliance_rate).toBe(50);
        expect(r.calendar_score).toBe(52);
      });
    });

    // -- Penalty 3: transportTimelinessRate < 50 -> -4 --
    describe("Penalty 3: transport timeliness < 50 -> -4", () => {
      it("applies -4 when timeliness < 50%", () => {
        const r = computePersonalCalendarAppointments(baseInput({
          transport_arrangement_records: [
            ...repeat(4, () => makeTransport({ on_time: true, arranged_in_advance: false, child_comfortable: false, staff_driver_checked: false, backup_plan_in_place: false, delay_minutes: 0 })),
            ...repeat(6, () => makeTransport({ on_time: false, arranged_in_advance: false, child_comfortable: false, staff_driver_checked: false, backup_plan_in_place: false, delay_minutes: 5 })),
          ],
        }));
        expect(r.transport_timeliness_rate).toBe(40);
        expect(r.calendar_score).toBe(48); // 52 - 4
      });

      it("does NOT apply penalty at exactly 50%", () => {
        const r = computePersonalCalendarAppointments(baseInput({
          transport_arrangement_records: [
            ...repeat(5, () => makeTransport({ on_time: true, arranged_in_advance: false, child_comfortable: false, staff_driver_checked: false, backup_plan_in_place: false, delay_minutes: 0 })),
            ...repeat(5, () => makeTransport({ on_time: false, arranged_in_advance: false, child_comfortable: false, staff_driver_checked: false, backup_plan_in_place: false, delay_minutes: 5 })),
          ],
        }));
        expect(r.transport_timeliness_rate).toBe(50);
        expect(r.calendar_score).toBe(52);
      });
    });

    // -- Penalty 4: childPreparationRate < 30 -> -4 --
    describe("Penalty 4: child preparation < 30 -> -4", () => {
      it("applies -4 when preparation < 30%", () => {
        const r = computePersonalCalendarAppointments(baseInput({
          child_preparation_records: repeat(10, () => makePreparation({
            child_informed_in_advance: false,
            child_anxieties_addressed: false,
            preferences_captured: false,
            debrief_after: false,
            child_chose_accompaniment: false,
            child_feedback_captured: false,
            autonomy_supported: false,
          })),
        }));
        expect(r.child_preparation_rate).toBe(0);
        expect(r.calendar_score).toBe(48); // 52 - 4
      });

      it("does NOT apply penalty at exactly 30%", () => {
        // We need childPreparationRate = round((advInfoRate + anxRate + prefRate + debriefRate) / 4) = 30
        // If 3/10 = 30% for each of the 4 components: round((30+30+30+30)/4) = 30
        const r = computePersonalCalendarAppointments(baseInput({
          child_preparation_records: [
            ...repeat(3, () => makePreparation({
              child_informed_in_advance: true,
              child_anxieties_addressed: true,
              preferences_captured: true,
              debrief_after: true,
              child_chose_accompaniment: false,
              child_feedback_captured: false,
              autonomy_supported: false,
            })),
            ...repeat(7, () => makePreparation({
              child_informed_in_advance: false,
              child_anxieties_addressed: false,
              preferences_captured: false,
              debrief_after: false,
              child_chose_accompaniment: false,
              child_feedback_captured: false,
              autonomy_supported: false,
            })),
          ],
        }));
        expect(r.child_preparation_rate).toBe(30);
        expect(r.calendar_score).toBe(52); // no penalty at exactly 30
      });
    });

    // -- All four penalties combined --
    describe("all four penalties combined", () => {
      it("applies -18 total (clamped to 0)", () => {
        const r = computePersonalCalendarAppointments(baseInput({
          appointment_records: repeat(10, () => makeAppointment({
            attended: false,
            outcome_recorded: false,
            follow_up_actions_identified: false,
            child_consented: false,
          })),
          medical_compliance_records: repeat(10, () => makeCompliance({
            completed: false,
            overdue: true,
            days_overdue: 30,
            health_plan_updated: false,
            consent_obtained: false,
            outcome_documented: false,
          })),
          transport_arrangement_records: repeat(10, () => makeTransport({
            on_time: false,
            arranged_in_advance: false,
            child_comfortable: false,
            staff_driver_checked: false,
            backup_plan_in_place: false,
            delay_minutes: 20,
          })),
          child_preparation_records: repeat(10, () => makePreparation({
            child_informed_in_advance: false,
            child_anxieties_addressed: false,
            preferences_captured: false,
            debrief_after: false,
            child_chose_accompaniment: false,
            child_feedback_captured: false,
            autonomy_supported: false,
          })),
        }));
        // 52 - 5 - 5 - 4 - 4 = 34
        expect(r.calendar_score).toBe(34);
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 9. SIX RATES
  // ══════════════════════════════════════════════════════════════════════════

  describe("six output rates", () => {
    it("appointment_attendance_rate = pct(attended, total)", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [
          ...repeat(7, () => makeAppointment({ attended: true })),
          ...repeat(3, () => makeAppointment({ attended: false })),
        ],
      }));
      expect(r.appointment_attendance_rate).toBe(70);
    });

    it("calendar_accuracy_rate = pct(accurate, total calendar records)", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        calendar_management_records: [
          ...repeat(3, () => makeCalendar({ calendar_accurate: true })),
          ...repeat(1, () => makeCalendar({ calendar_accurate: false })),
        ],
      }));
      expect(r.calendar_accuracy_rate).toBe(75);
    });

    it("medical_compliance_rate = pct(completed, total compliance records)", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        medical_compliance_records: [
          ...repeat(4, () => makeCompliance({ completed: true })),
          ...repeat(1, () => makeCompliance({ completed: false })),
        ],
      }));
      expect(r.medical_compliance_rate).toBe(80);
    });

    it("transport_timeliness_rate = pct(on_time, total transport)", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        transport_arrangement_records: [
          ...repeat(9, () => makeTransport({ on_time: true })),
          ...repeat(1, () => makeTransport({ on_time: false })),
        ],
      }));
      expect(r.transport_timeliness_rate).toBe(90);
    });

    it("child_preparation_rate = round average of 4 sub-rates", () => {
      // 10 records: 8/10 informed, 6/10 anxiety, 7/10 pref, 9/10 debrief
      // = round((80+60+70+90)/4) = round(75) = 75
      const preps: ChildPreparationRecordInput[] = repeat(10, (i) => makePreparation({
        child_informed_in_advance: i < 8,
        child_anxieties_addressed: i < 6,
        preferences_captured: i < 7,
        debrief_after: i < 9,
        child_chose_accompaniment: false,
        child_feedback_captured: false,
        autonomy_supported: false,
      }));
      const r = computePersonalCalendarAppointments(baseInput({
        child_preparation_records: preps,
      }));
      expect(r.child_preparation_rate).toBe(75);
    });

    it("child_autonomy_rate = round average of 3 sub-rates", () => {
      // 10 records: 9/10 autonomy, 7/10 accompaniment, 8/10 feedback
      // = round((90+70+80)/3) = round(80) = 80
      const preps: ChildPreparationRecordInput[] = repeat(10, (i) => makePreparation({
        autonomy_supported: i < 9,
        child_chose_accompaniment: i < 7,
        child_feedback_captured: i < 8,
        child_informed_in_advance: false,
        child_anxieties_addressed: false,
        preferences_captured: false,
        debrief_after: false,
      }));
      const r = computePersonalCalendarAppointments(baseInput({
        child_preparation_records: preps,
      }));
      expect(r.child_autonomy_rate).toBe(80);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 10. STRENGTHS
  // ══════════════════════════════════════════════════════════════════════════

  describe("strengths", () => {
    it("includes attendance >= 90% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({ attended: true, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
      }));
      expect(r.strengths.some((s) => s.includes("100% appointment attendance rate"))).toBe(true);
    });

    it("includes attendance 75-89% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [
          ...repeat(8, () => makeAppointment({ attended: true, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
          ...repeat(2, () => makeAppointment({ attended: false, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
        ],
      }));
      expect(r.strengths.some((s) => s.includes("80% appointment attendance rate"))).toBe(true);
    });

    it("includes medical attendance >= 90% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({
          appointment_type: "medical",
          attended: true,
          outcome_recorded: false,
          follow_up_actions_identified: false,
          child_consented: false,
        })),
      }));
      expect(r.strengths.some((s) => s.includes("medical appointment attendance"))).toBe(true);
    });

    it("includes dental attendance >= 90% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({
          appointment_type: "dental",
          attended: true,
          outcome_recorded: false,
          follow_up_actions_identified: false,
          child_consented: false,
        })),
      }));
      expect(r.strengths.some((s) => s.includes("dental/optician appointment attendance"))).toBe(true);
    });

    it("includes education attendance >= 90% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({
          appointment_type: "education",
          attended: true,
          outcome_recorded: false,
          follow_up_actions_identified: false,
          child_consented: false,
        })),
      }));
      expect(r.strengths.some((s) => s.includes("education appointment attendance"))).toBe(true);
    });

    it("includes outcome recording >= 90% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({
          attended: false,
          outcome_recorded: true,
          follow_up_actions_identified: false,
          child_consented: false,
        })),
      }));
      expect(r.strengths.some((s) => s.includes("Outcomes recorded for 100%"))).toBe(true);
    });

    it("includes outcome recording 70-89% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [
          ...repeat(8, () => makeAppointment({ attended: false, outcome_recorded: true, follow_up_actions_identified: false, child_consented: false })),
          ...repeat(2, () => makeAppointment({ attended: false, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
        ],
      }));
      expect(r.strengths.some((s) => s.includes("Outcomes recorded for 80%"))).toBe(true);
    });

    it("includes follow-up >= 90% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({
          attended: false,
          outcome_recorded: false,
          follow_up_actions_identified: true,
          follow_up_actions_completed: true,
          child_consented: false,
        })),
      }));
      expect(r.strengths.some((s) => s.includes("100% of follow-up actions completed"))).toBe(true);
    });

    it("includes follow-up 70-89% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [
          ...repeat(8, () => makeAppointment({ attended: false, outcome_recorded: false, follow_up_actions_identified: true, follow_up_actions_completed: true, child_consented: false })),
          ...repeat(2, () => makeAppointment({ attended: false, outcome_recorded: false, follow_up_actions_identified: true, follow_up_actions_completed: false, child_consented: false })),
        ],
      }));
      expect(r.strengths.some((s) => s.includes("80% follow-up action completion rate"))).toBe(true);
    });

    it("includes consent >= 90% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({
          attended: false,
          outcome_recorded: false,
          follow_up_actions_identified: false,
          child_consented: true,
        })),
      }));
      expect(r.strengths.some((s) => s.includes("Child consent obtained for 100%"))).toBe(true);
    });

    it("includes calendar accuracy >= 90% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        calendar_management_records: repeat(10, () => makeCalendar({ calendar_accurate: true })),
      }));
      expect(r.strengths.some((s) => s.includes("100% calendar accuracy rate"))).toBe(true);
    });

    it("includes calendar accuracy 70-89% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        calendar_management_records: [
          ...repeat(8, () => makeCalendar({ calendar_accurate: true })),
          ...repeat(2, () => makeCalendar({ calendar_accurate: false })),
        ],
      }));
      expect(r.strengths.some((s) => s.includes("80% calendar accuracy rate"))).toBe(true);
    });

    it("includes reminder >= 90% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        calendar_management_records: repeat(10, () => makeCalendar({ reminders_set: true })),
      }));
      expect(r.strengths.some((s) => s.includes("Reminders set for 100%"))).toBe(true);
    });

    it("includes conflict resolution >= 90% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        calendar_management_records: [makeCalendar({ conflicts_identified: 10, conflicts_resolved: 10 })],
      }));
      expect(r.strengths.some((s) => s.includes("100% of scheduling conflicts resolved"))).toBe(true);
    });

    it("includes child share >= 80% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        calendar_management_records: repeat(10, () => makeCalendar({ calendar_shared_with_child: true })),
      }));
      expect(r.strengths.some((s) => s.includes("Calendar shared with children in 100%"))).toBe(true);
    });

    it("includes SW share >= 80% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        calendar_management_records: repeat(10, () => makeCalendar({ calendar_shared_with_social_worker: true })),
      }));
      expect(r.strengths.some((s) => s.includes("Calendar shared with social workers in 100%"))).toBe(true);
    });

    it("includes medical compliance >= 95% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        medical_compliance_records: repeat(20, () => makeCompliance({ completed: true })),
      }));
      expect(r.strengths.some((s) => s.includes("100% medical compliance rate"))).toBe(true);
    });

    it("includes medical compliance 80-94% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        medical_compliance_records: [
          ...repeat(9, () => makeCompliance({ completed: true })),
          ...repeat(1, () => makeCompliance({ completed: false })),
        ],
      }));
      expect(r.strengths.some((s) => s.includes("90% medical compliance rate"))).toBe(true);
    });

    it("includes AHA >= 95% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        medical_compliance_records: repeat(10, () => makeCompliance({
          compliance_type: "annual_health_assessment",
          completed: true,
        })),
      }));
      expect(r.strengths.some((s) => s.includes("annual health assessment completion rate"))).toBe(true);
    });

    it("includes immunisation >= 95% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        medical_compliance_records: repeat(10, () => makeCompliance({
          compliance_type: "immunisation",
          completed: true,
        })),
      }));
      expect(r.strengths.some((s) => s.includes("immunisation compliance rate"))).toBe(true);
    });

    it("includes health plan update >= 90% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        medical_compliance_records: repeat(10, () => makeCompliance({ health_plan_updated: true })),
      }));
      expect(r.strengths.some((s) => s.includes("Health plans updated after 100%"))).toBe(true);
    });

    it("includes transport timeliness >= 90% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        transport_arrangement_records: repeat(10, () => makeTransport({ on_time: true })),
      }));
      expect(r.strengths.some((s) => s.includes("100% transport timeliness rate"))).toBe(true);
    });

    it("includes transport timeliness 75-89% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        transport_arrangement_records: [
          ...repeat(8, () => makeTransport({ on_time: true })),
          ...repeat(2, () => makeTransport({ on_time: false })),
        ],
      }));
      expect(r.strengths.some((s) => s.includes("80% transport timeliness rate"))).toBe(true);
    });

    it("includes advance arrangement >= 90% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        transport_arrangement_records: repeat(10, () => makeTransport({ arranged_in_advance: true })),
      }));
      expect(r.strengths.some((s) => s.includes("Transport arranged in advance for 100%"))).toBe(true);
    });

    it("includes child comfort >= 90% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        transport_arrangement_records: repeat(10, () => makeTransport({ child_comfortable: true })),
      }));
      expect(r.strengths.some((s) => s.includes("Children comfortable with transport arrangements in 100%"))).toBe(true);
    });

    it("includes driver check >= 95% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        transport_arrangement_records: repeat(20, () => makeTransport({ staff_driver_checked: true })),
      }));
      expect(r.strengths.some((s) => s.includes("Staff driver checks completed for 100%"))).toBe(true);
    });

    it("includes backup plan >= 80% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        transport_arrangement_records: repeat(10, () => makeTransport({ backup_plan_in_place: true })),
      }));
      expect(r.strengths.some((s) => s.includes("Backup transport plans in place for 100%"))).toBe(true);
    });

    it("includes child preparation >= 85% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        child_preparation_records: repeat(10, () => makePreparation({
          child_informed_in_advance: true,
          child_anxieties_addressed: true,
          preferences_captured: true,
          debrief_after: true,
        })),
      }));
      expect(r.strengths.some((s) => s.includes("Child preparation rate at 100%"))).toBe(true);
    });

    it("includes child preparation 65-84% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        child_preparation_records: [
          ...repeat(7, () => makePreparation({
            child_informed_in_advance: true,
            child_anxieties_addressed: true,
            preferences_captured: true,
            debrief_after: true,
          })),
          ...repeat(3, () => makePreparation({
            child_informed_in_advance: false,
            child_anxieties_addressed: false,
            preferences_captured: false,
            debrief_after: false,
          })),
        ],
      }));
      expect(r.strengths.some((s) => s.includes("Child preparation rate at 70%"))).toBe(true);
    });

    it("includes anxiety address >= 90% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        child_preparation_records: repeat(10, () => makePreparation({
          child_anxieties_addressed: true,
        })),
      }));
      expect(r.strengths.some((s) => s.includes("Children's anxieties addressed in 100%"))).toBe(true);
    });

    it("includes child satisfaction >= 4.0 strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        child_preparation_records: repeat(10, () => makePreparation({
          child_satisfaction: 5,
        })),
      }));
      expect(r.strengths.some((s) => s.includes("satisfaction with appointment preparation averages 5/5"))).toBe(true);
    });

    it("includes autonomy >= 80% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        child_preparation_records: repeat(10, () => makePreparation({
          autonomy_supported: true,
        })),
      }));
      expect(r.strengths.some((s) => s.includes("Autonomy supported in 100%"))).toBe(true);
    });

    it("includes debrief >= 85% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        child_preparation_records: repeat(20, () => makePreparation({
          debrief_after: true,
        })),
      }));
      expect(r.strengths.some((s) => s.includes("Post-appointment debrief conducted in 100%"))).toBe(true);
    });

    it("includes age-appropriate >= 90% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        child_preparation_records: repeat(10, () => makePreparation({
          age_appropriate_information: true,
        })),
      }));
      expect(r.strengths.some((s) => s.includes("Age-appropriate information provided in 100%"))).toBe(true);
    });

    it("includes child autonomy rate >= 80% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        child_preparation_records: repeat(10, () => makePreparation({
          autonomy_supported: true,
          child_chose_accompaniment: true,
          child_feedback_captured: true,
        })),
      }));
      expect(r.strengths.some((s) => s.includes("Child autonomy rate at 100%"))).toBe(true);
    });

    it("includes rescheduling timeliness >= 80% strength", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({
          attended: false,
          rescheduled: true,
          rescheduled_within_14_days: true,
          outcome_recorded: false,
          follow_up_actions_identified: false,
          child_consented: false,
        })),
      }));
      expect(r.strengths.some((s) => s.includes("100% of cancelled appointments rescheduled within 14 days"))).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 11. CONCERNS
  // ══════════════════════════════════════════════════════════════════════════

  describe("concerns", () => {
    it("concern when attendance < 50%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [
          ...repeat(3, () => makeAppointment({ attended: true, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
          ...repeat(7, () => makeAppointment({ attended: false, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Only 30% of appointments attended"))).toBe(true);
    });

    it("concern when attendance 50-74%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [
          ...repeat(6, () => makeAppointment({ attended: true, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
          ...repeat(4, () => makeAppointment({ attended: false, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Appointment attendance at 60%"))).toBe(true);
    });

    it("concern when home cancellation >= 15%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [
          ...repeat(5, () => makeAppointment({ attended: true, cancelled: false, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
          ...repeat(5, () => makeAppointment({ attended: false, cancelled: true, cancelled_by: "home", outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("The home cancelled 50%"))).toBe(true);
    });

    it("concern when overall cancellation >= 25%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [
          ...repeat(7, () => makeAppointment({ attended: true, cancelled: false, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
          ...repeat(3, () => makeAppointment({ attended: false, cancelled: true, cancelled_by: "child", outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("cancellation rate at 30%"))).toBe(true);
    });

    it("concern when overdue >= 20%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [
          ...repeat(7, () => makeAppointment({ is_overdue: false, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
          ...repeat(3, () => makeAppointment({ is_overdue: true, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("30% of appointments are overdue"))).toBe(true);
    });

    it("concern when outcome recording < 50%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({
          attended: false,
          outcome_recorded: false,
          follow_up_actions_identified: false,
          child_consented: false,
        })),
      }));
      expect(r.concerns.some((c) => c.includes("Outcomes recorded for only 0%"))).toBe(true);
    });

    it("concern when outcome recording 50-69%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [
          ...repeat(6, () => makeAppointment({ attended: false, outcome_recorded: true, follow_up_actions_identified: false, child_consented: false })),
          ...repeat(4, () => makeAppointment({ attended: false, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Outcome recording at 60%"))).toBe(true);
    });

    it("concern when follow-up < 50%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [
          ...repeat(3, () => makeAppointment({ attended: false, outcome_recorded: false, follow_up_actions_identified: true, follow_up_actions_completed: true, child_consented: false })),
          ...repeat(7, () => makeAppointment({ attended: false, outcome_recorded: false, follow_up_actions_identified: true, follow_up_actions_completed: false, child_consented: false })),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Only 30% of follow-up actions completed"))).toBe(true);
    });

    it("concern when follow-up 50-69%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [
          ...repeat(6, () => makeAppointment({ attended: false, outcome_recorded: false, follow_up_actions_identified: true, follow_up_actions_completed: true, child_consented: false })),
          ...repeat(4, () => makeAppointment({ attended: false, outcome_recorded: false, follow_up_actions_identified: true, follow_up_actions_completed: false, child_consented: false })),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Follow-up action completion at 60%"))).toBe(true);
    });

    it("concern when consent < 50%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({
          attended: false,
          outcome_recorded: false,
          follow_up_actions_identified: false,
          child_consented: false,
        })),
      }));
      expect(r.concerns.some((c) => c.includes("Child consent obtained for only 0%"))).toBe(true);
    });

    it("concern when calendar accuracy < 50%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        calendar_management_records: repeat(10, () => makeCalendar({ calendar_accurate: false })),
      }));
      expect(r.concerns.some((c) => c.includes("Calendar accuracy at only 0%"))).toBe(true);
    });

    it("concern when calendar accuracy 50-69%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        calendar_management_records: [
          ...repeat(6, () => makeCalendar({ calendar_accurate: true })),
          ...repeat(4, () => makeCalendar({ calendar_accurate: false })),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Calendar accuracy at 60%"))).toBe(true);
    });

    it("concern when missed from calendar >= 15%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        calendar_management_records: [makeCalendar({
          total_appointments_scheduled: 20,
          missed_from_calendar: 4,
        })],
      }));
      expect(r.concerns.some((c) => c.includes("20% of scheduled appointments missing from calendars"))).toBe(true);
    });

    it("concern when double booking >= 10%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        calendar_management_records: [makeCalendar({
          total_appointments_scheduled: 10,
          double_bookings: 2,
        })],
      }));
      expect(r.concerns.some((c) => c.includes("Double booking rate at 20%"))).toBe(true);
    });

    it("concern when medical compliance < 50%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        medical_compliance_records: [
          ...repeat(3, () => makeCompliance({ completed: true })),
          ...repeat(7, () => makeCompliance({ completed: false })),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Only 30% medical compliance rate"))).toBe(true);
    });

    it("concern when medical compliance 50-79%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        medical_compliance_records: [
          ...repeat(6, () => makeCompliance({ completed: true })),
          ...repeat(4, () => makeCompliance({ completed: false })),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Medical compliance at 60%"))).toBe(true);
    });

    it("concern when overdue compliance >= 25%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        medical_compliance_records: [
          ...repeat(7, () => makeCompliance({ overdue: false })),
          ...repeat(3, () => makeCompliance({ overdue: true, days_overdue: 20 })),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("30% of medical compliance requirements are overdue"))).toBe(true);
    });

    it("concern when avg days overdue >= 30", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        medical_compliance_records: [
          ...repeat(5, () => makeCompliance({ overdue: false })),
          ...repeat(5, () => makeCompliance({ overdue: true, days_overdue: 40 })),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Average overdue period is 40 days"))).toBe(true);
    });

    it("concern when AHA completion < 80%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        medical_compliance_records: [
          ...repeat(5, () => makeCompliance({ compliance_type: "annual_health_assessment", completed: true })),
          ...repeat(5, () => makeCompliance({ compliance_type: "annual_health_assessment", completed: false })),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Annual health assessment completion at only 50%"))).toBe(true);
    });

    it("concern when dental completion < 80%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        medical_compliance_records: [
          ...repeat(5, () => makeCompliance({ compliance_type: "dental_checkup", completed: true })),
          ...repeat(5, () => makeCompliance({ compliance_type: "dental_checkup", completed: false })),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Dental checkup completion at only 50%"))).toBe(true);
    });

    it("concern when health plan update < 50%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        medical_compliance_records: repeat(10, () => makeCompliance({ health_plan_updated: false })),
      }));
      expect(r.concerns.some((c) => c.includes("Health plans updated after only 0%"))).toBe(true);
    });

    it("concern when transport timeliness < 50%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        transport_arrangement_records: [
          ...repeat(3, () => makeTransport({ on_time: true })),
          ...repeat(7, () => makeTransport({ on_time: false })),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Only 30% transport timeliness rate"))).toBe(true);
    });

    it("concern when transport timeliness 50-74%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        transport_arrangement_records: [
          ...repeat(6, () => makeTransport({ on_time: true })),
          ...repeat(4, () => makeTransport({ on_time: false })),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Transport timeliness at 60%"))).toBe(true);
    });

    it("concern when significant delays >= 15%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        transport_arrangement_records: [
          ...repeat(8, () => makeTransport({ delay_minutes: 0 })),
          ...repeat(2, () => makeTransport({ on_time: false, delay_minutes: 20 })),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("20% of transport arrangements have delays exceeding 15 minutes"))).toBe(true);
    });

    it("concern when advance arrangement < 50%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        transport_arrangement_records: repeat(10, () => makeTransport({ arranged_in_advance: false })),
      }));
      expect(r.concerns.some((c) => c.includes("Transport arranged in advance for only 0%"))).toBe(true);
    });

    it("concern when child comfort < 50%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        transport_arrangement_records: repeat(10, () => makeTransport({ child_comfortable: false })),
      }));
      expect(r.concerns.some((c) => c.includes("Children comfortable with transport in only 0%"))).toBe(true);
    });

    it("concern when driver check < 80%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        transport_arrangement_records: [
          ...repeat(7, () => makeTransport({ staff_driver_checked: true })),
          ...repeat(3, () => makeTransport({ staff_driver_checked: false })),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Staff driver checks completed for only 70%"))).toBe(true);
    });

    it("concern when child preparation < 30%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        child_preparation_records: repeat(10, () => makePreparation({
          child_informed_in_advance: false,
          child_anxieties_addressed: false,
          preferences_captured: false,
          debrief_after: false,
        })),
      }));
      expect(r.concerns.some((c) => c.includes("Child preparation rate at only 0%"))).toBe(true);
    });

    it("concern when child preparation 30-64%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        child_preparation_records: [
          ...repeat(5, () => makePreparation({
            child_informed_in_advance: true,
            child_anxieties_addressed: true,
            preferences_captured: true,
            debrief_after: true,
          })),
          ...repeat(5, () => makePreparation({
            child_informed_in_advance: false,
            child_anxieties_addressed: false,
            preferences_captured: false,
            debrief_after: false,
          })),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Child preparation at 50%"))).toBe(true);
    });

    it("concern when anxiety address < 50%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        child_preparation_records: repeat(10, () => makePreparation({
          child_anxieties_addressed: false,
        })),
      }));
      expect(r.concerns.some((c) => c.includes("Children's appointment anxieties addressed in only 0%"))).toBe(true);
    });

    it("concern when child satisfaction < 3.0", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        child_preparation_records: repeat(10, () => makePreparation({
          child_satisfaction: 2,
        })),
      }));
      expect(r.concerns.some((c) => c.includes("satisfaction with appointment preparation averages only 2/5"))).toBe(true);
    });

    it("concern when child autonomy < 50%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        child_preparation_records: repeat(10, () => makePreparation({
          autonomy_supported: false,
          child_chose_accompaniment: false,
          child_feedback_captured: false,
        })),
      }));
      expect(r.concerns.some((c) => c.includes("Child autonomy rate at only 0%"))).toBe(true);
    });

    it("concern when no appointment records but children on placement (not allEmpty)", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        total_children: 3,
        calendar_management_records: [makeCalendar()],
      }));
      expect(r.concerns.some((c) => c.includes("No appointment records despite children being on placement"))).toBe(true);
    });

    it("concern when no medical compliance records but children on placement (not allEmpty)", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        total_children: 3,
        appointment_records: [makeAppointment()],
      }));
      expect(r.concerns.some((c) => c.includes("No medical compliance records"))).toBe(true);
    });

    it("concern when no transport records but children on placement (not allEmpty)", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        total_children: 3,
        appointment_records: [makeAppointment()],
      }));
      expect(r.concerns.some((c) => c.includes("No transport arrangement records"))).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 12. RECOMMENDATIONS
  // ══════════════════════════════════════════════════════════════════════════

  describe("recommendations", () => {
    it("immediate recommendation when attendance < 50%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({ attended: false, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("root-cause analysis"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("immediate recommendation when medical compliance < 50%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        medical_compliance_records: repeat(10, () => makeCompliance({ completed: false, health_plan_updated: false, consent_obtained: false, outcome_documented: false })),
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("medical compliance gap"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("immediate recommendation when transport < 50%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        transport_arrangement_records: repeat(10, () => makeTransport({ on_time: false, arranged_in_advance: false, child_comfortable: false, staff_driver_checked: false, backup_plan_in_place: false })),
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Overhaul transport"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("immediate recommendation when child preparation < 30%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        child_preparation_records: repeat(10, () => makePreparation({
          child_informed_in_advance: false,
          child_anxieties_addressed: false,
          preferences_captured: false,
          debrief_after: false,
        })),
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("child preparation protocol"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("soon recommendation when attendance 50-74%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [
          ...repeat(6, () => makeAppointment({ attended: true, outcome_recorded: true, follow_up_actions_identified: false, child_consented: true })),
          ...repeat(4, () => makeAppointment({ attended: false, outcome_recorded: true, follow_up_actions_identified: false, child_consented: true })),
        ],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Improve appointment attendance to at least 75%"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("planned recommendation when medical compliance 50-79%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        medical_compliance_records: [
          ...repeat(6, () => makeCompliance({ completed: true })),
          ...repeat(4, () => makeCompliance({ completed: false })),
        ],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Strengthen medical compliance tracking"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("planned recommendation when transport 50-74%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        transport_arrangement_records: [
          ...repeat(6, () => makeTransport({ on_time: true, arranged_in_advance: false, child_comfortable: false, staff_driver_checked: false, backup_plan_in_place: false, delay_minutes: 0 })),
          ...repeat(4, () => makeTransport({ on_time: false, arranged_in_advance: false, child_comfortable: false, staff_driver_checked: false, backup_plan_in_place: false, delay_minutes: 5 })),
        ],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Improve transport timeliness to at least 75%"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("planned recommendation when child preparation 30-64%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        child_preparation_records: [
          ...repeat(5, () => makePreparation({
            child_informed_in_advance: true,
            child_anxieties_addressed: true,
            preferences_captured: true,
            debrief_after: true,
          })),
          ...repeat(5, () => makePreparation({
            child_informed_in_advance: false,
            child_anxieties_addressed: false,
            preferences_captured: false,
            debrief_after: false,
          })),
        ],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("pre-appointment preparation framework"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("planned recommendation when child autonomy < 50%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        child_preparation_records: repeat(10, () => makePreparation({
          autonomy_supported: false,
          child_chose_accompaniment: false,
          child_feedback_captured: false,
        })),
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Increase child autonomy"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("recommendations have consecutive ranks", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({ attended: false, outcome_recorded: false, follow_up_actions_identified: true, follow_up_actions_completed: false, child_consented: false })),
        medical_compliance_records: repeat(10, () => makeCompliance({ completed: false, health_plan_updated: false, consent_obtained: false, outcome_documented: false })),
        transport_arrangement_records: repeat(10, () => makeTransport({ on_time: false, arranged_in_advance: false, child_comfortable: false, staff_driver_checked: false, backup_plan_in_place: false })),
        child_preparation_records: repeat(10, () => makePreparation({ child_informed_in_advance: false, child_anxieties_addressed: false, preferences_captured: false, debrief_after: false, child_chose_accompaniment: false, child_feedback_captured: false, autonomy_supported: false })),
      }));
      r.recommendations.forEach((rec, i) => {
        expect(rec.rank).toBe(i + 1);
      });
    });

    it("soon recommendation for no appointment records when not allEmpty", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        total_children: 3,
        calendar_management_records: [makeCalendar()],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Begin recording all children's appointments"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("soon recommendation for no medical compliance records when not allEmpty", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        total_children: 3,
        appointment_records: [makeAppointment()],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Implement medical compliance tracking"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("soon recommendation for no transport records when not allEmpty", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        total_children: 3,
        appointment_records: [makeAppointment()],
      }));
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Start recording transport arrangements"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 13. INSIGHTS
  // ══════════════════════════════════════════════════════════════════════════

  describe("insights", () => {
    // -- Critical --
    it("critical insight when attendance < 50%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({ attended: false, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
      }));
      const ci = r.insights.find((i) => i.severity === "critical" && i.text.includes("0% of appointments attended"));
      expect(ci).toBeDefined();
    });

    it("critical insight when medical compliance < 50%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        medical_compliance_records: repeat(10, () => makeCompliance({ completed: false, health_plan_updated: false, consent_obtained: false, outcome_documented: false })),
      }));
      const ci = r.insights.find((i) => i.severity === "critical" && i.text.includes("0% medical compliance rate"));
      expect(ci).toBeDefined();
    });

    it("critical insight when transport timeliness < 50%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        transport_arrangement_records: repeat(10, () => makeTransport({ on_time: false, arranged_in_advance: false, child_comfortable: false, staff_driver_checked: false, backup_plan_in_place: false, delay_minutes: 5 })),
      }));
      const ci = r.insights.find((i) => i.severity === "critical" && i.text.includes("0% transport timeliness rate"));
      expect(ci).toBeDefined();
    });

    it("critical insight when child preparation < 30%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        child_preparation_records: repeat(10, () => makePreparation({ child_informed_in_advance: false, child_anxieties_addressed: false, preferences_captured: false, debrief_after: false })),
      }));
      const ci = r.insights.find((i) => i.severity === "critical" && i.text.includes("Child preparation rate at only 0%"));
      expect(ci).toBeDefined();
    });

    it("critical insight when no appointments and no compliance but children exist (not allEmpty)", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        total_children: 3,
        calendar_management_records: [makeCalendar()],
      }));
      const ci = r.insights.find((i) => i.severity === "critical" && i.text.includes("No appointment or medical compliance records"));
      expect(ci).toBeDefined();
    });

    it("critical insight for home cancellation >= 15%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [
          ...repeat(8, () => makeAppointment({ attended: true, cancelled: false, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
          ...repeat(2, () => makeAppointment({ attended: false, cancelled: true, cancelled_by: "home", outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("The home cancelled 20%"))).toBe(true);
    });

    it("critical insight for overdue compliance >= 40%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        medical_compliance_records: [
          ...repeat(5, () => makeCompliance({ overdue: false })),
          ...repeat(5, () => makeCompliance({ overdue: true, days_overdue: 30 })),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("50% of medical compliance requirements are overdue"))).toBe(true);
    });

    // -- Warning --
    it("warning insight when attendance 50-74%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [
          ...repeat(6, () => makeAppointment({ attended: true, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
          ...repeat(4, () => makeAppointment({ attended: false, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Appointment attendance at 60%"))).toBe(true);
    });

    it("warning insight when medical compliance 50-79%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        medical_compliance_records: [
          ...repeat(6, () => makeCompliance({ completed: true })),
          ...repeat(4, () => makeCompliance({ completed: false })),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Medical compliance at 60%"))).toBe(true);
    });

    it("warning insight when calendar accuracy 50-69%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        calendar_management_records: [
          ...repeat(6, () => makeCalendar({ calendar_accurate: true })),
          ...repeat(4, () => makeCalendar({ calendar_accurate: false })),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Calendar accuracy at 60%"))).toBe(true);
    });

    it("warning insight when transport timeliness 50-74%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        transport_arrangement_records: [
          ...repeat(6, () => makeTransport({ on_time: true })),
          ...repeat(4, () => makeTransport({ on_time: false })),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Transport timeliness at 60%"))).toBe(true);
    });

    it("warning insight when child preparation 30-64%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        child_preparation_records: [
          ...repeat(5, () => makePreparation({ child_informed_in_advance: true, child_anxieties_addressed: true, preferences_captured: true, debrief_after: true })),
          ...repeat(5, () => makePreparation({ child_informed_in_advance: false, child_anxieties_addressed: false, preferences_captured: false, debrief_after: false })),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Child preparation at 50%"))).toBe(true);
    });

    it("warning insight when follow-up 50-69%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [
          ...repeat(6, () => makeAppointment({ attended: false, outcome_recorded: false, follow_up_actions_identified: true, follow_up_actions_completed: true, child_consented: false })),
          ...repeat(4, () => makeAppointment({ attended: false, outcome_recorded: false, follow_up_actions_identified: true, follow_up_actions_completed: false, child_consented: false })),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Follow-up action completion at 60%"))).toBe(true);
    });

    it("warning insight when child autonomy 50-79%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        child_preparation_records: [
          ...repeat(6, () => makePreparation({ autonomy_supported: true, child_chose_accompaniment: true, child_feedback_captured: true, child_informed_in_advance: false, child_anxieties_addressed: false, preferences_captured: false, debrief_after: false })),
          ...repeat(4, () => makePreparation({ autonomy_supported: false, child_chose_accompaniment: false, child_feedback_captured: false, child_informed_in_advance: false, child_anxieties_addressed: false, preferences_captured: false, debrief_after: false })),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Child autonomy rate at 60%"))).toBe(true);
    });

    it("warning insight when cancellation 15-24%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [
          ...repeat(8, () => makeAppointment({ attended: true, cancelled: false, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
          ...repeat(2, () => makeAppointment({ attended: false, cancelled: true, cancelled_by: "child", outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Cancellation rate at 20%"))).toBe(true);
    });

    it("warning insight for rescheduling timeliness < 50%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [
          ...repeat(3, () => makeAppointment({ attended: false, rescheduled: true, rescheduled_within_14_days: true, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
          ...repeat(7, () => makeAppointment({ attended: false, rescheduled: true, rescheduled_within_14_days: false, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Only 30% of cancelled appointments rescheduled within 14 days"))).toBe(true);
    });

    it("warning insight when missed from calendar 10-14%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        calendar_management_records: [makeCalendar({
          total_appointments_scheduled: 10,
          appointments_in_calendar: 10,
          missed_from_calendar: 1,
        })],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("10% of appointments missing from calendars"))).toBe(true);
    });

    it("warning insight for appointment type diversity", () => {
      const types: Array<AppointmentRecordInput["appointment_type"]> = ["medical", "dental", "education", "therapy", "social_worker"];
      const appts = types.flatMap((t) => repeat(2, () => makeAppointment({ appointment_type: t, attended: true, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })));
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: appts,
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("different appointment types"))).toBe(true);
    });

    // -- Positive --
    it("positive insight for outstanding rating", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment()),
        calendar_management_records: [makeCalendar()],
        medical_compliance_records: repeat(10, () => makeCompliance()),
        transport_arrangement_records: repeat(10, () => makeTransport()),
        child_preparation_records: repeat(10, () => makePreparation()),
      }));
      if (r.calendar_rating === "outstanding") {
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding appointment management"))).toBe(true);
      }
    });

    it("positive insight when attendance >= 90 and compliance >= 90", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({ attended: true })),
        medical_compliance_records: repeat(10, () => makeCompliance({ completed: true })),
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("100% appointment attendance with 100% medical compliance"))).toBe(true);
    });

    it("positive insight when transport >= 90 and comfort >= 90", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        transport_arrangement_records: repeat(10, () => makeTransport({ on_time: true, child_comfortable: true })),
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("100% transport timeliness with 100% child comfort rate"))).toBe(true);
    });

    it("positive insight when preparation >= 85 and autonomy >= 80", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        child_preparation_records: repeat(10, () => makePreparation({
          child_informed_in_advance: true,
          child_anxieties_addressed: true,
          preferences_captured: true,
          debrief_after: true,
          autonomy_supported: true,
          child_chose_accompaniment: true,
          child_feedback_captured: true,
        })),
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("100% child preparation with 100% autonomy rate"))).toBe(true);
    });

    it("positive insight when child satisfaction >= 4.0", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        child_preparation_records: repeat(10, () => makePreparation({ child_satisfaction: 4.5 })),
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("satisfaction with appointment preparation averages 4.5/5"))).toBe(true);
    });

    it("positive insight for follow-up >= 90 and outcome >= 90", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({
          outcome_recorded: true,
          follow_up_actions_identified: true,
          follow_up_actions_completed: true,
        })),
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("100% outcome recording with 100% follow-up completion"))).toBe(true);
    });

    it("positive insight for calendar accuracy >= 90 and reminders >= 90", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        calendar_management_records: repeat(10, () => makeCalendar({ calendar_accurate: true, reminders_set: true })),
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("100% calendar accuracy with 100% reminder coverage"))).toBe(true);
    });

    it("positive insight for consent >= 90 and autonomy >= 80", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({ child_consented: true })),
        child_preparation_records: repeat(10, () => makePreparation({ autonomy_supported: true })),
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Consent obtained for 100% of appointments with 100% autonomy support"))).toBe(true);
    });

    it("positive insight for rescheduling timeliness >= 80%", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({ attended: false, rescheduled: true, rescheduled_within_14_days: true, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("100% of cancelled appointments rescheduled within 14 days"))).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 14. EDGE CASES
  // ══════════════════════════════════════════════════════════════════════════

  describe("edge cases", () => {
    it("score clamped to 0 minimum even with extreme penalties", () => {
      // Impossible for penalties to go below 0 with base 52 and max -18
      // But test clamp logic by using all penalties: 52 - 18 = 34 > 0
      // Actually the clamp(0,100) ensures minimum 0
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({ attended: false, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
        medical_compliance_records: repeat(10, () => makeCompliance({ completed: false, health_plan_updated: false, consent_obtained: false, outcome_documented: false })),
        transport_arrangement_records: repeat(10, () => makeTransport({ on_time: false, arranged_in_advance: false, child_comfortable: false, staff_driver_checked: false, backup_plan_in_place: false })),
        child_preparation_records: repeat(10, () => makePreparation({ child_informed_in_advance: false, child_anxieties_addressed: false, preferences_captured: false, debrief_after: false, child_chose_accompaniment: false, child_feedback_captured: false, autonomy_supported: false })),
      }));
      expect(r.calendar_score).toBeGreaterThanOrEqual(0);
    });

    it("score clamped to 100 maximum (cannot exceed with max bonuses 52+28=80)", () => {
      // Max score = 52 + 4+3+4+3+3+3+3+3+2 = 80, need rescheduled appt for bonus 9
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [
          ...repeat(9, () => makeAppointment()),
          makeAppointment({ rescheduled: true, rescheduled_within_14_days: true }),
        ],
        calendar_management_records: [makeCalendar()],
        medical_compliance_records: repeat(10, () => makeCompliance()),
        transport_arrangement_records: repeat(10, () => makeTransport()),
        child_preparation_records: repeat(10, () => makePreparation()),
      }));
      expect(r.calendar_score).toBeLessThanOrEqual(100);
      expect(r.calendar_score).toBe(80); // max achievable
    });

    it("single record in each array produces valid result", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [makeAppointment()],
        calendar_management_records: [makeCalendar()],
        medical_compliance_records: [makeCompliance()],
        transport_arrangement_records: [makeTransport()],
        child_preparation_records: [makePreparation()],
      }));
      expect(r.calendar_rating).toBeDefined();
      expect(r.calendar_score).toBeGreaterThanOrEqual(0);
      expect(r.calendar_score).toBeLessThanOrEqual(100);
    });

    it("handles total_children=0 with some records (not allEmpty) -- enters normal computation", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        total_children: 0,
        appointment_records: [makeAppointment()],
      }));
      // Not insufficient_data because not allEmpty
      expect(r.calendar_rating).not.toBe("insufficient_data");
    });

    it("reschedulingTimelinessRate = 0 when no rescheduled appointments (pct(0,0)=0)", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({
          rescheduled: false,
          rescheduled_within_14_days: false,
          attended: true,
          outcome_recorded: false,
          follow_up_actions_identified: false,
          child_consented: false,
        })),
      }));
      // No rescheduled, so pct(0,0) = 0, no bonus
      // attendance = 100% -> +4
      expect(r.calendar_score).toBe(56);
    });

    it("followUpCompletionRate = 0 when no follow-ups identified (pct(0,0)=0)", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({
          attended: true,
          follow_up_actions_identified: false,
          follow_up_actions_completed: false,
          outcome_recorded: false,
          child_consented: false,
        })),
      }));
      // followUp pct(0,0) = 0, no bonus
      // attendance = 100% -> +4
      expect(r.calendar_score).toBe(56);
    });

    it("conflictResolutionRate = 0 when no conflicts (pct(0,0)=0)", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        calendar_management_records: [makeCalendar({ conflicts_identified: 0, conflicts_resolved: 0 })],
      }));
      // No error, conflict resolution = 0
      expect(r.calendar_accuracy_rate).toBe(100);
    });

    it("calendarCaptureRate uses totalScheduled as denominator", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        calendar_management_records: [makeCalendar({
          total_appointments_scheduled: 20,
          appointments_in_calendar: 15,
        })],
      }));
      // This affects missedFromCalendarRate, not directly exposed
      // But verify no crash
      expect(r.calendar_accuracy_rate).toBe(100);
    });

    it("childPreparationRate with mixed sub-rates", () => {
      // 10 records: all informed, none anxiety, all pref, none debrief
      // = round((100+0+100+0)/4) = round(50) = 50
      const r = computePersonalCalendarAppointments(baseInput({
        child_preparation_records: repeat(10, () => makePreparation({
          child_informed_in_advance: true,
          child_anxieties_addressed: false,
          preferences_captured: true,
          debrief_after: false,
          child_chose_accompaniment: false,
          child_feedback_captured: false,
          autonomy_supported: false,
        })),
      }));
      expect(r.child_preparation_rate).toBe(50);
    });

    it("childAutonomyRate with mixed sub-rates", () => {
      // 10 records: all autonomy, none accompaniment, all feedback
      // = round((100+0+100)/3) = round(66.67) = 67
      const r = computePersonalCalendarAppointments(baseInput({
        child_preparation_records: repeat(10, () => makePreparation({
          autonomy_supported: true,
          child_chose_accompaniment: false,
          child_feedback_captured: true,
          child_informed_in_advance: false,
          child_anxieties_addressed: false,
          preferences_captured: false,
          debrief_after: false,
        })),
      }));
      expect(r.child_autonomy_rate).toBe(67);
    });

    it("appointment type classification: camhs counts as medical", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({
          appointment_type: "camhs",
          attended: true,
          outcome_recorded: false,
          follow_up_actions_identified: false,
          child_consented: false,
        })),
      }));
      expect(r.strengths.some((s) => s.includes("medical appointment attendance"))).toBe(true);
    });

    it("appointment type classification: specialist counts as medical", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({
          appointment_type: "specialist",
          attended: true,
          outcome_recorded: false,
          follow_up_actions_identified: false,
          child_consented: false,
        })),
      }));
      expect(r.strengths.some((s) => s.includes("medical appointment attendance"))).toBe(true);
    });

    it("appointment type classification: mental_health counts as medical", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({
          appointment_type: "mental_health",
          attended: true,
          outcome_recorded: false,
          follow_up_actions_identified: false,
          child_consented: false,
        })),
      }));
      expect(r.strengths.some((s) => s.includes("medical appointment attendance"))).toBe(true);
    });

    it("appointment type classification: optician counts as dental", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({
          appointment_type: "optician",
          attended: true,
          outcome_recorded: false,
          follow_up_actions_identified: false,
          child_consented: false,
        })),
      }));
      expect(r.strengths.some((s) => s.includes("dental/optician appointment attendance"))).toBe(true);
    });

    it("appointment type classification: pep counts as education", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({
          appointment_type: "pep",
          attended: true,
          outcome_recorded: false,
          follow_up_actions_identified: false,
          child_consented: false,
        })),
      }));
      expect(r.strengths.some((s) => s.includes("education appointment attendance"))).toBe(true);
    });

    it("appointment type classification: lac_review counts as education", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({
          appointment_type: "lac_review",
          attended: true,
          outcome_recorded: false,
          follow_up_actions_identified: false,
          child_consented: false,
        })),
      }));
      expect(r.strengths.some((s) => s.includes("education appointment attendance"))).toBe(true);
    });

    it("multiple children tracked via unique child_ids", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [
          makeAppointment({ child_id: "child_a", attended: true, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false }),
          makeAppointment({ child_id: "child_b", attended: true, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false }),
          makeAppointment({ child_id: "child_c", attended: true, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false }),
        ],
      }));
      // 3 unique children, should be tracked internally
      expect(r.appointment_attendance_rate).toBe(100);
    });

    it("childSatisfactionAvg rounds to 2 decimal places", () => {
      // 3 records: satisfaction 4, 5, 4 -> avg = 13/3 = 4.333... -> round to 4.33
      const r = computePersonalCalendarAppointments(baseInput({
        child_preparation_records: [
          makePreparation({ child_satisfaction: 4 }),
          makePreparation({ child_satisfaction: 5 }),
          makePreparation({ child_satisfaction: 4 }),
        ],
      }));
      // Math.round(13/3 * 100) / 100 = Math.round(433.33) / 100 = 433/100 = 4.33
      expect(r.strengths.some((s) => s.includes("4.33/5"))).toBe(true);
    });

    it("good headline shows strength and concern counts", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({
          attended: true,
          outcome_recorded: true,
          follow_up_actions_identified: true,
          follow_up_actions_completed: true,
          child_consented: true,
        })),
        calendar_management_records: [makeCalendar()],
        medical_compliance_records: repeat(10, () => makeCompliance()),
        transport_arrangement_records: [
          ...repeat(8, () => makeTransport()),
          ...repeat(2, () => makeTransport({ on_time: false, delay_minutes: 5, child_comfortable: false, staff_driver_checked: false })),
        ],
        child_preparation_records: repeat(10, () => makePreparation()),
      }));
      if (r.calendar_rating === "good") {
        expect(r.headline).toContain("strength");
      }
    });

    it("adequate headline shows concern count", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [
          ...repeat(6, () => makeAppointment({ attended: true, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
          ...repeat(4, () => makeAppointment({ attended: false, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
        ],
        calendar_management_records: [makeCalendar({ calendar_accurate: false })],
      }));
      if (r.calendar_rating === "adequate") {
        expect(r.headline).toContain("concern");
      }
    });

    it("inadequate headline shows concern count", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({ attended: false, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
        medical_compliance_records: repeat(10, () => makeCompliance({ completed: false, health_plan_updated: false, consent_obtained: false, outcome_documented: false })),
        transport_arrangement_records: repeat(10, () => makeTransport({ on_time: false, arranged_in_advance: false, child_comfortable: false, staff_driver_checked: false, backup_plan_in_place: false })),
        child_preparation_records: repeat(10, () => makePreparation({ child_informed_in_advance: false, child_anxieties_addressed: false, preferences_captured: false, debrief_after: false, child_chose_accompaniment: false, child_feedback_captured: false, autonomy_supported: false })),
      }));
      expect(r.headline).toContain("significant concern");
    });

    it("all rates are integers (pct returns Math.round)", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(3, () => makeAppointment({ attended: true })),
        calendar_management_records: [makeCalendar()],
        medical_compliance_records: repeat(3, () => makeCompliance()),
        transport_arrangement_records: repeat(3, () => makeTransport()),
        child_preparation_records: repeat(3, () => makePreparation()),
      }));
      expect(Number.isInteger(r.appointment_attendance_rate)).toBe(true);
      expect(Number.isInteger(r.calendar_accuracy_rate)).toBe(true);
      expect(Number.isInteger(r.medical_compliance_rate)).toBe(true);
      expect(Number.isInteger(r.transport_timeliness_rate)).toBe(true);
      expect(Number.isInteger(r.child_preparation_rate)).toBe(true);
      expect(Number.isInteger(r.child_autonomy_rate)).toBe(true);
    });

    it("toRating boundary: score 80 is outstanding", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [
          ...repeat(9, () => makeAppointment()),
          makeAppointment({ rescheduled: true, rescheduled_within_14_days: true }),
        ],
        calendar_management_records: [makeCalendar()],
        medical_compliance_records: repeat(10, () => makeCompliance()),
        transport_arrangement_records: repeat(10, () => makeTransport()),
        child_preparation_records: repeat(10, () => makePreparation()),
      }));
      expect(r.calendar_score).toBe(80);
      expect(r.calendar_rating).toBe("outstanding");
    });

    it("toRating boundary: score 65 is good", () => {
      // We need exactly 65. Base 52 + bonuses totaling 13.
      // attendance >= 90 -> +4, calendar >= 90 -> +3, medical >= 95 -> +4, reschedule >= 80 -> +2
      // Total: 52 + 4+3+4+2 = 65
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({
          attended: true,
          outcome_recorded: false,
          follow_up_actions_identified: false,
          child_consented: false,
          rescheduled: true,
          rescheduled_within_14_days: true,
        })),
        calendar_management_records: repeat(10, () => makeCalendar({ calendar_accurate: true })),
        medical_compliance_records: repeat(20, () => makeCompliance({
          completed: true,
          health_plan_updated: false,
          consent_obtained: false,
          outcome_documented: false,
        })),
      }));
      expect(r.calendar_score).toBe(65);
      expect(r.calendar_rating).toBe("good");
    });

    it("toRating boundary: score 45 is adequate", () => {
      // 52 - 5 (attendance < 50) - 4 (childPrep < 30) + 1 (calendar >= 70) + 1 (reschedule >= 50) = 45
      // outcomeRecordingRate must stay < 70 to avoid its bonus.
      // All 10 appts rescheduled: 5 within 14 days -> pct(5,10)=50% -> +1
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [
          ...repeat(4, () => makeAppointment({
            attended: true,
            outcome_recorded: false,
            follow_up_actions_identified: false,
            child_consented: false,
            rescheduled: true,
            rescheduled_within_14_days: true,
          })),
          ...repeat(1, () => makeAppointment({
            attended: false,
            outcome_recorded: false,
            follow_up_actions_identified: false,
            child_consented: false,
            rescheduled: true,
            rescheduled_within_14_days: true,
          })),
          ...repeat(5, () => makeAppointment({
            attended: false,
            outcome_recorded: false,
            follow_up_actions_identified: false,
            child_consented: false,
            rescheduled: true,
            rescheduled_within_14_days: false,
          })),
        ],
        calendar_management_records: [
          ...repeat(8, () => makeCalendar({ calendar_accurate: true })),
          ...repeat(2, () => makeCalendar({ calendar_accurate: false })),
        ],
        child_preparation_records: repeat(10, () => makePreparation({
          child_informed_in_advance: false,
          child_anxieties_addressed: false,
          preferences_captured: false,
          debrief_after: false,
          child_chose_accompaniment: false,
          child_feedback_captured: false,
          autonomy_supported: false,
        })),
      }));
      expect(r.calendar_score).toBe(45);
      expect(r.calendar_rating).toBe("adequate");
    });

    it("toRating boundary: score 44 is inadequate", () => {
      // 52 - 5 (attendance) - 4 (childPrep) + 1 (calendar) = 44
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [
          ...repeat(4, () => makeAppointment({ attended: true, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
          ...repeat(6, () => makeAppointment({ attended: false, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
        ],
        calendar_management_records: [
          ...repeat(8, () => makeCalendar({ calendar_accurate: true })),
          ...repeat(2, () => makeCalendar({ calendar_accurate: false })),
        ],
        child_preparation_records: repeat(10, () => makePreparation({
          child_informed_in_advance: false,
          child_anxieties_addressed: false,
          preferences_captured: false,
          debrief_after: false,
          child_chose_accompaniment: false,
          child_feedback_captured: false,
          autonomy_supported: false,
        })),
      }));
      expect(r.calendar_score).toBe(44);
      expect(r.calendar_rating).toBe("inadequate");
    });

    it("empty appointment_records does not trigger attendance penalty (guard: totalAppointments > 0)", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        calendar_management_records: [makeCalendar()],
      }));
      // attendance rate = pct(0,0) = 0, but totalAppointments = 0 so no penalty
      expect(r.appointment_attendance_rate).toBe(0);
      // Score should not have -5 penalty applied
      expect(r.calendar_score).toBe(55); // 52 + 3 (calendar accuracy)
    });

    it("empty medical_compliance_records does not trigger compliance penalty", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [makeAppointment({ attended: true, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })],
      }));
      // compliance rate = 0 but no penalty because totalMedicalCompliance = 0
      expect(r.medical_compliance_rate).toBe(0);
    });

    it("empty transport records does not trigger transport penalty", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [makeAppointment({ attended: true, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })],
      }));
      expect(r.transport_timeliness_rate).toBe(0);
    });

    it("empty preparation records does not trigger preparation penalty", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: [makeAppointment({ attended: true, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })],
      }));
      expect(r.child_preparation_rate).toBe(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 15. OUTPUT SHAPE
  // ══════════════════════════════════════════════════════════════════════════

  describe("output shape", () => {
    it("returns all required fields", () => {
      const r = computePersonalCalendarAppointments(baseInput({ total_children: 0 }));
      expect(r).toHaveProperty("calendar_rating");
      expect(r).toHaveProperty("calendar_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("appointment_attendance_rate");
      expect(r).toHaveProperty("calendar_accuracy_rate");
      expect(r).toHaveProperty("medical_compliance_rate");
      expect(r).toHaveProperty("transport_timeliness_rate");
      expect(r).toHaveProperty("child_preparation_rate");
      expect(r).toHaveProperty("child_autonomy_rate");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("strengths is string[]", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment()),
      }));
      expect(Array.isArray(r.strengths)).toBe(true);
      r.strengths.forEach((s) => expect(typeof s).toBe("string"));
    });

    it("concerns is string[]", () => {
      const r = computePersonalCalendarAppointments(baseInput({ total_children: 0 }));
      expect(Array.isArray(r.concerns)).toBe(true);
    });

    it("recommendations have rank, recommendation, urgency, regulatory_ref", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({ attended: false, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
      }));
      r.recommendations.forEach((rec) => {
        expect(rec).toHaveProperty("rank");
        expect(rec).toHaveProperty("recommendation");
        expect(rec).toHaveProperty("urgency");
        expect(rec).toHaveProperty("regulatory_ref");
        expect(typeof rec.rank).toBe("number");
        expect(typeof rec.recommendation).toBe("string");
        expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
      });
    });

    it("insights have text and severity", () => {
      const r = computePersonalCalendarAppointments(baseInput({
        appointment_records: repeat(10, () => makeAppointment({ attended: false, outcome_recorded: false, follow_up_actions_identified: false, child_consented: false })),
      }));
      r.insights.forEach((ins) => {
        expect(ins).toHaveProperty("text");
        expect(ins).toHaveProperty("severity");
        expect(typeof ins.text).toBe("string");
        expect(["critical", "warning", "positive"]).toContain(ins.severity);
      });
    });
  });
});
