import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { buildAskSnapshot } from "../build-snapshot";
import { answerQuestion, resolveChild, roleTier } from "../ask-cara-engine";
import { buildGroundingPack } from "../build-grounding";

// Slice 2 of the practice library: Strengths Recording, Repair Cycle,
// Relational Safety Map, Team Approach Consistency — answered from THIS home's
// engine findings, never KB theory.
const snapshot = buildAskSnapshot(getStore());
const asOf = new Date().toISOString().slice(0, 10);
const ask = (question: string, role = "registered_manager") => answerQuestion({ question, asOf, role, snapshot });

describe("Ask CARA — practice library slice 2", () => {
  it("snapshot carries all four new digests on real seed data", () => {
    const pr = snapshot.practice!;
    expect(typeof pr.strengthsRecording?.overallRate).toBe("number");
    expect(typeof pr.repairCycle?.overallCompletionRate).toBe("number");
    expect(typeof pr.relationalSafety?.secureCount).toBe("number");
    expect(typeof pr.teamApproach?.overallTherapeuticRate).toBe("number");
  });

  it("'are we recording strengths enough?' answers from the engine, not theory", () => {
    const a = ask("are we recording strengths enough?");
    expect(a.intent).toBe("strengths_recording");
    expect(a.text).toContain("% of records");
  });

  it("'how well do we repair after incidents?' answers with the completion rate", () => {
    const a = ask("how well do we repair after incidents?");
    expect(a.intent).toBe("repair_cycle");
    expect(a.text).toContain("% complete");
  });

  it("relational-safety map answers home-level with key-worker coverage", () => {
    const a = ask("what does the relational safety map show?");
    expect(a.intent).toBe("relational_safety");
    expect(a.text.toLowerCase()).toContain("secure");
  });

  it("'is the team consistent in its approach to Alex?' is management-gated engine data", () => {
    const a = ask("is the team consistent in its approach to Alex?");
    expect(a.intent).toBe("team_approach");
    const denied = ask("is the team consistent in its approach to Alex?", "residential_care_worker");
    expect(denied.intent).toBe("access_denied");
  });

  it("does NOT steal neighbouring intents", () => {
    expect(ask("who is Alex?").intent).toBe("child_identity"); // "strengths" in identity stays put
    expect(ask("how are Alex's relationships?").intent).toBe("child_relationships"); // relational-timeline read stays put
    expect(ask("which restraints have no debrief?").intent).toBe("restraints");
    // "how do I…" is a THEORY question — KB guidance is the right route; the
    // engine only takes "how well do WE repair"-style accountability questions.
    expect(ask("how do I repair a relationship after a rupture?").intent).toBe("practice_guidance");
  });

  it("grounding pack carries the slice-2 findings for a child + home", () => {
    const answer = ask("tell me about Alex");
    const child = resolveChild("tell me about alex", snapshot);
    const pack = buildGroundingPack({ question: "tell me about Alex", snapshot, tier: roleTier("registered_manager"), answer, child, asOf });
    // Child-block lines (the home tail may clip at the token cap on child questions).
    expect(pack).toContain("Repair cycles");
    expect(pack).toContain("Relational safety map");
    expect(pack).toContain("Team approach");
    // On a HOME question (no child block), the home rollups fit within the cap.
    const homeAnswer = ask("how is the home doing?");
    const homePack = buildGroundingPack({ question: "how is the home doing?", snapshot, tier: roleTier("registered_manager"), answer: homeAnswer, child: null, asOf });
    expect(homePack).toContain("Team approach (home)");
    expect(homePack).toContain("Repair cycles (home)");
  });
});
