// ══════════════════════════════════════════════════════════════════════════════
// Tests: /api/cara/write-to-child — pure helpers
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  validateSource,
  validateChildLensScore,
  detectJargon,
  detectBlameLanguage,
  computeChildLensScore,
} from "@/app/api/cara/write-to-child/route";

describe("write-to-child API helpers", () => {
  // ── validateSource ──────────────────────────────────────────────────────
  describe("validateSource", () => {
    it("accepts all valid source types", () => {
      const valid = [
        "incident", "complaint", "missing_from_care", "weekly_summary",
        "direct_work", "management_oversight", "key_work_session",
      ];
      for (const s of valid) {
        expect(validateSource(s)).toBe(true);
      }
    });

    it("rejects invalid strings", () => {
      expect(validateSource("unknown")).toBe(false);
      expect(validateSource("")).toBe(false);
      expect(validateSource("INCIDENT")).toBe(false);
    });

    it("rejects non-string values", () => {
      expect(validateSource(null)).toBe(false);
      expect(validateSource(42)).toBe(false);
    });
  });

  // ── validateChildLensScore ──────────────────────────────────────────────
  describe("validateChildLensScore", () => {
    it("accepts valid score object", () => {
      expect(validateChildLensScore({
        overall: 80, clarity: 85, dignity: 90,
        jargonRisk: 10, blameRisk: 5,
        explanationOfConcern: 75, supportOffered: 80,
      })).toBe(true);
    });

    it("rejects incomplete objects", () => {
      expect(validateChildLensScore({ overall: 80 })).toBe(false);
    });

    it("rejects out-of-range values", () => {
      expect(validateChildLensScore({
        overall: 150, clarity: 85, dignity: 90,
        jargonRisk: 10, blameRisk: 5,
        explanationOfConcern: 75, supportOffered: 80,
      })).toBe(false);
    });

    it("rejects null and non-objects", () => {
      expect(validateChildLensScore(null)).toBe(false);
      expect(validateChildLensScore("string")).toBe(false);
    });
  });

  // ── detectJargon ────────────────────────────────────────────────────────
  describe("detectJargon", () => {
    it("detects professional jargon", () => {
      const text = "The de-escalation was proportionate to the risk assessment findings.";
      const jargon = detectJargon(text);
      expect(jargon).toContain("de-escalation");
      expect(jargon).toContain("proportionate");
      expect(jargon).toContain("risk assessment");
    });

    it("returns empty array for jargon-free text", () => {
      const text = "We are glad you are safe and we want to help.";
      expect(detectJargon(text)).toHaveLength(0);
    });

    it("detects safeguarding jargon", () => {
      const text = "A strategy discussion was held regarding the Section 47 investigation.";
      const jargon = detectJargon(text);
      expect(jargon).toContain("strategy discussion");
      expect(jargon).toContain("Section 47");
    });
  });

  // ── detectBlameLanguage ─────────────────────────────────────────────────
  describe("detectBlameLanguage", () => {
    it("detects blame patterns", () => {
      const text = "You caused the damage and your fault for not listening.";
      const blame = detectBlameLanguage(text);
      expect(blame.length).toBeGreaterThan(0);
    });

    it("returns empty for neutral language", () => {
      const text = "Things were difficult and we want to understand what happened.";
      expect(detectBlameLanguage(text)).toHaveLength(0);
    });

    it("detects aggressive labelling", () => {
      const text = "You were aggressive and refused to cooperate.";
      const blame = detectBlameLanguage(text);
      expect(blame.length).toBeGreaterThan(0);
    });
  });

  // ── computeChildLensScore ───────────────────────────────────────────────
  describe("computeChildLensScore", () => {
    it("returns all 7 score categories", () => {
      const score = computeChildLensScore("We care about you and want to help.");
      expect(typeof score.overall).toBe("number");
      expect(typeof score.clarity).toBe("number");
      expect(typeof score.dignity).toBe("number");
      expect(typeof score.jargonRisk).toBe("number");
      expect(typeof score.blameRisk).toBe("number");
      expect(typeof score.explanationOfConcern).toBe("number");
      expect(typeof score.supportOffered).toBe("number");
    });

    it("scores jargon-free text with low jargon risk", () => {
      const score = computeChildLensScore("We are glad you are safe. We can help you.");
      expect(score.jargonRisk).toBe(0);
    });

    it("scores jargon-heavy text with high jargon risk", () => {
      const score = computeChildLensScore("A multi-agency strategy discussion regarding the risk assessment was proportionate to the safeguarding referral and statutory duty of care.");
      expect(score.jargonRisk).toBeGreaterThan(30);
    });

    it("scores blame-free text with low blame risk", () => {
      const score = computeChildLensScore("Things were difficult and we understand.");
      expect(score.blameRisk).toBe(0);
    });

    it("scores blaming text with high blame risk", () => {
      const score = computeChildLensScore("You caused this. It was your fault because of your bad behaviour.");
      expect(score.blameRisk).toBeGreaterThan(30);
    });

    it("scores supportive text highly for support offered", () => {
      const score = computeChildLensScore("We are here for you. You can talk to us anytime. We can help you feel safe and support you.");
      expect(score.supportOffered).toBeGreaterThan(50);
    });

    it("all scores are between 0 and 100", () => {
      const texts = [
        "Simple short text.",
        "We want to help you because we are worried. You can talk to us. We are here for you and want you to feel safe and support you.",
        "Multi-agency strategy discussion proportionate risk assessment safeguarding referral. You caused this, your fault, you refused, you were aggressive.",
      ];
      for (const text of texts) {
        const score = computeChildLensScore(text);
        for (const [, value] of Object.entries(score)) {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(100);
        }
      }
    });

    it("overall score reflects weighted components", () => {
      const goodScore = computeChildLensScore("We care about you because we are worried. We are here for you and can help you feel safe. You can talk to us anytime.");
      const badScore = computeChildLensScore("Multi-agency strategy discussion proportionate risk assessment. You caused this, your fault, you refused.");
      expect(goodScore.overall).toBeGreaterThan(badScore.overall);
    });
  });
});
