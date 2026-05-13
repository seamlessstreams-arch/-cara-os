// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF DISCIPLINARY & GRIEVANCES SERVICE TESTS
// Pure-function tests for disciplinary metrics, alert identification, and
// constant validation for CHR 2015 Reg 33/34/40 compliance.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  DISCIPLINARY_CATEGORIES,
  OUTCOME_TYPES,
  DISCIPLINARY_STATUS,
  GRIEVANCE_TYPES,
  GRIEVANCE_STAGES,
  GRIEVANCE_STATUS,
  computeDisciplinaryMetrics,
  identifyDisciplinaryAlerts,
} from "../staff-disciplinary-service";

// ── Helpers ────────────────────────────────────────────────────────────────

const disciplinaryDefaults = {
  id: "disc-1",
  home_id: "home-1",
  staff_id: "staff-1",
  staff_name: "Alice Walker",
  category: "conduct",
  description: "Test disciplinary",
  date_of_incident: "2026-05-01",
  reported_by: "Manager",
  reported_date: "2026-05-01",
  investigation_required: false,
  investigating_officer: null,
  investigation_started_date: null,
  investigation_completed_date: null,
  hearing_date: null,
  hearing_outcome: null,
  outcome_type: null,
  outcome_date: null,
  outcome_expiry_date: null,
  appeal_submitted: false,
  appeal_date: null,
  appeal_outcome: null,
  lado_referral_required: false,
  lado_referral_date: null,
  dbs_referral_required: false,
  dbs_referral_date: null,
  ofsted_notification_required: false,
  ofsted_notification_date: null,
  status: "reported",
  notes: null,
  supporting_documents: [],
  created_at: "2026-05-01T10:00:00Z",
  updated_at: "2026-05-01T10:00:00Z",
};

const grievanceDefaults = {
  id: "griev-1",
  home_id: "home-1",
  staff_id: "staff-2",
  staff_name: "Bob Clarke",
  grievance_type: "working_conditions",
  description: "Test grievance",
  date_raised: "2026-05-01",
  informal_resolution_attempted: false,
  informal_resolution_date: null,
  informal_outcome: null,
  formal_stage: null,
  hearing_date: null,
  hearing_officer: null,
  outcome: null,
  outcome_date: null,
  appeal_submitted: false,
  appeal_date: null,
  appeal_outcome: null,
  status: "raised",
  created_at: "2026-05-01T10:00:00Z",
  updated_at: "2026-05-01T10:00:00Z",
};

