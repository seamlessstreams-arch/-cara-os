// ══════════════════════════════════════════════════════════════════════════════
// ARIA STUDIO — Prompt Builder Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { buildPrompt } from "../prompt-builder";
import type { AriaChildProfile } from "../types";

function makeProfile(overrides?: Partial<AriaChildProfile>): AriaChildProfile {
  return {
    childId: "child_1",
    childName: "Jordan P",
    preferredName: "Jordan",
    age: 15,
    gender: "male",
    pronouns: "he/him",
    strengths: ["Creative", "Good sense of humour", "Enjoys cooking"],
    needs: ["Emotional regulation support", "Consistent boundaries"],
    riskFlags: ["Verbal aggression when dysregulated"],
    interests: ["Cooking", "Gaming", "Football"],
    triggers: ["Transitions", "Boundary enforcement"],
    copingStrategies: ["Breathing exercises", "Walking away"],
    communicationPreferences: "Responds best to direct, honest communication",
    carePlanObjectives: [
      { title: "Develop emotional regulation strategies", status: "active" },
      { title: "Maintain school attendance above 80%", status: "active" },
    ],
    evidenceRefs: [],
    ...overrides,
  };
}

describe("prompt-builder", () => {
  describe("buildPrompt", () => {
    it("returns system and user prompts", () => {
      const result = buildPrompt({
        generationType: "KEYWORK_SESSION",
        title: "Weekly Keywork",
        brief: "Focus on emotional regulation",
        tone: "warm_professional",
        audience: "staff",
      });
      expect(result.system).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.system.length).toBeGreaterThan(100);
      expect(result.user.length).toBeGreaterThan(10);
    });

    it("system prompt includes ARIA Studio identity", () => {
      const { system } = buildPrompt({
        generationType: "KEYWORK_SESSION",
        title: "Test",
        brief: "Test brief content",
        tone: "warm_professional",
        audience: "staff",
      });
      expect(system).toContain("ARIA Studio");
      expect(system).toContain("Cornerstone");
    });

    it("system prompt includes trauma-informed requirements", () => {
      const { system } = buildPrompt({
        generationType: "KEYWORK_SESSION",
        title: "Test",
        brief: "Test brief content",
        tone: "warm_professional",
        audience: "staff",
      });
      expect(system).toContain("Trauma-informed");
      expect(system).toContain("Strengths-based");
      expect(system).toContain("Child-centred");
    });

    it("system prompt includes regulatory context", () => {
      const { system } = buildPrompt({
        generationType: "KEYWORK_SESSION",
        title: "Test",
        brief: "Test brief content",
        tone: "warm_professional",
        audience: "staff",
      });
      expect(system).toContain("Children's Homes");
      expect(system).toContain("SCCIF");
    });

    it("system prompt includes critical rules", () => {
      const { system } = buildPrompt({
        generationType: "KEYWORK_SESSION",
        title: "Test",
        brief: "Test brief content",
        tone: "warm_professional",
        audience: "staff",
      });
      expect(system).toContain("NEVER");
      expect(system).toContain("diagnose");
      expect(system).toContain("punitive");
    });

    it("includes tone instructions", () => {
      const { system } = buildPrompt({
        generationType: "KEYWORK_SESSION",
        title: "Test",
        brief: "Test brief content",
        tone: "playful",
        audience: "staff",
      });
      expect(system).toContain("playful");
    });

    it("includes audience instructions for young person", () => {
      const { system } = buildPrompt({
        generationType: "YOUNG_PERSON_EXPLAINER",
        title: "Test",
        brief: "Test brief content",
        tone: "calm_reassuring",
        audience: "young_person",
      });
      expect(system).toContain("young person");
    });

    it("user prompt includes child profile when provided", () => {
      const profile = makeProfile();
      const { user } = buildPrompt({
        generationType: "KEYWORK_SESSION",
        profile,
        title: "Weekly Keywork",
        brief: "Focus on emotional regulation",
        tone: "warm_professional",
        audience: "staff",
      });
      expect(user).toContain("Jordan");
      expect(user).toContain("15");
      expect(user).toContain("Creative");
      expect(user).toContain("Cooking");
    });

    it("user prompt includes preferred name", () => {
      const profile = makeProfile({ preferredName: "JJ" });
      const { user } = buildPrompt({
        generationType: "KEYWORK_SESSION",
        profile,
        title: "Test",
        brief: "Test brief content",
        tone: "warm_professional",
        audience: "staff",
      });
      expect(user).toContain("JJ");
    });

    it("user prompt includes strengths", () => {
      const profile = makeProfile();
      const { user } = buildPrompt({
        generationType: "KEYWORK_SESSION",
        profile,
        title: "Test",
        brief: "Test brief content",
        tone: "warm_professional",
        audience: "staff",
      });
      expect(user).toContain("Strengths");
      expect(user).toContain("Creative");
    });

    it("user prompt includes needs", () => {
      const profile = makeProfile();
      const { user } = buildPrompt({
        generationType: "KEYWORK_SESSION",
        profile,
        title: "Test",
        brief: "Test brief content",
        tone: "warm_professional",
        audience: "staff",
      });
      expect(user).toContain("Needs");
      expect(user).toContain("Emotional regulation support");
    });

    it("user prompt includes risk flags", () => {
      const profile = makeProfile();
      const { user } = buildPrompt({
        generationType: "KEYWORK_SESSION",
        profile,
        title: "Test",
        brief: "Test brief content",
        tone: "warm_professional",
        audience: "staff",
      });
      expect(user).toContain("Risk Flags");
      expect(user).toContain("Verbal aggression");
    });

    it("user prompt includes triggers", () => {
      const profile = makeProfile();
      const { user } = buildPrompt({
        generationType: "KEYWORK_SESSION",
        profile,
        title: "Test",
        brief: "Test brief content",
        tone: "warm_professional",
        audience: "staff",
      });
      expect(user).toContain("Known Triggers");
      expect(user).toContain("Transitions");
    });

    it("user prompt includes care plan objectives", () => {
      const profile = makeProfile();
      const { user } = buildPrompt({
        generationType: "KEYWORK_SESSION",
        profile,
        title: "Test",
        brief: "Test brief content",
        tone: "warm_professional",
        audience: "staff",
      });
      expect(user).toContain("Care Plan Objectives");
      expect(user).toContain("Develop emotional regulation");
    });

    it("user prompt includes title and brief", () => {
      const { user } = buildPrompt({
        generationType: "STAFF_BRIEFING",
        title: "Morning Handover",
        brief: "Cover key updates from overnight shift",
        tone: "direct",
        audience: "staff",
      });
      expect(user).toContain("Morning Handover");
      expect(user).toContain("Cover key updates");
    });

    it("user prompt includes additional context when provided", () => {
      const { user } = buildPrompt({
        generationType: "KEYWORK_SESSION",
        title: "Test",
        brief: "Test brief content",
        tone: "warm_professional",
        audience: "staff",
        additionalContext: "The child had a difficult family contact yesterday",
      });
      expect(user).toContain("Additional Context");
      expect(user).toContain("difficult family contact");
    });

    it("works without profile", () => {
      const { user } = buildPrompt({
        generationType: "STAFF_MICRO_TRAINING",
        title: "Trauma-Informed Practice",
        brief: "Create a training session on TIP principles",
        tone: "coaching",
        audience: "staff",
      });
      expect(user).not.toContain("Child Profile");
      expect(user).toContain("Trauma-Informed Practice");
    });

    it("handles all generation types without error", () => {
      const types = [
        "KEYWORK_SESSION", "DIRECT_WORK_SESSION", "LIFE_STORY_SESSION",
        "MISSING_RETURN_HOME_SUPPORT", "STAFF_BRIEFING", "FLASHCARDS",
        "YOUNG_PERSON_EXPLAINER", "BEHAVIOUR_SUPPORT_IDEAS", "PLACEMENT_PLAN_DRAFT",
        "RISK_ASSESSMENT_DRAFT", "CARE_PLAN_DRAFT", "STAFF_MICRO_TRAINING",
        "TEAM_MEETING_PACK", "REG44_EVIDENCE_PREP", "REG45_EVIDENCE_PREP",
        "EDUCATION_SUPPORT_SESSION", "INDEPENDENCE_SESSION", "FAMILY_TIME_PREPARATION",
        "EMOTIONAL_REGULATION_SESSION", "RELATIONSHIP_REPAIR_SESSION", "MANAGER_OVERSIGHT_PROMPTS",
      ] as const;

      for (const type of types) {
        const result = buildPrompt({
          generationType: type,
          title: `Test ${type}`,
          brief: `Brief for ${type}`,
          tone: "warm_professional",
          audience: "staff",
        });
        expect(result.system.length).toBeGreaterThan(100);
        expect(result.user.length).toBeGreaterThan(10);
      }
    });
  });
});
