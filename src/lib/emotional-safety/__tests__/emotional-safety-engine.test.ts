import { describe, it, expect } from "vitest";
import {
  buildEmotionalSafetyAnalysis,
  type EmotionalSafetyInput,
} from "../emotional-safety-engine";

const NOW = "2026-06-22T12:00:00.000Z";

function baseInput(over: Partial<EmotionalSafetyInput> = {}): EmotionalSafetyInput {
  return {
    childId: "child-alex",
    childName: "Alex",
    now: NOW,
    behaviourLog: [],
    incidents: [],
    keyWorkingSessions: [],
    knownTriggers: [],
    calmingApproaches: [],
    ...over,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const b = (o: any) => o;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const inc = (o: any) => o;

describe("buildEmotionalSafetyAnalysis", () => {
  it("aggregates triggers from behaviour log + PACE and ranks them", () => {
    const a = buildEmotionalSafetyAnalysis(
      baseInput({
        knownTriggers: ["Loud noise"],
        behaviourLog: [
          b({ id: "1", child_id: "child-alex", date: "2026-06-20", time: "15:00", direction: "concern", intensity: "moderate", trigger: "Loud noise", strategy_used: "", outcome: "" }),
          b({ id: "2", child_id: "child-alex", date: "2026-06-19", time: "15:30", direction: "concern", intensity: "low", trigger: "Loud noise", strategy_used: "", outcome: "" }),
          b({ id: "3", child_id: "child-alex", date: "2026-06-18", time: "16:00", direction: "concern", intensity: "low", trigger: "Transition", strategy_used: "", outcome: "" }),
        ],
      }),
    );
    expect(a.triggers[0].label).toBe("Loud noise");
    expect(a.triggers[0].count).toBe(3); // 1 from PACE + 2 from behaviour
    expect(a.triggers[0].fromPace).toBe(true);
  });

  it("credits a strategy only when the episode ended regulated", () => {
    const a = buildEmotionalSafetyAnalysis(
      baseInput({
        behaviourLog: [
          b({ id: "1", child_id: "child-alex", date: "2026-06-20", time: "15:00", direction: "concern", intensity: "moderate", trigger: "x", strategy_used: "Quiet space", outcome: "Child settled and calm" }),
          b({ id: "2", child_id: "child-alex", date: "2026-06-19", time: "15:00", direction: "concern", intensity: "high", trigger: "x", strategy_used: "Quiet space", outcome: "Continued to escalate" }),
        ],
      }),
    );
    const help = a.whatHelps.find((h) => h.label === "Quiet space");
    expect(help?.count).toBe(1); // only the one that ended regulated
  });

  it("detects a RISING escalation trend and rates CONCERN", () => {
    const a = buildEmotionalSafetyAnalysis(
      baseInput({
        behaviourLog: [
          b({ id: "1", child_id: "child-alex", date: "2026-06-20", time: "20:00", direction: "concern", intensity: "moderate", trigger: "t", strategy_used: "", outcome: "" }),
          b({ id: "2", child_id: "child-alex", date: "2026-06-15", time: "20:00", direction: "concern", intensity: "moderate", trigger: "t", strategy_used: "", outcome: "" }),
          b({ id: "3", child_id: "child-alex", date: "2026-06-10", time: "20:00", direction: "concern", intensity: "low", trigger: "t", strategy_used: "", outcome: "" }),
        ],
        // prior 30d: nothing → recent (3) > prior (0)
      }),
    );
    expect(a.escalation.trend).toBe("rising");
    expect(a.status).toBe("concern");
    expect(a.escalation.peakTime).toBe("evening");
  });

  it("rates SECURE when there is no escalation", () => {
    const a = buildEmotionalSafetyAnalysis(
      baseInput({
        keyWorkingSessions: [{ child_id: "child-alex", mood_before: 3, mood_after: 4 }],
      }),
    );
    expect(a.status).toBe("secure");
    expect(a.recovery.moodImproved).toBe(1);
    expect(a.recovery.moodMeasured).toBe(1);
  });

  it("flags a GAP when escalation has no strategy recorded", () => {
    const a = buildEmotionalSafetyAnalysis(
      baseInput({
        behaviourLog: [
          b({ id: "1", child_id: "child-alex", date: "2026-06-20", time: "10:00", direction: "concern", intensity: "moderate", trigger: "t", strategy_used: "", outcome: "" }),
        ],
      }),
    );
    expect(a.insights.some((i) => i.key === "no-strategy" && i.tone === "gap")).toBe(true);
  });

  it("only analyses the requested child and is deterministic", () => {
    const input = baseInput({
      behaviourLog: [
        b({ id: "1", child_id: "child-alex", date: "2026-06-20", time: "15:00", direction: "concern", intensity: "high", trigger: "Noise", strategy_used: "Walk", outcome: "calm" }),
        b({ id: "2", child_id: "child-jordan", date: "2026-06-20", time: "15:00", direction: "concern", intensity: "high", trigger: "Noise", strategy_used: "", outcome: "" }),
      ],
    });
    const a = buildEmotionalSafetyAnalysis(input);
    expect(a.escalation.concernCount).toBe(1);
    expect(buildEmotionalSafetyAnalysis(input)).toEqual(a);
  });
});
