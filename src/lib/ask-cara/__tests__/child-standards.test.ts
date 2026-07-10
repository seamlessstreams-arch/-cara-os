import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { buildAskSnapshot } from "../build-snapshot";
import { answerQuestion, resolveChild, roleTier } from "../ask-cara-engine";
import { buildGroundingPack } from "../build-grounding";
import { getWeeklyNarrative, getWeeklyReport } from "@/lib/cpie/get-weekly-report";

// Cara's reporting and summarising must consider the 9 Quality Standards
// (Children's Homes (England) Regulations 2015) and the five outcomes —
// narrated from the WIO's evidence lines, only where genuinely evidenced.
const snapshot = buildAskSnapshot(getStore());
const asOf = new Date().toISOString().slice(0, 10);
const ask = (question: string, role = "registered_manager") => answerQuestion({ question, asOf, role, snapshot });

describe("Quality Standards & Five Outcomes across Cara's surfaces", () => {
  it("routes a standards question to the child's evidence, not KB theory", () => {
    const a = ask("does Alex's week evidence the quality standards?");
    expect(a.intent).toBe("child_standards");
    expect(a.answered).toBe(true);
    expect(a.text).toContain("of 9");
    expect(a.disclaimer).toContain("never a predicted judgement");
  });

  it("routes a five-outcomes question and gives the home rollup when no child is named", () => {
    const a = ask("are we evidencing the five outcomes?");
    expect(a.intent).toBe("child_standards");
    expect(a.text).toContain("of 5 outcomes");
    expect(a.text.toLowerCase()).toContain("recording prompt");
  });

  it("does not steal inspection or policy questions", () => {
    expect(ask("are we ready for inspection?").intent).toBe("inspection_readiness");
    expect(ask("what does our policy say about missing from care?").intent).toBe("policy_guidance");
  });

  it("the chat weekly summary carries the QS + Five Outcomes evidence again", () => {
    const a = ask("what should be in Alex's weekly summary?");
    expect(a.intent).toBe("weekly_summary");
    expect(a.text).toContain("Quality Standards evidenced");
    expect(a.text).toContain("Five Outcomes");
  });

  it("the manager-summary narrative holds the week against the frameworks", () => {
    const n = getWeeklyNarrative("yp_alex", undefined, 14);
    expect(n?.standards).toContain("Quality Standards");
    expect(n?.body).toContain("Quality Standards");
  });

  it("the full weekly report has the standards section before the Manager Summary", () => {
    const r = getWeeklyReport("yp_alex", undefined, 14)!;
    const idx = r.sections.findIndex((s) => s.group === "Quality Standards & Five Outcomes");
    const ms = r.sections.findIndex((s) => s.group === "Manager Summary");
    expect(idx).toBeGreaterThan(-1);
    expect(idx).toBeLessThan(ms);
    expect(r.sections[idx].body).toContain("of 9");
  });

  it("child_summary carries the counts line", () => {
    const a = ask("tell me about Alex");
    expect(a.text).toMatch(/evidences \d of 9 Quality Standards/);
  });

  it("the LLM grounding pack carries the QS + outcomes labels", () => {
    const answer = ask("tell me about Alex");
    const child = resolveChild("tell me about alex", snapshot);
    const pack = buildGroundingPack({ question: "tell me about Alex", snapshot, tier: roleTier("registered_manager"), answer, child, asOf });
    expect(pack).toContain("Quality Standards evidenced this week");
    expect(pack).toContain("Five Outcomes evidenced");
  });
});
