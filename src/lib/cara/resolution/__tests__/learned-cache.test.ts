import { describe, it, expect } from "vitest";
import {
  isCacheableCommand, lookupLearnedAnswer, learnAnswer, getLearnedCacheStats,
} from "../learned-cache";

// Long, distinctive inputs (> MIN_INPUT_LEN, lots of content tokens).
const calmMorning =
  "Alex had a calm morning today, ate a good breakfast, chatted about football and went off to school on time with no issues at all.";
const fireCheck =
  "Staff completed the weekly fire safety check this afternoon and tested every alarm and emergency light across the whole building.";

describe("isCacheableCommand (safety gate)", () => {
  it("allows low-risk, non-sensitive commands", () => {
    expect(isCacheableCommand("summarise_text", "low")).toBe(true);
    expect(isCacheableCommand("draft_handover", "low")).toBe(true);
    expect(isCacheableCommand("convert_to_email", "low")).toBe(true);
  });
  it("blocks anything that is not low-risk", () => {
    expect(isCacheableCommand("summarise_text", "medium")).toBe(false);
    expect(isCacheableCommand("summarise_text", "high")).toBe(false);
  });
  it("blocks sensitive command ids even at low risk (defence in depth)", () => {
    expect(isCacheableCommand("safeguarding_summary", "low")).toBe(false);
    expect(isCacheableCommand("risk_assessment_help", "low")).toBe(false);
    expect(isCacheableCommand("medication_note", "low")).toBe(false);
    expect(isCacheableCommand("missing_episode_note", "low")).toBe(false);
  });
});

describe("learn + replay (tier 2)", () => {
  const cmd = "summarise_text";
  const childA = "yp_cache_A";

  it("returns null before anything is learned", () => {
    expect(lookupLearnedAnswer({ commandId: cmd, childId: childA, input: calmMorning, riskLevel: "low" })).toBeNull();
  });

  it("replays a learned answer for the same request (case/whitespace-insensitive), no API call", () => {
    learnAnswer({ commandId: cmd, childId: childA, input: calmMorning, output: "Summary: calm, settled morning.", confidence: "high", riskLevel: "low" });
    const variant = `   ${calmMorning.toUpperCase()}!!!  `; // same content tokens after normalisation
    const hit = lookupLearnedAnswer({ commandId: cmd, childId: childA, input: variant, riskLevel: "low" });
    expect(hit?.output).toBe("Summary: calm, settled morning.");
  });

  it("never matches across different children", () => {
    expect(lookupLearnedAnswer({ commandId: cmd, childId: "yp_cache_B", input: calmMorning, riskLevel: "low" })).toBeNull();
  });

  it("does not match a substantially different input", () => {
    expect(lookupLearnedAnswer({ commandId: cmd, childId: childA, input: fireCheck, riskLevel: "low" })).toBeNull();
  });

  it("never learns or replays a non-low-risk command", () => {
    learnAnswer({ commandId: "weekly_report", childId: childA, input: calmMorning, output: "x", confidence: "high", riskLevel: "high" });
    expect(lookupLearnedAnswer({ commandId: "weekly_report", childId: childA, input: calmMorning, riskLevel: "high" })).toBeNull();
  });

  it("deduplicates near-identical learns (keeps the first)", () => {
    const cmd2 = "draft_handover";
    learnAnswer({ commandId: cmd2, childId: childA, input: fireCheck, output: "first", confidence: "high", riskLevel: "low" });
    learnAnswer({ commandId: cmd2, childId: childA, input: fireCheck, output: "second", confidence: "high", riskLevel: "low" });
    expect(lookupLearnedAnswer({ commandId: cmd2, childId: childA, input: fireCheck, riskLevel: "low" })?.output).toBe("first");
  });
});

describe("stats", () => {
  it("reports entries and Claude calls saved", () => {
    const s = getLearnedCacheStats();
    expect(s.entries).toBeGreaterThan(0);
    expect(s.claude_calls_saved).toBeGreaterThanOrEqual(1); // the replay above
    expect(s.hit_rate).toBeGreaterThanOrEqual(0);
  });
});
