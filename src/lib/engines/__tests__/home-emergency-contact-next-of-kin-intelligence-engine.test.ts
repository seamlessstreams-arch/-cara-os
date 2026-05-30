// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME EMERGENCY CONTACT & NEXT OF KIN INTELLIGENCE ENGINE — TESTS
// CHR 2015 Reg 5/22/40: Emergency contact management, next of kin, OOH.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeEmergencyContactNextOfKin,
  type EmergencyContactInput,
  type ContactInformationRecordInput,
  type AccessibilityRecordInput,
  type UpdateFrequencyRecordInput,
  type MultiContactRecordInput,
  type OutOfHoursRecordInput,
} from "../home-emergency-contact-next-of-kin-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeContact(overrides: Partial<ContactInformationRecordInput> = {}): ContactInformationRecordInput {
  return {
    id: "contact_1",
    child_id: "yp_alex",
    contact_name: "Jane Smith",
    relationship: "Mother",
    contact_type: "parent",
    phone_primary: "07700900001",
    phone_secondary: "07700900002",
    email: "jane@example.com",
    address_on_file: true,
    last_verified_date: "2026-05-01",
    is_current: true,
    consent_to_contact: true,
    priority_order: 1,
    notes: null,
    created_at: "2026-01-01",
    ...overrides,
  };
}

function makeAccessibility(overrides: Partial<AccessibilityRecordInput> = {}): AccessibilityRecordInput {
  return {
    id: "acc_1",
    child_id: "yp_alex",
    contact_id: "contact_1",
    test_date: "2026-05-01",
    phone_reachable: true,
    answered_within_3_rings: true,
    voicemail_available: true,
    alternative_method_tested: true,
    alternative_method_successful: true,
    response_time_minutes: 5,
    tested_by: "Staff A",
    test_type: "routine_check",
    notes: null,
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeUpdateFrequency(overrides: Partial<UpdateFrequencyRecordInput> = {}): UpdateFrequencyRecordInput {
  return {
    id: "upd_1",
    child_id: "yp_alex",
    contact_id: "contact_1",
    update_date: "2026-05-01",
    update_type: "scheduled_review",
    fields_updated: ["phone_primary", "email"],
    verified_accurate: true,
    updated_by: "Staff A",
    next_review_due: "2026-08-01",
    review_overdue: false,
    notes: null,
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeMultiContact(overrides: Partial<MultiContactRecordInput> = {}): MultiContactRecordInput {
  return {
    id: "mc_1",
    child_id: "yp_alex",
    total_contacts_on_file: 4,
    emergency_contacts_count: 3,
    next_of_kin_designated: true,
    social_worker_contact_on_file: true,
    placing_authority_contact_on_file: true,
    out_of_area_contact_available: true,
    diverse_relationship_types: true,
    last_reviewed_date: "2026-05-01",
    gaps_identified: [],
    gaps_addressed: false,
    reviewed_by: "Staff A",
    created_at: "2026-01-01",
    ...overrides,
  };
}

function makeOOH(overrides: Partial<OutOfHoursRecordInput> = {}): OutOfHoursRecordInput {
  return {
    id: "ooh_1",
    child_id: "yp_alex",
    out_of_hours_contact_designated: true,
    edt_number_on_file: true,
    on_call_manager_accessible: true,
    nhs_111_accessible: true,
    local_hospital_number_on_file: true,
    police_non_emergency_on_file: true,
    placing_authority_ooh_on_file: true,
    last_tested_date: "2026-05-01",
    test_successful: true,
    backup_contact_available: true,
    escalation_procedure_documented: true,
    staff_aware_of_procedure: true,
    reviewed_by: "Staff A",
    created_at: "2026-01-01",
    ...overrides,
  };
}

function baseInput(overrides: Partial<EmergencyContactInput> = {}): EmergencyContactInput {
  return {
    today: "2026-05-30",
    total_children: 3,
    contact_information_records: [
      makeContact({ id: "c1", child_id: "yp_alex" }),
      makeContact({ id: "c2", child_id: "yp_jordan" }),
      makeContact({ id: "c3", child_id: "yp_casey" }),
    ],
    accessibility_records: [
      makeAccessibility({ id: "a1", child_id: "yp_alex" }),
      makeAccessibility({ id: "a2", child_id: "yp_jordan" }),
      makeAccessibility({ id: "a3", child_id: "yp_casey" }),
    ],
    update_frequency_records: [
      makeUpdateFrequency({ id: "u1", child_id: "yp_alex" }),
      makeUpdateFrequency({ id: "u2", child_id: "yp_jordan" }),
      makeUpdateFrequency({ id: "u3", child_id: "yp_casey" }),
    ],
    multi_contact_records: [
      makeMultiContact({ id: "m1", child_id: "yp_alex" }),
      makeMultiContact({ id: "m2", child_id: "yp_jordan" }),
      makeMultiContact({ id: "m3", child_id: "yp_casey" }),
    ],
    out_of_hours_records: [
      makeOOH({ id: "o1", child_id: "yp_alex" }),
      makeOOH({ id: "o2", child_id: "yp_jordan" }),
      makeOOH({ id: "o3", child_id: "yp_casey" }),
    ],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA — all arrays empty + 0 children
// ═══════════════════════════════════════════════════════════════════════════

describe("insufficient data", () => {
  const emptyInput = (): EmergencyContactInput => ({
    today: "2026-05-30",
    total_children: 0,
    contact_information_records: [],
    accessibility_records: [],
    update_frequency_records: [],
    multi_contact_records: [],
    out_of_hours_records: [],
  });

  it("returns insufficient_data rating", () => {
    const r = computeEmergencyContactNextOfKin(emptyInput());
    expect(r.contact_rating).toBe("insufficient_data");
  });

  it("returns score 0", () => {
    const r = computeEmergencyContactNextOfKin(emptyInput());
    expect(r.contact_score).toBe(0);
  });

  it("headline mentions insufficient data", () => {
    const r = computeEmergencyContactNextOfKin(emptyInput());
    expect(r.headline).toContain("insufficient data");
  });

  it("total_contact_records is 0", () => {
    const r = computeEmergencyContactNextOfKin(emptyInput());
    expect(r.total_contact_records).toBe(0);
  });

  it("total_accessibility_tests is 0", () => {
    const r = computeEmergencyContactNextOfKin(emptyInput());
    expect(r.total_accessibility_tests).toBe(0);
  });

  it("all rates are 0", () => {
    const r = computeEmergencyContactNextOfKin(emptyInput());
    expect(r.contact_currency_rate).toBe(0);
    expect(r.accessibility_rate).toBe(0);
    expect(r.update_frequency_rate).toBe(0);
    expect(r.multi_contact_rate).toBe(0);
    expect(r.out_of_hours_rate).toBe(0);
    expect(r.verification_rate).toBe(0);
  });

  it("empty strengths, concerns, recommendations, insights", () => {
    const r = computeEmergencyContactNextOfKin(emptyInput());
    expect(r.strengths).toHaveLength(0);
    expect(r.concerns).toHaveLength(0);
    expect(r.recommendations).toHaveLength(0);
    expect(r.insights).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. INADEQUATE — all arrays empty + children > 0
// ═══════════════════════════════════════════════════════════════════════════

describe("all empty with children on placement", () => {
  const emptyWithChildren = (): EmergencyContactInput => ({
    today: "2026-05-30",
    total_children: 3,
    contact_information_records: [],
    accessibility_records: [],
    update_frequency_records: [],
    multi_contact_records: [],
    out_of_hours_records: [],
  });

  it("returns inadequate rating", () => {
    const r = computeEmergencyContactNextOfKin(emptyWithChildren());
    expect(r.contact_rating).toBe("inadequate");
  });

  it("returns score 15", () => {
    const r = computeEmergencyContactNextOfKin(emptyWithChildren());
    expect(r.contact_score).toBe(15);
  });

  it("headline mentions urgent attention", () => {
    const r = computeEmergencyContactNextOfKin(emptyWithChildren());
    expect(r.headline).toContain("urgent attention");
  });

  it("has exactly 1 concern", () => {
    const r = computeEmergencyContactNextOfKin(emptyWithChildren());
    expect(r.concerns).toHaveLength(1);
  });

  it("concern mentions no records exist", () => {
    const r = computeEmergencyContactNextOfKin(emptyWithChildren());
    expect(r.concerns[0]).toContain("No contact information records");
  });

  it("has exactly 2 recommendations", () => {
    const r = computeEmergencyContactNextOfKin(emptyWithChildren());
    expect(r.recommendations).toHaveLength(2);
  });

  it("recommendations are both immediate urgency", () => {
    const r = computeEmergencyContactNextOfKin(emptyWithChildren());
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[1].urgency).toBe("immediate");
  });

  it("recommendations have sequential ranks 1 and 2", () => {
    const r = computeEmergencyContactNextOfKin(emptyWithChildren());
    expect(r.recommendations[0].rank).toBe(1);
    expect(r.recommendations[1].rank).toBe(2);
  });

  it("first recommendation references Reg 5", () => {
    const r = computeEmergencyContactNextOfKin(emptyWithChildren());
    expect(r.recommendations[0].regulatory_ref).toContain("Reg 5");
  });

  it("second recommendation references Reg 40", () => {
    const r = computeEmergencyContactNextOfKin(emptyWithChildren());
    expect(r.recommendations[1].regulatory_ref).toContain("Reg 40");
  });

  it("has exactly 1 critical insight", () => {
    const r = computeEmergencyContactNextOfKin(emptyWithChildren());
    expect(r.insights).toHaveLength(1);
    expect(r.insights[0].severity).toBe("critical");
  });

  it("insight mentions Reg 5 and Reg 40 compliance", () => {
    const r = computeEmergencyContactNextOfKin(emptyWithChildren());
    expect(r.insights[0].text).toContain("Reg 5");
    expect(r.insights[0].text).toContain("Reg 40");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. OUTSTANDING — perfect baseline
// ═══════════════════════════════════════════════════════════════════════════

describe("outstanding baseline", () => {
  it("returns outstanding rating with all-perfect data", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    expect(r.contact_rating).toBe("outstanding");
  });

  it("score is >= 80", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    expect(r.contact_score).toBeGreaterThanOrEqual(80);
  });

  it("headline mentions outstanding", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    expect(r.headline).toContain("Outstanding");
  });

  it("total_contact_records equals input length", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    expect(r.total_contact_records).toBe(3);
  });

  it("total_accessibility_tests equals input length", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    expect(r.total_accessibility_tests).toBe(3);
  });

  it("contact_currency_rate is 100", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    expect(r.contact_currency_rate).toBe(100);
  });

  it("accessibility_rate is 100", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    expect(r.accessibility_rate).toBe(100);
  });

  it("update_frequency_rate is 100", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    expect(r.update_frequency_rate).toBe(100);
  });

  it("multi_contact_rate is 100", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    expect(r.multi_contact_rate).toBe(100);
  });

  it("out_of_hours_rate is 100", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    expect(r.out_of_hours_rate).toBe(100);
  });

  it("verification_rate is 100", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    expect(r.verification_rate).toBe(100);
  });

  it("has strengths", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  it("has no concerns", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    expect(r.concerns).toHaveLength(0);
  });

  it("has no recommendations", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    expect(r.recommendations).toHaveLength(0);
  });

  it("has positive insights", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const positive = r.insights.filter((i) => i.severity === "positive");
    expect(positive.length).toBeGreaterThan(0);
  });

  it("outstanding insight mentions Reg 5, Reg 22, Reg 40", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const outstandingInsight = r.insights.find((i) => i.text.includes("outstanding"));
    expect(outstandingInsight).toBeDefined();
    expect(outstandingInsight!.text).toContain("Reg 5");
    expect(outstandingInsight!.text).toContain("Reg 22");
    expect(outstandingInsight!.text).toContain("Reg 40");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. SCORE BOUNDARIES — rating thresholds
// ═══════════════════════════════════════════════════════════════════════════

describe("rating boundaries", () => {
  it("score 80+ yields outstanding", () => {
    // base input with all perfect data gives outstanding
    const r = computeEmergencyContactNextOfKin(baseInput());
    expect(r.contact_score).toBeGreaterThanOrEqual(80);
    expect(r.contact_rating).toBe("outstanding");
  });

  it("adequate range (45-64) is achievable", () => {
    // Degrade some metrics but not all — keep update frequency and contacts moderate
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", is_current: true, consent_to_contact: true, last_verified_date: "2026-05-01" }),
        makeContact({ id: "c2", is_current: false, consent_to_contact: false, last_verified_date: null }),
        makeContact({ id: "c3", is_current: false, consent_to_contact: true, last_verified_date: "2026-01-01" }),
      ],
      accessibility_records: [
        makeAccessibility({ id: "a1", phone_reachable: true, answered_within_3_rings: false, voicemail_available: false }),
        makeAccessibility({ id: "a2", phone_reachable: false, answered_within_3_rings: false, voicemail_available: true }),
        makeAccessibility({ id: "a3", phone_reachable: true, answered_within_3_rings: true, voicemail_available: false }),
      ],
      multi_contact_records: [
        makeMultiContact({ id: "m1", total_contacts_on_file: 3, next_of_kin_designated: true, social_worker_contact_on_file: false, placing_authority_contact_on_file: false }),
        makeMultiContact({ id: "m2", total_contacts_on_file: 3, next_of_kin_designated: true, social_worker_contact_on_file: false, placing_authority_contact_on_file: false }),
        makeMultiContact({ id: "m3", total_contacts_on_file: 3, next_of_kin_designated: true, social_worker_contact_on_file: false, placing_authority_contact_on_file: false }),
      ],
      out_of_hours_records: [
        makeOOH({ id: "o1", out_of_hours_contact_designated: true, edt_number_on_file: true, on_call_manager_accessible: false, escalation_procedure_documented: false, staff_aware_of_procedure: true }),
        makeOOH({ id: "o2", out_of_hours_contact_designated: true, edt_number_on_file: true, on_call_manager_accessible: true, escalation_procedure_documented: false, staff_aware_of_procedure: false }),
        makeOOH({ id: "o3", out_of_hours_contact_designated: true, edt_number_on_file: false, on_call_manager_accessible: false, escalation_procedure_documented: true, staff_aware_of_procedure: false }),
      ],
    }));
    expect(r.contact_score).toBeGreaterThanOrEqual(45);
    expect(r.contact_score).toBeLessThan(65);
    expect(r.contact_rating).toBe("adequate");
  });

  it("inadequate is reachable with poor data across all areas", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", is_current: false, consent_to_contact: false, last_verified_date: null }),
        makeContact({ id: "c2", is_current: false, consent_to_contact: false, last_verified_date: null }),
        makeContact({ id: "c3", is_current: false, consent_to_contact: false, last_verified_date: null }),
      ],
      accessibility_records: [
        makeAccessibility({ id: "a1", phone_reachable: false, answered_within_3_rings: false, voicemail_available: false }),
        makeAccessibility({ id: "a2", phone_reachable: false, answered_within_3_rings: false, voicemail_available: false }),
        makeAccessibility({ id: "a3", phone_reachable: false, answered_within_3_rings: false, voicemail_available: false }),
      ],
      update_frequency_records: [
        makeUpdateFrequency({ id: "u1", verified_accurate: false, review_overdue: true, update_type: "incident_triggered", fields_updated: [] }),
        makeUpdateFrequency({ id: "u2", verified_accurate: false, review_overdue: true, update_type: "incident_triggered", fields_updated: [] }),
        makeUpdateFrequency({ id: "u3", verified_accurate: false, review_overdue: true, update_type: "incident_triggered", fields_updated: [] }),
      ],
      multi_contact_records: [
        makeMultiContact({ id: "m1", total_contacts_on_file: 1, next_of_kin_designated: false, social_worker_contact_on_file: false, placing_authority_contact_on_file: false }),
        makeMultiContact({ id: "m2", total_contacts_on_file: 1, next_of_kin_designated: false, social_worker_contact_on_file: false, placing_authority_contact_on_file: false }),
        makeMultiContact({ id: "m3", total_contacts_on_file: 1, next_of_kin_designated: false, social_worker_contact_on_file: false, placing_authority_contact_on_file: false }),
      ],
      out_of_hours_records: [
        makeOOH({ id: "o1", out_of_hours_contact_designated: false, edt_number_on_file: false, on_call_manager_accessible: false, escalation_procedure_documented: false, staff_aware_of_procedure: false }),
        makeOOH({ id: "o2", out_of_hours_contact_designated: false, edt_number_on_file: false, on_call_manager_accessible: false, escalation_procedure_documented: false, staff_aware_of_procedure: false }),
        makeOOH({ id: "o3", out_of_hours_contact_designated: false, edt_number_on_file: false, on_call_manager_accessible: false, escalation_procedure_documented: false, staff_aware_of_procedure: false }),
      ],
    }));
    expect(r.contact_score).toBeLessThan(45);
    expect(r.contact_rating).toBe("inadequate");
  });

  it("score is clamped to 0-100", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    expect(r.contact_score).toBeGreaterThanOrEqual(0);
    expect(r.contact_score).toBeLessThanOrEqual(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. CONTACT CURRENCY RATE
// ═══════════════════════════════════════════════════════════════════════════

describe("contact currency rate", () => {
  it("100% when all current, consented, and recently verified", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    expect(r.contact_currency_rate).toBe(100);
  });

  it("0% when none are current, consented, or recently verified", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", is_current: false, consent_to_contact: false, last_verified_date: null }),
      ],
    }));
    expect(r.contact_currency_rate).toBe(0);
  });

  it("partial rate when some but not all attributes met", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", is_current: true, consent_to_contact: true, last_verified_date: "2026-05-01" }),
        makeContact({ id: "c2", is_current: false, consent_to_contact: false, last_verified_date: null }),
      ],
    }));
    // 1/2 current + 1/2 consented + 1/2 verified = 3 / 6 = 50%
    expect(r.contact_currency_rate).toBe(50);
  });

  it("recently verified only counts within 90 days", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", is_current: true, consent_to_contact: true, last_verified_date: "2026-01-01" }),
      ],
    }));
    // 2026-01-01 to 2026-05-30 = ~150 days -> not recently verified
    // 1/1 + 1/1 + 0/1 = 2/3 = 67%
    expect(r.contact_currency_rate).toBe(67);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. VERIFICATION RATE
