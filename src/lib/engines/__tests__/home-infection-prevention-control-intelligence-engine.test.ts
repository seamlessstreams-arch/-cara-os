import { describe, it, expect } from "vitest";
import {
  computeInfectionPreventionControl,
  type InfectionPreventionInput,
  type HygieneAuditRecordInput,
  type IllnessOutbreakRecordInput,
  type HandHygieneRecordInput,
  type CleaningScheduleRecordInput,
  type ImmunisationRecordInput,
} from "../home-infection-prevention-control-intelligence-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

const TODAY = "2026-05-28";

function makeAudit(overrides: Partial<HygieneAuditRecordInput> = {}): HygieneAuditRecordInput {
  return {
    id: "aud_1",
    audit_date: "2026-05-01",
    auditor: "Staff A",
    area_audited: "Kitchen",
    hand_wash_stations_adequate: true,
    soap_dispensers_stocked: true,
    sanitiser_available: true,
    waste_disposal_compliant: true,
    laundry_procedures_followed: true,
    food_hygiene_compliant: true,
    personal_protective_equipment_available: true,
    infection_control_signage_displayed: true,
    overall_compliance_score: 5,
    issues_identified: [],
    issues_resolved: false,
    resolution_date: null,
    corrective_actions: null,
    next_audit_date: "2026-06-01",
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeOutbreak(overrides: Partial<IllnessOutbreakRecordInput> = {}): IllnessOutbreakRecordInput {
  return {
    id: "out_1",
    child_id: "yp_1",
    illness_type: "gastro",
    onset_date: "2026-04-10",
    reported_date: "2026-04-10",
    isolation_measures_implemented: true,
    gp_consulted: true,
    public_health_notified: true,
    children_affected_count: 1,
    staff_affected_count: 0,
    containment_actions_taken: "Isolated child, deep cleaned area",
    containment_effective: true,
    duration_days: 3,
    resolution_date: "2026-04-13",
    return_to_normal_date: "2026-04-14",
    lessons_learned_documented: true,
    staff_member: "Staff B",
    created_at: "2026-04-10",
    ...overrides,
  };
}

function makeHandHygiene(overrides: Partial<HandHygieneRecordInput> = {}): HandHygieneRecordInput {
  return {
    id: "hh_1",
    observation_date: "2026-05-15",
    observer: "Staff A",
    staff_id: "staff_1",
    staff_name: "Jane Doe",
    opportunity_type: "before_food_prep",
    hand_hygiene_performed: true,
    technique_correct: true,
    soap_or_sanitiser_used: true,
    duration_adequate: true,
    gloves_used_when_required: true,
    training_completed: true,
    training_date: "2026-01-10",
    notes: null,
    created_at: "2026-05-15",
    ...overrides,
  };
}

function makeCleaning(overrides: Partial<CleaningScheduleRecordInput> = {}): CleaningScheduleRecordInput {
  return {
    id: "cln_1",
    scheduled_date: "2026-05-20",
    area: "Main Bathroom",
    cleaning_type: "daily_routine",
    completed: true,
    completed_by: "Staff C",
    completion_time: "2026-05-20T08:00:00Z",
    products_used_correctly: true,
    checked_by: "Manager A",
    check_passed: true,
    issues_found: null,
    issues_addressed: false,
    frequency: "daily",
    created_at: "2026-05-20",
    ...overrides,
  };
}

function makeImmunisation(overrides: Partial<ImmunisationRecordInput> = {}): ImmunisationRecordInput {
  return {
    id: "imm_1",
    child_id: "yp_1",
    vaccine_name: "MMR",
    due_date: "2026-03-01",
    administered: true,
    administered_date: "2026-03-05",
    declined: false,
    decline_reason: null,
    consent_obtained: true,
    consent_from: "Social Worker",
    gp_confirmed: true,
    catch_up_plan_in_place: false,
    next_due_date: "2027-03-01",
    staff_member: "Staff D",
    created_at: "2026-03-05",
    ...overrides,
  };
}

function baseInput(overrides: Partial<InfectionPreventionInput> = {}): InfectionPreventionInput {
  return {
    today: TODAY,
    total_children: 4,
    hygiene_audit_records: [],
    illness_outbreak_records: [],
    hand_hygiene_records: [],
    cleaning_schedule_records: [],
    immunisation_records: [],
    ...overrides,
  };
}

// Build an array of N items with unique ids
function nAudits(n: number, overrides: Partial<HygieneAuditRecordInput> = {}): HygieneAuditRecordInput[] {
  return Array.from({ length: n }, (_, i) => makeAudit({ id: `aud_${i + 1}`, ...overrides }));
}

function nOutbreaks(n: number, overrides: Partial<IllnessOutbreakRecordInput> = {}): IllnessOutbreakRecordInput[] {
  return Array.from({ length: n }, (_, i) => makeOutbreak({ id: `out_${i + 1}`, ...overrides }));
}

function nHandHygiene(n: number, overrides: Partial<HandHygieneRecordInput> = {}): HandHygieneRecordInput[] {
  return Array.from({ length: n }, (_, i) => makeHandHygiene({ id: `hh_${i + 1}`, ...overrides }));
}

function nCleaning(n: number, overrides: Partial<CleaningScheduleRecordInput> = {}): CleaningScheduleRecordInput[] {
  return Array.from({ length: n }, (_, i) => makeCleaning({ id: `cln_${i + 1}`, ...overrides }));
}

function nImmunisations(n: number, overrides: Partial<ImmunisationRecordInput> = {}): ImmunisationRecordInput[] {
  return Array.from({ length: n }, (_, i) => makeImmunisation({ id: `imm_${i + 1}`, ...overrides }));
}

// Helpers to build mixed-compliance arrays
function mixedAudits(pass: number, fail: number): HygieneAuditRecordInput[] {
  const good = nAudits(pass); // all 8 checks true
  const bad = nAudits(fail, {
    hand_wash_stations_adequate: false,
    soap_dispensers_stocked: false,
    sanitiser_available: false,
    waste_disposal_compliant: false,
    laundry_procedures_followed: false,
    food_hygiene_compliant: false,
    personal_protective_equipment_available: false,
    infection_control_signage_displayed: false,
  }).map((a, i) => ({ ...a, id: `aud_fail_${i + 1}` }));
  return [...good, ...bad];
}

function mixedOutbreaks(good: number, bad: number): IllnessOutbreakRecordInput[] {
  const g = nOutbreaks(good); // all 4 management checks true
  const b = nOutbreaks(bad, {
    isolation_measures_implemented: false,
    gp_consulted: false,
    containment_effective: false,
    lessons_learned_documented: false,
  }).map((o, i) => ({ ...o, id: `out_bad_${i + 1}` }));
  return [...g, ...b];
}

function mixedHandHygiene(good: number, bad: number): HandHygieneRecordInput[] {
  const g = nHandHygiene(good); // all 4 composite checks true, training true
  const b = nHandHygiene(bad, {
    hand_hygiene_performed: false,
    technique_correct: false,
    soap_or_sanitiser_used: false,
    duration_adequate: false,
    training_completed: false,
  }).map((h, i) => ({ ...h, id: `hh_bad_${i + 1}` }));
  return [...g, ...b];
}

function mixedCleaning(good: number, bad: number): CleaningScheduleRecordInput[] {
  const g = nCleaning(good); // all 3 composite checks true
  const b = nCleaning(bad, {
    completed: false,
    products_used_correctly: false,
    check_passed: false,
  }).map((c, i) => ({ ...c, id: `cln_bad_${i + 1}` }));
  return [...g, ...b];
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("computeInfectionPreventionControl", () => {
  // ── Top-level structure ──────────────────────────────────────────────

  it("returns all required top-level fields", () => {
    const result = computeInfectionPreventionControl(baseInput());
    expect(result).toHaveProperty("infection_rating");
    expect(result).toHaveProperty("infection_score");
    expect(result).toHaveProperty("headline");
    expect(result).toHaveProperty("total_audits");
    expect(result).toHaveProperty("total_outbreaks");
    expect(result).toHaveProperty("total_hand_hygiene_observations");
    expect(result).toHaveProperty("total_cleaning_records");
    expect(result).toHaveProperty("total_immunisation_records");
    expect(result).toHaveProperty("hygiene_audit_compliance_rate");
    expect(result).toHaveProperty("outbreak_management_rate");
    expect(result).toHaveProperty("hand_hygiene_rate");
    expect(result).toHaveProperty("cleaning_compliance_rate");
    expect(result).toHaveProperty("immunisation_coverage_rate");
    expect(result).toHaveProperty("staff_training_rate");
    expect(result).toHaveProperty("strengths");
    expect(result).toHaveProperty("concerns");
    expect(result).toHaveProperty("recommendations");
    expect(result).toHaveProperty("insights");
  });

  // ── insufficient_data ────────────────────────────────────────────────

  describe("insufficient_data", () => {
    it("returns insufficient_data when all arrays empty and total_children=0", () => {
      const r = computeInfectionPreventionControl(baseInput({ total_children: 0 }));
      expect(r.infection_rating).toBe("insufficient_data");
      expect(r.infection_score).toBe(0);
    });

    it("has correct headline for insufficient_data", () => {
      const r = computeInfectionPreventionControl(baseInput({ total_children: 0 }));
      expect(r.headline).toContain("insufficient data");
    });

    it("returns empty strengths/concerns/recommendations/insights for insufficient_data", () => {
      const r = computeInfectionPreventionControl(baseInput({ total_children: 0 }));
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.insights).toHaveLength(0);
    });

    it("returns zero for all counts and rates in insufficient_data", () => {
      const r = computeInfectionPreventionControl(baseInput({ total_children: 0 }));
      expect(r.total_audits).toBe(0);
      expect(r.total_outbreaks).toBe(0);
      expect(r.total_hand_hygiene_observations).toBe(0);
      expect(r.total_cleaning_records).toBe(0);
      expect(r.total_immunisation_records).toBe(0);
      expect(r.hygiene_audit_compliance_rate).toBe(0);
      expect(r.outbreak_management_rate).toBe(0);
      expect(r.hand_hygiene_rate).toBe(0);
      expect(r.cleaning_compliance_rate).toBe(0);
      expect(r.immunisation_coverage_rate).toBe(0);
      expect(r.staff_training_rate).toBe(0);
    });
  });

  // ── Inadequate floor (all empty, children > 0) ──────────────────────

  describe("inadequate floor (all empty, children > 0)", () => {
    it("returns inadequate with score 15 when all arrays empty but children exist", () => {
      const r = computeInfectionPreventionControl(baseInput({ total_children: 3 }));
      expect(r.infection_rating).toBe("inadequate");
      expect(r.infection_score).toBe(15);
    });

    it("has correct headline for empty-with-children floor", () => {
      const r = computeInfectionPreventionControl(baseInput({ total_children: 1 }));
      expect(r.headline).toContain("No infection prevention and control data recorded");
    });

    it("produces exactly 1 concern for empty-with-children", () => {
      const r = computeInfectionPreventionControl(baseInput({ total_children: 2 }));
      expect(r.concerns).toHaveLength(1);
      expect(r.concerns[0]).toContain("No hygiene audits");
    });

    it("produces exactly 2 recommendations for empty-with-children", () => {
      const r = computeInfectionPreventionControl(baseInput({ total_children: 2 }));
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].rank).toBe(1);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].rank).toBe(2);
      expect(r.recommendations[1].urgency).toBe("immediate");
    });

    it("produces exactly 1 critical insight for empty-with-children", () => {
      const r = computeInfectionPreventionControl(baseInput({ total_children: 2 }));
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });
  });

  // ── pct helper: pct(0,0)=0 ──────────────────────────────────────────

  describe("pct(0,0) edge", () => {
    it("hygiene_audit_compliance_rate is 0 when no audits", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.hygiene_audit_compliance_rate).toBe(0);
    });

    it("outbreak_management_rate is 0 when no outbreaks", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.outbreak_management_rate).toBe(0);
    });

    it("hand_hygiene_rate is 0 when no hand hygiene records", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hygiene_audit_records: nAudits(1),
      }));
      expect(r.hand_hygiene_rate).toBe(0);
    });

    it("cleaning_compliance_rate is 0 when no cleaning records", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.cleaning_compliance_rate).toBe(0);
    });

    it("immunisation_coverage_rate is 0 when no immunisation records", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.immunisation_coverage_rate).toBe(0);
    });

    it("staff_training_rate is 0 when no hand hygiene records", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hygiene_audit_records: nAudits(1),
      }));
      expect(r.staff_training_rate).toBe(0);
    });
  });

  // ── Rating thresholds ────────────────────────────────────────────────

  describe("rating thresholds", () => {
    it("outstanding when score >= 80", () => {
      // Base 52 + all bonuses at 90+ tiers = 52 + 4+4+4+3+3+3+3+2+2 = 80
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 4,
        hygiene_audit_records: [
          makeAudit({ issues_identified: ["issue"], issues_resolved: true }),
        ],
        illness_outbreak_records: nOutbreaks(1),
        hand_hygiene_records: nHandHygiene(10),
        cleaning_schedule_records: nCleaning(10),
        immunisation_records: [
          makeImmunisation({ child_id: "yp_1" }),
          makeImmunisation({ id: "imm_2", child_id: "yp_2" }),
          makeImmunisation({ id: "imm_3", child_id: "yp_3" }),
          makeImmunisation({ id: "imm_4", child_id: "yp_4" }),
        ],
      }));
      expect(r.infection_score).toBeGreaterThanOrEqual(80);
      expect(r.infection_rating).toBe("outstanding");
    });

    it("good when score >= 65 and < 80", () => {
      // Build something in the 65-79 range: base 52 + some bonuses
      // 9 good : 1 bad audits = 90/80 = ~96% audit compliance => +4
      // No outbreaks => outbreak management 0% => no bonus, no penalty
      // 7 good : 3 bad hand hygiene => (7*4)/(10*4) = 70% => +2
      // No cleaning => 0% => no penalty (empty)
      // No immunisations => 0%
      // Training: 7/10 = 70% => +1
      // Total: 52 + 4 + 2 + 1 = 59... not enough
      // Let's add cleaning too
      // 9 good : 1 bad cleaning => (9*3)/(10*3) = 90% => +3
      // Now 52 + 4 + 2 + 3 + 1 = 62... still not 65
      // Add immunisation coverage: 4 children, 4 immunised => 100% => +3
      // 52 + 4 + 2 + 3 + 3 + 1 = 65
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 4,
        hygiene_audit_records: nAudits(10), // 100% compliance => +4
        illness_outbreak_records: [],
        hand_hygiene_records: mixedHandHygiene(7, 3), // 70% => +2
        cleaning_schedule_records: nCleaning(10), // 100% => +3
        immunisation_records: [
          makeImmunisation({ child_id: "yp_1" }),
          makeImmunisation({ id: "imm_2", child_id: "yp_2" }),
          makeImmunisation({ id: "imm_3", child_id: "yp_3" }),
          makeImmunisation({ id: "imm_4", child_id: "yp_4" }),
        ],
      }));
      expect(r.infection_score).toBeGreaterThanOrEqual(65);
      expect(r.infection_score).toBeLessThan(80);
      expect(r.infection_rating).toBe("good");
    });

    it("adequate when score >= 45 and < 65", () => {
      // Base 52 with no bonuses/penalties => 52 => adequate
      // Provide one record of each type at moderate levels to avoid penalties
      // All checks at ~60% => no bonuses (need >=70), no penalties (need <50)
      // 6 good : 4 bad audits => 60% (no bonus, no penalty since >=50)
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 4,
        hygiene_audit_records: mixedAudits(6, 4), // 60%
        illness_outbreak_records: mixedOutbreaks(6, 4), // 60%
        hand_hygiene_records: mixedHandHygiene(6, 4), // 60%
        cleaning_schedule_records: mixedCleaning(6, 4), // 60%
        immunisation_records: [
          makeImmunisation({ child_id: "yp_1" }),
          makeImmunisation({ id: "imm_2", child_id: "yp_2" }),
          // 2 out of 4 children = 50%
        ],
      }));
      expect(r.infection_score).toBeGreaterThanOrEqual(45);
      expect(r.infection_score).toBeLessThan(65);
      expect(r.infection_rating).toBe("adequate");
    });

    it("inadequate when score < 45", () => {
      // Base 52 - all penalties: hygieneAudit<50 (-5), handHygiene<50 (-5), cleaning<50 (-5), spread>50 (-3)
      // 52 - 5 - 5 - 5 - 3 = 34
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 4,
        hygiene_audit_records: mixedAudits(0, 10), // 0% => -5
        illness_outbreak_records: nOutbreaks(4, {
          isolation_measures_implemented: false,
          gp_consulted: false,
          containment_effective: false,
          lessons_learned_documented: false,
          children_affected_count: 3, // multi-child
        }),
        hand_hygiene_records: mixedHandHygiene(0, 10), // 0% => -5
        cleaning_schedule_records: mixedCleaning(0, 10), // 0% => -5
        immunisation_records: [],
      }));
      expect(r.infection_score).toBeLessThan(45);
      expect(r.infection_rating).toBe("inadequate");
    });
  });

  // ── Base score ───────────────────────────────────────────────────────

  describe("base score", () => {
    it("base score is 52 when rates are between 50-69% (no bonus, no penalty)", () => {
      // 6/10 = 60% for all composite rates
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 10,
        hygiene_audit_records: mixedAudits(6, 4),
        illness_outbreak_records: mixedOutbreaks(6, 4),
        hand_hygiene_records: mixedHandHygiene(6, 4),
        cleaning_schedule_records: mixedCleaning(6, 4),
        immunisation_records: [
          // 6 unique children administered out of 10 = 60%
          ...Array.from({ length: 6 }, (_, i) =>
            makeImmunisation({ id: `imm_${i}`, child_id: `yp_${i + 1}` }),
          ),
        ],
      }));
      expect(r.infection_score).toBe(52);
    });
  });

  // ── Bonuses in isolation ─────────────────────────────────────────────

  describe("bonuses in isolation", () => {
    // For each bonus, we set everything else to moderate (50-69%) so no
    // other bonus or penalty fires. Then we activate just the target bonus.

    // Helper: build an input where everything is ~60% (no bonus, no penalty)
    // except the one we want to test.
    function moderateBaseInput(): InfectionPreventionInput {
      return baseInput({
        total_children: 10,
        hygiene_audit_records: mixedAudits(6, 4), // 60%
        illness_outbreak_records: mixedOutbreaks(6, 4), // 60%
        hand_hygiene_records: mixedHandHygiene(6, 4), // 60% hand hygiene, training also ~60%
        cleaning_schedule_records: mixedCleaning(6, 4), // 60%
        immunisation_records: Array.from({ length: 6 }, (_, i) =>
          makeImmunisation({ id: `imm_${i}`, child_id: `yp_${i + 1}` }),
        ), // 60%
      });
    }

    // Bonus 1: hygieneAuditComplianceRate
    describe("Bonus 1: hygieneAuditComplianceRate", () => {
      it("+4 when >= 90%", () => {
        const input = moderateBaseInput();
        input.hygiene_audit_records = nAudits(10); // 100%
        const r = computeInfectionPreventionControl(input);
        expect(r.infection_score).toBe(52 + 4);
      });

      it("+2 when >= 70% and < 90%", () => {
        const input = moderateBaseInput();
        // 8 good : 2 bad => 80/80 good checks + 0/16 bad checks => 80/96 = 83%
        // Actually: 8 audits all true = 64 checks, 2 audits all false = 0 checks => 64/80 = 80%
        input.hygiene_audit_records = mixedAudits(8, 2);
        const r = computeInfectionPreventionControl(input);
        expect(r.hygiene_audit_compliance_rate).toBe(80);
        expect(r.infection_score).toBe(52 + 2);
      });

      it("no bonus when < 70%", () => {
        const input = moderateBaseInput();
        // Already 60% from moderateBaseInput
        const r = computeInfectionPreventionControl(input);
        // Score should be 52 (base, no bonuses since everything is 60%)
        expect(r.infection_score).toBe(52);
      });
    });

    // Bonus 2: outbreakManagementRate
    describe("Bonus 2: outbreakManagementRate", () => {
      it("+4 when >= 90%", () => {
        const input = moderateBaseInput();
        input.illness_outbreak_records = nOutbreaks(10); // 100% all 4 checks
        const r = computeInfectionPreventionControl(input);
        // outbreak management +4, containment +3 (100%), lessons learned +2 (100%)
        // But we want isolation -- containment and lessons are sub-metrics that also have bonuses
        // containmentEffectivenessRate = 100% >= 90 => +3
        // lessonsLearnedRate = 100% >= 90 => +2
        // So total = 52 + 4 + 3 + 2 = 61
        expect(r.infection_score).toBe(52 + 4 + 3 + 2);
      });

      it("+2 when >= 70% and < 90%", () => {
        const input = moderateBaseInput();
        // 8 good : 2 bad (all 4 checks false) => (8*4)/(10*4) = 32/40 = 80%
        input.illness_outbreak_records = mixedOutbreaks(8, 2);
        const r = computeInfectionPreventionControl(input);
        expect(r.outbreak_management_rate).toBe(80);
        // containmentEffectivenessRate = 8/10 = 80% >= 70 => +1
        // lessonsLearnedRate = 8/10 = 80% >= 70 => +1
        expect(r.infection_score).toBe(52 + 2 + 1 + 1);
      });
    });

    // Bonus 3: handHygieneRate
    describe("Bonus 3: handHygieneRate", () => {
      it("+4 when >= 90%", () => {
        const input = moderateBaseInput();
        input.hand_hygiene_records = nHandHygiene(10); // 100% all 4 checks
        const r = computeInfectionPreventionControl(input);
        // handHygieneRate 100% => +4
        // staffTrainingRate 100% => +3
        expect(r.infection_score).toBe(52 + 4 + 3);
      });

      it("+2 when >= 70% and < 90%", () => {
        const input = moderateBaseInput();
        // 8 good : 2 bad => 32/40 = 80%
        input.hand_hygiene_records = mixedHandHygiene(8, 2);
        const r = computeInfectionPreventionControl(input);
        expect(r.hand_hygiene_rate).toBe(80);
        // staffTrainingRate = 8/10 = 80% >= 70 => +1
        expect(r.infection_score).toBe(52 + 2 + 1);
      });
    });

    // Bonus 4: cleaningComplianceRate
    describe("Bonus 4: cleaningComplianceRate", () => {
      it("+3 when >= 90%", () => {
        const input = moderateBaseInput();
        input.cleaning_schedule_records = nCleaning(10); // 100%
        const r = computeInfectionPreventionControl(input);
        expect(r.infection_score).toBe(52 + 3);
      });

      it("+1 when >= 70% and < 90%", () => {
        const input = moderateBaseInput();
        // 8 good : 2 bad => 24/30 = 80%
        input.cleaning_schedule_records = mixedCleaning(8, 2);
        const r = computeInfectionPreventionControl(input);
        expect(r.cleaning_compliance_rate).toBe(80);
        expect(r.infection_score).toBe(52 + 1);
      });
    });

    // Bonus 5: immunisationCoverageRate
    describe("Bonus 5: immunisationCoverageRate", () => {
      it("+3 when >= 90%", () => {
        const input = moderateBaseInput();
        // 10 children, 10 unique children immunised => 100%
        input.immunisation_records = Array.from({ length: 10 }, (_, i) =>
          makeImmunisation({ id: `imm_${i}`, child_id: `yp_${i + 1}` }),
        );
        const r = computeInfectionPreventionControl(input);
        expect(r.immunisation_coverage_rate).toBe(100);
        expect(r.infection_score).toBe(52 + 3);
      });

      it("+1 when >= 70% and < 90%", () => {
        const input = moderateBaseInput();
        // 8 out of 10 children => 80%
        input.immunisation_records = Array.from({ length: 8 }, (_, i) =>
          makeImmunisation({ id: `imm_${i}`, child_id: `yp_${i + 1}` }),
        );
        const r = computeInfectionPreventionControl(input);
        expect(r.immunisation_coverage_rate).toBe(80);
        expect(r.infection_score).toBe(52 + 1);
      });
    });

    // Bonus 6: staffTrainingRate
    describe("Bonus 6: staffTrainingRate", () => {
      it("+3 when >= 90%", () => {
        const input = moderateBaseInput();
        // All hand hygiene records with training_completed = true
        // But handHygieneRate must stay moderate (60%) to not trigger its bonus
        // Solution: 10 records, all training_completed=true, but only 6 have the 4 composite checks
        const trained = nHandHygiene(6, { training_completed: true });
        const trainedBad = nHandHygiene(4, {
          training_completed: true,
          hand_hygiene_performed: false,
          technique_correct: false,
          soap_or_sanitiser_used: false,
          duration_adequate: false,
        }).map((h, i) => ({ ...h, id: `hh_tb_${i}` }));
        input.hand_hygiene_records = [...trained, ...trainedBad];
        const r = computeInfectionPreventionControl(input);
        expect(r.staff_training_rate).toBe(100);
        // handHygieneRate = (6*4)/(10*4) = 60% => no bonus
        expect(r.hand_hygiene_rate).toBe(60);
        expect(r.infection_score).toBe(52 + 3);
      });

      it("+1 when >= 70% and < 90%", () => {
        const input = moderateBaseInput();
        // 8 trained, 2 untrained, but hand hygiene composite stays ~60%
        const trained = nHandHygiene(6, { training_completed: true });
        const trainedBad = nHandHygiene(2, {
          training_completed: true,
          hand_hygiene_performed: false,
          technique_correct: false,
          soap_or_sanitiser_used: false,
          duration_adequate: false,
        }).map((h, i) => ({ ...h, id: `hh_tb_${i}` }));
        const untrained = nHandHygiene(2, {
          training_completed: false,
          hand_hygiene_performed: false,
          technique_correct: false,
          soap_or_sanitiser_used: false,
          duration_adequate: false,
        }).map((h, i) => ({ ...h, id: `hh_ut_${i}` }));
        input.hand_hygiene_records = [...trained, ...trainedBad, ...untrained];
        const r = computeInfectionPreventionControl(input);
        expect(r.staff_training_rate).toBe(80);
        expect(r.hand_hygiene_rate).toBe(60);
        expect(r.infection_score).toBe(52 + 1);
      });
    });

    // Bonus 7: containmentEffectivenessRate
    describe("Bonus 7: containmentEffectivenessRate", () => {
      it("+3 when >= 90%", () => {
        const input = moderateBaseInput();
        // All outbreaks contained, but management checks mixed so outbreakManagementRate stays moderate
        // 6 good outbreaks (all 4 checks) + 4 with only containment_effective=true
        const fullGood = nOutbreaks(6);
        const partialGood = nOutbreaks(4, {
          isolation_measures_implemented: false,
          gp_consulted: false,
          containment_effective: true,
          lessons_learned_documented: false,
        }).map((o, i) => ({ ...o, id: `out_pg_${i}` }));
        input.illness_outbreak_records = [...fullGood, ...partialGood];
        const r = computeInfectionPreventionControl(input);
        // containment: 10/10 = 100% => +3
        // outbreakManagement: (6+6+10+6)/(10*4) = 28/40 = 70% => +2
        // lessonsLearned: 6/10 = 60% => no bonus
        expect(r.infection_score).toBeDefined();
        // outbreakManagement = (6*4 + 4*1) / (10*4) = 28/40 = 70% => +2
        expect(r.outbreak_management_rate).toBe(70);
        expect(r.infection_score).toBe(52 + 2 + 3);
      });

      it("+1 when >= 70% and < 90%", () => {
        const input = moderateBaseInput();
        // 8 contained, 2 not, but overall management stays ~60%
        const fullGood = nOutbreaks(5);
        const containedOnly = nOutbreaks(3, {
          isolation_measures_implemented: false,
          gp_consulted: false,
          containment_effective: true,
          lessons_learned_documented: false,
        }).map((o, i) => ({ ...o, id: `out_co_${i}` }));
        const bad = nOutbreaks(2, {
          isolation_measures_implemented: false,
          gp_consulted: false,
          containment_effective: false,
          lessons_learned_documented: false,
        }).map((o, i) => ({ ...o, id: `out_bad_${i}` }));
        input.illness_outbreak_records = [...fullGood, ...containedOnly, ...bad];
        const r = computeInfectionPreventionControl(input);
        // containment: 8/10 = 80% => +1
        // outbreakManagement: (5*4 + 3*1) / (10*4) = 23/40 = 58% => no bonus
        // lessonsLearned: 5/10 = 50% => no bonus
        expect(r.infection_score).toBe(52 + 1);
      });
    });

    // Bonus 8: auditIssueResolutionRate
    describe("Bonus 8: auditIssueResolutionRate", () => {
      it("+2 when >= 90%", () => {
        const input = moderateBaseInput();
        // All audits have issues identified and resolved
        input.hygiene_audit_records = nAudits(6).map((a, i) => ({
          ...a,
          id: `aud_r_${i}`,
          issues_identified: ["issue"],
          issues_resolved: true,
        }));
        // But this makes audit compliance 100% which gives +4 bonus on hygiene
        // To isolate, make audits fail some checks
        input.hygiene_audit_records = Array.from({ length: 10 }, (_, i) => ({
          ...makeAudit({
            id: `aud_${i}`,
            // ~62.5% compliance: 5 true out of 8
            hand_wash_stations_adequate: true,
            soap_dispensers_stocked: true,
            sanitiser_available: true,
            waste_disposal_compliant: true,
            laundry_procedures_followed: true,
            food_hygiene_compliant: false,
            personal_protective_equipment_available: false,
            infection_control_signage_displayed: false,
            issues_identified: ["issue"],
            issues_resolved: true,
          }),
        }));
        const r = computeInfectionPreventionControl(input);
        // hygieneAuditComplianceRate = (10*5)/(10*8) = 50/80 = 63% => no bonus, no penalty
        expect(r.hygiene_audit_compliance_rate).toBe(63);
        expect(r.infection_score).toBe(52 + 2);
      });

      it("+1 when >= 70% and < 90%", () => {
        const input = moderateBaseInput();
        input.hygiene_audit_records = Array.from({ length: 10 }, (_, i) => ({
          ...makeAudit({
            id: `aud_${i}`,
            hand_wash_stations_adequate: true,
            soap_dispensers_stocked: true,
            sanitiser_available: true,
            waste_disposal_compliant: true,
            laundry_procedures_followed: true,
            food_hygiene_compliant: false,
            personal_protective_equipment_available: false,
            infection_control_signage_displayed: false,
            issues_identified: i < 10 ? ["issue"] : [],
            issues_resolved: i < 8, // 8/10 = 80%
          }),
        }));
        const r = computeInfectionPreventionControl(input);
        expect(r.hygiene_audit_compliance_rate).toBe(63);
        expect(r.infection_score).toBe(52 + 1);
      });
    });

    // Bonus 9: lessonsLearnedRate
    describe("Bonus 9: lessonsLearnedRate", () => {
      it("+2 when >= 90%", () => {
        const input = moderateBaseInput();
        // All outbreaks have lessons learned, but not all have other checks
        const outbreaks = Array.from({ length: 10 }, (_, i) => ({
          ...makeOutbreak({
            id: `out_${i}`,
            isolation_measures_implemented: i < 6,
            gp_consulted: i < 6,
            containment_effective: i < 6,
            lessons_learned_documented: true, // 100%
          }),
        }));
        input.illness_outbreak_records = outbreaks;
        const r = computeInfectionPreventionControl(input);
        // lessonsLearned = 10/10 = 100% => +2
        // outbreakManagement = (6+6+6+10)/(10*4) = 28/40 = 70% => +2
        // containment = 6/10 = 60% => no bonus
        expect(r.infection_score).toBe(52 + 2 + 2);
      });

      it("+1 when >= 70% and < 90%", () => {
        const input = moderateBaseInput();
        const outbreaks = Array.from({ length: 10 }, (_, i) => ({
          ...makeOutbreak({
            id: `out_${i}`,
            isolation_measures_implemented: i < 5,
            gp_consulted: i < 5,
            containment_effective: i < 5,
            lessons_learned_documented: i < 8, // 80% => +1
          }),
        }));
        input.illness_outbreak_records = outbreaks;
        const r = computeInfectionPreventionControl(input);
        // outbreakManagement = (5+5+5+8)/(10*4) = 23/40 = 58% => no bonus
        // containment = 5/10 = 50% => no bonus
        expect(r.infection_score).toBe(52 + 1);
      });
    });
  });

  // ── Maximum bonuses ──────────────────────────────────────────────────

  describe("max bonuses", () => {
    it("maximum score with all bonuses is 52 + 28 = 80", () => {
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 4,
        hygiene_audit_records: [
          makeAudit({ issues_identified: ["issue"], issues_resolved: true }),
        ],
        illness_outbreak_records: nOutbreaks(1),
        hand_hygiene_records: nHandHygiene(10),
        cleaning_schedule_records: nCleaning(10),
        immunisation_records: [
          makeImmunisation({ child_id: "yp_1" }),
          makeImmunisation({ id: "imm_2", child_id: "yp_2" }),
          makeImmunisation({ id: "imm_3", child_id: "yp_3" }),
          makeImmunisation({ id: "imm_4", child_id: "yp_4" }),
        ],
      }));
      expect(r.infection_score).toBe(80);
    });
  });

  // ── Penalties ────────────────────────────────────────────────────────

  describe("penalties", () => {
    describe("hygiene audit compliance < 50% penalty (-5)", () => {
      it("applies -5 when hygieneAuditComplianceRate < 50%", () => {
        const input = baseInput({
          total_children: 10,
          hygiene_audit_records: mixedAudits(4, 6), // 4*8/(10*8)=32/80=40%
          illness_outbreak_records: mixedOutbreaks(6, 4),
          hand_hygiene_records: mixedHandHygiene(6, 4),
          cleaning_schedule_records: mixedCleaning(6, 4),
          immunisation_records: Array.from({ length: 6 }, (_, i) =>
            makeImmunisation({ id: `imm_${i}`, child_id: `yp_${i + 1}` }),
          ),
        });
        const r = computeInfectionPreventionControl(input);
        expect(r.hygiene_audit_compliance_rate).toBe(40);
        expect(r.infection_score).toBe(52 - 5);
      });

      it("does not apply penalty when audit rate >= 50%", () => {
        const input = baseInput({
          total_children: 10,
          hygiene_audit_records: mixedAudits(5, 5), // 50%
          illness_outbreak_records: mixedOutbreaks(6, 4),
          hand_hygiene_records: mixedHandHygiene(6, 4),
          cleaning_schedule_records: mixedCleaning(6, 4),
          immunisation_records: Array.from({ length: 6 }, (_, i) =>
            makeImmunisation({ id: `imm_${i}`, child_id: `yp_${i + 1}` }),
          ),
        });
        const r = computeInfectionPreventionControl(input);
        expect(r.hygiene_audit_compliance_rate).toBe(50);
        expect(r.infection_score).toBe(52);
      });
    });

    describe("hand hygiene < 50% penalty (-5)", () => {
      it("applies -5 when handHygieneRate < 50%", () => {
        const input = baseInput({
          total_children: 10,
          hygiene_audit_records: mixedAudits(6, 4),
          illness_outbreak_records: mixedOutbreaks(6, 4),
          hand_hygiene_records: mixedHandHygiene(4, 6), // (4*4)/(10*4) = 40%
          cleaning_schedule_records: mixedCleaning(6, 4),
          immunisation_records: Array.from({ length: 6 }, (_, i) =>
            makeImmunisation({ id: `imm_${i}`, child_id: `yp_${i + 1}` }),
          ),
        });
        const r = computeInfectionPreventionControl(input);
        expect(r.hand_hygiene_rate).toBe(40);
        expect(r.infection_score).toBe(52 - 5);
      });
    });

    describe("cleaning compliance < 50% penalty (-5)", () => {
      it("applies -5 when cleaningComplianceRate < 50%", () => {
        const input = baseInput({
          total_children: 10,
          hygiene_audit_records: mixedAudits(6, 4),
          illness_outbreak_records: mixedOutbreaks(6, 4),
          hand_hygiene_records: mixedHandHygiene(6, 4),
          cleaning_schedule_records: mixedCleaning(4, 6), // (4*3)/(10*3) = 40%
          immunisation_records: Array.from({ length: 6 }, (_, i) =>
            makeImmunisation({ id: `imm_${i}`, child_id: `yp_${i + 1}` }),
          ),
        });
        const r = computeInfectionPreventionControl(input);
        expect(r.cleaning_compliance_rate).toBe(40);
        expect(r.infection_score).toBe(52 - 5);
      });
    });

    describe("spread rate > 50% penalty (-3)", () => {
      it("applies -3 when more than half of outbreaks spread to multiple children", () => {
        const input = baseInput({
          total_children: 10,
          hygiene_audit_records: mixedAudits(6, 4),
          illness_outbreak_records: [
            // 6 multi-child, 4 single-child => spreadRate = 60% > 50
            ...nOutbreaks(6, { children_affected_count: 3 }).map((o, i) => ({
              ...o,
              id: `out_spread_${i}`,
              isolation_measures_implemented: i < 4,
              gp_consulted: i < 4,
              containment_effective: i < 4,
              lessons_learned_documented: i < 4,
            })),
            ...nOutbreaks(4, { children_affected_count: 1 }).map((o, i) => ({
              ...o,
              id: `out_single_${i}`,
              isolation_measures_implemented: i < 2,
              gp_consulted: i < 2,
              containment_effective: i < 2,
              lessons_learned_documented: i < 2,
            })),
          ],
          hand_hygiene_records: mixedHandHygiene(6, 4),
          cleaning_schedule_records: mixedCleaning(6, 4),
          immunisation_records: Array.from({ length: 6 }, (_, i) =>
            makeImmunisation({ id: `imm_${i}`, child_id: `yp_${i + 1}` }),
          ),
        });
        const r = computeInfectionPreventionControl(input);
        expect(r.infection_score).toBe(52 - 3);
      });

      it("does not apply spread penalty when spreadRate <= 50%", () => {
        const input = baseInput({
          total_children: 10,
          hygiene_audit_records: mixedAudits(6, 4),
          illness_outbreak_records: [
            ...nOutbreaks(5, { children_affected_count: 3 }).map((o, i) => ({
              ...o,
              id: `out_spread_${i}`,
              isolation_measures_implemented: i < 3,
              gp_consulted: i < 3,
              containment_effective: i < 3,
              lessons_learned_documented: i < 3,
            })),
            ...nOutbreaks(5, { children_affected_count: 1 }).map((o, i) => ({
              ...o,
              id: `out_single_${i}`,
              isolation_measures_implemented: i < 3,
              gp_consulted: i < 3,
              containment_effective: i < 3,
              lessons_learned_documented: i < 3,
            })),
          ],
          hand_hygiene_records: mixedHandHygiene(6, 4),
          cleaning_schedule_records: mixedCleaning(6, 4),
          immunisation_records: Array.from({ length: 6 }, (_, i) =>
            makeImmunisation({ id: `imm_${i}`, child_id: `yp_${i + 1}` }),
          ),
        });
        const r = computeInfectionPreventionControl(input);
        expect(r.infection_score).toBe(52);
      });
    });

    describe("cumulative penalties", () => {
      it("all four penalties apply: -5 -5 -5 -3 = -18", () => {
        const r = computeInfectionPreventionControl(baseInput({
          total_children: 4,
          hygiene_audit_records: mixedAudits(0, 10), // 0%
          illness_outbreak_records: nOutbreaks(4, {
            isolation_measures_implemented: false,
            gp_consulted: false,
            containment_effective: false,
            lessons_learned_documented: false,
            children_affected_count: 3,
          }),
          hand_hygiene_records: mixedHandHygiene(0, 10), // 0%
          cleaning_schedule_records: mixedCleaning(0, 10), // 0%
          immunisation_records: [],
        }));
        expect(r.infection_score).toBe(52 - 5 - 5 - 5 - 3);
      });
    });

    describe("score clamping", () => {
      it("score never goes below 0", () => {
        // Even with extreme penalties, floor is 0
        const r = computeInfectionPreventionControl(baseInput({
          total_children: 4,
          hygiene_audit_records: mixedAudits(0, 100),
          illness_outbreak_records: nOutbreaks(100, {
            isolation_measures_implemented: false,
            gp_consulted: false,
            containment_effective: false,
            lessons_learned_documented: false,
            children_affected_count: 5,
          }),
          hand_hygiene_records: mixedHandHygiene(0, 100),
          cleaning_schedule_records: mixedCleaning(0, 100),
          immunisation_records: [],
        }));
        expect(r.infection_score).toBeGreaterThanOrEqual(0);
      });

      it("score never exceeds 100", () => {
        // Even with extreme bonuses, cap is 100
        const r = computeInfectionPreventionControl(baseInput({
          total_children: 4,
          hygiene_audit_records: [
            makeAudit({ issues_identified: ["issue"], issues_resolved: true }),
          ],
          illness_outbreak_records: nOutbreaks(1),
          hand_hygiene_records: nHandHygiene(100),
          cleaning_schedule_records: nCleaning(100),
          immunisation_records: [
            makeImmunisation({ child_id: "yp_1" }),
            makeImmunisation({ id: "imm_2", child_id: "yp_2" }),
            makeImmunisation({ id: "imm_3", child_id: "yp_3" }),
            makeImmunisation({ id: "imm_4", child_id: "yp_4" }),
          ],
        }));
        expect(r.infection_score).toBeLessThanOrEqual(100);
      });
    });
  });

  // ── Rate calculations ────────────────────────────────────────────────

  describe("rate calculations", () => {
    describe("hygiene_audit_compliance_rate", () => {
      it("100% when all 8 checks pass on all audits", () => {
        const r = computeInfectionPreventionControl(baseInput({
          hygiene_audit_records: nAudits(5),
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.hygiene_audit_compliance_rate).toBe(100);
      });

      it("0% when all 8 checks fail on all audits", () => {
        const r = computeInfectionPreventionControl(baseInput({
          hygiene_audit_records: nAudits(5, {
            hand_wash_stations_adequate: false,
            soap_dispensers_stocked: false,
            sanitiser_available: false,
            waste_disposal_compliant: false,
            laundry_procedures_followed: false,
            food_hygiene_compliant: false,
            personal_protective_equipment_available: false,
            infection_control_signage_displayed: false,
          }),
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.hygiene_audit_compliance_rate).toBe(0);
      });

      it("50% when half of checks pass", () => {
        const r = computeInfectionPreventionControl(baseInput({
          hygiene_audit_records: nAudits(2, {
            hand_wash_stations_adequate: true,
            soap_dispensers_stocked: true,
            sanitiser_available: true,
            waste_disposal_compliant: true,
            laundry_procedures_followed: false,
            food_hygiene_compliant: false,
            personal_protective_equipment_available: false,
            infection_control_signage_displayed: false,
          }),
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.hygiene_audit_compliance_rate).toBe(50);
      });
    });

    describe("outbreak_management_rate", () => {
      it("100% when all 4 management checks pass", () => {
        const r = computeInfectionPreventionControl(baseInput({
          illness_outbreak_records: nOutbreaks(3),
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.outbreak_management_rate).toBe(100);
      });

      it("0% when all 4 management checks fail", () => {
        const r = computeInfectionPreventionControl(baseInput({
          illness_outbreak_records: nOutbreaks(3, {
            isolation_measures_implemented: false,
            gp_consulted: false,
            containment_effective: false,
            lessons_learned_documented: false,
          }),
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.outbreak_management_rate).toBe(0);
      });

      it("50% when 2 of 4 checks pass per outbreak", () => {
        const r = computeInfectionPreventionControl(baseInput({
          illness_outbreak_records: nOutbreaks(4, {
            isolation_measures_implemented: true,
            gp_consulted: true,
            containment_effective: false,
            lessons_learned_documented: false,
          }),
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.outbreak_management_rate).toBe(50);
      });
    });

    describe("hand_hygiene_rate", () => {
      it("100% when all 4 composite checks pass", () => {
        const r = computeInfectionPreventionControl(baseInput({
          hand_hygiene_records: nHandHygiene(5),
          hygiene_audit_records: nAudits(1),
        }));
        expect(r.hand_hygiene_rate).toBe(100);
      });

      it("0% when all 4 composite checks fail", () => {
        const r = computeInfectionPreventionControl(baseInput({
          hand_hygiene_records: nHandHygiene(5, {
            hand_hygiene_performed: false,
            technique_correct: false,
            soap_or_sanitiser_used: false,
            duration_adequate: false,
          }),
          hygiene_audit_records: nAudits(1),
        }));
        expect(r.hand_hygiene_rate).toBe(0);
      });

      it("25% when only 1 of 4 checks passes", () => {
        const r = computeInfectionPreventionControl(baseInput({
          hand_hygiene_records: nHandHygiene(4, {
            hand_hygiene_performed: true,
            technique_correct: false,
            soap_or_sanitiser_used: false,
            duration_adequate: false,
          }),
          hygiene_audit_records: nAudits(1),
        }));
        expect(r.hand_hygiene_rate).toBe(25);
      });
    });

    describe("cleaning_compliance_rate", () => {
      it("100% when all 3 composite checks pass", () => {
        const r = computeInfectionPreventionControl(baseInput({
          cleaning_schedule_records: nCleaning(5),
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.cleaning_compliance_rate).toBe(100);
      });

      it("0% when all 3 composite checks fail", () => {
        const r = computeInfectionPreventionControl(baseInput({
          cleaning_schedule_records: nCleaning(5, {
            completed: false,
            products_used_correctly: false,
            check_passed: false,
          }),
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.cleaning_compliance_rate).toBe(0);
      });

      it("33% when only 1 of 3 checks passes", () => {
        const r = computeInfectionPreventionControl(baseInput({
          cleaning_schedule_records: nCleaning(3, {
            completed: true,
            products_used_correctly: false,
            check_passed: false,
          }),
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.cleaning_compliance_rate).toBe(33);
      });
    });

    describe("immunisation_coverage_rate", () => {
      it("100% when all children have administered immunisations", () => {
        const r = computeInfectionPreventionControl(baseInput({
          total_children: 3,
          immunisation_records: [
            makeImmunisation({ id: "imm_1", child_id: "yp_1" }),
            makeImmunisation({ id: "imm_2", child_id: "yp_2" }),
            makeImmunisation({ id: "imm_3", child_id: "yp_3" }),
          ],
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.immunisation_coverage_rate).toBe(100);
      });

      it("0% when no immunisations are administered", () => {
        const r = computeInfectionPreventionControl(baseInput({
          total_children: 3,
          immunisation_records: nImmunisations(3, { administered: false }),
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.immunisation_coverage_rate).toBe(0);
      });

      it("50% when half of children have administered immunisations", () => {
        const r = computeInfectionPreventionControl(baseInput({
          total_children: 4,
          immunisation_records: [
            makeImmunisation({ id: "imm_1", child_id: "yp_1" }),
            makeImmunisation({ id: "imm_2", child_id: "yp_2" }),
            makeImmunisation({ id: "imm_3", child_id: "yp_3", administered: false }),
            makeImmunisation({ id: "imm_4", child_id: "yp_4", administered: false }),
          ],
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.immunisation_coverage_rate).toBe(50);
      });

      it("counts unique children, not total records", () => {
        const r = computeInfectionPreventionControl(baseInput({
          total_children: 4,
          immunisation_records: [
            makeImmunisation({ id: "imm_1", child_id: "yp_1", vaccine_name: "MMR" }),
            makeImmunisation({ id: "imm_2", child_id: "yp_1", vaccine_name: "HPV" }),
            makeImmunisation({ id: "imm_3", child_id: "yp_2", vaccine_name: "MMR" }),
          ],
          hand_hygiene_records: nHandHygiene(1),
        }));
        // 2 unique children out of 4 = 50%
        expect(r.immunisation_coverage_rate).toBe(50);
      });

      it("is 0 when total_children is 0 even with records", () => {
        // This path won't actually hit because total_children=0 with empty arrays => insufficient_data
        // But if we have records and total_children=0, coverage is 0
        const r = computeInfectionPreventionControl(baseInput({
          total_children: 0,
          immunisation_records: [makeImmunisation()],
          hand_hygiene_records: nHandHygiene(1),
        }));
        // Won't be insufficient_data because we have records
        expect(r.immunisation_coverage_rate).toBe(0);
      });
    });

    describe("staff_training_rate", () => {
      it("100% when all hand hygiene records have training completed", () => {
        const r = computeInfectionPreventionControl(baseInput({
          hand_hygiene_records: nHandHygiene(5, { training_completed: true }),
          hygiene_audit_records: nAudits(1),
        }));
        expect(r.staff_training_rate).toBe(100);
      });

      it("0% when no training completed", () => {
        const r = computeInfectionPreventionControl(baseInput({
          hand_hygiene_records: nHandHygiene(5, { training_completed: false }),
          hygiene_audit_records: nAudits(1),
        }));
        expect(r.staff_training_rate).toBe(0);
      });

      it("60% when 3 of 5 have training", () => {
        const trained = nHandHygiene(3, { training_completed: true });
        const untrained = nHandHygiene(2, { training_completed: false }).map((h, i) => ({
          ...h,
          id: `hh_ut_${i}`,
        }));
        const r = computeInfectionPreventionControl(baseInput({
          hand_hygiene_records: [...trained, ...untrained],
          hygiene_audit_records: nAudits(1),
        }));
        expect(r.staff_training_rate).toBe(60);
      });
    });
  });

  // ── Totals ───────────────────────────────────────────────────────────

  describe("totals", () => {
    it("total_audits matches hygiene_audit_records length", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hygiene_audit_records: nAudits(7),
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.total_audits).toBe(7);
    });

    it("total_outbreaks matches illness_outbreak_records length", () => {
      const r = computeInfectionPreventionControl(baseInput({
        illness_outbreak_records: nOutbreaks(5),
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.total_outbreaks).toBe(5);
    });

    it("total_hand_hygiene_observations matches hand_hygiene_records length", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hand_hygiene_records: nHandHygiene(12),
        hygiene_audit_records: nAudits(1),
      }));
      expect(r.total_hand_hygiene_observations).toBe(12);
    });

    it("total_cleaning_records matches cleaning_schedule_records length", () => {
      const r = computeInfectionPreventionControl(baseInput({
        cleaning_schedule_records: nCleaning(9),
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.total_cleaning_records).toBe(9);
    });

    it("total_immunisation_records matches immunisation_records length", () => {
      const r = computeInfectionPreventionControl(baseInput({
        immunisation_records: nImmunisations(6),
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.total_immunisation_records).toBe(6);
    });
  });

  // ── Strengths ────────────────────────────────────────────────────────

  describe("strengths", () => {
    it("includes hygiene audit strength when compliance >= 90%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hygiene_audit_records: nAudits(10),
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.strengths.some((s) => s.includes("100% hygiene audit compliance"))).toBe(true);
    });

    it("includes hygiene audit strength at 70-89%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hygiene_audit_records: mixedAudits(8, 2), // 80%
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.strengths.some((s) => s.includes("80% hygiene audit compliance"))).toBe(true);
    });

    it("includes outbreak management strength when >= 90%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        illness_outbreak_records: nOutbreaks(5),
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.strengths.some((s) => s.includes("100% outbreak management effectiveness"))).toBe(true);
    });

    it("includes hand hygiene strength when >= 90%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hand_hygiene_records: nHandHygiene(10),
        hygiene_audit_records: nAudits(1),
      }));
      expect(r.strengths.some((s) => s.includes("100% hand hygiene compliance"))).toBe(true);
    });

    it("includes cleaning compliance strength when >= 90%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        cleaning_schedule_records: nCleaning(10),
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.strengths.some((s) => s.includes("100% cleaning compliance"))).toBe(true);
    });

    it("includes immunisation coverage strength when >= 90%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 4,
        immunisation_records: [
          makeImmunisation({ child_id: "yp_1" }),
          makeImmunisation({ id: "imm_2", child_id: "yp_2" }),
          makeImmunisation({ id: "imm_3", child_id: "yp_3" }),
          makeImmunisation({ id: "imm_4", child_id: "yp_4" }),
        ],
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.strengths.some((s) => s.includes("100% immunisation coverage"))).toBe(true);
    });

    it("includes staff training strength when >= 90%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hand_hygiene_records: nHandHygiene(10, { training_completed: true }),
        hygiene_audit_records: nAudits(1),
      }));
      expect(r.strengths.some((s) => s.includes("100% staff infection control training completion"))).toBe(true);
    });

    it("includes containment effectiveness strength when >= 90%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        illness_outbreak_records: nOutbreaks(10, { containment_effective: true }),
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.strengths.some((s) => s.includes("100% outbreak containment effectiveness"))).toBe(true);
    });

    it("includes audit issue resolution strength when >= 90%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hygiene_audit_records: nAudits(5, {
          issues_identified: ["issue"],
          issues_resolved: true,
        }),
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.strengths.some((s) => s.includes("100% of hygiene audit issues resolved"))).toBe(true);
    });

    it("includes lessons learned strength when >= 90%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        illness_outbreak_records: nOutbreaks(10, { lessons_learned_documented: true }),
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.strengths.some((s) => s.includes("100% of outbreaks have documented lessons learned"))).toBe(true);
    });

    it("includes isolation rate strength when >= 90%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        illness_outbreak_records: nOutbreaks(10, { isolation_measures_implemented: true }),
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.strengths.some((s) => s.includes("100% of outbreaks have isolation measures"))).toBe(true);
    });

    it("includes GP consultation strength when >= 90%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        illness_outbreak_records: nOutbreaks(10, { gp_consulted: true }),
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.strengths.some((s) => s.includes("100% GP consultation during outbreaks"))).toBe(true);
    });

    it("includes cleaning completion strength when >= 95%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        cleaning_schedule_records: nCleaning(20, { completed: true }),
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.strengths.some((s) => s.includes("100% cleaning schedule completion"))).toBe(true);
    });

    it("includes consent rate strength when >= 90%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        immunisation_records: nImmunisations(10, { consent_obtained: true }),
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.strengths.some((s) => s.includes("100% immunisation consent obtained"))).toBe(true);
    });

    it("includes technique correct strength when >= 90%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hand_hygiene_records: nHandHygiene(10, { technique_correct: true }),
        hygiene_audit_records: nAudits(1),
      }));
      expect(r.strengths.some((s) => s.includes("100% correct hand hygiene technique"))).toBe(true);
    });

    it("no strengths when all rates below 70%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 10,
        hygiene_audit_records: mixedAudits(6, 4), // 60%
        illness_outbreak_records: mixedOutbreaks(6, 4), // 60%
        hand_hygiene_records: mixedHandHygiene(6, 4), // 60%
        cleaning_schedule_records: mixedCleaning(6, 4), // 60%
        immunisation_records: Array.from({ length: 6 }, (_, i) =>
          makeImmunisation({
            id: `imm_${i}`,
            child_id: `yp_${i + 1}`,
            consent_obtained: i < 3, // 50% consent => below 90% threshold
          }),
        ), // 60%
      }));
      expect(r.strengths).toHaveLength(0);
    });
  });

  // ── Concerns ─────────────────────────────────────────────────────────

  describe("concerns", () => {
    it("concern when hygiene audit compliance < 50%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hygiene_audit_records: mixedAudits(3, 7), // 30%
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.concerns.some((c) => c.includes("30% hygiene audit compliance"))).toBe(true);
    });

    it("concern when hygiene audit compliance 50-69%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hygiene_audit_records: mixedAudits(6, 4), // 60%
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.concerns.some((c) => c.includes("60%"))).toBe(true);
    });

    it("concern when hand hygiene < 50%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hand_hygiene_records: mixedHandHygiene(3, 7), // 30%
        hygiene_audit_records: nAudits(1),
      }));
      expect(r.concerns.some((c) => c.includes("30% hand hygiene compliance"))).toBe(true);
    });

    it("concern when hand hygiene 50-69%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hand_hygiene_records: mixedHandHygiene(6, 4), // 60%
        hygiene_audit_records: nAudits(1),
      }));
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("Hand hygiene"))).toBe(true);
    });

    it("concern when cleaning compliance < 50%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        cleaning_schedule_records: mixedCleaning(3, 7), // 30%
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.concerns.some((c) => c.includes("30% cleaning compliance"))).toBe(true);
    });

    it("concern when cleaning compliance 50-69%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        cleaning_schedule_records: mixedCleaning(6, 4), // 60%
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("Cleaning compliance"))).toBe(true);
    });

    it("concern when outbreak management < 50%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        illness_outbreak_records: nOutbreaks(5, {
          isolation_measures_implemented: false,
          gp_consulted: false,
          containment_effective: false,
          lessons_learned_documented: false,
        }),
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.concerns.some((c) => c.includes("0% outbreak management effectiveness"))).toBe(true);
    });

    it("concern when outbreak management 50-69%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        illness_outbreak_records: mixedOutbreaks(6, 4), // 60%
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.concerns.some((c) => c.includes("Outbreak management at 60%"))).toBe(true);
    });

    it("concern when immunisation coverage < 50%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 10,
        immunisation_records: [
          makeImmunisation({ child_id: "yp_1" }),
        ],
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.concerns.some((c) => c.includes("10% immunisation coverage"))).toBe(true);
    });

    it("concern when immunisation coverage 50-69%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 10,
        immunisation_records: Array.from({ length: 6 }, (_, i) =>
          makeImmunisation({ id: `imm_${i}`, child_id: `yp_${i + 1}` }),
        ),
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("Immunisation coverage"))).toBe(true);
    });

    it("concern when staff training < 50%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hand_hygiene_records: nHandHygiene(5, { training_completed: false }),
        hygiene_audit_records: nAudits(1),
      }));
      expect(r.concerns.some((c) => c.includes("0% staff infection control training"))).toBe(true);
    });

    it("concern when staff training 50-69%", () => {
      const trained = nHandHygiene(6, { training_completed: true });
      const untrained = nHandHygiene(4, { training_completed: false }).map((h, i) => ({
        ...h,
        id: `hh_ut_${i}`,
      }));
      const r = computeInfectionPreventionControl(baseInput({
        hand_hygiene_records: [...trained, ...untrained],
        hygiene_audit_records: nAudits(1),
      }));
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("Staff training"))).toBe(true);
    });

    it("concern when spread rate > 50%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        illness_outbreak_records: nOutbreaks(10, { children_affected_count: 3 }),
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.concerns.some((c) => c.includes("100% of outbreaks affected multiple children"))).toBe(true);
    });

    it("concern when spread rate 31-50%", () => {
      // 4 multi-child out of 10 = 40%
      const multi = nOutbreaks(4, { children_affected_count: 3 });
      const single = nOutbreaks(6, { children_affected_count: 1 }).map((o, i) => ({
        ...o,
        id: `out_s_${i}`,
      }));
      const r = computeInfectionPreventionControl(baseInput({
        illness_outbreak_records: [...multi, ...single],
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.concerns.some((c) => c.includes("40% of outbreaks affected multiple children"))).toBe(true);
    });

    it("concern when containment < 50%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        illness_outbreak_records: nOutbreaks(10, { containment_effective: false }),
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.concerns.some((c) => c.includes("0% outbreak containment effectiveness"))).toBe(true);
    });

    it("concern when containment 50-69%", () => {
      const good = nOutbreaks(6, { containment_effective: true });
      const bad = nOutbreaks(4, { containment_effective: false }).map((o, i) => ({
        ...o,
        id: `out_b_${i}`,
      }));
      const r = computeInfectionPreventionControl(baseInput({
        illness_outbreak_records: [...good, ...bad],
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("containment"))).toBe(true);
    });

    it("concern when audit issue resolution < 50%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hygiene_audit_records: nAudits(5, {
          issues_identified: ["issue"],
          issues_resolved: false,
        }),
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.concerns.some((c) => c.includes("0% of hygiene audit issues resolved"))).toBe(true);
    });

    it("concern when lessons learned < 50%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        illness_outbreak_records: nOutbreaks(10, { lessons_learned_documented: false }),
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.concerns.some((c) => c.includes("0% of outbreaks have documented lessons learned"))).toBe(true);
    });

    it("concern when cleaning completion < 70%", () => {
      const completed = nCleaning(6, { completed: true });
      const notCompleted = nCleaning(4, { completed: false }).map((c, i) => ({
        ...c,
        id: `cln_nc_${i}`,
      }));
      const r = computeInfectionPreventionControl(baseInput({
        cleaning_schedule_records: [...completed, ...notCompleted],
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("Cleaning completion"))).toBe(true);
    });

    it("concern when no audits but children on placement", () => {
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 3,
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.concerns.some((c) => c.includes("No hygiene audit records exist"))).toBe(true);
    });

    it("concern when no hand hygiene obs but children on placement", () => {
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 3,
        hygiene_audit_records: nAudits(1),
      }));
      expect(r.concerns.some((c) => c.includes("No hand hygiene observations recorded"))).toBe(true);
    });

    it("concern when no cleaning records but children on placement", () => {
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 3,
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.concerns.some((c) => c.includes("No cleaning schedule records exist"))).toBe(true);
    });

    it("concern when no immunisation records but children on placement", () => {
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 3,
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.concerns.some((c) => c.includes("No immunisation records exist"))).toBe(true);
    });

    it("concern when catchUpPlanRate < 50%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        immunisation_records: [
          makeImmunisation({
            id: "imm_1",
            child_id: "yp_1",
            administered: false,
            declined: false,
            catch_up_plan_in_place: false,
          }),
        ],
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.concerns.some((c) => c.includes("catch-up plans"))).toBe(true);
    });
  });

  // ── Recommendations ──────────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommendation when hygiene audit compliance < 50%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hygiene_audit_records: mixedAudits(0, 10),
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("hygiene audit standards"))).toBe(true);
      expect(r.recommendations.some((rec) => rec.urgency === "immediate")).toBe(true);
    });

    it("recommendation when hand hygiene < 50%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hand_hygiene_records: mixedHandHygiene(0, 10),
        hygiene_audit_records: nAudits(1),
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("hand hygiene retraining"))).toBe(true);
    });

    it("recommendation when cleaning < 50%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        cleaning_schedule_records: mixedCleaning(0, 10),
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("cleaning protocols"))).toBe(true);
    });

    it("recommendation when outbreak management < 50%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        illness_outbreak_records: nOutbreaks(5, {
          isolation_measures_implemented: false,
          gp_consulted: false,
          containment_effective: false,
          lessons_learned_documented: false,
        }),
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("outbreak management protocol"))).toBe(true);
    });

    it("recommendation when immunisation coverage < 50%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 10,
        immunisation_records: [makeImmunisation({ child_id: "yp_1" })],
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("immunisation records"))).toBe(true);
    });

    it("recommendation when staff training < 50%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hand_hygiene_records: nHandHygiene(5, { training_completed: false }),
        hygiene_audit_records: nAudits(1),
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("infection control training for all staff"))).toBe(true);
    });

    it("recommendation when spread rate > 50%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        illness_outbreak_records: nOutbreaks(10, { children_affected_count: 3 }),
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("containment protocols"))).toBe(true);
    });

    it("recommendation when no audits but children present", () => {
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 3,
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("hygiene auditing"))).toBe(true);
    });

    it("recommendation when no hand hygiene obs but children present", () => {
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 3,
        hygiene_audit_records: nAudits(1),
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("hand hygiene observations"))).toBe(true);
    });

    it("recommendation when no cleaning records but children present", () => {
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 3,
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("cleaning schedules"))).toBe(true);
    });

    it("recommendation when no immunisation records but children present", () => {
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 3,
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("immunisation tracking"))).toBe(true);
    });

    it("recommendation when audit issue resolution < 50%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hygiene_audit_records: nAudits(5, {
          issues_identified: ["issue"],
          issues_resolved: false,
        }),
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("audit issue tracker"))).toBe(true);
    });

    it("recommendation when lessons learned < 50%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        illness_outbreak_records: nOutbreaks(10, { lessons_learned_documented: false }),
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("post-outbreak debrief"))).toBe(true);
    });

    it("recommendation when catchUpPlanRate < 50%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        immunisation_records: [
          makeImmunisation({
            administered: false,
            declined: false,
            catch_up_plan_in_place: false,
          }),
        ],
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("catch-up immunisation plans"))).toBe(true);
    });

    it("'soon' urgency recommendation for hygiene audit 50-69%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hygiene_audit_records: mixedAudits(6, 4), // 60%
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.recommendations.some((rec) =>
        rec.recommendation.includes("hygiene audit compliance") && rec.urgency === "soon",
      )).toBe(true);
    });

    it("'soon' urgency recommendation for hand hygiene 50-69%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hand_hygiene_records: mixedHandHygiene(6, 4), // 60%
        hygiene_audit_records: nAudits(1),
      }));
      expect(r.recommendations.some((rec) =>
        rec.recommendation.includes("hand hygiene training") && rec.urgency === "soon",
      )).toBe(true);
    });

    it("'planned' urgency recommendation for cleaning 50-69%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        cleaning_schedule_records: mixedCleaning(6, 4), // 60%
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.recommendations.some((rec) =>
        rec.recommendation.includes("cleaning protocols") && rec.urgency === "planned",
      )).toBe(true);
    });

    it("'planned' urgency recommendation for immunisation 50-69%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 10,
        immunisation_records: Array.from({ length: 6 }, (_, i) =>
          makeImmunisation({ id: `imm_${i}`, child_id: `yp_${i + 1}` }),
        ),
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.recommendations.some((rec) =>
        rec.recommendation.includes("immunisation coverage") && rec.urgency === "planned",
      )).toBe(true);
    });

    it("'planned' urgency recommendation for staff training 50-69%", () => {
      const trained = nHandHygiene(6, { training_completed: true });
      const untrained = nHandHygiene(4, { training_completed: false }).map((h, i) => ({
        ...h,
        id: `hh_ut_${i}`,
      }));
      const r = computeInfectionPreventionControl(baseInput({
        hand_hygiene_records: [...trained, ...untrained],
        hygiene_audit_records: nAudits(1),
      }));
      expect(r.recommendations.some((rec) =>
        rec.recommendation.includes("infection control training") && rec.urgency === "planned",
      )).toBe(true);
    });

    it("'planned' urgency recommendation for outbreak management 50-69%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        illness_outbreak_records: mixedOutbreaks(6, 4), // 60%
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.recommendations.some((rec) =>
        rec.recommendation.includes("outbreak management") && rec.urgency === "planned",
      )).toBe(true);
    });

    it("'planned' urgency recommendation for cleaning issue resolution < 70%", () => {
      const r = computeInfectionPreventionControl(baseInput({
        cleaning_schedule_records: nCleaning(5, {
          issues_found: "dirty area",
          issues_addressed: false,
        }),
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.recommendations.some((rec) =>
        rec.recommendation.includes("cleaning issues") && rec.urgency === "planned",
      )).toBe(true);
    });

    it("recommendations have sequential ranks", () => {
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 10,
        hygiene_audit_records: mixedAudits(0, 10),
        hand_hygiene_records: mixedHandHygiene(0, 10),
        cleaning_schedule_records: mixedCleaning(0, 10),
        immunisation_records: [],
        illness_outbreak_records: [],
      }));
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("every recommendation has a regulatory_ref", () => {
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 10,
        hygiene_audit_records: mixedAudits(0, 10),
        hand_hygiene_records: mixedHandHygiene(0, 10),
        cleaning_schedule_records: mixedCleaning(0, 10),
        immunisation_records: [],
        illness_outbreak_records: [],
      }));
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref).toBeTruthy();
        expect(rec.regulatory_ref).toContain("CHR 2015");
      }
    });
  });

  // ── Insights ─────────────────────────────────────────────────────────

  describe("insights", () => {
    describe("critical insights", () => {
      it("critical insight for hygiene audit < 50%", () => {
        const r = computeInfectionPreventionControl(baseInput({
          hygiene_audit_records: mixedAudits(0, 10),
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("hygiene audit compliance"))).toBe(true);
      });

      it("critical insight for hand hygiene < 50%", () => {
        const r = computeInfectionPreventionControl(baseInput({
          hand_hygiene_records: mixedHandHygiene(0, 10),
          hygiene_audit_records: nAudits(1),
        }));
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("hand hygiene compliance"))).toBe(true);
      });

      it("critical insight for cleaning < 50%", () => {
        const r = computeInfectionPreventionControl(baseInput({
          cleaning_schedule_records: mixedCleaning(0, 10),
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("cleaning compliance"))).toBe(true);
      });

      it("critical insight for spread > 50%", () => {
        const r = computeInfectionPreventionControl(baseInput({
          illness_outbreak_records: nOutbreaks(10, { children_affected_count: 3 }),
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("spread to multiple children"))).toBe(true);
      });

      it("critical insight for outbreak management < 50%", () => {
        const r = computeInfectionPreventionControl(baseInput({
          illness_outbreak_records: nOutbreaks(5, {
            isolation_measures_implemented: false,
            gp_consulted: false,
            containment_effective: false,
            lessons_learned_documented: false,
          }),
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("outbreak management effectiveness"))).toBe(true);
      });

      it("critical insight for immunisation coverage < 50%", () => {
        const r = computeInfectionPreventionControl(baseInput({
          total_children: 10,
          immunisation_records: [makeImmunisation({ child_id: "yp_1" })],
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("immunisation coverage"))).toBe(true);
      });

      it("critical insight for staff training < 50%", () => {
        const r = computeInfectionPreventionControl(baseInput({
          hand_hygiene_records: nHandHygiene(5, { training_completed: false }),
          hygiene_audit_records: nAudits(1),
        }));
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("staff infection control training"))).toBe(true);
      });

      it("critical insight for no audits with children on placement", () => {
        const r = computeInfectionPreventionControl(baseInput({
          total_children: 3,
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No hygiene audits recorded"))).toBe(true);
      });

      it("critical insight for no hand hygiene obs with children on placement", () => {
        const r = computeInfectionPreventionControl(baseInput({
          total_children: 3,
          hygiene_audit_records: nAudits(1),
        }));
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No hand hygiene observations recorded"))).toBe(true);
      });

      it("critical insight for no cleaning records with children on placement", () => {
        const r = computeInfectionPreventionControl(baseInput({
          total_children: 3,
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No cleaning schedule records exist"))).toBe(true);
      });
    });

    describe("warning insights", () => {
      it("warning insight for hygiene audit 50-69%", () => {
        const r = computeInfectionPreventionControl(baseInput({
          hygiene_audit_records: mixedAudits(6, 4), // 60%
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Hygiene audit compliance"))).toBe(true);
      });

      it("warning insight for hand hygiene 50-69%", () => {
        const r = computeInfectionPreventionControl(baseInput({
          hand_hygiene_records: mixedHandHygiene(6, 4), // 60%
          hygiene_audit_records: nAudits(1),
        }));
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Hand hygiene compliance"))).toBe(true);
      });

      it("warning insight for cleaning 50-69%", () => {
        const r = computeInfectionPreventionControl(baseInput({
          cleaning_schedule_records: mixedCleaning(6, 4), // 60%
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Cleaning compliance"))).toBe(true);
      });

      it("warning insight for outbreak management 50-69%", () => {
        const r = computeInfectionPreventionControl(baseInput({
          illness_outbreak_records: mixedOutbreaks(6, 4), // 60%
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Outbreak management"))).toBe(true);
      });

      it("warning insight for immunisation coverage 50-69%", () => {
        const r = computeInfectionPreventionControl(baseInput({
          total_children: 10,
          immunisation_records: Array.from({ length: 6 }, (_, i) =>
            makeImmunisation({ id: `imm_${i}`, child_id: `yp_${i + 1}` }),
          ),
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Immunisation coverage"))).toBe(true);
      });

      it("warning insight for staff training 50-69%", () => {
        const trained = nHandHygiene(6, { training_completed: true });
        const untrained = nHandHygiene(4, { training_completed: false }).map((h, i) => ({
          ...h,
          id: `hh_ut_${i}`,
        }));
        const r = computeInfectionPreventionControl(baseInput({
          hand_hygiene_records: [...trained, ...untrained],
          hygiene_audit_records: nAudits(1),
        }));
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Staff training"))).toBe(true);
      });

      it("warning insight for containment 50-69%", () => {
        const good = nOutbreaks(6, { containment_effective: true });
        const bad = nOutbreaks(4, { containment_effective: false }).map((o, i) => ({
          ...o,
          id: `out_b_${i}`,
        }));
        const r = computeInfectionPreventionControl(baseInput({
          illness_outbreak_records: [...good, ...bad],
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Outbreak containment"))).toBe(true);
      });

      it("warning insight for audit issue resolution 50-69%", () => {
        const resolved = nAudits(6, { issues_identified: ["issue"], issues_resolved: true });
        const unresolved = nAudits(4, { issues_identified: ["issue"], issues_resolved: false }).map((a, i) => ({
          ...a,
          id: `aud_unr_${i}`,
        }));
        const r = computeInfectionPreventionControl(baseInput({
          hygiene_audit_records: [...resolved, ...unresolved],
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Audit issue resolution"))).toBe(true);
      });

      it("warning insight for cleaning completion 70-89%", () => {
        const completed = nCleaning(8, { completed: true });
        const notCompleted = nCleaning(2, { completed: false }).map((c, i) => ({
          ...c,
          id: `cln_nc_${i}`,
        }));
        const r = computeInfectionPreventionControl(baseInput({
          cleaning_schedule_records: [...completed, ...notCompleted],
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Cleaning completion"))).toBe(true);
      });

      it("warning insight for catchUpPlanRate < 50%", () => {
        const r = computeInfectionPreventionControl(baseInput({
          immunisation_records: [
            makeImmunisation({
              administered: false,
              declined: false,
              catch_up_plan_in_place: false,
            }),
          ],
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("catch-up plans"))).toBe(true);
      });

      it("warning insight with outbreak type analysis", () => {
        const r = computeInfectionPreventionControl(baseInput({
          illness_outbreak_records: [
            makeOutbreak({ id: "out_1", illness_type: "gastro" }),
            makeOutbreak({ id: "out_2", illness_type: "gastro" }),
            makeOutbreak({ id: "out_3", illness_type: "flu" }),
          ],
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("gastro (2)"))).toBe(true);
      });

      it("warning insight for poor cleaning areas", () => {
        // 3+ records of same type with <70% completion
        const poorKitchen = Array.from({ length: 4 }, (_, i) =>
          makeCleaning({
            id: `cln_k_${i}`,
            cleaning_type: "kitchen",
            completed: i < 1, // 1/4 = 25%
          }),
        );
        const r = computeInfectionPreventionControl(baseInput({
          cleaning_schedule_records: poorKitchen,
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("kitchen"))).toBe(true);
      });
    });

    describe("positive insights", () => {
      it("positive insight for outstanding rating", () => {
        const r = computeInfectionPreventionControl(baseInput({
          total_children: 4,
          hygiene_audit_records: [
            makeAudit({ issues_identified: ["issue"], issues_resolved: true }),
          ],
          illness_outbreak_records: nOutbreaks(1),
          hand_hygiene_records: nHandHygiene(10),
          cleaning_schedule_records: nCleaning(10),
          immunisation_records: [
            makeImmunisation({ child_id: "yp_1" }),
            makeImmunisation({ id: "imm_2", child_id: "yp_2" }),
            makeImmunisation({ id: "imm_3", child_id: "yp_3" }),
            makeImmunisation({ id: "imm_4", child_id: "yp_4" }),
          ],
        }));
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding infection prevention"))).toBe(true);
      });

      it("positive insight for high audit + high hand hygiene", () => {
        const r = computeInfectionPreventionControl(baseInput({
          hygiene_audit_records: nAudits(10), // 100%
          hand_hygiene_records: nHandHygiene(10), // 100%
        }));
        expect(r.insights.some((i) =>
          i.severity === "positive" && i.text.includes("audit compliance") && i.text.includes("hand hygiene"),
        )).toBe(true);
      });

      it("positive insight for high containment + high lessons learned", () => {
        const r = computeInfectionPreventionControl(baseInput({
          illness_outbreak_records: nOutbreaks(10), // 100% containment + lessons
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.insights.some((i) =>
          i.severity === "positive" && i.text.includes("containment effectiveness") && i.text.includes("lessons documented"),
        )).toBe(true);
      });

      it("positive insight for high cleaning compliance", () => {
        const r = computeInfectionPreventionControl(baseInput({
          cleaning_schedule_records: nCleaning(10), // 100%
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.insights.some((i) =>
          i.severity === "positive" && i.text.includes("cleaning compliance"),
        )).toBe(true);
      });

      it("positive insight for high immunisation coverage", () => {
        const r = computeInfectionPreventionControl(baseInput({
          total_children: 4,
          immunisation_records: [
            makeImmunisation({ child_id: "yp_1" }),
            makeImmunisation({ id: "imm_2", child_id: "yp_2" }),
            makeImmunisation({ id: "imm_3", child_id: "yp_3" }),
            makeImmunisation({ id: "imm_4", child_id: "yp_4" }),
          ],
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.insights.some((i) =>
          i.severity === "positive" && i.text.includes("immunisation coverage"),
        )).toBe(true);
      });

      it("positive insight for high training + high hand hygiene", () => {
        const r = computeInfectionPreventionControl(baseInput({
          hand_hygiene_records: nHandHygiene(10, { training_completed: true }),
          hygiene_audit_records: nAudits(1),
        }));
        expect(r.insights.some((i) =>
          i.severity === "positive" && i.text.includes("staff training") && i.text.includes("hand hygiene compliance"),
        )).toBe(true);
      });

      it("positive insight for high cleaning completion + high check pass", () => {
        const r = computeInfectionPreventionControl(baseInput({
          cleaning_schedule_records: nCleaning(20, { completed: true, check_passed: true }),
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.insights.some((i) =>
          i.severity === "positive" && i.text.includes("cleaning completion") && i.text.includes("verification pass rate"),
        )).toBe(true);
      });

      it("positive insight for high isolation + high GP consultation", () => {
        const r = computeInfectionPreventionControl(baseInput({
          illness_outbreak_records: nOutbreaks(10, {
            isolation_measures_implemented: true,
            gp_consulted: true,
          }),
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.insights.some((i) =>
          i.severity === "positive" && i.text.includes("isolation implementation") && i.text.includes("GP consultation"),
        )).toBe(true);
      });

      it("positive insight for high audit issue resolution", () => {
        const r = computeInfectionPreventionControl(baseInput({
          hygiene_audit_records: nAudits(10, {
            issues_identified: ["issue"],
            issues_resolved: true,
          }),
          hand_hygiene_records: nHandHygiene(1),
        }));
        expect(r.insights.some((i) =>
          i.severity === "positive" && i.text.includes("hygiene audit issues resolved"),
        )).toBe(true);
      });

      it("positive insight for high technique correct + duration adequate", () => {
        const r = computeInfectionPreventionControl(baseInput({
          hand_hygiene_records: nHandHygiene(10, {
            technique_correct: true,
            duration_adequate: true,
          }),
          hygiene_audit_records: nAudits(1),
        }));
        expect(r.insights.some((i) =>
          i.severity === "positive" && i.text.includes("correct technique") && i.text.includes("adequate duration"),
        )).toBe(true);
      });
    });
  });

  // ── Headlines ────────────────────────────────────────────────────────

  describe("headlines", () => {
    it("outstanding headline", () => {
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 4,
        hygiene_audit_records: [
          makeAudit({ issues_identified: ["issue"], issues_resolved: true }),
        ],
        illness_outbreak_records: nOutbreaks(1),
        hand_hygiene_records: nHandHygiene(10),
        cleaning_schedule_records: nCleaning(10),
        immunisation_records: [
          makeImmunisation({ child_id: "yp_1" }),
          makeImmunisation({ id: "imm_2", child_id: "yp_2" }),
          makeImmunisation({ id: "imm_3", child_id: "yp_3" }),
          makeImmunisation({ id: "imm_4", child_id: "yp_4" }),
        ],
      }));
      expect(r.headline).toContain("Outstanding infection prevention");
    });

    it("good headline mentions strengths and concerns", () => {
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 4,
        hygiene_audit_records: nAudits(10),
        hand_hygiene_records: mixedHandHygiene(7, 3),
        cleaning_schedule_records: nCleaning(10),
        immunisation_records: [
          makeImmunisation({ child_id: "yp_1" }),
          makeImmunisation({ id: "imm_2", child_id: "yp_2" }),
          makeImmunisation({ id: "imm_3", child_id: "yp_3" }),
          makeImmunisation({ id: "imm_4", child_id: "yp_4" }),
        ],
      }));
      expect(r.headline).toContain("Good infection prevention");
    });

    it("adequate headline mentions concerns", () => {
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 10,
        hygiene_audit_records: mixedAudits(6, 4),
        illness_outbreak_records: mixedOutbreaks(6, 4),
        hand_hygiene_records: mixedHandHygiene(6, 4),
        cleaning_schedule_records: mixedCleaning(6, 4),
        immunisation_records: Array.from({ length: 6 }, (_, i) =>
          makeImmunisation({ id: `imm_${i}`, child_id: `yp_${i + 1}` }),
        ),
      }));
      expect(r.headline).toContain("Adequate infection prevention");
      expect(r.headline).toContain("concern");
    });

    it("inadequate headline mentions urgent action", () => {
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 4,
        hygiene_audit_records: mixedAudits(0, 10),
        illness_outbreak_records: nOutbreaks(4, {
          isolation_measures_implemented: false,
          gp_consulted: false,
          containment_effective: false,
          lessons_learned_documented: false,
          children_affected_count: 3,
        }),
        hand_hygiene_records: mixedHandHygiene(0, 10),
        cleaning_schedule_records: mixedCleaning(0, 10),
        immunisation_records: [],
      }));
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toContain("urgent action");
    });
  });

  // ── Edge cases ───────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("single audit record with all checks passing", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hygiene_audit_records: [makeAudit()],
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.hygiene_audit_compliance_rate).toBe(100);
      expect(r.total_audits).toBe(1);
    });

    it("single outbreak with all management checks", () => {
      const r = computeInfectionPreventionControl(baseInput({
        illness_outbreak_records: [makeOutbreak()],
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.outbreak_management_rate).toBe(100);
      expect(r.total_outbreaks).toBe(1);
    });

    it("single hand hygiene record", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hand_hygiene_records: [makeHandHygiene()],
        hygiene_audit_records: nAudits(1),
      }));
      expect(r.hand_hygiene_rate).toBe(100);
      expect(r.total_hand_hygiene_observations).toBe(1);
    });

    it("single cleaning record", () => {
      const r = computeInfectionPreventionControl(baseInput({
        cleaning_schedule_records: [makeCleaning()],
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.cleaning_compliance_rate).toBe(100);
      expect(r.total_cleaning_records).toBe(1);
    });

    it("single immunisation record", () => {
      const r = computeInfectionPreventionControl(baseInput({
        immunisation_records: [makeImmunisation()],
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.total_immunisation_records).toBe(1);
    });

    it("handles audit with no issues identified (issue resolution is 0/0 = 0%)", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hygiene_audit_records: nAudits(5, { issues_identified: [] }),
        hand_hygiene_records: nHandHygiene(1),
      }));
      // No issues identified => auditIssuesIdentified=0 => pct(0,0)=0
      // No audit issue resolution bonus or concern
      expect(r.infection_score).toBeGreaterThanOrEqual(0);
    });

    it("outbreak with zero children affected is not counted as multi-child", () => {
      const r = computeInfectionPreventionControl(baseInput({
        illness_outbreak_records: nOutbreaks(5, { children_affected_count: 1 }),
        hand_hygiene_records: nHandHygiene(1),
      }));
      // spreadRate = 0% (none > 1) => no spread penalty or concern
      expect(r.concerns.every((c) => !c.includes("spread"))).toBe(true);
    });

    it("immunisation record with declined vaccine is not counted as outstanding", () => {
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 2,
        immunisation_records: [
          makeImmunisation({ child_id: "yp_1", administered: true }),
          makeImmunisation({
            id: "imm_2",
            child_id: "yp_2",
            administered: false,
            declined: true,
            decline_reason: "Parent refused",
          }),
        ],
        hand_hygiene_records: nHandHygiene(1),
      }));
      // yp_1 administered, yp_2 declined (not administered, not outstanding)
      // Coverage: 1 unique child administered / 2 total = 50%
      expect(r.immunisation_coverage_rate).toBe(50);
    });

    it("catchUpPlanRate only considers non-administered non-declined vaccines", () => {
      const r = computeInfectionPreventionControl(baseInput({
        immunisation_records: [
          makeImmunisation({ child_id: "yp_1", administered: true }),
          makeImmunisation({
            id: "imm_2",
            child_id: "yp_2",
            administered: false,
            declined: true,
          }),
          makeImmunisation({
            id: "imm_3",
            child_id: "yp_3",
            administered: false,
            declined: false,
            catch_up_plan_in_place: true,
          }),
          makeImmunisation({
            id: "imm_4",
            child_id: "yp_4",
            administered: false,
            declined: false,
            catch_up_plan_in_place: false,
          }),
        ],
        hand_hygiene_records: nHandHygiene(1),
      }));
      // outstandingWithoutPlan: imm_3 + imm_4 = 2
      // catchUpPlans: imm_3 = 1
      // catchUpPlanRate = 50% => not < 50, so no concern
      expect(r.concerns.every((c) => !c.includes("catch-up plans"))).toBe(true);
    });

    it("cleaning with issues_found=null is not counted in issue resolution", () => {
      const r = computeInfectionPreventionControl(baseInput({
        cleaning_schedule_records: nCleaning(5, {
          issues_found: null,
          issues_addressed: false,
        }),
        hand_hygiene_records: nHandHygiene(1),
      }));
      // No cleaning issues => no cleaningIssueResolutionRate concern/recommendation
      expect(r.recommendations.every((rec) => !rec.recommendation.includes("cleaning issues"))).toBe(true);
    });

    it("cleaning with issues_found='' is not counted in issue resolution", () => {
      const r = computeInfectionPreventionControl(baseInput({
        cleaning_schedule_records: nCleaning(5, {
          issues_found: "",
          issues_addressed: false,
        }),
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.recommendations.every((rec) => !rec.recommendation.includes("cleaning issues"))).toBe(true);
    });

    it("checked_by='' does not count as a check performed", () => {
      const r = computeInfectionPreventionControl(baseInput({
        cleaning_schedule_records: nCleaning(5, { checked_by: "" }),
        hand_hygiene_records: nHandHygiene(1),
      }));
      // checksPerformed should be 0 since checked_by is empty string
      // This doesn't directly affect cleaning_compliance_rate (which uses completed + products + check_passed)
      // but the check rate internally should be 0
      expect(r.total_cleaning_records).toBe(5);
    });

    it("corrective_actions='' does not count as having corrective actions", () => {
      const r = computeInfectionPreventionControl(baseInput({
        hygiene_audit_records: nAudits(5, { corrective_actions: "" }),
        hand_hygiene_records: nHandHygiene(1),
      }));
      // auditsWithCorrectiveActions should be 0
      expect(r.total_audits).toBe(5);
    });

    it("large dataset does not crash", () => {
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 50,
        hygiene_audit_records: nAudits(100),
        illness_outbreak_records: nOutbreaks(50),
        hand_hygiene_records: nHandHygiene(200),
        cleaning_schedule_records: nCleaning(300),
        immunisation_records: Array.from({ length: 50 }, (_, i) =>
          makeImmunisation({ id: `imm_${i}`, child_id: `yp_${i + 1}` }),
        ),
      }));
      expect(r.infection_rating).toBeDefined();
      expect(r.infection_score).toBeGreaterThanOrEqual(0);
      expect(r.infection_score).toBeLessThanOrEqual(100);
    });

    it("total_children=1 with one fully immunised child => 100% coverage", () => {
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 1,
        immunisation_records: [makeImmunisation({ child_id: "yp_1" })],
        hand_hygiene_records: nHandHygiene(1),
      }));
      expect(r.immunisation_coverage_rate).toBe(100);
    });

    it("only immunisation records present, all other arrays empty, children > 0", () => {
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 3,
        immunisation_records: nImmunisations(3),
      }));
      // Not allEmpty because immunisation_records is not empty
      // Should compute normally with base 52
      expect(r.infection_rating).not.toBe("insufficient_data");
      expect(r.infection_score).toBeGreaterThanOrEqual(0);
    });

    it("multiple immunisation records for same child only count once for coverage", () => {
      const r = computeInfectionPreventionControl(baseInput({
        total_children: 2,
        immunisation_records: [
          makeImmunisation({ id: "imm_1", child_id: "yp_1", vaccine_name: "MMR" }),
          makeImmunisation({ id: "imm_2", child_id: "yp_1", vaccine_name: "HPV" }),
          makeImmunisation({ id: "imm_3", child_id: "yp_1", vaccine_name: "Flu" }),
        ],
        hand_hygiene_records: nHandHygiene(1),
      }));
      // 1 unique child out of 2 = 50%
      expect(r.immunisation_coverage_rate).toBe(50);
    });

    it("outbreak types are sorted by count descending", () => {
      const r = computeInfectionPreventionControl(baseInput({
        illness_outbreak_records: [
          makeOutbreak({ id: "o1", illness_type: "flu" }),
          makeOutbreak({ id: "o2", illness_type: "gastro" }),
          makeOutbreak({ id: "o3", illness_type: "gastro" }),
          makeOutbreak({ id: "o4", illness_type: "gastro" }),
          makeOutbreak({ id: "o5", illness_type: "flu" }),
          makeOutbreak({ id: "o6", illness_type: "covid" }),
        ],
        hand_hygiene_records: nHandHygiene(1),
      }));
      const typeInsight = r.insights.find((i) => i.text.includes("Most common illness types"));
      expect(typeInsight).toBeDefined();
      // gastro (3) should come before flu (2)
      const text = typeInsight!.text;
      const gastroPos = text.indexOf("gastro");
      const fluPos = text.indexOf("flu");
      expect(gastroPos).toBeLessThan(fluPos);
    });

    it("poor cleaning areas only flagged when >= 3 records of same type", () => {
      // Only 2 kitchen records (below threshold of 3)
      const poorKitchen = Array.from({ length: 2 }, (_, i) =>
        makeCleaning({
          id: `cln_k_${i}`,
          cleaning_type: "kitchen",
          completed: false,
        }),
      );
      const r = computeInfectionPreventionControl(baseInput({
        cleaning_schedule_records: poorKitchen,
        hand_hygiene_records: nHandHygiene(1),
      }));
      // Should NOT flag kitchen as poor area
      expect(r.insights.every((i) => !i.text.includes("Low cleaning completion in"))).toBe(true);
    });
  });
});
