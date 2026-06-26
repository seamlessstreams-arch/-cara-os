import { describe, it, expect } from "vitest";
import {
  SAFEGUARDING_SIGNALS,
  getSafeguardingSignal,
  detectSafeguardingSignals,
  activeSafeguardingSignals,
  highestActiveUrgency,
  type SafeguardingSignalId,
} from "../safeguarding-signals";

function ids(text: string): SafeguardingSignalId[] {
  return detectSafeguardingSignals(text).map((s) => s.id);
}

describe("SAFEGUARDING_SIGNALS registry", () => {
  it("every signal is fully specified (the canonical contract)", () => {
    for (const s of SAFEGUARDING_SIGNALS) {
      expect(s.id).toBeTruthy();
      expect(s.label).toBeTruthy();
      expect(s.whyItMatters.length).toBeGreaterThan(10);
      expect(s.requiredRole).toBeTruthy();
      expect(s.statutoryTrigger).toBeTruthy();
      expect(["immediate", "same_day", "standard"]).toContain(s.urgency);
      expect(s.requiredAction.length).toBeGreaterThan(10);
      expect(s.pattern).toBeInstanceOf(RegExp);
    }
  });

  it("ids are unique", () => {
    const set = new Set(SAFEGUARDING_SIGNALS.map((s) => s.id));
    expect(set.size).toBe(SAFEGUARDING_SIGNALS.length);
  });

  it("getSafeguardingSignal resolves by id", () => {
    expect(getSafeguardingSignal("self_harm").label).toMatch(/self-harm/i);
  });
});

describe("detectSafeguardingSignals — detection", () => {
  it("detects the core signals from representative text", () => {
    expect(ids("Staff observed fresh self-harm marks on the child's arm.")).toContain("self_harm");
    expect(ids("Concerns about CSE and grooming were raised by school.")).toContain("sexual_harm_exploitation");
    expect(ids("He went missing from care overnight; police informed.")).toContain("missing_from_care");
    expect(ids("An allegation against a staff member was made; LADO informed.")).toContain("allegation_against_staff");
    expect(ids("There was a medication error — the wrong dose was given.")).toContain("medication_error");
    expect(ids("A prone restraint / RPI was used during the incident.")).toContain("restrictive_practice");
    expect(ids("Evidence of county lines and criminal exploitation.")).toContain("contextual_exploitation");
    expect(ids("Staff found a knife in the bedroom.")).toContain("weapon");
    expect(ids("Concerns about radicalisation; Prevent duty considered.")).toContain("radicalisation");
  });

  it("catches bare 'exploitation' (the gap in the old guardrails pattern)", () => {
    expect(ids("Ongoing concerns about exploitation in the community.")).toContain("contextual_exploitation");
  });

  it("respects word boundaries (no substring false positives)", () => {
    expect(ids("The selfless young person helped tidy up.")).not.toContain("self_harm");
    expect(ids("She is a gunner in the netball team.")).not.toContain("weapon");
  });

  it("empty / clean text yields nothing", () => {
    expect(detectSafeguardingSignals("")).toEqual([]);
    expect(detectSafeguardingSignals("The young person had a settled, happy day at school.")).toEqual([]);
  });
});

describe("detectSafeguardingSignals — negation (safeguarding-safe)", () => {
  it("annotates a negated match but does NOT hide it", () => {
    const res = detectSafeguardingSignals("There was no evidence of self-harm during the shift.");
    const sh = res.find((s) => s.id === "self_harm");
    expect(sh).toBeDefined();
    expect(sh?.negated).toBe(true);
  });

  it("a real concern is not marked negated", () => {
    const res = detectSafeguardingSignals("The child disclosed self-harm last night.");
    expect(res.find((s) => s.id === "self_harm")?.negated).toBe(false);
  });

  it("activeSafeguardingSignals filters out negated mentions", () => {
    const text = "No concerns of exploitation, but the child disclosed self-harm.";
    const active = activeSafeguardingSignals(text).map((s) => s.id);
    expect(active).toContain("self_harm");
    expect(active).not.toContain("contextual_exploitation");
  });
});

describe("detectSafeguardingSignals — ordering + urgency", () => {
  it("sorts most-urgent first, active before negated", () => {
    const text = "A weapon was found. There was also a medication error earlier.";
    const res = detectSafeguardingSignals(text);
    expect(res[0].id).toBe("weapon"); // immediate before same_day
    expect(res[0].urgency).toBe("immediate");
  });

  it("highestActiveUrgency reflects the worst active signal", () => {
    expect(highestActiveUrgency("Staff found a knife.")).toBe("immediate");
    expect(highestActiveUrgency("There was a medication error.")).toBe("same_day");
    expect(highestActiveUrgency("A calm, settled day.")).toBeNull();
    // negated-only → no active urgency
    expect(highestActiveUrgency("No evidence of self-harm.")).toBeNull();
  });
});
