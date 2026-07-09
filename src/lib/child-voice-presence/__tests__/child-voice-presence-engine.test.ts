import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import {
  buildChildVoicePresence,
  type ChildVoicePresenceData,
} from "../child-voice-presence-engine";

describe("buildChildVoicePresence", () => {
  it("builds a child-voice-presence projection over the store", () => {
    const result: ChildVoicePresenceData = buildChildVoicePresence(getStore());

    expect(result.summary).toBeDefined();
    expect(Array.isArray(result.childProfiles)).toBe(true);
    expect(Array.isArray(result.typeStats)).toBe(true);
  });
});
