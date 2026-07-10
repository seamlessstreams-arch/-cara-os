import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { buildAskSnapshot } from "../build-snapshot";
import { answerQuestion, resolveChild, roleTier } from "../ask-cara-engine";
import { buildGroundingPack } from "../build-grounding";

// Real seeded snapshot — the grounding must carry the platform's intelligence,
// scoped by tier, and only ever strings the deterministic engines computed.
const snapshot = buildAskSnapshot(getStore());
const asOf = new Date().toISOString().slice(0, 10);

function packFor(question: string, role?: string): string {
  const answer = answerQuestion({ question, asOf, role, snapshot });
  const child = resolveChild(question.toLowerCase(), snapshot);
  return buildGroundingPack({ question, snapshot, tier: roleTier(role), answer, child, asOf });
}

describe("Ask CARA — LLM grounding pack", () => {
  it("carries the deterministic answer as authoritative + evidence", () => {
    const pack = packFor("what triggers Alex?", "registered_manager");
    expect(pack).toContain("DETERMINISTIC ANSWER");
    expect(pack).toContain("Evidence:");
  });

  it("grounds a child question in the twin + engines (identity, emotional, relational, practice)", () => {
    const pack = packFor("tell me about Alex", "registered_manager");
    expect(pack).toContain("THE CHILD — Alex");
    expect(pack.toLowerCase()).toContain("football"); // twin interests
    expect(pack).toContain("Emotional safety");
    expect(pack).toContain("Relational safety");
    expect(pack).toContain("Last 30 days");
  });

  it("includes the home block with live counts", () => {
    const pack = packFor("how is the home doing?", "registered_manager");
    expect(pack).toContain("THE HOME");
    expect(pack).toContain("Outstanding");
  });

  it("tier-scopes: management-only intelligence never reaches a general-tier pack", () => {
    const pack = packFor("tell me about Alex", "external_visitor"); // tier: everyone
    expect(pack).not.toContain("THE CHILD"); // child detail is care-team+
    expect(pack).not.toContain("Inspection evidence posture");
    expect(pack).not.toContain("Rota safety");
  });

  it("care-team tier gets the child but not management-only blocks", () => {
    const pack = packFor("tell me about Alex", "residential_care_worker");
    expect(pack).toContain("THE CHILD — Alex");
    expect(pack).not.toContain("Inspection evidence posture");
    expect(pack).not.toContain("Reg 44");
  });

  it("stays within the token budget (~7k chars — raised for the record index)", () => {
    const pack = packFor("tell me about Alex", "registered_manager");
    expect(pack.length).toBeLessThanOrEqual(7100);
  });
});
