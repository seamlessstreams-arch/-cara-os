// ══════════════════════════════════════════════════════════════════════════════
// childVoiceCheck ignored two thirds of its own declared cue lexicon.
//
// The file declares CHILD_VOICE_CUES with twelve cues — said, told, stated,
// shared, asked, wanted, felt, showed, their words, you said, explained that
// they, let us know — and its sibling ADULT_ACTION_CUES is consumed properly.
// The child-voice check tested a hardcoded four-item subset instead:
//
//   hasAny(hay, ["said", "told", "stated", "shared"])
//
// So a record reading "Alex wanted to go to the park" or "Alex felt worried
// about contact" scored as though the child's voice were absent, and the
// practitioner was told "The child's voice is hard to find" about a record that
// carried it. On a tool whose whole purpose is keeping a child visible in their
// own record, the eight missing cues are the softer, more common ones.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { reviewWritingToChild } from "../writing-to-child-engine";
import type { WritingToChildInput } from "../types";

function record(rawText: string): WritingToChildInput {
  return { recordType: "daily_log", rawText };
}

/** The eight cues the check used to miss, each in a plausible sentence. */
const MISSED_CUES: [string, string][] = [
  ["asked", "Alex asked whether contact would still happen on Saturday."],
  ["wanted", "Alex wanted to walk to the shop instead of taking the car."],
  ["felt", "Alex felt worried about the review meeting next week."],
  ["showed", "Alex showed us the drawing they had made about home."],
  ["their words", "In their words, the day had been \"alright, mostly\"."],
  ["you said", "Earlier you said you would rather talk after tea."],
  ["explained that they", "Alex explained that they did not want to go back yet."],
  ["let us know", "Alex let us know they were tired before the activity."],
];

describe("child voice check uses its declared lexicon", () => {
  const voiceless = reviewWritingToChild(
    record("The placement continued. Paperwork was completed and filed."),
  );

  it("scores a record with no voice cue as voice-absent", () => {
    expect(
      voiceless.childVoiceCheck.feedback.join(" "),
    ).toContain("hard to find");
  });

  it.each(MISSED_CUES)("credits the child's voice for %s", (_cue, text) => {
    const scored = reviewWritingToChild(record(text));

    expect(scored.childVoiceCheck.score).toBeGreaterThan(
      voiceless.childVoiceCheck.score,
    );
    expect(
      scored.childVoiceCheck.feedback.join(" "),
    ).not.toContain("hard to find");
  });

  it("still credits the four cues that always worked", () => {
    for (const text of [
      "Alex said the day had gone well.",
      "Alex told staff about the phone call.",
      "Alex stated they were happy with the plan.",
      "Alex shared how the visit had felt.",
    ]) {
      expect(
        reviewWritingToChild(record(text)).childVoiceCheck.score,
      ).toBeGreaterThan(voiceless.childVoiceCheck.score);
    }
  });
});
