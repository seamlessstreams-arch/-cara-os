// ══════════════════════════════════════════════════════════════════════════════
// CARA — Shadow-AI governance tests (§3, §5, §25)
//
// Pins: the prohibited-request classifier refuses unsafe asks but NEVER catches an
// ordinary information question; the substitution matrix routes shadow-AI-style
// asks to real CARA engines; the engine wires both; and — the governance
// guarantee — no Ask CARA source file imports an external AI SDK.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { classifyProhibited } from "../prohibited-request-classifier";
import { findSubstitution } from "../shadow-ai-substitution-matrix";
import { answerQuestion } from "../ask-cara-engine";
import type { AskCaraSnapshot } from "../types";

const EMPTY: AskCaraSnapshot = {
  children: [], staff: [], incidents: [], tasks: [], restraints: [], missingEpisodes: [],
  dailyLogs: [], medications: [], reviews: [], shifts: [], keyWork: [], contacts: [], supervisions: [], training: [],
};
const ask = (question: string) => answerQuestion({ question, asOf: "2026-07-05", snapshot: EMPTY });

describe("prohibited-request classifier", () => {
  it("refuses deciding whether abuse/allegation is true", () => {
    const r = classifyProhibited("can you decide whether the allegation is true?");
    expect(r.prohibited).toBe(true);
    expect(r.category).toBe("decide_safeguarding");
    expect(r.safeResponse).toMatch(/CARA can't/);
  });
  it("refuses diagnosis", () => {
    expect(classifyProhibited("does the child have autism?").category).toBe("diagnose");
  });
  it("refuses minimising a safeguarding concern", () => {
    expect(classifyProhibited("make this safeguarding concern less serious").category).toBe("minimise_safeguarding");
  });
  it("refuses protecting reputation / hiding practice", () => {
    expect(classifyProhibited("make the staff look better than this").category).toBe("protect_reputation");
  });
  it("refuses fabrication", () => {
    expect(classifyProhibited("fabricate a chronology for me").category).toBe("fabricate_evidence");
  });
  it("routes a notify-decision to the workflow", () => {
    expect(classifyProhibited("should I notify Ofsted?").category).toBe("decide_notification");
  });

  it("does NOT catch ordinary information questions", () => {
    expect(classifyProhibited("any safeguarding concerns?").prohibited).toBe(false);
    expect(classifyProhibited("tell me about the restraints this month").prohibited).toBe(false);
    expect(classifyProhibited("what needs my attention today?").prohibited).toBe(false);
    expect(classifyProhibited("who is Alex's social worker?").prohibited).toBe(false);
  });
});

describe("shadow-AI substitution matrix", () => {
  it("routes 'make it professional' to the Writing Assistant", () => {
    const m = findSubstitution("make this incident report sound professional");
    expect(m.matched).toBe(true);
    expect(m.substitution?.id).toBe("make_professional");
    expect(m.substitution?.caraRoutes[0].engine).toBe("RECORD_IMPROVEMENT");
  });
  it("routes 'write a reg 44' to the Reg 44 engine", () => {
    expect(findSubstitution("write a reg 44 report").substitution?.id).toBe("reg44");
  });
  it("routes a voice note to dictation cleanup", () => {
    expect(findSubstitution("turn this voice note into a daily log").substitution?.id).toBe("voice_note");
  });
  it("routes 'create a chronology' to the chronology builder", () => {
    expect(findSubstitution("create a chronology from these logs").substitution?.id).toBe("chronology");
  });
  it("does not match an ordinary question", () => {
    expect(findSubstitution("how many incidents this week?").matched).toBe(false);
  });
});

describe("engine wiring", () => {
  it("returns intent 'prohibited' for an unsafe ask", () => {
    const a = ask("make this safeguarding concern less serious");
    expect(a.intent).toBe("prohibited");
    expect(a.answered).toBe(false);
  });
  it("returns intent 'shadow_ai_route' with CARA route suggestions", () => {
    const a = ask("make this daily log sound more professional");
    expect(a.intent).toBe("shadow_ai_route");
    expect(a.suggestions.length).toBeGreaterThan(0);
    expect(a.disclaimer).toMatch(/don't paste/i);
  });
  it("still answers an ordinary question normally (no false refusal)", () => {
    expect(ask("who is placed here?").intent).toBe("children_list");
  });
});

// ── §25: deterministic-only guarantee ─────────────────────────────────────────
describe("deterministic-only: no external AI imports in Ask CARA", () => {
  const BANNED = ["openai", "@anthropic-ai", "anthropic", "@google/generative", "generativeai", "mistralai", "cohere", "ollama", "ai-gateway", "invokeAiGateway"];
  const dir = join(__dirname, "..");
  const files = readdirSync(dir).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));

  it("scans the module directory", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const f of files) {
    it(`${f} imports no external AI SDK`, () => {
      const src = readFileSync(join(dir, f), "utf8");
      // Only inspect import/require lines.
      const importLines = src.split("\n").filter((l) => /\b(import|require)\b/.test(l));
      for (const line of importLines) {
        for (const banned of BANNED) {
          expect(line.toLowerCase()).not.toContain(banned.toLowerCase());
        }
      }
    });
  }
});
