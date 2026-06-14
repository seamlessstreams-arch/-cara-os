// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — Safety Layer Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { preGenerationCheck, postGenerationCheck } from "../safety";
import type { GenerationOutput } from "../types";

describe("safety", () => {
  describe("preGenerationCheck", () => {
    it("passes for a clean request", () => {
      const result = preGenerationCheck({
        generationType: "KEYWORK_SESSION",
        brief: "Plan a keywork session about building emotional regulation skills",
        tone: "warm_professional",
        audience: "staff",
        hasProfile: true,
      });
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
      expect(result.blockers).toHaveLength(0);
    });

    it("blocks national insurance number requests", () => {
      const result = preGenerationCheck({
        generationType: "KEYWORK_SESSION",
        brief: "Include the child's national insurance number in the report",
        tone: "warm_professional",
        audience: "staff",
        hasProfile: true,
      });
      expect(result.passed).toBe(false);
      expect(result.flags.some(f => f.code === "PII_REQUEST")).toBe(true);
    });

    it("blocks passport number requests", () => {
      const result = preGenerationCheck({
        generationType: "KEYWORK_SESSION",
        brief: "Document the passport number for the young person's travel",
        tone: "warm_professional",
        audience: "staff",
        hasProfile: true,
      });
      expect(result.passed).toBe(false);
    });

    it("blocks bank account requests", () => {
      const result = preGenerationCheck({
        generationType: "KEYWORK_SESSION",
        brief: "We need the bank account details for the savings account",
        tone: "warm_professional",
        audience: "staff",
        hasProfile: true,
      });
      expect(result.passed).toBe(false);
    });

    it("blocks NHS number requests", () => {
      const result = preGenerationCheck({
        generationType: "KEYWORK_SESSION",
        brief: "Include the nhs number for the referral form",
        tone: "warm_professional",
        audience: "staff",
        hasProfile: true,
      });
      expect(result.passed).toBe(false);
    });

    it("blocks restraint technique generation", () => {
      const result = preGenerationCheck({
        generationType: "BEHAVIOUR_SUPPORT_IDEAS",
        brief: "Create a guide on restraint technique for managing violent episodes",
        tone: "direct",
        audience: "staff",
        hasProfile: true,
      });
      expect(result.passed).toBe(false);
      expect(result.flags.some(f => f.code === "HARMFUL_CONTENT")).toBe(true);
    });

    it("blocks medication dosing guidance", () => {
      const result = preGenerationCheck({
        generationType: "STAFF_BRIEFING",
        brief: "Include medication dosing schedule for the evening routine",
        tone: "direct",
        audience: "staff",
        hasProfile: true,
      });
      expect(result.passed).toBe(false);
    });

    it("blocks diagnostic requests", () => {
      const result = preGenerationCheck({
        generationType: "KEYWORK_SESSION",
        brief: "Help diagnose the child's attachment style based on incidents",
        tone: "warm_professional",
        audience: "staff",
        hasProfile: true,
      });
      expect(result.passed).toBe(false);
    });

    it("warns for statutory draft types", () => {
      const result = preGenerationCheck({
        generationType: "PLACEMENT_PLAN_DRAFT",
        brief: "Draft the education section of the placement plan",
        tone: "formal",
        audience: "social_worker",
        hasProfile: true,
      });
      expect(result.passed).toBe(true);
      expect(result.flags.some(f => f.code === "STATUTORY_DRAFT")).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("warns for risk assessment draft", () => {
      const result = preGenerationCheck({
        generationType: "RISK_ASSESSMENT_DRAFT",
        brief: "Draft risk assessment section covering self-harm risk factors",
        tone: "formal",
        audience: "social_worker",
        hasProfile: true,
      });
      expect(result.passed).toBe(true);
      expect(result.flags.some(f => f.code === "STATUTORY_DRAFT")).toBe(true);
    });

    it("warns for care plan draft", () => {
      const result = preGenerationCheck({
        generationType: "CARE_PLAN_DRAFT",
        brief: "Draft care plan objective about emotional wellbeing",
        tone: "formal",
        audience: "social_worker",
        hasProfile: true,
      });
      expect(result.passed).toBe(true);
      expect(result.flags.some(f => f.code === "STATUTORY_DRAFT")).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it("warns for sensitive content types", () => {
      const result = preGenerationCheck({
        generationType: "LIFE_STORY_SESSION",
        brief: "Plan a session exploring early family memories",
        tone: "nurturing",
        audience: "staff",
        hasProfile: true,
      });
      expect(result.passed).toBe(true);
      expect(result.flags.some(f => f.code === "SENSITIVE_CONTENT")).toBe(true);
    });

    it("warns for missing return home support", () => {
      const result = preGenerationCheck({
        generationType: "MISSING_RETURN_HOME_SUPPORT",
        brief: "Prepare a return home conversation guide for when the young person comes back",
        tone: "calm_reassuring",
        audience: "staff",
        hasProfile: true,
      });
      expect(result.passed).toBe(true);
      expect(result.flags.some(f => f.code === "SENSITIVE_CONTENT")).toBe(true);
    });

    it("warns when child profile is missing for child-focused types", () => {
      const result = preGenerationCheck({
        generationType: "KEYWORK_SESSION",
        brief: "Plan a keywork session about school attendance",
        tone: "warm_professional",
        audience: "staff",
        hasProfile: false,
      });
      expect(result.passed).toBe(true);
      expect(result.flags.some(f => f.code === "NO_PROFILE")).toBe(true);
    });

    it("does not warn about missing profile for non-child types", () => {
      const result = preGenerationCheck({
        generationType: "STAFF_MICRO_TRAINING",
        brief: "Create a micro-training on trauma-informed practice",
        tone: "coaching",
        audience: "staff",
        hasProfile: false,
      });
      expect(result.passed).toBe(true);
      expect(result.flags.some(f => f.code === "NO_PROFILE")).toBe(false);
    });

    it("warns on formal tone for young person audience", () => {
      const result = preGenerationCheck({
        generationType: "YOUNG_PERSON_EXPLAINER",
        brief: "Explain the complaints procedure to the young person",
        tone: "formal",
        audience: "young_person",
        hasProfile: true,
      });
      expect(result.passed).toBe(true);
      expect(result.flags.some(f => f.code === "TONE_MISMATCH")).toBe(true);
    });

    it("score is 0 when blocked", () => {
      const result = preGenerationCheck({
        generationType: "KEYWORK_SESSION",
        brief: "Include the national insurance number",
        tone: "warm_professional",
        audience: "staff",
        hasProfile: true,
      });
      expect(result.score).toBe(0);
    });

    it("score decreases with warnings", () => {
      const result = preGenerationCheck({
        generationType: "LIFE_STORY_SESSION",
        brief: "Plan a session about early family memories",
        tone: "formal",
        audience: "young_person",
        hasProfile: false,
      });
      expect(result.passed).toBe(true);
      expect(result.score).toBeLessThan(100);
    });
  });

  describe("postGenerationCheck", () => {
    function makeOutput(content: string): GenerationOutput {
      return {
        title: "Test Output",
        summary: "Test summary",
        sections: [{ heading: "Section", content, type: "narrative" }],
        metadata: { generationType: "KEYWORK_SESSION", model: "test", generatedAt: new Date().toISOString() },
      };
    }

    it("passes clean output", () => {
      const result = postGenerationCheck(
        makeOutput("This session focuses on building emotional regulation skills using a strengths-based approach."),
        "KEYWORK_SESSION",
      );
      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(85);
    });

    it("warns on clinical diagnostic language", () => {
      const result = postGenerationCheck(
        makeOutput("The child has been diagnosed with oppositional defiant disorder and shows symptoms of attachment disorder."),
        "KEYWORK_SESSION",
      );
      expect(result.passed).toBe(true);
      expect(result.flags.some(f => f.code === "CLINICAL_LANGUAGE" || f.code === "DIAGNOSTIC_LABEL")).toBe(true);
    });

    it("warns on prescribing language", () => {
      const result = postGenerationCheck(
        makeOutput("The doctor will prescribe melatonin to help with sleep issues."),
        "KEYWORK_SESSION",
      );
      expect(result.passed).toBe(true);
      expect(result.flags.some(f => f.code === "PRESCRIBING_LANGUAGE")).toBe(true);
    });

    it("warns on punitive language - punishment", () => {
      const result = postGenerationCheck(
        makeOutput("If the child is naughty, punish them by removing screen time as a consequence for bad behaviour."),
        "BEHAVIOUR_SUPPORT_IDEAS",
      );
      expect(result.passed).toBe(true);
      expect(result.flags.some(f => f.code === "PUNITIVE_LANGUAGE")).toBe(true);
    });

    it("warns on punitive language - grounding", () => {
      const result = postGenerationCheck(
        makeOutput("The child should be grounded for the weekend following the incident."),
        "BEHAVIOUR_SUPPORT_IDEAS",
      );
      expect(result.passed).toBe(true);
      expect(result.flags.some(f => f.code === "PUNITIVE_LANGUAGE")).toBe(true);
    });

    it("warns on punitive language - time out", () => {
      const result = postGenerationCheck(
        makeOutput("Send the child to time out when they refuse instructions."),
        "BEHAVIOUR_SUPPORT_IDEAS",
      );
      expect(result.passed).toBe(true);
      expect(result.flags.some(f => f.code === "PUNITIVE_LANGUAGE")).toBe(true);
    });

    it("blocks output containing phone numbers", () => {
      const result = postGenerationCheck(
        makeOutput("Contact the social worker on 077-123-4567 for updates."),
        "KEYWORK_SESSION",
      );
      expect(result.passed).toBe(false);
      expect(result.flags.some(f => f.code === "PII_IN_OUTPUT")).toBe(true);
    });

    it("blocks output containing UK postcodes", () => {
      const result = postGenerationCheck(
        makeOutput("The child lives at LS12 4DX and attends school nearby."),
        "KEYWORK_SESSION",
      );
      expect(result.passed).toBe(false);
      expect(result.flags.some(f => f.code === "PII_IN_OUTPUT")).toBe(true);
    });

    it("warns on unusually short output", () => {
      const result = postGenerationCheck(
        makeOutput("Short."),
        "KEYWORK_SESSION",
      );
      expect(result.passed).toBe(true);
      expect(result.flags.some(f => f.code === "SHORT_OUTPUT")).toBe(true);
    });

    it("adds recommendations for statutory drafts", () => {
      const result = postGenerationCheck(
        makeOutput("This placement plan section covers the child's education needs including their SEN requirements and school attendance objectives."),
        "PLACEMENT_PLAN_DRAFT",
      );
      expect(result.passed).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.flags.some(f => f.code === "REQUIRES_APPROVAL")).toBe(true);
    });

    it("adds recommendations for risk assessment drafts", () => {
      const result = postGenerationCheck(
        makeOutput("Risk factor: Self-harm through scratching. Current controls include 15-minute welfare checks and accessible staff."),
        "RISK_ASSESSMENT_DRAFT",
      );
      expect(result.passed).toBe(true);
      expect(result.flags.some(f => f.code === "REQUIRES_APPROVAL")).toBe(true);
    });

    it("score reduces with warnings but doesn't hit zero", () => {
      const result = postGenerationCheck(
        makeOutput("The child has been diagnosed with a disorder and shows symptoms requiring assessment."),
        "KEYWORK_SESSION",
      );
      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(100);
    });

    it("score is 0 when blocked", () => {
      const result = postGenerationCheck(
        makeOutput("Call 077-123-4567 for the social worker."),
        "KEYWORK_SESSION",
      );
      expect(result.score).toBe(0);
    });
  });
});
