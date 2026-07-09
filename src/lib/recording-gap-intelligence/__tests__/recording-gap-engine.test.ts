import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import {
  buildRecordingGapIntelligence,
  type RecordingGapData,
} from "../recording-gap-engine";

describe("buildRecordingGapIntelligence", () => {
  it("returns a summary and a childProfiles array over the live store", () => {
    const result: RecordingGapData = buildRecordingGapIntelligence(getStore());

    expect(result.summary).toBeDefined();
    expect(typeof result.summary.totalCurrentChildren).toBe("number");
    expect(Array.isArray(result.childProfiles)).toBe(true);
  });
});
