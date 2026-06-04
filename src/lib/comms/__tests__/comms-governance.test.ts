import { describe, it, expect } from "vitest";
import {
  analyseMessageLanguage,
  detectRecordableContent,
  isValidRetentionCategory,
  ACTION_EVENT_MAP,
  CONVERSION_ACTIONS,
  RETENTION_CATEGORIES,
  MIN_WORDS_FOR_LANGUAGE_NUDGE,
} from "../comms-governance";
import type { CommsMessageActionType } from "@/types/comms";

describe("detectRecordableContent", () => {
  it("flags a safeguarding disclosure and suggests a safeguarding concern", () => {
    const r = detectRecordableContent("C disclosed that someone hurt them — possible allegation of abuse.");
    expect(r.recordable).toBe(true);
    expect(r.suggestedActions).toContain("safeguarding_concern");
    expect(r.signals[0].category).toBe("safeguarding");
  });

  it("flags a child missing from care", () => {
    const r = detectRecordableContent("J has gone missing and has not returned from school.");
    expect(r.recordable).toBe(true);
    expect(r.suggestedActions).toContain("incident_follow_up");
  });

  it("flags a medication error", () => {
    const r = detectRecordableContent("I think there was a missed dose this morning, possible medication error.");
    expect(r.recordable).toBe(true);
    expect(r.suggestedActions).toContain("medication_note");
  });

  it("does not flag benign operational chatter", () => {
    const r = detectRecordableContent("Running about 5 minutes late, kettle in the office is broken again.");
    expect(r.recordable).toBe(false);
    expect(r.signals).toHaveLength(0);
  });

  it("uses word boundaries — 'white' must not trip the 'hit' keyword", () => {
    const r = detectRecordableContent("The walls in the hallway are white and need a clean.");
    expect(r.recordable).toBe(false);
  });

  it("orders signals by concern (safeguarding before complaint)", () => {
    const r = detectRecordableContent("There was an allegation, and the parent made a complaint about it.");
    expect(r.signals[0].category).toBe("safeguarding");
    // complaint is lower weight, so it appears after safeguarding
    expect(r.suggestedActions.indexOf("safeguarding_concern")).toBeLessThan(
      r.suggestedActions.indexOf("management_oversight"),
    );
  });

  it("returns empty for blank input", () => {
    expect(detectRecordableContent("").recordable).toBe(false);
    expect(detectRecordableContent("   ").signals).toHaveLength(0);
  });

  it("is deterministic", () => {
    const text = "Possible self-harm noted, C had a bruise on their arm.";
    expect(detectRecordableContent(text)).toEqual(detectRecordableContent(text));
  });
});

describe("analyseMessageLanguage", () => {
  it("never nudges very short messages", () => {
    const a = analyseMessageLanguage("on my way");
    expect(a.shouldNudge).toBe(false);
    expect(a.suggestions).toHaveLength(0);
    expect(a.wordCount).toBeLessThan(MIN_WORDS_FOR_LANGUAGE_NUDGE);
  });

  it("scores a substantial message and returns a valid grade + arrays", () => {
    const a = analyseMessageLanguage(
      "he was really kicking off again today and was being a nightmare all afternoon honestly",
    );
    expect(a.wordCount).toBeGreaterThanOrEqual(MIN_WORDS_FOR_LANGUAGE_NUDGE);
    expect(["excellent", "good", "adequate", "needs_improvement", "insufficient"]).toContain(a.grade);
    expect(Array.isArray(a.suggestions)).toBe(true);
    expect(Array.isArray(a.strengths)).toBe(true);
    expect(typeof a.shouldNudge).toBe("boolean");
    expect(a.suggestions.length).toBeLessThanOrEqual(3);
  });

  it("does not throw on empty input", () => {
    expect(() => analyseMessageLanguage("")).not.toThrow();
    expect(analyseMessageLanguage("").shouldNudge).toBe(false);
  });
});

describe("ACTION_EVENT_MAP", () => {
  it("maps a task to no spine event (eventType null) and links as a task", () => {
    expect(ACTION_EVENT_MAP.task.eventType).toBeNull();
    expect(ACTION_EVENT_MAP.task.linkedRecordType).toBe("task");
  });

  it("maps a safeguarding concern to the safeguarding event type", () => {
    expect(ACTION_EVENT_MAP.safeguarding_concern.eventType).toBe("safeguarding");
    expect(ACTION_EVENT_MAP.safeguarding_concern.riskLevel).toBe("high");
  });

  it("covers every conversion action exactly once", () => {
    const keys = Object.keys(ACTION_EVENT_MAP) as CommsMessageActionType[];
    expect(new Set(CONVERSION_ACTIONS)).toEqual(new Set(keys));
    expect(CONVERSION_ACTIONS).toHaveLength(keys.length);
  });

  it("child-scoped records require a linked child", () => {
    expect(ACTION_EVENT_MAP.daily_log.requiresChild).toBe(true);
    expect(ACTION_EVENT_MAP.medication_note.requiresChild).toBe(true);
    expect(ACTION_EVENT_MAP.task.requiresChild).toBe(false);
    expect(ACTION_EVENT_MAP.management_oversight.requiresChild).toBe(false);
  });

  it("every CHILD_EVENT-typed action requires a child (matches the spine's validateDraft)", () => {
    // Mirror of CHILD_EVENTS in event-capture-engine.ts — these reject a draft
    // with no childId, so converting to them MUST require a child up-front.
    const CHILD_EVENTS = new Set([
      "daily_log", "incident", "safeguarding", "medication", "missing",
      "physical_intervention", "keywork", "education", "health", "family_contact", "complaint",
    ]);
    for (const [action, m] of Object.entries(ACTION_EVENT_MAP)) {
      if (m.eventType && CHILD_EVENTS.has(m.eventType)) {
        expect(m.requiresChild, `${action} → ${m.eventType} must requireChild`).toBe(true);
      }
    }
  });
});

describe("retention categories", () => {
  it("validates known keys and rejects unknown", () => {
    expect(isValidRetentionCategory("safeguarding")).toBe(true);
    expect(isValidRetentionCategory("investigation")).toBe(true);
    expect(isValidRetentionCategory("nonsense")).toBe(false);
  });

  it("always includes investigation + routine", () => {
    const keys = RETENTION_CATEGORIES.map((r) => r.key);
    expect(keys).toContain("investigation");
    expect(keys).toContain("routine_messages");
  });
});
