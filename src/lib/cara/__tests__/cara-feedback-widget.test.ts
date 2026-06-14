// ══════════════════════════════════════════════════════════════════════════════
// Tests: CaraFeedbackWidget _testing exports
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/components/cara/cara-feedback-widget";

const { NEGATIVE_TAGS } = _testing;

describe("CaraFeedbackWidget", () => {
  describe("NEGATIVE_TAGS", () => {
    it("contains expected feedback categories", () => {
      const ids = NEGATIVE_TAGS.map((t) => t.id);
      expect(ids).toContain("inaccurate");
      expect(ids).toContain("tone");
      expect(ids).toContain("too_long");
      expect(ids).toContain("too_short");
      expect(ids).toContain("missing_context");
      expect(ids).toContain("safeguarding_concern");
      expect(ids).toContain("not_helpful");
    });

    it("has at least 5 tags", () => {
      expect(NEGATIVE_TAGS.length).toBeGreaterThanOrEqual(5);
    });

    it("each tag has id and label", () => {
      for (const tag of NEGATIVE_TAGS) {
        expect(typeof tag.id).toBe("string");
        expect(typeof tag.label).toBe("string");
        expect(tag.id.length).toBeGreaterThan(0);
        expect(tag.label.length).toBeGreaterThan(0);
      }
    });

    it("includes safeguarding_concern tag (critical for care context)", () => {
      const safeguardingTag = NEGATIVE_TAGS.find((t) => t.id === "safeguarding_concern");
      expect(safeguardingTag).toBeDefined();
      expect(safeguardingTag?.label).toBe("Safeguarding concern");
    });

    it("has unique ids", () => {
      const ids = NEGATIVE_TAGS.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
