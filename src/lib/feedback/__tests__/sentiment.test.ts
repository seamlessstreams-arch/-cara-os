import { describe, it, expect } from "vitest";
import { feedbackTypeFromSentiment } from "../sentiment";
import type { YPFeedbackSentiment } from "@/types/extended";

describe("feedbackTypeFromSentiment", () => {
  it("reads the happy end of the scale as praise", () => {
    expect(feedbackTypeFromSentiment("very_happy")).toBe("compliment");
    expect(feedbackTypeFromSentiment("happy")).toBe("compliment");
  });

  it("reads the unhappy end of the scale as a complaint", () => {
    expect(feedbackTypeFromSentiment("unhappy")).toBe("complaint");
    expect(feedbackTypeFromSentiment("very_unhappy")).toBe("complaint");
  });

  it("does not read a neutral answer as praise", () => {
    expect(feedbackTypeFromSentiment("ok")).toBe("suggestion");
  });

  it("treats an unrecorded sentiment as a suggestion", () => {
    expect(feedbackTypeFromSentiment(null)).toBe("suggestion");
    expect(feedbackTypeFromSentiment(undefined)).toBe("suggestion");
  });

  // The bug this replaced: two routes compared sentiment against "positive"
  // and "negative", which are not members of YPFeedbackSentiment, so every
  // entry fell through to "suggestion". Assert the scale is not collapsed.
  it("does not collapse the whole scale onto one type", () => {
    const scale: YPFeedbackSentiment[] = ["very_happy", "happy", "ok", "unhappy", "very_unhappy"];
    const types = new Set(scale.map(feedbackTypeFromSentiment));
    expect(types).toEqual(new Set(["compliment", "suggestion", "complaint"]));
  });

  // If a sixth point is ever added to the scale, this fails until someone
  // decides which side of the line it falls on rather than silently defaulting.
  it("classifies every member of the scale explicitly", () => {
    const scale: YPFeedbackSentiment[] = ["very_happy", "happy", "ok", "unhappy", "very_unhappy"];
    expect(scale).toHaveLength(5);
    expect(scale.map(feedbackTypeFromSentiment)).toEqual([
      "compliment", "compliment", "suggestion", "complaint", "complaint",
    ]);
  });
});