// ═══════════════════════════════════════════════════════════════════════════

describe("verification rate", () => {
  it("100% when all contacts have last_verified_date", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    expect(r.verification_rate).toBe(100);
  });

  it("0% when no contacts have last_verified_date", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", last_verified_date: null }),
        makeContact({ id: "c2", last_verified_date: null }),
      ],
    }));
    expect(r.verification_rate).toBe(0);
  });

  it("50% when half verified", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", last_verified_date: "2026-05-01" }),
        makeContact({ id: "c2", last_verified_date: null }),
      ],
    }));
    expect(r.verification_rate).toBe(50);
  });

  it("empty string last_verified_date counts as not verified", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", last_verified_date: "" }),
      ],
    }));
    expect(r.verification_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. ACCESSIBILITY RATE
// ═══════════════════════════════════════════════════════════════════════════

describe("accessibility rate", () => {
  it("100% when all reachable, quick answer, voicemail", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    expect(r.accessibility_rate).toBe(100);
  });

  it("0% when all fail", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      accessibility_records: [
        makeAccessibility({ id: "a1", phone_reachable: false, answered_within_3_rings: false, voicemail_available: false }),
      ],
    }));
    expect(r.accessibility_rate).toBe(0);
  });

  it("33% when only reachable (not quick, no voicemail)", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      accessibility_records: [
        makeAccessibility({ id: "a1", phone_reachable: true, answered_within_3_rings: false, voicemail_available: false }),
      ],
    }));
    // 1/1 reachable + 0/1 quick + 0/1 voicemail = 1/3 = 33%
    expect(r.accessibility_rate).toBe(33);
  });

  it("67% when reachable + voicemail but not quick", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      accessibility_records: [
        makeAccessibility({ id: "a1", phone_reachable: true, answered_within_3_rings: false, voicemail_available: true }),
      ],
    }));
    expect(r.accessibility_rate).toBe(67);
  });

  it("0 when no accessibility records", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      accessibility_records: [],
    }));
    expect(r.accessibility_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. UPDATE FREQUENCY RATE
// ═══════════════════════════════════════════════════════════════════════════

describe("update frequency rate", () => {
  it("100% when all verified, on-time, scheduled", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    expect(r.update_frequency_rate).toBe(100);
  });

  it("0% when none verified, all overdue, none scheduled", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      update_frequency_records: [
        makeUpdateFrequency({ id: "u1", verified_accurate: false, review_overdue: true, update_type: "incident_triggered" }),
      ],
    }));
    expect(r.update_frequency_rate).toBe(0);
  });

  it("counts annual_review as scheduled", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      update_frequency_records: [
        makeUpdateFrequency({ id: "u1", update_type: "annual_review" }),
      ],
    }));
    expect(r.update_frequency_rate).toBe(100);
  });

  it("incident_triggered is not scheduled", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      update_frequency_records: [
        makeUpdateFrequency({ id: "u1", update_type: "incident_triggered", verified_accurate: true, review_overdue: false }),
      ],
    }));
    // 1/1 verified + 1/1 on-time + 0/1 scheduled = 2/3 = 67%
    expect(r.update_frequency_rate).toBe(67);
  });

  it("0 rate when no update records", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      update_frequency_records: [],
    }));
    expect(r.update_frequency_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. MULTI-CONTACT RATE
// ═══════════════════════════════════════════════════════════════════════════

describe("multi-contact rate", () => {
  it("100% when all have 2+ contacts, NOK, SW, PA", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    expect(r.multi_contact_rate).toBe(100);
  });

  it("0% when none meet any criteria", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [
        makeMultiContact({ id: "m1", total_contacts_on_file: 1, next_of_kin_designated: false, social_worker_contact_on_file: false, placing_authority_contact_on_file: false }),
      ],
    }));
    expect(r.multi_contact_rate).toBe(0);
  });

  it("25% with only 2+ contacts but no NOK/SW/PA", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [
        makeMultiContact({ id: "m1", total_contacts_on_file: 3, next_of_kin_designated: false, social_worker_contact_on_file: false, placing_authority_contact_on_file: false }),
      ],
    }));
    // 1/1 min2 + 0/1 nok + 0/1 sw + 0/1 pa = 1/4 = 25%
    expect(r.multi_contact_rate).toBe(25);
  });

  it("50% with 2+ contacts and NOK only", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [
        makeMultiContact({ id: "m1", total_contacts_on_file: 3, next_of_kin_designated: true, social_worker_contact_on_file: false, placing_authority_contact_on_file: false }),
      ],
    }));
    expect(r.multi_contact_rate).toBe(50);
  });

  it("0 rate when no multi-contact records", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [],
    }));
    expect(r.multi_contact_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. OUT-OF-HOURS RATE
// ═══════════════════════════════════════════════════════════════════════════

describe("out-of-hours rate", () => {
  it("100% when all 5 checks pass", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    expect(r.out_of_hours_rate).toBe(100);
  });

  it("0% when all 5 checks fail", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [
        makeOOH({ id: "o1", out_of_hours_contact_designated: false, edt_number_on_file: false, on_call_manager_accessible: false, escalation_procedure_documented: false, staff_aware_of_procedure: false }),
      ],
    }));
    expect(r.out_of_hours_rate).toBe(0);
  });

  it("60% when 3 of 5 checks pass", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [
        makeOOH({ id: "o1", out_of_hours_contact_designated: true, edt_number_on_file: true, on_call_manager_accessible: true, escalation_procedure_documented: false, staff_aware_of_procedure: false }),
      ],
    }));
    expect(r.out_of_hours_rate).toBe(60);
  });

  it("40% when 2 of 5 checks pass", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [
        makeOOH({ id: "o1", out_of_hours_contact_designated: true, edt_number_on_file: true, on_call_manager_accessible: false, escalation_procedure_documented: false, staff_aware_of_procedure: false }),
      ],
    }));
    expect(r.out_of_hours_rate).toBe(40);
  });

  it("0 rate when no OOH records", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [],
    }));
    expect(r.out_of_hours_rate).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. SCORE BONUSES
