import { describe, it, expect } from "vitest";
import { answerQuestion } from "../ask-cara-engine";
import type { AskCaraSnapshot, AskCaraPracticeDigest } from "../types";

// A minimal snapshot with one current child (Alex) and a populated leg-four
// practice digest — so we test the ROUTING + narration of the new engine reads
// independently of the store→snapshot mapper.
const practice: AskCaraPracticeDigest = {
  careLanguage: {
    hitRate: 12,
    totalHits: 3,
    childrenAffected: 1,
    topCategoryLabel: "criminalising language",
    mostFlaggedPhrase: "kicked off",
    perChild: [{ childId: "c1", totalHits: 3, topCategoryLabel: "criminalising language" }],
  },
  childVoice: {
    overallPresenceRate: 35,
    worstTypeLabel: "key-work sessions",
    lacParticipationRate: 50,
    perChild: [
      { childId: "c1", score: 20, hasData: true, topGapTypeLabel: "key-work sessions" },
      { childId: "c2", score: null, hasData: false },
    ],
  },
  recordingGaps: {
    childrenWithCriticalGap: 1,
    childrenWithAnyGap: 2,
    totalCriticalGaps: 2,
    perChild: [{ childId: "c1", severity: "critical", criticalGapCount: 2, topGapLabel: "Daily log" }],
  },
  cumulativeRisk: {
    escalatingCount: 1,
    urgentSupervisionCount: 1,
    mostCommonWorseningSignal: "Incident frequency",
    perChild: [{ childId: "c1", signal: "escalating", priority: "urgent", worseningSignals: 3, topWorseningLabel: "Incident frequency" }],
  },
};

function snap(): AskCaraSnapshot {
  return {
    children: [
      { id: "c1", firstName: "Alex", name: "Alex", status: "current" },
      { id: "c2", firstName: "Casey", name: "Casey", status: "current" },
    ],
    staff: [], incidents: [], tasks: [], restraints: [], missingEpisodes: [], dailyLogs: [],
    medications: [], reviews: [], shifts: [], keyWork: [], contacts: [], supervisions: [], training: [],
    practice,
  };
}

const ask = (question: string) =>
  answerQuestion({ question, asOf: "2026-07-09", role: "registered_manager", snapshot: snap() });

describe("Ask CARA — child practice intelligence (leg four)", () => {
  it("routes 'whose voice is missing?' to Child Voice Presence, NOT missing-from-care", () => {
    const a = ask("whose voice is missing?");
    expect(a.intent).toBe("child_voice");
    expect(a.text.toLowerCase()).toContain("article 12");
  });

  it("names the children whose voice is thin (home level)", () => {
    const a = ask("are the children heard in the records?");
    expect(a.intent).toBe("child_voice");
    expect(a.text).toContain("Casey"); // score null / hasData false → thin
  });

  it("routes a child-scoped language question to Care Language Audit findings", () => {
    const a = ask("is our language criminalising Alex?");
    expect(a.intent).toBe("care_language");
    expect(a.text).toContain("Alex");
    expect(a.text).toContain("criminalising language");
    expect(a.disclaimer).toContain("Care Language Audit");
  });

  it("answers the home care-language read from the engine, not KB theory", () => {
    const a = ask("how is our language across the home?");
    expect(a.intent).toBe("care_language");
    expect(a.text).toContain("per 100 records");
  });

  it("routes 'who is at cumulative risk?' to Cumulative Risk findings", () => {
    const a = ask("who is at cumulative risk?");
    expect(a.intent).toBe("cumulative_risk");
    expect(a.text).toContain("Alex");
    expect(a.text.toLowerCase()).toContain("escalating");
  });

  it("routes 'where are our recording gaps?' to Recording Gap findings", () => {
    const a = ask("where are our recording gaps?");
    expect(a.intent).toBe("recording_gaps");
    expect(a.text).toContain("critical");
  });

  it("does NOT steal genuine missing-from-care questions", () => {
    const a = ask("how many missing episodes this week?");
    expect(a.intent).toBe("missing");
  });

  it("gives a child-scoped cumulative-risk read when a child is named", () => {
    const a = ask("is Alex's risk building?");
    expect(a.intent).toBe("cumulative_risk");
    expect(a.text).toContain("Alex");
    expect(a.text).toContain("escalating");
  });
});
