import { describe, it, expect } from "vitest";
import {
  scoreRecordingQuality,
  scoreBatch,
  GRADE_LABELS,
  type RecordingInput,
} from "../recording-quality";

// ── Test Data ────────────────────────────────────────────────────────────────

const EXCELLENT_ENTRY: RecordingInput = {
  content: `Jordan had a difficult morning. At 8:15am, he refused breakfast and said "I don't want to be around anyone today." Staff member Pat used a PACE approach — acknowledged Jordan's feelings without pushing. Body language was tense, fists clenched. At 10:00am, Jordan came downstairs voluntarily and appeared calmer. His facial expression had softened. He chose to join the cooking activity and made pasta from scratch. His mood lifted noticeably over the next 45 minutes — he smiled when others complimented the food. Said "I actually enjoyed that." Tone of voice was relaxed and warm. Follow-up: monitor mood tomorrow morning. Key worker to check in during afternoon shift. Update care plan with cooking as a positive coping strategy. Shared at handover with night staff.`,
  entryType: "general",
  moodScore: 3,
  isSignificant: false,
  childName: "Jordan P",
};

const GOOD_ENTRY: RecordingInput = {
  content: `Sam had a phone call with mum at 5pm. Was anxious beforehand. Call lasted 20 minutes and went well. Sam said "she asked about my DofE." No distress observed after the call. Will monitor mood over next 24 hours.`,
  entryType: "contact",
  moodScore: 3,
};

const ADEQUATE_ENTRY: RecordingInput = {
  content: `Alex went to school today. Had a good day according to teacher feedback. Came home in a positive mood and did homework without being asked. Had tea with everyone.`,
  entryType: "education",
  moodScore: 4,
};

const POOR_ENTRY: RecordingInput = {
  content: `Good day. Nothing happened.`,
  entryType: "general",
};

const SIGNIFICANT_NO_ACTION: RecordingInput = {
  content: `Jordan kicked off at bedtime. Was really angry.`,
  entryType: "incident",
  isSignificant: true,
};

// ── scoreRecordingQuality Tests ──────────────────────────────────────────────