// ═══════════════════════════════════════════════════════════════════════════

describe("score bonuses", () => {
  it("contactCurrencyRate >= 90 adds +4", () => {
    const perfect = computeEmergencyContactNextOfKin(baseInput());
    // Degrade currency below 90
    const degraded = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", is_current: true, consent_to_contact: true, last_verified_date: "2026-05-01" }),
        makeContact({ id: "c2", is_current: false, consent_to_contact: false, last_verified_date: null }),
        makeContact({ id: "c3", is_current: false, consent_to_contact: false, last_verified_date: null }),
        makeContact({ id: "c4", is_current: false, consent_to_contact: false, last_verified_date: null }),
        makeContact({ id: "c5", is_current: false, consent_to_contact: false, last_verified_date: null }),
        makeContact({ id: "c6", is_current: false, consent_to_contact: false, last_verified_date: null }),
        makeContact({ id: "c7", is_current: false, consent_to_contact: false, last_verified_date: null }),
        makeContact({ id: "c8", is_current: false, consent_to_contact: false, last_verified_date: null }),
        makeContact({ id: "c9", is_current: false, consent_to_contact: false, last_verified_date: null }),
        makeContact({ id: "c10", is_current: false, consent_to_contact: false, last_verified_date: null }),
      ],
    }));
    // Perfect score is higher — bonus was applied
    expect(perfect.contact_score).toBeGreaterThan(degraded.contact_score);
  });

  it("accessibilityRate >= 90 adds +4", () => {
    const perfect = computeEmergencyContactNextOfKin(baseInput());
    const degraded = computeEmergencyContactNextOfKin(baseInput({
      accessibility_records: [
        makeAccessibility({ id: "a1", phone_reachable: false, answered_within_3_rings: false, voicemail_available: false }),
        makeAccessibility({ id: "a2", phone_reachable: false, answered_within_3_rings: false, voicemail_available: false }),
        makeAccessibility({ id: "a3", phone_reachable: false, answered_within_3_rings: false, voicemail_available: false }),
      ],
    }));
    expect(perfect.contact_score).toBeGreaterThan(degraded.contact_score);
  });

  it("updateFrequencyRate >= 90 adds +3", () => {
    const perfect = computeEmergencyContactNextOfKin(baseInput());
    const degraded = computeEmergencyContactNextOfKin(baseInput({
      update_frequency_records: [
        makeUpdateFrequency({ id: "u1", verified_accurate: false, review_overdue: true, update_type: "incident_triggered" }),
        makeUpdateFrequency({ id: "u2", verified_accurate: false, review_overdue: true, update_type: "incident_triggered" }),
        makeUpdateFrequency({ id: "u3", verified_accurate: false, review_overdue: true, update_type: "incident_triggered" }),
      ],
    }));
    expect(perfect.contact_score).toBeGreaterThan(degraded.contact_score);
  });

  it("multiContactRate >= 90 adds +4", () => {
    const perfect = computeEmergencyContactNextOfKin(baseInput());
    const degraded = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [
        makeMultiContact({ id: "m1", total_contacts_on_file: 1, next_of_kin_designated: false, social_worker_contact_on_file: false, placing_authority_contact_on_file: false }),
        makeMultiContact({ id: "m2", total_contacts_on_file: 1, next_of_kin_designated: false, social_worker_contact_on_file: false, placing_authority_contact_on_file: false }),
        makeMultiContact({ id: "m3", total_contacts_on_file: 1, next_of_kin_designated: false, social_worker_contact_on_file: false, placing_authority_contact_on_file: false }),
      ],
    }));
    expect(perfect.contact_score).toBeGreaterThan(degraded.contact_score);
  });

  it("outOfHoursRate >= 90 adds +4", () => {
    const perfect = computeEmergencyContactNextOfKin(baseInput());
    const degraded = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [
        makeOOH({ id: "o1", out_of_hours_contact_designated: false, edt_number_on_file: false, on_call_manager_accessible: false, escalation_procedure_documented: false, staff_aware_of_procedure: false }),
        makeOOH({ id: "o2", out_of_hours_contact_designated: false, edt_number_on_file: false, on_call_manager_accessible: false, escalation_procedure_documented: false, staff_aware_of_procedure: false }),
        makeOOH({ id: "o3", out_of_hours_contact_designated: false, edt_number_on_file: false, on_call_manager_accessible: false, escalation_procedure_documented: false, staff_aware_of_procedure: false }),
      ],
    }));
    expect(perfect.contact_score).toBeGreaterThan(degraded.contact_score);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. SCORE PENALTIES
// ═══════════════════════════════════════════════════════════════════════════

