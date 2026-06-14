import { describe, it, expect } from "vitest";
import { analyseRecordingQuality, RECORD_TYPES, RECORDING_DISCLAIMER } from "../recording-assistant-engine";

const SPEC_RAW = "He kicked off after the phone call and refused to listen.";
const GOOD =
  "Following a phone call with his mother, the young person became emotionally distressed. " +
  "Staff observed raised voice and pacing. Staff reduced demands, offered reassurance and gave space to regulate. " +
  "He said he missed home. The duty manager was informed. Staff will follow up with a key-work session and consider the pattern around family contact.";

describe("analyseRecordingQuality", () => {
  it("flags the spec's worked example correctly", () => {
    const a = analyseRecordingQuality(SPEC_RAW);
    expect(a.judgemental_language_detected).toEqual(expect.arrayContaining(["kicked off", "refused to listen"]));
    expect(a.missing_context).toBe(false);            // "after the phone call" gives context
    expect(a.missing_child_voice).toBe(true);
    expect(a.missing_staff_response).toBe(true);
    expect(a.missing_deescalation).toBe(true);
    expect(a.missing_manager_notification).toBe(true);
    expect(a.guidance.join(" ")).toMatch(/factual description/i);
    expect(a.recommended_follow_up_actions.join(" ")).toMatch(/child's voice/i);
  });

  it("passes a complete, professional record with no flags", () => {
    const a = analyseRecordingQuality(GOOD);
    expect(a.judgemental_language_detected).toHaveLength(0);
    expect(a.flags).toHaveLength(0);
    expect(a.professional_language_score).toBe(100);
  });

  it("detects the full judgemental vocabulary from the spec", () => {
    const a = analyseRecordingQuality("He was attention seeking, manipulative, naughty, dramatic, rude, defiant and difficult — bad behaviour and lying as usual.");
    expect(a.judgemental_language_detected.length).toBeGreaterThanOrEqual(8);
  });

  it("flags 'aggressive' without description but not when described", () => {
    expect(analyseRecordingQuality("He was aggressive.").judgemental_language_detected.join(" ")).toMatch(/aggressive/);
    expect(analyseRecordingQuality("He was aggressive towards the door, observed kicking it twice.").judgemental_language_detected.join(" ")).not.toMatch(/aggressive/);
  });

  it("missing-element heuristics work independently", () => {
    const a = analyseRecordingQuality("Something happened.");
    expect(a.missing_context).toBe(true);
    expect(a.missing_child_voice).toBe(true);
    expect(a.missing_next_steps).toBe(true);
    const b = analyseRecordingQuality("After tea he said he was tired. Staff offered a quiet space and will follow up tomorrow. Manager informed. We will review the pattern.");
    expect(b.missing_context).toBe(false);
    expect(b.missing_child_voice).toBe(false);
    expect(b.missing_next_steps).toBe(false);
    expect(b.missing_manager_notification).toBe(false);
    expect(b.missing_learning).toBe(false);
  });

  it("is deterministic and exposes the spec record types + disclaimer", () => {
    expect(analyseRecordingQuality(SPEC_RAW)).toEqual(analyseRecordingQuality(SPEC_RAW));
    expect(RECORD_TYPES.map((r) => r.key)).toEqual(expect.arrayContaining(["daily_log", "incident_report", "physical_intervention", "handover", "other"]));
    expect(RECORDING_DISCLAIMER).toMatch(/never invents facts/);
  });
});