describe("Recording Quality Scorer", () => {
  describe("scoreRecordingQuality", () => {
    it("scores an excellent entry above 80", () => {
      const result = scoreRecordingQuality(EXCELLENT_ENTRY);
      expect(result.overall).toBeGreaterThanOrEqual(80);
      expect(result.grade).toBe("excellent");
    });

    it("scores a good entry between 65 and 85", () => {
      const result = scoreRecordingQuality(GOOD_ENTRY);
      expect(result.overall).toBeGreaterThanOrEqual(65);
      expect(result.overall).toBeLessThanOrEqual(85);
    });

    it("scores an adequate entry between 40 and 75", () => {
      const result = scoreRecordingQuality(ADEQUATE_ENTRY);
      expect(result.overall).toBeGreaterThanOrEqual(40);
      expect(result.overall).toBeLessThanOrEqual(75);
    });

    it("scores a poor entry below 50", () => {
      const result = scoreRecordingQuality(POOR_ENTRY);
      expect(result.overall).toBeLessThan(50);
      expect(["needs_improvement", "insufficient"]).toContain(result.grade);
    });

    it("returns 6 quality dimensions", () => {
      const result = scoreRecordingQuality(EXCELLENT_ENTRY);
      expect(result.dimensions).toHaveLength(6);
    });

    it("dimension names match expected set", () => {
      const result = scoreRecordingQuality(EXCELLENT_ENTRY);
      const names = result.dimensions.map((d) => d.name);
      expect(names).toContain("Detail");
      expect(names).toContain("Child Voice");
      expect(names).toContain("Factual Clarity");
      expect(names).toContain("Actionability");
      expect(names).toContain("Emotional Context");
      expect(names).toContain("Framework Awareness");
    });

    it("each dimension score is 0-100", () => {
      const result = scoreRecordingQuality(EXCELLENT_ENTRY);
      for (const dim of result.dimensions) {
        expect(dim.score).toBeGreaterThanOrEqual(0);
        expect(dim.score).toBeLessThanOrEqual(100);
      }
    });

    it("detects child voice in direct quotes", () => {
      const result = scoreRecordingQuality(EXCELLENT_ENTRY);
      expect(result.hasChildVoice).toBe(true);
    });

    it("does not detect child voice when absent", () => {
      const result = scoreRecordingQuality(ADEQUATE_ENTRY);
      expect(result.hasChildVoice).toBe(false);
    });

    it("detects actionable content with follow-up language", () => {
      const result = scoreRecordingQuality(EXCELLENT_ENTRY);
      expect(result.hasActionableContent).toBe(true);
    });

    it("flags significant entries without actions", () => {
      const result = scoreRecordingQuality(SIGNIFICANT_NO_ACTION);
      expect(result.suggestions.length).toBeGreaterThan(0);
      const hasActionSuggestion = result.suggestions.some(
        (s) => s.toLowerCase().includes("follow-up") || s.toLowerCase().includes("action") || s.toLowerCase().includes("next shift")
      );
      expect(hasActionSuggestion).toBe(true);
    });

    it("reports word count accurately", () => {
      const result = scoreRecordingQuality(POOR_ENTRY);
      expect(result.wordCount).toBe(4); // "Good day. Nothing happened."
    });

    it("word count for excellent entry is substantial", () => {
      const result = scoreRecordingQuality(EXCELLENT_ENTRY);
      expect(result.wordCount).toBeGreaterThan(100);
    });

    it("identifies strengths in excellent entries", () => {
      const result = scoreRecordingQuality(EXCELLENT_ENTRY);
      expect(result.strengths.length).toBeGreaterThan(0);
    });

    it("provides suggestions for poor entries", () => {
      const result = scoreRecordingQuality(POOR_ENTRY);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it("capped at maximum 4 suggestions", () => {
      const result = scoreRecordingQuality(POOR_ENTRY);
      expect(result.suggestions.length).toBeLessThanOrEqual(4);
    });

    it("handles empty content gracefully", () => {
      const result = scoreRecordingQuality({ content: "", entryType: "general" });
      expect(result.overall).toBeLessThan(30);
      expect(result.wordCount).toBe(0);
      expect(result.grade).toBe("insufficient");
    });

    it("mood score presence improves emotional context dimension", () => {
      const withMood = scoreRecordingQuality({ content: "Alex had a calm day.", entryType: "general", moodScore: 4 });
      const withoutMood = scoreRecordingQuality({ content: "Alex had a calm day.", entryType: "general" });
      const emotionalWithMood = withMood.dimensions.find((d) => d.name === "Emotional Context")!;
      const emotionalWithout = withoutMood.dimensions.find((d) => d.name === "Emotional Context")!;
      expect(emotionalWithMood.score).toBeGreaterThanOrEqual(emotionalWithout.score);
    });

    it("opinion language reduces factual clarity score", () => {
      const opinionHeavy = scoreRecordingQuality({
        content: "I think Jordan is probably always going to struggle with mornings. In my opinion he never handles routines well. I feel like everyone finds it hard to work with him.",
        entryType: "general",
      });
      const factual = scoreRecordingQuality({
        content: "Jordan refused breakfast at 8:15am. He went to his room and stayed there for 105 minutes. At 10:00am he came downstairs. His facial expression appeared calmer.",
        entryType: "general",
      });
      const opinionFactual = opinionHeavy.dimensions.find((d) => d.name === "Factual Clarity")!;
      const factualClarity = factual.dimensions.find((d) => d.name === "Factual Clarity")!;
      expect(factualClarity.score).toBeGreaterThan(opinionFactual.score);
    });

    it("regulatory language improves framework awareness for significant entries", () => {
      const withReg = scoreRecordingQuality({
        content: "Applied de-escalation as per behaviour support plan. PACE approach used. Risk assessment reviewed post-incident. Safeguarding not indicated.",
        entryType: "incident",
        isSignificant: true,
      });
      const withoutReg = scoreRecordingQuality({
        content: "Dealt with the situation. Calmed him down. Everything fine now.",
        entryType: "incident",
        isSignificant: true,
      });
      const regWith = withReg.dimensions.find((d) => d.name === "Framework Awareness")!;
      const regWithout = withoutReg.dimensions.find((d) => d.name === "Framework Awareness")!;
      expect(regWith.score).toBeGreaterThan(regWithout.score);
    });
  });

  // ── Grade boundaries ─────────────────────────────────────────────────────

  describe("grading", () => {
    it("excellent grade for score >= 85", () => {
      const result = scoreRecordingQuality(EXCELLENT_ENTRY);
      if (result.overall >= 85) expect(result.grade).toBe("excellent");
    });

    it("grade labels exist for all grades", () => {
      const grades = ["excellent", "good", "adequate", "needs_improvement", "insufficient"] as const;
      for (const g of grades) {
        expect(GRADE_LABELS[g]).toBeDefined();
        expect(GRADE_LABELS[g].label).toBeTruthy();
        expect(GRADE_LABELS[g].colour).toBeTruthy();
      }
    });
  });

  // ── Batch scoring ─────────────────────────────────────────────────────────

  describe("scoreBatch", () => {
    it("returns correct structure for empty input", () => {
      const result = scoreBatch([]);
      expect(result.totalRecords).toBe(0);
      expect(result.averageScore).toBe(0);
      expect(result.averageGrade).toBe("insufficient");
    });

    it("averages scores across multiple records", () => {
      const result = scoreBatch([EXCELLENT_ENTRY, POOR_ENTRY]);
      expect(result.totalRecords).toBe(2);
      expect(result.averageScore).toBeGreaterThan(0);
      expect(result.averageScore).toBeLessThan(100);
    });

    it("counts child voice presence", () => {
      const result = scoreBatch([EXCELLENT_ENTRY, GOOD_ENTRY, ADEQUATE_ENTRY]);
      expect(result.childVoicePresent).toBe(2); // excellent + good have quotes
      expect(result.childVoicePercent).toBe(67);
    });

    it("computes grade distribution", () => {
      const result = scoreBatch([EXCELLENT_ENTRY, GOOD_ENTRY, POOR_ENTRY]);
      const totalDistribution = Object.values(result.gradeDistribution).reduce((sum, v) => sum + v, 0);
      expect(totalDistribution).toBe(3);
    });

    it("identifies top suggestions", () => {
      const result = scoreBatch([POOR_ENTRY, SIGNIFICANT_NO_ACTION, ADEQUATE_ENTRY]);
      expect(result.topSuggestions.length).toBeGreaterThan(0);
      expect(result.topSuggestions.length).toBeLessThanOrEqual(3);
    });

    it("reports actionable percentage", () => {
      const result = scoreBatch([EXCELLENT_ENTRY, POOR_ENTRY]);
      expect(result.actionablePercent).toBeGreaterThanOrEqual(0);
      expect(result.actionablePercent).toBeLessThanOrEqual(100);
    });
  });
});
