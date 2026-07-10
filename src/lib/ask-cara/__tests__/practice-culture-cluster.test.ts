import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { buildAskSnapshot } from "../build-snapshot";
import { answerQuestion, roleTier } from "../ask-cara-engine";
import { buildGroundingPack } from "../build-grounding";

// The final library cluster: Practice Culture Scorecard, Framework Usage,
// Staff Recording Quality — the home's culture answered from its own engines.
const snapshot = buildAskSnapshot(getStore());
const asOf = new Date().toISOString().slice(0, 10);
const ask = (question: string, role = "registered_manager") => answerQuestion({ question, asOf, role, snapshot });

describe("Ask CARA — home practice-culture cluster", () => {
  it("snapshot carries all three digests on real seed data", () => {
    const pr = snapshot.practice!;
    expect(typeof pr.practiceCulture?.overallScore).toBe("number");
    expect(pr.practiceCulture?.dimensions.length).toBe(5);
    expect(typeof pr.frameworkUsage?.totalEngagements).toBe("number");
    expect(typeof pr.staffRecording?.totalStaff).toBe("number");
  });

  it("'how is our recording culture?' answers with the home's scorecard, not theory", () => {
    const a = ask("how is our recording culture?");
    expect(a.intent).toBe("practice_culture");
    expect(a.text).toContain("/100");
    expect(a.text).toContain("Dimension by dimension");
  });

  it("'which frameworks are we using?' answers from the usage engine", () => {
    const a = ask("which frameworks are we using in practice?");
    expect(a.intent).toBe("framework_usage");
    expect(a.text.toLowerCase()).toContain("framework engagement");
  });

  it("staff recording quality is management-gated engine data", () => {
    const rm = ask("how is the team's recording quality?");
    expect(rm.intent).toBe("staff_recording");
    expect(rm.text).toContain("acceptance");
    const cw = ask("how is the team's recording quality?", "residential_care_worker");
    expect(cw.intent).toBe("access_denied");
  });

  it("does NOT steal neighbouring intents", () => {
    expect(ask("what does PACE mean?").intent).toBe("practice_guidance"); // theory stays KB
    expect(ask("where are our recording gaps?").intent).toBe("recording_gaps");
    expect(ask("are we recording strengths enough?").intent).toBe("strengths_recording");
    expect(ask("is our language criminalising anyone?").intent).toBe("care_language");
  });

  it("the management grounding carries the culture rollups", () => {
    const answer = ask("how is the home doing?");
    const pack = buildGroundingPack({ question: "how is the home doing?", snapshot, tier: roleTier("registered_manager"), answer, child: null, asOf });
    expect(pack).toContain("Practice culture");
    expect(pack).toContain("Framework usage");
    expect(pack).toContain("Staff recording quality");
  });
});
