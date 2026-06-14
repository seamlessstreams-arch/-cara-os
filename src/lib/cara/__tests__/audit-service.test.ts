// ══════════════════════════════════════════════════════════════════════════════
// Tests: Audit Service — entity types, change computation
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/lib/services/audit-service";

const { AUDIT_ENTITY_TYPES, computeChanges } = _testing;

describe("Audit Service", () => {
  // ── Entity types ────────────────────────────────────────────────────────
  describe("AUDIT_ENTITY_TYPES", () => {
    it("has 25+ entity types", () => {
      expect(Object.keys(AUDIT_ENTITY_TYPES).length).toBeGreaterThanOrEqual(25);
    });

    it("includes core entities", () => {
      expect(AUDIT_ENTITY_TYPES.YOUNG_PERSON).toBe("young_person");
      expect(AUDIT_ENTITY_TYPES.INCIDENT).toBe("incident");
      expect(AUDIT_ENTITY_TYPES.TASK).toBe("task");
      expect(AUDIT_ENTITY_TYPES.WORKFLOW).toBe("workflow");
      expect(AUDIT_ENTITY_TYPES.EVIDENCE).toBe("evidence_item");
    });

    it("includes operations layer entities", () => {
      expect(AUDIT_ENTITY_TYPES.FORM_TEMPLATE).toBe("form_template");
      expect(AUDIT_ENTITY_TYPES.FORM_SUBMISSION).toBe("form_submission");
      expect(AUDIT_ENTITY_TYPES.OVERSIGHT_NOTE).toBe("oversight_note");
      expect(AUDIT_ENTITY_TYPES.ROLE_ASSIGNMENT).toBe("role_assignment");
      expect(AUDIT_ENTITY_TYPES.INSPECTION_SCAN).toBe("inspection_scan");
    });

    it("all values are unique", () => {
      const values = Object.values(AUDIT_ENTITY_TYPES);
      expect(new Set(values).size).toBe(values.length);
    });
  });

  // ── Change computation ────────────────────────────────────────────────
  describe("computeChanges", () => {
    it("detects added fields", () => {
      const changes = computeChanges(
        { name: "Alice" },
        { name: "Alice", age: 14 },
      );
      expect(changes.age).toEqual({ old: null, new: 14 });
    });

    it("detects removed fields", () => {
      const changes = computeChanges(
        { name: "Alice", age: 14 },
        { name: "Alice" },
      );
      expect(changes.age).toEqual({ old: 14, new: null });
    });

    it("detects modified fields", () => {
      const changes = computeChanges(
        { name: "Alice", status: "open" },
        { name: "Alice", status: "closed" },
      );
      expect(changes.status).toEqual({ old: "open", new: "closed" });
      expect(changes.name).toBeUndefined(); // unchanged
    });

    it("returns empty for identical objects", () => {
      const changes = computeChanges(
        { name: "Alice", age: 14 },
        { name: "Alice", age: 14 },
      );
      expect(Object.keys(changes).length).toBe(0);
    });

    it("skips updated_at field", () => {
      const changes = computeChanges(
        { name: "Alice", updated_at: "2024-01-01" },
        { name: "Alice", updated_at: "2024-06-01" },
      );
      expect(changes.updated_at).toBeUndefined();
    });

    it("skips updated_by field", () => {
      const changes = computeChanges(
        { updated_by: "user1" },
        { updated_by: "user2" },
      );
      expect(changes.updated_by).toBeUndefined();
    });

    it("handles nested objects", () => {
      const changes = computeChanges(
        { data: { score: 5 } },
        { data: { score: 8 } },
      );
      expect(changes.data).toEqual({
        old: { score: 5 },
        new: { score: 8 },
      });
    });

    it("handles arrays", () => {
      const changes = computeChanges(
        { tags: ["a", "b"] },
        { tags: ["a", "c"] },
      );
      expect(changes.tags).toEqual({
        old: ["a", "b"],
        new: ["a", "c"],
      });
    });

    it("handles null values", () => {
      const changes = computeChanges(
        { note: null },
        { note: "Something" },
      );
      expect(changes.note).toEqual({ old: null, new: "Something" });
    });
  });
});
