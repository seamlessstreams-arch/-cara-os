import { describe, it, expect, beforeEach } from "vitest";
import {
  deterministicCommandDraft,
  commandsWithDeterministicDraft,
} from "../deterministic-fallback";
import { invokeCaraCommand } from "../cara-service";

// Provider-apology markers — phrases that appear ONLY in the "top up your credits"
// / "not configured" fallback text, never in a genuine deterministic draft.
// (The draft's own honest header says the AI is "unavailable", so that word is
// deliberately NOT a marker.)
const APOLOGY = ["top up", "topped up", "credits", "anthropic", "api_key", "dashboard", "provider key", "is not configured"];
function hasApology(text: string): boolean {
  const l = text.toLowerCase();
  return APOLOGY.some((a) => l.includes(a));
}

const SOURCE =
  "Alex had a difficult evening. He became distressed after a phone call with his mother and left the building at 7pm. Staff followed the missing-from-care procedure and he returned at 9pm, safe. A return interview is due tomorrow.";

describe("deterministicCommandDraft — pure generator", () => {
  it("produces a real draft (never an apology) for every bespoke command", () => {
    for (const id of commandsWithDeterministicDraft()) {
      const out = deterministicCommandDraft(id, SOURCE, { label: id, description: "d" });
      expect(out.length).toBeGreaterThan(40);
      expect(hasApology(out)).toBe(false);
    }
  });

  it("summarise_text returns an extractive summary drawn from the source", () => {
    const out = deterministicCommandDraft("summarise_text", SOURCE);
    expect(out.toLowerCase()).toContain("summary");
    // At least one salient source fact is carried through.
    expect(out).toMatch(/missing-from-care|return interview|distressed/i);
  });

  it("question commands emit a numbered, ready-to-use list", () => {
    const out = deterministicCommandDraft("draft_interview_questions", SOURCE);
    expect(out).toMatch(/1\. /);
    expect(out).toMatch(/2\. /);
    expect(out.toLowerCase()).toContain("values-based");
  });

  it("section commands lay out the document's headings + place the source notes", () => {
    const out = deterministicCommandDraft("draft_social_worker_update", SOURCE);
    expect(out).toContain("Your source notes");
    expect(out).toContain("Progress and achievements");
    expect(out).toContain("Next steps");
  });

  it("an unknown command still gets a generic, useful draft (not an apology)", () => {
    const out = deterministicCommandDraft("some_future_command", SOURCE, { label: "Future thing" });
    expect(hasApology(out)).toBe(false);
    expect(out).toContain("Your source notes");
  });

  it("is deterministic — identical input yields identical output", () => {
    const a = deterministicCommandDraft("draft_care_plan_update", SOURCE);
    const b = deterministicCommandDraft("draft_care_plan_update", SOURCE);
    expect(a).toBe(b);
  });
});

describe("invokeCaraCommand — works without an API (no provider configured)", () => {
  beforeEach(() => {
    // Force the provider to be unconfigured, so Tier 3 falls back deterministically.
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.CARA_PROVIDER;
  });

  it("returns a deterministic draft, not the provider apology, for an LLM-tier command", async () => {
    const outcome = await invokeCaraCommand({
      actor: { userId: "u_rm", role: "registered_manager" },
      commandId: "summarise_text",
      inputText: SOURCE,
    });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    const r = outcome.result;
    expect(r.llmUsed).toBe(false);
    expect(r.providerId).toBe("deterministic_fallback");
    expect(r.confidence).toBe("low");
    expect(hasApology(r.generatedText)).toBe(false);
    expect(r.generatedText.toLowerCase()).toContain("summary");
  });
});
