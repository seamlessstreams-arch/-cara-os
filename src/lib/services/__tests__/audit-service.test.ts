// ══════════════════════════════════════════════════════════════════════════════
// CARA — AUDIT SERVICE TESTS
// Pure-function tests for change computation and entity type constants.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../audit-service";

const { AUDIT_ENTITY_TYPES, computeChanges } = _testing;

// ── computeChanges ─────────────────────────────────────────────────────

describe("computeChanges", () => {
  it("returns empty object when both old and new are empty", () => {
    const result = computeChanges({}, {});
    expect(result).toEqual({});
  });

  it("returns empty object when old and new values are identical", () => {
    const old = { name: "Alice", age: 30, active: true };
    const result = computeChanges(old, { ...old });
    expect(result).toEqual({});
  });

  it("detects a simple string field change", () => {
    const result = computeChanges(
      { name: "Alice" },
      { name: "Bob" },
    );
    expect(result).toEqual({
      name: { old: "Alice", new: "Bob" },
    });
  });

  it("detects multiple field changes at once", () => {
    const result = computeChanges(
      { name: "Alice", age: 30, role: "carer" },
      { name: "Bob", age: 31, role: "carer" },
    );
    expect(result).toEqual({
      name: { old: "Alice", new: "Bob" },
      age: { old: 30, new: 31 },
    });
    expect(result).not.toHaveProperty("role");
  });

  it("skips updated_at field even when changed", () => {
    const result = computeChanges(
      { name: "Alice", updated_at: "2026-01-01T00:00:00Z" },
      { name: "Alice", updated_at: "2026-05-13T12:00:00Z" },
    );
    expect(result).toEqual({});
  });

  it("skips updated_by field even when changed", () => {
    const result = computeChanges(
      { name: "Alice", updated_by: "user-1" },
      { name: "Alice", updated_by: "user-2" },
    );
    expect(result).toEqual({});
  });

  it("skips both updated_at and updated_by while still detecting other changes", () => {
    const result = computeChanges(
      { name: "Alice", updated_at: "2026-01-01", updated_by: "user-1" },
      { name: "Bob", updated_at: "2026-05-13", updated_by: "user-2" },
    );
    expect(result).toEqual({
      name: { old: "Alice", new: "Bob" },
    });
  });

  it("detects a key present only in newValues as a new field", () => {
    const result = computeChanges(
      { name: "Alice" },
      { name: "Alice", email: "alice@example.com" },
    );
    expect(result).toEqual({
      email: { old: null, new: "alice@example.com" },
    });
  });

  it("detects a key present only in oldValues as a removed field", () => {
    const result = computeChanges(
      { name: "Alice", email: "alice@example.com" },
      { name: "Alice" },
    );
    expect(result).toEqual({
      email: { old: "alice@example.com", new: null },
    });
  });

  it("coerces undefined values to null in the change record", () => {
    const oldValues: Record<string, unknown> = { status: undefined };
    const newValues: Record<string, unknown> = { status: "active" };
    const result = computeChanges(oldValues, newValues);
    expect(result).toEqual({
      status: { old: null, new: "active" },
    });
  });

  it("detects deep object changes using JSON comparison", () => {
    const result = computeChanges(
      { meta: { tags: ["a", "b"], score: 5 } },
      { meta: { tags: ["a", "c"], score: 5 } },
    );
    expect(result).toEqual({
      meta: {
        old: { tags: ["a", "b"], score: 5 },
        new: { tags: ["a", "c"], score: 5 },
      },
    });
  });

  it("treats identical deep objects as unchanged", () => {
    const nested = { tags: ["a", "b"], score: 5 };
    const result = computeChanges(
      { meta: { ...nested } },
      { meta: { ...nested } },
    );
    expect(result).toEqual({});
  });

  it("detects array changes", () => {
    const result = computeChanges(
      { items: [1, 2, 3] },
      { items: [1, 2, 4] },
    );
    expect(result).toEqual({
      items: { old: [1, 2, 3], new: [1, 2, 4] },
    });
  });

  it("detects change from null to a value", () => {
    const result = computeChanges(
      { notes: null },
      { notes: "some note" },
    );
    expect(result).toEqual({
      notes: { old: null, new: "some note" },
    });
  });

  it("detects change from a value to null", () => {
    const result = computeChanges(
      { notes: "some note" },
      { notes: null },
    );
    expect(result).toEqual({
      notes: { old: "some note", new: null },
    });
  });

  it("treats null-to-null as unchanged", () => {
    const result = computeChanges(
      { notes: null },
      { notes: null },
    );
    expect(result).toEqual({});
  });

  it("detects boolean field changes", () => {
    const result = computeChanges(
      { active: true },
      { active: false },
    );
    expect(result).toEqual({
      active: { old: true, new: false },
    });
  });

  it("detects numeric field changes including zero", () => {
    const result = computeChanges(
      { count: 0 },
      { count: 5 },
    );
    expect(result).toEqual({
      count: { old: 0, new: 5 },
    });
  });

  it("handles completely disjoint key sets", () => {
    const result = computeChanges(
      { alpha: 1, beta: 2 },
      { gamma: 3, delta: 4 },
    );
    expect(result).toEqual({
      alpha: { old: 1, new: null },
      beta: { old: 2, new: null },
      gamma: { old: null, new: 3 },
      delta: { old: null, new: 4 },
    });
  });
});