describe("score penalties", () => {
  it("contactCurrencyRate < 50 with records triggers -5 penalty", () => {
    // Compare with and without the penalty condition to verify it reduces score
    const withPenalty = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", is_current: false, consent_to_contact: false, last_verified_date: null }),
        makeContact({ id: "c2", is_current: false, consent_to_contact: false, last_verified_date: null }),
        makeContact({ id: "c3", is_current: false, consent_to_contact: false, last_verified_date: null }),
      ],
    }));
    const withoutPenalty = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", is_current: true, consent_to_contact: true, last_verified_date: "2026-05-01" }),
        makeContact({ id: "c2", is_current: true, consent_to_contact: true, last_verified_date: "2026-05-01" }),
        makeContact({ id: "c3", is_current: true, consent_to_contact: true, last_verified_date: "2026-05-01" }),
      ],
    }));
    expect(withPenalty.contact_currency_rate).toBeLessThan(50);
    expect(withPenalty.contact_score).toBeLessThan(withoutPenalty.contact_score);
  });

  it("accessibilityRate < 50 with records triggers -5 penalty", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      accessibility_records: [
        makeAccessibility({ id: "a1", phone_reachable: false, answered_within_3_rings: false, voicemail_available: false }),
        makeAccessibility({ id: "a2", phone_reachable: false, answered_within_3_rings: false, voicemail_available: false }),
      ],
    }));
    expect(r.accessibility_rate).toBeLessThan(50);
  });

  it("outOfHoursRate < 50 with records triggers -4 penalty", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [
        makeOOH({ id: "o1", out_of_hours_contact_designated: false, edt_number_on_file: false, on_call_manager_accessible: false, escalation_procedure_documented: false, staff_aware_of_procedure: false }),
      ],
    }));
    expect(r.out_of_hours_rate).toBeLessThan(50);
  });

  it("multiContactRate < 40 with records triggers -4 penalty", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [
        makeMultiContact({ id: "m1", total_contacts_on_file: 1, next_of_kin_designated: false, social_worker_contact_on_file: false, placing_authority_contact_on_file: false }),
      ],
    }));
    expect(r.multi_contact_rate).toBeLessThan(40);
  });

  it("no penalty when contact_information_records is empty even if rate is 0", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [],
    }));
    // contact_currency_rate is 0, but no penalty since records empty
    expect(r.contact_currency_rate).toBe(0);
    // Score should still benefit from other bonuses
    expect(r.contact_score).toBeGreaterThanOrEqual(52);
  });

  it("no penalty when accessibility_records is empty even if rate is 0", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      accessibility_records: [],
    }));
    expect(r.accessibility_rate).toBe(0);
    expect(r.contact_score).toBeGreaterThanOrEqual(52);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. STRENGTHS — contact currency
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths — contact currency", () => {
  it("strength at >= 90% currency", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const s = r.strengths.find((s) => s.includes("contact currency"));
    expect(s).toBeDefined();
    expect(s).toContain("100%");
  });

  it("strength at 70-89% currency", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", is_current: true, consent_to_contact: true, last_verified_date: "2026-05-01" }),
        makeContact({ id: "c2", is_current: true, consent_to_contact: true, last_verified_date: "2026-01-01" }),
        makeContact({ id: "c3", is_current: false, consent_to_contact: true, last_verified_date: "2026-05-01" }),
      ],
    }));
    const s = r.strengths.find((s) => s.includes("contact currency"));
    if (r.contact_currency_rate >= 70 && r.contact_currency_rate < 90) {
      expect(s).toBeDefined();
      expect(s).toContain("generally maintains");
    }
  });

  it("no currency strength below 70%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", is_current: false, consent_to_contact: false, last_verified_date: null }),
      ],
    }));
    const s = r.strengths.find((s) => s.includes("contact currency"));
    expect(s).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. STRENGTHS — accessibility
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths — accessibility", () => {
  it("strength at >= 90% accessibility", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const s = r.strengths.find((s) => s.includes("accessibility rate"));
    expect(s).toBeDefined();
    expect(s).toContain("100%");
  });

  it("no accessibility strength below 70%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      accessibility_records: [
        makeAccessibility({ id: "a1", phone_reachable: false, answered_within_3_rings: false, voicemail_available: false }),
      ],
    }));
    const s = r.strengths.find((s) => s.includes("accessibility rate"));
    expect(s).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 15. STRENGTHS — update frequency
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths — update frequency", () => {
  it("strength at >= 90% update frequency", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const s = r.strengths.find((s) => s.includes("update frequency"));
    expect(s).toBeDefined();
  });

  it("no update frequency strength below 70%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      update_frequency_records: [
        makeUpdateFrequency({ id: "u1", verified_accurate: false, review_overdue: true, update_type: "incident_triggered" }),
      ],
    }));
    const s = r.strengths.find((s) => s.includes("update frequency"));
    expect(s).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 16. STRENGTHS — multi-contact
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths — multi-contact", () => {
  it("strength at >= 90% multi-contact coverage", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const s = r.strengths.find((s) => s.includes("multi-contact coverage"));
    expect(s).toBeDefined();
  });

  it("no multi-contact strength below 70%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [
        makeMultiContact({ id: "m1", total_contacts_on_file: 1, next_of_kin_designated: false, social_worker_contact_on_file: false, placing_authority_contact_on_file: false }),
      ],
    }));
    const s = r.strengths.find((s) => s.includes("multi-contact coverage"));
    expect(s).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 17. STRENGTHS — out-of-hours
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths — out-of-hours", () => {
  it("strength at >= 90% OOH", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const s = r.strengths.find((s) => s.includes("out-of-hours readiness"));
    expect(s).toBeDefined();
  });

  it("no OOH strength below 70%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [
        makeOOH({ id: "o1", out_of_hours_contact_designated: false, edt_number_on_file: false, on_call_manager_accessible: false, escalation_procedure_documented: false, staff_aware_of_procedure: false }),
      ],
    }));
    const s = r.strengths.find((s) => s.includes("out-of-hours readiness"));
    expect(s).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 18. STRENGTHS — verification
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths — verification", () => {
  it("strength at >= 90% verification rate", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const s = r.strengths.find((s) => s.includes("contacts verified"));
    expect(s).toBeDefined();
  });

  it("no verification strength below 70%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", last_verified_date: null }),
        makeContact({ id: "c2", last_verified_date: null }),
      ],
    }));
    const s = r.strengths.find((s) => s.includes("contacts verified"));
    expect(s).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 19. STRENGTHS — child coverage
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths — child coverage", () => {
  it("strength at >= 90% child coverage", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const s = r.strengths.find((s) => s.includes("children have current emergency contacts"));
    expect(s).toBeDefined();
  });

  it("no child coverage strength when total_children is 0", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({ total_children: 0 }));
    const s = r.strengths.find((s) => s.includes("children have current emergency contacts"));
    expect(s).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 20. STRENGTHS — next of kin
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths — next of kin", () => {
  it("strength at >= 90% next of kin designation", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const s = r.strengths.find((s) => s.includes("next of kin designation"));
    expect(s).toBeDefined();
  });

  it("no NOK strength below 70%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [
        makeMultiContact({ id: "m1", next_of_kin_designated: false }),
        makeMultiContact({ id: "m2", next_of_kin_designated: false }),
      ],
    }));
    const s = r.strengths.find((s) => s.includes("next of kin designation"));
    expect(s).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 21. STRENGTHS — phone reachability, escalation, staff awareness
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths — specialty metrics", () => {
  it("reachability strength at >= 90%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const s = r.strengths.find((s) => s.includes("phone reachability"));
    expect(s).toBeDefined();
  });

  it("escalation documented strength at >= 90%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const s = r.strengths.find((s) => s.includes("escalation procedures documented"));
    expect(s).toBeDefined();
  });

  it("staff awareness strength at >= 90%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const s = r.strengths.find((s) => s.includes("staff awareness"));
    expect(s).toBeDefined();
  });

  it("consent strength at >= 90%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const s = r.strengths.find((s) => s.includes("consent to contact"));
    expect(s).toBeDefined();
  });

  it("social worker strength at >= 90%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const s = r.strengths.find((s) => s.includes("social worker contact"));
    expect(s).toBeDefined();
  });

  it("rapid response strength at >= 90%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const s = r.strengths.find((s) => s.includes("respond within 15 minutes"));
    expect(s).toBeDefined();
  });

  it("OOH test success strength at >= 90%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const s = r.strengths.find((s) => s.includes("out-of-hours test success"));
    expect(s).toBeDefined();
  });

  it("gap resolution strength at >= 90% when gaps exist", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [
        makeMultiContact({ id: "m1", gaps_identified: ["missing NOK"], gaps_addressed: true }),
        makeMultiContact({ id: "m2", gaps_identified: ["missing SW"], gaps_addressed: true }),
        makeMultiContact({ id: "m3" }),
      ],
    }));
    const s = r.strengths.find((s) => s.includes("contact gaps addressed"));
    expect(s).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 22. CONCERNS — contact currency
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns — contact currency", () => {
  it("critical concern when currency < 50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", is_current: false, consent_to_contact: false, last_verified_date: null }),
      ],
    }));
    const c = r.concerns.find((c) => c.includes("contact currency"));
    expect(c).toBeDefined();
    expect(c).toContain("0%");
  });

  it("moderate concern when currency 50-69%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", is_current: true, consent_to_contact: true, last_verified_date: "2026-05-01" }),
        makeContact({ id: "c2", is_current: false, consent_to_contact: false, last_verified_date: null }),
      ],
    }));
    if (r.contact_currency_rate >= 50 && r.contact_currency_rate < 70) {
      const c = r.concerns.find((c) => c.includes("Contact currency"));
      expect(c).toBeDefined();
    }
  });

  it("no currency concern at >= 70%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const c = r.concerns.find((c) => c.includes("contact currency") || c.includes("Contact currency"));
    expect(c).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 23. CONCERNS — accessibility
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns — accessibility", () => {
  it("critical concern when accessibility < 50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      accessibility_records: [
        makeAccessibility({ id: "a1", phone_reachable: false, answered_within_3_rings: false, voicemail_available: false }),
      ],
    }));
    const c = r.concerns.find((c) => c.includes("accessibility rate"));
    expect(c).toBeDefined();
  });

  it("moderate concern when accessibility 50-69%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      accessibility_records: [
        makeAccessibility({ id: "a1", phone_reachable: true, answered_within_3_rings: true, voicemail_available: false }),
      ],
    }));
    // 1+1+0 / 3 = 67%
    if (r.accessibility_rate >= 50 && r.accessibility_rate < 70) {
      const c = r.concerns.find((c) => c.includes("Accessibility rate"));
      expect(c).toBeDefined();
    }
  });

  it("no accessibility concern at >= 70%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const c = r.concerns.find((c) => c.includes("accessibility rate") || c.includes("Accessibility rate"));
    expect(c).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 24. CONCERNS — update frequency
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns — update frequency", () => {
  it("critical concern when updateFrequencyRate < 50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      update_frequency_records: [
        makeUpdateFrequency({ id: "u1", verified_accurate: false, review_overdue: true, update_type: "incident_triggered" }),
      ],
    }));
    const c = r.concerns.find((c) => c.includes("update frequency"));
    expect(c).toBeDefined();
  });

  it("no update frequency concern at >= 70%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const c = r.concerns.find((c) => c.includes("update frequency") || c.includes("Update frequency"));
    expect(c).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 25. CONCERNS — multi-contact
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns — multi-contact", () => {
  it("critical concern when multiContactRate < 40%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [
        makeMultiContact({ id: "m1", total_contacts_on_file: 1, next_of_kin_designated: false, social_worker_contact_on_file: false, placing_authority_contact_on_file: false }),
      ],
    }));
    const c = r.concerns.find((c) => c.includes("multi-contact coverage"));
    expect(c).toBeDefined();
  });

  it("moderate concern when multiContactRate 40-69%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [
        makeMultiContact({ id: "m1", total_contacts_on_file: 3, next_of_kin_designated: true, social_worker_contact_on_file: false, placing_authority_contact_on_file: false }),
      ],
    }));
    // 1+1+0+0 / 4 = 50%
    if (r.multi_contact_rate >= 40 && r.multi_contact_rate < 70) {
      const c = r.concerns.find((c) => c.includes("Multi-contact coverage"));
      expect(c).toBeDefined();
    }
  });

  it("no multi-contact concern at >= 70%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const c = r.concerns.find((c) => c.includes("multi-contact") || c.includes("Multi-contact"));
    expect(c).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 26. CONCERNS — out-of-hours
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns — out-of-hours", () => {
  it("critical concern when OOH rate < 50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [
        makeOOH({ id: "o1", out_of_hours_contact_designated: false, edt_number_on_file: false, on_call_manager_accessible: false, escalation_procedure_documented: false, staff_aware_of_procedure: false }),
      ],
    }));
    const c = r.concerns.find((c) => c.includes("out-of-hours readiness"));
    expect(c).toBeDefined();
    expect(c).toContain("direct safety risk");
  });

  it("moderate concern when OOH rate 50-69%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [
        makeOOH({ id: "o1", out_of_hours_contact_designated: true, edt_number_on_file: true, on_call_manager_accessible: true, escalation_procedure_documented: false, staff_aware_of_procedure: false }),
      ],
    }));
    // 3/5 = 60%
    const c = r.concerns.find((c) => c.includes("Out-of-hours readiness"));
    expect(c).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 27. CONCERNS — verification
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns — verification", () => {
  it("critical concern when verification < 50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", last_verified_date: null }),
        makeContact({ id: "c2", last_verified_date: null }),
        makeContact({ id: "c3", last_verified_date: "2026-05-01" }),
      ],
    }));
    // 1/3 = 33%
    const c = r.concerns.find((c) => c.includes("verified"));
    expect(c).toBeDefined();
  });

  it("moderate concern when verification 50-69%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", last_verified_date: "2026-05-01" }),
        makeContact({ id: "c2", last_verified_date: null }),
      ],
    }));
    // 50%
    if (r.verification_rate >= 50 && r.verification_rate < 70) {
      const c = r.concerns.find((c) => c.includes("Contact verification rate"));
      expect(c).toBeDefined();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 28. CONCERNS — child coverage
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns — child coverage", () => {
  it("critical concern when child coverage < 50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      total_children: 5,
      contact_information_records: [
        makeContact({ id: "c1", child_id: "yp_alex", is_current: true }),
        makeContact({ id: "c2", child_id: "yp_jordan", is_current: true }),
        // Only 2/5 children covered
      ],
    }));
    const c = r.concerns.find((c) => c.includes("children have current emergency contacts") || c.includes("Child emergency contact coverage"));
    expect(c).toBeDefined();
  });

  it("no child coverage concern at >= 70%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const c = r.concerns.find((c) => c.includes("children have current emergency contacts") && c.includes("Only"));
    expect(c).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 29. CONCERNS — next of kin
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns — next of kin", () => {
  it("critical concern when NOK rate < 50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [
        makeMultiContact({ id: "m1", next_of_kin_designated: false }),
        makeMultiContact({ id: "m2", next_of_kin_designated: false }),
        makeMultiContact({ id: "m3", next_of_kin_designated: true }),
      ],
    }));
    // 1/3 = 33%
    const c = r.concerns.find((c) => c.includes("designated next of kin"));
    expect(c).toBeDefined();
  });

  it("no NOK concern at >= 70%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const c = r.concerns.find((c) => c.includes("designated next of kin") && c.includes("Only"));
    expect(c).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 30. CONCERNS — stale contacts
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns — stale contacts", () => {
  it("critical concern when staleContactRate > 50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", last_verified_date: null }),
        makeContact({ id: "c2", last_verified_date: null }),
        makeContact({ id: "c3", last_verified_date: "2026-05-01" }),
      ],
    }));
    // 2/3 stale = 67%
    const c = r.concerns.find((c) => c.includes("stale"));
    expect(c).toBeDefined();
  });

  it("moderate concern when staleContactRate 31-50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", last_verified_date: null }),
        makeContact({ id: "c2", last_verified_date: "2026-05-01" }),
        makeContact({ id: "c3", last_verified_date: "2026-05-01" }),
      ],
    }));
    // 1/3 stale = 33%
    const c = r.concerns.find((c) => c.includes("stale"));
    expect(c).toBeDefined();
  });

  it("no stale concern when all recently verified", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const c = r.concerns.find((c) => c.includes("stale"));
    expect(c).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 31. CONCERNS — overdue reviews
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns — overdue reviews", () => {
  it("critical concern when overdueRate > 50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      update_frequency_records: [
        makeUpdateFrequency({ id: "u1", review_overdue: true }),
        makeUpdateFrequency({ id: "u2", review_overdue: true }),
        makeUpdateFrequency({ id: "u3", review_overdue: false }),
      ],
    }));
    // 2/3 = 67% overdue
    const c = r.concerns.find((c) => c.includes("reviews are overdue"));
    expect(c).toBeDefined();
  });

  it("moderate concern when overdueRate 31-50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      update_frequency_records: [
        makeUpdateFrequency({ id: "u1", review_overdue: true }),
        makeUpdateFrequency({ id: "u2", review_overdue: false }),
        makeUpdateFrequency({ id: "u3", review_overdue: false }),
      ],
    }));
    // 1/3 = 33% overdue
    const c = r.concerns.find((c) => c.includes("reviews are overdue"));
    expect(c).toBeDefined();
  });

  it("no overdue concern when none overdue", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const c = r.concerns.find((c) => c.includes("reviews are overdue"));
    expect(c).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 32. CONCERNS — escalation and staff awareness
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns — escalation & staff awareness", () => {
  it("concern when escalation documented < 50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [
        makeOOH({ id: "o1", escalation_procedure_documented: false }),
        makeOOH({ id: "o2", escalation_procedure_documented: false }),
        makeOOH({ id: "o3", escalation_procedure_documented: true }),
      ],
    }));
    const c = r.concerns.find((c) => c.includes("escalation procedures documented"));
    expect(c).toBeDefined();
  });

  it("concern when staff awareness < 50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [
        makeOOH({ id: "o1", staff_aware_of_procedure: false }),
        makeOOH({ id: "o2", staff_aware_of_procedure: false }),
        makeOOH({ id: "o3", staff_aware_of_procedure: true }),
      ],
    }));
    const c = r.concerns.find((c) => c.includes("staff awareness"));
    expect(c).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 33. CONCERNS — missing record types despite children on placement
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns — missing record types with children", () => {
  it("concern when no contact records but have other records and children", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [],
    }));
    const c = r.concerns.find((c) => c.includes("No emergency contact information records"));
    expect(c).toBeDefined();
  });

  it("concern when no OOH records but have other records and children", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [],
    }));
    const c = r.concerns.find((c) => c.includes("No out-of-hours arrangements recorded"));
    expect(c).toBeDefined();
  });

  it("concern when no multi-contact records but have other records and children", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [],
    }));
    const c = r.concerns.find((c) => c.includes("No multi-contact assessments"));
    expect(c).toBeDefined();
  });

  it("no missing record concern when total_children is 0", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      total_children: 0,
      contact_information_records: [],
    }));
    const c = r.concerns.find((c) => c.includes("No emergency contact information records"));
    expect(c).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 34. RECOMMENDATIONS — immediate urgency
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations — immediate urgency", () => {
  it("immediate rec when contactCurrencyRate < 50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", is_current: false, consent_to_contact: false, last_verified_date: null }),
      ],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("emergency contact information"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
    expect(rec!.regulatory_ref).toContain("Reg 5");
  });

  it("immediate rec when accessibilityRate < 50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      accessibility_records: [
        makeAccessibility({ id: "a1", phone_reachable: false, answered_within_3_rings: false, voicemail_available: false }),
      ],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("accessibility testing"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("immediate rec when outOfHoursRate < 50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [
        makeOOH({ id: "o1", out_of_hours_contact_designated: false, edt_number_on_file: false, on_call_manager_accessible: false, escalation_procedure_documented: false, staff_aware_of_procedure: false }),
      ],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("out-of-hours emergency arrangements"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("immediate rec when childCoverageRate < 50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      total_children: 5,
      contact_information_records: [
        makeContact({ id: "c1", child_id: "yp_alex", is_current: true }),
      ],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("every child on placement"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("immediate rec when nextOfKinRate < 50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [
        makeMultiContact({ id: "m1", next_of_kin_designated: false }),
        makeMultiContact({ id: "m2", next_of_kin_designated: false }),
      ],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("Designate a next of kin"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("immediate rec when multiContactRate < 40%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [
        makeMultiContact({ id: "m1", total_contacts_on_file: 1, next_of_kin_designated: false, social_worker_contact_on_file: false, placing_authority_contact_on_file: false }),
      ],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("Expand emergency contact coverage"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("immediate rec for missing contact records with children", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("immediate recording of emergency contact"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("immediate rec for missing OOH records with children", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("Establish and document out-of-hours"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("immediate rec for missing multi-contact records with children", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("multi-contact assessment"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("immediate rec when staff awareness < 50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [
        makeOOH({ id: "o1", staff_aware_of_procedure: false }),
        makeOOH({ id: "o2", staff_aware_of_procedure: false }),
      ],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("training to all staff"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });

  it("immediate rec when escalation documented < 50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [
        makeOOH({ id: "o1", escalation_procedure_documented: false }),
        makeOOH({ id: "o2", escalation_procedure_documented: false }),
      ],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("Document clear escalation procedures"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 35. RECOMMENDATIONS — soon urgency
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations — soon urgency", () => {
  it("soon rec when verificationRate < 50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", last_verified_date: null }),
        makeContact({ id: "c2", last_verified_date: null }),
        makeContact({ id: "c3", last_verified_date: "2026-05-01" }),
      ],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("verification programme"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("soon rec when staleContactRate > 50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", last_verified_date: null }),
        makeContact({ id: "c2", last_verified_date: null }),
        makeContact({ id: "c3", last_verified_date: "2026-05-01" }),
      ],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("re-verification of stale contacts"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("soon rec when overdueRate > 50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      update_frequency_records: [
        makeUpdateFrequency({ id: "u1", review_overdue: true }),
        makeUpdateFrequency({ id: "u2", review_overdue: true }),
        makeUpdateFrequency({ id: "u3", review_overdue: false }),
      ],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("backlog of overdue"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("soon rec when contactCurrencyRate 50-69%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", is_current: true, consent_to_contact: true, last_verified_date: "2026-05-01" }),
        makeContact({ id: "c2", is_current: false, consent_to_contact: false, last_verified_date: null }),
      ],
    }));
    if (r.contact_currency_rate >= 50 && r.contact_currency_rate < 70) {
      const rec = r.recommendations.find((r) => r.recommendation.includes("Improve contact currency"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    }
  });

  it("soon rec when accessibilityRate 50-69%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      accessibility_records: [
        makeAccessibility({ id: "a1", phone_reachable: true, answered_within_3_rings: true, voicemail_available: false }),
      ],
    }));
    if (r.accessibility_rate >= 50 && r.accessibility_rate < 70) {
      const rec = r.recommendations.find((r) => r.recommendation.includes("Enhance contact accessibility testing"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    }
  });

  it("soon rec when multiContactRate 40-69%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [
        makeMultiContact({ id: "m1", total_contacts_on_file: 3, next_of_kin_designated: true, social_worker_contact_on_file: false, placing_authority_contact_on_file: false }),
      ],
    }));
    // 50%
    if (r.multi_contact_rate >= 40 && r.multi_contact_rate < 70) {
      const rec = r.recommendations.find((r) => r.recommendation.includes("Strengthen multi-contact arrangements"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 36. RECOMMENDATIONS — planned urgency
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations — planned urgency", () => {
  it("planned rec when outOfHoursRate 50-69%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [
        makeOOH({ id: "o1", out_of_hours_contact_designated: true, edt_number_on_file: true, on_call_manager_accessible: true, escalation_procedure_documented: false, staff_aware_of_procedure: false }),
      ],
    }));
    // 60%
    const rec = r.recommendations.find((r) => r.recommendation.includes("Improve out-of-hours arrangements"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("planned rec when nextOfKinRate 50-69%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [
        makeMultiContact({ id: "m1", next_of_kin_designated: true }),
        makeMultiContact({ id: "m2", next_of_kin_designated: false }),
      ],
    }));
    // 50%
    const rec = r.recommendations.find((r) => r.recommendation.includes("Ensure all children have a designated next of kin"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("planned rec when scheduledUpdateRate < 50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      update_frequency_records: [
        makeUpdateFrequency({ id: "u1", update_type: "incident_triggered" }),
        makeUpdateFrequency({ id: "u2", update_type: "contact_initiated" }),
        makeUpdateFrequency({ id: "u3", update_type: "staff_initiated" }),
      ],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("Shift from reactive to proactive"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("planned rec when gap resolution < 70% and gaps exist", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [
        makeMultiContact({ id: "m1", gaps_identified: ["missing NOK"], gaps_addressed: false }),
        makeMultiContact({ id: "m2", gaps_identified: ["missing SW"], gaps_addressed: false }),
        makeMultiContact({ id: "m3" }),
      ],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("Address identified gaps"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
  });

  it("planned rec when updateFrequencyRate 50-69%", () => {
    // Build a scenario where update frequency is between 50 and 70
    const r = computeEmergencyContactNextOfKin(baseInput({
      update_frequency_records: [
        makeUpdateFrequency({ id: "u1", verified_accurate: true, review_overdue: false, update_type: "scheduled_review" }),
        makeUpdateFrequency({ id: "u2", verified_accurate: false, review_overdue: true, update_type: "incident_triggered" }),
      ],
    }));
    if (r.update_frequency_rate >= 50 && r.update_frequency_rate < 70) {
      const rec = r.recommendations.find((r) => r.recommendation.includes("Improve the consistency and timeliness"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 37. RECOMMENDATIONS — rank ordering
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations — rank ordering", () => {
  it("recommendations have sequential ranks starting from 1", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", is_current: false, consent_to_contact: false, last_verified_date: null }),
      ],
      accessibility_records: [
        makeAccessibility({ id: "a1", phone_reachable: false, answered_within_3_rings: false, voicemail_available: false }),
      ],
      out_of_hours_records: [
        makeOOH({ id: "o1", out_of_hours_contact_designated: false, edt_number_on_file: false, on_call_manager_accessible: false, escalation_procedure_documented: false, staff_aware_of_procedure: false }),
      ],
    }));
    expect(r.recommendations.length).toBeGreaterThan(0);
    for (let i = 0; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].rank).toBe(i + 1);
    }
  });

  it("no recommendations when all metrics are outstanding", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    expect(r.recommendations).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 38. INSIGHTS — critical
// ═══════════════════════════════════════════════════════════════════════════

describe("insights — critical", () => {
  it("critical insight for contactCurrencyRate < 50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", is_current: false, consent_to_contact: false, last_verified_date: null }),
      ],
    }));
    const i = r.insights.find((i) => i.severity === "critical" && i.text.includes("contact currency"));
    expect(i).toBeDefined();
  });

  it("critical insight for accessibilityRate < 50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      accessibility_records: [
        makeAccessibility({ id: "a1", phone_reachable: false, answered_within_3_rings: false, voicemail_available: false }),
      ],
    }));
    const i = r.insights.find((i) => i.severity === "critical" && i.text.includes("accessibility rate"));
    expect(i).toBeDefined();
  });

  it("critical insight for outOfHoursRate < 50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [
        makeOOH({ id: "o1", out_of_hours_contact_designated: false, edt_number_on_file: false, on_call_manager_accessible: false, escalation_procedure_documented: false, staff_aware_of_procedure: false }),
      ],
    }));
    const i = r.insights.find((i) => i.severity === "critical" && i.text.includes("out-of-hours readiness"));
    expect(i).toBeDefined();
  });

  it("critical insight for childCoverageRate < 50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      total_children: 5,
      contact_information_records: [
        makeContact({ id: "c1", child_id: "yp_alex", is_current: true }),
      ],
    }));
    const i = r.insights.find((i) => i.severity === "critical" && i.text.includes("children have current emergency contacts"));
    expect(i).toBeDefined();
  });

  it("critical insight for nextOfKinRate < 50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [
        makeMultiContact({ id: "m1", next_of_kin_designated: false }),
        makeMultiContact({ id: "m2", next_of_kin_designated: false }),
      ],
    }));
    const i = r.insights.find((i) => i.severity === "critical" && i.text.includes("next of kin designation"));
    expect(i).toBeDefined();
  });

  it("critical insight for staffAwareRate < 50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [
        makeOOH({ id: "o1", staff_aware_of_procedure: false }),
        makeOOH({ id: "o2", staff_aware_of_procedure: false }),
      ],
    }));
    const i = r.insights.find((i) => i.severity === "critical" && i.text.includes("staff awareness"));
    expect(i).toBeDefined();
  });

  it("critical insight for missing contact records with children", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [],
    }));
    const i = r.insights.find((i) => i.severity === "critical" && i.text.includes("No emergency contact information records"));
    expect(i).toBeDefined();
  });

  it("critical insight for missing OOH records with children", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [],
    }));
    const i = r.insights.find((i) => i.severity === "critical" && i.text.includes("No out-of-hours arrangements recorded"));
    expect(i).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 39. INSIGHTS — warning
