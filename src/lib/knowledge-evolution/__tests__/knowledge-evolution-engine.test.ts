// ══════════════════════════════════════════════════════════════════════════════
// CARA — KNOWLEDGE EVOLUTION ENGINE TESTS
//
// Pins: lifecycle (embedded / emerging / dormant / review_due incl. the freshness
// override); coverage-gap fires for a recurring theme with no KB entry and stays
// quiet when covered or absent; proposals are gaps-first; nothing is ever
// auto-applied (humanDecisionRequired always true).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { runKnowledgeEvolution } from "../knowledge-evolution-engine";
import type { KnowledgeEvolutionInput, KBEntryInput, PracticeRecordText } from "../types";

const ASOF = "2026-07-05";
const FRESH = "2026-06-01"; // ~1 month old

const entry = (o: Partial<KBEntryInput> = {}): KBEntryInput => ({
  id: "e1",
  title: "Test Model",
  type: "model",
  keywords: ["pace"],
  ingestedAt: FRESH,
  reviewed: true,
  ...o,
});

const rec = (recordType: string, text: string): PracticeRecordText => ({ recordType, text });

const run = (o: Partial<KnowledgeEvolutionInput> = {}) =>
  runKnowledgeEvolution({ homeId: "home_oak", asOf: ASOF, entries: [], corpus: [], ...o });

describe("entry lifecycle", () => {
  it("marks an entry embedded when its keyword recurs (>2) and it is fresh+reviewed", () => {
    const r = run({
      entries: [entry({ keywords: ["pace"] })],
      corpus: [rec("incidents", "used pace"), rec("dailyLog", "pace helped"), rec("behaviourLog", "pace stance")],
    });
    expect(r.entrySignals[0].lifecycle).toBe("embedded");
    expect(r.entrySignals[0].references).toBe(3);
    expect(r.entrySignals[0].sources).toEqual(expect.arrayContaining(["incidents", "dailyLog", "behaviourLog"]));
  });

  it("marks an entry emerging at 1–2 references", () => {
    const r = run({ entries: [entry({ keywords: ["pace"] })], corpus: [rec("dailyLog", "a bit of pace today")] });
    expect(r.entrySignals[0].lifecycle).toBe("emerging");
  });

  it("marks an entry dormant when its keyword never appears", () => {
    const r = run({ entries: [entry({ keywords: ["obscuremodelx"] })], corpus: [rec("dailyLog", "nothing relevant")] });
    expect(r.entrySignals[0].lifecycle).toBe("dormant");
  });

  it("freshness override: a never-reviewed entry is review_due even if embedded", () => {
    const r = run({
      entries: [entry({ keywords: ["pace"], reviewed: false })],
      corpus: [rec("a", "pace"), rec("b", "pace"), rec("c", "pace")],
    });
    expect(r.entrySignals[0].lifecycle).toBe("review_due");
  });

  it("freshness override: a stale (>12mo) entry is review_due", () => {
    const r = run({ entries: [entry({ keywords: ["pace"], ingestedAt: "2024-01-01", reviewed: true })], corpus: [rec("a", "pace")] });
    expect(r.entrySignals[0].lifecycle).toBe("review_due");
  });
});

describe("coverage gaps", () => {
  it("flags a recurring theme that no KB entry covers", () => {
    const r = run({
      entries: [entry({ keywords: ["pace"] })], // does not cover neurodiversity
      corpus: [rec("incidents", "presenting autism traits"), rec("dailyLog", "sensory autism support")],
    });
    const gap = r.proposals.find((p) => p.id === "ke_gap_neurodiversity");
    expect(gap).toBeTruthy();
    expect(gap!.kind).toBe("codify_gap");
    expect(r.summary.coverageGaps).toBeGreaterThanOrEqual(1);
  });

  it("does NOT flag a theme once a KB entry covers it", () => {
    const r = run({
      entries: [entry({ id: "e_nd", title: "Neurodiversity", keywords: ["autism", "sensory", "adhd"] })],
      corpus: [rec("incidents", "presenting autism traits"), rec("dailyLog", "sensory support")],
    });
    expect(r.proposals.find((p) => p.id === "ke_gap_neurodiversity")).toBeUndefined();
    expect(r.summary.coverageGaps).toBe(0);
  });

  it("does NOT flag a theme absent from the records", () => {
    const r = run({ entries: [entry({ keywords: ["pace"] })], corpus: [rec("dailyLog", "a calm ordinary day")] });
    expect(r.proposals.some((p) => p.kind === "codify_gap")).toBe(false);
  });

  it("scales severity with frequency (>=5 → high)", () => {
    const many = Array.from({ length: 5 }, (_, i) => rec("incidents", `suicidal ideation note ${i}`));
    const r = run({ entries: [entry({ keywords: ["pace"] })], corpus: many });
    const gap = r.proposals.find((p) => p.id === "ke_gap_self_harm");
    expect(gap?.severity).toBe("high");
  });
});

describe("proposals ordering and safety", () => {
  it("orders coverage gaps before reinforcements", () => {
    const r = run({
      entries: [entry({ keywords: ["pace"] })],
      corpus: [rec("a", "pace"), rec("b", "pace"), rec("c", "pace"), rec("d", "autism sensory autism")],
    });
    const kinds = r.proposals.map((p) => p.kind);
    const gapIdx = kinds.indexOf("codify_gap");
    const reinforceIdx = kinds.indexOf("reinforce");
    expect(gapIdx).toBeGreaterThanOrEqual(0);
    expect(reinforceIdx).toBeGreaterThan(gapIdx);
  });

  it("never auto-applies — every proposal requires a human decision", () => {
    const r = run({
      entries: [entry({ keywords: ["obscuremodelx"], reviewed: false })],
      corpus: [rec("incidents", "autism sensory needs")],
    });
    expect(r.proposals.length).toBeGreaterThan(0);
    expect(r.proposals.every((p) => p.humanDecisionRequired === true)).toBe(true);
    expect(r.disclaimer).toMatch(/never auto-edits/i);
  });
});
