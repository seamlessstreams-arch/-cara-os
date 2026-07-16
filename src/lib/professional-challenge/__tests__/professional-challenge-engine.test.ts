import { describe, it, expect } from "vitest";
import {
  summariseProfessionalChallenges,
  validateClose,
  nextRung,
  CHALLENGE_LADDER,
  type ProfessionalChallenge,
} from "../professional-challenge-engine";

// The engine's contract (§5.15 / doctrine 1.11 + Scenario C):
//   - the measure of success is the CHILD's situation improving, not the
//     challenge being sent — a "resolved, no change" close is an alert;
//   - the ladder escalates when a rung stalls;
//   - the discipline is a written trail of every communication;
//   - a challenge succeeds only when the child is better off.

const NOW = new Date("2026-07-16T12:00:00Z");

let n = 0;
function challenge(over: Partial<ProfessionalChallenge> = {}): ProfessionalChallenge {
  n += 1;
  return {
    id: `chal_${n}`,
    child_id: "yp_test",
    home_id: "home_test",
    decision_challenged: "Social care declined the S47 referral",
    decision_maker_name: "A. Smith",
    decision_maker_role: "Team Manager",
    agency: "Children's Social Care",
    decision_date: "2026-06-01",
    reason: "The decision does not appear to protect the child from the identified risk.",
    evidence: "Three linked missing episodes and a peer-exploitation concern.",
    threshold_basis: "LA thresholds document, section 3 (significant harm).",
    current_risk: "Ongoing exploitation risk.",
    desired_resolution: "Strategy discussion convened.",
    current_rung: "professional",
    communications: [],
    next_action_due: null,
    status: "open",
    child_situation_outcome: "",
    closed_at: null,
    management_review: "",
    created_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
    created_by: "staff_rm",
    updated_by: "staff_rm",
    ...over,
  };
}

describe("the ladder", () => {
  it("returns the next rung, and null at the top", () => {
    expect(nextRung("professional")).toBe("their_manager");
    expect(nextRung("helpline")).toBeNull();
    expect(CHALLENGE_LADDER[0]).toBe("professional");
  });
});

describe("the measure of success is the child, not the challenge", () => {
  it("flags a challenge closed as answered while the child's situation did not change", () => {
    const s = summariseProfessionalChallenges([challenge({ status: "resolved_no_change" })], NOW);
    const d = s.detections.find((x) => x.key === "resolved_but_child_no_better");
    expect(d).toBeTruthy();
    expect(d!.whyShown).toMatch(/not the challenge being made/i);
    expect(d!.tone).toBe("prompt");
  });

  it("celebrates a challenge only when the child is actually better off", () => {
    const s = summariseProfessionalChallenges(
      [challenge({ status: "resolved_child_improved", child_situation_outcome: "Strategy meeting held; child now on a CP plan." })],
      NOW,
    );
    const d = s.detections.find((x) => x.key === "resolved_child_improved");
    expect(d?.tone).toBe("positive");
    expect(d?.whyShown).toMatch(/child now on a CP plan/i);
  });
});

describe("time-sensitivity and escalation", () => {
  it("flags an overdue response and suggests the next rung", () => {
    const s = summariseProfessionalChallenges(
      [challenge({ next_action_due: "2026-07-05", current_rung: "their_manager" })],
      NOW,
    );
    const d = s.detections.find((x) => x.key === "response_overdue");
    expect(d?.suggestedNextRung).toBe("joint_challenge");
    expect(d?.whyShown).toMatch(/does not stop at the front door/i);
  });

  it("suggests escalating further when a rung stalls past the threshold", () => {
    const s = summariseProfessionalChallenges(
      [challenge({ current_rung: "professional", created_at: "2026-06-20T00:00:00Z" })],
      NOW,
    );
    const d = s.detections.find((x) => x.key === "stalled_escalate_further");
    expect(d?.suggestedNextRung).toBe("their_manager");
  });

  it("does not fire the stall prompt while a response is not yet overdue", () => {
    const s = summariseProfessionalChallenges(
      [challenge({ current_rung: "professional", created_at: "2026-07-14T00:00:00Z" })],
      NOW,
    );
    expect(s.detections.some((x) => x.key === "stalled_escalate_further")).toBe(false);
  });
});

describe("the discipline of the challenge", () => {
  it("flags communications with no written follow-up", () => {
    const s = summariseProfessionalChallenges(
      [challenge({
        communications: [
          { id: "c1", at: "2026-07-02", rung: "professional", person_name: "A. Smith", person_role: "TM", agency: "CSC", method: "call", summary: "Verbal challenge", written_followup: false },
        ],
      })],
      NOW,
    );
    const d = s.detections.find((x) => x.key === "communication_not_in_writing");
    expect(d?.headline).toMatch(/not yet followed up in writing/i);
  });

  it("does not flag when every communication has a written trail", () => {
    const s = summariseProfessionalChallenges(
      [challenge({
        communications: [
          { id: "c1", at: "2026-07-02", rung: "professional", person_name: "A. Smith", person_role: "TM", agency: "CSC", method: "email", summary: "Written challenge", written_followup: true },
        ],
      })],
      NOW,
    );
    expect(s.detections.some((x) => x.key === "communication_not_in_writing")).toBe(false);
  });
});

describe("validateClose", () => {
  it("requires a child-situation outcome to close as improved", () => {
    expect(validateClose("resolved_child_improved", "")).toMatch(/what actually changed for the child/i);
    expect(validateClose("resolved_child_improved", "Now on a CP plan")).toBeNull();
  });

  it("allows closing as no-change or withdrawn without an outcome", () => {
    expect(validateClose("resolved_no_change", "")).toBeNull();
    expect(validateClose("withdrawn", "")).toBeNull();
  });
});
