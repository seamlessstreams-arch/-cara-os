import { describe, expect, it } from "vitest";
import {
  ADVISORY_STATEMENT,
  buildStrategyExportModel,
  renderStrategyHtml,
  renderStrategyJson,
} from "../strategy-export";
import {
  SEVEN_THRESHOLD_QUESTIONS,
  STRATEGY_SECTION_ORDER,
  type StrategyDiscussionRequest,
} from "../types";

// Synthetic, self-contained request — never reads seed data, so it cannot rot
// when another feature enriches the demo children.
function buildRequest(overrides: Partial<StrategyDiscussionRequest> = {}): StrategyDiscussionRequest {
  return {
    id: "sdr_test_1",
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-02T10:00:00.000Z",
    createdBy: "Test Worker",
    childId: "yp_synthetic",
    childName: "Sam",
    sections: {
      headline_concern: "Sam disclosed an unsafe contact.",
      type_of_harm: "Potential exploitation.",
      evidence: "See separated evidence below.",
      child_impact: "Sam is frightened and withdrawn.",
      adult_response: "Key worker responded same day.",
      current_plan: "Safety plan v2 in place.",
      immediacy: "",
      purpose_of_strategy_discussion: "",
    },
    evidence: [
      { kind: "direct", text: "Sam's own words on 30 Jul.", sourceRecords: [{ recordType: "disclosure", recordId: "d1" } as never] },
      { kind: "pattern", text: "Third late return in 14 days.", sourceRecords: [] },
    ],
    professionalInterpretation: ["Pattern suggests grooming risk."],
    unknowns: ["Identity of the adult is unknown."],
    alternativeExplanations: ["Peer pressure without adult involvement."],
    urgency: "High — pattern accelerating.",
    thresholdAnswers: [
      {
        question: SEVEN_THRESHOLD_QUESTIONS[0],
        answer: "A direct disclosure plus a movement pattern.",
        answeredBy: "Test Manager",
        answeredAt: "2026-08-02T09:30:00.000Z",
      },
    ],
    status: "draft",
    sourceRecords: [{ recordType: "disclosure", recordId: "d1" } as never],
    auditTrail: [{ at: "2026-08-01T09:00:00.000Z", actor: "Test Worker", action: "created" }],
    ...overrides,
  };
}

describe("buildStrategyExportModel", () => {
  it("always emits all eight sections in canonical order, flagging the incomplete", () => {
    const model = buildStrategyExportModel(buildRequest(), "2026-08-06T12:00:00.000Z");
    expect(model.sections.map((s) => s.key)).toEqual([...STRATEGY_SECTION_ORDER]);
    expect(model.sections.filter((s) => s.completed)).toHaveLength(6);
    const immediacy = model.sections.find((s) => s.key === "immediacy");
    expect(immediacy?.text).toBe("Not yet completed.");
  });

  it("always emits all seven threshold questions, answered or explicitly not", () => {
    const model = buildStrategyExportModel(buildRequest());
    expect(model.thresholdQuestions).toHaveLength(SEVEN_THRESHOLD_QUESTIONS.length);
    expect(model.thresholdQuestions[0].answered).toBe(true);
    expect(model.thresholdQuestions[0].answeredBy).toBe("Test Manager");
    expect(model.thresholdQuestions[6].answered).toBe(false);
    expect(model.thresholdQuestions[6].answer).toBe("Not yet answered.");
  });

  it("separates evidence by kind — all four kinds present, empties included", () => {
    const model = buildStrategyExportModel(buildRequest());
    expect(model.evidence.map((e) => e.kind)).toEqual(["direct", "reported", "observed", "pattern"]);
    expect(model.evidence[0].items[0].sourceCount).toBe(1);
    expect(model.evidence[1].items).toHaveLength(0); // reported: none recorded
  });

  it("keeps interpretation, unknowns and alternatives apart from the evidence", () => {
    const model = buildStrategyExportModel(buildRequest());
    expect(model.professionalInterpretation).toEqual(["Pattern suggests grooming risk."]);
    expect(model.unknowns).toEqual(["Identity of the adult is unknown."]);
    expect(model.alternativeExplanations).toEqual(["Peer pressure without adult involvement."]);
  });

  it("states the absence of a manager decision — a draft is not a request", () => {
    const model = buildStrategyExportModel(buildRequest());
    expect(model.managerDecision.decided).toBe(false);
    expect(model.managerDecision.line).toContain("draft, not a request");
  });

  it("renders the manager decision as the named human's, when present", () => {
    const model = buildStrategyExportModel(
      buildRequest({
        status: "manager_approved",
        managerDecision: {
          decidedBy: "Test RM",
          decidedByRole: "Registered Manager",
          decidedAt: "2026-08-03T08:00:00.000Z",
          requestDiscussion: true,
          reasoning: "Threshold met on the disclosure alone.",
        },
      }),
    );
    expect(model.managerDecision.decided).toBe(true);
    expect(model.managerDecision.line).toContain("REQUESTED");
    expect(model.managerDecision.line).toContain("Test RM");
    expect(model.managerDecision.reasoning).toContain("disclosure");
  });

  it("carries the advisory statement on every export surface", () => {
    const model = buildStrategyExportModel(buildRequest());
    expect(model.advisoryStatement).toBe(ADVISORY_STATEMENT);
    expect(renderStrategyHtml(model)).toContain(ADVISORY_STATEMENT.slice(0, 40));
    expect(JSON.parse(renderStrategyJson(model)).advisoryStatement).toBe(ADVISORY_STATEMENT);
  });

  it("escapes HTML in user-authored content", () => {
    const model = buildStrategyExportModel(
      buildRequest({ sections: { ...buildRequest().sections, headline_concern: `<script>alert("x")</script>` } }),
    );
    const html = renderStrategyHtml(model);
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
  });
});
