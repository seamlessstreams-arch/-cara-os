// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILDREN'S RIGHTS SERVICE TESTS
// Pure-function unit tests for rights metrics computation, alert
// identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 7 (children's wishes and feelings —
// right to be heard), Reg 8 (children's views, wishes, and feelings),
// Reg 16 (providing children with information — their rights).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeRightsMetrics,
  identifyRightsAlerts,
  RIGHTS_CATEGORIES,
  RIGHTS_CHECK_OUTCOMES,
  EMPOWERMENT_LEVELS,
  listAudits,
  createAudit,
  listProfiles,
  createProfile,
  updateProfile,
} from "../childrens-rights-service";

import type {
  RightsAudit,
  ChildRightsProfile,
} from "../childrens-rights-service";

// ── Helpers ────────────────────────────────────────────────────────────────

function makeAudit(overrides: Partial<RightsAudit> = {}): RightsAudit {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    audit_date: "2025-06-01",
    auditor: "Auditor A",
    rights_checks: [
      {
        category: "right_to_be_heard",
        outcome: "fully_met",
        evidence: "Children consulted regularly",
        action_required: null,
      },
    ],
    children_consulted: 4,
    overall_rating: "Good",
    key_findings: ["Children well informed"],
    actions: [],
    created_at: "2025-06-01T10:00:00.000Z",
    ...overrides,
  };
}

