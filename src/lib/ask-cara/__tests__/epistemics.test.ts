import { describe, it, expect } from "vitest";
import { classifyLine, classifyEpistemics, hasClaims } from "../epistemics";

// §4 / acceptance criterion 13: every answer distinguishes FACT / ACCOUNT /
// ANALYSIS / HYPOTHESIS / ACTION. The properties that matter:
//   - whose voice it is beats what clause it sits in (account > action);
//   - uncertainty markers beat certainty markers (hypothesis > analysis > fact)
//     — better to under-claim than present a possibility as truth;
//   - non-claims (headers, greetings, questions) are NEVER forced into a label.

describe("the five §4 distinctions", () => {
  it("FACT — recorded, countable information", () => {
    expect(classifyLine("3 incidents recorded this week, 1 involving restraint.")).toBe("fact");
    expect(classifyLine("Last medication administered 08:00 today.")).toBe("fact");
  });

  it("ACCOUNT — what someone reported, in their words", () => {
    expect(classifyLine("Casey said she feels safer when staff check labels with her.")).toBe("account");
    expect(classifyLine("Staff reported a difficult handover on Tuesday.")).toBe("account");
  });

  it("ANALYSIS — reasoned interpretation over evidence", () => {
    expect(classifyLine("Evening entries show a rising trend over the last three weeks.")).toBe("analysis");
    expect(classifyLine("Emotional safety is a concern for Alex (engine read — see their triggers).")).toBe("analysis");
    expect(classifyLine("Taken together, the missing episodes and the new association form a pattern.")).toBe("analysis");
  });

  it("HYPOTHESIS — a possibility needing exploration", () => {
    expect(classifyLine("This may indicate transition stress around school mornings.")).toBe("hypothesis");
    expect(classifyLine("Could this be linked to contact anniversaries? Worth exploring with the key worker.")).toBe("hypothesis");
  });

  it("ACTION — agreed, required, recommended or overdue", () => {
    expect(classifyLine("Risk assessment review is overdue by 6 days.")).toBe("action");
    expect(classifyLine("Next step: book a debrief with the child before Friday.")).toBe("action");
  });
});

describe("cautious precedence — never over-claim", () => {
  it("hypothesis beats analysis when both cues appear", () => {
    expect(classifyLine("The rising trend may indicate sleep disruption.")).toBe("hypothesis");
  });

  it("hypothesis beats fact — a possibility about recorded data is still a possibility", () => {
    expect(classifyLine("The 4 recorded episodes could be connected.")).toBe("hypothesis");
  });

  it("account beats action — whose voice it is matters more than the clause", () => {
    expect(classifyLine("The child said the review needs to happen sooner.")).toBe("account");
  });
});

describe("non-claims are never forced into a label", () => {
  it("headers, greetings and questions are context (no badge)", () => {
    expect(classifyLine("**Today at a glance**")).toBe("context");
    expect(classifyLine("Hi Darren —")).toBe("context");
    expect(classifyLine("What would you like to look at next?")).toBe("context");
    expect(classifyLine("")).toBe("context");
  });
});

describe("classifyEpistemics over a composed answer", () => {
  it("labels line-by-line, preserving order, and reports claims present", () => {
    const lines = classifyEpistemics([
      "**This week for Casey**",
      "5 daily log entries recorded, mood averaging 4.2.",
      "Casey said she does not want to go to the Monday session.",
      "Attendance is falling compared with last month.",
      "This may be connected to the change of tutor.",
      "PEP review is overdue — due 12 July.",
    ].join("\n"));
    expect(lines.map((l) => l.label)).toEqual([
      "context", "fact", "account", "analysis", "hypothesis", "action",
    ]);
    expect(hasClaims(lines)).toBe(true);
  });

  it("a pure greeting has no claims — the UI shows no badges", () => {
    const lines = classifyEpistemics("Hi there —\nWhat would you like to look at?");
    expect(hasClaims(lines)).toBe(false);
  });
});
