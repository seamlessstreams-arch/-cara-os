// ══════════════════════════════════════════════════════════════════════════════
// GOLDEN REGRESSION SET — the rewrite path held to a fixed standard.
//
// Deterministic path: EXACT snapshots. The engine is deterministic, so any
// diff here is a real behaviour change — review it like a code change.
//
// Model path: gated behind CARA_GOLDEN_MODEL=1 so CI stays deterministic and
// free (CI has no key and no Claude login). Run locally against either auth
// route after any prompt, example, or model-pin change:
//
//   CARA_GOLDEN_MODEL=1 npx vitest run src/lib/writing-assistant/__tests__/golden
//
// Model assertions are property-based, not exact-match: facts preserved,
// banned phrases absent, UK spelling, sane length — the compact between the
// house style and every future model.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, expect, it } from "vitest";
import { deterministicRewrite } from "../../deterministic-rewrite";
import { GOLDEN_FIXTURES, longRecordFixture, type GoldenFixture } from "./fixtures";
import {
  buildRewriteSystemPrompt,
  buildRewriteUserPrompt,
  rewriteMaxOutputTokens,
  RECORD_OPEN,
  RECORD_CLOSE,
} from "../../style/system-prompt";

const engineMode = (f: GoldenFixture) =>
  f.mode === "writing-to-child" ? ("write_to_child" as const) : ("improve_writing" as const);

// Phrases the house style bans from any rewrite output (outside quotes; the
// golden inputs put none of these inside quotes, so a plain check is safe).
const BANNED = [
  "It is important to note",
  "Furthermore,",
  "In conclusion",
  "Moving forward",
  "This highlights the importance",
];

const US_SPELLINGS = ["behavior", "recognize", "organization", "color", "defense", "pediatric"];

describe("golden set — deterministic path (exact)", () => {
  for (const f of GOLDEN_FIXTURES) {
    it(`${f.id} matches its snapshot`, () => {
      const r = deterministicRewrite(engineMode(f), f.input);
      expect(r.text).toMatchSnapshot();
      for (const keep of f.mustPreserve) {
        expect(r.text.toLowerCase()).toContain(keep.toLowerCase());
      }
    });
  }

  it("handles a record near the 100k route limit without truncation", () => {
    const f = longRecordFixture();
    const r = deterministicRewrite(engineMode(f), f.input);
    // A rewrite of a ~90k record must still be roughly record-sized.
    expect(r.text.length).toBeGreaterThan(f.input.length * 0.8);
    for (const keep of f.mustPreserve) {
      expect(r.text).toContain(keep);
    }
  });

  it("treats an embedded instruction as text to rewrite, not a command", () => {
    const f = GOLDEN_FIXTURES.find((x) => x.id === "std-injection-attempt")!;
    const r = deterministicRewrite(engineMode(f), f.input);
    // The injected line is still PRESENT (it is part of the record being
    // written about) and the factual tail survives around it.
    expect(r.text).toContain("9.30pm");
    expect(r.text.toLowerCase()).toContain("film");
  });
});

describe("golden set — locked prompt assembly", () => {
  it("system prompt embeds the house style and the mode instruction", () => {
    const sys = buildRewriteSystemPrompt("safeguarding");
    expect(sys).toContain("Never break these");
    expect(sys).toContain("Precision above all");
    expect(sys).toContain("Worked examples");
  });

  it("every mode has few-shot examples wired in", () => {
    for (const mode of ["standard", "safeguarding", "writing-to-child", "management-oversight"] as const) {
      const sys = buildRewriteSystemPrompt(mode);
      expect(sys).toContain("**Before:**");
      expect(sys).toContain("**After:**");
    }
  });

  it("user prompt delimits the record as untrusted data", () => {
    const up = buildRewriteUserPrompt("some record text");
    expect(up).toContain(RECORD_OPEN);
    expect(up).toContain(RECORD_CLOSE);
    expect(up).toContain("never instructions");
    // The record sits INSIDE the markers. The header sentence names both
    // markers first, so anchor on the marker LINES, not the first mention.
    expect(up.indexOf("some record text")).toBeGreaterThan(up.indexOf("\n" + RECORD_OPEN));
    expect(up.indexOf("some record text")).toBeLessThan(up.lastIndexOf(RECORD_CLOSE));
  });

  it("output budget scales with input instead of the old flat 1024", () => {
    expect(rewriteMaxOutputTokens(200)).toBe(1024); // floor for short notes
    expect(rewriteMaxOutputTokens(40_000)).toBeGreaterThan(10_000); // long record fits
    expect(rewriteMaxOutputTokens(1_000_000)).toBe(32_000); // ceiling holds
  });
});

// ── Model path (opt-in; runs against whichever auth route is configured) ──────
const runModel = process.env.CARA_GOLDEN_MODEL === "1";

describe.runIf(runModel)("golden set — model path (property-based)", () => {
  it(
    "model rewrites preserve facts and the house style",
    { timeout: 120_000 },
    async () => {
      const { invokeAiGateway } = await import("@/lib/cara/ai-gateway");
      for (const f of GOLDEN_FIXTURES) {
        const gw = await invokeAiGateway({
          purpose: "golden_set",
          feature: "golden_set",
          systemPrompt: buildRewriteSystemPrompt(f.mode),
          userPrompt: buildRewriteUserPrompt(f.input),
          temperature: 0,
          maxOutputTokens: rewriteMaxOutputTokens(f.input.length),
          redact: false,
        });
        if (!gw.llmUsed) continue; // provider unavailable — nothing to assert
        const out = gw.output;
        for (const keep of f.mustPreserve) {
          expect(out.toLowerCase(), `${f.id} must preserve "${keep}"`).toContain(keep.toLowerCase());
        }
        for (const banned of BANNED) {
          expect(out, `${f.id} must not contain "${banned}"`).not.toContain(banned);
        }
        for (const us of US_SPELLINGS) {
          expect(out.toLowerCase(), `${f.id} must use UK spelling (${us})`).not.toContain(us);
        }
        expect(out.length, `${f.id} output length sane`).toBeGreaterThan(f.input.length * 0.5);
        expect(out.length, `${f.id} output length sane`).toBeLessThan(f.input.length * 3 + 500);
        if (f.mode === "writing-to-child") {
          expect(out.toLowerCase(), `${f.id} second person`).toContain("you");
        }
      }
    },
  );
});