function makeProfile(
  overrides: Partial<ChildRightsProfile> = {},
): ChildRightsProfile {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    child_id: crypto.randomUUID(),
    child_name: "Child A",
    knows_rights: true,
    knows_how_to_complain: true,
    has_advocate: true,
    advocate_name: "Advocate A",
    views_sought_regularly: true,
    empowerment_level: "fully_empowered",
    preferred_communication: "verbal",
    last_rights_discussion: "2025-05-15",
    barriers_to_participation: [],
    created_at: "2025-05-01T10:00:00.000Z",
    updated_at: "2025-05-15T10:00:00.000Z",
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

describe("Constants", () => {
  // ── RIGHTS_CATEGORIES ──────────────────────────────────────────────────

  describe("RIGHTS_CATEGORIES", () => {
    it("contains exactly 13 items", () => {
      expect(RIGHTS_CATEGORIES).toHaveLength(13);
    });

    it("has unique category values", () => {
      const values = RIGHTS_CATEGORIES.map((c) => c.category);
      expect(new Set(values).size).toBe(values.length);
    });

    it("has non-empty labels for every entry", () => {
      for (const entry of RIGHTS_CATEGORIES) {
        expect(entry.label.trim().length).toBeGreaterThan(0);
      }
    });

    it.each([
      "right_to_be_heard",
      "right_to_privacy",
      "right_to_complain",
      "right_to_advocacy",
      "right_to_contact",
      "right_to_education",
      "right_to_health",
      "right_to_identity",
      "right_to_religion",
      "right_to_information",
      "right_to_safety",
      "right_to_participation",
      "other",
    ] as const)("includes category %s", (cat) => {
      expect(RIGHTS_CATEGORIES.find((c) => c.category === cat)).toBeDefined();
    });

    it("maps right_to_be_heard to 'Right to Be Heard'", () => {
      const found = RIGHTS_CATEGORIES.find(
        (c) => c.category === "right_to_be_heard",
      );
      expect(found?.label).toBe("Right to Be Heard");
    });

    it("maps other to 'Other'", () => {
      const found = RIGHTS_CATEGORIES.find((c) => c.category === "other");
      expect(found?.label).toBe("Other");
    });
  });

  // ── RIGHTS_CHECK_OUTCOMES ──────────────────────────────────────────────

  describe("RIGHTS_CHECK_OUTCOMES", () => {
    it("contains exactly 4 items", () => {
      expect(RIGHTS_CHECK_OUTCOMES).toHaveLength(4);
    });

    it("has unique outcome values", () => {
      const values = RIGHTS_CHECK_OUTCOMES.map((o) => o.outcome);
      expect(new Set(values).size).toBe(values.length);
    });

    it("has non-empty labels for every entry", () => {
      for (const entry of RIGHTS_CHECK_OUTCOMES) {
        expect(entry.label.trim().length).toBeGreaterThan(0);
      }
    });

    it.each([
      "fully_met",
      "partially_met",
      "not_met",
      "not_applicable",
    ] as const)("includes outcome %s", (outcome) => {
      expect(
        RIGHTS_CHECK_OUTCOMES.find((o) => o.outcome === outcome),
      ).toBeDefined();
    });

    it("maps fully_met to 'Fully Met'", () => {
      const found = RIGHTS_CHECK_OUTCOMES.find(
        (o) => o.outcome === "fully_met",
      );
      expect(found?.label).toBe("Fully Met");
    });

    it("maps not_applicable to 'Not Applicable'", () => {
      const found = RIGHTS_CHECK_OUTCOMES.find(
        (o) => o.outcome === "not_applicable",
      );
      expect(found?.label).toBe("Not Applicable");
    });
  });

  // ── EMPOWERMENT_LEVELS ─────────────────────────────────────────────────

  describe("EMPOWERMENT_LEVELS", () => {
    it("contains exactly 5 items", () => {
      expect(EMPOWERMENT_LEVELS).toHaveLength(5);
    });

    it("has unique level values", () => {
      const values = EMPOWERMENT_LEVELS.map((l) => l.level);
      expect(new Set(values).size).toBe(values.length);
    });

    it("has non-empty labels for every entry", () => {
      for (const entry of EMPOWERMENT_LEVELS) {
        expect(entry.label.trim().length).toBeGreaterThan(0);
      }
    });

    it.each([
      "fully_empowered",
      "mostly_empowered",
      "partially_empowered",
      "not_empowered",
      "not_assessed",
    ] as const)("includes level %s", (level) => {
      expect(EMPOWERMENT_LEVELS.find((l) => l.level === level)).toBeDefined();
    });

    it("maps fully_empowered to 'Fully Empowered'", () => {
      const found = EMPOWERMENT_LEVELS.find(
        (l) => l.level === "fully_empowered",
      );
      expect(found?.label).toBe("Fully Empowered");
    });

    it("maps not_assessed to 'Not Assessed'", () => {
      const found = EMPOWERMENT_LEVELS.find(
        (l) => l.level === "not_assessed",
      );
      expect(found?.label).toBe("Not Assessed");
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. computeRightsMetrics
// ════════════════════════════════════════════════════════════════════════════

describe("computeRightsMetrics", () => {
  // ── Empty inputs ───────────────────────────────────────────────────────

  describe("empty inputs", () => {
    it("returns zeroes when both arrays are empty", () => {
      const m = computeRightsMetrics([], [], 0);
      expect(m.total_audits).toBe(0);
      expect(m.children_with_profiles).toBe(0);
      expect(m.profile_coverage_rate).toBe(0);
      expect(m.knows_rights_rate).toBe(0);
      expect(m.knows_complaints_rate).toBe(0);
      expect(m.has_advocate_rate).toBe(0);
      expect(m.views_sought_rate).toBe(0);
      expect(m.fully_empowered_count).toBe(0);
      expect(m.not_empowered_count).toBe(0);
      expect(m.rights_fully_met).toBe(0);
      expect(m.rights_partially_met).toBe(0);
      expect(m.rights_not_met).toBe(0);
    });

    it("returns empty by_empowerment when no profiles", () => {
      const m = computeRightsMetrics([], [], 0);
      expect(m.by_empowerment).toEqual({});
    });

    it("returns empty by_rights_outcome when no audits", () => {
      const m = computeRightsMetrics([], [], 0);
      expect(m.by_rights_outcome).toEqual({});
    });

    it("returns 0 coverage rate when totalChildren is 0", () => {
      const profiles = [makeProfile()];
      const m = computeRightsMetrics([], profiles, 0);
      expect(m.profile_coverage_rate).toBe(0);
    });
  });

  // ── total_audits ───────────────────────────────────────────────────────

  describe("total_audits", () => {
    it("counts audits correctly", () => {
      const audits = [makeAudit(), makeAudit(), makeAudit()];
      const m = computeRightsMetrics(audits, [], 0);
      expect(m.total_audits).toBe(3);
    });

    it("returns 1 for a single audit", () => {
      const m = computeRightsMetrics([makeAudit()], [], 0);
      expect(m.total_audits).toBe(1);
    });
  });

  // ── children_with_profiles (unique child_id) ───────────────────────────

  describe("children_with_profiles", () => {
    it("counts unique child_id values", () => {
      const childId = crypto.randomUUID();
      const profiles = [
        makeProfile({ child_id: childId }),
        makeProfile({ child_id: childId }),
        makeProfile({ child_id: crypto.randomUUID() }),
      ];
      const m = computeRightsMetrics([], profiles, 5);
      expect(m.children_with_profiles).toBe(2);
    });

    it("counts 1 for a single profile", () => {
      const m = computeRightsMetrics([], [makeProfile()], 5);
      expect(m.children_with_profiles).toBe(1);
    });

    it("counts each unique child once across many profiles", () => {
      const cid1 = crypto.randomUUID();
      const cid2 = crypto.randomUUID();
      const cid3 = crypto.randomUUID();
      const profiles = [
        makeProfile({ child_id: cid1 }),
        makeProfile({ child_id: cid2 }),
        makeProfile({ child_id: cid3 }),
        makeProfile({ child_id: cid1 }),
      ];
      const m = computeRightsMetrics([], profiles, 10);
      expect(m.children_with_profiles).toBe(3);
    });
  });

  // ── profile_coverage_rate ──────────────────────────────────────────────

  describe("profile_coverage_rate", () => {
    it("returns 100 when all children have profiles", () => {
      const profiles = [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
      ];
      const m = computeRightsMetrics([], profiles, 2);
      expect(m.profile_coverage_rate).toBe(100);
    });

    it("returns 50 when half have profiles", () => {
      const profiles = [makeProfile({ child_id: "c1" })];
      const m = computeRightsMetrics([], profiles, 2);
      expect(m.profile_coverage_rate).toBe(50);
    });

    it("rounds to 1 decimal place", () => {
      const profiles = [makeProfile({ child_id: "c1" })];
      const m = computeRightsMetrics([], profiles, 3);
      expect(m.profile_coverage_rate).toBe(33.3);
    });

    it("handles 1 of 7 children correctly (14.3%)", () => {
      const profiles = [makeProfile({ child_id: "c1" })];
      const m = computeRightsMetrics([], profiles, 7);
      expect(m.profile_coverage_rate).toBe(14.3);
    });
  });

  // ── knows_rights_rate ──────────────────────────────────────────────────

  describe("knows_rights_rate", () => {
    it("returns 100 when all profiles know rights", () => {
      const profiles = [
        makeProfile({ knows_rights: true }),
        makeProfile({ knows_rights: true }),
      ];
      const m = computeRightsMetrics([], profiles, 5);
      expect(m.knows_rights_rate).toBe(100);
    });

    it("returns 0 when no profiles know rights", () => {
      const profiles = [
        makeProfile({ knows_rights: false }),
        makeProfile({ knows_rights: false }),
      ];
      const m = computeRightsMetrics([], profiles, 5);
      expect(m.knows_rights_rate).toBe(0);
    });

    it("returns 50 for half knowing rights", () => {
      const profiles = [
        makeProfile({ knows_rights: true }),
        makeProfile({ knows_rights: false }),
      ];
      const m = computeRightsMetrics([], profiles, 5);
      expect(m.knows_rights_rate).toBe(50);
    });

    it("returns 0 when profiles array is empty", () => {
      const m = computeRightsMetrics([], [], 5);
      expect(m.knows_rights_rate).toBe(0);
    });

    it("rounds to 1 decimal place (1 of 3 = 33.3)", () => {
      const profiles = [
        makeProfile({ knows_rights: true }),
        makeProfile({ knows_rights: false }),
        makeProfile({ knows_rights: false }),
      ];
      const m = computeRightsMetrics([], profiles, 5);
      expect(m.knows_rights_rate).toBe(33.3);
    });
  });

  // ── knows_complaints_rate ──────────────────────────────────────────────

  describe("knows_complaints_rate", () => {
    it("returns 100 when all know how to complain", () => {
      const profiles = [
        makeProfile({ knows_how_to_complain: true }),
        makeProfile({ knows_how_to_complain: true }),
      ];
      const m = computeRightsMetrics([], profiles, 5);
      expect(m.knows_complaints_rate).toBe(100);
    });

    it("returns 0 when none know how to complain", () => {
      const profiles = [
        makeProfile({ knows_how_to_complain: false }),
        makeProfile({ knows_how_to_complain: false }),
      ];
      const m = computeRightsMetrics([], profiles, 5);
      expect(m.knows_complaints_rate).toBe(0);
    });

    it("returns correct rate for 2 of 3", () => {
      const profiles = [
        makeProfile({ knows_how_to_complain: true }),
        makeProfile({ knows_how_to_complain: true }),
        makeProfile({ knows_how_to_complain: false }),
      ];
      const m = computeRightsMetrics([], profiles, 5);
      expect(m.knows_complaints_rate).toBe(66.7);
    });
  });

  // ── has_advocate_rate ──────────────────────────────────────────────────

  describe("has_advocate_rate", () => {
    it("returns 100 when all have advocates", () => {
      const profiles = [
        makeProfile({ has_advocate: true }),
        makeProfile({ has_advocate: true }),
      ];
      const m = computeRightsMetrics([], profiles, 5);
      expect(m.has_advocate_rate).toBe(100);
    });

    it("returns 0 when none have advocates", () => {
      const profiles = [
        makeProfile({ has_advocate: false }),
        makeProfile({ has_advocate: false }),
      ];
      const m = computeRightsMetrics([], profiles, 5);
      expect(m.has_advocate_rate).toBe(0);
    });

    it("computes rate for mixed values", () => {
      const profiles = [
        makeProfile({ has_advocate: true }),
        makeProfile({ has_advocate: false }),
        makeProfile({ has_advocate: false }),
        makeProfile({ has_advocate: false }),
      ];
      const m = computeRightsMetrics([], profiles, 5);
      expect(m.has_advocate_rate).toBe(25);
    });
  });

  // ── views_sought_rate ──────────────────────────────────────────────────

  describe("views_sought_rate", () => {
    it("returns 100 when all have views sought", () => {
      const profiles = [
        makeProfile({ views_sought_regularly: true }),
        makeProfile({ views_sought_regularly: true }),
      ];
      const m = computeRightsMetrics([], profiles, 5);
      expect(m.views_sought_rate).toBe(100);
    });

    it("returns 0 when no views sought", () => {
      const profiles = [
        makeProfile({ views_sought_regularly: false }),
        makeProfile({ views_sought_regularly: false }),
      ];
      const m = computeRightsMetrics([], profiles, 5);
      expect(m.views_sought_rate).toBe(0);
    });

    it("computes rate correctly for 3 of 4", () => {
      const profiles = [
        makeProfile({ views_sought_regularly: true }),
        makeProfile({ views_sought_regularly: true }),
        makeProfile({ views_sought_regularly: true }),
        makeProfile({ views_sought_regularly: false }),
      ];
      const m = computeRightsMetrics([], profiles, 5);
      expect(m.views_sought_rate).toBe(75);
    });
  });

  // ── fully_empowered_count / not_empowered_count ────────────────────────

  describe("empowerment counts", () => {
    it("counts fully empowered profiles", () => {
      const profiles = [
        makeProfile({ empowerment_level: "fully_empowered" }),
        makeProfile({ empowerment_level: "fully_empowered" }),
        makeProfile({ empowerment_level: "partially_empowered" }),
      ];
      const m = computeRightsMetrics([], profiles, 5);
      expect(m.fully_empowered_count).toBe(2);
    });

    it("counts not empowered profiles", () => {
      const profiles = [
        makeProfile({ empowerment_level: "not_empowered" }),
        makeProfile({ empowerment_level: "not_empowered" }),
        makeProfile({ empowerment_level: "fully_empowered" }),
      ];
      const m = computeRightsMetrics([], profiles, 5);
      expect(m.not_empowered_count).toBe(2);
    });

    it("returns 0 for both when no profiles", () => {
      const m = computeRightsMetrics([], [], 5);
      expect(m.fully_empowered_count).toBe(0);
      expect(m.not_empowered_count).toBe(0);
    });

    it("handles mostly_empowered as neither fully nor not", () => {
      const profiles = [
        makeProfile({ empowerment_level: "mostly_empowered" }),
      ];
      const m = computeRightsMetrics([], profiles, 5);
      expect(m.fully_empowered_count).toBe(0);
      expect(m.not_empowered_count).toBe(0);
    });
  });

  // ── rights_fully_met / partially_met / not_met ─────────────────────────

  describe("rights outcome counts", () => {
    it("counts fully_met checks across all audits", () => {
      const audits = [
        makeAudit({
          rights_checks: [
            { category: "right_to_be_heard", outcome: "fully_met", evidence: "e", action_required: null },
            { category: "right_to_privacy", outcome: "fully_met", evidence: "e", action_required: null },
          ],
        }),
        makeAudit({
          rights_checks: [
            { category: "right_to_safety", outcome: "fully_met", evidence: "e", action_required: null },
          ],
        }),
      ];
      const m = computeRightsMetrics(audits, [], 5);
      expect(m.rights_fully_met).toBe(3);
    });

    it("counts partially_met checks", () => {
      const audits = [
        makeAudit({
          rights_checks: [
            { category: "right_to_be_heard", outcome: "partially_met", evidence: "e", action_required: "fix" },
          ],
        }),
      ];
      const m = computeRightsMetrics(audits, [], 5);
      expect(m.rights_partially_met).toBe(1);
    });

    it("counts not_met checks", () => {
      const audits = [
        makeAudit({
          rights_checks: [
            { category: "right_to_complain", outcome: "not_met", evidence: "e", action_required: "urgent" },
            { category: "right_to_advocacy", outcome: "not_met", evidence: "e", action_required: "refer" },
          ],
        }),
      ];
      const m = computeRightsMetrics(audits, [], 5);
      expect(m.rights_not_met).toBe(2);
    });

    it("skips not_applicable checks", () => {
      const audits = [
        makeAudit({
          rights_checks: [
            { category: "right_to_religion", outcome: "not_applicable", evidence: "n/a", action_required: null },
            { category: "right_to_be_heard", outcome: "fully_met", evidence: "e", action_required: null },
          ],
        }),
      ];
      const m = computeRightsMetrics(audits, [], 5);
      expect(m.rights_fully_met).toBe(1);
      expect(m.rights_partially_met).toBe(0);
      expect(m.rights_not_met).toBe(0);
    });

    it("returns zeroes when audits have no rights_checks", () => {
      const audits = [makeAudit({ rights_checks: [] })];
      const m = computeRightsMetrics(audits, [], 5);
      expect(m.rights_fully_met).toBe(0);
      expect(m.rights_partially_met).toBe(0);
      expect(m.rights_not_met).toBe(0);
    });
  });

  // ── by_empowerment ─────────────────────────────────────────────────────

  describe("by_empowerment", () => {
    it("groups profiles by empowerment level", () => {
      const profiles = [
        makeProfile({ empowerment_level: "fully_empowered" }),
        makeProfile({ empowerment_level: "fully_empowered" }),
        makeProfile({ empowerment_level: "not_empowered" }),
        makeProfile({ empowerment_level: "partially_empowered" }),
      ];
      const m = computeRightsMetrics([], profiles, 5);
      expect(m.by_empowerment).toEqual({
        fully_empowered: 2,
        not_empowered: 1,
        partially_empowered: 1,
      });
    });

    it("handles single empowerment level", () => {
      const profiles = [
        makeProfile({ empowerment_level: "mostly_empowered" }),
      ];
      const m = computeRightsMetrics([], profiles, 5);
      expect(m.by_empowerment).toEqual({ mostly_empowered: 1 });
    });

    it("includes not_assessed level", () => {
      const profiles = [
        makeProfile({ empowerment_level: "not_assessed" }),
        makeProfile({ empowerment_level: "not_assessed" }),
      ];
      const m = computeRightsMetrics([], profiles, 5);
      expect(m.by_empowerment).toEqual({ not_assessed: 2 });
    });
  });

  // ── by_rights_outcome ──────────────────────────────────────────────────

  describe("by_rights_outcome", () => {
    it("groups rights checks by outcome excluding not_applicable", () => {
      const audits = [
        makeAudit({
          rights_checks: [
            { category: "right_to_be_heard", outcome: "fully_met", evidence: "e", action_required: null },
            { category: "right_to_privacy", outcome: "partially_met", evidence: "e", action_required: "review" },
            { category: "right_to_complain", outcome: "not_met", evidence: "e", action_required: "fix" },
            { category: "right_to_religion", outcome: "not_applicable", evidence: "n/a", action_required: null },
          ],
        }),
      ];
      const m = computeRightsMetrics(audits, [], 5);
      expect(m.by_rights_outcome).toEqual({
        fully_met: 1,
        partially_met: 1,
        not_met: 1,
      });
    });

    it("sums across multiple audits", () => {
      const audits = [
        makeAudit({
          rights_checks: [
            { category: "right_to_be_heard", outcome: "fully_met", evidence: "e", action_required: null },
          ],
        }),
        makeAudit({
          rights_checks: [
            { category: "right_to_privacy", outcome: "fully_met", evidence: "e", action_required: null },
          ],
        }),
      ];
      const m = computeRightsMetrics(audits, [], 5);
      expect(m.by_rights_outcome).toEqual({ fully_met: 2 });
    });
  });

  // ── Single items ───────────────────────────────────────────────────────

  describe("single items", () => {
    it("computes correctly with 1 audit and 1 profile", () => {
      const audit = makeAudit({
        rights_checks: [
          { category: "right_to_be_heard", outcome: "fully_met", evidence: "e", action_required: null },
        ],
      });
      const profile = makeProfile({
        knows_rights: true,
        knows_how_to_complain: false,
        has_advocate: true,
        views_sought_regularly: true,
        empowerment_level: "mostly_empowered",
      });
      const m = computeRightsMetrics([audit], [profile], 1);
      expect(m.total_audits).toBe(1);
      expect(m.children_with_profiles).toBe(1);
      expect(m.profile_coverage_rate).toBe(100);
      expect(m.knows_rights_rate).toBe(100);
      expect(m.knows_complaints_rate).toBe(0);
      expect(m.has_advocate_rate).toBe(100);
      expect(m.views_sought_rate).toBe(100);
      expect(m.fully_empowered_count).toBe(0);
      expect(m.not_empowered_count).toBe(0);
      expect(m.rights_fully_met).toBe(1);
    });
  });

  // ── Rounding ───────────────────────────────────────────────────────────

  describe("rounding behaviour", () => {
    it("rounds 2 of 3 to 66.7", () => {
      const profiles = [
        makeProfile({ knows_rights: true }),
        makeProfile({ knows_rights: true }),
        makeProfile({ knows_rights: false }),
      ];
      const m = computeRightsMetrics([], profiles, 5);
      expect(m.knows_rights_rate).toBe(66.7);
    });

    it("rounds 1 of 6 to 16.7", () => {
      const profiles = Array.from({ length: 6 }, (_, i) =>
        makeProfile({
          child_id: `c${i}`,
          knows_rights: i === 0,
        }),
      );
      const m = computeRightsMetrics([], profiles, 10);
      expect(m.knows_rights_rate).toBe(16.7);
    });

    it("rounds coverage 3 of 7 to 42.9", () => {
      const profiles = [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
        makeProfile({ child_id: "c3" }),
      ];
      const m = computeRightsMetrics([], profiles, 7);
      expect(m.profile_coverage_rate).toBe(42.9);
    });
  });

  // ── Return type validation ─────────────────────────────────────────────

  describe("return type", () => {
    it("returns all 14 expected keys", () => {
      const m = computeRightsMetrics([], [], 0);
      const keys = Object.keys(m);
      expect(keys).toContain("total_audits");
      expect(keys).toContain("children_with_profiles");
      expect(keys).toContain("profile_coverage_rate");
      expect(keys).toContain("knows_rights_rate");
      expect(keys).toContain("knows_complaints_rate");
      expect(keys).toContain("has_advocate_rate");
      expect(keys).toContain("views_sought_rate");
      expect(keys).toContain("fully_empowered_count");
      expect(keys).toContain("not_empowered_count");
      expect(keys).toContain("rights_fully_met");
      expect(keys).toContain("rights_partially_met");
      expect(keys).toContain("rights_not_met");
      expect(keys).toContain("by_empowerment");
      expect(keys).toContain("by_rights_outcome");
      expect(keys).toHaveLength(14);
    });

    it("returns number types for numeric fields", () => {
      const m = computeRightsMetrics([], [], 0);
      expect(typeof m.total_audits).toBe("number");
      expect(typeof m.profile_coverage_rate).toBe("number");
      expect(typeof m.knows_rights_rate).toBe("number");
      expect(typeof m.knows_complaints_rate).toBe("number");
      expect(typeof m.has_advocate_rate).toBe("number");
      expect(typeof m.views_sought_rate).toBe("number");
      expect(typeof m.fully_empowered_count).toBe("number");
      expect(typeof m.not_empowered_count).toBe("number");
      expect(typeof m.rights_fully_met).toBe("number");
      expect(typeof m.rights_partially_met).toBe("number");
      expect(typeof m.rights_not_met).toBe("number");
    });

    it("returns object types for breakdown fields", () => {
      const m = computeRightsMetrics([], [], 0);
      expect(typeof m.by_empowerment).toBe("object");
      expect(typeof m.by_rights_outcome).toBe("object");
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. identifyRightsAlerts
// ════════════════════════════════════════════════════════════════════════════

describe("identifyRightsAlerts", () => {
  const now = new Date("2025-06-15T12:00:00.000Z");

  // ── No alerts ──────────────────────────────────────────────────────────

  describe("no alerts", () => {
    it("returns empty array when all inputs are empty", () => {
      const alerts = identifyRightsAlerts([], [], 0, now);
      expect(alerts).toEqual([]);
    });

    it("returns empty when all profiles are fully compliant", () => {
      const profiles = [
        makeProfile({
          knows_rights: true,
          knows_how_to_complain: true,
          has_advocate: true,
          empowerment_level: "fully_empowered",
        }),
      ];
      const audits = [
        makeAudit({
          rights_checks: [
            { category: "right_to_be_heard", outcome: "fully_met", evidence: "e", action_required: null },
          ],
        }),
      ];
      const alerts = identifyRightsAlerts(audits, profiles, 1, now);
      expect(alerts).toEqual([]);
    });
  });

  // ── rights_not_known ───────────────────────────────────────────────────

  describe("rights_not_known alert", () => {
    it("fires when knows_rights is false", () => {
      const profile = makeProfile({
        child_name: "Emma",
        knows_rights: false,
      });
      const alerts = identifyRightsAlerts([], [profile], 1, now);
      const found = alerts.filter((a) => a.type === "rights_not_known");
      expect(found).toHaveLength(1);
    });

    it("has severity high", () => {
      const profile = makeProfile({ child_name: "Emma", knows_rights: false });
      const alerts = identifyRightsAlerts([], [profile], 1, now);
      const found = alerts.find((a) => a.type === "rights_not_known");
      expect(found?.severity).toBe("high");
    });

    it("includes child name in message", () => {
      const profile = makeProfile({ child_name: "Emma", knows_rights: false });
      const alerts = identifyRightsAlerts([], [profile], 1, now);
      const found = alerts.find((a) => a.type === "rights_not_known");
      expect(found?.message).toContain("Emma");
    });

    it("includes the profile id", () => {
      const profile = makeProfile({ id: "prof-1", child_name: "Emma", knows_rights: false });
      const alerts = identifyRightsAlerts([], [profile], 1, now);
      const found = alerts.find((a) => a.type === "rights_not_known");
      expect(found?.id).toBe("prof-1");
    });

    it("fires for each child that does not know rights", () => {
      const profiles = [
        makeProfile({ child_name: "Emma", knows_rights: false }),
        makeProfile({ child_name: "Jack", knows_rights: false }),
        makeProfile({ child_name: "Zoe", knows_rights: true }),
      ];
      const alerts = identifyRightsAlerts([], profiles, 3, now);
      const found = alerts.filter((a) => a.type === "rights_not_known");
      expect(found).toHaveLength(2);
    });

    it("does not fire when knows_rights is true", () => {
      const profile = makeProfile({ knows_rights: true });
      const alerts = identifyRightsAlerts([], [profile], 1, now);
      const found = alerts.filter((a) => a.type === "rights_not_known");
      expect(found).toHaveLength(0);
    });
  });

  // ── complaints_not_known ───────────────────────────────────────────────

  describe("complaints_not_known alert", () => {
    it("fires when knows_how_to_complain is false", () => {
      const profile = makeProfile({
        child_name: "Jack",
        knows_how_to_complain: false,
      });
      const alerts = identifyRightsAlerts([], [profile], 1, now);
      const found = alerts.filter((a) => a.type === "complaints_not_known");
      expect(found).toHaveLength(1);
    });

    it("has severity high", () => {
      const profile = makeProfile({
        child_name: "Jack",
        knows_how_to_complain: false,
      });
      const alerts = identifyRightsAlerts([], [profile], 1, now);
      const found = alerts.find((a) => a.type === "complaints_not_known");
      expect(found?.severity).toBe("high");
    });

    it("includes child name in message", () => {
      const profile = makeProfile({
        child_name: "Jack",
        knows_how_to_complain: false,
      });
      const alerts = identifyRightsAlerts([], [profile], 1, now);
      const found = alerts.find((a) => a.type === "complaints_not_known");
      expect(found?.message).toContain("Jack");
    });

    it("fires for multiple children", () => {
      const profiles = [
        makeProfile({ child_name: "A", knows_how_to_complain: false }),
        makeProfile({ child_name: "B", knows_how_to_complain: false }),
      ];
      const alerts = identifyRightsAlerts([], profiles, 2, now);
      const found = alerts.filter((a) => a.type === "complaints_not_known");
      expect(found).toHaveLength(2);
    });

    it("does not fire when knows_how_to_complain is true", () => {
      const profile = makeProfile({ knows_how_to_complain: true });
      const alerts = identifyRightsAlerts([], [profile], 1, now);
      const found = alerts.filter((a) => a.type === "complaints_not_known");
      expect(found).toHaveLength(0);
    });
  });

  // ── no_advocate ────────────────────────────────────────────────────────

  describe("no_advocate alert", () => {
    it("fires when has_advocate is false", () => {
      const profile = makeProfile({
        child_name: "Liam",
        has_advocate: false,
      });
      const alerts = identifyRightsAlerts([], [profile], 1, now);
      const found = alerts.filter((a) => a.type === "no_advocate");
      expect(found).toHaveLength(1);
    });

    it("has severity medium", () => {
      const profile = makeProfile({ child_name: "Liam", has_advocate: false });
      const alerts = identifyRightsAlerts([], [profile], 1, now);
      const found = alerts.find((a) => a.type === "no_advocate");
      expect(found?.severity).toBe("medium");
    });

    it("includes child name in message", () => {
      const profile = makeProfile({ child_name: "Liam", has_advocate: false });
      const alerts = identifyRightsAlerts([], [profile], 1, now);
      const found = alerts.find((a) => a.type === "no_advocate");
      expect(found?.message).toContain("Liam");
    });

    it("includes profile id", () => {
      const profile = makeProfile({ id: "p-42", child_name: "Liam", has_advocate: false });
      const alerts = identifyRightsAlerts([], [profile], 1, now);
      const found = alerts.find((a) => a.type === "no_advocate");
      expect(found?.id).toBe("p-42");
    });

    it("does not fire when has_advocate is true", () => {
      const profile = makeProfile({ has_advocate: true });
      const alerts = identifyRightsAlerts([], [profile], 1, now);
      const found = alerts.filter((a) => a.type === "no_advocate");
      expect(found).toHaveLength(0);
    });
  });

  // ── not_empowered ──────────────────────────────────────────────────────

  describe("not_empowered alert", () => {
    it("fires when empowerment_level is not_empowered", () => {
      const profile = makeProfile({
        child_name: "Sophia",
        empowerment_level: "not_empowered",
      });
      const alerts = identifyRightsAlerts([], [profile], 1, now);
      const found = alerts.filter((a) => a.type === "not_empowered");
      expect(found).toHaveLength(1);
    });

    it("has severity high", () => {
      const profile = makeProfile({
        child_name: "Sophia",
        empowerment_level: "not_empowered",
      });
      const alerts = identifyRightsAlerts([], [profile], 1, now);
      const found = alerts.find((a) => a.type === "not_empowered");
      expect(found?.severity).toBe("high");
    });

    it("includes child name in message", () => {
      const profile = makeProfile({
        child_name: "Sophia",
        empowerment_level: "not_empowered",
      });
      const alerts = identifyRightsAlerts([], [profile], 1, now);
      const found = alerts.find((a) => a.type === "not_empowered");
      expect(found?.message).toContain("Sophia");
    });

    it("does not fire for partially_empowered", () => {
      const profile = makeProfile({ empowerment_level: "partially_empowered" });
      const alerts = identifyRightsAlerts([], [profile], 1, now);
      const found = alerts.filter((a) => a.type === "not_empowered");
      expect(found).toHaveLength(0);
    });

    it("does not fire for fully_empowered", () => {
      const profile = makeProfile({ empowerment_level: "fully_empowered" });
      const alerts = identifyRightsAlerts([], [profile], 1, now);
      const found = alerts.filter((a) => a.type === "not_empowered");
      expect(found).toHaveLength(0);
    });

    it("does not fire for mostly_empowered", () => {
      const profile = makeProfile({ empowerment_level: "mostly_empowered" });
      const alerts = identifyRightsAlerts([], [profile], 1, now);
      const found = alerts.filter((a) => a.type === "not_empowered");
      expect(found).toHaveLength(0);
    });

    it("does not fire for not_assessed", () => {
      const profile = makeProfile({ empowerment_level: "not_assessed" });
      const alerts = identifyRightsAlerts([], [profile], 1, now);
      const found = alerts.filter((a) => a.type === "not_empowered");
      expect(found).toHaveLength(0);
    });
  });

  // ── right_not_met ──────────────────────────────────────────────────────

  describe("right_not_met alert", () => {
    it("fires for not_met in the latest audit", () => {
      const audits = [
        makeAudit({
          audit_date: "2025-06-10",
          rights_checks: [
            { category: "right_to_complain", outcome: "not_met", evidence: "e", action_required: "Act now" },
          ],
        }),
      ];
      const alerts = identifyRightsAlerts(audits, [], 0, now);
      const found = alerts.filter((a) => a.type === "right_not_met");
      expect(found).toHaveLength(1);
    });

    it("has severity critical", () => {
      const audits = [
        makeAudit({
          audit_date: "2025-06-10",
          rights_checks: [
            { category: "right_to_complain", outcome: "not_met", evidence: "e", action_required: "Act now" },
          ],
        }),
      ];
      const alerts = identifyRightsAlerts(audits, [], 0, now);
      const found = alerts.find((a) => a.type === "right_not_met");
      expect(found?.severity).toBe("critical");
    });

    it("includes category label in message", () => {
      const audits = [
        makeAudit({
          audit_date: "2025-06-10",
          rights_checks: [
            { category: "right_to_complain", outcome: "not_met", evidence: "e", action_required: "Act now" },
          ],
        }),
      ];
      const alerts = identifyRightsAlerts(audits, [], 0, now);
      const found = alerts.find((a) => a.type === "right_not_met");
      expect(found?.message).toContain("Right to Complain");
    });

    it("includes action_required in message", () => {
      const audits = [
        makeAudit({
          audit_date: "2025-06-10",
          rights_checks: [
            { category: "right_to_complain", outcome: "not_met", evidence: "e", action_required: "Urgent review needed" },
          ],
        }),
      ];
      const alerts = identifyRightsAlerts(audits, [], 0, now);
      const found = alerts.find((a) => a.type === "right_not_met");
      expect(found?.message).toContain("Urgent review needed");
    });

    it("uses fallback text when action_required is null", () => {
      const audits = [
        makeAudit({
          audit_date: "2025-06-10",
          rights_checks: [
            { category: "right_to_complain", outcome: "not_met", evidence: "e", action_required: null },
          ],
        }),
      ];
      const alerts = identifyRightsAlerts(audits, [], 0, now);
      const found = alerts.find((a) => a.type === "right_not_met");
      expect(found?.message).toContain("action required");
    });

    it("uses latest audit by date (not array order)", () => {
      const audits = [
        makeAudit({
          id: "old-audit",
          audit_date: "2025-01-01",
          rights_checks: [
            { category: "right_to_privacy", outcome: "not_met", evidence: "e", action_required: "Old action" },
          ],
        }),
        makeAudit({
          id: "new-audit",
          audit_date: "2025-06-10",
          rights_checks: [
            { category: "right_to_be_heard", outcome: "fully_met", evidence: "e", action_required: null },
          ],
        }),
      ];
      const alerts = identifyRightsAlerts(audits, [], 0, now);
      const found = alerts.filter((a) => a.type === "right_not_met");
      expect(found).toHaveLength(0);
    });

    it("fires for multiple not_met checks in latest audit", () => {
      const audits = [
        makeAudit({
          audit_date: "2025-06-10",
          rights_checks: [
            { category: "right_to_complain", outcome: "not_met", evidence: "e", action_required: "Fix" },
            { category: "right_to_privacy", outcome: "not_met", evidence: "e", action_required: "Review" },
            { category: "right_to_be_heard", outcome: "fully_met", evidence: "e", action_required: null },
          ],
        }),
      ];
      const alerts = identifyRightsAlerts(audits, [], 0, now);
      const found = alerts.filter((a) => a.type === "right_not_met");
      expect(found).toHaveLength(2);
    });

    it("uses the audit id as alert id", () => {
      const audits = [
        makeAudit({
          id: "audit-xyz",
          audit_date: "2025-06-10",
          rights_checks: [
            { category: "right_to_complain", outcome: "not_met", evidence: "e", action_required: "Fix" },
          ],
        }),
      ];
      const alerts = identifyRightsAlerts(audits, [], 0, now);
      const found = alerts.find((a) => a.type === "right_not_met");
      expect(found?.id).toBe("audit-xyz");
    });

    it("does not fire for fully_met or partially_met in latest audit", () => {
      const audits = [
        makeAudit({
          audit_date: "2025-06-10",
          rights_checks: [
            { category: "right_to_be_heard", outcome: "fully_met", evidence: "e", action_required: null },
            { category: "right_to_privacy", outcome: "partially_met", evidence: "e", action_required: "improve" },
          ],
        }),
      ];
      const alerts = identifyRightsAlerts(audits, [], 0, now);
      const found = alerts.filter((a) => a.type === "right_not_met");
      expect(found).toHaveLength(0);
    });

    it("does not fire for not_applicable in latest audit", () => {
      const audits = [
        makeAudit({
          audit_date: "2025-06-10",
          rights_checks: [
            { category: "right_to_religion", outcome: "not_applicable", evidence: "n/a", action_required: null },
          ],
        }),
      ];
      const alerts = identifyRightsAlerts(audits, [], 0, now);
      const found = alerts.filter((a) => a.type === "right_not_met");
      expect(found).toHaveLength(0);
    });
  });

  // ── coverage_gap ───────────────────────────────────────────────────────

  describe("coverage_gap alert", () => {
    it("fires when totalChildren exceeds unique profile children", () => {
      const profiles = [makeProfile({ child_id: "c1" })];
      const alerts = identifyRightsAlerts([], profiles, 3, now);
      const found = alerts.filter((a) => a.type === "coverage_gap");
      expect(found).toHaveLength(1);
    });

    it("has severity high", () => {
      const profiles = [makeProfile({ child_id: "c1" })];
      const alerts = identifyRightsAlerts([], profiles, 3, now);
      const found = alerts.find((a) => a.type === "coverage_gap");
      expect(found?.severity).toBe("high");
    });

    it("uses plural 'children' for 2+ missing", () => {
      const profiles = [makeProfile({ child_id: "c1" })];
      const alerts = identifyRightsAlerts([], profiles, 4, now);
      const found = alerts.find((a) => a.type === "coverage_gap");
      expect(found?.message).toContain("3 children");
    });

    it("uses singular 'child' for 1 missing", () => {
      const profiles = [makeProfile({ child_id: "c1" })];
      const alerts = identifyRightsAlerts([], profiles, 2, now);
      const found = alerts.find((a) => a.type === "coverage_gap");
      expect(found?.message).toContain("1 child ");
      expect(found?.message).not.toContain("1 children");
    });

    it("does not fire when all children have profiles", () => {
      const profiles = [
        makeProfile({ child_id: "c1" }),
        makeProfile({ child_id: "c2" }),
      ];
      const alerts = identifyRightsAlerts([], profiles, 2, now);
      const found = alerts.filter((a) => a.type === "coverage_gap");
      expect(found).toHaveLength(0);
    });

    it("does not fire when totalChildren is 0", () => {
      const alerts = identifyRightsAlerts([], [], 0, now);
      const found = alerts.filter((a) => a.type === "coverage_gap");
      expect(found).toHaveLength(0);
    });

    it("counts unique child_ids for coverage", () => {
      const cid = crypto.randomUUID();
      const profiles = [
        makeProfile({ child_id: cid }),
        makeProfile({ child_id: cid }),
      ];
      const alerts = identifyRightsAlerts([], profiles, 3, now);
      const found = alerts.find((a) => a.type === "coverage_gap");
      expect(found?.message).toContain("2 children");
    });

    it("has id 'coverage-gap'", () => {
      const alerts = identifyRightsAlerts([], [], 5, now);
      const found = alerts.find((a) => a.type === "coverage_gap");
      expect(found?.id).toBe("coverage-gap");
    });
  });

  // ── Combined scenarios ─────────────────────────────────────────────────

  describe("combined scenarios", () => {
    it("generates multiple alert types simultaneously", () => {
      const profile = makeProfile({
        child_name: "Complex Child",
        knows_rights: false,
        knows_how_to_complain: false,
        has_advocate: false,
        empowerment_level: "not_empowered",
      });
      const audit = makeAudit({
        audit_date: "2025-06-10",
        rights_checks: [
          { category: "right_to_complain", outcome: "not_met", evidence: "e", action_required: "Fix" },
        ],
      });
      const alerts = identifyRightsAlerts([audit], [profile], 3, now);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("rights_not_known");
      expect(types).toContain("complaints_not_known");
      expect(types).toContain("no_advocate");
      expect(types).toContain("not_empowered");
      expect(types).toContain("right_not_met");
      expect(types).toContain("coverage_gap");
    });

    it("generates correct alert count for mixed scenario", () => {
      const profiles = [
        makeProfile({
          child_name: "A",
          knows_rights: false,
          knows_how_to_complain: true,
          has_advocate: true,
          empowerment_level: "fully_empowered",
        }),
        makeProfile({
          child_name: "B",
          knows_rights: true,
          knows_how_to_complain: false,
          has_advocate: false,
          empowerment_level: "not_empowered",
        }),
      ];
      const alerts = identifyRightsAlerts([], profiles, 2, now);
      // A: rights_not_known
      // B: complaints_not_known, no_advocate, not_empowered
      expect(alerts).toHaveLength(4);
    });

    it("does not produce duplicate coverage_gap alerts", () => {
      const profiles = [makeProfile({ child_id: "c1" })];
      const alerts = identifyRightsAlerts([], profiles, 5, now);
      const found = alerts.filter((a) => a.type === "coverage_gap");
      expect(found).toHaveLength(1);
    });
  });

  // ── Message content validation ─────────────────────────────────────────

  describe("message content", () => {
    it("rights_not_known message references rights discussion", () => {
      const profile = makeProfile({ child_name: "X", knows_rights: false });
      const alerts = identifyRightsAlerts([], [profile], 1, now);
      const found = alerts.find((a) => a.type === "rights_not_known");
      expect(found?.message).toContain("rights discussion");
    });

    it("complaints_not_known message references complaints procedure", () => {
      const profile = makeProfile({ child_name: "X", knows_how_to_complain: false });
      const alerts = identifyRightsAlerts([], [profile], 1, now);
      const found = alerts.find((a) => a.type === "complaints_not_known");
      expect(found?.message).toContain("complaints procedure");
    });

    it("no_advocate message references advocacy service", () => {
      const profile = makeProfile({ child_name: "X", has_advocate: false });
      const alerts = identifyRightsAlerts([], [profile], 1, now);
      const found = alerts.find((a) => a.type === "no_advocate");
      expect(found?.message).toContain("advocacy service");
    });

    it("not_empowered message references empowerment plan", () => {
      const profile = makeProfile({ child_name: "X", empowerment_level: "not_empowered" });
      const alerts = identifyRightsAlerts([], [profile], 1, now);
      const found = alerts.find((a) => a.type === "not_empowered");
      expect(found?.message).toContain("empowerment plan");
    });

    it("coverage_gap message references rights assessment", () => {
      const alerts = identifyRightsAlerts([], [], 3, now);
      const found = alerts.find((a) => a.type === "coverage_gap");
      expect(found?.message).toContain("rights assessment");
    });

    it("right_not_met message references latest audit", () => {
      const audits = [
        makeAudit({
          audit_date: "2025-06-10",
          rights_checks: [
            { category: "right_to_safety", outcome: "not_met", evidence: "e", action_required: "Immediate fix" },
          ],
        }),
      ];
      const alerts = identifyRightsAlerts(audits, [], 0, now);
      const found = alerts.find((a) => a.type === "right_not_met");
      expect(found?.message).toContain("latest audit");
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ════════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  describe("listAudits", () => {
    it("returns ok:true with empty array", async () => {
      const result = await listAudits("home-1");
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("returns ok:true regardless of homeId", async () => {
      const result = await listAudits("any-home");
      expect(result.ok).toBe(true);
    });

    it("returns empty data array", async () => {
      const result = await listAudits("home-1");
      expect(result.data).toEqual([]);
    });

    it("accepts filters without error", async () => {
      const result = await listAudits("home-1", {
        dateFrom: "2025-01-01",
        dateTo: "2025-12-31",
        limit: 10,
      });
      expect(result.ok).toBe(true);
    });
  });

  describe("createAudit", () => {
    it("returns ok:false with error message", async () => {
      const result = await createAudit({
        homeId: "home-1",
        auditDate: "2025-06-01",
        auditor: "Auditor A",
        rightsChecks: [],
        childrenConsulted: 4,
        overallRating: "Good",
        keyFindings: [],
        actions: [],
      });
      expect(result.ok).toBe(false);
    });

    it("returns 'Supabase not configured' error", async () => {
      const result = await createAudit({
        homeId: "home-1",
        auditDate: "2025-06-01",
        auditor: "Auditor A",
        rightsChecks: [],
        childrenConsulted: 4,
        overallRating: "Good",
        keyFindings: [],
        actions: [],
      });
      expect(result.error).toBe("Supabase not configured");
    });
  });

  describe("listProfiles", () => {
    it("returns ok:true with empty array", async () => {
      const result = await listProfiles("home-1");
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("returns ok:true regardless of homeId", async () => {
      const result = await listProfiles("any-home");
      expect(result.ok).toBe(true);
    });

    it("returns empty data array", async () => {
      const result = await listProfiles("home-1");
      expect(result.data).toEqual([]);
    });

    it("accepts filters without error", async () => {
      const result = await listProfiles("home-1", {
        childId: "c1",
        empowermentLevel: "fully_empowered",
        limit: 50,
      });
      expect(result.ok).toBe(true);
    });
  });

  describe("createProfile", () => {
    it("returns ok:false with error message", async () => {
      const result = await createProfile({
        homeId: "home-1",
        childId: "child-1",
        childName: "Test Child",
        knowsRights: true,
        knowsHowToComplain: true,
        hasAdvocate: true,
        viewsSoughtRegularly: true,
        empowermentLevel: "fully_empowered",
        preferredCommunication: "verbal",
      });
      expect(result.ok).toBe(false);
    });

    it("returns 'Supabase not configured' error", async () => {
      const result = await createProfile({
        homeId: "home-1",
        childId: "child-1",
        childName: "Test Child",
        knowsRights: true,
        knowsHowToComplain: true,
        hasAdvocate: true,
        viewsSoughtRegularly: true,
        empowermentLevel: "fully_empowered",
        preferredCommunication: "verbal",
      });
      expect(result.error).toBe("Supabase not configured");
    });
  });

  describe("updateProfile", () => {
    it("returns ok:false with error message", async () => {
      const result = await updateProfile("prof-1", { knows_rights: true });
      expect(result.ok).toBe(false);
    });

    it("returns 'Supabase not configured' error", async () => {
      const result = await updateProfile("prof-1", { knows_rights: true });
      expect(result.error).toBe("Supabase not configured");
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. EDGE CASES
// ════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  const now = new Date("2025-06-15T12:00:00.000Z");
  describe("single item edge cases", () => {
    it("single profile with all false booleans produces correct rates", () => {
      const profile = makeProfile({
        knows_rights: false,
        knows_how_to_complain: false,
        has_advocate: false,
        views_sought_regularly: false,
      });
      const m = computeRightsMetrics([], [profile], 1);
      expect(m.knows_rights_rate).toBe(0);
      expect(m.knows_complaints_rate).toBe(0);
      expect(m.has_advocate_rate).toBe(0);
      expect(m.views_sought_rate).toBe(0);
    });

    it("single profile with all true booleans produces 100 rates", () => {
      const profile = makeProfile({
        knows_rights: true,
        knows_how_to_complain: true,
        has_advocate: true,
        views_sought_regularly: true,
      });
      const m = computeRightsMetrics([], [profile], 1);
      expect(m.knows_rights_rate).toBe(100);
      expect(m.knows_complaints_rate).toBe(100);
      expect(m.has_advocate_rate).toBe(100);
      expect(m.views_sought_rate).toBe(100);
    });

    it("single audit with empty rights_checks", () => {
      const audit = makeAudit({ rights_checks: [] });
      const m = computeRightsMetrics([audit], [], 5);
      expect(m.total_audits).toBe(1);
      expect(m.rights_fully_met).toBe(0);
      expect(m.rights_partially_met).toBe(0);
      expect(m.rights_not_met).toBe(0);
      expect(m.by_rights_outcome).toEqual({});
    });
  });

  describe("large datasets", () => {
    it("handles 100 profiles correctly", () => {
      const profiles = Array.from({ length: 100 }, (_, i) =>
        makeProfile({
          child_id: `child-${i}`,
          knows_rights: i % 2 === 0,
          empowerment_level: i % 5 === 0 ? "fully_empowered" : "partially_empowered",
        }),
      );
      const m = computeRightsMetrics([], profiles, 100);
      expect(m.children_with_profiles).toBe(100);
      expect(m.profile_coverage_rate).toBe(100);
      expect(m.knows_rights_rate).toBe(50);
      expect(m.fully_empowered_count).toBe(20);
    });

    it("handles 50 audits with multiple rights_checks each", () => {
      const audits = Array.from({ length: 50 }, () =>
        makeAudit({
          rights_checks: [
            { category: "right_to_be_heard", outcome: "fully_met", evidence: "e", action_required: null },
            { category: "right_to_privacy", outcome: "partially_met", evidence: "e", action_required: "review" },
          ],
        }),
      );
      const m = computeRightsMetrics(audits, [], 5);
      expect(m.total_audits).toBe(50);
      expect(m.rights_fully_met).toBe(50);
      expect(m.rights_partially_met).toBe(50);
    });

    it("alerts scale with large profile sets", () => {
      const profiles = Array.from({ length: 20 }, (_, i) =>
        makeProfile({
          child_id: `child-${i}`,
          child_name: `Child ${i}`,
          knows_rights: false,
        }),
      );
      const alerts = identifyRightsAlerts([], profiles, 20, now);
      const rightsAlerts = alerts.filter((a) => a.type === "rights_not_known");
      expect(rightsAlerts).toHaveLength(20);
    });
  });

  describe("type checks", () => {
    it("computeRightsMetrics returns an object", () => {
      const m = computeRightsMetrics([], [], 0);
      expect(typeof m).toBe("object");
      expect(m).not.toBeNull();
    });

    it("identifyRightsAlerts returns an array", () => {
      const alerts = identifyRightsAlerts([], [], 0);
      expect(Array.isArray(alerts)).toBe(true);
    });

    it("each alert has type, severity, message, and id", () => {
      const profile = makeProfile({ knows_rights: false, child_name: "Z" });
      const alerts = identifyRightsAlerts([], [profile], 1);
      for (const alert of alerts) {
        expect(typeof alert.type).toBe("string");
        expect(typeof alert.severity).toBe("string");
        expect(typeof alert.message).toBe("string");
        expect(typeof alert.id).toBe("string");
      }
    });

    it("by_empowerment values are numbers", () => {
      const profiles = [makeProfile({ empowerment_level: "fully_empowered" })];
      const m = computeRightsMetrics([], profiles, 5);
      for (const val of Object.values(m.by_empowerment)) {
        expect(typeof val).toBe("number");
      }
    });

    it("by_rights_outcome values are numbers", () => {
      const audits = [
        makeAudit({
          rights_checks: [
            { category: "right_to_be_heard", outcome: "fully_met", evidence: "e", action_required: null },
          ],
        }),
      ];
      const m = computeRightsMetrics(audits, [], 5);
      for (const val of Object.values(m.by_rights_outcome)) {
        expect(typeof val).toBe("number");
      }
    });

    it("RIGHTS_CATEGORIES entries have category and label strings", () => {
      for (const entry of RIGHTS_CATEGORIES) {
        expect(typeof entry.category).toBe("string");
        expect(typeof entry.label).toBe("string");
      }
    });

    it("RIGHTS_CHECK_OUTCOMES entries have outcome and label strings", () => {
      for (const entry of RIGHTS_CHECK_OUTCOMES) {
        expect(typeof entry.outcome).toBe("string");
        expect(typeof entry.label).toBe("string");
      }
    });

    it("EMPOWERMENT_LEVELS entries have level and label strings", () => {
      for (const entry of EMPOWERMENT_LEVELS) {
        expect(typeof entry.level).toBe("string");
        expect(typeof entry.label).toBe("string");
      }
    });
  });

  describe("audit date sorting edge cases", () => {
    it("picks most recent audit when latest is first in array", () => {
      const audits = [
        makeAudit({
          id: "latest",
          audit_date: "2025-06-10",
          rights_checks: [
            { category: "right_to_be_heard", outcome: "not_met", evidence: "e", action_required: "Fix" },
          ],
        }),
        makeAudit({
          id: "older",
          audit_date: "2025-01-01",
          rights_checks: [
            { category: "right_to_privacy", outcome: "fully_met", evidence: "e", action_required: null },
          ],
        }),
      ];
      const alerts = identifyRightsAlerts(audits, [], 0, now);
      const found = alerts.find((a) => a.type === "right_not_met");
      expect(found?.id).toBe("latest");
    });

    it("picks most recent audit when latest is last in array", () => {
      const audits = [
        makeAudit({
          id: "older",
          audit_date: "2025-01-01",
          rights_checks: [
            { category: "right_to_privacy", outcome: "not_met", evidence: "e", action_required: "Old" },
          ],
        }),
        makeAudit({
          id: "latest",
          audit_date: "2025-06-10",
          rights_checks: [
            { category: "right_to_be_heard", outcome: "fully_met", evidence: "e", action_required: null },
          ],
        }),
      ];
      const alerts = identifyRightsAlerts(audits, [], 0, now);
      const found = alerts.filter((a) => a.type === "right_not_met");
      expect(found).toHaveLength(0);
    });

    it("handles three audits and finds latest correctly", () => {
      const audits = [
        makeAudit({
          id: "mid",
          audit_date: "2025-03-15",
          rights_checks: [
            { category: "right_to_be_heard", outcome: "not_met", evidence: "e", action_required: "Mid" },
          ],
        }),
        makeAudit({
          id: "newest",
          audit_date: "2025-06-10",
          rights_checks: [
            { category: "right_to_safety", outcome: "not_met", evidence: "e", action_required: "New" },
          ],
        }),
        makeAudit({
          id: "oldest",
          audit_date: "2025-01-01",
          rights_checks: [
            { category: "right_to_privacy", outcome: "not_met", evidence: "e", action_required: "Old" },
          ],
        }),
      ];
      const alerts = identifyRightsAlerts(audits, [], 0, now);
      const found = alerts.filter((a) => a.type === "right_not_met");
      expect(found).toHaveLength(1);
      expect(found[0].id).toBe("newest");
      expect(found[0].message).toContain("Right to Safety");
    });
  });

  describe("coverage with duplicate child_ids", () => {
    it("deduplicates child_ids for coverage gap calculation", () => {
      const cid = crypto.randomUUID();
      const profiles = [
        makeProfile({ child_id: cid }),
        makeProfile({ child_id: cid }),
        makeProfile({ child_id: cid }),
      ];
      // 3 profiles but only 1 unique child, totalChildren=3 => gap of 2
      const alerts = identifyRightsAlerts([], profiles, 3, now);
      const found = alerts.find((a) => a.type === "coverage_gap");
      expect(found?.message).toContain("2 children");
    });
  });

  describe("identifyRightsAlerts defaults now parameter", () => {
    it("works without explicit now parameter", () => {
      const alerts = identifyRightsAlerts([], [], 0);
      expect(Array.isArray(alerts)).toBe(true);
    });
  });

  describe("all only not_applicable checks in audit", () => {
    it("produces no right_not_met alerts when all checks are not_applicable", () => {
      const audits = [
        makeAudit({
          audit_date: "2025-06-10",
          rights_checks: [
            { category: "right_to_religion", outcome: "not_applicable", evidence: "n/a", action_required: null },
            { category: "other", outcome: "not_applicable", evidence: "n/a", action_required: null },
          ],
        }),
      ];
      const alerts = identifyRightsAlerts(audits, [], 0, now);
      const found = alerts.filter((a) => a.type === "right_not_met");
      expect(found).toHaveLength(0);
    });
  });
});
