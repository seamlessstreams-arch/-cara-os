// ══════════════════════════════════════════════════════════════════════════════
// Tests: CaraDocumentIntelligence _testing exports
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/components/cara/cara-document-intelligence";

const { STATUS_CONFIG, CATEGORY_CONFIG, getDemoDocuments } = _testing;

describe("CaraDocumentIntelligence", () => {
  describe("STATUS_CONFIG", () => {
    it("has all five document statuses", () => {
      expect(STATUS_CONFIG.current).toBeDefined();
      expect(STATUS_CONFIG.expiring_soon).toBeDefined();
      expect(STATUS_CONFIG.expired).toBeDefined();
      expect(STATUS_CONFIG.missing).toBeDefined();
      expect(STATUS_CONFIG.review_due).toBeDefined();
    });

    it("each status has label, colour, bg, and icon", () => {
      for (const [, cfg] of Object.entries(STATUS_CONFIG)) {
        expect(cfg.label).toBeTruthy();
        expect(cfg.colour).toBeTruthy();
        expect(cfg.bg).toBeTruthy();
        expect(cfg.icon).toBeTruthy();
      }
    });
  });

  describe("CATEGORY_CONFIG", () => {
    it("has all 8 document categories", () => {
      const cats = ["policy", "certificate", "insurance", "registration", "training_record", "dbs_check", "care_document", "ofsted"];
      for (const c of cats) {
        expect(CATEGORY_CONFIG[c as keyof typeof CATEGORY_CONFIG]).toBeDefined();
      }
    });
  });

  describe("getDemoDocuments", () => {
    const docs = getDemoDocuments();

    it("returns multiple documents", () => {
      expect(docs.length).toBeGreaterThan(8);
    });

    it("each document has required fields", () => {
      for (const d of docs) {
        expect(d.id).toBeTruthy();
        expect(d.category).toBeTruthy();
        expect(d.name).toBeTruthy();
        expect(["current", "expiring_soon", "expired", "missing", "review_due"]).toContain(d.status);
        expect(d.owner).toBeTruthy();
      }
    });

    it("includes documents at different statuses", () => {
      const statuses = new Set(docs.map((d) => d.status));
      expect(statuses.size).toBeGreaterThanOrEqual(3);
    });

    it("includes multiple categories", () => {
      const categories = new Set(docs.map((d) => d.category));
      expect(categories.size).toBeGreaterThanOrEqual(4);
    });

    it("expiring documents have valid expiry data", () => {
      const expiring = docs.filter((d) => d.status === "expiring_soon");
      for (const d of expiring) {
        expect(d.expiryDate).toBeTruthy();
        expect(d.daysUntilExpiry).toBeGreaterThan(0);
      }
    });

    it("some documents have Cara notes", () => {
      const withNotes = docs.filter((d) => d.caraNotes);
      expect(withNotes.length).toBeGreaterThan(0);
    });

    it("includes a missing document", () => {
      expect(docs.some((d) => d.status === "missing")).toBe(true);
    });
  });
});
