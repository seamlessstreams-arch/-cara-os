// ══════════════════════════════════════════════════════════════════════════════
// Tests: AriaChallengeModePanel _testing exports
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "@/components/aria/aria-challenge-mode";

const { ACTION_CONFIG } = _testing;

describe("AriaChallengeModePanel", () => {
  describe("ACTION_CONFIG", () => {
    const actions = ["approve", "reject", "dismiss", "amend_and_approve", "no_action_required"] as const;

    it("has config for all 5 actions", () => {
      for (const action of actions) {
        expect(ACTION_CONFIG[action]).toBeDefined();
      }
    });

    it("each action has label, icon, colour, bg, prompt, placeholder", () => {
      for (const action of actions) {
        const config = ACTION_CONFIG[action];
        expect(config.label).toBeTruthy();
        expect(config.icon).toBeTruthy();
        expect(config.colour).toBeTruthy();
        expect(config.bg).toBeTruthy();
        expect(config.prompt).toBeTruthy();
        expect(config.placeholder).toBeTruthy();
      }
    });

    it("each action has at least 3 quick responses", () => {
      for (const action of actions) {
        expect(ACTION_CONFIG[action].quickResponses.length).toBeGreaterThanOrEqual(3);
      }
    });

    it("reject action has most quick responses (needs detailed reasoning)", () => {
      const rejectCount = ACTION_CONFIG.reject.quickResponses.length;
      const approveCount = ACTION_CONFIG.approve.quickResponses.length;
      expect(rejectCount).toBeGreaterThanOrEqual(approveCount);
    });

    it("prompts are genuine questions, not commands", () => {
      for (const action of actions) {
        const prompt = ACTION_CONFIG[action].prompt;
        // Should be a question or statement ending with ?
        expect(prompt.endsWith("?") || prompt.endsWith(".")).toBe(true);
      }
    });

    it("approve config is green-themed", () => {
      expect(ACTION_CONFIG.approve.colour).toContain("emerald");
      expect(ACTION_CONFIG.approve.bg).toContain("emerald");
    });

    it("reject config is red-themed", () => {
      expect(ACTION_CONFIG.reject.colour).toContain("red");
      expect(ACTION_CONFIG.reject.bg).toContain("red");
    });

    it("quick responses are unique within each action", () => {
      for (const action of actions) {
        const responses = ACTION_CONFIG[action].quickResponses;
        expect(new Set(responses).size).toBe(responses.length);
      }
    });

    it("quick responses relate to care context", () => {
      // Check that responses reference safeguarding, tone, children, etc.
      const allResponses = actions.flatMap((a) => ACTION_CONFIG[a].quickResponses);
      const careTerms = ["safeguard", "child", "record", "tone", "fact"];
      const hasCareTerms = careTerms.some((term) =>
        allResponses.some((r) => r.toLowerCase().includes(term)),
      );
      expect(hasCareTerms).toBe(true);
    });
  });
});
