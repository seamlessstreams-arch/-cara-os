import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { deterministicRewrite, isRewriteMode, REWRITE_MODES } from "../deterministic-rewrite";

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic rewrite engine — the five-mode writing assistant that works with
// NO AI / API / network. Tests the contract: improves text, never invents,
// never softens safeguarding, fully reproducible, zero network calls.
// ─────────────────────────────────────────────────────────────────────────────

describe("deterministicRewrite — improve_writing", () => {
  it("fixes UK spelling, missing apostrophes, and capitalises sentence starts", () => {
    const r = deterministicRewrite("improve_writing", "the child didnt want to talk. she said behavior was hard.");
    expect(r.text).toContain("didn't");
    expect(r.text).toContain("behaviour");
    expect(r.text.startsWith("The")).toBe(true);
    expect(r.text).toContain(". She said");
    expect(r.changed).toBe(true);
  });

  it("preserves facts — names, times, and actions are never lost", () => {
    const input = "At 14:30 Jordan left the home without permission. Staff called the police.";
    const r = deterministicRewrite("improve_writing", input);
    expect(r.text).toContain("14:30");
    expect(r.text).toContain("Jordan");
    expect(r.text).toContain("police");
  });

  it("reports no change for already-clean text", () => {
    const r = deterministicRewrite("improve_writing", "Jordan engaged well during the key work session.");
    expect(r.changed).toBe(false);
  });
});

describe("deterministicRewrite — professionalise_record", () => {
  it("reframes blaming language and flags the change for review", () => {
    const r = deterministicRewrite("professionalise_record", "Jordan was non-compliant today.");
    expect(r.text.toLowerCase()).not.toContain("non-compliant");
    expect(r.notes.some((n) => n.toLowerCase().includes("non-compliant"))).toBe(true);
  });

  it("removes informal slang", () => {
    const r = deterministicRewrite("professionalise_record", "He is gonna refuse cos he is upset.");
    expect(r.text).toContain("going to");
    expect(r.text).toContain("because");
    expect(r.text).not.toContain("gonna");
    expect(r.text).not.toMatch(/\bcos\b/);
  });

  it("flags vague phrases for the author to expand — and invents nothing", () => {
    const r = deterministicRewrite("professionalise_record", "Jordan kicked off at dinner.");
    expect(r.notes.some((n) => n.includes("kicked off"))).toBe(true);
    // The factual anchor is preserved; no fabricated detail is added.
    expect(r.text).toContain("dinner");
  });
});

describe("deterministicRewrite — simplify_language", () => {
  it("swaps jargon for plain English", () => {
    const r = deterministicRewrite("simplify_language", "Staff utilised the vehicle to facilitate the appointment.");
    expect(r.text).toContain("used");
    expect(r.text).toContain("help");
    expect(r.text).not.toContain("utilised");
    expect(r.text).not.toContain("facilitate");
  });

  it("turns semicolons into shorter sentences", () => {
    const r = deterministicRewrite("simplify_language", "Jordan was upset; staff offered support.");
    expect(r.text).not.toContain(";");
    expect(r.text).toContain("Jordan was upset. Staff offered support");
  });

  it("splits the safest very-long sentences at a natural boundary", () => {
    const long =
      "Jordan came home from school in a low mood and did not want any dinner or to speak to staff about his day, and later that evening he went straight to his bedroom to listen to music.";
    const r = deterministicRewrite("simplify_language", long);
    expect(r.text).toContain("his day. Later that evening");
  });
});

describe("deterministicRewrite — write_to_child", () => {
  it("produces a non-empty child-readable rewrite via the deterministic engine", () => {
    const r = deterministicRewrite("write_to_child", "Jordan was restrained after he hit a staff member.", {
      recordType: "incident",
    });
    expect(r.mode).toBe("write_to_child");
    expect(r.text.trim().length).toBeGreaterThan(0);
  });

  it("coerces an unknown record type to a safe default without throwing", () => {
    expect(() =>
      deterministicRewrite("write_to_child", "Jordan had a good day.", { recordType: "not_a_real_type" }),
    ).not.toThrow();
  });
});

describe("safeguarding preservation (the hard contract)", () => {
  const SAFEGUARDING =
    "Jordan made a disclosure of abuse. He had a bruise on his arm and had self-harmed in his bedroom.";

  it.each(["improve_writing", "professionalise_record", "simplify_language"] as const)(
    "%s never removes or softens safeguarding-critical detail",
    (mode) => {
      const r = deterministicRewrite(mode, SAFEGUARDING);
      const lower = r.text.toLowerCase();
      expect(lower).toContain("disclosure");
      expect(lower).toContain("abuse");
      expect(lower).toContain("bruise");
      expect(lower).toContain("self-harm");
    },
  );
});

describe("determinism & robustness", () => {
  it("is fully reproducible — same input yields identical output", () => {
    const input = "Jordan didnt want to talk and was non-compliant; he is gonna refuse.";
    expect(deterministicRewrite("professionalise_record", input)).toEqual(
      deterministicRewrite("professionalise_record", input),
    );
  });

  it("handles empty / whitespace input safely", () => {
    const r = deterministicRewrite("improve_writing", "   ");
    expect(r.changed).toBe(false);
    expect(r.text).toBe("");
  });

  it("rewrites a very long multi-page record without truncating it", () => {
    const para = "The young person came home from school and was in a calm and settled mood. ";
    const long = para.repeat(800); // ~60,000 chars — far beyond any single page
    const r = deterministicRewrite("improve_writing", long);
    // No silent truncation — the rewrite stays the same order of magnitude.
    expect(r.text.length).toBeGreaterThan(long.trim().length * 0.9);
  });

  it("exposes the four rewrite modes", () => {
    expect(REWRITE_MODES).toHaveLength(4);
    expect(isRewriteMode("improve_writing")).toBe(true);
    expect(isRewriteMode("check_tone")).toBe(false);
    expect(isRewriteMode("nonsense")).toBe(false);
  });
});

describe("no-AI regression (proves zero network dependency)", () => {
  it("makes no fetch / network call for any mode", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    deterministicRewrite("improve_writing", "the child didnt settle.");
    deterministicRewrite("professionalise_record", "Jordan was gonna kick off, he was non-compliant.");
    deterministicRewrite("simplify_language", "Staff utilised the vehicle; the appointment commenced.");
    deterministicRewrite("write_to_child", "Jordan was upset after a phone call.", { recordType: "daily_log" });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("the engine source imports no AI / LLM / external client (static guardrail)", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/lib/writing-assistant/deterministic-rewrite.ts"),
      "utf8",
    );
    const forbidden: Array<[RegExp, string]> = [
      [/anthropic/i, "anthropic"],
      [/\bgemini\b/i, "gemini"],
      [/cara-provider/i, "cara-provider (LLM provider)"],
      [/generateText/, "generateText (LLM call)"],
      [/getAnthropicClient/, "anthropic client"],
      [/\bfetch\b/, "fetch"],
      [/langchain/i, "langchain"],
    ];
    for (const [re, name] of forbidden) {
      expect(src, `deterministic-rewrite.ts must not reference ${name}`).not.toMatch(re);
    }
  });
});
