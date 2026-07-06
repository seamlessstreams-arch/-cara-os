// ══════════════════════════════════════════════════════════════════════════════
// CARA — Ask CARA task-card tests (§2)
//
// Pins: catalogue integrity; role filtering; the banner; and the NO-DEAD-CARD
// guarantee — every "ask" card's prompt resolves to a real engine intent (never
// the "unknown" fallback), and every "route" card points at an app path.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { ASK_CARA_TASK_CARDS, ASK_CARA_BANNER, taskCardsForRole, roleTierForCards } from "../task-cards";
import { answerQuestion } from "../ask-cara-engine";
import type { AskCaraSnapshot } from "../types";

const SNAP: AskCaraSnapshot = {
  children: [{ id: "yp_alex", firstName: "Alex", name: "Alex W", status: "current" }],
  staff: [], incidents: [], tasks: [], restraints: [], missingEpisodes: [],
  dailyLogs: [], medications: [], reviews: [], shifts: [], keyWork: [], contacts: [], supervisions: [], training: [],
};

describe("catalogue integrity", () => {
  it("has a banner and cards", () => {
    expect(ASK_CARA_BANNER).toMatch(/do not copy/i);
    expect(ASK_CARA_TASK_CARDS.length).toBeGreaterThan(10);
  });
  it("every card has a valid action", () => {
    for (const c of ASK_CARA_TASK_CARDS) {
      if (c.action.type === "ask") expect(c.action.prompt.length).toBeGreaterThan(3);
      else expect(c.action.href.startsWith("/")).toBe(true);
    }
  });
  it("card ids are unique", () => {
    const ids = ASK_CARA_TASK_CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("role filtering", () => {
  it("maps roles to tiers", () => {
    expect(roleTierForCards("registered_manager")).toBe("management");
    expect(roleTierForCards("residential_care_worker")).toBe("care_team");
    expect(roleTierForCards("candidate")).toBe("everyone");
    expect(roleTierForCards(undefined)).toBe("care_team");
  });
  it("a care worker cannot see management cards", () => {
    const cards = taskCardsForRole("residential_care_worker").flatMap((g) => g.cards);
    expect(cards.some((c) => c.tier === "management")).toBe(false);
    expect(cards.length).toBeGreaterThan(0);
  });
  it("a manager sees management cards", () => {
    const cards = taskCardsForRole("registered_manager").flatMap((g) => g.cards);
    expect(cards.some((c) => c.id === "home_overview")).toBe(true);
  });
  it("an everyone-tier role sees only everyone cards", () => {
    const cards = taskCardsForRole("candidate").flatMap((g) => g.cards);
    expect(cards.every((c) => c.tier === "everyone")).toBe(true);
  });
});

describe("no dead cards — every 'ask' prompt resolves to a real intent", () => {
  const askCards = ASK_CARA_TASK_CARDS.filter((c) => c.action.type === "ask");
  for (const c of askCards) {
    it(`"${c.label}" resolves`, () => {
      const prompt = (c.action as { prompt: string }).prompt;
      // Manager role so nothing is denied by tier; the prompt must land somewhere real.
      const a = answerQuestion({ question: prompt, asOf: "2026-07-05", snapshot: SNAP, role: "registered_manager" });
      expect(a.intent).not.toBe("unknown");
    });
  }
});