/** Build a minimal disciplinary record with sensible defaults. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeDisciplinary(overrides: Record<string, unknown> = {}): any {
  return { ...disciplinaryDefaults, ...overrides };
}

/** Build a minimal grievance record with sensible defaults. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeGrievance(overrides: Record<string, unknown> = {}): any {
  return { ...grievanceDefaults, ...overrides };
}

// ── DISCIPLINARY_CATEGORIES ──────────────────────────────────────────────

describe("DISCIPLINARY_CATEGORIES", () => {
  it("has exactly 5 entries", () => {
    expect(DISCIPLINARY_CATEGORIES).toHaveLength(5);
  });

  it("each entry has value and label properties", () => {
    for (const dc of DISCIPLINARY_CATEGORIES) {
      expect(typeof dc.value).toBe("string");
      expect(typeof dc.label).toBe("string");
    }
  });

  it("has unique values", () => {
    const values = DISCIPLINARY_CATEGORIES.map((c) => c.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains expected categories", () => {
    const values = DISCIPLINARY_CATEGORIES.map((c) => c.value);
    expect(values).toContain("conduct");
    expect(values).toContain("capability");
    expect(values).toContain("absence");
    expect(values).toContain("gross_misconduct");
    expect(values).toContain("safeguarding_concern");
  });

  it("has correct label for conduct", () => {
    const found = DISCIPLINARY_CATEGORIES.find((c) => c.value === "conduct");
    expect(found?.label).toBe("Conduct");
  });

  it("has correct label for gross_misconduct", () => {
    const found = DISCIPLINARY_CATEGORIES.find((c) => c.value === "gross_misconduct");
    expect(found?.label).toBe("Gross Misconduct");
  });

  it("has correct label for safeguarding_concern", () => {
    const found = DISCIPLINARY_CATEGORIES.find((c) => c.value === "safeguarding_concern");
    expect(found?.label).toBe("Safeguarding Concern");
  });
});

// ── OUTCOME_TYPES ────────────────────────────────────────────────────────

describe("OUTCOME_TYPES", () => {
  it("has exactly 8 entries", () => {
    expect(OUTCOME_TYPES).toHaveLength(8);
  });

  it("each entry has value and label properties", () => {
    for (const ot of OUTCOME_TYPES) {
      expect(typeof ot.value).toBe("string");
      expect(typeof ot.label).toBe("string");
    }
  });

  it("has unique values", () => {
    const values = OUTCOME_TYPES.map((o) => o.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains expected outcome types", () => {
    const values = OUTCOME_TYPES.map((o) => o.value);
    expect(values).toContain("no_action");
    expect(values).toContain("verbal_warning");
    expect(values).toContain("first_written_warning");
    expect(values).toContain("final_written_warning");
    expect(values).toContain("dismissal");
    expect(values).toContain("summary_dismissal");
    expect(values).toContain("demotion");
    expect(values).toContain("suspension");
  });

  it("has correct label for summary_dismissal", () => {
    const found = OUTCOME_TYPES.find((o) => o.value === "summary_dismissal");
    expect(found?.label).toBe("Summary Dismissal");
  });

  it("has correct label for first_written_warning", () => {
    const found = OUTCOME_TYPES.find((o) => o.value === "first_written_warning");
    expect(found?.label).toBe("First Written Warning");
  });
});

// ── DISCIPLINARY_STATUS ──────────────────────────────────────────────────

describe("DISCIPLINARY_STATUS", () => {
  it("has exactly 6 entries", () => {
    expect(DISCIPLINARY_STATUS).toHaveLength(6);
  });

  it("each entry has value and label properties", () => {
    for (const ds of DISCIPLINARY_STATUS) {
      expect(typeof ds.value).toBe("string");
      expect(typeof ds.label).toBe("string");
    }
  });

  it("has unique values", () => {
    const values = DISCIPLINARY_STATUS.map((s) => s.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains expected statuses", () => {
    const values = DISCIPLINARY_STATUS.map((s) => s.value);
    expect(values).toContain("reported");
    expect(values).toContain("under_investigation");
    expect(values).toContain("hearing_scheduled");
    expect(values).toContain("outcome_issued");
    expect(values).toContain("appeal_in_progress");
    expect(values).toContain("closed");
  });

  it("has correct label for under_investigation", () => {
    const found = DISCIPLINARY_STATUS.find((s) => s.value === "under_investigation");
    expect(found?.label).toBe("Under Investigation");
  });

  it("has correct label for appeal_in_progress", () => {
    const found = DISCIPLINARY_STATUS.find((s) => s.value === "appeal_in_progress");
    expect(found?.label).toBe("Appeal in Progress");
  });
});

// ── GRIEVANCE_TYPES ─────────────────────────────────────────────────────

describe("GRIEVANCE_TYPES", () => {
  it("has exactly 7 entries", () => {
    expect(GRIEVANCE_TYPES).toHaveLength(7);
  });

  it("each entry has value and label properties", () => {
    for (const gt of GRIEVANCE_TYPES) {
      expect(typeof gt.value).toBe("string");
      expect(typeof gt.label).toBe("string");
    }
  });

  it("has unique values", () => {
    const values = GRIEVANCE_TYPES.map((g) => g.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains expected grievance types", () => {
    const values = GRIEVANCE_TYPES.map((g) => g.value);
    expect(values).toContain("working_conditions");
    expect(values).toContain("bullying_harassment");
    expect(values).toContain("pay_conditions");
    expect(values).toContain("management");
    expect(values).toContain("health_safety");
    expect(values).toContain("discrimination");
    expect(values).toContain("other");
  });

  it("has correct label for bullying_harassment", () => {
    const found = GRIEVANCE_TYPES.find((g) => g.value === "bullying_harassment");
    expect(found?.label).toBe("Bullying & Harassment");
  });

  it("has correct label for health_safety", () => {
    const found = GRIEVANCE_TYPES.find((g) => g.value === "health_safety");
    expect(found?.label).toBe("Health & Safety");
  });
});

// ── GRIEVANCE_STAGES ────────────────────────────────────────────────────

describe("GRIEVANCE_STAGES", () => {
  it("has exactly 5 entries", () => {
    expect(GRIEVANCE_STAGES).toHaveLength(5);
  });

  it("each entry has value and label properties", () => {
    for (const gs of GRIEVANCE_STAGES) {
      expect(typeof gs.value).toBe("string");
      expect(typeof gs.label).toBe("string");
    }
  });

  it("has unique values", () => {
    const values = GRIEVANCE_STAGES.map((s) => s.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains expected stages", () => {
    const values = GRIEVANCE_STAGES.map((s) => s.value);
    expect(values).toContain("stage_1");
    expect(values).toContain("stage_2");
    expect(values).toContain("appeal");
    expect(values).toContain("resolved");
    expect(values).toContain("withdrawn");
  });

  it("has correct label for stage_1", () => {
    const found = GRIEVANCE_STAGES.find((s) => s.value === "stage_1");
    expect(found?.label).toBe("Stage 1");
  });

  it("has correct label for withdrawn", () => {
    const found = GRIEVANCE_STAGES.find((s) => s.value === "withdrawn");
    expect(found?.label).toBe("Withdrawn");
  });
});

// ── GRIEVANCE_STATUS ────────────────────────────────────────────────────

describe("GRIEVANCE_STATUS", () => {
  it("has exactly 7 entries", () => {
    expect(GRIEVANCE_STATUS).toHaveLength(7);
  });

  it("each entry has value and label properties", () => {
    for (const gs of GRIEVANCE_STATUS) {
      expect(typeof gs.value).toBe("string");
      expect(typeof gs.label).toBe("string");
    }
  });

  it("has unique values", () => {
    const values = GRIEVANCE_STATUS.map((s) => s.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains expected statuses", () => {
    const values = GRIEVANCE_STATUS.map((s) => s.value);
    expect(values).toContain("raised");
    expect(values).toContain("informal_resolution");
    expect(values).toContain("formal_stage_1");
    expect(values).toContain("formal_stage_2");
    expect(values).toContain("appeal");
    expect(values).toContain("resolved");
    expect(values).toContain("withdrawn");
  });

  it("has correct label for informal_resolution", () => {
    const found = GRIEVANCE_STATUS.find((s) => s.value === "informal_resolution");
    expect(found?.label).toBe("Informal Resolution");
  });

  it("has correct label for formal_stage_2", () => {
    const found = GRIEVANCE_STATUS.find((s) => s.value === "formal_stage_2");
    expect(found?.label).toBe("Formal Stage 2");
  });
});

// ── computeDisciplinaryMetrics ──────────────────────────────────────────

describe("computeDisciplinaryMetrics", () => {
  it("returns zeroed metrics for empty arrays", () => {
    const result = computeDisciplinaryMetrics([], []);
    expect(result.active_disciplinary_cases).toBe(0);
    expect(result.active_grievance_cases).toBe(0);
    expect(result.total_disciplinary).toBe(0);
    expect(result.total_grievances).toBe(0);
    expect(result.by_category).toEqual({});
    expect(result.by_outcome_type).toEqual({});
    expect(result.avg_investigation_days).toBe(0);
    expect(result.lado_referral_rate).toBe(0);
    expect(result.dbs_referral_rate).toBe(0);
    expect(result.ofsted_notification_rate).toBe(0);
    expect(result.by_grievance_type).toEqual({});
    expect(result.informal_resolution_rate).toBe(0);
  });

  it("counts total disciplinary records", () => {
    const result = computeDisciplinaryMetrics(
      [makeDisciplinary(), makeDisciplinary({ id: "disc-2" }), makeDisciplinary({ id: "disc-3" })],
      [],
    );
    expect(result.total_disciplinary).toBe(3);
  });

  it("counts total grievance records", () => {
    const result = computeDisciplinaryMetrics(
      [],
      [makeGrievance(), makeGrievance({ id: "griev-2" })],
    );
    expect(result.total_grievances).toBe(2);
  });

  it("counts active disciplinary cases (all non-closed statuses)", () => {
    const result = computeDisciplinaryMetrics(
      [
        makeDisciplinary({ id: "d1", status: "reported" }),
        makeDisciplinary({ id: "d2", status: "under_investigation" }),
        makeDisciplinary({ id: "d3", status: "hearing_scheduled" }),
        makeDisciplinary({ id: "d4", status: "outcome_issued" }),
        makeDisciplinary({ id: "d5", status: "appeal_in_progress" }),
        makeDisciplinary({ id: "d6", status: "closed" }),
      ],
      [],
    );
    expect(result.active_disciplinary_cases).toBe(5);
  });

  it("does not count closed disciplinary as active", () => {
    const result = computeDisciplinaryMetrics(
      [makeDisciplinary({ status: "closed" })],
      [],
    );
    expect(result.active_disciplinary_cases).toBe(0);
  });

  it("counts active grievance cases (all non-resolved/withdrawn statuses)", () => {
    const result = computeDisciplinaryMetrics(
      [],
      [
        makeGrievance({ id: "g1", status: "raised" }),
        makeGrievance({ id: "g2", status: "informal_resolution" }),
        makeGrievance({ id: "g3", status: "formal_stage_1" }),
        makeGrievance({ id: "g4", status: "formal_stage_2" }),
        makeGrievance({ id: "g5", status: "appeal" }),
        makeGrievance({ id: "g6", status: "resolved" }),
        makeGrievance({ id: "g7", status: "withdrawn" }),
      ],
    );
    expect(result.active_grievance_cases).toBe(5);
  });

  it("does not count resolved or withdrawn grievances as active", () => {
    const result = computeDisciplinaryMetrics(
      [],
      [
        makeGrievance({ id: "g1", status: "resolved" }),
        makeGrievance({ id: "g2", status: "withdrawn" }),
      ],
    );
    expect(result.active_grievance_cases).toBe(0);
  });

  it("groups disciplinary records by category", () => {
    const result = computeDisciplinaryMetrics(
      [
        makeDisciplinary({ id: "d1", category: "conduct" }),
        makeDisciplinary({ id: "d2", category: "conduct" }),
        makeDisciplinary({ id: "d3", category: "absence" }),
        makeDisciplinary({ id: "d4", category: "gross_misconduct" }),
      ],
      [],
    );
    expect(result.by_category).toEqual({
      conduct: 2,
      absence: 1,
      gross_misconduct: 1,
    });
  });

  it("groups records by outcome type (only when outcome_type is set)", () => {
    const result = computeDisciplinaryMetrics(
      [
        makeDisciplinary({ id: "d1", outcome_type: "verbal_warning" }),
        makeDisciplinary({ id: "d2", outcome_type: "verbal_warning" }),
        makeDisciplinary({ id: "d3", outcome_type: "dismissal" }),
        makeDisciplinary({ id: "d4", outcome_type: null }),
      ],
      [],
    );
    expect(result.by_outcome_type).toEqual({
      verbal_warning: 2,
      dismissal: 1,
    });
  });

  it("does not include null outcome_type in by_outcome_type", () => {
    const result = computeDisciplinaryMetrics(
      [makeDisciplinary({ outcome_type: null })],
      [],
    );
    expect(result.by_outcome_type).toEqual({});
  });

  it("computes average investigation days for completed investigations", () => {
    const result = computeDisciplinaryMetrics(
      [
        makeDisciplinary({
          id: "d1",
          investigation_started_date: "2026-05-01T00:00:00Z",
          investigation_completed_date: "2026-05-11T00:00:00Z",
        }),
        makeDisciplinary({
          id: "d2",
          investigation_started_date: "2026-05-01T00:00:00Z",
          investigation_completed_date: "2026-05-21T00:00:00Z",
        }),
      ],
      [],
    );
    // (10 + 20) / 2 = 15.0
    expect(result.avg_investigation_days).toBe(15);
  });

  it("returns 0 avg_investigation_days when no completed investigations exist", () => {
    const result = computeDisciplinaryMetrics(
      [makeDisciplinary({ investigation_started_date: null, investigation_completed_date: null })],
      [],
    );
    expect(result.avg_investigation_days).toBe(0);
  });

  it("ignores records without both investigation dates for avg calculation", () => {
    const result = computeDisciplinaryMetrics(
      [
        makeDisciplinary({
          id: "d1",
          investigation_started_date: "2026-05-01T00:00:00Z",
          investigation_completed_date: null,
        }),
        makeDisciplinary({
          id: "d2",
          investigation_started_date: null,
          investigation_completed_date: "2026-05-11T00:00:00Z",
        }),
      ],
      [],
    );
    expect(result.avg_investigation_days).toBe(0);
  });

  it("rounds avg_investigation_days to 1 decimal place", () => {
    const result = computeDisciplinaryMetrics(
      [
        makeDisciplinary({
          id: "d1",
          investigation_started_date: "2026-05-01T00:00:00Z",
          investigation_completed_date: "2026-05-08T00:00:00Z",
        }),
        makeDisciplinary({
          id: "d2",
          investigation_started_date: "2026-05-01T00:00:00Z",
          investigation_completed_date: "2026-05-11T00:00:00Z",
        }),
      ],
      [],
    );
    // (7 + 10) / 2 = 8.5
    expect(result.avg_investigation_days).toBe(8.5);
  });

  it("computes lado_referral_rate as percentage of total disciplinary", () => {
    const result = computeDisciplinaryMetrics(
      [
        makeDisciplinary({ id: "d1", lado_referral_required: true }),
        makeDisciplinary({ id: "d2", lado_referral_required: false }),
        makeDisciplinary({ id: "d3", lado_referral_required: false }),
        makeDisciplinary({ id: "d4", lado_referral_required: true }),
      ],
      [],
    );
    // 2/4 = 50.0%
    expect(result.lado_referral_rate).toBe(50);
  });

  it("computes dbs_referral_rate as percentage of total disciplinary", () => {
    const result = computeDisciplinaryMetrics(
      [
        makeDisciplinary({ id: "d1", dbs_referral_required: true }),
        makeDisciplinary({ id: "d2", dbs_referral_required: false }),
        makeDisciplinary({ id: "d3", dbs_referral_required: true }),
      ],
      [],
    );
    // 2/3 = 66.7%
    expect(result.dbs_referral_rate).toBe(66.7);
  });

  it("computes ofsted_notification_rate as percentage of total disciplinary", () => {
    const result = computeDisciplinaryMetrics(
      [
        makeDisciplinary({ id: "d1", ofsted_notification_required: true }),
        makeDisciplinary({ id: "d2", ofsted_notification_required: false }),
      ],
      [],
    );
    // 1/2 = 50.0%
    expect(result.ofsted_notification_rate).toBe(50);
  });

  it("returns 0 referral rates when no disciplinary records exist", () => {
    const result = computeDisciplinaryMetrics([], []);
    expect(result.lado_referral_rate).toBe(0);
    expect(result.dbs_referral_rate).toBe(0);
    expect(result.ofsted_notification_rate).toBe(0);
  });

  it("groups grievances by type", () => {
    const result = computeDisciplinaryMetrics(
      [],
      [
        makeGrievance({ id: "g1", grievance_type: "bullying_harassment" }),
        makeGrievance({ id: "g2", grievance_type: "bullying_harassment" }),
        makeGrievance({ id: "g3", grievance_type: "pay_conditions" }),
      ],
    );
    expect(result.by_grievance_type).toEqual({
      bullying_harassment: 2,
      pay_conditions: 1,
    });
  });

  it("computes informal_resolution_rate among resolved grievances", () => {
    const result = computeDisciplinaryMetrics(
      [],
      [
        makeGrievance({
          id: "g1",
          status: "resolved",
          informal_resolution_attempted: true,
          informal_outcome: "Resolved informally",
        }),
        makeGrievance({
          id: "g2",
          status: "resolved",
          informal_resolution_attempted: false,
          informal_outcome: null,
        }),
      ],
    );
    // 1 informal / 2 resolved = 50%
    expect(result.informal_resolution_rate).toBe(50);
  });

  it("returns 0 informal_resolution_rate when no resolved grievances exist", () => {
    const result = computeDisciplinaryMetrics(
      [],
      [makeGrievance({ status: "raised" })],
    );
    expect(result.informal_resolution_rate).toBe(0);
  });

  it("does not count grievances where informal_resolution_attempted is true but informal_outcome is null", () => {
    const result = computeDisciplinaryMetrics(
      [],
      [
        makeGrievance({
          id: "g1",
          status: "resolved",
          informal_resolution_attempted: true,
          informal_outcome: null,
        }),
      ],
    );
    // attempted but no outcome -> not counted as informally resolved
    expect(result.informal_resolution_rate).toBe(0);
  });

  it("handles mixed disciplinary and grievance data together", () => {
    const result = computeDisciplinaryMetrics(
      [
        makeDisciplinary({ id: "d1", status: "reported", category: "conduct" }),
        makeDisciplinary({ id: "d2", status: "closed", category: "absence" }),
      ],
      [
        makeGrievance({ id: "g1", status: "raised", grievance_type: "management" }),
        makeGrievance({ id: "g2", status: "resolved", grievance_type: "pay_conditions" }),
      ],
    );
    expect(result.total_disciplinary).toBe(2);
    expect(result.total_grievances).toBe(2);
    expect(result.active_disciplinary_cases).toBe(1);
    expect(result.active_grievance_cases).toBe(1);
    expect(result.by_category).toEqual({ conduct: 1, absence: 1 });
    expect(result.by_grievance_type).toEqual({ management: 1, pay_conditions: 1 });
  });
});

// ── identifyDisciplinaryAlerts ──────────────────────────────────────────

describe("identifyDisciplinaryAlerts", () => {
  it("returns empty array when no records exist", () => {
    const result = identifyDisciplinaryAlerts([], []);
    expect(result).toEqual([]);
  });

  // ── Safeguarding concern alerts ──

  it("generates critical alert for active safeguarding concern", () => {
    const result = identifyDisciplinaryAlerts(
      [makeDisciplinary({ category: "safeguarding_concern", status: "reported", staff_name: "Carol Dent" })],
      [],
    );
    const alerts = result.filter((a) => a.type === "safeguarding_concern");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("critical");
    expect(alerts[0].message).toContain("Carol Dent");
    expect(alerts[0].message).toContain("Reg 34");
    expect(alerts[0].id).toBe("disc-1");
  });

  it("does not generate safeguarding alert for closed safeguarding concern", () => {
    const result = identifyDisciplinaryAlerts(
      [makeDisciplinary({ category: "safeguarding_concern", status: "closed" })],
      [],
    );
    const alerts = result.filter((a) => a.type === "safeguarding_concern");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate safeguarding alert for non-safeguarding categories", () => {
    const result = identifyDisciplinaryAlerts(
      [makeDisciplinary({ category: "conduct", status: "reported" })],
      [],
    );
    const alerts = result.filter((a) => a.type === "safeguarding_concern");
    expect(alerts).toHaveLength(0);
  });

  // ── LADO referral alerts ──

  it("generates critical alert for pending LADO referral", () => {
    const result = identifyDisciplinaryAlerts(
      [makeDisciplinary({
        lado_referral_required: true,
        lado_referral_date: null,
        status: "under_investigation",
        staff_name: "Dave Evans",
      })],
      [],
    );
    const alerts = result.filter((a) => a.type === "lado_referral_pending");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("critical");
    expect(alerts[0].message).toContain("Dave Evans");
  });

  it("does not generate LADO alert when referral date is set", () => {
    const result = identifyDisciplinaryAlerts(
      [makeDisciplinary({
        lado_referral_required: true,
        lado_referral_date: "2026-05-02",
        status: "under_investigation",
      })],
      [],
    );
    const alerts = result.filter((a) => a.type === "lado_referral_pending");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate LADO alert for closed cases", () => {
    const result = identifyDisciplinaryAlerts(
      [makeDisciplinary({
        lado_referral_required: true,
        lado_referral_date: null,
        status: "closed",
      })],
      [],
    );
    const alerts = result.filter((a) => a.type === "lado_referral_pending");
    expect(alerts).toHaveLength(0);
  });

  // ── DBS referral alerts ──

  it("generates high alert for pending DBS referral", () => {
    const result = identifyDisciplinaryAlerts(
      [makeDisciplinary({
        dbs_referral_required: true,
        dbs_referral_date: null,
        status: "reported",
        staff_name: "Eve Foster",
      })],
      [],
    );
    const alerts = result.filter((a) => a.type === "dbs_referral_pending");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("high");
    expect(alerts[0].message).toContain("Eve Foster");
  });

  it("does not generate DBS alert when referral date is set", () => {
    const result = identifyDisciplinaryAlerts(
      [makeDisciplinary({
        dbs_referral_required: true,
        dbs_referral_date: "2026-05-03",
        status: "reported",
      })],
      [],
    );
    const alerts = result.filter((a) => a.type === "dbs_referral_pending");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate DBS alert for closed cases", () => {
    const result = identifyDisciplinaryAlerts(
      [makeDisciplinary({
        dbs_referral_required: true,
        dbs_referral_date: null,
        status: "closed",
      })],
      [],
    );
    const alerts = result.filter((a) => a.type === "dbs_referral_pending");
    expect(alerts).toHaveLength(0);
  });

  // ── Ofsted notification alerts ──

  it("generates critical alert for pending Ofsted notification", () => {
    const result = identifyDisciplinaryAlerts(
      [makeDisciplinary({
        ofsted_notification_required: true,
        ofsted_notification_date: null,
        status: "under_investigation",
        staff_name: "Frank Grant",
      })],
      [],
    );
    const alerts = result.filter((a) => a.type === "ofsted_notification_pending");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("critical");
    expect(alerts[0].message).toContain("Frank Grant");
    expect(alerts[0].message).toContain("Reg 40");
  });

  it("does not generate Ofsted alert when notification date is set", () => {
    const result = identifyDisciplinaryAlerts(
      [makeDisciplinary({
        ofsted_notification_required: true,
        ofsted_notification_date: "2026-05-04",
        status: "reported",
      })],
      [],
    );
    const alerts = result.filter((a) => a.type === "ofsted_notification_pending");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate Ofsted alert for closed cases", () => {
    const result = identifyDisciplinaryAlerts(
      [makeDisciplinary({
        ofsted_notification_required: true,
        ofsted_notification_date: null,
        status: "closed",
      })],
      [],
    );
    const alerts = result.filter((a) => a.type === "ofsted_notification_pending");
    expect(alerts).toHaveLength(0);
  });

  // ── Investigation overdue alerts ──

  it("generates high alert for investigation running over 28 days", () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 35);
    const result = identifyDisciplinaryAlerts(
      [makeDisciplinary({
        status: "under_investigation",
        investigation_started_date: startDate.toISOString(),
        staff_name: "Grace Hill",
      })],
      [],
    );
    const alerts = result.filter((a) => a.type === "investigation_overdue");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("high");
    expect(alerts[0].message).toContain("Grace Hill");
    expect(alerts[0].message).toContain("35 days");
  });

  it("does not generate investigation_overdue for investigation under 28 days", () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 10);
    const result = identifyDisciplinaryAlerts(
      [makeDisciplinary({
        status: "under_investigation",
        investigation_started_date: startDate.toISOString(),
      })],
      [],
    );
    const alerts = result.filter((a) => a.type === "investigation_overdue");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate investigation_overdue for non-investigation status", () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 35);
    const result = identifyDisciplinaryAlerts(
      [makeDisciplinary({
        status: "reported",
        investigation_started_date: startDate.toISOString(),
      })],
      [],
    );
    const alerts = result.filter((a) => a.type === "investigation_overdue");
    expect(alerts).toHaveLength(0);
  });

  // ── Investigation not started alerts ──

  it("generates high alert for investigation required but not started after 3 days", () => {
    const reportedDate = new Date();
    reportedDate.setDate(reportedDate.getDate() - 5);
    const result = identifyDisciplinaryAlerts(
      [makeDisciplinary({
        investigation_required: true,
        investigation_started_date: null,
        status: "reported",
        reported_date: reportedDate.toISOString(),
        staff_name: "Hank Ives",
      })],
      [],
    );
    const alerts = result.filter((a) => a.type === "investigation_not_started");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("high");
    expect(alerts[0].message).toContain("Hank Ives");
    expect(alerts[0].message).toContain("5 days");
  });

  it("does not generate investigation_not_started within 3 days", () => {
    const reportedDate = new Date();
    reportedDate.setDate(reportedDate.getDate() - 2);
    const result = identifyDisciplinaryAlerts(
      [makeDisciplinary({
        investigation_required: true,
        investigation_started_date: null,
        status: "reported",
        reported_date: reportedDate.toISOString(),
      })],
      [],
    );
    const alerts = result.filter((a) => a.type === "investigation_not_started");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate investigation_not_started when investigation is not required", () => {
    const reportedDate = new Date();
    reportedDate.setDate(reportedDate.getDate() - 10);
    const result = identifyDisciplinaryAlerts(
      [makeDisciplinary({
        investigation_required: false,
        investigation_started_date: null,
        status: "reported",
        reported_date: reportedDate.toISOString(),
      })],
      [],
    );
    const alerts = result.filter((a) => a.type === "investigation_not_started");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate investigation_not_started when status is not reported", () => {
    const reportedDate = new Date();
    reportedDate.setDate(reportedDate.getDate() - 10);
    const result = identifyDisciplinaryAlerts(
      [makeDisciplinary({
        investigation_required: true,
        investigation_started_date: null,
        status: "under_investigation",
        reported_date: reportedDate.toISOString(),
      })],
      [],
    );
    const alerts = result.filter((a) => a.type === "investigation_not_started");
    expect(alerts).toHaveLength(0);
  });

  // ── Long-running case alerts ──

  it("generates medium alert for case open more than 90 days", () => {
    const reportedDate = new Date();
    reportedDate.setDate(reportedDate.getDate() - 100);
    const result = identifyDisciplinaryAlerts(
      [makeDisciplinary({
        status: "under_investigation",
        reported_date: reportedDate.toISOString(),
        staff_name: "Iris James",
      })],
      [],
    );
    const alerts = result.filter((a) => a.type === "long_running_case");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("medium");
    expect(alerts[0].message).toContain("Iris James");
    expect(alerts[0].message).toContain("100 days");
  });

  it("does not generate long_running_case for case under 90 days", () => {
    const reportedDate = new Date();
    reportedDate.setDate(reportedDate.getDate() - 50);
    const result = identifyDisciplinaryAlerts(
      [makeDisciplinary({
        status: "under_investigation",
        reported_date: reportedDate.toISOString(),
      })],
      [],
    );
    const alerts = result.filter((a) => a.type === "long_running_case");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate long_running_case for closed cases", () => {
    const reportedDate = new Date();
    reportedDate.setDate(reportedDate.getDate() - 120);
    const result = identifyDisciplinaryAlerts(
      [makeDisciplinary({
        status: "closed",
        reported_date: reportedDate.toISOString(),
      })],
      [],
    );
    const alerts = result.filter((a) => a.type === "long_running_case");
    expect(alerts).toHaveLength(0);
  });

  // ── Gross misconduct alerts ──

  it("generates critical alert for gross misconduct in reported status", () => {
    const result = identifyDisciplinaryAlerts(
      [makeDisciplinary({
        category: "gross_misconduct",
        status: "reported",
        staff_name: "Jack King",
      })],
      [],
    );
    const alerts = result.filter((a) => a.type === "gross_misconduct_reported");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("critical");
    expect(alerts[0].message).toContain("Jack King");
    expect(alerts[0].message).toContain("immediate investigation");
  });

  it("does not generate gross_misconduct_reported for non-reported status", () => {
    const result = identifyDisciplinaryAlerts(
      [makeDisciplinary({
        category: "gross_misconduct",
        status: "under_investigation",
      })],
      [],
    );
    const alerts = result.filter((a) => a.type === "gross_misconduct_reported");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate gross_misconduct_reported for non-gross_misconduct category", () => {
    const result = identifyDisciplinaryAlerts(
      [makeDisciplinary({
        category: "conduct",
        status: "reported",
      })],
      [],
    );
    const alerts = result.filter((a) => a.type === "gross_misconduct_reported");
    expect(alerts).toHaveLength(0);
  });

  // ── Grievance overdue alerts ──

  it("generates medium alert for grievance open more than 28 days", () => {
    const raisedDate = new Date();
    raisedDate.setDate(raisedDate.getDate() - 35);
    const result = identifyDisciplinaryAlerts(
      [],
      [makeGrievance({
        status: "raised",
        date_raised: raisedDate.toISOString(),
        staff_name: "Kate Lewis",
      })],
    );
    const alerts = result.filter((a) => a.type === "grievance_overdue");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("medium");
    expect(alerts[0].message).toContain("Kate Lewis");
    expect(alerts[0].message).toContain("35 days");
  });

  it("does not generate grievance_overdue within 28 days", () => {
    const raisedDate = new Date();
    raisedDate.setDate(raisedDate.getDate() - 10);
    const result = identifyDisciplinaryAlerts(
      [],
      [makeGrievance({
        status: "raised",
        date_raised: raisedDate.toISOString(),
      })],
    );
    const alerts = result.filter((a) => a.type === "grievance_overdue");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate grievance_overdue for resolved grievances", () => {
    const raisedDate = new Date();
    raisedDate.setDate(raisedDate.getDate() - 60);
    const result = identifyDisciplinaryAlerts(
      [],
      [makeGrievance({
        status: "resolved",
        date_raised: raisedDate.toISOString(),
      })],
    );
    const alerts = result.filter((a) => a.type === "grievance_overdue");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate grievance_overdue for withdrawn grievances", () => {
    const raisedDate = new Date();
    raisedDate.setDate(raisedDate.getDate() - 60);
    const result = identifyDisciplinaryAlerts(
      [],
      [makeGrievance({
        status: "withdrawn",
        date_raised: raisedDate.toISOString(),
      })],
    );
    const alerts = result.filter((a) => a.type === "grievance_overdue");
    expect(alerts).toHaveLength(0);
  });

  // ── Sensitive grievance alerts ──

  it("generates high alert for active bullying_harassment grievance", () => {
    const result = identifyDisciplinaryAlerts(
      [],
      [makeGrievance({
        grievance_type: "bullying_harassment",
        status: "formal_stage_1",
        staff_name: "Laura Moore",
      })],
    );
    const alerts = result.filter((a) => a.type === "sensitive_grievance");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("high");
    expect(alerts[0].message).toContain("Laura Moore");
    expect(alerts[0].message).toContain("bullying harassment");
  });

  it("generates high alert for active discrimination grievance", () => {
    const result = identifyDisciplinaryAlerts(
      [],
      [makeGrievance({
        grievance_type: "discrimination",
        status: "raised",
        staff_name: "Mark Noble",
      })],
    );
    const alerts = result.filter((a) => a.type === "sensitive_grievance");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("high");
    expect(alerts[0].message).toContain("Mark Noble");
    expect(alerts[0].message).toContain("discrimination");
  });

  it("does not generate sensitive_grievance for resolved bullying case", () => {
    const result = identifyDisciplinaryAlerts(
      [],
      [makeGrievance({
        grievance_type: "bullying_harassment",
        status: "resolved",
      })],
    );
    const alerts = result.filter((a) => a.type === "sensitive_grievance");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate sensitive_grievance for withdrawn discrimination case", () => {
    const result = identifyDisciplinaryAlerts(
      [],
      [makeGrievance({
        grievance_type: "discrimination",
        status: "withdrawn",
      })],
    );
    const alerts = result.filter((a) => a.type === "sensitive_grievance");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate sensitive_grievance for non-sensitive grievance types", () => {
    const result = identifyDisciplinaryAlerts(
      [],
      [makeGrievance({
        grievance_type: "pay_conditions",
        status: "raised",
      })],
    );
    const alerts = result.filter((a) => a.type === "sensitive_grievance");
    expect(alerts).toHaveLength(0);
  });

  // ── Grievance appeal alerts ──

  it("generates medium alert for grievance at appeal stage", () => {
    const result = identifyDisciplinaryAlerts(
      [],
      [makeGrievance({
        status: "appeal",
        staff_name: "Nina Owen",
      })],
    );
    const alerts = result.filter((a) => a.type === "grievance_appeal");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("medium");
    expect(alerts[0].message).toContain("Nina Owen");
    expect(alerts[0].message).toContain("senior management");
  });

  it("does not generate grievance_appeal for non-appeal status", () => {
    const result = identifyDisciplinaryAlerts(
      [],
      [makeGrievance({ status: "raised" })],
    );
    const alerts = result.filter((a) => a.type === "grievance_appeal");
    expect(alerts).toHaveLength(0);
  });

  // ── Pattern detection: repeat disciplinary ──

  it("generates high alert for staff member with 2+ active disciplinary cases", () => {
    const result = identifyDisciplinaryAlerts(
      [
        makeDisciplinary({ id: "d1", staff_id: "staff-99", staff_name: "Pete Quinn", status: "reported" }),
        makeDisciplinary({ id: "d2", staff_id: "staff-99", staff_name: "Pete Quinn", status: "under_investigation" }),
      ],
      [],
    );
    const alerts = result.filter((a) => a.type === "repeat_disciplinary");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("high");
    expect(alerts[0].message).toContain("Pete Quinn");
    expect(alerts[0].message).toContain("2 active");
    expect(alerts[0].message).toContain("Reg 34");
    expect(alerts[0].id).toBe("staff-99");
  });

  it("does not generate repeat_disciplinary for single active case per staff", () => {
    const result = identifyDisciplinaryAlerts(
      [
        makeDisciplinary({ id: "d1", staff_id: "staff-1", status: "reported" }),
        makeDisciplinary({ id: "d2", staff_id: "staff-2", status: "reported" }),
      ],
      [],
    );
    const alerts = result.filter((a) => a.type === "repeat_disciplinary");
    expect(alerts).toHaveLength(0);
  });

  it("does not count closed cases for repeat_disciplinary pattern", () => {
    const result = identifyDisciplinaryAlerts(
      [
        makeDisciplinary({ id: "d1", staff_id: "staff-99", status: "reported" }),
        makeDisciplinary({ id: "d2", staff_id: "staff-99", status: "closed" }),
      ],
      [],
    );
    const alerts = result.filter((a) => a.type === "repeat_disciplinary");
    expect(alerts).toHaveLength(0);
  });

  it("generates repeat_disciplinary for staff with 3 active cases", () => {
    const result = identifyDisciplinaryAlerts(
      [
        makeDisciplinary({ id: "d1", staff_id: "staff-99", staff_name: "Rita Stone", status: "reported" }),
        makeDisciplinary({ id: "d2", staff_id: "staff-99", staff_name: "Rita Stone", status: "under_investigation" }),
        makeDisciplinary({ id: "d3", staff_id: "staff-99", staff_name: "Rita Stone", status: "hearing_scheduled" }),
      ],
      [],
    );
    const alerts = result.filter((a) => a.type === "repeat_disciplinary");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].message).toContain("3 active");
  });

  // ── Multiple simultaneous alerts ──

  it("generates multiple alerts from different sources simultaneously", () => {
    const reportedDate = new Date();
    reportedDate.setDate(reportedDate.getDate() - 100);
    const raisedDate = new Date();
    raisedDate.setDate(raisedDate.getDate() - 40);

    const result = identifyDisciplinaryAlerts(
      [makeDisciplinary({
        category: "safeguarding_concern",
        status: "reported",
        reported_date: reportedDate.toISOString(),
        lado_referral_required: true,
        lado_referral_date: null,
      })],
      [makeGrievance({
        grievance_type: "bullying_harassment",
        status: "appeal",
        date_raised: raisedDate.toISOString(),
      })],
    );

    const types = result.map((a) => a.type);
    expect(types).toContain("safeguarding_concern");
    expect(types).toContain("lado_referral_pending");
    expect(types).toContain("long_running_case");
    expect(types).toContain("sensitive_grievance");
    expect(types).toContain("grievance_appeal");
    expect(types).toContain("grievance_overdue");
  });

  it("returns correct alert structure with type, severity, message, and id", () => {
    const result = identifyDisciplinaryAlerts(
      [makeDisciplinary({ category: "gross_misconduct", status: "reported" })],
      [],
    );
    expect(result.length).toBeGreaterThan(0);
    for (const alert of result) {
      expect(alert).toHaveProperty("type");
      expect(alert).toHaveProperty("severity");
      expect(alert).toHaveProperty("message");
      expect(alert).toHaveProperty("id");
      expect(["critical", "high", "medium", "low"]).toContain(alert.severity);
    }
  });
});
