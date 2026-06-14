// ══════════════════════════════════════════════════════════════════════════════
// Tests: Form Governance Service — validation, change computation
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/lib/services/form-governance";
import type { FormFieldDefinition } from "@/types/operations";

const { computeFieldChanges, validateFormData } = _testing;

describe("Form Governance Service", () => {
  // ── Field change computation ──────────────────────────────────────────
  describe("computeFieldChanges", () => {
    it("detects added fields", () => {
      const changes = computeFieldChanges(
        { name: "Test" },
        { name: "Test", priority: "high" },
      );
      expect(changes.priority).toEqual({ old: null, new: "high" });
    });

    it("detects modified fields", () => {
      const changes = computeFieldChanges(
        { status: "draft" },
        { status: "submitted" },
      );
      expect(changes.status).toEqual({ old: "draft", new: "submitted" });
    });

    it("ignores unchanged fields", () => {
      const changes = computeFieldChanges(
        { name: "Test", status: "draft" },
        { name: "Test", status: "submitted" },
      );
      expect(changes.name).toBeUndefined();
      expect(changes.status).toBeDefined();
    });

    it("returns empty for identical data", () => {
      const changes = computeFieldChanges(
        { a: 1, b: "two" },
        { a: 1, b: "two" },
      );
      expect(Object.keys(changes).length).toBe(0);
    });
  });

  // ── Form validation ───────────────────────────────────────────────────
  describe("validateFormData", () => {
    const schema: FormFieldDefinition[] = [
      {
        id: "f1", type: "text", label: "Name", name: "name",
        required: true,
      },
      {
        id: "f2", type: "number", label: "Score", name: "score",
        required: false,
        validation: { min: 1, max: 10 },
      },
      {
        id: "f3", type: "textarea", label: "Notes", name: "notes",
        required: false,
        validation: { min_length: 10, max_length: 500 },
      },
      {
        id: "f4", type: "text", label: "Email", name: "email",
        required: true,
        validation: { pattern: "^[^@]+@[^@]+\\.[^@]+$", message: "Invalid email format" },
      },
    ];

    it("returns no errors for valid data", () => {
      const errors = validateFormData(schema, {
        name: "Alex",
        score: 7,
        notes: "This is a valid note with enough characters",
        email: "alex@example.com",
      });
      expect(errors.length).toBe(0);
    });

    it("catches missing required fields", () => {
      const errors = validateFormData(schema, {
        score: 5,
      });
      expect(errors.some((e) => e.field === "name")).toBe(true);
      expect(errors.some((e) => e.field === "email")).toBe(true);
    });

    it("catches empty string for required fields", () => {
      const errors = validateFormData(schema, {
        name: "",
        email: "test@test.com",
      });
      expect(errors.some((e) => e.field === "name")).toBe(true);
    });

    it("catches number below minimum", () => {
      const errors = validateFormData(schema, {
        name: "Test",
        score: 0,
        email: "test@test.com",
      });
      expect(errors.some((e) => e.field === "score")).toBe(true);
    });

    it("catches number above maximum", () => {
      const errors = validateFormData(schema, {
        name: "Test",
        score: 15,
        email: "test@test.com",
      });
      expect(errors.some((e) => e.field === "score")).toBe(true);
    });

    it("catches string below min_length", () => {
      const errors = validateFormData(schema, {
        name: "Test",
        notes: "Too short",
        email: "test@test.com",
      });
      expect(errors.some((e) => e.field === "notes")).toBe(true);
    });

    it("catches invalid pattern", () => {
      const errors = validateFormData(schema, {
        name: "Test",
        email: "not-an-email",
      });
      expect(errors.some((e) => e.field === "email")).toBe(true);
      expect(errors.find((e) => e.field === "email")?.message).toBe("Invalid email format");
    });

    it("skips validation for empty optional fields", () => {
      const errors = validateFormData(schema, {
        name: "Test",
        email: "test@test.com",
      });
      // score and notes are optional and not provided
      expect(errors.some((e) => e.field === "score")).toBe(false);
      expect(errors.some((e) => e.field === "notes")).toBe(false);
    });

    it("handles conditional fields", () => {
      const conditionalSchema: FormFieldDefinition[] = [
        {
          id: "f1", type: "select", label: "Type", name: "type",
          required: true, options: [
            { label: "Internal", value: "internal" },
            { label: "External", value: "external" },
          ],
        },
        {
          id: "f2", type: "text", label: "External Org", name: "external_org",
          required: true,
          conditional_on: { field: "type", operator: "equals", value: "external" },
        },
      ];

      // When condition is not met, required error should be removed
      const errors = validateFormData(conditionalSchema, {
        type: "internal",
      });
      expect(errors.some((e) => e.field === "external_org")).toBe(false);
    });
  });
});