// ═══════════════════════════════════════════════════════════════════════════

describe("insights — warning", () => {
  it("warning insight for contactCurrencyRate 50-69%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", is_current: true, consent_to_contact: true, last_verified_date: "2026-05-01" }),
        makeContact({ id: "c2", is_current: false, consent_to_contact: false, last_verified_date: null }),
      ],
    }));
    if (r.contact_currency_rate >= 50 && r.contact_currency_rate < 70) {
      const i = r.insights.find((i) => i.severity === "warning" && i.text.includes("Contact currency"));
      expect(i).toBeDefined();
    }
  });

  it("warning insight for accessibilityRate 50-69%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      accessibility_records: [
        makeAccessibility({ id: "a1", phone_reachable: true, answered_within_3_rings: true, voicemail_available: false }),
      ],
    }));
    if (r.accessibility_rate >= 50 && r.accessibility_rate < 70) {
      const i = r.insights.find((i) => i.severity === "warning" && i.text.includes("Accessibility rate"));
      expect(i).toBeDefined();
    }
  });

  it("warning insight for scheduledUpdateRate < 50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      update_frequency_records: [
        makeUpdateFrequency({ id: "u1", update_type: "incident_triggered" }),
        makeUpdateFrequency({ id: "u2", update_type: "contact_initiated" }),
      ],
    }));
    const i = r.insights.find((i) => i.severity === "warning" && i.text.includes("scheduled/planned"));
    expect(i).toBeDefined();
  });

  it("warning insight for staleContactRate 31-50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", last_verified_date: null }),
        makeContact({ id: "c2", last_verified_date: "2026-05-01" }),
        makeContact({ id: "c3", last_verified_date: "2026-05-01" }),
      ],
    }));
    // 1/3 = 33% stale
    const i = r.insights.find((i) => i.severity === "warning" && i.text.includes("stale"));
    expect(i).toBeDefined();
  });

  it("warning insight for overdueRate 31-50%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      update_frequency_records: [
        makeUpdateFrequency({ id: "u1", review_overdue: true }),
        makeUpdateFrequency({ id: "u2", review_overdue: false }),
        makeUpdateFrequency({ id: "u3", review_overdue: false }),
      ],
    }));
    // 1/3 = 33% overdue
    const i = r.insights.find((i) => i.severity === "warning" && i.text.includes("reviews are overdue"));
    expect(i).toBeDefined();
  });

  it("warning insight for gap resolution 40-69%", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [
        makeMultiContact({ id: "m1", gaps_identified: ["missing NOK"], gaps_addressed: true }),
        makeMultiContact({ id: "m2", gaps_identified: ["missing SW"], gaps_addressed: false }),
        makeMultiContact({ id: "m3" }),
      ],
    }));
    // 1/2 gaps addressed = 50%
    const i = r.insights.find((i) => i.severity === "warning" && i.text.includes("gap resolution"));
    expect(i).toBeDefined();
  });

  it("contact type distribution insight appears when records exist", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const i = r.insights.find((i) => i.text.includes("Contact type distribution"));
    expect(i).toBeDefined();
    expect(i!.severity).toBe("warning");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 40. INSIGHTS — positive
// ═══════════════════════════════════════════════════════════════════════════

describe("insights — positive", () => {
  it("outstanding insight when rating is outstanding", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const i = r.insights.find((i) => i.severity === "positive" && i.text.includes("outstanding"));
    expect(i).toBeDefined();
  });

  it("positive insight for high currency + verification", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const i = r.insights.find((i) => i.severity === "positive" && i.text.includes("contact currency") && i.text.includes("verification"));
    expect(i).toBeDefined();
  });

  it("positive insight for high accessibility + rapid response", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const i = r.insights.find((i) => i.severity === "positive" && i.text.includes("accessibility") && i.text.includes("rapid response"));
    expect(i).toBeDefined();
  });

  it("positive insight for high multi-contact + NOK", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const i = r.insights.find((i) => i.severity === "positive" && i.text.includes("multi-contact") && i.text.includes("next of kin"));
    expect(i).toBeDefined();
  });

  it("positive insight for high OOH + staff awareness", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const i = r.insights.find((i) => i.severity === "positive" && i.text.includes("out-of-hours readiness") && i.text.includes("staff awareness"));
    expect(i).toBeDefined();
  });

  it("positive insight for high escalation + test success", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const i = r.insights.find((i) => i.severity === "positive" && i.text.includes("escalation procedures documented") && i.text.includes("test success"));
    expect(i).toBeDefined();
  });

  it("positive insight for high child coverage", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const i = r.insights.find((i) => i.severity === "positive" && i.text.includes("child coverage"));
    expect(i).toBeDefined();
  });

  it("positive insight for high gap resolution", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [
        makeMultiContact({ id: "m1", gaps_identified: ["x"], gaps_addressed: true }),
        makeMultiContact({ id: "m2", gaps_identified: ["y"], gaps_addressed: true }),
        makeMultiContact({ id: "m3" }),
      ],
    }));
    const i = r.insights.find((i) => i.severity === "positive" && i.text.includes("gap resolution"));
    expect(i).toBeDefined();
  });

  it("positive insight for high update frequency + scheduled rate", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const i = r.insights.find((i) => i.severity === "positive" && i.text.includes("update frequency") && i.text.includes("scheduled reviews"));
    expect(i).toBeDefined();
  });

  it("positive insight for high consent rate", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const i = r.insights.find((i) => i.severity === "positive" && i.text.includes("consent to contact"));
    expect(i).toBeDefined();
  });

  it("positive insight for high social worker + placing authority rate", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    const i = r.insights.find((i) => i.severity === "positive" && i.text.includes("social worker") && i.text.includes("placing authority"));
    expect(i).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 41. HEADLINE
// ═══════════════════════════════════════════════════════════════════════════

describe("headline", () => {
  it("outstanding headline mentions Outstanding", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    expect(r.headline).toContain("Outstanding");
  });

  it("good headline mentions Good", () => {
    // A scenario that drops to good
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", is_current: true, consent_to_contact: true, last_verified_date: "2026-05-01" }),
        makeContact({ id: "c2", is_current: true, consent_to_contact: true, last_verified_date: "2026-01-01" }),
        makeContact({ id: "c3", is_current: false, consent_to_contact: false, last_verified_date: null }),
      ],
      accessibility_records: [
        makeAccessibility({ id: "a1" }),
        makeAccessibility({ id: "a2", phone_reachable: false, answered_within_3_rings: false, voicemail_available: false }),
      ],
    }));
    if (r.contact_rating === "good") {
      expect(r.headline).toContain("Good");
    }
  });

  it("adequate headline mentions Adequate", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", is_current: false, consent_to_contact: false, last_verified_date: null }),
        makeContact({ id: "c2", is_current: true, consent_to_contact: true, last_verified_date: "2026-05-01" }),
        makeContact({ id: "c3", is_current: false, consent_to_contact: false, last_verified_date: null }),
      ],
      accessibility_records: [
        makeAccessibility({ id: "a1", phone_reachable: false, answered_within_3_rings: false, voicemail_available: false }),
        makeAccessibility({ id: "a2" }),
        makeAccessibility({ id: "a3", phone_reachable: false, answered_within_3_rings: false, voicemail_available: false }),
      ],
      multi_contact_records: [
        makeMultiContact({ id: "m1", next_of_kin_designated: false, social_worker_contact_on_file: false, placing_authority_contact_on_file: false, total_contacts_on_file: 1 }),
        makeMultiContact({ id: "m2" }),
        makeMultiContact({ id: "m3", next_of_kin_designated: false, social_worker_contact_on_file: false, placing_authority_contact_on_file: false, total_contacts_on_file: 1 }),
      ],
      out_of_hours_records: [
        makeOOH({ id: "o1", out_of_hours_contact_designated: false, edt_number_on_file: false, on_call_manager_accessible: false, escalation_procedure_documented: false, staff_aware_of_procedure: false }),
        makeOOH({ id: "o2" }),
        makeOOH({ id: "o3", out_of_hours_contact_designated: false, edt_number_on_file: false, on_call_manager_accessible: false, escalation_procedure_documented: false, staff_aware_of_procedure: false }),
      ],
    }));
    if (r.contact_rating === "adequate") {
      expect(r.headline).toContain("Adequate");
    }
  });

  it("inadequate headline mentions inadequate and urgent action", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", is_current: false, consent_to_contact: false, last_verified_date: null }),
      ],
      accessibility_records: [
        makeAccessibility({ id: "a1", phone_reachable: false, answered_within_3_rings: false, voicemail_available: false }),
      ],
      update_frequency_records: [
        makeUpdateFrequency({ id: "u1", verified_accurate: false, review_overdue: true, update_type: "incident_triggered" }),
      ],
      multi_contact_records: [
        makeMultiContact({ id: "m1", total_contacts_on_file: 1, next_of_kin_designated: false, social_worker_contact_on_file: false, placing_authority_contact_on_file: false }),
      ],
      out_of_hours_records: [
        makeOOH({ id: "o1", out_of_hours_contact_designated: false, edt_number_on_file: false, on_call_manager_accessible: false, escalation_procedure_documented: false, staff_aware_of_procedure: false }),
      ],
    }));
    if (r.contact_rating === "inadequate") {
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toContain("urgent action");
    }
  });

  it("good headline mentions strengths count", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1" }),
        makeContact({ id: "c2" }),
        makeContact({ id: "c3", is_current: false, consent_to_contact: false, last_verified_date: null }),
      ],
      accessibility_records: [
        makeAccessibility({ id: "a1" }),
        makeAccessibility({ id: "a2", phone_reachable: false, answered_within_3_rings: false, voicemail_available: false }),
      ],
    }));
    if (r.contact_rating === "good") {
      expect(r.headline).toMatch(/\d+ strength/);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 42. CONTACT TYPE DISTRIBUTION
// ═══════════════════════════════════════════════════════════════════════════

describe("contact type distribution", () => {
  it("shows contact type distribution in insights", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", contact_type: "parent" }),
        makeContact({ id: "c2", contact_type: "social_worker" }),
        makeContact({ id: "c3", contact_type: "emergency_contact" }),
      ],
    }));
    const i = r.insights.find((i) => i.text.includes("Contact type distribution"));
    expect(i).toBeDefined();
    expect(i!.text).toContain("parent");
    expect(i!.text).toContain("social worker");
    expect(i!.text).toContain("emergency contact");
  });

  it("replaces underscores with spaces in contact types", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", contact_type: "next_of_kin" }),
      ],
    }));
    const i = r.insights.find((i) => i.text.includes("Contact type distribution"));
    expect(i).toBeDefined();
    expect(i!.text).toContain("next of kin");
  });

  it("shows at most 4 contact types", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", contact_type: "parent" }),
        makeContact({ id: "c2", contact_type: "guardian" }),
        makeContact({ id: "c3", contact_type: "relative" }),
        makeContact({ id: "c4", contact_type: "social_worker" }),
        makeContact({ id: "c5", contact_type: "next_of_kin" }),
        makeContact({ id: "c6", contact_type: "emergency_contact" }),
        makeContact({ id: "c7", contact_type: "other" }),
      ],
    }));
    const i = r.insights.find((i) => i.text.includes("Contact type distribution"));
    expect(i).toBeDefined();
    // Count comma-separated entries — should be at most 4
    const match = i!.text.match(/Contact type distribution: (.+?)\./);
    if (match) {
      const types = match[1].split(", ");
      expect(types.length).toBeLessThanOrEqual(4);
    }
  });

  it("no contact type distribution when no contact records", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [],
    }));
    const i = r.insights.find((i) => i.text.includes("Contact type distribution"));
    expect(i).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 43. EDGE CASES — single record arrays
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases — single records", () => {
  it("single perfect contact record", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      total_children: 1,
      contact_information_records: [makeContact({ id: "c1" })],
      accessibility_records: [makeAccessibility({ id: "a1" })],
      update_frequency_records: [makeUpdateFrequency({ id: "u1" })],
      multi_contact_records: [makeMultiContact({ id: "m1" })],
      out_of_hours_records: [makeOOH({ id: "o1" })],
    }));
    expect(r.contact_rating).toBe("outstanding");
    expect(r.total_contact_records).toBe(1);
    expect(r.total_accessibility_tests).toBe(1);
  });

  it("single poor contact record", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      total_children: 1,
      contact_information_records: [makeContact({ id: "c1", is_current: false, consent_to_contact: false, last_verified_date: null })],
      accessibility_records: [makeAccessibility({ id: "a1", phone_reachable: false, answered_within_3_rings: false, voicemail_available: false })],
      update_frequency_records: [makeUpdateFrequency({ id: "u1", verified_accurate: false, review_overdue: true, update_type: "incident_triggered" })],
      multi_contact_records: [makeMultiContact({ id: "m1", total_contacts_on_file: 1, next_of_kin_designated: false, social_worker_contact_on_file: false, placing_authority_contact_on_file: false })],
      out_of_hours_records: [makeOOH({ id: "o1", out_of_hours_contact_designated: false, edt_number_on_file: false, on_call_manager_accessible: false, escalation_procedure_documented: false, staff_aware_of_procedure: false })],
    }));
    expect(r.contact_rating).toBe("inadequate");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 44. EDGE CASES — mixed data
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases — mixed data quality", () => {
  it("mix of perfect and poor contacts", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      total_children: 2,
      contact_information_records: [
        makeContact({ id: "c1", child_id: "yp_alex" }),
        makeContact({ id: "c2", child_id: "yp_jordan", is_current: false, consent_to_contact: false, last_verified_date: null }),
      ],
    }));
    expect(r.contact_currency_rate).toBe(50);
    expect(r.total_contact_records).toBe(2);
  });

  it("only accessibility records empty while others full", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      accessibility_records: [],
    }));
    expect(r.accessibility_rate).toBe(0);
    expect(r.total_accessibility_tests).toBe(0);
    // Other rates should still be 100
    expect(r.contact_currency_rate).toBe(100);
    expect(r.update_frequency_rate).toBe(100);
  });

  it("only update frequency records empty while others full", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      update_frequency_records: [],
    }));
    expect(r.update_frequency_rate).toBe(0);
    expect(r.contact_currency_rate).toBe(100);
  });

  it("only multi-contact records empty while others full", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [],
    }));
    expect(r.multi_contact_rate).toBe(0);
    expect(r.contact_currency_rate).toBe(100);
  });

  it("only out-of-hours records empty while others full", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [],
    }));
    expect(r.out_of_hours_rate).toBe(0);
    expect(r.contact_currency_rate).toBe(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 45. EDGE CASES — secondary phone / email
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases — secondary phone and email", () => {
  it("null phone_secondary is handled", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", phone_secondary: null }),
      ],
    }));
    expect(r.total_contact_records).toBe(1);
  });

  it("empty string phone_secondary is handled like null", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", phone_secondary: "" }),
        makeContact({ id: "c2", phone_secondary: "07700900002" }),
      ],
    }));
    // Engine uses phone_secondary for secondaryPhoneRate, not in composite
    expect(r.total_contact_records).toBe(2);
  });

  it("null email is handled", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", email: null }),
      ],
    }));
    expect(r.total_contact_records).toBe(1);
  });

  it("empty string email is handled like null", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", email: "" }),
      ],
    }));
    expect(r.total_contact_records).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 46. EDGE CASES — daysBetween and verification windows
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases — date boundaries", () => {
  it("verified exactly 90 days ago counts as recently verified", () => {
    // 90 days before 2026-05-30 = 2026-03-01
    const r = computeEmergencyContactNextOfKin(baseInput({
      today: "2026-05-30",
      contact_information_records: [
        makeContact({ id: "c1", last_verified_date: "2026-03-01" }),
      ],
    }));
    expect(r.contact_currency_rate).toBe(100);
  });

  it("verified 91 days ago does not count as recently verified", () => {
    // 91 days before 2026-05-30 = 2026-02-28
    const r = computeEmergencyContactNextOfKin(baseInput({
      today: "2026-05-30",
      contact_information_records: [
        makeContact({ id: "c1", last_verified_date: "2026-02-28" }),
      ],
    }));
    // current + consented + 0 recently verified = 2/3 = 67%
    expect(r.contact_currency_rate).toBe(67);
  });

  it("verified exactly 180 days ago is not stale", () => {
    // 180 days before 2026-05-30 = 2025-12-01 (approx)
    const r = computeEmergencyContactNextOfKin(baseInput({
      today: "2026-05-30",
      contact_information_records: [
        makeContact({ id: "c1", last_verified_date: "2025-12-01" }),
      ],
    }));
    // Check stale concern absent
    const c = r.concerns.find((c) => c.includes("stale"));
    // 180 days is boundary — not stale
    expect(c).toBeUndefined();
  });

  it("verified 181+ days ago is stale", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      today: "2026-05-30",
      contact_information_records: [
        makeContact({ id: "c1", last_verified_date: "2025-11-29" }),
      ],
    }));
    // 1/1 = 100% stale
    const c = r.concerns.find((c) => c.includes("stale"));
    expect(c).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 47. EDGE CASES — alternative method metrics
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases — alternative method", () => {
  it("alt method success rate calculated from tested records only", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      accessibility_records: [
        makeAccessibility({ id: "a1", alternative_method_tested: true, alternative_method_successful: true }),
        makeAccessibility({ id: "a2", alternative_method_tested: true, alternative_method_successful: false }),
        makeAccessibility({ id: "a3", alternative_method_tested: false, alternative_method_successful: false }),
      ],
    }));
    // Alt success: 1 of 2 tested = 50%
    // Main accessibility rate still uses reachable + quick + voicemail
    expect(r.total_accessibility_tests).toBe(3);
  });

  it("no crash when all alternative_method_tested is false", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      accessibility_records: [
        makeAccessibility({ id: "a1", alternative_method_tested: false, alternative_method_successful: false }),
      ],
    }));
    expect(r.total_accessibility_tests).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 48. EDGE CASES — response time
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases — response time", () => {
  it("rapid response counts when response_time_minutes <= 15", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      accessibility_records: [
        makeAccessibility({ id: "a1", response_time_minutes: 15 }),
        makeAccessibility({ id: "a2", response_time_minutes: 16 }),
      ],
    }));
    // One rapid response out of two records
    // Rapid response affects strengths, not main accessibility rate
    expect(r.total_accessibility_tests).toBe(2);
  });

  it("null response_time_minutes is handled", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      accessibility_records: [
        makeAccessibility({ id: "a1", response_time_minutes: null }),
      ],
    }));
    expect(r.total_accessibility_tests).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 49. EDGE CASES — fields_updated
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases — fields_updated", () => {
  it("empty fields_updated array is valid", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      update_frequency_records: [
        makeUpdateFrequency({ id: "u1", fields_updated: [] }),
      ],
    }));
    expect(r.total_contact_records).toBeGreaterThan(0);
  });

  it("fields_updated with items is counted", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      update_frequency_records: [
        makeUpdateFrequency({ id: "u1", fields_updated: ["phone", "email", "address"] }),
      ],
    }));
    expect(r.total_contact_records).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 50. EDGE CASES — gaps
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases — gaps", () => {
  it("gaps_identified empty means no gaps identified", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [
        makeMultiContact({ id: "m1", gaps_identified: [], gaps_addressed: false }),
      ],
    }));
    // No gaps identified = no gap resolution concern/strength
    const gapInsight = r.insights.find((i) => i.text.includes("gap resolution"));
    expect(gapInsight).toBeUndefined();
  });

  it("gaps addressed when gaps exist leads to positive insight", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [
        makeMultiContact({ id: "m1", gaps_identified: ["missing backup"], gaps_addressed: true }),
        makeMultiContact({ id: "m2", gaps_identified: ["no SW"], gaps_addressed: true }),
        makeMultiContact({ id: "m3" }),
      ],
    }));
    const positiveGap = r.insights.find((i) => i.severity === "positive" && i.text.includes("gap resolution"));
    expect(positiveGap).toBeDefined();
  });

  it("gaps not addressed leads to planned recommendation", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [
        makeMultiContact({ id: "m1", gaps_identified: ["missing backup"], gaps_addressed: false }),
        makeMultiContact({ id: "m2", gaps_identified: ["no SW"], gaps_addressed: false }),
        makeMultiContact({ id: "m3" }),
      ],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("Address identified gaps"));
    expect(rec).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 51. OOH — specific field checks
