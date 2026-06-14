// ══════════════════════════════════════════════════════════════════════════════
// Tests: /api/cara/context-links — pure helpers
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  validateTableName,
  validateRecordId,
  getDemoLinks,
} from "@/app/api/cara/context-links/route";

describe("context-links API helpers", () => {
  // ── validateTableName ───────────────────────────────────────────────────
  describe("validateTableName", () => {
    it("accepts lowercase snake_case table names", () => {
      expect(validateTableName("incidents")).toBe(true);
      expect(validateTableName("daily_log_entries")).toBe(true);
      expect(validateTableName("risk_assessments")).toBe(true);
    });

    it("rejects non-string values", () => {
      expect(validateTableName(null)).toBe(false);
      expect(validateTableName(undefined)).toBe(false);
      expect(validateTableName(123)).toBe(false);
    });

    it("rejects names with uppercase or special characters", () => {
      expect(validateTableName("Incidents")).toBe(false);
      expect(validateTableName("drop table;")).toBe(false);
      expect(validateTableName("users-table")).toBe(false);
      expect(validateTableName("table.name")).toBe(false);
    });

    it("rejects empty string", () => {
      expect(validateTableName("")).toBe(false);
    });

    it("rejects names longer than 64 characters", () => {
      expect(validateTableName("a".repeat(65))).toBe(false);
      expect(validateTableName("a".repeat(64))).toBe(true);
    });
  });

  // ── validateRecordId ────────────────────────────────────────────────────
  describe("validateRecordId", () => {
    it("accepts valid record IDs", () => {
      expect(validateRecordId("inc_001")).toBe(true);
      expect(validateRecordId("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
      expect(validateRecordId("1")).toBe(true);
    });

    it("rejects non-string values", () => {
      expect(validateRecordId(null)).toBe(false);
      expect(validateRecordId(undefined)).toBe(false);
      expect(validateRecordId(42)).toBe(false);
    });

    it("rejects empty string", () => {
      expect(validateRecordId("")).toBe(false);
    });

    it("rejects strings longer than 128 characters", () => {
      expect(validateRecordId("x".repeat(129))).toBe(false);
      expect(validateRecordId("x".repeat(128))).toBe(true);
    });
  });

  // ── getDemoLinks ────────────────────────────────────────────────────────
  describe("getDemoLinks", () => {
    it("returns links for incidents table", () => {
      const links = getDemoLinks("incidents", "inc_099");
      expect(links.length).toBeGreaterThan(0);
    });

    it("populates sourceId from the supplied recordId", () => {
      const links = getDemoLinks("incidents", "inc_042");
      for (const link of links) {
        expect(link.sourceId).toBe("inc_042");
        expect(link.sourceTable).toBe("incidents");
      }
    });

    it("each link has required fields", () => {
      const links = getDemoLinks("incidents", "inc_001");
      for (const link of links) {
        expect(link.id).toBeTruthy();
        expect(link.direction).toBeTruthy();
        expect(link.targetTable).toBeTruthy();
        expect(link.targetId).toBeTruthy();
        expect(link.relationshipType).toBeTruthy();
        expect(link.description).toBeTruthy();
        expect(typeof link.confidence).toBe("number");
        expect(["active", "verified", "dismissed", "expired"]).toContain(link.status);
      }
    });

    it("returns empty array for unknown tables", () => {
      expect(getDemoLinks("supervisions", "sup_001")).toEqual([]);
      expect(getDemoLinks("unknown_table", "x")).toEqual([]);
    });
  });
});
