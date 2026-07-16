import { describe, it, expect } from "vitest";
import {
  computeVoiceFollowThrough,
  validateTransition,
  type VoiceConcernLoop,
} from "../voice-follow-through-engine";

// The loop's contract (§5.2 + Scenario J):
//   - a concern raised repeatedly with no visible response surfaces as a
//     manager prompt with the raise-dates as evidence — never an allegation;
//   - "done" means the child was told AND asked whether it helped;
//   - the write path may only move one stage forward, and the two
//     child-facing stages demand their evidence note.

const NOW = new Date("2026-07-16T12:00:00Z");

let n = 0;
function loop(over: Partial<VoiceConcernLoop>): VoiceConcernLoop {
  n += 1;
  return {
    id: `vloop_${n}`,
    child_id: "yp_test",
    home_id: "home_test",
    concern: "I don't like people coming into my room without knocking",
    raised_via: "key work",
    raised_dates: ["2026-07-01"],
    stage: "listened",
    stage_changed_at: "2026-07-01T00:00:00Z",
    owner_id: null,
    agreed_action: "",
    task_id: null,
    explain_back_note: "",
    explained_at: null,
    review_with_child_note: "",
    reviewed_at: null,
    created_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
    created_by: "staff_test",
    updated_by: "staff_test",
    ...over,
  };
}

describe("Scenario J — voice without response", () => {
  it("fires when the same concern is raised twice and nothing has been explained back", () => {
    const r = computeVoiceFollowThrough(
      [loop({ raised_dates: ["2026-06-20", "2026-07-10"], stage: "considered" })],
      NOW,
    );
    const d = r.detections.find((x) => x.key === "voice_without_response");
    expect(d).toBeTruthy();
    expect(d!.evidence.raisedDates).toHaveLength(2);
    expect(d!.whyShown).toMatch(/does not allege fault/i);
  });

  it("does not fire once the child has been told, even if raised twice", () => {
    const r = computeVoiceFollowThrough(
      [loop({
        raised_dates: ["2026-06-20", "2026-07-01"],
        stage: "explained_back",
        explained_at: "2026-07-12T00:00:00Z",
        explain_back_note: "Told them the knock-first agreement is now on the staff board",
        stage_changed_at: "2026-07-12T00:00:00Z",
      })],
      NOW,
    );
    expect(r.detections.find((x) => x.key === "voice_without_response")).toBeUndefined();
  });

  it("does not fire for a single raise — one mention is a concern, not a pattern of silence", () => {
    const r = computeVoiceFollowThrough([loop({ stage: "considered", stage_changed_at: "2026-07-10T00:00:00Z" })], NOW);
    expect(r.detections.find((x) => x.key === "voice_without_response")).toBeUndefined();
  });
});

describe("loop-shape prompts", () => {
  it("flags an agreed action without an owner", () => {
    const r = computeVoiceFollowThrough(
      [loop({ stage: "action_agreed", agreed_action: "Knock-first agreement", owner_id: null })],
      NOW,
    );
    expect(r.detections.some((x) => x.key === "no_owner")).toBe(true);
  });

  it("flags explain-back overdue after 14 days of acting", () => {
    const r = computeVoiceFollowThrough(
      [loop({ stage: "acting", stage_changed_at: "2026-06-25T00:00:00Z", owner_id: "staff_a" })],
      NOW,
    );
    const d = r.detections.find((x) => x.key === "explain_back_overdue");
    expect(d?.whyShown).toMatch(/indistinguishable from being ignored/i);
  });

  it("flags explained-but-never-reviewed", () => {
    const r = computeVoiceFollowThrough(
      [loop({
        stage: "explained_back",
        explained_at: "2026-06-25T00:00:00Z",
        explain_back_note: "told",
        stage_changed_at: "2026-06-25T00:00:00Z",
      })],
      NOW,
    );
    expect(r.detections.some((x) => x.key === "review_with_child_missing")).toBe(true);
  });

  it("names a fully-closed loop as a positive", () => {
    const r = computeVoiceFollowThrough(
      [loop({
        stage: "closed",
        explained_at: "2026-07-01T00:00:00Z",
        reviewed_at: "2026-07-08T00:00:00Z",
        stage_changed_at: "2026-07-08T00:00:00Z",
      })],
      NOW,
    );
    const d = r.detections.find((x) => x.key === "loop_closed_well");
    expect(d?.tone).toBe("positive");
  });
});

describe("transition guard — the write path's contract", () => {
  it("only moves one stage forward", () => {
    expect(validateTransition(loop({ stage: "listened" }), "considered", {})).toMatch(/one stage at a time/i);
    expect(validateTransition(loop({ stage: "listened" }), "safeguarding_checked", {})).toBeNull();
  });

  it("action_agreed requires an owner and the agreed action", () => {
    const l = loop({ stage: "considered" });
    expect(validateTransition(l, "action_agreed", {})).toMatch(/named owner/i);
    expect(validateTransition(l, "action_agreed", { owner_id: "staff_a" })).toMatch(/what was agreed/i);
    expect(validateTransition(l, "action_agreed", { owner_id: "staff_a", agreed_action: "Knock first" })).toBeNull();
  });

  it("the child-facing stages demand their evidence note", () => {
    expect(validateTransition(loop({ stage: "acting" }), "explained_back", {})).toMatch(/what the child was told/i);
    expect(
      validateTransition(loop({ stage: "explained_back", explain_back_note: "told" }), "reviewed_with_child", {}),
    ).toMatch(/whether it helped/i);
  });
});