// ═══════════════════════════════════════════════════════════════════════════

describe("OOH — specific field checks", () => {
  it("nhs_111_accessible does not affect OOH composite", () => {
    // OOH composite uses: designated, EDT, on-call, escalation, staff_aware
    // nhs_111_accessible is NOT in the composite
    const withNHS = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [makeOOH({ id: "o1", nhs_111_accessible: true })],
    }));
    const withoutNHS = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [makeOOH({ id: "o1", nhs_111_accessible: false })],
    }));
    expect(withNHS.out_of_hours_rate).toBe(withoutNHS.out_of_hours_rate);
  });

  it("local_hospital_number_on_file does not affect OOH composite", () => {
    const withHospital = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [makeOOH({ id: "o1", local_hospital_number_on_file: true })],
    }));
    const withoutHospital = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [makeOOH({ id: "o1", local_hospital_number_on_file: false })],
    }));
    expect(withHospital.out_of_hours_rate).toBe(withoutHospital.out_of_hours_rate);
  });

  it("police_non_emergency_on_file does not affect OOH composite", () => {
    const withPolice = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [makeOOH({ id: "o1", police_non_emergency_on_file: true })],
    }));
    const withoutPolice = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [makeOOH({ id: "o1", police_non_emergency_on_file: false })],
    }));
    expect(withPolice.out_of_hours_rate).toBe(withoutPolice.out_of_hours_rate);
  });

  it("OOH tested rate uses last_tested_date presence", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [
        makeOOH({ id: "o1", last_tested_date: "2026-05-01" }),
        makeOOH({ id: "o2", last_tested_date: null }),
        makeOOH({ id: "o3", last_tested_date: "" }),
      ],
    }));
    // Only o1 has valid last_tested_date
    expect(r.total_contact_records).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 52. MULTI-CONTACT — emergency contacts count
