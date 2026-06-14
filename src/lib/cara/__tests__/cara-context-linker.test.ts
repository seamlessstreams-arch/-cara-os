// ══════════════════════════════════════════════════════════════════════════════
// Tests: CaraContextLinker _testing exports
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/components/cara/cara-context-linker";

const { TABLE_CONFIG, RELATIONSHIP_LABELS, STATUS_CONFIG, getDemoLinks } = _testing;

describe("CaraContextLinker", () => {
  describe("TABLE_CONFIG", () => {
    it("has at least 8 record types", () => {
      expect(Object.keys(TABLE_CONFIG).length).toBeGreaterThanOrEqual(8);
    });

    it("includes core record types", () => {
      expect(TABLE_CONFIG.incidents).toBeDefined();
      expect(TABLE_CONFIG.daily_log_entries).toBeDefined();
      expect(TABLE_CONFIG.supervisions).toBeDefined();
      expect(TABLE_CONFIG.safeguarding_concerns).toBeDefined();
      expect(TABLE_CONFIG.care_plans).toBeDefined();
      expect(TABLE_CONFIG.key_work_sessions).toBeDefined();
    });

    it("each config has label, icon, colour, and href function", () => {
      for (const [key, config] of Object.entries(TABLE_CONFIG)) {
        expect(config.label).toBeTruthy();
        expect(config.icon).toBeTruthy();
        expect(config.colour).toBeTruthy();
        expect(typeof config.href).toBe("function");
        // Verify href produces a string
        expect(typeof config.href("test-id")).toBe("string");
      }
    });
  });

  describe("RELATIONSHIP_LABELS", () => {
    it("has common relationship types", () => {
      expect(RELATIONSHIP_LABELS.triggered_by).toBe("Triggered by");
      expect(RELATIONSHIP_LABELS.relates_to).toBe("Relates to");
      expect(RELATIONSHIP_LABELS.informs).toBe("Informs");
      expect(RELATIONSHIP_LABELS.requires_review_of).toBe("Requires review of");
      expect(RELATIONSHIP_LABELS.evidence_for).toBe("Evidence for");
    });

    it("has at least 7 relationship types", () => {
      expect(Object.keys(RELATIONSHIP_LABELS).length).toBeGreaterThanOrEqual(7);
    });
  });

  describe("STATUS_CONFIG", () => {
    it("has all statuses", () => {
      expect(STATUS_CONFIG.active).toBeDefined();
      expect(STATUS_CONFIG.verified).toBeDefined();
      expect(STATUS_CONFIG.dismissed).toBeDefined();
      expect(STATUS_CONFIG.expired).toBeDefined();
    });
  });

  describe("getDemoLinks", () => {
    it("returns links for incidents", () => {
      const links = getDemoLinks("incidents", "inc_042");
      expect(links.length).toBeGreaterThan(0);
    });

    it("returns empty for unknown table", () => {
      const links = getDemoLinks("unknown_table", "some_id");
      expect(links).toHaveLength(0);
    });

    it("incident links reference the correct source", () => {
      const links = getDemoLinks("incidents", "inc_042");
      for (const link of links) {
        if (link.direction === "outgoing") {
          expect(link.sourceTable).toBe("incidents");
          expect(link.sourceId).toBe("inc_042");
        } else {
          expect(link.targetTable).toBe("incidents");
          expect(link.targetId).toBe("inc_042");
        }
      }
    });

    it("each link has required fields", () => {
      const links = getDemoLinks("incidents", "inc_042");
      for (const link of links) {
        expect(link.id).toBeTruthy();
        expect(link.direction).toMatch(/^(outgoing|incoming)$/);
        expect(link.confidence).toBeGreaterThan(0);
        expect(link.confidence).toBeLessThanOrEqual(100);
        expect(link.description).toBeTruthy();
        expect(link.createdBy).toMatch(/^(cara|user)$/);
      }
    });

    it("includes both outgoing and incoming links", () => {
      const links = getDemoLinks("incidents", "inc_042");
      const outgoing = links.filter((l) => l.direction === "outgoing");
      const incoming = links.filter((l) => l.direction === "incoming");
      expect(outgoing.length).toBeGreaterThan(0);
      expect(incoming.length).toBeGreaterThan(0);
    });
  });
});
