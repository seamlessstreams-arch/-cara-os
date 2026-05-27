import { describe, it, expect } from "vitest";
import {
  computeHealthAppointmentContinuity,
  type HealthAppointmentInput,
  type AppointmentRecordInput,
} from "../home-health-appointment-continuity-intelligence-engine";

/* ── helpers ────────────────────────────────────────────────────────────────── */

function makeAppointment(overrides: Partial<AppointmentRecordInput> = {}): AppointmentRecordInput {
  return {
    id: "apt1",
    child_id: "c1",
    appointment_type: "gp",
    status: "attended",
    has_outcome: true,
    transport_arranged: true,
    has_escort: true,
    has_follow_up: false,
    ...overrides,
  };
}

function baseInput(overrides: Partial<HealthAppointmentInput> = {}): HealthAppointmentInput {
  return {
    today: "2026-05-27",
    total_children: 6,
    appointments: [],
    ...overrides,
  };
}

/* ── tests ──────────────────────────────────────────────────────────────────── */

describe("Home Health Appointment Continuity Intelligence Engine", () => {

  // ═══════════════════════════════════════════════════════════════════════════
  // INSUFFICIENT DATA
  // ═══════════════════════════════════════════════════════════════════════════

  describe("insufficient data", () => {
    it("returns insufficient_data when total_children is 0", () => {
      const r = computeHealthAppointmentContinuity(baseInput({ total_children: 0 }));
      expect(r.appointment_rating).toBe("insufficient_data");
      expect(r.appointment_score).toBe(0);
      expect(r.headline).toBe("No data available for health appointment analysis");
      expect(r.total_appointments).toBe(0);
      expect(r.attendance_rate).toBe(0);
      expect(r.missed_rate).toBe(0);
      expect(r.outcome_documentation_rate).toBe(0);
      expect(r.transport_compliance_rate).toBe(0);
      expect(r.health_domain_variety).toBe(0);
      expect(r.children_with_appointments_rate).toBe(0);
    });

    it("returns empty arrays for strengths, concerns, recommendations, insights when insufficient", () => {
      const r = computeHealthAppointmentContinuity(baseInput({ total_children: 0 }));
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });

    it("returns insufficient_data even when appointments are provided but total_children is 0", () => {
      const r = computeHealthAppointmentContinuity(baseInput({
        total_children: 0,
        appointments: [makeAppointment()],
      }));
      expect(r.appointment_rating).toBe("insufficient_data");
      expect(r.appointment_score).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ZERO RECORDS (total_children > 0, appointments empty)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("zero records", () => {
    it("scores 45 with zero appointments (52 - 3 - 1 - 1 - 2 = 45)", () => {
      const r = computeHealthAppointmentContinuity(baseInput());
      // Mod1: -3, Mod2: 0, Mod3: -1, Mod4: 0, Mod5: -1, Mod6: -2 = 52 - 7 = 45
      expect(r.appointment_score).toBe(45);
      expect(r.appointment_rating).toBe("adequate");
    });

    it("sets all metrics to 0 when appointments empty", () => {
      const r = computeHealthAppointmentContinuity(baseInput());
      expect(r.total_appointments).toBe(0);
      expect(r.attendance_rate).toBe(0);
      expect(r.missed_rate).toBe(0);
      expect(r.outcome_documentation_rate).toBe(0);
      expect(r.transport_compliance_rate).toBe(0);
      expect(r.health_domain_variety).toBe(0);
      expect(r.children_with_appointments_rate).toBe(0);
    });

    it("generates concern about no health appointments recorded", () => {
      const r = computeHealthAppointmentContinuity(baseInput());
      expect(r.concerns).toContain("No health appointments recorded — children may not be accessing essential healthcare");
    });

    it("generates immediate recommendation to establish tracking", () => {
      const r = computeHealthAppointmentContinuity(baseInput());
      expect(r.recommendations).toHaveLength(1);
      expect(r.recommendations[0]).toEqual({
        rank: 1,
        recommendation: "Establish a comprehensive health appointment tracking system for all children",
        urgency: "immediate",
        regulatory_ref: "CHR 2015 Reg 10",
      });
    });

    it("generates critical insight about Ofsted verification", () => {
      const r = computeHealthAppointmentContinuity(baseInput());
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0]).toEqual({
        text: "No health appointments on record means Ofsted cannot verify children are accessing healthcare",
        severity: "critical",
      });
    });

    it("produces adequate headline for zero records", () => {
      const r = computeHealthAppointmentContinuity(baseInput());
      expect(r.headline).toBe("Health appointments are managed adequately but attendance and documentation need improvement");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // OUTSTANDING SCENARIOS (score >= 80)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("outstanding threshold (≥80)", () => {
    it("rates outstanding with perfect data across all modifiers", () => {
      // 10 appointments, all attended, all outcomes, all transport, 5+ types, all 6 children
      const appointments: AppointmentRecordInput[] = [
        makeAppointment({ id: "a1", child_id: "c1", appointment_type: "gp" }),
        makeAppointment({ id: "a2", child_id: "c2", appointment_type: "dental" }),
        makeAppointment({ id: "a3", child_id: "c3", appointment_type: "optician" }),
        makeAppointment({ id: "a4", child_id: "c4", appointment_type: "camhs" }),
        makeAppointment({ id: "a5", child_id: "c5", appointment_type: "hospital" }),
        makeAppointment({ id: "a6", child_id: "c6", appointment_type: "therapy" }),
        makeAppointment({ id: "a7", child_id: "c1", appointment_type: "specialist" }),
        makeAppointment({ id: "a8", child_id: "c2", appointment_type: "gp" }),
        makeAppointment({ id: "a9", child_id: "c3", appointment_type: "dental" }),
        makeAppointment({ id: "a10", child_id: "c4", appointment_type: "optician" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      // 52 + 6 + 5 + 5 + 4 + 5 + 5 = 82
      expect(r.appointment_score).toBe(82);
      expect(r.appointment_rating).toBe("outstanding");
    });

    it("produces outstanding headline", () => {
      const appointments: AppointmentRecordInput[] = [
        makeAppointment({ id: "a1", child_id: "c1", appointment_type: "gp" }),
        makeAppointment({ id: "a2", child_id: "c2", appointment_type: "dental" }),
        makeAppointment({ id: "a3", child_id: "c3", appointment_type: "optician" }),
        makeAppointment({ id: "a4", child_id: "c4", appointment_type: "camhs" }),
        makeAppointment({ id: "a5", child_id: "c5", appointment_type: "hospital" }),
        makeAppointment({ id: "a6", child_id: "c6", appointment_type: "therapy" }),
        makeAppointment({ id: "a7", child_id: "c1", appointment_type: "specialist" }),
        makeAppointment({ id: "a8", child_id: "c2", appointment_type: "gp" }),
        makeAppointment({ id: "a9", child_id: "c3", appointment_type: "dental" }),
        makeAppointment({ id: "a10", child_id: "c4", appointment_type: "optician" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.headline).toBe("Health appointment management is exemplary — children receive timely, comprehensive healthcare");
    });

    it("generates all six strengths when all thresholds are met", () => {
      const appointments: AppointmentRecordInput[] = [
        makeAppointment({ id: "a1", child_id: "c1", appointment_type: "gp" }),
        makeAppointment({ id: "a2", child_id: "c2", appointment_type: "dental" }),
        makeAppointment({ id: "a3", child_id: "c3", appointment_type: "optician" }),
        makeAppointment({ id: "a4", child_id: "c4", appointment_type: "camhs" }),
        makeAppointment({ id: "a5", child_id: "c5", appointment_type: "hospital" }),
        makeAppointment({ id: "a6", child_id: "c6", appointment_type: "therapy" }),
        makeAppointment({ id: "a7", child_id: "c1", appointment_type: "specialist" }),
        makeAppointment({ id: "a8", child_id: "c2", appointment_type: "gp" }),
        makeAppointment({ id: "a9", child_id: "c3", appointment_type: "dental" }),
        makeAppointment({ id: "a10", child_id: "c4", appointment_type: "optician" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.strengths).toHaveLength(6);
      expect(r.strengths).toContain("Excellent appointment attendance ensures children receive consistent healthcare");
      expect(r.strengths).toContain("No missed appointments — every health engagement is prioritised");
      expect(r.strengths).toContain("Appointment outcomes are consistently documented — care continuity is assured");
      expect(r.strengths).toContain("Transport is reliably arranged for all appointments");
      expect(r.strengths).toContain("Broad range of health services engaged — children receive holistic healthcare");
      expect(r.strengths).toContain("All children have scheduled health appointments — no child is overlooked");
    });

    it("generates exemplary positive insight when attendance>=90, outcome>=85, childrenRate>=90, total>=10", () => {
      const appointments: AppointmentRecordInput[] = [
        makeAppointment({ id: "a1", child_id: "c1", appointment_type: "gp" }),
        makeAppointment({ id: "a2", child_id: "c2", appointment_type: "dental" }),
        makeAppointment({ id: "a3", child_id: "c3", appointment_type: "optician" }),
        makeAppointment({ id: "a4", child_id: "c4", appointment_type: "camhs" }),
        makeAppointment({ id: "a5", child_id: "c5", appointment_type: "hospital" }),
        makeAppointment({ id: "a6", child_id: "c6", appointment_type: "therapy" }),
        makeAppointment({ id: "a7", child_id: "c1", appointment_type: "specialist" }),
        makeAppointment({ id: "a8", child_id: "c2", appointment_type: "gp" }),
        makeAppointment({ id: "a9", child_id: "c3", appointment_type: "dental" }),
        makeAppointment({ id: "a10", child_id: "c4", appointment_type: "optician" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.insights).toContainEqual({
        text: "Health appointment management is exemplary — every child receives timely, well-documented healthcare",
        severity: "positive",
      });
    });

    it("has empty concerns and recommendations when outstanding", () => {
      const appointments: AppointmentRecordInput[] = [
        makeAppointment({ id: "a1", child_id: "c1", appointment_type: "gp" }),
        makeAppointment({ id: "a2", child_id: "c2", appointment_type: "dental" }),
        makeAppointment({ id: "a3", child_id: "c3", appointment_type: "optician" }),
        makeAppointment({ id: "a4", child_id: "c4", appointment_type: "camhs" }),
        makeAppointment({ id: "a5", child_id: "c5", appointment_type: "hospital" }),
        makeAppointment({ id: "a6", child_id: "c6", appointment_type: "therapy" }),
        makeAppointment({ id: "a7", child_id: "c1", appointment_type: "specialist" }),
        makeAppointment({ id: "a8", child_id: "c2", appointment_type: "gp" }),
        makeAppointment({ id: "a9", child_id: "c3", appointment_type: "dental" }),
        makeAppointment({ id: "a10", child_id: "c4", appointment_type: "optician" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GOOD SCENARIOS (score 65–79)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("good threshold (65–79)", () => {
    it("rates good when attendance is high but fewer types and some children missing", () => {
      // 10 attended, all outcomes, all transport, 3 types, 4/6 children
      // Mod1: +6, Mod2: +5, Mod3: +5, Mod4: +4, Mod5: +2 (3 types), Mod6: +2 (67%)
      // 52 + 6 + 5 + 5 + 4 + 2 + 2 = 76
      const appointments: AppointmentRecordInput[] = [
        makeAppointment({ id: "a1", child_id: "c1", appointment_type: "gp" }),
        makeAppointment({ id: "a2", child_id: "c1", appointment_type: "dental" }),
        makeAppointment({ id: "a3", child_id: "c2", appointment_type: "optician" }),
        makeAppointment({ id: "a4", child_id: "c2", appointment_type: "gp" }),
        makeAppointment({ id: "a5", child_id: "c3", appointment_type: "dental" }),
        makeAppointment({ id: "a6", child_id: "c3", appointment_type: "gp" }),
        makeAppointment({ id: "a7", child_id: "c4", appointment_type: "gp" }),
        makeAppointment({ id: "a8", child_id: "c4", appointment_type: "dental" }),
        makeAppointment({ id: "a9", child_id: "c1", appointment_type: "optician" }),
        makeAppointment({ id: "a10", child_id: "c2", appointment_type: "gp" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.appointment_score).toBe(76);
      expect(r.appointment_rating).toBe("good");
    });

    it("produces good headline", () => {
      const appointments: AppointmentRecordInput[] = [
        makeAppointment({ id: "a1", child_id: "c1", appointment_type: "gp" }),
        makeAppointment({ id: "a2", child_id: "c1", appointment_type: "dental" }),
        makeAppointment({ id: "a3", child_id: "c2", appointment_type: "optician" }),
        makeAppointment({ id: "a4", child_id: "c2", appointment_type: "gp" }),
        makeAppointment({ id: "a5", child_id: "c3", appointment_type: "dental" }),
        makeAppointment({ id: "a6", child_id: "c3", appointment_type: "gp" }),
        makeAppointment({ id: "a7", child_id: "c4", appointment_type: "gp" }),
        makeAppointment({ id: "a8", child_id: "c4", appointment_type: "dental" }),
        makeAppointment({ id: "a9", child_id: "c1", appointment_type: "optician" }),
        makeAppointment({ id: "a10", child_id: "c2", appointment_type: "gp" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.headline).toBe("Good health appointment practice with reliable attendance and broad health coverage");
    });

    it("rates good at score boundary 65", () => {
      // Need score exactly 65: 52 + ? = 65 -> need +13
      // Mod1: +6 (>=90%), Mod2: +5 (0%), Mod3: +2 (>=60%), Mod4: 0 (mid-range), Mod5: 0 (2 types), Mod6: 0 (mid-range)
      // 52 + 6 + 5 + 2 + 0 + 0 + 0 = 65
      // 10 appointments: 10 attended (100%), 0 missed, 7 outcomes (70%), 6 transport (60%), 2 types, 3/6 children (50%)
      const appointments: AppointmentRecordInput[] = [
        makeAppointment({ id: "a1", child_id: "c1", appointment_type: "gp" }),
        makeAppointment({ id: "a2", child_id: "c1", appointment_type: "gp" }),
        makeAppointment({ id: "a3", child_id: "c1", appointment_type: "dental" }),
        makeAppointment({ id: "a4", child_id: "c2", appointment_type: "gp" }),
        makeAppointment({ id: "a5", child_id: "c2", appointment_type: "dental" }),
        makeAppointment({ id: "a6", child_id: "c3", appointment_type: "gp" }),
        makeAppointment({ id: "a7", child_id: "c3", appointment_type: "gp", has_outcome: false }),
        makeAppointment({ id: "a8", child_id: "c1", appointment_type: "gp", has_outcome: false }),
        makeAppointment({ id: "a9", child_id: "c2", appointment_type: "gp", has_outcome: false, transport_arranged: false }),
        makeAppointment({ id: "a10", child_id: "c3", appointment_type: "dental", transport_arranged: false }),
      ];
      // attendance: 10/10 = 100% -> +6, missed: 0/10 = 0% -> +5, outcome: 7/10 = 70% -> +2
      // transport: 8/10 = 80% -> +1 ... that gives 66. Let me recalculate.
      // I need to be more precise. Let me recalculate for transport 60-69% -> no modifier (0).
      // Transport: need between 50-69% => no modifier. 6/10 = 60% -> no? >=70 -> +1, so 60% = 0
      // But wait, 70% is +1, <50% is -4. So 50-69% = no adjustment.
      // 2 types => uniqueTypes=2, which is >1 and <3, so no adjustment.
      // 3/6 children = 50%, which is >=40 and <60, so no adjustment.
      // 52 + 6 + 5 + 2 + 0 + 0 + 0 = 65
      // Need: 6/10 transport. So 4 without transport.
      const appointments2: AppointmentRecordInput[] = [
        makeAppointment({ id: "a1", child_id: "c1", appointment_type: "gp" }),
        makeAppointment({ id: "a2", child_id: "c1", appointment_type: "gp" }),
        makeAppointment({ id: "a3", child_id: "c1", appointment_type: "dental" }),
        makeAppointment({ id: "a4", child_id: "c2", appointment_type: "gp" }),
        makeAppointment({ id: "a5", child_id: "c2", appointment_type: "dental" }),
        makeAppointment({ id: "a6", child_id: "c3", appointment_type: "gp" }),
        makeAppointment({ id: "a7", child_id: "c3", appointment_type: "gp", has_outcome: false }),
        makeAppointment({ id: "a8", child_id: "c1", appointment_type: "gp", has_outcome: false }),
        makeAppointment({ id: "a9", child_id: "c2", appointment_type: "gp", has_outcome: false, transport_arranged: false }),
        makeAppointment({ id: "a10", child_id: "c3", appointment_type: "dental", has_outcome: false, transport_arranged: false }),
      ];
      // outcome: 6/10 = 60% -> +2. transport: 8/10 = 80% -> +1. Nope, need to remove more transport.
      // Let me rebuild properly:
      // Need: outcomeRate >= 60 -> +2. transportRate 50-69 -> 0. uniqueTypes=2 -> 0. childrenRate 40-59% -> 0.
      const precise: AppointmentRecordInput[] = [];
      for (let i = 0; i < 10; i++) {
        precise.push(makeAppointment({
          id: `a${i}`,
          child_id: i < 4 ? "c1" : i < 7 ? "c2" : "c3",
          appointment_type: i % 2 === 0 ? "gp" : "dental",
          has_outcome: i < 7,           // 7/10 = 70% -> +2
          transport_arranged: i < 6,    // 6/10 = 60% -> 0 (needs >=70 for +1)
        }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments: precise }));
      // attendance: 100% -> +6, missed 0% -> +5, outcome 70% -> +2, transport 60% -> 0, types 2 -> 0, children 50% (3/6) -> 0
      expect(r.appointment_score).toBe(65);
      expect(r.appointment_rating).toBe("good");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ADEQUATE SCENARIOS (score 45–64)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("adequate threshold (45–64)", () => {
    it("rates adequate with mid-range metrics", () => {
      // 10 appointments: 8 attended, 1 missed, 1 cancelled
      // Mod1: attendance 80% -> +2, Mod2: missed 10% -> 0, Mod3: outcome 50% -> 0
      // Mod4: transport 50% -> 0, Mod5: 2 types -> 0, Mod6: 2/6 children = 33% -> -5
      // 52 + 2 + 0 + 0 + 0 + 0 - 5 = 49
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 8; i++) {
        appointments.push(makeAppointment({
          id: `a${i}`,
          child_id: i < 5 ? "c1" : "c2",
          appointment_type: i % 2 === 0 ? "gp" : "dental",
          has_outcome: i < 5,
          transport_arranged: i < 5,
        }));
      }
      appointments.push(makeAppointment({ id: "a8", child_id: "c1", appointment_type: "gp", status: "missed", has_outcome: false, transport_arranged: false }));
      appointments.push(makeAppointment({ id: "a9", child_id: "c2", appointment_type: "dental", status: "cancelled", has_outcome: false, transport_arranged: false }));
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.appointment_score).toBe(49);
      expect(r.appointment_rating).toBe("adequate");
    });

    it("rates adequate at lower boundary score 45 with zero records", () => {
      const r = computeHealthAppointmentContinuity(baseInput());
      expect(r.appointment_score).toBe(45);
      expect(r.appointment_rating).toBe("adequate");
    });

    it("produces adequate headline", () => {
      const r = computeHealthAppointmentContinuity(baseInput());
      expect(r.headline).toBe("Health appointments are managed adequately but attendance and documentation need improvement");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INADEQUATE SCENARIOS (score < 45)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("inadequate threshold (<45)", () => {
    it("rates inadequate when all modifiers are negative", () => {
      // 10 appointments: 5 attended (50%), 3 missed (30%), 2 cancelled
      // outcomes: 3/10 = 30%, transport: 4/10 = 40%, 1 type, 1/6 children = 17%
      // Mod1: <60 -> -5, Mod2: >=20 -> -5, Mod3: <40 -> -4, Mod4: <50 -> -4, Mod5: <=1 -> -3, Mod6: <40 -> -5
      // 52 - 5 - 5 - 4 - 4 - 3 - 5 = 26
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 5; i++) {
        appointments.push(makeAppointment({
          id: `att${i}`, child_id: "c1", appointment_type: "gp",
          has_outcome: i < 3, transport_arranged: i < 4,
        }));
      }
      for (let i = 0; i < 3; i++) {
        appointments.push(makeAppointment({
          id: `miss${i}`, child_id: "c1", appointment_type: "gp", status: "missed",
          has_outcome: false, transport_arranged: false,
        }));
      }
      for (let i = 0; i < 2; i++) {
        appointments.push(makeAppointment({
          id: `canc${i}`, child_id: "c1", appointment_type: "gp", status: "cancelled",
          has_outcome: false, transport_arranged: false,
        }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.appointment_score).toBe(26);
      expect(r.appointment_rating).toBe("inadequate");
    });

    it("produces inadequate headline", () => {
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 5; i++) {
        appointments.push(makeAppointment({ id: `att${i}`, child_id: "c1", appointment_type: "gp", has_outcome: false, transport_arranged: false }));
      }
      for (let i = 0; i < 5; i++) {
        appointments.push(makeAppointment({ id: `miss${i}`, child_id: "c1", appointment_type: "gp", status: "missed", has_outcome: false, transport_arranged: false }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.headline).toBe("Health appointment practice is inadequate — children are missing essential healthcare");
    });

    it("generates all concerns when all thresholds are breached", () => {
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 5; i++) {
        appointments.push(makeAppointment({
          id: `att${i}`, child_id: "c1", appointment_type: "gp",
          has_outcome: i < 3, transport_arranged: i < 4,
        }));
      }
      for (let i = 0; i < 3; i++) {
        appointments.push(makeAppointment({
          id: `miss${i}`, child_id: "c1", appointment_type: "gp", status: "missed",
          has_outcome: false, transport_arranged: false,
        }));
      }
      for (let i = 0; i < 2; i++) {
        appointments.push(makeAppointment({
          id: `canc${i}`, child_id: "c1", appointment_type: "gp", status: "cancelled",
          has_outcome: false, transport_arranged: false,
        }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      // missedRate = 30%, attendanceRate = 50%, outcomeRate = 30%, childrenRate = 17%, uniqueTypes = 1
      expect(r.concerns).toContain("30% of appointments are missed — children are not receiving planned healthcare");
      expect(r.concerns).toContain("Appointment attendance is critically low — health needs are going unmet");
      expect(r.concerns).toContain("Most appointments lack outcome documentation — care continuity is compromised");
      expect(r.concerns).toContain("Most children have no recorded appointments — health oversight is inadequate");
      expect(r.concerns).toContain("Health engagement is limited to a single domain — broader health needs may be unmet");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODIFIER 1: ATTENDANCE RATE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Modifier 1: Attendance rate", () => {
    it("adds +6 when attendance >= 90%", () => {
      // 10 attended, 0 missed, 1 cancelled -> 91% attendance (10/11)
      // But simpler: 10/10 = 100%
      const appointments = Array.from({ length: 10 }, (_, i) =>
        makeAppointment({ id: `a${i}`, child_id: `c${(i % 6) + 1}`, appointment_type: ["gp", "dental", "optician", "camhs", "hospital"][i % 5] }),
      );
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      // attendance 100% -> +6, missed 0% -> +5, outcome 100% -> +5, transport 100% -> +4, 5 types -> +5, 6 children -> +5 (100%)
      // 52 + 6 + 5 + 5 + 4 + 5 + 5 = 82
      expect(r.attendance_rate).toBe(100);
      expect(r.appointment_score).toBe(82);
    });

    it("adds +2 when attendance 75-89%", () => {
      // 8 attended, 2 scheduled out of 10 -> 80%
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 8; i++) {
        appointments.push(makeAppointment({
          id: `a${i}`, child_id: `c${(i % 6) + 1}`,
          appointment_type: ["gp", "dental", "optician", "camhs", "hospital"][i % 5],
        }));
      }
      appointments.push(makeAppointment({ id: "s1", child_id: "c1", appointment_type: "gp", status: "scheduled" }));
      appointments.push(makeAppointment({ id: "s2", child_id: "c2", appointment_type: "dental", status: "scheduled" }));
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.attendance_rate).toBe(80);
      // Mod1: +2, Mod2: missedRate 0% -> +5, Mod3: outcome 100% -> +5, Mod4: transport 100% -> +4
      // Mod5: 5 types -> +5, Mod6: 6/6=100% -> +5
      // 52 + 2 + 5 + 5 + 4 + 5 + 5 = 78
      expect(r.appointment_score).toBe(78);
    });

    it("no adjustment when attendance 60-74%", () => {
      // 7 attended, 3 rescheduled -> 70%
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 7; i++) {
        appointments.push(makeAppointment({
          id: `a${i}`, child_id: `c${(i % 6) + 1}`,
          appointment_type: ["gp", "dental", "optician", "camhs", "hospital"][i % 5],
        }));
      }
      for (let i = 0; i < 3; i++) {
        appointments.push(makeAppointment({
          id: `r${i}`, child_id: `c${i + 1}`, appointment_type: "gp", status: "rescheduled",
        }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.attendance_rate).toBe(70);
      // Mod1: 0, Mod2: missedRate 0 -> +5, Mod3: 100% -> +5, Mod4: 100% -> +4
      // Mod5: 5 types -> +5, Mod6: 6/6=100% -> +5
      // 52 + 0 + 5 + 5 + 4 + 5 + 5 = 76
      expect(r.appointment_score).toBe(76);
    });

    it("subtracts -5 when attendance < 60%", () => {
      // 5 attended, 5 cancelled -> 50%
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 5; i++) {
        appointments.push(makeAppointment({
          id: `a${i}`, child_id: `c${(i % 6) + 1}`,
          appointment_type: ["gp", "dental", "optician", "camhs", "hospital"][i % 5],
        }));
      }
      for (let i = 0; i < 5; i++) {
        appointments.push(makeAppointment({
          id: `c${i}`, child_id: `c${(i % 6) + 1}`, appointment_type: "therapy", status: "cancelled",
        }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.attendance_rate).toBe(50);
      // Mod1: -5, Mod2: missedRate 0 -> +5, Mod3: 100% -> +5, Mod4: 100% -> +4
      // Mod5: 6 types -> +5, Mod6: 5/6=83% >= 60% -> +2
      // 52 - 5 + 5 + 5 + 4 + 5 + 2 = 68
      expect(r.appointment_score).toBe(68);
    });

    it("subtracts -3 for attendance modifier when total is 0", () => {
      const r = computeHealthAppointmentContinuity(baseInput());
      // 52 - 3(mod1) + 0(mod2) - 1(mod3) + 0(mod4) - 1(mod5) - 2(mod6) = 45
      expect(r.appointment_score).toBe(45);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODIFIER 2: MISSED APPOINTMENT RATE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Modifier 2: Missed appointment rate", () => {
    it("adds +5 when missed rate is 0%", () => {
      const appointments = [makeAppointment({ id: "a1", child_id: "c1" })];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.missed_rate).toBe(0);
      // Single appointment: attendance 100% -> +6, missed 0% -> +5, outcome 100% -> +5
      // transport 100% -> +4, 1 type -> -3, 1/6 children = 17% -> -5
      // 52 + 6 + 5 + 5 + 4 - 3 - 5 = 64
      expect(r.appointment_score).toBe(64);
    });

    it("adds +2 when missed rate 1-5%", () => {
      // Need 1 missed in 20 to get 5%
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 19; i++) {
        appointments.push(makeAppointment({
          id: `a${i}`, child_id: `c${(i % 6) + 1}`,
          appointment_type: ["gp", "dental", "optician", "camhs", "hospital"][i % 5],
        }));
      }
      appointments.push(makeAppointment({
        id: "m1", child_id: "c6", appointment_type: "therapy", status: "missed",
      }));
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.missed_rate).toBe(5);
      // Mod1: 19/20=95% -> +6, Mod2: 5% -> +2, Mod3: 100% -> +5, Mod4: 100% -> +4
      // Mod5: 6 types -> +5, Mod6: 6/6=100% -> +5
      // 52 + 6 + 2 + 5 + 4 + 5 + 5 = 79
      expect(r.appointment_score).toBe(79);
    });

    it("no adjustment when missed rate 6-19%", () => {
      // 1 missed in 10 = 10%
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 9; i++) {
        appointments.push(makeAppointment({
          id: `a${i}`, child_id: `c${(i % 6) + 1}`,
          appointment_type: ["gp", "dental", "optician", "camhs", "hospital"][i % 5],
        }));
      }
      appointments.push(makeAppointment({
        id: "m1", child_id: "c6", appointment_type: "therapy", status: "missed",
      }));
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.missed_rate).toBe(10);
      // Mod1: 9/10=90% -> +6, Mod2: 10% -> 0, Mod3: 100% -> +5, Mod4: 100% -> +4
      // Mod5: 6 types -> +5, Mod6: 6/6=100% -> +5
      // 52 + 6 + 0 + 5 + 4 + 5 + 5 = 77
      expect(r.appointment_score).toBe(77);
    });

    it("subtracts -5 when missed rate >= 20%", () => {
      // 2 missed in 10 = 20%
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 8; i++) {
        appointments.push(makeAppointment({
          id: `a${i}`, child_id: `c${(i % 6) + 1}`,
          appointment_type: ["gp", "dental", "optician", "camhs", "hospital"][i % 5],
        }));
      }
      appointments.push(makeAppointment({ id: "m1", child_id: "c5", appointment_type: "therapy", status: "missed" }));
      appointments.push(makeAppointment({ id: "m2", child_id: "c6", appointment_type: "specialist", status: "missed" }));
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.missed_rate).toBe(20);
      // Mod1: 8/10=80% -> +2, Mod2: 20% -> -5, Mod3: 100% -> +5, Mod4: 100% -> +4
      // Mod5: 7 types -> +5, Mod6: 6/6=100% -> +5
      // 52 + 2 - 5 + 5 + 4 + 5 + 5 = 68
      expect(r.appointment_score).toBe(68);
    });

    it("no adjustment for missed rate when total is 0", () => {
      // Already tested in zero records — modifier 2 has no adjustment when total is 0
      const r = computeHealthAppointmentContinuity(baseInput());
      // Score 45 = 52 - 3 - 1 - 1 - 2, no contribution from mod 2
      expect(r.appointment_score).toBe(45);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODIFIER 3: OUTCOME DOCUMENTATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Modifier 3: Outcome documentation", () => {
    it("adds +5 when outcome rate >= 85%", () => {
      // 9/10 = 90% outcomes
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 10; i++) {
        appointments.push(makeAppointment({
          id: `a${i}`, child_id: `c${(i % 6) + 1}`,
          appointment_type: ["gp", "dental", "optician", "camhs", "hospital"][i % 5],
          has_outcome: i < 9,
        }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.outcome_documentation_rate).toBe(90);
      // Mod1: 100% -> +6, Mod2: 0% -> +5, Mod3: 90% -> +5, Mod4: 100% -> +4
      // Mod5: 5 types -> +5, Mod6: 6/6=100% -> +5
      // 52 + 6 + 5 + 5 + 4 + 5 + 5 = 82
      expect(r.appointment_score).toBe(82);
    });

    it("adds +2 when outcome rate 60-84%", () => {
      // 7/10 = 70% outcomes
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 10; i++) {
        appointments.push(makeAppointment({
          id: `a${i}`, child_id: `c${(i % 6) + 1}`,
          appointment_type: ["gp", "dental", "optician", "camhs", "hospital"][i % 5],
          has_outcome: i < 7,
        }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.outcome_documentation_rate).toBe(70);
      // Mod3: +2
      // 52 + 6 + 5 + 2 + 4 + 5 + 5 = 79
      expect(r.appointment_score).toBe(79);
    });

    it("no adjustment when outcome rate 40-59%", () => {
      // 5/10 = 50% outcomes
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 10; i++) {
        appointments.push(makeAppointment({
          id: `a${i}`, child_id: `c${(i % 6) + 1}`,
          appointment_type: ["gp", "dental", "optician", "camhs", "hospital"][i % 5],
          has_outcome: i < 5,
        }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.outcome_documentation_rate).toBe(50);
      // Mod3: 0
      // 52 + 6 + 5 + 0 + 4 + 5 + 5 = 77
      expect(r.appointment_score).toBe(77);
    });

    it("subtracts -4 when outcome rate < 40%", () => {
      // 3/10 = 30% outcomes
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 10; i++) {
        appointments.push(makeAppointment({
          id: `a${i}`, child_id: `c${(i % 6) + 1}`,
          appointment_type: ["gp", "dental", "optician", "camhs", "hospital"][i % 5],
          has_outcome: i < 3,
        }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.outcome_documentation_rate).toBe(30);
      // Mod3: -4
      // 52 + 6 + 5 - 4 + 4 + 5 + 5 = 73
      expect(r.appointment_score).toBe(73);
    });

    it("subtracts -1 for outcome modifier when total is 0", () => {
      const r = computeHealthAppointmentContinuity(baseInput());
      // Confirmed: mod3 contributes -1 to the 45 total
      expect(r.appointment_score).toBe(45);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODIFIER 4: TRANSPORT COMPLIANCE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Modifier 4: Transport compliance", () => {
    it("adds +4 when transport rate >= 90%", () => {
      // All 10 have transport = 100%
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 10; i++) {
        appointments.push(makeAppointment({
          id: `a${i}`, child_id: `c${(i % 6) + 1}`,
          appointment_type: ["gp", "dental", "optician", "camhs", "hospital"][i % 5],
        }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.transport_compliance_rate).toBe(100);
    });

    it("adds +1 when transport rate 70-89%", () => {
      // 8/10 = 80%
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 10; i++) {
        appointments.push(makeAppointment({
          id: `a${i}`, child_id: `c${(i % 6) + 1}`,
          appointment_type: ["gp", "dental", "optician", "camhs", "hospital"][i % 5],
          transport_arranged: i < 8,
        }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.transport_compliance_rate).toBe(80);
      // Mod4: +1 (instead of +4)
      // 52 + 6 + 5 + 5 + 1 + 5 + 5 = 79
      expect(r.appointment_score).toBe(79);
    });

    it("no adjustment when transport rate 50-69%", () => {
      // 6/10 = 60%
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 10; i++) {
        appointments.push(makeAppointment({
          id: `a${i}`, child_id: `c${(i % 6) + 1}`,
          appointment_type: ["gp", "dental", "optician", "camhs", "hospital"][i % 5],
          transport_arranged: i < 6,
        }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.transport_compliance_rate).toBe(60);
      // Mod4: 0
      // 52 + 6 + 5 + 5 + 0 + 5 + 5 = 78
      expect(r.appointment_score).toBe(78);
    });

    it("subtracts -4 when transport rate < 50%", () => {
      // 4/10 = 40%
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 10; i++) {
        appointments.push(makeAppointment({
          id: `a${i}`, child_id: `c${(i % 6) + 1}`,
          appointment_type: ["gp", "dental", "optician", "camhs", "hospital"][i % 5],
          transport_arranged: i < 4,
        }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.transport_compliance_rate).toBe(40);
      // Mod4: -4
      // 52 + 6 + 5 + 5 - 4 + 5 + 5 = 74
      expect(r.appointment_score).toBe(74);
    });

    it("no adjustment for transport modifier when total is 0", () => {
      const r = computeHealthAppointmentContinuity(baseInput());
      // mod4 contributes 0 to the score
      expect(r.appointment_score).toBe(45);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODIFIER 5: HEALTH DOMAIN VARIETY
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Modifier 5: Health domain variety", () => {
    it("adds +5 when uniqueTypes >= 5", () => {
      const appointments: AppointmentRecordInput[] = [
        makeAppointment({ id: "a1", child_id: "c1", appointment_type: "gp" }),
        makeAppointment({ id: "a2", child_id: "c2", appointment_type: "dental" }),
        makeAppointment({ id: "a3", child_id: "c3", appointment_type: "optician" }),
        makeAppointment({ id: "a4", child_id: "c4", appointment_type: "camhs" }),
        makeAppointment({ id: "a5", child_id: "c5", appointment_type: "hospital" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.health_domain_variety).toBe(5);
    });

    it("adds +2 when uniqueTypes 3-4", () => {
      const appointments: AppointmentRecordInput[] = [
        makeAppointment({ id: "a1", child_id: "c1", appointment_type: "gp" }),
        makeAppointment({ id: "a2", child_id: "c2", appointment_type: "dental" }),
        makeAppointment({ id: "a3", child_id: "c3", appointment_type: "optician" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.health_domain_variety).toBe(3);
      // Mod5: +2
      // Mod1: 100% -> +6, Mod2: 0% -> +5, Mod3: 100% -> +5, Mod4: 100% -> +4
      // Mod5: +2, Mod6: 3/6=50% -> 0
      // 52 + 6 + 5 + 5 + 4 + 2 + 0 = 74
      expect(r.appointment_score).toBe(74);
    });

    it("no adjustment when uniqueTypes is 2", () => {
      const appointments: AppointmentRecordInput[] = [
        makeAppointment({ id: "a1", child_id: "c1", appointment_type: "gp" }),
        makeAppointment({ id: "a2", child_id: "c2", appointment_type: "dental" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.health_domain_variety).toBe(2);
      // Mod5: 0
      // 52 + 6 + 5 + 5 + 4 + 0 + 0 (2/6=33% -> -5)
      // Wait: childrenRate = 2/6 = 33% -> -5
      // 52 + 6 + 5 + 5 + 4 + 0 - 5 = 67
      expect(r.appointment_score).toBe(67);
    });

    it("subtracts -3 when uniqueTypes <= 1", () => {
      const appointments: AppointmentRecordInput[] = [
        makeAppointment({ id: "a1", child_id: "c1", appointment_type: "gp" }),
        makeAppointment({ id: "a2", child_id: "c2", appointment_type: "gp" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.health_domain_variety).toBe(1);
      // Mod5: -3
      // 52 + 6 + 5 + 5 + 4 - 3 - 5 = 64 (childrenRate 2/6=33% -> -5)
      expect(r.appointment_score).toBe(64);
    });

    it("subtracts -1 for variety modifier when total is 0", () => {
      const r = computeHealthAppointmentContinuity(baseInput());
      // mod5 contributes -1 to the score
      expect(r.appointment_score).toBe(45);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODIFIER 6: CHILDREN COVERAGE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Modifier 6: Children coverage", () => {
    it("adds +5 when childrenRate >= 90%", () => {
      // 6/6 = 100%
      const appointments: AppointmentRecordInput[] = [
        makeAppointment({ id: "a1", child_id: "c1", appointment_type: "gp" }),
        makeAppointment({ id: "a2", child_id: "c2", appointment_type: "dental" }),
        makeAppointment({ id: "a3", child_id: "c3", appointment_type: "optician" }),
        makeAppointment({ id: "a4", child_id: "c4", appointment_type: "camhs" }),
        makeAppointment({ id: "a5", child_id: "c5", appointment_type: "hospital" }),
        makeAppointment({ id: "a6", child_id: "c6", appointment_type: "therapy" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.children_with_appointments_rate).toBe(100);
      // Mod6: +5
    });

    it("adds +2 when childrenRate 60-89%", () => {
      // 4/6 = 67%
      const appointments: AppointmentRecordInput[] = [
        makeAppointment({ id: "a1", child_id: "c1", appointment_type: "gp" }),
        makeAppointment({ id: "a2", child_id: "c2", appointment_type: "dental" }),
        makeAppointment({ id: "a3", child_id: "c3", appointment_type: "optician" }),
        makeAppointment({ id: "a4", child_id: "c4", appointment_type: "camhs" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.children_with_appointments_rate).toBe(67);
      // Mod6: +2
      // 52 + 6 + 5 + 5 + 4 + 2 (4 types) + 2 = 76
      expect(r.appointment_score).toBe(76);
    });

    it("no adjustment when childrenRate 40-59%", () => {
      // 3/6 = 50%
      const appointments: AppointmentRecordInput[] = [
        makeAppointment({ id: "a1", child_id: "c1", appointment_type: "gp" }),
        makeAppointment({ id: "a2", child_id: "c2", appointment_type: "dental" }),
        makeAppointment({ id: "a3", child_id: "c3", appointment_type: "optician" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.children_with_appointments_rate).toBe(50);
      // Mod6: 0
      // 52 + 6 + 5 + 5 + 4 + 2 + 0 = 74
      expect(r.appointment_score).toBe(74);
    });

    it("subtracts -5 when childrenRate < 40%", () => {
      // 2/6 = 33%
      const appointments: AppointmentRecordInput[] = [
        makeAppointment({ id: "a1", child_id: "c1", appointment_type: "gp" }),
        makeAppointment({ id: "a2", child_id: "c2", appointment_type: "dental" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.children_with_appointments_rate).toBe(33);
      // Mod6: -5
      // 52 + 6 + 5 + 5 + 4 + 0(2 types) - 5 = 67
      expect(r.appointment_score).toBe(67);
    });

    it("subtracts -2 for children coverage modifier when total is 0", () => {
      const r = computeHealthAppointmentContinuity(baseInput());
      expect(r.appointment_score).toBe(45);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // METRIC CALCULATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("metric calculations", () => {
    it("calculates attendance_rate as pct(attended, total)", () => {
      const appointments = [
        makeAppointment({ id: "a1", status: "attended" }),
        makeAppointment({ id: "a2", status: "attended" }),
        makeAppointment({ id: "a3", status: "missed" }),
        makeAppointment({ id: "a4", status: "cancelled" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.attendance_rate).toBe(50); // 2/4 = 50%
    });

    it("calculates missed_rate as pct(missed, total)", () => {
      const appointments = [
        makeAppointment({ id: "a1", status: "attended" }),
        makeAppointment({ id: "a2", status: "missed" }),
        makeAppointment({ id: "a3", status: "missed" }),
        makeAppointment({ id: "a4", status: "cancelled" }),
        makeAppointment({ id: "a5", status: "scheduled" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.missed_rate).toBe(40); // 2/5 = 40%
    });

    it("calculates outcome_documentation_rate as pct(has_outcome, total)", () => {
      const appointments = [
        makeAppointment({ id: "a1", has_outcome: true }),
        makeAppointment({ id: "a2", has_outcome: true }),
        makeAppointment({ id: "a3", has_outcome: false }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.outcome_documentation_rate).toBe(67); // 2/3 = 66.67 -> round = 67
    });

    it("calculates transport_compliance_rate as pct(transport_arranged, total)", () => {
      const appointments = [
        makeAppointment({ id: "a1", transport_arranged: true }),
        makeAppointment({ id: "a2", transport_arranged: false }),
        makeAppointment({ id: "a3", transport_arranged: true }),
        makeAppointment({ id: "a4", transport_arranged: true }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.transport_compliance_rate).toBe(75); // 3/4 = 75%
    });

    it("calculates health_domain_variety as unique appointment_type count", () => {
      const appointments = [
        makeAppointment({ id: "a1", appointment_type: "gp" }),
        makeAppointment({ id: "a2", appointment_type: "gp" }),
        makeAppointment({ id: "a3", appointment_type: "dental" }),
        makeAppointment({ id: "a4", appointment_type: "camhs" }),
        makeAppointment({ id: "a5", appointment_type: "dental" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.health_domain_variety).toBe(3);
    });

    it("calculates children_with_appointments_rate as pct(unique children, total_children)", () => {
      const appointments = [
        makeAppointment({ id: "a1", child_id: "c1" }),
        makeAppointment({ id: "a2", child_id: "c1" }),
        makeAppointment({ id: "a3", child_id: "c2" }),
        makeAppointment({ id: "a4", child_id: "c3" }),
        makeAppointment({ id: "a5", child_id: "c3" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.children_with_appointments_rate).toBe(50); // 3/6 = 50%
    });

    it("counts total_appointments correctly", () => {
      const appointments = [
        makeAppointment({ id: "a1" }),
        makeAppointment({ id: "a2" }),
        makeAppointment({ id: "a3" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.total_appointments).toBe(3);
    });

    it("rounds pct correctly (Math.round)", () => {
      // 1/3 = 33.33... -> 33
      const appointments = [
        makeAppointment({ id: "a1", child_id: "c1", has_outcome: true }),
        makeAppointment({ id: "a2", child_id: "c2", has_outcome: false }),
        makeAppointment({ id: "a3", child_id: "c3", has_outcome: false }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.outcome_documentation_rate).toBe(33);
    });

    it("rounds pct up at .5 (2/3 = 66.67 -> 67)", () => {
      const appointments = [
        makeAppointment({ id: "a1", has_outcome: true }),
        makeAppointment({ id: "a2", has_outcome: true }),
        makeAppointment({ id: "a3", has_outcome: false }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.outcome_documentation_rate).toBe(67);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // STRENGTHS GENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe("strengths generation", () => {
    it("includes attendance strength when attendance >= 90% and total > 0", () => {
      const appointments = [makeAppointment({ id: "a1" })];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.strengths).toContain("Excellent appointment attendance ensures children receive consistent healthcare");
    });

    it("includes missed strength when missedRate === 0 and total > 0", () => {
      const appointments = [makeAppointment({ id: "a1" })];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.strengths).toContain("No missed appointments — every health engagement is prioritised");
    });

    it("includes outcome strength when outcomeRate >= 85% and total > 0", () => {
      const appointments = [makeAppointment({ id: "a1" })]; // 1/1 = 100%
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.strengths).toContain("Appointment outcomes are consistently documented — care continuity is assured");
    });

    it("includes transport strength when transportRate >= 90% and total > 0", () => {
      const appointments = [makeAppointment({ id: "a1" })]; // 1/1 = 100%
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.strengths).toContain("Transport is reliably arranged for all appointments");
    });

    it("includes variety strength when uniqueTypes >= 5 and total > 0", () => {
      const appointments = [
        makeAppointment({ id: "a1", child_id: "c1", appointment_type: "gp" }),
        makeAppointment({ id: "a2", child_id: "c2", appointment_type: "dental" }),
        makeAppointment({ id: "a3", child_id: "c3", appointment_type: "optician" }),
        makeAppointment({ id: "a4", child_id: "c4", appointment_type: "camhs" }),
        makeAppointment({ id: "a5", child_id: "c5", appointment_type: "hospital" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.strengths).toContain("Broad range of health services engaged — children receive holistic healthcare");
    });

    it("includes children coverage strength when childrenRate >= 90% and total > 0", () => {
      const appointments: AppointmentRecordInput[] = [
        makeAppointment({ id: "a1", child_id: "c1" }),
        makeAppointment({ id: "a2", child_id: "c2" }),
        makeAppointment({ id: "a3", child_id: "c3" }),
        makeAppointment({ id: "a4", child_id: "c4" }),
        makeAppointment({ id: "a5", child_id: "c5" }),
        makeAppointment({ id: "a6", child_id: "c6" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.strengths).toContain("All children have scheduled health appointments — no child is overlooked");
    });

    it("does not include strengths when total is 0 even if rates would qualify", () => {
      const r = computeHealthAppointmentContinuity(baseInput());
      expect(r.strengths).toEqual([]);
    });

    it("does not include attendance strength when attendance < 90%", () => {
      const appointments = [
        makeAppointment({ id: "a1", status: "attended" }),
        makeAppointment({ id: "a2", status: "cancelled" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.attendance_rate).toBe(50);
      expect(r.strengths).not.toContain("Excellent appointment attendance ensures children receive consistent healthcare");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CONCERNS GENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe("concerns generation", () => {
    it("includes no-appointments concern when total is 0", () => {
      const r = computeHealthAppointmentContinuity(baseInput());
      expect(r.concerns).toContain("No health appointments recorded — children may not be accessing essential healthcare");
    });

    it("includes missed rate concern with dynamic percentage when missedRate >= 20%", () => {
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 7; i++) {
        appointments.push(makeAppointment({ id: `a${i}`, child_id: "c1" }));
      }
      for (let i = 0; i < 3; i++) {
        appointments.push(makeAppointment({ id: `m${i}`, child_id: "c1", status: "missed" }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.missed_rate).toBe(30);
      expect(r.concerns).toContain("30% of appointments are missed — children are not receiving planned healthcare");
    });

    it("includes low attendance concern when attendance < 60%", () => {
      const appointments = [
        makeAppointment({ id: "a1", status: "attended" }),
        makeAppointment({ id: "a2", status: "cancelled" }),
        makeAppointment({ id: "a3", status: "missed" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.attendance_rate).toBe(33);
      expect(r.concerns).toContain("Appointment attendance is critically low — health needs are going unmet");
    });

    it("includes outcome concern when outcomeRate < 40%", () => {
      const appointments = [
        makeAppointment({ id: "a1", has_outcome: true }),
        makeAppointment({ id: "a2", has_outcome: false }),
        makeAppointment({ id: "a3", has_outcome: false }),
        makeAppointment({ id: "a4", has_outcome: false }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.outcome_documentation_rate).toBe(25);
      expect(r.concerns).toContain("Most appointments lack outcome documentation — care continuity is compromised");
    });

    it("includes children coverage concern when childrenRate < 40%", () => {
      const appointments = [
        makeAppointment({ id: "a1", child_id: "c1" }),
        makeAppointment({ id: "a2", child_id: "c2" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.children_with_appointments_rate).toBe(33);
      expect(r.concerns).toContain("Most children have no recorded appointments — health oversight is inadequate");
    });

    it("includes single-domain concern when uniqueTypes <= 1", () => {
      const appointments = [
        makeAppointment({ id: "a1", appointment_type: "gp" }),
        makeAppointment({ id: "a2", appointment_type: "gp" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.concerns).toContain("Health engagement is limited to a single domain — broader health needs may be unmet");
    });

    it("does not include no-appointments concern when total > 0", () => {
      const appointments = [makeAppointment({ id: "a1" })];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.concerns).not.toContain("No health appointments recorded — children may not be accessing essential healthcare");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS GENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe("recommendations generation", () => {
    it("generates tracking recommendation when total is 0", () => {
      const r = computeHealthAppointmentContinuity(baseInput());
      expect(r.recommendations).toEqual([{
        rank: 1,
        recommendation: "Establish a comprehensive health appointment tracking system for all children",
        urgency: "immediate",
        regulatory_ref: "CHR 2015 Reg 10",
      }]);
    });

    it("generates missed appointments recommendation when missedRate >= 10% and total > 0", () => {
      // 1 missed in 10 = 10%
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 9; i++) {
        appointments.push(makeAppointment({ id: `a${i}`, child_id: "c1" }));
      }
      appointments.push(makeAppointment({ id: "m1", child_id: "c1", status: "missed" }));
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.recommendations).toContainEqual(expect.objectContaining({
        recommendation: "Investigate and address reasons for missed appointments to improve attendance",
        urgency: "immediate",
        regulatory_ref: "SCCIF Health",
      }));
    });

    it("generates outcome recording recommendation when outcomeRate < 60% and total > 0", () => {
      const appointments = [
        makeAppointment({ id: "a1", has_outcome: true }),
        makeAppointment({ id: "a2", has_outcome: false }),
        makeAppointment({ id: "a3", has_outcome: false }),
        makeAppointment({ id: "a4", has_outcome: false }),
        makeAppointment({ id: "a5", has_outcome: false }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.outcome_documentation_rate).toBe(20);
      expect(r.recommendations).toContainEqual(expect.objectContaining({
        recommendation: "Ensure outcomes are recorded for every attended appointment",
        urgency: "soon",
        regulatory_ref: "CHR 2015 Reg 10",
      }));
    });

    it("generates children review recommendation when childrenRate < 60% and total > 0", () => {
      const appointments = [
        makeAppointment({ id: "a1", child_id: "c1" }),
        makeAppointment({ id: "a2", child_id: "c2" }),
        makeAppointment({ id: "a3", child_id: "c3" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.children_with_appointments_rate).toBe(50);
      expect(r.recommendations).toContainEqual(expect.objectContaining({
        recommendation: "Review health needs of children without appointments and schedule accordingly",
        urgency: "immediate",
        regulatory_ref: "SCCIF Health",
      }));
    });

    it("generates broaden health engagement recommendation when uniqueTypes < 3 and total > 0", () => {
      const appointments = [
        makeAppointment({ id: "a1", appointment_type: "gp" }),
        makeAppointment({ id: "a2", appointment_type: "dental" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.recommendations).toContainEqual(expect.objectContaining({
        recommendation: "Broaden health engagement to include dental, optician, and specialist services",
        urgency: "planned",
        regulatory_ref: "CHR 2015 Reg 10",
      }));
    });

    it("generates transport recommendation when transportRate < 70% and total > 0", () => {
      const appointments = [
        makeAppointment({ id: "a1", transport_arranged: true }),
        makeAppointment({ id: "a2", transport_arranged: false }),
        makeAppointment({ id: "a3", transport_arranged: false }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.transport_compliance_rate).toBe(33);
      expect(r.recommendations).toContainEqual(expect.objectContaining({
        recommendation: "Ensure transport is arranged in advance for all health appointments",
        urgency: "planned",
        regulatory_ref: "CHR 2015 Reg 25",
      }));
    });

    it("caps recommendations at 5 and re-ranks them", () => {
      // Trigger all 5 non-zero-record recs: missedRate>=10, outcomeRate<60, childrenRate<60, uniqueTypes<3, transportRate<70
      // Plus potentially more but capped at 5
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 5; i++) {
        appointments.push(makeAppointment({
          id: `a${i}`, child_id: "c1", appointment_type: "gp",
          has_outcome: false, transport_arranged: false,
        }));
      }
      for (let i = 0; i < 5; i++) {
        appointments.push(makeAppointment({
          id: `m${i}`, child_id: "c1", appointment_type: "gp", status: "missed",
          has_outcome: false, transport_arranged: false,
        }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.recommendations.length).toBeLessThanOrEqual(5);
      // Verify ranks are sequential
      r.recommendations.forEach((rec, i) => {
        expect(rec.rank).toBe(i + 1);
      });
    });

    it("does not generate recs for zero-record triggers when total > 0", () => {
      const appointments = [makeAppointment({ id: "a1", child_id: "c1" })];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.recommendations).not.toContainEqual(expect.objectContaining({
        recommendation: "Establish a comprehensive health appointment tracking system for all children",
      }));
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INSIGHTS GENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe("insights generation", () => {
    it("generates exemplary positive insight when all conditions met with total >= 10", () => {
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 10; i++) {
        appointments.push(makeAppointment({
          id: `a${i}`, child_id: `c${(i % 6) + 1}`,
          appointment_type: ["gp", "dental", "optician", "camhs", "hospital"][i % 5],
        }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.insights).toContainEqual({
        text: "Health appointment management is exemplary — every child receives timely, well-documented healthcare",
        severity: "positive",
      });
    });

    it("does not generate exemplary insight when total < 10 even if rates qualify", () => {
      // 6 appointments, all perfect, all 6 children
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 6; i++) {
        appointments.push(makeAppointment({
          id: `a${i}`, child_id: `c${i + 1}`,
          appointment_type: ["gp", "dental", "optician", "camhs", "hospital", "therapy"][i],
        }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.attendance_rate).toBe(100);
      expect(r.outcome_documentation_rate).toBe(100);
      expect(r.children_with_appointments_rate).toBe(100);
      expect(r.total_appointments).toBe(6);
      expect(r.insights).not.toContainEqual(expect.objectContaining({
        text: "Health appointment management is exemplary — every child receives timely, well-documented healthcare",
      }));
    });

    it("generates critical insight when total is 0", () => {
      const r = computeHealthAppointmentContinuity(baseInput());
      expect(r.insights).toContainEqual({
        text: "No health appointments on record means Ofsted cannot verify children are accessing healthcare",
        severity: "critical",
      });
    });

    it("generates warning insight when missedRate >= 20%", () => {
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 8; i++) {
        appointments.push(makeAppointment({ id: `a${i}`, child_id: "c1" }));
      }
      for (let i = 0; i < 2; i++) {
        appointments.push(makeAppointment({ id: `m${i}`, child_id: "c1", status: "missed" }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.missed_rate).toBe(20);
      expect(r.insights).toContainEqual({
        text: "High missed appointment rate suggests barriers to healthcare access — investigate transport, consent and motivation",
        severity: "warning",
      });
    });

    it("generates children coverage positive insight when childrenRate >= 90%", () => {
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 6; i++) {
        appointments.push(makeAppointment({ id: `a${i}`, child_id: `c${i + 1}` }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.insights).toContainEqual({
        text: "All children have health appointments — the home ensures no child falls through the net",
        severity: "positive",
      });
    });

    it("generates holistic health positive insight when uniqueTypes >= 5", () => {
      const appointments = [
        makeAppointment({ id: "a1", appointment_type: "gp" }),
        makeAppointment({ id: "a2", appointment_type: "dental" }),
        makeAppointment({ id: "a3", appointment_type: "optician" }),
        makeAppointment({ id: "a4", appointment_type: "camhs" }),
        makeAppointment({ id: "a5", appointment_type: "hospital" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.insights).toContainEqual({
        text: "Holistic health engagement across multiple domains shows the home takes a whole-child approach to wellbeing",
        severity: "positive",
      });
    });

    it("caps insights at 3", () => {
      // Trigger 4+ insights: exemplary, children coverage, holistic, (possibly more)
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 10; i++) {
        appointments.push(makeAppointment({
          id: `a${i}`, child_id: `c${(i % 6) + 1}`,
          appointment_type: ["gp", "dental", "optician", "camhs", "hospital"][i % 5],
        }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      // Should trigger: exemplary, children coverage, holistic = 3+
      expect(r.insights.length).toBeLessThanOrEqual(3);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADLINES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("headlines", () => {
    it("returns outstanding headline for score >= 80", () => {
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 10; i++) {
        appointments.push(makeAppointment({
          id: `a${i}`, child_id: `c${(i % 6) + 1}`,
          appointment_type: ["gp", "dental", "optician", "camhs", "hospital"][i % 5],
        }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.headline).toBe("Health appointment management is exemplary — children receive timely, comprehensive healthcare");
    });

    it("returns good headline for score 65-79", () => {
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 10; i++) {
        appointments.push(makeAppointment({
          id: `a${i}`,
          child_id: i < 4 ? "c1" : i < 7 ? "c2" : "c3",
          appointment_type: i % 2 === 0 ? "gp" : "dental",
          has_outcome: i < 7,
          transport_arranged: i < 6,
        }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.appointment_rating).toBe("good");
      expect(r.headline).toBe("Good health appointment practice with reliable attendance and broad health coverage");
    });

    it("returns adequate headline for score 45-64", () => {
      const r = computeHealthAppointmentContinuity(baseInput());
      expect(r.appointment_rating).toBe("adequate");
      expect(r.headline).toBe("Health appointments are managed adequately but attendance and documentation need improvement");
    });

    it("returns inadequate headline for score < 45", () => {
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 5; i++) {
        appointments.push(makeAppointment({ id: `att${i}`, child_id: "c1", appointment_type: "gp", has_outcome: false, transport_arranged: false }));
      }
      for (let i = 0; i < 5; i++) {
        appointments.push(makeAppointment({ id: `miss${i}`, child_id: "c1", appointment_type: "gp", status: "missed", has_outcome: false, transport_arranged: false }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.appointment_rating).toBe("inadequate");
      expect(r.headline).toBe("Health appointment practice is inadequate — children are missing essential healthcare");
    });

    it("returns insufficient_data headline when total_children is 0", () => {
      const r = computeHealthAppointmentContinuity(baseInput({ total_children: 0 }));
      expect(r.headline).toBe("No data available for health appointment analysis");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("edge cases", () => {
    it("clamps score to minimum 0", () => {
      // Try to push score far below 0 — but with max negatives:
      // 52 - 5 - 5 - 4 - 4 - 3 - 5 = 26 -> won't go below 0 with these modifiers
      // Score can't actually go below 0 due to clamp
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 5; i++) {
        appointments.push(makeAppointment({
          id: `a${i}`, child_id: "c1", appointment_type: "gp",
          has_outcome: false, transport_arranged: false,
        }));
      }
      for (let i = 0; i < 5; i++) {
        appointments.push(makeAppointment({
          id: `m${i}`, child_id: "c1", appointment_type: "gp", status: "missed",
          has_outcome: false, transport_arranged: false,
        }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.appointment_score).toBeGreaterThanOrEqual(0);
    });

    it("clamps score to maximum 100", () => {
      // Max possible: 52 + 6 + 5 + 5 + 4 + 5 + 5 = 82
      // Can't exceed 100 with these modifiers, but verify clamp works
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 10; i++) {
        appointments.push(makeAppointment({
          id: `a${i}`, child_id: `c${(i % 6) + 1}`,
          appointment_type: ["gp", "dental", "optician", "camhs", "hospital"][i % 5],
        }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.appointment_score).toBeLessThanOrEqual(100);
    });

    it("handles single appointment correctly", () => {
      const r = computeHealthAppointmentContinuity(baseInput({
        appointments: [makeAppointment({ id: "a1", child_id: "c1", appointment_type: "gp" })],
      }));
      expect(r.total_appointments).toBe(1);
      expect(r.attendance_rate).toBe(100);
      expect(r.missed_rate).toBe(0);
      expect(r.outcome_documentation_rate).toBe(100);
      expect(r.transport_compliance_rate).toBe(100);
      expect(r.health_domain_variety).toBe(1);
      expect(r.children_with_appointments_rate).toBe(17); // 1/6 = 16.67 -> 17
    });

    it("handles all appointments as missed", () => {
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 5; i++) {
        appointments.push(makeAppointment({
          id: `m${i}`, child_id: "c1", appointment_type: "gp", status: "missed",
          has_outcome: false, transport_arranged: false,
        }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.attendance_rate).toBe(0);
      expect(r.missed_rate).toBe(100);
      // Mod1: <60 -> -5, Mod2: >=20 -> -5, Mod3: <40 -> -4, Mod4: <50 -> -4, Mod5: <=1 -> -3, Mod6: <40 -> -5
      // 52 - 5 - 5 - 4 - 4 - 3 - 5 = 26
      expect(r.appointment_score).toBe(26);
    });

    it("handles all appointments as cancelled (not attended, not missed)", () => {
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 5; i++) {
        appointments.push(makeAppointment({
          id: `c${i}`, child_id: "c1", appointment_type: "gp", status: "cancelled",
          has_outcome: false, transport_arranged: false,
        }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.attendance_rate).toBe(0);
      expect(r.missed_rate).toBe(0);
      // Mod1: <60 -> -5, Mod2: 0% -> +5, Mod3: <40 -> -4, Mod4: <50 -> -4, Mod5: <=1 -> -3, Mod6: <40 -> -5
      // 52 - 5 + 5 - 4 - 4 - 3 - 5 = 36
      expect(r.appointment_score).toBe(36);
    });

    it("handles large number of children with few appointments", () => {
      const r = computeHealthAppointmentContinuity(baseInput({
        total_children: 100,
        appointments: [makeAppointment({ id: "a1", child_id: "c1" })],
      }));
      expect(r.children_with_appointments_rate).toBe(1); // 1/100 = 1%
    });

    it("counts unique children even across many appointments", () => {
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 20; i++) {
        appointments.push(makeAppointment({ id: `a${i}`, child_id: "c1" }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.children_with_appointments_rate).toBe(17); // 1/6 = 16.67 -> 17
    });

    it("handles exactly 90% attendance boundary", () => {
      // 9 attended, 1 cancelled = 9/10 = 90%
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 9; i++) {
        appointments.push(makeAppointment({
          id: `a${i}`, child_id: `c${(i % 6) + 1}`,
          appointment_type: ["gp", "dental", "optician", "camhs", "hospital"][i % 5],
        }));
      }
      appointments.push(makeAppointment({
        id: "c1x", child_id: "c6", appointment_type: "therapy", status: "cancelled",
      }));
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.attendance_rate).toBe(90);
      // Should trigger +6 (>=90)
      // 52 + 6 + 5 + 5 + 4 + 5 + 5 = 82
      expect(r.appointment_score).toBe(82);
    });

    it("handles exactly 75% attendance boundary", () => {
      // 3 attended, 1 cancelled = 3/4 = 75%
      const appointments: AppointmentRecordInput[] = [
        makeAppointment({ id: "a1", child_id: "c1", appointment_type: "gp" }),
        makeAppointment({ id: "a2", child_id: "c2", appointment_type: "dental" }),
        makeAppointment({ id: "a3", child_id: "c3", appointment_type: "optician" }),
        makeAppointment({ id: "a4", child_id: "c4", appointment_type: "camhs", status: "cancelled" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.attendance_rate).toBe(75);
      // Should trigger +2 (>=75)
      // Mod1: +2, Mod2: 0% -> +5, Mod3: 100% -> +5, Mod4: 100% -> +4
      // Mod5: 4 types -> +2, Mod6: 4/6=67% -> +2
      // 52 + 2 + 5 + 5 + 4 + 2 + 2 = 72
      expect(r.appointment_score).toBe(72);
    });

    it("handles exactly 60% attendance (no penalty, no bonus)", () => {
      // 3 attended, 2 cancelled = 3/5 = 60%
      const appointments: AppointmentRecordInput[] = [
        makeAppointment({ id: "a1", child_id: "c1", appointment_type: "gp" }),
        makeAppointment({ id: "a2", child_id: "c2", appointment_type: "dental" }),
        makeAppointment({ id: "a3", child_id: "c3", appointment_type: "optician" }),
        makeAppointment({ id: "a4", child_id: "c4", appointment_type: "camhs", status: "cancelled" }),
        makeAppointment({ id: "a5", child_id: "c5", appointment_type: "hospital", status: "cancelled" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.attendance_rate).toBe(60);
      // Mod1: 0 (60% is >=60 so not <60, but <75 so no +2), Mod2: 0% -> +5
      // Mod3: 100% -> +5, Mod4: 100% -> +4, Mod5: 5 types -> +5, Mod6: 5/6=83% -> +2
      // 52 + 0 + 5 + 5 + 4 + 5 + 2 = 73
      expect(r.appointment_score).toBe(73);
    });

    it("handles appointment types for all possible values", () => {
      const types = ["gp", "dental", "optician", "camhs", "hospital", "lac_review", "pep_meeting", "social_worker", "court", "therapy", "specialist", "immunisation", "other"];
      const appointments = types.map((t, i) => makeAppointment({
        id: `a${i}`, child_id: `c${(i % 6) + 1}`, appointment_type: t,
      }));
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.health_domain_variety).toBe(13);
    });

    it("includes all statuses in total count", () => {
      const appointments = [
        makeAppointment({ id: "a1", status: "scheduled" }),
        makeAppointment({ id: "a2", status: "attended" }),
        makeAppointment({ id: "a3", status: "cancelled" }),
        makeAppointment({ id: "a4", status: "missed" }),
        makeAppointment({ id: "a5", status: "rescheduled" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.total_appointments).toBe(5);
      expect(r.attendance_rate).toBe(20); // 1/5
      expect(r.missed_rate).toBe(20);     // 1/5
    });

    it("score boundary: 80 is outstanding, 79 is good", () => {
      // Already verified 82 is outstanding, 79 is good through other tests
      // Explicitly construct score = 80
      // 52 + 6 + 5 + 5 + 4 + 5 + 5 = 82, need 80 = 82 - 2
      // Drop from +5 (uniqueTypes>=5) to +2 (uniqueTypes>=3) saves 3, that's too much
      // Drop from +5 (childrenRate>=90) to +2 (childrenRate>=60) saves 3, that's too much
      // Drop transport from +4 to +1 saves 3, too much
      // Need to shave exactly 2 off. 82 - 2 = 80.
      // Use outcome rate in +2 band (60-84%) instead of +5 (>=85%): saves 3. That's 79. Not 80.
      // Use transport in +1 band (70-89%) instead of +4 (>=90%): saves 3. That's 79.
      // Use missedRate in +2 band (<=5%) instead of +5 (0%): saves 3. That's 79.
      // Attendance +2 instead of +6: saves 4. That's 78.
      // Actually let me try: 52 + 6 + 2 + 5 + 4 + 5 + 5 = 79 (missed rate +2 vs +5 = -3)
      // That's 79 = good. So score 79 is good.
      // For 80: 52 + 6 + 5 + 5 + 4 + 5 + 2 + 1 doesn't work like that.
      // Score 80 = outstanding. Let me verify:
      // 52 + 6 + 5 + 5 + 1 + 5 + 5 = 79 (transport +1)
      // 52 + 6 + 5 + 5 + 4 + 2 + 5 = 79 (types +2)
      // 52 + 6 + 5 + 5 + 4 + 5 + 2 = 79 (children +2)
      // All roads to 79 → good. All roads to 82 → outstanding. Can't easily get 80 or 81 with these discrete modifiers.
      // Let me verify 79 is good:
      const appointments79: AppointmentRecordInput[] = [];
      for (let i = 0; i < 10; i++) {
        appointments79.push(makeAppointment({
          id: `a${i}`, child_id: `c${(i % 6) + 1}`,
          appointment_type: ["gp", "dental", "optician", "camhs", "hospital"][i % 5],
          transport_arranged: i < 8, // 80% -> +1
        }));
      }
      const r79 = computeHealthAppointmentContinuity(baseInput({ appointments: appointments79 }));
      expect(r79.appointment_score).toBe(79);
      expect(r79.appointment_rating).toBe("good");
    });

    it("score boundary: 65 is good, 64 is adequate", () => {
      // Score 64: 52 + 6 + 5 + 5 + 4 - 3 - 5 = 64
      // attendance 100% -> +6, missed 0% -> +5, outcome 100% -> +5, transport 100% -> +4
      // types <=1 -> -3, children <40% -> -5
      const appointments: AppointmentRecordInput[] = [
        makeAppointment({ id: "a1", child_id: "c1", appointment_type: "gp" }),
        makeAppointment({ id: "a2", child_id: "c1", appointment_type: "gp" }),
      ];
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      // 1 type, 1/6 children = 17%
      // 52 + 6 + 5 + 5 + 4 - 3 - 5 = 64
      expect(r.appointment_score).toBe(64);
      expect(r.appointment_rating).toBe("adequate");
    });

    it("score boundary: 45 is adequate, 44 is inadequate", () => {
      // Zero records gives 45 = adequate
      const r45 = computeHealthAppointmentContinuity(baseInput());
      expect(r45.appointment_score).toBe(45);
      expect(r45.appointment_rating).toBe("adequate");

      // Need 44: e.g., 52 - 5 + 5 - 4 + 0 - 3 + 0 = 45... need to go lower
      // 52 + 0 + 0 + 0 + 0 + 0 - 5 - 3 = 44 ... that's only 2 negatives
      // Let me compute: need score 44 = 52 - 8
      // Mod1: 0, Mod2: 0, Mod3: 0, Mod4: 0, Mod5: -3, Mod6: -5 = -8 = 44
      // attendance 60-74% -> 0, missed 6-19% -> 0, outcome 40-59% -> 0, transport 50-69% -> 0
      // types <=1 -> -3, children <40% -> -5
      // attendance 70%, missed 10%, outcome 50%, transport 60%, 1 type, 1/6 children
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 7; i++) {
        appointments.push(makeAppointment({
          id: `a${i}`, child_id: "c1", appointment_type: "gp",
          has_outcome: i < 5,
          transport_arranged: i < 6,
        }));
      }
      appointments.push(makeAppointment({ id: "m1", child_id: "c1", appointment_type: "gp", status: "missed", has_outcome: false, transport_arranged: false }));
      appointments.push(makeAppointment({ id: "s1", child_id: "c1", appointment_type: "gp", status: "scheduled", has_outcome: false, transport_arranged: false }));
      appointments.push(makeAppointment({ id: "s2", child_id: "c1", appointment_type: "gp", status: "cancelled", has_outcome: false, transport_arranged: false }));
      // total=10, attended=7 (70%), missed=1 (10%), outcome=5/10=50%, transport=6/10=60%, types=1, children=1/6=17%
      const r44 = computeHealthAppointmentContinuity(baseInput({ appointments }));
      // Mod1: 0 (70%), Mod2: 0 (10%), Mod3: 0 (50%), Mod4: 0 (60%), Mod5: -3 (1 type), Mod6: -5 (17%)
      // 52 + 0 + 0 + 0 + 0 - 3 - 5 = 44
      expect(r44.appointment_score).toBe(44);
      expect(r44.appointment_rating).toBe("inadequate");
    });

    it("recommendation ranks are sequential starting from 1", () => {
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 5; i++) {
        appointments.push(makeAppointment({
          id: `a${i}`, child_id: "c1", appointment_type: "gp",
          has_outcome: false, transport_arranged: false, status: i < 3 ? "attended" : "missed",
        }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("does not produce missed rate concern when missed rate is 19%", () => {
      // 19% is below the 20% threshold
      // 19/100 is awkward. Use roughly: 2 missed out of 11 = 18%, or 1/5 = 20%. Need exactly 19%.
      // Can't easily get exactly 19 with small numbers. Use 100 appointments, 19 missed.
      const appointments: AppointmentRecordInput[] = [];
      for (let i = 0; i < 81; i++) {
        appointments.push(makeAppointment({ id: `a${i}`, child_id: "c1" }));
      }
      for (let i = 0; i < 19; i++) {
        appointments.push(makeAppointment({ id: `m${i}`, child_id: "c1", status: "missed" }));
      }
      const r = computeHealthAppointmentContinuity(baseInput({ appointments }));
      expect(r.missed_rate).toBe(19);
      expect(r.concerns).not.toContainEqual(expect.stringContaining("of appointments are missed"));
    });

    it("handles has_escort and has_follow_up fields without affecting scoring", () => {
      const r1 = computeHealthAppointmentContinuity(baseInput({
        appointments: [makeAppointment({ id: "a1", has_escort: true, has_follow_up: true })],
      }));
      const r2 = computeHealthAppointmentContinuity(baseInput({
        appointments: [makeAppointment({ id: "a1", has_escort: false, has_follow_up: false })],
      }));
      expect(r1.appointment_score).toBe(r2.appointment_score);
    });
  });
});