// ── AUDIT_ENTITY_TYPES constant ────────────────────────────────────────

describe("AUDIT_ENTITY_TYPES", () => {
  it("contains exactly 30 entity types", () => {
    expect(Object.keys(AUDIT_ENTITY_TYPES)).toHaveLength(30);
  });

  it("has unique values — no two keys map to the same string", () => {
    const values = Object.values(AUDIT_ENTITY_TYPES);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it("maps YOUNG_PERSON to 'young_person'", () => {
    expect(AUDIT_ENTITY_TYPES.YOUNG_PERSON).toBe("young_person");
  });

  it("maps INCIDENT to 'incident'", () => {
    expect(AUDIT_ENTITY_TYPES.INCIDENT).toBe("incident");
  });

  it("maps DAILY_LOG to 'daily_log'", () => {
    expect(AUDIT_ENTITY_TYPES.DAILY_LOG).toBe("daily_log");
  });

  it("maps MEDICATION to 'medication'", () => {
    expect(AUDIT_ENTITY_TYPES.MEDICATION).toBe("medication");
  });

  it("maps MEDICATION_ADMIN to 'medication_administration'", () => {
    expect(AUDIT_ENTITY_TYPES.MEDICATION_ADMIN).toBe("medication_administration");
  });

  it("maps SAFEGUARDING to 'safeguarding_concern'", () => {
    expect(AUDIT_ENTITY_TYPES.SAFEGUARDING).toBe("safeguarding_concern");
  });

  it("maps MISSING_EPISODE to 'missing_episode'", () => {
    expect(AUDIT_ENTITY_TYPES.MISSING_EPISODE).toBe("missing_episode");
  });

  it("maps FORM_TEMPLATE to 'form_template'", () => {
    expect(AUDIT_ENTITY_TYPES.FORM_TEMPLATE).toBe("form_template");
  });

  it("maps FORM_VERSION to 'form_template_version'", () => {
    expect(AUDIT_ENTITY_TYPES.FORM_VERSION).toBe("form_template_version");
  });

  it("maps FORM_SUBMISSION to 'form_submission'", () => {
    expect(AUDIT_ENTITY_TYPES.FORM_SUBMISSION).toBe("form_submission");
  });

  it("maps OVERSIGHT_NOTE to 'oversight_note'", () => {
    expect(AUDIT_ENTITY_TYPES.OVERSIGHT_NOTE).toBe("oversight_note");
  });

  it("maps EVIDENCE to 'evidence_item'", () => {
    expect(AUDIT_ENTITY_TYPES.EVIDENCE).toBe("evidence_item");
  });

  it("maps EVIDENCE_LINK to 'evidence_link'", () => {
    expect(AUDIT_ENTITY_TYPES.EVIDENCE_LINK).toBe("evidence_link");
  });

  it("maps CARA_RECOMMENDATION to 'aria_recommendation'", () => {
    expect(AUDIT_ENTITY_TYPES.CARA_RECOMMENDATION).toBe("aria_recommendation");
  });

  it("maps INSPECTION_SCAN to 'inspection_scan'", () => {
    expect(AUDIT_ENTITY_TYPES.INSPECTION_SCAN).toBe("inspection_scan");
  });

  it("maps SESSION to 'user_session'", () => {
    expect(AUDIT_ENTITY_TYPES.SESSION).toBe("user_session");
  });

  it("maps EXPORT to 'data_export'", () => {
    expect(AUDIT_ENTITY_TYPES.EXPORT).toBe("data_export");
  });

  it("maps PERMISSION to 'permission_change'", () => {
    expect(AUDIT_ENTITY_TYPES.PERMISSION).toBe("permission_change");
  });

  it("maps SYSTEM_SETTING to 'system_setting'", () => {
    expect(AUDIT_ENTITY_TYPES.SYSTEM_SETTING).toBe("system_setting");
  });

  it("has all values as non-empty strings", () => {
    for (const [key, value] of Object.entries(AUDIT_ENTITY_TYPES)) {
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it("uses snake_case for all values", () => {
    for (const value of Object.values(AUDIT_ENTITY_TYPES)) {
      expect(value).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });
});