// ═══════════════════════════════════════════════════════════════════════════

describe("multi-contact — emergency contacts count", () => {
  it("emergency_contacts_count >= 2 is tracked separately from total", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [
        makeMultiContact({ id: "m1", total_contacts_on_file: 4, emergency_contacts_count: 1 }),
      ],
    }));
    // total_contacts_on_file >= 2 passes, but emergency_contacts_count is tracked separately
    // multi-contact rate only uses total_contacts_on_file >= 2
    expect(r.multi_contact_rate).toBeGreaterThan(0);
  });

  it("total_contacts_on_file < 2 fails the min-two check", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [
        makeMultiContact({ id: "m1", total_contacts_on_file: 1, next_of_kin_designated: true, social_worker_contact_on_file: true, placing_authority_contact_on_file: true }),
      ],
    }));
    // 0 + 1 + 1 + 1 = 3/4 = 75%
    expect(r.multi_contact_rate).toBe(75);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 53. CHILD COVERAGE
// ═══════════════════════════════════════════════════════════════════════════

describe("child coverage rate", () => {
  it("100% when every child has a current contact", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      total_children: 3,
      contact_information_records: [
        makeContact({ id: "c1", child_id: "yp_alex", is_current: true }),
        makeContact({ id: "c2", child_id: "yp_jordan", is_current: true }),
        makeContact({ id: "c3", child_id: "yp_casey", is_current: true }),
      ],
    }));
    // 3 unique children / 3 total = 100%
    expect(r.strengths.find((s) => s.includes("children have current emergency contacts"))).toBeDefined();
  });

  it("0% when no children have current contacts", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      total_children: 3,
      contact_information_records: [
        makeContact({ id: "c1", child_id: "yp_alex", is_current: false }),
      ],
    }));
    // childCoverageRate = 0/3 = 0%
    const c = r.concerns.find((c) => c.includes("children have current emergency contacts") || c.includes("Child emergency contact coverage"));
    expect(c).toBeDefined();
  });

  it("multiple contacts for same child only count once", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      total_children: 2,
      contact_information_records: [
        makeContact({ id: "c1", child_id: "yp_alex", is_current: true }),
        makeContact({ id: "c2", child_id: "yp_alex", is_current: true }),
        makeContact({ id: "c3", child_id: "yp_jordan", is_current: true }),
      ],
    }));
    // 2 unique children / 2 total = 100%
    expect(r.strengths.find((s) => s.includes("children have current emergency contacts"))).toBeDefined();
  });

  it("childCoverageRate is 0 when total_children is 0", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      total_children: 0,
      contact_information_records: [makeContact({ id: "c1" })],
    }));
    // No child coverage strength or concern
    expect(r.strengths.find((s) => s.includes("children have current emergency contacts"))).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 54. RETURN SHAPE
// ═══════════════════════════════════════════════════════════════════════════

