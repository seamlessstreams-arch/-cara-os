// ══════════════════════════════════════════════════════════════════════════════
// Tests: CaraOversightQuality _testing exports
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/components/cara/cara-oversight-quality";

const {
  DIMENSION_CONFIG,
  DIMENSION_ORDER,
  computeOversightScore,
  generateSuggestions,
  getGrade,
  REFLECTIVE_PHRASES,
  CHILD_FOCUS_PHRASES,
  CHALLENGE_PHRASES,
  DECISION_PHRASES,
  ACTION_PATTERNS,
} = _testing;

describe("CaraOversightQuality", () => {
  // ── Config ────────────────────────────────────────────────────────────────
  describe("DIMENSION_CONFIG", () => {
    it("has all 5 dimensions", () => {
      const dims = [
        "reflectiveAnalysis", "childFocus", "professionalChallenge",
        "decisionClarity", "actionSpecificity",
      ];
      for (const d of dims) {
        expect(DIMENSION_CONFIG[d as keyof typeof DIMENSION_CONFIG]).toBeDefined();
      }
    });

    it("each dimension has label, icon, description, colour, bg", () => {
      for (const [, cfg] of Object.entries(DIMENSION_CONFIG)) {
        expect(cfg.label).toBeTruthy();
        expect(cfg.icon).toBeTruthy();
        expect(cfg.description).toBeTruthy();
        expect(cfg.colour).toBeTruthy();
        expect(cfg.bg).toBeTruthy();
      }
    });
  });

  describe("DIMENSION_ORDER", () => {
    it("contains exactly 5 dimensions", () => {
      expect(DIMENSION_ORDER).toHaveLength(5);
    });
  });

  // ── Detection phrase arrays ───────────────────────────────────────────────
  describe("detection phrases", () => {
    it("REFLECTIVE_PHRASES has entries", () => {
      expect(REFLECTIVE_PHRASES.length).toBeGreaterThan(10);
    });

    it("CHILD_FOCUS_PHRASES has entries", () => {
      expect(CHILD_FOCUS_PHRASES.length).toBeGreaterThan(10);
    });

    it("CHALLENGE_PHRASES has entries", () => {
      expect(CHALLENGE_PHRASES.length).toBeGreaterThan(10);
    });

    it("DECISION_PHRASES has entries", () => {
      expect(DECISION_PHRASES.length).toBeGreaterThan(10);
    });

    it("ACTION_PATTERNS has regex entries", () => {
      expect(ACTION_PATTERNS.length).toBeGreaterThan(3);
      for (const p of ACTION_PATTERNS) {
        expect(p).toBeInstanceOf(RegExp);
      }
    });
  });

  // ── getGrade ──────────────────────────────────────────────────────────────
  describe("getGrade", () => {
    it("returns Outstanding for 80+", () => {
      expect(getGrade(80).label).toBe("Outstanding");
      expect(getGrade(100).label).toBe("Outstanding");
    });

    it("returns Good for 60-79", () => {
      expect(getGrade(60).label).toBe("Good");
      expect(getGrade(79).label).toBe("Good");
    });

    it("returns Requires Improvement for 40-59", () => {
      expect(getGrade(40).label).toBe("Requires Improvement");
      expect(getGrade(59).label).toBe("Requires Improvement");
    });

    it("returns Inadequate for below 40", () => {
      expect(getGrade(0).label).toBe("Inadequate");
      expect(getGrade(39).label).toBe("Inadequate");
    });
  });

  // ── computeOversightScore ─────────────────────────────────────────────────
  describe("computeOversightScore", () => {
    it("returns all 5 dimension scores + overall", () => {
      const score = computeOversightScore("I have reflected on this incident and the child expressed feeling worried. I have decided to increase checks. Action: staff to review by Friday.");
      expect(typeof score.overall).toBe("number");
      expect(typeof score.reflectiveAnalysis).toBe("number");
      expect(typeof score.childFocus).toBe("number");
      expect(typeof score.professionalChallenge).toBe("number");
      expect(typeof score.decisionClarity).toBe("number");
      expect(typeof score.actionSpecificity).toBe("number");
    });

    it("returns low scores for empty/short text", () => {
      const score = computeOversightScore("Noted.");
      expect(score.overall).toBe(0);
      expect(score.flags.length).toBeGreaterThan(0);
    });

    it("returns low scores for generic text without analysis", () => {
      const score = computeOversightScore("The incident was discussed at the team meeting. Everyone was informed and we will monitor the situation going forward.");
      expect(score.reflectiveAnalysis).toBeLessThan(60);
      expect(score.childFocus).toBeLessThan(30);
    });

    it("returns high reflective score for analytical text", () => {
      const score = computeOversightScore(
        "I have reflected on this incident and the significance of the pattern here is concerning. " +
        "This suggests a deeper issue with emotional regulation. My analysis indicates that the triggers " +
        "relate to contact arrangements. Having considered the evidence, upon review critically this raises " +
        "questions about whether the current support plan is adequate."
      );
      expect(score.reflectiveAnalysis).toBeGreaterThan(50);
    });

    it("returns high child focus score when child-centred", () => {
      const score = computeOversightScore(
        "The child's voice was central to this review. The child expressed feeling unsafe after the incident. " +
        "The child's experience shows that their needs around safety are not being fully met. " +
        "From the child's point of view, the response did not address their feelings. The young person said " +
        "they felt scared and wanted more support."
      );
      expect(score.childFocus).toBeGreaterThan(50);
    });

    it("returns high challenge score when practice is challenged", () => {
      const score = computeOversightScore(
        "I have challenged the team on the delay in completing the risk assessment. " +
        "This is not acceptable and falls short of the standard required. " +
        "I am not satisfied with the initial response. What could have been done differently " +
        "is an earlier escalation. My expectation is that this will be completed within 24 hours."
      );
      expect(score.professionalChallenge).toBeGreaterThan(50);
    });

    it("returns high decision score when decisions are clear", () => {
      const score = computeOversightScore(
        "I have decided that additional supervision checks will be put in place. " +
        "The rationale for this decision is based on the repeated pattern of incidents. " +
        "I have authorised enhanced monitoring. On balance, having weighed the evidence, " +
        "I have concluded the current plan needs revision."
      );
      expect(score.decisionClarity).toBeGreaterThan(50);
    });

    it("returns high action score when actions are SMART", () => {
      const score = computeOversightScore(
        "Action assigned to Sarah M: will complete the updated risk assessment by 15/01/2026. " +
        "Action for team lead: will ensure daily check-ins within 3 days. " +
        "Named responsible person: Deputy Manager. Task deadline is Monday."
      );
      expect(score.actionSpecificity).toBeGreaterThan(50);
    });

    it("flags missing child focus", () => {
      const score = computeOversightScore(
        "The staff handled the situation well. The team responded promptly and followed procedures. " +
        "No further action required at this time. The matter is resolved."
      );
      const childFlag = score.flags.find((f) => f.dimension === "childFocus");
      expect(childFlag).toBeDefined();
    });

    it("all scores are between 0 and 100", () => {
      const texts = [
        "Short.",
        "The child said they felt worried. I have decided to increase checks. Action: review by Friday. I have challenged the delay. This suggests a pattern.",
        "I have reflected on this incident. The child's experience is central. I have challenged the team. I have decided on enhanced monitoring. Action assigned to Sarah by 15/01/2026 within 3 days. Named responsible person: team lead. Will ensure completion immediately.",
      ];
      for (const text of texts) {
        const score = computeOversightScore(text);
        for (const dim of DIMENSION_ORDER) {
          expect(score[dim]).toBeGreaterThanOrEqual(0);
          expect(score[dim]).toBeLessThanOrEqual(100);
        }
        expect(score.overall).toBeGreaterThanOrEqual(0);
        expect(score.overall).toBeLessThanOrEqual(100);
      }
    });

    it("good oversight scores higher than poor oversight", () => {
      const good = computeOversightScore(
        "I have reflected on this incident and the significance of the pattern is concerning. " +
        "The child expressed feeling scared and their needs are not being met. " +
        "I have challenged the team on the delay. I have decided on enhanced monitoring. " +
        "Action assigned to Sarah by 15/01/2026."
      );
      const poor = computeOversightScore(
        "Incident discussed. Team informed. Will monitor."
      );
      expect(good.overall).toBeGreaterThan(poor.overall);
    });
  });

  // ── generateSuggestions ───────────────────────────────────────────────────
  describe("generateSuggestions", () => {
    it("generates suggestions for weak oversight", () => {
      const score = computeOversightScore("The incident was noted. No further action at this time.");
      const suggestions = generateSuggestions(score);
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it("generates fewer suggestions for strong oversight", () => {
      const weakScore = computeOversightScore("Noted.");
      const strongScore = computeOversightScore(
        "I have reflected on this incident and the significance of the pattern is concerning. " +
        "The child expressed feeling scared and their needs are not being met. " +
        "I have challenged the team on the delay. I have decided on enhanced monitoring. " +
        "Action assigned to Sarah by 15/01/2026. Will complete review within 3 days."
      );
      const weakSuggestions = generateSuggestions(weakScore);
      const strongSuggestions = generateSuggestions(strongScore);
      expect(weakSuggestions.length).toBeGreaterThanOrEqual(strongSuggestions.length);
    });

    it("suggestions are sorted by priority", () => {
      const score = computeOversightScore("The incident was noted.");
      const suggestions = generateSuggestions(score);
      if (suggestions.length >= 2) {
        const priorities = suggestions.map((s) => s.priority);
        const order = { high: 0, medium: 1, low: 2 };
        for (let i = 1; i < priorities.length; i++) {
          expect(order[priorities[i]]).toBeGreaterThanOrEqual(order[priorities[i - 1]]);
        }
      }
    });

    it("each suggestion has dimension, text, and priority", () => {
      const score = computeOversightScore("Brief note.");
      const suggestions = generateSuggestions(score);
      for (const s of suggestions) {
        expect(s.dimension).toBeTruthy();
        expect(s.text).toBeTruthy();
        expect(["high", "medium", "low"]).toContain(s.priority);
      }
    });
  });
});
