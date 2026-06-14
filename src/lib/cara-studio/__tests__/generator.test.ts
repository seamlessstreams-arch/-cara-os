// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — Generator Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { generate } from "../generator";
import type { GenerationRequest } from "../types";

function makeRequest(overrides?: Partial<GenerationRequest>): GenerationRequest {
  return {
    organisationId: "org_1",
    homeId: "home_1",
    userId: "user_1",
    generationType: "KEYWORK_SESSION",
    title: "Weekly Keywork — Emotional Regulation",
    brief: "Plan a keywork session focused on helping the young person develop emotional regulation strategies",
    tone: "warm_professional",
    audience: "staff",
    ...overrides,
  };
}

describe("generator", () => {
  describe("generate", () => {
    it("returns a successful result for valid request", async () => {
      const result = await generate(makeRequest());
      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect(result.output!.title).toBe("Weekly Keywork — Emotional Regulation");
      expect(result.output!.sections.length).toBeGreaterThan(0);
      expect(result.model).toBeDefined();
    });

    it("includes safety assessment with successful result", async () => {
      const result = await generate(makeRequest());
      expect(result.safety).toBeDefined();
      expect(result.safety.passed).toBe(true);
      expect(result.safety.score).toBeGreaterThan(0);
      expect(result.safety.flags).toBeDefined();
      expect(result.safety.warnings).toBeDefined();
    });

    it("blocks request with PII extraction attempt", async () => {
      const result = await generate(makeRequest({
        brief: "Please include the child's national insurance number and bank account details",
      }));
      expect(result.success).toBe(false);
      expect(result.error).toContain("blocked");
      expect(result.safety.passed).toBe(false);
      expect(result.safety.blockers.length).toBeGreaterThan(0);
    });

    it("blocks request with restraint technique request", async () => {
      const result = await generate(makeRequest({
        brief: "Generate a document on restraint technique for when the child is aggressive",
      }));
      expect(result.success).toBe(false);
      expect(result.error).toContain("blocked");
    });

    it("blocks request with medication dosing", async () => {
      const result = await generate(makeRequest({
        brief: "Create a chart showing medication dosage guidelines for melatonin",
      }));
      expect(result.success).toBe(false);
      expect(result.safety.flags.some(f => f.code === "HARMFUL_CONTENT")).toBe(true);
    });

    it("blocks request with diagnostic content", async () => {
      const result = await generate(makeRequest({
        brief: "Diagnose whether this child has ADHD based on their incident patterns",
      }));
      expect(result.success).toBe(false);
    });

    it("includes warnings for statutory draft types", async () => {
      const result = await generate(makeRequest({
        generationType: "PLACEMENT_PLAN_DRAFT",
        brief: "Draft a placement plan section covering the child's education needs and objectives",
      }));
      expect(result.success).toBe(true);
      expect(result.safety.warnings.length).toBeGreaterThan(0);
      expect(result.safety.flags.some(f => f.code === "STATUTORY_DRAFT")).toBe(true);
    });

    it("includes warnings for sensitive content types", async () => {
      const result = await generate(makeRequest({
        generationType: "LIFE_STORY_SESSION",
        brief: "Plan a life story session exploring the child's early memories and family transitions",
      }));
      expect(result.success).toBe(true);
      expect(result.safety.flags.some(f => f.code === "SENSITIVE_CONTENT")).toBe(true);
    });

    it("warns when child-focused type has no profile", async () => {
      const result = await generate(makeRequest({
        generationType: "KEYWORK_SESSION",
        // No childId = no profile
      }));
      expect(result.success).toBe(true);
      expect(result.safety.flags.some(f => f.code === "NO_PROFILE")).toBe(true);
    });

    it("builds profile when childId provided", async () => {
      const result = await generate(makeRequest({
        childId: "child_jordan",
      }));
      expect(result.success).toBe(true);
      expect(result.profile).toBeDefined();
      expect(result.profile!.childName).toContain("Jordan");
    });

    it("flags tone/audience mismatch", async () => {
      const result = await generate(makeRequest({
        tone: "formal",
        audience: "young_person",
        brief: "Explain the young person's rights in residential care including their right to privacy",
      }));
      expect(result.success).toBe(true);
      expect(result.safety.flags.some(f => f.code === "TONE_MISMATCH")).toBe(true);
    });

    it("generates structured sections in output", async () => {
      const result = await generate(makeRequest());
      expect(result.output).toBeDefined();
      const output = result.output!;
      expect(output.sections.length).toBeGreaterThan(1);
      expect(output.sections[0].heading).toBeDefined();
      expect(output.sections[0].content).toBeDefined();
      expect(output.sections[0].type).toBeDefined();
    });

    it("output includes metadata", async () => {
      const result = await generate(makeRequest());
      expect(result.output!.metadata).toBeDefined();
      expect(result.output!.metadata.generationType).toBe("KEYWORK_SESSION");
      expect(result.output!.metadata.model).toBeDefined();
      expect(result.output!.metadata.generatedAt).toBeDefined();
    });

    it("includes summary in output", async () => {
      const result = await generate(makeRequest());
      expect(result.output!.summary).toBeDefined();
      expect(result.output!.summary.length).toBeGreaterThan(0);
    });

    it("handles all generation types without error", async () => {
      const types = [
        "KEYWORK_SESSION", "DIRECT_WORK_SESSION", "STAFF_BRIEFING",
        "FLASHCARDS", "YOUNG_PERSON_EXPLAINER", "BEHAVIOUR_SUPPORT_IDEAS",
        "STAFF_MICRO_TRAINING", "TEAM_MEETING_PACK", "REG44_EVIDENCE_PREP",
        "REG45_EVIDENCE_PREP", "EDUCATION_SUPPORT_SESSION", "INDEPENDENCE_SESSION",
        "MANAGER_OVERSIGHT_PROMPTS",
      ] as const;

      for (const type of types) {
        const result = await generate(makeRequest({
          generationType: type,
          brief: `Create content for ${type.toLowerCase().replace(/_/g, " ")} focused on the young person's progress`,
        }));
        expect(result.success).toBe(true);
        expect(result.output).toBeDefined();
      }
    });

    it("returns model name in result", async () => {
      const result = await generate(makeRequest());
      expect(result.model).toBeDefined();
      expect(typeof result.model).toBe("string");
      expect(result.model.length).toBeGreaterThan(0);
    });
  });
});