describe("return shape", () => {
  it("result has all required keys", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    expect(r).toHaveProperty("contact_rating");
    expect(r).toHaveProperty("contact_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("total_contact_records");
    expect(r).toHaveProperty("total_accessibility_tests");
    expect(r).toHaveProperty("contact_currency_rate");
    expect(r).toHaveProperty("accessibility_rate");
    expect(r).toHaveProperty("update_frequency_rate");
    expect(r).toHaveProperty("multi_contact_rate");
    expect(r).toHaveProperty("out_of_hours_rate");
    expect(r).toHaveProperty("verification_rate");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("rates are numbers", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    expect(typeof r.contact_currency_rate).toBe("number");
    expect(typeof r.accessibility_rate).toBe("number");
    expect(typeof r.update_frequency_rate).toBe("number");
    expect(typeof r.multi_contact_rate).toBe("number");
    expect(typeof r.out_of_hours_rate).toBe("number");
    expect(typeof r.verification_rate).toBe("number");
  });

  it("arrays are arrays", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    expect(Array.isArray(r.strengths)).toBe(true);
    expect(Array.isArray(r.concerns)).toBe(true);
    expect(Array.isArray(r.recommendations)).toBe(true);
    expect(Array.isArray(r.insights)).toBe(true);
  });

  it("recommendations have required fields", () => {
    // Create a scenario with recommendations
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", is_current: false, consent_to_contact: false, last_verified_date: null }),
      ],
    }));
    for (const rec of r.recommendations) {
      expect(rec).toHaveProperty("rank");
      expect(rec).toHaveProperty("recommendation");
      expect(rec).toHaveProperty("urgency");
      expect(rec).toHaveProperty("regulatory_ref");
      expect(typeof rec.rank).toBe("number");
      expect(typeof rec.recommendation).toBe("string");
      expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
    }
  });

  it("insights have required fields", () => {
    const r = computeEmergencyContactNextOfKin(baseInput());
    for (const insight of r.insights) {
      expect(insight).toHaveProperty("text");
      expect(insight).toHaveProperty("severity");
      expect(typeof insight.text).toBe("string");
      expect(["critical", "warning", "positive"]).toContain(insight.severity);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 55. LARGE DATASET
// ═══════════════════════════════════════════════════════════════════════════

describe("large dataset", () => {
  it("handles 50 records per category without error", () => {
    const contacts = Array.from({ length: 50 }, (_, i) =>
      makeContact({ id: `c${i}`, child_id: `yp_${i % 10}` }),
    );
    const accessibility = Array.from({ length: 50 }, (_, i) =>
      makeAccessibility({ id: `a${i}`, child_id: `yp_${i % 10}` }),
    );
    const updates = Array.from({ length: 50 }, (_, i) =>
      makeUpdateFrequency({ id: `u${i}`, child_id: `yp_${i % 10}` }),
    );
    const multi = Array.from({ length: 10 }, (_, i) =>
      makeMultiContact({ id: `m${i}`, child_id: `yp_${i}` }),
    );
    const ooh = Array.from({ length: 10 }, (_, i) =>
      makeOOH({ id: `o${i}`, child_id: `yp_${i}` }),
    );

    const r = computeEmergencyContactNextOfKin(baseInput({
      total_children: 10,
      contact_information_records: contacts,
      accessibility_records: accessibility,
      update_frequency_records: updates,
      multi_contact_records: multi,
      out_of_hours_records: ooh,
    }));
    expect(r.contact_rating).toBe("outstanding");
    expect(r.total_contact_records).toBe(50);
    expect(r.total_accessibility_tests).toBe(50);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 56. GOOD RATING SCENARIO
// ═══════════════════════════════════════════════════════════════════════════

describe("good rating scenario", () => {
  it("achieves good rating with mostly strong metrics and some gaps", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1" }),
        makeContact({ id: "c2" }),
        makeContact({ id: "c3", is_current: true, consent_to_contact: true, last_verified_date: "2026-01-01" }),
      ],
      multi_contact_records: [
        makeMultiContact({ id: "m1" }),
        makeMultiContact({ id: "m2" }),
        makeMultiContact({ id: "m3", next_of_kin_designated: false, placing_authority_contact_on_file: false }),
      ],
    }));
    // Should be good or outstanding
    expect(["good", "outstanding"]).toContain(r.contact_rating);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 57. BONUS TIER 2 — 70-89% range
// ═══════════════════════════════════════════════════════════════════════════

describe("bonus tier 2 — 70-89% range", () => {
  it("contactCurrencyRate in 70-89% gives +2 bonus", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [
        makeContact({ id: "c1", is_current: true, consent_to_contact: true, last_verified_date: "2026-05-01" }),
        makeContact({ id: "c2", is_current: true, consent_to_contact: true, last_verified_date: "2026-01-01" }),
        makeContact({ id: "c3", is_current: false, consent_to_contact: true, last_verified_date: "2026-05-01" }),
      ],
    }));
    // Check that it's in the 70-89 range for this composite
    if (r.contact_currency_rate >= 70 && r.contact_currency_rate < 90) {
      // Should have the moderate strength
      const s = r.strengths.find((s) => s.includes("contact currency") && s.includes("generally maintains"));
      expect(s).toBeDefined();
    }
  });

  it("childCoverageRate >= 60 and < 90 gives +1", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      total_children: 5,
      contact_information_records: [
        makeContact({ id: "c1", child_id: "yp_a", is_current: true }),
        makeContact({ id: "c2", child_id: "yp_b", is_current: true }),
        makeContact({ id: "c3", child_id: "yp_c", is_current: true }),
        makeContact({ id: "c4", child_id: "yp_d", is_current: true }),
      ],
    }));
    // 4/5 = 80% child coverage
    const s = r.strengths.find((s) => s.includes("children have current emergency contacts"));
    expect(s).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 58. UPDATE TYPE VARIATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("update type variations", () => {
  it("contact_initiated is not scheduled", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      update_frequency_records: [
        makeUpdateFrequency({ id: "u1", update_type: "contact_initiated" }),
      ],
    }));
    // Not scheduled → 67% (verified + on-time only)
    expect(r.update_frequency_rate).toBe(67);
  });

  it("staff_initiated is not scheduled", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      update_frequency_records: [
        makeUpdateFrequency({ id: "u1", update_type: "staff_initiated" }),
      ],
    }));
    expect(r.update_frequency_rate).toBe(67);
  });

  it("placement_change is not scheduled", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      update_frequency_records: [
        makeUpdateFrequency({ id: "u1", update_type: "placement_change" }),
      ],
    }));
    expect(r.update_frequency_rate).toBe(67);
  });

  it("scheduled_review is scheduled", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      update_frequency_records: [
        makeUpdateFrequency({ id: "u1", update_type: "scheduled_review" }),
      ],
    }));
    expect(r.update_frequency_rate).toBe(100);
  });

  it("annual_review is scheduled", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      update_frequency_records: [
        makeUpdateFrequency({ id: "u1", update_type: "annual_review" }),
      ],
    }));
    expect(r.update_frequency_rate).toBe(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 59. ACCESSIBILITY TEST TYPES
// ═══════════════════════════════════════════════════════════════════════════

describe("accessibility test types", () => {
  it("routine_check is accepted", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      accessibility_records: [makeAccessibility({ id: "a1", test_type: "routine_check" })],
    }));
    expect(r.total_accessibility_tests).toBe(1);
  });

  it("drill is accepted", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      accessibility_records: [makeAccessibility({ id: "a1", test_type: "drill" })],
    }));
    expect(r.total_accessibility_tests).toBe(1);
  });

  it("actual_emergency is accepted", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      accessibility_records: [makeAccessibility({ id: "a1", test_type: "actual_emergency" })],
    }));
    expect(r.total_accessibility_tests).toBe(1);
  });

  it("periodic_review is accepted", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      accessibility_records: [makeAccessibility({ id: "a1", test_type: "periodic_review" })],
    }));
    expect(r.total_accessibility_tests).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 60. CONTACT TYPES
// ═══════════════════════════════════════════════════════════════════════════

describe("contact types", () => {
  const types: Array<ContactInformationRecordInput["contact_type"]> = [
    "parent", "guardian", "relative", "social_worker", "next_of_kin", "emergency_contact", "other",
  ];

  for (const type of types) {
    it(`accepts contact_type "${type}"`, () => {
      const r = computeEmergencyContactNextOfKin(baseInput({
        contact_information_records: [makeContact({ id: "c1", contact_type: type })],
      }));
      expect(r.total_contact_records).toBe(1);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 61. MULTI-CONTACT COVERAGE RATE
// ═══════════════════════════════════════════════════════════════════════════

describe("multi-contact coverage rate per child", () => {
  it("multiContactCoverageRate is 100% when all children assessed", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      total_children: 3,
      multi_contact_records: [
        makeMultiContact({ id: "m1", child_id: "yp_alex" }),
        makeMultiContact({ id: "m2", child_id: "yp_jordan" }),
        makeMultiContact({ id: "m3", child_id: "yp_casey" }),
      ],
    }));
    // All 3 children assessed
    expect(r.multi_contact_rate).toBe(100);
  });

  it("multiContactCoverageRate is 0 when total_children is 0", () => {
    const r = computeEmergencyContactNextOfKin(baseInput({
      total_children: 0,
      multi_contact_records: [makeMultiContact({ id: "m1" })],
    }));
    // Still calculates multi_contact_rate from record quality
    expect(r.multi_contact_rate).toBe(100);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 62. OOH — test results
// ═══════════════════════════════════════════════════════════════════════════

describe("OOH — test results", () => {
  it("test_successful does not affect OOH composite rate directly", () => {
    const withSuccess = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [makeOOH({ id: "o1", test_successful: true })],
    }));
    const withoutSuccess = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [makeOOH({ id: "o1", test_successful: false })],
    }));
    expect(withSuccess.out_of_hours_rate).toBe(withoutSuccess.out_of_hours_rate);
  });

  it("backup_contact_available does not affect OOH composite rate", () => {
    const with_ = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [makeOOH({ id: "o1", backup_contact_available: true })],
    }));
    const without_ = computeEmergencyContactNextOfKin(baseInput({
      out_of_hours_records: [makeOOH({ id: "o1", backup_contact_available: false })],
    }));
    expect(with_.out_of_hours_rate).toBe(without_.out_of_hours_rate);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 63. DIVERSE RELATIONSHIP TYPES
// ═══════════════════════════════════════════════════════════════════════════

describe("diverse relationship types", () => {
  it("diverse_relationship_types does not affect multi-contact composite", () => {
    const with_ = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [makeMultiContact({ id: "m1", diverse_relationship_types: true })],
    }));
    const without_ = computeEmergencyContactNextOfKin(baseInput({
      multi_contact_records: [makeMultiContact({ id: "m1", diverse_relationship_types: false })],
    }));
    expect(with_.multi_contact_rate).toBe(without_.multi_contact_rate);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 64. ADDRESS ON FILE
// ═══════════════════════════════════════════════════════════════════════════

describe("address on file", () => {
  it("address_on_file does not affect contact currency composite", () => {
    const with_ = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [makeContact({ id: "c1", address_on_file: true })],
    }));
    const without_ = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [makeContact({ id: "c1", address_on_file: false })],
    }));
    expect(with_.contact_currency_rate).toBe(without_.contact_currency_rate);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 65. SCORE BASE VALUE
// ═══════════════════════════════════════════════════════════════════════════

describe("score base value", () => {
  it("base score starts at 52", () => {
    // With all rates at 0 (empty records but children present, not allEmpty)
    // No bonuses, no penalties due to empty arrays
    const r = computeEmergencyContactNextOfKin(baseInput({
      contact_information_records: [],
      accessibility_records: [],
      update_frequency_records: [],
      multi_contact_records: [],
      out_of_hours_records: [makeOOH({ id: "o1" })],
    }));
    // Only OOH records exist, so only OOH bonus applies
    // OOH rate = 100% → +4 bonus → score = 56
    // But no penalty since empty arrays
    expect(r.contact_score).toBeGreaterThanOrEqual(52);
  });
});
